const path = require('path');

const schemas = require(path.resolve('api', 'routes', 'scheduler', 'v1', 'job', 'schema'));

module.exports = {
	openapi: '3.0.0',

	info: {
		title: 'gadgetSchedulerJS',
		description: '',
		version: '1.0.0'
	},

	servers: [{ url: '/' }],
	components: {
		securitySchemes: {
			basicAuth: {
				type: 'http',
				scheme: 'basic'
			}
		}
	},
	security: [
		{
			basicAuth: []
		}
	],
	paths: {
		'/health': {
			get: {
				summary: 'Checks that the server is running successfully.',
				responses: {
					200: {
						description: 'OK'
					}
				}
			}
		},

		'/scheduler/v1/job/single/': {
			post: {
				summary: 'Creates an new job for immediate processing',
				requestBody: {
					description: 'Creates an new job for immediate processing',
					required: true,
					content: {
						'application/json': {
							schema: schemas.single.post
						}
					}
				},

				responses: {
					200: { description: 'Job Created' },
					400: { description: 'Invalid information was provided.' }
				}
			}
		}
	}
};
