/**
 * Created by wuningjian on 3/3/16.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var gameDao   = require('../../../dao/gameDao');
var playerDao = require('../../../dao/playerDao');
var delayDao  = require('../../../dao/delayDao');
var paijiuDao  = require('../../../dao/paijiuDao');
var utils   = require('../../../util/utils');
var pomelo	= require('pomelo');
var async	 = require('async');

var SJGameLogicRemote = module.exports;

/*玩家状态 更新
	空闲 	0，
	准备 	1，
	确定庄 	2，
	下注	3，
	发牌	4，
	配牌	5，
	开牌	6，
	结束	7,
	切锅	8,
*/
/**
 * fa pai 玩家状态是5
 * */
SJGameLogicRemote.fapai = function(rid,num1,num2,cache,channel,channelService){
	////如果name不存在且flag为true，则创建channel
	var users = channel.getMembers();
	logger.info("--------users in fapai:"+users);
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	gameDao.get_room_by_room_id(rid,function(err,roomInfo){
		var all_chip = roomInfo['left_score_' + roomInfo.zhuang_location];
		var cacheData = cache.get(rid);
		var paiArr = cacheData.paixing;
		if(paiArr == null){
			gameDao.set_cur_turn(rid,0,function(err,cur_turn){
				var param = {
					route:'onFapai',//接受发牌消息
					cur_turn:cur_turn,
					nums:[num1,num2],
					all_chip:all_chip,
					location:roomInfo.first_fapai  //返回第一个出牌的人
				};
				utils.pushMessage(rid,channel,param,cache);
				//channel.pushMessage(param);
			});
		}else{
			gameDao.set_cur_turn(rid,1,function(err,cur_turn){
				var param = {
					route:'onFapai',//接受发牌消息
					cur_turn:cur_turn,
					nums:[num1,num2],
					all_chip:all_chip,
					location:roomInfo.first_fapai  //返回第一个出牌的人
				};
				utils.pushMessage(rid,channel,param,cache);
				//channel.pushMessage(param);
			});
		}

		//3000ms为发牌动作执行时间间隔
		setTimeout(function(){
			//P:牌数字2-14
			//S:花色 1方块 2梅花 3红桃 4黑桃
			//这里需要完成发牌逻辑
			var cacheData = cache.get(rid);
			var paiArr = cacheData.paixing;
			var round = 0;
			var paixing = null;
			if(paiArr == null){
				paixing = SJGameLogicRemote.getCardArr(rid,cache);
				round = 1;
			}else{
				round = 0;
				paixing = SJGameLogicRemote.get_card_arr_from_cache(rid,cache);
			}
			gameDao.sub_round(rid,round,function(err,my_round){
				gameDao.get_players_location(rid,function(err,locations){
					var first_location = roomInfo.zhuang_location + 1;
					for(var i = 0;i < locations.length;i++){
						if(roomInfo.zhuang_location == locations[i]){
							if(i == locations.length - 1){
								first_location = locations[0];
							}else{
								first_location = locations[i + 1];
							}
							break;
						}
					}
					async.waterfall([
						function(cb){
							gameDao.update_pai(rid,paixing[0],1,function(err){
								gameDao.set_player_is_game(rid,1,4,function(err,res){
									logger.info("gameDao.updatePai location 1 success");
									cb(null);
								});
							});
						},
						function(cb){
							gameDao.update_pai(rid,paixing[1],2,function(err){
								gameDao.set_player_is_game(rid,2,4,function(err,res){
									logger.info("gameDao.updatePai location 2 success");
									cb(null);
								});
							});
						},
						function(cb){
							gameDao.update_pai(rid,paixing[2],3,function(err){
								gameDao.set_player_is_game(rid,3,4,function(err,res){
									logger.info("gameDao.updatePai location 3 success");
									cb(null);
								});
							});
						},
						function(cb){
							gameDao.update_pai(rid,paixing[3],4,function(err){
								gameDao.set_player_is_game(rid,4,4,function(err,res){
									logger.info("gameDao.updatePai success");
									cb(null);
								});
							});
						}
					],function(err,result){
						var param = {
							route:'onShoupai',
							paixing:paixing,
							round:my_round,
							location:first_location
						};
						utils.pushMessage(rid,channel,param,cache);
						delayDao.removeDelay(rid,function(){
							logger.info("follow:removeDelay success");
							delayDao.addDelay(rid,10,function(){
								logger.info("follow:addDelay success");
							});
						});
						//channel.pushMessage(param);
					});
				});
			});
		},3000);
	});
};

