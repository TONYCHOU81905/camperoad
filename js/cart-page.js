// 購物車頁面管理
class CartPageManager {
  constructor() {
    this.cartManager = new CartManager();
    this.init();
  }

  init() {
    this.renderCart();
    this.bindEvents();
  }

  // 渲染購物車
  renderCart() {
    const cartItems = this.cartManager.getCartItems();
    const cartContainer = document.getElementById("cart-items-container");
    const cartEmpty = document.getElementById("cart-empty");
    const cartSummary = document.querySelector(".cart-summary");

    if (cartItems.length === 0) {
      cartEmpty.style.display = "block";
      cartContainer.innerHTML = "";
      if (cartSummary) cartSummary.style.display = "none";
      return;
    }

    cartEmpty.style.display = "none";
    if (cartSummary) cartSummary.style.display = "block";

    cartContainer.innerHTML = cartItems
      .map((item, index) => {
        const nights = this.cartManager.calculateNights(
          item.checkIn,
          item.checkOut
        );
        const tentPrice = this.cartManager.getTentPrice(item.tentType);
        const basePrice = item.price * nights;
        const totalTentPrice = tentPrice * nights;
        const totalPrice = basePrice + totalTentPrice;

        return `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-col product-info">
                        <div class="product-image">
                            <img src="${item.image}" alt="${item.name}" />
                        </div>
                        <div class="product-details">
                            <h3>${item.name}</h3>
                            <p class="product-variant">入住: ${this.formatDate(
                              item.checkIn
                            )} - 退房: ${this.formatDate(item.checkOut)}</p>
                            <p class="product-variant">人數: ${
                              item.guests
                            }人</p>
                            <p class="product-variant">帳篷: ${this.getTentTypeName(
                              item.tentType
                            )}</p>
                            <p class="product-type">營地預訂 (${nights}晚)</p>
                        </div>
                    </div>
                    <div class="cart-col product-price">
                        <div class="price-breakdown">
                            <div>營地費用: NT$ ${item.price.toLocaleString()} × ${nights}晚</div>
                            ${
                              tentPrice > 0
                                ? `<div>帳篷租借: NT$ ${tentPrice.toLocaleString()} × ${nights}晚</div>`
                                : ""
                            }
                        </div>
                    </div>
                    <div class="cart-col product-quantity">
                        <span>${nights}晚</span>
                    </div>
                    <div class="cart-col product-subtotal">
                        <span class="current-price">NT$ ${totalPrice.toLocaleString()}</span>
                    </div>
                    <div class="cart-col product-action">
                        <button type="button" class="btn-remove" onclick="cartPageManager.removeItem(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");

    this.updateCartSummary();
  }

  // 更新購物車摘要
  updateCartSummary() {
    const totalPrice = this.cartManager.getTotalPrice();
    const cartItems = this.cartManager.getCartItems();

    // 更新總計
    const totalElements = document.querySelectorAll(".total-price");
    totalElements.forEach((element) => {
      element.textContent = `NT$ ${totalPrice.toLocaleString()}`;
    });

    // 更新項目數量
    const itemCountElements = document.querySelectorAll(".item-count");
    itemCountElements.forEach((element) => {
      element.textContent = cartItems.length;
    });
  }

  // 移除項目
  removeItem(index) {
    if (confirm("確定要移除此項目嗎？")) {
      this.cartManager.removeItem(index);
      this.renderCart();
    }
  }

  // 清空購物車
  clearCart() {
    if (confirm("確定要清空購物車嗎？")) {
      this.cartManager.clearCart();
      this.renderCart();
    }
  }

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
    });
  }

  // 獲取帳篷類型名稱
  getTentTypeName(tentType) {
    const names = {
      own: "自備帳篷",
      "rent-small": "租借雙人帳",
      "rent-medium": "租借四人帳",
      "rent-large": "租借六人帳",
    };
    return names[tentType] || tentType;
  }

  // 綁定事件
  bindEvents() {
    // 清空購物車按鈕
    const clearCartBtn = document.querySelector(".btn-clear-cart");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => this.clearCart());
    }

    // 結帳按鈕
    const checkoutBtn = document.querySelector(".btn-checkout");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.checkout());
    }
  }

  // 結帳處理
  checkout() {
    const cartItems = this.cartManager.getCartItems();
    if (cartItems.length === 0) {
      alert("購物車是空的");
      return;
    }

    // 這裡可以跳轉到結帳頁面或顯示結帳表單
    alert("跳轉到結帳頁面...");
    // window.location.href = 'checkout.html';
  }
}

// 頁面載入完成後初始化
document.addEventListener("DOMContentLoaded", function () {
  // 確保CartManager已載入
  if (typeof CartManager !== "undefined") {
    window.cartPageManager = new CartPageManager();
  } else {
    // 如果CartManager還沒載入，等待一下再初始化
    setTimeout(() => {
      window.cartPageManager = new CartPageManager();
    }, 100);
  }
});
