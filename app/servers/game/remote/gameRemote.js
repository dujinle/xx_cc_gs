/**
 * Created by wuningjian on 2/23/16.
 */
var gameDao   = require('../../../dao/gameDao');
var playerDao = require('../../../dao/playerDao');
var pomelo    = require('pomelo');
var gameLogicRemote = require('./gameLogicRemote');
var async     = require('async');
var cache     = require('memory-cache');


module.exports = function(app) {
    return new gameRemote(app);
};

var gameRemote = function(app) {
    this.app = app;
    this.channelService = app.get('channelService');
};
/*用户进入房间等待页面 则放入channel中等待信息push*/
/*
	channel_id 即 前面的rid 房间号id
	sid 即 server id
 */
gameRemote.prototype.enter_wait_room = function(uid, sid, channel_id, flag,cb) {
/*{{{*/
	console.log("gameRemote.enter_wait_room......uid:" + uid + " sid:" + sid + " channel_id:" + channel_id + " flag:" + flag);
	var channel = this.channelService.getChannel(channel_id, flag);
	var channelService = this.channelService;
	//如果name不存在且flag为true，则创建channel
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;

	if( !! channel) {
		//把玩家加入channel
		channel.add(uid, sid);
	}
	cb();
/*}}}*/
};

gameRemote.prototype.enter_room = function(uid, sid, channel_id, location,cb) {
/*{{{*/
	console.log("gameRemote.enter_room......uid:" + uid + " sid:" + sid + " channel_id:" + channel_id + " location:" + location);
	var channel = this.channelService.getChannel(channel_id, false);
	var channelService = this.channelService;
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;

	if( !! channel) {
		gameDao.get_room_by_room_id(rid,function(err,res){
			playerDao.get_player_by_id(username,function(err,player){
				//如果是房主进入房间则直接进入不用消费房卡，因为建房时已经消费
				if(res.fangzhu_id == player.id){
					gameDao.add_player(rid,uid,location,function(err,res){
						var param = {
							route: 'onEnterRoom',
							player: player,
							location:location  //同时分配位置
						};
						channel.pushMessage(param);
					});
					cb({'code':200,'msg':'进入游戏房间！','fangka_num': player.fangka_num});
				}else{
					//玩家进入房间确定房间模式是否需要消费房卡
					if(res.fangka_type == 1){
						if(player.fangka_num - 1 >= 0){
							playerDao.sub_fangka(player.id,1,function(err,res){
								gameDao.add_player(rid,uid,location,function(err,res){
									var param = {
										route: 'onEnterRoom',
										player: player,
										location:location  //同时分配位置
									};
									channel.pushMessage(param);
								});
							});
							cb({'code':200,'msg':'进入游戏房间！','fangka_num': player.fangka_num - 1});
						}else{
							cb({'code':202,'msg':'房卡数量不够，无法进入游戏房间！'});
						}
					}else{
						gameDao.add_player(rid,uid,location,function(err,res){
							var param = {
								route: 'onEnterRoom',
								player: player,
								location:location  //同时分配位置
							};
							channel.pushMessage(param);
						});
						cb({'code':200,'msg':'进入游戏房间！','fangka_num': player.fangka_num});
					}
				}
			});
		});
	}else{
		cb({'code':202,'msg':'没有找到房间信道！'});
	}
/*}}}*/
};

gameRemote.prototype.delay_wait_time = function(uid, sid, channel_id,flag,cb) {
/*{{{*/
	console.log("gameRemote.delay_wait_time......uid:" + uid + " sid:" + sid + " channel_id:" + channel_id);
	var channel = this.channelService.getChannel(channel_id, flag);
	var channelService = this.channelService;
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;

	if( !! channel) {
		gameDao.add_wait_time(rid,function(err,res){
			var param = {
				route: 'onDelayWaitTime',
				wait_time: res
			};
			channel.pushMessage(param);
		});
	}
	cb();
/*}}}*/
};

gameRemote.prototype.dissolve_room = function(uid, sid, channel_id,flag,cb) {
/*{{{*/
	console.log("gameRemote.dissolve_room......uid:" + uid + " sid:" + sid + " channel_id:" + channel_id);
	var channel = this.channelService.getChannel(channel_id, flag);
	var channelService = this.channelService;
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;
	var players = new Array();
	if( !! channel) {
		gameDao.dissolve_room(rid,function(err,res){
			var param = {
				route: 'onDissolveRoom',
				rid:rid
			};
			channel.pushMessage(param);
			var users_ext = channel.getMembers();
			for(var i = 0; i < users_ext.length;i++){
				var abc = channel.leave(users_ext[i], sid);
				players.push(users_ext[i]);
				console.log("remove from channel uid:" + uid + " abc:" + abc);
			}
			cb(players);
		});
	}else{
		cb(players);
	}
/*}}}*/
};

