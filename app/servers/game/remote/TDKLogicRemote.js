/**
 * Created by wuningjian on 3/3/16.
 */

var TDKGameDao   = require('../../../dao/TDKGameDao');
var playerDao = require('../../../dao/playerDao');
var delayDao  = require('../../../dao/delayDao');
var pomelo	= require('pomelo');
var async	 = require('async');
var cache	 = require('memory-cache');

var TDKLogicRemote = module.exports;

TDKLogicRemote.detect_gold = function(app,uid,channel,playerId,rid,cb){
	playerDao.getPlayerByPlayerId(playerId,function(err,playerInfo){
		if(err!==null){
			console.error("TDKLogicRemote detect_gold error");
			cb();
		}else{
			TDKGameDao.getRoomInfo(rid,function(err,roomInfo){
				if(err!==null){
					console.error("TDKLogicRemote detect_gold 1 error");
					cb();
				}else{
					var basicChip = roomInfo.basic_chip;
					switch (basicChip){
						case 100:
							if(playerInfo.gold>=3000){
								cb("permit");
							}else{
								if(!!channel){
									var abc = channel.leave(uid,"connector-server-1");
									if(abc==true){
										TDKGameDao.rmPlayer(rid,uid,function(){
											var param = {
												route: 'onLeave',
												user: uid.split('*')[0]
											};
											channel.pushMessage(param);
											console.log("detect_gold rmPlayer succseefully");
											cb("refuse");
										});
									}
								}
							}
							break;
						case 500:
							if(playerInfo.gold>=50000){
								cb("permit");
							}else{
								if(!!channel){
									var abc = channel.leave(uid,"connector-server-1");
									if(abc==true){
										TDKGameDao.rmPlayer(rid,uid,function(){
											var param = {
												route: 'onLeave',
												user: uid.split('*')[0]
											};
											channel.pushMessage(param);
											console.log("detect_gold rmPlayer succseefully");
											cb("refuse");
										});
									}
								}
							}
							break;
						case 1000:
							if(playerInfo.gold>=100000){
								cb("permit");
							}else{
								if(!!channel){
									var abc = channel.leave(uid,"connector-server-1");
									if(abc==true){
										TDKGameDao.rmPlayer(rid,uid,function(){
											var param = {
												route: 'onLeave',
												user: uid.split('*')[0]
											};
											channel.pushMessage(param);
											console.log("detect_gold rmPlayer succseefully");
											cb("refuse");
										});
									}
								}
							}
							break;
						case 10000:
							if(playerInfo.gold>=1000000){
								cb("permit");
							}else{
								if(!!channel){
									var abc = channel.leave(uid,"connector-server-1");
									if(abc==true){
										TDKGameDao.rmPlayer(rid,uid,function(){
											var param = {
												route: 'onLeave',
												user: uid.split('*')[0]
											};
											channel.pushMessage(param);
											console.log("detect_gold rmPlayer succseefully");
											cb("refuse");
										});
									}
								}
							}
							break;
						default:
							cb("refuse");
							break;
					}
				}
			});
		}
	});
};

/**
 * fa pai
 * */
