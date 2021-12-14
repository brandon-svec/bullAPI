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
  GetSchema
};

function Init (cb) {
  fs.readdir(path.resolve('lib', 'consumers'), (err, fileList) => {
    if (err) {
      return cb(err);
    }

    async.each(fileList, initializeConsumer, function (err, queue) {
      if (err) {
        log.error({ Queue: queue, Error: err.message }, 'Failed to Initialize Consumer');
        return cb(new Error(`Failed to Initialize Consumer: ${queue}`));
      }
      return cb();
    });
  });
}

function Exists (name) {
  return (consumerList[name]);
}

function initializeConsumer (file, cb) {
  let name;
  try {
    const consumer = require(path.resolve('lib', 'consumers', file));
    name = file.slice(0, -3);
    const queue = queueFactory.GetQueue(name);

    consumer.Init(function (err) {
      if (err) {
        return cb(err, name);
      }

      queue.process(function (jobObj, cb) {
        try {
          consumer.ProcessWork(jobObj, function (err, result, behavior) {
            if (err) {
              if (err.isUserError === true) {
                throw err;
              }

              log.warn({ Error: err.message, Envelope: jobObj.data, Queue: name }, 'Consumer Work Failed. Retrying...');
              return cb(err);
            }

            log.info({ Queue: name }, 'Consumer Work Processed');
            return cb();
          });
        } catch (err) {
          log.error({ Error: err.message, Envelope: jobObj.data, Queue: name }, 'Consumer Work Unrecoverable Error');
          return cb(); // Remove from queue
        }
      });

      consumerList[name] = consumer;
      log.debug({ Queue: name }, 'Consumer Initialized');
      return cb();
    });
  } catch (err) {
    return cb(err, name);
  }
}

function GetSchema (name) {
  if (!Exists(name)) {
    return null;
  }

  return consumerList[name].GetSchema();
}
