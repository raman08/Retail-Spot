const mongoose = require('mongoose');

const user = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	resetToken: {
		type: String,
	},
	resetTokenExpire: {
		type: Date,
	},
	cart: {
		products: [
			{
				productId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Product',
					required: true,
				},
				quantity: { type: Number, required: true },
			},
		],
	},
});

user.methods.addToCart = function (product) {
	let cartProductIndex;

	try {
		cartProductIndex = this.cart.products.findIndex(cp => {
			return cp.productId.toString() === product._id.toString();
		});
	} catch (error) {
		cartProductIndex = -1;
	}

	let newQuantity = 1;
	const updatedCartItems = [...this.cart.products];

	if (cartProductIndex >= 0) {
		newQuantity = this.cart.products[cartProductIndex].quantity + 1;
		updatedCartItems[cartProductIndex].quantity = newQuantity;
	} else {
		updatedCartItems.push({
			productId: product._id,
			quantity: newQuantity,
		});
	}

	const updatedCart = {
		products: updatedCartItems,
	};

	this.cart = updatedCart;
	return this.save();
};

user.methods.deleteCartItem = function (productId) {
	const updatedCartProducts = this.cart.products.filter(item => {
		return item.productId.toString() !== productId.toString();
	});

	this.cart.products = updatedCartProducts;
	return this.save();
};

user.methods.clearCart = function () {
	this.cart = { products: [] };
	return this.save();
};

module.exports = mongoose.model('User', user);
