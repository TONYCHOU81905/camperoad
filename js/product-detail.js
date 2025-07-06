// 使用全域購物車管理器
// 移除重複的ShopCartManager類別定義

// Session Cart 管理工具（如果不存在則創建）
if (typeof sessionCartManager === 'undefined') {
  const sessionCartManager = {
    getCart: function() {
      const cart = sessionStorage.getItem('sessionCart');
      return cart ? JSON.parse(cart) : [];
    },
    saveCart: function(cart) {
      sessionStorage.setItem('sessionCart', JSON.stringify(cart));
    },
    addToCart: function(item) {
      const cart = this.getCart();
      const exist = cart.find(c =>
        c.prodId === item.prodId &&
        c.prodColorId === item.prodColorId &&
        c.prodSpecId === item.prodSpecId
      );
      if (exist) {
        exist.cartProdQty += item.cartProdQty;
      } else {
        cart.push(item);
      }
      this.saveCart(cart);
    },
    updateItem: function(prodId, prodColorId, prodSpecId, qty) {
      let cart = this.getCart();
      const existIndex = cart.findIndex(c => c.prodId === prodId);
      if (existIndex !== -1) {
        cart[existIndex].prodColorId = prodColorId;
        cart[existIndex].prodSpecId = prodSpecId;
        cart[existIndex].cartProdQty = qty;
        this.saveCart(cart);
      }
    },
    removeItem: function(prodId, prodColorId, prodSpecId) {
      let cart = this.getCart();
      cart = cart.filter(c =>
        !(c.prodId === prodId && c.prodColorId === prodColorId && c.prodSpecId === prodSpecId)
      );
      this.saveCart(cart);
    },
    clearCart: function() {
      sessionStorage.removeItem('sessionCart');
    }
  };
  
  // 將 sessionCartManager 設為全域變數
  window.sessionCartManager = sessionCartManager;
}

