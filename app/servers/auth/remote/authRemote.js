var tokenService = require('../../../util/token');
var playerDao      = require('../../../dao/playerDao');
var Code         = require('../../../consts/code');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

var DEFAULT_SECRET = 'secret';
//var DEFAULT_EXPIRE = 6 * 60 * 60 * 1000;	// default session expire time: 6 hours
var DEFAULT_EXPIRE = 0.5 * 60 * 60 * 1000;	// default session expire time: 6 hours

module.exports = function (app) {
    return new Remote(app);
};

var Remote = function (app) {
    this.app    = app;
    var session = app.get('session') || {};
    this.secret =  DEFAULT_SECRET;
    this.expire =  DEFAULT_EXPIRE;
};

var remote = Remote.prototype;

/**
 * Auth token and check whether expire.
 *
 * @param  {String}   token token string
 * @param  {Function} cb
 * @return {Void}
 */
remote.auth = function (token, cb) {
    //token由uid Date.now() 加密密码  加密而成
    //解析token得出uid 和Date.now()  res包含uid和timestamp {uid: ts[0], timestamp: Number(ts[1])}
    logger.info('传入token  '+ token);
    var res = tokenService.parse(token, DEFAULT_SECRET);
    if (!res) {
        logger.error("非法的token");
        cb(new Error('非法的token'));
        return;
    }

    logger.info('auth res ==',JSON.stringify(res));

    //验证token是否在6小时内生成

    if (!checkExpire(res, this.expire)) {
        logger.info("token过期");
        cb(new Error("token过期"));
        return;
    }

    logger.info('authRemote 解密出playerid',res.player_id);
    playerDao.get_player_by_id(res.player_id, function (err, player) {
        if (err) {
            logger.error('auth getplayerbyid err' + err);
            cb(new Error(err));
            return;
        }
        cb(null,player);
    });
};

/**
 * Check the token whether expire.
 *
 * @param  {Object} token  token info
 * @param  {Number} expire expire time
 * @return {Boolean}        true for not expire and false for expire
 */
var checkExpire = function (token, expire) {
    if (expire < 0) {
        // negative expire means never expire
        return true;
    }

    return (Date.now() - token.timestamp) < expire;
};
