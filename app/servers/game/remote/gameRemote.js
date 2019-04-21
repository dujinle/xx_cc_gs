/**
 * Created by wuningjian on 2/23/16.
 */
var gameDao   = require('../../../dao/gameDao');
var playerDao = require('../../../dao/playerDao');
var pomelo    = require('pomelo');
var gameLogicRemote = require('./gameLogicRemote');
var async     = require('async');


module.exports = function(app) {
    return new gameRemote(app);
};

var gameRemote = function(app) {
    this.app = app;
	this.cache = app.get('cache');
    this.channelService = app.get('channelService');
};

gameRemote.prototype.enter_room = function(uid, sid, channel_id, location,cb) {
/*{{{*/
	console.log("gameRemote.enter_room......uid:" + uid + " sid:" + sid + " channel_id:" + channel_id + " location:" + location);
	var channel = this.channelService.getChannel(channel_id, true);
	var channelService = this.channelService;
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;

	if( !! channel) {
		channel.add(uid, sid);
		gameDao.get_room_by_room_id(rid,function(err,res){
			playerDao.get_player_by_id(username,function(err,player){
				//如果是房主进入房间则直接进入不用消费房卡，因为建房时已经消费
				//判断玩家是否有金币和房卡 不够不允许进入游戏
				if(res.game_type == 1){
					//抢庄 庄家消费所有玩家的房卡
					if(location == 1 && player.fangka_num < res.player_num){
						cb({'code':201,'msg':'房卡不够用无法进入游戏，请充值房卡！'});
						return;
					}
					if(player.gold <= 0){
						cb({'code':201,'msg':'没有金币无法进入游戏，请充值金币！'});
						return;
					}
				}else if(res.game_type == 2){
					//随机庄 每人消费一张房卡
					if(player.fangka_num < 1){
						cb({'code':201,'msg':'房卡不够用无法进入游戏，请充值房卡！'});
						return;
					}
					if(player.gold <= 0){
						cb({'code':201,'msg':'没有金币无法进入游戏，请充值金币！'});
						return;
					}
				}else if(res.game_type == 3){
					//转庄 每人消费一张房卡
					if(player.fangka_num < 1){
						cb({'code':201,'msg':'房卡不够用无法进入游戏，请充值房卡！'});
						return;
					}
					if(player.gold <= 0){
						cb({'code':201,'msg':'没有金币无法进入游戏，请充值金币！'});
						return;
					}
				}
				gameDao.add_player(rid,uid,location,function(err,res){
					var param = {
						route: 'onEnterRoom',
						player: player,
						location:location  //同时分配位置
					};
					channel.pushMessage(param);
				});
				cb({'code':200,'msg':'进入游戏房间！','fangka_num': player.fangka_num});
			});
		});
	}else{
		cb({'code':202,'msg':'没有找到房间信道！'});
	}
/*}}}*/
};
//uuid 发送的请求id
gameRemote.prototype.repair_enter_room = function(uid,uuid, sid, channel_id, flag,cb) {
	/*{{{*/
	console.log("gameRemote.repair_enter_room......uid:" + uid + " sid:" + sid + " channel_id:" + channel_id);
	var channel = this.channelService.getChannel(channel_id, flag);
	var channelService = this.channelService;
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;

	if( !! channel) {
		channel.add(uid, sid);
		gameDao.get_room_by_room_id(rid,function(err,room_info){
			var location = -1;
			for(var i = 1;i <= 4;i++){
				if(room_info['location' + i] == uid){
					location = i;
					break;
				}
			}
			if(location != -1){
				gameDao.add_player(rid,uid,location,function(err,res){
					var param = {
						route: 'onRepairEnterRoom',
						location:location  //同时分配位置
					};
					channel.pushMessage(param);
					//更新一下玩家的网络状态
					var cacheData = self.cache.get(rid);
					console.log('onRepairEnterRoom',cacheData);
					var send_flag = false;
					for(var i = 0;i < cacheData.channelMsg.length;i++){
						var msg = cacheData.channelMsg[i];
						if(uuid == null){
							send_flag = true;
						}else if(msg.uuid == uuid){
							send_flag = true;
							continue;
						}
						if(send_flag == true){
							channelService.pushMessageByUids(msg.route,msg,[{'uid':uid,'sid':sid}]);
						}
					}
					if(cacheData.connect != null){
						cacheData.connect.type = 'Connect';
						clearTimeout(cacheData.connect.func);
						self.cache.put(rid,cacheData);
					}
				});
			}
		});
		cb({'code':200,'msg':'进入游戏房间！'});
	}else{
		cb({'code':202,'msg':'没有找到房间信道！'});
	}
/*}}}*/
};
/*退出放间 只能是在游戏没有开始前或者游戏结束后 可以执行*/
gameRemote.prototype.leave_room = function(uid, sid, channel_id,flag,location,cb) {
/*{{{*/
	console.log("gameRemote.leave_room......uid:" + uid + " sid:" + sid + " channel_id:" + channel_id);
	var channel = this.channelService.getChannel(channel_id, flag);
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;
	var players = new Array();
	if( !! channel) {
		gameDao.leave_room(rid,uid,function(err,res){
			var param = {
				route: 'onLeaveRoom',
				location:location,
				player_id:username,
				data:res
			};
			channel.pushMessage(param);
		});
		var users_ext = channel.getMembers();
		for(var i = 0; i < users_ext.length;i++){
			if(users_ext[i] == uid){
				var abc = channel.leave(users_ext[i], sid);
				players.push(users_ext[i]);
				console.log("remove from channel uid:" + uid + " abc:" + abc);
				break;
			}
		}
		cb(players);
	}else{
		cb(players);
	}
/*}}}*/
};

