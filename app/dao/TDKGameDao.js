/**
 * Created by wuningjian on 2/26/16.
 */
var TDKGameDao = module.exports;
var pomelo = require('pomelo');
var utils   = require('../util/utils');
var sqlTemp = pomelo.app.get('dbclient');

//该js文件都是对数据表tdk_game_room进行操作

/**
 * 新建房间
 * */
TDKGameDao.createRoom = function(cb){
    //console.log("rid in TDKGameDao:"+rid);
    var sql = 'insert into tdk_game_room (current_chip,all_chip,round,player_num) values(?,?,?,?)';
    var args = [0,0,0,1];
    console.log("args in TDKGameDao:"+args);
    sqlTemp.insert(sql,args,function(err,res){
        if(err!==null){
            console.error("db:createRoom error");
            utils.invokeCallback(cb,err,null)
        }else{
            console.log("createRoom:"+JSON.stringify(res));
            utils.invokeCallback(cb,null,res);
        }
    });
};

TDKGameDao.createRoomByPlayerId = function(playerId,masterName,roomType,faPaiNum,totalRound,cur_chip,quChuPai,cb){
    console.log("create room by player id:" + playerId + 'roomType:' + roomType + " cur_chip:" + cur_chip + " quChuPai:" + quChuPai);
	console.log("create room master name:" + masterName + ' total_round:' + totalRound + " faPaiNum:" + faPaiNum);
	var roomNum = utils.random6num();
	callback = function(err,res){
		console.log('callback the room by roomNum...',err,res);
		if(err!==null){
			console.error("db:createRoom error");
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				roomNum = utils.random6num();
				TDKGameDao.getRoomByRoomNum(roomNum,callback);
			}else{
				console.log("getRoom: no found room......");
			}
		}
	};
	TDKGameDao.getRoomByRoomNum(roomNum,callback);

    var sql = 'insert into tdk_game_room (master,master_name,game_type,room_num,player_num,total_round,fapai_num,current_chip,quchu_pai) values(?,?,?,?,?,?,?,?,?)';
    var args = [playerId,masterName,roomType,roomNum,0,totalRound,faPaiNum,cur_chip,quChuPai];
    sqlTemp.insert(sql,args,function(err,res){
        if(err!==null){
            console.error("db:createRoom error",err);
            utils.invokeCallback(cb,err,null)
        }else{
            console.log("createRoom:"+JSON.stringify(res));
            utils.invokeCallback(cb,null,res.insertId);
        }
    });
};

TDKGameDao.getRoomByRoomNum = function(roomNum,cb){
    var sql = 'select * from tdk_game_room where room_num = ?';
    var args = [roomNum];
	console.log('start select tdk_game_room by room_num:',roomNum);
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getRoomByRoomNum error......");
            utils.invokeCallback(cb,err,null);
        }else{
			console.log('select tdk_game_room : result',res);
			if(!!res && res.length > 0){
				console.log("getRoom:"+JSON.stringify(res));
				utils.invokeCallback(cb,null,res[0].room_num);
			}else{
				console.log("getRoom: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
    });
};
/**
 * 查询数据库,通过room_num
 * @param basicChip 房间起注
 * @param cb        返回房间号rid
 */
TDKGameDao.returnRoom = function(room_num, cb){
    var sql = 'select * from tdk_game_room where room_num = ?';
    var args = [room_num];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:returnRoom error......");
            utils.invokeCallback(cb,err,null);
        }else{
			if(!!res && res.length > 0){
				console.log("returnRoom:"+JSON.stringify(res));
                utils.invokeCallback(cb,null,res[0]);
			}else{
				console.log("returnRoom: no found room......");
                utils.invokeCallback(cb,null,null);
            }
        }
    });
};

/**
 * 房间新增用户，rid房间名，cb回调用户牌局位置1～5
 * */
