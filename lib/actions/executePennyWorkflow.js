const config = require('config');
const request = require('request');

module.exports = function (workflowName, params, cb) {
  let qs = {
    name: workflowName
  };
  qs = Object.assign(qs, params);

  let httpOptions = {
    url: config.get('actions.executePennyWorkflow.host') + '/penny/v1/workflow/execute',
    timeout: 30000,
    method: 'GET',
    headers: {
      Authorization: 'key ' + config.get('actions.executePennyWorkflow.auth.key')
    },
    json: true,
    qs
  };

  request(httpOptions, function (err, httpResponse, body) {
    if (err) {
      return cb(err);
    }

    if (httpResponse.statusCode !== 200) {
      body = `[StatusCode: ${httpResponse.statusCode}] ` + JSON.stringify(body);

      if ([400, 404].includes(httpResponse.statusCode)) {
        return cb(new Error(body), null, 'REJECT');
      }

      return cb(new Error(body));
    }

    return cb(null, body);
  });
};
