/**
 * Created by WTF Wei on 2016/3/25.
 * Function :
 */
var storeDao = require('../../../dao/storeDao');
module.exports = function (app) {
    return new Handler(app);
}

var Handler = function (app) {
    this.app = app;
}

var handler = Handler.prototype;

handler.storeProcess = function (msg, session, next) {
	var process = msg.process;
	var param = msg.data;
	if(process == "creatOrder"){
		storeDao.creat_order(param.player_id,param.fangka_num,param.zongjia,param.danjia,function(err,data){
			if (err) {
				next(null, {
					code: 500,
					msg: '订单生成失败'
				});
			} else {
				next(null, {
					code: 200,
					msg:data
				});
			}
		});
	}
}

handler.buyHuanPaiKa  = function (msg, session, next){
    var playerId = msg.playerId;
    var huanPaiKa = msg.huanPaiKa;
    if(!!playerId&&!!huanPaiKa){
        playerDao.setHuanPaiKa(playerId,huanPaiKa,function(err,res){
            if(!!err){
                next(null, {
                    code: 500,
                    msg: '购买出错'
                });
            }else{
                next(null, {
                    code: 200,
                    msg: '购买成功'
                });
            }
        })
    }
}

handler.buyFanBeiKa  = function (msg, session, next){
    var playerId = msg.playerId;
    var fanBeiKa = msg.fanBeiKa;
    if(!!playerId&&!!fangBeiKa){
        playerDao.setFanBeiKa(playerId,fangBeiKa,function(err,res){
            if(!!err){
                next(null, {
                    code: 500,
                    msg: '购买出错'
                });
            }else{
                next(null, {
                    code: 200,
                    msg: '购买成功'
                });
            }
        })
    }
}

handler.buyJinBiKa  = function (msg, session, next){
    var playerId = msg.playerId;
    var jinBiKa = msg.jinBiKa;
    if(!!playerId&&!!jinBiKa){
        playerDao.setJinBiKa(playerId,jinBiKa,function(err,res){
            if(!!err){
                next(null, {
                    code: 500,
                    msg: '购买出错'
                });
            }else{
                next(null, {
                    code: 200,
                    msg: '购买成功'
                });
            }
        })
    }
}

handler.buyEquip  = function (msg, session, next){
    var playerId = msg.playerId;
    var equip = msg.equip;
    var number = msg.number;
    if(!!playerId&&!!equip){
        playerDao.setEquip(playerId,equip,number,function(err,res){
            if(!!err){
                next(null, {
                    code: 500,
                    msg: '购买出错'
                });
            }else{
                next(null, {
                    code: 200,
                    msg: '购买成功'
                });
            }
        })
    }else {
        next(null, {
            code: 500,
            msg: '购买参数错误'
        });
    }
}

handler.buyDiamond  = function (msg, session, next){
    var playerId = msg.playerId;
    var number = msg.number;
    if(!!playerId&&!!number){
        playerDao.buyDiamond(playerId,number,function(err,res){
            if(!!err){
                next(null, {
                    code: 500,
                    msg: '购买出错'
                });
            }else{
                next(null, {
                    code: 200,
                    msg: '购买成功'
                });
            }
        })
    }else {
        next(null, {
            code: 500,
            msg: '购买参数错误'
        });
    }
}

handler.buyGift  = function (msg, session, next){
    var playerId = msg.playerId;
    var gift = msg.gift;
    var number = msg.number;
    if(!!playerId&&!!gift&&!!number){
        playerDao.buyGift(playerId,gift,number,function(err,res){
            if(!!err){
                next(null, {
                    code: 500,
                    msg: '购买出错'
                });
            }else{
                next(null, {
                    code: 200,
                    msg: '购买成功'
                });
            }
        })
    }else {
        next(null, {
            code: 500,
            msg: '购买参数错误'
        });
    }
}

handler.getStoreData = function(msg,session,next){
    playerDao.getStore(function(err,res){
        if(!!res){
            next(null,{code:200,store:res});
        }
    });
}

handler.getStoreItem = function (msg,session,next) {
    var itemId = msg.itemId;
    if (!!itemId) {
        playerDao.getStoreItem(itemId,function(err,storeItem){
            if (!!err){
                console.log(err);
                next(null,{code:500,msg:'getStoreItem err'});
            } else {
                next(null,{code:200,storeItem:storeItem});
            }
        });
    } else {
        next(null,{code:500,msg:'args err'});
    }
}

handler.buy = function(msg,session,next){
    console.log('msg: '+msg);
    var playerId = msg.playerId;
    var tag = msg.tag;
    console.log(playerId,tag);
    if(!!playerId&&!!tag){
        playerDao.storeBuy(playerId,tag,function(err,player){
            if(!!err){
                console.log('出错！！！');
                console.log(err);
                next(null,{code:500,msg:'buy 错误'});
            }else{
                console.log(player);
                var p = player;
                next(null,{code:200,msg:'购买成功',player:p});
            }
        });
    }else{
        console.log('参数错误');
        next(null,{code:500,msg:'param err'});
    }
}
