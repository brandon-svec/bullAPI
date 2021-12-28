const Bull = require('bull');
const config = require('config');
const pino = require('pino');
const Redis = require('ioredis');

let client;
let subscriber;

const log = pino(config.get('logging'));

const queueList = {};

module.exports = {
  GetQueue,
  Exists,
  Init,
  Shutdown
};

function GetQueue (name) {
  if (!name) {
    name = 'default';
  }

  if (queueList[name]) {
    return queueList[name];
  }

  queueList[name] = new Bull(name, GetQueueOpts(name));
  log.debug({ Queue: name }, 'New Bull Queue Created');
  return queueList[name];
}

function Exists (name) {
  return (queueList[name]);
}

function GetQueueOpts (name) {
  const opts = {
    createClient: function (type, redisOpts) {
      log.trace({ Type: type, Queue: name }, 'New Bull Redis Connection Requested');
      switch (type) {
        case 'client':
          return client;
        case 'subscriber':
          return subscriber;
        case 'bclient':
          return new Redis(config.get('redis.connection'), GetConfig(redisOpts));
        default:
          throw new Error('Unexpected connection type: ', type);
      }
    },
    prefix: config.get('name')
  };

  return opts;
}

function GetConfig (opts) {
  let redisConfig = JSON.parse(JSON.stringify(config.get('redis.options')));

  redisConfig = Object.assign(redisConfig, {
    enableOfflineQueue: false,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
  });

  if (opts) {
    redisConfig = Object.assign(redisConfig, opts);
  }

  return redisConfig;
}

function Init (cb) {
  if (!client) {
    client = new Redis(config.get('redis.connection'), GetConfig());
    /* client.on('error', function(err){
      log.warn({Error: err.message}, 'Redis Error');
    }) */
    subscriber = new Redis(config.get('redis.connection'), GetConfig());
    /* subscriber.on('error', function(err){
      log.warn({Error: err.message}, 'Redis Error');
    }) */
  }

  return setTimeout(cb, 500);
}

function Shutdown (cb) {
  return setImmediate(cb);
}
