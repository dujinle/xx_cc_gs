module.exports = {
	OK: 200, 
	FAIL: 500, 
	SQL_ERROR:111,

	LOGIN:{
		FA_LOGIN_INVALID:	0001,
		FA_LOGIN_SQLERROR:	0002,
		FA_LOGIN_SIGNATURE:	0003,
	},
	ENTRY: {
		FA_TOKEN_INVALID: 	1001, 
		FA_TOKEN_EXPIRE: 	1002, 
		FA_USER_NOT_EXIST: 	1003,
        FA_TOKEN_ILLEGAL:   1004
	}, 

	GATE: {
		FA_NO_SERVER_AVAILABLE: 2001
	}, 

	CHAT: {
		FA_CHANNEL_CREATE: 		3001, 
		FA_CHANNEL_NOT_EXIST: 	3002, 
		FA_UNKNOWN_CONNECTOR: 	3003, 
		FA_USER_NOT_ONLINE: 	3004 
	}
};
