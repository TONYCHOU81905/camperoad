// 購物車頁面管理
class CartPageManager {
  constructor() {
    // 檢查CartManager是否已初始化
    if (cartManager.isInitialized()) {
      this.init();
    } else {
      console.log("等待CartManager初始化完成...");
      // 監聽CartManager初始化完成事件
      document.addEventListener("cartManagerInitialized", () => {
        console.log("CartManager初始化完成，開始初始化CartPageManager");
        this.init();
      });
    }
  }

  init() {
    this.renderCart();
    this.bindEvents();
  }

  // 渲染購物車
  renderCart() {
    const cartItems = cartManager.getCartItems();
    const bundleItems = cartManager.getBundleItems();
    const cartItemsContainer = document.getElementById("cart-items-container");
    const cartEmptyMessage = document.getElementById("cart-empty");
    const orderSummary = document.getElementById("order-summary");
    const bundleItemsContainer = document.getElementById(
      "bundle-items-container"
    );

    // 清空容器
    cartItemsContainer.innerHTML = "";
    bundleItemsContainer.innerHTML = "";

    // 顯示或隱藏空購物車消息和訂單摘要
    if (cartItems.length === 0 && bundleItems.length === 0) {
      cartEmptyMessage.style.display = "block";
      orderSummary.style.display = "none";
      bundleItemsContainer.style.display = "none";
      return;
    } else {
      cartEmptyMessage.style.display = "none";
      orderSummary.style.display = "block";
      bundleItemsContainer.style.display = "block";
    }

    // 獲取第一個營地項目的信息（用於統一顯示日期）
    const campItems = cartItems.filter((item) => !item.isBundle);
    if (campItems.length > 0) {
      try {
        const firstCampItem = campItems[0];
        const campId = firstCampItem.campId;
        const checkIn = firstCampItem.checkIn;
        const checkOut = firstCampItem.checkOut;
        const nights = cartManager.calculateNights(checkIn, checkOut);

        // 顯示統一的入住和退房日期
        const dateInfoElement = document.createElement("div");
        dateInfoElement.className = "date-info";
        dateInfoElement.innerHTML = `
          <div class="date-info-header">預訂日期</div>
          <div class="date-info-content">
            <div class="check-in">
              <span class="label">入住日期：</span>
              <span class="value">${this.formatDate(checkIn)}</span>
            </div>
            <div class="check-out">
              <span class="label">退房日期：</span>
              <span class="value">${this.formatDate(checkOut)}</span>
            </div>
            <div class="nights">
              <span class="label">住宿天數：</span>
              <span class="value">${nights}晚</span>
            </div>
          </div>
        `;
        cartItemsContainer.appendChild(dateInfoElement);

        // 儲存住宿天數到localStorage
        localStorage.setItem("days", nights);
      } catch (error) {
        console.error("處理日期資訊時發生錯誤:", error);
        // 顯示錯誤信息
        const errorElement = document.createElement("div");
        errorElement.className = "date-info error";
        errorElement.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <span>載入日期資訊時發生錯誤，請稍後再試</span>
          </div>
        `;
        cartItemsContainer.appendChild(errorElement);
      }
    }

    // 總是顯示加購商品（不依賴於是否有營地項目）
    try {
      this.renderBundleItems(null, bundleItemsContainer);
    } catch (error) {
      console.error("載入加購商品時發生錯誤:", error);
    }

    // 渲染營地項目
    campItems.forEach((item, index) => {
      try {
        // 從cartManager獲取最新房型資料
        const campsiteType = cartManager.getCampsiteTypeById(
          item.campsiteTypeId
        );
        if (!campsiteType) {
          console.error("找不到房型資料:", item.campsiteTypeId);
          return;
        }

        const nights = cartManager.calculateNights(item.checkIn, item.checkOut);
        const tentPrice =
          item.tentType && item.tentType.includes("rent")
            ? cartManager.getTentPrice(item.tentType)
            : 0;
        const totalPrice = (campsiteType.campsitePrice + tentPrice) * nights;

        const cartItemElement = document.createElement("div");
        cartItemElement.className = "cart-item";
        cartItemElement.dataset.index = index;
        console.log(
          "createIMG:",
          `${window.api_prefix}/campsitetype/${item.campsiteTypeId}/${item.campId}/images/1`
        );

        cartItemElement.innerHTML = `
          <div class="cart-item-image">
            <img src="${
              item.image ||
              `${window.api_prefix}/campsitetype/${item.campsiteTypeId}/${item.campId}/images/1`
            }" alt="${campsiteType.campsiteName}">
          </div>
          <div class="cart-item-details">
            <h3 class="cart-item-title">${campsiteType.campsiteName}</h3>
            <div class="cart-item-info">
              <div class="info-row">
                <span class="info-label">人數：</span>
                <span class="info-value">${campsiteType.campsitePeople}人</span>
              </div>
              ${
                item.tentType
                  ? `
              <div class="info-row">
                <span class="info-label">帳篷：</span>
                <span class="info-value">${this.getTentTypeName(
                  item.tentType
                )}</span>
              </div>`
                  : ""
              }
            </div>
          </div>
          <div class="cart-item-price">
            <div class="price-details">
              <div class="price-row">
                <span class="price-label">房型價格：</span>
                <span class="price-value">NT$ ${
                  campsiteType.campsitePrice
                }</span>
              </div>
              ${
                tentPrice > 0
                  ? `
              <div class="price-row">
                <span class="price-label">帳篷租借：</span>
                <span class="price-value">NT$ ${tentPrice.toLocaleString()}</span>
              </div>`
                  : ""
              }
              <div class="price-row">
                <span class="price-label">住宿天數：</span>
                <span class="price-value">${nights}晚</span>
              </div>
              <div class="price-row total">
                <span class="price-label">小計：</span>
                <span class="price-value">NT$ ${totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div class="cart-item-remove">
            <button class="remove-btn" data-index="${index}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `;

        cartItemsContainer.appendChild(cartItemElement);
      } catch (error) {
        console.error("渲染購物車項目時發生錯誤:", error);
        // 顯示錯誤信息
        const errorElement = document.createElement("div");
        errorElement.className = "cart-item error";
        errorElement.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <span>載入房型資料時發生錯誤，請稍後再試</span>
          </div>
          <div class="cart-item-remove">
            <button class="remove-btn" data-index="${index}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `;
        cartItemsContainer.appendChild(errorElement);
      }
    });

