const User = require('../models/User');

function profileEmail(profile) {
  if (profile.emails?.[0]?.value) return profile.emails[0].value;
  if (profile._json?.email) return profile._json.email;
  return null;
}

function profileName(profile, fallbackEmail) {
  if (profile.displayName) return profile.displayName;
  if (profile.username) return profile.username;
  if (fallbackEmail) return fallbackEmail.split('@')[0];
  return 'User';
}

async function findOrCreateOAuthUser(provider, profile) {
  const email = profileEmail(profile);
  if (!email) {
    throw new Error(`No email returned from ${provider}. Check app permissions and scopes.`);
  }
  const normalized = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalized });

  if (!user) {
    user = await User.create({
      name: profileName(profile, normalized),
      email: normalized,
      oauthProvider: provider,
    });
    return user;
  }

  if (!user.oauthProvider) {
    user.oauthProvider = provider;
    await user.save();
  }

  return user;
}

module.exports = function configurePassport(passport) {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateOAuthUser('google', profile);
            return done(null, user);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
  }

  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    const { Strategy: FacebookStrategy } = require('passport-facebook');
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: process.env.FACEBOOK_CALLBACK_URL,
          profileFields: ['id', 'displayName', 'emails', 'name'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateOAuthUser('facebook', profile);
            return done(null, user);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    const { Strategy: GitHubStrategy } = require('passport-github2');
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: process.env.GITHUB_CALLBACK_URL,
          scope: ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateOAuthUser('github', profile);
            return done(null, user);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
  }
};
