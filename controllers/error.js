exports.get404 = (req, res) => {
	res.status(404).render('404', {
		title: '404 - Page Not found',
	});
};

exports.get500 = (req, res) => {
	res.status(500).render('500', {
		title: '500 - Internal Server Error',
	});
};
