/**
 * Created by WTF on 2016/2/25.
 */
var utils  = require('../util/utils');
var pomelo = require('pomelo');
var Code = require('../consts/code');


//直接暴露模块的方法使用时无需在new
var paijiuDao = module.exports;

var self = this;
paijiuDao.get_paijiu_by_paixing = function (paixing, cb) {
	console.log('get_paijiu_by_paixing' + paixing);
	var sql  = 'select * from paijiu where paixing = ?';
	var args = [paixing];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (!!err) {
			console.error(err);
			utils.invokeCallback(cb, err.message, null);
		} else {
			console.log("get_paijiu_by_paixing:" + JSON.stringify(res));
			if (!!res && res.length == 1) {
				utils.invokeCallback(cb, null, res[0]);
			} else {
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

