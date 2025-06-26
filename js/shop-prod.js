document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector(".product-grid");
  const categorySelect = document.getElementById("category");
  const sortSelect = document.getElementById("sort");
  const form = document.querySelector(".filter-form");
  const loadingOverlay = document.querySelector(".loading-overlay");

  // 初始化松果載入動畫
  initLoadingAnimation();

  // 顯示載入畫面
  showLoadingOverlay();

  // 載入分類後，再載入商品（確保分類選單有渲染完）
  loadCategories().then(() => {
    fetchProducts();
  });

  // 表單送出時依條件重新查詢
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    showLoadingOverlay();
    fetchProducts();
  });

  // 顯示載入畫面
  function showLoadingOverlay() {
    if (loadingOverlay) {
      loadingOverlay.classList.add("active");
    }
  }

  // 隱藏載入畫面
  function hideLoadingOverlay() {
    if (loadingOverlay) {
      loadingOverlay.classList.remove("active");
    }
  }

  // 松果載入動畫
  function initLoadingAnimation() {
    const pineCone = document.querySelector(".pine-cone");
    if (!pineCone) return;

    // 動態生成松果鱗片
    const scales = 8; // 鱗片數量
    const radius = 25; // 松果半徑

    for (let i = 0; i < scales; i++) {
      const angle = (i / scales) * Math.PI * 2;
      const scale = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );

      // 計算鱗片位置
      const x1 = 30 + Math.cos(angle) * radius * 0.5;
      const y1 = 30 + Math.sin(angle) * radius * 0.5;
      const x2 = 30 + Math.cos(angle) * radius;
      const y2 = 30 + Math.sin(angle) * radius;

      scale.setAttribute("d", `M30,30 L${x1},${y1} L${x2},${y2} Z`);
      scale.setAttribute("fill", "#A68A64");
      scale.setAttribute("class", "pine-cone-scale");
      scale.style.transformOrigin = "30px 30px";
      scale.style.animation = `pulse 1.5s infinite ease-in-out ${i * 0.2}s`;

      pineCone.appendChild(scale);
    }

    // 添加鱗片脈動動畫
    if (!document.querySelector('style[data-pine-cone-animation]')) {
      const style = document.createElement("style");
      style.setAttribute('data-pine-cone-animation', 'true');
      style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(0.8); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ✅ 動態載入商品分類選單
  function loadCategories() {
    return fetch("http://localhost:8081/CJA101G02/api/product-types")
      .then(res => res.json())
      .then(response => {
        // 檢查是否有嵌套結構，例如 { data: [...] } 或 { results: [...] }
        const data = response.data || response.results || response;
        console.log("處理後的商品類別數據：", data);
        
        categorySelect.innerHTML = `<option value="">全部分類</option>`;
        
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(type => {
            const option = document.createElement("option");
            option.value = type.prodTypeId || type.id || "";
            option.textContent = type.prodTypeName || type.name || "未知類別";
            categorySelect.appendChild(option);
          });
        } else {
          console.error("API 返回的數據結構不符合預期");
          throw new Error("無效的數據格式");
        }
      })
      .catch(err => {
        console.error("載入商品分類失敗：", err);
        categorySelect.innerHTML = `<option value="">無法載入分類</option>`;
      });
  }

  // ✅ 根據篩選條件載入商品
  function fetchProducts() {
    const category = categorySelect.value;
    const sort = sortSelect.value;

    let url = "http://localhost:8081/CJA101G02/api/products";

    if (category) {
      url = `http://localhost:8081/CJA101G02/api/products/type/${category}`;
    } else if (sort === "newest") {
      url = `http://localhost:8081/CJA101G02/api/products/latest`;
    } else if (sort === "popular") {
      url = `http://localhost:8081/CJA101G02/api/products`;
    } else if (sort === "price-asc" || sort === "price-desc") {
      console.warn("尚未支援價格排序");
    }

    console.log("API 請求網址：", url);

    fetch(url)
      .then((res) => res.json())
      .then((data) => {

        const products = data.data;
        container.innerHTML = "";

        products.forEach((prod) => {
          const hasDiscount = prod.prodDiscount !== null && prod.prodDiscount !== undefined;
          const prodDate = prod.prodDate ? formatDate(prod.prodDate) : formatDate(new Date());
          const featuresHtml = generateProductFeatures(prod);
          
          const colors = prod.prodColorList || [];
          let colorSelectHtml = '';
          // 生成顏色選擇按鈕
          if (colors.length > 0) {
            colorSelectHtml += `<div class="product-color-select"><span class="label"></span>`;
            colors.forEach((color, index) => {
              const colorId = color.prodColorId;
              const imgUrl = `http://localhost:8081/CJA101G02/api/prod-colors/colorpic/${prod.prodId}/${colorId}`;
              
              colorSelectHtml += `
                <button class="color-box${index === 0 ? ' active' : ''}" data-color-id="${colorId}">
                  <img src="${imgUrl}" alt="${color.colorName}" class="color-thumbnail" />
                  <span>${color.colorName || `顏色${colorId}`}</span>
                </button>`;
            });
            colorSelectHtml += `</div>`;
          }

          const specs = prod.prodSpecList || [];
          let specSelectHtml = '';
          let prodSpecPrice = null;
          // 生成規格選擇下拉式選單
          if (specs.length > 0) {
            // 獲取第一個規格的價格作為 prodSpecPrice
            prodSpecPrice = specs[0].prodSpecPrice;
            
            specSelectHtml += `<select class="prod-spec-select" data-prod-id="${prod.prodId}">`;
            specs.forEach(spec => {
              // 修改这里，只显示规格名称
              specSelectHtml += `<option value="${spec.prodSpecPrice}">${spec.prodSpecName || `規格 ${spec.prodSpecId}`}</option>`;
            });
            specSelectHtml += `</select>`;
          }
          
          // 使用 prodSpecPrice 或 prodPrice 作為原始價格
          const originalPrice = prodSpecPrice || prod.prodPrice;
          
          // 計算折扣率（如果有折扣）
          let discountRate = 1; // 默認無折扣
          if (hasDiscount && prod.prodDiscount > 0 && prod.prodPrice > 0) {
            // 確保不會除以零，並限制折扣率在合理範圍內
            discountRate = Math.min(Math.max(prod.prodDiscount / prod.prodPrice, 0.1), 1);
          }
          
          // 計算折扣後價格
          const discountedPrice = Math.round(originalPrice * discountRate);
          
          // 動態取得商品圖片（取第一張為主圖）
          // 動態取得商品圖片（取第一張為主圖）
          let productImageHtml = '';
          if (prod.prodPicList && prod.prodPicList.length > 0) {
            const firstPicId = prod.prodPicList[0].prodPicId;
            // 添加錯誤處理
            productImageHtml = `<img src="http://localhost:8081/CJA101G02/api/products/prodpic/${firstPicId}" alt="${prod.prodName}" onerror="this.onerror=null; this.src='images/default-product.jpg';" />`;
          } else {
            productImageHtml = `<img src="images/default-product.jpg" alt="無圖片" />`;
          }
          
          // 添加調試信息
          console.log("商品圖片信息:", {
            prodId: prod.prodId,
            prodName: prod.prodName,
            hasPicList: !!prod.prodPicList,
            picListLength: prod.prodPicList ? prod.prodPicList.length : 0,
            firstPicId: prod.prodPicList && prod.prodPicList.length > 0 ? prod.prodPicList[0].prodPicId : null
          });
          const html = `
            <div class="product-card">
              <div class="product-image">
                ${productImageHtml}
                <span class="product-tag">${prod.prodTag || '熱銷'}</span>
              </div>
              <div class="product-info">
                <h3><a href="product-detail.html?id=${prod.prodId}">${prod.prodName}</a></h3>
                <p class="product-category">
                  <i class="fas fa-tag"></i> ${prod.prodTypeName}
                </p>

                <div class="product-rating">
                  <div class="stars">${generateStarsHtml(prod.prodRating || 4.5)}</div>
                  <span>(${prod.prodRating ?? 0})</span>
                </div>
                <div class="product-features">${featuresHtml}</div>

                ${colorSelectHtml} <!-- 顏色區 -->
                ${specSelectHtml}  <!-- 規格區 -->
                <div class="product-price">
                  <span class="current-price" data-base-price="${discountedPrice}" data-discount-rate="${discountRate}">NT$ ${discountedPrice}</span>
                  <span class="original-price">NT$ ${originalPrice}</span>
                </div>             

                <div class="product-actions">
                  <button class="btn-favorite" data-id="${prod.prodId}"><i class="far fa-heart"></i> 加入收藏</button>
                  <button class="btn-add-cart" data-id="${prod.prodId}"><i class="fas fa-shopping-cart"></i> 加入購物車</button>
                </div>
              </div>
            </div>
          `;

          container.innerHTML += html;
        });
        

        bindButtons();
        hideLoadingOverlay(); // 隱藏載入畫面
      })
      .catch((err) => {
        console.error("商品載入失敗：", err);
        hideLoadingOverlay(); // 發生錯誤時也要隱藏載入畫面
      });
  }

  // 格式化日期函數
  function formatDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 生成星星評分HTML
  function generateStarsHtml(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let starsHtml = '';

    // 添加實心星星
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fas fa-star"></i>';
    }

    // 添加半星（如果有）
    if (halfStar) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }

    // 添加空心星星
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="far fa-star"></i>';
    }

    return starsHtml;
  }

  // 生成產品特色標籤
  function generateProductFeatures() {
    // 這裡可以根據產品類型或特性生成不同的標籤
    const features = [];

    // 添加一些預設標籤
    features.push('<span><i class="fas fa-shield-alt"></i> 品質保證</span>');

    if (features.length < 3) {
      features.push('<span><i class="fas fa-truck"></i> 快速配送</span>');
    }

    return features.join(' '); 
  }

  function bindButtons() {
    // 顏色按鈕點選事件
    document.querySelectorAll(".product-color-select").forEach((colorGroup) => {
      const buttons = colorGroup.querySelectorAll(".color-box");
      buttons.forEach((btn) => {
        btn.addEventListener("click", function () {
          // 取消所有 .active
          buttons.forEach((b) => b.classList.remove("active"));
          // 設定被點選的為 .active
          this.classList.add("active");
        });
      });
    });

    // 規格選擇下拉式選單變更事件
    document.querySelectorAll(".prod-spec-select").forEach((select) => {
      select.addEventListener("change", function () {
        const selectedPrice = parseFloat(this.value) || 0;
        const priceContainer = this.closest(".product-price");
        const priceSpan = priceContainer.querySelector(".current-price");
        const originalPriceSpan = priceContainer.querySelector(".original-price");
        
        // 獲取折扣率，確保是有效數字
        let discountRate = parseFloat(priceSpan.dataset.discountRate) || 1;
        // 限制折扣率在合理範圍內
        discountRate = Math.min(Math.max(discountRate, 0.1), 1);
        
        // 更新原始價格
        originalPriceSpan.textContent = `NT$ ${selectedPrice}`;
        
        // 計算並更新折扣後價格
        const discountedPrice = Math.round(selectedPrice * discountRate);
        priceSpan.textContent = `NT$ ${discountedPrice}`;
      });
    });

    // 加入收藏按鈕點選事件
    document.querySelectorAll(".btn-favorite").forEach((btn) => {
      btn.addEventListener("click", function () {
        const prodId = this.dataset.id;
        console.log("加入收藏:", prodId);
      });
    });

    // 加入購物車按鈕點選事件
    document.querySelectorAll(".btn-add-cart").forEach((btn) => {
      btn.addEventListener("click", function () {
        const prodId = this.dataset.id;
        console.log("加入購物車:", prodId);
        
        // 獲取商品資訊
        const productCard = this.closest('.product-card');
        const productName = productCard.querySelector('h3 a').textContent;
        const productPrice = productCard.querySelector('.current-price').textContent.replace('NT$ ', '');
        // 找出選中的顏色
        const selectedColorBtn = productCard.querySelector('.product-color-select .color-box.active');
        const selectedColor = selectedColorBtn ? selectedColorBtn.textContent.trim() : null;
        
        // 準備要發送的數據
        const cartData = {
          prodId: prodId,
          prodName: productName,
          prodPrice: parseFloat(productPrice),
          quantity: 1,  // 預設數量為1
          color: selectedColor,  // 傳入選中的顏色名稱
          purchaseType: 'buy',  // 預設為購買
          rentDays: null
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
        })
        .catch(error => {
          console.error('加入購物車失敗:', error);
          alert('加入購物車失敗，請稍後再試');
        });
      });
    });
    
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
  }
});
