/**
 * Created by WTF Wei on 2016/3/25.
 * Function :
 */
var Code	  = require('../../../consts/code');
var gonghuiDao = require('../../../dao/gonghuiDao');
var playerDao = require('../../../dao/playerDao');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);


module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

handler.gonghuiProcess = function (msg, session, next) {
	var process = msg.process;

	if(process == "getGonghui"){
		var gonghui_id  = msg.gonghui_id;
		logger.info('handler.get_gonghui_by_id..............');
		gonghuiDao.get_gonghui_by_id(gonghui_id, function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				next(null, {code: Code.OK,msg: res});
			}
		});
	}
	else if(process == "checkGongHuiZhang"){
		var gonghui_id  = msg.gonghui_id;
		var player_id = msg.player_id;
		logger.info('handler.get_gonghui_by_gonghui_id..............');
		gonghuiDao.get_gonghui_by_gonghui_id(gonghui_id, function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				if(res == null){
					next(null, {code: Code.CHECK_GH_ZHANG_FAILD,msg:Code.CODEMSG.USER.CHECK_GH_ZHANG_FAILD});
				}else if(res.player_id == player_id){
					next(null, {code: Code.OK,msg: res});
				}else{
					next(null, {code: Code.CHECK_GH_ZHANG_FAILD,msg:Code.CODEMSG.USER.CHECK_GH_ZHANG_FAILD});
				}
			}
		});
	}
	else if(process == "getGonghuiGongHuiId"){
		var gonghui_id  = msg.gonghui_id;
		logger.info('handler.get_gonghui_by_gonghui_id..............');
		gonghuiDao.get_gonghui_by_gonghui_id(gonghui_id, function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				next(null, {code: Code.OK,msg: res});
			}
		});
	}
	else if(process == "getGonghuiPlayerId"){
		var player_id  = msg.player_id;
		logger.info('handler.get_gonghui_by_player_id..............');
		gonghuiDao.get_gonghui_by_player_id(player_id, function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				next(null, {code: Code.OK,msg: res});
			}
		});
	}
	else if(process == "getGonghuiAns"){
		var player_id  = msg.player_id;
		logger.info('handler.get_gonghui_by_id..............');
		gonghuiDao.get_gonghui_ans_by_player_id(player_id, function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				logger.info("getGonghuiAns return code",Code.OK);
				next(null, {code: Code.OK,msg: res});
			}
		});
	}
	else if(process == "xuka"){
		logger.info('handler.xuka..................');
		var gonghui_id = msg.gonghui_id;
		var player_id = msg.player_name;
		var player_name = msg.player_name;
		var phone_num = msg.telphone;
		gonghuiDao.xuka(gonghui_id,player_id,player_name,phone_num, function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				next(null, {code: Code.OK,msg: Code.CODEMSG.USER.WAIT_GH_XUKA});
			}
		});
	}
	else if(process == "update_gonghui"){
		logger.info('handler.update_gonghui..................');
		var gonghui_id = msg.id;
		var danjia = msg.danjia;
		var xuanyan = msg.xuanyan;
		gonghuiDao.update_gonghui(gonghui_id,danjia,xuanyan,function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				next(null, {code: Code.OK,msg: Code.CODEMSG.USER.UPDATE_GH_INFO});
			}
		});
	}
	else if(process == "join_gonghui"){
		logger.info('handler.join_gonghui..................');
		var gonghui_id = msg.gonghui_id;
		var player_id = msg.player_id;

		gonghuiDao.get_gonghui_by_gonghui_id(gonghui_id, function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				if(res == null){
					next(null,{code:Code.SQL_NULL,msg:Code.CODEMSG.USER.FIND_GH_NULL});
				}else{
					playerDao.update_gonghui_id(player_id,gonghui_id,function(err,pres){
						if(err){
							next(null,{code:Code.SQL_ERROR,msg:err.message});
						}else{
							gonghuiDao.sub_gonghui_renshu(gonghui_id,1,function(err,gres){
								if(err){
									next(null,{code:Code.SQL_ERROR,msg:err.message});
								}else{
									next(null,{code:Code.OK,msg:gres});
								}
							});
						}
					});
				}
			}
		});
	}
	else if(process == "shenqing"){
		logger.info('handler.add_gonghui..................');
		var player_id = msg.player_id;
		var player_name = msg.player_name;
		var gonghui_name = msg.gonghui_name;
		var telphone = msg.telphone;
		var level = msg.level;
		gonghuiDao.add_gonghui_ans(player_id,player_name,gonghui_name,telphone,level, function (err, res) {
			if (err) {
				logger.info(err.message + '===========err============');
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				next(null, {code: Code.OK,msg: res});
			}
		});
	}
}
