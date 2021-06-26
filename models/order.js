const mongoose = require('mongoose');

const order = new mongoose.Schema({
	products: [
		{
			product: {
				productId: {
					type: mongoose.Schema.Types.ObjectId,
					required: true,
				},
				title: {
					type: String,
					required: true,
				},
				price: {
					type: Number,
					required: true,
				},
			},
			quantity: {
				type: Number,
				required: true,
			},
		},
	],
	user: {
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User',
		},
		email: {
			type: String,
			required: true,
		},
	},
	orderValue: {
		type: Number,
		required: true,
	},
});

module.exports = mongoose.model('Order', order);
