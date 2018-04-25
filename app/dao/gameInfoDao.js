/**
 * Created by WTF on 2016/2/25.
 */
var utils  = require('../util/utils');
var pomelo = require('pomelo');
var Code = require('../consts/code');


//直接暴露模块的方法使用时无需在new
var gameInfoDao = module.exports;

var self = this;

gameInfoDao.get_buy_fangka_list = function(player_id,index,length,cb){
	var sql = 'select * from buy_fangka where player_id = ? order by creat_time limit ?,?';

	var args = [player_id,index,index +length];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err !== null) {
			console.log(err.message);//ER_DUP_ENTRY: Duplicate entry '' for key 'INDEX_ACCOUNT_USERNAME'
			utils.invokeCallback(cb, err.message, null);
		} else {
			console.log('gameInfoDao creater by imei ok  user:' + JSON.stringify(res));
			utils.invokeCallback(cb,null,res);
		}
	});
};

gameInfoDao.get_game_history_list = function(player_id,index,length,cb){
	var sql = 'select * from game_history where player_id = ? order by creat_time limit ?,?';

	var args = [player_id,index,index + length];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err !== null) {
			console.log(err.message);//ER_DUP_ENTRY: Duplicate entry '' for key 'INDEX_ACCOUNT_USERNAME'
			utils.invokeCallback(cb, err.message, null);
		} else {
			console.log('gameInfoDao creater by imei ok  user:' + JSON.stringify(res));
			utils.invokeCallback(cb,null,res);
		}
	});
};
