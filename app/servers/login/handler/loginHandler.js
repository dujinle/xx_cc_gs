/**
 * Created by WTF Wei on 2016/3/24.
 * Function :
 */

var playerDao =require('../../../dao/playerDao');
var utils = require('../../../util/utils');
var Code = require('../../../consts/code');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var https = require('https');
var Token   = require('../../../util/token');
var WXBizDataCrypt = require('../../../util/WXBizDataCrypt');
var cache  = require('memory-cache');
var secret  = 'secret'

module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

handler.login = function (msg, session, next) {
	var player_id = msg.player_id;
	var nick_name = msg.nick_name;
	var sex_type = msg.sex;
	var img_url = msg.head_img;
	logger.info('login player id:' + player_id + " nick_name:" + nick_name + " sex_type:" + sex_type);

	//更新登录次数和时间
	playerDao.get_player_by_player_id(player_id,function(err,player){
		if(!!err){
			next(null, {code:Code.SQL_ERROR,msg:err.message});
			return;
		}
		if(player == null){
			playerDao.create_player_by_player_id(player_id,nick_name,sex_type,img_url,function(err,player){
				if(!!err) {
					logger.info('createPlayer err!',JSON.stringify(err));
					next(null, {code: Code.SQL_ERROR, msg:err.message});
					return;
				}
				updateLogin(player);
				var token = Token.create(player.id, Date.now(), secret);
				next(null, {code: Code.OK, token:token , player_id: player.id});
			});
		}else{
			playerDao.update_player_by_player_id(player_id,nick_name,img_url,sex_type,function(err,player){
				if(!!err){
					next(null, {code:Code.SQL_ERROR,msg:err.message});
					return;
				}else{
					updateLogin(player);
					var token = Token.create(player.id, Date.now(), secret);
					next(null, {code: Code.OK, token:token , player_id: player.id});
				}
			});
		}
	});
}

var updateLogin  = function(player){
    //更新登录次数和最后登录时间
    playerDao.set_login_ok(player.id,function(err,code){
        logger.info(code);
    });

    //更新连续登录时间
    var lastLT = player.lastLoginTime;
    var lastD = new Date(lastLT);
    var lastDay = lastD.getDate(); //上次登录的日期12号
    var today = (new Date()).getDate(); //现在的日期ag:13号

    logger.info('更新记录',lastLT);
    logger.info(lastDay);
    logger.info(today);

    var isTwoDay = (Date.now() - lastLT) < 2*24*60*60*1000; //少于两天

    logger.info('更新记录lastLT',lastLT);
    logger.info('lastDay',lastDay);
    logger.info('today',today);
    logger.info('isTwoDay',isTwoDay);
    logger.info('today!=lastDay',today!=lastDay);

    //连续登录 当天第一次登录
    if((today!=lastDay)&&!!isTwoDay){
        logger.info('cd 连续登录 当天第一次登录');
        //加一天
        playerDao.set_continue_login_days(player.id,true,function(err,res){
            if(!err){
                logger.info('连续登陆天数加一天ok');
            }
        });

    }else if(today!=lastDay){ // 非连续登录 当天第一次
        logger.info('cd 非连续登录 当天第一次');
        playerDao.set_continue_login_days(player.id,false,function(err,res){
            if(!err){
                logger.info('重置连续登录天数1ok');
            }
        });
    }
}

