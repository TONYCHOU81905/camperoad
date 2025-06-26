// 商品購物車頁面功能
document.addEventListener('DOMContentLoaded', function() {
  // 初始化購物車頁面
  initCartPage();

  // 綁定清空購物車按鈕事件
  const clearCartBtn = document.getElementById('clear-cart-btn');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
  }

  // 綁定結帳按鈕事件
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', proceedToCheckout);
  }
});

// 初始化購物車頁面
async function initCartPage() {
  showLoadingOverlay();
  try {
    // 從API獲取購物車數據
    const cartData = await fetchCartData();
    
    // 渲染購物車項目
    renderCartItems(cartData.items);
    
    // 更新購物車摘要
    updateCartSummary(cartData.summary);
    
    // 更新購物車計數
    updateCartCount(cartData.totalItems);
    
    // 檢查購物車是否為空
    checkEmptyCart(cartData.items.length);
    
    // 顯示初始運費信息
    updateShippingNote(cartData.summary.subtotal);
    
    hideLoadingOverlay();
  } catch (error) {
    console.error('初始化購物車頁面失敗:', error);
    showErrorMessage('載入購物車資料失敗，請稍後再試');
    hideLoadingOverlay();
  }
}

// 從API獲取購物車數據
async function fetchCartData() {
  try {
    const response = await fetch('http://localhost:8081/CJA101G02/api/getCart');
    if (!response.ok) {
      throw new Error('網路回應不正常');
    }
    const data = await response.json();
    
    // 確保返回數據包含所有必要字段，如果缺少則提供默認值
    return {
      items: data.items || [],
      totalItems: data.totalItems || 0,
      summary: {
        subtotal: data.summary?.subtotal || 0,
        shipping: data.summary?.shipping || 0, // 後端可能不提供運費，我們在前端計算
        discount: data.summary?.discount || 0,
        total: data.summary?.total || 0 // 總計也會在前端重新計算
      }
    };
  } catch (error) {
    console.error('獲取購物車數據失敗:', error);
    throw error;
  }
}

// 渲染購物車項目
function renderCartItems(items) {
  const cartItemsContainer = document.getElementById('cart-items-container');
  if (!cartItemsContainer) return;
  
  // 清空容器
  cartItemsContainer.innerHTML = '';
  
  // 如果沒有項目，直接返回
  if (!items || items.length === 0) return;
  
  // 渲染每個購物車項目
  items.forEach(item => {
    const itemElement = createCartItemElement(item);
    cartItemsContainer.appendChild(itemElement);
  });
  
  // 綁定事件
  bindCartItemEvents();
}

// 創建購物車項目元素
function createCartItemElement(item) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'cart-item';
  itemDiv.dataset.id = item.prodId;
  
  // 購買類型標籤
  let purchaseTypeTag = '';
  if (item.purchaseType === 'rent') {
    purchaseTypeTag = `<span class="product-tag product-tag-rent">租借 ${item.rentDays} 天</span>`;
  } else if (item.purchaseType === 'used') {
    purchaseTypeTag = '<span class="product-tag product-tag-used">二手</span>';
  }
  
  // 顏色選項
  let colorOption = '';
  if (item.color) {
    colorOption = `<div class="product-color">顏色: ${item.color}</div>`;
  }
  
  itemDiv.innerHTML = `
    <div class="product-image">
      <img src="${item.prodImage || 'images/product-placeholder.jpg'}" alt="${item.prodName}">
      ${purchaseTypeTag}
    </div>
    <div class="product-info">
      <h3>${item.prodName}</h3>
      ${colorOption}
      <div class="product-price">
        <span class="current-price">NT$ ${item.prodPrice.toLocaleString()}</span>
      </div>
    </div>
    <div class="quantity-selector">
      <button class="btn-decrease">-</button>
      <input type="number" value="${item.quantity}" min="1" max="10">
      <button class="btn-increase">+</button>
    </div>
    <div class="product-subtotal">
      <span>NT$ ${(item.prodPrice * item.quantity).toLocaleString()}</span>
    </div>
    <button class="btn-remove">
      <i class="fas fa-trash-alt"></i>
    </button>
  `;
  
  return itemDiv;
}

