/**
 * Created by wuningjian on 2/26/16.
 */
var ZHQGameDao = module.exports;
var pomelo = require('pomelo');
var utils   = require('../util/utils');
var sqlTemp = pomelo.app.get('dbclient');

//该js文件都是对数据表zhq_game_room进行操作

/**
 * 新建房间
 * */
ZHQGameDao.createRoomByPlayerId = function(playerId,masterName,roomType,tianXuan,totalRound,basicChip,maxChip,renShu,cb){
	console.log("create room by player id:" + playerId + 'roomType:' + roomType + ' master name:' + masterName);
	var roomNum = utils.random6num();
	callback = function(err,res){
		console.log('callback the room by roomNum...',err,res);
		if(err!==null){
			console.error("db:createRoom error");
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				roomNum = utils.random6num();
				ZHQGameDao.getRoomByRoomNum(roomNum,callback);
			}else{
				console.log("getRoom: no found room......");
			}
		}
	};
	ZHQGameDao.getRoomByRoomNum(roomNum,callback);

	var sql = 'insert into zhq_game_room (master,master_name,game_type,room_num,total_round,all_player_num,tian_xuan,max_chip,basic_chip) values(?,?,?,?,?,?,?,?,?)';
	var args = [playerId,masterName,roomType,roomNum,totalRound,renShu,tianXuan,maxChip,basicChip];
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

ZHQGameDao.getRoomByRoomNum = function(roomNum,cb){
	var sql = 'select * from zhq_game_room where room_num = ?';
	var args = [roomNum];
	console.log('start select zhq_game_room by room_num:',roomNum);
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getRoomByRoomNum error......");
			utils.invokeCallback(cb,err,null);
		}else{
			console.log('select zhq_game_room : result',res);
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
 * @param cb		返回房间号rid
 */
ZHQGameDao.returnRoom = function(room_num, cb){
	var sql = 'select * from zhq_game_room where room_num = ?';
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
ZHQGameDao.addPlayer = function(rid,uid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	var new_player_num;
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:addPlayer1 error");
			utils.invokeCallback(cb,err,null);
		}else{
			//更改玩家数量
			console.log("zhq_game_room info:"+JSON.stringify(res));
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
			var sql1 = 'update zhq_game_room set player_num = ? where rid = ?';
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
							sql2 = 'update zhq_game_room set location1 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 2:
							sql2 = 'update zhq_game_room set location2 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 3:
							sql2 = 'update zhq_game_room set location3 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 4:
							sql2 = 'update zhq_game_room set location4 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 5:
							sql2 = 'update zhq_game_room set location5 = ? where rid = ?';
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
ZHQGameDao.getLocalPlayer = function(rid,location,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
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
ZHQGameDao.getPlayerLocal = function(rid,player,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	var location;
	console.log("--------------player input getplayerlocal"+player);
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getPlayerLocal error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log('get room info by rid' + JSON.stringify(res))
			if(player == res[0].location1.split('*')[0]){
				location = 1;
			}else if(player == res[0].location2.split('*')[0]){
				location = 2;
			}else if(player == res[0].location3.split('*')[0]){
				location = 3;
			}else if(player == res[0].location4.split('*')[0]){
				location = 4;
			}else if(player == res[0].location5.split('*')[0]){
				location = 5;
			}else {
				console.error("db:getPlayerLocal2 error");
				utils.invokeCallback(cb, "db:getPlayerLocal2 error", null);
			}
			//cb(location);
			utils.invokeCallback(cb,null , location);
		}
	});
};

/**
 *玩家离开房间
 */
ZHQGameDao.rmPlayer = function(rid,uid,cb){
	var sql = "select * from zhq_game_room where rid = ?";
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
			var sql1 = 'update zhq_game_room set player_num = ? where rid = ?';
			var args1 = [new_player_num,rid];
			sqlTemp.update(sql1,args1,function(err,res1){
				if(err!==null){
					console.error("db:rmPlayer1 failed" + JSON.stringify(err));
					utils.invokeCallback(cb, err, null);
				}else{
					console.log("db:rmPlayer1 succeed");
				}
			});

			var sql2 = 'update zhq_game_room set location1 = ? where rid =?';
			var args2 = ['null',rid];
			//重置location12345和is_game_12345值
			if(res[0].location1==uid){
				sql2 = 'update zhq_game_room set location1 = ? where rid =?';
			}else if(res[0].location2==uid){
				sql2 = 'update zhq_game_room set location2 = ? where rid =?';
			}else if(res[0].location3==uid){
				sql2 = 'update zhq_game_room set location3 = ? where rid =?';
			}else if(res[0].location4==uid){
				sql2 = 'update zhq_game_room set location4 = ? where rid =?';
			}else if(res[0].location5==uid){
				sql2 = 'update zhq_game_room set location5 = ? where rid =?';
			}
			sqlTemp.update(sql2,args2,function(err,res){
				if(err!==null){
					console.error("db:rmPlayer2_5 failed");
					utils.invokeCallback(cb, err, null);
				}
			});
		}
		utils.invokeCallback(cb, null, null);
	});
};
//
/**
 * get room infomation
 * */
