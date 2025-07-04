// product-management.js

// 商品管理相關變數
let productsData = [];
let filteredProducts = [];
let productTypesData = [];
let productSpecsData = [];
let productColorsData = [];
let deletedSpecIds = [];
let deletedColorIds = [];

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

    // productSpecsData = (specData.data || []).map(s => ({
    productSpecsData = (Array.isArray(specData) ? specData : []).map(s => ({
      id: s.specId,
      name: s.specName 
    }));
    console.log("商品規格資料：", productSpecsData);

    // 3. 商品顏色
    const colorResponse = await fetch(`${window.api_prefix}/api/colors`);
    if (!colorResponse.ok) throw new Error(`商品顏色錯誤: ${colorResponse.status}`);
    const colorData = await colorResponse.json();
    // productColorsData = (colorData.data || []).map(c => ({
    productColorsData = (Array.isArray(colorData) ? colorData : []).map(c => ({
      id: c.colorId,
      name: c.colorName
    }));
    console.log("商品顏色資料：", productColorsData);

    // 4. 商品主資料
    const prodResponse = await fetch(`${window.api_prefix}/admin/products`);
    if (!prodResponse.ok) throw new Error(`商品資料錯誤: ${prodResponse.status}`);
    const prodData = await prodResponse.json();

    productsData = (prodData.data || []).map(p => {
      // 檢查是否為單一顏色商品
      const isSingleColor = p.prodColorList && p.prodColorList.length === 1 && p.prodColorList[0].prodColorId === 1;
      
      return {
        id: p.prodId,
        name: p.prodName,
        typeId: p.prodTypeId,
        description: p.prodIntro,
        discount: Number(p.prodDiscount),
        createdAt: p.prodReleaseDate ? new Date(p.prodReleaseDate) : null,
        status: p.prodStatus === 1 ? "上架中" : "已下架",
        specs: (p.prodSpecList || []).map(s => ({
          prodSpecId: s.prodSpecId,
          name: s.prodSpecName,
          price: s.prodSpecPrice
        })),
        colors: (p.prodColorList || []).map(c => ({
          prodColorId: c.prodColorId,
          name: c.colorName
          // ,imageUrl: c.prodColorPicBase64 ? `data:image/jpeg;base64,${c.prodColorPicBase64}` : "images/product-1.jpg"
        })),
        imageUrl: (p.prodPicList && p.prodPicList.length > 0)
        ? `${window.api_prefix}/api/prodpics/${p.prodPicList[0].prodPicId}`
        : "images/product-1.jpg",
        prodColorOrNot: p.prodColorOrNot !== undefined ? p.prodColorOrNot : (isSingleColor ? 0 : 1) // 根據顏色列表推斷
      };
    });
    
    
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
    // 獲取第一個商品圖片作為商品主圖
    const mainImage = product.imageUrl || 'images/product-1.jpg';
    
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

// 查看商品詳情 ✅
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
            <p><strong>狀態:</strong> ${product.status}</p>
            <p><strong>建立日期:</strong> ${product.createdAt ? product.createdAt.toLocaleDateString() : '未知'}</p>
            <p><strong>規格:</strong> ${product.specs && product.specs.length > 0 ? 
              product.specs.map(spec => `${spec.name} (NT$ ${spec.price})`).join(', ') : '無規格資訊'}</p>
            <p><strong>顏色:</strong> ${product.colors && product.colors.length > 0 ? 
              product.colors.map(color => color.name || color.colorName).join(', ') : '無顏色資訊'}</p>
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

