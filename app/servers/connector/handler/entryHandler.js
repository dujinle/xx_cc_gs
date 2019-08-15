/**
 * Created by WTF Wei on 2016/3/24.
 * Function :
 */

var Code	  = require('../../../consts/code');
var playerDao = require('../../../dao/playerDao');
var gameDao   = require('../../../dao/gameDao');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

var async	 = require('async');


module.exports = function (app) {
	return new Handler(app);
};

var Handler = function (app) {
	this.cache = app.get('cache');
	this.app = app;
};


var handler = Handler.prototype;
/**
 * New client entry.
 * 管理用户连接session
 * @param  {Object}   msg  msg.token	request message
 * @param  {Object}   session current session object
 * @param  {Function} next	next step callback
 * @return {Void}
 */
Handler.prototype.entry = function (msg, session, next) {
/*{{{*/
	var token = msg.token, self = this;
	logger.info(__filename,'entry ok ====token: ',token);
	if (!token) {
		next(null, {code: Code.CONNECTOR.FA_TOKEN_INVALID,msg:Code.CODEMSG.CONNECTOR.FA_TOKEN_INVALID});
		return;
	}

	var player;
	//多个函数依次执行，且前一个的输出为后一个的输入
	async.waterfall([
		function (cb) {
			logger.info("cd waterfall  ***************************");
			logger.info('token ',token);
			//auth token
			//token 为登录验证之后
			//取出userId
			self.app.rpc.auth.authRemote.auth(session, token, cb);
		}, function (user, cb) {
			player = user;
			logger.info('after auth');
			self.app.get('sessionService').kick(user.id, cb);
		}, function (cb) {
			session.set('playerId', player.id);
			session.push('playerId', function(err) {
				if(err) {
					console.error('set rid for session service failed! error is : %j', err.stack);
				}
			});
			next(null,{code:Code.OK,msg:Code.CODEMSG.LOGIN.SUCCESS,player:player});
		}
	], function (err) {
		if (err) {
			next(err, {code: Code.FAIL,msg:err.message});
			return;
		}
		logger.info('get all data player user task');
	});
/*}}}*/
};

handler.create = function(msg, session, next) {
/*{{{*/
	logger.info("handler.create:" + JSON.stringify(msg));
	var renshu = msg.renshu;
	var room_type = msg.room_type;
	var player_id = msg.player_id;
	var max_type = msg.max_type;
	var fangka_num = 1;
	var self = this;
	logger.info("session id:" + session.id + " uid:" + session.uid);
	playerDao.get_player_by_id(player_id,function(err,player){
		if(player.fangka_num < fangka_num){
			logger.info("fangka have no enough" + player.fangka_num + " use:" + fangka_num);
			next(null, {code:Code.CONNECTOR.FK_CREATE_NOMORE,msg:Code.CODEMSG.CONNECTOR.FK_CREATE_NOMORE});
			return;
		}
		playerDao.sub_fangka(player_id,fangka_num,function(err,res){
			console.log(err,res);
			gameDao.create_room_by_player_id(player_id,player.nick_name,room_type,renshu,max_type,function(err,res){
				logger.info('create room succ:' + JSON.stringify(res));
				if(err){
					next(null, {code:Code.SQL_ERROR,msg:err.message});
				}else{
					next(null, {code:Code.OK,msg:Code.CODEMSG.CONNECTOR.FK_CREATE_SUCCESS,fangka_num:player.fangka_num - fangka_num});
				}
				return;
			});
		});
	});
/*}}}*/
};

handler.get_room_info = function(msg, session, next) {
/*{{{*/
	logger.info("handler.get room info:" + JSON.stringify(msg));
	var process = msg.process;
	if(process == 'getRoomByPlayerId'){
		var player_id = msg.player_id;
		gameDao.get_rooms_by_player_id(player_id,function(err,res){
			if(err){
				next(null, {code:Code.SQL_ERROR,msg:err.message});
			}else if(res == null){
				next(null, {code:Code.FILTER,msg:Code.CODEMSG.COMMON.SQL_NULL});
			}else{
				next(null, {code:Code.OK,msg:res});
			}
			return;
		});
	}else if(process == 'getRoomById'){
		var rid = msg.rid;
		gameDao.get_room_by_room_id(rid,function(err,res){
			if(err){
				next(null, {code:Code.SQL_ERROR,msg:err.message});
			}else if(res == null){
				next(null, {code:Code.SQL_NULL,msg:Code.CODEMSG.COMMON.SQL_NULL});
			}else{
				next(null, {code:Code.OK,msg:res});
			}
			return;
		});
	}
/*}}}*/
};