ZHQGameDao.getRoomInfo = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
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
ZHQGameDao.getRoomStatus = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.log("db:getRoomStatus error");
			utils.invokeCallback(cb, err, null);
		}else{
			//cb(res[0].is_gaming);
			if(!!res && res.length > 0){
				utils.invokeCallback(cb, null, res[0].is_gaming);
			}else{
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

/**
 * 更新房间游戏状态
 * */
ZHQGameDao.updateRoomStatus = function(rid,game_status,cb){
	//game_status 0 or 1   0:no game 1:gaming
	var sql = 'update zhq_game_room set is_gaming = ? where rid = ?';
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
 * 设置当前玩家的出的牌
 * */
ZHQGameDao.setLastPai = function(rid,pai,cb){

	var args =[JSON.stringify(pai),rid];
	var sql = 'update zhq_game_room set last_pai = ? where rid = ?';
	sqlTemp.update(sql,args,function(err,res){
		console.log(args);
		if(err!==null){
			console.error("db:updatePai error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log("db:updatePai succeed");
			utils.invokeCallback(cb, null, null);
		}
	});
};

ZHQGameDao.setFirstFinish = function(rid,location,cb){
	var args =[location,rid];
	var sql = 'update zhq_game_room set first_finish = ? where rid = ?';
	sqlTemp.update(sql,args,function(err,res){
		console.log(args);
		if(err!==null){
			console.error("ZHQGameDao.setFirstFinish error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log("ZHQGameDao.setFirstFinish succeed");
			utils.invokeCallback(cb, null, null);
		}
	});
};
/**
 * 查询最近出牌的记录
 * */
ZHQGameDao.getLastPai = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.log("db:getLastPai error");
			utils.invokeCallback(cb, err, null);
		}else{
			if(!!res && res.length > 0){
				if(res[0].last_pai == 'null' || res[0].last_pai == null){
					utils.invokeCallback(cb, null, 'null');
				}else{
					utils.invokeCallback(cb, null, JSON.parse(res[0].last_pai));
				}
			}else{
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

ZHQGameDao.getFirstFinish = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.log("ZHQGameDao.getFirstFinish error");
			utils.invokeCallback(cb, err, null);
		}else{
			if(!!res && res.length > 0){
				utils.invokeCallback(cb, null, res[0].first_finish);
			}else{
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

/**
 * 设置当前出牌的玩家
 * */
ZHQGameDao.setLastLocation = function(rid,location,cb){

	var args =[location,rid];
	var sql = 'update zhq_game_room set last_location = ? where rid = ?';
	sqlTemp.update(sql,args,function(err,res){
		console.log(args);
		if(err!==null){
			console.error("db:updatePai error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log("db:updatePai succeed");
			utils.invokeCallback(cb, null, null);
		}
	});
};

/**
 * 查询最近出牌的记录
 * */
ZHQGameDao.getLastLocation = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.log("db:getLastPai error");
			utils.invokeCallback(cb, err, null);
		}else{
			if(!!res && res.length > 0){
				utils.invokeCallback(cb, null, res[0].last_location);
			}else{
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

/**
 * 设置开始发牌的玩家
 * */
ZHQGameDao.setFirstFaPai = function(rid,location,cb){

	var args =[location,rid];
	var sql = 'update zhq_game_room set first_fapai = ? where rid = ?';
	sqlTemp.update(sql,args,function(err,res){
		console.log(args);
		if(err!==null){
			console.error("db:updatePai error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log("db:updatePai succeed");
			utils.invokeCallback(cb, null, null);
		}
	});
};

/**
 * 查询开始发牌的玩家
 * */
ZHQGameDao.getFirstFaPai = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.log("db:getLastPai error");
			utils.invokeCallback(cb, err, null);
		}else{
			if(!!res && res.length > 0){
				utils.invokeCallback(cb, null, res[0].first_fapai);
			}else{
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

ZHQGameDao.setStartGolds = function(rid,pgolds,cb){
	var sql = 'update zhq_game_room set start_golds = ? where rid = ?';
	var args = [pgolds,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("ZHQGameDao.setStartGolds error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log("ZHQGameDao.setStartGolds succeed");
			utils.invokeCallback(cb, null, null);
		}
	});
};

ZHQGameDao.getStartGolds = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("ZHQGameDao.getStartGolds error");
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
 * 更新牌型，牌型与玩家位置绑定
 * */
ZHQGameDao.updatePai = function(rid,pai,location,cb){
	var sql;
	var args =['null',rid];
	if(pai != 'null'){
		args[0] = JSON.stringify(pai);
	}
	switch (location){
		case 1:
			sql = 'update zhq_game_room set pai1 = ? where rid = ?';
			break;
		case 2:
			sql = 'update zhq_game_room set pai2 = ? where rid = ?';
			break;
		case 3:
			sql = 'update zhq_game_room set pai3 = ? where rid = ?';
			break;
		case 4:
			sql = 'update zhq_game_room set pai4 = ? where rid = ?';
			break;
		case 5:
			sql = 'update zhq_game_room set pai5 = ? where rid = ?';
			break;
		default:
			console.error("db:ZHQGameDao updatePai location error");
	}
	sqlTemp.update(sql,args,function(err,res){
		console.log(args);
		if(err!==null){
			console.error("db:updatePai error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log("db:updatePai succeed");
			utils.invokeCallback(cb, null, null);
		}
	});
};

/**
 * 获取对应位置的牌型,牌型存放数据库类型是字符串类型，程序使用时是json格式
 * */
ZHQGameDao.getPai = function(rid,location,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:pushPai error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log("getPai res:"+res);
			switch (location){
				case 1:
					if(res[0].pai1 == 'null'){
						utils.invokeCallback(cb, null, 'null');
					}else{
						utils.invokeCallback(cb, null, JSON.parse(res[0].pai1));
					}
					break;
				case 2:
					if(res[0].pai2 == 'null'){
						utils.invokeCallback(cb, null, 'null');
					}else{
						utils.invokeCallback(cb, null, JSON.parse(res[0].pai2));
					}
					break;
				case 3:
					if(res[0].pai3 == 'null'){
						utils.invokeCallback(cb, null, 'null');
					}else{
						utils.invokeCallback(cb, null, JSON.parse(res[0].pai3));
					}
					break;
				case 4:
					if(res[0].pai4 == 'null'){
						utils.invokeCallback(cb, null, 'null');
					}else{
						utils.invokeCallback(cb, null, JSON.parse(res[0].pai4));
					}
					break;
				case 5:
					if(res[0].pai5 == 'null'){
						utils.invokeCallback(cb, null, 'null');
					}else{
						utils.invokeCallback(cb, null, JSON.parse(res[0].pai5));
					}
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
ZHQGameDao.getAllPai = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getAllPai error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log("getPai res:"+res);
			allPai = new Array();
			if(res[0].pai1 == 'null'){
				allPai.push('null');
			}else{
				allPai.push(JSON.parse(res[0].pai1));
			}
			if(res[0].pai2 == 'null'){
				allPai.push('null');
			}else{
				allPai.push(JSON.parse(res[0].pai2));
			}
			if(res[0].pai3 == 'null'){
				allPai.push('null');
			}else{
				allPai.push(JSON.parse(res[0].pai3));
			}
			if(res[0].pai4 == 'null'){
				allPai.push('null');
			}else{
				allPai.push(JSON.parse(res[0].pai4));
			}
			if(res[0].pai5 == 'null'){
				allPai.push('null');
			}else{
				allPai.push(JSON.parse(res[0].pai5));
			}
			utils.invokeCallback(cb,null,allPai);
		}
	});
};

/**
 * 修改当前注数数据库操作函数
 * */
ZHQGameDao.setCurrentChip = function(rid, new_chip,cb){
	var sql = 'update zhq_game_room set current_chip = ? where rid = ?';
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
 * 设置亮A的标志
 * */
ZHQGameDao.setMarkA = function(rid, mark,cb){
	var sql = 'update zhq_game_room set mark_a = ? where rid = ?';
	var args = [mark,rid];
	console.log("db:setMarkA: "+args);
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("db:setMarkA error");
			utils.invokeCallback(cb, err, null);
			//cb(new_chip);
		}else{
			console.log("db:setMarkA succeed");
			//cb(new_chip);
			utils.invokeCallback(cb, null, mark);
		}
	});
};

/**
 * 获取当前注数数据库操作函数
 * */
ZHQGameDao.getCurrentChip = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getCurrentChip error");
			utils.invokeCallback(cb, err, null);
		}else {
			//cb(res[0].current_chip);
			if(!!res && res.length > 0){
				utils.invokeCallback(cb, null, res[0].current_chip);
			}else{
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

/**
 * 获取这局 玩家配置的 玩家的数量
 * */
ZHQGameDao.getAllPlayerNum = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getAllPlayerNum error");
			utils.invokeCallback(cb, err, null);
		}else {
			if(!!res && res.length > 0){
				utils.invokeCallback(cb, null, res[0].all_player_num);
			}else{
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

/**
 * 修改throw_num
 * */
ZHQGameDao.setThrowNum = function(rid,value,cb){
	var sql = 'update zhq_game_room set throw_num = throw_num + ? where rid = ?';
	var args = [value,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("db:setThrowNum error");
			utils.invokeCallback(cb,err, null);
		}else{
			console.log("db:setThrowNum success");
			utils.invokeCallback(cb,null, null);
		}
	});
};

/**
 * 回调函数查询throw_num
 * */
ZHQGameDao.getThrowNum = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getIsGameNum error");
			utils.invokeCallback(cb,err, null);
		}else{
			utils.invokeCallback(cb,null,res[0].throw_num);
		}
	});
};

/**
 * 设置当前出牌玩家
 * */
ZHQGameDao.setCurPlayer = function(rid,cur_player,cb){
	var sql = "update zhq_game_room set current_player = ? where rid = ?";
	var args = [cur_player,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getCurPlayer error");
			utils.invokeCallback(cb,err, null);
		}else{
			console.log("db:getCurPlayer success");
			utils.invokeCallback(cb,null, cur_player);
		}
	});
};

/**
 * 根据当前正在出牌的玩家，更改为下一个出牌的玩家
 * */
ZHQGameDao.nextCurPlayer = function(rid,cb){
	var sql = "select * from zhq_game_room where rid = ?";
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getCurPlayer error");
			utils.invokeCallback(cb,err, null);
		}else{
			var i = res[0].current_player;
			ZHQGameDao.getIsGameNum(rid,function(err,returnArr){
				for(var j=i+1;j<10;j++){
					if(j>5){
						j=j-5;
					}
					if(returnArr[j] >=1){
						var sql = "update zhq_game_room set current_player = ? where rid = ?";
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

ZHQGameDao.getNextCurPlayer = function(rid,cb){
	var sql = "select * from zhq_game_room where rid = ?";
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getCurPlayer error");
			utils.invokeCallback(cb,err, null);
		}else{
			var i = res[0].current_player;
			ZHQGameDao.getIsGameNum(rid,function(err,returnArr){
				for(var j=i+1;j<10;j++){
					if(j>5){
						j=j-5;
					}
					if(returnArr[j] >=1){
						utils.invokeCallback(cb,null, j);
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
ZHQGameDao.getCurPlayer = function(rid,cb){
	var sql = "select * from zhq_game_room where rid = ?";
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

/**
 * 设置拥有黑A的玩家
 * */
ZHQGameDao.setHeiA = function(rid,locations,cb){
	var sql = 'update zhq_game_room set hei_a = ? where rid = ? ';
	var args = [JSON.stringify(locations),rid];
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
 * 获取拥有黑A的玩家
 * */
ZHQGameDao.getHeiA = function(rid,cb){
	var sql = "select * from zhq_game_room where rid = ?";
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getCurPlayer error");
			utils.invokeCallback(cb,err, null);
		}else{
			//cb(res[0].current_player);
			utils.invokeCallback(cb,null, JSON.parse(res[0].hei_a));
		}
	});
};

/**
 * 设置isGame 状态
 * */
ZHQGameDao.setIsGame = function(rid,location,isGame,cb){
	var sql = '';
	if(location == 1){
		sql = 'update zhq_game_room set  is_game_1 = ? where rid = ? ';
	}else if(location == 2){
		sql = 'update zhq_game_room set  is_game_2 = ? where rid = ? ';
	}else if(location == 3){
		sql = 'update zhq_game_room set  is_game_3 = ? where rid = ? ';
	}else if(location == 4){
		sql = 'update zhq_game_room set  is_game_4 = ? where rid = ? ';
	}else if(location == 5){
		sql = 'update zhq_game_room set  is_game_5 = ? where rid = ? ';
	}else{
		console.error("db:setIsGame error location is invaild");
	}

	var args = [isGame,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("db:setIsGame error" + JSON.stringify(err));
			utils.invokeCallback(cb,err, null);
		}else {
			console.log("db:setIsGame success");
			//cb();
			utils.invokeCallback(cb,null, null);
		}
	});
};

ZHQGameDao.getPlayerIsGameNum = function(rid,location,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getIsGameNum error");
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
				utils.invokeCallback(cb,'invaild location',null);
			}
		}
	});
};

/**
 * 修改is_game_(12345)
 * */
ZHQGameDao.setIsGameNum = function(rid,location,value,cb){
	var sql;
	switch(location){
		case 1:
			sql = 'update zhq_game_room set is_game_1 = ? where rid = ?';
			break;
		case 2:
			sql = 'update zhq_game_room set is_game_2 = ? where rid = ?';
			break;
		case 3:
			sql = 'update zhq_game_room set is_game_3 = ? where rid = ?';
			break;
		case 4:
			sql = 'update zhq_game_room set is_game_4 = ? where rid = ?';
			break;
		case 5:
			sql = 'update zhq_game_room set is_game_5 = ? where rid = ?';
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
 * 获取isGame 状态
 * */
ZHQGameDao.getIsGame = function(rid,location,cb){
	var sql = "select * from zhq_game_room where rid = ?";
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getCurPlayer error");
			utils.invokeCallback(cb,err, null);
		}else{
			switch(location){
				case 1:
					utils.invokeCallback(cb,null,res[0].is_game_1);
					break;
				case 2:
					utils.invokeCallback(cb,null,res[0].is_game_2);
					break;
				case 3:
					utils.invokeCallback(cb,null,res[0].is_game_3);
					break;
				case 4:
					utils.invokeCallback(cb,null,res[0].is_game_4);
					break;
				case 5:
					utils.invokeCallback(cb,null,res[0].is_game_5);
					break;
				default:
					break;
			}
		}
	});
};

/**
 * 设置MarkFlag
 * */
ZHQGameDao.setMarkFlag = function(rid,mark,cb){
	var sql = 'update zhq_game_room set mark_flag = ? where rid = ? ';
	var args = [JSON.stringify(mark),rid];
	console.log("ZHQGameDao.setMarkFlag:" + args);
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("ZHQGameDao.setMarkFlag error" + err);
			utils.invokeCallback(cb,err, null);
		}else {
			console.log("ZHQGameDao.setMarkFlag success");
			utils.invokeCallback(cb,null, null);
		}
	});
};

