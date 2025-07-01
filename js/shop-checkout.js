//LINE PAY:
// Channel ID: 1656895462
// Channel Secret Key:fd01e635b9ea97323acbe8d5c6b2fb71

// 結帳頁面管理
class CheckoutManager {
  constructor() {
    this.init(); // 直接初始化，不再依賴 cartManager
  }

  async init() {
    // 取得會員ID - 檢查 localStorage 和 sessionStorage
    let memberInfo = localStorage.getItem('currentMember') || sessionStorage.getItem('currentMember');
    let memId = null;
    if (memberInfo) {
      try {
        const member = JSON.parse(memberInfo);
        memId = member.mem_id || member.memId;
      } catch (e) {
        console.error('解析會員資料失敗:', e);
      }
    }
    if (!memId) {
      console.log('未找到會員資料，跳轉到登入頁面');
      window.location.href = 'login.html';
      return;
    }
    // === 以下為折扣碼相關程式碼，已註解 ===
    /*
    // 折扣碼下拉選單載入（先查會員擁有，再查全部折扣碼，前端比對）
    try {
      // 取得所有折扣碼詳細資料  
      const discountResp = await fetch(`${window.api_prefix}/api/discount/all`);
      const discountData = await discountResp.json();
      console.log('discountData', discountData);
      this.allDiscounts = Array.isArray(discountData) ? discountData : [];
      // 直接渲染所有折扣碼到下拉選單
      const select = document.getElementById('discount-code');
      if (select) {
        select.innerHTML = '<option value="">請選擇折扣碼</option>' +
          this.allDiscounts.map(d =>
            `<option value="${d.discountCodeId}" data-value="${d.discountValue}">
              ${d.discountCode}（${d.discountCodeId}）
            </option>`
          ).join('');
        // 折扣碼選擇時即時更新訂單摘要
        select.addEventListener('change', () => this.renderOrderSummary());
      }
    } catch (e) {}
    */
    // === 折扣碼程式碼註解結束 ===
    // 取得購物車資料
    let cartItems = [];
    try {
      const response = await fetch(`${window.api_prefix}/api/getCart?memId=${memId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          cartItems = data.data;
        }
      }
    } catch (e) {
      console.error('取得購物車資料失敗:', e);
    }
    this.cartItems = cartItems;
    this.totalPrice = this.cartItems.reduce((sum, item) => sum + (item.prodPrice * item.cartProdQty), 0);
    this.selectedPaymentMethod = "line-pay";
    this.isProcessing = false;
    if (this.cartItems.length === 0) {
      window.location.href = "shop_cart.html";
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
    const orderDiscountElement = document.getElementById("order-discount");
    const orderShippingElement = document.getElementById("order-shipping");
    orderItemsContainer.innerHTML = "";
    this.cartItems.forEach((item) => {
      const orderItemElement = document.createElement("div");
      orderItemElement.className = "order-item";
      orderItemElement.innerHTML = `
        <div class="order-item-details">
          <div class="order-item-title">${item.prodName}</div>
          <div class="order-item-info">顏色: ${item.colorName || ''}　規格: ${item.specName || ''}</div>
          <div class="order-item-info">數量: ${item.cartProdQty}</div>
          <div class="order-item-price">NT$ ${(item.prodPrice * item.cartProdQty).toLocaleString()}</div>
        </div>
      `;
      orderItemsContainer.appendChild(orderItemElement);
    });
    // 金額計算全部來自 API 取得的 cartItems
    const productTotal = this.cartItems.reduce((sum, item) => sum + (item.prodPrice * item.cartProdQty), 0);
    let discountAmount = 0;
    /*
    const discountCodeSelect = document.getElementById('discount-code');
    if (discountCodeSelect && discountCodeSelect.value && this.allDiscounts) {
      const selectedDiscount = this.allDiscounts.find(d => d.discountCodeId === discountCodeSelect.value);
      if (selectedDiscount) {
        if (selectedDiscount.discountType === 0) {
          discountAmount = selectedDiscount.discountValue;
        } else if (selectedDiscount.discountType === 1) {
          discountAmount = Math.round(productTotal * selectedDiscount.discountValue);
        }
      }
    }
    */
    const shippingFee = 60;
    const orderTotal = productTotal - discountAmount + shippingFee;
    if (orderSubtotalElement) orderSubtotalElement.textContent = `NT$ ${productTotal.toLocaleString()}`;
    if (orderShippingElement) orderShippingElement.textContent = `NT$ ${shippingFee.toLocaleString()}`;
    if (orderDiscountElement) orderDiscountElement.textContent = `-NT$ ${discountAmount.toLocaleString()}`;
    if (orderTotalElement) orderTotalElement.textContent = `NT$ ${orderTotal.toLocaleString()}`;
  }

  // 綁定事件
  bindEvents() {
    // 付款方式整條可點選
    const paymentMethods = document.querySelectorAll(".payment-method-header");
    paymentMethods.forEach((method) => {
      method.addEventListener("click", (e) => {
        const methodElement = method.closest(".payment-method");
        const methodId = methodElement.dataset.method;
        // 切換active樣式
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
        methodElement.classList.add('active');
        // 切換radio
        const radio = method.querySelector("input[type='radio']");
        if (radio) radio.checked = true;
      });
    });

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

    // 出貨方式選擇
    const shippingMethods = document.querySelectorAll(".shipping-method-header");
    shippingMethods.forEach((method) => {
      method.addEventListener("click", (e) => {
        const methodElement = method.closest(".shipping-method");
        document.querySelectorAll('.shipping-method').forEach(m => m.classList.remove('active'));
        methodElement.classList.add('active');
        const radio = method.querySelector("input[type='radio']");
        if (radio && !radio.checked) {
          radio.checked = true;
          handleCvsSelectVisibility(); // 只有在 radio 狀態真的有變化時才呼叫
        }
      });
    });

    // 仍保留 change 事件
    document.querySelectorAll('input[name="shipping-method"]').forEach(radio => {
      radio.addEventListener('change', handleCvsSelectVisibility);
    });

    // 門市選擇區塊插入與邏輯
    let all711Stores = [];
    let filteredStores = [];
    const cvsArea = document.getElementById('cvs-select-area');
    let citySelect, storeSelect;

    async function load711Stores() {
      if (all711Stores.length > 0) return;
      try {
        const resp = await fetch('data/711.json');
        all711Stores = await resp.json();
      } catch (e) {
        all711Stores = [];
      }
    }

    function renderCityOptions() {
      if (!citySelect) return;
      const cities = [...new Set(all711Stores.map(s => s.city))];
      citySelect.innerHTML = '<option value="">請選擇城市</option>' + cities.map(city => `<option value="${city}">${city}</option>`).join('');
      storeSelect.innerHTML = '<option value="">請先選擇城市</option>';
    }

    function renderStoreOptions() {
      if (!storeSelect) return;
      const city = citySelect.value;
      filteredStores = all711Stores.filter(s => s.city === city);
      storeSelect.innerHTML = '<option value="">請選擇門市</option>' + filteredStores.map(s => `<option value="${s.id}">${s.store}</option>`).join('');
    }

    function handleStoreSelected() {
      const storeId = storeSelect.value;
      const store = filteredStores.find(s => s.id === storeId);
      if (store) {
        document.getElementById('customer-address').value = store.address;
      }
    }

    async function handleCvsSelectVisibility() {
      console.trace('handleCvsSelectVisibility called');
      const selectedShipping = document.querySelector('input[name="shipping-method"]:checked').value;
      if (cvsArea) {
        cvsArea.innerHTML = ''; // 先清空，避免重複
      }
      if (selectedShipping === '2') {
        await load711Stores();
        // 建立下拉選單
        const cvsDiv = document.createElement('div');
        cvsDiv.innerHTML = `
          <label>選擇城市：<select id="city-select"></select></label>
          <label>選擇門市：<select id="store-select"></select></label>
        `;
        cvsArea.appendChild(cvsDiv);
        citySelect = document.getElementById('city-select');
        storeSelect = document.getElementById('store-select');
        citySelect.addEventListener('change', () => {
          renderStoreOptions();
          document.getElementById('customer-address').value = '';
        });
        storeSelect.addEventListener('change', handleStoreSelected);
        renderCityOptions();
        console.log('插入711門市下拉選單');
      } else {
        console.log('未選擇超商取貨，清空711門市下拉選單');
      }
    }

    // 頁面載入時同步一次
    handleCvsSelectVisibility();
  }

  // 驗證表單
  validateForm() {
    // 驗證客戶資訊
    const customerName = document.getElementById("customer-name").value.trim();
    const customerPhone = document.getElementById("customer-phone").value.trim();
    const customerEmail = document.getElementById("customer-email").value.trim();
    const customerAddress = document.getElementById("customer-address").value.trim();

    if (!customerName || !customerPhone || !customerEmail || (this.selectedPaymentMethod !== "cod-cvs" && !customerAddress)) {
      alert("請填寫完整的訂購人資訊");
      return false;
    }

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      alert("請輸入有效的電子郵件地址");
      return false;
    }

    // 超商取貨付款時必須選擇門市
    if (this.selectedPaymentMethod === "cod-cvs" && !this.selectedCvsStore) {
      alert("請選擇超商門市");
      return false;
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
    if (this.selectedPaymentMethod === "line-pay") {
      this.processServerPayment(orderData);
    } else if (this.selectedPaymentMethod === "cod-home" || this.selectedPaymentMethod === "cod-cvs") {
      this.processCODPayment(orderData);
    }
  }

  // 收集訂單資訊
  collectOrderData() {
    // 會員ID
    const memberInfo = sessionStorage.getItem('currentMember');
    const member = memberInfo ? JSON.parse(memberInfo) : null;
    const memId = member ? member.mem_id : null;
    console.log('取得會員ID:', memId);

    // 收件人資訊
    const orderName = document.getElementById("customer-name").value.trim();
    const orderPhone = document.getElementById("customer-phone").value.trim();
    const orderEmail = document.getElementById("customer-email").value.trim();
    const orderShippingAddress = document.getElementById("customer-address").value.trim();
    const shopOrderNote = document.getElementById("customer-note").value.trim();

    // 出貨方式
    let shopOrderShipment = 1; // 1: 賣家宅配, 2: 超商取貨
    const shippingRadio = document.querySelector('input[name="shipping-method"]:checked');
    if (shippingRadio) {
      if (shippingRadio.value === '1') {
        shopOrderShipment = 1;
      } else if (shippingRadio.value === '2') {
        shopOrderShipment = 2;
      }
    }
    // 付款方式
    let shopOrderPayment = 1; // 1: LINE Pay, 2: 宅配取貨付款, 3: 超商取貨付款
    if (this.selectedPaymentMethod === 'line-pay') shopOrderPayment = 1;
    else if (this.selectedPaymentMethod === 'cod-home') shopOrderPayment = 2;
    else if (this.selectedPaymentMethod === 'cod-cvs') shopOrderPayment = 3;
    const shopOrderShipFee = 60; // 固定運費

    // 折扣碼
    const discountCodeId = document.getElementById('discount-code')?.value || null;

    // 訂單明細（直接從購物車取得）
    const detailsDto = this.cartItems.map(item => ({
      prodId: item.prodId,
      prodColorId: item.prodColorId,
      prodSpecId: item.prodSpecId,
      shopOrderQty: item.cartProdQty
    }));

    return {
      memId,
      shopOrderShipment,
      shopOrderShipFee,
      shopOrderPayment,
      orderName,
      orderEmail,
      orderPhone,
      orderShippingAddress,
      shopOrderNote,
      shopOrderStatus: 0,
      shopReturnApply: 0,
      shopOrderShipDate: null,
      discountCodeId,
      detailsDto
    };
  }

  // 處理伺服器付款
  async processServerPayment(orderData) {
    console.log("處理伺服器付款", orderData);

    try {
      // 從伺服器獲取訂單ID
      const orderId = await this.getOrderIdFromServer();
      if (!orderId) {
        throw new Error("無法獲取訂單ID");
      }

      // 準備商品資訊（僅商品明細，不含房型/加購/天數等）
      const products = this.cartItems.map(item => ({
        name: item.prodName || item.name || `商品ID:${item.prodId}`,
        quantity: item.cartProdQty,
        price: item.prodPrice
      }));

      // 計算總金額
      const totalAmount = this.cartItems.reduce((sum, item) => sum + (item.prodPrice * item.cartProdQty), 0);

      // 構建付款請求參數（保留原有付款/交易相關程式碼）
      const linepay_body = {
        amount: totalAmount,
        currency: "TWD",
        orderId: orderId,
        packages: [
          {
            id: "pkg-001",
            amount: totalAmount,
            products: products,
          },
        ],
        redirectUrls: {
          confirmUrl:
            `${window.api_prefix}/api/confirmpayment/` +
            orderId +
            "/true",
          cancelUrl: `${window.api_prefix}/linepay-cancel.html`,
        },
      };

      // 組商品訂單 DTO 所需欄位
      // 會員ID、收件人資訊、付款/出貨方式、折扣碼等都來自使用者互動
      const memberInfo = sessionStorage.getItem('memberInfo');
      const memId = memberInfo ? JSON.parse(memberInfo).memId : null;
      const orderName = document.getElementById('receiver-name').value;
      const orderEmail = document.getElementById('receiver-email').value;
      const orderPhone = document.getElementById('receiver-phone').value;
      const orderShippingAddress = document.getElementById('receiver-address').value;
      const shopOrderNote = document.getElementById('order-note').value;
      const shopOrderShipDate = document.getElementById('ship-date').value; // yyyy-MM-ddTHH:mm
      const shopOrderShipment = Number(document.querySelector('input[name="shipment"]:checked').value);
      const shopOrderPayment = Number(document.querySelector('input[name="payment"]:checked').value);
      const discountCodeId = document.getElementById('discount-code').value || null;
      const shopOrderStatus = 0;
      const shopReturnApply = 0;
      const shopOrderShipFee = 60;
      const detailsDto = this.cartItems.map(item => ({
        prodId: item.prodId,
        shopOrderQty: item.cartProdQty,
        prodSpecId: item.prodSpecId,
        prodColorId: item.prodColorId
      }));

      const shopOrderData = {
        memId,
        shopOrderShipment,
        shopOrderShipFee,
        discountCodeId,
        shopOrderPayment,
        orderName,
        orderEmail,
        orderPhone,
        orderShippingAddress,
        shopOrderNote,
        shopOrderShipDate,
        shopOrderStatus,
        shopReturnApply,
        detailsDto
      };

      // 保留付款請求參數與交易流程
      const requestBody = {
        linepayBody: linepay_body,
        shopOrder: shopOrderData,
      };

      console.log("付款請求參數:", requestBody);
      console.log("shopOrder:", shopOrderData);

      // 發送請求到伺服器
      const paymentUrl = await this.sendPaymentRequest(requestBody);
      console.log("paymentUrl:" + paymentUrl);

      if (paymentUrl) {
        // 儲存訂單資訊到 localStorage，以便在付款成功後處理
        localStorage.setItem(
          "pendingOrder",
          JSON.stringify({
            orderId: orderId,
            items: this.cartItems,
            totalPrice: totalAmount,
            customer: orderData.customer,
          })
        );

        // 跳轉到付款頁面
        window.location.href = paymentUrl;
      } else {
        throw new Error("無法獲取付款網址");
      }
    } catch (error) {
      console.error("付款請求失敗:", error);
      this.hidePaymentProcessingModal();
      this.handlePaymentFailure({
        errorCode: "API_ERROR",
        errorMessage:
          error.message || "無法連接到付款服務，請檢查網路連接或稍後再試。",
      });
    }
  }

  // 從伺服器獲取訂單ID
  async getOrderIdFromServer() {
    try {
      const response = await fetch(
        `${window.api_prefix}/api/campsite/newordernumber`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json_data = await response.json();
      const new_order_num = json_data.data;
      console.log("newOrderNumber:" + new_order_num);

      return new_order_num;
    } catch (error) {
      console.error("獲取訂單ID失敗:", error);
      return null;
    }
  }

  // 發送付款請求到伺服器
  async sendPaymentRequest(requestBody) {
    try {
      const response = await fetch(
        `${window.api_prefix}/api/linepay/true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("付款回應:", data);

      // 返回付款網址
      return data.data;
    } catch (error) {
      console.error("發送付款請求失敗:", error);
      return null;
    }
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

    // 清空購物車和加購商品
    this.clearCart();

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
      bundleItems: this.bundleItems,
      totalPrice: this.totalPrice,
      customer: {
        name: document.getElementById("customer-name").value.trim(),
        phone: document.getElementById("customer-phone").value.trim(),
        email: document.getElementById("customer-email").value.trim(),
        address: document.getElementById("customer-address").value.trim(),
        note: document.getElementById("customer-note").value.trim(),
      },
      createdAt: new Date().toISOString(),
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

  // 新增處理貨到付款方法
  processCODPayment(orderData) {
    // 模擬處理流程
    setTimeout(() => {
      this.hidePaymentProcessingModal();
      this.showPaymentResultModal(true, {
        orderNumber: Math.floor(Math.random() * 1000000)
      });
    }, 1200);
  }

  // 清空購物車（已登入呼叫API，未登入用sessionCartManager）
  async clearCart() {
    let memberInfo = localStorage.getItem('currentMember') || sessionStorage.getItem('currentMember');
    let memId = null;
    if (memberInfo) {
      try {
        const member = JSON.parse(memberInfo);
        memId = member.mem_id || member.memId;
      } catch (e) {}
    }
    if (memId) {
      try {
        await fetch(`${window.api_prefix}/api/clearCart?memId=${memId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {}
    } else if (window.sessionCartManager) {
      window.sessionCartManager.clearCart();
    }
  }
}

// 頁面載入完成後初始化結帳頁面
document.addEventListener("DOMContentLoaded", () => {
  new CheckoutManager();
});