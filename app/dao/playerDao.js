/**
 * Created by WTF on 2016/3/9.
 */
var Player  = require('../entity/player');
var Store    = require('../entity/store');
var pomelo  = require('pomelo');
var utils   = require('../util/utils');
var Code = require('../consts/code');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);


var playerDao = module.exports;


/**
 * ----------无用了
 * 初始化用户时--同时初始化玩家账户
 * @param id
 * @param nickName
 * @param cb
 */
playerDao.create_player_by_player_id = function (player_id,nick_name,sex_type,head_img_url,cb) {
    logger.info('cd playerDao.createPlayerByid', player_id + ' nickname ' + nick_name + ' head_img_url:' + head_img_url);
    var sql        = 'insert into player(player_id,nick_name,sex,createTime,fangka_num,head_img_url) value(?,?,?,?,?,?)';
    var createTime = Date.now();
    var args       = [player_id,nick_name,sex_type,createTime,10,head_img_url];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.info('createPlayerByid into player table db fail');
            utils.invokeCallback(cb, err.message, null);
        } else {
            playerDao.get_player_by_id(res.insertId, cb);
        }
    });
};

/**
 * 获取玩家数据 by id
 * @param id
 * @param cb
 */
playerDao.get_player_by_id = function (id, cb) {
    logger.info(id,' <- id');
    var sql  = 'select * from player where id =?';
    var args = [id];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            var rs = res[0];
            if (!!rs) {
                utils.invokeCallback(cb, null, new Player(rs));
            } else {
                utils.invokeCallback(cb, 'no player By id', null);
            }
        }
    });
};

playerDao.update_player_by_player_id = function (player_id,nick_name,head_img_url,sex_type, cb) {
	logger.info('go into playerDao.update_player_by_id......');
	var sql = 'update player set nick_name = ?,head_img_url = ?,sex = ? where player_id = ?';
	var args = [nick_name,head_img_url,sex_type, player_id];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err) {
			logger.info('playerDao.updatePlayerInfo failed......' + err);
			utils.invokeCallback(cb, err.message, null);
		} else {
			playerDao.get_player_by_player_id(player_id,cb);
		}
	});
};

/**
 * 通过用户id获取玩家数据
 * @param uid
 * @param cb
 */
playerDao.get_player_by_player_id = function (player_id, cb) {
    logger.info('go into playerDao.get_player_by_id ......');
    var sql  = 'select * from player where player_id = ?';
    var args = [player_id];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err) {
            logger.info('playerDao.get_player_by_id', 'fail');
            utils.invokeCallback(cb, err.message, null);
        } else {
            var rs = res[0];
            if (!!rs) {
				logger.info('playerDao.getPlayerByUid get player succ......');
                utils.invokeCallback(cb, null, new Player(rs));
            } else {
				logger.info('playerDao.getPlayerByUid no found player......');
                utils.invokeCallback(cb, null, null);
            }
        }
    });
};

playerDao.update_gonghui_id = function (id,gonghui_id, cb) {
	logger.info('go into playerDao.update_gonghui_id......');
	var sql = 'update player set gonghui_id = ? where id = ?';
	var args = [gonghui_id, id];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err) {
			logger.info('playerDao.updatePlayerInfo failed......' + err);
			utils.invokeCallback(cb, err.message, null);
		} else {
			logger.info('playerDao.updatePlayerInfo succ');
			utils.invokeCallback(cb, null, Code.OK);
		}
	});
};

/**
 * 设置status 系统领奖状态
 * @param id
 * @param flag
 * @param cb
 */
playerDao.setStatus = function(id,status,cb){
    var sql = 'update player set status = ? where id = ?';

    var args = [status,id];
    pomelo.app.get('dbclient').query(sql,args,function(err,res){
        if(!!err){
            logger.info('playerDao.setCLDays');
            utils.invokeCallback(cb,err.message,null);
        }else{
            utils.invokeCallback(cb,null,Code.OK);
        }
    });
}

playerDao.set_login_ok = function(id,cb){
    var sql = 'update player set loginCount = loginCount + 1,lastLoginTime = ? where id = ?';
    var time = Date.now();
    var args = [time,id];
    pomelo.app.get('dbclient').query(sql,args,function(err,res){
        if(!!err){
            logger.info(self.name.toString(),err);
            utils.invokeCallback(cb,err,message,null);
            return ;
        }else{
            utils.invokeCallback(cb,null,Code.OK);
        }
    });
}
/**
 * 设置连续登录天数  用户登录时设置
 * @param id
 * @param flag
 * @param cb
 */
playerDao.set_continue_login_days = function(id,flag,cb){
    var sql = 'update player set continueLoginDays = 1 where id = ?';
    if(flag){
        sql = 'update player set continueLoginDays = continueLoginDays + 1 where id = ?';
    }
    var args = [id];
    pomelo.app.get('dbclient').query(sql,args,function(err,res){
        if(!!err){
            logger.info('playerDao.setCLDays');
            utils.invokeCallback(cb,err.message,null);
        }else{
            utils.invokeCallback(cb,null,Code.OK);
        }
    });
}