/**
 * 获取MarkFlag
 * */
ZHQGameDao.getMarkFlag = function(rid,cb){
	var sql = "select * from zhq_game_room where rid = ?";
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getCurPlayer error");
			utils.invokeCallback(cb,err, null);
		}else{
			utils.invokeCallback(cb,null, JSON.parse(res[0].mark_flag));
		}
	});
};

/**
 * 回调函数将所有位置is_game用一个数组进行返回
 * */
ZHQGameDao.getIsGameNum = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
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

/**
 * timeout mark set
 * */
ZHQGameDao.setTimeoutMark = function(rid,time_mark,cb){
	var sql = 'update zhq_game_room set timeout_mark = ? where rid = ? ';
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
 * 设置当前牌局的局数
 * */
ZHQGameDao.subRound = function(rid,round,cb){
	var sql = "update zhq_game_room set round = round + ? where rid = ?";
	var args = [round,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("ZHQGameDao.subRound error");
			utils.invokeCallback(cb,err, null);
		}else{
			console.log("ZHQGameDao.subRound success");
			ZHQGameDao.getRound(rid,function(err,resRound){
				utils.invokeCallback(cb,null,resRound);
			});
		}
	});
};

/**
 * 回调函数获取目前牌局的局数
 * */
ZHQGameDao.getRound = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("ZHQGameDao.getRound");
			utils.invokeCallback(cb,err, null);
		}else{
			utils.invokeCallback(cb,null,res[0].round);
		}
	});
};

