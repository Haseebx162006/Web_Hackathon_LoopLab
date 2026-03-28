const express = require('express');
const multer = require('multer');
const {
  createProduct,
  listProducts,
  updateProduct,
  deleteProduct,
  bulkProductsFromExcel,
} = require('../controllers/productController');

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

router.post('/products', createProduct);
router.get('/products', listProducts);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post(
  '/products/bulk',
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

module.exports = router;
