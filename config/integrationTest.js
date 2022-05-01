require('events').EventEmitter.prototype._maxListeners = 100;

const config = {
  http: {
    timeout: 30000
  }
};

config.logging = {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  },
  enabled: false,
  level: 'info'
};

config.redis = {
  connection: 'redis://localhost:6380/'
};

config.bull = {
  queueFactory: {
    default: {
      limiter: {
        max: 10,
        duration: 1000
      }
    },
    queue: {
      myQueue: {
        limiter: {
          max: 1,
          duration: 10000
        },
        settings: {
          backoffStrategies: {
            retryProcessDelay: 5000
          }
        }
      }
    }
  }
};

// Export

module.exports = config;
