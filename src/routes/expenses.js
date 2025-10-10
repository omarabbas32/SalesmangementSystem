const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/expenseController');

// إضافة مصروف جديد
router.post('/', ExpenseController.addExpense);

// الحصول على جميع المصروفات
router.get('/', ExpenseController.getAllExpenses);

// الحصول على مصروفات اليوم
router.get('/today', ExpenseController.getTodayExpenses);

// الحصول على مصروفات تاريخ معين
router.get('/date/:date', ExpenseController.getExpensesByDate);

// الحصول على مصروف بالمعرف
router.get('/:id', ExpenseController.getExpenseById);

// تحديث مصروف
router.put('/:id', ExpenseController.updateExpense);

// حذف مصروف
router.delete('/:id', ExpenseController.deleteExpense);

// الحصول على المصروفات حسب الفئة
router.get('/category/:category', ExpenseController.getExpensesByCategory);

// الحصول على جميع الفئات
router.get('/categories/all', ExpenseController.getCategories);

// الحصول على إجمالي المصروفات لفترة معينة
router.get('/total/range', ExpenseController.getExpensesTotal);

module.exports = router;


