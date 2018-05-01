/**
 * Created by wuningjian on 2/26/16.
 */
var gameDao = module.exports;
var pomelo = require('pomelo');
var utils   = require('../util/utils');
var sqlTemp = pomelo.app.get('dbclient');

//该js文件都是对数据表game_room进行操作

gameDao.create_room_by_player_id = function(player_id,nick_name,room_type,renshu,max_type,fangka_type,wait_time,fangka_num,cb){
/*{{{*/
	var room_num = utils.random6num();

	var now = Date.now();
	var sql = 'insert into game_room (room_num,fangzhu_id,fangzhu_name,game_type,wait_time,player_num,max_type,fangka_num,fangka_type,creat_time) values(?,?,?,?,?,?,?,?,?,?)';
	var args = [room_num,player_id,nick_name,room_type,parseInt(wait_time),renshu,max_type,fangka_num,fangka_type,now];
	sqlTemp.insert(sql,args,function(err,res){
		if(err!==null){
			console.error("db:createRoom error");
			utils.invokeCallback(cb,err,null)
		}else{
			utils.invokeCallback(cb,null,res.insertId);
		}
	});
/*}}}*/
};

gameDao.get_room_by_room_id = function(rid,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				console.log("getRoom:"+JSON.stringify(res));
				utils.invokeCallback(cb,null,res[0]);
			}else{
				console.log("getRoom: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.get_room_by_room_num = function(room_num,cb){
/*{{{*/
	var sql = 'select * from game_room where room_num = ?';
	var args = [room_num];
	console.log('start select game_room by room_num:',room_num);
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:get_room_by_room_num error......");
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				console.log("getRoom:"+JSON.stringify(res));
				utils.invokeCallback(cb,null,res[0]);
			}else{
				console.log("getRoom: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.add_player = function(rid,uid,location,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	var new_player_num;
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:add_player step 1 error");
			utils.invokeCallback(cb,err,null);
		}else{
			//更改玩家数量
			new_player_num = res[0].real_num+1;
			var sql1 = 'update game_room set real_num = ? where rid = ?';
			var args1 = [new_player_num,rid];
			console.log("args1:",args1,location);
			sqlTemp.update(sql1,args1,function(err,res){
				if(err!==null){
					console.error("db:add_player step 2 error");
					utils.invokeCallback(cb,err,null);
				}else{
					console.log("db:add_player step 1 success");
					//location 添加对应玩家名
					var sql2 = '';
					var args2 = [];
					switch(location){
						case 1:
							sql2 = 'update game_room set location1 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 2:
							sql2 = 'update game_room set location2 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 3:
							sql2 = 'update game_room set location3 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 4:
							sql2 = 'update game_room set location4 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						default:
							console.error("add_player step 3 error");
					}
					sqlTemp.update(sql2,args2,function(err,res){
						if(err!==null){
							console.error("db:add_player step 3 error");
							utils.invokeCallback(cb,err,null);
						}else{
							console.log("add_player step 3 success");
							//cb(location,new_player_num);
							utils.invokeCallback(cb,err,new_player_num);
						}
					});
				}
			});
		}
	});
/*}}}*/

};

gameDao.add_wait_time = function(rid,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:add_wait_time step 1 error");
			utils.invokeCallback(cb,err,null);
		}else{
			var wait_time = res[0].wait_time + 2;
			var sql1 = 'update game_room set wait_time = ? where rid = ?';
			var args1 = [wait_time,rid];
			console.log("args1:",args1);
			sqlTemp.update(sql1,args1,function(err,res){
				if(err!==null){
					console.error("db:add_wait_time step 2 error");
					utils.invokeCallback(cb,err,null);
				}else{
					console.log("db:add_wait_time step 1 success");
					utils.invokeCallback(cb,err,wait_time);
				}
			});
		}
	});
/*}}}*/
};

