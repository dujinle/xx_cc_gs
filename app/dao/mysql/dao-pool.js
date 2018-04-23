/**
 * Created by wuningjian on 2/1/16.
 */
var _poolModule = require('generic-pool');
/*
 * Create mysql connection pool.
 */
var createMysqlPool = function(app) {
    var mysqlConfig = app.get('mysql');
//	console.log(__filename,mysqlConfig);
    return _poolModule.Pool({
        name: 'mysql',
        create: function(callback) {
            var mysql = require('mysql');
            var client = mysql.createConnection({
                host: mysqlConfig.host,
				port: mysqlConfig.port,
                user: mysqlConfig.user,
                password: mysqlConfig.password,
                database: mysqlConfig.database,
				charset: mysqlConfig.charset
            });//创建连接实例

            callback(null, client);//创建完以后要把client回传给callback
        },
        destroy: function(client) {
            client.end();
        },//当超时则释放连接句柄client
        max: 10,
        idleTimeoutMillis : 30000,
        log : false
    });
};

exports.createMysqlPool = createMysqlPool;
