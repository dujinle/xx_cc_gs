/**
 * Created by wuningjian on 2/23/16.
 */
var ZJHGameDao   = require('../../../dao/ZJHGameDao');
var playerDao = require('../../../dao/playerDao');
var pomelo    = require('pomelo');
var ZJHLogicRemote = require('./ZJHLogicRemote');
var async     = require('async');
var cache     = require('memory-cache');


module.exports = function(app) {
    return new ZJHGameRemote(app);
};

var ZJHGameRemote = function(app) {
    this.app = app;
    this.channelService = app.get('channelService');
};

/**
 * 房间新增用户
 */
ZJHGameRemote.prototype.add = function(uid, sid, name, flag, cb) {
	console.log("ZJHGameRemote.add......uid:" + uid + ' sid:' + sid + ' name:' + name);
	var channel = this.channelService.getChannel(name, flag);
	var channelService = this.channelService;
	//如果name不存在且flag为true，则创建channel
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;

	if( !! channel) {
		channel.add(uid, sid);
		ZJHGameDao.addPlayer(rid,uid,function(err,location,player_num){
			playerDao.getPlayerByPlayerId(username,function(err,player){
				ZJHGameDao.setIsGameNum(rid,location,0,function(err,res){
					ZJHGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
						ZJHGameDao.getOpenMark(rid,location,function(err,mark){
							ZJHGameDao.getStartGolds(rid,function(err,golds){
								if(golds == null){
									golds = new Array();
								}
								golds.push([player.playerId,player.gold]);
								ZJHGameDao.setStartGolds(rid,JSON.stringify(golds),function(err,gold_res){
									var tplayer = {
										id:username,
										location:location,
										isGame:  isGameNum,
										nickName:player.nickName,
										gold:    player.gold,
										vip:     player.vip,
										gender:  player.gender,
										level:   player.level,
										mark:    mark
									};
									var param = {
										route: 'onAdd',
										user: tplayer
									};
									channel.pushMessage(param);
								});
							});
						});
					});
				});
				cb(location);
			});
		});
	}
};

/**
 * 向playerID推送房间所有用户基本信息,room infomation
 * @param channelService
 * @param channel
 * @param uid 新进入房间的用户playerID*room_num
 */

