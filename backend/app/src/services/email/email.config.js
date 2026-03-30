const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const logger = require('../../utils/logger');

const TOKEN_CACHE_TTL_MS = 55 * 60 * 1000;
// EMAIL Service is not functional Now in production, so we can disable it without affecting user experience. We can re-enable it later when we have proper email templates and content ready.
const env = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  emailUser: process.env.EMAIL_USER,
};

let oauth2Client;
let tokenCache = {
  accessToken: null,
  expiresAt: 0,
};
let transporterCache = {
  accessToken: null,
  transporter: null,
};

const isEmailConfigured = () =>
  Boolean(env.clientId && env.clientSecret && env.refreshToken && env.emailUser);

const getEmailDefaults = () => {
  const timeoutMs = Number(process.env.EMAIL_SEND_TIMEOUT_MS) || 10000;
  return {
    from: process.env.EMAIL_FROM || env.emailUser,
    timeoutMs,
  };
};

const isEmailPreviewEnabled = () =>
  process.env.EMAIL_PREVIEW === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.EMAIL_PREVIEW !== 'false');

const getOAuth2Client = () => {
  if (oauth2Client) {
    return oauth2Client;
  }

  oauth2Client = new google.auth.OAuth2(
    env.clientId,
    env.clientSecret,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({ refresh_token: env.refreshToken });
  return oauth2Client;
};

const getAccessToken = async ({ forceRefresh = false } = {}) => {
  if (!isEmailConfigured()) {
    throw new Error('Email OAuth2 credentials are not fully configured');
  }

  if (!forceRefresh && tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60 * 1000) {
    return tokenCache.accessToken;
  }

  const client = getOAuth2Client();
  const tokenResponse = await client.getAccessToken();
  const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

  if (!accessToken) {
    throw new Error('Unable to fetch Google OAuth2 access token for email transport');
  }

  tokenCache = {
    accessToken,
    expiresAt: Date.now() + TOKEN_CACHE_TTL_MS,
  };

  return accessToken;
};

const createTransporter = (accessToken) => {
  const socketTimeout = Number(process.env.EMAIL_SOCKET_TIMEOUT_MS) || 15000;
  const connectionTimeout = Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS) || 10000;

  return nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout,
    socketTimeout,
    auth: {
      type: 'OAuth2',
      user: env.emailUser,
      clientId: env.clientId,
      clientSecret: env.clientSecret,
      refreshToken: env.refreshToken,
      accessToken,
    },
  });
};

const getTransporter = async ({ forceRefresh = false } = {}) => {
  const accessToken = await getAccessToken({ forceRefresh });

  if (!forceRefresh && transporterCache.transporter && transporterCache.accessToken === accessToken) {
    return transporterCache.transporter;
  }

  const transporter = createTransporter(accessToken);

  transporterCache = {
    accessToken,
    transporter,
  };

  return transporter;
};

if (!isEmailConfigured()) {
  logger.warn('Email service is running in disabled mode (OAuth2 env vars missing)');
}

module.exports = {
  getEmailDefaults,
  getTransporter,
  isEmailConfigured,
  isEmailPreviewEnabled,
};