TDKGameDao.addPlayer = function(rid,uid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    var new_player_num;
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:addPlayer1 error");
            utils.invokeCallback(cb,err,null);
        }else{
            //更改玩家数量
            console.log("tdk_game_room info:"+JSON.stringify(res));
            new_player_num = res[0].player_num+1;
            var location;
            if(res[0].location1=='null'){
                location = 1;
            }else if(res[0].location2=='null'){
                location = 2;
            }else if(res[0].location3=='null'){
                location = 3;
            }else if(res[0].location4=='null'){
                location = 4;
            }else if(res[0].location5=='null'){
                location = 5;
            }else{
                console.error("db:give location error");
                utils.invokeCallback(cb,"db:give location error",null);
            }
            //var location = new_player_num;
            var sql1 = 'update tdk_game_room set player_num = ? where rid = ?';
            var args1 = [new_player_num,rid];
            //console.log("res:"+res);
            console.log("args1:",args1,location);
            sqlTemp.update(sql1,args1,function(err,res){
                if(err!==null){
                    console.error("db:addPlayer2 error");
                    utils.invokeCallback(cb,err,null);
                }else{
                    console.log("db:addPlayer2 success");
                    //location 添加对应玩家名
                    var sql2 = '';
                    var args2 = [];
                    switch(location){
                        case 1:
                            sql2 = 'update tdk_game_room set location1 = ? where rid = ?';
                            args2 = [uid,rid];
                            break;
                        case 2:
                            sql2 = 'update tdk_game_room set location2 = ? where rid = ?';
                            args2 = [uid,rid];
                            break;
                        case 3:
                            sql2 = 'update tdk_game_room set location3 = ? where rid = ?';
                            args2 = [uid,rid];
                            break;
                        case 4:
                            sql2 = 'update tdk_game_room set location4 = ? where rid = ?';
                            args2 = [uid,rid];
                            break;
                        case 5:
                            sql2 = 'update tdk_game_room set location5 = ? where rid = ?';
                            args2 = [uid,rid];
                            break;
                        default:
                            console.error("addPlayer3 error");
                    }
                    sqlTemp.update(sql2,args2,function(err,res){
                        if(err!==null){
                            console.error("db:addPlayer3 error");
                            utils.invokeCallback(cb,err,null);
                        }else{
                            console.log("db:addPlayer3 success");
                            //cb(location,new_player_num);
                            utils.invokeCallback(cb,err,location,new_player_num);
                        }
                    });
                }
            });
        }
    });

};

/**
 * 返回房间对应位置的玩家
 * */
TDKGameDao.getLocalPlayer = function(rid,location,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:addPlayer3 error");
            utils.invokeCallback(cb,err,null);
        }else{
            switch(location){
                case 1:
                    //cb(res[0].location1,location);
                    utils.invokeCallback(cb,err,res[0].location1,location);
                    break;
                case 2:
                    //cb(res[0].location2,location);
                    utils.invokeCallback(cb,err,res[0].location2,location);
                    break;
                case 3:
                    //cb(res[0].location3,location);
                    utils.invokeCallback(cb,err,res[0].location3,location);
                    break;
                case 4:
                    //cb(res[0].location4,location);
                    utils.invokeCallback(cb,err,res[0].location4,location);
                    break;
                case 5:
                    //cb(res[0].location5,location);
                    utils.invokeCallback(cb,err,res[0].location5,location);
                    break;
                default:
                    console.error("db:getLocalPlayer error");
                    utils.invokeCallback(cb,err,null);
            }
        }
    });
};

/**
 * 返回玩家的房间对应位置
 * */
TDKGameDao.getPlayerLocal = function(rid,player,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    var location;
	var result;
    console.log("--------------player input getplayerlocal"+player);
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getPlayerLocal error");
            utils.invokeCallback(cb, err, null);
        }else{
			console.log('get room info by rid' + JSON.stringify(res))
            if(player == res[0].location1.split('*')[0]){
                location = 1;
				result = res[0].location1;
            }else if(player == res[0].location2.split('*')[0]){
                location = 2;
				result = res[0].location2;
            }else if(player == res[0].location3.split('*')[0]){
                location = 3;
				result = res[0].location3;
            }else if(player == res[0].location4.split('*')[0]){
                location = 4;
				result = res[0].location4;
            }else if(player == res[0].location5.split('*')[0]){
                location = 5;
				result = res[0].location5;
            }else {
                console.error("db:getPlayerLocal2 error");
                utils.invokeCallback(cb, "db:getPlayerLocal2 error", null);
            }
            //cb(location);
            utils.invokeCallback(cb, result, location);
        }
    });
};

//
/**
 *玩家离开房间
 */
