// Imports

// General

var config = {};

// ** Logging

config.logging = {
  enabled: false
};

config.actions = {
  executePennyWorkflow: {
    host: 'https://prom-penny-test.herokuapp.com',
    auth: {
      type: 'key',
      key: 'notValid'
    }
  }
};

// Export

module.exports = config;