handler.repair_enter_room = function(msg, session, next) {
/*{{{*/
	var self = this;
	logger.info("handler.get room info:" + JSON.stringify(msg));
	var rid = msg.rid;
	var player_id = msg.player_id;
	var uuid = msg.uuid;
	gameDao.get_room_by_room_id(rid,function(err,res){
		if(err){
			next(null, {code:Code.SQL_ERROR,msg:err.message});
		}else if(res != null){
			if(res.is_gaming == Code.GAME.FINISH){
				next(null, {code:Code.OK,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_FAIL});
				return;
			}
			var uid = player_id + '*' + rid;
			session.bind(uid);
			session.set('rid', rid);
			session.push('rid', function(err) {
				if(err) {
					console.error('set rid for session service failed! error is : %j', err.stack);
				}
			});
			session.on('closed', onUserLeave.bind(null, self.app));

			self.app.rpc.game.gameRemote.repair_enter_room(session, uid, uuid,self.app.get('serverId'), rid, false,function(){
				next(null, {code:Code.OK,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_SUCCESS});
			});
		}else{
			next(null, {code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_FAIL});
		}
	});
/*}}}*/
};

handler.leave_room = function(msg, session, next) {
/*{{{*/
	logger.info("handler.leave_room:" + JSON.stringify(msg));
	var rid = msg.rid;
	var player_id = msg.player_id;
	var location = msg.location;
	var self = this;
	var uid = player_id + '*' + rid;
	self.app.rpc.game.gameRemote.leave_room(session, uid, self.app.get('serverId'), rid, true,location,function(players){
		logger.info("leave_room:" + JSON.stringify(players));
		for(var i = 0; i < players.length;i++){
			session.unbind(players[i]);
		}
		next(null, {code:Code.OK,msg:Code.CODEMSG.CONNECTOR.CO_LEAVE_ROOM_OK});
	});
/*}}}*/
};

handler.enter = function(msg, session, next) {
/*{{{*/
	var self = this;
	var player_id = msg.player_id;
	var rid = msg.rid;
	var location = msg.location;

	gameDao.get_room_by_room_id(rid,function(err,room_info){
		if(err){
			next(null, {code:Code.SQL_ERROR,msg:err.message});
		}else if(room_info != null){
			if(room_info['location' + location] != null && room_info['location' + location] != 'null'){
				next(null, {code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_BLONG});
				return;
			}
			if(room_info.real_num >= room_info.player_num){
				next(null, {code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_BLONG});
				return;
			}
			//确定庄家位置是否有人 如果没有则最后一个进入的人不可以进入其他位置
			if(room_info.real_num + 1 == room_info.player_num && room_info.game_type == 1){
				if(room_info.location1 == null || room_info.location1 == 'null'){
					if(location != 1){
						next(null, {code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_ZHUANG});
						return;
					}
				}
			}
			var rid = room_info.rid;
			var uid = player_id + '*' + rid;
			session.bind(uid);
			session.set('rid', rid);
			session.push('rid', function(err) {
				if(err) {
					console.error('set rid for session service failed! error is : %j', err.stack);
				}
			});
			session.on('closed', onUserLeave.bind(null, self.app));
			logger.info("session id:" + session.id + " uid:" + session.uid);
			
			self.app.rpc.game.gameRemote.enter_room(session, uid, self.app.get('serverId'), rid, location,function(data){
				console.log('enter_room',data);
				next(null, data);
			});
		}else{
			next(null, {code:Code.FAIL,msg:Code.CODEMSG.CONNECTOR.CO_ENTER_ROOM_FAIL});
		}
	});
/*}}}*/
};

handler.start_game = function(msg, session, next) {
/*{{{*/
	var self = this;
	var rid = msg.rid;
	self.app.rpc.game.gameRemote.start_game(session, rid, self.app.get('serverId'), rid,false,function(){
		next(null, {code:Code.OK});
	});
/*}}}*/
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
	logger.info('loginout .......' + session.uid);
	app.rpc.game.gameRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'),function(players){
		session.unbind(session.uid);
		if(players != null){
			for(var i = 0; i < players.length;i++){
				session.unbind(players[i]);
			}
		}
	});
	//app.rpc.chat.chatRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};

