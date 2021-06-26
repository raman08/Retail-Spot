const fs = require('fs');

exports.deletefile = filepath => {
	fs.unlink(filepath, err => {
		if (err) {
			throw err;
		}
	});
};
