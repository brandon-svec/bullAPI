const config = require('config');
var memoize = require('memoizee');
const { parseRedisUrl } = require('parse-redis-url-simple');
const path = require('path');
const Redis = require('ioredis');

let client;
let memoize_init = memoize(init);

module.exports = {
  GetClient,
  GetConfig
};

function GetClient (cb) {
  if (client) {
    return setImmediate(cb, null, client);
  }

  memoize_init(function (err) {
    if (err) {
      return cb(err);
    }

    return cb(null, client);
  });
}

function init (cb) {
  let redisConfig = Object.assign(GetConfig(), {
    enableOfflineQueue: false,
    enableReadyCheck: true,
    lazyConnect: true
  });

  client = new Redis(redisConfig);

  client.connect(function (err) {
    if (err) {
      client.disconnect();
      return cb(err);
    }

    return cb();
  });
}

function GetConfig () {
  let redisConfig = config.get('redis.options');

  if (config.get('redis.url')) {
    redisConfig = Object.assign(redisConfig, parseRedisUrl(config.get('redis.url'))[0]);
  }

  return redisConfig;
}
