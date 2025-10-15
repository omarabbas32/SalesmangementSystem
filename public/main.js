// API Configuration ---productiooooooooooooooooooooooooon 
const API_BASE_URL = 'http://localhost:3000/api'; // غيّر هذا إلى عنوان الخادم الخاص بك

// Debug function to log API calls
function logApiCall(endpoint, options = {}) {
  console.log("API Call:", {
    url: `${API_BASE_URL}${endpoint}`,
    method: options.method || "GET",
    body: options.body,
    headers: options.headers,
  });
}

// Global State
let currentProducts = [];
let currentSales = [];
let currentExpenses = [];
let currentInventory = [];
let shoppingCart = [];

// Utility Functions
function showLoading() {
  document.getElementById("loading-spinner").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loading-spinner").style.display = "none";
}

function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon =
    type === "success"
      ? "fas fa-check-circle"
      : type === "error"
      ? "fas fa-exclamation-circle"
      : type === "warning"
      ? "fas fa-exclamation-triangle"
      : "fas fa-info-circle";

  toast.innerHTML = `
        <i class="toast-icon ${icon}"></i>
        <span class="toast-message">${message}</span>
    `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastSlideOut 0.3s ease";
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, 3000);
}

// API Functions
async function apiCall(endpoint, options = {}) {
  try {
    showLoading();

    // Log the API call for debugging
    logApiCall(endpoint, options);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    console.log("API Response Status:", response.status);
    console.log("API Response Headers:", response.headers);

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error Response Text:", errorText);

      let errorMessage = "حدث خطأ في الاتصال";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // If it's not JSON, use the text as error message
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get("content-type");
    console.log("Content Type:", contentType);

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("API Response Data:", data);
      return data;
    } else {
      // If it's not JSON, try to parse as text first
      const textResponse = await response.text();
      console.log("Text response:", textResponse);

      // If it looks like HTML, it might be an error page
      if (
        textResponse.includes("<html") ||
        textResponse.includes("<!DOCTYPE")
      ) {
        throw new Error(
          "تم استلام صفحة HTML بدلاً من JSON - تحقق من أن الخادم يعمل بشكل صحيح"
        );
      }

      // If it's not JSON, return a success response
      console.log("Non-JSON response, returning success");
      return { success: true, message: "تمت العملية بنجاح" };
    }
  } catch (error) {
    console.error("API Error:", error);
    showToast(error.message, "error");
    throw error;
  } finally {
    hideLoading();
  }
}

// Navigation Functions
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  // Remove active class from all tabs
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show selected section
  document.getElementById(sectionId).classList.add("active");

  // Add active class to clicked tab
  event.target.classList.add("active");

  // Load section data
  loadSectionData(sectionId);
}

function loadSectionData(sectionId) {
  switch (sectionId) {
    case "dashboard":
      loadDashboard();
      break;
    case "products":
      loadProducts();
      break;
    case "sales":
      loadSales();
      break;
    case "expenses":
      loadExpenses();
      break;
    case "inventory":
      loadInventory();
      break;
    case "reports":
      loadReports();
      break;
  }
}

