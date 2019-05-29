/**
 * Created by WTF Wei on 2016/3/25.
 * Function :
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var playerDao = require('../../../dao/playerDao');
var userDao = require('../../../dao/userDao');
var gameDao = require('../../../dao/gameDao');

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

/**
 * 通过roomNum获取房间信息
 * @param msg
 * @param session
 * @param next
 */
handler.getRoomInfo = function (msg, session, next) {
	var roomNum = msg.roomNum;
	logger.info('go into game request room handler by roomnum',roomNum);

	if (!roomNum) {
		next(null, {code: 500, msg: 'roomNum is empty'});
		return;
	}
	gameDao.getRoomByRoomNum(roomNum, function (err, room) {
		if (!!err) {
			logger.info('deal mysql error:',err);
			next(null, {code: 500, msg: 'err'});
			return;
		}
		if (!room) {
			next(null, {code: 200, msg:room});
		}else{
			logger.info('go into game request room handler by roomnum == ',JSON.stringify(room));
			next(null, {code: 200, msg:null});
		}
	});
};
