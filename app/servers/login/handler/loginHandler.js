/**
 * Created by WTF Wei on 2016/3/24.
 * Function :
 */

var playerDao =require('../../../dao/playerDao');
var tokenService = require('../../../util/token');

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
	console.log('login player id:' + player_id + " nick_name:" + nick_name + " sex_type:" + sex_type);

	//更新登录次数和时间
	playerDao.get_player_by_player_id(player_id,function(err,player){
		if(!!err){
			next(null, {code: 111,msg:"unknow error"});
			return;
		}
		if(player == null){
			playerDao.create_player_by_player_id(player_id,nick_name,sex_type,img_url,function(err,player){
				if(!!err) {
					console.log('createPlayer err!',JSON.stringify(err));
					next(null, {code: 111, msg: 'err'});
					return;
				}
				updateLogin(player);
				var token1 = Token.create(player.id, Date.now(), secret);
				next(null, {code: 200, token:token1 , player_id: player.id});
			});
		}else{
			updateLogin(player);
			var token1 = Token.create(player.id, Date.now(), secret);
			next(null, {code: 200, token:token1 , player_id: player.id});
		}
	});
}

var updateLogin  = function(player){
    //更新登录次数和最后登录时间
    playerDao.set_login_ok(player.id,function(err,code){
        console.log(code);
    });

    //更新连续登录时间
    var lastLT = player.lastLoginTime;
    var lastD = new Date(lastLT);
    var lastDay = lastD.getDate(); //上次登录的日期12号
    var today = (new Date()).getDate(); //现在的日期ag:13号

    console.log('更新记录',lastLT);
    console.log(lastDay);
    console.log(today);

    var isTwoDay = (Date.now() - lastLT) < 2*24*60*60*1000; //少于两天

    console.log('更新记录lastLT',lastLT);
    console.log('lastDay',lastDay);
    console.log('today',today);
    console.log('isTwoDay',isTwoDay);
    console.log('today!=lastDay',today!=lastDay);

    //连续登录 当天第一次登录
    if((today!=lastDay)&&!!isTwoDay){
        console.log('cd 连续登录 当天第一次登录');
        //加一天
        playerDao.set_continue_login_days(player.id,true,function(err,res){
            if(!err){
                console.log('连续登陆天数加一天ok');
            }
        });

    }else if(today!=lastDay){ // 非连续登录 当天第一次
        console.log('cd 非连续登录 当天第一次');
        playerDao.set_continue_login_days(player.id,false,function(err,res){
            if(!err){
                console.log('重置连续登录天数1ok');
            }
        });
    }
}
