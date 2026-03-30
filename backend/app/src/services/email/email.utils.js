const crypto = require('crypto');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeEmailAddress = (email) => {
  if (typeof email !== 'string') return '';
  const normalized = email.trim().toLowerCase();
  return EMAIL_REGEX.test(normalized) ? normalized : '';
};

const sanitizeHeaderText = (value, maxLength = 200) => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/[\r\n]/g, ' ')
    .trim()
    .slice(0, maxLength);
};

const escapeHtml = (value) => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const maskEmail = (email) => {
  const normalized = sanitizeEmailAddress(email);
  if (!normalized) return '***';

  const [name, domain] = normalized.split('@');
  if (!name || !domain) return '***';

  const visible = name.length <= 2 ? name[0] : `${name[0]}${name[name.length - 1]}`;
  return `${visible}***@${domain}`;
};

const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));

const withTimeout = async (promise, timeoutMs, label = 'operation') => {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const retryWithExponentialBackoff = async (
  task,
  {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 8000,
    jitter = true,
    onRetry,
  } = {}
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        break;
      }

      const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const jitterMs = jitter ? Math.floor(Math.random() * Math.max(1, Math.ceil(exponential * 0.2))) : 0;
      const delayMs = exponential + jitterMs;

      if (typeof onRetry === 'function') {
        await onRetry({ attempt, error, delayMs, nextAttempt: attempt + 1 });
      }

      await sleep(delayMs);
    }
  }

  throw lastError;
};

module.exports = {
  escapeHtml,
  generateOtpCode,
  maskEmail,
  retryWithExponentialBackoff,
  sanitizeEmailAddress,
  sanitizeHeaderText,
  sleep,
  withTimeout,
};
