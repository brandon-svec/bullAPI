const config = require('config');
var memoize = require('memoizee');
const Redis = require('ioredis');

let client;
let memoize_init = memoize(init);

module.exports = {
	GetClient,
	Init: memoize_init
};

function GetClient () {
	if (!client) {
		throw new Error('Redis Client Not Initialized!');
	}

	return client;
}

function init (cb) {
	let redisConfig = Object.assign(config.get('redis.options'), {
		enableOfflineQueue: false,
		enableReadyCheck: true,
		lazyConnect: true
	});

	client = new Redis(config.get('redis.connection'), redisConfig);

	client.on('ready', cb);

	client.connect(function (err) {
		if (err) {
			client.disconnect();
			return cb(err);
		}
	});
}
