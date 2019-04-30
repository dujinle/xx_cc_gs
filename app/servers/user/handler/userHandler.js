/**
 * Created by WTF Wei on 2016/3/25.
 * Function :
 */
var Code	  = require('../../../consts/code');
var playerDao = require('../../../dao/playerDao');
var userDao = require('../../../dao/userDao');

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

handler.userInfoProcess = function(msg,session,next){
	var process = msg.process;
	if(process == "get_player"){
		var player_id  = msg.player_id;
		console.log('handler.get_player ', player_id);
		console.log('start go into playerDao.updatePlayerInfo.......');
		playerDao.get_player_by_id(player_id, function (err, res) {
			if (err) {
				console.log(err.message + '===========err============');
				console.log(err);
				next(null, {code: Code.SQL_ERROR,msg: err.message});
			}else{
				next(null, {code: Code.OK,msg: res});
			}
		});
	}
}

handler.feedback = function(msg,session,next){
    var playerId = msg.playerId,
        title = msg.title,
        content = msg.content;
    if(!!playerId&&!!title&&!!content){
        playerDao.feedback(playerId,title,content,function(err,code){
            if(!!err){
                next(null,{code:500,msg:'反馈失败'});
            }else{
                if(code==200){
                    next(null,{code:200,msg:'反馈成功'});
                }else{
                    next(null,{code:500,msg:'反馈err'});
                }
            }
        });
    }else{
        next(null,{code:500,msg:'反馈参数错误'});
    }
}
handler.portrait = function (msg, session, next) {
}
