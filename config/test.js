// Imports

// General

const config = {};

// ** Logging

config.logging = {
  enabled: false
};

config.actions = {
};

config.bull = {
  consumer: {
    queue: {
      myQueue: {
        attempts: 5
      }
    }
  }
};

// Export

module.exports = config;
