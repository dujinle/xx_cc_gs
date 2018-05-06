/**
 * Created by wuningjian on 2/22/16.
 */
var crypto = require('crypto');
var gameDao = require("../../../dao/gameDao");
var delayDao = require("../../../dao/delayDao");
var gameLogicRemote = require("../remote/gameLogicRemote");
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

	//收到发牌准备消息，然后处理进行发牌
	if(process == 'ready'){
		console.log('ready......');
	}else if(process == 'qiang'){
		console.log('player qiang zhuang');
		gameLogicRemote.qiang(rid,msg.location,msg.flag,channel,username);
		next(null,{msg:"receive process successfully"});
	}else if(process == 'xiazhu'){
		console.log('player xiazhu');
		gameLogicRemote.xiazhu(rid,msg.location,msg.chips,channel,channelService);
		next(null,{msg:"receive process successfully"});
	}else if(process == 'peipai'){
		console.log('player peipai');
		gameLogicRemote.peipai(rid,msg.location,msg.peipai,msg.select,channel,channelService);
		next(null,{msg:"receive process successfully"});
	}else if(process == 'open'){
		console.log('player open');
		gameLogicRemote.open(rid,msg.location,channel,channelService);
		next(null,{msg:"receive process successfully"});
	}else if(process == 'qieguo'){
		console.log('player qieguo');
		gameLogicRemote.qieguo(rid,msg.location,msg.flag,channel,channelService);
		next(null,{msg:"receive process successfully"});
	}else if(process == 'get_user_info'){
		console.log('player qieguo');
		gameLogicRemote.get_local_player(rid,msg.send_from,msg.location,channel,channelService);
		next(null,{msg:"receive process successfully"});
	}else{
		console.log("Process invalid!");
		next(null,{
			msg:"receive process error"
		});
	}
};

