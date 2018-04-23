/**
 * Created by wuningjian on 2/22/16.
 */
var crypto = require('crypto');
var TDKGameDao = require("../../../dao/TDKGameDao");
var delayDao = require("../../../dao/delayDao");
var TDKLogicRemote = require("../remote/TDKLogicRemote");
var TDKGameRemote = require("../remote/TDKGameRemote");

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

handler.TDKGameProcess = function(msg,session,next){
	console.log("TDKGameProcess param:"+JSON.stringify(msg));
	var self = this;
	var rid = session.get('rid');
	var uid = session.uid;
	//session.set('readyNum',);
	var username = session.uid.split('*')[0];
	console.log('TDKGameProcess: rid:' + rid + ' uid:' + uid + ' username:' + username);
	var channelService = this.app.get('channelService');
	var channel = channelService.getChannel(rid, false);
	
	//用户发来的msg的游戏处理信息
	var process = msg.process;
	
	//收到发牌准备消息，然后处理进行发牌
	if(process == 'ready'){
		console.log('ready......');
		TDKLogicRemote.ready(rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'follow'){
		console.log('player follow');
		TDKLogicRemote.follow(rid,msg.location,channel,username);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'getpai'){
		console.log('player getpai');
		TDKLogicRemote.fapai_next(rid,msg.location,msg.chip,channel,username);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'add'){
		console.log('player add');
		TDKLogicRemote.add(rid,msg.add_chip,msg.location,channel,username);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'open'){
		console.log('player open');
		/**
		 * param:rid,msg.location,channel
		 * */
		TDKLogicRemote.open(rid,msg.location,channel,username);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'throw'){
		console.log('player throw');
		/**
		 * param:rid,msg.location,channel,username,channelService
		 * */
		TDKLogicRemote.throw(self.app,uid,rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'bipai'){
		console.log('player bipai');
		TDKLogicRemote.bipai(self.app,uid,rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'equal'){
		//比牌发现大小一样 则打点继续进行此时 下的注不清零 直到分出胜负
		console.log('player equal');
		TDKLogicRemote.equal(uid,rid,msg,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'getRoomInfo'){
		console.log('getRoomInfo');
		var app1 = this.app;
		TDKGameRemote(app1).get(uid,channel,channelService,function(err,result){
			next(null,result);
		});
	}else if(process == 'get_uinfo'){
		console.log('get_uinfo');
		TDKLogicRemote.getPlayerInfo(uid,rid,msg.send_from,msg.send_to,channel);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'getRoomPlayersInfo'){
		console.log('getRoomPlayersInfo');
		TDKLogicRemote.getRoomPlayersInfo(uid,rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'quitRoom'){
		console.log('----------quitRoom--------');
		//session, session.uid, app.get('serverId'), session.get('rid'), null
		this.app.rpc.game.TDKGameRemote.kick(session,session.uid,"connector-server-1",rid,function(){
			session.unbind(session.uid);
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