// 顯示編輯商品視窗
function showEditProductModal(productId) {
  // 清空已刪除項目的列表
  deletedSpecIds = [];
  deletedColorIds = [];
  
  const product = productsData.find(p => p.id === productId);
  if (!product) {
    alert("找不到商品資料");
    return;
  }

  const modal = document.createElement("div");
  modal.className = "custom-modal";

  let typeOptions = '';
  productTypesData.forEach(type => {
    typeOptions += `<option value="${type.id}" ${product.typeId === type.id ? 'selected' : ''}>${type.name}</option>`;
  });

  // 檢查商品是否有顏色（確保有默認值）
  const prodColorOrNot = product.prodColorOrNot !== undefined ? product.prodColorOrNot : 1; // 默認為有顏色
  const hasColorChecked = prodColorOrNot === 1 ? 'checked' : '';
  const noColorChecked = prodColorOrNot === 0 ? 'checked' : '';

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
            <label for="product-main-image">商品主圖</label>
            <div class="current-image-container">
              <img src="${product.imageUrl}" alt="${product.name}" style="max-width: 100px; max-height: 100px; margin-bottom: 10px;">
              <p>當前圖片</p>
            </div>
            <input type="file" id="product-main-image" accept="image/*">
            <div id="main-image-preview" class="image-preview"></div>
            <p class="form-hint">* 如不上傳新圖片，將保留原有圖片</p>
          </div>

          <div class="form-group">
            <label for="product-description">商品描述</label>
            <textarea id="product-description" rows="4">${product.description || ''}</textarea>
          </div>

          <div class="form-group">
            <label for="product-discount">商品折扣 (%)</label>
            <input type="number" id="product-discount" min="0" max="1" step="0.01" value="${product.discount || 1}">
            <small>請輸入0到1之間的數值，例如：0.8 表示 8 折</small>
          </div>

          <div class="form-group">
            <label>商品規格</label>
            <div id="specs-container">
              ${product.specs.map((spec, index) => {
                return `
                  <div class="specification-item" data-original-id="${spec.prodSpecId}">
                    <select class="spec-select">
                        ${getSpecOptionsHTML(spec.prodSpecId)}
                    </select>
                    <input type="number" placeholder="價格" class="spec-price" value="${spec.price}" min="0" required>
                    <button type="button" class="btn-remove-spec">-</button>
                  </div>
                `;
              }).join('')}
              <button type="button" class="btn-add-spec" style="margin-top: 10px; width: 100%;">+ 新增規格</button>
            </div>
          </div>

          <div class="form-group">
            <label>是否有顏色</label>
            <div class="radio-group">
              <label><input type="radio" name="has-color" value="yes" ${hasColorChecked}> 有顏色</label>
              <label><input type="radio" name="has-color" value="no" ${noColorChecked}> 沒有顏色</label>
            </div>
          </div>

          <div class="form-group" id="colors-section">
            <label>商品顏色</label>
            <div id="colors-container">
              ${product.colors.map((color, index) => {
                const prodId = product.id;
                const colorId = color.prodColorId || color.colorId || 0;
                const colorName = color.colorName || color.name || `顏色${colorId}`;
                const imgUrl = getColorImageUrl(prodId, colorId);
                return `
                  <div class="color-item" data-original-id="${color.prodColorId}">
                    <select class="color-select">
                      ${getColorOptionsHTML(color.prodColorId)}
                    </select>
                    <div class="color-preview">
                      ${prodColorOrNot === 0 ? '' : `
                        <img src="${imgUrl}" alt="${colorName}" class="color-thumbnail" onerror="this.src='images/default-color.png'">
                      `}
                      <span>更換圖片:</span>
                    </div>
                    <!-- ✅ 隱藏欄位記住原圖網址 -->
                    <input type="hidden" class="color-image-url" value="${imgUrl}">
                    <input type="file" class="color-image" accept="image/*">
                    <button type="button" class="btn-remove-color">-</button>
                  </div>
                `;
              }).join('')}
              <button type="button" class="btn-add-color" style="margin-top: 10px; width: 100%;">+ 新增顏色</button>
            </div>
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
  document.body.appendChild(modal);

  // 綁定事件
  document.querySelectorAll('input[name="has-color"]').forEach(radio => {
    radio.addEventListener('change', function () {
      const colorsSection = document.getElementById('colors-section');
      if (this.value === 'yes') {
        colorsSection.style.display = 'block';
      } else {
        colorsSection.style.display = 'none';
      }
    });
  });

  // 初始化顏色容器顯示狀態
  const colorsSection = document.getElementById('colors-section');
  if (prodColorOrNot === 0) {
    colorsSection.style.display = 'none';
  } else {
    colorsSection.style.display = 'block';
  }

  document.getElementById("edit-product-form").addEventListener("submit", function(e) {
    e.preventDefault();
    saveProductChanges();
  });

  document.getElementById("product-main-image").addEventListener("change", function() {
    const previewDiv = document.getElementById("main-image-preview");
    previewImage(this, previewDiv);
  });

  // 綁定新增規格與顏色欄位
  const addSpecBtn = modal.querySelector(".btn-add-spec");
  if (addSpecBtn) addSpecBtn.addEventListener("click", addSpecField);

  const addColorBtn = modal.querySelector(".btn-add-color");
  if (addColorBtn) addColorBtn.addEventListener("click", addColorField);
  
  // 綁定移除規格與顏色按鈕
  modal.querySelectorAll(".btn-remove-spec").forEach(btn => {
    btn.addEventListener("click", function() {
      const specItem = this.closest(".specification-item");
      const container = specItem.parentNode;
      
      // 檢查是否至少有兩個規格項目，確保移除後至少還有一個
      const specItems = container.querySelectorAll(".specification-item");
      if (specItems.length <= 1) {
        alert("至少需要保留一個規格項目");
        return;
      }
      
      // 記錄被刪除的規格 ID
      const originalId = parseInt(specItem.dataset.originalId);
      if (!isNaN(originalId) && originalId > 0) {
        deletedSpecIds.push(originalId);
      }
      
      if (specItem && container) {
        container.removeChild(specItem);
        // 檢查移除後是否還有單一規格
        checkSingleSpecAfterRemoval();
      }
    });
  });
  
  modal.querySelectorAll(".btn-remove-color").forEach(btn => {
    btn.addEventListener("click", function() {
      const colorItem = this.closest(".color-item");
      const container = colorItem.parentNode;
      
      // 檢查是否至少有兩個顏色項目，確保移除後至少還有一個
      const colorItems = container.querySelectorAll(".color-item");
      if (colorItems.length <= 1) {
        alert("至少需要保留一個顏色項目");
        return;
      }
      
      // 記錄被刪除的顏色 ID
      const originalId = parseInt(colorItem.dataset.originalId);
      if (!isNaN(originalId) && originalId > 0) {
        deletedColorIds.push(originalId);
      }
      
      if (colorItem && container) {
        container.removeChild(colorItem);
      }
    });
  });
}

