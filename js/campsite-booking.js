/**
 * 營地預訂頁面 JavaScript
 */

document.addEventListener("DOMContentLoaded", function () {
  // 初始化頁面
  initBookingPage();
});

/**
 * 初始化預訂頁面
 */
function initBookingPage() {
  // 解析 URL 參數並填充預訂資訊
  parseUrlParams();

  // 初始化加購項目事件監聽
  initAddonItems();

  // 初始化折扣碼應用
  initDiscountCode();

  // 初始化付款方式切換
  initPaymentMethods();

  // 初始化表單提交
  initFormSubmission();

  // 初始化模態框關閉按鈕
  initModalClose();

  // 更新價格摘要
  updatePriceSummary();
}

/**
 * 解析 URL 參數並填充預訂資訊
 */
function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);

  // 獲取營地 ID
  const campsiteId = urlParams.get("id");

  // 獲取日期參數
  const checkInDate = urlParams.get("checkin");
  const checkOutDate = urlParams.get("checkout");
  const guests = urlParams.get("guests");
  const tentType = urlParams.get("tent");

  // 如果有日期參數，填充預訂資訊
  if (checkInDate && checkOutDate) {
    // 格式化日期顯示
    const formattedCheckIn = formatDate(checkInDate);
    const formattedCheckOut = formatDate(checkOutDate);

    // 計算住宿天數
    const nights = calculateNights(checkInDate, checkOutDate);

    // 填充預訂資訊
    document.getElementById("display-check-in").textContent = formattedCheckIn;
    document.getElementById("display-check-out").textContent =
      formattedCheckOut;
    document.getElementById("stay-nights").textContent = `${nights}晚`;

    // 設置隱藏欄位的值
    document.getElementById("check-in-date").value = checkInDate;
    document.getElementById("check-out-date").value = checkOutDate;

    // 獲取營地資訊
    fetchCampsiteInfo(campsiteId, nights, tentType);
  } else {
    // 如果沒有日期參數，顯示錯誤或重定向
    console.error("缺少必要的日期參數");
    // 可以選擇重定向到詳情頁
    // window.location.href = 'campsite-detail.html?id=' + campsiteId;
  }
}

/**
 * 格式化日期顯示
 * @param {string} dateString - 日期字符串 (YYYY-MM-DD)
 * @returns {string} 格式化後的日期字符串
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 星期幾
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekday = weekdays[date.getDay()];

  return `${year}/${month}/${day} (${weekday})`;
}

/**
 * 計算住宿天數
 * @param {string} checkIn - 入住日期
 * @param {string} checkOut - 退房日期
 * @returns {number} 住宿天數
 */
function calculateNights(checkIn, checkOut) {
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  const timeDiff = endDate.getTime() - startDate.getTime();
  const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return nights;
}

/**
 * 獲取營地資訊
 * @param {string} campsiteId - 營地 ID
 * @param {number} nights - 住宿天數
 * @param {string} tentType - 帳篷類型
 */
function fetchCampsiteInfo(campsiteId, nights, tentType) {
  // 這裡應該是從 API 獲取營地資訊
  // 為了示範，我們使用模擬數據
  const campsiteInfo = {
    id: campsiteId || "1",
    name: "山林星空營地",
    location: "新北市三峽區",
    basePrice: 2800,
    image: "images/product-1.jpg",
  };

  // 計算帳篷租借費用
  let tentRentalFee = 0;
  if (tentType && tentType !== "own") {
    switch (tentType) {
      case "rent-small":
        tentRentalFee = 500;
        break;
      case "rent-medium":
        tentRentalFee = 800;
        break;
      case "rent-large":
        tentRentalFee = 1200;
        break;
    }
  }

  // 計算總價
  const basePrice = campsiteInfo.basePrice;
  const totalCampsitePrice = (basePrice + tentRentalFee) * nights;

  // 更新價格摘要
  document.getElementById(
    "campsite-price"
  ).textContent = `NT$ ${totalCampsitePrice.toLocaleString()}`;

  // 更新總價
  updateTotalPrice();
}

/**
 * 初始化加購項目事件監聽
 */
function initAddonItems() {
  // 獲取所有加購項目複選框
  const addonCheckboxes = document.querySelectorAll('input[name="addons"]');

  // 為每個複選框添加事件監聽
  addonCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      updateAddonPrice();
      updateTotalPrice();
    });
  });
}

/**
 * 更新加購項目總價
 */
function updateAddonPrice() {
  let addonTotalPrice = 0;
  const addonCheckboxes = document.querySelectorAll(
    'input[name="addons"]:checked'
  );

  addonCheckboxes.forEach((checkbox) => {
    const price = parseInt(checkbox.getAttribute("data-price")) || 0;
    addonTotalPrice += price;
  });

  // 更新加購項目總價
  document.getElementById(
    "addon-price"
  ).textContent = `NT$ ${addonTotalPrice.toLocaleString()}`;
}

