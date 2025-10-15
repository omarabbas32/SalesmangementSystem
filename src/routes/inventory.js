const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// الحصول على تقرير المخزون الحالي
router.get('/current', protect, authorize('Admin','User'), InventoryController.getCurrentInventory);

// الحصول على جرد يومي شامل
router.get('/daily-report', protect, authorize('Admin','User'), InventoryController.getDailyReport);

// الحصول على تقرير شهري
router.get('/monthly-report/:year/:month', protect, authorize('Admin','User'),  InventoryController.getMonthlyReport);

// الحصول على المنتجات منخفضة المخزون
router.get('/low-stock', protect, authorize('Admin','User'), InventoryController.getLowStockProducts);

// الحصول على إحصائيات عامة
router.get('/stats', protect, authorize('Admin','User'), InventoryController.getGeneralStats);

// الحصول على تاريخ تعديلات المخزون
router.get('/adjustments', protect, authorize('Admin','User'), InventoryController.getInventoryAdjustments);

// الحصول على لوحة التحكم الرئيسية
router.get('/dashboard', protect, authorize('Admin','User'), InventoryController.getDashboard);

// تصدير التقرير اليومي
router.get('/export/daily', protect, authorize('Admin','User'), InventoryController.exportDailyReport);

// الحصول على تقرير المبيعات الشهرية
router.get('/sales-report/:year/:month', protect, authorize('Admin','User'), InventoryController.getSalesReport);

module.exports = router;


