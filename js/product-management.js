// product-management.js

// 商品管理相關變數
let productsData = [];
let filteredProducts = [];
let productTypesData = [];
let productSpecificationsData = [
  { id: 1, name: "小型" },
  { id: 2, name: "中型" },
  { id: 3, name: "大型" },
  { id: 4, name: "特大型" }
];

let productColorsData = [
  { id: 1, name: "紅色" },
  { id: 2, name: "藍色" },
  { id: 3, name: "綠色" },
  { id: 4, name: "黑色" },
  { id: 5, name: "白色" }
];

let currentPage = 1;
const itemsPerPage = 10;

// 移除這個事件監聽器，因為我們已經在 HTML 文件中調用 loadProductsData()
// document.addEventListener("DOMContentLoaded", function() {
//   loadProductsData();
// });

// 載入商品數據
async function loadProductsData() {
  try {
    console.log("開始載入商品數據...");
    
    // 確保 DOM 已完全載入
    if (document.readyState === "loading") {
      console.log("DOM 尚未完全載入，等待 DOMContentLoaded 事件...");
      return new Promise(resolve => {
        document.addEventListener("DOMContentLoaded", () => {
          console.log("DOM 已載入，繼續執行 loadProductsData");
          resolve(loadProductsData());
        });
      });
    }
    
    // 顯示載入中提示
    const content = document.getElementById("product-management-content");
    if (!content) {
      console.error("找不到 product-management-content 元素");
      setTimeout(() => {
        // 再次嘗試獲取元素
        const retryContent = document.getElementById("product-management-content");
        if (!retryContent) {
          console.error("重試後仍找不到 product-management-content 元素");
          alert("頁面元素載入失敗，請重新整理頁面");
          return;
        }
        loadProductsData(); // 重試載入
      }, 300);
      return;
    }
    
    content.innerHTML = `<div class="loading">載入商品數據中...</div>`;
    
    // 模擬從API獲取數據
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          console.log("生成模擬數據...");
          // 生成模擬數據
          productsData = generateMockProducts(30);
          productTypesData = [
            { id: 1, name: "帳篷" },
            { id: 2, name: "睡袋" },
            { id: 3, name: "炊具" },
            { id: 4, name: "燈具" },
            { id: 5, name: "戶外家具" }
          ];
          
          // 初始化篩選後的商品為所有商品
          filteredProducts = [...productsData];
          
          console.log("顯示商品數據...");
          // 顯示商品數據
          displayProducts();
          
          console.log("初始化商品類型篩選器...");
          // 初始化商品類型篩選器
          initProductTypeFilter();
          
          console.log("商品數據載入完成");
          resolve(true);
        } catch (innerError) {
          console.error("在 setTimeout 回調中發生錯誤:", innerError);
          const content = document.getElementById("product-management-content");
          if (content) {
            content.innerHTML = `<div class="error-message">載入商品數據失敗，請稍後再試</div>`;
          }
          resolve(false);
        }
      }, 500);
    });
  } catch (error) {
    console.error("載入商品數據失敗:", error);
    const content = document.getElementById("product-management-content");
    if (content) {
      content.innerHTML = `<div class="error-message">載入商品數據失敗，請稍後再試</div>`;
    }
    return Promise.resolve(false);
  }
}

// 生成模擬商品數據
function generateMockProducts(count) {
  const products = [];
  const statuses = ["上架中", "已下架"];
  const colorOptions = ["紅色", "藍色", "黑色", "白色", "綠色", "黃色", "紫色"];
  const specOptions = ["小", "中", "大", "特大", "標準", "豪華", "經濟"];
  
  for (let i = 1; i <= count; i++) {
    const typeId = Math.floor(Math.random() * 5) + 1;
    const price = Math.floor(Math.random() * 10000) + 500;
    const stock = Math.floor(Math.random() * 100);
    // 生成 0.5 到 1 之間的折扣值
    const discount = (Math.floor(Math.random() * 51) + 50) / 100;
    
    // 生成隨機顏色
    const colors = [];
    const colorCount = Math.floor(Math.random() * 3) + 1; // 1-3個顏色
    for (let j = 0; j < colorCount; j++) {
      const colorIndex = Math.floor(Math.random() * colorOptions.length);
      colors.push({
        name: colorOptions[colorIndex],
        imageUrl: `images/product-${(i % 4) + 1}.jpg`
      });
    }
    
    // 生成隨機規格
    const specifications = [];
    const specCount = Math.floor(Math.random() * 3) + 1; // 1-3個規格
    for (let j = 0; j < specCount; j++) {
      const specIndex = Math.floor(Math.random() * specOptions.length);
      specifications.push({
        name: specOptions[specIndex],
        price: price + Math.floor(Math.random() * 500) - 250 // 基礎價格上下浮動
      });
    }
    
    products.push({
      id: i,
      name: `露營商品 ${i}`,
      typeId: typeId,
      price: price,
      stock: stock,
      imageUrl: `images/product-${(i % 4) + 1}.jpg`,
      description: `這是商品 ${i} 的詳細描述，包含了商品的特點和使用方法。`,
      status: statuses[Math.floor(Math.random() * 2)],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
      discount: discount,
      colors: colors,
      specifications: specifications
    });
  }
  
  return products;
}

