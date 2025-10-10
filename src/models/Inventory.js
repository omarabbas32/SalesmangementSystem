const jsonStorage = require('../storage/jsonStorage');

class Inventory {
  // الحصول على تقرير المخزون الحالي
  static async getCurrentInventory() {
    try {
      const products = await jsonStorage.getAll('products.json');
      
      return products.map(product => ({
        ...product,
        stock_kg: Math.round(product.current_stock_grams / 1000 * 1000) / 1000,
        stock_value: product.current_stock_grams * product.price_per_kg / 1000
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw error;
    }
  }

  // الحصول على تاريخ تعديلات المخزون
  static async getInventoryAdjustments(productId = null) {
    try {
      const adjustments = await jsonStorage.getAll('inventory_adjustments.json');
      const products = await jsonStorage.getAll('products.json');
      
      let filteredAdjustments = adjustments;
      if (productId) {
        filteredAdjustments = adjustments.filter(adj => adj.product_id === parseInt(productId));
      }
      
      return filteredAdjustments.map(adjustment => {
        const product = products.find(p => p.id === adjustment.product_id);
        return {
          ...adjustment,
          product_name: product ? product.name : 'منتج محذوف'
        };
      }).sort((a, b) => new Date(b.adjustment_date) - new Date(a.adjustment_date));
    } catch (error) {
      throw error;
    }
  }

  // الحصول على جرد يومي شامل
  static async getDailyReport(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const [sales, expenses, inventory] = await Promise.all([
        this.getSalesForDate(targetDate),
        this.getExpensesForDate(targetDate),
        this.getCurrentInventory()
      ]);
      
      const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalStockValue = inventory.reduce((sum, item) => sum + item.stock_value, 0);
      
      return {
        date: targetDate,
        sales: {
          items: sales,
          total: totalSales,
          count: sales.length
        },
        expenses: {
          items: expenses,
          total: totalExpenses,
          count: expenses.length
        },
        inventory: {
          items: inventory,
          totalValue: totalStockValue,
          count: inventory.length
        },
        summary: {
          netProfit: totalSales - totalExpenses,
          totalRevenue: totalSales,
          totalExpenses: totalExpenses
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // مساعدة: الحصول على المبيعات لتاريخ معين
  static async getSalesForDate(date) {
    try {
      const Sale = require('./Sale');
      return await Sale.getSalesByDate(date);
    } catch (error) {
      throw error;
    }
  }

  // مساعدة: الحصول على المصروفات لتاريخ معين
  static async getExpensesForDate(date) {
    try {
      const Expense = require('./Expense');
      return await Expense.getExpensesByDate(date);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على تقرير شهري
  static async getMonthlyReport(year, month) {
    try {
      const Sale = require('./Sale');
      const Expense = require('./Expense');
      
      // الحصول على جميع المبيعات والمصروفات
      const [allSales, allExpenses] = await Promise.all([
        jsonStorage.getAll('sales.json'),
        jsonStorage.getAll('expenses.json')
      ]);
      
      // تصفية البيانات للشهر والسنة المطلوبة
      const yearStr = year.toString();
      const monthStr = month.toString().padStart(2, '0');
      
      const monthlySales = allSales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        const saleYear = saleDate.getFullYear().toString();
        const saleMonth = (saleDate.getMonth() + 1).toString().padStart(2, '0');
        return saleYear === yearStr && saleMonth === monthStr;
      });
      
      const monthlyExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        const expenseYear = expenseDate.getFullYear().toString();
        const expenseMonth = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
        return expenseYear === yearStr && expenseMonth === monthStr;
      });
      
      // تجميع البيانات حسب اليوم
      const dailyReports = {};
      
      // معالجة المبيعات
      monthlySales.forEach(sale => {
        const date = new Date(sale.sale_date).toISOString().split('T')[0];
        if (!dailyReports[date]) {
          dailyReports[date] = {
            date,
            sales_count: 0,
            daily_sales: 0,
            daily_expenses: 0
          };
        }
        dailyReports[date].sales_count++;
        dailyReports[date].daily_sales += sale.total_amount;
      });
      
      // معالجة المصروفات
      monthlyExpenses.forEach(expense => {
        const date = new Date(expense.expense_date).toISOString().split('T')[0];
        if (!dailyReports[date]) {
          dailyReports[date] = {
            date,
            sales_count: 0,
            daily_sales: 0,
            daily_expenses: 0
          };
        }
        dailyReports[date].daily_expenses += expense.amount;
      });
      
      // تحويل إلى مصفوفة وترتيب
      const dailyReportsArray = Object.values(dailyReports)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // حساب الإجماليات
      const totalSales = dailyReportsArray.reduce((sum, day) => sum + day.daily_sales, 0);
      const totalExpenses = dailyReportsArray.reduce((sum, day) => sum + day.daily_expenses, 0);
      
      return {
        year: parseInt(year),
        month: parseInt(month),
        dailyReports: dailyReportsArray,
        summary: {
          totalSales,
          totalExpenses,
          netProfit: totalSales - totalExpenses,
          daysWithSales: dailyReportsArray.filter(day => day.sales_count > 0).length,
          daysWithExpenses: dailyReportsArray.filter(day => day.daily_expenses > 0).length,
          totalDays: dailyReportsArray.length
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // الحصول على المنتجات منخفضة المخزون
  static async getLowStockProducts(thresholdGrams = 1000) {
    try {
      const products = await this.getCurrentInventory();
      return products.filter(product => product.current_stock_grams < thresholdGrams)
                    .sort((a, b) => a.current_stock_grams - b.current_stock_grams);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على تفصيل المنتجات للشهر
  static async getProductBreakdownForMonth(year, month) {
    try {
      const [allSales, products] = await Promise.all([
        jsonStorage.getAll('sales.json'),
        jsonStorage.getAll('products.json')
      ]);
      
      const yearStr = year.toString();
      const monthStr = month.toString().padStart(2, '0');
      
      // تصفية المبيعات للشهر المطلوب
      const monthlySales = allSales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        const saleYear = saleDate.getFullYear().toString();
        const saleMonth = (saleDate.getMonth() + 1).toString().padStart(2, '0');
        return saleYear === yearStr && saleMonth === monthStr;
      });
      
      // تجميع المبيعات حسب المنتج
      const productStats = {};
      
      monthlySales.forEach(sale => {
        const productId = sale.product_id;
        if (!productStats[productId]) {
          const product = products.find(p => p.id === productId);
          productStats[productId] = {
            product_id: productId,
            product_name: product ? product.name : 'منتج محذوف',
            total_weight_grams: 0,
            total_sales: 0,
            sales_count: 0,
            average_price_per_kg: 0
          };
        }
        
        productStats[productId].total_weight_grams += sale.weight_grams;
        productStats[productId].total_sales += sale.total_amount;
        productStats[productId].sales_count++;
      });
      
      // حساب متوسط السعر لكل منتج
      Object.values(productStats).forEach(stat => {
        if (stat.total_weight_grams > 0) {
          stat.average_price_per_kg = (stat.total_sales / stat.total_weight_grams) * 1000;
        }
        stat.total_weight_kg = Math.round(stat.total_weight_grams / 1000 * 1000) / 1000;
      });
      
      return Object.values(productStats).sort((a, b) => b.total_sales - a.total_sales);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على إحصائيات عامة
  static async getGeneralStats() {
    try {
      const Sale = require('./Sale');
      const Expense = require('./Expense');
      
      const [products, todaySales, todayExpenses, lowStockProducts] = await Promise.all([
        jsonStorage.getAll('products.json'),
        Sale.getTodaySales(),
        Expense.getTodayExpenses(),
        this.getLowStockProducts(1000)
      ]);
      
      const todaySalesTotal = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const todayExpensesTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        totalProducts: products.length,
        todaySales: {
          count: todaySales.length,
          total: todaySalesTotal
        },
        todayExpenses: {
          total: todayExpensesTotal
        },
        lowStockProducts: lowStockProducts.length,
        todayProfit: todaySalesTotal - todayExpensesTotal
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Inventory;
