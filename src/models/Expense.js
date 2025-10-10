const jsonStorage = require('../storage/jsonStorage');

class Expense {
  // إضافة مصروف جديد
  static async addExpense(description, amount, category = 'عام') {
    try {
      const expense = await jsonStorage.addItem('expenses.json', {
        description,
        amount,
        category,
        expense_date: new Date().toISOString()
      });
      return expense;
    } catch (error) {
      throw error;
    }
  }

  // الحصول على جميع المصروفات
  static async getAllExpenses() {
    try {
      const expenses = await jsonStorage.getAll('expenses.json');
      return expenses.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
    } catch (error) {
      throw error;
    }
  }

  // الحصول على مصروفات تاريخ معين
  static async getExpensesByDate(date) {
    try {
      const expenses = await this.getAllExpenses();
      const targetDate = new Date(date).toDateString();
      
      return expenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date).toDateString();
        return expenseDate === targetDate;
      });
    } catch (error) {
      throw error;
    }
  }

  // الحصول على مصروفات اليوم
  static async getTodayExpenses() {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await this.getExpensesByDate(today);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على إجمالي المصروفات لتاريخ معين
  static async getTotalExpensesByDate(date) {
    try {
      const expenses = await this.getExpensesByDate(date);
      return expenses.reduce((total, expense) => total + expense.amount, 0);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على إجمالي مصروفات اليوم
  static async getTodayTotalExpenses() {
    try {
      const expenses = await this.getTodayExpenses();
      return expenses.reduce((total, expense) => total + expense.amount, 0);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على مصروف بالمعرف
  static async getExpenseById(id) {
    try {
      return await jsonStorage.findById('expenses.json', parseInt(id));
    } catch (error) {
      throw error;
    }
  }

  // تحديث مصروف
  static async updateExpense(id, description, amount, category) {
    try {
      const updated = await jsonStorage.updateItem('expenses.json', parseInt(id), {
        description,
        amount,
        category
      });
      return { changes: updated ? 1 : 0 };
    } catch (error) {
      throw error;
    }
  }

  // حذف مصروف
  static async deleteExpense(id) {
    try {
      const deleted = await jsonStorage.deleteItem('expenses.json', parseInt(id));
      return { changes: deleted ? 1 : 0 };
    } catch (error) {
      throw error;
    }
  }

  // الحصول على المصروفات حسب الفئة
  static async getExpensesByCategory(category) {
    try {
      const expenses = await this.getAllExpenses();
      return expenses.filter(expense => expense.category === category);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على جميع الفئات المستخدمة
  static async getCategories() {
    try {
      const expenses = await this.getAllExpenses();
      const categories = [...new Set(expenses.map(expense => expense.category))];
      return categories.sort();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Expense;
