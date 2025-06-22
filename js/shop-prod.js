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

  // ⭐ 補上這段讓分類選單一變動就查詢
  categorySelect.addEventListener("change", function () {
    showLoadingOverlay();
    fetchProducts();
  });

  // 排序變更時重新查詢
  sortSelect.addEventListener("change", function () {
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
      .then(data => {
        categorySelect.innerHTML = `<option value="">全部分類</option>`;
        data.forEach(type => {
          const option = document.createElement("option");
          option.value = type.prodTypeId;
          option.textContent = type.prodTypeName;
          categorySelect.appendChild(option);
        });
      })
      .catch(err => {
        console.error("載入商品分類失敗：", err);
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
          const discountedPrice = hasDiscount ? prod.prodDiscount : prod.prodPrice;
          const prodDate = prod.prodDate ? formatDate(prod.prodDate) : formatDate(new Date());
          const featuresHtml = generateProductFeatures(prod);

          const specs = prod.prodSpecList || [];
          let specSelectHtml = '';
          
          if (specs.length > 0) {
            specSelectHtml += `<select class="prod-spec-select" data-prod-id="${prod.prodId}">`;
            specs.forEach(spec => {
              specSelectHtml += `<option value="${spec.prodSpecPrice}">規格 ${spec.prodSpecId} - NT$${spec.prodSpecPrice}</option>`;
            });
            specSelectHtml += `</select>`;
          }
          
          const html = `
            <div class="product-card">
              <div class="product-image">
                <img src="images/default-product.jpg" alt="${prod.prodName}" />
                <span class="product-tag">${prod.prodTag || '熱銷'}</span>
              </div>
              <div class="product-info">
                <h3><a href="product-detail.html?id=${prod.prodId}">${prod.prodName}</a></h3>
                <p class="product-category">
                  <i class="fas fa-tag"></i> ${prod.prodTypeName || '露營裝備'}
                </p>

                <div class="product-rating">
                  <div class="stars">${generateStarsHtml(prod.prodRating || 4.5)}</div>
                  <span>(${prod.prodRating ?? 0})</span>
                </div>
                <div class="product-features">${featuresHtml}</div>

                <div class="product-price">
                  <span class="current-price" data-base-price="${discountedPrice}">NT$ ${discountedPrice}</span>
                  ${hasDiscount ? `<span class="original-price">NT$ ${prod.prodPrice}</span>` : ''}
                  ${specSelectHtml}
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
    
    document.querySelectorAll(".prod-spec-select").forEach((select) => {
      select.addEventListener("change", function () {
        const selectedPrice = this.value;
        const priceSpan = this.closest(".product-price").querySelector(".current-price");
        priceSpan.textContent = `NT$ ${selectedPrice}`;
      });
    });

    document.querySelectorAll(".btn-favorite").forEach((btn) => {
      btn.addEventListener("click", function () {
        const prodId = this.dataset.id;
        console.log("加入收藏:", prodId);
      });
    });

    document.querySelectorAll(".btn-add-cart").forEach((btn) => {
      btn.addEventListener("click", function () {
        const prodId = this.dataset.id;
        console.log("加入購物車:", prodId);
      });
    });
  }
});
