/**
 * Created by wuningjian on 3/3/16.
 */

var gameDao   = require('../../../dao/gameDao');
var playerDao = require('../../../dao/playerDao');
var delayDao  = require('../../../dao/delayDao');
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
gameLogicRemote.bipai = function(rid,location1,location2,channel,channelService){
	//比牌逻辑，返回结果
	var self = this;
	gameDao.getPai(rid,location1,function(err,pai1){
		gameDao.getPai(rid,location2,function(err,pai2){
			//bipai logic

			//比较牌1与牌2的大小逻辑
			var paixing1 = self.sortPai(pai1);
			var paixing2 = self.sortPai(pai2);

			console.log("paixing1:"+paixing1);
			console.log("paixing2:"+paixing2);

								var paiClass1 = self.classPai(paixing1);
								var paiClass2 = self.classPai(paixing2);

								if(paiClass1>paiClass2){
									var param={
										result:location1
									};
									gameDao.setIsGameNum(rid,location2,0,function(err){
										cb(param.result);
									});
								}else if(paiClass1<paiClass2){
									var param={
										result:location2
									};
									gameDao.setIsGameNum(rid,location1,0,function(err){
										cb(param.result);
									});
								}else{
									//牌型相同情况
									if(paiClass1==5){
										//都是豹子
										if(paixing1[0]>paixing2[0]){
											var param={
												result:location1
											};
											gameDao.setIsGameNum(rid,location2,0,function(err){
												cb(param.result);
											});
										}else{
											var param={
												result:location2
											};
											gameDao.setIsGameNum(rid,location1,0,function(err){
												cb(param.result);
											});
										}
									}else if(paiClass1==4){
										//都是金花
										if((paixing1[0]-paixing1[1])==1&&(paixing1[1]-paixing1[2])==1){
											//金花1是顺子金花
											if((paixing1[0]-paixing1[1])==1&&(paixing1[1]-paixing1[2])==1){
												//金花1，2都是顺子金花
												if(paixing1[0]>paixing2[0]){
													//顺子金花1点数大于顺子金花2
													var param={
														result:location1
													};
													gameDao.setIsGameNum(rid,location2,0,function(err){
														cb(param.result);
													});
												}else if(paixing1[0]<paixing2[0]){
													//顺子金花1点数小于顺子金花2
													var param={
														result:location2
													};
													gameDao.setIsGameNum(rid,location1,0,function(err){
														cb(param.result);
													});
												}else{
													//顺子金花1点数等于顺子金花2
													if(paixing1[3]>paixing2[3]){
														var param={
															result:location1
														};
														gameDao.setIsGameNum(rid,location2,0,function(err){
															cb(param.result);
														});
													}else{
														var param={
															result:location2
														};
														gameDao.setIsGameNum(rid,location1,0,function(err){
															cb(param.result);
														});
													}
												}

											}else{
												//金花1是顺子金花，金花2不是顺子
												var param={
													result:location1
												};
												gameDao.setIsGameNum(rid,location2,0,function(err){
													cb(param.result);
												});
											}
										}else{
											//金花1不是顺子金花
											if((paixing1[0]-paixing1[1])==1&&(paixing1[1]-paixing1[2])==1){
												//金花1不是顺子金花，金花2是顺子金花
												var param={
													result:location2
												};
												gameDao.setIsGameNum(rid,location2,0,function(err){
													cb(param.result);
												});
											}else{
												//金花1，2都不是顺子金花
												if(paixing1[0]>paixing2[0]){
													//金花1点数大于顺子金花2
													var param={
														result:location1
													};
													gameDao.setIsGameNum(rid,location2,0,function(err){
														cb(param.result);
													});
												}else if(paixing1[0]<paixing2[0]){
													//金花1点数小于顺子金花2
													var param={
														result:location2
													};
													gameDao.setIsGameNum(rid,location1,0,function(err){
														cb(param.result);
													});
												}else{
													//金花1点数等于顺子金花2
													if(paixing1[1]>paixing2[1]){
														var param={
															result:location1
														};
														gameDao.setIsGameNum(rid,location2,0,function(err){
															cb(param.result);
														});
													}else if(paixing1[1]<paixing2[1]){
														var param={
															result:location2
														};
														gameDao.setIsGameNum(rid,location1,0,function(err){
															cb(param.result);
														});
													}else{
														if(paixing1[2]>paixing2[2]){
															var param={
																result:location1
															};
															gameDao.setIsGameNum(rid,location2,0,function(err){
																cb(param.result);
															});
														}else if(paixing1[2]<paixing2[2]){
															var param={
																result:location2
															};
															gameDao.setIsGameNum(rid,location1,0,function(err){
																cb(param.result);
															});
														}else if(paixing1[3]>paixing2[3]){
															var param={
																result:location1
															};
															gameDao.setIsGameNum(rid,location2,0,function(err){
																cb(param.result);
															});
														}else{
															var param={
																result:location2
															};
															gameDao.setIsGameNum(rid,location1,0,function(err){
																cb(param.result);
															});
														}
													}
												}
											}

										}

									}else if(paiClass1==3){
										//都是顺子
										if(paixing1[0]>paixing2[0]){
											var param={
												result:location1
											};
											gameDao.setIsGameNum(rid,location2,0,function(err){
												cb(param.result);
											});
										}else if(paixing1[0]<paixing2[0]){
											var param={
												result:location2
											};
											gameDao.setIsGameNum(rid,location1,0,function(err){
												cb(param.result);
											});
										}else{
											//两个顺子点数一样,比花色
											if(paixing1[3]>paixing2[3]){
												var param={
													result:location1
												};
												gameDao.setIsGameNum(rid,location2,0,function(err){
													cb(param.result);
												});
											}else{
												var param={
													result:location2
												};
												gameDao.setIsGameNum(rid,location1,0,function(err){
													cb(param.result);
												});
											}
										}
									}else if(paiClass1==2){
										//都是对子
										if(paixing1[1]>paixing2[1]){
											var param={
												result:location1
											};
											gameDao.setIsGameNum(rid,location2,0,function(err){
												cb(param.result);
											});
										}else if(paixing1[1]<paixing2[1]){
											var param={
												result:location2
											};
											gameDao.setIsGameNum(rid,location1,0,function(err){
												cb(param.result);
											});
										}else{
											var param={
												result:location1
											};
											gameDao.setIsGameNum(rid,location2,0,function(err){
												cb(param.result);
											});
										}
									}else {
										//都是单牌
										if(paixing1[0]>paixing2[0]){
											var param={
												result:location1
											};
											gameDao.setIsGameNum(rid,location2,0,function(err){
												cb(param.result);
											});
										}else if(paixing1[0]<paixing2[0]){
											var param={
												result:location2
											};
											gameDao.setIsGameNum(rid,location1,0,function(err){
												cb(param.result);
											});
										}else {
											if(paixing1[1]>paixing2[1]){
												var param={
													result:location1
												};
												gameDao.setIsGameNum(rid,location2,0,function(err){
													cb(param.result);
												});
											}else if(paixing1[1]<paixing2[1]){
												var param={
													result:location2
												};
												gameDao.setIsGameNum(rid,location1,0,function(err){
													cb(param.result);
												});
											}else{
												if(paixing1[2]>paixing2[2]){
													var param={
														result:location1
													};
													gameDao.setIsGameNum(rid,location2,0,function(err){
														cb(param.result);
													});
												}else {
													var param={
														result:location2
													};
													gameDao.setIsGameNum(rid,location1,0,function(err){
														cb(param.result);
													});
												}
											}
										}

									}
								}

								gameDao.nextCurPlayer(rid,function(err,new_loc){
									//出牌定时，重置定时器
									delayDao.removeDelay(rid,function(){
										console.log("bipai:removeDelay success");
										setTimeout(function(){
											gameLogicRemote.changeCurPlayer(rid,new_loc,channel);
											delayDao.addDelay(rid,10,function(){
												console.log("bipai:addDelay success");
											});
										},4800);
									});
									console.log("nextCurPlayer success");
								});
							});
						});
					});
				});
			}else{
				var playerId_int = parseInt(playerId);
				playerDao.subGold(playerId_int,cur_chip,function(err,res){
					console.log('-------bipai subGold------');
				});
				gameDao.getAllChip(rid,function(err,ex_all_chip){
					gameDao.setAllChip(rid,ex_all_chip+cur_chip,function(err,res){
						gameDao.getPai(rid,location1,function(err,pai1){
							gameDao.getPai(rid,location2,function(err,pai2){
								//bipai logic

								//比较牌1与牌2的大小逻辑
								var paixing1 = self.sortPai(pai1);
								var paixing2 = self.sortPai(pai2);

								console.log("paixing1:"+paixing1);
								console.log("paixing2:"+paixing2);

								var paiClass1 = self.classPai(paixing1);
								var paiClass2 = self.classPai(paixing2);

								if(paiClass1>paiClass2){
									var param={
										result:location1
									};
									gameDao.setIsGameNum(rid,location2,0,function(err){
										cb(param.result);
									});
								}else if(paiClass1<paiClass2){
									var param={
										result:location2
									};
									gameDao.setIsGameNum(rid,location1,0,function(err){
										cb(param.result);
									});
								}else{
									//牌型相同情况
									if(paiClass1==5){
										//都是豹子
										if(paixing1[0]>paixing2[0]){
											var param={
												result:location1
											};
											gameDao.setIsGameNum(rid,location2,0,function(err){
												cb(param.result);
											});
										}else{
											var param={
												result:location2
											};
											gameDao.setIsGameNum(rid,location1,0,function(err){
												cb(param.result);
											});
										}
									}else if(paiClass1==4){
										//都是金花
										if((paixing1[0]-paixing1[1])==1&&(paixing1[1]-paixing1[2])==1){
											//金花1是顺子金花
											if((paixing1[0]-paixing1[1])==1&&(paixing1[1]-paixing1[2])==1){
												//金花1，2都是顺子金花
												if(paixing1[0]>paixing2[0]){
													//顺子金花1点数大于顺子金花2
													var param={
														result:location1
													};
													gameDao.setIsGameNum(rid,location2,0,function(err){
														cb(param.result);
													});
												}else if(paixing1[0]<paixing2[0]){
													//顺子金花1点数小于顺子金花2
													var param={
														result:location2
													};
													gameDao.setIsGameNum(rid,location1,0,function(err){
														cb(param.result);
													});
												}else{
													//顺子金花1点数等于顺子金花2
													if(paixing1[3]>paixing2[3]){
														var param={
															result:location1
														};
														gameDao.setIsGameNum(rid,location2,0,function(err){
															cb(param.result);
														});
													}else{
														var param={
															result:location2
														};
														gameDao.setIsGameNum(rid,location1,0,function(err){
															cb(param.result);
														});
													}
												}

											}else{
												//金花1是顺子金花，金花2不是顺子
												var param={
													result:location1
												};
												gameDao.setIsGameNum(rid,location2,0,function(err){
													cb(param.result);
												});
											}
										}else{
											//金花1不是顺子金花
											if((paixing1[0]-paixing1[1])==1&&(paixing1[1]-paixing1[2])==1){
												//金花1不是顺子金花，金花2是顺子金花
												var param={
													result:location2
												};
												gameDao.setIsGameNum(rid,location2,0,function(err){
													cb(param.result);
												});
											}else{
												//金花1，2都不是顺子金花
												if(paixing1[0]>paixing2[0]){
													//金花1点数大于顺子金花2
													var param={
														result:location1
													};
													gameDao.setIsGameNum(rid,location2,0,function(err){
														cb(param.result);
													});
												}else if(paixing1[0]<paixing2[0]){
													//金花1点数小于顺子金花2
													var param={
														result:location2
													};
													gameDao.setIsGameNum(rid,location1,0,function(err){
														cb(param.result);
													});
												}else{
													//金花1点数等于顺子金花2
													if(paixing1[1]>paixing2[1]){
														var param={
															result:location1
														};
														gameDao.setIsGameNum(rid,location2,0,function(err){
															cb(param.result);
														});
													}else if(paixing1[1]<paixing2[1]){
														var param={
															result:location2
														};
														gameDao.setIsGameNum(rid,location1,0,function(err){
															cb(param.result);
														});
													}else{
														if(paixing1[2]>paixing2[2]){
															var param={
																result:location1
															};
															gameDao.setIsGameNum(rid,location2,0,function(err){
																cb(param.result);
															});
														}else if(paixing1[2]<paixing2[2]){
															var param={
																result:location2
															};
															gameDao.setIsGameNum(rid,location1,0,function(err){
																cb(param.result);
															});
														}else if(paixing1[3]>paixing2[3]){
															var param={
																result:location1
															};
															gameDao.setIsGameNum(rid,location2,0,function(err){
																cb(param.result);
															});
														}else{
															var param={
																result:location2
															};
															gameDao.setIsGameNum(rid,location1,0,function(err){
																cb(param.result);
															});
														}
													}
												}
											}

										}

									}else if(paiClass1==3){
										//都是顺子
										if(paixing1[0]>paixing2[0]){
											var param={
												result:location1
											};
											gameDao.setIsGameNum(rid,location2,0,function(err){
												cb(param.result);
											});
										}else if(paixing1[0]<paixing2[0]){
											var param={
												result:location2
											};
											gameDao.setIsGameNum(rid,location1,0,function(err){
												cb(param.result);
											});
										}else{
											//两个顺子点数一样,比花色
											if(paixing1[3]>paixing2[3]){
												var param={
													result:location1
												};
												gameDao.setIsGameNum(rid,location2,0,function(err){
													cb(param.result);
												});
											}else{
												var param={
													result:location2
												};
												gameDao.setIsGameNum(rid,location1,0,function(err){
													cb(param.result);
												});
											}
										}
									}else if(paiClass1==2){
										//都是对子
										if(paixing1[1]>paixing2[1]){
											var param={
												result:location1
											};
											gameDao.setIsGameNum(rid,location2,0,function(err){
												cb(param.result);
											});
										}else if(paixing1[1]<paixing2[1]){
											var param={
												result:location2
											};
											gameDao.setIsGameNum(rid,location1,0,function(err){
												cb(param.result);
											});
										}else{
											var param={
												result:location1
											};
											gameDao.setIsGameNum(rid,location2,0,function(err){
												cb(param.result);
											});
										}
									}else {
										//都是单牌
										if(paixing1[0]>paixing2[0]){
											var param={
												result:location1
											};
											gameDao.setIsGameNum(rid,location2,0,function(err){
												cb(param.result);
											});
										}else if(paixing1[0]<paixing2[0]){
											var param={
												result:location2
											};
											gameDao.setIsGameNum(rid,location1,0,function(err){
												cb(param.result);
											});
										}else {
											if(paixing1[1]>paixing2[1]){
												var param={
													result:location1
												};
												gameDao.setIsGameNum(rid,location2,0,function(err){
													cb(param.result);
												});
											}else if(paixing1[1]<paixing2[1]){
												var param={
													result:location2
												};
												gameDao.setIsGameNum(rid,location1,0,function(err){
													cb(param.result);
												});
											}else{
												if(paixing1[2]>paixing2[2]){
													var param={
														result:location1
													};
													gameDao.setIsGameNum(rid,location2,0,function(err){
														cb(param.result);
													});
												}else {
													var param={
														result:location2
													};
													gameDao.setIsGameNum(rid,location1,0,function(err){
														cb(param.result);
													});
												}
											}
										}

									}
								}

								gameDao.nextCurPlayer(rid,function(err,new_loc){
									//出牌定时，重置定时器
									delayDao.removeDelay(rid,function(){
										console.log("bipai:removeDelay success");
										setTimeout(function(){
											gameLogicRemote.changeCurPlayer(rid,new_loc,channel);
											delayDao.addDelay(rid,10,function(){
												console.log("bipai:addDelay success");
											});
										},4800);
									});
									console.log("nextCurPlayer success");
								});
							});
						});
					});
				});
			}
		});

	});

	//gameDao.getPai(rid,location1,function(err,pai1){
	//	gameDao.getPai(rid,location2,function(err,pai2){
	//		//bipai logic
	//
	//		//比较牌1与牌2的大小逻辑
	//		var paixing1 = self.sortPai(pai1);
	//		var paixing2 = self.sortPai(pai2);
	//
	//		console.log("paixing1:"+paixing1);
	//		console.log("paixing2:"+paixing2);
	//
	//		var paiClass1 = self.classPai(paixing1);
	//		var paiClass2 = self.classPai(paixing2);
	//
	//		if(paiClass1>paiClass2){
	//			var param={
	//				result:location1
	//			};
	//			gameDao.setIsGameNum(rid,location2,0,function(err){
	//				cb(param.result);
	//			});
	//		}else if(paiClass1<paiClass2){
	//			var param={
	//				result:location2
	//			};
	//			gameDao.setIsGameNum(rid,location1,0,function(err){
	//				cb(param.result);
	//			});
	//		}else{
	//			//牌型相同情况
	//			if(paiClass1==5){
	//				//都是豹子
	//				if(paixing1[0]>paixing2[0]){
	//					var param={
	//						result:location1
	//					};
	//					gameDao.setIsGameNum(rid,location2,0,function(err){
	//						cb(param.result);
	//					});
	//				}else{
	//					var param={
	//						result:location2
	//					};
	//					gameDao.setIsGameNum(rid,location1,0,function(err){
	//						cb(param.result);
	//					});
	//				}
	//			}else if(paiClass1==4){
	//				//都是金花
	//				if((paixing1[0]-paixing1[1])==1&&(paixing1[1]-paixing1[2])==1){
	//					//金花1是顺子金花
	//					if((paixing1[0]-paixing1[1])==1&&(paixing1[1]-paixing1[2])==1){
	//						//金花1，2都是顺子金花
	//						if(paixing1[0]>paixing2[0]){
	//							//顺子金花1点数大于顺子金花2
	//							var param={
	//								result:location1
	//							};
	//							gameDao.setIsGameNum(rid,location2,0,function(err){
	//								cb(param.result);
	//							});
	//						}else if(paixing1[0]<paixing2[0]){
	//							//顺子金花1点数小于顺子金花2
	//							var param={
	//								result:location2
	//							};
	//							gameDao.setIsGameNum(rid,location1,0,function(err){
	//								cb(param.result);
	//							});
	//						}else{
	//							//顺子金花1点数等于顺子金花2
	//							if(paixing1[3]>paixing2[3]){
	//								var param={
	//									result:location1
	//								};
	//								gameDao.setIsGameNum(rid,location2,0,function(err){
	//									cb(param.result);
	//								});
	//							}else{
	//								var param={
	//									result:location2
	//								};
	//								gameDao.setIsGameNum(rid,location1,0,function(err){
	//									cb(param.result);
	//								});
	//							}
	//						}
	//
	//					}else{
	//						//金花1是顺子金花，金花2不是顺子
	//						var param={
	//							result:location1
	//						};
	//						gameDao.setIsGameNum(rid,location2,0,function(err){
	//							cb(param.result);
	//						});
	//					}
	//				}else{
	//					//金花1不是顺子金花
	//					if((paixing1[0]-paixing1[1])==1&&(paixing1[1]-paixing1[2])==1){
	//						//金花1不是顺子金花，金花2是顺子金花
	//						var param={
	//							result:location2
	//						};
	//						gameDao.setIsGameNum(rid,location2,0,function(err){
	//							cb(param.result);
	//						});
	//					}else{
	//						//金花1，2都不是顺子金花
	//						if(paixing1[0]>paixing2[0]){
	//							//金花1点数大于顺子金花2
	//							var param={
	//								result:location1
	//							};
	//							gameDao.setIsGameNum(rid,location2,0,function(err){
	//								cb(param.result);
	//							});
	//						}else if(paixing1[0]<paixing2[0]){
	//							//金花1点数小于顺子金花2
	//							var param={
	//								result:location2
	//							};
	//							gameDao.setIsGameNum(rid,location1,0,function(err){
	//								cb(param.result);
	//							});
	//						}else{
	//							//金花1点数等于顺子金花2
	//							if(paixing1[1]>paixing2[1]){
	//								var param={
	//									result:location1
	//								};
	//								gameDao.setIsGameNum(rid,location2,0,function(err){
	//									cb(param.result);
	//								});
	//							}else if(paixing1[1]<paixing2[1]){
	//								var param={
	//									result:location2
	//								};
	//								gameDao.setIsGameNum(rid,location1,0,function(err){
	//									cb(param.result);
	//								});
	//							}else{
	//								if(paixing1[2]>paixing2[2]){
	//									var param={
	//										result:location1
	//									};
	//									gameDao.setIsGameNum(rid,location2,0,function(err){
	//										cb(param.result);
	//									});
	//								}else if(paixing1[2]<paixing2[2]){
	//									var param={
	//										result:location2
	//									};
	//									gameDao.setIsGameNum(rid,location1,0,function(err){
	//										cb(param.result);
	//									});
	//								}else if(paixing1[3]>paixing2[3]){
	//									var param={
	//										result:location1
	//									};
	//									gameDao.setIsGameNum(rid,location2,0,function(err){
	//										cb(param.result);
	//									});
	//								}else{
	//									var param={
	//										result:location2
	//									};
	//									gameDao.setIsGameNum(rid,location1,0,function(err){
	//										cb(param.result);
	//									});
	//								}
	//							}
	//						}
	//					}
	//
	//				}
	//
	//			}else if(paiClass1==3){
	//				//都是顺子
	//				if(paixing1[0]>paixing2[0]){
	//					var param={
	//						result:location1
	//					};
	//					gameDao.setIsGameNum(rid,location2,0,function(err){
	//						cb(param.result);
	//					});
	//				}else if(paixing1[0]<paixing2[0]){
	//					var param={
	//						result:location2
	//					};
	//					gameDao.setIsGameNum(rid,location1,0,function(err){
	//						cb(param.result);
	//					});
	//				}else{
	//					//两个顺子点数一样,比花色
	//					if(paixing1[3]>paixing2[3]){
	//						var param={
	//							result:location1
	//						};
	//						gameDao.setIsGameNum(rid,location2,0,function(err){
	//							cb(param.result);
	//						});
	//					}else{
	//						var param={
	//							result:location2
	//						};
	//						gameDao.setIsGameNum(rid,location1,0,function(err){
	//							cb(param.result);
	//						});
	//					}
	//				}
	//			}else if(paiClass1==2){
	//				//都是对子
	//				if(paixing1[1]>paixing2[1]){
	//					var param={
	//						result:location1
	//					};
	//					gameDao.setIsGameNum(rid,location2,0,function(err){
	//						cb(param.result);
	//					});
	//				}else if(paixing1[1]<paixing2[1]){
	//					var param={
	//						result:location2
	//					};
	//					gameDao.setIsGameNum(rid,location1,0,function(err){
	//						cb(param.result);
	//					});
	//				}else{
	//					var param={
	//						result:location1
	//					};
	//					gameDao.setIsGameNum(rid,location2,0,function(err){
	//						cb(param.result);
	//					});
	//				}
	//			}else {
	//				//都是单牌
	//				if(paixing1[0]>paixing2[0]){
	//					var param={
	//						result:location1
	//					};
	//					gameDao.setIsGameNum(rid,location2,0,function(err){
	//						cb(param.result);
	//					});
	//				}else if(paixing1[0]<paixing2[0]){
	//					var param={
	//						result:location2
	//					};
	//					gameDao.setIsGameNum(rid,location1,0,function(err){
	//						cb(param.result);
	//					});
	//				}else {
	//					if(paixing1[1]>paixing2[1]){
	//						var param={
	//							result:location1
	//						};
	//						gameDao.setIsGameNum(rid,location2,0,function(err){
	//							cb(param.result);
	//						});
	//					}else if(paixing1[1]<paixing2[1]){
	//						var param={
	//							result:location2
	//						};
	//						gameDao.setIsGameNum(rid,location1,0,function(err){
	//							cb(param.result);
	//						});
	//					}else{
	//						if(paixing1[2]>paixing2[2]){
	//							var param={
	//								result:location1
	//							};
	//							gameDao.setIsGameNum(rid,location2,0,function(err){
	//								cb(param.result);
	//							});
	//						}else {
	//							var param={
	//								result:location2
	//							};
	//							gameDao.setIsGameNum(rid,location1,0,function(err){
	//								cb(param.result);
	//							});
	//						}
	//					}
	//				}
	//
	//			}
	//		}
	//
	//		gameDao.nextCurPlayer(rid,function(err,new_loc){
	//			//出牌定时，重置定时器
	//			delayDao.removeDelay(rid,function(){
	//				console.log("bipai:removeDelay success");
	//				setTimeout(function(){
	//					gameLogicRemote.changeCurPlayer(rid,new_loc,channel);
	//					delayDao.addDelay(rid,10,function(){
	//						console.log("bipai:addDelay success");
	//					});
	//				},4800);
	//			});
	//			console.log("nextCurPlayer success");
	//		});
	//	});
	//});
};

/**
 * 输入牌json进行预处理排序（点数以及花色按从大到小排序）
 * */
gameLogicRemote.sortPai = function(paixing1){
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
 * 判断牌型（5豹子 4金花 3顺子 2对子 1单牌）
 * 输入参数为经过排序函数sortPai处理以后的牌型数组
 * */
gameLogicRemote.classPai = function(paiArray){
	var kind = 1;
	if(paiArray[0]==paiArray[1]&&paiArray[1]==paiArray[2]){
		kind = 5;
	}else if(paiArray[3]==paiArray[4]&&paiArray[4]==paiArray[5]){
		kind = 4;
	}else if((paiArray[0]-paiArray[1])==1&&(paiArray[1]-paiArray[2])==1){
		kind = 3;
	}else if(paiArray[0]==paiArray[1]||paiArray[1]==paiArray[2]){
		kind = 2;
	}else {
		//console.log("hehehehehehehe");
		kind = 1;
	}
	return kind;
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
			gameLogicRemote.bipai(rid,location,channel,channelService);
		},1000);
	});
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