TDKLogicRemote.fapai = function(rid,channel,channelService){
	////如果name不存在且flag为true，则创建chann
	var users = channel.getMembers();
	console.log("--------users in fapai:"+users);
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}

	TDKGameDao.getRoomInfo(rid,function(err,roomInfo){
		//判断是否还可以进行下一局的游戏
		if(roomInfo.round >= roomInfo.total_round){
			TDKGameDao.getStartGolds(rid,function(err,golds){
				var re_golds = new Array();
				call_back = function(length,golds){
					if(golds.length <= length){
						return true;
					}else{
						var gold = golds[length];
						playerDao.getPlayerByPlayerId(gold[0],function(err,player){
							console.log("playerid:" + gold[0] + " sgold:" + gold[1] + " egold:" + player.gold + " length:" + length);
							re_golds.push([player.nickName,gold[1],player.gold,gold[1] - player.gold]);
							length = length + 1;
							if(length >= golds.length){
								var param = {
									route:'onNoRound',
									golds:re_golds,
								};
								channel.pushMessage(param);
							}else{
								call_back(length,golds);
							}
						});
					}
				}
				call_back(0,golds);
			});
		}else{
			TDKGameDao.subRound(rid,1,function(err,round){
				//选择开始发牌的张数
				var fapai_num = roomInfo.fapai_num;
				//大于两人才执行发牌
				TDKGameDao.getAllChip(rid,function(err,ex_all_chip){
					TDKGameDao.getCurrentChip(rid,function(err,cur_chip){
						var new_chip = ex_all_chip+cur_chip*(users.length);
						TDKGameDao.setAllChip(rid,new_chip,function(err,res){
							var first_fapai = users[Math.floor(Math.random()*users.length)];
							TDKGameDao.getPlayerLocal(rid,first_fapai,function(res,location){
								console.log("fapai:new_chip:"+new_chip);
								console.log("fapai:setAllChip success");
								var param = {
									route:'onFapai',//接受发牌消息
									msg:"fapaile!",
									round:round,
									all_chip:new_chip,
									location:location
								};
								if(roomInfo.first_fapai != 0){
									param["location"] = roomInfo.first_fapai;
								}
								channel.pushMessage(param);
							});
						});
					});
					for(var i = 0; i<users.length; i++){
						var playerId_int = parseInt(users[i]);
						playerDao.subGold(playerId_int,100,function(err,res){
							console.log('-------start fapai and deduct the gold------');
						});
					}
				});
				//P:牌数字2-14
				//S:花色 1方块 2梅花 3红桃 4黑桃
				//这里需要完成发牌逻辑

				TDKGameDao.getQuChuPai(rid,function(err,quchuPai){
					var paixing = TDKLogicRemote.getCardArr(rid,fapai_num,quchuPai);
					//寻找最后一张牌的最大位置 他最有开始的发言权
					var first_turn = 0;
					var max_pai = 0;
					var tailpai = new Array();
					for(var i=0;i<users.length;i++){
						TDKGameDao.getPlayerLocal(rid,users[i],function(res,location){
							console.log("paixing:" + JSON.stringify(paixing) + " location:" + location);
							var opaixing = paixing[location-1];
							var p = opaixing["p" + fapai_num];
							var s = opaixing["s" + fapai_num];
							if(parseInt(p) > max_pai){
								max_pai = parseInt(p);
								first_turn = location;
							}
							tailpai.push({
								p:p,
								s:s,
								location:location
							});
						});
					}
					//3000ms为发牌动作执行时间间隔
					setTimeout(function(){

						TDKGameDao.setCurPlayer(rid,first_turn,function(err,cur_player){
							for(var i=0;i<users.length;i++){
								TDKGameDao.getPlayerLocal(rid,users[i],function(res,location){
									if(res!='null'){
										var param1 = {
											paixing:paixing[location-1],
											tailpai:tailpai,
											first:first_turn
										};
										TDKGameDao.updatePai(rid,paixing[location-1],location,function(err){
											console.log("TDKGameDao.updatePai......");
										});
										TDKGameDao.setIsGameNum(rid,location,2,function(err){
											console.log("paixing:"+JSON.stringify(param1));
											var tsid = channel.getMember(res)['sid'];
											channelService.pushMessageByUids('onShoupai', param1, [{
												uid: res,
												//sid: channel.getMember(res)['sid']
												sid: tsid
											}]);
											TDKGameDao.updateRoomStatus(rid,1,function(err){
												console.log("game_status change to 1(gaming)");
											});
											delayDao.addDelay(rid,13,function(){
												console.log("fapai:addDelay success");
											});
										});
									}
								});
							}
							/*设置当前发出多少张牌*/
							TDKGameDao.subPaiRound(rid,fapai_num,function(err,code){
								console.log("subPaiRound succ" + fapai_num);
							});
						});
					},300*users.length);
				});
			});
		}
	});
};

/**
 * 分牌逻辑，调用后返回牌型数组
 * */