/**
 * 分牌逻辑，调用后返回牌型数组
 * */
SJGameLogicRemote.getCardArr = function(rid,cache){
	var arr = [];
	var paiArr = [];//牌型数组
	var restPaiArr = [];//剩余的牌数组
	for(var i = 0;i < 32;i++){
		arr[i]=0;
	}
	var j = 0;
	while (j < 16){
		var temp = Math.floor(Math.random()*32);
		if(arr[temp] == 0){
			arr[temp] = 1;
			j++;
		}
	}
	logger.info("arr:"+arr);

	var k = 0;
	var t = 0;
	for(var i = 0;i < arr.length;i++){
		if(arr[i] == 1){
			paiArr[k] = i + 1;
			k++;
		}
		if(arr[i] == 0){
			restPaiArr[t] = i + 1;
			t++;
		}
	}
	var cacheData = cache.get(rid);
	cacheData.paixing = restPaiArr;
	cache.put(rid,cacheData);//剩余的牌存到缓存当中，关键字是房间号

	logger.info("paiArr:"+paiArr);

	var paixing = [];

	paixing[0] = [paiArr[0],paiArr[4],paiArr[8],paiArr[12]];
	paixing[1] = [paiArr[1],paiArr[5],paiArr[9],paiArr[13]];
	paixing[2] = [paiArr[2],paiArr[6],paiArr[10],paiArr[14]];
	paixing[3] = [paiArr[3],paiArr[7],paiArr[11],paiArr[15]];

	logger.info("paixing:"+paixing);
	return paixing;
};

SJGameLogicRemote.get_card_arr_from_cache = function(rid,cache){
	var cacheData = cache.get(rid);
	var paiArr = cacheData.paixing;

	logger.info("paiArr:"+paiArr);
	var paixing = [];
	paixing[0] = [paiArr[0],paiArr[4],paiArr[8],paiArr[12]];
	paixing[1] = [paiArr[1],paiArr[5],paiArr[9],paiArr[13]];
	paixing[2] = [paiArr[2],paiArr[6],paiArr[10],paiArr[14]];
	paixing[3] = [paiArr[3],paiArr[7],paiArr[11],paiArr[15]];
	logger.info("paixing:"+paixing);
	var cacheData = cache.get(rid);
	cacheData.paixing = null;
	cache.put(rid,cacheData);
	return paixing;
};

/**
 * 比牌请求处理路由
 * */
SJGameLogicRemote.bipai = function(rid,location1,location2,cb){
	//比牌逻辑，返回结果
	var self = this;
	gameDao.get_pai(rid,location1,function(err,pai1){
		gameDao.get_pai(rid,location2,function(err,pai2){
			logger.info("pai1:" + JSON.stringify(pai1));
			logger.info("pai2:" + JSON.stringify(pai2));
			//开始构造牌型
			var pai1_1 = pai1[0] + "+" + pai1[1];
			if(pai1[0] > pai1[1]){
				pai1_1 = pai1[1] + "+" + pai1[0];
			}
			var pai1_2 = pai1[2] + "+" + pai1[3];
			if(pai1[2] > pai1[3]){
				pai1_2 = pai1[3] + "+" + pai1[2];
			}
			var pai2_1 = pai2[0] + "+" + pai2[1];
			if(pai2[0] > pai2[1]){
				pai2_1 = pai2[1] + "+" + pai2[0];
			}
			var pai2_2 = pai2[2] + "+" + pai2[3];
			if(pai2[2] > pai2[3]){
				pai2_2 = pai2[3] + "+" + pai2[2];
			}
			gameDao.get_max_type(rid,function(err,max_type){
				paijiuDao.get_paijiu_by_paixing(max_type,pai1_1,function(err,res1_1){
					paijiuDao.get_paijiu_by_paixing(max_type,pai2_1,function(err,res2_1){
						paijiuDao.get_paijiu_by_paixing(max_type,pai1_2,function(err,res1_2){
							paijiuDao.get_paijiu_by_paixing(max_type,pai2_2,function(err,res2_2){
								logger.info(JSON.stringify(res1_1) + JSON.stringify(res1_2) + JSON.stringify(res2_1) + JSON.stringify(res2_2));
								if(res1_1.score >= res2_1.score  && res1_2.score >= res2_2.score){
									var head_flag = utils.get_up8_flag(res1_1.score);
									var tail_flag = utils.get_up8_flag(res1_2.score);
									if(head_flag == true && tail_flag == true){
										cb(location1,location2,'win',true);
									}else{
										cb(location1,location2,'win',false);
									}
								}else if(res1_1.score < res2_1.score  && res1_2.score < res2_2.score){
									var head_flag = utils.get_up8_flag(res2_1.score);
									var tail_flag = utils.get_up8_flag(res2_2.score);
									if(head_flag == true && tail_flag == true){
										cb(location1,location2,'lose',true);
									}else{
										cb(location1,location2,'lose',false);
									}
								}else{
									cb(location1,location2,'equal',false);
								}
							});
						});
					});
				});
			});
		});
	});
};

