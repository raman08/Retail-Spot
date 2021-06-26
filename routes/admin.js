const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);

router.post(
	'/add-product',
	isAuth,
	[
		body('title')
			.isString()
			.withMessage('Title Only contains alphabet and Numericals')
			.isLength({ min: 3 })
			.withMessage('Title must be atleast 3 chracter long.')
			.trim(),
		// body('imageUrl').isURL().withMessage('Enter a correct URL'),
		body('price').isNumeric().withMessage('Enter a valid Price'),
		body('description')
			.isLength({ min: 5, max: 1000 })
			.withMessage('Description must be between 5 to 1000 chracters')
			.trim(),
	],
	adminController.postAddProduct
);

router.get('/products', isAuth, adminController.getProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
	'/edit-product',
	[
		body('title')
			.isString()
			.withMessage('Title Only contains alphabet and Numericals')
			.isLength({ min: 3 })
			.withMessage('Title must be atleast 3 chracter long.')
			.trim(),
		// body('imageUrl').isURL().withMessage('Enter a correct URL'),
		body('price').isNumeric().withMessage('Enter a valid Price'),
		body('description')
			.isLength({ min: 5, max: 1000 })
			.withMessage('Description must be between 5 to 1000 chracters')
			.trim(),
	],
	isAuth,
	adminController.postEditProduct
);

router.delete(
	'/product/delete/:productId',
	isAuth,
	adminController.deleteProduct
);

module.exports = router;
