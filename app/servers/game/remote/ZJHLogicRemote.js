/**
 * Created by wuningjian on 3/3/16.
 */

var ZJHGameDao   = require('../../../dao/ZJHGameDao');
var playerDao = require('../../../dao/playerDao');
var delayDao  = require('../../../dao/delayDao');
var pomelo	= require('pomelo');
var async	 = require('async');
var cache	 = require('memory-cache');

var ZJHLogicRemote = module.exports;

/**
 * fa pai
 * */
ZJHLogicRemote.fapai = function(rid,channel,channelService){
	////如果name不存在且flag为true，则创建channel

	var users = channel.getMembers();
	console.log("--------users in fapai:"+users);
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}

	ZJHGameDao.getRoomInfo(rid,function(err,roomInfo){
		if(roomInfo.round >= roomInfo.total_round){
			ZJHGameDao.getStartGolds(rid,function(err,golds){
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
			ZJHGameDao.subRound(rid,1,function(err,round){
				//大于两人才执行发牌
				ZJHGameDao.getAllChip(rid,function(err,ex_all_chip){
					ZJHGameDao.getCurrentChip(rid,function(err,cur_chip){
						var new_chip = ex_all_chip + cur_chip * users.length;
						ZJHGameDao.setAllChip(rid,new_chip,function(err,res){
							var first_fapai = users[Math.floor(Math.random()*users.length)];
							ZJHGameDao.getPlayerLocal(rid,first_fapai,function(res,location){
								ZJHGameDao.getLocalPlayer(rid,roomInfo.first_fapai,function(err,linfo,plocation){
									var param = {
										route:'onFapai',//接受发牌消息
										msg:"fapaile!",
										round:round,
										all_chip:new_chip,
										location:location
									};
									if(plocation != null && linfo != null && linfo != 'null'){
										param["location"] = roomInfo.first_fapai;
									}
									channel.pushMessage(param);
									ZJHGameDao.setCurPlayer(rid,param["location"],function(err,curPlayer){
										console.log("set current player:" + curPlayer);
										ZJHGameDao.updateRoomStatus(rid,1,function(err){
											console.log("game_status change to 1(gaming)");
										});
									});
								});
							});
						});
					});
				});
			});
			//3000ms为发牌动作执行时间间隔
			setTimeout(function(){
				//P:牌数字2-14
				//S:花色 1方块 2梅花 3红桃 4黑桃
				//这里需要完成发牌逻辑

				var paixing = ZJHLogicRemote.getCardArr(rid);
				for(var i = 0;i < users.length;i++){
					ZJHGameDao.getLocalPlayer(rid,i + 1,function(err,res,location){
						ZJHGameDao.getIsGameNum(rid,function(err,isGameNums){
							if(res!='null'){
								if(isGameNums[location] == 1){
									var param1 = {
										paixing:paixing[location-1]
									};
									var playerId = parseInt(res.split("*")[0]);
									ZJHGameDao.updatePai(rid,paixing[location-1],location,function(err){
										ZJHGameDao.setIsGameNum(rid,location,2,function(err,res){
											console.log("set setIsGameNum 2 location:" + location);
										});
									});
									ZJHGameDao.getCurrentChip(rid,function(err,cur_chip){
										playerDao.subGold(playerId,cur_chip,function(err,res){
											console.log("subGold:" + cur_chip + " playerId:" + playerId);
										});
									});
									var tsid = channel.getMember(res)['sid'];
									channelService.pushMessageByUids('onShoupai', param1, [{
										uid: res,
										sid: tsid
									}]);
									delayDao.addDelay(rid,13,function(){
										console.log("fapai:addDelay success");
									});
								}
							}
						});
					});
				}
			},600*users.length);
		}
	});
};

ZJHLogicRemote.ready = function(rid,location,channel,username,channelService){
	/* setIsGameNum ready:1
	 * 玩家准备之后开始执行下注动作并相应的减去下注的筹码
	 */
	var playerId = parseInt(username);
	ZJHGameDao.setIsGameNum(rid,location,1,function(err,res){
		ZJHGameDao.getRoomInfo(rid,function(err,res){
			ZJHGameDao.getIsGameNum(rid,function(err,isGameNums){
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
					ZJHLogicRemote.fapai(rid,channel,channelService);
				}
			});
		});
	});
}

