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
	console.log("handler.create:" + JSON.stringify(msg));
	var renshu = msg.renshu;
	var room_type = msg.room_type;
	var player_id = msg.player_id;
	var max_type = msg.max_type;
	var fangka_type = msg.fangka_type;
	var wait_time = msg.wait_time;
	var fangka_num = 0;
	var self = this;
	if(fangka_type == 1){
		fangka_num = 1;
	}else if(fangka_type == 2){
		fangka_num = renshu;
	}

	playerDao.get_player_by_id(player_id,function(err,player){
		if(player.fangka_num < fangka_num){
			console.log("fangka have no enough" + player.fangka_num + " use:" + fangka_num);
			next(null, {code:203,msg:"房卡数量不足"});
			return;
		}
		playerDao.sub_fangka(player_id,fangka_num,function(err,res){
			gameDao.create_room_by_player_id(player_id,player.nick_name,room_type,renshu,max_type,fangka_type,wait_time,fangka_num,function(err,res){
				console.log('create room succ:' + JSON.stringify(res));

				var rid = res;
				var uid = player_id + '*' + rid;
				session.bind(uid);
				session.set('rid', rid);
				session.push('rid', function(err) {
					if(err) {
						console.error('set rid for session service failed! error is : %j', err.stack);
					}
				});

				session.on('closed', onUserLeave.bind(null, self.app));

				gameDao.get_room_by_room_id(res,function(err,res){
					if(err){
						next(null, {code:500,msg:err.message});
					}else{
						self.app.rpc.game.gameRemote.enter_wait_room(session, uid, self.app.get('serverId'), rid, true);
						next(null, {code:200,msg:res});
					}
				});
			});
		});
	});
};

handler.enter_wait_room = function(msg, session, next) {
	console.log("handler.create:" + JSON.stringify(msg));
	var room_num = msg.room_num;
	var rid = msg.rid;
	var player_id = msg.player_id;
	var self = this;
	if(rid != null){
		gameDao.get_room_by_room_id(rid,function(err,res){
			if(err){
				next(null, {code:500,msg:err.message});
			}else if(res != null){
				if(res.is_gaming == -1){
					next(null, {code:202,msg:'房间已经关闭，无法进入房间！'});
					return;
				}else if(res.player_num == res.real_num){
					next(null, {code:202,msg:'房间人员已满，无法进入房间！'});
					return;
				}
				var rid = res.id;
				var uid = player_id + '*' + rid;
				session.bind(uid);
				session.set('rid', rid);
				session.push('rid', function(err) {
					if(err) {
						console.error('set rid for session service failed! error is : %j', err.stack);
					}
				});

				session.on('closed', onUserLeave.bind(null, self.app));
				self.app.rpc.game.gameRemote.enter_wait_room(session, uid, self.app.get('serverId'), rid, true);
				next(null, {code:200,msg:res});
			}else{
				next(null, {code:202,msg:'房间已经不存在，无法进入房间！'});
			}
		});
	}else{
		gameDao.get_room_by_room_num(room_num,function(err,res){
			if(err){
				next(null, {code:500,msg:err.message});
			}else if(res != null){
				if(res.is_gaming == -1){
					next(null, {code:202,msg:'房间已经关闭，无法进入房间！'});
					return;
				}else if(res.player_num == res.real_num){
					next(null, {code:202,msg:'房间人员已满，无法进入房间！'});
					return;
				}
				var rid = res.id;
				var uid = player_id + '*' + rid;
				session.bind(uid);
				session.set('rid', rid);
				session.push('rid', function(err) {
					if(err) {
						console.error('set rid for session service failed! error is : %j', err.stack);
					}
				});

				session.on('closed', onUserLeave.bind(null, self.app));
				self.app.rpc.game.gameRemote.enter_wait_room(session, uid, self.app.get('serverId'), rid, true);
				next(null, {code:200,msg:res});
			}else{
				next(null, {code:202,msg:'房间已经不存在，无法进入房间！'});
			}
		});
	}
};

handler.enter = function(msg, session, next) {
	var self = this;
	var player_id = msg.player_id;
	var rid = msg.rid;
	var location = msg.location;

	gameDao.get_room_by_room_id(rid,function(err,res){
		if(err){
			next(null, {code:500,msg:err.message});
		}else if(res != null){
			var rid = res.id;
			var uid = player_id + '*' + rid;
			self.app.rpc.game.gameRemote.enter_room(session, uid, self.app.get('serverId'), rid, location);
			next(null, {code:200});
		}else{
			next(null, {code:202});
		}
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

