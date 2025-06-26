document.addEventListener('DOMContentLoaded', function() {
  // 獲取加入購物車按鈕
  const addToCartBtn = document.querySelector('.btn-add-cart');
  const buyNowBtn = document.querySelector('.btn-buy-now');
  const addWishlistBtn = document.querySelector('.btn-add-wishlist');
  
  // 獲取商品ID (從URL參數中獲取)
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
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
  
  // 加入購物車函數
  function addToCart(buyNow = false) {
    // 獲取商品資訊
    const productName = document.querySelector('.product-title').textContent;
    const productPrice = document.querySelector('.current-price').textContent.replace('NT$ ', '');
    const quantity = document.getElementById('quantity').value;
    const color = document.querySelector('.color-option.active').getAttribute('data-color');
    const purchaseType = document.querySelector('.purchase-option.active').getAttribute('data-type');
    
    // 如果是租借，獲取租借天數
    let rentDays = null;
    if (purchaseType === 'rent') {
      rentDays = document.getElementById('rent-days').value;
    }
    
    // 準備要發送的數據
    const cartData = {
      prodId: productId,
      prodName: productName,
      prodPrice: parseFloat(productPrice),
      quantity: parseInt(quantity),
      color: color,
      purchaseType: purchaseType,
      rentDays: rentDays ? parseInt(rentDays) : null
    };
    
    console.log('加入購物車數據:', cartData);
    
    // 使用fetch API發送請求
    fetch('http://localhost:8081/CJA101G02/api/addCart', {
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
      updateCartCount(data.cartCount);
      
      // 顯示成功訊息
      showAddToCartMessage();
      
      // 如果是立即購買，跳轉到購物車頁面
      if (buyNow) {
        window.location.href = 'cart.html';
      }
    })
    .catch(error => {
      console.error('加入購物車失敗:', error);
      alert('加入購物車失敗，請稍後再試');
    });
  }
  
  // 更新購物車數量顯示
  function updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
      element.textContent = count;
      element.style.display = count > 0 ? 'inline' : 'none';
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