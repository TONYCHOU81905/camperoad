class CheckoutManager {
  constructor() {
    this.memId = null;
    this.init();
  }

  async init() {
    let memberInfo = localStorage.getItem('currentMember') || sessionStorage.getItem('currentMember');
    if (memberInfo) {
      try {
        const member = JSON.parse(memberInfo);
        this.memId = member.mem_id || member.memId;
        console.log('初始化會員ID:', this.memId, '原始 memberInfo:', memberInfo);
      } catch (e) {
        console.error('解析會員資料失敗:', e);
      }
    }
    if (!this.memId) {
      console.log('未找到會員資料，跳轉到登入頁面');
      window.location.href = 'login.html';
      return;
    }
    let cartItems = [];
    try {
      const response = await fetch(`${window.api_prefix}/api/getCart?memId=${this.memId}`);
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
    this.selectedPaymentMethod = "1";
    this.selectedCvsStore = null;
    this.isProcessing = false;
    await this.loadUserDiscounts();
    if (this.cartItems.length === 0) {
      window.location.href = "shop_cart.html";
      return;
    }
    this.renderOrderSummary();
    this.bindEvents();
  }

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
    const productTotal = this.cartItems.reduce((sum, item) => sum + (item.prodPrice * item.cartProdQty), 0);
    let discountAmount = 0;
    const discountSelect = document.getElementById('discount-select');

    let discountCodeId = discountSelect ? discountSelect.value : null;
    console.log('discountSelect 狀態:', {
      discountSelectExists: !!discountSelect,
      discountCodeId: discountCodeId || '未選擇折價券',
      discountMapExists: !!this.discountMap
    });
    
    // 折扣計算邏輯
    if (discountCodeId && this.discountMap && this.discountMap[discountCodeId]) {
      const discount = this.discountMap[discountCodeId];
      if (discount.discountType === 0) {
        // 金額折抵
        discountAmount = Math.min(discount.discountValue, productTotal);
      } else if (discount.discountType === 1) {
        // 百分比折扣（四捨五入）
        discountAmount = Math.round(productTotal * discount.discountValue);
      }
    }

    this.discountAmount = discountAmount; // 記錄最新折扣金額
    this.productTotal = productTotal; // 儲存商品總額

    const shippingFee = 60;
    const orderTotal = productTotal - discountAmount + shippingFee;
    if (orderSubtotalElement) orderSubtotalElement.textContent = `NT$ ${productTotal.toLocaleString()}`;
    if (orderShippingElement) orderShippingElement.textContent = `NT$ ${shippingFee.toLocaleString()}`;
    if (orderDiscountElement) orderDiscountElement.textContent = `-NT$ ${discountAmount.toLocaleString()}`;
    if (orderTotalElement) orderTotalElement.textContent = `NT$ ${orderTotal.toLocaleString()}`;
   
 
  }

  bindEvents() {
    const paymentMethods = document.querySelectorAll(".payment-method-header");
    paymentMethods.forEach((method) => {
      method.addEventListener("click", (e) => {
        const methodElement = method.closest(".payment-method");
        const radio = method.querySelector("input[name='payment-method']");
        this.selectedPaymentMethod = radio.value;
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
        methodElement.classList.add('active');
        if (radio) radio.checked = true;
        console.log('選擇的付款方式 (點擊):', this.selectedPaymentMethod);
      });
    });

    document.querySelectorAll("input[name='payment-method']").forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.selectedPaymentMethod = e.target.value;
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
        e.target.closest('.payment-method').classList.add('active');
        console.log('Radio 選擇的付款方式:', this.selectedPaymentMethod);
      });
    });

    const submitPaymentBtn = document.getElementById("submit-payment");
    if (submitPaymentBtn) {
      submitPaymentBtn.addEventListener("click", () => this.processPayment());
    }

    const viewOrderBtn = document.getElementById("view-order");
    if (viewOrderBtn) {
      viewOrderBtn.addEventListener("click", () => {
        window.location.href = "user-profile.html";
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

    const shippingMethods = document.querySelectorAll(".shipping-method-header");
    shippingMethods.forEach((method) => {
      method.addEventListener("click", (e) => {
        const methodElement = method.closest(".shipping-method");
        document.querySelectorAll('.shipping-method').forEach(m => m.classList.remove('active'));
        methodElement.classList.add('active');
        const radio = method.querySelector("input[name='shipping-method']");
        if (radio && !radio.checked) {
          radio.checked = true;
          handleCvsSelectVisibility.call(this);
        }
      });
    });

    document.querySelectorAll('input[name="shipping-method"]').forEach(radio => {
      radio.addEventListener('change', handleCvsSelectVisibility.bind(this));
    });

    let all711Stores = [];
    let filteredStores = [];
    const cvsArea = document.getElementById('cvs-select-area');
    let citySelect, storeSelect;

    async function load711Stores() {
      if (all711Stores.length > 0) return;
      try {
        const resp = await fetch('data/711.json');
        all711Stores = await resp.json();
        console.log('載入711門市資料:', all711Stores);
      } catch (e) {
        console.error('載入711門市資料失敗:', e);
        all711Stores = [];
      }
    }

    function renderCityOptions() {
      if (!citySelect) {
        console.error('citySelect 未定義');
        return;
      }
      const cities = [...new Set(all711Stores.map(s => s.city))];
      citySelect.innerHTML = '<option value="">請選擇城市</option>' + cities.map(city => `<option value="${city}">${city}</option>`).join('');
      storeSelect.innerHTML = '<option value="">請先選擇城市</option>';
      console.log('渲染城市選單:', cities);
    }

    function renderStoreOptions() {
      if (!storeSelect) {
        console.error('storeSelect 未定義');
        return;
      }
      const city = citySelect.value;
      filteredStores = all711Stores.filter(s => s.city === city);
      storeSelect.innerHTML = '<option value="">請選擇門市</option>' + filteredStores.map(s => `<option value="${s.id}">${s.store}</option>`).join('');
      console.log('渲染門市選單，城市:', city, '門市數:', filteredStores.length);
    }

    function handleStoreSelected() {
      const storeId = storeSelect.value;
      const store = filteredStores.find(s => s.id === storeId);
      if (store) {
        document.getElementById('customer-address').value = store.address;
        this.selectedCvsStore = storeId;
        console.log('選擇的門市:', this.selectedCvsStore);
      } else {
        this.selectedCvsStore = null;
        document.getElementById('customer-address').value = '';
        console.log('未選擇有效門市，重置門市選擇');
      }
    }

    async function handleCvsSelectVisibility() {
      console.log('執行 handleCvsSelectVisibility');
      const selectedShipping = document.querySelector('input[name="shipping-method"]:checked')?.value;
      console.log('選擇的出貨方式:', selectedShipping);
      if (!cvsArea) {
        console.error('cvs-select-area 元素未找到');
        return;
      }
      cvsArea.innerHTML = '';
      if (selectedShipping === '2') {
        await load711Stores();
        if (all711Stores.length === 0) {
          console.error('無可用門市資料');
          alert('無法載入門市資料，請稍後再試');
          return;
        }
        const cvsDiv = document.createElement('div');
        cvsDiv.innerHTML = `
          <label>選擇城市：<select id="city-select"></select></label>
          <label>選擇門市：<select id="store-select"></select></label>
        `;
        cvsArea.appendChild(cvsDiv);
        citySelect = document.getElementById('city-select');
        storeSelect = document.getElementById('store-select');
        if (!citySelect || !storeSelect) {
          console.error('下拉選單未正確生成');
          return;
        }
        citySelect.addEventListener('change', () => {
          renderStoreOptions();
          document.getElementById('customer-address').value = '';
          this.selectedCvsStore = null;
          console.log('城市選擇變更，重置門市:', this.selectedCvsStore);
        });
        storeSelect.addEventListener('change', handleStoreSelected.bind(this));
        renderCityOptions();
        console.log('插入711門市下拉選單');
      } else {
        this.selectedCvsStore = null;
        console.log('未選擇超商取貨，清空門市選擇');
      }
    }

    handleCvsSelectVisibility.call(this);

    // 新增：同會員資訊按鈕
    const fillMemberBtn = document.getElementById('fill-member-info');
    if (fillMemberBtn) {
      fillMemberBtn.addEventListener('click', () => {
        let memberInfo = localStorage.getItem('currentMember') || sessionStorage.getItem('currentMember');
        if (memberInfo) {
          try {
            const member = JSON.parse(memberInfo);
            document.getElementById('customer-name').value = member.memName || '';
            // 手機號碼格式化
            let mobile = member.memMobile || '';
            mobile = mobile.replace(/\D/g, ''); // 移除所有非數字
            document.getElementById('customer-phone').value = mobile;
            document.getElementById('customer-email').value = member.memEmail || '';
            document.getElementById('customer-address').value = member.memAddr || '';
          } catch (e) {
            alert('會員資料解析失敗');
          }
        } else {
          alert('找不到會員資料');
        }
      });
    }
  }

  validateForm() {
    const customerName = document.getElementById("customer-name").value.trim();
    const customerPhone = document.getElementById("customer-phone").value.trim();
    const customerEmail = document.getElementById("customer-email").value.trim();
    const customerAddress = document.getElementById("customer-address").value.trim();

    if (!customerName || !customerPhone || !customerEmail) {
      alert("請填寫完整的收件人資訊");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      alert("請輸入有效的電子郵件地址");
      return false;
    }

    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(customerPhone)) {
      alert("請輸入有效的手機號碼");
      return false;
    }

    if (this.selectedPaymentMethod === "3") {
      const storeSelect = document.getElementById('store-select');
      if (!this.selectedCvsStore || (storeSelect && storeSelect.value === '')) {
        alert("請選擇超商門市");
        return false;
      }
      console.log('驗證時的門市:', this.selectedCvsStore);
    } else if (!customerAddress) {
      alert("請輸入宅配地址");
      return false;
    }

    return true;
  }

  processPayment() {
    if (this.isProcessing) return;

    if (!this.validateForm()) return;

    this.isProcessing = true;
    this.showPaymentProcessingModal();

    const orderData = this.collectOrderData();

    console.log('處理付款，選擇的付款方式:', this.selectedPaymentMethod, '傳送的 orderData:', orderData);
    if (this.selectedPaymentMethod === "1") {
      this.processServerPayment(orderData, false);
    } else if (this.selectedPaymentMethod === "2" || this.selectedPaymentMethod === "3") {
      this.processCODPayment(orderData);
    } else {
      console.error('未知的付款方式:', this.selectedPaymentMethod);
      this.isProcessing = false;
      this.hidePaymentProcessingModal();
      this.handlePaymentFailure({
        errorCode: 'INVALID_PAYMENT_METHOD',
        errorMessage: '無效的付款方式，請重新選擇'
      });
    }
  }

  collectOrderData() {
    console.log('收集訂單資料，當前 memId:', this.memId);
    const orderName = document.getElementById("customer-name").value.trim();
    const orderPhone = document.getElementById("customer-phone").value.trim();
    const orderEmail = document.getElementById("customer-email").value.trim();
    const orderShippingAddress = document.getElementById("customer-address").value.trim();
    const shopOrderNote = document.getElementById("customer-note").value.trim();

    let shopOrderShipment = 1;
    const shippingRadio = document.querySelector('input[name="shipping-method"]:checked');
    if (shippingRadio) {
      shopOrderShipment = Number(shippingRadio.value);
    }

    let shopOrderPayment = 1;
    if (this.selectedPaymentMethod === '1') shopOrderPayment = 1;
    else if (this.selectedPaymentMethod === '2') shopOrderPayment = 2;
    else if (this.selectedPaymentMethod === '3') shopOrderPayment = 3;

    const shopOrderShipFee = 60;
    const discountCodeId = document.getElementById('discount-select')?.value || null;

    const detailsDto = this.cartItems.map(item => ({
      prodId: item.prodId,
      prodColorId: item.prodColorId,
      prodSpecId: item.prodSpecId,
      shopOrderQty: item.cartProdQty
    }));

    return {
      memId: Number(this.memId), // 確保傳遞數值型
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

  async processServerPayment(orderData, isCamp = false) {
    console.log("處理伺服器付款", orderData);
    try {
      const shippingFee = 60;
      const discountAmount = this.discountAmount || 0;
      
      
      // 檢查 this.productTotal 是否存在
      if (typeof this.productTotal !== 'number') {
        console.error('productTotal 未定義，重新計算');
        this.productTotal = this.cartItems.reduce((sum, item) => sum + (item.prodPrice * item.cartProdQty), 0);
      }

      const totalAmount = this.productTotal + shippingFee - discountAmount;

      // 開頭日誌，確認變數狀態
      console.log('processServerPayment 初始狀態:', {
        productTotal: this.productTotal,
        shippingFee,
        discountAmount,
        totalAmount
      });

      // 驗證總額
      if (totalAmount <= 0) {
        throw new Error('支付總額必須大於 0，請檢查折扣金額');
      }


      const packages = [
        {
          id: "pkg-total",
          amount: totalAmount,
          products: [{
            name: "商品總額",
            quantity: 1,
            price: totalAmount
          }]
        }
      ];

      const linepayBody = {
        amount: totalAmount,
        currency: "TWD",
        packages,
        redirectUrls: {
          confirmUrl: `${window.api_prefix}/api/confirmpayment/{orderId}/${isCamp}`,
          cancelUrl: `${window.api_prefix}/linepay-cancel.html`
        }
      };

      // 驗證 packages 總和
      const packageTotal = linepayBody.packages.reduce((sum, pkg) => sum + pkg.amount, 0);
      console.log('LinePay 總額驗證:', {
        linepayBodyAmount: linepayBody.amount,
        packageTotal: packageTotal,
        isValid: packageTotal === linepayBody.amount,
        productTotal: this.productTotal,
        shippingFee,
        discountAmount
      });

      if (packageTotal !== linepayBody.amount) {
        throw new Error('Packages 總額與 linepayBody.amount 不一致');
      }

      // 驗證每個 package.amount 是否為正數
      const invalidPackage = packages.find(pkg => pkg.amount <= 0);
      if (invalidPackage) {
        throw new Error(`無效的 package.amount: ${invalidPackage.id} 的金額為 ${invalidPackage.amount}`);
      }

      const requestBody = {
        linepayBody,
        linepayOrder: orderData
      };

      console.log("付款請求參數:", requestBody);

      const response = await fetch(`${window.api_prefix}/api/linepay/${isCamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.isProcessing = false;
      this.hidePaymentProcessingModal();

      if (result.status === 'success' && result.data) {
        window.location.href = result.data;
      } else {
        throw new Error(result.message || "無法獲取付款網址");
      }
    } catch (error) {
      console.error("付款請求失敗:", error);
      this.isProcessing = false;
      this.hidePaymentProcessingModal();
      this.handlePaymentFailure({
        errorCode: "API_ERROR",
        errorMessage: error.message || "無法連接到付款服務，請檢查網路連接或稍後再試。",
      });
    }
  }

  async processCODPayment(orderData) {
    console.log('執行 processCODPayment, orderData:', orderData);
    try {
      const response = await fetch(`${window.api_prefix}/api/addShopOrderCOD`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 回應:', errorText);
        throw new Error(`訂單新增失敗: ${response.status}, ${errorText}`);
      }

      const result = await response.json();
      if (result.status !== 'success') {
        console.error('後端回應:', result);
        throw new Error(result.message || '訂單新增失敗');
      }

      await this.clearCart();

      // 顯示付款完成
      this.isProcessing = false;
      this.hidePaymentProcessingModal();
      document.getElementById("payment-success").classList.add("active");
      document.getElementById("payment-failure").classList.remove("active");
      this.showPaymentResultModal();

    } catch (error) {
      console.error('貨到付款處理失敗:', error);
      this.isProcessing = false;
      this.hidePaymentProcessingModal();
      this.handlePaymentFailure({
        errorCode: 'COD_ERROR',
        errorMessage: error.message || '貨到付款處理失敗，請稍後再試',
      });
    }
  }

  handlePaymentSuccess(result) {
    console.log("付款成功", result);
    this.isProcessing = false;
    this.hidePaymentProcessingModal();
    document.getElementById("order-number").textContent = result.orderId;
    const successElement = document.getElementById("payment-success");
    const failureElement = document.getElementById("payment-failure");
    successElement.classList.add("active");
    failureElement.classList.remove("active");
    this.showPaymentResultModal();
    this.clearCart();
  }

  handlePaymentFailure(error) {
    console.error("付款失敗", error);
    this.isProcessing = false;
    this.hidePaymentProcessingModal();
    document.getElementById("failure-reason").textContent = error.errorMessage;
    const successElement = document.getElementById("payment-success");
    const failureElement = document.getElementById("payment-failure");
    successElement.classList.remove("active");
    failureElement.classList.add("active");
    this.showPaymentResultModal();
  }

  showPaymentProcessingModal() {
    const modal = document.getElementById("payment-processing-modal");
    modal.classList.add("active");
  }

  hidePaymentProcessingModal() {
    const modal = document.getElementById("payment-processing-modal");
    modal.classList.remove("active");
  }

  showPaymentResultModal() {
    const modal = document.getElementById("payment-result-modal");
    modal.classList.add("active");
  }

  hidePaymentResultModal() {
    const modal = document.getElementById("payment-result-modal");
    modal.classList.remove("active");
  }

  async clearCart() {
    if (this.memId) {
      try {
        await fetch(`${window.api_prefix}/api/clearCart?memId=${this.memId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        console.error('清空購物車失敗:', e);
      }
    } else if (window.sessionCartManager) {
      window.sessionCartManager.clearCart();
    }
  }

  // 載入會員可用折價券
  async loadUserDiscounts() {
    this.discountMap = {}; // 初始化空物件
    try {
      console.log('memId:', this.memId);
      const discountSelect = document.getElementById('discount-select');
      const discountInfoDiv = document.getElementById('discount-info');
      if (!discountSelect) {
        console.error('discount-select 元素未找到');
        return;
      }
      // 取得會員擁有的折價券ID
      const userDiscountResp = await fetch(`${window.api_prefix}/api/userdiscount/search/${this.memId}`);
      const userDiscountData = await userDiscountResp.json();
      console.log('userDiscountData:', userDiscountData);
      const userDiscounts = Array.isArray(userDiscountData) ? userDiscountData : [];
      console.log('userDiscounts:', userDiscounts);
      if (userDiscounts.length === 0) {
        discountSelect.innerHTML = '<option value="">無可用折價券</option>';
        discountInfoDiv.textContent = '';
        return;
      }
      // 取得所有折價券詳細資料
      const allDiscountResp = await fetch(`${window.api_prefix}/api/discount/all`);
      const allDiscountData = await allDiscountResp.json();
      console.log('allDiscountData:', allDiscountData);
      // 建立折價券ID到詳細資料的對照表
      allDiscountData.forEach(d => {
        this.discountMap[d.discountCodeId] = d; // 使用 this.discountMap
      });
      console.log('discountMap:', this.discountMap);
      // 渲染下拉選單
      discountSelect.innerHTML = '<option value="">請選擇折價券</option>' +
        userDiscounts.map(d => {
          const detail = this.discountMap[d.discountCodeId];
          if (!detail) return '';
          return `<option value="${detail.discountCodeId}">${detail.discountCode}（${detail.discountExplain}）</option>`;
        }).join('');
      // 綁定選擇事件
      discountSelect.addEventListener('change', () => {
        const selectedId = discountSelect.value;
        console.log('目前選到的 discountCodeId:', selectedId);
        if (selectedId && this.discountMap && this.discountMap[selectedId]) {
          const d = this.discountMap[selectedId];
          let typeText = d.discountType === 0 ? `折抵金額：NT$${d.discountValue}` : `折扣：${d.discountValue * 100}%`;
          discountInfoDiv.textContent = `${d.discountExplain}｜${typeText}`;
        } else {
          discountInfoDiv.textContent = '';
          console.log('未選擇有效折價券或 discountMap 未初始化');
        }
        this.renderOrderSummary(); // 重新渲染
      });
    } catch (e) {
      console.error('載入折價券失敗:', e);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CheckoutManager();
});