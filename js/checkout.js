// 結帳頁面管理
class CheckoutManager {
  constructor() {
    // 檢查CartManager是否已初始化
    if (cartManager.isInitialized()) {
      this.init();
    } else {
      console.log("等待CartManager初始化完成...");
      // 監聽CartManager初始化完成事件
      document.addEventListener("cartManagerInitialized", () => {
        console.log("CartManager初始化完成，開始初始化CheckoutManager");
        this.init();
      });
    }
  }

  init() {
    this.cartItems = cartManager.getCartItems();
    // 從localStorage獲取加購商品
    this.bundleItems = JSON.parse(localStorage.getItem("bundleItems")) || [];
    this.totalPrice = cartManager.getTotalPrice();
    this.selectedPaymentMethod = "credit-card"; // 預設付款方式
    this.isProcessing = false; // 付款處理中標誌

    // 如果購物車為空，重定向到購物車頁面
    if (this.cartItems.length === 0) {
      window.location.href = "camp_cart.html";
      return;
    }

    this.renderOrderSummary();
    this.bindEvents();
  }

  // 渲染訂單摘要
  renderOrderSummary() {
    const orderItemsContainer = document.getElementById("order-items");
    const orderSubtotalElement = document.getElementById("order-subtotal");
    const orderTotalElement = document.getElementById("order-total");

    // 清空容器
    orderItemsContainer.innerHTML = "";

    // 渲染訂單項目
    this.cartItems.forEach(item => {
      const orderItemElement = document.createElement("div");
      orderItemElement.className = "order-item";

      if (item.isBundle) {
        // 加購商品
        orderItemElement.innerHTML = `
          <div class="order-item-image">
            <img src="/images/bundles/bundle-${item.bundle_id}.jpg" alt="${item.bundle_name}">
          </div>
          <div class="order-item-details">
            <div class="order-item-title">${item.bundle_name}</div>
            <div class="order-item-info">數量: ${item.quantity || 1}</div>
            <div class="order-item-price">NT$ ${(item.bundle_price * (item.quantity || 1)).toLocaleString()}</div>
          </div>
        `;
      } else {
        // 營地項目
        const campsiteType = cartManager.getCampsiteTypeById(item.campsite_type_id);
        const nights = cartManager.calculateNights(item.checkIn, item.checkOut);
        const tentPrice = item.tentType && item.tentType.includes("rent") ? cartManager.getTentPrice(item.tentType) : 0;
        const totalPrice = (campsiteType.price + tentPrice) * nights;

        orderItemElement.innerHTML = `
          <div class="order-item-image">
            <img src="${item.image || '/images/campsites/' + campsiteType.image}" alt="${campsiteType.name}">
          </div>
          <div class="order-item-details">
            <div class="order-item-title">${campsiteType.name}</div>
            <div class="order-item-info">${this.formatDate(item.checkIn)} - ${this.formatDate(item.checkOut)} (${nights}晚)</div>
            <div class="order-item-price">NT$ ${totalPrice.toLocaleString()}</div>
          </div>
        `;
      }

      orderItemsContainer.appendChild(orderItemElement);
    });

    // 渲染從localStorage獲取的加購商品
    this.bundleItems.forEach(item => {
      const orderItemElement = document.createElement("div");
      orderItemElement.className = "order-item bundle-item";

      orderItemElement.innerHTML = `
        <div class="order-item-image">
          <img src="/images/bundles/bundle-${item.bundle_id}.jpg" alt="${item.bundle_name}">
        </div>
        <div class="order-item-details">
          <div class="order-item-title">${item.bundle_name}</div>
          <div class="order-item-info">數量: ${item.quantity || 1}</div>
          <div class="order-item-price">NT$ ${(item.bundle_price * (item.quantity || 1)).toLocaleString()}</div>
        </div>
      `;

      orderItemsContainer.appendChild(orderItemElement);
    });

    // 計算總價（包括加購商品）
    let totalWithBundles = this.totalPrice;
    this.bundleItems.forEach(item => {
      totalWithBundles += item.bundle_price * (item.quantity || 1);
    });

    // 更新總計
    orderSubtotalElement.textContent = `NT$ ${totalWithBundles.toLocaleString()}`;
    orderTotalElement.textContent = `NT$ ${totalWithBundles.toLocaleString()}`;
  }

