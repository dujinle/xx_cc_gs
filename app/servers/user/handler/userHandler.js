/**
 * Created by WTF Wei on 2016/3/25.
 * Function :
 */

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
		var player_id  = msg.data.player_id;
		console.log('handler.get_player ', player_id);
		if (!!player_id) {
			console.log('start go into playerDao.updatePlayerInfo.......');
			playerDao.get_player_by_id(player_id, function (err, res) {
				if (err) {
					console.log(err.message + '===========err============');
					console.log(err);
					next(null, {code: 500,msg: 'find error'});
				}else{
					next(null, {code: 200,msg: res});
				}
			});
		}
	}
}
/**
 * 更新用户信息 签名 性别 昵称
 * @param msg
 * @param session
 * @param next
 */
handler.updateInfo = function (msg, session, next) {
    var playerId  = msg.playerId;
    var signature = msg.signature;
    var gender    = msg.gender;
    var nickName  = msg.nickName;
    console.log('handler.updateInfo id signature gender nickname', playerId + signature + gender + nickName);

    if (!!playerId && !!signature && !!gender && !!nickName) {
		console.log('start go into playerDao.updatePlayerInfo.......');
        playerDao.updatePlayerInfo(msg.playerId, signature, gender, nickName, function (err, res) {
            if (err) {
                console.log(err.message + '===========err============');
                console.log(err);
                next(null, {
                    code: 500,
                    msg: '保存失败'
                });
            }
            if (res == 200) {
                next(null, {
                    code: 200,
                    msg: '保存成功'
                });
            }
        });
    }
}

handler.getPlayerInfo = function (msg, session, next) {
    var playerId  = msg.playerId;
    console.log('handler.getPlayerInfo id playerId', playerId);

    if (!!playerId) {
		console.log('start go into playerDao.updatePlayerInfo.......');
        playerDao.getPlayerByPlayerId(msg.playerId, function (err, res) {
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
    }
}

/**
 * 功能:更改账号之后保存账号信息到持久化-->重新加载loadGame获取新用户信息
 * 完善用户帐户
 * @param msg msg.userName用户名 msg.password新密码 msg.userId
 * @param session
 * @param next
 */
handler.updateAccount = function(msg,session,next){
    var userId = msg.userId;
    var userName = msg.userName;
    var password = msg.password;

    if(!!userId&&!!userName&&!!password){
        userDao.getUserByName(userName,function(err,user){
            if(!!err){
                console.error(err);
                next(null,{code:500,msg:'查找用户出错'});
            }else{
                if(!!user){
                    next(null,{code:501,msg:'用户名已存在'});
                }else{
                    userDao.setUserName(userId,userName,password,function(err,res){
                       if(!!err){
                            console.log(err);
                           next(null,{code:500,msg:'改名出错'});
                       } else{
                           if(res==200){
                               next(null,{code:200,msg:'完善信息成功'});
                           }
                       }
                    });
                }
            }

        })
    }else{
        next(null,{code:500,msg:'请填写完整用户信息'});
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
