/**
 * Created by wuningjian on 3/3/16.
 */

var gameDao   = require('../../../dao/gameDao');
var playerDao = require('../../../dao/playerDao');
var delayDao  = require('../../../dao/delayDao');
var paijiuDao  = require('../../../dao/paijiuDao');
var utils   = require('../../../util/utils');
var pomelo	= require('pomelo');
var async	 = require('async');
var cache	 = require('memory-cache');

var gameLogicRemote = module.exports;

/**
 * fa pai
 * */
gameLogicRemote.fapai = function(rid,num1,num2,channel,channelService){
	////如果name不存在且flag为true，则创建channel
	var users = channel.getMembers();
	console.log("--------users in fapai:"+users);
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}

	gameDao.get_room_by_room_id(rid,function(err,roomInfo){
		var paiArr = cache.get(rid);
		if(paiArr == null){
			var param = {
				route:'onFapai',//接受发牌消息
				cur_turn:0,
				nums:[num1,num2],
				all_chip:roomInfo.zhuang_score,
				location:roomInfo.first_fapai  //返回第一个出牌的人
			};
			channel.pushMessage(param);
		}else{
			var param = {
				route:'onFapai',//接受发牌消息
				cur_turn:1,
				nums:[num1,num2],
				all_chip:roomInfo.zhuang_score,
				location:roomInfo.first_fapai  //返回第一个出牌的人
			};
			channel.pushMessage(param);
		}
	});

	//3000ms为发牌动作执行时间间隔
	setTimeout(function(){
		//P:牌数字2-14
		//S:花色 1方块 2梅花 3红桃 4黑桃
		//这里需要完成发牌逻辑
		var paiArr = cache.get(rid);
		if(paiArr == null){
			var paixing = gameLogicRemote.getCardArr(rid);
			gameDao.sub_round(rid,1,function(err,res){
				var param = {
					route:'onShoupai',
					paixing:paixing,
					round:res
				};
				channel.pushMessage(param);
				for(var i = 0; i < 4;i++){
					gameDao.update_pai(rid,paixing[i],i + 1,function(err){
						console.log("gameDao.updatePai success");
					});
				}
			});
		}else{
			var paixing = gameLogicRemote.get_card_arr_from_cache(rid);
			gameDao.sub_round(rid,0,function(err,res){
				for(var i = 0; i < 4;i++){
					gameDao.update_pai(rid,paixing[i],i + 1,function(err){
						console.log("gameDao.updatePai success");
					});
				}
				var param = {
					route:'onShoupai',
					paixing:paixing,
					round:res
				};
				channel.pushMessage(param);
			});
		}
	},3000);
};

/**
 * 分牌逻辑，调用后返回牌型数组
 * */
gameLogicRemote.getCardArr = function(rid){
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
	console.log("arr:"+arr);

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

	cache.put(rid,restPaiArr);//剩余的牌存到缓存当中，关键字是房间号

	console.log("paiArr:"+paiArr);

	var paixing = [];

	paixing[0] = [paiArr[0],paiArr[4],paiArr[8],paiArr[12]];
	paixing[1] = [paiArr[1],paiArr[5],paiArr[9],paiArr[13]];
	paixing[2] = [paiArr[2],paiArr[6],paiArr[10],paiArr[14]];
	paixing[3] = [paiArr[3],paiArr[7],paiArr[11],paiArr[15]];

	console.log("paixing:"+paixing);
	return paixing;
};

gameLogicRemote.get_card_arr_from_cache = function(rid){
	var paiArr = cache.get(rid);

	console.log("paiArr:"+paiArr);
	var paixing = [];
	paixing[0] = [paiArr[0],paiArr[4],paiArr[8],paiArr[12]];
	paixing[1] = [paiArr[1],paiArr[5],paiArr[9],paiArr[13]];
	paixing[2] = [paiArr[2],paiArr[6],paiArr[10],paiArr[14]];
	paixing[3] = [paiArr[3],paiArr[7],paiArr[11],paiArr[15]];
	console.log("paixing:"+paixing);
	cache.del(rid);
	return paixing;
};

/**
 * 比牌请求处理路由
 * */