gameRemote.prototype.leave_room = function(uid, sid, channel_id,flag,location,cb) {
/*{{{*/
	console.log("gameRemote.leave_room......uid:" + uid + " sid:" + sid + " channel_id:" + channel_id);
	var channel = this.channelService.getChannel(channel_id, flag);
	var channelService = this.channelService;
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;
	var players = new Array();
	if( !! channel) {
		if(location != null){
			gameDao.leave_room(rid,location,function(err,res){
				var param = {
					route: 'onLeaveRoom',
					location:location,
					player_id:username,
					data:res
				};
				channel.pushMessage(param);
			});
		}else{
			var param = {
				route: 'onLeaveRoom',
				location:null,
				player_id:username,
				data:null
			};
			channel.pushMessage(param);
		}
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

gameRemote.prototype.start_game = function(uid, sid, channel_id,flag,cb) {
/*{{{*/
	console.log("gameRemote.start_room......uid:" + uid + " sid:" + sid + " channel_id:" + channel_id);
	var channel = this.channelService.getChannel(channel_id, flag);
	var channelService = this.channelService;
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;

	if( !! channel) {
		gameDao.start_game(rid,function(err,res){
			var users = channel.getMembers();
			for(var i = 0; i < users.length; i++) {
				users[i] = users[i].split('*')[0];
			}
			async.parallel([
				function(callback){
					if(users[0]!=null){
						playerDao.get_player_by_id(users[0],function(err,res){
							gameDao.get_player_local(rid,users[0],function(err,location){
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
				//console.log("async parallel"+JSON.stringify(results[0]));
				//console.log("async parallel"+results);
				//channelService.pushMessageByUids('onInit',results,[{uid:uid,sid:sid}]);
				//return results;
				var param = {
					route: 'onStartGame',
					players: results
				};
				channel.pushMessage(param);
			});
		});
	}
	cb();
/*}}}*/
};

/**
 * 向playerID推送房间所有用户基本信息,room infomation
 * @param channelService
 * @param channel
 * @param uid 新进入房间的用户playerID*room_num
 */

gameRemote.prototype.get = function(uid,channel,channelService,cb) {
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
    async.parallel([
            function(callback){
                if(users[0]!=null){
                    playerDao.getPlayerByPlayerId(users[0],function(err,res){
                        gameDao.getPlayerLocal(rid,users[0],function(err,location){
                            var player1 = {
                                location:location,
                                nickName:res.nickName,
                                gold:    res.gold,
                                vip:     res.vip,
                                gender:  res.gender,
                                level:   res.level
                            };
                            callback(null, player1);
                        });
                    });

                }else{
                    callback(null,'null');
                }
            },
            function(callback){
                if(users[1]!=null){
                    playerDao.getPlayerByPlayerId(users[1],function(err,res){
                        gameDao.getPlayerLocal(rid,users[1],function(err,location){
                            var player2 = {
                                location:location,
                                nickName:res.nickName,
                                gold:    res.gold,
                                vip:     res.vip,
                                gender:  res.gender,
                                level:   res.level
                            };
                            callback(null, player2);
                        });
                    });

                }else{
                    callback(null,'null');
                }
            },
            function(callback){
                if(users[2]!=null){
                    playerDao.getPlayerByPlayerId(users[2],function(err,res){
                        gameDao.getPlayerLocal(rid,users[2],function(err,location){
                            var player3 = {
                                location:location,
                                nickName:res.nickName,
                                gold:    res.gold,
                                vip:     res.vip,
                                gender:  res.gender,
                                level:   res.level
                            };
                            callback(null, player3);
                        });
                    });

                }else{
                    callback(null,'null');
                }
            },
            function(callback){
                if(users[3]!=null){
                    playerDao.getPlayerByPlayerId(users[3],function(err,res){
                        gameDao.getPlayerLocal(rid,users[3],function(err,location){
                            var player4 = {
                                location:location,
                                nickName:res.nickName,
                                gold:    res.gold,
                                vip:     res.vip,
                                gender:  res.gender,
                                level:   res.level
                            };
                            callback(null, player4);
                        });
                    });

                }else{
                    callback(null,'null');
                }
            },
            function(callback){
                if(users[4]!=null){
                    playerDao.getPlayerByPlayerId(users[4],function(err,res){
                        gameDao.getPlayerLocal(rid,users[4],function(err,location){
                            var player5 = {
                                location:location,
                                nickName:res.nickName,
                                gold:    res.gold,
                                vip:     res.vip,
                                gender:  res.gender,
                                level:   res.level
                            };
                            callback(null, player5);
                        });
                    });

                }else{
                    callback(null,'null');
                }
            }
        ],
        function(err, results){
            //console.log("async parallel"+JSON.stringify(results[0]));
            //console.log("async parallel"+results);
            //channelService.pushMessageByUids('onInit',results,[{uid:uid,sid:sid}]);
            //return results;
            cb(results);
        });

    //return users;
};

/**
 * 用户离开房间，剔除用户
 * */
gameRemote.prototype.kick = function(uid, sid, name, cb) {
	console.log('gameRemote.prototype.kick.........');
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
    gameDao.getPlayerLocal(rid,username,function(err,location){
        gameDao.cleanOpenMark(rid,location,function(err){
            gameDao.rmPlayer(rid,uid,function(err){

                var param = {
                    route: 'onLeave',
                    user: username
                };
                channel.pushMessage(param);

                gameDao.getIsGameNum(rid,function(err,isGameNumArr){
                    var sum = 0;
                    var game_winner;
                    for(var i=1;i<6;i++){
                        if(isGameNumArr[i]==1){
                            sum = sum +isGameNumArr[i];
                            game_winner=i;
                        }
                    }
                    if(sum<=1){
                        //重新开始
						console.log('gameLogicRemote.restartGame......');
                        gameLogicRemote.restartGame(self.app,uid,rid,channel,channelService,game_winner);
                        cb();

                    }else{
                        cb();
                    }
                });
            });
        });
    });


    //cb();
};