TDKLogicRemote.getCardArr = function(rid,fapai_num,quchuPai){
	console.log('TDKLogicRemote.getCardArr' + rid + ' ' + fapai_num);
	var arr = [];
	var paiArr = [];//牌型数组
	var restPaiArr = [];//剩余的牌数组
	function convert (numArr){
		var param = {};
		for (var i = 0; i < numArr.length;i++){
			var p = parseInt(numArr[i]%13+2);
			var s = parseInt(numArr[i]/13+1);
			param["p" + (i + 1)] = p.toString();
			param["s" + (i + 1)] = s.toString();
			console.log('p:' + p + 's:' + s);
		}
		console.log("param"+JSON.stringify(param));
		return param;
	}

	for(var i=0;i<52;i++){
		arr[i]=0;
	}
	var j = 0;
	var total_num = fapai_num * 5;
	while (j<total_num){
		var temp=Math.floor(Math.random()*52);
		if((temp % 13) <= (quchuPai - 2)){
			continue;
		}
		if(arr[temp]==0){
			arr[temp]=1;
			j++;
		}
	}
	console.log("arr:"+arr);

	var k=0;
	var t=0;
	for(var i=0;i<arr.length;i++){
		if(arr[i]==1){
			paiArr[k]=i;
			k++;
		}
		if(arr[i]==0){
			restPaiArr[t]=i;
			t++;
		}
	}

	cache.put(rid,restPaiArr);//剩余的牌存到缓存当中，关键字是房间号

	console.log("paiArr:"+paiArr);

	var paixing = [];
	for(var i = 0;i < 5;i++){
		var param = new Array();
		for(var j = 0 ;j < fapai_num;j++){
			param.push(paiArr[total_num - 1]);
			total_num = total_num -1;
		}
		paixing[i] = convert(param);
	}
	console.log("paixing:"+JSON.stringify(paixing));

	return paixing;
};

/**
 * 玩家下注之后返回一张牌给他
 * @param rid
 * @param location
 * @param cb callback(err, paixing)
 */
TDKLogicRemote.fapai_next = function(rid,location,chip,channel,username){
	console.log('-----------enter TDKLogicRemote fapai_next--------');
	var restPaiArr = cache.get(rid);//剩余牌的数组
	TDKGameDao.getCurrentChip(rid,function(err,cur_chip){
		TDKGameDao.getQuChuPai(rid,function(err,quchuPai){
			/*如果出去的筹码小于当前的筹码 则有问题不可以获得牌*/
			if(cur_chip <= chip){
				var index = new_p = new_s = null;
				while(true){
					index = Math.floor(Math.random()*restPaiArr.length);
					if((restPaiArr[index] % 13) <= (quchuPai - 2)){
						continue;
					}
					new_p = parseInt(restPaiArr[index]%13+2);
					new_s = parseInt(restPaiArr[index]/13+1);
					break;
				}
				//删除抽取的牌
				restPaiArr[index]=restPaiArr[restPaiArr.length-1];
				restPaiArr.pop();
				cache.del(rid);
				cache.put(rid,restPaiArr);

				var newPai = {
					p:new_p,
					s:new_s
				};
				TDKGameDao.getPai(rid,location,function(err,paixing){
					for( i = 0;i < 5;i++){
						var p = paixing["p" + (i + 1)];
						if (!!p){
							continue;
						}
						paixing["p" + (i + 1)] = new_p.toString();
						paixing["s" + (i + 1)] = new_s.toString();
						break;
					}
					TDKGameDao.updatePai(rid,paixing,location,function(err,res){
						console.log("updatePai succ" + JSON.stringify(res))
					});
				});
				TDKGameDao.setCurrentChip(rid,chip,function(err,new_chip){
					TDKGameDao.getAllChip(rid,function(err,ex_allchip){
						var cur_allchip = ex_allchip + new_chip;
						var playerId_int = parseInt(username);
						TDKGameDao.setAllChip(rid,cur_allchip,function(err,all_chip){
							playerDao.subGold(playerId_int,cur_chip,function(err,my_gold){
								console.log('-------fapai_next subGold------');
								/*这一轮的牌还没有获取 下面获取*/
								/*判断当前的牌是否比上一轮的牌大*/
								TDKGameDao.getMaxPai(rid,function(err,max_pai){
									var prev = parseInt(max_pai.split("*")[0]);
									if(prev < new_p){
										TDKGameDao.setMaxPai(rid,parseInt(new_p) + "*" + location,function(err,max_pai){
											console.log("set max pai success" + max_pai);
										});
									}
								});
								/*开始判断这一轮是否完成*/
								TDKGameDao.getPaiRound(rid,function(err,paiRound){
									TDKGameDao.setIsGameNum(rid,location,paiRound,function(err){
										TDKGameDao.getIsGameNum(rid,function(err,isGmameNums){
											var flg = false;
											for(var i = 1;i < 6;i++){
												//说明已经是退出的玩家不参与比较
												if(isGmameNums[i] <= 1){
													continue;
												}
												/*如果小于paiRound 说明有玩家还没有获取牌*/
												if(isGmameNums[i] < paiRound){
													flg = true;
													break;
												}
											}
											/*所有的玩家都获取了牌了*/
											if(flg == false){
												TDKGameDao.getMaxPai(rid,function(err,max_pai){
													TDKGameDao.subPaiRound(rid,1,function(err,code){
														var cur_player = parseInt(max_pai.split("*")[1]);
														var param = {
															route:'onFapaiNext',
															tailpai:newPai,
															all_chip:cur_allchip,
															chip:chip,
															first:cur_player,
															my_gold:my_gold,
															location:location
														};
														channel.pushMessage(param);
														TDKGameDao.setMaxPai(rid,0 + "*" + 0,function(err,max_pai){
															TDKGameDao.setCurPlayer(rid,cur_player,function(err,curplayer){
																console.log("set max pai success" + max_pai);
															});
														});
													});
												});
											}else{
												TDKGameDao.setCurPlayer(rid,location,function(err,cur_player){
													TDKGameDao.nextCurPlayer(rid,function(err,new_loc){
														console.log("nextCurPlayer success");
														var param = {
															route:'onFapaiContinue',
															tailpai:newPai,
															chip:chip,
															all_chip:cur_allchip,
															my_gold:my_gold,
															location:location,
															first:new_loc
														};
														channel.pushMessage(param);
													});
												});
											}
										});
									});
								});
							});
						});
					});
				})
			}
		});
	});
};

