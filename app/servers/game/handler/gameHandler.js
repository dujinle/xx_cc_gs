/**
 * Created by wuningjian on 2/22/16.
 */
var crypto = require('crypto');
var gameDao = require("../../../dao/gameDao");
var delayDao = require("../../../dao/delayDao");
var SJGameLogicRemote = require("../remote/SJGameLogicRemote");
var QZGameLogicRemote = require("../remote/QZGameLogicRemote");
var LZGameLogicRemote = require("../remote/LZGameLogicRemote");
var gameRemote = require("../remote/gameRemote");

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

//var gameRemote = require('../remote/gameRemote.js');

handler.game_process = function(msg,session,next){
	console.log("gameHandler gameProcess"+JSON.stringify(msg));
	var self = this;
	var rid = session.get('rid');
	var uid = session.uid;
	//session.set('readyNum',);
	var username = session.uid.split('*')[0];

	var channelService = this.app.get('channelService');
	var channel = channelService.getChannel(rid, false);

	//用户发来的msg的游戏处理信息
	var process = msg.process;
	var game_type = msg.game_type;

	//收到发牌准备消息，然后处理进行发牌
	if(process == 'ready'){
		console.log('ready......');
		if(game_type == 1){
			QZGameLogicRemote.ready(rid,msg.location,channel,username);
		}else if(game_type == 3){
			var lun_zhuang_flag = msg.lun_zhuang_flag;
			LZGameLogicRemote.ready(rid,msg.location,lun_zhuang_flag,channel,username);
		}else{
			SJGameLogicRemote.ready(rid,msg.location,channel,username);
		}
		next(null,{msg:"receive process successfully"});
	}else if(process == 'qiang'){
		console.log('player qiang zhuang');
		SJGameLogicRemote.qiang(rid,msg.location,msg.flag,channel,username);
		next(null,{msg:"receive process successfully"});
	}else if(process == 'xiazhu'){
		console.log('player xiazhu');
		if(game_type == 1){
			QZGameLogicRemote.xiazhu(rid,msg.location,msg.chips,channel,channelService);
		}else if(game_type == 3){
			LZGameLogicRemote.xiazhu(rid,msg.location,msg.chips,channel,channelService);
		}else{
			SJGameLogicRemote.xiazhu(rid,msg.location,msg.chips,channel,channelService);
		}
		next(null,{msg:"receive process successfully"});
	}else if(process == 'peipai'){
		console.log('player peipai');
		if(game_type == 1){
			QZGameLogicRemote.peipai(rid,msg.location,msg.peipai,msg.select,channel,channelService);
		}else if(game_type == 3){
			LZGameLogicRemote.peipai(rid,msg.location,msg.peipai,msg.select,channel,channelService);
		}else{
			SJGameLogicRemote.peipai(rid,msg.location,msg.peipai,msg.select,channel,channelService);
		}
		next(null,{msg:"receive process successfully"});
	}else if(process == 'open'){
		console.log('player open');
		if(game_type == 1){
			QZGameLogicRemote.open(rid,msg.location,channel,channelService);
		}else if(game_type == 3){
			LZGameLogicRemote.open(rid,msg.location,channel,channelService);
		}else{
			SJGameLogicRemote.open(rid,msg.location,channel,channelService);
		}
		next(null,{msg:"receive process successfully"});
	}else if(process == 'qieguo'){
		console.log('player qieguo');
		if(game_type == 1){
			QZGameLogicRemote.qieguo(rid,msg.location,msg.flag,channel,channelService);
		}else if(game_type == 3){
			LZGameLogicRemote.qieguo(rid,msg.location,msg.flag,channel,channelService);
		}else{
			SJGameLogicRemote.qieguo(rid,msg.location,msg.flag,channel,channelService);
		}
		next(null,{msg:"receive process successfully"});
	}else if(process == 'get_user_info'){
		console.log('player get_user_info');
		if(game_type == 1){
			QZGameLogicRemote.get_local_player(rid,msg.send_from,msg.location,channel,channelService);
		}else if(game_type == 3){
			LZGameLogicRemote.get_local_player(rid,msg.send_from,msg.location,channel,channelService);
		}else{
			SJGameLogicRemote.get_local_player(rid,msg.send_from,msg.location,channel,channelService);
		}
		next(null,{msg:"receive process successfully"});
	}else if(process == 'send_gift'){
		console.log('player send_gift');
		if(game_type == 1){
			QZGameLogicRemote.send_gift(rid,msg.send_from,msg.send_to,msg.type,channel,channelService);
		}else if(game_type == 3){
			LZGameLogicRemote.send_gift(rid,msg.send_from,msg.send_to,msg.type,channel,channelService);
		}else{
			SJGameLogicRemote.send_gift(rid,msg.send_from,msg.send_to,msg.type,channel,channelService);
		}
		next(null,{msg:"receive process successfully"});
	}else{
		console.log("Process invalid!");
		next(null,{
			msg:"receive process error"
		});
	}
};