// 顯示商品數據
function displayProducts() {
  const content = document.getElementById("product-management-content");
  
  // 計算分頁
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);
  
  // 如果沒有商品數據
  if (currentProducts.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <h3>沒有商品數據</h3>
        <p>目前沒有符合條件的商品，請嘗試調整篩選條件或添加新商品</p>
      </div>
    `;
    return;
  }
  
  // 生成商品表格
  let html = `
    <div class="filter-section">
      <select id="product-type-filter" class="filter-select">
        <option value="all">所有類型</option>
      </select>
      <select id="product-status-filter" class="filter-select">
        <option value="all">所有狀態</option>
        <option value="上架中">上架中</option>
        <option value="已下架">已下架</option>
      </select>
    </div>
    
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>商品ID</th>
            <th>商品圖片</th>
            <th>商品名稱</th>
            <th>類型</th>
            <th>顏色規格</th>
            <th>折扣</th>
            <th>狀態</th>
            <th>上架時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // 添加商品行
  currentProducts.forEach(product => {
    // 獲取第一個顏色的圖片作為商品主圖
    const mainImage = product.colors && product.colors.length > 0 ? 
      product.colors[0].imageUrl : (product.imageUrl || 'images/product-1.jpg');
    
    // 獲取顏色和規格信息
    let colorAndSpecText = '';
    
    // 處理顏色信息
    if (product.colors && product.colors.length > 0) {
      const colorNames = product.colors.map(color => color.name).join(', ');
      colorAndSpecText += `顏色: ${colorNames}<br>`;
    } else {
      colorAndSpecText += `顏色: 無<br>`;
    }
    
    // 處理規格信息
    if (product.specifications && product.specifications.length > 0) {
      const specNames = product.specifications.map(spec => spec.name).join(', ');
      colorAndSpecText += `規格: ${specNames}`;
    } else {
      colorAndSpecText += `規格: 無`;
    }
    
    // 格式化上架時間
    const createdAtFormatted = formatDateTime(product.createdAt);
    
    // 將折扣從百分比轉換為 0~1 之間的小數
    const discountValue = product.discount ? (product.discount / 100).toFixed(2) : 1.00;
    
    html += `
      <tr>
        <td>${product.id}</td>
        <td><img src="${mainImage}" alt="${product.name}" class="product-thumbnail" /></td>
        <td>${product.name}</td>
        <td>${getProductTypeName(product.typeId)}</td>
        <td>${colorAndSpecText}</td>
        <td>${discountValue}</td>
        <td>
          <span class="status-badge ${product.status === '上架中' ? 'active' : 'inactive'}">
            ${product.status}
          </span>
        </td>
        <td>${createdAtFormatted}</td>
        <td>
          <button class="action-btn btn-view" onclick="viewProductDetail(${product.id})">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn btn-edit" onclick="showEditProductModal(${product.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn ${product.status === '上架中' ? 'btn-deactivate' : 'btn-activate'}" 
                  onclick="toggleProductStatus(${product.id})">
            <i class="fas ${product.status === '上架中' ? 'fa-toggle-off' : 'fa-toggle-on'}"></i>
          </button>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  // 添加分頁控件
  if (totalPages > 1) {
    html += `
      <div class="pagination">
        <button class="page-btn" onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
          <i class="fas fa-angle-left"></i>
        </button>
        <span class="page-info">第 ${currentPage} 頁，共 ${totalPages} 頁</span>
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
          <i class="fas fa-angle-right"></i>
        </button>
        <button class="page-btn" onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>
    `;
  }
  
  content.innerHTML = html;
  
  // 初始化篩選器事件
  document.getElementById("product-status-filter").addEventListener("change", filterProducts);
  document.getElementById("product-type-filter").addEventListener("change", filterProducts);
}

// 格式化日期時間
function formatDateTime(date) {
  if (!date) return "未知時間";
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 初始化商品類型篩選器
function initProductTypeFilter() {
  const typeFilter = document.getElementById("product-type-filter");
  if (!typeFilter) return;
  
  // 清空現有選項（保留「所有類型」選項）
  while (typeFilter.options.length > 1) {
    typeFilter.remove(1);
  }
  
  // 添加商品類型選項
  productTypesData.forEach(type => {
    const option = document.createElement("option");
    option.value = type.id;
    option.textContent = type.name;
    typeFilter.appendChild(option);
  });
}

// 獲取商品類型名稱
function getProductTypeName(typeId) {
  const type = productTypesData.find(t => t.id === typeId);
  return type ? type.name : "未知類型";
}

// 篩選商品
function filterProducts() {
  const typeFilter = document.getElementById("product-type-filter").value;
  const statusFilter = document.getElementById("product-status-filter").value;
  
  // 重置為第一頁
  currentPage = 1;
  
  // 篩選商品
  filteredProducts = productsData.filter(product => {
    // 類型篩選
    if (typeFilter !== "all" && product.typeId !== parseInt(typeFilter)) {
      return false;
    }
    
    // 狀態篩選
    if (statusFilter !== "all" && product.status !== statusFilter) {
      return false;
    }
    
    return true;
  });
  
  // 重新顯示商品
  displayProducts();
}

// 搜索商品
function searchProducts() {
  const searchInput = document.getElementById("product-search").value.toLowerCase();
  
  // 如果搜索框為空，顯示所有商品
  if (!searchInput.trim()) {
    filteredProducts = [...productsData];
    currentPage = 1;
    displayProducts();
    return;
  }
  
  // 篩選符合搜索條件的商品
  filteredProducts = productsData.filter(product => {
    return (
      product.name.toLowerCase().includes(searchInput) ||
      product.id.toString().includes(searchInput) ||
      getProductTypeName(product.typeId).toLowerCase().includes(searchInput)
    );
  });
  
  // 重置為第一頁並顯示結果
  currentPage = 1;
  displayProducts();
}

// 切換頁面
function changePage(page) {
  currentPage = page;
  displayProducts();
}

// 查看商品詳情
function viewProductDetail(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) {
    alert("找不到商品資料");
    return;
  }
  
  // 創建模態框
  const modal = document.createElement("div");
  modal.className = "custom-modal";
  modal.innerHTML = `
    <div class="modal-content product-detail-modal">
      <div class="modal-header">
        <h3>商品詳情</h3>
        <button class="close-btn" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="product-detail-container">
          <div class="product-detail-image">
            <img src="${product.imageUrl}" alt="${product.name}" />
          </div>
          <div class="product-detail-info">
            <h4>${product.name}</h4>
            <p><strong>商品ID:</strong> ${product.id}</p>
            <p><strong>類型:</strong> ${getProductTypeName(product.typeId)}</p>
            <p><strong>價格:</strong> NT$ ${product.price ? product.price.toLocaleString() : '未設定'}</p>
            <p><strong>庫存:</strong> ${product.stock || '未設定'}</p>
            <p><strong>狀態:</strong> ${product.status}</p>
            <p><strong>建立日期:</strong> ${product.createdAt ? product.createdAt.toLocaleDateString() : '未知'}</p>
          </div>
        </div>
        <div class="product-description">
          <h5>商品描述</h5>
          <p>${product.description || '無商品描述'}</p>
        </div>
      </div>
    </div>
  `;
  modal.style.display = "flex";
  // 添加到頁面
  document.body.appendChild(modal);
  
}

// 顯示編輯商品模態框
function showEditProductModal(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) {
    alert("找不到商品資料");
    return;
  }
  
  // 創建模態框
  const modal = document.createElement("div");
  modal.className = "custom-modal";
  
  // 生成商品類型選項
  let typeOptions = '';
  productTypesData.forEach(type => {
    typeOptions += `<option value="${type.id}" ${product.typeId === type.id ? 'selected' : ''}>${type.name}</option>`;
  });
  
  modal.innerHTML = `
    <div class="modal-content product-form-modal">
      <div class="modal-header">
        <h3>編輯商品</h3>
        <button class="close-btn" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <form id="edit-product-form">
          <input type="hidden" id="product-id" value="${product.id}">
          
          <div class="form-group">
            <label for="product-name">商品名稱</label>
            <input type="text" id="product-name" value="${product.name}" required>
          </div>
          
          <div class="form-group">
            <label for="product-type">商品類型</label>
            <select id="product-type" required>
              ${typeOptions}
            </select>
          </div>
          
          <div class="form-group">
            <label for="product-description">商品描述</label>
            <textarea id="product-description" rows="4">${product.description || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="product-discount">商品折扣 (%)</label>
            <input type="number" id="product-discount" min="0" max="100" value="${product.discount || 100}">
          </div>
          
          <div class="form-group">
            <label for="product-status">商品狀態</label>
            <select id="product-status" required>
              <option value="上架中" ${product.status === '上架中' ? 'selected' : ''}>上架中</option>
              <option value="已下架" ${product.status === '已下架' ? 'selected' : ''}>已下架</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>商品規格</label>
            <div id="specifications-container">
              ${generateSpecificationsHTML(product.specifications)}
            </div>
            <button type="button" class="btn-add" onclick="addSpecificationField()">添加規格</button>
          </div>
          
          <div class="form-group">
            <label>商品顏色</label>
            <div id="colors-container">
              ${generateColorsHTML(product.colors)}
            </div>
            <button type="button" class="btn-add" onclick="addColorField()">添加顏色</button>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
            <button type="submit" class="btn-save">保存更改</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  modal.style.display = "flex";
  // 添加到頁面
  document.body.appendChild(modal);
  
  // 綁定表單提交事件
  document.getElementById("edit-product-form").addEventListener("submit", function(e) {
    e.preventDefault();
    saveProductChanges();
  });
}

// 生成規格HTML
function generateSpecificationsHTML(specifications) {
  if (!specifications || specifications.length === 0) {
    return `
      <div class="specification-item">
        <input type="text" placeholder="規格名稱" class="spec-name" required>
        <input type="number" placeholder="價格" class="spec-price" min="0" required>
        <button type="button" class="btn-add-spec">+</button>
      </div>
    `;
  }
  
  let html = '';
  specifications.forEach((spec, index) => {
    html += `
      <div class="specification-item">
        <input type="text" placeholder="規格名稱" class="spec-name" value="${spec.name}" required>
        <input type="number" placeholder="價格" class="spec-price" value="${spec.price}" min="0" required>
        ${index === 0 ? '<button type="button" class="btn-add-spec">+</button>' : '<button type="button" class="btn-remove-spec">-</button>'}
      </div>
    `;
  });
  
  return html;
}

// 生成顏色HTML
function generateColorsHTML(colors) {
  if (!colors || colors.length === 0) {
    return `
      <div class="color-item">
        <input type="text" placeholder="顏色名稱" class="color-name" required>
        <input type="file" class="color-image" accept="image/*">
        <button type="button" class="btn-add-color">+</button>
      </div>
    `;
  }
  
  let html = '';
  colors.forEach((color, index) => {
    html += `
      <div class="color-item">
        <input type="text" placeholder="顏色名稱" class="color-name" value="${color.name}" required>
        <input type="hidden" class="color-image-url" value="${color.imageUrl}">
        <div class="color-preview">
          <img src="${color.imageUrl}" alt="${color.name}" class="color-thumbnail">
          <span>更換圖片:</span>
        </div>
        <input type="file" class="color-image" accept="image/*">
        ${index === 0 ? '<button type="button" class="btn-add-color">+</button>' : '<button type="button" class="btn-remove-color">-</button>'}
      </div>
    `;
  });
  
  return html;
}

// 添加規格欄位
function addSpecificationField() {
  const container = document.getElementById("specifications-container");
  
  // 生成規格選項
  let specOptions = '';
  productSpecificationsData.forEach(spec => {
    specOptions += `<option value="${spec.id}">${spec.name}</option>`;
  });
  
  const newItem = document.createElement("div");
  newItem.className = "specification-item";
  newItem.innerHTML = `
    <div class="spec-selection-container">
      <select class="spec-select">
        ${specOptions}
        <option value="new">+ 新增規格</option>
      </select>
      <div class="new-spec-input" style="display: none; margin-top: 10px;">
        <input type="text" class="new-spec-name" placeholder="輸入新規格名稱">
        <button type="button" class="btn-add add-new-spec-btn">確認新增</button>
      </div>
    </div>
    <input type="number" placeholder="價格" class="spec-price" min="0" required>
    <button type="button" class="btn-remove-spec">-</button>
  `;
  container.appendChild(newItem);
  
  // 綁定移除按鈕事件
  newItem.querySelector(".btn-remove-spec").addEventListener("click", function() {
    container.removeChild(newItem);
  });
  
  // 綁定規格選擇事件
  newItem.querySelector(".spec-select").addEventListener("change", function() {
    const newSpecInput = this.closest(".spec-selection-container").querySelector(".new-spec-input");
    if (this.value === "new") {
      newSpecInput.style.display = "block";
    } else {
      newSpecInput.style.display = "none";
    }
  });
  
  // 綁定新增規格按鈕事件
  newItem.querySelector(".add-new-spec-btn").addEventListener("click", function() {
    const container = this.closest(".spec-selection-container");
    const newSpecName = container.querySelector(".new-spec-name").value.trim();
    if (newSpecName) {
      addNewProductSpecification(newSpecName, container.querySelector(".spec-select"));
    } else {
      alert("請輸入規格名稱");
    }
  });
}

// 添加顏色欄位
function addColorField() {
  const container = document.getElementById("colors-container");
  
  // 生成顏色選項
  let colorOptions = '';
  productColorsData.forEach(color => {
    colorOptions += `<option value="${color.id}">${color.name}</option>`;
  });
  
  const newItem = document.createElement("div");
  newItem.className = "color-item";
  newItem.innerHTML = `
    <div class="color-selection-container">
      <select class="color-select">
        ${colorOptions}
        <option value="new">+ 新增顏色</option>
      </select>
      <div class="new-color-input" style="display: none; margin-top: 10px;">
        <input type="text" class="new-color-name" placeholder="輸入新顏色名稱">
        <button type="button" class="btn-add add-new-color-btn">確認新增</button>
      </div>
    </div>
    <input type="file" class="color-image" accept="image/*" required>
    <div class="color-preview"></div>
    <button type="button" class="btn-remove-color">-</button>
  `;
  container.appendChild(newItem);
  
  // 綁定移除按鈕事件
  newItem.querySelector(".btn-remove-color").addEventListener("click", function() {
    container.removeChild(newItem);
  });
  
  // 綁定圖片預覽事件
  newItem.querySelector(".color-image").addEventListener("change", function() {
    const previewDiv = this.closest(".color-item").querySelector(".color-preview");
    previewImage(this, previewDiv);
  });
  
  // 綁定顏色選擇事件
  newItem.querySelector(".color-select").addEventListener("change", function() {
    const newColorInput = this.closest(".color-selection-container").querySelector(".new-color-input");
    if (this.value === "new") {
      newColorInput.style.display = "block";
    } else {
      newColorInput.style.display = "none";
    }
  });
  
  // 綁定新增顏色按鈕事件
  newItem.querySelector(".add-new-color-btn").addEventListener("click", function() {
    const container = this.closest(".color-selection-container");
    const newColorName = container.querySelector(".new-color-name").value.trim();
    if (newColorName) {
      addNewProductColor(newColorName, container.querySelector(".color-select"));
    } else {
      alert("請輸入顏色名稱");
    }
  });
}

// 保存商品更改
async function saveProductChanges() {
  const productId = parseInt(document.getElementById("product-id").value);
  const productName = document.getElementById("product-name").value;
  const productType = parseInt(document.getElementById("product-type").value);
  const productDescription = document.getElementById("product-description").value;
  const productDiscount = parseInt(document.getElementById("product-discount").value) || 100;
  const productStatus = document.getElementById("product-status").value;
  
  // 獲取規格資料
  const specifications = [];
  document.querySelectorAll(".specification-item").forEach(item => {
    const specName = item.querySelector(".spec-name").value;
    const specPrice = parseInt(item.querySelector(".spec-price").value);
    
    if (specName && !isNaN(specPrice)) {
      specifications.push({
        name: specName,
        price: specPrice
      });
    }
  });
  
  // 獲取顏色資料
  const colors = [];
  const colorItems = document.querySelectorAll(".color-item");
  for (let i = 0; i < colorItems.length; i++) {
    const item = colorItems[i];
    const colorName = item.querySelector(".color-name").value;
    const colorImageFile = item.querySelector(".color-image").files[0];
    const colorImageUrlElement = item.querySelector(".color-image-url");
    
    if (colorName) {
      let imageUrl;
      
      if (colorImageFile) {
        // 上傳新圖片
        imageUrl = await simulateImageUpload(colorImageFile);
      } else if (colorImageUrlElement) {
        // 使用現有圖片
        imageUrl = colorImageUrlElement.value;
      } else {
        // 沒有圖片，使用預設圖片
        imageUrl = 'images/product-1.jpg';
      }
      
      colors.push({
        name: colorName,
        imageUrl: imageUrl
      });
    }
  }
  
  // 表單驗證
  if (!productName || isNaN(productType) || specifications.length === 0) {
    alert("請填寫所有必填欄位，並至少添加一個商品規格");
    return;
  }
  
  try {
    // 在實際應用中，這裡應該發送 PUT 請求到 API
    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 更新本地數據
    const productIndex = productsData.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      // 保留原有的上架時間
      const createdAt = productsData[productIndex].createdAt;
      
      productsData[productIndex] = {
        ...productsData[productIndex],
        name: productName,
        typeId: productType,
        description: productDescription,
        discount: productDiscount,
        status: productStatus,
        specifications: specifications,
        colors: colors,
        createdAt: createdAt // 保持原有的上架時間不變
      };
      
      // 更新篩選後的商品
      const filteredIndex = filteredProducts.findIndex(p => p.id === productId);
      if (filteredIndex !== -1) {
        filteredProducts[filteredIndex] = productsData[productIndex];
      }
      
      // 關閉模態框
      closeModal();
      
      // 重新顯示商品
      displayProducts();
      
      // 顯示成功消息
      showNotification("商品更新成功", "success");
    }
  } catch (error) {
    console.error("更新商品失敗:", error);
    showNotification("更新商品失敗，請稍後再試", "error");
  }
}

// 顯示添加商品模態框
function showAddProductModal() {
  // 創建模態框
  const modal = document.createElement("div");
  modal.className = "custom-modal";
  
  // 生成商品類型選項
  let typeOptions = '';
  productTypesData.forEach(type => {
    typeOptions += `<option value="${type.id}">${type.name}</option>`;
  });
  
  // 生成規格選項
  let specOptions = '';
  productSpecificationsData.forEach(spec => {
    specOptions += `<option value="${spec.id}">${spec.name}</option>`;
  });
  
  // 生成顏色選項
  let colorOptions = '';
  productColorsData.forEach(color => {
    colorOptions += `<option value="${color.id}">${color.name}</option>`;
  });
  
  modal.innerHTML = `
    <div class="modal-content product-form-modal">
      <div class="modal-header">
        <h3>添加新商品</h3>
        <button class="close-btn" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <form id="add-product-form" enctype="multipart/form-data">
          <div class="form-group">
            <label for="product-name">商品名稱</label>
            <input type="text" id="product-name" required>
          </div>
          
          <div class="form-group">
            <label for="product-type">商品類型</label>
            <div class="type-selection-container">
              <select id="product-type" required>
                ${typeOptions}
                <option value="new">+ 新增類型</option>
              </select>
              <div id="new-type-container" style="display: none; margin-top: 10px;">
                <input type="text" id="new-type-name" placeholder="輸入新類型名稱">
                <button type="button" class="btn-add" id="add-new-type-btn">確認新增</button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="product-main-image">商品主圖</label>
            <input type="file" id="product-main-image" accept="image/*" required>
            <div id="main-image-preview" class="image-preview"></div>
          </div>
          
          <div class="form-group">
            <label for="product-description">商品描述</label>
            <textarea id="product-description" rows="4"></textarea>
          </div>
          
          <div class="form-group">
            <label for="product-discount">商品折扣</label>
            <input type="number" id="product-discount" min="0" max="1" step="0.01" value="1">
            <small>請輸入0到1之間的數值，例如：0.8表示8折</small>
          </div>
          
          <div class="form-group">
            <label for="product-status">商品狀態</label>
            <select id="product-status" required>
              <option value="上架中">上架中</option>
              <option value="已下架">已下架</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>商品規格</label>
            <div id="specifications-container">
              <div class="specification-item">
                <div class="spec-selection-container">
                  <select class="spec-select">
                    ${specOptions}
                    <option value="new">+ 新增規格</option>
                  </select>
                  <div class="new-spec-input" style="display: none; margin-top: 10px;">
                    <input type="text" class="new-spec-name" placeholder="輸入新規格名稱">
                    <button type="button" class="btn-add add-new-spec-btn">確認新增</button>
                  </div>
                </div>
                <input type="number" placeholder="價格" class="spec-price" min="0" required>
                <button type="button" class="btn-add-spec">+</button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>商品顏色</label>
            <div id="colors-container">
              <div class="color-item">
                <div class="color-selection-container">
                  <select class="color-select">
                    ${colorOptions}
                    <option value="new">+ 新增顏色</option>
                  </select>
                  <div class="new-color-input" style="display: none; margin-top: 10px;">
                    <input type="text" class="new-color-name" placeholder="輸入新顏色名稱">
                    <button type="button" class="btn-add add-new-color-btn">確認新增</button>
                  </div>
                </div>
                <input type="file" class="color-image" accept="image/*" required>
                <div class="color-preview"></div>
                <button type="button" class="btn-add-color">+</button>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
            <button type="submit" class="btn-save">添加商品</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  modal.style.display = "flex"; // 顯示模態框
  // 添加到頁面
  document.body.appendChild(modal);
  
  // 綁定添加規格按鈕事件
  document.querySelector(".btn-add-spec").addEventListener("click", addSpecificationField);
  
  // 綁定添加顏色按鈕事件
  document.querySelector(".btn-add-color").addEventListener("click", addColorField);
  
  // 綁定商品類型選擇事件
  document.getElementById("product-type").addEventListener("change", function() {
    const newTypeContainer = document.getElementById("new-type-container");
    if (this.value === "new") {
      newTypeContainer.style.display = "block";
    } else {
      newTypeContainer.style.display = "none";
    }
  });
  
  // 綁定規格選擇事件
  document.querySelectorAll(".spec-select").forEach(select => {
    select.addEventListener("change", function() {
      const newSpecInput = this.closest(".spec-selection-container").querySelector(".new-spec-input");
      if (this.value === "new") {
        newSpecInput.style.display = "block";
      } else {
        newSpecInput.style.display = "none";
      }
    });
  });
  
  // 綁定顏色選擇事件
  document.querySelectorAll(".color-select").forEach(select => {
    select.addEventListener("change", function() {
      const newColorInput = this.closest(".color-selection-container").querySelector(".new-color-input");
      if (this.value === "new") {
        newColorInput.style.display = "block";
      } else {
        newColorInput.style.display = "none";
      }
    });
  });
  
  // 綁定新增類型按鈕事件
  document.getElementById("add-new-type-btn").addEventListener("click", function() {
    const newTypeName = document.getElementById("new-type-name").value.trim();
    if (newTypeName) {
      addNewProductType(newTypeName);
    } else {
      alert("請輸入類型名稱");
    }
  });
  
  // 綁定新增規格按鈕事件
  document.querySelectorAll(".add-new-spec-btn").forEach(button => {
    button.addEventListener("click", function() {
      const container = this.closest(".spec-selection-container");
      const newSpecName = container.querySelector(".new-spec-name").value.trim();
      if (newSpecName) {
        addNewProductSpecification(newSpecName, container.querySelector(".spec-select"));
      } else {
        alert("請輸入規格名稱");
      }
    });
  });
  
  // 綁定新增顏色按鈕事件
  document.querySelectorAll(".add-new-color-btn").forEach(button => {
    button.addEventListener("click", function() {
      const container = this.closest(".color-selection-container");
      const newColorName = container.querySelector(".new-color-name").value.trim();
      if (newColorName) {
        addNewProductColor(newColorName, container.querySelector(".color-select"));
      } else {
        alert("請輸入顏色名稱");
      }
    });
  });
  
  // 綁定主圖預覽
  document.getElementById("product-main-image").addEventListener("change", function(e) {
    previewImage(this, document.getElementById("main-image-preview"));
  });
  
  // 綁定顏色圖片預覽
  document.querySelectorAll(".color-image").forEach(input => {
    input.addEventListener("change", function() {
      const previewDiv = this.closest(".color-item").querySelector(".color-preview");
      previewImage(this, previewDiv);
    });
  });
  
  // 綁定表單提交事件
  document.getElementById("add-product-form").addEventListener("submit", function(e) {
    e.preventDefault();
    addNewProduct();
  });
}

// 添加新商品
async function addNewProduct() {
  const productName = document.getElementById("product-name").value;
  const productType = parseInt(document.getElementById("product-type").value);
  const productMainImage = document.getElementById("product-main-image").files[0];
  const productDescription = document.getElementById("product-description").value;
  const productDiscount = parseFloat(document.getElementById("product-discount").value) || 1;
  const productStatus = document.getElementById("product-status").value;
  
  // 獲取規格資料
  const specifications = [];
  document.querySelectorAll(".specification-item").forEach(item => {
    const specSelect = item.querySelector(".spec-select");
    const specPrice = parseInt(item.querySelector(".spec-price").value);
    
    if (specSelect && specSelect.value !== "new" && !isNaN(specPrice)) {
      const specId = parseInt(specSelect.value);
      const specName = productSpecificationsData.find(s => s.id === specId)?.name || "未知規格";
      
      specifications.push({
        id: specId,
        name: specName,
        price: specPrice
      });
    }
  });
  
  // 獲取顏色資料
  const colors = [];
  const colorItems = document.querySelectorAll(".color-item");
  for (let i = 0; i < colorItems.length; i++) {
    const item = colorItems[i];
    const colorSelect = item.querySelector(".color-select");
    const colorImageFile = item.querySelector(".color-image").files[0];
    
    if (colorSelect && colorSelect.value !== "new" && colorImageFile) {
      const colorId = parseInt(colorSelect.value);
      const colorName = productColorsData.find(c => c.id === colorId)?.name || "未知顏色";
      
      // 在實際應用中，這裡應該上傳圖片到伺服器並獲取URL
      // 這裡僅模擬上傳過程
      const imageUrl = await simulateImageUpload(colorImageFile);
      
      colors.push({
        id: colorId,
        name: colorName,
        imageUrl: imageUrl
      });
    }
  }
  
  // 表單驗證
  if (!productName || isNaN(productType) || !productMainImage || specifications.length === 0 || colors.length === 0) {
    alert("請填寫所有必填欄位，並至少添加一個商品規格和顏色");
    return;
  }
  
  try {
    // 上傳主圖
    const mainImageUrl = await simulateImageUpload(productMainImage);
    
    // 在實際應用中，這裡應該發送 POST 請求到 API
    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 生成新商品ID
    const newId = productsData.length > 0 ? Math.max(...productsData.map(p => p.id)) + 1 : 1;
    
    // 創建新商品對象
    const newProduct = {
      id: newId,
      name: productName,
      typeId: productType,
      imageUrl: mainImageUrl,
      description: productDescription,
      discount: productDiscount,
      status: productStatus,
      specifications: specifications,
      colors: colors,
      createdAt: new Date()
    };
    
    // 添加到本地數據
    productsData.push(newProduct);
    
    // 更新篩選後的商品
    if (shouldIncludeInFiltered(newProduct)) {
      filteredProducts.push(newProduct);
    }
    
    // 關閉模態框
    closeModal();
    
    // 重新顯示商品
    displayProducts();
    
    // 顯示成功消息
    showNotification("商品添加成功", "success");
  } catch (error) {
    console.error("添加商品失敗:", error);
    showNotification("添加商品失敗，請稍後再試", "error");
  }
}

// 切換商品狀態
async function toggleProductStatus(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) {
    alert("找不到商品資料");
    return;
  }
  
  const newStatus = product.status === "上架中" ? "已下架" : "上架中";
  const confirmMessage = `確定要將商品「${product.name}」${newStatus === "上架中" ? "上架" : "下架"}嗎？`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    // 在實際應用中，這裡應該發送 PATCH 請求到 API
    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 更新本地數據
    product.status = newStatus;
    
    // 重新顯示商品
    displayProducts();
    
    // 顯示成功消息
    showNotification(`商品已${newStatus === "上架中" ? "上架" : "下架"}`, "success");
  } catch (error) {
    console.error("更新商品狀態失敗:", error);
    showNotification("更新商品狀態失敗，請稍後再試", "error");
  }
}

// 檢查商品是否應該包含在篩選結果中
function shouldIncludeInFiltered(product) {
  const typeFilter = document.getElementById("product-type-filter").value;
  const statusFilter = document.getElementById("product-status-filter").value;
  
  // 類型篩選
  if (typeFilter !== "all" && product.typeId !== parseInt(typeFilter)) {
    return false;
  }
  
  // 狀態篩選
  if (statusFilter !== "all" && product.status !== statusFilter) {
    return false;
  }
  
  return true;
}

// 關閉模態框
function closeModal() {
  const modal = document.querySelector(".custom-modal");
  if (modal) {
    modal.remove();
  }
}

// 模擬圖片上傳
async function simulateImageUpload(file) {
  // 在實際應用中，這裡應該將圖片上傳到伺服器
  // 這裡僅返回一個模擬的URL
  return new Promise(resolve => {
    setTimeout(() => {
      // 隨機選擇一個示例圖片URL
      const randomIndex = Math.floor(Math.random() * 4) + 1;
      resolve(`images/product-${randomIndex}.jpg`);
    }, 300);
  });
}

// 預覽圖片
function previewImage(input, previewElement) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      previewElement.innerHTML = `<img src="${e.target.result}" alt="圖片預覽" class="preview-img">`;
    }
    
    reader.readAsDataURL(input.files[0]);
  } else {
    previewElement.innerHTML = '';
  }
}

// 添加新商品類型
async function addNewProductType(typeName) {
  try {
    // 在實際應用中，這裡應該發送 POST 請求到 API
    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 生成新類型ID
    const newTypeId = productTypesData.length > 0 ? Math.max(...productTypesData.map(t => t.id)) + 1 : 1;
    
    // 創建新類型對象
    const newType = {
      id: newTypeId,
      name: typeName
    };
    
    // 添加到本地數據
    productTypesData.push(newType);
    
    // 更新類型選擇器
    const typeSelect = document.getElementById("product-type");
    const newOption = document.createElement("option");
    newOption.value = newType.id;
    newOption.textContent = newType.name;
    
    // 插入到「新增類型」選項之前
    typeSelect.insertBefore(newOption, typeSelect.lastElementChild);
    
    // 選中新添加的類型
    typeSelect.value = newType.id;
    
    // 隱藏新增類型輸入框
    document.getElementById("new-type-container").style.display = "none";
    
    // 顯示成功消息
    showNotification("新類型添加成功", "success");
  } catch (error) {
    console.error("添加類型失敗:", error);
    showNotification("添加類型失敗，請稍後再試", "error");
  }
}

// 添加新商品規格
async function addNewProductSpecification(specName, selectElement) {
  try {
    // 在實際應用中，這裡應該發送 POST 請求到 API
    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 生成新規格ID
    const newSpecId = productSpecificationsData.length > 0 ? Math.max(...productSpecificationsData.map(s => s.id)) + 1 : 1;
    
    // 創建新規格對象
    const newSpec = {
      id: newSpecId,
      name: specName
    };
    
    // 添加到本地數據
    productSpecificationsData.push(newSpec);
    
    // 更新規格選擇器
    const newOption = document.createElement("option");
    newOption.value = newSpec.id;
    newOption.textContent = newSpec.name;
    
    // 插入到「新增規格」選項之前
    selectElement.insertBefore(newOption, selectElement.lastElementChild);
    
    // 選中新添加的規格
    selectElement.value = newSpec.id;
    
    // 隱藏新增規格輸入框
    selectElement.closest(".spec-selection-container").querySelector(".new-spec-input").style.display = "none";
    
    // 顯示成功消息
    showNotification("新規格添加成功", "success");
  } catch (error) {
    console.error("添加規格失敗:", error);
    showNotification("添加規格失敗，請稍後再試", "error");
  }
}

// 添加新商品顏色
async function addNewProductColor(colorName, selectElement) {
  try {
    // 在實際應用中，這裡應該發送 POST 請求到 API
    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 生成新顏色ID
    const newColorId = productColorsData.length > 0 ? Math.max(...productColorsData.map(c => c.id)) + 1 : 1;
    
    // 創建新顏色對象
    const newColor = {
      id: newColorId,
      name: colorName
    };
    
    // 添加到本地數據
    productColorsData.push(newColor);
    
    // 更新顏色選擇器
    const newOption = document.createElement("option");
    newOption.value = newColor.id;
    newOption.textContent = newColor.name;
    
    // 插入到「新增顏色」選項之前
    selectElement.insertBefore(newOption, selectElement.lastElementChild);
    
    // 選中新添加的顏色
    selectElement.value = newColor.id;
    
    // 隱藏新增顏色輸入框
    selectElement.closest(".color-selection-container").querySelector(".new-color-input").style.display = "none";
    
    // 顯示成功消息
    showNotification("新顏色添加成功", "success");
  } catch (error) {
    console.error("添加顏色失敗:", error);
    showNotification("添加顏色失敗，請稍後再試", "error");
  }
}

// 顯示通知消息
function showNotification(message, type = "success") {
  // 創建通知元素
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i>
    <span>${message}</span>
  `;
  
  modal.style.display = "flex"; // 顯示模態框
  // 添加到頁面
  document.body.appendChild(notification);
  
  // 設置自動消失
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}