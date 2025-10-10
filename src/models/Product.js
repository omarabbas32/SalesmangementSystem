const jsonStorage = require('../storage/jsonStorage');

class Product {
  // إضافة منتج جديد
  static async addProduct(name, pricePerKg, initialStockGrams = 0) {
    try {
      const product = await jsonStorage.addItem('products.json', {
        name,
        price_per_kg: pricePerKg,
        current_stock_grams: initialStockGrams
      });
      return product;
    } catch (error) {
      throw error;
    }
  }

  // الحصول على جميع المنتجات
  static async getAllProducts() {
    try {
      const products = await jsonStorage.getAll('products.json');
      return products.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw error;
    }
  }

  // الحصول على منتج بالمعرف
  static async getProductById(id) {
    try {
      return await jsonStorage.findById('products.json', parseInt(id));
    } catch (error) {
      throw error;
    }
  }

  // تحديث المخزون
  static async updateStock(productId, newStockGrams) {
    try {
      const updated = await jsonStorage.updateItem('products.json', parseInt(productId), {
        current_stock_grams: newStockGrams
      });
      return { changes: updated ? 1 : 0 };
    } catch (error) {
      throw error;
    }
  }

  // إضافة مخزون
  static async addStock(productId, additionalGrams, reason = 'إضافة مخزون') {
    try {
      // أولاً نحصل على المخزون الحالي
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error('المنتج غير موجود');
      }

      const newStock = product.current_stock_grams + additionalGrams;
      
      // تحديث المخزون
      await this.updateStock(productId, newStock);
      
      // تسجيل العملية في جدول تعديلات المخزون
      await jsonStorage.addItem('inventory_adjustments.json', {
        product_id: parseInt(productId),
        weight_grams: additionalGrams,
        adjustment_type: 'add',
        reason
      });
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // خصم من المخزون (للبيع)
  static async deductStock(productId, gramsToDeduct, reason = 'بيع') {
    try {
      // أولاً نحصل على المخزون الحالي
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error('المنتج غير موجود');
      }

      if (product.current_stock_grams < gramsToDeduct) {
        throw new Error('المخزون غير كافي');
      }

      const newStock = product.current_stock_grams - gramsToDeduct;
      
      // تحديث المخزون
      await this.updateStock(productId, newStock);
      
      // تسجيل العملية في جدول تعديلات المخزون
      await jsonStorage.addItem('inventory_adjustments.json', {
        product_id: parseInt(productId),
        weight_grams: gramsToDeduct,
        adjustment_type: 'remove',
        reason
      });
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // تحديث سعر المنتج
  static async updatePrice(productId, newPricePerKg) {
    try {
      const updated = await jsonStorage.updateItem('products.json', parseInt(productId), {
        price_per_kg: newPricePerKg
      });
      return { changes: updated ? 1 : 0 };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Product;
