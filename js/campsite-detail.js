/**
 * 營地詳情頁面 JavaScript
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded 事件觸發");

  // 先解析URL參數，確保參數在其他函數調用前已經被解析
  parseUrlParams();

  // 載入營地資料
  loadCampData().then(() => {
    console.log("營地資料載入完成");

    // 初始化頁面
    initDetailPage();

    // 載入特定營地詳情（包括房型資料）
    loadCampDetails();

    // 載入營地圖片
    if (typeof loadCampImages === "function") {
      loadCampImages();
    }

    // 更新購物車數量顯示
    const cart = JSON.parse(localStorage.getItem("campingCart")) || [];
    updateCartCount(cart.length);
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

  console.log("URL參數:", { checkInParam, checkOutParam, guestsParam });

  // 設置日期選擇器的值
  const checkInInput = document.getElementById("check-in-date");
  const checkOutInput = document.getElementById("check-out-date");
  const guestsSelect = document.getElementById("guests");

  if (checkInInput && checkInParam) {
    checkInInput.value = checkInParam;
    console.log("設置入住日期:", checkInParam);

    // 觸發change事件以更新退房日期的最小值
    const event = new Event("change");
    checkInInput.dispatchEvent(event);
  }

  if (checkOutInput && checkOutParam) {
    checkOutInput.value = checkOutParam;
    console.log("設置退房日期:", checkOutParam);
  }

  if (guestsSelect && guestsParam) {
    // 嘗試設置人數選擇器的值
    // 注意：如果guestsParam的值不在選擇器的選項中，這可能不會生效
    try {
      guestsSelect.value = guestsParam;
      console.log("設置人數:", guestsParam);
    } catch (e) {
      console.log("無法設置人數選擇器的值", e);
    }
  } else {
    console.log("未找到人數選擇器或人數參數", { guestsSelect, guestsParam });
  }
}

/**
 * 初始化預訂按鈕
 */
function initBookingButton() {
  const bookButton = document.getElementById("btn-book");

  if (bookButton) {
    // 修改按鈕文字為「查詢空房」
    bookButton.innerHTML = '<i class="fas fa-search"></i> 查詢空房';

    bookButton.addEventListener("click", async function () {
      // 獲取表單數據
      const checkInDate = document.getElementById("check-in-date").value;
      const checkOutDate = document.getElementById("check-out-date").value;
      const guests = document.getElementById("guests").value;

      // 驗證日期
      if (!checkInDate || !checkOutDate) {
        alert("請選擇入住和退房日期");
        return;
      }

      // 獲取營地ID (從URL參數)
      const campsiteId = getCurrentCampsiteId();

      try {
        // 使用fetch API獲取可用房型數據
        await getAvailableRoomTypesFromAPI(
          campsiteId,
          guests,
          checkInDate,
          checkOutDate
        );
      } catch (error) {
        console.error("獲取可用房型失敗:", error);
        // 如果API調用失敗，回退到原有邏輯
        loadCampsiteTypesByGuestCount();
      }
    });
  }
}

// 舊的 displayCampsiteTypes 函數已被異步版本替代

/**
 * 獲取房型照片（使用 API 格式並檢查有效性）
 * @param {string} campsiteTypeId - 房型ID
 * @param {string} campId - 營地ID
 * @returns {Promise<Array>} 有效的圖片URL陣列
 */
async function getCampsiteTypePhotos(campsiteTypeId, campId) {
  const photos = [];
  const apiPrefix = window.api_prefix || "http://localhost:8081/CJA101G02";

  // 檢查最多4張圖片
  for (let i = 1; i <= 4; i++) {
    const imageUrl = `${apiPrefix}/campsitetype/${campsiteTypeId}/${campId}/images/${i}`;

    try {
      const isValid = await checkImageExists(imageUrl);
      if (isValid) {
        photos.push(imageUrl);
        console.log(`房型圖片 ${i} 載入成功:`, imageUrl);
      } else {
        console.log(`房型圖片 ${i} 不存在:`, imageUrl);
      }
    } catch (error) {
      console.log(`房型圖片 ${i} 檢查失敗:`, imageUrl, error);
    }
  }

  return photos;
}

