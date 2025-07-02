// 使用全域購物車管理器
// 移除重複的ShopCartManager類別定義

document.addEventListener('DOMContentLoaded', function() {
  // 獲取加入購物車按鈕
  const addToCartBtn = document.querySelector('.btn-add-cart');
  const buyNowBtn = document.querySelector('.btn-buy-now');
  const addWishlistBtn = document.querySelector('.btn-add-wishlist');
  
  // 獲取商品ID (從URL參數中獲取)
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  // 初始化商品詳情頁面
  initProductDetail();
  
  // 綁定加入購物車按鈕點擊事件
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
      addToCart();
    });
  }
  
  // 綁定立即購買按鈕點擊事件
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', function() {
      addToCart(true);
    });
  }
  
  // 綁定加入收藏按鈕點擊事件
  if (addWishlistBtn) {
    addWishlistBtn.addEventListener('click', function() {
      console.log('加入收藏:', productId);
      // 這裡可以實現加入收藏功能
    });
  }
  
  // 初始化商品詳情頁面
  function initProductDetail() {
    if (!productId) {
      console.error('未找到商品ID');
      return;
    }
    
    // 載入商品詳情
    loadProductDetail(productId);
    
    // 綁定顏色選擇事件
    bindColorOptions();
    
    // 綁定數量選擇事件
    bindQuantitySelectors();
  }
  
  // 載入商品詳情
  function loadProductDetail(prodId) {
    fetch(`${window.api_prefix}/api/products/${prodId}`)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          const product = data.data;
          updateProductInfo(product);
        }
      })
      .catch(error => {
        console.error('載入商品詳情失敗:', error);
      });
  }
  
  // 更新商品資訊
  function updateProductInfo(product) {
    // 更新商品標題
    const titleElement = document.querySelector('.product-title');
    if (titleElement) {
      titleElement.textContent = product.prodName;
    }
    
    // 更新商品價格
    const currentPriceElement = document.querySelector('.current-price');
    const originalPriceElement = document.querySelector('.original-price');
    if (currentPriceElement && originalPriceElement) {
      const hasDiscount = product.prodDiscount !== null && product.prodDiscount > 0;
      const originalPrice = product.prodPrice;
      const discountedPrice = hasDiscount ? product.prodDiscount : originalPrice;
      
      currentPriceElement.textContent = `NT$ ${discountedPrice.toLocaleString()}`;
      originalPriceElement.textContent = `NT$ ${originalPrice.toLocaleString()}`;
      originalPriceElement.style.display = hasDiscount ? 'inline' : 'none';
    }
    
    // 更新顏色選項
    updateColorOptions(product.prodColorList || []);
    
    // 更新規格選項
    updateSpecOptions(product.prodSpecList || []);
  }
  
  // 更新顏色選項
  function updateColorOptions(colors) {
    const colorOptionsContainer = document.querySelector('.color-options');
    if (!colorOptionsContainer || colors.length === 0) return;
    
    colorOptionsContainer.innerHTML = '';
    colors.forEach((color, index) => {
      const colorOption = document.createElement('div');
      colorOption.className = `color-option${index === 0 ? ' active' : ''}`;
      colorOption.dataset.colorId = color.prodColorId;
      colorOption.dataset.colorName = color.colorName;
      
      // 如果有顏色圖片，使用圖片；否則使用顏色名稱
      if (color.colorPic) {
        colorOption.innerHTML = `<img src="${color.colorPic}" alt="${color.colorName}" />`;
      } else {
        colorOption.innerHTML = `<span style="background-color: ${color.colorCode || '#ccc'}"></span>`;
      }
      
      colorOptionsContainer.appendChild(colorOption);
    });
  }
  
  // 更新規格選項
  function updateSpecOptions(specs) {
    // 在數量選擇之前插入規格選擇
    const quantityGroup = document.querySelector('.option-group:has(#quantity)');
    if (!quantityGroup || specs.length === 0) return;
    
    // 檢查是否已經有規格選擇
    if (document.querySelector('.spec-option-group')) return;
    
    const specGroup = document.createElement('div');
    specGroup.className = 'option-group spec-option-group';
    specGroup.innerHTML = `
      <label for="spec">規格</label>
      <select id="spec" class="prod-spec-select">
        ${specs.map(spec => 
          `<option value="${spec.prodSpecId}" data-price="${spec.prodSpecPrice}">${spec.prodSpecName || `規格 ${spec.prodSpecId}`}</option>`
        ).join('')}
      </select>
    `;
    
    quantityGroup.parentNode.insertBefore(specGroup, quantityGroup);
    
    // 綁定規格選擇事件
    bindSpecSelect();
  }
  
  // 綁定顏色選擇事件
  function bindColorOptions() {
    document.addEventListener('click', function(e) {
      if (e.target.closest('.color-option')) {
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => option.classList.remove('active'));
        e.target.closest('.color-option').classList.add('active');
      }
    });
  }
  
  // 綁定規格選擇事件
  function bindSpecSelect() {
    const specSelect = document.querySelector('.prod-spec-select');
    if (!specSelect) return;
    
    specSelect.addEventListener('change', function() {
      const selectedOption = this.options[this.selectedIndex];
      const selectedPrice = parseFloat(selectedOption.dataset.price) || 0;
      
      // 更新價格顯示
      const currentPriceElement = document.querySelector('.current-price');
      if (currentPriceElement && selectedPrice > 0) {
        currentPriceElement.textContent = `NT$ ${selectedPrice.toLocaleString()}`;
      }
    });
  }
  
  // 綁定數量選擇事件
  function bindQuantitySelectors() {
    // 數量選擇器
    const quantityInput = document.getElementById('quantity');
    const quantityMinusBtn = document.querySelector('#quantity').parentNode.querySelector('.minus');
    const quantityPlusBtn = document.querySelector('#quantity').parentNode.querySelector('.plus');
    
    if (quantityMinusBtn) {
      quantityMinusBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > parseInt(quantityInput.min)) {
          quantityInput.value = currentValue - 1;
        }
      });
    }
    
    if (quantityPlusBtn) {
      quantityPlusBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue < parseInt(quantityInput.max)) {
          quantityInput.value = currentValue + 1;
        }
      });
    }
  }
  
  // 加入購物車函數
  function addToCart(buyNow = false) {
    // 獲取商品資訊
    const quantity = document.getElementById('quantity').value;
    
    // 找出選中的顏色ID
    const selectedColorOption = document.querySelector('.color-option.active');
    const prodColorId = selectedColorOption ? parseInt(selectedColorOption.dataset.colorId) : 1; // 預設為1
    
    // 找出選中的規格ID
    const selectedSpecSelect = document.querySelector('.prod-spec-select');
    const prodSpecId = selectedSpecSelect ? parseInt(selectedSpecSelect.value) : 1; // 現在value是規格ID
    
    // 準備要發送的數據（符合後端 CartDTO_req 格式）
    const cartData = {
      memId: globalCartManager.getMemberId(),  // 使用全域購物車管理器取得會員ID
      prodId: parseInt(productId),
      prodColorId: prodColorId,
      prodSpecId: prodSpecId,
      cartProdQty: parseInt(quantity)
    };
    
    console.log('加入購物車數據:', cartData);
    
    // 使用fetch API發送請求
    fetch(`${window.api_prefix}/api/addCart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cartData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('網路回應不正常');
      }
      return response.json();
    })
    .then(data => {
      console.log('加入購物車成功:', data);
      
      // 更新購物車數量顯示
      if (data.status === 'success') {
        globalCartManager.updateCartCount(); // 重新取得購物車數量
      }
      
      // 顯示成功訊息
      showAddToCartMessage();
      
      // 如果是立即購買，跳轉到購物車頁面
      if (buyNow) {
        window.location.href = 'shop_cart.html';
      }
    })
    .catch(error => {
      console.error('加入購物車失敗:', error);
      alert('加入購物車失敗，請稍後再試');
    });
  }
  
  // 顯示加入購物車成功訊息
function showAddToCartMessage() {
  // 創建提示消息
  const message = document.createElement('div');
  message.className = 'cart-message';
  message.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>已添加到購物車</span>
    <a href="shop_cart.html" class="view-cart-btn">查看購物車</a>
  `;

  // 添加樣式
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #3A5A40;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: 'Noto Sans TC', sans-serif;
    animation: slideInRight 0.3s ease;
  `;
  
  // 添加查看購物車按鈕樣式
  const viewCartBtn = message.querySelector('.view-cart-btn');
  if (viewCartBtn) {
    viewCartBtn.style.cssText = `
      background-color: white;
      color: #3A5A40;
      padding: 4px 10px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    `;
    
    // 添加懸停效果
    viewCartBtn.addEventListener('mouseover', function() {
      this.style.backgroundColor = '#f0f0f0';
    });
    
    viewCartBtn.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'white';
    });
  }

  // 添加動畫樣式
  if (!document.querySelector('style[data-cart-animation]')) {
    const style = document.createElement('style');
    style.setAttribute('data-cart-animation', 'true');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // 添加到頁面
  document.body.appendChild(message);

  // 5秒後移除（增加時間讓用戶有更多時間點擊查看購物車）
  setTimeout(() => {
    message.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 300);
  }, 5000);
}
});