/**
 * 分牌逻辑，调用后返回牌型数组
 * */
ZJHLogicRemote.getCardArr = function(rid){
	var arr = [];
	var paiArr = [];//牌型数组
	var restPaiArr = [];//剩余的牌数组
	function convert (numArr){
		var p1 = parseInt(numArr[0]%13+2);
		var s1 = parseInt(numArr[0]/13+1);
		var p2 = parseInt(numArr[1]%13+2);
		var s2 = parseInt(numArr[1]/13+1);
		var p3 = parseInt(numArr[2]%13+2);
		var s3 = parseInt(numArr[2]/13+1);

		console.log('p1'+p1);
		console.log('s1'+s1);
		console.log('p2'+p2);
		console.log('s2'+s2);
		console.log('p3'+p3);
		console.log('s3'+s3);

		if(p1<p2){
			var temp = p1;
			var temp1 = s1;
			p1 = p2;
			s1 = s2;
			p2 = temp;
			s2 = temp1;
		}
		if(p2<p3){
			var temp = p2;
			var temp1 = s2;
			p2 = p3;
			s2 = s3;
			p3 = temp;
			s3 = temp1;
		}
		if(p1<p2){
			var temp = p1;
			var temp1 = s1;
			p1 = p2;
			s1 = s2;
			p2 = temp;
			s2 = temp1;
		}

		var param = {
			p1:p1.toString(),
			p2:p2.toString(),
			p3:p3.toString(),
			s1:s1.toString(),
			s2:s2.toString(),
			s3:s3.toString()
		};
		console.log("param"+JSON.stringify(param));
		return param;
	}

	for(var i=0;i<52;i++){
		arr[i]=0;
	}
	var j = 0;
	while (j<15){
		var temp=Math.floor(Math.random()*52);
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

	paixing[0] = convert([paiArr[4],paiArr[5],paiArr[10]]);
	paixing[1] = convert([paiArr[3],paiArr[6],paiArr[11]]);
	paixing[2] = convert([paiArr[2],paiArr[7],paiArr[12]]);
	paixing[3] = convert([paiArr[1],paiArr[8],paiArr[13]]);
	paixing[4] = convert([paiArr[0],paiArr[9],paiArr[14]]);

	console.log("paixing:"+paixing);

	//var tempTest = 'wuningjian test';

	//cache.put('test',tempTest);

	return paixing;
};

/**
 * 比牌请求处理路由
 * */
ZJHLogicRemote.bipai = function(uid,rid,location1,location2,channel,playerId,channelService){
	//比牌逻辑，返回结果
	var self = this;
	ZJHGameDao.getCurrentChip(rid,function(err,cur_chip){
		ZJHGameDao.getOpenMark(rid,location1,function(err,open_mark){
			ZJHGameDao.getAllChip(rid,function(err,ex_allchip){
				var cur_allchip = ex_allchip + cur_chip;
				var playerId_int = parseInt(playerId);
				if(open_mark == 1){
					cur_allchip = ex_allchip + cur_chip * 2;
					playerDao.subGold(playerId_int,cur_chip * 2,function(err,res){
						console.log('-------follow subGold ------' + res);
					});
				}else{
					playerDao.subGold(playerId_int,cur_chip,function(err,res){
						console.log('-------follow subGold ------' + res);
					});
				}
				ZJHGameDao.setAllChip(rid,cur_allchip,function(err,res){
					console.log("setAllChip:" + cur_allchip);
				});
				ZJHGameDao.getPai(rid,location1,function(err,pai1){
					ZJHGameDao.getPai(rid,location2,function(err,pai2){
						//bipai logic
						//比较牌1与牌2的大小逻辑
						var paixing1 = self.sortPai(pai1);
						var paixing2 = self.sortPai(pai2);

						console.log("paixing1:"+JSON.stringify(paixing1));
						console.log("paixing2:"+JSON.stringify(paixing2));

						var paiClass1 = self.classPai(paixing1);
						var paiClass2 = self.classPai(paixing2);
						var winner = -1;
						if(paiClass1>paiClass2){
							winner = location1;
						}else if(paiClass1<paiClass2){
							winner = location2;
						}else{
							//牌型相同情况
							if(paiClass1==5){
								//都是豹子
								if(paixing1[0]>paixing2[0]){
									winner = location1;
								}else{
									winner = location2;
								}
							}else if(paiClass1==4){
								if(paixing1[0]>paixing2[0]){
									//顺子金花1点数大于顺子金花2
									winner = location1;
								}else{
									//顺子金花1点数小于顺子金花2
									winner = location2;
								}
							}else if(paiClass1 == 3){
								//金花1，2都不是顺子金花
								if(paixing1[0]>paixing2[0]){
									//金花1点数大于顺子金花2
									winner = location1;
								}else if(paixing1[0]<paixing2[0]){
									//金花1点数小于顺子金花2
									winner = location2;
								}else{
									//金花1点数等于金花2
									if(paixing1[1]>paixing2[1]){
										winner = location1;
									}else if(paixing1[1]<paixing2[1]){
										winner = location2;
									}else{
										if(paixing1[2]>paixing2[2]){
											winner = location1;
										}else{
											winner = location2;
										}
									}
								}
							}else if(paiClass1 == 2){
								//都是顺子
								if(paixing1[0]>paixing2[0]){
									winner = location1;
								}else{
									winner = location2;
								}
							}else if(paiClass1==1){
								//都是对子
								if(paixing1[1]>paixing2[1]){
									winner = location1;
								}else if(paixing1[1]<paixing2[1]){
									winner = location2;
								//对子数相等 比单牌
								}else{
									//单张是第3张
									if(paixing1[0] == paixing1[1]){
										if(paixing2[0] == paixing2[1]){
											if(paixing1[2] > paixing2[2]){
												winner = location1;
											}else{
												winner = location2;
											}
										}else{
											if(paixing1[2] > paixing2[0]){
												winner = location1;
											}else{
												winner = location2;
											}
										}
									}else{
										if(paixing2[0] == paixing2[1]){
											if(paixing1[0] > paixing2[2]){
												winner = location1;
											}else{
												winner = location2;
											}
										}else{
											if(paixing1[0] > paixing2[0]){
												winner = location1;
											}else{
												winner = location2;
											}
										}
									}
								}
							}else {
								//都是单牌
								if(paixing1[0]>paixing2[0]){
									winner = location1;
								}else if(paixing1[0]<paixing2[0]){
									winner = location2;
								}else {
									if(paixing1[1]>paixing2[1]){
										winner = location1;
									}else if(paixing1[1]<paixing2[1]){
										winner = location2;
									}else{
										if(paixing1[2]>paixing2[2]){
											winner = location1;
										}else {
											winner = location2;
										}
									}
								}
							}
						}
						if(winner == location1){
							ZJHGameDao.setIsGameNum(rid,location2,0,function(err){
								ZJHGameDao.cleanOpenMark(rid,location2,function(err){
									console.log("setIsGameNum: 0 location:" + location1);
								});
							});
						}else if(winner == location2){
							ZJHGameDao.setIsGameNum(rid,location1,0,function(err){
								ZJHGameDao.cleanOpenMark(rid,location1,function(err){
									console.log("setIsGameNum: 0 location:" + location2);
								});
							});
						}else{
							channel.pushMessage({
								route:'onBipaiError',
								error:"no found the winner"
							});
						}
						playerDao.getGold(playerId_int,function(err,gold){
							var param = {
								route:'onBipai',
								my_gold:gold,
								position1:location1,
								position2:location2,
								all_chip:cur_allchip,
								winner:winner
							};
							channel.pushMessage(param);
						});
						setTimeout(function(){
							ZJHGameDao.getIsGameNum(rid,function(err,isGameNumArr){
								var sum = 0;
								var game_winner;
								for(var i = 1;i < 6;i++){
									if(isGameNumArr[i] == 2){
										sum = sum + 1;
										game_winner = i;
									}
								}
								if(sum <= 1){
									ZJHGameDao.getNextPlayer(rid,game_winner,function(err,nextPlayer){
										ZJHGameDao.setFirstFaPai(rid,nextPlayer,function(err,firstFapai){
											//重新开始
											ZJHLogicRemote.restartGame(self.app,uid,rid,channel,channelService,game_winner);
										});
									});
								}else{
									ZJHGameDao.nextCurPlayer(rid,function(err,new_loc){
										//出牌定时，重置定时器
										console.log("nextCurPlayer success" + new_loc);
										ZJHLogicRemote.changeCurPlayer(rid,new_loc,channel);
										delayDao.removeDelay(rid,function(){
											console.log("bipai:removeDelay success");
											delayDao.addDelay(rid,10,function(){
												console.log("bipai:addDelay success");
											});
										});
									});
								}
							});
						},5000);
					});
				});
			});
		});
	});
};

/**
 * 输入牌json进行预处理排序（点数以及花色按从大到小排序）
 * */
ZJHLogicRemote.sortPai = function(paixing1){
	//paixing eg:{p1:"2",p2:"3",p3:"4",s1:"1",s2:"2",s3:"3"}
	var pai1_num1 = parseInt(paixing1.p1);
	var pai1_num2 = parseInt(paixing1.p2);
	var pai1_num3 = parseInt(paixing1.p3);
	var pai1_num4 = parseInt(paixing1.s1);
	var pai1_num5 = parseInt(paixing1.s2);
	var pai1_num6 = parseInt(paixing1.s3);

	console.log("before paixu:" +pai1_num1+" "+pai1_num2+" "+pai1_num3);

	//big -> small
	var sortABC = function(pai_num1,pai_num2,pai_num3){
		if(pai_num1<pai_num2){
			var temp = pai_num1;
			pai_num1 = pai_num2;
			pai_num2 = temp;
		}
		if(pai_num2<pai_num3){
			var temp = pai_num2;
			pai_num2 = pai_num3;
			pai_num3 = temp;
		}
		if(pai_num1<pai_num2){
			var temp = pai_num1;
			pai_num1 = pai_num2;
			pai_num2 = temp;
		}
		return [pai_num1,pai_num2,pai_num3];
	};

	var tempA = sortABC(pai1_num1,pai1_num2,pai1_num3);
	var tempB = sortABC(pai1_num4,pai1_num5,pai1_num6);

	tempA = tempA.concat(tempB);

	return tempA;
};

/**
 * 获取房间玩家的信息
 * */
ZJHLogicRemote.getPlayerInfo = function(uid,rid,send_from,location,channel){
	console.log("ZJHLogicRemote.getPlayerInfo......");
	var playerId = null;
	ZJHGameDao.getRoomInfo(rid,function(err,roomInfo){
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


/**
 * 判断牌型（5豹子 4同花顺 3金花 2顺子 1对子 0单牌）
 * 输入参数为经过排序函数sortPai处理以后的牌型数组
 * */
ZJHLogicRemote.classPai = function(paiArray){
	var kind = 0;
	if(paiArray[0]==paiArray[1]&&paiArray[1]==paiArray[2]){
		kind = 5;
	}else if(paiArray[3]==paiArray[4]&&paiArray[4]==paiArray[5]){
		if((paiArray[0]-paiArray[1])==1&&(paiArray[1]-paiArray[2])==1){
			kind = 4;
		}else{
			kind = 3;
		}
	}else if((paiArray[0]-paiArray[1])==1&&(paiArray[1]-paiArray[2])==1){
		kind = 2;
	}else if(paiArray[0]==paiArray[1]||paiArray[1]==paiArray[2]){
		kind = 1;
	}else {
		//console.log("hehehehehehehe");
		kind = 0;
	}
	return kind;
};

/**
 * 跟牌
 * */
ZJHLogicRemote.follow = function(rid,location,channel,user_id){
	console.log("go into follow user_id:" + user_id);
	//1表示已经看牌，0表示没有看牌
	ZJHGameDao.getCurrentChip(rid,function(err,cur_chip){
		ZJHGameDao.getAllChip(rid,function(err,ex_allchip){
			ZJHGameDao.getOpenMark(rid,location,function(err,mark){
				var chip = cur_chip;
				if(mark == 1){
					chip = chip * 2;
				}
				var cur_allchip = ex_allchip + chip;
				ZJHGameDao.setAllChip(rid,cur_allchip,function(err,all_chip){
					var player_id = parseInt(user_id);
					playerDao.subGold(player_id,chip,function(err,res){
						console.log('-------follow subGold :' + chip + " mygold:" + res);
						if(res != null){
							var param = {
								route:'onFollow',
								my_gold:res,
								player_id:player_id,
								all_chip:cur_allchip
							};
							channel.pushMessage(param);
						}
					});
				});
			});
		});

		ZJHGameDao.nextCurPlayer(rid,function(err,new_loc){
			console.log("nextCurPlayer success");
			ZJHLogicRemote.changeCurPlayer(rid,new_loc,channel);
			//出牌定时，重置定时器
			delayDao.removeDelay(rid,function(){
				console.log("follow:removeDelay success");
				delayDao.addDelay(rid,10,function(){
					console.log("follow:addDelay success");
				});
			});
		});

	});
};

/**
 * add chip
 * */
ZJHLogicRemote.add = function(rid,add_chip,location,channel,username){
	ZJHGameDao.getCurrentChip(rid,function(err,ex_cur_chip){
		//减玩家金币，根据回调，成功以后才能进行下面的
		ZJHGameDao.setCurrentChip(rid,add_chip,function(err,new_chip){
			ZJHGameDao.getOpenMark(rid,location,function(err,mark){
				var chip = add_chip;
				if(mark==1){
					chip = chip*2;
				}
				var playerId_int = parseInt(username);
				playerDao.subGold(playerId_int,chip,function(err,res){
					if(res != null){
						console.log('-------add chip subGold:' + chip + ' my_glod:' + res);
						ZJHGameDao.getAllChip(rid,function(err,ex_allchip){
							var cur_allchip = ex_allchip+chip;
							ZJHGameDao.setAllChip(rid,cur_allchip,function(err,all_chip){
								var param = {
									route:'onAddChip',
									player_id:playerId_int,
									my_gold:res,
									current_chip:new_chip,
									all_chip:cur_allchip
								};
								channel.pushMessage(param);
							});
						});
					}
				});
			});
		});
		ZJHGameDao.nextCurPlayer(rid,function(err,new_loc){
			console.log("nextCurPlayer success");
			ZJHLogicRemote.changeCurPlayer(rid,new_loc,channel);
			//出牌定时，重置定时器
			delayDao.removeDelay(rid,function(){
				console.log("add_chip:removeDelay success");
				delayDao.addDelay(rid,10,function(){
					console.log("add_chip:addDelay success");
				});
			});
		});
	});
};

/**
 * open(kan pai)
 * */
ZJHLogicRemote.open = function(rid,location,channel,username){
	ZJHGameDao.setOpenMark(rid,location,function(err){
		var param = {
			route:'onOpen',
			user:username
		};
		channel.pushMessage(param);
		delayDao.removeDelay(rid,function(){
			delayDao.addDelay(rid,10,function(){
				console.log("ZJHLogicRemote:open addDelay success");
			});
		});
	});
};

/**
 * throw
 * param:rid,msg.location,channel,username,channelService
 * */
ZJHLogicRemote.throw = function(app,uid,rid,location,channel,username,channelService){
	ZJHGameDao.setIsGameNum(rid,location,0,function(err){
		var param = {
			route:'onThrow',
			user:username
		};
		channel.pushMessage(param);
		ZJHGameDao.cleanOpenMark(rid,location,function(err){
			/*判断是否就剩下一个玩家 决定是否重新开始游戏*/
			ZJHGameDao.getIsGameNum(rid,function(err,isGameNumArr){
				var sum = 0;
				var game_winner;
				for(var i=1;i<6;i++){
					if(isGameNumArr[i] == 2){
						sum = sum + 1;
						game_winner = i;
					}
				}
				if(sum <= 1){
					//重新开始
					ZJHGameDao.getNextPlayer(rid,game_winner,function(err,nextPlayer){
						ZJHGameDao.setFirstFaPai(rid,nextPlayer,function(err,firstFapai){
							//重新开始
							ZJHLogicRemote.restartGame(app,uid,rid,channel,channelService,game_winner);
						});
					});
				}else{
					ZJHGameDao.getCurPlayer(rid,function(err,cur_player){
						if(cur_player == location){
							//更改当前出牌玩家
							ZJHGameDao.nextCurPlayer(rid,function(err,new_loc){
								console.log("nextCurPlayer success");
								ZJHLogicRemote.changeCurPlayer(rid,new_loc,channel);
								//出牌定时，重置定时器
								delayDao.removeDelay(rid,function(){
									console.log("throw:removeDelay success");
									delayDao.addDelay(rid,10,function(){});
								});
							});
						}
					});
				}
			});
		});
	});
};

/**
 * 广播玩家轮换信息
 * */
ZJHLogicRemote.changeCurPlayer = function(rid,location,channel){
	var param = {
		route:'onChangePlayer',
		location:location
	};
	channel.pushMessage(param);
};

/**
 * 比牌或者最后一位玩家弃牌以后，重新开始牌局游戏
 * @param app
 * @param uid
 * @param rid
 * @param channel
 * @param channelService
 * @param game_winner 上一局胜利玩家
 */
ZJHLogicRemote.restartGame = function(app,uid,rid,channel,channelService,game_winner){
	//清空上次发牌的剩余牌cache
	var resetPai = cache.get(rid);
	if(!!resetPai){
		cache.del(rid);
	}
	//重新开始
	ZJHGameDao.getAllChip(rid,function(err,all_chip){
		ZJHGameDao.setWinner(rid,game_winner.toString(),function(err,winners){
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
				ZJHGameDao.getRoomStatus(rid,function(err,roomStatus){
					ZJHGameDao.getRoomInfo(rid,function(err,roomInfo){
						var playerId;
						var pai_type;
						var paixing = [];
						switch (game_winner){
							case 1:
								paixing = ZJHLogicRemote.sortPai(JSON.parse(roomInfo.pai1));
								pai_type = ZJHLogicRemote.classPai(paixing);
								playerId = roomInfo.location1.split('*')[0];
								break;
							case 2:
								paixing = ZJHLogicRemote.sortPai(JSON.parse(roomInfo.pai2));
								pai_type = ZJHLogicRemote.classPai(paixing);
								playerId = roomInfo.location2.split('*')[0];
								break;
							case 3:
								paixing = ZJHLogicRemote.sortPai(JSON.parse(roomInfo.pai3));
								pai_type = ZJHLogicRemote.classPai(paixing);
								playerId = roomInfo.location3.split('*')[0];
								break;
							case 4:
								paixing = ZJHLogicRemote.sortPai(JSON.parse(roomInfo.pai4));
								pai_type = ZJHLogicRemote.classPai(paixing);
								playerId = roomInfo.location4.split('*')[0];
								break;
							case 5:
								paixing = ZJHLogicRemote.sortPai(JSON.parse(roomInfo.pai5));
								pai_type = ZJHLogicRemote.classPai(paixing);
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
						ZJHGameDao.getAllChip(rid,function(err,all_chip){
							playerDao.setGold(playerId,all_chip,function(err,res){
								ZJHGameDao.resetData(rid,function(err){
									console.log("restart resetData ......");
								});
							});
						});
					});
				});
			},10);
		});
	});
};

