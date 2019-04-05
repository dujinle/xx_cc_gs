/**
 * Created by wuningjian on 2/26/16.
 */
var gameDao = module.exports;
var pomelo = require('pomelo');
var utils   = require('../util/utils');
var sqlTemp = pomelo.app.get('dbclient');
var logger = require('pomelo-logger').getLogger('pomelogameDao', __filename);

//该js文件都是对数据表game_room进行操作

gameDao.create_room_by_player_id = function(player_id,nick_name,room_type,renshu,max_type,cb){
/*{{{*/
	var room_num = utils.random6num();

	var now = Date.now();
	var sql = 'insert into game_room (room_num,fangzhu_id,fangzhu_name,game_type,player_num,max_type,creat_time,wait_time) values(?,?,?,?,?,?,?,0)';
	if(room_type != 3){
		sql = 'insert into game_room (room_num,fangzhu_id,fangzhu_name,game_type,player_num,max_type,creat_time,wait_time,zhuang_score) values(?,?,?,?,?,?,?,0,100)';
	}else{
		sql = 'insert into game_room (room_num,fangzhu_id,fangzhu_name,game_type,player_num,max_type,creat_time,wait_time,zhuang_score) values(?,?,?,?,?,?,?,0,50)';
	}
	var args = [room_num,player_id,nick_name,room_type + '',renshu,max_type,now];
	sqlTemp.insert(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:createRoom error");
			utils.invokeCallback(cb,err,null)
		}else{
			utils.invokeCallback(cb,null,res.insertId);
		}
	});
/*}}}*/
};

gameDao.get_qiang_zhuang = function(rid,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("getRoom:"+JSON.stringify(res));
				var qiang_zhuang = JSON.parse(res[0].qiang_flag);
				utils.invokeCallback(cb,null,qiang_zhuang);
			}else{
				logger.info("getRoom: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.get_all_is_game = function(rid,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("getRoom: no found room......" + err.message);
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("getRoom:"+JSON.stringify(res));
				var is_games = new Array();
				is_games.push(res[0].is_game_1);
				is_games.push(res[0].is_game_2);
				is_games.push(res[0].is_game_3);
				is_games.push(res[0].is_game_4);
				utils.invokeCallback(cb,null,is_games);
			}else{
				logger.info("getRoom: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.get_qiang_num = function(rid,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("get_qiang_num:"+JSON.stringify(res));
				utils.invokeCallback(cb,null,res[0].qiang_num);
			}else{
				logger.info("get_qiang_num: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.get_max_type = function(rid,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("get_max_type:"+JSON.stringify(res));
				utils.invokeCallback(cb,null,res[0].max_type);
			}else{
				logger.info("get_max_type: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.set_qiang_zhuang = function(rid,location,flag,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("set_qiang_zhuang:"+JSON.stringify(res));
				var qiang_zhuang = JSON.parse(res[0].qiang_flag);
				if(flag == true){
					qiang_zhuang.push(location);
				}
				sql = 'update game_room set qiang_flag = ?,qiang_num = qiang_num + 1 where rid = ?';
				args = [JSON.stringify(qiang_zhuang),rid];
				sqlTemp.query(sql,args,function(err,res){
					if(err!==null){
						logger.info("update game_room set qiang_flag" + err.message);
						utils.invokeCallback(cb,err,null);
					}else{
						utils.invokeCallback(cb,null,qiang_zhuang);
					}
				});
			}else{
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.sub_lun_zhuang = function(rid,value,cb){
/*{{{*/
	var args = [value,rid];
	var sql = 'update game_room set wait_time = wait_time + ? where rid = ?';
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.info("update game_room set_lun_zhuang",err.message);
			utils.invokeCallback(cb,err,null);
		}else{
			utils.invokeCallback(cb,null,res);
		}
	});
/*}}}*/
};

gameDao.get_lun_zhuang = function(rid,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("get_qiang_num:"+JSON.stringify(res));
				utils.invokeCallback(cb,null,res[0].wait_time);
			}else{
				logger.info("get_qiang_num: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.set_cur_turn = function(rid,cur_turn,cb){
/*{{{*/
	var sql = 'update game_room set cur_turn = ? where rid = ?';
	var args = [cur_turn,rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.info("update game_room set cur_turn" + err.message);
			utils.invokeCallback(cb,err,null);
		}else{
			utils.invokeCallback(cb,null,cur_turn);
		}
	});
/*}}}*/
};

gameDao.sub_local_gold = function(rid,location,score,cb){
/*{{{*/
	var sql = null;
	var args = null;
	if(location == 1){
		sql = 'update game_room set left_score_1 = left_score_1 + ? where rid = ?';
	}else if(location == 2){
		sql = 'update game_room set left_score_2 = left_score_2 + ? where rid = ?';
	}else if(location == 3){
		sql = 'update game_room set left_score_3 = left_score_3 + ? where rid = ?';
	}else if(location == 4){
		sql = 'update game_room set left_score_4 = left_score_4 + ? where rid = ?';
	}
	var args = [score,rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.info("update game_room set qiang_flag" + err.message);
			utils.invokeCallback(cb,err,null);
		}else{
			utils.invokeCallback(cb,null,200);
		}
	});