/**
 * 檢查圖片是否存在
 * @param {string} imageUrl - 圖片URL
 * @returns {Promise<boolean>} 圖片是否存在
 */
function checkImageExists(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000); // 5秒超時

    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };

    img.src = imageUrl;
  });
}

/**
 * 添加房型區域的樣式
 */
function addRoomTypesStyles() {
  // 檢查是否已經添加了樣式
  if (document.getElementById("room-types-styles")) return;

  // 創建樣式元素
  const style = document.createElement("style");
  style.id = "room-types-styles";
  style.textContent = `
    .room-types-section {
      margin-top: 30px;
      border-top: 1px solid #e0e0e0;
      padding-top: 20px;
    }
    
    .room-types-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .room-type-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .room-type-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    }
    
    .room-type-images {
      height: 180px;
      overflow: hidden;
    }
    
    .room-type-images img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .room-type-card:hover .room-type-images img {
      transform: scale(1.05);
    }
    
    .room-type-info {
      padding: 15px;
    }
    
    .room-type-info h4 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #3a5a40;
    }
    
    .room-type-info p {
      margin: 5px 0;
      color: #666;
    }
    
    .btn-add-to-cart {
      background-color: #3a5a40;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
      transition: background-color 0.3s ease;
    }
    
    .btn-add-to-cart:hover {
      background-color: #2d4731;
    }
    
    @media (max-width: 768px) {
      .room-types-container {
        grid-template-columns: 1fr;
      }
    }
  `;

  // 將樣式添加到頭部
  document.head.appendChild(style);
}

/**
 * 添加到購物車
 * @param {string} campsiteTypeId - 房型ID
 */
async function addToCart(campsiteTypeId) {
  // 獲取營地ID
  const campId = getCurrentCampsiteId();

  // 獲取入住和退房日期
  const checkInDate = document.getElementById("check-in-date").value;
  const checkOutDate = document.getElementById("check-out-date").value;
  const guests = document.getElementById("guests").value;

  // 驗證日期
  if (!checkInDate || !checkOutDate) {
    alert("請選擇入住和退房日期");
    return;
  }

  // 檢查日期是否有效
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (checkIn < today) {
    alert("入住日期不能早於今天");
    return;
  }

  if (checkOut <= checkIn) {
    alert("退房日期必須晚於入住日期");
    return;
  }

  try {
    // 檢查剩餘房型數量
    const remainingCount = await checkRemainingRoomCount(
      campId,
      campsiteTypeId,
      guests,
      checkInDate,
      checkOutDate
    );

    // 檢查購物車中是否已有該房型
    let cart = JSON.parse(localStorage.getItem("campingCart")) || [];

    // 檢查是否已有不同營地或日期的項目
    const hasDifferentCampsite = cart.some(
      (item) =>
        item.campId !== campId ||
        item.checkIn !== checkInDate ||
        item.checkOut !== checkOutDate
    );

    if (hasDifferentCampsite) {
      // 詢問用戶是否要清空購物車
      if (
        confirm(
          "購物車中已有不同營地或日期的項目，是否清空購物車並添加新項目？"
        )
      ) {
        cart = [];
      } else {
        return;
      }
    }

    // 計算購物車中該房型的數量
    const existingCount = cart.filter(
      (item) => item.campsiteTypeId === campsiteTypeId
    ).length;

    // 檢查是否會超過剩餘數量
    if (existingCount + 1 > remainingCount) {
      alert(
        `抱歉，該房型剩餘數量為 ${remainingCount} 間，購物車中已有 ${existingCount} 間，無法再添加。`
      );

      // 禁用加入購物車按鈕
      const addToCartBtn = document.querySelector(
        `[data-type-id="${campsiteTypeId}"]`
      );
      if (addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = "數量已達上限";
        addToCartBtn.style.backgroundColor = "#ccc";
        addToCartBtn.style.cursor = "not-allowed";
      }
      return;
    }

    // 計算住宿天數
    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // 創建購物車項目
    const cartItem = {
      campId: campId,
      campsiteTypeId: campsiteTypeId || "1",
      campsiteNum: 1,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      days: days,
    };

    // 添加到購物車
    cart.push(cartItem);

    // 保存到本地存儲
    localStorage.setItem("campingCart", JSON.stringify(cart));

    // 更新購物車數量顯示
    updateCartCount(cart.length);

    // 顯示添加成功消息
    showAddToCartMessage();
    console.log("已添加到購物車");
  } catch (error) {
    console.log("檢查剩餘房型數量失敗:", error);
    alert("無法檢查房型可用性，請稍後再試。");
  }
}

