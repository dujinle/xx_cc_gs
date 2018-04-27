/**
 * Created by WTF on 2016/2/26.
 */

/**
 *
 * @param opts
 * @constructor
 */

var Player = function(opts){
    this.id = opts.id;      //玩家id  角色id
    this.player_id = opts.player_id;          //wx用户id
	this.phone_num = opts.phone_num;
    this.nick_name = opts.nick_name;
	this.fangka_num = opts.fangka_num;
	this.head_img_url = opts.head_img_url;
    this.gender = opts.sex;          //性别
    this.createTime = opts.createTime;  //
	this.round_num = opts.round_num;
	this.all_score = opts.all_score;
	this.win_num = opts.win_num;
	this.lose_num = opts.lose_num;
	this.fangka_history = opts.fangka_history;
	this.invalid_fangka = opts.invalid_fangka;
	this.gonghui_id = opts.gonghui_id;
	this.lastLoginTime = opts.lastLoginTime;
	this.continueLoginDays = opts.continueLoginDays;
};

module.exports = Player;