TDKGameDao.rmPlayer = function(rid,uid,cb){
    var sql = "select * from tdk_game_room where rid = ?";
    var args = [rid];
    sqlTemp.query(sql,args,function(err, res){
        if(err!==null){
            console.error("db:rmPlayer failed");
            utils.invokeCallback(cb, err, null);
        }else{
            var new_player_num;
            if(res[0].player_num>1){
                new_player_num = res[0].player_num-1;
            }else{
                new_player_num = 0;
            }
            var sql1 = 'update tdk_game_room set player_num = ? where rid = ?';
            var args1 = [new_player_num,rid];
            sqlTemp.update(sql1,args1,function(err,res1){
                if(err!==null){
                    console.error("db:rmPlayer1 failed" + JSON.stringify(err));
                    utils.invokeCallback(cb, err, null);
                }else{
					console.log("TDKGameDao.rmPlayer set player_num success");
				}
            });

            //重置location12345和is_game_12345值
            if(res[0].location1==uid){
                var sql2 = 'update tdk_game_room set location1 = ?, is_game_1 = ? where rid =?';
                var args2 = ['null',0,rid];
                sqlTemp.update(sql2,args2,function(err,res){
                    if(err!==null){
                        console.error("db:rmPlayer2_1 failed");
                        utils.invokeCallback(cb, err, null);
                    }
                });
            }else if(res[0].location2==uid){
                var sql2 = 'update tdk_game_room set location2 = ?, is_game_2 = ? where rid =?';
                var args2 = ['null',0,rid];
                sqlTemp.update(sql2,args2,function(err,res){
                    if(err!==null){
                        console.error("db:rmPlayer2_2 failed");
                        utils.invokeCallback(cb, err, null);
                    }
                });
            }else if(res[0].location3==uid){
                var sql2 = 'update tdk_game_room set location3 = ?, is_game_3 = ? where rid =?';
                var args2 = ['null',0,rid];
                sqlTemp.update(sql2,args2,function(err,res){
                    if(err!==null){
                        console.error("db:rmPlayer2_3 failed");
                        utils.invokeCallback(cb, err, null);
                    }
                });
            }else if(res[0].location4==uid){
                var sql2 = 'update tdk_game_room set location4 = ?, is_game_4 = ? where rid =?';
                var args2 = ['null',0,rid];
                sqlTemp.update(sql2,args2,function(err,res){
                    if(err!==null){
                        console.error("db:rmPlayer2_4 failed");
                        utils.invokeCallback(cb, err, null);
                    }
                });
            }else if(res[0].location5==uid){
                var sql2 = 'update tdk_game_room set location5 = ?, is_game_5 = ? where rid =?';
                var args2 = ['null',0,rid];
                sqlTemp.update(sql2,args2,function(err,res){
                    if(err!==null){
                        console.error("db:rmPlayer2_5 failed");
                        utils.invokeCallback(cb, err, null);
                    }
                });
            }
        }
        //cb();
        utils.invokeCallback(cb, null, null);
    });
};
//
/**
 * get room infomation
 * */
TDKGameDao.getRoomInfo = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    pomelo.app.get('dbclient').query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getRoomInfo error");
            utils.invokeCallback(cb, err, null);
        }else{
			if(!!res && res.length > 0){
	            console.log(JSON.stringify(res));
		        utils.invokeCallback(cb, null, res[0]);
			}
			else{
				utils.invokeCallback(cb, null, null);
			}
        }
    });
};
/**
 * 查询房间游戏状态
 * */
TDKGameDao.getRoomStatus = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.log("db:getRoomStatus error");
            utils.invokeCallback(cb, err, null);
        }else{
			utils.invokeCallback(cb, null, res[0].is_gaming);
        }
    });
};

TDKGameDao.getQuChuPai = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.log("db:getRoomStatus error");
            utils.invokeCallback(cb, err, null);
        }else{
			utils.invokeCallback(cb, null, res[0].quchu_pai);
        }
    });
};
/**
 * 更新房间游戏状态
 * */
TDKGameDao.updateRoomStatus = function(rid,game_status,cb){
    //game_status 0 or 1   0:no game 1:gaming
    var sql = 'update tdk_game_room set is_gaming = ? where rid = ?';
    var args = [game_status,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.log("db:updateRoomStatus error");
            utils.invokeCallback(cb, err, null);
        }else{
            console.log("db:updateRoomStatus succeed");
            //cb();
            utils.invokeCallback(cb, null, null);
        }
    });
};

/**
 * 更新牌型，牌型与玩家位置绑定
 * */
TDKGameDao.updatePai = function(rid,pai,location,cb){
    var sql;
    var args =[JSON.stringify(pai),rid];
    switch (location){
        case 1:
            sql = 'update tdk_game_room set pai1 = ? where rid = ?';
            break;
        case 2:
            sql = 'update tdk_game_room set pai2 = ? where rid = ?';
            break;
        case 3:
            sql = 'update tdk_game_room set pai3 = ? where rid = ?';
            break;
        case 4:
            sql = 'update tdk_game_room set pai4 = ? where rid = ?';
            break;
        case 5:
            sql = 'update tdk_game_room set pai5 = ? where rid = ?';
            break;
        default:
            console.error("db:TDKGameDao updatePai location error");
    }
    sqlTemp.update(sql,args,function(err,res){
        console.log(sql);
        console.log(args);

        if(err!==null){
            console.error("db:updatePai error");
            utils.invokeCallback(cb, err, null);
        }else{
            console.log("db:updatePai succeed");
            //cb();
            utils.invokeCallback(cb, null, null);
        }
    });
};

/**
 * 获取对应位置的牌型,牌型存放数据库类型是字符串类型，程序使用时是json格式
 * */