gameLogicRemote.bipai = function(rid,location1,location2,cb){
	//比牌逻辑，返回结果
	var self = this;
	gameDao.get_pai(rid,location1,function(err,pai1){
		gameDao.get_pai(rid,location2,function(err,pai2){
			console.log("pai1:" + JSON.stringify(pai1));
			console.log("pai2:" + JSON.stringify(pai2));
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
			paijiuDao.get_paijiu_by_paixing(pai1_1,function(err,res1_1){
				paijiuDao.get_paijiu_by_paixing(pai2_1,function(err,res2_1){
					paijiuDao.get_paijiu_by_paixing(pai1_2,function(err,res1_2){
						paijiuDao.get_paijiu_by_paixing(pai2_2,function(err,res2_2){
							console.log(JSON.stringify(res1_1) + JSON.stringify(res1_2) + JSON.stringify(res2_1) + JSON.stringify(res2_2));
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
};

gameLogicRemote.peipai = function(rid,location,marks,select,channel,username){
	var users = channel.getMembers();
	var paixing = new Array();
	paixing.push(marks[0]);
	paixing.push(marks[1]);
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
		gameDao.update_peipai(rid,paixing,location,function(err,res){
			var param = {
				route:'onPeiPai',
				location:location,
				marks:marks,
				select:select
			};
			channel.pushMessage(param);
			gameDao.get_peipai_num(rid,function(err,peipai_num){
				if(users.length <= peipai_num){
					setTimeout(function(){
						var param = {
							route:'onPeiPaiFinish',
							location:location
						};
						channel.pushMessage(param);
					},1000);
				}
			});
		});
	});
};

gameLogicRemote.qiang = function(rid,location,flag,channel,username){
	var users = channel.getMembers();
	console.log("--------users in fapai:"+users);
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	gameDao.set_qiang_zhuang(rid,location,flag,function(err,res){
		var param = {
			route:'onQiang',
			location:location,
			flag:flag
		};
		channel.pushMessage(param);
		gameDao.get_qiang_num(rid,function(err,num){
			if(num >= users.length){
				gameDao.get_qiang_zhuang(rid,function(err,qiangzuangs){
					var num1 = utils.get_random_num(1,6);
					var num2 = utils.get_random_num(1,6);
					if(qiangzuangs.length == 0){
						gameDao.get_players_location(rid,function(err,locations){
							var local = (num1 + num2) % locations.length;
							if(local == 0){
								local = locations.length;
							}
							var zhuang_id = qiangzuangs[local - 1];
							setTimeout(function(){
								gameDao.set_zhuang_location(rid,zhuang_id,function(err,res){
									gameDao.sub_local_gold(rid,zhuang_id,100,function(err,res){
										var param = {
											route:'onGetZhuang',
											nums:[num1,num2],
											zhuang_local:zhuang_id
										};
										channel.pushMessage(param);
									});
								});
							},1000);
						});
					}else{
						var local = (num1 + num2) % qiangzuangs.length;
						if(local == 0){
							local = qiangzuangs.length;
						}
						var zhuang_id = qiangzuangs[local - 1];
						setTimeout(function(){
							gameDao.set_zhuang_location(rid,zhuang_id,function(err,res){
								gameDao.sub_local_gold(rid,zhuang_id,100,function(err,res){
									var param = {
										route:'onGetZhuang',
										nums:[num1,num2],
										zhuang_local:zhuang_id
									};
									channel.pushMessage(param);
								});
							});
						},1000);
					}
				});
			}
		});
	});
};

gameLogicRemote.xiazhu = function(rid,location,chips,channel,channelService){
	var users = channel.getMembers();
	console.log("--------users in fapai:"+users);
	gameDao.set_xiazhu(rid,location,chips,function(err,res){
		var param = {
			route:'onXiazhu',
			location:location,
			chips:chips
		};
		channel.pushMessage(param);
		setTimeout(function(){
			gameDao.get_every_score(rid,function(err,scores){
				if(scores.length >= users.length - 1){
					var num1 = utils.get_random_num(1,6);
					var num2 = utils.get_random_num(1,6);
					var local = (num1 + num2) % 4;
					if(local == 0){
						local = 4;
					}
					gameDao.set_first_location(rid,local,4,function(err,res){
						gameLogicRemote.fapai(rid,num1,num2,channel,channelService);
					});
				}
			});
		},2000);
	});
};

gameLogicRemote.open = function(rid,location,channel,channelService){
	gameDao.get_all_pai(rid,function(err,all_pai){
		var param = {
			route:'onOpen',
			all_pai:all_pai
		};
		channel.pushMessage(param);
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
					console.log("zhuang_local:" + zhuang_local + " my_location:" + my_location);
					if(room_info["location" + my_location] != null && room_info["location" + my_location] != 'null'){
						gameLogicRemote.bipai(rid,zhuang_local,my_location,function(location1,location2,is_win,flag){
							console.log("bipai:" + location1 + " location2:" + location2 + " is_win:" + is_win + " flag:" + flag);
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
					gameLogicRemote.end_game(rid,locals_score,channel,channelService);
				});
			});
		},1000);
	});
};

gameLogicRemote.end_game = function(rid,locals_score,channel,channelService){
	console.log('locals_score:' + JSON.stringify(locals_score) + rid);
	var temp_score = [0,0,0,0];
	gameDao.get_room_by_room_id(rid,function(err,room_info){
		var zhuang_score = locals_score[room_info.zhuang_location - 1];
		if(zhuang_score >= 0){
			//赢得分数比现在多则只能赢相应的分数
			if(zhuang_score > room_info.zhuang_score){
				//循环计算赢得玩家并更新分数
				var my_location = room_info.zhuang_location;
				var callback_win = function(callback){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
						if(locals_score[my_location - 1] >= 0){
							gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
								temp_score[my_location - 1] = locals_score[my_location - 1];
								temp_score[room_info.zhuang_location - 1] = locals_score[room_info.zhuang_location - 1] -temp_score[my_location - 1];
								callback(null);
							});
						}else{
							callback(null);
						}
					}else{
						callback(null);
					}
				};
				async.waterfall([
					callback_win,
					callback_win,
					callback_win
				],function(err){
					console.log("zhuang_score >> callback_win temp_score;" + JSON.stringify(temp_score));
					my_location = room_info.zhuang_location;
					var callback_lose = function(callback){
						my_location = my_location + 1;
						if(my_location > 4){
							my_location = 1;
						}
						if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
							if(locals_score[my_location - 1] < 0){
								//如果加入分数大于庄家目前的分数则只能收取庄家目前的分数
								var left_score = temp_score[room_info.zhuang_location - 1] - locals_score[my_location - 1];
								if(left_score >= room_info.zhuang_score){
									var miss_score = left_score - room_info.zhuang_score;
									gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1] + miss_score,function(err,res){
										temp_score[my_location - 1] = temp_score[my_location - 1] + miss_score;
										temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - temp_score[my_location - 1];
										callback(null);
									});
								}else{
									gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
										temp_score[my_location - 1] = temp_score[my_location - 1];
										temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - temp_score[my_location - 1];
										callback(null);
									});
								}
							}else{
								callback(null);
							}
						}else{
							callback(null);
						}
					};
					async.waterfall([
						callback_lose,
						callback_lose,
						callback_lose
					],function(err){
						console.log("zhuang_score >> callback_lose temp_score;" + JSON.stringify(temp_score));
						gameDao.sub_local_gold(rid,room_info.zhuang_location,temp_score[room_info.zhuang_location - 1],function(err,res){
							gameDao.sub_zhuang_score(rid,temp_score[room_info.zhuang_location - 1],function(err,code){
								gameDao.reset_room(rid,function(err,res){
									var param = {
										'route':'onEnd',
										'scores':temp_score
									};
									if(res.zhuang_score >= 500){
										param['isqie'] = 2;
									}else if(res.zhuang_score == 0){
										param['isqie'] = 2;
									}else if(res.round >= 3 && cache.get(rid) != null){
										param['isqie'] = 1;
									}else{
										param['isqie'] = 0;
									}
									channel.pushMessage(param);
								});
							});
						});
					});
				});
			}else{
				var my_location = room_info.zhuang_location;
				var callback = function(callback){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
						gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
							temp_score[my_location - 1] = locals_score[my_location - 1];
							temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - temp_score[my_location - 1];
							callback(null);
						});
					}else{
						callback(null);
					}
				};
				async.waterfall([
					callback,
					callback,
					callback
				],function(err){
					console.log("zhuang_score >> callback temp_score;" + JSON.stringify(temp_score));
					gameDao.sub_local_gold(rid,room_info.zhuang_location,temp_score[room_info.zhuang_location - 1],function(err,res){
						gameDao.sub_zhuang_score(rid,temp_score[room_info.zhuang_location - 1],function(err,code){
							gameDao.reset_room(rid,function(err,res){
								var param = {
									'route':'onEnd',
									'scores':temp_score
								};
								if(res.zhuang_score >= 500){
									param['isqie'] = 2;
								}else if(res.zhuang_score == 0){
									param['isqie'] = 2;
								}else if(res.round >= 3 && cache.get(rid) != null){
									param['isqie'] = 1;
								}else{
									param['isqie'] = 0;
								}
								channel.pushMessage(param);
							});
						});
					});
				});
			}
		}else{
			//庄家输分 but 分数不够则计算取舍
			if(zhuang_score + room_info.zhuang_score < 0){
				var my_location = room_info.zhuang_location;
				//输的人正常输分
				var callback_lose = function(callback){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
						if(locals_score[my_location - 1] < 0){
							gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
								temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - locals_score[my_location - 1];
								temp_score[my_location - 1] = locals_score[my_location - 1];
								callback(null);
							});
						}else{
							callback(null);
						}
					}else{
						callback(null);
					}
				};
				async.waterfall([
					callback_lose,
					callback_lose,
					callback_lose
				],function(err){
					console.log("zhuang_score << callback_lose temp_score;" + JSON.stringify(temp_score));
					my_location = room_info.zhuang_location;
					//循环计算赢得玩家并更新分数
					var callback_win = function(callback){
						my_location = my_location + 1;
						if(my_location > 4){
							my_location = 1;
						}
						if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
							if(locals_score[my_location - 1] >= 0){
								var left_score = temp_score[room_info.zhuang_location - 1] + room_info.zhuang_location;
								//分数不够赔给玩家则只能赔庄分
								if(left_score - locals_score[my_location - 1] <= 0){
									var miss_score = locals_score[my_location - 1] - left_score;
									gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1] - miss_score,function(err,res){
										temp_score[my_location - 1] = locals_score[my_location - 1] - miss_score;
										temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - temp_score[my_location - 1];
										callback(null);
									});
								}else{
									gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
										temp_score[my_location - 1] = locals_score[my_location - 1];
										temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - temp_score[my_location - 1];
										callback(null);
									});
								}
							}else{
								callback(null);
							}
						}else{
							callback(null);
						}
					};
					async.waterfall([
						callback_win,
						callback_win,
						callback_win
					],function(err){
						console.log("zhuang_score << callback_win temp_score;" + JSON.stringify(temp_score));
						gameDao.sub_local_gold(rid,room_info.zhuang_location,temp_score[room_info.zhuang_location - 1],function(err,res){
							gameDao.sub_zhuang_score(rid,temp_score[room_info.zhuang_location - 1],function(err,code){
								gameDao.reset_room(rid,function(err,res){
									var param = {
										'route':'onEnd',
										'scores':temp_score
									};
									if(res.zhuang_score >= 500){
										param['isqie'] = 2;
									}else if(res.zhuang_score == 0){
										param['isqie'] = 2;
									}else if(res.round >= 3 && cache.get(rid) != null){
										param['isqie'] = 1;
									}else{
										param['isqie'] = 0;
									}
									channel.pushMessage(param);
								});
							});
						});
					});
				});
			}else{
				my_location = room_info.zhuang_location;
				var callback = function(callback){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
						gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
							temp_score[my_location - 1] = locals_score[my_location - 1];
							temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - temp_score[my_location - 1];
							callback(null);
						});
					}else{
						callback(null);
					}
				};
				async.waterfall([
					callback,
					callback,
					callback
				],function(err){
					console.log("zhuang_score << callback temp_score;" + JSON.stringify(temp_score));
					gameDao.sub_local_gold(rid,room_info.zhuang_location,temp_score[room_info.zhuang_location - 1],function(err,res){
						gameDao.sub_zhuang_score(rid,temp_score[room_info.zhuang_location - 1],function(err,code){
							gameDao.reset_room(rid,function(err,res){
								var param = {
									'route':'onEnd',
									'scores':temp_score
								};
								if(res.zhuang_score >= 500){
									param['isqie'] = 2;
								}else if(res.zhuang_score == 0){
									param['isqie'] = 2;
								}else if(res.round >= 3 && cache.get(rid) != null){
									param['isqie'] = 1;
								}else{
									param['isqie'] = 0;
								}
								channel.pushMessage(param);
							});
						});
					});
				});
			}
		}
	});
};

