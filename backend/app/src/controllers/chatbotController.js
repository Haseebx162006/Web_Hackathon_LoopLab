const Groq = require('groq-sdk');
const Order = require('../models/Order');
const { chatMessageSchema } = require('../utils/validators');

const GROQ_MODEL = 'llama-3.3-70b-versatile';

const buildSystemPrompt = (orders) => {
  let prompt = `You are a helpful customer support assistant for a multi-vendor eCommerce platform. 
You help buyers with questions about their orders, returns, refunds, shipping, and general platform usage.
Be concise, professional, and friendly. Do not use emojis.

Key policies:
- Orders can be cancelled before they are shipped.
- Returns can be requested within 7 days of delivery.
- Refunds are processed within 5-7 business days after return approval.
- For issues you cannot resolve, tell the user to contact human support at support@marketplace.com.

If you determine the customer's issue requires human intervention (payment disputes, account security, complex complaints), include the phrase [ESCALATE] at the very end of your response.`;

  if (orders && orders.length > 0) {
    prompt += '\n\nThe customer has the following recent orders:\n';
    for (const order of orders) {
      const items = order.items
        .map((item) => {
          const name = item.product ? item.product.productName : 'Unknown Product';
          return `${name} (qty: ${item.quantity})`;
        })
        .join(', ');
      prompt += `- Order ID: ${order._id}, Status: ${order.status}, Items: ${items}, Total: $${order.totalAmount}`;
      if (order.trackingId) {
        prompt += `, Tracking: ${order.trackingId}`;
      }
      if (order.returnStatus !== 'none') {
        prompt += `, Return: ${order.returnStatus}`;
      }
      if (order.refundStatus !== 'none') {
        prompt += `, Refund: ${order.refundStatus}`;
      }
      prompt += '\n';
    }
  } else {
    prompt += '\n\nThe customer has no recent orders on file.';
  }

  return prompt;
};

const chat = async (req, res, next) => {
  try {
    const { message } = chatMessageSchema.parse(req.body);

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      return res.status(200).json({
        success: true,
        data: {
          reply:
            'Our AI assistant is currently unavailable. Please contact human support at support@marketplace.com for assistance.',
          escalate: true,
        },
      });
    }

    // Fetch the authenticated user's recent orders for context
    const orders = await Order.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.product', 'productName')
      .lean();

    const systemPrompt = buildSystemPrompt(orders);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const aiReply = completion.choices[0]?.message?.content || '';
    const escalate = aiReply.includes('[ESCALATE]');
    const cleanReply = aiReply.replace('[ESCALATE]', '').trim();

    return res.status(200).json({
      success: true,
      data: {
        reply: cleanReply,
        escalate,
      },
    });
  } catch (err) {
    // If Groq API fails, return a graceful fallback
    if (err.status || err.error) {
      return res.status(200).json({
        success: true,
        data: {
          reply:
            'I am having trouble processing your request right now. Please try again later or contact human support at support@marketplace.com.',
          escalate: true,
        },
      });
    }
    next(err);
  }
};

module.exports = { chat };
