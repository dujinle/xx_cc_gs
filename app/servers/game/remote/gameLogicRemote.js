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
		var param = {
			route:'onFapai',//接受发牌消息
			msg:"fapaile!",
			round:roomInfo.room_num,
			nums:[num1,num2],
			all_chip:roomInfo.zhuang_score,
			location:roomInfo.first_fapai  //返回第一个出牌的人
		};
		channel.pushMessage(param);
	});

	//3000ms为发牌动作执行时间间隔
	setTimeout(function(){
		//P:牌数字2-14
		//S:花色 1方块 2梅花 3红桃 4黑桃
		//这里需要完成发牌逻辑
		var paixing = gameLogicRemote.getCardArr(rid);

		var param = {
			route:'onShoupai',
			paixing:paixing
		};
		channel.pushMessage(param);
		for(var i = 0; i < 4;i++){
			gameDao.update_pai(rid,paixing[i],i + 1,function(err){
				console.log("gameDao.updatePai success");
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
									var param = {
										route:'onGetZhuang',
										nums:[num1,num2],
										zhuang_local:zhuang_id
									};
									channel.pushMessage(param);
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
								var param = {
									route:'onGetZhuang',
									nums:[num1,num2],
									zhuang_local:zhuang_id
								};
								channel.pushMessage(param);
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
				async.parallel([
					function(callback){
						if(room_info.location1 != null && room_info.location1 != 'null'){
							if(zhuang_local != 1){
								gameLogicRemote.bipai(rid,zhuang_local,1,function(location1,location2,is_win,flag){
									if(is_win == 'win'){
										var score = JSON.parse(room_info.score_1);
										if(flag == true){
											locals_score[0] = locals_score[0] - parseInt(score[0]) - parseInt(score[1]);
											locals_score[zhuang_local - 1] = parseInt(score[0]) + parseInt(score[1]) + locals_score[zhuang_local - 1];
										}else{
											locals_score[0] = locals_score[0] - parseInt(score[0]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] + parseInt(score[0]);
										}
									}else if(is_win == 'lose'){
										var score = JSON.parse(room_info.score_1);
										if(flag == true){
											locals_score[0] = locals_score[0] + parseInt(score[0]) + parseInt(score[1]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] - parseInt(score[0]) - parseInt(score[1]);
										}else{
											locals_score[0] = locals_score[0] + parseInt(score[0]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] - parseInt(score[0]);
										}
									}
									callback(null);
								});
							}else{
								callback(null);
							}
						}else{
							callback(null);
						}
					},
					function(callback){
						if(room_info.location2 != null && room_info.location2 != 'null'){
							if(zhuang_local != 2){
								gameLogicRemote.bipai(rid,zhuang_local,2,function(location1,location2,is_win,flag){
									if(is_win == 'win'){
										var score = JSON.parse(room_info.score_2);
										if(flag == true){
											locals_score[1] = locals_score[1] - parseInt(score[0]) - parseInt(score[1]);
											locals_score[zhuang_local - 1] = parseInt(score[0]) + parseInt(score[1]) + locals_score[zhuang_local - 1];
										}else{
											locals_score[1] = locals_score[1] - parseInt(score[0]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] + parseInt(score[0]);
										}
									}else if(is_win == 'lose'){
										var score = JSON.parse(room_info.score_2);
										if(flag == true){
											locals_score[1] = locals_score[1] + parseInt(score[0]) + parseInt(score[1]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] - parseInt(score[0]) - parseInt(score[1]);
										}else{
											locals_score[1] = locals_score[1] + parseInt(score[0]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] - parseInt(score[0]);
										}
									}
									callback(null);
								});
							}else{
								callback(null);
							}
						}else{
							callback(null);
						}
					},
					function(callback){
						if(room_info.location3 != null && room_info.location3 != 'null'){
							if(zhuang_local != 3){
								gameLogicRemote.bipai(rid,zhuang_local,3,function(location1,location2,is_win,flag){
									if(is_win == 'win'){
										var score = JSON.parse(room_info.score_3);
										if(flag == true){
											locals_score[2] = locals_score[2] - parseInt(score[0]) - parseInt(score[1]);
											locals_score[zhuang_local - 1] = parseInt(score[0]) + parseInt(score[1]) + locals_score[zhuang_local - 1];
										}else{
											locals_score[2] = locals_score[2] - parseInt(score[0]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] + parseInt(score[0]);
										}
									}else if(is_win == 'lose'){
										var score = JSON.parse(room_info.score_3);
										if(flag == true){
											locals_score[2] = locals_score[2] + parseInt(score[0]) + parseInt(score[1]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] - parseInt(score[0]) - parseInt(score[1]);
										}else{
											locals_score[2] = locals_score[2] + parseInt(score[0]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] - parseInt(score[0]);
										}
									}
									callback(null);
								});
							}else{
								callback(null);
							}
						}else{
							callback(null);
						}
					},
					function(callback){
						if(room_info.location4 != null && room_info.location4 != 'null'){
							if(zhuang_local != 4){
								gameLogicRemote.bipai(rid,zhuang_local,4,function(location1,location2,is_win,flag){
									if(is_win == 'win'){
										var score = JSON.parse(room_info.score_4);
										if(flag == true){
											locals_score[3] = locals_score[3] - parseInt(score[0]) - parseInt(score[1]);
											locals_score[zhuang_local - 1] = parseInt(score[0]) + parseInt(score[1]) + locals_score[zhuang_local - 1];
										}else{
											locals_score[3] = locals_score[3] - parseInt(score[0]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] + parseInt(score[0]);
										}
									}else if(is_win == 'lose'){
										var score = JSON.parse(room_info.score_4);
										if(flag == true){
											locals_score[3] = locals_score[3] + parseInt(score[0]) + parseInt(score[1]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] - parseInt(score[0]) - parseInt(score[1]);
										}else{
											locals_score[3] = locals_score[3] + parseInt(score[0]);
											locals_score[zhuang_local - 1] = locals_score[zhuang_local - 1] - parseInt(score[0]);
										}
									}
									callback(null);
								});
							}else{
								callback(null);
							}
						}else{
							callback(null);
						}
					}
				],
				function(err){
					gameLogicRemote.end_game(rid,locals_score,channel,channelService);
				});
			});
		},1000);
	});
};