/**
 * 比牌请求处理路由
 * */
TDKLogicRemote.bipai = function(app,uid,rid,location,channel,username,channelService){
	//比牌逻辑，返回结果
	var self = this;
	var users = channel.getMembers();
	console.log("--------users in fapai:"+users);
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	TDKGameDao.getCurrentChip(rid,function(err,cur_chip){
		var playerId_int = parseInt(username);
		playerDao.subGold(playerId_int,cur_chip,function(err,res){
			console.log('-------bipai subGold------' + cur_chip);
		});
		TDKGameDao.getAllChip(rid,function(err,ex_all_chip){
			var cur_all_chip = ex_all_chip+cur_chip;
			TDKGameDao.setAllChip(rid,cur_all_chip,function(err,res){
				TDKGameDao.getAllPai(rid,function(err,allPai){
					var paiClasses = new Array();
					paiClasses.push(TDKLogicRemote.classPai(allPai[0]));
					paiClasses.push(TDKLogicRemote.classPai(allPai[1]));
					paiClasses.push(TDKLogicRemote.classPai(allPai[2]));
					paiClasses.push(TDKLogicRemote.classPai(allPai[3]));
					paiClasses.push(TDKLogicRemote.classPai(allPai[4]));
					for(i = 0;i < 5;i++){
						var paiClass = paiClasses[i];
						console.log("location:" + (i + 1) + " paiclass:" + JSON.stringify(paiClass));
						if(paiClass[0] == -1){
							continue;
						}
						for(j = i + 1;j < 5;j++){
							var paiClass1 = paiClasses[j];
							console.log("location:" + (j + 1) + " paiclass:" + JSON.stringify(paiClass1));
							if(paiClass1[0] == -1){
								continue;
							}
							if(paiClass[0] == paiClass1[0]){
								if(paiClass[1] > paiClass1[1]){
									paiClass1[0] = -1;
								}else if(paiClass[1] < paiClass1[1]){
									paiClass[0] = -1;
								}
							}else if(paiClass[0] > paiClass1[0]){
								paiClass1[0] = -1;
							}else{
								paiClass[0] = -1;
							}
						}
					}
					//比牌结束 开始寻找最大的牌或者相同的牌的玩家位置
					var victorys = new Array();
					var win_num = 0;
					var final_winer = 0;
					for(i = 0;i < 5;i++){
						if(paiClasses[i][0] != -1){
							victorys.push(i + 1);
							win_num = win_num + 1;
							final_winer = i + 1;
						}
					}

					if(win_num > 1){
						TDKGameDao.setWinner(rid,victorys.join('*'),function(err,winners){
							var param = {
								route:'onEqual',
								winner:winners,
								all_chip:cur_all_chip,
								location:location,
								score:paiClasses
							};
							channel.pushMessage(param);
							TDKLogicRemote.restartEqual(app,uid,rid,channel,channelService,winners,username);
						});
					}else{
						TDKGameDao.setWinner(rid,final_winer,function(err,winners){
							var param = {
								route:'onBipai',
								winner:final_winer,
								all_chip:cur_all_chip,
								location:location,
								score:paiClasses
							};
							channel.pushMessage(param);
							TDKGameDao.setFirstFaPai(rid,final_winer,function(err,first_fapai){
								console.log("setFirstFaPai success.......");
								TDKLogicRemote.restartGame(app,uid,rid,channel,channelService,final_winer,username);
							});
						})
					};
				});
			});
		});
	});
};