// 產生規格下拉選單選項 ✅
function getSpecOptionsHTML(selectedId = null) {
  return productSpecsData.map(spec => {
    const selected = selectedId == spec.id ? 'selected' : '';
    return `<option value="${spec.id}" ${selected}>${spec.name}</option>`;
  }).join('');
}

// 產生顏色下拉選單選項 ✅
function getColorOptionsHTML(selectedId = null) {
  return productColorsData
    .filter(color => color.id !== 1)
    .map(color => {
      const selected = parseInt(selectedId) == color.id ? 'selected' : '';
      return `<option value="${color.id}" ${selected}>${color.name}</option>`;
    }).join('');
}

// 生成規格HTML
function generateSpecificationsHTML(specs) {
  if (!specs || specs.length === 0) {
    return `
      <div class="specification-item">
        <div class="spec-selection-container">
          <select class="spec-select">
            <option value="" selected disabled>請選擇規格</option>
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

// 生成顏色圖片URL
function getColorImageUrl(prodId, colorId) {
  return `${window.api_prefix}/api/prod-colors/colorpic/${prodId}/${colorId}`;
}

// 生成顏色HTML
function generateColorsHTML(colors) {
  if (!colors || colors.length === 0) {
    return `
      <div class="color-item">
        <div class="color-selection-container">
          <select class="color-select">
            <option value="" selected disabled>請選擇顏色</option>
            ${colorOptions}
            <option value="new">+ 新增顏色</option>
          </select>
          <div class="new-color-input" style="display: none; margin-top: 10px;">
            <input type="text" class="new-color-name" placeholder="輸入新顏色名稱">
            <button type="button" class="btn-add add-new-color-btn">確認新增</button>
          </div>
        </div>
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
function addSpecField() {
  // 檢查是否已經選擇了單一規格
  const existingSelects = document.querySelectorAll(".spec-select");
  for (let i = 0; i < existingSelects.length; i++) {
    if (existingSelects[i].value === "1") { // 假設 ID 為 1 的規格是「單一規格」
      alert("選擇單一規格時，不能添加多個規格");
      return;
    }
  }
  
  const container = document.getElementById("specs-container");
  
  const newItem = document.createElement("div");
  newItem.className = "specification-item";
  newItem.innerHTML = `
    <div class="spec-selection-container">
      <select class="spec-select">
        <option value="" selected disabled>請選擇規格</option>
         ${getSpecOptionsHTML()}
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
  
  // 將新項目插入到添加按鈕之前
  const addButton = container.querySelector(".btn-add-spec");
  container.insertBefore(newItem, addButton);
  
  // 綁定移除按鈕事件
  newItem.querySelector(".btn-remove-spec").addEventListener("click", function() {
    // 檢查是否至少保留一個規格
    const specItems = container.querySelectorAll(".specification-item");
    if (specItems.length <= 1) {
      alert("至少需要保留一個規格");
      return;
    }
    
    // 記錄被刪除的規格 ID
    const originalId = parseInt(newItem.dataset.originalId);
    if (!isNaN(originalId) && originalId > 0) {
      deletedSpecIds.push(originalId);
    }
    
    container.removeChild(newItem);
    // 檢查移除後是否還有單一規格
    checkSingleSpecAfterRemoval();
  });
  
  // 綁定規格選擇事件
  newItem.querySelector(".spec-select").addEventListener("change", function() {
    const newSpecInput = this.closest(".spec-selection-container").querySelector(".new-spec-input");
    if (this.value === "new") {
      newSpecInput.style.display = "block";
    } else {
      newSpecInput.style.display = "none";
    }
    
    // 檢查是否選擇了單一規格
    const isSingleSpec = this.value === "1";
    const addSpecButton = document.querySelector(".btn-add-spec");
    
    if (isSingleSpec) {
      // 如果選擇了單一規格，隱藏添加規格按鈕
      if (addSpecButton) {
        addSpecButton.style.display = "none";
      }
    } else {
      // 如果選擇了其他規格，顯示添加規格按鈕
      if (addSpecButton) {
        addSpecButton.style.display = "inline-block";
      }
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
  
  const newItem = document.createElement("div");
  newItem.className = "color-item";
  newItem.innerHTML = `
    <div class="color-selection-container">
      <select class="color-select">
        <option value="" selected disabled>請選擇顏色</option>
        ${getColorOptionsHTML()}
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
  
  // 將新項目插入到添加按鈕之前
  const addButton = container.querySelector(".btn-add-color");
  container.insertBefore(newItem, addButton);
  
  // 綁定移除按鈕事件
  newItem.querySelector(".btn-remove-color").addEventListener("click", function() {
    // 檢查是否至少保留一個顏色
    const colorItems = container.querySelectorAll(".color-item");
    if (colorItems.length <= 1) {
      alert("至少需要保留一個顏色");
      return;
    }
    
    // 記錄被刪除的顏色 ID
    const originalId = parseInt(newItem.dataset.originalId);
    if (!isNaN(originalId) && originalId > 0) {
      deletedColorIds.push(originalId);
    }
    
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

// 更新商品資料
async function saveProductChanges() {
  const productId = parseInt(document.getElementById("product-id").value);
  const productName = document.getElementById("product-name").value;
  const productType = parseInt(document.getElementById("product-type").value);
  const productDescription = document.getElementById("product-description").value;
  const productDiscount = parseFloat(document.getElementById("product-discount").value) || 1;
  const productMainImage = document.getElementById("product-main-image").files[0];

  // 取得商品規格資料
  const specs = [];
  document.querySelectorAll(".specification-item").forEach(item => {
    const specPrice = parseInt(item.querySelector(".spec-price").value);
    const specSelect = item.querySelector(".spec-select");
    if (specSelect && !isNaN(specPrice)) {
      const specId = parseInt(specSelect.value);
      const specName = productSpecsData.find(s => s.id === specId)?.name || "未知規格";
      const originalSpecId = parseInt(item.dataset.originalId); //  傳原始 ID
      specs.push({
        prodSpecId: specId,
        prodSpecName: specName,
        prodSpecPrice: specPrice,
        originalSpecId: originalSpecId //  傳原始 ID
      });
    }
  });

  // 顏色處理
  const hasColor = document.querySelector('input[name="has-color"]:checked')?.value === 'yes';
  const colors = [];

  const colorItems = document.querySelectorAll(".color-item");
  for (let i = 0; i < colorItems.length; i++) {
    const item = colorItems[i];
    const colorSelect = item.querySelector(".color-select");
    const colorId = parseInt(colorSelect?.value);
    const colorName = productColorsData.find(c => c.id === colorId)?.name || "未知顏色";
    const originalColorId = parseInt(item.dataset.originalId);

    // 建構 color DTO，圖片不在這裡處理
    colors.push({
      prodColorId: colorId,
      colorName: colorName,
      originalColorId: originalColorId
    });
  }

  if (!hasColor) {
    // 無顏色處理（預設單一顏色）
    colors.push({
      prodColorId: 1,
      colorName: productColorsData.find(c => c.id === 1)?.name || "單一顏色"
    });
  }

  const originalProduct = productsData.find(p => p.id === productId);
  const productStatus = originalProduct ? (originalProduct.status === "上架中" ? 1 : 0) : 1;
  // === 傳送主資料 ===
  const productData = {
    prodId: productId,
    prodName: productName,
    prodTypeId: productType,
    prodIntro: productDescription,
    prodDiscount: productDiscount,
    prodSpecList: specs,
    prodColorList: colors,
    prodColorOrNot: hasColor ? 1 : 0,
    prodStatus: productStatus,
    deletedSpecIds: deletedSpecIds,  // 添加已刪除的規格 ID
    deletedColorIds: deletedColorIds  // 添加已刪除的顏色 ID
  };

  try {
    const response = await fetch(`${window.api_prefix}/api/updateprod`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    if (!response.ok) throw new Error(`主資料更新失敗: ${response.status}`);
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);

    // === 上傳主圖片 ===
    if (productMainImage) {
      await imageUpload(productMainImage, productId); // /api/prodpics/upload/{prodId}
    }

    // === 上傳每一個顏色圖片 ===
    if (hasColor) {
      for (let i = 0; i < colorItems.length; i++) {
        const file = colorItems[i].querySelector(".color-image").files[0];
        const colorSelect = colorItems[i].querySelector(".color-select");
        const colorId = parseInt(colorSelect?.value);
        const originUrl = colorItems[i].querySelector(".color-image-url")?.value;
      
        if (!isNaN(colorId)) {
          if (file) {
            await uploadColorImage(file, productId, colorId);
          } else if (originUrl) {
            // 保留原圖，什麼都不做
            continue;
          } else {
            // 沒有新圖也沒舊圖，視為錯誤
            console.warn(`顏色 ID=${colorId} 無圖片，請檢查`);
          }
        }
      }
      
    }

    // 在成功保存後清空已刪除項目的列表
    deletedSpecIds = [];
    deletedColorIds = [];
    
    // 在成功保存後更新本地數據
    const productIndex = productsData.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      productsData[productIndex].prodColorOrNot = hasColor ? 1 : 0;
      // 更新其他屬性...
    }

    // 更新前端資料與畫面
    showNotification("商品更新成功");
    closeModal();
    loadProductsData(); // 重新載入商品

  } catch (err) {
    console.error("更新商品失敗:", err);
    showNotification("更新商品失敗：" + err.message, "error");
  }
}


// 顯示新增商品視窗 ✅
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
    // 排除 ID 為 1 的單一顏色選項
    if (color.id !== 1) {
      colorOptions += `<option value="${color.id}">${color.name}</option>`;
    }
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
                <option value="" selected disabled>請選擇商品類型</option>
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
                    <option value="" selected disabled>請選擇規格</option>
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
              </div>
              <button type="button" class="btn-add-spec" style="margin-top: 10px; width: 100%;">+ 新增規格</button>
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
                    <option value="" selected disabled>請選擇顏色</option>
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
              </div>
              <button type="button" class="btn-add-color" style="margin-top: 10px; width: 100%;">+ 新增顏色</button>
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
  document.querySelector(".btn-add-spec").addEventListener("click", addSpecField);
  
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
      
      // 檢查是否選擇了單一規格（假設 ID 為 1 的規格是「單一規格」）
      const isSingleSpec = this.value === "1";
      const addSpecButton = document.querySelector(".btn-add-spec");
      
      if (isSingleSpec) {
        // 如果選擇了單一規格，隱藏添加規格按鈕
        if (addSpecButton) {
          addSpecButton.style.display = "none";
        }
      } else {
        // 如果選擇了其他規格，顯示添加規格按鈕
        if (addSpecButton) {
          addSpecButton.style.display = "inline-block";
        }
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

// 添加新商品 ✅
// async function addNewProduct() {
//   const productName = document.getElementById("product-name").value.trim();
//   // 驗證商品名稱
//   if (!productName) {
//     showNotification("請輸入商品名稱", "error");
//     return;
//   }

//   // 驗證商品類型
//   const productTypeRaw = document.getElementById("product-type").value;
//   const productType = parseInt(productTypeRaw);

//   if (isNaN(productType)) {
//     showNotification("請選擇有效的商品類型", "error");
//     return;
//   }

  
//   const productMainImage = document.getElementById("product-main-image").files[0];
//   const productDescription = document.getElementById("product-description").value;
//   const productDiscount = parseFloat(document.getElementById("product-discount").value) || 1;
//   const productStatus = document.getElementById("product-status").value;
//   const hasColor = document.querySelector('input[name="has-color"]:checked').value === 'yes';

  
//   // 驗證商品名稱
//   if (productName.length < 1 || productName.length > 50) {
//     showNotification("商品名稱長度必須介於 1 到 50 字之間", "error");
//     return;
//   }

  
//   // =====規格資料=====
//   const specs = [];
//   document.querySelectorAll(".specification-item").forEach(item => {
//     const specSelect = item.querySelector(".spec-select");
//     const specPrice = parseInt(item.querySelector(".spec-price").value);
    
//     if (specSelect && specSelect.value !== "new" && !isNaN(specPrice)) {
//       const specId = parseInt(specSelect.value);
//       const specName = productSpecsData.find(s => s.id === specId)?.name || "未知規格";
      
//       specs.push({
//         prodSpecId: specId,
//         prodSpecPrice: specPrice,
//         prodSpecName: specName  // ← 可選，後端有欄位才傳
//       });
//     }
//   });

//   if (specs.length === 0) {
//     showNotification("請至少新增一個商品規格", "error");
//     return;
//   }
  
//   // =====顏色資料=====
//   const colors = [];
//   if (hasColor) {
//     const colorItems = document.querySelectorAll(".color-item");
//     // 檢查是否有任何顏色欄位
//     if (colorItems.length === 0) {
//       alert("請至少添加一個商品顏色");
//       return;
//     }
  
//     for (let i = 0; i < colorItems.length; i++) {
//       const item = colorItems[i];
//       // 跳過整個 block 若沒有有效選擇
//       const colorSelect = item.querySelector(".color-select");
//       if (!colorSelect || colorSelect.value === "new" || !colorSelect.value) {
//         alert(`第 ${i + 1} 筆顏色：請選擇有效的顏色`);
//         return;
//       }
  
//       const colorImageFile = item.querySelector(".color-image").files[0];
//       // 如果顏色為 "1"（單一顏色）就不用上傳圖片，其它顏色才需要圖片
//       if (!colorSelect || colorSelect.value === "new" || !colorImageFile) {
//         showNotification(`第 ${i + 1} 筆顏色：選擇錯誤或未上傳圖片`, "error");
//         return;
//       }

//       const colorId = parseInt(colorSelect.value);
//       const colorName = productColorsData.find(c => c.id === colorId)?.name || "未知顏色";
//       const imageUrl = await imageUpload(colorImageFile);
      
      
//       colors.push({ 
//         prodColorId: colorId,
//         colorName: colorName, 
//         prodColorPic : imageUrl
//       });

//     }
//   } else {
//     // 如果沒有顏色，傳送單一顏色至後端
//     // 假設 ID 為 1 的顏色是「單一顏色」
//     const singleColorId = 1;
//     const singleColorName = productColorsData.find(c => c.id === singleColorId)?.name || "單一顏色";
    
//     colors.push({
//       prodColorId: singleColorId,
//       colorName: singleColorName,
//       imageUrl: "" // 單一顏色不需要圖片
//     });
//   }
  
//   // 表單驗證
//   if (!productName || isNaN(productType) || !productMainImage || specs.length === 0) {
//     alert("請填寫所有必填欄位，並至少添加一個商品規格");
//     return;
//   }
  

//   try {
    
//     // === 步驟 1：送出商品主資料，取得新商品 ID ===
//     const productData = {
//       prodName: productName,
//       prodTypeId: productType,
//       // prodImageUrl: mainImageUrl,
//       prodIntro: productDescription,
//       prodDiscount: productDiscount,
//       prodStatus: productStatus === "上架中" ? 1 : 0,
//       prodColorOrNot: hasColor ? 1 : 0,
//       prodSpecList: specs,       
//       prodColorList: colors
//     };

//     // 發送 POST 請求到 API
//     const response = await fetch(`${window.api_prefix}/api/addprod`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(productData)
//     });
    
//     if (!response.ok) {
//       throw new Error(`添加商品失敗: ${response.status}`);
//     }

//     const result = await response.json();
//     if (result.status === 'success') {
//       // 獲取新商品ID
//       const newId = result.data.prodId;

//       // === 步驟 2：主圖上傳（用 newId）===
//       if (productMainImage && productMainImage.size > 0) {
//         await imageUpload(productMainImage, newId);
//       }
      
//       // === 步驟 3：顏色圖片上傳（每個顏色）===
//       if (hasColor) {
//         const colorItems = document.querySelectorAll(".color-item");
//         for (let i = 0; i < colors.length; i++) {
//           const file = colorItems[i].querySelector(".color-image").files[0];
//           const colorId = colors[i].prodColorId;
//           if (file && colorId) {
//             await uploadColorImage(file, newId, colorId); 
//           }
//         }
//       }

//       // 創建新商品對象
//       const newProduct = {
//         id: newId,
//         name: productName,
//         typeId: productType,
//         // imageUrl: mainImageUrl,
//         description: productDescription,
//         discount: productDiscount,
//         status: productStatus,
//         specs: specs,
//         colors: colors,
//         createdAt: new Date()
//       };
      
//       // 添加到本地數據
//       productsData.push(newProduct);
      
//       // 更新篩選後的商品
//       if (shouldIncludeInFiltered(newProduct)) {
//         filteredProducts.push(newProduct);
//       }
      
//       // 顯示成功消息
//       showNotification("商品添加成功", "success");
//       // 關閉模態框
//       closeModal();
//       // 重新加載商品數據
//       loadProductsData();
//       // 重新顯示商品
//       displayProducts();
      
//     } 
//   } catch (error) {
//     console.error("添加商品失敗:", error);
//     showNotification("添加商品失敗，請稍後再試", "error");
//   }
// }
async function addNewProduct() {
  const productName = document.getElementById("product-name").value.trim();
  const productTypeRaw = document.getElementById("product-type").value;
  const productType = parseInt(productTypeRaw);
  const productMainImage = document.getElementById("product-main-image").files[0];
  const productDescription = document.getElementById("product-description").value;
  const productDiscount = parseFloat(document.getElementById("product-discount").value) || 1;
  const productStatus = document.getElementById("product-status").value;
  const hasColor = document.querySelector('input[name="has-color"]:checked').value === 'yes';
  const nameExists = productsData.some(p => p.name === productName);
  
  // ==== 驗證基本欄位 ====
  if (!productName || isNaN(productType) || !productMainImage) {
    showNotification("請填寫商品名稱、類型與主圖", "error");
    return;
  }
  if (productName.length < 1 || productName.length > 50) {
    showNotification("商品名稱長度必須在 1~50 字元之間", "error");
    return;
  }
  if (nameExists) {
    showNotification("已有相同商品名稱，請修改商品名稱再試", "error");
    return;
  }
  
  // ==== 規格處理 ====
  const specs = [];
  document.querySelectorAll(".specification-item").forEach(item => {
    const specSelect = item.querySelector(".spec-select");
    const price = parseInt(item.querySelector(".spec-price").value);
    if (specSelect && specSelect.value && !isNaN(price)) {
      const specId = parseInt(specSelect.value);
      specs.push({
        prodSpecId: specId,
        prodSpecPrice: price
      });
    }
  });

  if (specs.length === 0) {
    showNotification("請至少填寫一個商品規格", "error");
    return;
  }

  // ==== 顏色處理 ====
  const colors = [];
  const colorItems = document.querySelectorAll(".color-item");
  if (hasColor) {
    for (let i = 0; i < colorItems.length; i++) {
      const select = colorItems[i].querySelector(".color-select");
      const file = colorItems[i].querySelector(".color-image").files[0];
      if (!select || !select.value || !file) {
        showNotification(`第 ${i + 1} 筆顏色缺少顏色或圖片`, "error");
        return;
      }
      const colorId = parseInt(select.value);
      colors.push({
        prodColorId: colorId
      });
    }
  } else {
    colors.push({ prodColorId: 1 }); // 預設單一顏色 ID
  }

  // ==== 建立主資料 ====
  const productDTO = {
    prodName: productName,
    prodTypeId: productType,
    prodIntro: productDescription,
    prodDiscount: productDiscount,
    prodStatus: productStatus === "上架中" ? 1 : 0,
    prodColorOrNot: hasColor ? 1 : 0,
    prodSpecList: specs,
    prodColorList: colors
  };

  try {
    const res = await fetch(`${window.api_prefix}/api/addprod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productDTO)
    });

    const result = await res.json();
    if (result.status !== "success") throw new Error(result.message || "主資料新增失敗");

    const newProdId = result.data.prodId;

    // === 主圖上傳 ===
    const uploadMainSuccess = await imageUpload(productMainImage, newProdId);
    if (!uploadMainSuccess) {
      showNotification("商品主圖上傳失敗", "error");
    }

    // === 顏色圖上傳 ===
    if (hasColor) {
      for (let i = 0; i < colors.length; i++) {
        const colorId = colors[i].prodColorId;
        const file = colorItems[i].querySelector(".color-image").files[0];
        if (file && colorId) {
          const uploadColorSuccess = await uploadColorImage(file, newProdId, colorId);
          if (!uploadColorSuccess) {
            showNotification(`第 ${i + 1} 筆顏色圖片上傳失敗`, "error");
          }
        }
      }
    }

    // === 成功後刷新畫面 ===
    showNotification("商品新增成功", "success");
    closeModal();
    loadProductsData();

  } catch (err) {
    console.error("新增商品錯誤：", err);
    showNotification("新增商品失敗：" + err.message, "error");
  }
}


// 切換商品狀態 ✅
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
    const newStatusValue = newStatus === "上架中" ? 1 : 0;

    // 發送 PATCH 請求到 API
    const response = await fetch(`${window.api_prefix}/api/products/${productId}/status?status=${newStatusValue}`, 
    {
      method: 'PATCH'
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

//商品圖片上傳功能 ✅
async function imageUpload(file, prodId) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${window.api_prefix}/api/prodpics/upload/${prodId}`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.status === "success") {
      return true;
    } else {
      showNotification("商品圖片上傳失敗，請重新嘗試", "error");
      return null;
    }
  } catch (error) {
    console.error("商品圖片上傳失敗", error);
    return null;
  }
}

// 上傳顏色圖片（指定 prodId + colorId） ✅
async function uploadColorImage(file, prodId, colorId) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${window.api_prefix}/api/prod-colors/colorpic/${prodId}/${colorId}`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.status === "success") {
      console.log("顏色圖片上傳成功");
      return true;
    } else {
      showNotification("顏色圖片上傳失敗，請重新嘗試", "error");
      return false;
    }
  } catch (error) {
    console.error("顏色圖片上傳錯誤:", error);
    return false;
  }
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

// 添加新商品類型（呼叫後端 API）✅
async function addNewProductType(typeName) {
  try {
    // 1. 驗證輸入
    if (!typeName || typeName.trim().length === 0) {
      showNotification("請輸入類型名稱", "error");
      return;
    }

    // 2. 防止重複名稱（前端暫時過濾）
    const exists = productTypesData.some(t => t.name === typeName);
    if (exists) {
      showNotification("此類型名稱已存在", "error");
      return;
    }

    // 3. 呼叫後端 API 寫入資料庫
    const response = await fetch(`${window.api_prefix}/api/product-types`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prodTypeName: typeName }) 
    });

    if (!response.ok) {
      throw new Error("新增類型失敗");
    }

    const result = await response.json();
    const newType = result.data; // 假設後端會回傳包含 prodTypeId 和 prodTypeName 的物件

    // 4. 加到前端陣列
    productTypesData.push({
      id: newType.prodTypeId,
      name: newType.prodTypeName
    });

    // 5. 插入選單中
    const typeSelect = document.getElementById("product-type");
    const newOption = document.createElement("option");
    newOption.value = newType.prodTypeId;
    newOption.textContent = newType.prodTypeName;

    // 插入到「+新增類型」前
    typeSelect.insertBefore(newOption, typeSelect.querySelector('option[value="new"]'));
    typeSelect.value = newType.prodTypeId;

    // 清空輸入框與隱藏輸入區
    document.getElementById("new-type-container").style.display = "none";
    document.getElementById("new-type-name").value = "";

    showNotification("新類型添加成功", "success");

  } catch (err) {
    console.error("新增類型失敗：", err);
    showNotification("新增類型失敗，請稍後再試", "error");
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



// 顯示通知消息 ;新增成功、更新失敗、操作提示等訊息 ✅
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

// 檢查移除規格後是否還有單一規格
function checkSingleSpecAfterRemoval() {
  const existingSelects = document.querySelectorAll(".spec-select");
  let hasSingleSpec = false;
  
  for (let i = 0; i < existingSelects.length; i++) {
    if (existingSelects[i].value === "1") {
      hasSingleSpec = true;
      break;
    }
  }
  
  const addSpecButton = document.querySelector(".btn-add-spec");
  if (addSpecButton) {
    addSpecButton.style.display = hasSingleSpec ? "none" : "inline-block";
  }
}