/*}}}*/
};

gameDao.sub_zhuang_score = function(rid,score,cb){
/*{{{*/
	logger.info("set_zhuang_score chips:" + score);
	var sql = 'update game_room set zhuang_score = zhuang_score + ? where rid = ?';
	args = [score,rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			utils.invokeCallback(cb,null,200);
		}
	});
/*}}}*/
};

gameDao.get_zhuang_score = function(rid,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("get_zhuang_score:"+JSON.stringify(res));
				utils.invokeCallback(cb,null,res[0].zhuang_score);
			}else{
				logger.info("get_zhuang_score: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.set_qieguo = function(rid,qieguo,cb){
/*{{{*/
	logger.info("set_qieguo:" + qieguo);
	var sql = 'update game_room set qieguo = ? where rid = ?';
	args = [qieguo,rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			utils.invokeCallback(cb,null,qieguo);
		}
	});
/*}}}*/
};

gameDao.set_qieguo_flag = function(rid,qieguo_flag,cb){
/*{{{*/
	logger.info("set_qieguo_flag:" + qieguo_flag);
	var sql = 'update game_room set qieguo_flag = ? where rid = ?';
	args = [qieguo_flag,rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			utils.invokeCallback(cb,null,qieguo_flag);
		}
	});
/*}}}*/
};

gameDao.set_all_player_is_game = function(rid,is_game,cb){
/*{{{*/
	logger.info("set_all_player_is_game:" + is_game);
	var sql = 'update game_room set is_game_1 = ?, is_game_2 = ?, is_game_3 = ?, is_game_4 = ? where rid = ?';
	args = [is_game,is_game,is_game,is_game,rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			utils.invokeCallback(cb,null,is_game);
		}
	});
/*}}}*/
};

gameDao.set_xiazhu = function(rid,location,chips,cb){
/*{{{*/
	logger.info("set_xiazhu chips:" + JSON.stringify(chips) + location);
	var sql = null;
	if(location == 1){
		sql = 'update game_room set score_1 = ? where rid = ?';
	}else if(location == 2){
		sql = 'update game_room set score_2 = ? where rid = ?';
	}else if(location == 3){
		sql = 'update game_room set score_3 = ? where rid = ?';
	}else if(location == 4){
		sql = 'update game_room set score_4 = ? where rid = ?';
	}
	args = [JSON.stringify(chips),rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			utils.invokeCallback(cb,null,chips);
		}
	});
/*}}}*/
};