/**
 * 获取房间玩家的信息
 * */
TDKLogicRemote.getPlayerInfo = function(uid,rid,send_from,location,channel){
	console.log("ZJHLogicRemote.getPlayerInfo......");
	var playerId = null;
	TDKGameDao.getRoomInfo(rid,function(err,roomInfo){
		if(roomInfo.location1 != "null" && location == 1){
			playerId = parseInt(roomInfo.location1.split('*')[0]);
		}else if(roomInfo.location2 != "null" && location == 2){
			playerId = parseInt(roomInfo.location2.split('*')[0]);
		}else if(roomInfo.location3 != "null" && location == 3){
			playerId = parseInt(roomInfo.location3.split('*')[0]);
		}else if(roomInfo.location4 != "null" && location == 4){
			playerId = parseInt(roomInfo.location4.split('*')[0]);
		}else if(roomInfo.location5 != "null" && location == 5){
			playerId = parseInt(roomInfo.location5.split('*')[0]);
		}
		playerDao.getPlayerByPlayerId(playerId,function(err,data){
			var param = {
				route:'onGetUinfo',
				player:data,
				send_from:send_from,
				location:location
			};
			channel.pushMessage(param);
		});
	});
};

TDKLogicRemote.getRoomPlayersInfo = function(uid,rid,location,channel,username,channelService){
	console.log("TDKLogicRemote.getRoomPlayersInfo......");
	var players = {};
	TDKGameDao.getRoomInfo(rid,function(err,roomInfo){
		async.parallel([
			function(callback){
				if(roomInfo.location1 != "null"){
					var playerId = parseInt(roomInfo.location1.split('*')[0]);
					playerDao.getPlayerByPlayerId(playerId,function(err,data){
						players["1"] = data;
						callback(null, data);
					});
				}else{
					callback(null, "null");
				}
			},
			function(callback){
				if(roomInfo.location2 != "null"){
					var playerId = parseInt(roomInfo.location2.split('*')[0]);
					playerDao.getPlayerByPlayerId(playerId,function(err,data){
						players["2"] = data;
						callback(null, data);
					});
				}else{
					callback(null, "null");
				}
			},
			function(callback){
				if(roomInfo.location3 != "null"){
					var playerId = parseInt(roomInfo.location3.split('*')[0]);
					playerDao.getPlayerByPlayerId(playerId,function(err,data){
						players["3"] = data;
						callback(null, data);
					});
				}else{
					callback(null, "null");
				}
			},
			function(callback){
				if(roomInfo.location4 != "null"){
					var playerId = parseInt(roomInfo.location4.split('*')[0]);
					playerDao.getPlayerByPlayerId(playerId,function(err,data){
						players["4"] = data;
						callback(null, data);
					});
				}else{
					callback(null, "null");
				}
			},
			function(callback){
				if(roomInfo.location5 != "null"){
					var playerId = parseInt(roomInfo.location5.split('*')[0]);
					playerDao.getPlayerByPlayerId(playerId,function(err,data){
						players["5"] = data;
						callback(null, data);
					});
				}else{
					callback(null, "null");
				}
			}
		],
		function(err, results){
			console.log("all players:" + JSON.stringify(players));
			var param = {
				route:'onInitPlayers',
				players:players,
				location:location
			};
			channel.pushMessage(param);
		});
	});
};

/**
 * 判断牌型
 * */
