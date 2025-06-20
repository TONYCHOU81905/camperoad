// 購物車功能
class CartManager {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem("campingCart")) || [];
    this.bundleItems = []; // 加購商品
    this.campsiteTypes = []; // 營地房型資料
    this.initialized = false; // 初始化完成標誌
    this.updateCartCount();
    this.init(); // 初始化資料
  }

  // 初始化資料
  async init() {
    try {
      await Promise.all([this.loadCampsiteTypes(), this.loadBundleItems()]);
      this.initialized = true;
      console.log("購物車資料初始化完成");
      // 觸發初始化完成事件
      const event = new CustomEvent("cartManagerInitialized");
      document.dispatchEvent(event);
    } catch (error) {
      console.error("購物車資料初始化失敗:", error);
    }
  }

  // 檢查初始化狀態
  isInitialized() {
    return this.initialized;
  }

  // 載入房型資料
  async loadCampsiteTypes() {
    try {
      const response = await fetch("/data/campsite_type.json");
      if (!response.ok) {
        throw new Error("Failed to fetch campsite types");
      }
      this.campsiteTypes = await response.json();
      console.log("房型資料載入成功", this.campsiteTypes.length);
      return this.campsiteTypes;
    } catch (error) {
      console.error("載入房型資料失敗:", error);
      this.campsiteTypes = [];
      throw error;
    }
  }

  // 載入加購商品資料
  async loadBundleItems() {
    try {
      const response = await fetch("/data/bundle_item.json");
      if (!response.ok) {
        throw new Error("Failed to fetch bundle items");
      }
      this.bundleItems = await response.json();
      console.log("加購商品資料載入成功", this.bundleItems.length);
      return this.bundleItems;
    } catch (error) {
      console.error("載入加購商品資料失敗:", error);
      this.bundleItems = [];
      throw error;
    }
  }

  // 添加營地到購物車
  addCampsite(campsiteData) {
    const {
      id,
      name,
      price,
      checkIn,
      checkOut,
      guests,
      tentType,
      image,
      campsite_type_id,
    } = campsiteData;

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
        item.campId === id &&
        item.checkIn === checkIn &&
        item.checkOut === checkOut &&
        item.campsite_type_id === campsite_type_id
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
        campsite_type_id,
        addedAt: new Date().toISOString(),
      });
    }

    this.saveCart();
    this.updateCartCount();
    this.showAddToCartMessage();
    return true;
  }

  // 添加加購商品到購物車
  addBundleItem(bundleItem) {
    // 檢查購物車是否為空
    if (this.cart.length === 0) {
      alert("請先選擇營地房型再加購商品");
      return false;
    }

    // 只更新bundleItems的localStorage
    let bundleItemsStorage =
      JSON.parse(localStorage.getItem("bundleItems")) || [];
    const existingBundleIndex = bundleItemsStorage.findIndex(
      (item) => item.bundle_id === bundleItem.bundle_id
    );

    if (existingBundleIndex > -1) {
      // 更新數量
      bundleItemsStorage[existingBundleIndex].quantity =
        (bundleItemsStorage[existingBundleIndex].quantity || 1) + 1;
    } else {
      // 添加新項目
      bundleItemsStorage.push({
        ...bundleItem,
        quantity: 1,
        isBundle: true,
        addedAt: new Date().toISOString(),
      });
    }
    localStorage.setItem("bundleItems", JSON.stringify(bundleItemsStorage));

    this.showAddToCartMessage();
    return true;
  }

  // 移除購物車項目
  removeItem(index) {
    this.cart.splice(index, 1);
    this.saveCart();
    this.updateCartCount();
  }

  // 移除加購商品
  removeBundleItem(bundleId) {
    let bundleItemsStorage =
      JSON.parse(localStorage.getItem("bundleItems")) || [];
    const bundleIndex = bundleItemsStorage.findIndex(
      (bundleItem) => bundleItem.bundle_id === bundleId
    );

    if (bundleIndex > -1) {
      bundleItemsStorage.splice(bundleIndex, 1);
      localStorage.setItem("bundleItems", JSON.stringify(bundleItemsStorage));
    }
  }

  // 清空購物車
  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartCount();
  }

  // 清空加購商品
  clearBundleItems() {
    localStorage.removeItem("bundleItems");
  }

  // 清空所有購物資料
  clearAll() {
    this.clearCart();
    this.clearBundleItems();
  }

  // 獲取購物車項目
  getCartItems() {
    return this.cart;
  }

  // 獲取加購商品
  getBundleItems() {
    return JSON.parse(localStorage.getItem("bundleItems")) || [];
  }

  // 計算總價
  getTotalPrice() {
    // 計算營地價格
    const campsiteTotal = this.cart.reduce((total, item) => {
      // 營地房型價格
      const nights = this.calculateNights(item.checkIn, item.checkOut);

      // 從campsiteTypes中獲取房型價格
      const campsiteType = this.getCampsiteTypeById(item.campsite_type_id);
      let itemPrice = campsiteType.campsite_price * nights;

      // 添加帳篷租借費用
      if (item.tentType && item.tentType.includes("rent")) {
        const tentPrice = this.getTentPrice(item.tentType);
        itemPrice += tentPrice * nights;
      }

      return total + itemPrice;
    }, 0);

    // 計算加購商品價格
    const bundleItemsStorage =
      JSON.parse(localStorage.getItem("bundleItems")) || [];
    const bundleTotal = bundleItemsStorage.reduce((total, item) => {
      return total + item.bundle_price * (item.quantity || 1);
    }, 0);

    return campsiteTotal + bundleTotal;
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
    console.log("saveCart" + JSON.stringify(this.cart));

    localStorage.setItem("campingCart", JSON.stringify(this.cart));
  }

  // 更新購物車數量顯示
  updateCartCount() {
    const bundleItems = this.getBundleItems();
    const totalCount = this.cart.length + bundleItems.length;

    const cartCountElements = document.querySelectorAll(".cart-count");
    cartCountElements.forEach((element) => {
      element.textContent = totalCount;
      element.style.display = totalCount > 0 ? "inline" : "none";
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

  // 獲取特定營地的加購商品
  getBundleItemsByCampId(campId) {
    console.log("bundleItems_length:" + this.bundleItems.length);

    return this.bundleItems.filter((item) => item.camp_id == campId);
  }

  // 根據ID獲取房型資料
  getCampsiteTypeById(id) {
    // 檢查campsiteTypes是否已載入
    if (!this.campsiteTypes || this.campsiteTypes.length === 0) {
      console.warn("房型資料尚未載入完成，返回預設值");
      return {
        id: id,
        name: "載入中...",
        price: 0,
        image: "/images/campsite/default.jpg",
        description: "資料載入中，請稍候...",
      };
    }

    const campsiteType = this.campsiteTypes.find(
      (type) => type.campsite_type_id == id
    );
    if (!campsiteType) {
      console.warn(`找不到ID為${id}的房型資料`);
      return {
        id: id,
        name: "未知房型",
        price: 0,
        image: "/images/campsite/default.jpg",
        description: "找不到此房型資料",
      };
    }
    return campsiteType;
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
