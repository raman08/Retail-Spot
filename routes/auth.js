const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const authController = require('../controllers/auth');
const User = require('../models/user');

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
	'/login',
	[
		body('email')
			.isEmail()
			.withMessage('Please Enter a vaild Email')
			.normalizeEmail(),
		body('password', 'Password must be atleast 6 chracters long')
			.isLength({
				min: 6,
			})
			.trim(),
	],
	authController.postLogin
);

router.post(
	'/signup',
	[
		body('email')
			.isEmail()
			.withMessage('Please Enter a vaild Email')
			.custom(value => {
				return User.findOne({ email: value }).then(user => {
					if (user) {
						return Promise.reject('Email already exist!!');
					}
				});
			})
			.normalizeEmail(),
		body('password', 'Password must be atleast 6 chracters long')
			.isLength({
				min: 6,
			})
			.trim(),
		body('confirmPassword')
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error("Password dosen't match!");
				}
				return true;
			})
			.trim(),
	],
	authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getResetPassword);

router.post('/reset-password', authController.postResetPassword);

module.exports = router;