  // 綁定事件
  bindEvents() {
    // 付款方式選擇
    const paymentMethods = document.querySelectorAll(".payment-method-header");
    paymentMethods.forEach(method => {
      method.addEventListener("click", (e) => {
        const methodElement = method.closest(".payment-method");
        const methodId = methodElement.dataset.method;
        this.selectPaymentMethod(methodId);
      });
    });

    // 信用卡表單格式化
    const cardNumberInput = document.getElementById("card-number");
    if (cardNumberInput) {
      cardNumberInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        let formattedValue = "";
        for (let i = 0; i < value.length; i++) {
          if (i > 0 && i % 4 === 0) {
            formattedValue += " ";
          }
          formattedValue += value[i];
        }
        e.target.value = formattedValue;
      });
    }

    const cardExpiryInput = document.getElementById("card-expiry");
    if (cardExpiryInput) {
      cardExpiryInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 2) {
          value = value.substring(0, 2) + "/" + value.substring(2, 4);
        }
        e.target.value = value;
      });
    }

    // 提交付款按鈕
    const submitPaymentBtn = document.getElementById("submit-payment");
    if (submitPaymentBtn) {
      submitPaymentBtn.addEventListener("click", () => this.processPayment());
    }

    // 付款結果彈窗按鈕
    const viewOrderBtn = document.getElementById("view-order");
    if (viewOrderBtn) {
      viewOrderBtn.addEventListener("click", () => {
        window.location.href = "campsite_order.html";
      });
    }

    const retryPaymentBtn = document.getElementById("retry-payment");
    if (retryPaymentBtn) {
      retryPaymentBtn.addEventListener("click", () => {
        this.hidePaymentResultModal();
        this.processPayment();
      });
    }

    const backToCheckoutBtn = document.getElementById("back-to-checkout");
    if (backToCheckoutBtn) {
      backToCheckoutBtn.addEventListener("click", () => {
        this.hidePaymentResultModal();
      });
    }
  }

  // 選擇付款方式
  selectPaymentMethod(methodId) {
    this.selectedPaymentMethod = methodId;

    // 更新UI
    const paymentMethods = document.querySelectorAll(".payment-method");
    paymentMethods.forEach(method => {
      if (method.dataset.method === methodId) {
        method.classList.add("active");
        const radio = method.querySelector("input[type='radio']");
        if (radio) radio.checked = true;
      } else {
        method.classList.remove("active");
        const radio = method.querySelector("input[type='radio']");
        if (radio) radio.checked = false;
      }
    });
  }

  // 驗證表單
  validateForm() {
    // 驗證客戶資訊
    const customerName = document.getElementById("customer-name").value.trim();
    const customerPhone = document.getElementById("customer-phone").value.trim();
    const customerEmail = document.getElementById("customer-email").value.trim();
    const customerAddress = document.getElementById("customer-address").value.trim();

    if (!customerName || !customerPhone || !customerEmail || !customerAddress) {
      alert("請填寫完整的訂購人資訊");
      return false;
    }

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      alert("請輸入有效的電子郵件地址");
      return false;
    }

    // 如果選擇信用卡付款，驗證信用卡資訊
    if (this.selectedPaymentMethod === "credit-card") {
      const cardNumber = document.getElementById("card-number").value.trim().replace(/\s/g, "");
      const cardExpiry = document.getElementById("card-expiry").value.trim();
      const cardCvc = document.getElementById("card-cvc").value.trim();
      const cardName = document.getElementById("card-name").value.trim();

      if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
        alert("請填寫完整的信用卡資訊");
        return false;
      }

      // 驗證信用卡號格式
      if (!/^\d{16}$/.test(cardNumber)) {
        alert("請輸入有效的16位信用卡號");
        return false;
      }

      // 驗證有效期格式
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
        alert("請輸入有效的到期日期 (MM/YY)");
        return false;
      }

      // 驗證安全碼格式
      if (!/^\d{3}$/.test(cardCvc)) {
        alert("請輸入有效的3位安全碼");
        return false;
      }
    }

    return true;
  }

  // 處理付款
  processPayment() {
    if (this.isProcessing) return;
    
    // 驗證表單
    if (!this.validateForm()) return;

    this.isProcessing = true;
    this.showPaymentProcessingModal();

    // 收集訂單資訊
    const orderData = this.collectOrderData();

    // 根據付款方式處理
    if (this.selectedPaymentMethod === "credit-card") {
      this.processCreditCardPayment(orderData);
    } else if (this.selectedPaymentMethod === "line-pay") {
      this.processLinePayPayment(orderData);
    }
  }

  // 收集訂單資訊
  collectOrderData() {
    // 計算總價（包括加購商品）
    let totalWithBundles = this.totalPrice;
    this.bundleItems.forEach(item => {
      totalWithBundles += item.bundle_price * (item.quantity || 1);
    });
    
    // 合併購物車項目和加購商品
    const allItems = [...this.cartItems, ...this.bundleItems];
    
    return {
      customer: {
        name: document.getElementById("customer-name").value.trim(),
        phone: document.getElementById("customer-phone").value.trim(),
        email: document.getElementById("customer-email").value.trim(),
        address: document.getElementById("customer-address").value.trim(),
        note: document.getElementById("customer-note").value.trim()
      },
      items: allItems,
      totalPrice: totalWithBundles,
      paymentMethod: this.selectedPaymentMethod,
      paymentDetails: this.selectedPaymentMethod === "credit-card" ? {
        cardNumber: document.getElementById("card-number").value.trim().replace(/\s/g, ""),
        cardExpiry: document.getElementById("card-expiry").value.trim(),
        cardCvc: document.getElementById("card-cvc").value.trim(),
        cardName: document.getElementById("card-name").value.trim()
      } : {}
    };
  }

  // 處理信用卡付款 (模擬綠界API)
  processCreditCardPayment(orderData) {
    console.log("處理信用卡付款", orderData);

    // 模擬API請求
    setTimeout(() => {
      // 模擬80%成功率
      const isSuccess = Math.random() < 0.8;

      if (isSuccess) {
        this.handlePaymentSuccess({
          orderId: this.generateOrderId(),
          transactionId: this.generateTransactionId(),
          paymentMethod: "credit-card"
        });
      } else {
        this.handlePaymentFailure({
          errorCode: "PAYMENT_FAILED",
          errorMessage: "信用卡交易失敗，請確認卡片資訊或聯絡發卡銀行。"
        });
      }
    }, 2000); // 模擬2秒的API延遲
  }

  // 處理LINE Pay付款 (模擬LINE Pay API)
  processLinePayPayment(orderData) {
    console.log("處理LINE Pay付款", orderData);

    // 模擬跳轉到LINE Pay頁面
    this.hidePaymentProcessingModal();
    
    // 在實際應用中，這裡會跳轉到LINE Pay的付款頁面
    // 為了演示，我們使用模擬的方式
    alert("即將跳轉到LINE Pay付款頁面...");
    
    // 模擬LINE Pay付款流程
    setTimeout(() => {
      this.showPaymentProcessingModal();
      
      // 模擬LINE Pay回調
      setTimeout(() => {
        // 模擬70%成功率
        const isSuccess = Math.random() < 0.7;

        if (isSuccess) {
          this.handlePaymentSuccess({
            orderId: this.generateOrderId(),
            transactionId: this.generateTransactionId(),
            paymentMethod: "line-pay"
          });
        } else {
          this.handlePaymentFailure({
            errorCode: "LINE_PAY_CANCELLED",
            errorMessage: "LINE Pay交易已取消或失敗。"
          });
        }
      }, 2000); // 模擬2秒的API延遲
    }, 1500);
  }

  // 處理付款成功
  handlePaymentSuccess(result) {
    console.log("付款成功", result);
    this.isProcessing = false;
    this.hidePaymentProcessingModal();

    // 設置訂單編號
    document.getElementById("order-number").textContent = result.orderId;

    // 顯示成功訊息
    const successElement = document.getElementById("payment-success");
    const failureElement = document.getElementById("payment-failure");
    successElement.classList.add("active");
    failureElement.classList.remove("active");

    // 顯示結果彈窗
    this.showPaymentResultModal();

    // 清空購物車
    cartManager.clearCart();
    
    // 清空加購商品的localStorage
    localStorage.removeItem("bundleItems");

    // 創建訂單 (在實際應用中，這裡會發送API請求到伺服器)
    this.createOrder(result);
  }

  // 處理付款失敗
  handlePaymentFailure(error) {
    console.error("付款失敗", error);
    this.isProcessing = false;
    this.hidePaymentProcessingModal();

    // 設置錯誤原因
    document.getElementById("failure-reason").textContent = error.errorMessage;

    // 顯示失敗訊息
    const successElement = document.getElementById("payment-success");
    const failureElement = document.getElementById("payment-failure");
    successElement.classList.remove("active");
    failureElement.classList.add("active");

    // 顯示結果彈窗
    this.showPaymentResultModal();
  }

  // 創建訂單
  createOrder(paymentResult) {
    // 在實際應用中，這裡會發送API請求到伺服器
    console.log("創建訂單", {
      orderId: paymentResult.orderId,
      transactionId: paymentResult.transactionId,
      paymentMethod: paymentResult.paymentMethod,
      items: this.cartItems,
      totalPrice: this.totalPrice,
      customer: {
        name: document.getElementById("customer-name").value.trim(),
        phone: document.getElementById("customer-phone").value.trim(),
        email: document.getElementById("customer-email").value.trim(),
        address: document.getElementById("customer-address").value.trim(),
        note: document.getElementById("customer-note").value.trim()
      },
      createdAt: new Date().toISOString()
    });
  }

  // 顯示付款處理中彈窗
  showPaymentProcessingModal() {
    const modal = document.getElementById("payment-processing-modal");
    modal.classList.add("active");
  }

  // 隱藏付款處理中彈窗
  hidePaymentProcessingModal() {
    const modal = document.getElementById("payment-processing-modal");
    modal.classList.remove("active");
  }

  // 顯示付款結果彈窗
  showPaymentResultModal() {
    const modal = document.getElementById("payment-result-modal");
    modal.classList.add("active");
  }

  // 隱藏付款結果彈窗
  hidePaymentResultModal() {
    const modal = document.getElementById("payment-result-modal");
    modal.classList.remove("active");
  }

  // 生成訂單ID
  generateOrderId() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `ORD-${timestamp}-${random}`;
  }

  // 生成交易ID
  generateTransactionId() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `TXN-${timestamp}-${random}`;
  }

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}/${month}/${day}`;
  }
}

// 頁面載入完成後初始化結帳頁面
document.addEventListener("DOMContentLoaded", () => {
  new CheckoutManager();
});