TDKLogicRemote.classPai = function(paiArray){
	if(paiArray == null || paiArray == 'null'){
		return [1,0];
	}
	var total_score = 0;
	score = [0,0,2,3,4,5,6,7,8,9,10,11,12,13,15];
	pai_num = new Array();
	for(i = 0;i < 5;i++){
		var p = paiArray['p' + (i + 1)];
		if(p != null){
			p_num = parseInt(p);
			total_score = total_score + score[p_num];
			pai_num.push(p_num);
		}else{
			pai_num.push(0);
		}
	}
	console.log('total_score:' + total_score + " paixing:" + JSON.stringify(paiArray));
	//寻找对子 加10分 3张一样的加30 4张一样的不加分
	for(i = 0;i < 5;i++){
		var t = pai_num[i];
		//如果等于0 则说明前面已经循环过他 放弃他
		if(t == 0){
			continue;
		}
		var t_equal = 0;
		var equal_num = 0;
		for(var j = i + 1;j < 5;j++){
			var tt = pai_num[j];
			if(t == tt){
				t_equal = t_equal + 1;
				equal_num = t;
				pai_num[j] = 0;
			}
		}
		if(t_equal == 3){
			console.log('equal_num:' + equal_num);
			return [3,equal_num];
		}
		if(t_equal == 2){
			total_score = total_score + 30;
		}
		if(t_equal == 1){
			total_score = total_score + 10;
		}
	}
	console.log('total_score:' + total_score + " paixing:" + JSON.stringify(paiArray));
	//return [1,100];
	return [1,total_score];
};

TDKLogicRemote.ready = function(rid,location,channel,username,channelService){
	/* setIsGameNum ready:1
	* 玩家准备之后开始执行下注动作并相应的减去下注的筹码
	*/
	var playerId = parseInt(username);
	TDKGameDao.setIsGameNum(rid,location,1,function(err,res){
		TDKGameDao.getRoomInfo(rid,function(err,res){
			TDKGameDao.getIsGameNum(rid,function(err,isGameNums){
				console.log("set game num 1 location:" + location);
				var param = {
					route:'onReady',
					location:location
				};
				channel.pushMessage(param);
				var ready_num = 0;
				for(var i = 1;i < 6;i++){
					if(isGameNums[i] == 1){
						ready_num = ready_num + 1;
					}
				}
				if(ready_num == res.player_num && ready_num >= 2){
					TDKLogicRemote.fapai(rid,channel,channelService);
				}
			});
		});
	});
};

/**
 * 跟牌
 * */
TDKLogicRemote.follow = function(rid,location,channel,username){
	TDKGameDao.getCurrentChip(rid,function(err,cur_chip){
		TDKGameDao.getAllChip(rid,function(err,ex_allchip){
			var cur_allchip = ex_allchip+cur_chip;
			var playerId_int = parseInt(username);
			playerDao.subGold(playerId_int,cur_chip,function(err,res){
				TDKGameDao.setAllChip(rid,cur_allchip,function(err,all_chip){
					console.log("follow setAllChip succ")
					TDKGameDao.setCurPlayer(rid,location,function(err,cur_player){
						var param = {
							route:'onFollow',
							user:username,
							my_gold:res,
							all_chip:cur_allchip
						};
						channel.pushMessage(param);
					});
					//改变玩家动作 进行下一个玩家动作
					TDKGameDao.nextCurPlayer(rid,function(err,new_loc){
						console.log("nextCurPlayer success");
						TDKLogicRemote.changeCurPlayer(rid,new_loc,channel);
						//出牌定时，重置定时器
						delayDao.removeDelay(rid,function(){
							console.log("follow:removeDelay success");
							delayDao.addDelay(rid,10,function(){
								console.log("follow:addDelay success");
							});
						});
					});
				});
			});
		});
	});
};

/**
 * 打点确定第一个收牌的位置
 * */
TDKLogicRemote.equal = function(uid,rid,msg,channel,username,channelService){
	var location = msg.location;
	var firstFaPai = msg.firstFaPai;
	TDKGameDao.setFirstFaPai(rid,firstFaPai,function(err,res){
		TDKGameDao.setWinner(rid,'null',function(err,winners){
			TDKGameDao.resetLight(rid,function(err,res){
				TDKLogicRemote.fapai(uid,rid,channel,channelService,function(){
					console.log('start fa pai......');
				});
			});
		});
	});
};
/**
 * add chip
 * */
