const express = require('express');
const router = express.Router();
const SaleController = require('../controllers/saleController');

// إضافة عملية بيع جديدة
router.post('/', SaleController.addSale);

// الحصول على جميع المبيعات
router.get('/', SaleController.getAllSales);

// الحصول على مبيعات اليوم
router.get('/today', SaleController.getTodaySales);

// الحصول على مبيعات تاريخ معين
router.get('/date/:date', SaleController.getSalesByDate);

// الحصول على تفاصيل فاتورة معينة
router.get('/:id', SaleController.getSaleById);

// إلغاء عملية بيع
router.delete('/:id', SaleController.cancelSale);

// طباعة فاتورة
router.get('/:id/invoice', SaleController.printInvoice);

// الحصول على إجمالي المبيعات لفترة معينة
router.get('/total/range', SaleController.getSalesTotal);

module.exports = router;


