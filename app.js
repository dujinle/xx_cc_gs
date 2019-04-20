var fs = require('fs');
var pomelo = require('pomelo');
var routeUtil = require('./app/util/routeUtil');
var cache     = require('memory-cache');
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'xx_cc_gs-server');
app.set('cache',cache);
app.configure('production|development',function () {
	var mysql = require('./config/mysql');
	app.set('mysql',mysql[app.get('env')]);
});

// app configuration
app.configure('production|development', 'connector', function(){
	app.set('connectorConfig',
		{
			connector : pomelo.connectors.hybridconnector,
			heartbeat : 30,
			useDict : true,
			useProtobuf : true,
			ssl: {
				type: 'wss',
				key: fs.readFileSync('../shared/server.key'),
				cert: fs.readFileSync('../shared/server.crt')
			}
		});
});

app.configure('production|development', 'gate|login', function(){
	app.set('connectorConfig',
		{
			connector : pomelo.connectors.hybridconnector,
			useProtobuf : true,
			useDict : true,
			ssl: {
				type: 'wss',
				key: fs.readFileSync('../shared/server.key'),
				cert: fs.readFileSync('../shared/server.crt')
			}
		});
});

// app configure
app.configure('production|development', function() {
	// route configures
	app.route('chat', routeUtil.chat);
	app.route('game', routeUtil.game);
    app.route('login', routeUtil.user);
    app.route('broadcast', routeUtil.broadcast);
//	app.route('sign',routeUtil.sign);
//	app.route('payInfo',routeUtil.payInfo);
	// filter configures
	app.filter(pomelo.timeout());
});


app.configure('production|development', 'game|chat|connector|components|user|auth|login|broadcast',function(){
	var dbclient = require('./app/dao/mysql/mysql').init(app);
	app.set('dbclient', dbclient);
});

app.configure('production|development', 'game', function () {
	var Listenner = require('./app/components/handler/listenner');
	app.load(Listenner, {interval: 1000});
	//app.load(timeoutHandler, {interval: 1000});
});


// start app
app.start();

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});
