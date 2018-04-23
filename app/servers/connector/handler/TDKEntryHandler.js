var Code  = require('../../../consts/code');
var userDao   = require('../../../dao/userDao');
var playerDao = require('../../../dao/playerDao');
var TDKGameDao   = require('../../../dao/TDKGameDao');

var asyn = require('async');


module.exports = function (app) {
	return new Handler(app);
};

var Handler = function (app) {
	this.app = app;
};


var handler = Handler.prototype;

handler.create = function(msg, session, next) {
	console.log("handler.create:" + JSON.stringify(msg));
	var playerId = msg.playerId;
	var roomType = msg.roomType;
	var totalRound = msg.juShu;
	var fangKa = msg.fangKa;
	var faPaiNum = msg.faPaiNum;
	var quChuPai = msg.quChuPai;
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
				TDKGameDao.createRoomByPlayerId(playerId,player.nickName,roomType,faPaiNum,totalRound,100,quChuPai, function(err,res){
					console.log('create room succ:' + JSON.stringify(res));

					var rid = res;
					var uid = playerId + '*' + rid;
					session.bind(uid);
					console.log('session bind uid:' + session.uid);
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
					self.app.rpc.game.TDKGameRemote.add(session,uid, self.app.get('serverId'), rid, true, function(location){
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

	TDKGameDao.returnRoom(roomNum, function(err,res){

		if(res == null){
			next(null,{
				error:'没有找到房间号'
			});
			return true;
		}
		if(res.player_num == 5){
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
		self.app.rpc.game.TDKGameRemote.add(session, uid, self.app.get('serverId'), rid, true, function(location){
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
	TDKGameDao.getPlayerLocal(rid,playerId,function(err,location){
		if(location != null){
			app.rpc.game.TDKGameRemote.kick(session,session.uid,"connector-server-1", session.get('rid'),function(location){
				session.unbind(session.uid);
				console.log("kick from loginout......");
			});
		}
	});
};

