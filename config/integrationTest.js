require('events').EventEmitter.prototype._maxListeners = 100;

const config = {
	redis: {},
	logging: {}
};

config.logging = {
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true
		}
	},
	enabled: false,
	level: 'info'
};

config.redis = {
	connection: 'redis://localhost:6380/'
};

module.exports = config;