function getCurrentCampsiteId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id") || "1";
}

/**
 * 更新購物車數量顯示
 * @param {number} count - 購物車中的項目數量
 */
function updateCartCount(count) {
  const cartCountElements = document.querySelectorAll(".cart-count");
  cartCountElements.forEach((element) => {
    element.textContent = count;
    element.style.display = count > 0 ? "inline" : "none";
  });
}

/**
 * 顯示加入購物車成功訊息
 */
function showAddToCartMessage() {
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

  // 添加動畫樣式
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

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

/**
 * 檢查剩餘房型數量
 * @param {string} campId - 營地ID
 * @param {string} campsiteTypeId - 房型ID
 * @param {string} guests - 人數
 * @param {string} checkIn - 入住日期
 * @param {string} checkOut - 退房日期
 * @returns {Promise<number>} 剩餘房型數量
 */
async function checkRemainingRoomCount(
  campId,
  campsiteTypeId,
  guests,
  checkIn,
  checkOut
) {
  try {
    const requestBody = new URLSearchParams({
      campIds: campId,
      people: guests,
      checkIn: checkIn,
      checkOut: checkOut,
    });

    const response = await fetch(
      `${window.api_prefix}/api/ca/available/Remaing`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const dataJson = await response.json();
    const data = dataJson.data;
    console.log("API回應數據1:", dataJson);

    // 查找對應房型的剩餘數量
    const roomTypeData = data.find(
      (item) =>
        item.campId === parseInt(campId) &&
        item.campsiteTypeId === parseInt(campsiteTypeId)
    );

    return roomTypeData ? roomTypeData.remaing : 0;
  } catch (error) {
    console.error("檢查剩餘房型數量失敗:", error);
    throw error;
  }
}

/**
 * 使用API獲取可用房型數據並顯示
 * @param {string} campId - 營地ID
 * @param {string} guests - 人數
 * @param {string} checkIn - 入住日期
 * @param {string} checkOut - 退房日期
 */
async function getAvailableRoomTypesFromAPI(campId, guests, checkIn, checkOut) {
  try {
    const requestBody = new URLSearchParams({
      campIds: campId,
      people: guests,
      checkIn: checkIn,
      checkOut: checkOut,
    });

    const response = await fetch(
      `${window.api_prefix}/api/ca/available/Remaing`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const availableData = await response.json();
    console.log("可用房型API回應:", availableData);

    // 過濾出該營地的可用房型
    const campAvailableTypes = availableData.filter(
      (item) => item.campId === parseInt(campId) && item.remaing > 0
    );

    if (campAvailableTypes.length === 0) {
      displayNoAvailableRooms(guests);
      return;
    }

    // 從原始房型數據中獲取詳細信息
    if (window.campsiteTypes && window.campsiteTypes.length > 0) {
      const availableTypes = window.campsiteTypes.filter((type) =>
        campAvailableTypes.some(
          (available) => available.campsiteTypeId === type.campsiteTypeId
        )
      );

      // 添加剩餘數量信息
      availableTypes.forEach((type) => {
        const availableInfo = campAvailableTypes.find(
          (available) => available.campsiteTypeId === type.campsiteTypeId
        );
        if (availableInfo) {
          type.remaing = availableInfo.remaing;
        }
      });

      await displayAvailableRoomTypes(availableTypes, guests);
    } else {
      // 如果沒有詳細房型數據，顯示基本信息
      displayBasicAvailableRooms(campAvailableTypes, guests);
    }
  } catch (error) {
    console.error("獲取可用房型失敗:", error);
    throw error;
  }
}

/**
 * 顯示沒有可用房型的訊息
 * @param {string} guests - 人數
 */
function displayNoAvailableRooms(guests) {
  let roomTypesSection = document.querySelector(".room-types-section");
  if (!roomTypesSection) {
    const campsiteInfo = document.querySelector(".campsite-info");
    if (campsiteInfo) {
      roomTypesSection = document.createElement("div");
      roomTypesSection.className = "room-types-section";
      campsiteInfo.appendChild(roomTypesSection);
    }
  }

  if (roomTypesSection) {
    roomTypesSection.innerHTML = `
      <h3>查詢結果</h3>
      <div class="no-available-rooms">
        <i class="fas fa-exclamation-triangle"></i>
        <p>抱歉，在選定的日期內沒有適合 ${guests} 人的可用房型。</p>
        <p>請嘗試調整日期或人數。</p>
      </div>
    `;
  }
}

/**
 * 顯示可用房型（詳細版本）
 * @param {Array} availableTypes - 可用房型數據
 * @param {string} guests - 人數
 */
async function displayAvailableRoomTypes(availableTypes, guests) {
  let roomTypesSection = document.querySelector(".room-types-section");
  if (!roomTypesSection) {
    const campsiteInfo = document.querySelector(".campsite-info");
    if (campsiteInfo) {
      roomTypesSection = document.createElement("div");
      roomTypesSection.className = "room-types-section";
      campsiteInfo.appendChild(roomTypesSection);
    }
  }

  if (!roomTypesSection) return;

  roomTypesSection.innerHTML = `
    <h3>適合 ${guests} 人的可用房型</h3>
    <div class="room-types-container" id="room-types-container"></div>
  `;

  const roomTypesContainer = document.getElementById("room-types-container");

  for (const type of availableTypes) {
    const roomCard = document.createElement("div");
    roomCard.className = "room-type-card";

    // 獲取營地ID
    const campId = getCurrentCampsiteId();

    // 獲取房型照片（使用 API 格式）
    const photos = await getCampsiteTypePhotos(type.campsiteTypeId, campId);

    const roomImages = document.createElement("div");
    roomImages.className = "room-type-images";

    if (photos.length > 0) {
      const img = document.createElement("img");
      img.src = photos[0];
      img.alt = type.campsiteName;
      roomImages.appendChild(img);
    } else {
      const img = document.createElement("img");
      img.src = "images/camp-1.jpg";
      img.alt = type.campsiteName;
      roomImages.appendChild(img);
    }
    console.log("763:", type.campsitePrice);

    const roomInfo = document.createElement("div");
    roomInfo.className = "room-type-info";
    roomInfo.innerHTML = `
      <h4>${type.campsiteName}</h4>
      <p>適合人數: ${type.campsitePeople}人</p>
      <p>價格: NT$ ${type.campsitePrice.toLocaleString()} / 晚</p>
      <p>剩餘數量: <span class="remaining-count">${type.remaing}</span>間</p>
      <button class="btn-add-to-cart" data-type-id="${
        type.campsiteTypeId
      }">加入購物車</button>
    `;

    roomCard.appendChild(roomImages);
    roomCard.appendChild(roomInfo);
    roomTypesContainer.appendChild(roomCard);
  }

  // 為所有「加入購物車」按鈕添加事件監聽器
  const addToCartButtons = document.querySelectorAll(".btn-add-to-cart");
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const typeId = this.getAttribute("data-type-id");
      addToCart(typeId);
    });
  });

  addRoomTypesStyles();
}

