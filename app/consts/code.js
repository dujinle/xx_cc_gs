module.exports = {
	OK: 200, 
	FAIL: 500, 
	SQL_ERROR:111,
	SQL_NULL:112,
	FILTER:120,

	LOGIN:{
		FA_LOGIN_INVALID:	0001,
		FA_LOGIN_SQLERROR:	0002,
		FA_LOGIN_SIGNATURE:	0003,
	},
	CONNECTOR: {
		FA_TOKEN_INVALID: 	1001, 
		FA_TOKEN_EXPIRE: 	1002, 
		FA_USER_NOT_EXIST: 	1003,
        FA_TOKEN_ILLEGAL:   1004,
		FK_CREATE_NOMORE:	1005,
	}, 

	GATE: {
		FA_NO_SERVER_AVAILABLE: 2001
	}, 

	CHAT: {
		FA_CHANNEL_CREATE: 		3001, 
		FA_CHANNEL_NOT_EXIST: 	3002, 
		FA_UNKNOWN_CONNECTOR: 	3003, 
		FA_USER_NOT_ONLINE: 	3004 
	},
	USER: {
		CHECKGH:4001,
		CHECK_GH_ZHANG_FAILD:	4002
		
	},
	CODEMSG:{
		COMMON:{
			SQL_NULL:'请求的数据为空',
			GONGGAO_NULL:'暂无公告！'
		},
		LOGIN:{
			SUCCESS:'登录成功！'
		},
		GATE:{
			FA_NO_SERVER_AVAILABLE:'没有可以使用的服务器！'
		},
		CONNECTOR:{
			FA_TOKEN_INVALID:'无效的token,请重新登录!',
			FA_TOKEN_EXPIRE:'token已经过期,请重新登录!',
			FK_ENTER_NOMORE:'房卡不够用无法进入游戏，请充值房卡！',
			FK_CREATE_NOMORE:'房卡数量不够，请尽快去充值!',
			FK_CREATE_SUCCESS:'创建房间成功！',
			GD_ENTER_NOMORE:'没有金币无法进入游戏，请充值金币！',
			CO_ENTER_ROOM_EMPTY:'没有找到房间信道！',
			CO_ENTER_ROOM_FAIL:'本局游戏已经结束，房间已经解散，无法进入房间！',
			CO_ENTER_ROOM_SUCCESS:'进入房间成功',
			CO_ENTER_ROOM_BLONG:'位置已经被占用！',
			CO_ENTER_ROOM_ZHUANG:'其他位置无法进入，只可以进入庄家位置!',
			CO_LEAVE_ROOM_OK:'离开房间成功'
		},
		USER:{
			CHECK_GH_ZHANG_FAILD:'您不是公会会长，无法进行房间的创建！',
			FIND_GH_NULL:'没有找到对应的公会信息',
			WAIT_GH_XUKA:'申请续卡已经提交，等待工作人员确认信息。',
			UPDATE_GH_INFO:'公会信息更新完成'
		}
	}
};
