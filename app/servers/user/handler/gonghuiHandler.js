/**
 * Created by WTF Wei on 2016/3/25.
 * Function :
 */

var gonghuiDao = require('../../../dao/gonghuiDao');
var playerDao = require('../../../dao/playerDao');

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
		var gonghui_id  = msg.data.gonghui_id;
		console.log('handler.get_gonghui_by_id..............');
		gonghuiDao.get_gonghui_by_id(gonghui_id, function (err, res) {
			if (err) {
				console.log(err.message + '===========err============');
				console.log(err);
				next(null, {
					code: 500,
					msg: 'find error'
				});
			}else{
				next(null, {
					code: 200,
					msg: res
				});
			}
		});
	}else if(process == "getGonghuiAns"){
		var player_id  = msg.data.player_id;
		console.log('handler.get_gonghui_by_id..............');
		gonghuiDao.get_gonghui_ans_by_player_id(player_id, function (err, res) {
			if (err) {
				console.log(err.message + '===========err============');
				console.log(err);
				next(null, {
					code: 500,
					msg: 'find error'
				});
			}else if(res){
				console.log("getGonghuiAns return code" + 200);
				next(null, {code: 200,msg: res});
			}else{
				console.log("getGonghuiAns return code" + 202);
				next(null, {code: 202,msg:null});
			}
		});
	}else if(process == "xuka"){
		console.log('handler.xuka..................');
		var gonghui_id = msg.data.gonghui_id;
		var player_id = msg.data.player_name;
		var player_name = msg.data.player_name;
		var phone_num = msg.data.data.telphone;
		gonghuiDao.xuka(gonghui_id,player_id,player_name,phone_num, function (err, res) {
			if (err) {
				console.log(err.message + '===========err============');
				console.log(err);
				next(null, {
					code: 500,
					msg: 'creat error'
				});
			}else{
				next(null, {
					code: 200,
					msg: res
				});
			}
		});
	}else if(process == "update_gonghui"){
		console.log('handler.update_gonghui..................');
		var gonghui_id = msg.data.id;
		var danjia = msg.data.danjia;
		var xuanyan = msg.data.xuanyan;
		var gonggao = msg.data.gonggao;
		gonghuiDao.update_gonghui(gonghui_id,danjia,xuanyan,gonggao, function (err, res) {
			if (err) {
				console.log(err.message + '===========err============');
				console.log(err);
				next(null, {
					code: 500,
					msg: 'update error'
				});
			}else{
				next(null, {
					code: 200,
					msg: res
				});
			}
		});
	}else if(process == "join_gonghui"){
		console.log('handler.join_gonghui..................');
		var gonghui_id = msg.data.gonghui_id;
		var player_id = msg.data.player_id;

		gonghuiDao.get_gonghui_by_gonghui_id(gonghui_id, function (err, res) {
			if (err) {
				console.log(err.message + '===========err============');
				console.log(err);
				next(null, {
					code: 500,
					msg: 'find error'
				});
			}else{
				if(res == null){
					next(null,{code:202,msg:null});
				}else{
					playerDao.update_gonghui_id(player_id,gonghui_id,function(err,pres){
						if(err){
							next(null,{code:501,msg:"更新用户表公会ID失败"});
						}else{
							gonghuiDao.sub_gonghui_renshu(gonghui_id,1,function(err,gres){
								if(err){
									next(null,{code:502,msg:"更新公会人数失败"});
								}else{
									next(null,{code:200,msg:gres});
								}
							});
						}
					});
				}
			}
		});
	}else if(process == "shenqing"){
		console.log('handler.add_gonghui..................');
		var player_id = msg.data.player_id;
		var player_name = msg.data.player_name;
		var gonghui_name = msg.data.gonghui_name;
		var telphone = msg.data.telphone;
		var level = msg.data.level;
		gonghuiDao.add_gonghui_ans(player_id,player_name,gonghui_name,telphone,level, function (err, res) {
			if (err) {
				console.log(err.message + '===========err============');
				console.log(err);
				next(null, {code: 500,msg: 'add_gonghui error'});
			}else{
				next(null, {code: 200,msg: res});
			}
		});
	}
}
