const crypto = require('crypto');

const User = require('../models/user');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

const transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: process.env.AUTH_EMAIL,
		pass: process.env.AUTH_PASSWORD,
	},
});

exports.getLogin = (req, res) => {
	let errorMessage = req.flash('error');
	errorMessage = errorMessage.length > 0 ? errorMessage[0] : undefined;

	let sucessMessage = req.flash('sucess');
	sucessMessage = sucessMessage.length > 0 ? sucessMessage[0] : undefined;

	res.render('auth/login', {
		path: '/login',
		title: 'Login',
		errorMessage: errorMessage,
		sucessMessage: sucessMessage,
		oldInput: {
			email: '',
			password: '',
		},
		validationErrors: [],
	});
};

exports.getSignup = (req, res) => {
	let errorMessage = req.flash('error');
	errorMessage = errorMessage.length > 0 ? errorMessage[0] : undefined;
	res.render('auth/signup', {
		path: '/signup',
		title: 'Sign Up',
		errorMessage: errorMessage,
		oldInput: {
			email: '',
			password: '',
			confirmPassword: '',
		},
		validationErrors: [],
	});
};

exports.postLogin = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).render('auth/login', {
			path: '/login',
			title: 'Login',
			errorMessage: errors.array()[0].msg,
			sucessMessage: undefined,
			oldInput: {
				email: email,
				password: password,
			},
			validationErrors: errors.array(),
		});
	}

	User.findOne({ email: email })
		.then(user => {
			if (!user) {
				return res.status(422).render('auth/login', {
					path: '/login',
					title: 'Login',
					errorMessage: 'Invalid Email or Password',
					sucessMessage: undefined,
					oldInput: {
						email: email,
						password: password,
					},
					validationErrors: [],
				});
			}
			bcrypt
				.compare(password, user.password)
				.then(doMatch => {
					if (doMatch) {
						req.session.isLoggedIn = true;
						req.session.user = user;
						return req.session.save(err => {
							if (err) {
								throw err;
							}
							res.redirect('/');
						});
					}
					return res.status(422).render('auth/login', {
						path: '/login',
						title: 'Login',
						errorMessage: 'Invalid Email or Password',
						sucessMessage: null,
						oldInput: {
							email: email,
							password: password,
						},
						validationErrors: [],
					});
				})
				.catch(err => {
					return res.status(500).render('auth/login', {
						path: '/login',
						title: 'Login',
						errorMessage:
							'Somthing Went Wrong :( Try again later!!',
						sucessMessage: null,
						oldInput: {
							email: email,
							password: password,
						},
						validationErrors: [],
					});
				});
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.postSignup = (req, res) => {
	const email = req.body.email;
	const password = req.body.password;
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).render('auth/signup', {
			path: '/signup',
			title: 'Sign Up',
			errorMessage: errors.array()[0].msg,
			oldInput: {
				email: email,
				password: password,
				confirmPassword: req.body.confirmPassword,
			},
			validationErrors: errors.array(),
		});
	}

	bcrypt
		.hash(password, 12)
		.then(hashPassword => {
			const newUser = new User({
				email: email,
				password: hashPassword,
				cart: { items: [] },
			});

			return newUser.save();
		})
		.then(() => {
			req.flash('sucess', 'Account Created Sucessfully!!');
			res.redirect('/login');

			const mailOptions = {
				from: 'nodeshopdevil08@gmail.com',
				to: email,
				subject: 'Sign Up sucessfully',
				html: '<h1>Sign Up sucessfully!!!</h1>',
			};

			transporter
				.sendMail(mailOptions)
				.then(() => {
					console.log('Mail send sucessfully');
				})
				.catch(err => {
					throw err;
				});
		})
		.catch(() => {
			return res.status(422).render('auth/signup', {
				path: '/signup',
				title: 'Sign Up',
				errorMessage: 'Somthing Went Wrong!!',
				oldInput: {
					email: email,
					password: password,
					confirmPassword: req.body.confirmPassword,
				},
				validationErrors: errors.array(),
			});
		});
};

exports.postLogout = (req, res) => {
	req.session.destroy(err => {
		if (err) {
			console.log(err);
		}
		res.redirect('/login');
	});
};

exports.getReset = (req, res) => {
	let errorMessage = req.flash('error');
	errorMessage = errorMessage.length > 0 ? errorMessage[0] : undefined;

	let sucessMessage = req.flash('sucess');
	sucessMessage = sucessMessage.length > 0 ? sucessMessage[0] : undefined;

	res.render('auth/reset', {
		path: '/reset',
		title: 'Reset Passowrd',
		errorMessage: errorMessage,
		sucessMessage: sucessMessage,
	});
};

exports.postReset = (req, res, next) => {
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			req.flash('error', 'Somthing Went Wrong!');
			return res.redirect('/reset');
		}

		const token = buffer.toString('hex');

		User.findOne({ email: req.body.email })
			.then(user => {
				if (!user) {
					req.flash('error', 'NO user Found!');
					console.log('No user found');
					return res.redirect('/reset');
				}

				user.resetToken = token;
				user.resetTokenExpire = Date.now() + 3600000;
				return user.save();
			})
			.then(() => {
				req.flash('sucess', 'Check Your Email for the next steps!');
				res.redirect('/login');

				const mailOptions = {
					from: 'nodeshopdevil08@gmail.com',
					to: req.body.email,
					subject: 'Reset Password',
					html: `
					<h3>You requested a password reset for you account</h3>
					<p>Click this <a href='http://localhost:3000/reset/${token}'>link</a> to continue.</p>
					`,
				};

				return transporter
					.sendMail(mailOptions)
					.then(() => {
						console.log('Mail Send Sucessfully');
					})
					.catch(err => {
						throw err;
					});
			})
			.catch(err => {
				const error = new Error(err);
				error.statusCode = 500;
				return next(error);
			});
	});
};

exports.getResetPassword = (req, res, next) => {
	const token = req.params.token;

	User.findOne({ resetToken: token, resetTokenExpire: { $gt: Date.now() } })
		.then(user => {
			let errorMessage = req.flash('error');
			errorMessage =
				errorMessage.length > 0 ? errorMessage[0] : undefined;

			let sucessMessage = req.flash('sucess');
			sucessMessage =
				sucessMessage.length > 0 ? sucessMessage[0] : undefined;

			res.render('auth/reset-password', {
				path: '/reset-password',
				title: 'Reset Passowrd',
				errorMessage: errorMessage,
				sucessMessage: sucessMessage,
				userId: user._id.toString(),
				passwordToken: token,
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.postResetPassword = (req, res, next) => {
	const password = req.body.password;
	const userId = req.body.userId;
	const token = req.body.passwordToken;
	let user;

	User.findOne({
		resetToken: token,
		resetTokenExpire: { $gt: Date.now() },
		_id: userId,
	})
		.then(u => {
			if (!u) {
				req.flash('error', 'Somthing Went Wrong!');
				res.redirect('/reset');
			}
			user = u;
			return bcrypt.hash(password, 12);
		})
		.then(hashedPassword => {
			user.password = hashedPassword;
			user.resetToken = undefined;
			user.resetTokenExpire = undefined;

			return user.save();
		})
		.then(() => {
			req.flash('sucess', 'Password Changed Sucessfully!');
			res.redirect('/login');
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};
