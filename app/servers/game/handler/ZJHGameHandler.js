/**
 * Created by wuningjian on 2/22/16.
 */
var crypto = require('crypto');
var ZJHGameDao = require("../../../dao/ZJHGameDao");
var delayDao = require("../../../dao/delayDao");
var ZJHLogicRemote = require("../remote/ZJHLogicRemote");
var ZJHGameRemote = require("../remote/ZJHGameRemote");

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

handler.ZJHGameProcess = function(msg,session,next){
	console.log("ZJHGameprocess gameProcess"+JSON.stringify(msg));
	console.log("ZJHGameprocess gameProcess rid:" + session.get('rid') + " uid:" + session.uid);
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
		ZJHLogicRemote.ready(rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'follow'){
		console.log('player follow');
		ZJHLogicRemote.follow(rid,msg.location,channel,username);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'add'){
		console.log('player add');
		ZJHLogicRemote.add(rid,msg.add_chip,msg.location,channel,username);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'open'){
		console.log('player open');
		ZJHLogicRemote.open(rid,msg.location,channel,username);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'throw'){
		console.log('player throw');
		ZJHLogicRemote.throw(self.app,uid,rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'bipai'){
		console.log('player bipai');
		ZJHLogicRemote.bipai(uid,rid,msg.location1,msg.location2,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'getRoomInfo'){
		console.log('getRoomInfo');
		var app1 = this.app;
		ZJHGameRemote(app1).get(uid,channel,channelService,function(err,result){
			next(null,result);
		});
		/*
		ZJHGameDao.getRoomInfo(rid,function(err,res){
			next(null,res);
		});
		*/
	}else if(process == 'getRoomPlayersInfo'){
		console.log('getRoomPlayersInfo');
		ZJHLogicRemote.getRoomPlayersInfo(uid,rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'get_uinfo'){
		console.log('get_uinfo');
		ZJHLogicRemote.getPlayerInfo(uid,rid,msg.send_from,msg.send_to,channel);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'quitRoom'){
		console.log('----------quitRoom--------');
		//session, session.uid, app.get('serverId'), session.get('rid'), null
		this.app.rpc.game.ZJHGameRemote.kick(session,session.uid,"connector-server-1",rid,function(){
			session.unbind(session.uid);
			console.log('session.unbind:' + session.uid);
			next(null,'kick successful');
		});
	}
	else{
		console.log("Process invalid!");
		next(null,{
			msg:"receive process error"

		});
	}
};

