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
		next(new Error('invalid entry request: empty token'), {code: 500,msg:"token empty"});
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
			next(null,{code:Code.OK,msg:'get user player task ok',player:player});
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
	var fangka_type = msg.fangka_type;
	var wait_time = msg.wait_time;
	var fangka_num = 0;
	var self = this;
	if(fangka_type == 1){
		fangka_num = 1;
	}else if(fangka_type == 2){
		fangka_num = renshu;
	}
	logger.info("session id:" + session.id + " uid:" + session.uid);
	playerDao.get_player_by_id(player_id,function(err,player){
		if(player.fangka_num < fangka_num){
			logger.info("fangka have no enough" + player.fangka_num + " use:" + fangka_num);
			next(null, {code:203,msg:"房卡数量不足"});
			return;
		}
		playerDao.sub_fangka(player_id,fangka_num,function(err,res){
			gameDao.create_room_by_player_id(player_id,player.nick_name,room_type,renshu,max_type,fangka_type,wait_time,fangka_num,function(err,res){
				logger.info('create room succ:' + JSON.stringify(res));

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

				logger.info("session id:" + session.id + " uid:" + session.uid);
				gameDao.get_room_by_room_id(res,function(err,res){
					if(err){
						next(null, {code:500,msg:err.message});
					}else{
						self.app.rpc.game.gameRemote.enter_wait_room(session, uid, self.app.get('serverId'), rid, true,function(){
							next(null, {code:200,msg:res});
						});
					}
				});
			});
		});
	});
/*}}}*/
};

handler.enter_wait_room = function(msg, session, next) {
/*{{{*/
	logger.info("handler.create:" + JSON.stringify(msg));
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
				var rid = res.rid;
				var uid = player_id + '*' + rid;
				session.bind(uid);
				session.set('rid', rid);
				session.push('rid', function(err) {
					if(err) {
						console.error('set rid for session service failed! error is : %j', err.stack);
					}
				});

				session.on('closed', onUserLeave.bind(null, self.app));
				self.app.rpc.game.gameRemote.enter_wait_room(session, uid, self.app.get('serverId'), rid, true,function(){
					next(null, {code:200,msg:res});
				});
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
				var rid = res.rid;
				var uid = player_id + '*' + rid;
				session.bind(uid);
				session.set('rid', rid);
				session.push('rid', function(err) {
					if(err) {
						console.error('set rid for session service failed! error is : %j', err.stack);
					}
				});

				session.on('closed', onUserLeave.bind(null, self.app));
				self.app.rpc.game.gameRemote.enter_wait_room(session, uid, self.app.get('serverId'), rid, true,function(){
					next(null, {code:200,msg:res});
				});
				next(null, {code:200,msg:res});
			}else{
				next(null, {code:202,msg:'房间已经不存在，无法进入房间！'});
			}
		});
	}
/*}}}*/
};

handler.get_room_info = function(msg, session, next) {
/*{{{*/
	logger.info("handler.get room info:" + JSON.stringify(msg));
	var rid = msg.rid;
	gameDao.get_room_by_room_id(rid,function(err,res){
		if(err){
			next(null, {code:500,msg:err.message});
		}else if(res != null){
			next(null, {code:200,msg:res});
		}else{
			next(null, {code:202,msg:'房间已经不存在，无法进入房间！'});
		}
	});
/*}}}*/
};

