require('events').EventEmitter.prototype._maxListeners = 100;

const config = {
  redis: {
    connection: process.env.REDIS_URL,
    options: {
      tls: {
        rejectUnauthorized: false
      }
    }
  }
};

module.exports = config;
