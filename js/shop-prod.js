document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector(".product-grid");
  const categorySelect = document.getElementById("category");
  const sortSelect = document.getElementById("sort");
  const form = document.querySelector(".filter-form");

  // 載入分類後，再載入商品（確保分類選單有渲染完）
  loadCategories().then(() => {
    fetchProducts();
  });

  // 表單送出時依條件重新查詢
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    fetchProducts();
  });

  // ⭐ 補上這段讓分類選單一變動就查詢
  categorySelect.addEventListener("change", function () {
    fetchProducts();
  });
  
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
          const html = `
            <div class="product-card">
              <div class="product-image">
                <img src="images/default-product.jpg" alt="${prod.prodName}" />
                <span class="product-tag">熱銷</span>
              </div>
              <div class="product-info">
                <h3><a href="product-detail.html?id=${prod.prodId}">${prod.prodName}</a></h3>
                <div class="product-rating">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star-half-alt"></i>
                  <span>(${prod.prodRating ?? 0})</span>
                </div>
                <div class="product-price">
                  <span class="current-price">NT$ ${prod.prodDiscount ?? prod.prodPrice}</span>
                  ${prod.prodDiscount ? `<span class="original-price">NT$ ${prod.prodPrice}</span>` : ''}
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
      })
      .catch((err) => {
        console.error("商品載入失敗：", err);
      });
  }

  function bindButtons() {
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
