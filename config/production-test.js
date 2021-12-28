const config = {};

config.actions = {
  executePennyWorkflow: {
    host: 'https://prom-penny-outside.herokuapp.com',
    auth: {
      type: 'key',
      key: process.env.PENNY_KEY
    }
  }
};

config.logging = {
  level: 'debug'
};

module.exports = config;