handler.wxlogin = function (msg, session, next) {
	logger.info('wxlogin:' + JSON.stringify(msg)) ;
	var wx_code = msg.wx_code;
	var encrypted_data = msg.encrypted_data;
	var raw_data = msg.raw_data;
	var signature = msg.signature;
	var iv = msg.iv;
	var session_key = msg.session_key;
	if(session_key != null){
		var wx_session_key = cache.get(session_key);
		if(!!wx_session_key){
			var wx_key = wx_session_key.split('|')[0];
			var signature_n = Token.sha1(raw_data + wx_key);
			if(signature_n != signature){
				next(null, {code: Code.FA_LOGIN_SIGNATURE, data:'signature 验证失败 请重新登录'});
			}else{
				var pc = new WXBizDataCrypt('wxcc483092644e1691',wx_key);
				var data = pc.decryptData(encrypted_data, iv);
				var player_id = data.openId;
				var nick_name = data.nickName;
				var sex_type = data.gender;
				var img_url = data.avatarUrl;
				playerDao.get_player_by_player_id(player_id,function(err,player){
					if(!!err){
						next(null, {code:Code.SQL_ERROR,msg:err});
						return;
					}
					if(player == null){
						playerDao.create_player_by_player_id(player_id,nick_name,sex_type,img_url,function(err,player){
							if(!!err) {
								logger.info('createPlayer err!',JSON.stringify(err));
								next(null, {code: Code.SQL_ERROR, msg:err});
								return;
							}
							updateLogin(player);
							cache.put(uuid,jdata['session_key'] + '|' + jdata['openid']);
							var token = Token.create(player.id, Date.now(), secret);
							next(null, {code: Code.OK, token:token , session_token:session_key});
						});
					}else{
						playerDao.update_player_by_player_id(player_id,nick_name,img_url,sex_type,function(err,player){
							if(!!err){
								next(null, {code:Code.SQL_ERROR,msg:err});
								return;
							}else{
								updateLogin(player);
								cache.put(uuid,jdata['session_key'] + '|' + jdata['openid']);
								var token = Token.create(player.id, Date.now(), secret);
								next(null, {code: Code.OK, token:token , session_token:session_key});
							}
						});
					}
				});
			}
		}else{
			next(null, {code: Code.FA_LOGIN_INVALID, msg:'请重新登录，验证已经过期！'});
		}
	}else{
		https.get('https://api.weixin.qq.com/sns/jscode2session?appid=wxcc483092644e1691&secret=f070d7d52322077434b53827041be68c&js_code=' + wx_code + '&grant_type=authorization_code',function(req,res){
			var html = '';
			req.on('data',function(data){
				html += data;
			});
			req.on('end',function(){
				var jdata = JSON.parse(html);
				var uuid = utils.get_uuid();
				var signature_n = Token.sha1(raw_data + jdata['session_key']);
				logger.info(html,jdata,signature_n);
				if(signature_n != signature){
					next(null, {code: Code.FA_LOGIN_SIGNATURE, data:'signature 验证失败 请重新登录'});
				}else{
					var pc = new WXBizDataCrypt('wxcc483092644e1691', jdata['session_key']);
					var data = pc.decryptData(encrypted_data, iv);
					logger.info(data);

					var player_id = data.openId;
					var nick_name = data.nickName;
					var sex_type = data.gender;
					var img_url = data.avatarUrl;
					playerDao.get_player_by_player_id(player_id,function(err,player){
						if(!!err){
							next(null, {code:Code.SQL_ERROR,msg:err});
							return;
						}
						if(player == null){
							playerDao.create_player_by_player_id(player_id,nick_name,sex_type,img_url,function(err,player){
								if(!!err) {
									logger.info('createPlayer err!',JSON.stringify(err));
									next(null, {code: Code.SQL_ERROR, msg:err});
									return;
								}
								updateLogin(player);
								cache.put(uuid,jdata['session_key'] + '|' + jdata['openid']);
								var token = Token.create(player.id, Date.now(), secret);
								next(null, {code: Code.OK, token:token,session_token:uuid});
							});
						}else{
							playerDao.update_player_by_player_id(player_id,nick_name,img_url,sex_type,function(err,player){
								if(!!err){
									next(null, {code:Code.SQL_ERROR,msg:err});
									return;
								}else{
									updateLogin(player);
									cache.put(uuid,jdata['session_key'] + '|' + jdata['openid']);
									var token = Token.create(player.id, Date.now(), secret);
									next(null, {code: Code.OK, token:token , session_token:uuid});
								}
							});
						}
					});
				}
			});
		});
	}
}