TDKGameDao.getPai = function(rid,location,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:pushPai error");
            utils.invokeCallback(cb, err, null);
        }else{
            console.log("getPai res:"+JSON.stringify(res[0]));
            switch (location){
                case 1:
                    //cb(JSON.parse(res[0].pai1));
                    utils.invokeCallback(cb, null, JSON.parse(res[0].pai1));
                    break;
                case 2:
                    //cb(JSON.parse(res[0].pai2));
                    utils.invokeCallback(cb, null, JSON.parse(res[0].pai2));
                    break;
                case 3:
                    //cb(JSON.parse(res[0].pai3));
                    utils.invokeCallback(cb, null, JSON.parse(res[0].pai3));
                    break;
                case 4:
                    //cb(JSON.parse(res[0].pai4));
                    utils.invokeCallback(cb, null, JSON.parse(res[0].pai4));
                    break;
                case 5:
                    //cb(JSON.parse(res[0].pai5));
                    utils.invokeCallback(cb, null, JSON.parse(res[0].pai5));
                    break;
                default:
                    console.error("db:pushPai1 error");
                    utils.invokeCallback(cb, "db:pushPai1 error", null);
            }
        }

    });

};

/**
 * 获取所有玩家的牌型,牌型存放数据库类型是字符串类型，程序使用时是json格式
 * */
TDKGameDao.getAllPai = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getAllPai error");
            utils.invokeCallback(cb, err, null);
        }else{
            console.log("getPai res:"+JSON.stringify(res));
			allPai = new Array();
			allPai.push(JSON.parse(res[0].pai1));
			allPai.push(JSON.parse(res[0].pai2));
			allPai.push(JSON.parse(res[0].pai3));
			allPai.push(JSON.parse(res[0].pai4));
			allPai.push(JSON.parse(res[0].pai5));
            utils.invokeCallback(cb,null,allPai);
        }
    });
};
/**
 * 修改当前注数数据库操作函数
 * */
TDKGameDao.setCurrentChip = function(rid, new_chip,cb){
    var sql = 'update tdk_game_room set current_chip = ? where rid = ?';
    var args = [new_chip,rid];
    console.log("db:setCurrentChip: "+args);
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("db:setCurrentChip error");
            utils.invokeCallback(cb, err, null);
            //cb(new_chip);
        }else{
            console.log("db:setCurrentChip succeed");
            //cb(new_chip);
            utils.invokeCallback(cb, null, new_chip);
        }
    });
};
/**
  *设置获胜玩家可能是多个 location1*location2*location3
  **/
TDKGameDao.setWinner = function(rid,winners,cb){
    var sql = 'update tdk_game_room set winner = ? where rid = ?';
    var args = [winners,rid];
    console.log("db:setCurrentChip: "+args);
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao setWinner error");
            utils.invokeCallback(cb, err, null);
            //cb(new_chip);
        }else{
            console.log("TDKGameDao.setWinner succeed");
            //cb(new_chip);
            utils.invokeCallback(cb, null, winners);
        }
    });
};

TDKGameDao.getWinner = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao.getWinner");
            utils.invokeCallback(cb, err, null);
        }else {
			utils.invokeCallback(cb, null, res[0].winner);
        }
    });
};
/**
 * 获取当前注数数据库操作函数
 * */
TDKGameDao.getCurrentChip = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getCurrentChip error");
            utils.invokeCallback(cb, err, null);
        }else {
			console.log("getCurrentChip:" + JSON.stringify(res));
            //cb(res[0].current_chip);
			utils.invokeCallback(cb, null, res[0].current_chip);
        }
    });
};

TDKGameDao.setWinner = function(rid,winner,cb){
    var sql = 'update tdk_game_room set winner = ? where rid = ?';
    var args = [winner,rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getCurrentChip error");
            utils.invokeCallback(cb, err, null);
        }else {
			utils.invokeCallback(cb, null, winner);
        }
    });
};
/**
 * 获取游戏房间总注数
 * */
TDKGameDao.getAllChip = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getAllChip error");
            utils.invokeCallback(cb, err, null);
        }else {
			utils.invokeCallback(cb, null, res[0].all_chip);
        }
    });
};

/**
 * 修改游戏房间总注数
 * */
TDKGameDao.setAllChip = function(rid,new_chip,cb){
    var sql = 'update tdk_game_room set all_chip = ? where rid = ?';
    var args = [new_chip,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("db:setAllChip error");
            utils.invokeCallback(cb, err, null);
        }else{
            console.log("db:setAllChip succeed");
            //cb();
            utils.invokeCallback(cb, null, null);
        }
    });
};

/**
 * 修改is_game_(12345)
 * */