gameLogicRemote.end_game = function(rid,locals_score,channel,channelService){
	var temp_score = [0,0,0,0];
	gameDao.get_room_by_room_id(rid,function(err,room_info){
		var zhuang_score = locals_score[room_info.zhuang_location - 1];
		if(zhuang_score >= 0){
			//赢得分数比现在多则只能赢相应的分数
			var start_location = room_info.zhuang_location;
			if(zhuang_score > room_info.zhuang_score){
				//循环计算赢得玩家并更新分数
				var callback_win = function(my_location){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					if(my_location == room_info.zhuang_location){
						return;
					}
					if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
						if(locals_score[my_location - 1] >= 0){
							gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
								temp_score[my_location - 1] = locals_score[my_location - 1];
								temp_score[room_info.zhuang_location - 1] = locals_score[room_info.zhuang_location - 1] -temp_score[my_location - 1];
								callback_win(my_location);
							});
						}else{
							callback_win(my_location);
						}
					}else{
						callback_win(my_location);
					}
				};
				callback_win(start_location);

				start_location = room_info.zhuang_location;
				var callback_lose = function(my_location){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					if(my_location == room_info.zhuang_location){
						return;
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
									callback_lose(my_location);
								});
							}else{
								gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
									temp_score[my_location - 1] = temp_score[my_location - 1];
									temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - temp_score[my_location - 1];
									callback_lose(my_location);
								});
							}
						}else{
							callback_lose(my_location);
						}
					}else{
						callback_lose(my_location);
					}
				};
				callback_lose(start_location);
			}else{
				var callback_win = function(my_location){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					if(my_location == room_info.zhuang_location){
						return;
					}
					if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
						gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
							temp_score[my_location - 1] = locals_score[my_location - 1];
							temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - temp_score[my_location - 1];
							callback_win(my_location);
						});
					}else{
						callback_win(my_location);
					}
				};
				callback_win(start_location);
			}
		}else{
			//庄家输分 but 分数不够则计算取舍
			var start_location = room_info.zhuang_location;
			if(zhuang_score + room_info.zhuang_score < 0){
				//输的人正常输分
				var callback_lose = function(my_location){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					if(my_location == room_info.zhuang_location){
						return;
					}
					if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
						if(locals_score[my_location - 1] < 0){
							gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
								temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - locals_score[my_location - 1];
								temp_score[my_location - 1] = locals_score[my_location - 1];
								callback_lose(my_location);
							});
						}else{
							callback_lose(my_location);
						}
					}else{
						callback_lose(my_location);
					}
				};
				callback_lose(start_location);

				start_location = room_info.zhuang_location;
				//循环计算赢得玩家并更新分数
				var callback_win = function(my_location){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					if(my_location == room_info.zhuang_location){
						return;
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
									callback_win(my_location);
								});
							}else{
								gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
									temp_score[my_location - 1] = locals_score[my_location - 1];
									temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - temp_score[my_location - 1];
									callback_win(my_location);
								});
							}
						}else{
							callback_win(my_location);
						}
					}else{
						callback_win(my_location);
					}
				};
				callback_win(start_location);
			}else{
				var callback_win = function(my_location){
					my_location = my_location + 1;
					if(my_location > 4){
						my_location = 1;
					}
					if(my_location == room_info.zhuang_location){
						return;
					}
					if(room_info['location' + my_location] != null && room_info['location' + my_location] != 'null'){
						gameDao.sub_local_gold(rid,my_location,locals_score[my_location - 1],function(err,res){
							temp_score[my_location - 1] = locals_score[my_location - 1];
							temp_score[room_info.zhuang_location - 1] = temp_score[room_info.zhuang_location - 1] - temp_score[my_location - 1];
							callback_win(my_location);
						});
					}else{
						callback_win(my_location);
					}
				};
				callback_win(start_location);
			}
		}
		var param = {
			'route':'onEnd',
			'scores':temp_score
		};
		channel.pushMessage(param);
	});
}
/**
 * 比牌或者最后一位玩家弃牌以后，重新开始牌局游戏
 * @param app
 * @param uid
 * @param rid
 * @param channel
 * @param channelService
 * @param game_winner 上一局胜利玩家
 */
