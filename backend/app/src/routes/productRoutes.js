const express = require('express');
const multer = require('multer');
const {
  createProduct,
  listProducts,
  updateProduct,
  deleteProduct,
  bulkProductsFromExcel,
  uploadProductImages,
  getProductImages,
} = require('../controllers/productController');
const uploadImageMiddleware = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { isSeller } = require('../middleware/roleMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      /\.xlsx?$/i.test(file.originalname);
    if (ok) return cb(null, true);
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
  },
});

const router = express.Router();

router.post('/products', protect, isSeller, createProduct);
router.get('/products', protect, isSeller, listProducts);
router.put('/products/:id', protect, isSeller, updateProduct);
router.delete('/products/:id', protect, isSeller, deleteProduct);
router.post(
  '/products/bulk',
  protect,
  isSeller,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400);
        return next(err);
      }
      next();
    });
  },
  bulkProductsFromExcel
);
router.post('/products/:id/images', protect, isSeller, uploadImageMiddleware.array('images', 5), uploadProductImages);
router.get('/products/:id/images', getProductImages);

module.exports = router;
