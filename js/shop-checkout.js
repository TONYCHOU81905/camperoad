//LINE PAY:
// Channel ID: 1656895462
// Channel Secret Key:fd01e635b9ea97323acbe8d5c6b2fb71

// 結帳頁面管理
class CheckoutManager {
  constructor() {
    if (cartManager.isInitialized()) {
      this.init();
    } else {
      console.log("等待CartManager初始化完成...");
      document.addEventListener("cartManagerInitialized", () => {
        console.log("CartManager初始化完成，開始初始化CheckoutManager");
        this.init();
      });
    }
  }

  async init() {
    // 取得會員ID
    const memberInfo = sessionStorage.getItem('currentMember');
    let memId = memberInfo ? JSON.parse(memberInfo).mem_id : null; 
    if (!memId) {
      window.location.href = 'login.html';
      return;
    }
    // 折扣碼下拉選單載入（先查會員擁有，再查全部折扣碼，前端比對）
    try {
      // 1. 取得會員擁有的折扣碼ID
      const userDiscountResp = await fetch(`http://localhost:8081/CJA101G02/api/userdiscount/search/${memId}`);
      const userDiscountData = await userDiscountResp.json();
      console.log('userDiscountData', userDiscountData);
      const userDiscountIds = Array.isArray(userDiscountData) ? userDiscountData.map(d => d.id.discountCodeId) : [];
      // 2. 取得所有折扣碼詳細資料  
      const discountResp = await fetch('http://localhost:8081/CJA101G02/api/discount');
      const discountData = await discountResp.json();
      console.log('discountData', discountData);
      this.allDiscounts = Array.isArray(discountData) ? discountData : [];
      // 3. 過濾出會員可用的折扣碼詳細資料
      const userDiscounts = this.allDiscounts.filter(d => userDiscountIds.includes(d.discountCodeId));
      // 4. 渲染下拉選單
      const select = document.getElementById('discount-code');
      if (select) {
        select.innerHTML = '<option value="">請選擇折扣碼</option>' +
          userDiscounts.map(d =>
            `<option value="${d.discountCodeId}" data-type="${d.discountType}" data-value="${d.discountValue}">
              ${d.discountCode}（${d.discountExplain}）
            </option>`
          ).join('');
        // 折扣碼選擇時即時更新訂單摘要
        select.addEventListener('change', () => this.renderOrderSummary());
      }
    } catch (e) {}
    // 從API取得購物車資料
    let cartItems = [];

    try {
      const response = await fetch(`http://localhost:8081/CJA101G02/api/getCart?memId=${memId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          cartItems = data.data;
        }
      }
    } catch (e) {}
    // 直接使用API取得的商品資料
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

    // 清空容器
    orderItemsContainer.innerHTML = "";

    // 渲染訂單項目（直接從購物車取得）
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

    // 金額計算
    const productTotal = this.cartItems.reduce((sum, item) => sum + (item.prodPrice * item.cartProdQty), 0);

    // 折扣金額計算（舉例，實際要根據折扣碼型態）
    let discountAmount = 0;
    const discountCodeSelect = document.getElementById('discount-code');
    if (discountCodeSelect && discountCodeSelect.value) {
      const selectedDiscount = this.allDiscounts.find(d => d.discountCodeId === discountCodeSelect.value);
      if (selectedDiscount) {
        if (selectedDiscount.discountType === 0) {
          discountAmount = selectedDiscount.discountValue;
        } else if (selectedDiscount.discountType === 1) {
          discountAmount = Math.round(productTotal * selectedDiscount.discountValue);
        }
      }
    }

    const shippingFee = 60;
    const orderTotal = productTotal - discountAmount + shippingFee;

    // 訂單摘要渲染
    if (orderSubtotalElement) orderSubtotalElement.textContent = `NT$ ${productTotal.toLocaleString()}`;
    if (orderShippingElement) orderShippingElement.textContent = `NT$ ${shippingFee.toLocaleString()}`;
    if (orderDiscountElement) orderDiscountElement.textContent = `-NT$ ${discountAmount.toLocaleString()}`;
    if (orderTotalElement) orderTotalElement.textContent = `NT$ ${orderTotal.toLocaleString()}`;
  }

  // 綁定事件
  bindEvents() {
    // 付款方式選擇
    const paymentMethods = document.querySelectorAll(".payment-method-header");
    paymentMethods.forEach((method) => {
      method.addEventListener("click", (e) => {
        const methodElement = method.closest(".payment-method");
        const methodId = methodElement.dataset.method;
        this.selectPaymentMethod(methodId);
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

    // 超商門市選擇
    const selectCvsBtn = document.getElementById("select-cvs-store");
    if (selectCvsBtn) {
      selectCvsBtn.addEventListener("click", async () => {
        // 呼叫ECPay門市API
        try {
          const resp = await fetch("https://logistics-stage.ecpay.com.tw/Helper/GetStoreList", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              MerchantID: "2000132", // 測試用
              LogisticsType: "CVS",
              LogisticsSubType: "UNIMART", // 可根據需求切換7-11/全家/萊爾富/OK等
              IsCollection: "N"
            })
          });
          const result = await resp.json();
          if (result && result.length > 0) {
            // 這裡僅做簡單選擇第一家，實際應彈窗讓用戶選
            const store = result[0];
            document.getElementById("selected-cvs-store").textContent = `已選擇：${store.StoreName} (${store.StoreAddress})`;
            // 你可將store資料存到this.selectedCvsStore
            this.selectedCvsStore = store;
          } else {
            document.getElementById("selected-cvs-store").textContent = "查無門市，請稍後再試";
          }
        } catch (err) {
          document.getElementById("selected-cvs-store").textContent = "門市查詢失敗";
        }
      });
    }

    // 出貨方式選擇
    const shippingMethods = document.querySelectorAll(".shipping-method-header");
    shippingMethods.forEach((method) => {
      method.addEventListener("click", (e) => {
        const methodElement = method.closest(".shipping-method");
        const methodId = methodElement.dataset.method;
        // 切換active樣式
        document.querySelectorAll('.shipping-method').forEach(m => m.classList.remove('active'));
        methodElement.classList.add('active');
        // 切換radio
        const radio = method.querySelector("input[type='radio']");
        if (radio) radio.checked = true;
      });
    });
  }

  // 選擇付款方式
  selectPaymentMethod(methodId) {
    this.selectedPaymentMethod = methodId;

    // 更新UI
    const paymentMethods = document.querySelectorAll(".payment-method");
    paymentMethods.forEach((method) => {
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

    // 切換地址/超商門市選擇UI
    const addressInput = document.getElementById("customer-address");
    const cvsSelectDiv = document.getElementById("cvs-store-select");
    if (methodId === "cod-cvs") {
      if (addressInput) addressInput.style.display = "none";
      if (cvsSelectDiv) cvsSelectDiv.style.display = "block";
    } else {
      if (addressInput) addressInput.style.display = "";
      if (cvsSelectDiv) cvsSelectDiv.style.display = "none";
    }
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

    // 出貨方式、付款方式、運費
    const shopOrderShipment = Number(document.querySelector('input[name="shipping-method"]:checked')?.value || 1);
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
            "http://localhost:8081/CJA101G02/api/confirmpayment/" +
            orderId +
            "/true",
          cancelUrl: "http://127.0.0.1:5501/linepay-cancel.html",
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
        "http://localhost:8081/CJA101G02/api/campsite/newordernumber"
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
        "http://localhost:8081/CJA101G02/api/linepay/true",
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
    cartManager.clearAll();

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
      totalPrice: cartManager.getTotalPrice(),
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
}

// 頁面載入完成後初始化結帳頁面
document.addEventListener("DOMContentLoaded", () => {
  new CheckoutManager();
});
