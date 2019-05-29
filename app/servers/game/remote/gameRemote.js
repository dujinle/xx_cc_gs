/**
 * Created by wuningjian on 2/23/16.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var Code	  = require('../../../consts/code');
var gameDao   = require('../../../dao/gameDao');
var delayDao   = require('../../../dao/delayDao');
var playerDao = require('../../../dao/playerDao');
var utils     = require('../../../util/utils');
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
		gameDao.get_room_by_room_id(rid,function(err,room_info){
			playerDao.get_player_by_id(username,function(err,player){
				//如果是房主进入房间则直接进入不用消费房卡，因为建房时已经消费
				//判断玩家是否有金币和房卡 不够不允许进入游戏
				if(room_info.game_type == 1){
					//抢庄 庄家消费所有玩家的房卡
					if(location == 1 && player.fangka_num < room_info.player_num){
						cb({code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.FK_ENTER_NOMORE});
						return;
					}
					if(player.gold <= 0){
						cb({code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.GD_ENTER_NOMORE});
						return;
					}
				}else if(room_info.game_type == 2){
					//随机庄 每人消费一张房卡
					if(player.fangka_num < 1){
						cb({code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.FK_ENTER_NOMORE});
						return;
					}
					if(player.gold <= 0){
						cb({code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.GD_ENTER_NOMORE});
						return;
					}
				}else if(room_info.game_type == 3){
					//转庄 每人消费一张房卡
					if(player.fangka_num < 1){
						cb({code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.FK_ENTER_NOMORE});
						return;
					}
					if(player.gold <= 0){
						cb({code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.GD_ENTER_NOMORE});
						return;
					}
				}
				channel.add(uid, sid);
				var player_ids = [null,null,null,null];
				for(var i = 1;i <= 4;i++){
					var local = room_info['location' + i];
					if(local != null && local != 'null'){
						player_ids[i - 1] = local.split('*')[0];
					}
				}
				gameDao.add_player(rid,uid,location,function(err,real_num){
					if(real_num != null){
						player_ids[location - 1] = username;
						var param = {
							route: 'onEnterRoom',
							player: player_ids,
							real_num:real_num,
							location:location  //同时分配位置
						};
						channel.pushMessage(param);
					}
				});
				cb({code:Code.OK,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_SUCCESS});
			});
		});
	}else{
		cb({code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_EMPTY});
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
					}else{
						cacheData.connect = {
							'type':'Connect',
							'time':(new Date()).getDate(),
							'func':null
						}
						self.cache.put(rid,cacheData);
					}
				});
			}
		});
		cb({code:Code.OK,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_SUCCESS});
	}else{
		cb({code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_EMPTY});
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
				real_num:res
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
				//再次确认一下是否有效的游戏 可以开始
				if(room_info.real_num == room_info.player_num){
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
						gameDao.get_players_location(rid,function(err,locations){
							var random_uid = utils.get_random_num(0,locations.length - 1);
							logger.info('start game start location:',random_uid,locations);
							var param = {
								route: 'onStartGame',
								players: results,
								location:locations[random_uid]
							};
							channel.pushMessage(param);
							var cacheData = {
								'channelMsg':[],
								'paixing':null,
								'connect':null
							};
							self.cache.put(rid,cacheData);
							delayDao.addDelay(rid,10,function(){
								logger.info("start game:addDelay success");
							});
						});
					});
				}else{
					var param = {
						route: 'onStartFail',
						msg: '其他玩家没有正常进入游戏'
					};
					channel.pushMessage(param);
				}
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
							real_num:res
						};
						channel.pushMessage(param);
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
	}
	cb(null);
};

