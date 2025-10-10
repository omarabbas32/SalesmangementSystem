const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');

// الحصول على تقرير المخزون الحالي
router.get('/current', InventoryController.getCurrentInventory);

// الحصول على جرد يومي شامل
router.get('/daily-report', InventoryController.getDailyReport);

// الحصول على تقرير شهري
router.get('/monthly-report/:year/:month', InventoryController.getMonthlyReport);

// الحصول على المنتجات منخفضة المخزون
router.get('/low-stock', InventoryController.getLowStockProducts);

// الحصول على إحصائيات عامة
router.get('/stats', InventoryController.getGeneralStats);

// الحصول على تاريخ تعديلات المخزون
router.get('/adjustments', InventoryController.getInventoryAdjustments);

// الحصول على لوحة التحكم الرئيسية
router.get('/dashboard', InventoryController.getDashboard);

// تصدير التقرير اليومي
router.get('/export/daily', InventoryController.exportDailyReport);

// الحصول على تقرير المبيعات الشهرية
router.get('/sales-report/:year/:month', InventoryController.getSalesReport);

module.exports = router;