/*玩家状态 6*/
SJGameLogicRemote.peipai = function(rid,location,marks,select,cache,channel,username){
	var users = channel.getMembers();
	var paixing = new Array();
	gameDao.set_player_is_game(rid,location,5,function(err,res){
		gameDao.setCurPlayer(rid,location,function(err,cur_player){
			gameDao.get_pai(rid,location,function(err,res){
				for(var i = 0; i < res.length;i++){
					var flag = false;
					for(var j = 0;j < marks.length;j++){
						if(res[i] == marks[j]){
							flag = true;
							break;
						}
					}
					if(flag == false){
						paixing.push(res[i]);
					}
				}
				var pai_1 = paixing[0] + "+" + paixing[1];
				if(paixing[0] > paixing[1]){
					pai_1 = paixing[1] + "+" + paixing[0];
				}
				var pai_2 = marks[0] + "+" + marks[1];
				if(marks[0] > marks[1]){
					pai_2 = marks[1] + "+" + marks[0];
				}
				var flag = true;
				gameDao.get_max_type(rid,function(err,max_type){
					paijiuDao.get_paijiu_by_paixing(max_type,pai_1,function(err,res_1){
						paijiuDao.get_paijiu_by_paixing(max_type,pai_2,function(err,res_2){
							if(res_1.score >= res_2.score){
								paixing.unshift(marks[0]);
								paixing.unshift(marks[1]);
							}else{
								paixing.push(marks[0]);
								paixing.push(marks[1]);
								flag = false;
							}

							gameDao.update_peipai(rid,paixing,location,function(err,res){
								var param = {
									route:'onPeiPai',
									location:location,
									marks:marks,
									select:select,
									flag:flag
								};
								utils.pushMessage(rid,channel,param,cache);
								//channel.pushMessage(param);
								gameDao.get_peipai_num(rid,function(err,peipai_num){
									delayDao.removeDelay(rid,function(){
										if(users.length <= peipai_num){
											setTimeout(function(){
												var param = {
													route:'onPeiPaiFinish',
													location:location
												};
												utils.pushMessage(rid,channel,param,cache);
												delayDao.addDelay(rid,10,function(){
													logger.info("follow:addDelay success");
												});
											//channel.pushMessage(param);
											},1000);
										}else{
											gameDao.nextCurPlayer(rid,function(err,new_loc){
												logger.info("nextCurPlayer success");
												SJGameLogicRemote.changeCurPlayer(rid,new_loc,5,channel);
												//出牌定时，重置定时器
												delayDao.addDelay(rid,10,function(){
													logger.info("follow:addDelay success");
												});
											});
										}
									});
								});
							});
						})
					});
				});
			});
		});
	});
};

