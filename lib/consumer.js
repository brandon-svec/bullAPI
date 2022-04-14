const async = require('async');
const config = require('config');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

const queueFactory = require(path.resolve('lib', 'queueFactory'));

const log = pino(config.get('logging'));

const consumerList = {};

module.exports = {
	Init,
	Exists,
	GetSchema,
	GenerateWorkHandler
};

function Init (cb) {
	queueFactory.Init(function (err) {
		if (err) {
			return cb(err);
		}

		fs.readdir(path.resolve('lib', 'consumers'), (err, fileList) => {
			if (err) {
				return cb(err);
			}

			async.eachLimit(fileList, 1, initializeConsumer, cb);
		});
	});
}

function Exists (name) {
	return (consumerList[name] !== undefined);
}

function initializeConsumer (file, cb) {
	let name;
	try {
		const consumer = require(path.resolve('lib', 'consumers', file));
		name = file.slice(0, -3);
		const queue = queueFactory.GetQueue(name);

		consumer.Init(function (err) {
			if (err) {
				log.error({ Queue: queue, Error: err.message }, 'Failed to Initialize Consumer');
				return cb(err);
			}

			queue.process(config.get('bull.consumer.batchSize'), GenerateWorkHandler(name, consumer));

			consumerList[name] = consumer;
			log.debug({ Queue: name }, 'Consumer Initialized');
			return cb();
		});
	} catch (err) {
		log.error({ Queue: name, Error: err.message }, 'Failed to Initialize Consumer');
		return cb(err);
	}
}

function GetSchema (name) {
	if (!Exists(name)) {
		return null;
	}

	return consumerList[name].GetSchema();
}

function GenerateWorkHandler (name, consumer) {
	// This function does not need to be externally facing; however, for testing it is required :(
	return function (jobObj, cb) {
		try {
			consumer.ProcessWork(jobObj, function (err) {
				if (err) {
					if (err.isUserError === true) {
						throw err;
					}

					if (jobObj.attemptsMade == jobObj.opts.attempts - 1) {
						throw new Error('Reached Maximum Retry Attempts');
					}

					log.warn({ Error: err.message, Envelope: jobObj.data, Queue: name, AttemptsMade: jobObj.attemptsMade, DelaySec: (jobObj.processedOn - jobObj.timestamp - jobObj.opts.delay) / 1000, TimeTakenSec: (Date.now() - jobObj.processedOn) / 1000 }, 'Consumer Work Failed. Retrying...');
					return cb(err);
				}

				log.info({ Queue: name, DelaySec: (jobObj.processedOn - jobObj.timestamp - jobObj.opts.delay) / 1000, TimeTakenSec: (Date.now() - jobObj.processedOn) / 1000 }, 'Consumer Work Processed');
				return cb();
			});
		} catch (err) {
			log.error({ Error: err.message, Envelope: jobObj.data, Queue: name, DelaySec: (jobObj.processedOn - jobObj.timestamp - jobObj.opts.delay) / 1000, TimeTakenSec: (Date.now() - jobObj.processedOn) / 1000 }, 'Consumer Work Unrecoverable Error');
			return cb(); // Remove from queue
		}
	};
}