// Dashboard Functions
async function loadDashboard() {
  try {
    console.log("Loading dashboard...");

    // Try to load dashboard data, but handle errors gracefully
    let dashboardData = null;
    let lowStockData = null;

    try {
      dashboardData = await apiCall("/inventory/dashboard");
      console.log("Dashboard data:", dashboardData);
    } catch (error) {
      console.warn("Dashboard data not available:", error);
    }

    try {
      lowStockData = await apiCall("/inventory/low-stock?threshold=1000");
      console.log("Low stock data:", lowStockData);
    } catch (error) {
      console.warn("Low stock data not available:", error);
    }

    // Update dashboard cards with fallback values
    const stats = dashboardData?.data?.stats || {};
    const todaySales = dashboardData?.data?.stats?.todaySales || {};
    const todayExpenses = dashboardData?.data?.stats?.todayExpenses || {};

    document.getElementById("total-products").textContent =
      stats.totalProducts || 0;
      
    // تم التعديل هنا لـ .toFixed(1)
    document.getElementById("today-sales").textContent = `${(
      todaySales.total || 0
    ).toFixed(1)} جنيه مصري`;
    
    // تم التعديل هنا لـ .toFixed(1)
    document.getElementById("today-expenses").textContent = `${(
      todayExpenses.total || 0
    ).toFixed(1)} جنيه مصري`;

    // نحسب الربح الأول
    const profit = (todaySales.total || 0) - (todayExpenses.total || 0);

    // تم التعديل هنا لـ .toFixed(1)
    document.getElementById("today-profit").textContent = `${profit.toFixed(
      1
    )} جنيه مصري`;

    // Update low stock list
    const lowStockList = document.getElementById("low-stock-list");
    lowStockList.innerHTML = "";

    if (lowStockData?.data?.products && lowStockData.data.products.length > 0) {
      lowStockData.data.products.forEach((product) => {
        const item = document.createElement("div");
        item.className = "low-stock-item";
        item.innerHTML = `
                    <span>${product.name}</span>
                    <span>${product.current_stock_grams} جرام</span>
                `;
        lowStockList.appendChild(item);
      });
    } else {
      lowStockList.innerHTML =
        '<p style="text-align: center; color: #6c757d;">لا توجد منتجات منخفضة المخزون</p>';
    }
  } catch (error) {
    console.error("Error loading dashboard:", error);
    showToast("خطأ في تحميل لوحة التحكم: " + error.message, "error");
  }
}

// Products Functions
async function loadProducts() {
  try {
    console.log("Loading products...");
    const response = await apiCall("/products");
    console.log("Products response:", response);

    if (response && response.data) {
      currentProducts = response.data;
      renderProducts();
    } else {
      console.warn("No products data received");
      currentProducts = [];
      renderProducts();
    }
  } catch (error) {
    console.error("Error loading products:", error);
    showToast("خطأ في تحميل المنتجات: " + error.message, "error");
  }
}

function renderProducts() {
  const productsGrid = document.getElementById("products-grid");
  productsGrid.innerHTML = "";

  if (currentProducts.length === 0) {
    productsGrid.innerHTML =
      '<p style="text-align: center; color: #6c757d; grid-column: 1 / -1;">لا توجد منتجات</p>';
    return;
  }

  currentProducts.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";

    const stockPercentage = Math.min(
      (product.current_stock_grams / 5000) * 100,
      100
    );
    const isLowStock = product.current_stock_grams < 1000;

    productCard.innerHTML = `
            <div class="product-header">
                <h3 class="product-name">${product.name}</h3>
                <span class="product-price">${
                  product.price_per_kg
                } جنيه مصري/كيلو</span>
            </div>
            <div class="product-stock">
                <div class="stock-info">
                    <span class="stock-grams">${
                      product.current_stock_grams
                    } جرام</span>
                    <span class="stock-kg">(${
                      Math.round((product.current_stock_grams / 1000) * 1000) /
                      1000
                    } كيلو)</span>
                </div>
                <div class="stock-bar">
                    <div class="stock-fill ${
                      isLowStock ? "low" : ""
                    }" style="width: ${stockPercentage}%"></div>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn btn-success btn-sm" onclick="showAddStockModal('${
                  product.id
                }')">
                    <i class="fas fa-plus"></i> إضافة مخزون
                </button>
                <button class="btn btn-warning btn-sm" onclick="showUpdatePriceModal('${
                  product.id
                }', ${product.price_per_kg})">
                    <i class="fas fa-edit"></i> تحديث السعر
                </button>
            </div>
        `;

    productsGrid.appendChild(productCard);
  });
}

// Sales Functions
async function loadSales() {
  try {
    const response = await apiCall("/sales");
    currentSales = response.data;
    renderSales();
  } catch (error) {
    console.error("Error loading sales:", error);
  }
}