SJGameLogicRemote.ready = function(rid,location,cache,channel,username){
	gameDao.set_player_is_game(rid,location,1,function(err,res){
		gameDao.setCurPlayer(rid,location,function(err,cur_player){
			var param = {
				route:'onReady',
				location:location
			};
			utils.pushMessage(rid,channel,param,cache);
			//channel.pushMessage(param);
			

			gameDao.get_room_by_room_id(rid,function(err,room_info){
				var ready_num = 0;
				for(var i = 1;i <= 4;i++){
					if(room_info['is_game_' + i] == 1){
						ready_num = ready_num + 1;
					}
				}
				gameDao.get_players_location(rid,function(err,locations){
					delayDao.removeDelay(rid,function(){
						if(locations.length == ready_num){
							var num1 = utils.get_random_num(1,6);
							var num2 = utils.get_random_num(1,6);
							var local = (num1 + num2) % locations.length;
							if(local == 0){
								local = locations.length;
							}
							var zhuang_id = locations[local - 1];
							if(local == locations.length){
								local = 0;
							}
							var first_location = locations[local];
							logger.info('get zhuang location info');
							gameDao.set_all_player_is_game(rid,2,function(err,res){
								setTimeout(function(){
									gameDao.set_zhuang_location(rid,zhuang_id,function(err,res){
										gameDao.sub_local_gold(rid,zhuang_id,100,function(err,res){
											gameDao.set_is_gaming(rid,2,function(err,res){
												var param = {
													route:'onGetZhuang',
													nums:[num1,num2],
													scores:[room_info.left_score_1,room_info.left_score_2,room_info.left_score_3,room_info.left_score_4],
													zhuang_local:zhuang_id,
													location:first_location
												};
												param['scores'][zhuang_id - 1] = 100;
												utils.pushMessage(rid,channel,param,cache);
												//channel.pushMessage(param);
											});
										});
									});
								},1000);
							});
						}else{
							logger.info("ready:removeDelay success");
							gameDao.nextCurPlayer(rid,function(err,new_loc){
								logger.info("ready nextCurPlayer success");
								SJGameLogicRemote.changeCurPlayer(rid,new_loc,1,channel);
								//出牌定时，重置定时器
								
								delayDao.addDelay(rid,10,function(){
									logger.info("ready:addDelay success");
								});
							});
						}
					});
				});
			});
		});
	});
};

SJGameLogicRemote.xiazhu = function(rid,location,chips,cache,channel,channelService){
	var users = channel.getMembers();
	logger.info("--------users in fapai:"+users);
	gameDao.set_xiazhu(rid,location,chips,function(err,res){
		gameDao.set_player_is_game(rid,location,3,function(err,res){
			gameDao.setCurPlayer(rid,location,function(err,cur_player){
				//channel.pushMessage(param);
				var param = {
					route:'onXiazhu',
					location:location,
					chips:chips
				};
				utils.pushMessage(rid,channel,param,cache);
				
				gameDao.get_room_by_room_id(rid,function(err,room_info){
					logger.info('xiazhu:',room_info);
					delayDao.removeDelay(rid,function(){
						var xiazhu_num = 0;
						for(var i = 1;i <= 4;i++){
							if(room_info['is_game_' + i] == 3){
								xiazhu_num += 1;
							}
						}
						if(xiazhu_num == users.length - 1){
							var num1 = utils.get_random_num(1,6);
							var num2 = utils.get_random_num(1,6);
							var local = (num1 + num2) % 4;
							if(local == 0){
								local = 4;
							}
							setTimeout(function(){
								gameDao.set_first_location(rid,local,4,function(err,res){
									SJGameLogicRemote.fapai(rid,num1,num2,cache,channel,channelService);
								});
							},2000);
						}else{
							gameDao.nextCurPlayer(rid,function(err,new_loc){
								logger.info("nextCurPlayer success");
								SJGameLogicRemote.changeCurPlayer(rid,new_loc,3,channel);
								//出牌定时，重置定时器
								delayDao.addDelay(rid,10,function(){
									logger.info("xiazhu:addDelay success");
								});
							});
						}
					});
				});
			});
		});
	});
};

