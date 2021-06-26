const deleteProduct = btn => {
	const productId = btn.dataset.productid;
	const productElement = document.getElementById(`product_${productId}`);
	fetch(`/admin/product/delete/${productId}`, { method: 'DELETE' })
		.then(result => {
			return result.json();
		})
		.then(() => {
			productElement.parentNode.removeChild(productElement);
		})
		.catch(err => {
			console.log(err);
		});
};