// 綁定購物車項目事件
function bindCartItemEvents() {
  // 綁定數量增加按鈕
  document.querySelectorAll('.btn-increase').forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      const currentValue = parseInt(input.value);
      if (currentValue < parseInt(input.max)) {
        input.value = currentValue + 1;
        updateItemQuantity(this.closest('.cart-item'));
      }
    });
  });
  
  // 綁定數量減少按鈕
  document.querySelectorAll('.btn-decrease').forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      const currentValue = parseInt(input.value);
      if (currentValue > parseInt(input.min)) {
        input.value = currentValue - 1;
        updateItemQuantity(this.closest('.cart-item'));
      }
    });
  });
  
  // 綁定數量輸入框變更事件
  document.querySelectorAll('.quantity-selector input').forEach(input => {
    input.addEventListener('change', function() {
      // 確保數量在有效範圍內
      let value = parseInt(this.value);
      if (isNaN(value) || value < parseInt(this.min)) {
        value = parseInt(this.min);
      } else if (value > parseInt(this.max)) {
        value = parseInt(this.max);
      }
      this.value = value;
      updateItemQuantity(this.closest('.cart-item'));
    });
  });
  
  // 綁定移除按鈕
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', function() {
      removeCartItem(this.closest('.cart-item'));
    });
  });
}

// 更新項目數量
async function updateItemQuantity(cartItem) {
  const prodId = cartItem.dataset.id;
  const quantity = parseInt(cartItem.querySelector('.quantity-selector input').value);
  
  try {
    // 發送更新請求到API
    const response = await fetch('http://localhost:8081/CJA101G02/api/updateCart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prodId: prodId,
        quantity: quantity
      })
    });
    
    if (!response.ok) {
      throw new Error('網路回應不正常');
    }
    
    const data = await response.json();
    
    // 更新小計
    updateItemSubtotal(cartItem);
    
    // 確保summary包含所有必要字段
    const summary = {
      subtotal: data.summary?.subtotal || 0,
      shipping: data.summary?.shipping || 0,
      discount: data.summary?.discount || 0,
      total: data.summary?.total || 0
    };
    
    // 更新購物車摘要
    updateCartSummary(summary);
    
    // 更新購物車計數
    updateCartCount(data.totalItems);
    
  } catch (error) {
    console.error('更新購物車項目數量失敗:', error);
    showErrorMessage('更新數量失敗，請稍後再試');
  }
}

// 更新項目小計
function updateItemSubtotal(cartItem) {
  const priceElement = cartItem.querySelector('.product-price .current-price');
  const quantityInput = cartItem.querySelector('.quantity-selector input');
  const subtotalElement = cartItem.querySelector('.product-subtotal span');
  
  if (priceElement && quantityInput && subtotalElement) {
    const price = parseInt(priceElement.textContent.replace(/[^0-9]/g, ''));
    const quantity = parseInt(quantityInput.value);
    const subtotal = price * quantity;
    
    subtotalElement.textContent = `NT$ ${subtotal.toLocaleString()}`;
  }
}

// 移除購物車項目
async function removeCartItem(cartItem) {
  const prodId = cartItem.dataset.id;
  
  try {
    // 發送移除請求到API
    const response = await fetch('http://localhost:8081/CJA101G02/api/removeCartItem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prodId: prodId
      })
    });
    
    if (!response.ok) {
      throw new Error('網路回應不正常');
    }
    
    const data = await response.json();
    
    // 從DOM中移除項目
    cartItem.remove();
    
    // 確保summary包含所有必要字段
    const summary = {
      subtotal: data.summary?.subtotal || 0,
      shipping: data.summary?.shipping || 0,
      discount: data.summary?.discount || 0,
      total: data.summary?.total || 0
    };
    
    // 更新購物車摘要
    updateCartSummary(summary);
    
    // 更新購物車計數
    updateCartCount(data.totalItems);
    
    // 檢查購物車是否為空
    checkEmptyCart(data.totalItems);
    
  } catch (error) {
    console.error('移除購物車項目失敗:', error);
    showErrorMessage('移除商品失敗，請稍後再試');
  }
}