gameRemote.prototype.start_game = function(rid, sid, channel_id,flag,cb) {
/*{{{*/
	console.log("gameRemote.start_room......rid:" + rid + " sid:" + sid + " channel_id:" + channel_id);
	var channel = this.channelService.getChannel(channel_id, flag);
	var channelService = this.channelService;
	var self = this;

	if( !! channel) {
		gameDao.start_game(rid,function(err,res){
			gameDao.get_room_by_room_id(rid,function(err,room_info){
				if(room_info.game_type == 1){
					gameDao.set_zhuang_location(rid,1,function(err,ret){});
				}
				var users = channel.getMembers();
				for(var i = 0; i < users.length; i++) {
					users[i] = users[i].split('*')[0];
				}
				async.parallel([
					function(callback){
						if(users[0]!=null){
							playerDao.get_player_by_id(users[0],function(err,res){
								gameDao.get_player_local(rid,users[0],function(err,location){
									if(room_info.game_type == 1 && location == 1){
										playerDao.sub_fangka(users[0],users.length,function(err,pret){
										})
									}else if(room_info.game_type != 1){
										playerDao.sub_fangka(users[0],1,function(err,pret){
										});
									}
									res['location'] = location;
									callback(null, res);
								});
							});
						}else{
							callback(null,'null');
						}
					},
					function(callback){
						if(users[1]!=null){
							playerDao.get_player_by_id(users[1],function(err,res){
								gameDao.get_player_local(rid,users[1],function(err,location){
									if(room_info.game_type == 1 && location == 1){
										playerDao.sub_fangka(users[0],users.length,function(err,pret){
										})
									}else if(room_info.game_type != 1){
										playerDao.sub_fangka(users[0],1,function(err,pret){
										});
									}
									res['location'] = location;
									callback(null, res);
								});
							});
						}else{
							callback(null,'null');
						}
					},
					function(callback){
						if(users[2]!=null){
							playerDao.get_player_by_id(users[2],function(err,res){
								gameDao.get_player_local(rid,users[2],function(err,location){
									if(room_info.game_type == 1 && location == 1){
										playerDao.sub_fangka(users[0],users.length,function(err,pret){
										})
									}else if(room_info.game_type != 1){
										playerDao.sub_fangka(users[0],1,function(err,pret){
										});
									}
									res['location'] = location;
									callback(null, res);
								});
							});
						}else{
							callback(null,'null');
						}
					},
					function(callback){
						if(users[3]!=null){
							playerDao.get_player_by_id(users[3],function(err,res){
								gameDao.get_player_local(rid,users[3],function(err,location){
									if(room_info.game_type == 1 && location == 1){
										playerDao.sub_fangka(users[0],users.length,function(err,pret){
										})
									}else if(room_info.game_type != 1){
										playerDao.sub_fangka(users[0],1,function(err,pret){
										});
									}
									res['location'] = location;
									callback(null, res);
								});
							});
						}else{
							callback(null,'null');
						}
					}
				],
				function(err, results){
					var param = {
						route: 'onStartGame',
						players: results
					};
					channel.pushMessage(param);
					var cacheData = {
						'channelMsg':[],
						'paixing':null,
						'connect':null
					};
					self.cache.put(rid,cacheData);
				});
			});
		});
	}
	cb();
/*}}}*/
};

/**
 * 用户离开房间，剔除用户
 * */
gameRemote.prototype.kick = function(uid, sid, channel_id,cb) {
	console.log('gameRemote.prototype.kick.........');
	var self = this;
	var channel = this.channelService.getChannel(channel_id, false);
	// leave channel
	var rid = uid.split('*')[1];
	var username = uid.split('*')[0];
	console.log("--------uid:"+uid);
	console.log("--------sid:"+sid);
	if( !! channel) {
		var users_ext = channel.getMembers();
		console.log("------------users_ext:"+users_ext);
		var abc = channel.leave(uid, sid);
		console.log("------------leave status:"+abc);
		var users = channel.getMembers();
		console.log("------------users:"+users);
		//再次确认是否已经断开网络，如果不是则 消除当前的断网信息
		var cacheData = self.cache.get(rid);
		if(cacheData != null && cacheData.connect && cacheData.connect.type == 'Connect'){
			return;
		}
		gameDao.get_room_by_room_id(rid,function(err,room_info){
			gameDao.get_player_local(rid,username,function(err,location){
				//游戏没有开始直接退出放间
				if(room_info.is_gaming == 0){
					gameDao.leave_room(rid,uid,function(err,res){
						var param = {
							route: 'onLeaveRoom',
							location:location,
							player_id:username,
							data:res
						};
						channel.pushMessage(param);
						cb(null);
					});
				}else if(room_info.is_gaming != -1){
					var param = {
						'route':'onKick',
						'location':location
					};
					channel.pushMessage(param);
					var t = setTimeout(function(){
						//玩家超时之后解散房间但是保留房间信息 以便于确认信息
						gameDao.dissolve_room(rid,function(err,res){
							var p = {
								'route':'onQuit',
								'location':location
							};
							channel.pushMessage(p);
							self.cache.del(rid);
							cb(users);
						});
					},1000 * 30 * 5);
					cacheData.connect = {
						'type':'disConnect',
						'time':(new Date()).getDate(),
						'func':t
					}
					self.cache.put(rid,cacheData);
				}
			});
		});
	}else{
		cb(null);
	}
};