gameDao.get_every_score = function(rid,cb){
/*{{{*/
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("getRoom:"+JSON.stringify(res));
				var room_info = res[0];
				var scores = new Array();
				if(room_info['score_1'] != null){
					scores.push(JSON.parse(room_info['score_1']));
				}else{
					scores.push(null);
				}
				if(room_info['score_2'] != null){
					scores.push(JSON.parse(room_info['score_2']));
				}else{
					scores.push(null);
				}
				if(room_info['score_3'] != null){
					scores.push(JSON.parse(room_info['score_3']));
				}else{
					scores.push(null);
				}
				if(room_info['score_4'] != null){
					scores.push(JSON.parse(room_info['score_4']));
				}else{
					scores.push(null);
				}
				utils.invokeCallback(cb,null,scores);
			}else{
				logger.info("getRoom: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.set_zhuang_location = function(rid,location,cb){
/*{{{*/
	logger.info("set_zhuang_location:"+location);
	sql = 'update game_room set zhuang_location = ? where rid = ?';
	args = [location,rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			utils.invokeCallback(cb,null,location);
		}
	});
/*}}}*/
};

//玩家押满注 庄家需要明牌 1 明牌 0 不明牌
gameDao.set_zhuang_mingpai = function(rid,flag,cb){
/*{{{*/
	logger.info("set_zhuang_mingpai:"+flag);
	sql = 'update game_room set fangka_type = ? where rid = ?';
	args = [flag,rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			utils.invokeCallback(cb,null,res);
		}
	});
/*}}}*/
};

gameDao.set_first_location = function(rid,location,length,cb){
/*{{{*/
	logger.info("set_first_location:"+location);
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("getRoom:"+JSON.stringify(res));
				var local = res[0].zhuang_location;
				var local = (local + location - 1) % 4;
				if(local == 0){
					local = 4;
				}
				sql = 'update game_room set first_fapai = ? where rid = ?';
				args = [local,rid];
				sqlTemp.query(sql,args,function(err,res){
					if(err!==null){
						utils.invokeCallback(cb,err,null);
					}else{
						utils.invokeCallback(cb,null,local);
					}
				});
			}else{
				logger.info("getRoom: no found room......");
				utils.invokeCallback(cb,null,null);
			}
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
				logger.info("getRoom:"+JSON.stringify(res));
				utils.invokeCallback(cb,null,res[0]);
			}else{
				logger.info("getRoom: no found room......");
				utils.invokeCallback(cb,null,null);
			}
		}
	});
/*}}}*/
};

