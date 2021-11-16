// Imports

// General

var config = {};

config.name = 'jobScheduler';

// HTTP Proxy

config.http = {};

config.http.port = process.env.PORT || 3000;
config.http.timeout = 120000;
config.http.keepAliveTimeoutMS = 60000;
config.http.server = '127.0.0.1';

// SSL
config.ssl = null;

// ** Logging

config.logging = {
  enabled: true
};

// ** Instrumental

config.statsD = null;

// ** Redis

config.redis = {
  connection: '',
  url: '',
  options: {
  }
};

// ** Actions

config.actions = {
  executePennyWorkflow: {
    host: 'http://localhost:3001',
    auth: {
      type: 'key',
      key: ''
    }
  }
};

// Export

module.exports = config;
