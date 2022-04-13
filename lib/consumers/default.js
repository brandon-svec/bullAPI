const Ajv = require('ajv');
const config = require('config');
const path = require('path');
const pino = require('pino');

const ajv = new Ajv({ useDefaults: true });
const EnhancedError = require(path.resolve('lib', 'EnhancedError.js'));
const log = pino(config.get('logging'));

const schema = {
	type: 'object',
	properties: {
		testObject: {
			type: 'object'
		}
	},
	required: []
};

module.exports = {
	Init,
	ProcessWork,
	GetSchema
};

function Init (cb) {
	return cb();
}

function GetSchema () {
	return schema;
}

function ProcessWork (jobObject, cb) {
	try {
		validateSchema(jobObject.data.payload);
	} catch (err) {
		let eErr = new EnhancedError(err.message, true);
		return cb(eErr);
	}

	return executeWork(jobObject, cb);
}

function executeWork (jobObject, cb) {
	log.info({ Payload: jobObject.data }, 'Default Queue Output');
	return cb(null, jobObject.data);
}

function validateSchema (payload) {
	const schemaCheck = ajv.validate(schema, payload);

	if (!schemaCheck) {
		throw new Error(ajv.errors[0].dataPath + ' ' + ajv.errors[0].message + ' - ' + JSON.stringify(ajv.errors[0].params));
	} else {
		return null;
	}
}
