/**
 * Created by WTF Wei on 2016/3/24.
 * Function :
 */

var Code      = require('../../../consts/code');
var playerDao = require('../../../dao/playerDao');
var gameDao   = require('../../../dao/gameDao');

var async     = require('async');


module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};


var handler = Handler.prototype;
/**
 * New client entry.
 * 管理用户连接session
 * @param  {Object}   msg  msg.token    request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
Handler.prototype.entry = function (msg, session, next) {
    var token = msg.token, self = this;
    console.log(__filename,'entry ok ====token: ',token);
    if (!token) {
        next(new Error('invalid entry request: empty token'), {code: 500,msg:"token empty"});
        return;
    }

    var userId, player;
    async.waterfall([
        function (cb) {
            console.log("cd waterfall  ***************************");
            console.log('token ',token);
            //auth token
            //token 为登录验证之后
            //取出userId
            self.app.rpc.auth.authRemote.auth(session, token, cb);
        }, function (code, user, cb) {

            console.log('after auth');
            //query player info by user id
            //user = user/null
            if (code !== Code.OK) {
                console.log('验证不成功');
                next(null, {code: code,msg:'code ! = 200'});
                return;
            }

            if (!user) {
                console.log('用户不存在');
                next(null, {code: Code.ENTRY.FA_USER_NOT_EXIST,msg:'user not exist'});
                return;
            }

            userId = user.id;
            playerDao.get_player_by_id(user.id, cb);
        }, function (res, cb) {
            console.log('after getplayer--- ');
            // generate session and register chat status
            player = res;
            self.app.get('sessionService').kick(userId, cb);
        }, function (cb) {
            //session.bind(userId, cb);
            cb();
        }, function (cb) {
            if (!player) {
                next(null, {code: Code.OK});
                return;
            }
            session.set('playerId', player.id);
            session.push('playerId', function(err) {
                if(err) {
                    console.error('set rid for session service failed! error is : %j', err.stack);
                }
            });
            next(null,{code:Code.OK,msg:'get user player task ok',player:player});
        }
    ], function (err) {
        if (err) {
            next(err, {code: Code.FAIL,msg:'waterfall err'});
            return;
        }
        console.log('get all data player user task');
    });

};

handler.create = function(msg, session, next) {
	playerId = msg.playerId;
	roomType = msg.roomType;
    var self = this;
	playerDao.getPlayerByPlayerId(playerId,function(err,player){
		console.log(JSON.stringify(msg) + player.fangka);
		if(player.fangka < msg.fangKa){
			next(null, {
				error:"房卡数量不够！"
			});
		}else{
			gameDao.createRoomByPlayerId(playerId,player.nickName,roomType, function(err,res){
				console.log('create room succ:' + JSON.stringify(res));

				var rid = res;
				var uid = playerId + '*' + rid;
				session.bind(uid);
				session.set('rid', rid);
				session.push('rid', function(err) {
					if(err) {
						console.error('set rid for session service failed! error is : %j', err.stack);
					}
				});

				session.set('readyNum',0);
				session.push('readyNum',function(err){
					if(err){
						console.error('enterHandler:set readyNum for session service failed! error is : %j', err.stack);
					}
				});

				session.on('closed', onUserLeave.bind(null, self.app));
				console.log('leave enter func ......');
				self.app.rpc.game.gameRemote.add(session, uid, self.app.get('serverId'), rid, true, function(location){
					playerDao.subFangKa(playerId,msg.fangKa,function(err,code){
						next(null, {
							location:location
						});
					});
				});
			});
		}
	});
};

handler.enter = function(msg, session, next) {
    var self = this;
	playerId = msg.playerId;
	roomType = msg.roomType;
	roomNum = msg.roomNum;

    gameDao.returnRoom(roomNum, function(err,res){

		if(res == null){
			next(null,{
				error:'no_room'
			});
			return true;
		}
        var rid = res.toString();

        var uid = playerId + '*' + rid;
        session.bind(uid);
        session.set('rid', rid);
        session.push('rid', function(err) {
            if(err) {
                console.error('set rid for session service failed! error is : %j', err.stack);
            }
        });

        session.set('readyNum',0);
        session.push('readyNum',function(err){
            if(err){
                console.error('enterHandler:set readyNum for session service failed! error is : %j', err.stack);
            }
        });

        session.on('closed', onUserLeave.bind(null, self.app));
		console.log('leave enter func ......');
        self.app.rpc.game.gameRemote.add(session, uid, self.app.get('serverId'), rid, true, function(location){
            next(null, {
                location:location
            });
        });
    });
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
    if(!session || !session.uid) {
        return;
    }
    //app.rpc.chat.chatRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
    //app.rpc.game.gameRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
	console.log('loginout .......' + session.uid);
};