gameDao.get_rooms_by_player_id = function(player_id,cb){
/*{{{*/
	var sql = 'select * from game_room where fangzhu_id = ?';
	var args = [player_id];
	logger.info('start select game_room by fangzhu_id:',player_id);
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:get_room_by_room_num error......");
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("getRoom:"+JSON.stringify(res));
				utils.invokeCallback(cb,null,res);
			}else{
				logger.info("getRoom: no found room......");
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
	logger.info('start select game_room by room_num:',room_num);
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:get_room_by_room_num error......");
			utils.invokeCallback(cb,err,null);
		}else{
			if(!!res && res.length > 0){
				logger.info("getRoom:"+JSON.stringify(res));
				utils.invokeCallback(cb,null,res[0]);
			}else{
				logger.info("getRoom: no found room......");
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
			logger.error("db:add_player step 1 error");
			utils.invokeCallback(cb,err,null);
		}else{
			//更改玩家数量
			new_player_num = res[0].real_num+1;
			var sql1 = 'update game_room set real_num = ? where rid = ?';
			var args1 = [new_player_num,rid];
			logger.info("args1:",args1,location);
			sqlTemp.update(sql1,args1,function(err,res){
				if(err!==null){
					logger.error("db:add_player step 2 error");
					utils.invokeCallback(cb,err,null);
				}else{
					logger.info("db:add_player step 1 success");
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
							logger.error("add_player step 3 error");
					}
					sqlTemp.update(sql2,args2,function(err,res){
						if(err!==null){
							logger.error("db:add_player step 3 error");
							utils.invokeCallback(cb,err,null);
						}else{
							logger.info("add_player step 3 success");
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
			logger.error("db:add_wait_time step 1 error");
			utils.invokeCallback(cb,err,null);
		}else{
			var wait_time = res[0].wait_time + 2;
			var sql1 = 'update game_room set wait_time = ? where rid = ?';
			var args1 = [wait_time,rid];
			logger.info("args1:",args1);
			sqlTemp.update(sql1,args1,function(err,res){
				if(err!==null){
					logger.error("db:add_wait_time step 2 error");
					utils.invokeCallback(cb,err,null);
				}else{
					logger.info("db:add_wait_time step 1 success");
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
	logger.info("args:",args);
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:dissolve_room error");
			utils.invokeCallback(cb,err,null);
		}else{
			logger.info("db:dissolve_room success");
			utils.invokeCallback(cb,err,rid);
		}
	});
/*}}}*/
};

gameDao.leave_room = function(rid,uid,cb){
/*{{{*/
	logger.info("db:leave_room step 1 success");
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:leave_room step 1 error");
			utils.invokeCallback(cb,err,null);
		}else{
			var room_info = res[0];
			//location 添加对应玩家名
			var sql = '';
			var args = ["null",rid];
			var locations = [null,'location1','location2','location3','location4'];
			for(var i = 1;i <= 4;i++ ){
				if(room_info['location' + i] == uid){
					sql = 'update game_room set ' + locations[i] + ' = ? where rid = ?';
					break;
				}
			}
			sqlTemp.update(sql,args,function(err,res){
				if(err!==null){
					logger.error("db:leave_room step 2 error",err);
					utils.invokeCallback(cb,err,null);
				}else{
					logger.info("leave_room step 2 success");
					//cb(location,new_player_num);
					sql = 'update game_room set real_num = real_num - 1 where rid = ?';
					args = [rid];
					sqlTemp.update(sql,args,function(err,res){
						if(err!==null){
							logger.error("db:leave_room step 3 error",err);
							utils.invokeCallback(cb,err,null);
						}else{
							logger.info("leave_room step 3 success");
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
	logger.info("args:",args);
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:start_game error");
			utils.invokeCallback(cb,err,null);
		}else{
			logger.info("db:start_game success" + JSON.stringify(res));
			utils.invokeCallback(cb,err,rid);
		}
	});
/*}}}*/
};

/**
 * 返回玩家的房间对应位置
 * */
gameDao.get_player_local = function(rid,player_id,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	var location;
	logger.info("--------------player input getplayerlocal"+player_id);
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:getPlayerLocal error");
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
				logger.error("db:getPlayerLocal2 error");
				utils.invokeCallback(cb, "db:getPlayerLocal2 error", null);
			}
			//cb(location);
			utils.invokeCallback(cb,null , location);
		}
	});
};

gameDao.get_local_player_id = function(rid,location,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	var player_id;
	logger.info("--------------player input get_local_player_id" + location);
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:getPlayerLocal error");
			utils.invokeCallback(cb, err, null);
		}else{
			if(location == 1){
				player_id = res[0].location1.split('*')[0];
			}else if(location == 2){
				player_id = res[0].location2.split('*')[0];
			}else if(location == 3){
				player_id = res[0].location3.split('*')[0];
			}else if(location == 4){
				player_id = res[0].location4.split('*')[0];
			}else {
				logger.error("db:getPlayerLocal2 error");
				utils.invokeCallback(cb, "db:getPlayerLocal2 error", null);
			}
			//cb(location);
			utils.invokeCallback(cb,null , player_id);
		}
	});
};

gameDao.get_players_location = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	var location;
	logger.info("--------------player input getplayerslocal");
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:getPlayerLocal error");
			utils.invokeCallback(cb, err, null);
		}else{
			var locations = new Array();
			if(res[0].location1 != null && res[0].location1 != "null"){
				locations.push(1);
			}
			if(res[0].location2 != null && res[0].location2 != "null"){
				locations.push(2);
			}
			if(res[0].location3 != null && res[0].location3 != "null"){
				locations.push(3);
			}
			if(res[0].location4 != null && res[0].location4 != "null"){
				locations.push(4);
			}
			//cb(location);
			utils.invokeCallback(cb,null ,locations);
		}
	});
};

