
const base = {
  // id: 'job.default',
  type: 'object',
  properties: {
    payload: {
      type: 'object',
      default: {}
    },
    queue: {
      type: 'string',
      default: 'default'
    },
    uniqueName: {
      type: 'string'
    },
    version: {
      type: 'number',
      default: 1,
      enum: [1]
    }
  },
  required: ['payload', 'queue', 'version'],
  additionalProperties: false
};

const future = JSON.parse(JSON.stringify(base));

// future.id = 'job.future.default';
future.required.push('delaySec');
future.properties.delaySec = {
  type: 'integer',
  minimum: 0
};

const repeating = JSON.parse(JSON.stringify(base));

// repeating.id = 'job.repeating.default';
repeating.required.push('intervalMinutes');
repeating.properties.intervalMinutes = {
  type: 'integer',
  enum: [1, 5, 10, 15, 30, 60]
};

module.exports = {
  single: {
    post: base
  },
  future: {
    post: future
  },
  repeating: {
    post: repeating
  }
};