gameLogicRemote.qieguo = function(rid,location,flag,channel,channelService){
	if(flag == false){
		var param = {
			'route':'onQieguo',
			'flag':flag
		};
		channel.pushMessage(param);
	}else{
		gameDao.get_room_by_room_id(rid,function(err,room_info){
			var temp_scole = new Array();
			temp_scole.push(room_info.left_score_1);
			temp_scole.push(room_info.left_score_2);
			temp_scole.push(room_info.left_score_3);
			temp_scole.push(room_info.left_score_4);
			gameDao.set_is_gaming(rid,-1,function(err,res){
				var param = {
					'route':'onQieguo',
					'flag':flag,
					'scores':temp_scole
				};
				channel.pushMessage(param);
			});
		});
	}
};

gameLogicRemote.get_local_player = function(rid,send_from,location,channel,channelService){
	gameDao.get_local_player_id(rid,location,function(err,player_id){
		playerDao.get_player_by_id(player_id,function(err,player){
			var param = {
				'route':'onGetUinfo',
				'player':player,
				'send_from':send_from,
				'location':location
			};
			channel.pushMessage(param);
		});
	});
};

gameLogicRemote.send_gift = function(rid,send_from,send_to,type,channel,channelService){
	var param = {
		'route':'onSendGift',
		'send_from':send_from,
		'send_to':send_to,
		"type":type
	};
	channel.pushMessage(param);
};
