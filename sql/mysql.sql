drop database if exists chat;
create database chat character set utf8;
use chat
CREATE TABLE game_broadcast(_id INT PRIMARY KEY AUTO_INCREMENT, broadcast_type INT, broadcast_content VARCHAR(120)NOT NULL);

INSERT INTO game_broadcast  (broadcast_type,broadcast_content) VALUES (1,'你大爷的坑死老子了');

CREATE TABLE user(userId INT PRIMARY KEY AUTO_INCREMENT,\
	phone_num VARCHAR(20),\
	name VARCHAR(20),\
	password VARCHAR(20) DEFAULT 0,\
	imei VARCHAR(36),\
	loginCount INT DEFAULT 0,\
	lastLoginTime BIGINT\
);

CREATE TABLE player(playerId INT PRIMARY KEY AUTO_INCREMENT,\
	userName VARCHAR(20),\
	nickName VARCHAR(20),\
	phone_num VARCHAR(20),\
	password VARCHAR(20) DEFAULT 0,\
	signature VARCHAR(120) DEFAULT '你大爷的坑死老子了',\
	userId INT DEFAULT 1,\
	fangka INT DEFAULT 10,\
	gender INT DEFAULT 1,\
	level INT DEFAULT 0,\
	vip INT DEFAULT 0,\
	playTimes INT DEFAULT 0,\
	winTimes INT DEFAULT 0,\
	loseTimes INT DEFAULT 0,\
	portrait INT DEFAULT 0,\
	recharge float DEFAULT 0.0,\
	tree INT DEFAULT 0,\
	createTime BIGINT,\
	continueLoginDays INT DEFAULT 0,\
	status INT DEFAULT 0,\
	huanPaiKa INT DEFAULT 0,\
	fanBeiKa INT DEFAULT 0,\
	jinBiKa INT DEFAULT 0,\
	gift01 float(25) DEFAULT 0.0,\
	gift02 float(25) DEFAULT 0.0,\
	gift03 float(25) DEFAULT 0.0,\
	gift04 float(25) DEFAULT 0.0,\
	gift05 float(25) DEFAULT 0.0,\
	gold float(25) DEFAULT 0.0,\
	diamond float(25) DEFAULT 0.0\
);

CREATE TABLE feedback(
	id INT PRIMARY KEY AUTO_INCREMENT,\
	playerId INT,\
	title VARCHAR(120),\
	content VARCHAR(480)\
);

CREATE TABLE task(
	taskId INT PRIMARY KEY AUTO_INCREMENT,\
	playerId INT,\
	userId INT,\
	loginTimes INT,\
	playTimes INT,\
	winTimes INT,\
	allInTimes INT,\
	useHuanpaika INT,\
	useJinbika INT,\
	useFanbeika INT,\
	monthRecharge float(25)\
);

CREATE TABLE zjh_game_room(
	rid INT PRIMARY KEY AUTO_INCREMENT,\
	room_num VARCHAR(6),\
	master INT,\
	first_fapai INT DEFAULT 0,\
	max_pai VARCHAR(20) DEFAULT '0*0',\
	master_name VARCHAR(20),\
	game_type VARCHAR(10),\
	winner VARCHAR(10) DEFAULT 'null',\
	timeout_mark BIGINT,\
	open_mark INT DEFAULT 0,\
	men_mark INT DEFAULT 0,\
	player_num INT DEFAULT 0,\
	current_chip INT DEFAULT 0,\
	current_player INT DEFAULT 0,\
	basic_chip INT DEFAULT 100,\
	all_chip INT DEFAULT 0,\
	start_golds VARCHAR(240) DEFAULT 'null',\
	round INT DEFAULT 0,\
	total_round INT DEFAULT 0,\
	location1 VARCHAR(20) DEFAULT 'null',\
	location2 VARCHAR(20) DEFAULT 'null',\
	location3 VARCHAR(20) DEFAULT 'null',\
	location4 VARCHAR(20) DEFAULT 'null',\
	location5 VARCHAR(20) DEFAULT 'null',\
	is_gaming INT DEFAULT 0,\
	is_game_1 INT DEFAULT -1,\
	is_game_2 INT DEFAULT -1,\
	is_game_3 INT DEFAULT -1,\
	is_game_4 INT DEFAULT -1,\
	is_game_5 INT DEFAULT -1,\
	pai1 VARCHAR(240),\
	pai2 VARCHAR(240),\
	pai3 VARCHAR(240),\
	pai4 VARCHAR(240),\
	pai5 VARCHAR(240)\
);

