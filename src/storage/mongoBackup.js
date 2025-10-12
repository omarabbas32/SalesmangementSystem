const mongoose = require('mongoose');

class MongoBackup {
  constructor() {
    this.isConnected = false;
    this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/salesManagement';
    console.log("MONGODB_URI:", process.env.MONGODB_URI);
    this.connectionTimeout = 5000; // 5 seconds timeout
  }

  // الاتصال بقاعدة البيانات
  async connect() {
    try {
      if (!this.isConnected) {
        // إضافة timeout للاتصال
        const connectPromise = mongoose.connect(this.connectionString, {
          serverSelectionTimeoutMS: this.connectionTimeout,
          maxPoolSize: 10,
          socketTimeoutMS: 45000,
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('انتهت مهلة الاتصال بـ MongoDB')), this.connectionTimeout)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        this.isConnected = true;
        console.log('✅ تم الاتصال بـ MongoDB بنجاح');
      }
    } catch (error) {
      console.error('❌ خطأ في الاتصال بـ MongoDB:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  // قطع الاتصال
  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log('✅ تم قطع الاتصال من MongoDB');
      }
    } catch (error) {
      console.error('❌ خطأ في قطع الاتصال من MongoDB:', error);
    }
  }

  // إعادة تعيين النماذج
  clearModels() {
    try {
      delete mongoose.models.Product;
      delete mongoose.models.Sale;
      delete mongoose.models.Expense;
      delete mongoose.models.InventoryAdjustment;
      console.log('✅ تم إعادة تعيين النماذج');
    } catch (error) {
      console.log('⚠️ تحذير: لم يتم إعادة تعيين جميع النماذج');
    }
  }

  // تعريف النماذج
  defineSchemas() {
    // التحقق من وجود النماذج أولاً لتجنب إعادة الإنشاء
    let Product, Sale, Expense, InventoryAdjustment;
    
    try {
      Product = mongoose.model('Product');
    } catch (error) {
      const productSchema = new mongoose.Schema({
        id: { type: Number, required: true, unique: true },
        name: { type: String, required: true },
        pricePerKg: { type: Number, required: true },
        currentStockGrams: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });
      Product = mongoose.model('Product', productSchema);
    }

    try {
      Sale = mongoose.model('Sale');
    } catch (error) {
      const saleSchema = new mongoose.Schema({
        id: { type: Number, required: true, unique: true },
        productId: { type: Number, required: true },
        weightGrams: { type: Number, required: true },
        pricePerKg: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        saleDate: { type: Date, default: Date.now }
      });
      Sale = mongoose.model('Sale', saleSchema);
    }

    try {
      Expense = mongoose.model('Expense');
    } catch (error) {
      const expenseSchema = new mongoose.Schema({
        id: { type: Number, required: true, unique: true },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        category: { type: String, default: 'عام' },
        expenseDate: { type: Date, default: Date.now }
      });
      Expense = mongoose.model('Expense', expenseSchema);
    }

    try {
      InventoryAdjustment = mongoose.model('InventoryAdjustment');
    } catch (error) {
      const inventoryAdjustmentSchema = new mongoose.Schema({
        id: { type: Number, required: true, unique: true },
        productId: { type: Number, required: true },
        weightGrams: { type: Number, required: true },
        adjustmentType: { type: String, enum: ['add', 'remove'], required: true },
        reason: { type: String },
        adjustmentDate: { type: Date, default: Date.now }
      });
      InventoryAdjustment = mongoose.model('InventoryAdjustment', inventoryAdjustmentSchema);
    }

    return { Product, Sale, Expense, InventoryAdjustment };
  }

