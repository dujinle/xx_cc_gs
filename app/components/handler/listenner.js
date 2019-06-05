/**
 * Created by WTF on 2016/3/9.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var Redis = require('ioredis');
var pomelo = require('pomelo');
var redis = new Redis();
var gameDao = require("../../dao/gameDao");
var Code	= require('../../consts/code');

var LZGameLogicRemote = require("../../servers/game/remote/LZGameLogicRemote");
var QZGameLogicRemote = require("../../servers/game/remote/QZGameLogicRemote");
var SJGameLogicRemote = require("../../servers/game/remote/SJGameLogicRemote");
//var delayDao = require('../dao/delayDao');

module.exports = function(app) {
    return new Listenner(app);
};


var DEFAULT_INTERVAL = 3000;

var Listenner = function(app) {
    this.app = app;
    this.interval = DEFAULT_INTERVAL;
    this.timerId = null;
	this.cache = app.get('cache');
    //this.gameDao = require('../dao/gameDao');
    //this.gameLogicRemote = require('../game/remote/gameLogicRemote');
	var self = this;
    redis.select(9, function(err) {
        if(err) process.exit(4);
        redis.subscribe("__keyevent@9__:expired", function() {
            logger.info("--------add expired channel ok");
        });
        redis.subscribe("__keyevent@9__:del",function(){
            logger.info("--------add del channel ok");
        });
    });

    // 监听从订阅频道来的消息
    redis.on("message", function(sub,key){
        logger.info('get message');
        logger.info(sub,key,'del-------expiredc');
        //example key表示pomelo的一个channel名(也就是addDelay传入的channel参数)
		
        var rid = key.split('*')[1];
		var username = key.split('*')[0];
		if(rid == null){
			rid = username;
		}
		//获取channel之后，向该channel发送消息
		var channelService = app.get('channelService');
		var channel = channelService.getChannel(rid, false);
		if(channel == null){
			return;
		}
		gameDao.get_room_by_room_id(rid,function(err,room_info){
			if(room_info.is_gaming == Code.GAME.START){
				if(room_info.game_type == 1){
					 QZGameLogicRemote.timeOutLogic(rid,self.cache,channel,channelService);
				}
				if(room_info.game_type == 2){
					 SJGameLogicRemote.timeOutLogic(rid,self.cache,channel,channelService);
				}
				if(room_info.game_type == 3){
					 LZGameLogicRemote.timeOutLogic(rid,self.cache,channel,channelService);
				}
			}else{
				gameDao.get_player_local(rid,username,function(err,location){
					gameDao.dissolve_room(rid,function(err,res){
						if(location != null){
							var p = {
								'route':'onQuit',
								'location':location
							};
							channel.pushMessage(p);
							self.cache.del(rid);
						}
					});
				});
			}
		});
    });
};

Listenner.name = '__Listenner__';

Listenner.prototype.start = function (cb) {
    logger.info('Listenner Start');
    var self = this;

    process.nextTick(cb);
};

Listenner.prototype.afterStart = function (cb) {
    var self = this;
    console.log('start calling gate');
    //var sessionService = self.app.get('sessionService');
    //var channelService = self.app.get('channelService');
    //var channel = channelService.getChannel("20", false);

    //var param = {
    //    route:'onNext',
    //    next:'next'
    //};
    //
    //var user = channel.getMembers;
    //
    //console.log("channel member:"+user);
    //
    //channel.pushMessage(param);

    process.nextTick(cb);
};

Listenner.prototype.stop = function (force, cb) {
    console.log('Listenner World stop');
    clearInterval(this.timerId);
    process.nextTick(cb);
};