/**
 * Created by wuningjian on 3/3/16.
 */

var ZHQGameDao   = require('../../../dao/ZHQGameDao');
var playerDao = require('../../../dao/playerDao');
var delayDao  = require('../../../dao/delayDao');
var pomelo    = require('pomelo');
var async     = require('async');
var cache     = require('memory-cache');

var ZHQLogicRemote = module.exports;

ZHQLogicRemote.fapai = function(rid,channel,channelService){
	//如果name不存在且flag为true，则创建channel
	var users = channel.getMembers();
	console.log("--------users in fapai:"+users);
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}

	ZHQGameDao.getRoomInfo(rid,function(err,roomInfo){
		if(roomInfo.round >= roomInfo.total_round){
			ZHQGameDao.getStartGolds(rid,function(err,golds){
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
			ZHQGameDao.subRound(rid,1,function(err,round){
				//如果支持天宣 则开始发6张牌 等待是否有人天宣
				var first_fapai = roomInfo.first_fapai;
				var param = {
					route:'onFaPai',
					msg:'fapaile!',
					round:round,
					chip:roomInfo.basic_chip,
					location:first_fapai
				};
				if(roomInfo.first_fapai == 0){
					param["location"] = 1;
				}
				channel.pushMessage(param);
				ZHQGameDao.setCurPlayer(rid,param["location"],function(err,curPlayer){
					console.log("set current player:" + curPlayer);
					ZHQGameDao.setCurrentChip(rid,roomInfo.basic_chip,function(err,res){
						console.log("set current chip:" + roomInfo.basic_chip);
					});
				});

				//3000ms为发牌动作执行时间间隔
				setTimeout(function(){
					//P:牌数字2-14
					//S:花色 1方块 2梅花 3红桃 4黑桃
					//这里需要完成发牌逻辑

					var paixing = ZHQLogicRemote.getCardArr(users.length);
					//寻找拿有黑色A的玩家 记录下来 如果有人宣的话 方便显示
					var heiALocations = new Array();
					var hong4Local = -1;
					for(var i = 0;i < roomInfo.all_player_num;i++){
						var onepai = paixing[i];
						for(var j = 0;j < onepai["p"].length;j++){
							var rank = onepai["p"][j];
							var suit = onepai["s"][j];
							if(rank == 4 && suit == 3){
								hong4Local = i + 1;
							}
							if(rank == 14 && suit == 4){
								heiALocations.push(i + 1);
							}else if(rank == 14 && suit == 2){
								heiALocations.push(i + 1);
							}
						}
					}
					ZHQGameDao.setHeiA(rid,heiALocations,function(err,res){
						console.log("set hei a succ " + JSON.stringify(heiALocations));
						if(hong4Local != -1){
							ZHQGameDao.setCurPlayer(rid,hong4Local,function(err,curPlayer){
								console.log("set current player:" + curPlayer);
							});
						}
					});
					if(roomInfo.tian_xuan == 1){
						for(var i = 0;i < users.length;i++){
                			ZHQGameDao.getLocalPlayer(rid,i + 1,function(err,res,location){
                    			if(res!='null'){
                    				var onePai = {
										"p":[],
										"s":[]
									};
                    				var paip = paixing[location-1];
                    				for(var j = 0;j < 6;j++){
                    					onePai["p"].push(paip["p"][j]);
										onePai["s"].push(paip["s"][j]);
                    				}
                        			var param1 = {
                            			paixing:onePai
                        			};
                        			ZHQGameDao.updatePai(rid,paixing[location-1],location,function(err){
										console.log("updatePai success......");
                        			});
                        			ZHQGameDao.setIsGame(rid,location,3,function(err){
                            			console.log("paixing:"+JSON.stringify(param1));
                            			console.log("heheheheheheh"+JSON.stringify(res));
                            			var tsid = channel.getMember(res)['sid'];
                            			channelService.pushMessageByUids('onShoupaiFirst', param1, [{
                                			uid: res,
                                			sid: tsid
                            			}]);
                            			ZHQGameDao.updateRoomStatus(rid,1,function(err){
                                			console.log("game_status change to 1(gaming)");
                            			});

                            			delayDao.addDelay(rid,13,function(){
                                			console.log("fapai:addDelay success");
                            			});
                        			});
                    			}
                			});
            			}
            		}else{
            			for(var i = 0;i < users.length;i++){
                			ZHQGameDao.getLocalPlayer(rid,i + 1,function(err,res,location){
                    			if(res!='null'){
                        			var param1 = {
                            			paixing:paixing[location-1]
                        			};
                        			ZHQGameDao.updatePai(rid,paixing[location-1],location,function(err){
										console.log("updatePai success......");
                        			});
                        			ZHQGameDao.setIsGame(rid,location,3,function(err){
                            			console.log("paixing:"+JSON.stringify(param1));
                            			console.log("heheheheheheh"+JSON.stringify(res));
                            			var tsid = channel.getMember(res)['sid'];
                            			channelService.pushMessageByUids('onShoupai', param1, [{
                                			uid: res,
                                			sid: tsid
                            			}]);
                            			ZHQGameDao.updateRoomStatus(rid,1,function(err){
                                			console.log("game_status change to 1(gaming)");
                            			});

                            			delayDao.addDelay(rid,13,function(){
                                			console.log("fapai:addDelay success");
                            			});
                        			});
                    			}
                			});
            			}
            		}
            		console.log("ZHQLogicRemote");
				},3000);
            });
        }
    });
};

//对牌进行打分排序用

ZHQLogicRemote.getCardClass = function(p,s){
	if(p == 14 && s == 4){
		return 18;
	}else if(p == 14 && s == 2){
		return 17;
	}else if(p == 3){
		return 16;
	}else if(p == 2){
		return 15;
	}else if(p == 14){
		return 14;
	}else{
		return p;
	}
	return 0;
};
/**
 * 分牌逻辑，调用后返回牌型数组
 * */

ZHQLogicRemote.getCardArr = function(player_num){
	console.log('ZHQLogicRemote.getCardArr:' + player_num);
	function convert (numArr){
		var param = {
			"p":[],
			"s":[]
		};
		for (var i = 0; i < numArr.length;i++){
			var p = parseInt(numArr[i]%13+2);
			var s = parseInt(numArr[i]/13+1);
			param["p"].push(p);
			param["s"].push(s);
		}
		console.log("convert:" + JSON.stringify(param));
		//对玩家的牌进行排序处理
		for(var i = 0;i < numArr.length;i++){
			for(var j = i + 1;j < numArr.length;j++){
				var p1 = param["p"][i];
				var p2 = param["p"][j];
				var s1 = param["s"][i];
				var s2 = param["s"][j];
				//如果是主牌单独排序
				var pp1 = ZHQLogicRemote.getCardClass(p1,s1);
				var pp2 = ZHQLogicRemote.getCardClass(p2,s2);
				if(pp1 > pp2){
					continue;
				}else if(pp1 < pp2){
					var temp = param["s"][i];
					param["p"][i] = p2;
					param["s"][i] = param["s"][j];
					param["p"][j] = p1;
					param["s"][j] = temp;
				}else{
					if(s1 > s2){
						continue;
					}else if(s1 < s2){
						param["p"][i] = p2;
						param["s"][i] = s2;
						param["p"][j] = p1;
						param["s"][j] = s1;
					}
				}
			}
		}
		console.log("param"+JSON.stringify(param));
		return param;
	}
	
	var arr = new Array();
	var paiArr = new Array();
	for(var i = 0;i < 52;i++){
		paiArr[i] = 0;
	}
	var total_pai = 0;
	//随机发牌给所有的玩家
	for(var i = 0;i < player_num;i++){
		var pai_num = Math.floor(52 / player_num);
		var oneArr = new Array();
		while(pai_num > 0){
			var temp=Math.floor(Math.random()*52);
			if(paiArr[temp] == 0){
				paiArr[temp] = 1;
				oneArr.push(temp);
				pai_num = pai_num - 1;
			}
		}
		total_pai = total_pai + Math.floor(52 / player_num);
		arr[i] = oneArr;
	}
	//牌有剩余 剩下的牌 从第一个玩家 发起发完为止
	if(total_pai < 52){
		var left = 52 - total_pai;
		for(var i = 0;i < left;i++){
			var oneArr = arr[i];
			var temp=Math.floor(Math.random()*52);
			while(paiArr[temp] == 1){
				temp=Math.floor(Math.random()*52);
			}
			oneArr.push(temp);
		}
	}
	console.log("all pai:" + JSON.stringify(arr));
	var paixing = [];
	for(var i = 0;i < player_num;i++){
		paixing[i] = convert(arr[i]);
	}

	return paixing;
};

/**
 * 玩家出牌时提示是否出牌有效
 * */

ZHQLogicRemote.chuPaiTip = function(rid,chupai,channel,username,channelService){
	ZHQGameDao.getPlayerLocal(rid,username,function(err,location){
		ZHQGameDao.getLastPai(rid,function(err,last_pai){
			ZHQGameDao.getLastLocation(rid,function(err,last_location){
				//P:牌数字2-14
				//S:花色 1方块 2梅花 3红桃 4黑桃
				//这里需要完成发牌逻辑
				var ps = chupai["p"];
				var ss = chupai["s"];
				var last_ps = last_pai["p"];
				var last_ss = last_pai["s"];
				var flag = true;
				//出牌规则过滤 不是对子 豹子 横子 不许出牌 牌数超过1
				if(ps.length == 2){
					if(ps[0] != ps[1]){
						flag = false;
					}
				}else if(ps.length == 3){
					if(ps[0] != ps[1] || ps[1] != ps[2]){
						flag = false;
					}
				}else if(ps.length == 4){
					if(ps[0] != ps[1] || ps[1] != ps[2] || ps[2] != ps[3]){
						flag = false;
					}
				}else if(ps.length > 4){
					flag = false;
				}
				if(flag == false){
					ZHQGameDao.getLocalPlayer(rid,location,function(err,res,location){
						var param = {
							flag:false,
							location:location
						};
						var tsid = channel.getMember(res)['sid'];
						channelService.pushMessageByUids('onChuPaiTip', param, [{
							uid: res,
							sid: tsid
						}]);
					});
					return false;
				}
				//如果 出牌玩家是上一次的出牌玩家说明其他人都不管 可以继续出牌
				flag = false;
				if(last_location == location){
					flag = true;
				}else if(last_pai == 'null'){
					flag = true;
					//第一次出牌 可以出牌
				}else{
					//比较当前牌 与上次出牌大小 大于可以出牌否则不可以
					//如果是双 A则不需要比牌最大的牌
					if(ps.length == 2){
						if(ps[0] == 14){
							if(ss[0] == 2 && ss[1] == 4){
								flag = true;
							}else if(ss[0] == 4 && ss[1] == 2){
								flag = true;
							}
						}
					}
					if(last_ps.length == 1){
						if(ps.length == 1){
							var pps = ZHQLogicRemote.getCardClass(ps[0],ss[0]);
							var lastpp = ZHQLogicRemote.getCardClass(last_ps[0],last_ss[0]);
							if(pps > lastpp && lastpp != 17){
								flag = true;
							}
						}else if(ps.length >= 3){
							flag = true;
						}
					//2张牌对子的
					}else if(last_ps.length == 2){
						if(ps.length == 2){
							var pps = ZHQLogicRemote.getCardClass(ps[0],ss[0]);
							var pps1 = ZHQLogicRemote.getCardClass(ps[1],ss[1]);
							var lastpp = ZHQLogicRemote.getCardClass(last_ps[0],last_ss[0]);
							var lastpp1 = ZHQLogicRemote.getCardClass(last_ps[1],last_ss[1]);
							//如果上次的牌大小不相等则说明是对A 黑红一对
							if(lastpp != lastpp1){
								if(pps > 14 && pps1 > 14 && Math.abs(lastpp1 - lastpp) != 1){
									flag = true;
								}
							}else{
								if(pps > lastpp && pps1 > lastpp){
									flag = true;
								}
							}
						}else if(ps.length >= 3){
							flag = true;
						}
					//3张牌豹子的
					}else if(last_ps.length == 3){
						if(ps.length == 3){
							var pps = ZHQLogicRemote.getCardClass(ps[0],ss[0]);
							var lastpp = ZHQLogicRemote.getCardClass(last_ps[0],last_ss[0]);
							if(lastpp == 18 || lastpp == 17){
								if(pps > 14){
									flag = true;
								}
							}else if(pps == 18 || pps == 17){
								if(lastpp < 14){
									flag = true;
								}
							}else if(pps > lastpp){
								flag = true;
							}
						}else if(ps.length == 4){
							flag = true;
						}
					//4张牌横子的
					}else if(last_ps.length == 4){
						if(ps.length == 4){
							var pps = ZHQLogicRemote.getCardClass(ps[0],ss[0]);
							var lastpp = ZHQLogicRemote.getCardClass(last_ps[0],last_ss[0]);
							if(lastpp == 17 || lastpp == 18 || lastpp == 14){
								if(pps > 14){
									flag = true;
								}
							}else if(pps == 17 || pps == 18 || pps == 14){
								if(lastpp < 14){
									flag = true;
								}
							}else if(pps > lastpp){
								flag = true;
							}
						}
					}
				}
				ZHQGameDao.getLocalPlayer(rid,location,function(err,res,location){
					var param = {
						flag:flag,
						location:location
					};
					var tsid = channel.getMember(res)['sid'];
					channelService.pushMessageByUids('onChuPaiTip', param, [{
						uid: res,
						sid: tsid
					}]);
				});
				return flag;
			});
		});
	});
};

/**
 * 管不了 pass
 * */

ZHQLogicRemote.pass = function(rid,location,channel,username){
	var param = {
		route:'onPass',
		location:location
	};
	channel.pushMessage(param);
	ZHQGameDao.nextCurPlayer(rid,function(err,new_loc){
		console.log("nextCurPlayer success");
		ZHQLogicRemote.changeCurPlayer(rid,new_loc,channel);
		//出牌定时，重置定时器
		delayDao.removeDelay(rid,function(){
			console.log("follow:removeDelay success");
			delayDao.addDelay(rid,10,function(){
				console.log("follow:addDelay success");
			});
		});
	});
};

/**
 * 玩家的准备标志 设置2
 * */
ZHQLogicRemote.ready = function(rid,location,channel,username,channelService){
	ZHQGameDao.getAllPlayerNum(rid,function(err,all_player_num){
		ZHQGameDao.setIsGame(rid,location,2,function(err,res){
			ZHQGameDao.getIsGameNum(rid,function(err,isGameNums){
				var param = {
					route:'onReady',
					location:location
				};
				channel.pushMessage(param);
				var sum = 0;
				for (var i = 1;i <= 6;i++){
					if(isGameNums[i] == 2){
						sum = sum + 1;
					}
				}
				setTimeout(function(){
					if(sum == all_player_num){
						//过3s后 提示玩家开始出牌
						ZHQGameDao.getCurPlayer(rid,function(err,cur_player){
							var param = {
								route:'onStartChuPai',
								location:cur_player
							};
							channel.pushMessage(param);
						});
					}
				},200);
			});
		});
	});
};

ZHQLogicRemote.jieFeng = function(rid,location,channel,username,channelService){
	ZHQGameDao.setLastLocation(rid,location,function(err,res){
		var param = {
			route:'onJieFeng',
			location:location
		};
		channel.pushMessage(param);
	});
	ZHQGameDao.nextCurPlayer(rid,function(err,new_loc){
		console.log("nextCurPlayer success");
		ZHQLogicRemote.changeCurPlayer(rid,new_loc,channel);
		//出牌定时，重置定时器
		delayDao.removeDelay(rid,function(){
			console.log("follow:removeDelay success");
			delayDao.addDelay(rid,10,function(){
				console.log("follow:addDelay success");
			});
		});
	});
};
/**
 * 玩家的开始标志 设置1
 * */
ZHQLogicRemote.start = function(rid,location,channel,username,channelService){
	ZHQGameDao.getAllPlayerNum(rid,function(err,all_player_num){
		ZHQGameDao.setIsGame(rid,location,1,function(err,res){
			ZHQGameDao.getIsGameNum(rid,function(err,isGameNums){
				var param = {
					route:'onStart',
					location:location
				};
				channel.pushMessage(param);
				setTimeout(function(){
					var sum = 0;
					for (var i = 1;i <= 6;i++){
						if(isGameNums[i] == 1){
							sum = sum + 1;
						}
					}
					if(sum == all_player_num){
						ZHQLogicRemote.fapai(rid,channel,channelService);
					}
				},100);
			});
		});
	});
};

/**
  * 设置宣牌标志状态3 并把筹码增加一倍
  **/

ZHQLogicRemote.markA = function(rid,mark,channel,username){
	ZHQGameDao.setMarkFlag(rid,mark,function(err,res){
		ZHQGameDao.getPlayerLocal(rid,username,function(err,location){
			ZHQGameDao.getCurrentChip(rid,function(err,cur_chip){
				ZHQGameDao.setCurrentChip(rid,cur_chip * 2,function(err,new_chip){
					ZHQGameDao.setIsGame(rid,location,4,function(err,res){
						ZHQGameDao.getHeiA(rid,function(err,heiALocations){
							var param = {
								route:'onMarkA',
								mark:mark,
								chip:cur_chip * 2,
								heia:heiALocations,
								location:location
							};
							channel.pushMessage(param);
						});
					});
				});
			});
		});
	});
};

/**
 * 牌不好有人投降
 * */

ZHQLogicRemote.throw = function(rid,location,flag,channel,username){
	//如果name不存在且flag为true，则创建channel
	var users = channel.getMembers();
	console.log("--------users in fapai:"+users);
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	var nhei_arr = new Array();
	var hei_arr = new Array();
	var which_one = -1;
	ZHQGameDao.getHeiA(rid,function(err,locations){
		for(var i = 0;i < users.length;i++){
			var ht = false;
			for(var j = 0;j < locations.length;j++){
				if(locations[j] == (i + 1)){
					ht = true;
					break;
				}
			}
			if(ht == false){
				//判断是哪一面投降
				if(location == i + 1){
					which_one = 0;
				}
				nhei_arr.push(i + 1);
			}else{
				if(location == i + 1){
					which_one = 1;
				}
				hei_arr.push(i + 1);
			}
		}
		ZHQGameDao.getThrowNum(rid,function(err,throw_num){
			//有玩家不同意投降则继续玩牌
			if(flag == false){
				var param = {
					route:"onThrow",
					status:false,
					users:nhei_arr,
					location:location
				};
				if(which_one == 0){
					param['users'] = hei_arr;
				}
				channel.pushMessage(param);
				//2000ms 停顿2s
				setTimeout(function(){
					ZHQGameDao.setThrowNum(rid,throw_num * -1,function(err,res){
					});
				},1000);
			}else{
				//玩家都投降 这重新开始玩牌
				if((throw_num + 1) >= nhei_arr.length){
					ZHQGameDao.getCurrentChip(rid,function(err,cur_chip){
						ZHQGameDao.setCurrentChip(rid,cur_chip / 2,function(err,new_chip){
							ZHQLogicRemote.restartGame(rid,locations,nhei_arr,0,channel);
						});
					});
				}else{
					var param = {
						route:"onThrow",
						status:true,
						users:nhei_arr,
						location:location
					};
					if(which_one == 0){
						param['users'] = hei_arr;
					}
					channel.pushMessage(param);
					setTimeout(function(){
						ZHQGameDao.setThrowNum(rid,1,function(err,res){
						});
					},1000);
				}
			}
		});
	});
};

/**
 * 询问其他玩家的牌数
 * */

ZHQLogicRemote.howMany = function(rid,location,channel,username){
	//如果name不存在且flag为true，则创建channel
	var users = channel.getMembers();
	console.log("--------users in fapai:"+users);
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	var paiNums = {
		1:-1,
		2:-1,
		3:-1,
		4:-1,
		5:-1
	};
	ZHQGameDao.getAllPai(rid,function(err,allPai){
		for(var i = 0;i < users.length;i++){
			var onePai = allPai[i];
			if(location == (i + 1)){
				continue;
			}else{
				paiNums[i + 1] = onePai["p"].length;
			}
		}
	});
	var param = {
		route:"onHowMany",
		painum:paiNums,
		location:location
	};
	channel.pushMessage(param);
};

/**
 * 出牌并保存出牌的牌型和花色
 * @param rid
 */

ZHQLogicRemote.chupai = function(rid,chupai,channel,username){
	var users = channel.getMembers();
	console.log("--------users in chupai:"+users);
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	ZHQGameDao.getPlayerLocal(rid,username,function(err,location){
		ZHQGameDao.setLastPai(rid,chupai,function(err,res){
			ZHQGameDao.setLastLocation(rid,location,function(err,res){
				ZHQGameDao.getPai(rid,location,function(err,pai){
					//玩家出牌 并更新保存的牌
					var ps = chupai["p"];
					var ss = chupai["s"];
					var pai_ps = pai["p"];
					var pai_ss = pai["s"];
					for(var i = 0;i < ps.length;i++){
						for(var j = 0;j < pai_ps.length;j++){
							if(pai_ps[j] == ps[i] && pai_ss[j] == ss[i]){
								pai_ps.splice(j,1);
								pai_ss.splice(j,1);
								break;
							}
						}
					}
					var tstatus = 0;
					if(pai_ps.length == 0){
						tstatus = -1;
					}
					ZHQGameDao.getNextCurPlayer(rid,function(err,new_cur){
						console.log("updatePai: null");
						var param = {
							route:"onChuPai",
							pai:chupai,
							status:tstatus,
							next:new_cur,
							location:location
						};
						channel.pushMessage(param);
					});
					if(pai_ps.length == 0){
						/*如果出完牌 则置为 null 并且 isGameNum 0*/
						/*获取第一次出玩牌的玩家位置*/
						ZHQGameDao.getFirstFinish(rid,function(err,first_local){
							ZHQGameDao.updatePai(rid,'null',location,function(err,res){
								ZHQGameDao.setIsGame(rid,location,0,function(err){
									if(first_local == 0){
										ZHQGameDao.setFirstFinish(rid,location,function(err,res){
											console.log("ZHQGameDao.setFirstFinish:" + location);
											ZHQGameDao.getHeiA(rid,function(err,locations){
												/*双黑A在一个人手里 并且先出完牌*/
												if(locations[0] == locations[1] && location == locations[0]){
													var nhei_arr = new Array();
													for(var i = 0;i < users.length;i++){
														if(location == (i + 1)){
															continue;
														}
														nhei_arr.push(i + 1);
													}
													ZHQLogicRemote.restartGame(rid,locations,nhei_arr,0,channel);
												}else{
													ZHQGameDao.nextCurPlayer(rid,function(err,new_loc){
														console.log("nextCurPlayer success");
														ZHQLogicRemote.changeCurPlayer(rid,new_loc,channel);
														//出牌定时，重置定时器
														delayDao.removeDelay(rid,function(){
															console.log("follow:removeDelay success");
															delayDao.addDelay(rid,10,function(){
																console.log("follow:addDelay success");
															});
														});
													});
												}
											});
										});
									}else{
										//有玩家出完牌 就需要确认一下是否可以分出胜负
										ZHQGameDao.getHeiA(rid,function(err,locations){
											ZHQGameDao.getAllPai(rid,function(err,allPai){
												/*判断第一个出完牌的是哪一方 默认 是 持白方*/
												var may_win = 0;
												for(var m = 0;m < locations.length;m++){
													if(locations[m] == first_local){
														may_win = 1;
														break;
													}
												}
												var hei = nhei = 0;
												var nhei_arr = new Array();
												for(var i = 0;i < 5;i++){
													var hei_flag = false;
													var tpai = allPai[i];
													if(tpai == "null"){
														/*有玩家出玩牌了 确定玩家是 持黑 还是持 白*/
														for(var m = 0;m < locations.length;m++){
															var tloca = locations[m];
															if(tloca == (i + 1)){
																hei = hei + 1;
																hei_flag = true;
																break;
															}
														}
														if(hei_flag == false){
															nhei = nhei + 1;
														}
													}
													/*找到持白的玩家位置*/
													var hei_tt = false;
													for(var m = 0;m < locations.length;m++){
														var tloca = locations[m];
														if(tloca == (i + 1)){
															hei_tt = true;
															break;
														}
													}
													if(hei_tt == false){
														nhei_arr.push(i + 1);
													}
												}
												//看看白方 能不能赢牌
												if(may_win == 0){
													if(locations[0] == locations[1] && hei == 1){
														/*没有分出胜负 和牌*/
														ZHQLogicRemote.restartGame(rid,locations,nhei_arr,2,channel);
													}else if(locations[0] == locations[1] && nhei == 4){
														/*白方获胜*/
														ZHQLogicRemote.restartGame(rid,nhei_arr,locations,1,channel);
													}else if(locations[0] != locations[1] && hei == 2){
														/*没有分出胜负 和牌*/
														ZHQLogicRemote.restartGame(rid,locations,nhei_arr,2,channel);
													}else if(locations[0] != locations[1] && nhei == 3){
														/*白方获胜*/
														ZHQLogicRemote.restartGame(rid,nhei_arr,locations,1,channel);
													}else{
														/*还在进行没有分出胜负*/
														ZHQGameDao.nextCurPlayer(rid,function(err,new_loc){
															console.log("nextCurPlayer success");
															ZHQLogicRemote.changeCurPlayer(rid,new_loc,channel);
															//出牌定时，重置定时器
															delayDao.removeDelay(rid,function(){
																console.log("follow:removeDelay success");
																delayDao.addDelay(rid,10,function(){
																	console.log("follow:addDelay success");
																});
															});
														});
													}
												}else if(may_win == 1){
													if(locations[0] != locations[1] && nhei == 3){
														/*没有分出胜负 和牌*/
														ZHQLogicRemote.restartGame(rid,locations,nhei_arr,2,channel);
													}else if(locations[0] != locations[1] && hei == 2){
														/*黑方获胜*/
														ZHQLogicRemote.restartGame(rid,locations,nhei_arr,0,channel);
													}else{
														/*还在进行没有分出胜负*/
														ZHQGameDao.nextCurPlayer(rid,function(err,new_loc){
															console.log("nextCurPlayer success");
															ZHQLogicRemote.changeCurPlayer(rid,new_loc,channel);
															//出牌定时，重置定时器
															delayDao.removeDelay(rid,function(){
																console.log("follow:removeDelay success");
																delayDao.addDelay(rid,10,function(){
																	console.log("follow:addDelay success");
																});
															});
														});
													}
												}
											});
										});
									}
								});
							});
						});
					}else{
						ZHQGameDao.updatePai(rid,pai,location,function(err,res){
							ZHQGameDao.nextCurPlayer(rid,function(err,new_loc){
								console.log("nextCurPlayer success");
								ZHQLogicRemote.changeCurPlayer(rid,new_loc,channel);
								//出牌定时，重置定时器
								delayDao.removeDelay(rid,function(){
									console.log("follow:removeDelay success");
									delayDao.addDelay(rid,10,function(){
										console.log("follow:addDelay success");
									});
								});
							});
						});
					}
				});
			});
		});
	});
};

/**
 * 广播玩家轮换信息
 * */

ZHQLogicRemote.changeCurPlayer = function(rid,location,channel){
    var param = {
        route:'onChangePlayer',
        location:location
    };
    channel.pushMessage(param);
};

/**
 * 重新开始牌局游戏
 * win_type 0 持黑 1 持白 2 和牌
 */

ZHQLogicRemote.restartGame = function(rid,winner,lost,win_type,channel){
	//重新开始
	//游戏结束，取消定时器
	delayDao.removeDelay(rid,function(){
		console.log("throw:removeDelay success");
	});

	if(win_type == 0){
		//黑方胜则确定 黑方有多少人
		for(var i = 0;i < (lost.length - winner.length);i++){
			winner.push(winner[0]);
		}
	}else if(win_type == 1){
		for(var i = 0;i < (winner.length - lost.length);i++){
			lost.push(lost[0]);
		}
	}

	if(win_type == 2){
		console.log("equal not sub gold for every one");
	}else{
		//增加获胜者的筹码
		for(var i = 0;i < winner.length;i++){
			ZHQGameDao.getLocalPlayer(rid,winner[i],function(err,player,mylocal){
				ZHQGameDao.getCurrentChip(rid,function(err,cur_chip){
					var uid = player.split("*")[0];
					playerDao.setGold(uid,cur_chip,function(err,res){
						console.log("add gold succ:" + player + " chip:" +cur_chip);
					});
				});
			});
		}
		//减少失败者的筹码
		for(var i = 0;i < lost.length;i++){
			ZHQGameDao.getLocalPlayer(rid,lost[i],function(err,player,mylocal){
				ZHQGameDao.getCurrentChip(rid,function(err,cur_chip){
					var uid = player.split("*")[0];
					playerDao.subGold(uid,cur_chip,function(err,res){
						console.log("sub gold succ:" + player + " chip:" + cur_chip);
					});
				});
			});
		}
	}
	ZHQGameDao.getCurrentChip(rid,function(err,cur_chip){
		var param = {
			route:"onFinish",
			winner:winner,
			lost:lost,
			cur_chip:cur_chip,
			status:win_type
		};
		channel.pushMessage(param);
	});
	ZHQGameDao.setFirstFaPai(rid,lost[0],function(err,res){
		ZHQGameDao.resetData(rid,function(err){
			console.log("setFirstFaPai:" + lost[0]);
		});
	});
};

/**
 * 获取房间玩家的信息
 * */
ZHQLogicRemote.getPlayerInfo = function(uid,rid,send_from,location,channel){
	console.log("ZJHLogicRemote.getPlayerInfo......");
	var playerId = null;
	ZHQGameDao.getRoomInfo(rid,function(err,roomInfo){
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

ZHQLogicRemote.getRoomPlayersInfo = function(uid,rid,location,channel,username,channelService){
	console.log("ZHQLogicRemote.getRoomPlayersInfo......");
	var players = {};
	ZHQGameDao.getRoomInfo(rid,function(err,roomInfo){
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

ZHQLogicRemote.FailGame = function(rid,channel,channelService,location){
	var users = channel.getMembers();
	console.log("--------users in chupai:"+users);
	var locals = new Array();
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
		ZHQGameDao.getPlayerLocal(rid,users[i],function(err,mylocal){
			locals.push(mylocal);
		});
	}
	setTimeout(function(){
		locals.push(location);
		ZHQGameDao.getHeiA(rid,function(err,locations){
			var win_type = 0;
			for(var i = 0;i < locations.length;i++){
				if(locations[i] == location){
					win_type = 1;
					break;
				}
			}
			var nhei = new Array();
			for(var i = 0;i < locals.length;i++){
				var flg = false;
				for(var j = 0;j < locations.length;j++){
					if(locations[j] == locals[i]){
						flg = true;
						break;
					}
				}
				if(flg == false){
					nhei.push(locals[i]);
				}
			}
			if(win_type == 0){
				ZHQLogicRemote.restartGame(rid,locations,nhei,win_type,channel);
			}else{
				ZHQLogicRemote.restartGame(rid,nhei,locations,win_type,channel);
			}
		});
	},1000);
};
