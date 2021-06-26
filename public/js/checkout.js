var stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
var orderButton = document.getElementById('orderBtn');
var stripeSessionID = document.getElementById('stripeSessionID').value;

orderButton.addEventListener('click', () => {
	stripe.redirectToCheckout({
		sessionId: stripeSessionID,
	});
});
