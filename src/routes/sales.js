const express = require('express');
const router = express.Router();
const SaleController = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/authMiddleware');
// إضافة عملية بيع جديدة
router.post('/', protect, authorize('Admin','User'), SaleController.addSale);

// الحصول على جميع المبيعات
router.get('/', protect, authorize('Admin','User'), SaleController.getAllSales);

// الحصول على مبيعات اليوم
router.get('/today', protect, authorize('Admin','User'), SaleController.getTodaySales);

// الحصول على مبيعات تاريخ معين
router.get('/date/:date', protect, authorize('Admin','User'), SaleController.getSalesByDate);

// الحصول على تفاصيل فاتورة معينة
router.get('/:id', protect, authorize('Admin','User'), SaleController.getSaleById);

// إلغاء عملية بيع
router.delete('/:id', protect, authorize('Admin','User'), SaleController.cancelSale);

// طباعة فاتورة
router.get('/:id/invoice', protect, authorize('Admin','User'), SaleController.printInvoice);

// الحصول على إجمالي المبيعات لفترة معينة
router.get('/total/range', protect, authorize('Admin','User'), SaleController.getSalesTotal);

module.exports = router;