TDKGameDao.setIsGameNum = function(rid,location,value,cb){
    var sql;
    switch(location){
        case 1:
            sql = 'update tdk_game_room set is_game_1 = ? where rid = ?';
            break;
        case 2:
            sql = 'update tdk_game_room set is_game_2 = ? where rid = ?';
            break;
        case 3:
            sql = 'update tdk_game_room set is_game_3 = ? where rid = ?';
            break;
        case 4:
            sql = 'update tdk_game_room set is_game_4 = ? where rid = ?';
            break;
        case 5:
            sql = 'update tdk_game_room set is_game_5 = ? where rid = ?';
            break;
        default:
            console.error("db:setIsGameNum location error");
            utils.invokeCallback(cb,"db:setIsGameNum location error", null);
    }
    var args = [value,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("db:setIsGameNum error");
            utils.invokeCallback(cb,err, null);
        }else{
            console.log("db:setIsGameNum success");
            //cb();
            utils.invokeCallback(cb,null, null);
        }
    });
};

/**
 * 回调函数将所有位置is_game用一个数组进行返回
 * */
TDKGameDao.getIsGameNum = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getIsGameNum error");
            utils.invokeCallback(cb,err, null);
        }else{
            var returnArr = [];
            returnArr[1] = res[0].is_game_1;
            returnArr[2] = res[0].is_game_2;
            returnArr[3] = res[0].is_game_3;
            returnArr[4] = res[0].is_game_4;
            returnArr[5] = res[0].is_game_5;
            //cb(returnArr);
            utils.invokeCallback(cb,null,returnArr);
        }
    });
};

TDKGameDao.getPlayerIsGameNum = function(rid,location,cb){
	var sql = 'select * from tdk_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("TDKGameDao.getPlayerIsGameNu error");
			utils.invokeCallback(cb,err, null);
		}else{
			if(location == 1){
				utils.invokeCallback(cb,null,res[0].is_game_1);
			}else if(location == 2){
				utils.invokeCallback(cb,null,res[0].is_game_2);
			}else if(location == 3){
				utils.invokeCallback(cb,null,res[0].is_game_3);
			}else if(location == 4){
				utils.invokeCallback(cb,null,res[0].is_game_4);
			}else if(location == 5){
				utils.invokeCallback(cb,null,res[0].is_game_5);
			}else{
				utils.invokeCallback(cb,null,null);
			}
		}
	});
};

/**
 * 回调函数获取目前接受牌的玩家数
 * */
TDKGameDao.getPaiPlayer = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao.getPaiPlayer");
            utils.invokeCallback(cb,err, null);
        }else{
            utils.invokeCallback(cb,null,res[0].pai_player);
        }
    });
};

/**
 * 设置当前收到牌的玩家数目
 * */
TDKGameDao.setPaiPlayer = function(rid,paiPlayerNum,cb){
    var sql = "update tdk_game_room set pai_player = ? where rid = ?";
    var args = [paiPlayerNum,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao.setPaiPlayer error");
            utils.invokeCallback(cb,err, null);
        }else{
            console.log("TDKGameDao.setPaiPlayer success");
            utils.invokeCallback(cb,null, paiPlayerNum);
        }
    });
};

/**
 * 设置当前收到牌的玩家数目
 * */
TDKGameDao.addPaiPlayer = function(rid,paiPlayerNum,cb){
    var sql = "update tdk_game_room set pai_player = pai_player + ? where rid = ?";
    var args = [paiPlayerNum,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao.setPaiPlayer error");
            utils.invokeCallback(cb,err, null);
        }else{
			TDKGameDao.getPaiPlayer(rid,function(err,pai_player){
				console.log("TDKGameDao.setPaiPlayer success");
				utils.invokeCallback(cb,null, pai_player);
			});
        }
    });
};

/**
 * 设置当前出牌玩家
 * */
TDKGameDao.setCurPlayer = function(rid,cur_player,cb){
    var sql = "update tdk_game_room set current_player = ? where rid = ?";
    var args = [cur_player,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("db:setCurPlayer error");
            utils.invokeCallback(cb,err, null);
        }else{
            console.log("TDKGameDao.setCurPlayer success" + cur_player);
            utils.invokeCallback(cb,null, cur_player);
        }
    });
};

/**
 * 设置当前发牌的张数
 * */
TDKGameDao.subPaiRound = function(rid,pai_num,cb){
    var sql = "update tdk_game_room set pai_round = pai_round + ? where rid = ?";
    var args = [pai_num,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao.subPaiRound error");
            utils.invokeCallback(cb,err, null);
        }else{
            console.log("TDKGameDao.subPaiRound success");
            utils.invokeCallback(cb,null,200);
        }
    });
};

/**
 * 设置当前牌局的局数
 * */
TDKGameDao.subRound = function(rid,round,cb){
    var sql = "update tdk_game_room set round = round + ? where rid = ?";
    var args = [round,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao.subRound error");
            utils.invokeCallback(cb,err, null);
        }else{
            console.log("TDKGameDao.subRound success");
			TDKGameDao.getRound(rid,function(err,resRound){
				utils.invokeCallback(cb,null,resRound);
			});
        }
    });
};

/**
 * 回调函数获取目前牌局的局数
 * */
