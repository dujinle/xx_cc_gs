var dispatcher = require('../../../util/dispatcher');

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
	console.log('go into queryEntry:' + JSON.stringify(connectors));
	if(!connectors || connectors.length === 0) {
		next(null, {
			code: 500
		});
		return;
	}
	// select connector
	var res = connectors[0];//dispatcher.dispatch(uid, connectors); // select a connector from all the connectors
	// do something with res
	var host = this.app.get('aroute');
	console.log("get host route:" + host);
	next(null, {
		code: 200,
		host: host,
		port: res.clientPort
	});
};
