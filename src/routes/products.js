const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');


// إضافة منتج جديد
router.post('/', authorize('Admin','User'), ProductController.addProduct);

// الحصول على جميع المنتجات
router.get('/', protect, authorize('Admin','User'), ProductController.getAllProducts);

// الحصول على منتج بالمعرف
router.get('/:id', protect, authorize('Admin','User'), ProductController.getProductById);

// إضافة مخزون لمنتج
router.post('/:id/stock', protect, authorize('Admin','User'), ProductController.addStock);

// تحديث سعر منتج
router.put('/:id/price', protect, authorize('Admin','User'), ProductController.updatePrice);

// الحصول على المخزون الحالي لمنتج
router.get('/:id/stock', protect, authorize('Admin','User'), ProductController.getCurrentStock);

module.exports = router;


