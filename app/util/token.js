var crypto = require('crypto');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var parse;
/**
 * Create token by uid. Encrypt uid and timestamp to get a token.
 * 
 * @param  {String} uid user id
 * @param  {String|Number} timestamp
 * @param  {String} pwd encrypt password
 * @return {String}     token string
 */
module.exports.create = function(player_id, timestamp, pwd) {
    logger.info('create token uid ',player_id);
	var msg = player_id + '|' + timestamp;
	var cipher = crypto.createCipher('aes-256-cbc', pwd);
	var enc = cipher.update(msg, 'utf8', 'hex');
	enc += cipher.final('hex');
    logger.info('token.js token -> ',enc);
	return enc;
};

function decry(token){

    var res =parse(token,"secret");
    logger.info(res);
}

/**
 * Parse token to validate it and get the uid and timestamp.
 * 
 * @param  {String} token token string
 * @param  {String} pwd   decrypt password
 * @return {Object}  uid and timestamp that exported from token. null for illegal token.     
 */
module.exports.parse = function(token, pwd) {
	var decipher = crypto.createDecipher('aes-256-cbc', pwd);
	var dec;
	try {
		dec = decipher.update(token, 'hex', 'utf8');
		dec += decipher.final('utf8');
	} catch(err) {
		logger.error('[token] fail to decrypt token. %j', token);
		return null;
	}
	var ts = dec.split('|');
	if(ts.length !== 2) {
		return null;
	}
    logger.info('解码player_id --- '+ts[0]+' '+ts,'timestamp '+ts[1]);
	return {player_id: ts[0], timestamp: Number(ts[1])};
};
//var token = require('./token.js');
//var res = token.create(1,Date.now(),'secret')
//token.parse(res,'secret')