TDKLogicRemote.add = function(rid,add_chip,location,channel,username){
	TDKGameDao.getCurrentChip(rid,function(err,ex_cur_chip){
		if(ex_cur_chip<add_chip){
			//减玩家金币，根据回调，成功以后才能进行下面的
			TDKGameDao.setCurrentChip(rid,add_chip,function(err,new_chip){
				var chip = add_chip;
				var playerId_int = parseInt(username);
				playerDao.subGold(playerId_int,chip,function(err,my_gold){
					TDKGameDao.getAllChip(rid,function(err,ex_allchip){
						var cur_allchip = ex_allchip+chip;
						TDKGameDao.setAllChip(rid,cur_allchip,function(err,all_chip){
							TDKGameDao.setCurPlayer(rid,location,function(err,cur_player){
								var param = {
									route:'onAddChip',
									user:username,
									my_gold:my_gold,
									current_chip:add_chip,
									all_chip:cur_allchip
								};
								channel.pushMessage(param);
							});
						});
					});
				});
			});
			TDKGameDao.nextCurPlayer(rid,function(err,new_loc){
				console.log("nextCurPlayer success");
				TDKLogicRemote.changeCurPlayer(rid,new_loc,channel);
				//出牌定时，重置定时器
				delayDao.removeDelay(rid,function(){
					console.log("add_chip:removeDelay success");
					delayDao.addDelay(rid,10,function(){
						console.log("add_chip:addDelay success");
					});
				});
			});
		}
	});
};

/**
 * open(kan pai)
 * */
TDKLogicRemote.open = function(rid,location,channel,username){
	TDKGameDao.setOpenMark(rid,location,function(err){
		var param = {
			route:'onOpen',
			user:username
		};
		channel.pushMessage(param);
		delayDao.removeDelay(rid,function(){
			delayDao.addDelay(rid,10,function(){
				console.log("TDKLogicRemote:open addDelay success");
			});
		});
	});
};

/**
 * throw
 * param:rid,msg.location,channel,username,channelService
 * */
TDKLogicRemote.throw = function(app,uid,rid,location,channel,username,channelService){
	TDKGameDao.cleanOpenMark(rid,location,function(err){
		TDKGameDao.getPaiRound(rid,function(err,paiRound){
			TDKGameDao.getIsGameNum(rid,function(err,isGmameNums){
				var flg = true;
				for(var i = 1;i < 6;i++){
					//说明已经是退出的玩家不参与比较
					if(isGmameNums[i] <= 1){
						continue;
					}
					if(i == location){
						continue;
					}
					/*如果小于paiRound 说明有玩家还没有获取牌*/
					if(isGmameNums[i] < paiRound){
						flg = false;
						break;
					}
				}
				TDKGameDao.setIsGameNum(rid,location,0,function(err){
					var param = {
						route:'onThrow',
						flag:flg,
						user:username
					};
					channel.pushMessage(param);

					/*判断还有多少玩家在进行游戏*/
					TDKGameDao.getIsGameNum(rid,function(err,isGameNumArr){
						var sum = 0;
						var game_winner = 0;
						for(var i = 1;i < 6;i++){
							if(isGameNumArr[i] > 1){
								sum = sum + 1;
								game_winner = i;
							}
						}
						if(sum<=1){
							//重新开始
							TDKGameDao.setFirstFaPai(rid,game_winner,function(err,first_fapai){
								TDKLogicRemote.restartGame(app,uid,rid,channel,channelService,game_winner,username);
							});
						}else{
							TDKGameDao.getCurPlayer(rid,function(err,cur_player){
								console.log("get cur player :" + cur_player + " location:" + location);
								if(cur_player==location){
									//放弃牌的是最后一个玩家 此时需要定位到 最大牌的玩家
									if(flg == true){
										TDKGameDao.subPaiRound(rid,1,function(err,code){
											TDKGameDao.getMaxPai(rid,function(err,max_pai){
												var new_loc = parseInt(max_pai.split("*")[1]);
												TDKLogicRemote.changeCurPlayer(rid,new_loc,channel);
												delayDao.removeDelay(rid,function(){
													delayDao.addDelay(rid,10,function(){
														console.log("throw:addDelay success");
													});
												});
											});
										});
									}else{
										//更改当前出牌玩家
										TDKGameDao.nextCurPlayer(rid,function(err,new_loc){
											console.log("nextCurPlayer success");
											TDKLogicRemote.changeCurPlayer(rid,new_loc,channel);
											//出牌定时，重置定时器
											delayDao.removeDelay(rid,function(){
												console.log("throw:removeDelay success");
												delayDao.addDelay(rid,10,function(){
													console.log("throw:addDelay success");
												});
											});
										});
									}
								}
							});
						}
					});
				});
			});
		});
	});
};

/**
 * 广播玩家轮换信息
 * */