/**
 * 初始化折扣碼應用
 */
function initDiscountCode() {
  const applyButton = document.getElementById("applyDiscount");
  const discountInput = document.getElementById("discountCode");
  const discountMessage = document.getElementById("discountMessage");

  applyButton.addEventListener("click", function () {
    const code = discountInput.value.trim();

    if (!code) {
      showDiscountMessage("請輸入折扣碼", "error");
      return;
    }

    // 驗證折扣碼
    validateDiscountCode(code);
  });
}

/**
 * 驗證折扣碼
 * @param {string} code - 折扣碼
 */
function validateDiscountCode(code) {
  // 這裡應該是從 API 驗證折扣碼
  // 為了示範，我們使用模擬數據
  const discountCodes = {
    SUMMER10: { type: "percentage", value: 10 },
    WELCOME20: { type: "percentage", value: 20 },
    NEWYEAR: { type: "fixed", value: 500 },
  };

  if (discountCodes[code]) {
    const discount = discountCodes[code];

    // 計算折扣金額
    let discountAmount = 0;
    const campsitePrice = parsePriceString(
      document.getElementById("campsite-price").textContent
    );
    const addonPrice = parsePriceString(
      document.getElementById("addon-price").textContent
    );
    const subtotal = campsitePrice + addonPrice;

    if (discount.type === "percentage") {
      discountAmount = Math.round(subtotal * (discount.value / 100));
      showDiscountMessage(`折扣碼已套用：${discount.value}% 折扣`, "success");
    } else {
      discountAmount = discount.value;
      showDiscountMessage(
        `折扣碼已套用：NT$ ${discount.value.toLocaleString()} 折扣`,
        "success"
      );
    }

    // 顯示折扣行
    document.getElementById("discount-row").style.display = "flex";
    document.getElementById(
      "discount-amount"
    ).textContent = `-NT$ ${discountAmount.toLocaleString()}`;

    // 更新總價
    updateTotalPrice(discountAmount);
  } else {
    // 顯示錯誤訊息
    showDiscountMessage("無效的折扣碼", "error");

    // 隱藏折扣行
    document.getElementById("discount-row").style.display = "none";

    // 更新總價
    updateTotalPrice(0);
  }
}

/**
 * 顯示折扣碼訊息
 * @param {string} message - 訊息內容
 * @param {string} type - 訊息類型 (success/error)
 */
function showDiscountMessage(message, type) {
  const discountMessage = document.getElementById("discountMessage");

  discountMessage.textContent = message;
  discountMessage.className = "discount-message " + type;
  discountMessage.style.display = "block";
}

/**
 * 從價格字符串中解析數字
 * @param {string} priceString - 價格字符串 (例如: "NT$ 1,000")
 * @returns {number} 價格數字
 */
function parsePriceString(priceString) {
  return parseInt(priceString.replace(/[^0-9]/g, "")) || 0;
}

/**
 * 更新總價
 * @param {number} discountAmount - 折扣金額
 */
function updateTotalPrice(discountAmount = 0) {
  const campsitePrice = parsePriceString(
    document.getElementById("campsite-price").textContent
  );
  const addonPrice = parsePriceString(
    document.getElementById("addon-price").textContent
  );

  const totalPrice = campsitePrice + addonPrice - discountAmount;
  document.getElementById(
    "total-price"
  ).textContent = `NT$ ${totalPrice.toLocaleString()}`;
}

/**
 * 初始化付款方式切換
 */
function initPaymentMethods() {
  const creditCardRadio = document.getElementById("creditCard");
  const linePayRadio = document.getElementById("linePay");
  const creditCardForm = document.getElementById("creditCardForm");
  const linePayForm = document.getElementById("linePayForm");

  creditCardRadio.addEventListener("change", function () {
    if (this.checked) {
      creditCardForm.style.display = "block";
      linePayForm.style.display = "none";
    }
  });

  linePayRadio.addEventListener("change", function () {
    if (this.checked) {
      creditCardForm.style.display = "none";
      linePayForm.style.display = "block";
    }
  });
}

/**
 * 初始化表單提交
 */
function initFormSubmission() {
  const submitButton = document.getElementById("submitBooking");
  const bookingForm = document.getElementById("bookingForm");

  submitButton.addEventListener("click", function () {
    // 驗證表單
    if (validateForm()) {
      // 處理付款
      processPayment();
    }
  });
}

/**
 * 驗證表單
 * @returns {boolean} 表單是否有效
 */
