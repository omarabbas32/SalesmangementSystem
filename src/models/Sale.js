const jsonStorage = require('../storage/jsonStorage');
const Product = require('./Product');

class Sale {
  // إضافة عملية بيع جديدة
  static async addSale(productId, weightGrams) {
    try {
      // أولاً نحصل على بيانات المنتج
      const product = await Product.getProductById(productId);
      if (!product) {
        throw new Error('المنتج غير موجود');
      }

      // حساب المبلغ الإجمالي
      const totalAmount = (weightGrams / 1000) * product.price_per_kg;

      // تسجيل عملية البيع
      const sale = await jsonStorage.addItem('sales.json', {
        product_id: parseInt(productId),
        weight_grams: weightGrams,
        price_per_kg: product.price_per_kg,
        total_amount: totalAmount,
        sale_date: new Date().toISOString()
      });

      // خصم من المخزون
      await Product.deductStock(productId, weightGrams, `بيع - فاتورة رقم ${sale.id}`);
      
      // إضافة اسم المنتج للاستجابة
      return {
        ...sale,
        product_name: product.name
      };
    } catch (error) {
      throw error;
    }
  }

  // الحصول على جميع المبيعات
  static async getAllSales() {
    try {
      const sales = await jsonStorage.getAll('sales.json');
      const products = await jsonStorage.getAll('products.json');
      
      return sales.map(sale => {
        const product = products.find(p => p.id === sale.product_id);
        return {
          ...sale,
          product_name: product ? product.name : 'منتج محذوف'
        };
      }).sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
    } catch (error) {
      throw error;
    }
  }

  // الحصول على المبيعات لتاريخ معين
  static async getSalesByDate(date) {
    try {
      const sales = await this.getAllSales();
      const targetDate = new Date(date).toDateString();
      
      return sales.filter(sale => {
        const saleDate = new Date(sale.sale_date).toDateString();
        return saleDate === targetDate;
      });
    } catch (error) {
      throw error;
    }
  }

  // الحصول على مبيعات اليوم
  static async getTodaySales() {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await this.getSalesByDate(today);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على إجمالي المبيعات لتاريخ معين
  static async getTotalSalesByDate(date) {
    try {
      const sales = await this.getSalesByDate(date);
      return sales.reduce((total, sale) => total + sale.total_amount, 0);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على إجمالي مبيعات اليوم
  static async getTodayTotalSales() {
    try {
      const sales = await this.getTodaySales();
      return sales.reduce((total, sale) => total + sale.total_amount, 0);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على تفاصيل فاتورة معينة
  static async getSaleById(id) {
    try {
      const sales = await this.getAllSales();
      const sale = sales.find(s => s.id === parseInt(id));
      
      if (!sale) {
        return null;
      }
      
      return sale;
    } catch (error) {
      throw error;
    }
  }

  // إلغاء عملية بيع (استرداد المخزون)
  static async cancelSale(saleId) {
    try {
      // أولاً نحصل على بيانات البيع
      const sale = await this.getSaleById(saleId);
      if (!sale) {
        throw new Error('عملية البيع غير موجودة');
      }

      // إرجاع المخزون
      await Product.addStock(sale.product_id, sale.weight_grams, `إلغاء بيع - فاتورة رقم ${saleId}`);
      
      // حذف عملية البيع
      const deleted = await jsonStorage.deleteItem('sales.json', parseInt(saleId));
      
      return { success: deleted, changes: deleted ? 1 : 0 };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Sale;
