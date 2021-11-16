const async = require('async');
const config = require('config');
const path = require('path');
const pino = require('pino');

// const cronGenerator = require(path.resolve('lib', 'cronGenerator'));
const queueFactory = require(path.resolve('lib', 'queueFactory'));

const log = pino(config.get('logging'));

module.exports = {
  AddSingleJob,
  AddFutureJob,
  AddRepeatingJob,
  Init
};

function AddSingleJob (queue, name, payload, cb) {
  let options = {
    jobId: name
  };

  queueJob(queue, payload, options, function (err, state) {
    if (err) {
      log.error({ Error: err.message, err, State: state, Queue: queue, JobId: name }, 'Add Single Job Failed');
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

  queueJob(queue, payload, options, function (err, state) {
    if (err) {
      log.error({ Error: err.message, err, State: state, Queue: queue, JobId: name, DelaySeconds: delay }, 'Add Future Job Failed');
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

  queueJob(queue, payload, options, function (err, state) {
    if (err) {
      log.error({ Error: err.message, err, State: state, Queue: queue, JobId: name }, 'Add Repeating Job Failed');
      return cb(err);
    }

    log.info({ Queue: queue, JobId: name, Scheduler: cron }, 'Add Repeating Job Success');
    return cb(null, cron);
  });
}

function queueJob (queueName, payload, options, cb) {
  let envelope = {
    createdDate: new Date(),
    payload,
    name: options.jobId,
    version: 1
  };

  options.removeOnComplete = true;

  async.waterfall([
    addJob
  ], cb);

  function addJob (cb) {
    const queue = queueFactory.GetQueue(queueName);
    return queue.add(envelope, options).then(function () {
      log.trace({ Queue: queueName, Envelope: envelope, Options: options }, 'Job Pushed to Queue');
      return cb();
    }).catch(function (err) {
      if (err) {
        log.error({ Queue: queueName }, 'Failed to Push Job to Queue');
        return cb(err);
      }
    });
  }
}

function Init (cb) {
  return cb();
}
