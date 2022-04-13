// Import External Modules

// Import Internal Modules

// Export

module.exports = {
	run: fn_run
};

// Configs

// Init

// Routes

function fn_run (req, res, next) {
	var contype = req.headers['content-type'];
	if (!contype || contype.indexOf('application/json') !== 0) {
		var output = req.databag['output'];
		output.message = 'Request Failed';
		output.error = 'Content-Type Must be application/json';
		return res.status(400).send(output);
	}
	return next();
}