gameDao.get_peipai_num = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	var location;
	logger.info("get_peipai_num ..............");
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:getPlayerLocal error");
			utils.invokeCallback(cb, err, null);
		}else{
			utils.invokeCallback(cb,null ,res[0].peipai_num);
		}
	});
};

gameDao.set_is_gaming = function(rid,is_gaming,cb){
	var sql = "update game_room set is_gaming = ? where rid = ?";
	var args = [is_gaming,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			logger.error("gameDao.subRound error");
			utils.invokeCallback(cb,err, null);
		}else{
			logger.info("gameDao.subRound success");
			utils.invokeCallback(cb,null,is_gaming);
		}
	});
}
/**
 * 设置当前牌局的局数
 * */
gameDao.sub_round = function(rid,round,cb){
	var sql = "update game_room set round = round + ? where rid = ?";
	var args = [round,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			logger.error("gameDao.subRound error");
			utils.invokeCallback(cb,err, null);
		}else{
			logger.info("gameDao.subRound success");
			gameDao.get_round(rid,function(err,resRound){
				utils.invokeCallback(cb,null,resRound);
			});
		}
	});
};

/**
 * 回调函数获取目前牌局的局数
 * */
gameDao.get_round = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("gameDao.getRound");
			utils.invokeCallback(cb,err, null);
		}else{
			utils.invokeCallback(cb,null,res[0].round);
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
			logger.error("db:rmPlayer failed");
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
					logger.info("db:rmPlayer1 succeed");
				}
			});

			//重置location12345和is_game_12345值
			if(res[0].location1==uid){
				var sql2 = 'update game_room set location1 = ?, is_game_1 = ? where rid =?';
				var args2 = ['null',0,rid];
				sqlTemp.update(sql2,args2,function(err,res){
					if(err!==null){
						logger.error("db:rmPlayer2_1 failed");
						utils.invokeCallback(cb, err, null);
					}
				});
			}else if(res[0].location2==uid){
				var sql2 = 'update game_room set location2 = ?, is_game_2 = ? where rid =?';
				var args2 = ['null',0,rid];
				sqlTemp.update(sql2,args2,function(err,res){
					if(err!==null){
						logger.error("db:rmPlayer2_2 failed");
						utils.invokeCallback(cb, err, null);
					}
				});
			}else if(res[0].location3==uid){
				var sql2 = 'update game_room set location3 = ?, is_game_3 = ? where rid =?';
				var args2 = ['null',0,rid];
				sqlTemp.update(sql2,args2,function(err,res){
					if(err!==null){
						logger.error("db:rmPlayer2_3 failed");
						utils.invokeCallback(cb, err, null);
					}
				});
			}else if(res[0].location4==uid){
				var sql2 = 'update game_room set location4 = ?, is_game_4 = ? where rid =?';
				var args2 = ['null',0,rid];
				sqlTemp.update(sql2,args2,function(err,res){
					if(err!==null){
						logger.error("db:rmPlayer2_4 failed");
						utils.invokeCallback(cb, err, null);
					}
				});
			}else if(res[0].location5==uid){
				var sql2 = 'update game_room set location5 = ?, is_game_5 = ? where rid =?';
				var args2 = ['null',0,rid];
				sqlTemp.update(sql2,args2,function(err,res){
					if(err!==null){
						logger.error("db:rmPlayer2_5 failed");
						utils.invokeCallback(cb, err, null);
					}
				});
			}
		}
		//cb();
		utils.invokeCallback(cb, null, null);
	});
};

gameDao.set_player_is_game = function(rid,location,value,cb){
	var sql;
	var args =[value,rid];
	switch (location){
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
		default:
			logger.error("db:gameDao updatePai location error");
	}
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:updatePai error" + err.message);
			utils.invokeCallback(cb, err, null);
		}else{
			logger.info("db:updatePai succeed");
			utils.invokeCallback(cb, null, value);
		}
	});
};
/**
 * 更新牌型，牌型与玩家位置绑定
 * */
