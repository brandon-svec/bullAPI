const config = {};

config.actions = {
  executePennyWorkflow: {
    host: 'https://prom-penny-outside.herokuapp.com',
    auth: {
      type: 'key',
      key: 'd94de991-88cf-4b38-8e2d-dce233bc282f'
    }
  }
};

config.logging = {
  level: 'debug'
}

module.exports = config;