/**
 * 顯示基本可用房型信息
 * @param {Array} availableData - API返回的可用房型數據
 * @param {string} guests - 人數
 */
function displayBasicAvailableRooms(availableData, guests) {
  let roomTypesSection = document.querySelector(".room-types-section");
  if (!roomTypesSection) {
    const campsiteInfo = document.querySelector(".campsite-info");
    if (campsiteInfo) {
      roomTypesSection = document.createElement("div");
      roomTypesSection.className = "room-types-section";
      campsiteInfo.appendChild(roomTypesSection);
    }
  }

  if (!roomTypesSection) return;

  roomTypesSection.innerHTML = `
    <h3>可用房型查詢結果</h3>
    <div class="available-rooms-list">
      ${availableData
        .map(
          (item) => `
        <div class="available-room-item">
          <p>房型ID: ${item.campsiteTypeId}</p>
          <p>剩餘數量: ${item.remaing} 間</p>
          <button class="btn-add-to-cart" data-type-id="${item.campsiteTypeId}">加入購物車</button>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  // 為所有「加入購物車」按鈕添加事件監聽器
  const addToCartButtons = document.querySelectorAll(".btn-add-to-cart");
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const typeId = this.getAttribute("data-type-id");
      addToCart(typeId);
    });
  });
}