CREATE TABLE tdk_game_room(
	rid INT PRIMARY KEY AUTO_INCREMENT,\
	room_num VARCHAR(6),\
	master INT,\
	fapai_num INT DEFAULT 3,\
	quchu_pai INT DEFAULT 0,\
	first_fapai INT DEFAULT 0,\
	max_pai VARCHAR(20) DEFAULT '0*0',\
	pai_round INT DEFAULT 0,\
	master_name VARCHAR(20),\
	game_type VARCHAR(10),\
	winner VARCHAR(10) DEFAULT 'null',\
	timeout_mark BIGINT,\
	open_mark INT DEFAULT 0,\
	player_num INT DEFAULT 0,\
	current_chip INT DEFAULT 0,\
	current_player INT DEFAULT 0,\
	basic_chip INT DEFAULT 100,\
	all_chip INT DEFAULT 0,\
	round INT DEFAULT 0,\
	start_golds VARCHAR(240) DEFAULT 'null',\
	total_round INT DEFAULT 0,\
	location1 VARCHAR(20) DEFAULT 'null',\
	location2 VARCHAR(20) DEFAULT 'null',\
	location3 VARCHAR(20) DEFAULT 'null',\
	location4 VARCHAR(20) DEFAULT 'null',\
	location5 VARCHAR(20) DEFAULT 'null',\
	is_gaming INT DEFAULT 0,\
	is_game_1 INT DEFAULT 0,\
	is_game_2 INT DEFAULT 0,\
	is_game_3 INT DEFAULT 0,\
	is_game_4 INT DEFAULT 0,\
	is_game_5 INT DEFAULT 0,\
	pai1 VARCHAR(240),\
	pai2 VARCHAR(240),\
	pai3 VARCHAR(240),\
	pai4 VARCHAR(240),\
	pai5 VARCHAR(240)\
);

CREATE TABLE zhq_game_room(
	rid INT PRIMARY KEY AUTO_INCREMENT,\
	room_num VARCHAR(6),\
	master INT,\
	first_fapai INT DEFAULT 0,\
	first_finish INT DEFAULT 0,\
	master_name VARCHAR(20),\
	game_type VARCHAR(10),\
	timeout_mark BIGINT,\
	player_num INT DEFAULT 0,\
	all_player_num INT DEFAULT 4,\
	mark_flag VARCHAR(120) DEFAULT 'null',\
	current_chip INT DEFAULT 0,\
	current_player INT DEFAULT 0,\
	basic_chip INT DEFAULT 100,\
	max_chip INT DEFAULT 100,\
	tian_xuan INT DEFAULT 0,\
	start_golds VARCHAR(240) DEFAULT 'null',\
	round INT DEFAULT 0,\
	total_round INT DEFAULT 0,\
	hei_a VARCHAR(20) DEFAULT 'null',\
	location1 VARCHAR(20) DEFAULT 'null',\
	location2 VARCHAR(20) DEFAULT 'null',\
	location3 VARCHAR(20) DEFAULT 'null',\
	location4 VARCHAR(20) DEFAULT 'null',\
	location5 VARCHAR(20) DEFAULT 'null',\
	is_gaming INT DEFAULT 0,\
	is_game_1 INT DEFAULT 0,\
	is_game_2 INT DEFAULT 0,\
	is_game_3 INT DEFAULT 0,\
	is_game_4 INT DEFAULT 0,\
	is_game_5 INT DEFAULT 0,\
	throw_num INT DEFAULT 0,\
	pai1 VARCHAR(240) DEFAULT 'null',\
	pai2 VARCHAR(240) DEFAULT 'null',\
	pai3 VARCHAR(240) DEFAULT 'null',\
	pai4 VARCHAR(240) DEFAULT 'null',\
	pai5 VARCHAR(240) DEFAULT 'null',\
	last_location INT DEFAULT 0,\
	last_pai VARCHAR(240) DEFAULT 'null'\
);
