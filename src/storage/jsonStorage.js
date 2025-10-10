const fs = require('fs-extra');
const path = require('path');

class JsonStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.initializeStorage();
  }

  // إنشاء مجلد البيانات إذا لم يكن موجوداً
  async initializeStorage() {
    try {
      await fs.ensureDir(this.dataDir);
      await this.initializeFiles();
    } catch (error) {
      console.error('خطأ في تهيئة التخزين:', error);
    }
  }

  // إنشاء ملفات JSON إذا لم تكن موجودة
  async initializeFiles() {
    const files = {
      'products.json': [],
      'sales.json': [],
      'expenses.json': [],
      'inventory_adjustments.json': []
    };

    for (const [filename, defaultData] of Object.entries(files)) {
      const filePath = path.join(this.dataDir, filename);
      if (!await fs.pathExists(filePath)) {
        await fs.writeJson(filePath, defaultData, { spaces: 2 });
      }
    }
  }

  // قراءة ملف JSON
  async readFile(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      if (!await fs.pathExists(filePath)) {
        await this.initializeFiles();
      }
      return await fs.readJson(filePath);
    } catch (error) {
      console.error(`خطأ في قراءة الملف ${filename}:`, error);
      return [];
    }
  }

  // كتابة ملف JSON
  async writeFile(filename, data) {
    try {
      const filePath = path.join(this.dataDir, filename);
      await fs.writeJson(filePath, data, { spaces: 2 });
      return true;
    } catch (error) {
      console.error(`خطأ في كتابة الملف ${filename}:`, error);
      return false;
    }
  }

  // إضافة عنصر جديد
  async addItem(filename, item) {
    try {
      const data = await this.readFile(filename);
      const newItem = {
        ...item,
        id: this.generateId(data),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.push(newItem);
      await this.writeFile(filename, data);
      return newItem;
    } catch (error) {
      console.error(`خطأ في إضافة عنصر لـ ${filename}:`, error);
      throw error;
    }
  }

  // تحديث عنصر
  async updateItem(filename, id, updates) {
    try {
      const data = await this.readFile(filename);
      const index = data.findIndex(item => item.id === id);
      if (index === -1) {
        return null;
      }
      data[index] = {
        ...data[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await this.writeFile(filename, data);
      return data[index];
    } catch (error) {
      console.error(`خطأ في تحديث عنصر في ${filename}:`, error);
      throw error;
    }
  }

  // حذف عنصر
  async deleteItem(filename, id) {
    try {
      const data = await this.readFile(filename);
      const filteredData = data.filter(item => item.id !== id);
      if (filteredData.length === data.length) {
        return false; // لم يتم العثور على العنصر
      }
      await this.writeFile(filename, filteredData);
      return true;
    } catch (error) {
      console.error(`خطأ في حذف عنصر من ${filename}:`, error);
      throw error;
    }
  }

  // البحث عن عنصر بالمعرف
  async findById(filename, id) {
    try {
      const data = await this.readFile(filename);
      return data.find(item => item.id === id);
    } catch (error) {
      console.error(`خطأ في البحث عن عنصر في ${filename}:`, error);
      return null;
    }
  }

  // البحث عن عناصر بشرط
  async findWhere(filename, condition) {
    try {
      const data = await this.readFile(filename);
      return data.filter(item => {
        return Object.keys(condition).every(key => {
          if (typeof condition[key] === 'function') {
            return condition[key](item[key]);
          }
          return item[key] === condition[key];
        });
      });
    } catch (error) {
      console.error(`خطأ في البحث في ${filename}:`, error);
      return [];
    }
  }

  // توليد معرف فريد
  generateId(data) {
    if (data.length === 0) return 1;
    const maxId = Math.max(...data.map(item => item.id || 0));
    return maxId + 1;
  }

  // الحصول على جميع البيانات
  async getAll(filename) {
    return await this.readFile(filename);
  }

  // عد العناصر
  async count(filename, condition = {}) {
    try {
      const data = await this.readFile(filename);
      if (Object.keys(condition).length === 0) {
        return data.length;
      }
      return this.findWhere(filename, condition).length;
    } catch (error) {
      console.error(`خطأ في عد العناصر في ${filename}:`, error);
      return 0;
    }
  }

  // البحث المتقدم
  async advancedQuery(filename, query) {
    try {
      const data = await this.readFile(filename);
      let result = data;

      // تطبيق المرشحات
      if (query.where) {
        result = result.filter(item => {
          return Object.keys(query.where).every(key => {
            const condition = query.where[key];
            if (typeof condition === 'object' && condition.$gte !== undefined) {
              return item[key] >= condition.$gte;
            }
            if (typeof condition === 'object' && condition.$lte !== undefined) {
              return item[key] <= condition.$lte;
            }
            if (typeof condition === 'object' && condition.$like !== undefined) {
              return item[key].toString().includes(condition.$like);
            }
            return item[key] === condition;
          });
        });
      }

      // تطبيق الترتيب
      if (query.orderBy) {
        result.sort((a, b) => {
          const field = query.orderBy.field;
          const direction = query.orderBy.direction || 'asc';
          if (direction === 'desc') {
            return b[field] > a[field] ? 1 : -1;
          }
          return a[field] > b[field] ? 1 : -1;
        });
      }

      // تطبيق الحد
      if (query.limit) {
        result = result.slice(0, query.limit);
      }

      return result;
    } catch (error) {
      console.error(`خطأ في الاستعلام المتقدم في ${filename}:`, error);
      return [];
    }
  }

  // نسخ احتياطي لجميع البيانات
  async backupData() {
    try {
      const backupDir = path.join(this.dataDir, 'backups');
      await fs.ensureDir(backupDir);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
      
      const data = {
        products: await this.readFile('products.json'),
        sales: await this.readFile('sales.json'),
        expenses: await this.readFile('expenses.json'),
        inventory_adjustments: await this.readFile('inventory_adjustments.json'),
        backupDate: new Date().toISOString()
      };
      
      await fs.writeJson(backupFile, data, { spaces: 2 });
      return backupFile;
    } catch (error) {
      console.error('خطأ في النسخ الاحتياطي:', error);
      throw error;
    }
  }

  // استعادة من النسخ الاحتياطي
  async restoreFromBackup(backupFile) {
    try {
      const data = await fs.readJson(backupFile);
      
      await this.writeFile('products.json', data.products || []);
      await this.writeFile('sales.json', data.sales || []);
      await this.writeFile('expenses.json', data.expenses || []);
      await this.writeFile('inventory_adjustments.json', data.inventory_adjustments || []);
      
      return true;
    } catch (error) {
      console.error('خطأ في الاستعادة من النسخ الاحتياطي:', error);
      throw error;
    }
  }
}

module.exports = new JsonStorage();