/**
 * 使用钻石购买金币
 * @param id
 * @param gold 正数为增加金币
 * @param diamond  负数消耗钻石
 * @param cb
 */
playerDao.addGold = function (id, gold, diamond, cb) {
    //logger.info('cd playerDao.addGold dao',id);
    var sql  = 'update player set gold = gold + ?, diamond = diamond + ? where id = ?';
    var args = [gold, diamond, id];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.info('出错喽哦货');
            utils.invokeCallback(cb,err,null);
        } else {
            logger.info('')
            logger.info('save gold ok');
            playerDao.get_player_by_id(id, function (err, res) { //res == player
                if (err) {
                    logger.info('出错喽哦货2');
                    utils.invokeCallback(cb,err.message,null);
                } else {
                    var rs = res;
                    logger.info('gold -- - - - --'+rs.gold,rs.diamond);
                    if (!!rs) {
                        logger.info('cd playerDao.addGold get gold');
                        var GAD = {
                            gold: rs.gold,
                            diamond: rs.diamond
                        };
                        utils.invokeCallback(cb, null, GAD);
                    }
                }
            });
        }
    });
};

playerDao.buyDiamond = function(id,number,cb){
    var sql = 'update player set diamond = diamond + ? where id = ?';
    var args = [number,id];
    pomelo.app.get('dbclient').query(sql,args,function(err,res){
        if(!!err){
            logger.info(err);
            utils.invokeCallback(cb,err.message,null);
        }else{
            utils.invokeCallback(cb,null,Code.OK);
        }
    });
}

/**
 * 购买商品
 * @param id
 * @param tag 商品标签
 * @param cb
 */
playerDao.storeBuy = function(id,tag,cb){
    var sql = 'update player set gift01 = gift01 + ,gold=gold- where id = ?';
    if(tag==3){
        sql = 'update player set gift01 = gift01 +1 ,gold=gold-5000 where id = ?';
    }else if(tag ==10){
        sql = 'update player set gift02 = gift02 +1 ,gold=gold-20000 where id = ?';
    }else if(tag ==11){
        sql = 'update player set gift03 = gift03 +1 ,gold=gold-200000 where id = ?';
    }else if(tag ==12){
        sql = 'update player set gift04 = gift04 +1 ,gold=gold-500000 where id = ?';
    }else if(tag ==13){
        sql = 'update player set gift05 = gift05 +1 ,gold=gold-1000000 where id = ?';
    }else if(tag ==110){
        sql = 'update player set diamond=diamond + 5 where id = ?';
    }else if(tag ==111){
        sql = 'update player set diamond=diamond + 10 where id = ?';
    }else if(tag ==112){
        sql = 'update player set diamond=diamond + 32 where id = ?';
    }else if(tag ==113){
        sql = 'update player set diamond=diamond + 59 where id = ?';
    }else if(tag ==120){
        sql = 'update player set diamond=diamond + 128 where id = ?';
    }else if(tag ==121){
        sql = 'update player set diamond=diamond + 724 where id = ?';
    }else if(tag ==122){
        sql = 'update player set diamond=diamond + 1600 where id = ?';
    }else if(tag ==123){
        sql = 'update player set diamond=diamond + 3300 where id = ?';
    }else if(tag ==1){
        sql = 'update player set huanPaiKa=huanPaiKa + 5,diamond=diamond - 5 where id = ?';
    }else if(tag ==0){
        sql = 'update player set huanPaiKa=huanPaiKa + 5,diamond=diamond - 5 where id = ?';
    }else if(tag ==2){
        sql = 'update player set huanPaiKa=huanPaiKa + 65,diamond=diamond - 50 where id = ?';
    }else if(tag ==20){
        sql = 'update player set gold=gold + 50000,diamond=diamond - 5 where id = ?';
    }else if(tag ==21){
        sql = 'update player set gold=gold + 100000,diamond=diamond - 10 where id = ?';
    }else if(tag ==22){
        sql = 'update player set gold=gold + 324000,diamond=diamond - 30 where id = ?';
    }else if(tag ==23){
        sql = 'update player set gold=gold + 590000,diamond=diamond - 50 where id = ?';
    }else if(tag ==100){
        sql = 'update player set gold=gold + 1280000,diamond=diamond - 100 where id = ?';
    }else if(tag ==101){
        sql = 'update player set gold=gold + 7900000,diamond=diamond - 500 where id = ?';
    }else if(tag ==102){
        sql = 'update player set gold=gold + 1600000,diamond=diamond - 1000 where id = ?';
    }else if(tag ==103){
        sql = 'update player set gold=gold + 33000000,diamond=diamond - 2000 where id = ?';
    }else{
        sql = '';
    }
    var args = [id];
    pomelo.app.get('dbclient').query(sql,args,function(err,res){
        if(!!err){
            logger.info(err);
            utils.invokeCallback(cb,err.message,null);
        }else{
            playerDao.get_player_by_id(id,function(err,player){
                if(!!err){
                    logger.info(err);
                    utils.invokeCallback(cb,err.message,null);
                }else{
                    utils.invokeCallback(cb,null,player);
                }
            });
        }
    });
}

