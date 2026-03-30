const { escapeHtml } = require('./email.utils');

const STATUS_MAP = {
  pending: {
    label: 'Pending',
    accent: '#9A6B00',
    description: 'Your order has been received and is waiting for seller confirmation.',
  },
  payment_pending: {
    label: 'Payment Pending',
    accent: '#9A6B00',
    description: 'Your payment is pending verification before the order is confirmed.',
  },
  processing: {
    label: 'Processing',
    accent: '#146356',
    description: 'Your order is now being processed by the seller.',
  },
  confirmed: {
    label: 'Confirmed',
    accent: '#0D7A3F',
    description: 'The seller confirmed your order and started preparation.',
  },
  packed: {
    label: 'Packed',
    accent: '#006D77',
    description: 'Your order has been packed and is ready to ship.',
  },
  shipped: {
    label: 'Shipped',
    accent: '#0057B8',
    description: 'Your order is in transit to the shipping address.',
  },
  delivered: {
    label: 'Delivered',
    accent: '#1C7C54',
    description: 'Your order has been delivered. Enjoy your purchase.',
  },
  cancelled: {
    label: 'Cancelled',
    accent: '#B42318',
    description: 'This order has been cancelled. Contact support if this is unexpected.',
  },
};

const PURPOSE_LABELS = {
  signup: 'complete your signup',
  login: 'complete your login',
  password_reset: 'reset your password',
};

const layout = ({ preheader, title, bodyHtml, tone = '#111827' }) => `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;background:#f3f4f6;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:18px 24px;background:linear-gradient(120deg,#111827,#1f2937);color:#f9fafb;">
              <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">LoopBazar Notifications</div>
              <div style="font-size:22px;font-weight:700;margin-top:8px;">${escapeHtml(title)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;color:${escapeHtml(tone)};line-height:1.6;font-size:15px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5;">
              Sent by LoopBazar automated mailer. Please do not reply to this message.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${amount.toFixed(2)}`;
};

const normalizeAddress = (shippingAddress = {}) => {
  const parts = [
    shippingAddress.street,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.country,
    shippingAddress.zipCode,
  ]
    .filter(Boolean)
    .map((value) => escapeHtml(value));

  if (!parts.length) return 'Not provided';
  return parts.join(', ');
};

const renderOrderItemsRows = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return '<tr><td colspan="3" style="padding:8px 0;color:#6b7280;">No item details provided.</td></tr>';
  }

  return items
    .map((item) => {
      const productName = escapeHtml(item.productName || 'Product');
      const quantity = Number(item.quantity) || 1;
      const priceAtPurchase = formatCurrency(item.priceAtPurchase);
      return `
        <tr>
          <td style="padding:8px 0;vertical-align:top;">${productName}</td>
          <td style="padding:8px 0;vertical-align:top;text-align:center;">${quantity}</td>
          <td style="padding:8px 0;vertical-align:top;text-align:right;">${priceAtPurchase}</td>
        </tr>
      `;
    })
    .join('');
};

const buildOtpTemplate = ({ otpCode, purpose = 'signup', expiresInMinutes = 5 }) => {
  const action = PURPOSE_LABELS[purpose] || 'continue authentication';
  const subject = `Your LoopBazar OTP for ${action}`;
  const safeOtp = escapeHtml(otpCode);

  const bodyHtml = `
    <p style="margin:0 0 14px;">Use this one-time code to ${escapeHtml(action)}:</p>
    <div style="font-size:34px;letter-spacing:8px;font-weight:700;text-align:center;background:#f3f4f6;border:1px dashed #d1d5db;border-radius:12px;padding:14px 8px;margin:14px 0 18px;">${safeOtp}</div>
    <p style="margin:0 0 10px;">This OTP expires in <strong>${Number(expiresInMinutes) || 5} minutes</strong>.</p>
    <p style="margin:0;color:#6b7280;font-size:13px;">If you did not request this OTP, ignore this email. For your security, never share this code.</p>
  `;

  return {
    subject,
    html: layout({
      preheader: `OTP code ${otpCode}`,
      title: 'Verification Code',
      bodyHtml,
      tone: '#111827',
    }),
    text: `Your LoopBazar OTP is ${otpCode}. It expires in ${Number(expiresInMinutes) || 5} minutes.`,
  };
};