TDKGameDao.getRound = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao.getRound");
            utils.invokeCallback(cb,err, null);
        }else{
            utils.invokeCallback(cb,null,res[0].round);
        }
    });
};

/**
 * 回调函数获取目前发牌的张数
 * */
TDKGameDao.getPaiRound = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao.getPaiPlayer");
            utils.invokeCallback(cb,err, null);
        }else{
            utils.invokeCallback(cb,null,res[0].pai_round);
        }
    });
};

/**
 * 设置发牌的开始玩家
 * */
TDKGameDao.setFirstFaPai = function(rid,cur_player,cb){
    var sql = "update tdk_game_room set first_fapai = ? where rid = ?";
    var args = [cur_player,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("db:setFirstFaPai error");
            utils.invokeCallback(cb,err, null);
        }else{
            console.log("db:setFirstFaPai success");
            utils.invokeCallback(cb,null, cur_player);
        }
    });
};

/**
 * 设置当前发牌的最大一张牌和位置 num*location
 * */
TDKGameDao.setMaxPai = function(rid,num_location,cb){
    var sql = "update tdk_game_room set max_pai = ? where rid = ?";
    var args = [num_location,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao.setMaxPai error");
            utils.invokeCallback(cb,err, null);
        }else{
            console.log("TDKGameDao.setMaxPai success");
            utils.invokeCallback(cb,null, num_location);
        }
    });
};

/**
 * 获取当前发牌中的最大的牌及位置
 * */
TDKGameDao.getMaxPai = function(rid,cb){
    var sql = "select * from tdk_game_room where rid = ?";
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("TDKGameDao.getMaxPai error");
            utils.invokeCallback(cb,err, null);
        }else{
            //cb(res[0].current_player);
            utils.invokeCallback(cb,null, res[0].max_pai);
        }
    });
};

/**
 * 根据当前正在出牌的玩家，更改为下一个出牌的玩家
 * */
TDKGameDao.nextCurPlayer = function(rid,cb){
    var sql = "select * from tdk_game_room where rid = ?";
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getCurPlayer error");
            utils.invokeCallback(cb,err, null);
        }else{
            var i = res[0].current_player;
            TDKGameDao.getIsGameNum(rid,function(err,returnArr){
                for(var j=i+1;j<10;j++){
                    if(j>5){
                        j=j-5;
                    }
                    if(returnArr[j] > 1){
                        var sql = "update tdk_game_room set current_player = ? where rid = ?";
                        var args = [j,rid];
                        sqlTemp.update(sql,args,function(err,res){
                            if(err!==null){
                                console.error("db:getCurPlayer error");
                                utils.invokeCallback(cb,err, null);
                            }else{
                                //cb(res[0].current_player);
                                console.log("db:getCurPlayer success");
                                //cb(j);
                                utils.invokeCallback(cb,null, j);
                            }
                        });
                        break;
                    }
                }
            });

        }
    });
};

/**
 * 获取当前正在出牌的玩家
 * */
TDKGameDao.getCurPlayer = function(rid,cb){
    var sql = "select * from tdk_game_room where rid = ?";
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getCurPlayer error");
            utils.invokeCallback(cb,err, null);
        }else{
            //cb(res[0].current_player);
            utils.invokeCallback(cb,null, res[0].current_player);
        }
    });
};

TDKGameDao.setStartGolds = function(rid,pgolds,cb){
	var sql = 'update tdk_game_room set start_golds = ? where rid = ?';
	var args = [pgolds,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("TDKGameDao.setStartGolds error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log("TDKGameDao.setStartGolds succeed");
			utils.invokeCallback(cb, null, null);
		}
	});
};

TDKGameDao.getStartGolds = function(rid,cb){
	var sql = 'select * from tdk_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("TDKGameDao.getStartGolds error");
			utils.invokeCallback(cb, err, null);
		}else {
			if(!!res && res.length > 0){
				if(res[0].start_golds == null || res[0].start_golds == 'null'){
					utils.invokeCallback(cb, null,null);
				}else{
					utils.invokeCallback(cb, null, JSON.parse(res[0].start_golds));
				}
			}else{
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};
/**
 * timeout mark set
 * */
TDKGameDao.setTimeoutMark = function(rid,time_mark,cb){
    var sql = 'update tdk_game_room set timeout_mark = ? where rid = ? ';
    var args = [time_mark,rid];
    sqlTemp.update(sql,args,function(err,res){
        if(err!==null){
            console.error("db:setTimeoutMark error");
            utils.invokeCallback(cb,err, null);
        }else {
            console.log("db:setTimeoutMark success");
            //cb();
            utils.invokeCallback(cb,null, null);
        }
    });
};

/**
 * time out get
 * */
TDKGameDao.getTimeoutMark = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid=?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getTimeoutMark error");
            utils.invokeCallback(cb,err, null);
        }else{
            //cb(res[0].timeout_mark);
            utils.invokeCallback(cb,null, res[0].timeout_mark);
        }
    });
};