gameDao.dissolve_room = function(rid,cb){
/*{{{*/
	var sql = 'update game_room set is_gaming = ? where rid = ?';
	var args = [-1,rid];
	console.log("args:",args);
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("db:dissolve_room error");
			utils.invokeCallback(cb,err,null);
		}else{
			console.log("db:dissolve_room success");
			utils.invokeCallback(cb,err,rid);
		}
	});
/*}}}*/
};

gameDao.leave_room = function(rid,location,cb){
/*{{{*/
	console.log("db:leave_room step 1 success");
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:leave_room step 1 error");
			utils.invokeCallback(cb,err,null);
		}else{
			var room_info = res[0];
			//location 添加对应玩家名
			var sql = '';
			var args = [];
			switch(location){
				case 1:
					sql = 'update game_room set location1 = ? where rid = ?';
					args = ["null",rid];
					break;
				case 2:
					sql = 'update game_room set location2 = ? where rid = ?';
					args = ["null",rid];
					break;
				case 3:
					sql = 'update game_room set location3 = ? where rid = ?';
					args = ["null",rid];
					break;
				case 4:
					sql = 'update game_room set location4 = ? where rid = ?';
					args = ["null",rid];
					break;
				default:
					console.error("leave_room step 2 error");
			}
			sqlTemp.update(sql,args,function(err,res){
				if(err!==null){
					console.error("db:leave_room step 2 error");
					utils.invokeCallback(cb,err,null);
				}else{
					console.log("leave_room step 2 success");
					//cb(location,new_player_num);
					sql = 'update game_room set real_num = read_num - 1 where rid = ?';
					args = [rid];
					sqlTemp.update(sql,args,function(err,res){
						if(err!==null){
							console.error("db:leave_room step 3 error");
							utils.invokeCallback(cb,err,null);
						}else{
							console.log("leave_room step 3 success");
							utils.invokeCallback(cb,err,res[0]);
						}
					});
				}
			});
		}
	});
/*}}}*/
};

gameDao.start_game = function(rid,cb){
/*{{{*/
	var sql = 'update game_room set is_gaming = ? where rid = ?';
	var args = [1,rid];
	console.log("args:",args);
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("db:start_game error");
			utils.invokeCallback(cb,err,null);
		}else{
			console.log("db:start_game success" + JSON.stringify(res));
			utils.invokeCallback(cb,err,rid);
		}
	});
/*}}}*/
};
/**
 * 查询数据库,通过room_num
 * @param basicChip 房间起注
 * @param cb		返回房间号rid
 */
gameDao.returnRoom = function(room_num, cb){
	var sql = 'select * from game_room where room_num = ?';
	var args = [room_num];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:returnRoom error......");
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
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
gameDao.addPlayer = function(rid,uid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	var new_player_num;
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:addPlayer1 error");
			utils.invokeCallback(cb,err,null);
		}else{
			//更改玩家数量
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
			var sql1 = 'update game_room set player_num = ? where rid = ?';
			var args1 = [new_player_num,rid];
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
							sql2 = 'update game_room set location1 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 2:
							sql2 = 'update game_room set location2 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 3:
							sql2 = 'update game_room set location3 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 4:
							sql2 = 'update game_room set location4 = ? where rid = ?';
							args2 = [uid,rid];
							break;
						case 5:
							sql2 = 'update game_room set location5 = ? where rid = ?';
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
gameDao.getLocalPlayer = function(rid,location,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:addPlayer3 error");
			utils.invokeCallback(cb,err,null,null);
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
					utils.invokeCallback(cb,err,null,null);
			}
		}
	});
};

/**
 * 返回玩家的房间对应位置
 * */
