const config = {};

config.actions = {
  executePennyWorkflow: {
    host: 'https://prom-penny-staging.herokuapp.com',
    auth: {
      type: 'key',
      key: process.env.PENNY_KEY
    }
  }
};

module.exports = config;
