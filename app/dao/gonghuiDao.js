/**
 * Created by WTF on 2016/2/25.
 */
var utils  = require('../util/utils');
var pomelo = require('pomelo');
var Code = require('../consts/code');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);


//直接暴露模块的方法使用时无需在new
var gonghuiDao = module.exports;

var self = this;
gonghuiDao.get_gonghui_by_id = function (id, cb) {
	logger.info('go into gonghuiDao.get_gonghui_by_id', id);
	var sql  = 'select * from gonghui where id = ?';
	var args = [id];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err !== null) {
			logger.info(err);
			logger.info('gonghuiDao.get_gonghui_by_id pomelo.app.get err');
			utils.invokeCallback(cb, err.message, null);
		} else {
			if (!!res && res.length === 1) {
				logger.info('cd gonghuiDao.get_gonghui_by_id from db', 'ok');
				var rs   = res[0];
				utils.invokeCallback(cb, null,rs);
			} else {
				logger.info('gonghuiDao.get_gonghui_by_id pomelo.app.get user not exist');
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

gonghuiDao.get_gonghui_by_gonghui_id = function (gonghui_id, cb) {
	logger.info('go into gonghuiDao.get_gonghui_by_id', gonghui_id);
	var sql  = 'select * from gonghui where gonghui_id = ?';
	var args = [gonghui_id];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err !== null) {
			logger.info('gonghuiDao.get_gonghui_by_id pomelo.app.get err');
			utils.invokeCallback(cb, err.message, null);
		} else {
			if (!!res && res.length === 1) {
				logger.info('cd gonghuiDao.get_gonghui_by_id from db', 'ok');
				var rs   = res[0];
				utils.invokeCallback(cb, null,rs);
			} else {
				logger.info('gonghuiDao.get_gonghui_by_id pomelo.app.get user not exist');
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

gonghuiDao.get_gonghui_by_player_id = function (player_id, cb) {
	logger.info('go into gonghuiDao.get_gonghui_by_player_id', player_id);
	var sql  = 'select * from gonghui where player_id = ?';
	var args = [player_id];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err !== null) {
			logger.info(err);
			utils.invokeCallback(cb, err.message, null);
		} else {
			if (!!res && res.length === 1) {
				var rs   = res[0];
				utils.invokeCallback(cb, null,rs);
			} else {
				logger.info('gonghuiDao.get_gonghui_by_player_id not exist');
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

gonghuiDao.xuka = function (gonghui_id,player_id,player_name,phone_num, cb) {
	var sql = 'insert into xufangka(gonghui_id,player_id,player_name,phone_num,creat_time,xuaka_status) values(?,?,?,?,?,?)';
	var loginTime = Date.now();
	var args      = [gonghui_id,player_id,player_name,phone_num,loginTime,0];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err !== null) {
			logger.info('gonghuiDao.xuka');
			logger.info(err.message);//ER_DUP_ENTRY: Duplicate entry '' for key 'INDEX_ACCOUNT_USERNAME'
			logger.info(err);
			utils.invokeCallback(cb, err.message, null);
		} else {
			logger.info('gonghuiDao.xuka succ insertId:' + res.insertId);
			utils.invokeCallback(cb,null, res.insertId);
		}
	});
};

gonghuiDao.sub_gonghui_renshu = function (gonghui_id,value, cb) {
	var sql       = 'update gonghui set renshu = renshu + ? where gonghui_id = ?';
	var args      = [value,gonghui_id];

	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if(err){
			utils.invokeCallback(cb, err.message, null);
		}else{
			if(!res || res.length <= 0){
				utils.invokeCallback(cb, null, null);
			}else{
				var rs = res[0];
				utils.invokeCallback(cb, null, rs);
			}
		}
	});
};

gonghuiDao.update_gonghui = function (gonghui_id,danjia,xuanyan, cb) {
	var sql       = 'update gonghui set danjia = ?,xuanyan = ? where id = ?';
	var args      = [danjia, xuanyan,gonghui_id];

	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if(err){
			utils.invokeCallback(cb, err.message, null);
		}else{
			utils.invokeCallback(cb, null, gonghui_id);
		}
	});
};

gonghuiDao.add_gonghui_ans = function(player_id,player_name,gonghui_name,telphone,level,cb){
	var sql       = 'insert into gonghui_ans(player_id,player_name,gonghui_name,telphone,level,creat_time,status,money) values(?,?,?,?,?,?,?,?)';
	var loginTime = Date.now();
	var money = 1000;
	if(level == 2){
		money = 2000;
	}else if(level == 3){
		money = 5000;
	}
	var args      = [player_id,player_name,gonghui_name,telphone,level,loginTime,0,money];

	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if(err){
			utils.invokeCallback(cb, err.message, null);
		}else{
			utils.invokeCallback(cb, null, res.insertId);
		}
	});
};

gonghuiDao.get_gonghui_ans_by_player_id = function(player_id,cb){
	logger.info('go into gonghuiDao.get_gonghui_ans_by_player_id', player_id);
	var sql  = 'select * from gonghui_ans where player_id = ?';
	var args = [player_id];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err !== null) {
			logger.info(err);
			logger.info('gonghuiDao.get_gonghui_by_id pomelo.app.get err');
			utils.invokeCallback(cb, err.message, null);
		} else {
			if (!!res && res.length === 1) {
				logger.info('cd gonghuiDao.get_gonghui_by_id from db', 'ok');
				var rs   = res[0];
				utils.invokeCallback(cb, null,rs);
			} else {
				logger.info('gonghuiDao.get_gonghui_by_id pomelo.app.get user not exist');
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};
