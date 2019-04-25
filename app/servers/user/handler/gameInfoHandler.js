/**
 * Created by WTF Wei on 2016/3/25.
 * Function :
 */
var Code	  = require('../../../consts/code');
var gameInfoDao = require('../../../dao/gameInfoDao');
var playerDao = require('../../../dao/playerDao');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

handler.gameInfoProcess = function (msg, session, next) {
	var process = msg.process;

	if(process == "getBuyFangkaList"){
		var index = msg.index;
		var length = msg.length;
		var player_id = msg.player_id;
		logger.info('handler.get_buy_fangka_list..............');
		gameInfoDao.get_buy_fangka_list(player_id,index,length, function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: 500,msg: 'find error'});
			}else{
				next(null, {code: 200,msg: res});
			}
		});
	}else if(process == "getGameHistoryList"){
		var index = msg.index;
		var length = msg.length;
		var player_id = msg.player_id;
		logger.info('handler.get_game_history_list..............');
		gameInfoDao.get_game_history_list(player_id,index,length, function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				logger.info(err);
				next(null, {code: 500,msg: 'find error'});
			}else{
				next(null, {code: 200,msg: res});
			}
		});
	}else if(process == "update_game"){
		var data = msg;
		gameInfoDao.update_game(data,function(err,res){
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				next(null, {code: Code.OK,msg: res});
			}
		});
	}
}