const buildOrderPlacedTemplate = ({
  orderId,
  sellerName,
  buyerName,
  buyerEmail,
  shippingAddress,
  items,
  totalAmount,
}) => {
  const subject = `New order received (${orderId})`;
  const safeOrderId = escapeHtml(orderId);
  const safeSellerName = escapeHtml(sellerName || 'Seller');
  const safeBuyerName = escapeHtml(buyerName || 'Buyer');
  const safeBuyerEmail = escapeHtml(buyerEmail || 'N/A');

  const bodyHtml = `
    <p style="margin:0 0 14px;">Hi ${safeSellerName}, you just received a new order.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;font-size:14px;">
      <tr><td style="padding:4px 0;color:#6b7280;width:140px;">Order ID</td><td style="padding:4px 0;"><strong>${safeOrderId}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Buyer</td><td style="padding:4px 0;">${safeBuyerName} (${safeBuyerEmail})</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Shipping</td><td style="padding:4px 0;">${normalizeAddress(shippingAddress)}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Total</td><td style="padding:4px 0;"><strong>${formatCurrency(totalAmount)}</strong></td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;font-size:14px;">
      <thead>
        <tr>
          <th style="padding:10px 0 8px;text-align:left;color:#6b7280;font-weight:600;">Product</th>
          <th style="padding:10px 0 8px;text-align:center;color:#6b7280;font-weight:600;">Qty</th>
          <th style="padding:10px 0 8px;text-align:right;color:#6b7280;font-weight:600;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${renderOrderItemsRows(items)}
      </tbody>
    </table>
  `;

  return {
    subject,
    html: layout({
      preheader: `New order ${orderId}`,
      title: 'New Order Placed',
      bodyHtml,
      tone: '#111827',
    }),
    text: `Order ${orderId} placed by ${buyerName || 'Buyer'} (${buyerEmail || 'N/A'}). Total: ${formatCurrency(totalAmount)}.`,
  };
};

const buildOrderStatusTemplate = ({
  orderId,
  buyerName,
  sellerName,
  status,
  trackingId,
  items,
}) => {
  const normalizedStatus = String(status || '').toLowerCase().trim();
  const statusMeta = STATUS_MAP[normalizedStatus] || {
    label: normalizedStatus || 'Updated',
    accent: '#1f2937',
    description: 'Your order status has changed.',
  };

  const subject = `Order ${orderId} is now ${statusMeta.label}`;

  const bodyHtml = `
    <p style="margin:0 0 14px;">Hi ${escapeHtml(buyerName || 'there')},</p>
    <div style="border-left:4px solid ${statusMeta.accent};background:#f9fafb;padding:12px 14px;border-radius:8px;margin:0 0 16px;">
      <div style="font-size:13px;color:#6b7280;">Order ID</div>
      <div style="font-size:16px;font-weight:700;margin-top:2px;">${escapeHtml(orderId)}</div>
      <div style="margin-top:8px;font-size:14px;"><strong style="color:${statusMeta.accent};">${escapeHtml(statusMeta.label)}</strong></div>
      <div style="margin-top:4px;color:#4b5563;">${escapeHtml(statusMeta.description)}</div>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px;">
      <tr><td style="padding:4px 0;color:#6b7280;width:140px;">Seller</td><td style="padding:4px 0;">${escapeHtml(sellerName || 'N/A')}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Tracking ID</td><td style="padding:4px 0;">${escapeHtml(trackingId || 'Not available yet')}</td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;font-size:14px;">
      <thead>
        <tr>
          <th style="padding:10px 0 8px;text-align:left;color:#6b7280;font-weight:600;">Product</th>
          <th style="padding:10px 0 8px;text-align:center;color:#6b7280;font-weight:600;">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${(Array.isArray(items) ? items : [])
          .map(
            (item) => `
          <tr>
            <td style="padding:8px 0;">${escapeHtml(item.productName || 'Product')}</td>
            <td style="padding:8px 0;text-align:center;">${Number(item.quantity) || 1}</td>
          </tr>
        `
          )
          .join('') || '<tr><td colspan="2" style="padding:8px 0;color:#6b7280;">No item details provided.</td></tr>'}
      </tbody>
    </table>
  `;

  return {
    subject,
    html: layout({
      preheader: `Order ${orderId} is ${statusMeta.label}`,
      title: 'Order Status Updated',
      bodyHtml,
      tone: '#111827',
    }),
    text: `Order ${orderId} status updated to ${statusMeta.label}.${trackingId ? ` Tracking ID: ${trackingId}.` : ''}`,
  };
};

module.exports = {
  buildOrderPlacedTemplate,
  buildOrderStatusTemplate,
  buildOtpTemplate,
};