/**
 * 載入房型資料並根據人數篩選
 * 注意：此函數已被異步版本替代，保留此註釋以避免混淆
 */

/**
 * 顯示房型資訊
 * @param {Array} types - 房型資料陣列
 * @param {number} guestCount - 人數
 */
async function displayCampsiteTypes(types, guestCount) {
  // 創建房型區域的容器
  const roomTypesSection = document.createElement("section");
  roomTypesSection.className = "room-types-section";
  roomTypesSection.innerHTML = `
    <div class="container">
      <h2 class="section-title">適合 ${guestCount} 人的房型選擇</h2>
      <div class="room-types-container" id="roomTypesContainer"></div>
    </div>
  `;

  // 將房型區域插入到預訂卡片之後
  const bookingCard = document.querySelector(".booking-card");
  bookingCard.parentNode.insertBefore(
    roomTypesSection,
    bookingCard.nextSibling
  );

  const roomTypesContainer = document.getElementById("roomTypesContainer");

  // 如果沒有符合條件的房型
  if (types.length === 0) {
    roomTypesContainer.innerHTML = `
      <div class="no-rooms-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>抱歉，目前沒有適合 ${guestCount} 人的房型。請調整人數或選擇其他營地。</p>
      </div>
    `;
    return;
  }

  // 為每個房型創建卡片
  for (const type of types) {
    const typeCard = document.createElement("div");
    typeCard.className = "room-type-card";

    // 獲取營地ID
    const campId = getCurrentCampsiteId();

    // 獲取房型照片（使用 API 格式）
    const photos = await getCampsiteTypePhotos(type.campsiteTypeId, campId);

    const defaultPhoto = "/images/camps/camp-placeholder.jpg";
    const mainPhoto = photos.length > 0 ? photos[0] : defaultPhoto;

    // 創建照片輪播
    let photoCarousel = ``;
    if (photos.length > 1) {
      photoCarousel = `
        <div class="room-type-photos">
          <div class="main-photo">
            <img src="${mainPhoto}" alt="${type.campsiteName}">
          </div>
          <div class="photo-thumbnails">
            ${photos
              .map(
                (photo) => `
              <div class="thumbnail" data-photo="${photo}">
                <img src="${photo}" alt="${type.campsiteName}">
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    } else {
      photoCarousel = `
        <div class="room-type-photos">
          <div class="main-photo">
            <img src="${mainPhoto}" alt="${type.campsiteName}">
          </div>
        </div>
      `;
    }

    // 設置房型卡片內容
    typeCard.innerHTML = `
      ${photoCarousel}
      <div class="room-type-info">
        <h3 class="room-type-name">${type.campsiteName}</h3>
        <div class="room-type-details">
          <p><i class="fas fa-users"></i> 適合 ${type.campsitePeople} 人</p>
          <p><i class="fas fa-tent"></i> 剩餘 ${type.campsiteNum} 帳</p>
          <p class="room-type-price"><i class="fas fa-dollar-sign"></i> NT$ ${type.campsitePrice} / 晚</p>
        </div>
        <button class="btn-add-to-cart" data-type-id="${type.campsiteTypeId}">
          <i class="fas fa-cart-plus"></i> 加入購物車
        </button>
      </div>
    `;

    // 添加到容器
    roomTypesContainer.appendChild(typeCard);

    // 為縮略圖添加點擊事件（如果有多張照片）
    if (photos.length > 1) {
      const thumbnails = typeCard.querySelectorAll(".thumbnail");
      thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener("click", function () {
          const photoUrl = this.getAttribute("data-photo");
          const mainPhotoImg = typeCard.querySelector(".main-photo img");
          mainPhotoImg.src = photoUrl;

          // 移除所有縮略圖的活動狀態
          thumbnails.forEach((t) => t.classList.remove("active"));
          // 添加當前縮略圖的活動狀態
          this.classList.add("active");
        });
      });

      // 默認第一個縮略圖為活動狀態
      thumbnails[0].classList.add("active");
    }

    // 為加入購物車按鈕添加點擊事件
    const addToCartBtn = typeCard.querySelector(".btn-add-to-cart");
    addToCartBtn.addEventListener("click", function () {
      const typeId = this.getAttribute("data-type-id");
      addToCart(typeId);
    });
  }
}

