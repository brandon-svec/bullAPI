// External
const http = require('http');
const https = require('https');
const pino = require('pino');
const fs = require('fs');
const async = require('async');
const config = require('config');
const path = require('path');

// Internal

const consumer = require(path.resolve('lib', 'consumer'));
const scheduler = require(path.resolve('lib', 'scheduler'));
const webServerConfig = require('./lib/webserver');
const queueFactory = require(path.resolve('lib', 'queueFactory'));

// Global

const log = pino(config.get('logging'));

// Express

var app = webServerConfig.GetWebServerConfig(config, log);

var server = null;

// Start

init();

// Functions

function init () {
	log.info('Starting Service...');

	async.waterfall([
		initConsumer,
		initScheduler,
		initHTTPserver
	],
	function (err) {
		if (err) {
			log.fatal('Service Failed to Start');
		} else {
			log.info('Service Started');
		}
	});
}

function initScheduler (cb) {
	scheduler.Init(function (err) {
		if (err) {
			log.fatal({ Error: err.message }, 'Scheduler Initialization Failed');
			return cb(err);
		}

		log.info('Scheduler Initialized');
		return cb();
	});
}

function initConsumer (cb) {
	consumer.Init(function (err) {
		if (err) {
			log.fatal({ Error: err.message }, 'Consumer Initialization Failed');
			return cb(err);
		}

		log.info('Consumer Initialized');
		return cb();
	});
}

function initHTTPserver (cb) {
	if (server) {
		server.close();
	}

	// SSL HTTP Server
	var sslOptions = null;
	if (config.get('ssl')) {
		sslOptions = {
			pfx: fs.readFileSync(config.get('ssl.pfx')),
			passphrase: config.get('ssl.passphrase')
		};
	}

	if (sslOptions) {
		server = https.createServer(sslOptions, app);
	} else {
		server = http.createServer(app);
	}

	server.listen(config.get('http.port'), config.get('http.server'), function (err) {
		if (err) {
			log.error({ Error: err }, 'HTTP Server Failure');
		} else {
			log.info('HTTP Server Success');
		}

		return cb(err);
	});
	server.timeout = 0;
}

process.on('SIGINT', () => {
	async.waterfall([
		queueFactory.Shutdown
	],
	function (err) {
		if (err) {
			return log.fatal({ Error: err.message }, 'Failed to Complete Graceful Shutdown');
		}

		log.info('Graceful Shutdown Complete');
		return process.exit(0);
	});
});
