const Stripe = require('stripe');

// Assuming you'll set STRIPE_SECRET_KEY in your .env
// We handle a fallback so it doesn't crash on load if missing
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2023-10-16', // Using a stable API version
});

module.exports = stripe;