    // 渲染已加購的商品
    const storedBundleItems = cartManager.getBundleItems();
    storedBundleItems.forEach((item) => {
      const cartItemElement = document.createElement("div");
      cartItemElement.className = "cart-item bundle-item no-image";
      cartItemElement.dataset.bundleId = item.bundleId;

      cartItemElement.innerHTML = `
        <div class="cart-item-details bundle-item-details">
          <div class="bundle-item-header">
            <h3 class="cart-item-title">${item.bundleName || "未知商品"}</h3>
            <span class="bundle-item-badge">加購商品</span>
          </div>
          <div class="cart-item-info">
            <div class="info-row">
              <span class="info-label">單價：</span>
              <span class="info-value">NT$ ${(
                item.bundlePrice || 0
              ).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div class="cart-item-price">
          <div class="price-details">
            <div class="price-row">
              <span class="price-label">數量：</span>
              <span class="price-value">
                <div class="quantity-selector">
                  <button class="quantity-btn minus" data-bundle-id="${
                    item.bundleId
                  }">-</button>
                  <input type="number" class="quantity-input" value="${
                    item.quantity || 1
                  }" min="1" max="10" data-bundle-id="${item.bundleId}">
                  <button class="quantity-btn plus" data-bundle-id="${
                    item.bundleId
                  }">+</button>
                </div>
              </span>
            </div>
            <div class="price-row total">
              <span class="price-label">小計：</span>
              <span class="price-value">NT$ ${(
                (item.bundlePrice || 0) * (item.quantity || 1)
              ).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div class="cart-item-remove">
          <button class="remove-btn" data-bundle-id="${item.bundleId}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;

      cartItemsContainer.appendChild(cartItemElement);
    });

    // 更新購物車摘要
    this.updateCartSummary();
  }

  // 渲染加購商品選項
  renderBundleItems(campId, container) {
    // 使用 cartManager.bundleItems 而不是 getBundleItemsByCampId
    const bundleItems = cartManager.bundleItems;
    console.log("Available bundle items:", bundleItems);

    if (!bundleItems || bundleItems.length === 0) {
      container.innerHTML = "<p class='no-bundles'>此營地暫無加購商品</p>";
      return;
    }

    container.innerHTML = "<h2 class='bundle-title'>加購商品</h2>";
    const bundleGrid = document.createElement("div");
    bundleGrid.className = "bundle-grid";

    bundleItems.forEach((item) => {
      // 轉換數據格式以保持一致性
      const normalizedItem = {
        bundleId: item.bundle_id || item.bundleId,
        bundleName: item.bundle_name || item.bundleName,
        bundlePrice: item.bundle_price || item.bundlePrice,
        bundleDescription: item.bundle_description || item.bundleDescription
      };
      
      const bundleCard = document.createElement("div");
      bundleCard.className = "bundle-card no-image";
      bundleCard.innerHTML = `
        <div class="bundle-details">
          <div class="bundle-header">
            <h3 class="bundle-name">${normalizedItem.bundleName || "未知商品"}</h3>
            <div class="bundle-price">NT$ ${(
              normalizedItem.bundlePrice || 0
            ).toLocaleString()}</div>
          </div>
          ${
            normalizedItem.bundleDescription
              ? `<p class="bundle-description">${normalizedItem.bundleDescription}</p>`
              : ""
          }
          <div class="bundle-actions">
            <button class="add-bundle-btn" data-bundle-id="${normalizedItem.bundleId}">
              <i class="fas fa-plus"></i>
              加入購物車
            </button>
          </div>
        </div>
      `;
      bundleGrid.appendChild(bundleCard);
    });

    container.appendChild(bundleGrid);

    // 綁定加購商品按鈕事件
    const addBundleBtns = container.querySelectorAll(".add-bundle-btn");
    addBundleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const bundleId = btn.dataset.bundleId;
        const bundleItem = bundleItems.find(
          (item) => (item.bundle_id || item.bundleId) == bundleId
        );
        if (bundleItem) {
          console.log("Adding bundle item to cart:", bundleItem);
          cartManager.addBundleItem(bundleItem);
          this.renderCart(); // 重新渲染購物車
          this.updateCartSummary(); // 更新總價

          // 顯示成功提示
          btn.innerHTML = '<i class="fas fa-check"></i> 已加入';
          btn.disabled = true;
          setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-plus"></i> 加入購物車';
            btn.disabled = false;
          }, 1500);
        }
      });
    });
  }

  // 更新購物車項目數量
  updateCartItemCount(bundleId, newCount) {
    let bundleItemsStorage = cartManager.getBundleItems();
    const bundleIndex = bundleItemsStorage.findIndex(
      (item) => (item.bundle_id || item.bundleId) === bundleId
    );

    if (bundleIndex > -1) {
      bundleItemsStorage[bundleIndex].quantity = newCount;
      localStorage.setItem("bundleItems", JSON.stringify(bundleItemsStorage));
      this.renderCart();
      this.updateCartSummary();
    } else {
      console.error('Bundle item not found for update:', bundleId);
    }
  }

  // 移除購物車項目
  removeItem(index) {
    cartManager.removeItem(index);
    this.renderCart();
  }

  // 移除加購商品
  removeBundleItem(bundleId) {
    cartManager.removeBundleItem(bundleId);
    this.renderCart();
  }

  // 清空購物車
  clearCart() {
    if (confirm("確定要清空購物車嗎？")) {
      cartManager.clearCart();
      cartManager.clearBundleItems();
      this.renderCart();
    }
  }

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    const weekday = weekdays[date.getDay()];
    return `${year}/${month}/${day} (${weekday})`;
  }

  // 獲取帳篷類型名稱
  getTentTypeName(tentType) {
    const tentTypes = {
      own: "自備帳篷",
      "rent-small": "租借小型帳篷",
      "rent-medium": "租借中型帳篷",
      "rent-large": "租借大型帳篷",
    };
    return tentTypes[tentType] || tentType;
  }

  // 綁定事件
  bindEvents() {
    // 移除按鈕
    document.addEventListener("click", (e) => {
      if (e.target.closest(".remove-btn")) {
        const btn = e.target.closest(".remove-btn");
        if (btn.dataset.index) {
          const index = parseInt(btn.dataset.index);
          this.removeItem(index);
        } else if (btn.dataset.bundleId) {
          const bundleId = btn.dataset.bundleId;
          this.removeBundleItem(bundleId);
        }
      }
    });

    // 數量選擇器
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("quantity-btn")) {
        const btn = e.target;
        let input;
        let value;

        if (btn.dataset.index) {
          const index = parseInt(btn.dataset.index);
          input = document.querySelector(
            `.quantity-input[data-index="${index}"]`
          );
          value = parseInt(input.value);

          if (btn.classList.contains("plus")) {
            value = Math.min(value + 1, 10);
          } else if (btn.classList.contains("minus")) {
            value = Math.max(value - 1, 1);
          }

          input.value = value;
          this.updateCartItemCount(index, value);
        } else if (btn.dataset.bundleId) {
          const bundleId = btn.dataset.bundleId;
          input = document.querySelector(
            `.quantity-input[data-bundle-id="${bundleId}"]`
          );
          value = parseInt(input.value);

          if (btn.classList.contains("plus")) {
            value = Math.min(value + 1, 10);
          } else if (btn.classList.contains("minus")) {
            value = Math.max(value - 1, 1);
          }

          input.value = value;
          this.updateCartItemCount(bundleId, value);
        }
      }
    });

    // 數量輸入框
    document.addEventListener("change", (e) => {
      if (e.target.classList.contains("quantity-input")) {
        const input = e.target;
        let value = parseInt(input.value);

        // 限制數量範圍
        value = Math.max(1, Math.min(value, 10));
        input.value = value;

        if (input.dataset.index) {
          const index = parseInt(input.dataset.index);
          this.updateCartItemCount(index, value);
        } else if (input.dataset.bundleId) {
          const bundleId = input.dataset.bundleId;
          this.updateCartItemCount(bundleId, value);
        }
      }
    });

    // 清空購物車按鈕
    const clearCartBtn = document.getElementById("clear-cart-btn");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => this.clearCart());
    }

    // 結帳按鈕
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.checkout());
    }
  }

  // 更新購物車摘要
  updateCartSummary() {
    const subtotalElement = document.getElementById("cart-subtotal");
    const totalElement = document.getElementById("cart-total");

    const totalPrice = cartManager.getTotalPrice();

    if (subtotalElement) {
      subtotalElement.textContent = `NT$ ${totalPrice.toLocaleString()}`;
    }

    if (totalElement) {
      totalElement.textContent = `NT$ ${totalPrice.toLocaleString()}`;
    }

    // 啟用或禁用結帳按鈕
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      const cartItems = cartManager.getCartItems();
      const bundleItems = cartManager.getBundleItems();
      checkoutBtn.disabled = cartItems.length === 0 && bundleItems.length === 0;
    }
  }

  // 結帳處理
  checkout() {
    // 這裡可以添加結帳邏輯，例如跳轉到結帳頁面
    window.location.href = "/checkout.html";
  }
}

// 頁面載入完成後初始化購物車頁面
document.addEventListener("DOMContentLoaded", () => {
  new CartPageManager();
});
