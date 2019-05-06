drop database if exists paijiu_data;
create database paijiu_data character set utf8;
use paijiu_data
CREATE TABLE game_broadcast(_id INT PRIMARY KEY AUTO_INCREMENT, broadcast_type INT, broadcast_content VARCHAR(120)NOT NULL);

INSERT INTO game_broadcast  (broadcast_type,broadcast_content) VALUES (1,'你大爷的坑死老子了');

CREATE TABLE paijiu(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	paixing VARCHAR(32),\
	score INT DEFAULT 0,\
	name VARCHAR(64)\
);

CREATE TABLE paijiu_xuan(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	paixing VARCHAR(32),\
	score INT DEFAULT 0,\
	name VARCHAR(64)\
);

CREATE TABLE paijiu_gui(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	paixing VARCHAR(32),\
	score INT DEFAULT 0,\
	name VARCHAR(64)\
);

CREATE TABLE player(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	player_id VARCHAR(32),\
	phone_num VARCHAR(20),\
	nick_name VARCHAR(64),\
	head_img_url VARCHAR(256),\
	sex        INT DEFAULT 0,\
	gold        INT DEFAULT 0,\
	fangka_num INT DEFAULT 0,\
	round_num INT DEFAULT 0,\
	all_score INT DEFAULT 0,\
	win_num INT DEFAULT 0,\
	lose_num INT DEFAULT 0,\
	fangka_history INT DEFAULT 0,\
	invalid_fangka INT DEFAULT 0,\
	gonghui_id VARCHAR(12),\
	loginCount INT DEFAULT 0,\
	createTime BIGINT,\
	continueLoginDays INT,\
	lastLoginTime BIGINT\
);

CREATE TABLE buy_fangka(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	order_id   VARCHAR(32),\
	player_id  INT,\
	fangka_num INT,\
	gold       INT,\
	status     INT,\
	creat_time BIGINT,\
	pay_time   BIGINT,\
	gold_danjia FLOAT DEFAULT 1.0,\
	danjia     FLOAT DEFAULT 2.0,\
	zongjia    FLOAT\
);

CREATE TABLE game_history(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	player_id  INT,\
	renshu     INT DEFAULT 0,\
	status     INT,\
	use_fangka INT DEFAULT 0,\
	game_status INT,\
	creat_time  BIGINT,\
	room_num   INT\
);

CREATE TABLE gonghui(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	gonghui_id  VARCHAR(16),\
	player_id   INT,\
	player_name VARCHAR(64),\
	renshu      INT,\
	telphone    VARCHAR(20),\
	level       INT,\
	fangka_num  INT,\
	danjia      FLOAT,\
	gonghui_name VARCHAR(64),\
	gonggao     VARCHAR(240),\
	xuanyan     VARCHAR(240)\
);

CREATE TABLE xufangka(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	gonghui_id  INT,\
	player_id   INT,\
	phone_num   VARCHAR(20),\
	player_name VARCHAR(64),\
	creat_time  BIGINT,\
	xuaka_status INT\
);

CREATE TABLE gonghui_ans(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	player_id    INT,\
	player_name  VARCHAR(64),\
	telphone     VARCHAR(20),\
	gonghui_name VARCHAR(64),\
	level        INT,\
	money        FLOAT,\
	creat_time   BIGINT,\
	status       INT\
);

CREATE TABLE feedback(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	playerId INT,\
	title VARCHAR(120),\
	content VARCHAR(480)\
);


CREATE TABLE game_room(
	rid INT PRIMARY KEY AUTO_INCREMENT,\
	room_num VARCHAR(6),\
	fangzhu_id INT,\
	fangzhu_name VARCHAR(64),\
	first_fapai INT DEFAULT 0,\
	game_type VARCHAR(10),\
	max_type  INT,\
	fangka_num INT,\
	fangka_type INT,\
	wait_time INT DEFAULT 0,\
	creat_time BIGINT,\
	timeout_mark BIGINT,\
	player_num INT DEFAULT 0,\
	real_num   INT DEFAULT 0,\
	zhuang_location INT,\
	zhuang_score    INT DEFAULT 100,\
	round INT DEFAULT 0,\
	cur_turn INT DEFAULT 0,\
	qieguo   INT DEFAULT 0,\
	qieguo_flag INT DEFAULT 0,\
	qiang_num  INT DEFAULT 0,\
	qiang_flag VARCHAR(120) DEFAULT '[]',\
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
);
