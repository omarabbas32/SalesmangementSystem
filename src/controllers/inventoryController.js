const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');

class InventoryController {
  // الحصول على تقرير المخزون الحالي
  static async getCurrentInventory(req, res) {
    try {
      const inventory = await Inventory.getCurrentInventory();
      
      res.json({
        success: true,
        data: inventory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب تقرير المخزون',
        error: error.message
      });
    }
  }

  // الحصول على جرد يومي شامل
  static async getDailyReport(req, res) {
    try {
      const { date } = req.query;
      const report = await Inventory.getDailyReport(date);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب التقرير اليومي',
        error: error.message
      });
    }
  }

  // الحصول على تقرير شهري
  static async getMonthlyReport(req, res) {
    try {
      const { year, month } = req.params;
      
      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'السنة والشهر مطلوبان'
        });
      }

      const report = await Inventory.getMonthlyReport(year, month);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب التقرير الشهري',
        error: error.message
      });
    }
  }

  // الحصول على المنتجات منخفضة المخزون
  static async getLowStockProducts(req, res) {
    try {
      const { threshold = 1000 } = req.query;
      const products = await Inventory.getLowStockProducts(parseInt(threshold));
      
      res.json({
        success: true,
        data: {
          products,
          threshold: parseInt(threshold),
          count: products.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب المنتجات منخفضة المخزون',
        error: error.message
      });
    }
  }

  // الحصول على إحصائيات عامة
  static async getGeneralStats(req, res) {
    try {
      const stats = await Inventory.getGeneralStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الإحصائيات',
        error: error.message
      });
    }
  }

  // الحصول على تاريخ تعديلات المخزون
  static async getInventoryAdjustments(req, res) {
    try {
      const { productId } = req.query;
      const adjustments = await Inventory.getInventoryAdjustments(productId);
      
      res.json({
        success: true,
        data: adjustments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب تعديلات المخزون',
        error: error.message
      });
    }
  }

  // الحصول على لوحة التحكم الرئيسية
  static async getDashboard(req, res) {
    try {
      const [
        stats,
        todaySales,
        todayExpenses,
        lowStockProducts
      ] = await Promise.all([
        Inventory.getGeneralStats(),
        Sale.getTodaySales(),
        Expense.getTodayExpenses(),
        Inventory.getLowStockProducts(1000)
      ]);

      res.json({
        success: true,
        data: {
          stats,
          todaySales,
          todayExpenses,
          lowStockProducts,
          summary: {
            todayProfit: stats.todayProfit,
            lowStockCount: lowStockProducts.length,
            totalProducts: stats.totalProducts
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب لوحة التحكم',
        error: error.message
      });
    }
  }

  // تصدير التقرير اليومي (CSV format)
  static async exportDailyReport(req, res) {
    try {
      const { date } = req.query;
      const report = await Inventory.getDailyReport(date);
      
      // تحضير البيانات للتصدير
      const csvData = {
        date: report.date,
        sales: report.sales.items.map(sale => ({
          product: sale.product_name,
          weight: sale.weight_grams,
          pricePerKg: sale.price_per_kg,
          total: sale.total_amount,
          time: new Date(sale.sale_date).toLocaleTimeString('ar-SA')
        })),
        expenses: report.expenses.items.map(expense => ({
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          time: new Date(expense.expense_date).toLocaleTimeString('ar-SA')
        })),
        summary: {
          totalSales: report.sales.total,
          totalExpenses: report.expenses.total,
          netProfit: report.summary.netProfit
        }
      };

      res.json({
        success: true,
        data: csvData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تصدير التقرير',
        error: error.message
      });
    }
  }

  // الحصول على تقرير المبيعات الشهرية
  static async getSalesReport(req, res) {
    try {
      const { year, month } = req.params;
      
      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'السنة والشهر مطلوبان'
        });
      }

      const report = await Inventory.getMonthlyReport(year, month);
      
      // إضافة تفاصيل إضافية للتقرير الشهري
      const enhancedReport = {
        ...report,
        productBreakdown: await Inventory.getProductBreakdownForMonth(year, month),
        dailyBreakdown: report.dailyReports.map(day => ({
          ...day,
          formattedDate: new Date(day.date).toLocaleDateString('ar-SA'),
          profit: day.daily_sales - day.daily_expenses
        }))
      };
      
      res.json({
        success: true,
        data: enhancedReport
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب تقرير المبيعات',
        error: error.message
      });
    }
  }
}

module.exports = InventoryController;