gameDao.update_pai = function(rid,pai,location,cb){
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
		default:
			logger.error("db:gameDao updatePai location error");
	}
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:updatePai error");
			utils.invokeCallback(cb, err, null);
		}else{
			logger.info("db:updatePai succeed");
			//cb();
			utils.invokeCallback(cb, null, null);
		}
	});
};

gameDao.update_peipai = function(rid,pai,location,cb){
	var sql;
	var args =[JSON.stringify(pai),rid];
	switch (location){
		case 1:
			sql = 'update game_room set pai1 = ?,peipai_num = peipai_num + 1 where rid = ?';
			break;
		case 2:
			sql = 'update game_room set pai2 = ?,peipai_num = peipai_num + 1 where rid = ?';
			break;
		case 3:
			sql = 'update game_room set pai3 = ?,peipai_num = peipai_num + 1 where rid = ?';
			break;
		case 4:
			sql = 'update game_room set pai4 = ?,peipai_num = peipai_num + 1 where rid = ?';
			break;
		default:
			logger.error("db:gameDao updatePai location error");
	}
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:updatePai error");
			utils.invokeCallback(cb, err, null);
		}else{
			logger.info("db:updatePai succeed");
			//cb();
			utils.invokeCallback(cb, null, null);
		}
	});
};
/**
 * 获取对应位置的牌型,牌型存放数据库类型是字符串类型，程序使用时是json格式
 * */
gameDao.get_pai = function(rid,location,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:pushPai error");
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
				default:
					logger.error("db:pushPai1 error");
					utils.invokeCallback(cb, "db:pushPai1 error", null);
					break;
			}
		}
	});
};

/**
 * 获取所有玩家的牌型,牌型存放数据库类型是字符串类型，程序使用时是json格式
 * */
gameDao.get_all_pai = function(rid,cb){
	var sql = 'select * from game_room where rid = ?';
	var args = [rid];
	sqlTemp.query(sql,args,function(err,res){
		if(err!==null){
			logger.error("db:getAllPai error");
			utils.invokeCallback(cb, err, null);
		}else{
			allPai = new Array();
			allPai.push(JSON.parse(res[0].pai1));
			allPai.push(JSON.parse(res[0].pai2));
			allPai.push(JSON.parse(res[0].pai3));
			allPai.push(JSON.parse(res[0].pai4));
			utils.invokeCallback(cb,null,allPai);
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
			logger.error("db:setTimeoutMark error");
			utils.invokeCallback(cb,err, null);
		}else {
			logger.info("db:setTimeoutMark success");
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
			logger.error("db:getTimeoutMark error");
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
gameDao.reset_room = function(rid,cb){
	var sql = 'update game_room set peipai_num = ?, qieguo = ?,qieguo_flag = ? where rid=?';
	var args =[0,0,0,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb, err, null);
		}else{
			logger.info("gameDao.reset_room set pai success");
			sql = 'select * from game_room where rid=?';
			args = [rid];
			sqlTemp.query(sql,args,function(err,res){
				if(err!==null){
					utils.invokeCallback(cb, err, null);
				}else{
					utils.invokeCallback(cb, null, res[0]);
				}
			});
		}
	});
};

gameDao.reset_game_lunzhuang = function(rid,cb){
	var sql = 'update game_room set left_score_1 = ?,left_score_2 = ?,left_score_3 = ?,left_score_4 = ? where rid=?';
	var args =[0,0,0,0,rid];
	sqlTemp.update(sql,args,function(err,res){
		if(err!==null){
			utils.invokeCallback(cb, err, null);
		}else{
			logger.info("gameDao.reset_room set pai success");
			sql = 'select * from game_room where rid=?';
			args = [rid];
			sqlTemp.query(sql,args,function(err,res){
				if(err!==null){
					utils.invokeCallback(cb, err, null);
				}else{
					utils.invokeCallback(cb, null, res[0]);
				}
			});
		}
	});
};