/**
 * set看牌标记
 * */
TDKGameDao.setOpenMark = function(rid,location,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:setOpenMark error");
            utils.invokeCallback(cb,err, null);
        }else{
            var ex_mark = res[0].open_mark;
            var cur_mark = ex_mark;
            switch(location){
                case 1:
                    if(ex_mark<10000){
                        cur_mark = ex_mark+10000;
                    }
                    break;
                case 2:
                    if((ex_mark%10000)<1000){
                        cur_mark = ex_mark+1000;
                    }
                    break;
                case 3:
                    if((ex_mark%1000)<100){
                        cur_mark = ex_mark+100;
                    }
                    break;
                case 4:
                    if((ex_mark%100)<10){
                        cur_mark = ex_mark+10;
                    }
                    break;
                case 5:
                    if((ex_mark%10)<1){
                        cur_mark = ex_mark+1;
                    }
                    break;
                default:
                    console.error("db:setOpenMark1 input location error");
                    utils.invokeCallback(cb,"db:setOpenMark1 input location error", null);
            }
            var sql1 = 'update tdk_game_room set open_mark = ? where rid = ?';
            var args1 = [cur_mark,rid];
            sqlTemp.update(sql1,args1,function(err,res){
                if(err!==null){
                    console.error("db:setOpenMark update error");
                    utils.invokeCallback(cb,err, null);
                }else{
                    //cb();
                    utils.invokeCallback(cb,null, null);
                }
            });
        }
    });
};

/**
 * clean看牌标记
 * */
TDKGameDao.cleanOpenMark = function(rid,location,cb){
	console.log('go into cleanOpenMark:' + rid + ',' + location);
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:cleanOpenMark error" + JSON.stringify(err));
            utils.invokeCallback(cb,err, null);
        }else{
            var ex_mark = res[0].open_mark;
            var cur_mark = ex_mark;
            switch(location){
                case 1:
                    if(ex_mark>=10000){
                        cur_mark = ex_mark-10000;
                    }
                    break;
                case 2:
                    if((ex_mark%10000)>=1000){
                        cur_mark = ex_mark-1000;
                    }
                    break;
                case 3:
                    if((ex_mark%1000)>=100){
                        cur_mark = ex_mark-100;
                    }
                    break;
                case 4:
                    if((ex_mark%100)>=10){
                        cur_mark = ex_mark-10;
                    }
                    break;
                case 5:
                    if((ex_mark%10)>=1){
                        cur_mark = ex_mark-1;
                    }
                    break;
                default:
                    console.error("db:cleanOpenMark1 input location error");
                    utils.invokeCallback(cb,"db:cleanOpenMark1 input location error", null);
            }
            var sql1 = 'update tdk_game_room set open_mark = ? where rid = ?';
            var args1 = [cur_mark,rid];
            sqlTemp.update(sql1,args1,function(err,res){
                if(err!==null){
                    console.error("db:cleanOpenMark update error");
                    utils.invokeCallback(cb, err, null);
                }else{
                    //cb();
                    utils.invokeCallback(cb, null, null);
                }
            });
        }
    });
};

/**
 * get看牌标记
 * */
TDKGameDao.getOpenMark = function(rid,location,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
        if(err!==null){
            console.error("db:getOpenMark error");
            utils.invokeCallback(cb,err, null);
        }else{
            var open_mark = res[0].open_mark;
            switch (location){
                case 1:
                    if(open_mark>=10000){
                        //cb(1);  //1表示已经看牌，0表示没有看牌
                        utils.invokeCallback(cb, null, 1);
                    }else{
                        //cb(0);
                        utils.invokeCallback(cb, null, 0);
                    }
                    break;
                case 2:
                    if((open_mark%10000)>=1000){
                        //cb(1);  //1表示已经看牌，0表示没有看牌
                        utils.invokeCallback(cb, null, 1);
                    }else{
                        //cb(0);
                        utils.invokeCallback(cb, null, 0);
                    }
                    break;
                case 3:
                    if((open_mark%1000)>=100){
                        //cb(1);  //1表示已经看牌，0表示没有看牌
                        utils.invokeCallback(cb, null, 1);
                    }else{
                        //cb(0);
                        utils.invokeCallback(cb, null, 0);
                    }
                    break;
                case 4:
                    if((open_mark%100)>=10){
                        //cb(1);  //1表示已经看牌，0表示没有看牌
                        utils.invokeCallback(cb, null, 1);
                    }else{
                        //cb(0);
                        utils.invokeCallback(cb, null, 0);
                    }
                    break;
                case 5:
                    if((open_mark%10)>=1){
                        //cb(1);  //1表示已经看牌，0表示没有看牌
                        utils.invokeCallback(cb, null, 1);
                    }else{
                        //cb(0);
                        utils.invokeCallback(cb, null, 0);
                    }
                    break;
                default:
                    console.error("db:getOpenMark get location error");
                    utils.invokeCallback(cb,"db:getOpenMark get location error" , null);
            }
        }
    });
};

