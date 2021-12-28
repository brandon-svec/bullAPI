require('events').EventEmitter.prototype._maxListeners = 100;

const config = {
  redis: {},
  logging: {}
};

config.redis = {
  connection: 'redis://localhost:6380/'
};

module.exports = config;
