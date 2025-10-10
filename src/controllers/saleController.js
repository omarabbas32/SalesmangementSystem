const Sale = require('../models/Sale');
const Product = require('../models/Product');

class SaleController {
  // إضافة عملية بيع جديدة
  static async addSale(req, res) {
    try {
      const { productId, weightGrams } = req.body;

      if (!productId || !weightGrams) {
        return res.status(400).json({
          success: false,
          message: 'معرف المنتج والوزن بالجرام مطلوبان'
        });
      }

      if (weightGrams <= 0) {
        return res.status(400).json({
          success: false,
          message: 'الوزن بالجرام يجب أن يكون أكبر من صفر'
        });
      }

      // التحقق من وجود المنتج
      const product = await Product.getProductById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'المنتج غير موجود'
        });
      }

      // التحقق من توفر المخزون
      if (product.current_stock_grams < weightGrams) {
        return res.status(400).json({
          success: false,
          message: `المخزون المتاح: ${product.current_stock_grams} جرام فقط`
        });
      }

      const sale = await Sale.addSale(productId, weightGrams);
      
      res.status(201).json({
        success: true,
        message: 'تم تسجيل البيع بنجاح',
        data: sale
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تسجيل البيع',
        error: error.message
      });
    }
  }

  // الحصول على جميع المبيعات
  static async getAllSales(req, res) {
    try {
      const sales = await Sale.getAllSales();
      
      res.json({
        success: true,
        data: sales
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب المبيعات',
        error: error.message
      });
    }
  }

  // الحصول على مبيعات اليوم
  static async getTodaySales(req, res) {
    try {
      const sales = await Sale.getTodaySales();
      const total = await Sale.getTodayTotalSales();
      
      res.json({
        success: true,
        data: {
          sales,
          total,
          count: sales.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب مبيعات اليوم',
        error: error.message
      });
    }
  }

  // الحصول على مبيعات تاريخ معين
  static async getSalesByDate(req, res) {
    try {
      const { date } = req.params;
      const sales = await Sale.getSalesByDate(date);
      const total = await Sale.getTotalSalesByDate(date);
      
      res.json({
        success: true,
        data: {
          sales,
          total,
          count: sales.length,
          date
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب المبيعات',
        error: error.message
      });
    }
  }

  // الحصول على تفاصيل فاتورة معينة
  static async getSaleById(req, res) {
    try {
      const { id } = req.params;
      const sale = await Sale.getSaleById(id);

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'عملية البيع غير موجودة'
        });
      }

      res.json({
        success: true,
        data: sale
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب تفاصيل البيع',
        error: error.message
      });
    }
  }

  // إلغاء عملية بيع
  static async cancelSale(req, res) {
    try {
      const { id } = req.params;
      const result = await Sale.cancelSale(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'عملية البيع غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم إلغاء عملية البيع بنجاح'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إلغاء عملية البيع',
        error: error.message
      });
    }
  }

  // الحصول على إجمالي المبيعات لفترة معينة
  static async getSalesTotal(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'تاريخ البداية وتاريخ النهاية مطلوبان'
        });
      }

      // هذا يحتاج إلى إضافة method جديد في Sale model
      const sql = `SELECT COALESCE(SUM(total_amount), 0) as total 
                   FROM sales 
                   WHERE DATE(sale_date) BETWEEN DATE(?) AND DATE(?)`;
      
      // يمكن إضافة هذا method لاحقاً في Sale model
      res.json({
        success: true,
        message: 'سيتم إضافة هذه الميزة قريباً'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب إجمالي المبيعات',
        error: error.message
      });
    }
  }

  // طباعة فاتورة
  static async printInvoice(req, res) {
    try {
      const { id } = req.params;
      const sale = await Sale.getSaleById(id);

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'عملية البيع غير موجودة'
        });
      }

      // إضافة تفاصيل إضافية للفاتورة
      const invoiceData = {
        ...sale,
        weightKg: Math.round(sale.weight_grams / 1000 * 1000) / 1000,
        invoiceNumber: `INV-${sale.id.toString().padStart(6, '0')}`,
        formattedDate: new Date(sale.sale_date).toLocaleDateString('ar-SA')
      };

      res.json({
        success: true,
        data: invoiceData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في طباعة الفاتورة',
        error: error.message
      });
    }
  }
}

module.exports = SaleController;
