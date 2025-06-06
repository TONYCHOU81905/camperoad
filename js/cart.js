// 購物車功能
class CartManager {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem("campingCart")) || [];
    this.updateCartCount();
  }

  // 添加營地到購物車
  addCampsite(campsiteData) {
    const { id, name, price, checkIn, checkOut, guests, tentType, image } =
      campsiteData;

    // 檢查是否有不同營地或不同日期的項目
    if (this.cart.length > 0) {
      const existingItem = this.cart[0];
      if (
        existingItem.id !== id ||
        existingItem.checkIn !== checkIn ||
        existingItem.checkOut !== checkOut
      ) {
        // 清空購物車並顯示確認對話框
        if (
          confirm(
            "購物車中已有不同營地或日期的預訂，是否清空購物車並添加新的預訂？"
          )
        ) {
          this.cart = [];
        } else {
          return false;
        }
      }
    }

    // 檢查是否已存在相同的項目
    const existingIndex = this.cart.findIndex(
      (item) =>
        item.id === id &&
        item.checkIn === checkIn &&
        item.checkOut === checkOut &&
        item.tentType === tentType
    );

    if (existingIndex > -1) {
      // 更新數量
      this.cart[existingIndex].guests = guests;
    } else {
      // 添加新項目
      this.cart.push({
        id,
        name,
        price,
        checkIn,
        checkOut,
        guests,
        tentType,
        image,
        addedAt: new Date().toISOString(),
      });
    }

    this.saveCart();
    this.updateCartCount();
    this.showAddToCartMessage();
    return true;
  }

  // 移除購物車項目
  removeItem(index) {
    this.cart.splice(index, 1);
    this.saveCart();
    this.updateCartCount();
  }

  // 清空購物車
  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartCount();
  }

  // 獲取購物車項目
  getCartItems() {
    return this.cart;
  }

  // 計算總價
  getTotalPrice() {
    return this.cart.reduce((total, item) => {
      const nights = this.calculateNights(item.checkIn, item.checkOut);
      let itemPrice = item.price * nights;

      // 添加帳篷租借費用
      if (item.tentType.includes("rent")) {
        const tentPrice = this.getTentPrice(item.tentType);
        itemPrice += tentPrice * nights;
      }

      return total + itemPrice;
    }, 0);
  }

  // 計算住宿天數
  calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 獲取帳篷價格
  getTentPrice(tentType) {
    const prices = {
      "rent-small": 500,
      "rent-medium": 800,
      "rent-large": 1200,
    };
    return prices[tentType] || 0;
  }

  // 保存購物車到本地存儲
  saveCart() {
    localStorage.setItem("campingCart", JSON.stringify(this.cart));
  }

  // 更新購物車數量顯示
  updateCartCount() {
    const cartCountElements = document.querySelectorAll(".cart-count");
    cartCountElements.forEach((element) => {
      element.textContent = this.cart.length;
      element.style.display = this.cart.length > 0 ? "inline" : "none";
    });
  }

  // 顯示添加到購物車的消息
  showAddToCartMessage() {
    // 創建提示消息
    const message = document.createElement("div");
    message.className = "cart-message";
    message.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>已添加到購物車</span>
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
            gap: 8px;
            font-family: 'Noto Sans TC', sans-serif;
            animation: slideInRight 0.3s ease;
        `;

    document.body.appendChild(message);

    // 3秒後移除消息
    setTimeout(() => {
      message.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 300);
    }, 3000);
  }
}

// 創建全局購物車管理器實例
const cartManager = new CartManager();

// 添加到購物車函數
function addToCart() {
  // 獲取營地信息
  const campsiteData = {
    id: "mountain-star-camp", // 這裡應該從頁面動態獲取
    name: document.querySelector(".campsite-title h1").textContent,
    price: 2800, // 從頁面獲取價格
    checkIn: document.getElementById("check-in-date").value,
    checkOut: document.getElementById("check-out-date").value,
    guests: document.getElementById("guests").value,
    tentType: document.getElementById("tent-type").value,
    image: document.getElementById("main-image").src,
  };

  // 驗證必填字段
  if (!campsiteData.checkIn || !campsiteData.checkOut) {
    alert("請選擇入住和退房日期");
    return;
  }

  // 驗證日期邏輯
  const checkInDate = new Date(campsiteData.checkIn);
  const checkOutDate = new Date(campsiteData.checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    alert("入住日期不能早於今天");
    return;
  }

  if (checkOutDate <= checkInDate) {
    alert("退房日期必須晚於入住日期");
    return;
  }

  // 添加到購物車
  cartManager.addCampsite(campsiteData);
}

// 添加CSS動畫
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
