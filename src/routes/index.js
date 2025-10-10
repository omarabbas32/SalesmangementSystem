const express = require('express');
const router = express.Router();

// استيراد جميع الـ routes
const productsRoutes = require('./products');
const salesRoutes = require('./sales');
const expensesRoutes = require('./expenses');
const inventoryRoutes = require('./inventory');

// ربط الـ routes بالمسارات
router.use('/products', productsRoutes);
router.use('/sales', salesRoutes);
router.use('/expenses', expensesRoutes);
router.use('/inventory', inventoryRoutes);

// Route للصفحة الرئيسية
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'نظام إدارة المبيعات - API',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      sales: '/api/sales',
      expenses: '/api/expenses',
      inventory: '/api/inventory'
    }
  });
});

module.exports = router;