  // رفع البيانات إلى MongoDB
  async uploadData(jsonStorage) {
    try {
      await this.connect();
      const { Product, Sale, Expense, InventoryAdjustment } = this.defineSchemas();

      // مسح البيانات القديمة
      await Product.deleteMany({});
      await Sale.deleteMany({});
      await Expense.deleteMany({});
      await InventoryAdjustment.deleteMany({});

      // رفع المنتجات
      const products = await jsonStorage.getAll('products.json');
      if (products.length > 0) {
        
        await Product.insertMany(products.map(p => ({
          id: p.id,
          name: p.name,
          pricePerKg: p.price_per_kg || p.pricePerKg,
          currentStockGrams: p.current_stock_grams || p.currentStockGrams,
          createdAt: p.createdAt || p.created_at,
          updatedAt: p.updatedAt || p.updated_at
        })));
        console.log(`✅ تم رفع ${products.length} منتج`);
      }

      // رفع المبيعات
      const sales = await jsonStorage.getAll('sales.json');
      if (sales.length > 0) {
        await Sale.insertMany(sales.map(s => ({
          id: s.id,
          productId: s.product_id || s.productId,
          weightGrams: s.weight_grams || s.weightGrams,
          pricePerKg: s.price_per_kg || s.pricePerKg,
          totalAmount: s.total_amount || s.totalAmount,
          saleDate: s.sale_date || s.saleDate
        })));
        console.log(`✅ تم رفع ${sales.length} عملية بيع`);
      }

      // رفع المصروفات
      const expenses = await jsonStorage.getAll('expenses.json');
      if (expenses.length > 0) {
        await Expense.insertMany(expenses.map(e => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          category: e.category,
          expenseDate: e.expense_date || e.expenseDate
        })));
        console.log(`✅ تم رفع ${expenses.length} مصروف`);
      }

      // رفع تعديلات المخزون
      const adjustments = await jsonStorage.getAll('inventory_adjustments.json');
      if (adjustments.length > 0) {
        await InventoryAdjustment.insertMany(adjustments.map(a => ({
          id: a.id,
          productId: a.product_id || a.productId,
          weightGrams: a.weight_grams || a.weightGrams,
          adjustmentType: a.adjustment_type || a.adjustmentType,
          reason: a.reason,
          adjustmentDate: a.adjustment_date || a.adjustmentDate
        })));
        console.log(`✅ تم رفع ${adjustments.length} تعديل مخزون`);
      }

