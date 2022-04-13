// Imports

// General

var config = {};

config.name = 'jobScheduler';

// HTTP Proxy

config.http = {};

config.http.port = process.env.PORT || 3000;
config.http.timeout = 120000;
config.http.keepAliveTimeoutMS = 60000;
config.http.server = '127.0.0.1';

// SSL
config.ssl = null;

// ** Logging

config.logging = {
	enabled: true
};

// ** Instrumental

config.statsD = null;

// ** Redis

config.redis = {
	connection: '',
	url: '',
	options: {
	}
};

// ** Actions

config.actions = {

};

// ** Bull

config.bull = {
	queueFactory: {
		default: {
			settings: {
				backoffStrategies: {
					jitter: function () {
						return 5000 + Math.random() * 500;
					},
					exponential: function (attemptsMade) {
						const delay = (5000 * attemptsMade) + (Math.random() * 5000);
						if (delay > 300000) {
							return 300000;
						}

						return delay;
					}
				}
			}
		},
		queue: {
		}
	},
	consumer: {
		default: {
			attempts: 3
		},
		queue: {
			myQueue: {
				attempts: 100
			}
		}    
	}
};

// Export

module.exports = config;