playerDao.feedback = function(id,title,content,cb){
    var sql ='insert into feedback(id,title,content)values(?,?,?)';
    var args =[id,title,content];
    pomelo.app.get('dbclient').query(sql,args,function(err,res){
        if(!!err){
            logger.info(err);
            utils.invokeCallback(cb,err.message,null);
        }else{
            utils.invokeCallback(cb,null,200);
        }
    });
}

playerDao.update_game_info = function(data,cb){
	var id = data.player_id;
	logger.info(id,' <- id');
	var sql  = 'select * from player where id =?';
	var args = [id];
	pomelo.app.get('dbclient').query(sql, args, function (err, res) {
		if (err) {
			utils.invokeCallback(cb, err.message, null);
		} else {
			var rs = res[0];
			var round_num = rs.round_num + 1;
			var all_score = rs.all_score + data.game_status;
			var win_num = rs.win_num;
			var lose_num = rs.lose_num;
			if(data.game_status > 0){
				win_num = win_num + 1;
			}else if(data.game_status < 0){
				lose_num = lose_num + 1;
			}

			var sql = 'update player set round_num = ?, all_score = ?,win_num = ?,lose_num = ? where id = ?';
			var args =[round_num,all_score,win_num,lose_num,id];
			pomelo.app.get('dbclient').query(sql,args,function(err,res){
				if(!!err){
					logger.info(err);
					utils.invokeCallback(cb,err.message,null);
				}else{
					logger.info("sub_fangka :" + JSON.stringify(res));
					utils.invokeCallback(cb,null,res);
				}
			});
		}
	});
}
/**
 * 增加金币
 * @param id
 * @param gold
 * @param cb
 */
playerDao.sub_gold = function(id,gold,cb){
	var sql = 'update player set gold = gold + ? where id =?';
	var args =[gold,id];
	pomelo.app.get('dbclient').query(sql,args,function(err,res){
		if(!!err){
			logger.info(err);
			utils.invokeCallback(cb,err.message,null);
		}else{
			utils.invokeCallback(cb,null,200);
		}
	});
};

playerDao.getFangKa = function(id,cb){

	var sql = 'select fangka from player where id=?';
	var args = [id];
	pomelo.app.get('dbclient').query(sql,args,function (err,res) {
		if (!!err) {
			logger.info(err);
			utils.invokeCallback(cb,err.message,null);
		}else{
			if(res.length > 0){
				utils.invokeCallback(cb,null,res[0].fangka);
			}else{
				utils.invokeCallback(cb,'get gold failed',null);
			}
		}
	});
};

playerDao.sub_fangka = function(id,fangka_num,cb){
	var sql = 'update player set fangka_num = fangka_num - ? where id =?';
	var args =[fangka_num,id];
	pomelo.app.get('dbclient').query(sql,args,function(err,res){
		if(!!err){
			logger.info(err);
			utils.invokeCallback(cb,err.message,null);
		}else{
			logger.info("sub_fangka :" + JSON.stringify(res));
			utils.invokeCallback(cb,null,res);
		}
	});
};

playerDao.getGold = function(id,cb){

	var sql = 'select gold from player where id=?';
	var args = [id];
	pomelo.app.get('dbclient').query(sql,args,function (err,res) {
		if (!!err) {
			logger.info(err);
			utils.invokeCallback(cb,err.message,null);
		}else{
			if(res.length > 0){
				utils.invokeCallback(cb,null,res[0].gold);
			}else{
				utils.invokeCallback(cb,'get gold failed',null);
			}
		}
	});
};

//扣除玩家金币 subN -》扣除数量
playerDao.subGold = function (id,subN,cb) {
    var sql = 'update player p set p.gold = p.gold - ? where id=?';
    var args = [subN,id];
	logger.info("subGold" + JSON.stringify(args));
    pomelo.app.get('dbclient').query(sql,args,function (err,res) {
        if (!!err) {
            logger.info(err);
			utils.invokeCallback(cb,err.message,null);
        } else {
            if (res.affectedRows>=1){
                //成功
				sql = 'select gold from player where id=?';
				args = [id];
				pomelo.app.get('dbclient').query(sql,args,function (err,res) {
					if (!!err) {
						logger.info(err);
						utils.invokeCallback(cb,err.message,null);
					}else{
						if(res.length > 0){
							utils.invokeCallback(cb,null,res[0].gold);
						}else{
							utils.invokeCallback(cb,'get gold failed',null);
						}
					}
				});
            } else {
                //失败
                utils.invokeCallback(cb,'subgold failed',null);
            }
        }
    });
};