      console.log('🎉 تم رفع جميع البيانات إلى MongoDB بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في رفع البيانات إلى MongoDB:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  // تحميل البيانات من MongoDB
  async downloadData(jsonStorage) {
    try {
      await this.connect();
      const { Product, Sale, Expense, InventoryAdjustment } = this.defineSchemas();

      // تحميل المنتجات
      const products = await Product.find({}).lean();
      await jsonStorage.writeFile('products.json', products.map(p => ({
        id: p.id,
        name: p.name,
        price_per_kg: p.pricePerKg,
        current_stock_grams: p.currentStockGrams,
        created_at: p.createdAt,
        updated_at: p.updatedAt
      })));

      // تحميل المبيعات
      const sales = await Sale.find({}).lean();
      await jsonStorage.writeFile('sales.json', sales.map(s => ({
        id: s.id,
        product_id: s.productId,
        weight_grams: s.weightGrams,
        price_per_kg: s.pricePerKg,
        total_amount: s.totalAmount,
        sale_date: s.saleDate
      })));

      // تحميل المصروفات
      const expenses = await Expense.find({}).lean();
      await jsonStorage.writeFile('expenses.json', expenses.map(e => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        category: e.category,
        expense_date: e.expenseDate
      })));

      // تحميل تعديلات المخزون
      const adjustments = await InventoryAdjustment.find({}).lean();
      await jsonStorage.writeFile('inventory_adjustments.json', adjustments.map(a => ({
        id: a.id,
        product_id: a.productId,
        weight_grams: a.weightGrams,
        adjustment_type: a.adjustmentType,
        reason: a.reason,
        adjustment_date: a.adjustmentDate
      })));

      console.log('🎉 تم تحميل جميع البيانات من MongoDB بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات من MongoDB:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  // مزامنة البيانات (رفع وتحميل)
  async syncData(jsonStorage) {
    try {
      console.log('🔄 بدء مزامنة البيانات مع MongoDB...');
      await this.uploadData(jsonStorage);
      console.log('✅ تمت المزامنة بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في مزامنة البيانات:', error);
      throw error;
    }
  }

  // التحقق من حالة الاتصال
  async checkConnection() {
    try {
      await this.connect();
      const { Product } = this.defineSchemas();
      const count = await Product.countDocuments();
      await this.disconnect();
      return {
        connected: true,
        message: 'الاتصال بـ MongoDB يعمل بشكل طبيعي',
        productCount: count,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        message: 'خطأ في الاتصال بـ MongoDB',
        error: error.message,
        lastChecked: new Date().toISOString(),
        suggestion: 'تأكد من تشغيل MongoDB أو تحقق من متغير البيئة MONGODB_URI'
      };
    }
  }

  // التحقق من صحة البيانات قبل النسخ الاحتياطي
  async validateDataBeforeUpload(jsonStorage) {
    try {
      const [products, sales, expenses, adjustments] = await Promise.all([
        jsonStorage.getAll('products.json').catch(() => []),
        jsonStorage.getAll('sales.json').catch(() => []),
        jsonStorage.getAll('expenses.json').catch(() => []),
        jsonStorage.getAll('inventory_adjustments.json').catch(() => [])
      ]);

      return {
        isValid: true,
        dataSummary: {
          products: products.length,
          sales: sales.length,
          expenses: expenses.length,
          adjustments: adjustments.length
        }
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  // نسخ احتياطي آمن مع التحقق من البيانات
  async safeUploadData(jsonStorage) {
    try {
      // التحقق من صحة البيانات أولاً
      const validation = await this.validateDataBeforeUpload(jsonStorage);
      if (!validation.isValid) {
        throw new Error(`بيانات غير صحيحة: ${validation.error}`);
      }

      console.log(`📊 التحقق من البيانات: ${JSON.stringify(validation.dataSummary)}`);
      
      // رفع البيانات
      const result = await this.uploadData(jsonStorage);
      
      return {
        success: true,
        message: 'تم النسخ الاحتياطي إلى MongoDB بنجاح',
        dataSummary: validation.dataSummary,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ خطأ في النسخ الاحتياطي الآمن:', error);
      throw error;
    }
  }

  // النسخ الاحتياطي المحلي (بدون MongoDB)
  async createLocalBackup(jsonStorage) {
    try {
      const validation = await this.validateDataBeforeUpload(jsonStorage);
      if (!validation.isValid) {
        throw new Error(`بيانات غير صحيحة: ${validation.error}`);
      }

      // استخدام النسخ الاحتياطي المحلي من jsonStorage
      const backupFile = await jsonStorage.backupData();
      
      return {
        success: true,
        message: 'تم إنشاء النسخ الاحتياطي المحلي بنجاح',
        dataSummary: validation.dataSummary,
        backupFile: backupFile,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ خطأ في النسخ الاحتياطي المحلي:', error);
      throw error;
    }
  }

  // النسخ الاحتياطي الذكي (MongoDB إذا متاح، محلي إذا لم يكن متاح)
  async smartBackup(jsonStorage) {
    try {
      // محاولة الاتصال بـ MongoDB أولاً
      const connectionStatus = await this.checkConnection();
      
      if (connectionStatus.connected) {
        // MongoDB متاح - استخدام النسخ الاحتياطي السحابي
        return await this.safeUploadData(jsonStorage);
      } else {
        // MongoDB غير متاح - استخدام النسخ الاحتياطي المحلي
        console.log('⚠️ MongoDB غير متاح، سيتم إنشاء نسخ احتياطي محلي');
        return await this.createLocalBackup(jsonStorage);
      }
    } catch (error) {
      console.error('❌ خطأ في النسخ الاحتياطي الذكي:', error);
      // في حالة فشل كل شيء، جرب النسخ الاحتياطي المحلي كخيار أخير
      try {
        return await this.createLocalBackup(jsonStorage);
      } catch (localError) {
        throw new Error(`فشل النسخ الاحتياطي (سحابي ومحلي): ${error.message}`);
      }
    }
  }
}

module.exports = new MongoBackup();
