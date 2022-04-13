const async = require('async');
const config = require('config');
const path = require('path');
const pino = require('pino');

// const cronGenerator = require(path.resolve('lib', 'cronGenerator'));
const EnhancedError = require(path.resolve('lib', 'EnhancedError'));
const queueFactory = require(path.resolve('lib', 'queueFactory'));

const log = pino(config.get('logging'));

module.exports = {
	AddSingleJob,
	AddFutureJob,
	AddRepeatingJob,
	DeleteRepeatingJob,
	GetRepeatingJob,
	GetRepeatingJobs,
	Init
};

function AddSingleJob (queue, name, payload, cb) {
	let options = {
		jobId: name
	};

	queueJob(queue, payload, options, function (err) {
		if (err) {
			log.error({ Error: err.message, err, Queue: queue, JobId: name }, 'Add Single Job Failed');
			return cb(err);
		}

		log.info({ Queue: queue, JobId: name }, 'Add Single Job Success');
		return cb();
	});
}

function AddFutureJob (queue, name, payload, delay, cb) {
	let options = {
		jobId: name,
		delay: delay * 1000
	};

	queueJob(queue, payload, options, function (err) {
		if (err) {
			log.error({ Error: err.message, err, Queue: queue, JobId: name, DelaySeconds: delay }, 'Add Future Job Failed');
			return cb(err);
		}

		log.info({ Queue: queue, JobId: name }, 'Add Future Job Success');
		return cb();
	});
}

function AddRepeatingJob (queue, name, payload, interval, cb) {
	let cron = `*/${interval} * * * *`;
	let options = {
		jobId: name,
		repeat: {
			cron
		}
	};

	async.waterfall([
		(cb) => {
			GetRepeatingJob(queue, name, function (err, job) {
				if (err) {
					return cb(err);
				}

				if (job) {
					let eErr = new EnhancedError('Job Already Exists', true);
					return cb(eErr);
				}

				return cb();
			});
		},
		(cb) => {
			queueJob(queue, payload, options, function (err) {
				if (err) {
					log.error({ Error: err.message, err, Queue: queue, JobId: name }, 'Add Repeating Job Failed');
					return cb(err);
				}

				log.info({ Queue: queue, JobId: name, Scheduler: cron }, 'Add Repeating Job Success');
				return cb(null, cron);
			});
		}
	], cb);
}

function GetRepeatingJob (queueName, jobName, cb) {
	GetRepeatingJobs(queueName, function (err, jobList) {
		if (err) {
			let eErr = new EnhancedError(err.message, false);
			return cb(eErr);
		}

		for (let i = 0; i < jobList.length; i++) {
			let job = jobList[i];
			if (job.id === jobName) {
				return cb(null, job);
			}
		}

		return cb(null, null);
	});
}

function GetRepeatingJobs (queueName, cb) {
	if (!queueFactory.Exists(queueName)) {
		let eErr = new EnhancedError('Queue Not Found', true);
		return cb(eErr);
	}

	const queue = queueFactory.GetQueue(queueName);
	return queue.getRepeatableJobs().then(function (jobs) {
		return cb(null, jobs);
	}).catch(function (err) {
		log.error({ Queue: queueName, Error: err.message }, 'Failed to Get Repeating Jobs');
		let eErr = new EnhancedError(err.message, false);
		return cb(eErr);
	});
}

function DeleteRepeatingJob (queueName, jobName, cb) {
	if (!queueFactory.Exists(queueName)) {
		let eErr = new EnhancedError('Queue Not Found', true);
		return cb(eErr);
	}

	let existingJob;

	async.waterfall([
		(cb) => {
			GetRepeatingJob(queueName, jobName, function (err, job) {
				if (err) {
					return cb(err);
				}

				if (!job) {
					let eErr = new EnhancedError('Job Not Found', true);
					return cb(eErr);
				}

				existingJob = job;
				return cb();
			});
		},
		(cb) => {
			const queue = queueFactory.GetQueue(queueName);
			return queue.removeRepeatableByKey(existingJob.key).then(function () {
				log.info({ Queue: queueName, JobName: jobName }, 'Deleted Repeatable Job');
				return cb();
			}).catch(function (err) {
				log.error({ Queue: queueName, JobName: jobName, Error: err.message }, 'Failed to Delete Job');
				return cb(err);
			});
		}
	], cb);
}

function Init (cb) {
	return queueFactory.Init(cb);
}

// Internal

function queueJob (queueName, payload, options, cb) {
	let envelope = {
		createdDate: new Date(),
		payload,
		name: options.jobId,
		version: 1
	};

	options.removeOnComplete = true;
	options.removeOnFail = true;

	if (config.has(`bull.consumer.queue.${queueName}`)) {
		options = Object.assign(options, config.get(`bull.consumer.queue.${queueName}`));
	} else {
		options = Object.assign(options, config.get('bull.consumer.default'));
	}

	try {
		return addJob(cb);
	} catch (err) {
		return cb(err);
	}

	function addJob (cb) {
		const queue = queueFactory.GetQueue(queueName);
		return queue.add(envelope, options).then(function () {
			return cb();
		}).catch(function (err) {
			return cb(err);
		});
	}
}
