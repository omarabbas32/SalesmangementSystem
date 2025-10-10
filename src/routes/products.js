const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

// إضافة منتج جديد
router.post('/', ProductController.addProduct);

// الحصول على جميع المنتجات
router.get('/', ProductController.getAllProducts);

// الحصول على منتج بالمعرف
router.get('/:id', ProductController.getProductById);

// إضافة مخزون لمنتج
router.post('/:id/stock', ProductController.addStock);

// تحديث سعر منتج
router.put('/:id/price', ProductController.updatePrice);

// الحصول على المخزون الحالي لمنتج
router.get('/:id/stock', ProductController.getCurrentStock);

module.exports = router;


