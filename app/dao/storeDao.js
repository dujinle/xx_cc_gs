/**
 * Created by WTF on 2016/2/25.
 */
var utils  = require('../util/utils');
var pomelo = require('pomelo');
var Code = require('../consts/code');


//直接暴露模块的方法使用时无需在new
var storeDao = module.exports;

var self = this;

storeDao.creat_order = function(player_id,fangka_num,zongjia,danjia,cb){
	var sql       = 'insert into buy_fangka(order_id,player_id,fangka_num,zongjia,danjia,creat_time,status) values(?,?,?,?,?,?,?)';
	var loginTime = Date.now();
	var order_id = utils.get_uuid();

	var args = [order_id,player_id,fangka_num,zongjia,danjia,loginTime,0];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err !== null) {
			console.log(err.message);//ER_DUP_ENTRY: Duplicate entry '' for key 'INDEX_ACCOUNT_USERNAME'
			utils.invokeCallback(cb, err.message, null);
		} else {
			console.log('createUserByImei succ insertId:' + res.insertId);
			console.log('storeDao creater by imei ok  user:' + JSON.stringify(res));
			storeDao.get_order_by_id(res.insertId, cb);
		}
	});
};

storeDao.get_order_by_id = function (id,cb) {
	console.log('cd storeDao.login', userId + ' : ' + password)
	var sql  = 'select * from buy_fangka where id =?';
	var args = [userId];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err) {
			utils.invokeCallback(cb, err.message, null);
		} else {
			if (!res || res.length <= 0) {
				utils.invokeCallback(cb, null, null);
			} else {
				var rs = res[0];
				utils.invokeCallback(cb, null, rs);
			}
		}
	});
};
