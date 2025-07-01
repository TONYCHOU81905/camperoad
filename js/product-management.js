// product-management.js

// 商品管理相關變數
let productsData = [];
let filteredProducts = [];
let productTypesData = [];
let productSpecsData = [];
let productColorsData = [];

let currentPage = 1;
const itemsPerPage = 10;


// 載入商品數據
async function loadProductsData() {
  try {
    console.log("開始載入商品數據...");

    // 顯示載入提示
    const content = document.getElementById("product-management-content");
    if (!content) {
      console.error("找不到 product-management-content 元素");
      return;
    }
    content.innerHTML = `<div class="loading">載入商品數據中...</div>`;

    // 1. 商品類型
    const typeResponse = await fetch(`${window.api_prefix}/api/product-types`);
    if (!typeResponse.ok) throw new Error(`商品類型錯誤: ${typeResponse.status}`);
    const typeData = await typeResponse.json();
    productTypesData = (typeData.data || []).map(t => ({
      id: t.prodTypeId,
      name: t.prodTypeName
    }));
    console.log("商品類型資料：", productTypesData);

    // 2. 商品規格
    const specResponse = await fetch(`${window.api_prefix}/api/specs`);
    if (!specResponse.ok) throw new Error(`商品規格錯誤: ${specResponse.status}`);
    const specData = await specResponse.json();

    productSpecsData = (specData.data || []).map(s => ({
      id: s.specId,
      name: s.specName 
    }));
    // productSpecsData = (Array.isArray(specRes) ? specRes : []).map(s => ({
    //   id: s.specId,
    //   name: s.specName
    // }));
    
    console.log("商品規格資料：", productSpecsData);

    // 3. 商品顏色
    const colorResponse = await fetch(`${window.api_prefix}/api/colors`);
    if (!colorResponse.ok) throw new Error(`商品顏色錯誤: ${colorResponse.status}`);
    const colorData = await colorResponse.json();
    productSpecsData = (colorData.data || []).map(c => ({
      id: c.colorId,
      name: c.colorName
    }));
    // productColorsData = (Array.isArray(colorData) ? colorData : []).map(c => ({
    //   id: c.colorId,
    //   name: c.colorName
    // }));
    
    console.log("商品顏色資料：", productColorsData);

    // 4. 商品主資料
    const prodResponse = await fetch(`${window.api_prefix}/api/products`);
    if (!prodResponse.ok) throw new Error(`商品資料錯誤: ${prodResponse.status}`);
    const prodData = await prodResponse.json();

    productsData = (prodData.data || []).map(p => ({
      id: p.prodId,
      name: p.prodName,
      typeId: p.prodTypeId,
      description: p.prodIntro,
      discount: Number(p.prodDiscount),
      createdAt: p.prodReleaseDate ? new Date(p.prodReleaseDate) : null,
      status: p.prodStatus === 1 ? "上架中" : "已下架",
      specs: (p.prodSpecList || []).map(s => ({
        name: s.prodSpecName,
        price: s.prodSpecPrice
      })),      
      colors: (p.prodColorList || []).map(c => ({
        name: c.colorName
        // ,imageUrl: c.prodColorPicBase64 ? `data:image/jpeg;base64,${c.prodColorPicBase64}` : "images/product-1.jpg"
      })),
      imageUrl: (p.prodPicList && p.prodPicList.length > 0)
        ? `data:image/jpeg;base64,${p.prodPicList[0].prodPicBase64}`
        : "images/product-1.jpg"
    }));
    
    
    filteredProducts = [...productsData];

    // 顯示資料
    displayProducts();
    initProductTypeFilter();
    console.log("商品資料載入完成");

  } catch (err) {
    console.error("API 載入失敗，改用模擬資料", err);

    // 改用模擬資料
    productsData = generateMockProducts(20);
    productTypesData = [
      { id: 1, name: "帳篷" },
      { id: 2, name: "睡袋" },
      { id: 3, name: "保溫杯" },
      { id: 4, name: "野餐墊" }
    ];
    productSpecsData = [
      { id: 1, name: "小型" },
      { id: 2, name: "中型" },
      { id: 3, name: "大型" }
    ];
    productColorsData = [
      { id: 1, name: "紅色" },
      { id: 2, name: "藍色" },
      { id: 3, name: "綠色" }
    ];
    filteredProducts = [...productsData];
    displayProducts();
    initProductTypeFilter();
    showNotification("載入遠端資料失敗，已載入模擬資料", "error");
  }
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
    if (product.specs && product.specs.length > 0) {
      const specNames = product.specs.map(spec => spec.name).join(', ');
      colorAndSpecText += `規格: ${specNames}`;
    } else {
      colorAndSpecText += `規格: 無`;
    }
    
    // 格式化上架時間
    const createdAtFormatted = formatDateTime(product.createdAt);
    
    // 將折扣從百分比轉換為 0~1 之間的小數
    let discountValue = "無折扣";
    if (typeof product.discount === 'number' && product.discount > 0 && product.discount < 1) {
      const discountNum = Math.round(product.discount * 100); // 0.85 → 85
      const displayText = discountNum % 10 === 0
        ? (discountNum / 10) + "折"   // 例如 90 → 9折
        : discountNum + "折";         // 例如 85 → 85折
      discountValue = displayText;
    }

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
            <div id="specs-container">
              ${generateSpecificationsHTML(product.specs)}
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
function generateSpecificationsHTML(specs) {
  if (!specs || specs.length === 0) {
    return `
      <div class="specification-item">
        <input type="text" placeholder="規格名稱" class="spec-name" required>
        <input type="number" placeholder="價格" class="spec-price" min="0" required>
        <button type="button" class="btn-add-spec">+</button>
      </div>
    `;
  }
  
  let html = '';
  specs.forEach((spec, index) => {
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

function getColorImageUrl(prodId, colorId) {
  return `${window.api_prefix}/api/prod-colors/colorpic/${prodId}/${colorId}`;
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
    const prodId = color.prodId || color.prod_id || 0; // 後台編輯時應該都有 prodId
    const colorId = color.prodColorId || color.colorId || 0;
    const colorName = color.colorName || color.name || `顏色${colorId}`;
    const imgUrl = getColorImageUrl(prodId, colorId); // ✅ 使用 API 載入圖片

    html += `
      <div class="color-item">
        <input type="text" placeholder="顏色名稱" class="color-name" value="${colorName}" required>
        <div class="color-preview">
          <img src="${imgUrl}" alt="${colorName}" class="color-thumbnail" onerror="this.src='images/default-color.png'">
          <span>更換圖片:</span>
        </div>
        <input type="file" class="color-image" accept="image/*">
        ${index === 0
          ? '<button type="button" class="btn-add-color">+</button>'
          : '<button type="button" class="btn-remove-color">-</button>'}
      </div>
    `;
  });

  return html;
}



// 添加規格欄位
function addSpecificationField() {
  const container = document.getElementById("specs-container");
  
  // 生成規格選項
  let specOptions = '';
  productSpecsData.forEach(spec => {
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
      addNewProductSpec(newSpecName, container.querySelector(".spec-select"));
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
    <input type="file" class="color-image" accept="image/*">
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
  const specs = [];
  document.querySelectorAll(".specification-item").forEach(item => {
    const specName = item.querySelector(".spec-name").value;
    const specPrice = parseInt(item.querySelector(".spec-price").value);
    
    if (specName && !isNaN(specPrice)) {
      specs.push({
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
  if (!productName || isNaN(productType) || specs.length === 0) {
    alert("請填寫所有必填欄位，並至少添加一個商品規格");
    return;
  }
  
  try {
    // 構建請求數據
    const productData = {
      prodId: productId,
      prodName: productName,
      prodTypeId: productType,
      prodDescription: productDescription,
      prodIntro: productDiscount / 100, // 轉換為小數
      prodStatus: productStatus === "上架中" ? 1 : 0,
      specs: specs,
      colors: colors
    };
    
    // 發送 PUT 請求到 API
    const response = await fetch(`http://localhost:8081/CJA101G02/api/updateprod`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      throw new Error(`更新商品失敗: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      // 更新本地數據
      const productIndex = productsData.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        // 更新本地數據
        productsData[productIndex] = {
          ...productsData[productIndex],
          name: productName,
          typeId: productType,
          description: productDescription,
          discount: productDiscount / 100,
          status: productStatus,
          specs: specs,
          colors: colors
        };
        
        // 更新篩選後的商品
        const filteredIndex = filteredProducts.findIndex(p => p.id === productId);
        if (filteredIndex !== -1) {
          filteredProducts[filteredIndex] = productsData[productIndex];
        }
      }
      
      // 關閉模態框
      closeModal();
      
      // 重新顯示商品
      displayProducts();
      
      // 顯示成功消息
      showNotification("商品更新成功", "success");
    } else {
      throw new Error(result.message || "更新商品失敗");
    }
  } catch (error) {
    console.error("更新商品失敗:", error);
    showNotification("更新商品失敗，請稍後再試", "error");
  }
}

// 顯示添加商品模態框
async function showAddProductModal() {

  // 載入所有可用的規格與顏色
  const [specRes, colorRes] = await Promise.all([
    fetch(`${window.api_prefix}/api/specs`).then(res => res.json()),
    fetch(`${window.api_prefix}/api/colors`).then(res => res.json())
  ]);

  const allSpecs = (Array.isArray(specRes) ? specRes : []).map(s => ({
    id: s.specId,
    name: s.specName
  }));
  
  const allColors = (Array.isArray(colorRes) ? colorRes : []).map(c => ({
    id: c.colorId,
    name: c.colorName
  }));

  // 把資料存在全域（可省略）
  productSpecsData = allSpecs;
  productColorsData = allColors;

  
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
  productSpecsData.forEach(spec => {
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
            <div id="specs-container">
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
          
          <!-- 新增「是否有顏色」單選按鈕 -->
          <div class="form-group">
            <label>是否有顏色</label>
            <div class="radio-group">
              <label>
                <input type="radio" name="has-color" value="yes" checked> 有顏色
              </label>
              <label>
                <input type="radio" name="has-color" value="no"> 沒有顏色
              </label>
            </div>
          </div>

          <div class="form-group" id="colors-section">
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
        addNewProductSpec(newSpecName, container.querySelector(".spec-select"));
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
  
  // 綁定「是否有顏色」單選按鈕事件
  document.querySelectorAll('input[name="has-color"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const colorsSection = document.getElementById('colors-section');
      if (this.value === 'yes') {
        colorsSection.style.display = 'block';
      } else {
        colorsSection.style.display = 'none';
      }
    });
  });
}

// 添加新商品
async function addNewProduct() {
  const productName = document.getElementById("product-name").value.trim();
  const productType = parseInt(document.getElementById("product-type").value);
  const productMainImage = document.getElementById("product-main-image").files[0];
  const productDescription = document.getElementById("product-description").value;
  const productDiscount = parseFloat(document.getElementById("product-discount").value) || 1;
  const productStatus = document.getElementById("product-status").value;
  const hasColor = document.querySelector('input[name="has-color"]:checked').value === 'yes';

  // 驗證商品名稱
  if (productName.length < 1 || productName.length > 50) {
    showNotification("商品名稱長度必須介於 1 到 50 字之間", "error");
    return;
  }

  
  // 獲取規格資料
  const specs = [];
  document.querySelectorAll(".specification-item").forEach(item => {
    const specSelect = item.querySelector(".spec-select");
    const specPrice = parseInt(item.querySelector(".spec-price").value);
    
    if (specSelect && specSelect.value !== "new" && !isNaN(specPrice)) {
      const specId = parseInt(specSelect.value);
      const specName = productSpecsData.find(s => s.id === specId)?.name || "未知規格";
      
      specs.push({
        id: specId,
        name: specName,
        price: specPrice
      });
    }
  });
  
  // 獲取顏色資料
  const colors = [];
  if (hasColor) {
    const colorItems = document.querySelectorAll(".color-item");
    for (let i = 0; i < colorItems.length; i++) {
      const item = colorItems[i];
      const colorSelect = item.querySelector(".color-select");
      const colorImageFile = item.querySelector(".color-image").files[0];
      
      if (colorSelect && colorSelect.value !== "new" && colorImageFile) {
        const colorId = parseInt(colorSelect.value);
        const colorName = productColorsData.find(c => c.id === colorId)?.name || "未知顏色";
        
        // 上傳圖片到伺服器並獲取URL
        const imageUrl = await simulateImageUpload(colorImageFile);
        
        colors.push({
          id: colorId,
          name: colorName,
          imageUrl: imageUrl
        });
      }
    }
  }
  
  // 表單驗證
  if (!productName || isNaN(productType) || !productMainImage || specs.length === 0) {
    alert("請填寫所有必填欄位，並至少添加一個商品規格");
    return;
  }
  
  // 如果有顏色但沒有添加顏色資料，顯示錯誤
  if (hasColor && colors.length === 0) {
    alert("請至少添加一個商品顏色");
    return;
  }
  
  try {
    // 上傳主圖
    const mainImageUrl = await simulateImageUpload(productMainImage);
    
    // 構建請求數據
    const productData = {
      prodName: productName,
      prodTypeId: productType,
      prodImageUrl: mainImageUrl,
      prodIntro: productDescription,
      prodDiscount: productDiscount,
      prodStatus: productStatus === "上架中" ? 1 : 0,
      prodColorOrNot: hasColor ? 1 : 0,
      specs: specs,
      colors: colors
    };
    
    // 發送 POST 請求到 API
    const response = await fetch(`http://localhost:8081/CJA101G02/api/addprod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      throw new Error(`添加商品失敗: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      // 獲取新商品ID
      const newId = result.data.prodId;
      
      // 創建新商品對象
      const newProduct = {
        id: newId,
        name: productName,
        typeId: productType,
        imageUrl: mainImageUrl,
        description: productDescription,
        discount: productDiscount,
        status: productStatus,
        specs: specs,
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
    } else {
      throw new Error(result.message || "添加商品失敗");
    }
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
    // 發送 PATCH 請求到 API
    const response = await fetch(`http://localhost:8081/CJA101G02/api/products/${productId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus === "上架中" ? 1 : 0
      })
    });
    
    if (!response.ok) {
      throw new Error(`更新商品狀態失敗: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      // 更新本地數據
      product.status = newStatus;
      
      // 重新顯示商品
      displayProducts();
      
      // 顯示成功消息
      showNotification(`商品已${newStatus === "上架中" ? "上架" : "下架"}`, "success");
    } else {
      throw new Error(result.message || "更新商品狀態失敗");
    }
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
  // 在實際應用中，這裡應該上傳圖片到伺服器並獲取URL
  // 這裡僅模擬上傳過程
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模擬返回圖片URL
      const imageIndex = Math.floor(Math.random() * 4) + 1;
      resolve(`images/product-${imageIndex}.jpg`);
      
      // 實際應用中，應該使用FormData上傳圖片
      /*
      const formData = new FormData();
      formData.append('image', file);
      
      fetch('http://localhost:8081/CJA101G02/api/upload-image', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          resolve(data.imageUrl);
        } else {
          throw new Error(data.message || '上傳圖片失敗');
        }
      })
      .catch(error => {
        console.error('上傳圖片失敗:', error);
        // 失敗時使用預設圖片
        resolve('images/product-1.jpg');
      });
      */
    }, 500);
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
async function addNewProductSpec(specName, selectElement) {
  try {
    // 先檢查是否已存在相同名稱
    const exists = productSpecsData.some(s => s.name === specName);
    if (exists) {
      alert("此規格名稱已存在，請勿重複新增");
      return;
    }

    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 300));

    const newSpecId = productSpecsData.length > 0 ? Math.max(...productSpecsData.map(s => s.id)) + 1 : 1;
    const newSpec = { id: newSpecId, name: specName };
    productSpecsData.push(newSpec);

    const newOption = document.createElement("option");
    newOption.value = newSpec.id;
    newOption.textContent = newSpec.name;
    selectElement.insertBefore(newOption, selectElement.lastElementChild);
    selectElement.value = newSpec.id;

    selectElement.closest(".spec-selection-container").querySelector(".new-spec-input").style.display = "none";
    showNotification("新規格添加成功", "success");
  } catch (error) {
    console.error("添加規格失敗:", error);
    showNotification("添加規格失敗，請稍後再試", "error");
  }
}



// 添加新商品顏色
async function addNewProductColor(colorName, selectElement) {
  try {
    // 防止新增重複名稱
    const exists = productColorsData.some(c => c.name === colorName);
    if (exists) {
      alert("此顏色名稱已存在，請勿重複新增");
      return;
    }

    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 300));

    const newColorId = productColorsData.length > 0 ? Math.max(...productColorsData.map(c => c.id)) + 1 : 1;
    const newColor = { id: newColorId, name: colorName };
    productColorsData.push(newColor);

    const newOption = document.createElement("option");
    newOption.value = newColor.id;
    newOption.textContent = newColor.name;
    selectElement.insertBefore(newOption, selectElement.lastElementChild);
    selectElement.value = newColor.id;

    selectElement.closest(".color-selection-container").querySelector(".new-color-input").style.display = "none";
    showNotification("新顏色添加成功", "success");
  } catch (error) {
    console.error("添加顏色失敗:", error);
    showNotification("添加顏色失敗，請稍後再試", "error");
  }
}



// 顯示通知消息 ;新增成功、更新失敗、操作提示等訊息
function showNotification(message, type = "success") {
  // 創建通知元素
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i>
    <span>${message}</span>
  `;

  // 直接加到頁面（不需要 modal）
  document.body.appendChild(notification);

  // 加入淡出動畫（搭配 CSS）
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