gameDao.get_player_local = function(rid,player_id,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	var location;
	console.log("--------------player input getplayerlocal"+player_id);
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getPlayerLocal error");
			utils.invokeCallback(cb, err, null);
		}else{
			if(player_id == res[0].location1.split('*')[0]){
				location = 1;
			}else if(player_id == res[0].location2.split('*')[0]){
				location = 2;
			}else if(player_id == res[0].location3.split('*')[0]){
				location = 3;
			}else if(player_id == res[0].location4.split('*')[0]){
				location = 4;
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
 * 设置当前牌局的局数
 * */
gameDao.subRound = function(rid,round,cb){
	var sql = "update game_room set round = round + ? where rid = ?";
	var args = [round,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("gameDao.subRound error");
			utils.invokeCallback(cb,err, null);
		}else{
			console.log("gameDao.subRound success");
			gameDao.getRound(rid,function(err,resRound){
				utils.invokeCallback(cb,null,resRound);
			});
		}
	});
};

/**
 * 回调函数获取目前牌局的局数
 * */
gameDao.getRound = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("gameDao.getRound");
			utils.invokeCallback(cb,err, null);
		}else{
			utils.invokeCallback(cb,null,res[0].round);
		}
	});
};

/**
 * 设置发牌的开始玩家
 * */
gameDao.setFirstFaPai = function(rid,cur_player,cb){
	var sql = "update game_room set first_fapai = ? where rid = ?";
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

gameDao.setWinner = function(rid,winner,cb){
	var sql = 'update game_room set winner = ? where rid = ?';
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

gameDao.getWinner = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("gameDao.getWinner");
			utils.invokeCallback(cb, err, null);
		}else {
			utils.invokeCallback(cb, null, res[0].winner);
		}
	});
};

/**
 *玩家离开房间
 */
