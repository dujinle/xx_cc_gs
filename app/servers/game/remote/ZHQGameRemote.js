/**
 * Created by wuningjian on 2/23/16.
 */
var ZHQGameDao   = require('../../../dao/ZHQGameDao');
var playerDao = require('../../../dao/playerDao');
var pomelo	= require('pomelo');
var ZHQLogicRemote = require('./ZHQLogicRemote');
var async	 = require('async');
var cache	 = require('memory-cache');


module.exports = function(app) {
	return new ZHQGameRemote(app);
};

var ZHQGameRemote = function(app) {
	this.app = app;
	this.channelService = app.get('channelService');
};

/**
 * 房间新增用户
 */
ZHQGameRemote.prototype.add = function(uid, sid, name, flag, cb) {
	console.log("ZHQGameRemote.add......");
	var channel = this.channelService.getChannel(name, flag);
	var channelService = this.channelService;
	//如果name不存在且flag为true，则创建channel
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;

	if( !! channel) {
		channel.add(uid, sid);
		ZHQGameDao.addPlayer(rid,uid,function(err,location,player_num){
			playerDao.getPlayerByPlayerId(username,function(err,player){
				ZHQGameDao.setIsGameNum(rid,location,0,function(err,res){
					ZHQGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
						ZHQGameDao.getStartGolds(rid,function(err,golds){
							if(golds == null){
								golds = new Array();
							}
							golds.push([player.playerId,player.gold]);
							ZHQGameDao.setStartGolds(rid,JSON.stringify(golds),function(err,gold_res){
								var tplayer = {
									id:username,
									location:location,
									isGame:  isGameNum,
									nickName:player.nickName,
									gold:    player.gold,
									vip:     player.vip,
									gender:  player.gender,
									level:   player.level
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

ZHQGameRemote.prototype.get = function(uid,channel,channelService,cb) {
	var users = [];
	var usersInfo = [];

	var rid;

	if( !! channel) {
		users = channel.getMembers();
		rid = users[0].split('*')[1];
	}
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	async.parallel([
		function(callback){
			if(users[0]!=null){
				playerDao.getPlayerByPlayerId(users[0],function(err,res){
					ZHQGameDao.getPlayerLocal(rid,users[0],function(err,location){
						ZHQGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
							var player1 = {
								id:users[0],
								location:location,
								isGame:isGameNum,
								nickName:res.nickName,
								gold:res.gold,
								vip:res.vip,
								gender:res.gender,
								level:res.level
							};
							callback(null, player1);
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
					ZHQGameDao.getPlayerLocal(rid,users[1],function(err,location){
						ZHQGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
							var player2 = {
								id:users[1],
								isGame:isGameNum,
								location:location,
								nickName:res.nickName,
								gold:res.gold,
								vip:res.vip,
								gender:res.gender,
								level:res.level
							};
							callback(null, player2);
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
					ZHQGameDao.getPlayerLocal(rid,users[2],function(err,location){
						ZHQGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
							var player3 = {
								id:users[2],
								isGame:isGameNum,
								location:location,
								nickName:res.nickName,
								gold:res.gold,
								vip:res.vip,
								gender:res.gender,
								level:res.level
							};
							callback(null, player3);
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
					ZHQGameDao.getPlayerLocal(rid,users[3],function(err,location){
						ZHQGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
							var player4 = {
								id:users[3],
								isGame:isGameNum,
								location:location,
								nickName:res.nickName,
								gold:res.gold,
								vip:res.vip,
								gender:res.gender,
								level:res.level
							};
							callback(null, player4);
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
					ZHQGameDao.getPlayerLocal(rid,users[4],function(err,location){
						ZHQGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
							var player5 = {
								id:users[4],
								isGame:isGameNum,
								location:location,
								nickName:res.nickName,
								gold:res.gold,
								vip:res.vip,
									gender:res.gender,
								level:res.level
							};
							callback(null, player5);
						});
					});
				});

			}else{
				callback(null,'null');
			}
		}
	],
	function(err, results){
		ZHQGameDao.getRoomInfo(rid,function(err,res){
			var param = {};
			param['current_chip'] = res.current_chip;
			param['all_chip'] = res.all_chip;
			param['round'] = res.round;
			param['room_num'] = res.room_num;
			param['player_num'] = res.player_num;
			param['is_gaming'] = res.is_gaming;
			param['total_round'] = res.total_round;
			param['master_name'] = res.master_name;
			param['current_player'] = res.current_player;
			param['players'] = results;
			cb(err,param);
		});
	});
};

/**
 * 用户离开房间，剔除用户
 * */
ZHQGameRemote.prototype.kick = function(uid, sid, name, cb) {
	console.log('ZHQGameRemote.prototype.kick.........');
	var self = this;
	var channel = this.channelService.getChannel(name, false);
	var channelService = this.channelService;
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
	}
	ZHQGameDao.getPlayerLocal(rid,username,function(err,location){
		ZHQGameDao.rmPlayer(rid,uid,function(err){
			var param = {
				route: 'onLeave',
				user: username
			};
			channel.pushMessage(param);
			ZHQGameDao.getPlayerIsGameNum(rid,location,function(err,isGameNum){
				if(isGameNum <= 1){
					console.log("quit room success");
				}else{
					ZHQLogicRemote.FailGame(rid,channel,channelService,location);
				}
			});
			cb();
		});
	});
};

