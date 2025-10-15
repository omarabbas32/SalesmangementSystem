require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');

// Your custom modules and routes
const jsonStorage = require('./src/storage/jsonStorage');
const mongoBackup = require('./src/storage/mongoBackup');
const apiRoutes = require('./src/routes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS Headers Middleware
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
 
// Serve the frontend application
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api', apiRoutes);

// Backup Routes
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

// Automatic Backup Timers
setInterval(async () => {
    try {
        const result = await mongoBackup.smartBackup(jsonStorage);
        console.log(`✅ تم النسخ الاحتياطي التلقائي: ${result.message}`);
    } catch (error) {
        console.error('❌ خطأ في النسخ الاحتياطي التلقائي:', error.message);
    }
}, 5 * 60 * 1000); // Every 5 minutes

setTimeout(async () => {
    try {
        const result = await mongoBackup.smartBackup(jsonStorage);
        console.log(`✅ تم النسخ الاحتياطي الأولي: ${result.message}`);
    } catch (error) {
        console.log('⚠️ تحذير: فشل النسخ الاحتياطي الأولي:', error.message);
        console.log('💡 سيتم المحاولة مرة أخرى في النسخ الاحتياطي التلقائي');
    }
}, 2000); // On startup

// Root route and catch-all for frontend
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'نظام إدارة المبيعات - API',
        version: '1.0.0'
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

// Function to connect to the database and then start the server
const startServer = async () => {
  try {
    // 1. Wait for the database connection to complete
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected successfully via Mongoose.');

    // 2. Only after a successful connection, start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      
      // --- MOVED TIMERS HERE ---
      // 3. Now that the server is running and DB is connected, start the backup timers.
      
      // Initial backup on startup
      setTimeout(async () => {
        try {
          const result = await mongoBackup.smartBackup(jsonStorage);
          console.log(`✅ تم النسخ الاحتياطي الأولي: ${result.message}`);
        } catch (error) {
          console.log('⚠️ تحذير: فشل النسخ الاحتياطي الأولي:', error.message);
        }
      }, 2000);

      // Automatic backup every 5 minutes
      setInterval(async () => {
        try {
          const result = await mongoBackup.smartBackup(jsonStorage);
          console.log(`✅ تم النسخ الاحتياطي التلقائي: ${result.message}`);
        } catch (error) {
          console.error('❌ خطأ في النسخ الاحتياطي التلقائي:', error.message);
        }
      }, 5 * 60 * 1000);

    });

  } catch (error)
  {
    console.error('❌ Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

// Start the application by calling the function
startServer();