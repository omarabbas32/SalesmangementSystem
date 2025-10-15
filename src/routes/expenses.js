const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');

// إضافة مصروف جديد
router.post('/', protect, authorize('Admin','User'), ExpenseController.addExpense);

// الحصول على جميع المصروفات
router.get('/', protect, authorize('Admin','User'), ExpenseController.getAllExpenses);

// الحصول على مصروفات اليوم
router.get('/today', protect, authorize('Admin','User'), ExpenseController.getTodayExpenses);

// الحصول على مصروفات تاريخ معين
router.get('/date/:date', protect, authorize('Admin','User'), ExpenseController.getExpensesByDate);

// الحصول على مصروف بالمعرف
router.get('/:id', protect, authorize('Admin','User'), ExpenseController.getExpenseById);

// تحديث مصروف
router.put('/:id', protect, authorize('Admin','User'), ExpenseController.updateExpense);

// حذف مصروف
router.delete('/:id', protect, authorize('Admin','User'), ExpenseController.deleteExpense);

// الحصول على المصروفات حسب الفئة
router.get('/category/:category', protect, authorize('Admin','User'), ExpenseController.getExpensesByCategory);

// الحصول على جميع الفئات
router.get('/categories/all', protect, authorize('Admin','User'), ExpenseController.getCategories);

// الحصول على إجمالي المصروفات لفترة معينة
router.get('/total/range', protect, authorize('Admin','User'), ExpenseController.getExpensesTotal);

module.exports = router;