SJGameLogicRemote.open = function(rid,location,cache,channel,channelService){
	gameDao.get_all_pai(rid,function(err,all_pai){
		gameDao.set_all_player_is_game(rid,6,function(err,is_game){
			delayDao.removeDelay(rid,function(){
				var param = {
					route:'onOpen',
					all_pai:all_pai
				};
				utils.pushMessage(rid,channel,param,cache);
			});
			//channel.pushMessage(param);
		});
		setTimeout(function(){
			var locals_score = [0,0,0,0];
			gameDao.get_room_by_room_id(rid,function(err,room_info){
				var zhuang_local = room_info.zhuang_location;
				var my_location = room_info.zhuang_location;
				var calc_score = function(callback){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					logger.info("zhuang_local:" + zhuang_local + " my_location:" + my_location);
					if(room_info["location" + my_location] != null && room_info["location" + my_location] != 'null'){
						SJGameLogicRemote.bipai(rid,zhuang_local,my_location,function(location1,location2,is_win,flag){
							logger.info("bipai:" + location1 + " location2:" + location2 + " is_win:" + is_win + " flag:" + flag);
							if(is_win == 'win'){
								var score = JSON.parse(room_info["score_" + my_location]);
								if(flag == true){
									locals_score[my_location - 1] = locals_score[my_location - 1] - parseInt(score[0]) - parseInt(score[1]);
									locals_score[zhuang_local - 1] = parseInt(score[0]) + parseInt(score[1]) + locals_score[zhuang_local - 1];
								}else{
									locals_score[my_location - 1] = locals_score[my_location - 1] - parseInt(score[0]);
									locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] + parseInt(score[0]);
								}
							}else if(is_win == 'lose'){
								var score = JSON.parse(room_info["score_" + my_location]);
								if(flag == true){
									locals_score[my_location - 1] = locals_score[my_location - 1] + parseInt(score[0]) + parseInt(score[1]);
									locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] - parseInt(score[0]) - parseInt(score[1]);
								}else{
									locals_score[my_location - 1] = locals_score[my_location - 1] + parseInt(score[0]);
									locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] - parseInt(score[0]);
								}
							}
							callback(null);
						});
					}else{
						callback(null);
					}
				};
				//依次执行函数，没有上下函数依赖
				async.waterfall([
					calc_score,
					calc_score,
					calc_score
				],function(err){
					SJGameLogicRemote.end_game(rid,locals_score,cache,channel,channelService);
				});
			});
		},2000);
	});
};

SJGameLogicRemote.calc_score_normal = function(rid,room_info,temp_score,cache,channel,channelService){
	var zhuang_score = room_info['left_score_' + room_info.zhuang_location];
	var init_score = zhuang_score;
	var my_location = room_info.zhuang_location;
	var callback = function(callback){
		my_location = my_location + 1;
		if(my_location > 4){
			my_location = 1;
		}
		if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
			//庄家有分数 才可以进行分数操作
			if(zhuang_score > 0){
				//玩家赢
				if(temp_score[my_location - 1] > 0){
					zhuang_score = zhuang_score - temp_score[my_location - 1];
					if(zhuang_score >= 0){
						gameDao.sub_local_gold(rid,my_location,temp_score[my_location - 1],function(err,res){
							temp_score[my_location - 1] = temp_score[my_location - 1];
							callback(null);
						});
					}
					else{
						temp_score[my_location - 1] = temp_score[my_location - 1] + zhuang_score;
						gameDao.sub_local_gold(rid,my_location,temp_score[my_location - 1],function(err,res){
							temp_score[my_location - 1] = temp_score[my_location - 1];
							zhuang_score = 0;
							callback(null);
						});
					}
				}
				else if(temp_score[my_location - 1] < 0){
					//庄家赢 则判断是否已经获取了 2倍的筹码
					if(init_score * 2 > zhuang_score){
						zhuang_score = zhuang_score - temp_score[my_location - 1];
						//分数多余庄初始分数了
						if(init_score * 2 < zhuang_score){
							var left = zhuang_score - init_score * 2;
							temp_score[my_location - 1] = temp_score[my_location - 1] + left;
							gameDao.sub_local_gold(rid,my_location,temp_score[my_location - 1],function(err,res){
								temp_score[my_location - 1] = temp_score[my_location - 1];
								zhuang_score = init_score * 2;
								callback(null);
							});
						}
						else{
							gameDao.sub_local_gold(rid,my_location,temp_score[my_location - 1],function(err,res){
								temp_score[my_location - 1] = temp_score[my_location - 1];
								callback(null);
							});
						}
					}
					else{
						zhuang_score = init_score * 2;
						temp_score[my_location - 1] = 0;
						callback(null);
					}
				}else{
					temp_score[my_location - 1] = 0;
					callback(null);
				}
			}
			else{
				temp_score[my_location - 1] = 0;
				callback(null);
			}
		}
		else{
			callback(null);
		}
	};
	async.waterfall([
		callback,
		callback,
		callback
	],function(err){
		temp_score[room_info.zhuang_location - 1] = zhuang_score - init_score;
		logger.info("zhuang_score >> callback temp_score;" + JSON.stringify(temp_score));
		gameDao.sub_local_gold(rid,room_info.zhuang_location,temp_score[room_info.zhuang_location - 1],function(err,res){
			gameDao.reset_room(rid,function(err,res){
				var param = {
					'route':'onEnd',
					'scores':temp_score
				};
				if(res['left_score_' + res.zhuang_location] >= 500){
					param['isqie'] = 2;
				}else if(res['left_score_' + res.zhuang_location] == 0){
					param['isqie'] = 2;
				}else if(res.round >= 3 && cache.get(rid) != null){
					param['isqie'] = 1;
				}else{
					param['isqie'] = 0;
				}
				gameDao.set_all_player_is_game(rid,7,function(err,res){
					gameDao.set_qieguo(rid,param['isqie'],function(err,qieguo){
						utils.pushMessage(rid,channel,param,cache);
						delayDao.addDelay(rid,10,function(){
							logger.info("xiazhu:addDelay success");
						});
						//channel.pushMessage(param);
					});
				});
			});
		});
	});
};

