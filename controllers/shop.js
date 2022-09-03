const pdfkit = require('pdfkit');
const stripe = require('stripe')('sk_test_4eC39HqLyjWDarjtT1zdp7dc');

const Order = require('../models/order');
const Product = require('../models/product');

const ITEMS_PRE_PAGE = 6;

exports.getProducts = (req, res, next) => {
	const page = parseInt(req.query.page) || 1;
	let totalItems;

	Product.find()
		.countDocuments()
		.then(numProducts => {
			totalItems = parseInt(numProducts);
			return Product.find()
				.skip((page - 1) * ITEMS_PRE_PAGE)
				.limit(ITEMS_PRE_PAGE);
		})
		.then(products => {
			res.render('shop/product-list', {
				title: 'All Products',
				products: products,
				path: '/products',
				currentPage: page,
				totalProducts: totalItems,
				hasNextPage: ITEMS_PRE_PAGE * page < totalItems,
				hasPreviousPage: page > 1,
				nextPage: page + 1,
				previousPage: page - 1,
				lastPage: Math.ceil(totalItems / ITEMS_PRE_PAGE),
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.getProduct = (req, res, next) => {
	const productId = req.params.productId;
	Product.findById(productId)
		.then(product => {
			res.render('shop/product-details', {
				title: product.title + ' | Product Details',
				product: product,
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.getIndex = (req, res, next) => {
	const page = parseInt(req.query.page) || 1;
	let totalItems;

	Product.find()
		.countDocuments()
		.then(numProducts => {
			totalItems = parseInt(numProducts);
			return Product.find()
				.skip((page - 1) * ITEMS_PRE_PAGE)
				.limit(ITEMS_PRE_PAGE);
		})
		.then(products => {
			res.render('shop/index', {
				title: 'Shop Home',
				products: products,
				path: '/',
				currentPage: page,
				totalProducts: totalItems,
				hasNextPage: ITEMS_PRE_PAGE * page < totalItems,
				hasPreviousPage: page > 1,
				nextPage: page + 1,
				previousPage: page - 1,
				lastPage: Math.ceil(totalItems / ITEMS_PRE_PAGE),
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.getCart = (req, res, next) => {
	req.user
		.populate('cart.products.productId', 'title price')
		.execPopulate()
		.then(user => {
			return user.cart.products;
		})
		.then(products => {
			return res.render('shop/cart', {
				path: '/cart',
				title: 'Cart',
				products: products,
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.postCart = (req, res, next) => {
	const productId = req.body.productId;
	Product.findById(productId)
		.then(product => {
			return req.user.addToCart(product);
		})
		.then(() => {
			res.redirect('/cart');
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.postCartDeleteProduct = (req, res, next) => {
	const productId = req.body.productId;
	req.user
		.deleteCartItem(productId)
		.then(() => {
			res.redirect('/cart');
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.getCheckoutSuccess = (req, res, next) => {
	req.user
		.populate('cart.products.productId', 'title price')
		.execPopulate()
		.then(user => {
			return user.cart.products.map(product => {
				return {
					product: {
						productId: product.productId._id,
						title: product.productId.title,
						price: product.productId.price,
					},
					quantity: product.quantity,
				};
			});
		})
		.then(products => {
			let totalPrice = 0;
			products.forEach(product => {
				totalPrice =
					totalPrice +
					parseInt(product.product.price) *
						parseInt(product.quantity);
			});
			const orders = new Order({
				user: {
					userId: req.user._id,
					email: req.user.email,
				},
				products: products,
				orderValue: totalPrice,
			});
			return orders.save();
		})
		.then(() => {
			req.user.clearCart();
		})
		.then(() => {
			res.redirect('/orders');
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.getOrders = (req, res, next) => {
	Order.find({ 'user.userId': req.user._id })
		.then(orders => {
			res.render('shop/orders', {
				path: '/orders',
				title: 'Your Orders',
				orders: orders,
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.getCheckout = (req, res, next) => {
	let totalPrice = 0;
	let products;
	req.user
		.populate('cart.products.productId', 'title price description')
		.execPopulate()
		.then(user => {
			products = user.cart.products.map(product => {
				return {
					product: {
						productId: product.productId._id,
						title: product.productId.title,
						price: product.productId.price,
						description: product.productId.description,
					},
					quantity: product.quantity,
				};
			});
			return products;
		})
		.then(products => {
			totalPrice = 0;
			products.forEach(product => {
				totalPrice =
					totalPrice +
					parseInt(product.product.price) *
						parseInt(product.quantity);
			});

			return stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				line_items: products.map(p => {
					return {
						name: p.product.title,
						description: p.product.description,
						amount: p.product.price * 100,
						currency: 'usd',
						quantity: p.quantity,
					};
				}),
				success_url: `${req.protocol}://${req.get(
					'host'
				)}/checkout/success`,
				cancel_url: `${req.protocol}://${req.get(
					'host'
				)}/checkout/cancel`,
			});
		})
		.then(session => {
			return res.render('shop/checkout', {
				title: 'Checkout',
				path: '/checkout',
				products: products,
				totalPrice: totalPrice,
				sessionId: session.id,
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.statusCode = 500;
			return next(error);
		});
};

exports.getInvoice = (req, res, next) => {
	const orderId = req.params.orderId;
	const invoiceName = `Invoice-${orderId}.pdf`;
	// const invoicePath = path.join('Data', 'Invoices', invoiceName);

	Order.findById(orderId)
		.then(order => {
			if (!order) {
				return next(new Error('No order Found'));
			}
			if (order.user.userId.toString() !== req.user._id.toString()) {
				return next(new Error('Unatherized Acess'));
			}

			const invoicePdf = new pdfkit();

			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader(
				'Content-Disposition',
				`inline; filename=${invoiceName}`
			);

			// invoicePdf.pipe(fs.createWriteStream(invoicePath));
			invoicePdf.pipe(res);

			invoicePdf.fontSize(22).text('Invoice', { align: 'center' });
			invoicePdf
				.fontSize(14)
				.text('_________________________________', { align: 'center' });

			invoicePdf.fontSize(10).text(' ', { align: 'center' });

			invoicePdf
				.fontSize(16)
				.text(`User: ${order.user.email}`, { align: 'right' });

			invoicePdf.fontSize(24).text(' ', { align: 'center' });

			order.products.forEach((prod, index) => {
				invoicePdf
					.fontSize(14)
					.text(
						`${index + 1}. ${prod.product.title} (${
							prod.quantity
						}) - \$${prod.product.price}`
					);
			});

			invoicePdf.fontSize(24).text(' ', { align: 'center' });

			invoicePdf
				.fontSize(10)
				.text('_________________________________', { align: 'left' });

			invoicePdf.fontSize(9).text(' ', { align: 'center' });

			invoicePdf.fontSize(20).text(`Total: \$${order.orderValue}`);

			invoicePdf.end();
		})
		.catch(err => {
			next(err);
		});
};
