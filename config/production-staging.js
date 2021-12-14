const config = {};

config.actions = {
  executePennyWorkflow: {
    host: 'https://prom-penny-staging.herokuapp.com',
    auth: {
      type: 'key',
      key: 'd94de991-88cf-4b38-8e2d-dce233bc282f'
    }
  }
};

module.exports = config;