SJGameLogicRemote.end_game = function(rid,locals_score,cache,channel,channelService){
	logger.info('locals_score:' + JSON.stringify(locals_score) + rid);
	var temp_score = [0,0,0,0];
	gameDao.get_room_by_room_id(rid,function(err,room_info){
		SJGameLogicRemote.calc_score_normal(rid,room_info,locals_score,cache,channel,channelService);
	});
};

SJGameLogicRemote.qieguo = function(rid,location,flag,cache,channel,channelService){
	if(flag == false){
		gameDao.set_all_player_is_game(rid,8,function(err,is_game){
			gameDao.set_qieguo_flag(rid,0,function(err,qieguo_flag){
				var param = {
					'route':'onQieguo',
					'flag':flag
				};
				utils.pushMessage(rid,channel,param,cache);
				delayDao.removeDelay(rid,function(){
					delayDao.addDelay(rid,10,function(){
						logger.info("ready:addDelay success");
					});
				});
				//channel.pushMessage(param);
			});
		});
	}else{
		gameDao.get_room_by_room_id(rid,function(err,room_info){
			gameDao.set_all_player_is_game(rid,8,function(err,is_game){
				gameDao.set_qieguo_flag(rid,1,function(err,qieguo_flag){
					//更新每一个玩家的金币数量
					for(var i = 1;i < 5;i++){
						var my_location = room_info['location' + i];
						var gold = room_info['left_score_' + i];
						if(my_location != null && my_location != 'null'){
							var player_id = my_location.split('*')[0];
							if(i == room_info.zhuang_location){
								gold = gold - room_info.zhuang_score;
							}
							playerDao.sub_gold(player_id,gold,function(err,res){
								console.log('sub_gold:',player_id,gold);
							});
						}
					}
					var temp_scole = new Array();
					temp_scole.push(room_info.left_score_1);
					temp_scole.push(room_info.left_score_2);
					temp_scole.push(room_info.left_score_3);
					temp_scole.push(room_info.left_score_4);
					var param = {
						'route':'onQieguo',
						'flag':flag,
						'scores':temp_scole
					};
					utils.pushMessage(rid,channel,param,cache);
					//channel.pushMessage(param);
					//进行游戏的最后结算 并删除房间
					gameDao.remove_room(rid,function(err,res){
						playerDao.sub_gold(room_info.fangzhu_id,1,function(err,res){
							delayDao.removeDelay(rid,function(){
								cache.del(rid);
								console.log('进行游戏的最后结算 并删除房间！');
							});
						});
					});
				});
			});
		});
	}
};

SJGameLogicRemote.get_local_player = function(rid,send_from,location,cache,channel,channelService){
	gameDao.get_local_player_id(rid,location,function(err,player_id){
		playerDao.get_player_by_id(player_id,function(err,player){
			var param = {
				'route':'onGetUinfo',
				'player':player,
				'send_from':send_from,
				'location':location
			};
			utils.pushMessage(rid,channel,param,cache);
			//channel.pushMessage(param);
		});
	});
};

SJGameLogicRemote.send_gift = function(rid,send_from,send_to,type,cache,channel,channelService){
	var param = {
		'route':'onSendGift',
		'send_from':send_from,
		'send_to':send_to,
		"type":type
	};
	utils.pushMessage(rid,channel,param,cache);
	//channel.pushMessage(param);
};

/*采取依次操作方式 避免因为同时操作引起的 异步问题*/
SJGameLogicRemote.changeCurPlayer = function(rid,location,status,channel){
    var param = {
        route:'onChangePlayer',
        location:location,
		status:status
    };
    channel.pushMessage(param);
};
