/**
 * Created by WTF Wei on 2016/3/25.
 * Function :
 */

var gBroadcastDao = require('../../../dao/gBroadcastDao');
var playerDao = require('../../../dao/playerDao');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);


module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

handler.gongGaoProcess = function(msg,session,next){
	var process = msg.process;
	if(process == "get_gonggao"){
		var type = msg.type;
		gBroadcastDao.getRowByType(type,function(err, res){
			if(err){
				logger.info(err.message + '===========err============');
				next(null, {code: 500,msg: err.message});
			}else if(res != null){
				next(null, {code: 200,msg: res});
			}else{
				next(null, {code: 200,msg: "娱乐游戏！"});
			}
		});
	}
};
