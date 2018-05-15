/**
 * Created by WTF Wei on 2016/3/24.
 * Function :
 */

var playerDao =require('../../../dao/playerDao');
var tokenService = require('../../../util/token');
var Code = require('../../../consts/code');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

var Token   = require('../../../util/token');
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
				var token = Token.create(player.id, Date.now(), secret);
				next(null, {code: Code.OK, token:token , player_id: player.id});
			});
		}else{
			playerDao.update_player_by_player_id(player_id,nick_name,img_url,sex_type,function(err,player){
				if(!!err){
					next(null, {code:Code.SQL_ERROR,msg:err});
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