function renderSales() {
  const salesList = document.getElementById("sales-list");
  salesList.innerHTML = "";

  if (currentSales.length === 0) {
    salesList.innerHTML =
      '<p style="text-align: center; color: #6c757d;">لا توجد مبيعات</p>';
    return;
  }

  // Group sales that happened within 2 seconds of each other
  const groupedSales = [];
  let tempGroup = [];

  // Sort sales by date descending to process them chronologically
  const sortedSales = [...currentSales].sort(
    (a, b) => new Date(b.sale_date) - new Date(a.sale_date)
  );

  sortedSales.forEach((sale, index) => {
    if (tempGroup.length === 0) {
      tempGroup.push(sale);
    } else {
      const lastSaleInGroup = tempGroup[tempGroup.length - 1];
      const timeDiff = Math.abs(
        new Date(sale.sale_date) - new Date(lastSaleInGroup.sale_date)
      );

      // If the time difference is less than 2 seconds, consider it the same transaction
      if (timeDiff < 2000) {
        tempGroup.push(sale);
      } else {
        groupedSales.push(tempGroup);
        tempGroup = [sale];
      }
    }

    // Add the last group
    if (index === sortedSales.length - 1) {
      groupedSales.push(tempGroup);
    }
  });

  // Render the grouped sales
  groupedSales.forEach((group) => {
    if (group.length > 1) {
      // Render as a group
      const groupTotal = group.reduce(
        (sum, item) => sum + item.total_amount,
        0
      );
      const groupDate = new Date(group[0].sale_date).toLocaleDateString(
        "ar-EG"
      );
      const groupTime = new Date(group[0].sale_date).toLocaleTimeString(
        "ar-EG"
      );

      const groupContainer = document.createElement("div");
      groupContainer.className = "sales-group";

      groupContainer.innerHTML = `
                <div class="sales-group-header" onclick="toggleGroup(this)">
                    <div class="group-info">
                        <h4><i class="fas fa-receipt"></i> عملية بيع مجمعة (${
                          group.length
                        } منتجات)</h4>
                        <span class="group-date">${groupDate} - ${groupTime}</span>
                    </div>
                    <div class="group-summary">
                        <span class="group-total">${groupTotal.toFixed(
                          2
                        )} جنيه</span>
                        <i class="fas fa-chevron-down toggle-arrow"></i>
                    </div>
                </div>
                <div class="grouped-items-container">
                    ${group
                      .map((sale) => renderSingleSaleItem(sale, true))
                      .join("")}
                </div>
            `;
      salesList.appendChild(groupContainer);
    } else {
      // Render as a single item
      const saleItemHTML = renderSingleSaleItem(group[0], false);
      salesList.innerHTML += saleItemHTML;
    }
  });
}

// Helper function to render a single sale item's HTML
function renderSingleSaleItem(sale, isGrouped) {
  const saleDate = new Date(sale.sale_date).toLocaleDateString("ar-EG");
  const saleTime = new Date(sale.sale_date).toLocaleTimeString("ar-EG");

  const itemClass = isGrouped
    ? "sale-item grouped-item"
    : "sale-item single-item";

  return `
        <div class="${itemClass}">
            <div class="item-header">
                <h3 class="item-title">${sale.product_name}</h3>
                <span class="item-amount">${sale.total_amount.toFixed(
                  2
                )} جنيه مصري</span>
            </div>
            <div class="item-details">
                <div class="detail-item">
                    <span class="detail-label">الوزن</span>
                    <span class="detail-value">${sale.weight_grams} جرام</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">سعر الكيلو</span>
                    <span class="detail-value">${sale.price_per_kg.toFixed(
                      2
                    )} جنيه مصري</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">التاريخ</span>
                    <span class="detail-value">${saleDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">الوقت</span>
                    <span class="detail-value">${saleTime}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-primary btn-sm" onclick="printInvoice(${
                  sale.id
                })">
                    <i class="fas fa-print"></i> طباعة فاتورة
                </button>
                <button class="btn btn-danger btn-sm" onclick="cancelSale(${
                  sale.id
                })">
                    <i class="fas fa-times"></i> إلغاء البيع
                </button>
            </div>
        </div>
    `;
}

// Function to toggle the visibility of grouped items
function toggleGroup(headerElement) {
  const groupContainer = headerElement.closest(".sales-group");
  const itemsContainer = groupContainer.querySelector(
    ".grouped-items-container"
  );
  const arrow = headerElement.querySelector(".toggle-arrow");

  if (itemsContainer.style.maxHeight) {
    itemsContainer.style.maxHeight = null;
    arrow.classList.remove("expanded");
  } else {
    itemsContainer.style.maxHeight = itemsContainer.scrollHeight + "px";
    arrow.classList.add("expanded");
  }
}

// Expenses Functions
async function loadExpenses() {
  try {
    const response = await apiCall("/expenses");
    currentExpenses = response.data;
    renderExpenses();
  } catch (error) {
    console.error("Error loading expenses:", error);
  }
}