/**
 * time out get
 * */
ZHQGameDao.getTimeoutMark = function(rid,cb){
	var sql = 'select * from zhq_game_room where rid=?';
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
 * 重置数据
 * */
ZHQGameDao.resetData = function(rid,cb){
	ZHQGameDao.getRoomInfo(rid,function(err,roomInfo){
		if(err!==null){
			console.error("ZHQGameDao.resetData error");
			utils.invokeCallback(cb, err, null);
		}else{
			var sql = 'update zhq_game_room set pai1 = ?, pai2 = ?,pai3 = ?, pai4 = ?, pai5 = ?,last_location = ? , last_pai=? where rid=?';
			var args =["null","null","null","null","null",0,'null',rid];
			sqlTemp.update(sql,args,function(err,res){
				if(err!==null){
					console.error("ZHQGameDao.resetData " + err);
					utils.invokeCallback(cb, err, null);
				}else{
					sql = 'update zhq_game_room set is_gaming=?, current_chip = ?,current_player=? ,throw_num=?,hei_a = ?,first_finish=? where rid=?';
					args =[0,0,0,0,'null',0,rid];
					sqlTemp.update(sql,args,function(err,res){
						if(err!==null){
							console.error("ZHQGameDao.resetData level 2 error" + err);
							utils.invokeCallback(cb, err, null);
						}else{
							console.log("ZHQGameDao.resetData level 2 success");
							sql = 'update zhq_game_room set is_game_1 = ?,is_game_2 = ?,is_game_3 = ?,is_game_4 = ?,is_game_5 = ? where rid=?';
							args =[0,0,0,0,0,rid];
							sqlTemp.update(sql,args,function(err,res){
								if(err!==null){
									console.error("ZHQGameDao.resetData level 3 error" + err);
									utils.invokeCallback(cb, err, null);
								}else{
									console.log("ZHQGameDao.resetData level 3 success");
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