gameLogicRemote.restartGame = function(app,uid,rid,channel,channelService,game_winner,playerId){
	//重新开始
	var param = {
		route:'onEnd',
		winner:game_winner
	};
	channel.pushMessage(param);
	//游戏结束，取消定时器
	delayDao.removeDelay(rid,function(){
		console.log("throw:removeDelay success");
	});
	gameDao.getRoomStatus(rid,function(err,roomStatus){
		//if(err)
		if(roomStatus==1){
			gameDao.getRoomInfo(rid,function(err,roomInfo){
				var playerId;
				var pai_type;
				var paixing = [];
				switch (game_winner){
					case 1:
						//console.log("roomInfo.pai:"+roomInfo.pai1);
						paixing = gameLogicRemote.sortPai(JSON.parse(roomInfo.pai1));
						//console.error("paixing:"+paixing);
						pai_type = gameLogicRemote.classPai(paixing);
						playerId = roomInfo.location1.split('*')[0];
						break;
					case 2:
						//console.log("roomInfo.pai:"+roomInfo.pai2);
						paixing = gameLogicRemote.sortPai(JSON.parse(roomInfo.pai2));
						//console.error("paixing:"+paixing);
						pai_type = gameLogicRemote.classPai(paixing);
						playerId = roomInfo.location2.split('*')[0];
						break;
					case 3:
						//console.log("roomInfo.pai:"+roomInfo.pai3);
						paixing = gameLogicRemote.sortPai(JSON.parse(roomInfo.pai3));
						//console.error("paixing:"+paixing);
						pai_type = gameLogicRemote.classPai(paixing);
						playerId = roomInfo.location3.split('*')[0];
						break;
					case 4:
						//console.log("roomInfo.pai:"+roomInfo.pai4);
						paixing = gameLogicRemote.sortPai(JSON.parse(roomInfo.pai4));
						//console.error("paixing:"+paixing);
						pai_type = gameLogicRemote.classPai(paixing);
						playerId = roomInfo.location4.split('*')[0];
						break;
					case 5:
						//console.log("roomInfo.pai:"+roomInfo.pai5);
						paixing = gameLogicRemote.sortPai(JSON.parse(roomInfo.pai5));
						//console.error("paixing:"+paixing);
						pai_type = gameLogicRemote.classPai(paixing);
						playerId = roomInfo.location5.split('*')[0];
						break;
					default:
						pai_type = 2;
				}
				var endPai = {
					route:'onEndPai',
					location1:roomInfo.pai1,
					location2:roomInfo.pai2,
					location3:roomInfo.pai3,
					location4:roomInfo.pai4,
					location5:roomInfo.pai5,
					winner_pai:pai_type
				};
				channel.pushMessage(endPai);
				//减玩家金币，根据回调，成功以后才能进行下面的(这里是增加胜利者金币)

				gameDao.getAllChip(rid,function(err,all_chip){
					playerDao.setGold(playerId,all_chip,function(err,res){
						console.log('-------fapai subGold------');
						gameDao.resetData(rid,function(err){

							gameDao.getRoomInfo(rid,function(err,roomInfo){
								async.parallel([
										function(callback){
											if(roomInfo.location1 != "null"){
												var playerId = parseInt(roomInfo.location1.split('*')[0]);
												gameLogicRemote.detect_gold(app,uid,channel,playerId,rid,function(data){
													callback(null, data);
												});
											}else{
												callback(null, "null");
											}
										},
										function(callback){
											if(roomInfo.location2 != "null"){
												var playerId = parseInt(roomInfo.location2.split('*')[0]);
												gameLogicRemote.detect_gold(app,uid,channel,playerId,rid,function(data){
													callback(null, data);
												});
											}else{
												callback(null, "null");
											}
										},
										function(callback){
											if(roomInfo.location3 != "null"){
												var playerId = parseInt(roomInfo.location3.split('*')[0]);
												gameLogicRemote.detect_gold(app,uid,channel,playerId,rid,function(data){
													callback(null, data);
												});
											}else{
												callback(null, "null");
											}
										},
										function(callback){
											if(roomInfo.location4 != "null"){
												var playerId = parseInt(roomInfo.location4.split('*')[0]);
												gameLogicRemote.detect_gold(app,uid,channel,playerId,rid,function(data){
													callback(null, data);
												});
											}else{
												callback(null, "null");
											}
										},
										function(callback){
											if(roomInfo.location5 != "null"){
												var playerId = parseInt(roomInfo.location5.split('*')[0]);
												gameLogicRemote.detect_gold(app,uid,channel,playerId,rid,function(data){
													callback(null, data);
												});
											}else{
												callback(null, "null");
											}
										}
									],
									function(err, results){
										//console.log("async parallel"+JSON.stringify(results[0]));
										//console.log("async parallel"+results);
										//channelService.pushMessageByUids('onInit',results,[{uid:uid,sid:sid}]);
										//return results;
										setTimeout(function(){
											gameLogicRemote.fapai(app,uid,rid,channel,channelService,playerId,function(){
												console.log("gameLogic cb");
											});
										},10000);
									});
							});

						});
					});
				});
			});
		}
	});

};