// 清空購物車
async function clearCart() {
  if (!confirm('確定要清空購物車嗎？')) return;
  
  try {
    // 發送清空請求到API
    const response = await fetch('http://localhost:8081/CJA101G02/api/clearCart', {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('網路回應不正常');
    }
    
    // 清空購物車項目容器
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (cartItemsContainer) {
      cartItemsContainer.innerHTML = '';
    }
    
    // 創建空的購物車摘要
    const emptySummary = {
      subtotal: 0,
      shipping: 0,
      discount: 0,
      total: 0
    };
    
    // 更新購物車摘要（全部歸零）
    updateCartSummary(emptySummary);
    
    // 更新運費說明
    updateShippingNote(0);
    
    // 更新購物車計數
    updateCartCount(0);
    
    // 顯示空購物車訊息
    checkEmptyCart(0);
    
  } catch (error) {
    console.error('清空購物車失敗:', error);
    showErrorMessage('清空購物車失敗，請稍後再試');
  }
}

// 設定運費常數
const SHIPPING_FEE = 60;
const FREE_SHIPPING_THRESHOLD = 1500;

// 更新運費說明
function updateShippingNote(subtotal) {
  const shippingNote = document.querySelector('.shipping-note');
  if (!shippingNote) return;
  
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingNote.textContent = '（已達免運門檻）';
    shippingNote.style.color = '#3A5A40';
  } else {
    shippingNote.textContent = `（滿NT$ ${FREE_SHIPPING_THRESHOLD.toLocaleString()}免運費，還差NT$ ${(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()}）`;
    shippingNote.style.color = '';
  }
}

// 更新購物車摘要
function updateCartSummary(summary) {
  // 更新小計
  const subtotalElement = document.querySelector('.summary-row:nth-child(1) .summary-value');
  if (subtotalElement) {
    subtotalElement.textContent = `NT$ ${summary.subtotal.toLocaleString()}`;
  }
  
  // 更新運費 - 固定為60元，滿1500免運費
  const shippingElement = document.querySelector('.summary-row:nth-child(2) .summary-value');
  if (shippingElement) {
    // 如果小計滿1500，則免運費
    const finalShipping = summary.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    shippingElement.textContent = `NT$ ${finalShipping.toLocaleString()}`;
    
    // 更新運費說明
    updateShippingNote(summary.subtotal);
  }
  
  // 更新折扣
  const discountElement = document.querySelector('.summary-row:nth-child(3) .summary-value');
  if (discountElement) {
    discountElement.textContent = `-NT$ ${summary.discount.toLocaleString()}`;
  }
  
  // 計算總計（加上運費）
  const finalShipping = summary.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const finalTotal = summary.subtotal + finalShipping - summary.discount;
  
  // 更新總計
  const totalElement = document.querySelector('.summary-row.total .summary-value');
  if (totalElement) {
    totalElement.textContent = `NT$ ${finalTotal.toLocaleString()}`;
  }
  
  // 啟用/禁用結帳按鈕
  const checkoutButton = document.getElementById('checkout-btn');
  if (checkoutButton) {
    checkoutButton.disabled = finalTotal <= 0;
  }
}

// 更新購物車計數
function updateCartCount(count) {
  const cartCountElements = document.querySelectorAll('.cart-count');
  cartCountElements.forEach(element => {
    element.textContent = count;
    element.style.display = count > 0 ? 'inline' : 'none';
  });
}

// 檢查購物車是否為空
function checkEmptyCart(itemCount) {
  const emptyCart = document.getElementById('cart-empty');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const orderSummary = document.getElementById('order-summary');
  
  if (emptyCart && cartItemsContainer && orderSummary) {
    if (itemCount <= 0) {
      emptyCart.style.display = 'flex';
      cartItemsContainer.style.display = 'none';
      orderSummary.style.display = 'none';
    } else {
      emptyCart.style.display = 'none';
      cartItemsContainer.style.display = 'block';
      orderSummary.style.display = 'block';
    }
  }
}

// 前往結帳
function proceedToCheckout() {
  window.location.href = 'checkout.html';
}

// 顯示載入畫面
function showLoadingOverlay() {
  // 檢查是否已存在載入畫面
  if (document.querySelector('.loading-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-spinner"></div>
    <p>載入中...</p>
  `;
  
  // 添加樣式
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;
  
  // 添加旋轉動畫樣式
  if (!document.querySelector('style[data-loading-animation]')) {
    const style = document.createElement('style');
    style.setAttribute('data-loading-animation', 'true');
    style.textContent = `
      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3A5A40;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(overlay);
}

// 隱藏載入畫面
function hideLoadingOverlay() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// 顯示錯誤訊息
function showErrorMessage(message) {
  // 創建錯誤訊息元素
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <i class="fas fa-exclamation-circle"></i>
    <span>${message}</span>
  `;
  
  // 添加樣式
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #e74c3c;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Noto Sans TC', sans-serif;
    animation: slideInRight 0.3s ease;
  `;
  
  document.body.appendChild(errorDiv);
  
  // 3秒後移除
  setTimeout(() => {
    errorDiv.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 300);
  }, 3000);
}