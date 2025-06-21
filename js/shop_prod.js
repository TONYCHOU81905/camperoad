document.addEventListener("DOMContentLoaded", function () {
    fetch("http://localhost:8081/CJA101G02/api/productslist")
      .then((res) => res.json())
      .then((data) => {
        const products = data.data; // 抓回來的商品清單
        const container = document.querySelector(".product-grid");
        container.innerHTML = ""; // 清空原本靜態內容
  
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

        // 綁定收藏按鈕事件
        document.querySelectorAll('.btn-favorite').forEach(btn => {
          btn.addEventListener('click', function() {
            const prodId = this.dataset.id;
            // TODO: 實作收藏功能
            console.log('加入收藏:', prodId);
          });
        });

        // 綁定購物車按鈕事件
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
          btn.addEventListener('click', function() {
            const prodId = this.dataset.id;
            // TODO: 實作加入購物車功能
            console.log('加入購物車:', prodId);
          });
        });
      })
      .catch((err) => {
        console.error("商品載入失敗：", err);
      });
});
  