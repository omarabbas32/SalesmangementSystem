const Expense = require('../models/Expense');

class ExpenseController {
  // إضافة مصروف جديد
  static async addExpense(req, res) {
    try {
      const { description, amount, category = 'عام' } = req.body;

      if (!description || !amount) {
        return res.status(400).json({
          success: false,
          message: 'الوصف والمبلغ مطلوبان'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'المبلغ يجب أن يكون أكبر من صفر'
        });
      }

      const expense = await Expense.addExpense(description, amount, category);
      
      res.status(201).json({
        success: true,
        message: 'تم إضافة المصروف بنجاح',
        data: expense
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إضافة المصروف',
        error: error.message
      });
    }
  }

  // الحصول على جميع المصروفات
  static async getAllExpenses(req, res) {
    try {
      const expenses = await Expense.getAllExpenses();
      
      res.json({
        success: true,
        data: expenses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب المصروفات',
        error: error.message
      });
    }
  }

  // الحصول على مصروفات اليوم
  static async getTodayExpenses(req, res) {
    try {
      const expenses = await Expense.getTodayExpenses();
      const total = await Expense.getTodayTotalExpenses();
      
      res.json({
        success: true,
        data: {
          expenses,
          total,
          count: expenses.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب مصروفات اليوم',
        error: error.message
      });
    }
  }

  // الحصول على مصروفات تاريخ معين
  static async getExpensesByDate(req, res) {
    try {
      const { date } = req.params;
      const expenses = await Expense.getExpensesByDate(date);
      const total = await Expense.getTotalExpensesByDate(date);
      
      res.json({
        success: true,
        data: {
          expenses,
          total,
          count: expenses.length,
          date
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب المصروفات',
        error: error.message
      });
    }
  }

  // الحصول على مصروف بالمعرف
  static async getExpenseById(req, res) {
    try {
      const { id } = req.params;
      const expense = await Expense.getExpenseById(id);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'المصروف غير موجود'
        });
      }

      res.json({
        success: true,
        data: expense
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب المصروف',
        error: error.message
      });
    }
  }

  // تحديث مصروف
  static async updateExpense(req, res) {
    try {
      const { id } = req.params;
      const { description, amount, category } = req.body;

      if (!description || !amount) {
        return res.status(400).json({
          success: false,
          message: 'الوصف والمبلغ مطلوبان'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'المبلغ يجب أن يكون أكبر من صفر'
        });
      }

      const result = await Expense.updateExpense(id, description, amount, category);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'المصروف غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث المصروف بنجاح'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث المصروف',
        error: error.message
      });
    }
  }

  // حذف مصروف
  static async deleteExpense(req, res) {
    try {
      const { id } = req.params;
      const result = await Expense.deleteExpense(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'المصروف غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف المصروف بنجاح'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حذف المصروف',
        error: error.message
      });
    }
  }

  // الحصول على المصروفات حسب الفئة
  static async getExpensesByCategory(req, res) {
    try {
      const { category } = req.params;
      const expenses = await Expense.getExpensesByCategory(category);
      
      res.json({
        success: true,
        data: expenses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب المصروفات',
        error: error.message
      });
    }
  }

  // الحصول على جميع الفئات
  static async getCategories(req, res) {
    try {
      const categories = await Expense.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الفئات',
        error: error.message
      });
    }
  }

  // الحصول على إجمالي المصروفات لفترة معينة
  static async getExpensesTotal(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'تاريخ البداية وتاريخ النهاية مطلوبان'
        });
      }

      // هذا يحتاج إلى إضافة method جديد في Expense model
      res.json({
        success: true,
        message: 'سيتم إضافة هذه الميزة قريباً'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب إجمالي المصروفات',
        error: error.message
      });
    }
  }
}

module.exports = ExpenseController;
