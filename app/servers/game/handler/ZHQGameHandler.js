/**
 * Created by wuningjian on 2/22/16.
 */
var crypto = require('crypto');
var ZHQGameDao = require("../../../dao/ZHQGameDao");
var delayDao = require("../../../dao/delayDao");
var ZHQLogicRemote = require("../remote/ZHQLogicRemote");
var ZHQGameRemote = require("../remote/ZHQGameRemote");

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

handler.ZHQGameProcess = function(msg,session,next){
	console.log("gameHandler ZHQGameProcess"+JSON.stringify(msg));
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
	if(process == 'start'){
		console.log('start......');
		//房主发出开始的信号开始发牌
		ZHQLogicRemote.start(rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'ready'){
		console.log('ready......');
		//房主发出开始的信号开始发牌
		ZHQLogicRemote.ready(rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'chupai'){
		console.log('player chupai');
		ZHQLogicRemote.chupai(rid,msg.chupai,channel,username);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'howmany'){
		console.log('player howmany');
		ZHQLogicRemote.howMany(rid,msg.location,channel,username);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'pass'){
		 console.log('player pass');
		ZHQLogicRemote.pass(rid,msg.location,channel,username);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'chutip'){
		console.log('player chutip');
		//每一次点牌都提示是否可以出牌
		ZHQLogicRemote.chuPaiTip(rid,msg.chupai,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'jiefeng'){
		console.log('player jiefeng');
		//上一个玩家出牌结束 则下一个玩家可以借风出牌
		ZHQLogicRemote.jieFeng(rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'throw'){
		console.log('player throw');
		//牌不好准备投降
		ZHQLogicRemote.throw(rid,msg.location,msg.flag,channel,username);

		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'liangA'){
		console.log('player liangA');
		console.log('msg'+JSON.stringify(msg));
		//有黑A 可以亮出来寻找伙伴
		ZHQLogicRemote.markA(rid,msg.mark,channel,username);

		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'markT'){
		console.log('player markT');
		//有人亮A的时候 反T 有炸可以
		ZHQLogicRemote.markT(self.app,uid,rid,msg.chupai,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'get_uinfo'){
		console.log('get_uinfo');
		ZHQLogicRemote.getPlayerInfo(uid,rid,msg.send_from,msg.send_to,channel);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'getRoomInfo'){
		console.log('getRoomInfo');
		var app1 = this.app;
		ZHQGameRemote(app1).get(uid,channel,channelService,function(err,result){
			next(null,result);
		});
	}else if(process == 'getRoomPlayersInfo'){
		console.log('getRoomPlayersInfo');
		ZHQLogicRemote.getRoomPlayersInfo(uid,rid,msg.location,channel,username,channelService);
		next(null,{
			msg:"receive process successfully"
		});
	}else if(process == 'quitRoom'){
		console.log('----------quitRoom--------');
		//session, session.uid, app.get('serverId'), session.get('rid'), null
		this.app.rpc.game.ZHQGameRemote.kick(session,session.uid,"connector-server-1",session.get('rid'),function(){
			session.unbind(session.uid);
			next(null,'kick successful');
		});
	}else{
		console.log("Process invalid!");
		next(null,{
			msg:"receive process error"
		});
	}
};

