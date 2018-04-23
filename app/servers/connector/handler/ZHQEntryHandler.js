var Code  = require('../../../consts/code');
var userDao   = require('../../../dao/userDao');
var playerDao = require('../../../dao/playerDao');
var ZHQGameDao   = require('../../../dao/ZHQGameDao');

var asyn = require('async');


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
 * @param  {Object}   msg  msg.token request message
 * @param  {Object}   session current session object
 * @param  {Function} next next step callback
 * @return {Void}
 */
Handler.prototype.entry = function (msg, session, next) {
	var token = msg.token, self = this;
	console.log(__filename,'entry ok ====token: ',token);
	if (!token) {
		next(new Error('invalid entry request: empty token'), {code: 500,msg:"token empty"});
		return;
	}

	var userId, player, task, USER;
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

			userId = user.userId;
			USER =user;
			playerDao.getPlayerByUserId(user.userId, cb);
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
			session.set('playerId', player.playerId);
			session.push('playerId', function(err) {
				if(err) {
					console.error('set rid for session service failed! error is : %j', err.stack);
				}
			});
			next(null,{code:Code.OK,msg:'get user player task ok',initdata:{user:USER,player:player}});
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
	var playerId = msg.playerId;
	var roomType = msg.roomType;
	var maxChip = msg.maxChip;
	var tianXuan = msg.tianXuan;
	var totalRound = msg.juShu;
	var renShu = msg.renShu;
	var fangKa = msg.fangKa;
	var self = this;
	playerDao.getPlayerByPlayerId(playerId,function(err,player){
		playerDao.getFangKa(playerId,function(err,refangka){
			if(refangka < fangKa){
				console.log("fangka have no enough");
				next(null, {
					error:"房卡数量不足",
				});
				return false;
			}
			playerDao.subFangKa(playerId,fangKa,function(err,code){
				ZHQGameDao.createRoomByPlayerId(playerId,player.nickName,roomType,tianXuan,totalRound,100,maxChip,renShu, function(err,res){
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
					self.app.rpc.game.ZHQGameRemote.add(session,uid, self.app.get('serverId'), rid, true, function(location){
						next(null, {
							location:location
						});
					});
				});
			});
		});
	});
};

handler.enter = function(msg, session, next) {
	var self = this;
	playerId = msg.playerId;
	roomType = msg.roomType;
	roomNum = msg.roomNum;

	ZHQGameDao.returnRoom(roomNum, function(err,res){

		if(res == null){
			next(null,{
				error:'没有找到房间号'
			});
			return true;
		}
		if(res.player_num == res.all_player_num){
			next(null,{
				error:"人员已经满了"
			});
			return true;
		}
		var rid = res.rid.toString();

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
		self.app.rpc.game.ZHQGameRemote.add(session, uid, self.app.get('serverId'), rid, true, function(location){
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
	console.log('loginout .......' + session.uid);
	var rid = parseInt(session.uid.split("*")[1]);
	var playerId = session.uid.split("*")[0];
	ZHQGameDao.getPlayerLocal(rid,playerId,function(err,location){
		if(location != null){
			app.rpc.game.ZHQGameRemote.kick(session,session.uid,"connector-server-1", session.get('rid'),function(location){
				session.unbind(session.uid);
				console.log("kick from loginout......");
			});
		}
	});
};