/**
 * @param rid  tdk_game_room
 * @param mark 0 or 1
 * @param cb
 */
TDKGameDao.setAllinMark = function(rid,mark,cb){
    if(mark!=0&&mark!=1){
        cb('error');
    }else{
        var sql = 'update tdk_game_room set allin_mark = ? where rid = ?';
        var args = [mark,rid];
        sqlTemp.update(sql,args,function(err,res){
            if(err!==null){
                console.error("db:setAllinMark error");
                utils.invokeCallback(cb, err, null);
            }else{
                //cb();
                utils.invokeCallback(cb, null, null);
            }
        });
    }
};

/**
 * @param rid
 * @param cb 返回allin_mark
 */
TDKGameDao.getAllinMark = function(rid,cb){
    var sql = 'select * from tdk_game_room where rid = ?';
    var args = [rid];
    sqlTemp.query(sql,args,function(err,res){
       if(err!=null){
           console.error("db:getAllinMark error");
           utils.invokeCallback(cb, err, null);
       } else{
           //cb(res[0].allin_mark);
           utils.invokeCallback(cb, null, res[0].allin_mark);
       }
    });
};

/**
 * 轻度重置数据
 * */
TDKGameDao.resetLight = function(rid,cb){
	TDKGameDao.getRoomInfo(rid,function(err,roomInfo){
		if(err!==null){
			console.error("TDKGameDao.resetLight");
			utils.invokeCallback(cb, err, null);
		}else{
			//清空所有的牌
			var sql = 'update tdk_game_room set pai1 = ?, pai2 = ?,pai3 = ?, pai4 = ?, pai5 = ?, current_chip = ? where rid=?';
			var args = ["null","null","null","null","null",roomInfo.basic_chip,rid];
			sqlTemp.update(sql,args,function(err,res){
				if(err!==null){
					console.error("TDKGameDao.resetLight" + err);
					utils.invokeCallback(cb, err, null);
				}else{
					console.log("resetdata level 1 succ......");
					sql = 'update tdk_game_room set open_mark = ? where rid=?';
					args = [0,rid];
					sqlTemp.update(sql,args,function(err,res){
						if(err!==null){
							console.error("TDKGameDao.resetLight" + err);
							utils.invokeCallback(cb, err, null);
						}else{
							console.log("resetdata level 2 succ......");
							sql = 'update tdk_game_room set max_pai=?,pai_round=?,winner=? where rid=?';
							var args = ["0*0",0,"null",rid];
							sqlTemp.update(sql,args,function(err,res){
								if(err!==null){
									console.error("TDKGameDao.resetLight" + err);
									utils.invokeCallback(cb, err, null);
								}else{
									console.log("resetdata level 3 succ......");
									utils.invokeCallback(cb, null, null);
								}
							});
						}
					});
				}
			});
		}
	});
};

/**
 * 重置数据
 * */
TDKGameDao.resetData = function(rid,cb){
    TDKGameDao.getRoomInfo(rid,function(err,roomInfo){
        if(err!==null){
            console.error("db:resetData1 error");
            utils.invokeCallback(cb, err, null);
        }else{
			//清空所有的牌
			var sql = 'update tdk_game_room set pai1 = ?, pai2 = ?,pai3 = ?, pai4 = ?, pai5 = ?, current_chip = ?, all_chip=? where rid=?';
			var args = ["null","null","null","null","null",roomInfo.basic_chip,0,rid];
			sqlTemp.update(sql,args,function(err,res){
				if(err!==null){
					console.error("db:resetData error" + err);
					utils.invokeCallback(cb, err, null);
				}else{
					console.log("resetdata level 1 succ......");
					sql = 'update tdk_game_room set is_gaming=?,is_game_1=?,is_game_2=?,is_game_3=?,is_game_4=?,is_game_5=? where rid=?';
					args = [0,0,0,0,0,0,rid];
					sqlTemp.update(sql,args,function(err,res){
						if(err!==null){
							console.error("db:resetData error" + err);
							utils.invokeCallback(cb, err, null);
						}else{
							console.log("resetdata level 2 succ......");
							sql = 'update tdk_game_room set first_fapai=?,open_mark=?,max_pai=?,winner=? where rid=?';
							var args = [roomInfo.first_fapai,0,"0*0",roomInfo.winner,rid];
							sqlTemp.update(sql,args,function(err,res){
								if(err!==null){
									console.error("db:resetData error" + err);
									utils.invokeCallback(cb, err, null);
								}else{
									console.log("resetdata level 3 succ......");
									utils.invokeCallback(cb, null, null);
								}
							});
						}
					});
				}
            });
        }
    });
};
