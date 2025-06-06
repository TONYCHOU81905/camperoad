/**
 * 營地詳情頁面 JavaScript
 */

document.addEventListener("DOMContentLoaded", function () {
  // 載入營地資料
  loadCampData().then(() => {
    // 載入特定營地詳情
    loadCampDetails();

    // 初始化頁面
    initDetailPage();

    // 解析URL參數
    parseUrlParams();
  });
});

/**
 * 初始化詳情頁面
 */
function initDetailPage() {
  // 初始化日期選擇器
  initDatePickers();

  // 初始化預訂按鈕
  initBookingButton();
}

/**
 * 初始化日期選擇器
 */
function initDatePickers() {
  // 獲取日期輸入元素
  const checkInInput = document.getElementById("check-in-date");
  const checkOutInput = document.getElementById("check-out-date");

  if (checkInInput && checkOutInput) {
    // 設置最小日期為今天
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = formatDateForInput(today);
    const tomorrowStr = formatDateForInput(tomorrow);

    checkInInput.min = todayStr;
    checkOutInput.min = tomorrowStr;

    // 當入住日期變更時，更新退房日期的最小值
    checkInInput.addEventListener("change", function () {
      const selectedDate = new Date(this.value);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      checkOutInput.min = formatDateForInput(nextDay);

      // 如果退房日期早於新的最小日期，則更新退房日期
      if (new Date(checkOutInput.value) <= selectedDate) {
        checkOutInput.value = formatDateForInput(nextDay);
      }
    });
  }
}

/**
 * 格式化日期為輸入框格式 (YYYY-MM-DD)
 * @param {Date} date - 日期對象
 * @returns {string} 格式化的日期字符串
 */
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 解析URL參數並設置日期選擇器
 */
function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const checkInParam = urlParams.get("check-in");
  const checkOutParam = urlParams.get("check-out");
  const guestsParam = urlParams.get("guests");

  // 設置日期選擇器的值
  const checkInInput = document.getElementById("check-in-date");
  const checkOutInput = document.getElementById("check-out-date");
  const guestsSelect = document.getElementById("guests");

  if (checkInInput && checkInParam) {
    checkInInput.value = checkInParam;

    // 觸發change事件以更新退房日期的最小值
    const event = new Event("change");
    checkInInput.dispatchEvent(event);
  }

  if (checkOutInput && checkOutParam) {
    checkOutInput.value = checkOutParam;
  }

  if (guestsSelect && guestsParam) {
    // 嘗試設置人數選擇器的值
    // 注意：如果guestsParam的值不在選擇器的選項中，這可能不會生效
    try {
      guestsSelect.value = guestsParam;
    } catch (e) {
      console.log("無法設置人數選擇器的值", e);
    }
  }
}

/**
 * 初始化預訂按鈕
 */
function initBookingButton() {
  const bookButton = document.getElementById("btn-book");

  if (bookButton) {
    bookButton.addEventListener("click", function () {
      // 獲取表單數據
      const checkInDate = document.getElementById("check-in-date").value;
      const checkOutDate = document.getElementById("check-out-date").value;
      const guests = document.getElementById("guests").value;
      const tentType = document.getElementById("tent-type").value;

      // 驗證日期
      if (!checkInDate || !checkOutDate) {
        alert("請選擇入住和退房日期");
        return;
      }

      // 獲取營地ID (從URL參數)
      const urlParams = new URLSearchParams(window.location.search);
      const campsiteId = urlParams.get("id") || "1";

      // 構建預訂頁面URL
      const bookingUrl = `campsite-booking.html?id=${campsiteId}&checkin=${checkInDate}&checkout=${checkOutDate}&guests=${guests}&tent=${tentType}`;

      // 導航到預訂頁面
      window.location.href = bookingUrl;
    });
  }
}

// 購物車功能
function addToCart() {
  const currentCampsite = getCurrentCampsiteId();
  const selectedDates = {
    checkIn: document.getElementById("check-in-date").value,
    checkOut: document.getElementById("check-out-date").value,
  };

  // 檢查現有購物車內容
  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");

  if (cartItems.length > 0) {
    const existingItem = cartItems[0];
    if (
      existingItem.campsiteId !== currentCampsite ||
      existingItem.dates.checkIn !== selectedDates.checkIn
    ) {
      if (confirm("選擇的營地或日期不同，需要清空購物車。是否繼續？")) {
        localStorage.removeItem("cart");
      } else {
        return;
      }
    }
  }

  // 添加新項目
  const newItem = {
    campsiteId: currentCampsite,
    dates: selectedDates,
    guests: document.getElementById("guests").value,
    addedAt: new Date().toISOString(),
  };

  localStorage.setItem("cart", JSON.stringify([newItem]));
  window.location.href = "cart.html";
}

function getCurrentCampsiteId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id") || "1";
}

/**
 * 載入特定營地詳情
 */
async function loadCampDetails() {
  try {
    const campId = getCurrentCampsiteId();
    console.log("載入營地詳情:" + campId);
    // 確保營地資料已載入
    if (!campData || campData.length === 0) {
      await loadCampData();
    }
    console.log("campData:" + campData);
    // 尋找對應ID的營地
    const camp = campData.find((c) => c.camp_id == campId);
    console.log("camp:" + camp);

    if (camp) {
      updateCampDetails(camp);
    } else {
      console.error("找不到對應ID的營地:", campId);
    }
  } catch (error) {
    console.error("載入營地詳情失敗:", error);
  }
}

/**
 * 更新頁面上的營地詳情
 */
function updateCampDetails(camp) {
  // 更新頁面標題
  document.title = `${camp.camp_name} - 露途`;

  // 更新營地名稱
  const titleElement = document.querySelector(".campsite-title h1");
  if (titleElement) titleElement.textContent = camp.camp_name;

  // 更新營地位置
  const locationElement = document.querySelector(".campsite-location");
  if (locationElement) {
    locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${camp.camp_city}${camp.camp_dist}${camp.camp_addr}`;
  }

  // 更新營地描述
  const descriptionElement = document.querySelector(".campsite-description");
  if (descriptionElement) descriptionElement.textContent = camp.camp_content;

  // 更新營地圖片（如果有）
  if (camp.camp_pic) {
    const mainImage = document.getElementById("main-image");
    if (mainImage) mainImage.src = camp.camp_pic;
  }

  // 更新評分
  updateRating(camp);
}

/**
 * 更新營地評分
 */
function updateRating(camp) {
  const rating = calculateRating(
    camp.camp_comment_sun_score,
    camp.camp_comment_number_count
  );
  const ratingElement = document.querySelector(".review-rating");

  if (ratingElement) {
    ratingElement.innerHTML = generateStarsHtml(rating);
  }
}

/**
 * 計算星星評分
 */
function calculateRating(sunScore, commentCount) {
  if (!sunScore || !commentCount || commentCount === 0) {
    return 0;
  }
  return sunScore / commentCount;
}

/**
 * 生成星星評分HTML
 */
function generateStarsHtml(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let starsHtml = "";

  // 滿星
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }

  // 半星
  if (hasHalfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }

  // 空星
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }

  return starsHtml;
}