handler.repair_enter_room = function(msg, session, next) {
/*{{{*/
	var self = this;
	logger.info("handler.get room info:" + JSON.stringify(msg));
	var rid = msg.rid;
	var player_id = msg.player_id;
	gameDao.get_room_by_room_id(rid,function(err,res){
		if(err){
			next(null, {code:500,msg:err.message});
		}else if(res != null){
			var uid = player_id + '*' + rid;
			session.bind(uid);
			session.set('rid', rid);
			session.push('rid', function(err) {
				if(err) {
					console.error('set rid for session service failed! error is : %j', err.stack);
				}
			});
			session.on('closed', onUserLeave.bind(null, self.app));
			async.parallel([
				function(callback){
					if(res.location1 != null && res.location1 != "null"){
						var player_id = res.location1.split('*')[0];
						playerDao.get_player_by_id(player_id,function(err,res){
							res['location'] = 1;
							callback(null, res);
						});
					}else{
						callback(null,"null");
					}
				},
				function(callback){
					if(res.location2 != null && res.location2 != "null"){
						var player_id = res.location2.split('*')[0];
						playerDao.get_player_by_id(player_id,function(err,res){
							res['location'] = 2;
							callback(null, res);
						});
					}else{
						callback(null,"null");
					}
				},
				function(callback){
					if(res.location3 != null && res.location3 != "null"){
						var player_id = res.location3.split('*')[0];
						playerDao.get_player_by_id(player_id,function(err,res){
							res['location'] = 3;
							callback(null, res);
						});
					}else{
						callback(null,"null");
					}
				},
				function(callback){
					if(res.location4 != null && res.location4 != "null"){
						var player_id = res.location4.split('*')[0];
						playerDao.get_player_by_id(player_id,function(err,res){
							res['location'] = 4;
							callback(null, res);
						});
					}else{
						callback(null,"null");
					}
				}
			],function(err,result){
				if(!!err){
					next(null, {code:Code.FAIL,msg:err.message});
				}else{
					self.app.rpc.game.gameRemote.enter_wait_room(session, uid, self.app.get('serverId'), rid, true,function(){
						next(null, {code:Code.OK,msg:result});
					});
				}
			});
		}else{
			next(null, {code:202,msg:'房间已经不存在，无法进入房间！'});
		}
	});
/*}}}*/
};
handler.dissolve_room = function(msg, session, next) {
/*{{{*/
	logger.info("handler.dissolve_room:" + JSON.stringify(msg));
	var rid = msg.rid;
	var player_id = msg.player_id;
	var self = this;
	var uid = player_id + '*' + rid;
	self.app.rpc.game.gameRemote.dissolve_room(session, uid, self.app.get('serverId'), rid, true,function(players){
		logger.info("dissolve_room:" + JSON.stringify(players));
		for(var i = 0; i < players.length;i++){
			session.unbind(players[i]);
		}
		next(null, {code:200,msg:"解散房间成功"});
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
		next(null, {code:200,msg:"离开房间成功"});
	});
/*}}}*/
};

handler.enter = function(msg, session, next) {
/*{{{*/
	var self = this;
	var player_id = msg.player_id;
	var rid = msg.rid;
	var location = msg.location;

	gameDao.get_room_by_room_id(rid,function(err,res){
		if(err){
			next(null, {code:500,msg:err.message});
		}else if(res != null){
			var rid = res.rid;
			var uid = player_id + '*' + rid;
			self.app.rpc.game.gameRemote.enter_room(session, uid, self.app.get('serverId'), rid, location,function(data){
				next(null, data);
			});
		}else{
			next(null, {'code':202,'msg':'房间已经关闭！'});
		}
	});
/*}}}*/
};

handler.delay_wait_time = function(msg, session, next) {
/*{{{*/
	var self = this;
	var player_id = msg.player_id;
	var rid = msg.rid;

	gameDao.get_room_by_room_id(rid,function(err,res){
		if(err){
			next(null, {code:500,msg:err.message});
		}else if(res != null){
			var rid = res.rid;
			var uid = player_id + '*' + rid;
			self.app.rpc.game.gameRemote.delay_wait_time(session, uid, self.app.get('serverId'), rid,false,function(){
				next(null, {code:200});
			});
		}else{
			next(null, {code:202});
		}
	});
/*}}}*/
};

handler.start_game = function(msg, session, next) {
/*{{{*/
	var self = this;
	var player_id = msg.player_id;
	var rid = msg.rid;

	var uid = player_id + '*' + rid;
	self.app.rpc.game.gameRemote.start_game(session, uid, self.app.get('serverId'), rid,false,function(){
		next(null, {code:200});
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
	app.rpc.game.gameRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'),function(){
		session.unbind(session.uid);
	});
	//app.rpc.chat.chatRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};