ZJHGameRemote.prototype.get = function(uid,channel,channelService,cb) {
	console.log('ZJHGameRemote.prototype.get.........');
	var users = [];
	var usersInfo = [];
	//var channel = this.channelService.getChannel(name, flag);
	//var channelService = this.channelService;

	var rid;

	if( !! channel) {
		users = channel.getMembers();
		rid = users[0].split('*')[1];
	}
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	console.log('users:' + JSON.stringify(users));
	async.parallel([
		function(callback){
			if(users[0]!=null){
				playerDao.getPlayerByPlayerId(users[0],function(err,res){
					ZJHGameDao.getPlayerLocal(rid,users[0],function(err,location){
						ZJHGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
							ZJHGameDao.getOpenMark(rid,location,function(err,mark){
								var player1 = {
									id:users[0],
									location:location,
									isGame:  isGameNum,
									nickName:res.nickName,
									gold:    res.gold,
									vip:     res.vip,
									gender:  res.gender,
									level:   res.level,
									mark:    mark
								};
								callback(null, player1);
							});
						});
					});
				});
			}else{
				callback(null,'null');
			}
		},
		function(callback){
			if(users[1]!=null){
				playerDao.getPlayerByPlayerId(users[1],function(err,res){
					ZJHGameDao.getPlayerLocal(rid,users[1],function(err,location){
						ZJHGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
							ZJHGameDao.getOpenMark(rid,location,function(err,mark){
								var player2 = {
									id:users[1],
									location:location,
									isGame:  isGameNum,
									nickName:res.nickName,
									gold:    res.gold,
									vip:     res.vip,
									gender:  res.gender,
									level:   res.level,
									mark:    mark
								};
								callback(null, player2);
							});
						});
					});
				});
			}else{
				callback(null,'null');
			}
		},
		function(callback){
			if(users[2]!=null){
				playerDao.getPlayerByPlayerId(users[2],function(err,res){
					ZJHGameDao.getPlayerLocal(rid,users[2],function(err,location){
						ZJHGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
							ZJHGameDao.getOpenMark(rid,location,function(err,mark){
								var player3 = {
									id:users[2],
									location:location,
									isGame:  isGameNum,
									nickName:res.nickName,
									gold:    res.gold,
									vip:     res.vip,
									gender:  res.gender,
									level:   res.level,
									mark:    mark
								};
								callback(null, player3);
							});
						});
					});
				});
			}else{
				callback(null,'null');
			}
		},
		function(callback){
			if(users[3]!=null){
				playerDao.getPlayerByPlayerId(users[3],function(err,res){
					ZJHGameDao.getPlayerLocal(rid,users[3],function(err,location){
						ZJHGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
							ZJHGameDao.getOpenMark(rid,location,function(err,mark){
								var player4 = {
									id:users[3],
									location:location,
									isGame:  isGameNum,
									nickName:res.nickName,
									gold:    res.gold,
									vip:     res.vip,
									gender:  res.gender,
									level:   res.level,
									mark:    mark
								};
								callback(null, player4);
							});
						});
					});
				});
			}else{
				callback(null,'null');
			}
		},
		function(callback){
			if(users[4]!=null){
				playerDao.getPlayerByPlayerId(users[4],function(err,res){
					ZJHGameDao.getPlayerLocal(rid,users[4],function(err,location){
						ZJHGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
							ZJHGameDao.getOpenMark(rid,location,function(err,mark){
								var player5 = {
									id:users[4],
									location:location,
									isGame:  isGameNum,
									nickName:res.nickName,
									gold:    res.gold,
									vip:     res.vip,
									gender:  res.gender,
									level:   res.level,
									mark:    mark
								};
								callback(null, player5);
							});
						});
					});
				});
			}else{
				callback(null,'null');
			}
		}
	],
	function(err, results){
		console.log("async parallel"+JSON.stringify(results));
		ZJHGameDao.getRoomInfo(rid,function(err,res){
			var param = {};
			param['current_chip'] = res.current_chip;
			param['all_chip'] = res.all_chip;
			param['round'] = res.round;
			param['bet_chips'] = res.bet_chips;
			param['room_num'] = res.room_num;
			param['player_num'] = res.player_num;
			param['is_gaming'] = res.is_gaming;
			param['total_round'] = res.total_round;
			param['master_name'] = res.master_name;
			param['current_player'] = res.current_player;
			param['players'] = results;
			cb(err,param);
		});
		//console.log("async parallel"+results);
		//channelService.pushMessageByUids('onInit',results,[{uid:uid,sid:sid}]);
		//return results;
	});
    //return users;
};

/**
 * 用户离开房间，剔除用户
 * */
ZJHGameRemote.prototype.kick = function(uid, sid, name, cb) {
	console.log("ZJHGameRemote.prototype.kick......uid:" + uid + ' sid:' + sid + ' name:' + name);
	var self = this;
	var channel = this.channelService.getChannel(name, false);
	var channelService = this.channelService;
    // leave channel
	var rid = uid.split('*')[1];
	var username = uid.split('*')[0];
	console.log("uid:" + uid + " sid:" + sid);
	if( !! channel) {
		var users_ext = channel.getMembers();
		console.log("------------users_ext:"+users_ext);
		var abc = channel.leave(uid, sid);
		console.log("------------leave status:"+abc);
		var users = channel.getMembers();
		console.log("------------users:"+users);
	}
	ZJHGameDao.getPlayerLocal(rid,username,function(err,location){
		ZJHGameDao.cleanOpenMark(rid,location,function(err){
			ZJHGameDao.setIsGameNum(rid,location,-1,function(err,result){
				ZJHGameDao.rmPlayer(rid,uid,function(err){
					var param = {
						route: 'onLeave',
						user: username
					};
					channel.pushMessage(param);
					ZJHGameDao.getRoomInfo(rid,function(err,res){
						ZJHGameDao.getIsGameNum(rid,function(err,isGameNumArr){
							var sum = 0;
							var game_winner;
							for(var i = 1;i < 6;i++){
								if(isGameNumArr[i] > 1){
									sum = sum + 1;
									game_winner=i;
								}
							}
							if(sum ==1){
								//重新开始
								console.log('ZJHLogicRemote.restartGame......');
								ZJHGameDao.setFirstFaPai(rid,0,function(err,firstFapai){
									ZJHLogicRemote.restartGame(self.app,uid,rid,channel,channelService,game_winner);
								});
							}else if(sum > 1){
								console.log("just kick from room:" + uid);
							}else{
								if(res.player_num == 0){
									ZJHGameDao.resetData(rid,function(err,res){
										console.log("ZJHGameDao.resetData......");
									});
								}
							}
							cb();
						});
					});
				});
			});
		});
	});
};

