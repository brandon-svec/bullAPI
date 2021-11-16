const Ajv = require('ajv');
const async = require('async');
const config = require('config');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

const queueFactory = require(path.resolve('lib', 'queueFactory'));

const ajv = new Ajv({ useDefaults: true });
const log = pino(config.get('logging'));

const consumerList = {};

module.exports = {
  Init,
  Exists
};

function Init (cb) {
  fs.readdir(path.resolve('lib', 'consumers'), (err, fileList) => {
    if (err) {
      return cb(err);
    }

    async.each(fileList, initializeConsumer, function (err, queue) {
      if (err) {
        log.error({ Queue: queue, Error: err.message }, 'Failed to Initialize Consumer');
        return cb(new Error(`Failed to Initialize Consumer: ${file}`));
      }
      return cb();
    });
  });
}

function Exists (name) {
  return (consumerList[name] === true);
}

function initializeConsumer (file, cb) {
  try {
    const consumer = require(path.resolve('lib', 'consumers', file));
    const name = file.slice(0, -3);
    const queue = queueFactory.GetQueue(name);

    consumer.Init(function (err) {
      if (err) {
        return cb(err, name);
      }

      queue.process(function (jobObj, cb) {
        try {
          consumer.ProcessWork(jobObj, function (err, result, behavior) {
            if (err) {
              if (behavior === 'REJECT') {
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
