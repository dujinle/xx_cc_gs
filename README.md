# 游戏服务端
基于node&pomelo 框架开发游戏服务端系统
房间数据库信息描述
	rid INT PRIMARY KEY AUTO_INCREMENT, 			房间ID
	room_num VARCHAR(6),							房间号（6位数值）
	fangzhu_id INT,\								房主的ID
	fangzhu_name VARCHAR(64),\						房主的名称
	first_fapai INT DEFAULT 0,\						第一个发牌的玩家位置
	game_type VARCHAR(10),\							游戏类型 1，2，3
	max_type  INT,\									游戏最大类型
	cur_player INT,\								当前玩家位置
	mingpai_flag INT,\								名牌标记
	lun_zhuang INT DEFAULT 0,\						轮庄
	creat_time BIGINT,\								创建时间
	timeout_mark INT DEFAULT 0,\					标记超时玩家
	player_num INT DEFAULT 0,\
	real_num   INT DEFAULT 0,\
	zhuang_location INT,\
	zhuang_score    INT DEFAULT 100,\
	round INT DEFAULT 0,\
	cur_turn INT DEFAULT 0,\
	qieguo   INT DEFAULT 0,\
	location1 VARCHAR(20) DEFAULT 'null',\
	location2 VARCHAR(20) DEFAULT 'null',\
	location3 VARCHAR(20) DEFAULT 'null',\
	location4 VARCHAR(20) DEFAULT 'null',\
	is_gaming INT DEFAULT 0,\
	peipai_num INT DEFAULT 0,\
	pai1 VARCHAR(240),\
	pai2 VARCHAR(240),\
	pai3 VARCHAR(240),\
	pai4 VARCHAR(240),\
	left_score_1 INT DEFAULT 0,\
	left_score_2 INT DEFAULT 0,\
	left_score_3 INT DEFAULT 0,\
	left_score_4 INT DEFAULT 0,\
	is_game_1 INT DEFAULT 0,\
	is_game_2 INT DEFAULT 0,\
	is_game_3 INT DEFAULT 0,\
	is_game_4 INT DEFAULT 0,\
	score_1 VARCHAR(20),\
	score_2 VARCHAR(20),\
	score_3 VARCHAR(20),\
	score_4 VARCHAR(20)\