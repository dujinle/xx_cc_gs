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
gameRemote.prototype.enter_wait_room = function(uid, sid, channel_id, flag) {
	console.log("gameRemote.enter_wait_room......");
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
};

gameRemote.prototype.enter_room = function(uid, sid, channel_id, location) {
	console.log("gameRemote.enter_room......");
	var channel = this.channelService.getChannel(channel_id, false);
	var channelService = this.channelService;
	var username = uid.split('*')[0];
	var rid = uid.split('*')[1];
	var self = this;

	if( !! channel) {
		playerDao.get_player_by_id(username,function(err,player){
			gameDao.add_player(rid,uid,location,function(err,res){
				var param = {
					route: 'onEnterRoom',
					player: player,
					position:location  //同时分配位置
				};
				channel.pushMessage(param);
			});
		});
	}
};
/**
 * 房间新增用户
 */
gameRemote.prototype.add = function(uid, sid, name, flag, cb) {
	console.log("gameRemote.add......");
    var channel = this.channelService.getChannel(name, flag);
    var channelService = this.channelService;
    //如果name不存在且flag为true，则创建channel
    var username = uid.split('*')[0];
    var rid = uid.split('*')[1];
    var self = this;

    if( !! channel) {
        channel.add(uid, sid);
        gameDao.addPlayer(rid,uid,function(err,location,player_num){
            var param = {
                route: 'onAdd',
                user: username,
                position:location  //同时分配位置
            };
            channel.pushMessage(param);
            gameDao.getRoomStatus(rid,function(err,game_status){
                if(player_num>=2&&game_status==0){
                    setTimeout(function(){
                        gameDao.getRoomInfo(rid,function(err,roomInfo){
                            if(roomInfo.player_num>=2&&roomInfo.is_gaming==0){
                                gameLogicRemote.fapai(self.app,uid,rid,channel,channelService,username,function(){
                                    console.log("gameLogicRemote.fapai callback......");
                                });
                            }
                        });
                    },10000);
                }
            });
            cb(location);
        });
    }
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

