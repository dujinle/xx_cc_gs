var dispatcher = require('../../../util/dispatcher');
var Code = require('../../../consts/code');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.queryEntry = function(msg, session, next) {
	var uid = msg.uid;
	var connectors = this.app.getServersByType('connector');
	logger.info('go into queryEntry:' + JSON.stringify(connectors));
	if(!connectors || connectors.length === 0) {
		next(null, {code: Code.FA_NO_SERVER_AVAILABLE,msg:Code.CODEMSG.GATE.FA_NO_SERVER_AVAILABLE});
		return;
	}
	// select connector
	var res = connectors[0];//dispatcher.dispatch(uid, connectors); // select a connector from all the connectors
	// do something with res
	next(null, {
		code: Code.OK,
		host: res.host,
		port: res.clientPort
	});
};