function renderExpenses() {
  const expensesList = document.getElementById("expenses-list");
  expensesList.innerHTML = "";

  if (currentExpenses.length === 0) {
    expensesList.innerHTML =
      '<p style="text-align: center; color: #6c757d;">لا توجد مصروفات</p>';
    return;
  }

  currentExpenses.forEach((expense) => {
    const expenseItem = document.createElement("div");
    expenseItem.className = "expense-item";

    const expenseDate = new Date(expense.expense_date).toLocaleDateString(
      "ar-EG"
    );
    const expenseTime = new Date(expense.expense_date).toLocaleTimeString(
      "ar-EG"
    );

    expenseItem.innerHTML = `
            <div class="item-header">
                <h3 class="item-title">${expense.description}</h3>
                <span class="item-amount">${expense.amount} جنيه مصري</span>
            </div>
            <div class="item-details">
                <div class="detail-item">
                    <span class="detail-label">الفئة</span>
                    <span class="detail-value">${expense.category}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">التاريخ</span>
                    <span class="detail-value">${expenseDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">الوقت</span>
                    <span class="detail-value">${expenseTime}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-warning btn-sm" onclick="editExpense(${expense.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteExpense(${expense.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;

    expensesList.appendChild(expenseItem);
  });
}

// Inventory Functions
async function loadInventory() {
  try {
    const [inventoryData, statsData] = await Promise.all([
      apiCall("/inventory/current"),
      apiCall("/inventory/stats"),
    ]);

    currentInventory = inventoryData.data;
    renderInventory(inventoryData.data, statsData.data);
  } catch (error) {
    console.error("Error loading inventory:", error);
  }
}

function renderInventory(inventory, stats) {
  const inventoryStats = document.getElementById("inventory-stats");
  const inventoryList = document.getElementById("inventory-list");

  // Render stats
  inventoryStats.innerHTML = `
        <h3>إحصائيات المخزون</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-label">إجمالي المنتجات</span>
                <span class="stat-value">${stats.totalProducts}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">إجمالي المخزون</span>
                <span class="stat-value">${stats.totalStock} جرام</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">قيمة المخزون</span>
                <span class="stat-value">${stats.totalValue} جنيه مصري</span>
            </div>
        </div>
    `;

  // Render inventory list
  inventoryList.innerHTML = "";

  if (inventory.length === 0) {
    inventoryList.innerHTML =
      '<p style="text-align: center; color: #6c757d;">لا توجد منتجات في المخزون</p>';
    return;
  }

  inventory.forEach((item) => {
    const inventoryItem = document.createElement("div");
    inventoryItem.className = "inventory-item";

    const stockPercentage = Math.min(
      (item.current_stock_grams / 5000) * 100,
      100
    );
    const isLowStock = item.current_stock_grams < 1000;

    inventoryItem.innerHTML = `
            <div class="inventory-header">
                <h4>${item.name}</h4>
                <span class="stock-status ${isLowStock ? "low" : "good"}">
                    ${isLowStock ? "منخفض" : "جيد"}
                </span>
            </div>
            <div class="inventory-details">
                <div class="detail-row">
                    <span>المخزون الحالي:</span>
                    <span>${item.current_stock_grams} جرام (${
      Math.round((item.current_stock_grams / 1000) * 1000) / 1000
    } كيلو)</span>
                </div>
                <div class="detail-row">
                    <span>سعر الكيلو:</span>
                    <span>${item.price_per_kg} جنيه مصري</span>
                </div>
                <div class="detail-row">
                    <span>قيمة المخزون:</span>
                    <span>${
                      Math.round(
                        (item.current_stock_grams / 1000) *
                          item.price_per_kg *
                          100
                      ) / 100
                    } جنيه مصري</span>
                </div>
            </div>
            <div class="stock-bar">
                <div class="stock-fill ${
                  isLowStock ? "low" : ""
                }" style="width: ${stockPercentage}%"></div>
            </div>
        `;

    inventoryList.appendChild(inventoryItem);
  });
}

// Reports Functions
async function loadReports() {
  // Set today's date as default
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("report-date").value = today;
}

async function generateDailyReport() {
  try {
    const date = document.getElementById("report-date").value;
    if (!date) {
      showToast("يرجى اختيار تاريخ", "warning");
      return;
    }

    const response = await apiCall(`/inventory/daily-report?date=${date}`);
    renderDailyReport(response.data);
  } catch (error) {
    console.error("Error generating daily report:", error);
  }
}

function renderDailyReport(report) {
  const reportResults = document.getElementById("report-results");

  reportResults.innerHTML = `
        <div class="report-summary">
            <h3>تقرير يومي - ${new Date(report.date).toLocaleDateString(
              "ar-EG"
            )}</h3>
            <div class="summary-cards">
                <div class="summary-card">
                    <h4>إجمالي المبيعات</h4>
                    <span class="amount sales">${
                      report.sales.total
                    } جنيه مصري</span>
                </div>
                <div class="summary-card">
                    <h4>إجمالي المصروفات</h4>
                    <span class="amount expenses">${
                      report.expenses.total
                    } جنيه مصري</span>
                </div>
                <div class="summary-card">
                    <h4>صافي الربح</h4>
                    <span class="amount profit">${
                      report.summary.netProfit
                    } جنيه مصري</span>
                </div>
            </div>
        </div>
        
        <div class="report-details">
            <div class="sales-details">
                <h4>تفاصيل المبيعات (${report.sales.items.length} عملية)</h4>
                <div class="details-list">
                    ${report.sales.items
                      .map(
                        (sale) => `
                        <div class="detail-item">
                            <span>${sale.product_name}</span>
                            <span>${sale.weight_grams} جرام</span>
                            <span>${sale.total_amount} جنيه مصري</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
            
            <div class="expenses-details">
                <h4>تفاصيل المصروفات (${
                  report.expenses.items.length
                } مصروف)</h4>
                <div class="details-list">
                    ${report.expenses.items
                      .map(
                        (expense) => `
                        <div class="detail-item">
                            <span>${expense.description}</span>
                            <span>${expense.category}</span>
                            <span>${expense.amount} جنيه مصري</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        </div>
    `;
}

// Modal Functions
function showModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function showAddProductModal() {
  document.getElementById("add-product-form").reset();
  showModal("add-product-modal");
}

function showAddSaleModal() {
  // Load products for sale
  loadProductsForSale();
  // Clear cart and update UI when opening modal
  shoppingCart = [];
  renderShoppingCart(); // دي دالة جديدة هنضيفها كمان شوية
  showModal("add-sale-modal");
}
function showAddExpenseModal() {
  document.getElementById("add-expense-form").reset();
  showModal("add-expense-modal");
}

function showAddStockModal(productId) {
  document.getElementById("stock-product-id").value = productId;
  document.getElementById("add-stock-form").reset();
  showModal("add-stock-modal");
}

function showUpdatePriceModal(productId, currentPrice) {
  document.getElementById("price-product-id").value = productId;
  document.getElementById("new-price").value = currentPrice;
  showModal("update-price-modal");
}

async function loadProductsForSale() {
  try {
    const response = await apiCall("/products");
    const productSelect = document.getElementById("sale-product");
    productSelect.innerHTML = '<option value="">اختر المنتج</option>';

    response.data.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = `${product.name} (${product.current_stock_grams} جرام متاح)`;
      option.dataset.price = product.price_per_kg;
      productSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading products for sale:", error);
  }
}

// Form Handlers
document
  .getElementById("add-product-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      // Get form values directly
      const productData = {
        name: document.getElementById("product-name").value.trim(),
        pricePerKg: parseFloat(document.getElementById("product-price").value),
        initialStockGrams:
          parseFloat(document.getElementById("product-stock").value) || 0,
      };

      // Validate required fields
      if (!productData.name || !productData.pricePerKg) {
        showToast("يرجى ملء جميع الحقول المطلوبة", "warning");
        return;
      }

      if (productData.pricePerKg <= 0) {
        showToast("سعر الكيلو يجب أن يكون أكبر من صفر", "warning");
        return;
      }

      console.log("Sending product data:", productData);

      const response = await apiCall("/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });

      console.log("Product added successfully:", response);

      if (response && response.success) {
        showToast("تم إضافة المنتج بنجاح", "success");
        closeModal("add-product-modal");

        // Reset form
        document.getElementById("add-product-form").reset();

        // Reload data
        await loadProducts();
        await loadDashboard();
      } else {
        showToast("حدث خطأ في إضافة المنتج", "error");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      showToast("حدث خطأ في إضافة المنتج: " + error.message, "error");
    }
  });

document
  .getElementById("add-expense-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const expenseData = {
        description: document.getElementById("expense-description").value,
        amount: parseFloat(document.getElementById("expense-amount").value),
        category: document.getElementById("expense-category").value,
      };

      await apiCall("/expenses", {
        method: "POST",
        body: JSON.stringify(expenseData),
      });

      showToast("تم إضافة المصروف بنجاح", "success");
      closeModal("add-expense-modal");
      loadExpenses();
      loadDashboard();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  });

document
  .getElementById("add-stock-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const productId = document.getElementById("stock-product-id").value;
      const grams = parseFloat(document.getElementById("stock-grams").value);
      const reason = document.getElementById("stock-reason").value;

      await apiCall(`/products/${productId}/stock`, {
        method: "POST",
        body: JSON.stringify({
          grams: grams,
          reason: reason,
        }),
      });

      showToast("تم إضافة المخزون بنجاح", "success");
      closeModal("add-stock-modal");
      loadProducts();
      loadInventory();
    } catch (error) {
      console.error("Error adding stock:", error);
    }
  });

document
  .getElementById("update-price-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const productId = document.getElementById("price-product-id").value;
      const newPrice = parseFloat(document.getElementById("new-price").value);

      await apiCall(`/products/${productId}/price`, {
        method: "PUT",
        body: JSON.stringify({
          pricePerKg: newPrice,
        }),
      });

      showToast("تم تحديث السعر بنجاح", "success");
      closeModal("update-price-modal");
      loadProducts();
    } catch (error) {
      console.error("Error updating price:", error);
    }
  });

// Sale calculation
document.getElementById("sale-product").addEventListener("change", (e) => {
  const selectedOption = e.target.selectedOptions[0];
  if (selectedOption && selectedOption.dataset.price) {
    document.getElementById("sale-price-per-kg").value =
      selectedOption.dataset.price;
    calculateSaleTotal();
  }
});

document
  .getElementById("sale-weight")
  .addEventListener("input", calculateSaleTotal);

function calculateSaleTotal() {
  const pricePerKg = parseFloat(
    document.getElementById("sale-price-per-kg").value
  );
  const weightGrams = parseFloat(document.getElementById("sale-weight").value);

  if (pricePerKg && weightGrams) {
    const total = (weightGrams / 1000) * pricePerKg;
    document.getElementById("sale-total").value = Math.round(total * 100) / 100;
  }
}

// Action Functions
async function printInvoice(saleId) {
  // 1. نبحث عن تفاصيل عملية البيع من البيانات المحملة بالفعل
  // هذا أفضل من إرسال طلب جديد للخادم
  const saleToPrint = currentSales.find(sale => sale.id === saleId);

  if (!saleToPrint) {
      showToast("لم يتم العثور على بيانات الفاتورة.", "error");
      console.error(`Sale with ID ${saleId} not found in currentSales array.`);
      return;
  }

  // 2. نقوم بإنشاء مصفوفة تحتوي على هذا المنتج الوحيد
  // بنفس الهيكل الذي تتوقعه دالة الطباعة الجديدة (كأنها سلة مشتريات بمنتج واحد)
  const itemAsCart = [{
      productName: saleToPrint.product_name,
      weightGrams: saleToPrint.weight_grams,
      total: saleToPrint.total_amount,
      pricePerKg: saleToPrint.price_per_kg // نمرر السعر أيضًا
  }];

  // 3. الآن ببساطة نستدعي دالة الطباعة القوية التي أنشأناها بالفعل!
  // لا حاجة لتكرار أكواد الـ HTML والمنطق
  try {
      await printConsolidatedInvoice(itemAsCart);
  } catch (error) {
      console.error("Error printing single invoice:", error);
      showToast("حدث خطأ أثناء طباعة الفاتورة.", "error");
  }
}

async function cancelSale(saleId) {
  if (!confirm("هل أنت متأكد من إلغاء هذه العملية؟")) {
    return;
  }

  try {
    await apiCall(`/sales/${saleId}`, {
      method: "DELETE",
    });

    showToast("تم إلغاء البيع بنجاح", "success");
    loadSales();
    loadDashboard();
    loadProducts();
  } catch (error) {
    console.error("Error canceling sale:", error);
  }
}

async function deleteExpense(expenseId) {
  if (!confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
    return;
  }

  try {
    await apiCall(`/expenses/${expenseId}`, {
      method: "DELETE",
    });

    showToast("تم حذف المصروف بنجاح", "success");
    loadExpenses();
    loadDashboard();
  } catch (error) {
    console.error("Error deleting expense:", error);
  }
}

async function showBackupStatus() {
  try {
    const response = await apiCall("/backup/status");
    const status = response.data;

    let message = `حالة MongoDB: ${status.mongodb ? "متصل" : "غير متصل"}`;
    if (status.mongodb) {
      message += `\nعدد المنتجات: ${status.productsCount}`;
      message += `\nعدد المبيعات: ${status.salesCount}`;
      message += `\nعدد المصروفات: ${status.expensesCount}`;
    }

    alert(message);
  } catch (error) {
    showToast("خطأ في فحص حالة النسخ الاحتياطي", "error");
  }
}

// Close modals when clicking outside
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.style.display = "none";
  }
});

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  // Test API connection first
  try {
    console.log("Testing API connection...");
    console.log("API Base URL:", API_BASE_URL);

    const testResponse = await fetch(`${API_BASE_URL}/products`);
    console.log("API connection test result:", testResponse.status);
    console.log("Response headers:", testResponse.headers);

    if (testResponse.ok) {
      console.log("API connection successful");
      showToast("تم الاتصال بالخادم بنجاح", "success");
    } else {
      console.warn("API connection issue:", testResponse.status);
      const errorText = await testResponse.text();
      console.log("Error response:", errorText);
      showToast(
        "تحذير: مشكلة في الاتصال بالخادم - " + testResponse.status,
        "warning"
      );
    }
  } catch (error) {
    console.error("API connection failed:", error);
    showToast("خطأ: لا يمكن الاتصال بالخادم - " + error.message, "error");
  }

  // Load dashboard by default
  try {
    await loadDashboard();
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }

  // Set up form validation
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      const requiredFields = form.querySelectorAll("[required]");
      let isValid = true;

      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = "#e74c3c";
        } else {
          field.style.borderColor = "#dee2e6";
        }
      });

      if (!isValid) {
        e.preventDefault();
        showToast("يرجى ملء جميع الحقول المطلوبة", "warning");
      }
    });
  });
});

// ===================================
// Shopping Cart Functions
// ===================================

function addToCart() {
  const productSelect = document.getElementById("sale-product");
  const selectedOption = productSelect.selectedOptions[0];
  const weightInput = document.getElementById("sale-weight");

  const productId = selectedOption.value;
  const weightGrams = parseFloat(weightInput.value);

  // Validation
  if (!productId) {
    showToast("يرجى اختيار منتج", "warning");
    return;
  }
  if (isNaN(weightGrams) || weightGrams <= 0) {
    showToast("يرجى إدخال وزن صحيح", "warning");
    return;
  }

  const productName = selectedOption.text.split(" (")[0];
  const pricePerKg = parseFloat(selectedOption.dataset.price);
  const itemTotal = (weightGrams / 1000) * pricePerKg;

  const cartItem = {
    productId: parseInt(productId),
    productName: productName,
    weightGrams: weightGrams,
    pricePerKg: pricePerKg,
    total: parseFloat(itemTotal.toFixed(2)),
  };

  // Add item to cart
  shoppingCart.push(cartItem);

  // Update UI
  renderShoppingCart();

  // Reset form fields
  productSelect.value = "";
  weightInput.value = "";
}

function renderShoppingCart() {
  const cartItemsContainer = document.getElementById("cart-items");
  cartItemsContainer.innerHTML = "";

  if (shoppingCart.length === 0) {
    cartItemsContainer.innerHTML =
      '<p class="empty-cart">السلة فارغة حاليًا</p>';
  } else {
    shoppingCart.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.className = "cart-item";
      itemElement.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.productName}</div>
                    <div class="cart-item-details">
                        <span class="cart-item-weight">${
                          item.weightGrams
                        } جرام</span>
                        <span class="cart-item-price">${item.total.toFixed(
                          2
                        )} جنيه</span>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <button class="btn btn-remove" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
      cartItemsContainer.appendChild(itemElement);
    });
  }
  updateCartTotal();
}

function removeFromCart(index) {
  shoppingCart.splice(index, 1);
  renderShoppingCart();
}

function updateCartTotal() {
  const totalAmount = shoppingCart.reduce((sum, item) => sum + item.total, 0);
  document.getElementById(
    "cart-total-amount"
  ).textContent = `${totalAmount.toFixed(2)} جنيه مصري`;

  // Enable or disable the process sale button
  const processBtn = document.getElementById("process-sale-btn");
  processBtn.disabled = shoppingCart.length === 0;
}

async function processSale() {
  if (shoppingCart.length === 0) {
    showToast("سلة المشتريات فارغة!", "warning");
    return;
  }

  // عمل نسخة من سلة المشتريات لاستخدامها في الطباعة
  // لأن السلة الأصلية سيتم تفريغها
  const cartToPrint = [...shoppingCart];

  // نظهر علامة التحميل مرة واحدة في البداية
  showLoading();

  try {
    // هنلف على كل منتج في السلة
    for (const item of shoppingCart) {
      // نجهز بيانات المنتج الحالي عشان نبعتها
      const saleData = {
        productId: item.productId,
        weightGrams: item.weightGrams,
      };

      await apiCall("/sales", {
        method: "POST",
        body: JSON.stringify(saleData),
      });
    }

    showToast("تمت عملية البيع بنجاح!", "success");

    // استدعاء دالة الطباعة الجديدة بعد نجاح البيع
    await printConsolidatedInvoice(cartToPrint);

    closeModal("add-sale-modal");
    
    // تفريغ سلة المشتريات بعد إتمام كل العمليات بنجاح
    shoppingCart = []; 
    renderShoppingCart();


    loadSales();
    loadDashboard();
    loadProducts();
  } catch (error) {
    console.error("Error processing sale:", error);
    showToast(
      "فشلت عملية البيع عند أحد المنتجات. يرجى مراجعة المبيعات المسجلة.",
      "error"
    );
  } finally {
    hideLoading();
  }
}



/**
 * دالة لإنشاء وطباعة فاتورة مجمعة
 * @param {Array} cartItems - مصفوفة المنتجات من سلة المشتريات
 */
async function printConsolidatedInvoice(cartItems) {
  // 1. حساب الإجمالي النهائي
  const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);

  // 2. تنسيق التاريخ والوقت الحالي
  const now = new Date();
  const formattedDate = now.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const formattedTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });

  // 3. إنشاء رقم فاتورة بسيط ومميز
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  // 4. بناء صفوف الجدول لكل منتج في السلة
  const itemsHtml = cartItems.map(item => `
    <tr>
      <td>${item.productName}</td>
      <td>${(item.weightGrams / 1000).toFixed(3)}</td>
      <td>${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  // 5. بناء الهيكل الكامل للفاتورة (HTML)
  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>فاتورة ${invoiceNumber}</title>
        <link rel="stylesheet" href="style.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@160..700&display=swap" rel="stylesheet">

    </head>
    <body>
      <div class="invoice-receipt">
        <div class="invoice-header">
          <p><strong>رقم الفاتورة:</strong> ${invoiceNumber}</p>
          <p><strong>التاريخ:</strong> ${formattedDate} &nbsp; <strong>الوقت:</strong> ${formattedTime}</p>
        </div>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>نوع المنتج</th>
              <th>الوزن</th>
              <th>السعر</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="invoice-total">
          <p><strong>الاجمالي</strong></p>
          <p><strong>${totalAmount.toFixed(2)}</strong></p>
        </div>
        <div class="invoice-footer">
          <p><strong>السجل الضريبي:</strong> 508079700</p>
          <p><strong>رقم الهاتف:</strong> 01204383773</p>
          <p><strong>العنوان:</strong> ابن الفارض بجوار مخبز الطيب</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 6. فتح نافذة جديدة، كتابة كود الفاتورة بداخلها، ثم طباعتها
  const printWindow = window.open('', '_blank');
  printWindow.document.write(invoiceHtml);
  printWindow.document.close();
  
  // ننتظر لحظة للتأكد من تحميل كل شيء (خاصة الـ CSS والصورة) قبل الطباعة
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}