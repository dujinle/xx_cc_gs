/**
 * Created by WTF on 2016/2/25.
 */
var utils  = require('../util/utils');
var pomelo = require('pomelo');
var playerDao = require('./playerDao');
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
			utils.invokeCallback(cb, err, null);
		} else {
			console.log('gameInfoDao creater by imei ok  user:' + JSON.stringify(res));
			utils.invokeCallback(cb,null,res);
		}
	});
};

gameInfoDao.get_game_history_list = function(player_id,index,length,cb){
	var sql = 'select * from game_history where location1 = ? or location2 = ? or location3 = ? or location4 = ? order by creat_time limit ?,?';

	var args = [player_id,player_id,player_id,player_id,index,index + length];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err !== null) {
			console.log(err.message);//ER_DUP_ENTRY: Duplicate entry '' for key 'INDEX_ACCOUNT_USERNAME'
			utils.invokeCallback(cb, err, null);
		} else {
			console.log('gameInfoDao get_game_history_list:',JSON.stringify(res));
			utils.invokeCallback(cb,null,res);
		}
	});
};

gameInfoDao.update_game = function(room_info,cb){
	var sql = 'insert into game_history (location1,location2,location3,location4,renshu,status,creat_time,room_num,game_type,score1,score2,score3,score4) values(?,?,?,?,?,?,?,?,?,?,?,?,?)';
	var locations = [];
	var scores = [];
	for(var i = 1;i < 5;i++){
		var my_location = room_info['location' + i];
		var gold = room_info['left_score_' + i];
		if(my_location != null && my_location != 'null'){
			var player_id = my_location.split('*')[0];
			locations.push(player_id);
		}else{
			locations.push(-1);
		}
		if(i == room_info.zhuang_location){
			gold = gold - room_info.zhuang_score;
		}
		scores.push(gold);
	}
	var args = [locations[0],locations[1],locations[2],locations[3],room_info.real_num,room_info.is_gaming,room_info.creat_time,room_info.room_num,room_info.game_type,scores[0],scores[1],scores[2],scores[3]];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err !== null) {
			console.log(err.message);//ER_DUP_ENTRY: Duplicate entry '' for key 'INDEX_ACCOUNT_USERNAME'
			utils.invokeCallback(cb, err, null);
		} else {
			console.log('gameInfoDao update game history success:',JSON.stringify(res));
			//playerDao.update_game_info(data,cb);
		}
	});
}