function validateForm() {
  // 獲取表單欄位
  const lastName = document.getElementById("lastName").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();

  // 驗證姓名
  if (!lastName || !firstName) {
    alert("請輸入姓名");
    return false;
  }

  // 驗證電話
  if (!phone) {
    alert("請輸入聯絡電話");
    return false;
  }

  // 驗證電子郵件
  if (!email || !validateEmail(email)) {
    alert("請輸入有效的電子郵件");
    return false;
  }

  // 驗證付款方式
  const paymentMethod = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );
  if (!paymentMethod) {
    alert("請選擇付款方式");
    return false;
  }

  // 如果選擇信用卡，驗證信用卡資訊
  if (paymentMethod.value === "creditCard") {
    const cardNumber = document.getElementById("cardNumber").value.trim();
    const expiryDate = document.getElementById("expiryDate").value.trim();
    const cvv = document.getElementById("cvv").value.trim();
    const cardholderName = document
      .getElementById("cardholderName")
      .value.trim();

    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      alert("請填寫完整的信用卡資訊");
      return false;
    }
  }

  return true;
}

/**
 * 驗證電子郵件格式
 * @param {string} email - 電子郵件
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 處理付款
 */
function processPayment() {
  // 顯示載入中
  document.body.classList.add("loading");

  // 獲取付款方式
  const paymentMethod = document.querySelector(
    'input[name="paymentMethod"]:checked'
  ).value;

  // 模擬 API 請求
  setTimeout(function () {
    // 隱藏載入中
    document.body.classList.remove("loading");

    // 隨機決定付款結果 (實際應用中應該是根據 API 回應)
    const isSuccess = Math.random() > 0.3; // 70% 成功率

    if (isSuccess) {
      // 付款成功
      showPaymentResult("success");

      // 發送確認郵件
      sendConfirmationEmail();
    } else {
      // 付款失敗
      showPaymentResult("failure");
    }
  }, 2000);
}

/**
 * 顯示付款結果
 * @param {string} result - 結果類型 (success/failure)
 */
function showPaymentResult(result) {
  const modal = document.getElementById("paymentResultModal");
  const successResult = document.getElementById("paymentSuccess");
  const failureResult = document.getElementById("paymentFailure");

  // 顯示模態框
  modal.style.display = "flex";

  if (result === "success") {
    // 顯示成功結果
    successResult.style.display = "block";
    failureResult.style.display = "none";

    // 生成訂單編號
    const orderNumber = generateOrderNumber();
    document.getElementById("bookingReference").textContent = orderNumber;
  } else {
    // 顯示失敗結果
    successResult.style.display = "none";
    failureResult.style.display = "block";
  }
}

/**
 * 生成訂單編號
 * @returns {string} 訂單編號
 */
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `ORD-${year}${month}${day}-${random}`;
}

/**
 * 初始化模態框關閉按鈕
 */
function initModalClose() {
  const closeSuccessButton = document.getElementById("closeSuccessModal");
  const closeFailureButton = document.getElementById("closeFailureModal");

  closeSuccessButton.addEventListener("click", function () {
    // 關閉模態框
    document.getElementById("paymentResultModal").style.display = "none";

    // 重定向到訂單列表頁面
    window.location.href = "campsite_order.html";
  });

  closeFailureButton.addEventListener("click", function () {
    // 關閉模態框
    document.getElementById("paymentResultModal").style.display = "none";
  });
}

/**
 * 發送確認郵件
 */
function sendConfirmationEmail() {
  // 獲取表單資訊
  const lastName = document.getElementById("lastName").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const email = document.getElementById("email").value.trim();

  // 獲取預訂資訊
  const checkIn = document.getElementById("display-check-in").textContent;
  const checkOut = document.getElementById("display-check-out").textContent;
  const nights = document.getElementById("stay-nights").textContent;

  // 獲取價格資訊
  const campsitePrice = document.getElementById("campsite-price").textContent;
  const addonPrice = document.getElementById("addon-price").textContent;
  const discountAmount =
    document.getElementById("discount-row").style.display !== "none"
      ? document.getElementById("discount-amount").textContent
      : "-NT$ 0";
  const totalPrice = document.getElementById("total-price").textContent;

  // 獲取訂單編號
  const orderNumber = document.getElementById("bookingReference").textContent;

  // 這裡應該是發送郵件的 API 請求
  console.log("發送確認郵件到：", email);
  console.log("訂單編號：", orderNumber);

  // 實際應用中，這裡應該是一個 API 請求
  // 例如：
  /*
  fetch('/api/send-confirmation-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      name: `${lastName}${firstName}`,
      orderNumber,
      checkIn,
      checkOut,
      nights,
      campsitePrice,
      addonPrice,
      discountAmount,
      totalPrice
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('郵件發送成功：', data);
  })
  .catch(error => {
    console.error('郵件發送失敗：', error);
  });
  */
}
