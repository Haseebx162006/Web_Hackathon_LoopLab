const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const uploadImageMiddleware = require('../middleware/uploadMiddleware');
const {
  getConversations,
  getMessages,
  sendMessage,
  markSeen,
  resolveConversation,
  uploadChatImages,
} = require('../controllers/chatController');

const router = express.Router();

const ensureMarketplaceChatRole = (req, res, next) => {
  if (req.user?.role === 'buyer' || req.user?.role === 'seller') {
    return next();
  }

  res.status(403);
  return next(new Error('Only buyer and seller accounts can access chat'));
};

router.use(protect);
router.use(ensureMarketplaceChatRole);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.patch('/conversations/:conversationId/seen', markSeen);
router.patch('/conversations/:conversationId/resolve', resolveConversation);
router.post('/messages', sendMessage);
router.post(
  '/upload',
  (req, res, next) => {
    uploadImageMiddleware.array('images', 5)(req, res, (error) => {
      if (error) {
        res.status(400);
        return next(error);
      }

      return next();
    });
  },
  uploadChatImages
);

module.exports = router;
