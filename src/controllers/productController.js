const Product = require('../models/Product');

class ProductController {
  // إضافة منتج جديد
  static async addProduct(req, res) {
    try {
      const { name, pricePerKg, initialStockGrams = 0 } = req.body;

      if (!name || !pricePerKg) {
        return res.status(400).json({
          success: false,
          message: 'الاسم وسعر الكيلو مطلوبان'
        });
      }

      if (pricePerKg <= 0) {
        return res.status(400).json({
          success: false,
          message: 'سعر الكيلو يجب أن يكون أكبر من صفر'
        });
      }

      if (initialStockGrams < 0) {
        return res.status(400).json({
          success: false,
          message: 'المخزون الأولي لا يمكن أن يكون سالباً'
        });
      }

      const product = await Product.addProduct(name, pricePerKg, initialStockGrams);
      
      res.status(201).json({
        success: true,
        message: 'تم إضافة المنتج بنجاح',
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إضافة المنتج',
        error: error.message
      });
    }
  }

  // الحصول على جميع المنتجات
  static async getAllProducts(req, res) {
    try {
      const products = await Product.getAllProducts();
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب المنتجات',
        error: error.message
      });
    }
  }

  // الحصول على منتج بالمعرف
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'المنتج غير موجود'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب المنتج',
        error: error.message
      });
    }
  }

  // إضافة مخزون
  static async addStock(req, res) {
    try {
      const { id } = req.params;
      const { grams, reason = 'إضافة مخزون' } = req.body;

      if (!grams || grams <= 0) {
        return res.status(400).json({
          success: false,
          message: 'الوزن بالجرام مطلوب ويجب أن يكون أكبر من صفر'
        });
      }

      await Product.addStock(id, grams, reason);
      
      res.json({
        success: true,
        message: 'تم إضافة المخزون بنجاح'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إضافة المخزون',
        error: error.message
      });
    }
  }

  // تحديث سعر المنتج
  static async updatePrice(req, res) {
    try {
      const { id } = req.params;
      const { pricePerKg } = req.body;

      if (!pricePerKg || pricePerKg <= 0) {
        return res.status(400).json({
          success: false,
          message: 'سعر الكيلو مطلوب ويجب أن يكون أكبر من صفر'
        });
      }

      const result = await Product.updatePrice(id, pricePerKg);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'المنتج غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث سعر المنتج بنجاح'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث سعر المنتج',
        error: error.message
      });
    }
  }

  // الحصول على المخزون الحالي
  static async getCurrentStock(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'المنتج غير موجود'
        });
      }

      res.json({
        success: true,
        data: {
          id: product.id,
          name: product.name,
          currentStockGrams: product.current_stock_grams,
          currentStockKg: Math.round(product.current_stock_grams / 1000 * 1000) / 1000,
          pricePerKg: product.price_per_kg
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب المخزون',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;
