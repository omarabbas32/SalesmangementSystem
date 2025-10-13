require('dotenv').config();
console.log("✅ MONGODB_URI:", process.env.MONGODB_URI);

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const jsonStorage = require('./src/storage/jsonStorage');
const mongoBackup = require('./src/storage/mongoBackup');
const { MongoClient, ServerApiVersion } = require('mongodb');
const apiRoutes = require('./src/routes');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ✅ Serve frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// إضافة routes للنسخ الاحتياطي
app.post('/api/backup/upload', async (req, res) => {
  try {
    const result = await mongoBackup.safeUploadData(jsonStorage);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في رفع البيانات',
      error: error.message,
      suggestion: 'تأكد من تشغيل MongoDB أو تحقق من إعدادات الاتصال'
    });
  }
});

app.post('/api/backup/download', async (req, res) => {
  try {
    await mongoBackup.downloadData(jsonStorage);
    res.json({ success: true, message: 'تم تحميل البيانات من MongoDB بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في تحميل البيانات', error: error.message });
  }
});

app.post('/api/backup/sync', async (req, res) => {
  try {
    await mongoBackup.syncData(jsonStorage);
    res.json({ success: true, message: 'تمت مزامنة البيانات مع MongoDB بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في مزامنة البيانات', error: error.message });
  }
});

app.get('/api/backup/status', async (req, res) => {
  try {
    const status = await mongoBackup.checkConnection();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في فحص حالة MongoDB', error: error.message });
  }
});

app.post('/api/backup/local', async (req, res) => {
  try {
    const result = await mongoBackup.createLocalBackup(jsonStorage);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء النسخ الاحتياطي المحلي',
      error: error.message
    });
  }
});

app.post('/api/backup/smart', async (req, res) => {
  try {
    const result = await mongoBackup.smartBackup(jsonStorage);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في النسخ الاحتياطي الذكي',
      error: error.message
    });
  }
});

app.post('/api/backup/reset-models', async (req, res) => {
  try {
    mongoBackup.clearModels();
    res.json({
      success: true,
      message: 'تم إعادة تعيين نماذج MongoDB بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة تعيين النماذج',
      error: error.message
    });
  }
});

// النسخ الاحتياطي التلقائي كل 5 دقائق
setInterval(async () => {
  try {
    const result = await mongoBackup.smartBackup(jsonStorage);
    console.log(`✅ تم النسخ الاحتياطي التلقائي: ${result.message}`);
  } catch (error) {
    console.error('❌ خطأ في النسخ الاحتياطي التلقائي:', error.message);
  }
}, 5 * 60 * 1000);

// النسخ الاحتياطي عند بدء التشغيل
setTimeout(async () => {
  try {
    const result = await mongoBackup.smartBackup(jsonStorage);
    console.log(`✅ تم النسخ الاحتياطي الأولي: ${result.message}`);
  } catch (error) {
    console.log('⚠️ تحذير: فشل النسخ الاحتياطي الأولي:', error.message);
    console.log('💡 سيتم المحاولة مرة أخرى في النسخ الاحتياطي التلقائي');
  }
}, 2000);

// Route للصفحة الرئيسية (API Info)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'نظام إدارة المبيعات - API',
    version: '1.0.0',
    description: 'API لإدارة المنتجات والمبيعات والمصروفات والمخزون',
    endpoints: {
      products: '/api/products',
      sales: '/api/sales',
      expenses: '/api/expenses',
      inventory: '/api/inventory',
      backup: '/api/backup'
    }
  });
});

// ✅ Catch-all route to support frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler (for unknown API routes)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود',
    availableEndpoints: '/api/products, /api/sales, /api/expenses, /api/inventory, /api/backup'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  console.log(`🔗 API متاح على: http://localhost:${PORT}/api`);
  console.log(`🌍 Frontend متاح على: http://localhost:${PORT}`);
});