/**
 * 添加房型區域的樣式
 */
function addRoomTypesStyles() {
  // 創建樣式元素
  const style = document.createElement("style");
  style.textContent = `
    .room-types-section {
      padding: 40px 0;
      background-color: #f9f9f9;
    }
    
    .section-title {
      font-size: 24px;
      color: #3A5A40;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .room-types-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .room-type-card {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }
    
    .room-type-card:hover {
      transform: translateY(-5px);
    }
    
    .room-type-photos {
      position: relative;
    }
    
    .main-photo {
      height: 200px;
      overflow: hidden;
    }
    
    .main-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .room-type-card:hover .main-photo img {
      transform: scale(1.05);
    }
    
    .photo-thumbnails {
      display: flex;
      padding: 10px;
      gap: 8px;
      background-color: #f0f0f0;
    }
    
    .thumbnail {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    }
    
    .thumbnail.active, .thumbnail:hover {
      opacity: 1;
    }
    
    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .room-type-info {
      padding: 15px;
    }
    
    .room-type-name {
      font-size: 18px;
      color: #3A5A40;
      margin-bottom: 10px;
    }
    
    .room-type-details {
      margin-bottom: 15px;
    }
    
    .room-type-details p {
      margin: 5px 0;
      color: #555;
    }
    
    .room-type-details i {
      width: 20px;
      color: #3A5A40;
    }
    
    .room-type-price {
      font-weight: bold;
      color: #3A5A40 !important;
    }
    
    .btn-add-to-cart {
      width: 100%;
      padding: 10px;
      background-color: #3A5A40;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .btn-add-to-cart:hover {
      background-color: #588157;
    }
    
    .no-rooms-message {
      grid-column: 1 / -1;
      text-align: center;
      padding: 30px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .no-rooms-message i {
      font-size: 40px;
      color: #e63946;
      margin-bottom: 15px;
    }
    
    .no-available-rooms {
      text-align: center;
      padding: 30px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin: 20px 0;
    }
    
    .no-available-rooms i {
      font-size: 40px;
      color: #f39c12;
      margin-bottom: 15px;
    }
    
    .no-available-rooms p {
      color: #666;
      margin: 10px 0;
    }
    
    .available-rooms-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    
    .available-room-item {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #3A5A40;
    }
    
    .available-room-item p {
      margin: 8px 0;
      color: #555;
    }
    
    .available-room-item .btn-add-to-cart {
      margin-top: 15px;
    }
    
    .remaining-count {
      font-weight: bold;
      color: #3A5A40;
    }
    
    .btn-add-to-cart:disabled {
      background-color: #ccc !important;
      cursor: not-allowed !important;
      opacity: 0.6;
    }
    
    .btn-add-to-cart:disabled:hover {
      background-color: #ccc !important;
    }
    
    .room-types-section h3 {
      color: #3A5A40;
      font-size: 22px;
      margin-bottom: 20px;
      text-align: center;
      border-bottom: 2px solid #3A5A40;
      padding-bottom: 10px;
    }
    
    .room-type-images {
      height: 200px;
      overflow: hidden;
    }
    
    .room-type-images img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .room-type-card:hover .room-type-images img {
      transform: scale(1.05);
    }
    
    .no-rooms-message p {
      font-size: 16px;
      color: #555;
    }
    
    .cart-message {
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
    }
    
    @media (max-width: 768px) {
      .room-types-container {
        grid-template-columns: 1fr;
      }
    }
  `;

  // 添加到頭部
  document.head.appendChild(style);
}
async function loadCampsiteTypesByGuestCount() {
  try {
    // 獲取URL中的人數參數
    const urlParams = new URLSearchParams(window.location.search);
    const guestsParam = urlParams.get("guests");
    const guestCount = parseInt(guestsParam) || 2;

    console.log(
      "loadCampsiteTypesByGuestCount - URL參數:",
      urlParams.toString()
    );
    console.log("loadCampsiteTypesByGuestCount - 人數參數:", guestsParam);
    console.log("loadCampsiteTypesByGuestCount - 解析後人數:", guestCount);

    // 獲取當前營地ID
    const campId = getCurrentCampsiteId();
    console.log("loadCampsiteTypesByGuestCount - 營地ID:", campId);

    // 從JSON文件載入房型資料
    const response = await fetch(
      `${window.api_prefix}/campsitetype/getAllCampsiteTypes`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch campsite types");
    }

    const dataJson = await response.json();
    const data = dataJson.data;
    console.log(
      "loadCampsiteTypesByGuestCount - 載入房型資料數量:",
      data.length
    );

    // 篩選當前營地的房型
    const campsiteTypes = data.filter((type) => type.campId == campId);

    // 篩選適合人數的房型
    const filteredTypes = campsiteTypes.filter((type) => {
      const maxPeople = parseInt(type.campsitePeople);
      return maxPeople >= guestCount;
    });

    // 保存房型數據到全局變量，以便在addToCart函數中使用
    window.campsiteTypes = campsiteTypes;

    // 顯示篩選後的房型
    await displayCampsiteTypes(filteredTypes, guestCount);

    // 添加房型區域的樣式
    addRoomTypesStyles();

    console.log("Loaded campsite types:", campsiteTypes);
    console.log("Filtered types for", guestCount, "guests:", filteredTypes);
  } catch (error) {
    console.error("Error loading campsite types:", error);
  }
}