document.addEventListener('DOMContentLoaded', function() {
  // 獲取加入購物車按鈕
  const addToCartBtn = document.querySelector('.btn-add-cart');
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
  
  // 綁定加入收藏按鈕點擊事件
  if (addWishlistBtn) {
    addWishlistBtn.addEventListener('click', function() {
      toggleWishlist(productId);
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
  
  // 檢查收藏狀態
  checkFavoriteStatus(productId);
  
  // 綁定顏色選擇事件
  bindColorOptions();
  
  // 綁定數量選擇事件
  bindQuantitySelectors();
  
  // 綁定購買方式選擇事件
  bindPurchaseTypeOptions();
  
  // 綁定縮圖點擊事件
  bindThumbnailEvents();
  
  // 綁定標籤頁切換事件
  bindTabEvents();
  
  // 載入相關商品推薦
  loadRelatedProducts();
}
  
  // 載入商品詳情
  function loadProductDetail(prodId) {
    // 顯示載入中狀態
    showLoading();

    fetch(`${window.api_prefix}/api/products/${prodId}`)
      .then(response => response.json())
      .then(data => {
        
        if (data.status === 'success' && data.data) {
          const product = data.data;
          // 更新商品資訊
          updateProductInfo(product);
          // 更新商品圖片
          updateProductImages(product.prodPicList || []);
          // 更新商品描述和規格
          updateProductDescription(product);
          // 載入商品評論
          loadProductReviews(prodId);
          console.log('載入商品資料：', product);

        } else {
          console.error('載入商品詳情失敗:', data.message || '未知錯誤');
          showError('無法載入商品資訊');
        }
      })
      .catch(error => {
        console.error('載入商品詳情失敗:', error);
        showError('無法載入商品資訊');
      })
      .finally(() => {
        // 隱藏載入中狀態
        hideLoading();
      });
  }
  
  // 顯示載入中狀態
  function showLoading() {
    // 可以添加載入動畫或提示
    const productContainer = document.querySelector('.product-detail-container');
    if (productContainer) {
      productContainer.classList.add('loading');
    }
  }
  
  // 隱藏載入中狀態
  function hideLoading() {
    const productContainer = document.querySelector('.product-detail-container');
    if (productContainer) {
      productContainer.classList.remove('loading');
    }
  }
  
  // 顯示錯誤訊息
  function showError(message) {
    // 可以添加錯誤提示
    alert(message);
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
    const discountTagElement = document.querySelector('.discount-tag');
    
    if (currentPriceElement && originalPriceElement) {
      // 假設預設顯示第一個規格價格
      const firstSpec = product.prodSpecList && product.prodSpecList[0];
      const originalPrice = firstSpec ? firstSpec.prodSpecPrice : 0;
      const discountRate = product.prodDiscount ?? 1;
      const discountedPrice = Math.round(originalPrice * discountRate);
      const hasDiscount = discountRate > 0 && discountRate < 1;
    
      currentPriceElement.textContent = `NT$ ${discountedPrice.toLocaleString()}`;
      originalPriceElement.textContent = `NT$ ${originalPrice.toLocaleString()}`;
      originalPriceElement.style.display = hasDiscount ? 'inline' : 'none';
    
      if (discountTagElement) {
        discountTagElement.style.display = hasDiscount ? 'inline-block' : 'none';
      }
    
      // 為後續選擇規格動態計算折扣價做準備
      currentPriceElement.dataset.discountRate = discountRate;
    }
    
    // 更新評分
    updateRating(product.prodRating || 0, product.prodRatingCount || 0);
    
    // 更新顏色選項
    updateColorOptions(product.prodColorList || []);
    
    // 更新規格選項
    updateSpecOptions(product.prodSpecList || []);
    
    // 更新麵包屑導航
    updateBreadcrumb(product);
  }
  
  // 更新評分
  function updateRating(rating, count) {
    const ratingElement = document.querySelector('.product-rating');
    if (!ratingElement) return;
    
    // 生成星星HTML
    const starsHtml = generateStarsHtml(rating);
    ratingElement.innerHTML = `${starsHtml}<span>(${count} 則評價)</span>`;
  }
  
  // 生成星星HTML
  function generateStarsHtml(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // 添加實心星星
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // 添加半星（如果有）
    if (hasHalfStar) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // 添加空心星星
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
  }
  
  // 更新麵包屑導航
  function updateBreadcrumb(product) {
    if (!product || !product.prodName) return;
    
    const breadcrumbItems = document.querySelectorAll('.breadcrumb li');
    if (breadcrumbItems.length >= 3) {
      breadcrumbItems[2].textContent = product.prodName;
    }
  }
  
  // 更新商品圖片
  function updateProductImages(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailContainer = document.querySelector('.thumbnail-images');
    
    if (!mainImage || !thumbnailContainer || !images.length) return;
    
    // 清空縮圖容器
    thumbnailContainer.innerHTML = '';
    
    // 更新主圖
    mainImage.src = `${window.api_prefix}/api/prodpics/${images[0].prodPicId}`;
    mainImage.alt = images[0].prodPicName || '商品圖片';
    
    // 添加所有縮圖
    images.forEach((image, index) => {
      const thumbnailDiv = document.createElement('div');
      thumbnailDiv.className = `thumbnail${index === 0 ? ' active' : ''}`;
      thumbnailDiv.dataset.image = `${window.api_prefix}/api/prodpics/${image.prodPicId}`;
      
      const thumbnailImg = document.createElement('img');
      thumbnailImg.src = `${window.api_prefix}/api/prodpics/${image.prodPicId}`;
      thumbnailImg.alt = image.prodPicName || `商品圖片 ${index + 1}`;
      
      thumbnailDiv.appendChild(thumbnailImg);
      thumbnailContainer.appendChild(thumbnailDiv);
    });
  }
  
  // 更新商品描述
  function updateProductDescription(product) {
    // 更新商品描述
    const descriptionPanel = document.getElementById('description');
    if (descriptionPanel && product.prodIntro) {
      // 可以根據API返回的格式調整這裡的處理邏輯
      const descriptionContent = descriptionPanel.querySelector('.product-description');
      if (descriptionContent) {
        // 假設API返回的是HTML格式的描述
        descriptionContent.innerHTML = product.prodIntro;
      }
    }
    
    // 更新商品規格
    const specsPanel = document.getElementById('specs');
    if (specsPanel && product.prodSpec) {
      const specsTable = specsPanel.querySelector('.specs-table');
      if (specsTable) {
        // 假設API返回的是規格對象
        let specsHtml = '';
        for (const [key, value] of Object.entries(product.prodSpec)) {
          specsHtml += `
            <tr>
              <th>${key}</th>
              <td>${value}</td>
            </tr>
          `;
        }
        specsTable.innerHTML = specsHtml;
      }
    }
  }
  
  
  // 更新顏色選項
  function updateColorOptions(colors) {
    const colorOptionsContainer = document.querySelector('.color-options');
    if (!colorOptionsContainer || !colors || colors.length === 0) return;
    
    colorOptionsContainer.innerHTML = '';
    
    // 添加顏色選項標籤
    const colorLabel = document.createElement('div');
    colorLabel.className = 'color-label';
    colorLabel.textContent = '顏色';
    colorOptionsContainer.parentNode.insertBefore(colorLabel, colorOptionsContainer);
    
    colors.forEach((color, index) => {
      const colorOption = document.createElement('div');
      colorOption.className = `color-option${index === 0 ? ' active' : ''}`;
      colorOption.dataset.colorId = color.prodColorId;
      colorOption.dataset.colorName = color.colorName || `顏色 ${color.prodColorId}`;
      
      // 如果有顏色圖片，使用圖片；否則使用顏色代碼
      if (color.colorPic) {
        colorOption.innerHTML = `<img src="${color.colorPic}" alt="${color.colorName || `顏色 ${color.prodColorId}`}" />`;
      } else if (color.colorCode) {
        colorOption.innerHTML = `<span style="background-color: ${color.colorCode}"></span>`;
      } else {
        // 如果沒有顏色圖片和顏色代碼，嘗試從API獲取
        const imgUrl = `${window.api_prefix}/api/prod-colors/colorpic/${productId}/${color.prodColorId}`;
        colorOption.innerHTML = `<img src="${imgUrl}" alt="${color.colorName || `顏色 ${color.prodColorId}`}" onerror="this.onerror=null; this.src='images/default-color.png';" />`;
      }
      
      // 添加顏色名稱
      const colorName = document.createElement('span');
      colorName.className = 'color-name';
      colorName.textContent = color.colorName || `顏色 ${color.prodColorId}`;
      colorOption.appendChild(colorName);
      
      colorOptionsContainer.appendChild(colorOption);
    });
  
  }
  
  // 更新規格選項
  function updateSpecOptions(specs) {
  // 如果沒有規格或規格為空，則返回
  if (!specs || specs.length === 0) return;
  
  // 使用更兼容的方式找到數量選擇器的父元素
  const quantityInput = document.getElementById('quantity');
  if (!quantityInput) return;
  
  const quantityGroup = quantityInput.closest('.option-group');
  if (!quantityGroup) return;
  
  // 檢查是否已經有規格選擇
  let specGroup = document.querySelector('.spec-option-group');
  
  if (!specGroup) {
  // 創建新的規格選擇組
  specGroup = document.createElement('div');
  specGroup.className = 'option-group spec-option-group';
  quantityGroup.parentNode.insertBefore(specGroup, quantityGroup);
  }
  
  specGroup.innerHTML = `
  <label for="spec">規格</label>
  <select id="spec" class="prod-spec-select">
  ${specs.map(spec => 
  `<option value="${spec.prodSpecId}" data-price="${spec.prodSpecPrice}">${spec.prodSpecName || spec.specName || `規格 ${spec.prodSpecId}`}</option>`
  ).join('')}
  </select>
  `;
  
  // 綁定規格選擇事件
  bindSpecSelect();
  }
  
  // 載入商品評論
  function loadProductReviews(prodId) {
    // 這裡應該調用獲取商品評論的API
    
    // 模擬API調用
    setTimeout(() => {
      // 模擬評論數據
      const reviews = [
        {
          reviewerId: 1,
          reviewerName: '陳先生',
          reviewDate: '2023/05/15',
          rating: 5,
          content: '非常滿意這個帳篷！搭建簡單，大約15分鐘就能完成。頂部的透明設計真的很棒，晚上躺在帳篷裡看星星是一種奇妙的體驗。前庭空間也很實用，可以放置鞋子和一些裝備。整體防水性能良好，上週末遇到小雨測試了一下，完全沒有漏水問題。',
          images: ['images/product-1.jpg']
        },
        {
          reviewerId: 2,
          reviewerName: '林小姐',
          reviewDate: '2023/04/28',
          rating: 4,
          content: '帳篷品質不錯，材質感覺很耐用。四個人住有點擠，但三個人剛好。透明天窗設計很特別，是我選擇這款主要原因。唯一的小缺點是收納後體積還是有點大，放在車後車廂佔了不少空間。總體來說還是很推薦的一款帳篷。',
          images: []
        },
        {
          reviewerId: 3,
          reviewerName: '王先生',
          reviewDate: '2023/03/10',
          rating: 3,
          content: '帳篷整體設計不錯，但支架感覺不是很結實，擔心使用壽命問題。搭建說明不夠清晰，第一次搭建花了不少時間。防水性能還可以，但通風不是很理想，夏天可能會比較悶熱。',
          images: []
        }
      ];
      
      // 更新評論區
      updateReviewsSection(reviews);
    }, 500);
    
    // 實際API調用應該類似於：
    /*
    fetch(`${window.api_prefix}/api/products/${prodId}/reviews`)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          updateReviewsSection(data.data);
        }
      })
      .catch(error => {
        console.error('載入商品評論失敗:', error);
      });
    */
  }
  
  // 更新評論區
  function updateReviewsSection(reviews) {
    const reviewsPanel = document.getElementById('reviews');
    if (!reviewsPanel) return;
    
    // 更新評論總結
    updateReviewsSummary(reviews);
    
    // 更新評論列表
    updateReviewsList(reviews);
  }
  
  // 更新評論總結
  function updateReviewsSummary(reviews) {
    if (!reviews || reviews.length === 0) return;
    
    // 計算平均評分
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    // 計算各星級分佈
    const ratingDistribution = [0, 0, 0, 0, 0]; // 1-5星的數量
    reviews.forEach(review => {
      const ratingIndex = Math.min(Math.max(Math.floor(review.rating), 1), 5) - 1;
      ratingDistribution[ratingIndex]++;
    });
    
    // 更新平均評分
    const ratingNumberElement = document.querySelector('.rating-number');
    if (ratingNumberElement) {
      ratingNumberElement.textContent = averageRating.toFixed(1);
    }
    
    // 更新星星
    const ratingStarsElement = document.querySelector('.reviews-summary .rating-stars');
    if (ratingStarsElement) {
      ratingStarsElement.innerHTML = generateStarsHtml(averageRating);
    }
    
    // 更新評論數量
    const ratingCountElement = document.querySelector('.rating-count');
    if (ratingCountElement) {
      ratingCountElement.textContent = `${reviews.length} 則評價`;
    }
    
    // 更新評分分佈條
    const ratingBarItems = document.querySelectorAll('.rating-bar-item');
    if (ratingBarItems.length === 5) {
      ratingBarItems.forEach((item, index) => {
        const starCount = 5 - index; // 5, 4, 3, 2, 1
        const count = ratingDistribution[starCount - 1];
        const percent = reviews.length > 0 ? (count / reviews.length * 100) : 0;
        
        const fillElement = item.querySelector('.rating-fill');
        const percentElement = item.querySelector('.rating-percent');
        
        if (fillElement) {
          fillElement.style.width = `${percent}%`;
        }
        
        if (percentElement) {
          percentElement.textContent = `${Math.round(percent)}%`;
        }
      });
    }
  }
  
  // 更新評論列表
  function updateReviewsList(reviews) {
    const reviewListElement = document.querySelector('.review-list');
    if (!reviewListElement) return;
    
    // 清空評論列表
    reviewListElement.innerHTML = '';
    
    // 添加評論
    reviews.forEach(review => {
      const reviewItem = document.createElement('div');
      reviewItem.className = 'review-item';
      
      // 生成評論星星HTML
      const starsHtml = generateStarsHtml(review.rating);
      
      // 生成評論圖片HTML
      let imagesHtml = '';
      if (review.images && review.images.length > 0) {
        imagesHtml = `
          <div class="review-images">
            ${review.images.map(image => `<img src="${image}" alt="使用者評價照片" />`).join('')}
          </div>
        `;
      }
      
      // 設置評論HTML
      reviewItem.innerHTML = `
        <div class="reviewer-info">
          <img src="images/user-${review.reviewerId}.jpg" alt="使用者頭像" class="reviewer-avatar" onerror="this.onerror=null; this.src='images/default-avatar.jpg';" />
          <div class="reviewer-details">
            <div class="reviewer-name">${review.reviewerName}</div>
            <div class="review-date">${review.reviewDate}</div>
          </div>
        </div>
        <div class="review-rating">
          ${starsHtml}
        </div>
        <div class="review-content">
          <p>${review.content}</p>
          ${imagesHtml}
        </div>
      `;
      
      reviewListElement.appendChild(reviewItem);
    });
    
    // 更新分頁（如果需要）
    // updateReviewPagination(totalPages, currentPage);
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
    const originalPriceElement = document.querySelector('.original-price');
    const discountRate = parseFloat(currentPriceElement.dataset.discountRate || 1);
    const discountedPrice = Math.round(selectedPrice * discountRate);
    currentPriceElement.textContent = `NT$ ${discountedPrice.toLocaleString()}`;
    originalPriceElement.textContent = `NT$ ${selectedPrice.toLocaleString()}`;

    
    if (currentPriceElement && selectedPrice > 0) {
      // 檢查是否有折扣
      const hasDiscount = originalPriceElement && originalPriceElement.style.display !== 'none';
      
      if (hasDiscount) {
        // 如果有折扣，計算折扣後的價格
        const discountRate = parseFloat(currentPriceElement.dataset.discountRate || 1);
        const discountedPrice = Math.round(selectedPrice * discountRate);
        currentPriceElement.textContent = `NT$ ${discountedPrice.toLocaleString()}`;
        originalPriceElement.textContent = `NT$ ${selectedPrice.toLocaleString()}`;
      } else {
        // 如果沒有折扣，直接顯示選擇的價格
        currentPriceElement.textContent = `NT$ ${selectedPrice.toLocaleString()}`;
      }
    }
    
    // 更新庫存狀態（如果需要）
    // updateStockStatus(selectedOption.dataset.stock);
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
  
  // 綁定購買方式選擇事件
  function bindPurchaseTypeOptions() {
    const purchaseOptions = document.querySelectorAll('.purchase-option');
    const rentDurationGroup = document.querySelector('.rent-duration');
    
    if (purchaseOptions.length > 0 && rentDurationGroup) {
      purchaseOptions.forEach(option => {
        option.addEventListener('click', function() {
          // 移除所有選項的active類
          purchaseOptions.forEach(opt => opt.classList.remove('active'));
          // 添加當前選項的active類
          this.classList.add('active');
          
          // 根據選擇顯示或隱藏租借天數
          if (this.dataset.type === 'rent') {
            rentDurationGroup.style.display = 'flex';
          } else {
            rentDurationGroup.style.display = 'none';
          }
        });
      });
    }
  }
  
  // 綁定縮圖點擊事件
  function bindThumbnailEvents() {
    document.addEventListener('click', function(e) {
      const thumbnail = e.target.closest('.thumbnail');
      if (thumbnail) {
        // 更新主圖
        const mainImage = document.getElementById('main-product-image');
        if (mainImage && thumbnail.dataset.image) {
          mainImage.src = thumbnail.dataset.image;
        }
        
        // 更新縮圖選中狀態
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnail.classList.add('active');
      }
    });
  }
  
  // 綁定標籤頁切換事件
  function bindTabEvents() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // 移除所有按鈕的active類
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // 添加當前按鈕的active類
        this.classList.add('active');
        
        // 隱藏所有面板
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        // 顯示對應的面板
        const tabId = this.dataset.tab;
        const targetPanel = document.getElementById(tabId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }
  
  // 切換收藏狀態
function toggleWishlist(prodId) {
  const memId = getCurrentMemberId();
  
  if (!memId) {
    alert('請先登入會員');
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    return;
  }
  
  const addWishlistBtn = document.querySelector('.btn-add-wishlist');
  const isFavorite = addWishlistBtn && addWishlistBtn.dataset.isFavorite === 'true';
  
  if (isFavorite) {
    // 取消收藏
    removeFromWishlist(prodId, memId);
  } else {
    // 加入收藏
    addToWishlist(prodId, memId);
  }
}

// 加入收藏函數
function addToWishlist(prodId, memId) {
  fetch(`${window.api_prefix}/api/prodfavorites/${memId}/${prodId}`, {
    method: 'POST'
  })
    .then(response => {
      if (!response.ok) throw new Error('網路回應不正常');
      return response.json();
    })
    .then(data => {
      console.log('加入收藏成功:', data);
      const addWishlistBtn = document.querySelector('.btn-add-wishlist');
      if (addWishlistBtn) {
        addWishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
        addWishlistBtn.classList.add('active');
        addWishlistBtn.dataset.isFavorite = 'true';
      }
      showWishlistMessage('已添加到收藏');
    })
    .catch(error => {
      console.error('加入收藏失敗:', error);
      alert('加入收藏失敗，請稍後再試');
    });
}

// 取消收藏函數
function removeFromWishlist(prodId, memId) {
  fetch(`${window.api_prefix}/api/prodfavorites/${memId}/${prodId}`, {
    method: 'DELETE'
  })
    .then(response => {
      if (!response.ok) throw new Error('網路回應不正常');
      return response.json();
    })
    .then(data => {
      console.log('取消收藏成功:', data);
      const addWishlistBtn = document.querySelector('.btn-add-wishlist');
      if (addWishlistBtn) {
        addWishlistBtn.innerHTML = '<i class="far fa-heart"></i>';
        addWishlistBtn.classList.remove('active');
        addWishlistBtn.dataset.isFavorite = 'false';
      }
      showWishlistMessage('已取消收藏');
    })
    .catch(error => {
      console.error('取消收藏失敗:', error);
      alert('取消收藏失敗，請稍後再試');
    });
}
   
  
  // 顯示加入收藏成功訊息
function showWishlistMessage(messageText = '已添加到收藏') {
  // 創建提示消息
  const message = document.createElement('div');
  message.className = 'wishlist-message';
  message.innerHTML = `
    <i class="fas fa-heart"></i>
    <span>${messageText}</span>
    <a href="user-profile.html?tab=wishlist" class="view-wishlist-btn">查看收藏</a>
  `;
  
    // 添加樣式
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #E76F51;
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
    
    // 添加查看收藏按鈕樣式
    const viewWishlistBtn = message.querySelector('.view-wishlist-btn');
    if (viewWishlistBtn) {
      viewWishlistBtn.style.cssText = `
        background-color: white;
        color: #E76F51;
        padding: 4px 10px;
        border-radius: 4px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s;
      `;
      
      // 添加懸停效果
      viewWishlistBtn.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#f0f0f0';
      });
      
      viewWishlistBtn.addEventListener('mouseout', function() {
        this.style.backgroundColor = 'white';
      });
    }
  
    // 添加到頁面
    document.body.appendChild(message);
  
    // 5秒後移除
    setTimeout(() => {
      message.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 300);
    }, 5000);
  }
  
  // 加入購物車函數
  async function addToCart(buyNow = false) {
    try {
      // 獲取商品資訊
      const quantity = document.getElementById('quantity').value;
      
      // 找出選中的顏色ID
      const selectedColorOption = document.querySelector('.color-option.active');
      const prodColorId = selectedColorOption ? parseInt(selectedColorOption.dataset.colorId) : 1; // 預設為1
      
      // 找出選中的規格ID
      const selectedSpecSelect = document.querySelector('.prod-spec-select');
      const prodSpecId = selectedSpecSelect ? parseInt(selectedSpecSelect.value) : 1; // 現在value是規格ID
      
      // 檢查購買方式
      const isPurchase = !document.querySelector('.purchase-option[data-type="rent"].active');
      
      // 如果是租借，獲取租借天數
      let rentDays = 0;
      if (!isPurchase) {
        rentDays = parseInt(document.getElementById('rent-days').value) || 1;
      }
      
      // 準備要發送的數據（符合後端 CartDTO_req 格式）
      const cartData = {
        prodId: parseInt(productId),
        prodColorId: prodColorId,
        prodSpecId: prodSpecId,
        cartProdQty: parseInt(quantity),
        isRent: !isPurchase,
        rentDays: rentDays
      };
      
      console.log('加入購物車數據:', cartData);
      
      // 檢查用戶是否登入
      const memberInfo = sessionStorage.getItem('currentMember');
      const member = memberInfo ? JSON.parse(memberInfo) : null;
      const memId = member ? member.memId : null;
      
      if (memId) {
        // 已登入用戶，使用 API
        cartData.memId = memId;
        
        const response = await fetch(`${window.api_prefix}/api/addCart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cartData)
        });
        
        if (!response.ok) {
          throw new Error('網路回應不正常');
        }
        
        const data = await response.json();
        console.log('加入購物車成功:', data);
        
        if (data.status === 'success') {
          // 更新購物車數量顯示
          if (typeof globalCartManager !== 'undefined' && globalCartManager.updateCartCount) {
            globalCartManager.updateCartCount();
          }
        } else {
          throw new Error(data.message || '加入購物車失敗');
        }
      } else {
        // 未登入用戶，使用 sessionStorage
        sessionCartManager.addToCart(cartData);
      }
      
      // 顯示成功訊息
      showAddToCartMessage();
      
      // 如果是立即購買，跳轉到購物車頁面
      if (buyNow) {
        window.location.href = 'shop_cart.html';
      }
      
    } catch (error) {
      console.error('加入購物車失敗:', error);
      alert('加入購物車失敗，請稍後再試');
    }
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

// 載入相關商品（使用 /api/products/random）
function loadRelatedProducts() {
  const relatedProductsContainer = document.getElementById('related-products-container');
  if (!relatedProductsContainer) return;
  
  // 顯示載入中狀態
  relatedProductsContainer.innerHTML = '<div class="loading-indicator">載入中...</div>';
  
  // 使用隨機推薦商品 API
  fetch(`${window.api_prefix}/api/products/random?limit=4`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success' && Array.isArray(data.data)) {
        const relatedProducts = data.data;

        // 清空容器
        relatedProductsContainer.innerHTML = '';

        if (relatedProducts.length === 0) {
          relatedProductsContainer.innerHTML = '<p class="no-products">暫無相關商品推薦</p>';
          return;
        }

        // 渲染商品卡片
        relatedProducts.forEach(product => {
          relatedProductsContainer.appendChild(createProductCard(product));
        });

        // 綁定事件
        bindRelatedProductEvents();
      } else {
        relatedProductsContainer.innerHTML = '<p class="error">載入推薦商品失敗</p>';
      }
    })
    .catch(err => {
      console.error('載入推薦商品失敗：', err);
      relatedProductsContainer.innerHTML = '<p class="error">載入推薦商品失敗</p>';
    });
}

// 創建Random商品卡片
function createProductCard(product) {
  const hasDiscount = product.prodDiscount !== null && product.prodDiscount < 1;
  const firstSpec = product.prodSpecList?.[0];
  const originalPrice = firstSpec ? firstSpec.prodSpecPrice : 0;  
  const discountedPrice = hasDiscount ? Math.round(originalPrice * product.prodDiscount) : originalPrice;
  
  // 創建商品卡片元素
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.productId = product.prodId;
  
  // 將原始價格和折扣信息存儲在卡片上，以便後續使用
  card.dataset.originalPrice = originalPrice;
  card.dataset.hasDiscount = hasDiscount;
  card.dataset.discountRate = product.prodDiscount || 1;
  
  // 構建商品圖片 HTML
  let productImageHtml = '';
  if (product.prodPicList && product.prodPicList.length > 0) {
    const firstPicId = product.prodPicList[0].prodPicId;
    productImageHtml = `<img src="${window.api_prefix}/api/prodpics/${firstPicId}" alt="${product.prodName}" onerror="this.onerror=null; this.src='images/default-product.jpg';" />`;
  } else {
    productImageHtml = `<img src="images/default-product.jpg" alt="無圖片" />`;
  }
  
  // 構建商品標籤 HTML
  let tagHtml = '';
  if (hasDiscount) {
    tagHtml = `<span class="product-tag">促銷</span>`;
  }
  
  // 構建商品顏色選擇 HTML
  let colorOptionsHtml = '';
  if (product.prodColorList && product.prodColorList.length > 0) {
    colorOptionsHtml = '<div class="product-colors"><select class="color-select">';
    product.prodColorList.forEach((color, index) => {
      const colorName = color.colorName || `顏色 ${index + 1}`;
      colorOptionsHtml += `<option value="${color.prodColorId}"${index === 0 ? ' selected' : ''}>${colorName}</option>`;
    });
    colorOptionsHtml += '</select></div>';
  }
  
  // 構建商品規格選擇 HTML
  let specOptionsHtml = '';
  if (product.prodSpecList && product.prodSpecList.length > 0) {
    specOptionsHtml = '<div class="product-specs"><select class="spec-select">';
    product.prodSpecList.forEach((spec, index) => {
      const specName = spec.prodSpecName || `規格 ${spec.prodSpecId}`;
      // 為每個規格存儲其價格信息（如果有）
      const specPrice = spec.prodSpecPrice || originalPrice;
      specOptionsHtml += `<option value="${spec.prodSpecId}" data-price="${specPrice}"${index === 0 ? ' selected' : ''}>${specName}</option>`;
    });
    specOptionsHtml += '</select></div>';
  }
  
  // 構建商品價格 HTML，添加一個唯一的類名以便後續更新
  let priceHtml = `
    <div class="product-price" id="price-${product.prodId}">
      <span class="current-price">NT$ ${discountedPrice}</span>
      ${hasDiscount ? `<span class="original-price">NT$ ${originalPrice}</span>` : ''}
    </div>`;
  
  // 構建商品評分 HTML
  const rating = product.prodRating || 4.5;
  const ratingCount = product.prodRatingCount || 0;
  const starsHtml = generateStarsHtml(rating);
  
  // 組合完整的商品卡片 HTML
  card.innerHTML = `
    <div class="product-image">
      ${productImageHtml}
      ${tagHtml}
    </div>
    <div class="product-info">
      <h3><a href="product-detail.html?id=${product.prodId}">${product.prodName}</a></h3>
      <div class="product-rating">
        ${starsHtml}
        <span>(${ratingCount})</span>
      </div>
      ${colorOptionsHtml}
      ${specOptionsHtml}
      ${priceHtml}
      <div class="product-actions">
        <button class="btn-view-details"><i class="fas fa-search"></i> 查看明細</button>
        <button class="btn-add-cart"><i class="fas fa-shopping-cart"></i> 加入購物車</button>
      </div>
    </div>
  `;
  
  return card;
}

// 綁定相關商品的事件
function bindRelatedProductEvents() {
  // 處理顏色選擇
  const colorSelects = document.querySelectorAll('.related-products .color-select');
  colorSelects.forEach(select => {
    select.addEventListener('change', function() {
      // 顏色選擇已經通過 select 元素的 value 屬性保存
    });
  });
  
  // 處理規格選擇
  const specSelects = document.querySelectorAll('.related-products .spec-select');
  specSelects.forEach(select => {
    select.addEventListener('change', function() {
      const productCard = this.closest('.product-card');
      const hasDiscount = productCard.dataset.hasDiscount === 'true';
      const discountRate = parseFloat(productCard.dataset.discountRate);
      
      // 獲取選中規格的價格
      const selectedOption = this.options[this.selectedIndex];
      const specPrice = parseFloat(selectedOption.dataset.price);
      
      // 計算折扣後價格
      const discountedPrice = hasDiscount ? Math.round(specPrice * discountRate) : specPrice;
      
      // 更新價格顯示
      const priceContainer = productCard.querySelector('.product-price');
      priceContainer.querySelector('.current-price').textContent = `NT$ ${discountedPrice}`;
      
      if (hasDiscount) {
        priceContainer.querySelector('.original-price').textContent = `NT$ ${specPrice}`;
      }
    });
  });
  
  // 處理查看明細按鈕
  const viewDetailsButtons = document.querySelectorAll('.related-products .btn-view-details');
  viewDetailsButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productCard = this.closest('.product-card');
      const productId = productCard.dataset.productId;
      window.location.href = `product-detail.html?id=${productId}`;
    });
  });
  
  // 處理加入購物車按鈕
  const addToCartButtons = document.querySelectorAll('.related-products .btn-add-cart');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productCard = this.closest('.product-card');
      const productId = productCard.dataset.productId;
      const productName = productCard.querySelector('.product-info h3 a').textContent;
      const selectedSpecElement = productCard.querySelector('.product-specs select');
      const selectedSpec = selectedSpecElement ? selectedSpecElement.value : null;
      const selectedColorElement = productCard.querySelector('.product-colors .color-select');
      const selectedColorId = selectedColorElement ? selectedColorElement.value : null;
      
      // 調用添加到購物車的函數
      addProductToCart({
        productId: productId,
        name: productName,
        specId: selectedSpec,
        colorId: selectedColorId,
        quantity: 1
      });
    });
  });
}

// 添加商品到購物車
async function addProductToCart(productData) {
  try {
    // 準備要發送的數據（符合後端 CartDTO_req 格式）
    const cartData = {
      prodId: parseInt(productData.productId),
      prodColorId: parseInt(productData.colorId) || 1,
      prodSpecId: parseInt(productData.specId) || 1,
      cartProdQty: parseInt(productData.quantity) || 1,
      isRent: false,
      rentDays: 0
    };
    
    console.log('加入購物車數據:', cartData);
    
    // 檢查用戶是否登入
    const memberInfo = sessionStorage.getItem('currentMember');
    const member = memberInfo ? JSON.parse(memberInfo) : null;
    const memId = member ? member.memId : null;
    
    if (memId) {
      // 已登入用戶，使用 API
      cartData.memId = memId;
      
      const response = await fetch(`${window.api_prefix}/api/addCart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cartData)
      });
      
      if (!response.ok) {
        throw new Error('網路回應不正常');
      }
      
      const data = await response.json();
      console.log('加入購物車成功:', data);
      
      if (data.status === 'success') {
        // 更新購物車數量顯示
        if (typeof globalCartManager !== 'undefined' && globalCartManager.updateCartCount) {
          globalCartManager.updateCartCount();
        }
      } else {
        throw new Error(data.message || '加入購物車失敗');
      }
    } else {
      // 未登入用戶，使用 sessionStorage
      sessionCartManager.addToCart(cartData);
    }
    
    // 顯示成功訊息
    showAddToCartMessage();
    
  } catch (error) {
    console.error('加入購物車失敗:', error);
    // alert('加入購物車失敗，請稍後再試');
  }
}

// 獲取當前登入會員的 ID
function getCurrentMemberId() {
  const memberData = localStorage.getItem('currentMember') || sessionStorage.getItem('currentMember');
  if (memberData) {
    try {
      return JSON.parse(memberData).memId;
    } catch (e) {
      console.error('解析會員資料失敗', e);
    }
  }
  return null;
}

// 檢查收藏狀態
function checkFavoriteStatus(prodId) {
  const memId = getCurrentMemberId();
  if (!memId) return; // 未登入不檢查
  
  fetch(`${window.api_prefix}/api/prodfavorites/isFavoriteOrNot/${memId}/${prodId}`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success' && data.data) {
        // 如果已收藏，更新按鈕狀態
        const addWishlistBtn = document.querySelector('.btn-add-wishlist');
        if (addWishlistBtn) {
          addWishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
          addWishlistBtn.classList.add('active');
          addWishlistBtn.dataset.isFavorite = 'true';
        }
      }
    })
    .catch(error => {
      console.error('檢查收藏狀態失敗:', error);
    });
}