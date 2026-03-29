const express = require('express');
const passport = require('passport');
const { signup, login, sellerLogin, oauthSuccess, oauthFailure } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const PROVIDERS = ['google', 'facebook', 'github'];

const oauthScopes = {
  google: ['profile', 'email'],
  facebook: ['email', 'public_profile'],
  github: ['user:email'],
};

function strategyConfigured(provider) {
  switch (provider) {
    case 'google':
      return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case 'facebook':
      return !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
    case 'github':
      return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    default:
      return false;
  }
}

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/seller-login', authLimiter, sellerLogin);

router.get('/oauth/failure', oauthFailure);

router.get('/oauth/:provider', (req, res, next) => {
  const { provider } = req.params;
  if (!PROVIDERS.includes(provider)) {
    return res.status(400).json({ message: 'Invalid OAuth provider' });
  }
  if (!strategyConfigured(provider)) {
    return res.status(503).json({ message: `OAuth provider "${provider}" is not configured` });
  }
  passport.authenticate(provider, {
    scope: oauthScopes[provider],
    session: false,
  })(req, res, next);
});

router.get('/oauth/:provider/callback', (req, res, next) => {
  const { provider } = req.params;
  if (!PROVIDERS.includes(provider)) {
    return res.status(400).json({ message: 'Invalid OAuth provider' });
  }
  if (!strategyConfigured(provider)) {
    return res.status(503).json({ message: `OAuth provider "${provider}" is not configured` });
  }
  passport.authenticate(provider, { session: false }, (err, user) => {
    if (err || !user) {
      return oauthFailure(req, res);
    }
    req.user = user;
    next();
  })(req, res, next);
}, oauthSuccess);

module.exports = router;
