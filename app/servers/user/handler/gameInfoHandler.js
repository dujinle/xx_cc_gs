/**
 * Created by WTF Wei on 2016/3/25.
 * Function :
 */

var gameInfoDao = require('../../../dao/gameInfoDao');
var playerDao = require('../../../dao/playerDao');

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
		var index = msg.data.index;
		var length = msg.data.length;
		var player_id = msg.data.player_id;
		console.log('handler.get_buy_fangka_list..............');
		gameInfoDao.get_buy_fangka_list(player_id,index,length, function (err, res) {
			if (err) {
				console.log(err.message + '===========err============');
				console.log(err);
				next(null, {code: 500,msg: 'find error'});
			}else{
				next(null, {code: 200,msg: res});
			}
		});
	}else if(process == "getGameHistoryList"){
		var index = msg.data.index;
		var length = msg.data.length;
		var player_id = msg.data.player_id;
		console.log('handler.get_game_history_list..............');
		gameInfoDao.get_game_history_list(player_id,index,length, function (err, res) {
			if (err) {
				console.log(err.message + '===========err============');
				console.log(err);
				next(null, {code: 500,msg: 'find error'});
			}else{
				next(null, {code: 200,msg: res});
			}
		});
	}
}