/**
 * 載入特定營地詳情
 */
async function loadCampDetails() {
  try {
    // 解析URL參數
    const urlParams = new URLSearchParams(window.location.search);
    const campId = getCurrentCampsiteId();
    const checkIn = urlParams.get("check-in");
    const checkOut = urlParams.get("check-out");
    const guests = urlParams.get("guests");

    console.log("loadCampDetails - URL參數:", {
      campId,
      checkIn,
      checkOut,
      guests,
    });

    // 確保營地資料已載入
    if (!campData || campData.length === 0) {
      await loadCampData();
    }

    // 尋找對應ID的營地
    const camp = campData.find((c) => c.campId == campId);

    console.log("loadCampDetails - 找到營地:", camp ? camp.campName : "未找到");

    if (camp) {
      updateCampDetails(camp);

      // 載入房型資料並根據人數篩選
      await loadCampsiteTypesByGuestCount();

      // 更新顯示最低房價
      await updateLowestPrice(campId);
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
  document.title = `${camp.campName} - 露途`;

  // 更新營地名稱
  const titleElement = document.querySelector(".campsite-title h1");
  if (titleElement) titleElement.textContent = camp.campName;

  // 更新營地位置
  const locationElement = document.querySelector(".campsite-location");
  if (locationElement) {
    locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${camp.campCity}${camp.campDist}${camp.campAddr}`;
  }

  // 更新營地描述
  const descriptionElement = document.querySelector(".campsite-description");
  if (descriptionElement) descriptionElement.textContent = camp.campContent;

  // 更新營地圖片（如果有）
  if (camp.campPic) {
    const mainImage = document.getElementById("main-image");
    if (mainImage) mainImage.src = camp.campPic;
  }

  // 更新評分
  updateRating(camp);
}

/**
 * 更新營地評分
 */
function updateRating(camp) {
  const rating = calculateRating(
    camp.campCommentSumScore,
    camp.campCommentNumberCount
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

/**
 * 更新顯示最低房價
 */
async function updateLowestPrice(campId) {
  try {
    // 從JSON文件載入房型資料
    const response = await fetch(
      `${window.api_prefix}/campsitetype/getAllCampsiteTypes`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch campsite types");
    }

    const dataJson = await response.json();
    const data = dataJson.data;

    // 篩選當前營地的房型
    const campsiteTypes = data.filter((type) => type.campId == campId);

    if (campsiteTypes.length > 0) {
      // 找出最低房價
      const lowestPrice = Math.min(
        ...campsiteTypes.map((type) => type.campsitePrice)
      );

      // 更新顯示
      const priceElement = document.querySelector(".current-price");
      if (priceElement) {
        priceElement.textContent = `NT$ ${lowestPrice}`;
      }
    }
  } catch (error) {
    console.error("更新最低房價失敗:", error);
  }
}