gameDao.rmPlayer = function(rid,uid,cb){
	var sql = "select * from game_room where rid = ?";
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
			var sql1 = 'update game_room set player_num = ? where rid = ?';
			var args1 = [new_player_num,rid];
			sqlTemp.update(sql1,args1,function(err,res1){
				if(err!==null){
					utils.invokeCallback(cb, err, null);
				}else{
					console.log("db:rmPlayer1 succeed");
				}
			});

			//重置location12345和is_game_12345值
			if(res[0].location1==uid){
				var sql2 = 'update game_room set location1 = ?, is_game_1 = ? where rid =?';
				var args2 = ['null',0,rid];
				sqlTemp.update(sql2,args2,function(err,res){
					if(err!==null){
						console.error("db:rmPlayer2_1 failed");
						utils.invokeCallback(cb, err, null);
					}
				});
			}else if(res[0].location2==uid){
				var sql2 = 'update game_room set location2 = ?, is_game_2 = ? where rid =?';
				var args2 = ['null',0,rid];
				sqlTemp.update(sql2,args2,function(err,res){
					if(err!==null){
						console.error("db:rmPlayer2_2 failed");
						utils.invokeCallback(cb, err, null);
					}
				});
			}else if(res[0].location3==uid){
				var sql2 = 'update game_room set location3 = ?, is_game_3 = ? where rid =?';
				var args2 = ['null',0,rid];
				sqlTemp.update(sql2,args2,function(err,res){
					if(err!==null){
						console.error("db:rmPlayer2_3 failed");
						utils.invokeCallback(cb, err, null);
					}
				});
			}else if(res[0].location4==uid){
				var sql2 = 'update game_room set location4 = ?, is_game_4 = ? where rid =?';
				var args2 = ['null',0,rid];
				sqlTemp.update(sql2,args2,function(err,res){
					if(err!==null){
						console.error("db:rmPlayer2_4 failed");
						utils.invokeCallback(cb, err, null);
					}
				});
			}else if(res[0].location5==uid){
				var sql2 = 'update game_room set location5 = ?, is_game_5 = ? where rid =?';
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
gameDao.getRoomInfo = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	pomelo.app.get('dbclient').query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getRoomInfo error");
			utils.invokeCallback(cb, err, null);
		}else{
			if(!!res && res.length > 0){
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
gameDao.getRoomStatus = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
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
gameDao.updateRoomStatus = function(rid,game_status,cb){
	//game_status 0 or 1   0:no game 1:gaming
	var sql = 'update game_room set is_gaming = ? where rid = ?';
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
gameDao.updatePai = function(rid,pai,location,cb){
	var sql;
	var args =[JSON.stringify(pai),rid];
	switch (location){
		case 1:
			sql = 'update game_room set pai1 = ? where rid = ?';
			break;
		case 2:
			sql = 'update game_room set pai2 = ? where rid = ?';
			break;
		case 3:
			sql = 'update game_room set pai3 = ? where rid = ?';
			break;
		case 4:
			sql = 'update game_room set pai4 = ? where rid = ?';
			break;
		case 5:
			sql = 'update game_room set pai5 = ? where rid = ?';
			break;
		default:
			console.error("db:gameDao updatePai location error");
	}
	sqlTemp.update(sql,args,function(err,res){
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
gameDao.getPai = function(rid,location,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:pushPai error");
			utils.invokeCallback(cb, err, null);
		}else{
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
gameDao.getAllPai = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getAllPai error");
			utils.invokeCallback(cb, err, null);
		}else{
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
gameDao.setCurrentChip = function(rid, new_chip,cb){
	var sql = 'update game_room set current_chip = ? where rid = ?';
	var args = [new_chip,rid];
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
 * 获取当前注数数据库操作函数
 * */
gameDao.getCurrentChip = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
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
 * 获取游戏房间总注数
 * */
gameDao.getAllChip = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getAllChip error");
			utils.invokeCallback(cb, err, null);
		}else {
			if(!!res && res.length > 0){
				utils.invokeCallback(cb, null, res[0].all_chip);
			}else{
				utils.invokeCallback(cb, null, null);
			}
		}
	});
};

/**
 * 修改游戏房间总注数
 * */
gameDao.setAllChip = function(rid,new_chip,cb){
	var sql = 'update game_room set all_chip = ? where rid = ?';
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

gameDao.setStartGolds = function(rid,pgolds,cb){
	var sql = 'update game_room set start_golds = ? where rid = ?';
	var args = [pgolds,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			console.error("gameDao.setStartGolds error");
			utils.invokeCallback(cb, err, null);
		}else{
			console.log("gameDao.setStartGolds succeed");
			utils.invokeCallback(cb, null, null);
		}
	});
};

gameDao.getStartGolds = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("gameDao.getStartGolds error");
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
 * 修改is_game_(12345)
 * */
gameDao.setIsGameNum = function(rid,location,value,cb){
	var sql;
	switch(location){
		case 1:
			sql = 'update game_room set is_game_1 = ? where rid = ?';
			break;
		case 2:
			sql = 'update game_room set is_game_2 = ? where rid = ?';
			break;
		case 3:
			sql = 'update game_room set is_game_3 = ? where rid = ?';
			break;
		case 4:
			sql = 'update game_room set is_game_4 = ? where rid = ?';
			break;
		case 5:
			sql = 'update game_room set is_game_5 = ? where rid = ?';
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
gameDao.getIsGameNum = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
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

gameDao.getPlayerIsGameNum = function(rid,location,cb){
	var sql = 'select * from game_room where rid = ?';
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
 * 设置当前出牌玩家
 * */
gameDao.setCurPlayer = function(rid,cur_player,cb){
	var sql = "update game_room set current_player = ? where rid = ?";
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
gameDao.nextCurPlayer = function(rid,cb){
	var sql = "select * from game_room where rid = ?";
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getCurPlayer error");
			utils.invokeCallback(cb,err, null);
		}else{
			var i = res[0].current_player;
			gameDao.getIsGameNum(rid,function(err,returnArr){
				for(var j=i+1;j<10;j++){
					if(j>5){
						j=j-5;
					}
					if(returnArr[j]== 2){
						var sql = "update game_room set current_player = ? where rid = ?";
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
 * 根据当前正在出牌的玩家，获取下一个出牌的玩家
 * */
gameDao.getNextPlayer = function(rid,location,cb){
	var sql = "select * from game_room where rid = ?";
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			console.error("db:getCurPlayer error");
			utils.invokeCallback(cb,err, null);
		}else{
			var i = location;
			gameDao.getIsGameNum(rid,function(err,returnArr){
				for(var j=i+1;j<10;j++){
					if(j>5){
						j=j-5;
					}
					if(returnArr[j] != -1){
						utils.invokeCallback(cb,null, j);
						return ;
					}
				}
				utils.invokeCallback(cb,null, -1);
			});
		}
	});
};

/**
 * 获取当前正在出牌的玩家
 * */
gameDao.getCurPlayer = function(rid,cb){
	var sql = "select * from game_room where rid = ?";
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
 * timeout mark set
 * */
gameDao.setTimeoutMark = function(rid,time_mark,cb){
	var sql = 'update game_room set timeout_mark = ? where rid = ? ';
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
gameDao.getTimeoutMark = function(rid,cb){
	var sql = 'select * from game_room where rid=?';
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
gameDao.setOpenMark = function(rid,location,cb){
	var sql = 'select * from game_room where rid = ?';
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
			var sql1 = 'update game_room set open_mark = ? where rid = ?';
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
gameDao.cleanOpenMark = function(rid,location,cb){
	console.log('go into cleanOpenMark:' + rid + ',' + location);
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
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
			var sql1 = 'update game_room set open_mark = ? where rid = ?';
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
gameDao.getOpenMark = function(rid,location,cb){
	var sql = 'select * from game_room where rid = ?';
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
 * @param rid  game_room
 * @param mark 0 or 1
 * @param cb
 */
gameDao.setMenMark = function(rid,mark,cb){
	if(mark!=0&&mark!=1){
		cb('error');
	}else{
		var sql = 'update game_room set men_mark = ? where rid = ?';
		var args = [mark,rid];
		sqlTemp.update(sql,args,function(err,res){
			if(err!==null){
				console.error("db:setMenMark error");
				utils.invokeCallback(cb, err, null);
			}else{
				utils.invokeCallback(cb, null, null);
			}
		});
	}
};

/**
 * @param rid
 * @param cb 返回men_mark
 */
gameDao.getMenMark = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!=null){
			console.error("db:getMenMark error");
			utils.invokeCallback(cb, err, null);
		} else{
			utils.invokeCallback(cb, null, res[0].men_mark);
		}
	});
};

/**
 * 重置数据
 * */
gameDao.resetData = function(rid,cb){
	gameDao.getRoomInfo(rid,function(err,roomInfo){
		if(err!==null){
			console.error("db:resetData1 error");
			utils.invokeCallback(cb, err, null);
		}else{
			var sql = 'update game_room set pai1 = ?, pai2 = ?,pai3 = ?, pai4 = ?, pai5 = ? where rid=?';
			var args =["null","null","null","null","null",rid];
			sqlTemp.update(sql,args,function(err,res){
				if(err!==null){
					utils.invokeCallback(cb, err, null);
				}else{
					console.log("gameDao.resetData set pai success");
					sql = 'update game_room set current_chip = ?, all_chip=?,round = ?,is_gaming=? where rid=?';
					args =[roomInfo.basic_chip,0,roomInfo.round,0,rid];
					sqlTemp.update(sql,args,function(err,res){
						if(err!==null){
							utils.invokeCallback(cb, err, null);
						}else{
							console.log("gameDao.resetData set chips success");
							sql = 'update game_room set is_game_1=?,is_game_2=?,is_game_3=?,is_game_4=?,is_game_5=? ,current_player=? ,open_mark = ? ,men_mark = ? where rid=?';
							args =[0,0,0,0,0,0,0,0,rid];
							sqlTemp.update(sql,args,function(err,res){
								if(err!==null){
									utils.invokeCallback(cb, err, null);
								}else{
									console.log("gameDao.resetData set isgame success");
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
