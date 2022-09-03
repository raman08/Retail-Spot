const nodemailer = require('nodemailer');
const { google } = require('googleapis');

exports.createTransporter = async () => {
	const oauth2Client = new google.auth.OAuth2(
		process.env.CLIENT_ID,
		process.env.CLIENT_SECRET,
		'https://developers.google.com/oauthplayground'
	);

	oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
	const accessToken = oauth2Client.getAccessToken();

	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			// pass: process.env.AUTH_PASSWORD,
			type: 'OAUTH2',
			user: process.env.AUTH_EMAIL,
			accessToken,
			clientId: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			refreshToken: process.env.REFRESH_TOKEN,
		},
	});

	return transporter;
};