TDKLogicRemote.changeCurPlayer = function(rid,location,channel){
	var param = {
		route:'onChangePlayer',
		location:location
	};
	channel.pushMessage(param);
};

TDKLogicRemote.restartEqual = function(app,uid,rid,channel,channelService,game_winner,playerId){
	//清空上次发牌的剩余牌cache
	var resetPai = cache.get(rid);
	if(!!resetPai){
		cache.del(rid);
	}
	//重新开始
	delayDao.removeDelay(rid,function(){
		console.log("throw:removeDelay success");
		TDKGameDao.getRoomInfo(rid,function(err,roomInfo){
			var endPai = {
				route:'onEndPai',
				location1:roomInfo.pai1,
				location2:roomInfo.pai2,
				location3:roomInfo.pai3,
				location4:roomInfo.pai4,
				location5:roomInfo.pai5
			};
			channel.pushMessage(endPai);
			setTimeout(function(){
				//给和牌的玩家一个发张牌 确认谁先开始收牌
				var winners = game_winner.split("*");
				var pais = new Array();
				var suits = new Array();
				for(var i = 0;i < winners.length;i++){
					while(true){
						var flg = true;
						var temp = Math.floor(Math.random()*52);
						var p = parseInt(temp % 13 + 2);
						var s = parseInt(temp / 13 + 1);
						for(var j = 0;j < pais.length;j++){
							if(pais[j] == p){
								flg = false;
								break;
							}
						}
						if(flg = true){
							pais.push(p);
							suits.push(s);
							break;
						}
					}
				}
				//确定最大的一张牌
				var max_p = location = 0;
				var paixings = new Array();
				for(var i = 0;i < winners.length;i++){
					var paixing = {
						"p":pais[i],
						"s":suits[i]
					};
					if(pais[i] > max_p){
						location = parseInt(winners[i]);
						max_p = pais[i];
					}
					paixings.push(paixing);
				}
				var onEqualPai = {
					route:'onEqualPai',
					winner:winners,
					location:location,
					pai_xing:paixings
				};
				channel.pushMessage(onEqualPai);
				//轻度清楚数据 保留 一些数据

				TDKGameDao.setFirstFaPai(rid,location,function(err,first_fapai){
					TDKGameDao.resetLight(rid,function(err){
						
					});
				});
			},2000);
		});
	});
};

/**
 * 比牌或者最后一位玩家弃牌以后，重新开始牌局游戏
 */
TDKLogicRemote.restartGame = function(app,uid,rid,channel,channelService,game_winner,playerId){
	//清空上次发牌的剩余牌cache
	var resetPai = cache.get(rid);
	if(!!resetPai){
		cache.del(rid);
	}
	//重新开始
	TDKGameDao.getAllChip(rid,function(err,all_chip){
		TDKGameDao.setWinner(rid,game_winner.toString(),function(err,winners){
			var param = {
				route:'onEnd',
				all_chip:all_chip,
				winner:game_winner
			};
			channel.pushMessage(param);
			//游戏结束，取消定时器
			delayDao.removeDelay(rid,function(){
				console.log("throw:removeDelay success");
			});
			setTimeout(function(){
				TDKGameDao.getRoomInfo(rid,function(err,roomInfo){
					var playerId;
					switch (game_winner){
						case 1:
							playerId = roomInfo.location1.split('*')[0];
							break;
						case 2:
							playerId = roomInfo.location2.split('*')[0];
							break;
						case 3:
							playerId = roomInfo.location3.split('*')[0];
						break;
						case 4:
							playerId = roomInfo.location4.split('*')[0];
							break;
						case 5:
							playerId = roomInfo.location5.split('*')[0];
							break;
						default:
							break;
					}
					var endPai = {
						route:'onEndPai',
						location1:roomInfo.pai1,
						location2:roomInfo.pai2,
						location3:roomInfo.pai3,
						location4:roomInfo.pai4,
						location5:roomInfo.pai5
					};
					channel.pushMessage(endPai);
					//减玩家金币，根据回调，成功以后才能进行下面的(这里是增加胜利者金币)
					TDKGameDao.getAllChip(rid,function(err,all_chip){
						playerDao.setGold(playerId,all_chip,function(err,res){
							console.log('-------restart subGold------');
							TDKGameDao.resetData(rid,function(err){
							});
						});
					});
				});
			},10);
		});
	});
};


