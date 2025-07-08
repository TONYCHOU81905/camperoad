/**
 * 營地詳情頁面 JavaScript
 */

// 全域變數：儲存可用房型資料
window.availableRoomData = null;

/**
 * 取得全域可用房型資料
 * @returns {Object|null} 可用房型資料物件
 */
function getAvailableRoomData() {
  return window.availableRoomData;
}

/**
 * 根據營地ID和房型ID取得剩餘數量
 * @param {string|number} campId - 營地ID
 * @param {string|number} campsiteTypeId - 房型ID
 * @returns {number} 剩餘數量，如果找不到則返回0
 */
function getRemainingCount(campId, campsiteTypeId) {
  if (!window.availableRoomData || !window.availableRoomData.data) {
    return 0;
  }

  const roomData = window.availableRoomData.data.find(
    (item) =>
      item.campId === parseInt(campId) &&
      item.campsiteTypeId === parseInt(campsiteTypeId)
  );

  return roomData ? roomData.remaining || roomData.remaining || 0 : 0;
}

/**
 * 檢查全域資料是否為最新（5分鐘內）
 * @returns {boolean} 是否為最新資料
 */
// function isDataFresh() {
//   if (!window.availableRoomData || !window.availableRoomData.timestamp) {
//     return false;
//   }

//   const now = new Date().getTime();
//   const dataAge = now - window.availableRoomData.timestamp;
//   const fiveMinutes = 5 * 60 * 1000; // 5分鐘

//   return dataAge < fiveMinutes;
// }

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOMContentLoaded 事件觸發");

  // 顯示載入狀態
  showLoadingState();

  // 先解析URL參數，確保參數在其他函數調用前已經被解析
  parseUrlParams();

  try {
    // 優先載入關鍵內容：營地資料和主要畫面
    await loadCampData();
    
    // 初始化頁面
    initDetailPage();
    
    // 載入營地詳情（主圖、標題等關鍵內容）
    await loadCampDetails();
    
    // 移除骨架畫面，顯示主要內容
    removeSkeletonUI();
    hideLoadingState();

    // 非關鍵內容延後載入
    setTimeout(() => {
      // 載入房型資料（非阻塞）
      loadCampsiteTypesData().catch(error => {
        console.warn("房型資料載入失敗:", error);
      });
      
      // 載入營地圖片（非阻塞）
      if (typeof loadCampImages === "function") {
        loadCampImages();
      }
    }, 100);

    // 初始化收藏按鈕
    initFavoriteCampIds().then(() => {
      updateFavoriteButton(); // 根據收藏狀態更新愛心按鈕外觀
    });

    // 更新購物車數量顯示
    const cart = JSON.parse(localStorage.getItem("campingCart")) || [];
    updateCartCount(cart.length);
    
    // 初始化懶加載觀察器
    initLazyLoading();
    
  } catch (error) {
    console.error("載入資料失敗:", error);
    showErrorState();
  }
});

/**
 * 顯示載入狀態
 */
function showLoadingState() {
  const loadingContainer = document.getElementById("loading-container");
  const mainContent = document.getElementById("main-content");

  if (loadingContainer) {
    loadingContainer.style.display = "flex";
  }

  if (mainContent) {
    mainContent.style.display = "none";
  }
}

/**
 * 隱藏載入狀態，顯示主要內容
 */
function hideLoadingState() {
  const loadingContainer = document.getElementById("loading-container");
  const mainContent = document.getElementById("main-content");

  if (loadingContainer) {
    loadingContainer.style.display = "none";
  }

  if (mainContent) {
    mainContent.style.display = "block";
    // 添加淡入效果
    setTimeout(() => {
      mainContent.style.opacity = "1";
    }, 50);
  }
}

/**
 * 顯示錯誤狀態
 */
function showErrorState() {
  const loadingContainer = document.getElementById("loading-container");

  if (loadingContainer) {
    loadingContainer.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-exclamation-triangle" style="color: #e63946; animation: none;"></i>
        <p>載入失敗，請重新整理頁面</p>
        <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background-color: #3a5a40; color: white; border: none; border-radius: 4px; cursor: pointer;">重新載入</button>
      </div>
    `;
  }
}

/**
 * 移除骨架畫面
 */
function removeSkeletonUI() {
  const skeletonElements = document.querySelectorAll('.skeleton');
  skeletonElements.forEach(element => {
    element.style.opacity = '0';
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  });
  
  // 顯示實際內容
  const elementsToShow = [
    'campsite-name',
    'camp-tag', 
    'campsite-location',
    'campsite-features',
    'campsite-description-content',
    'amenities-list',
    'main-image'
  ];
  
  elementsToShow.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = element.tagName.toLowerCase() === 'img' ? 'block' : 
                              (element.tagName.toLowerCase() === 'ul' ? 'block' : 
                               (id === 'campsite-features' ? 'flex' : 'block'));
    }
  });
}

/**
 * 初始化懶加載觀察器
 */
function initLazyLoading() {
  // 創建 Intersection Observer 用於懶加載
  const lazyImageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      }
    });
  });

  // 觀察所有懶加載圖片
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach(img => {
    lazyImageObserver.observe(img);
  });

  // 懶加載非關鍵區塊
  const lazyContentObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        if (element.classList.contains('lazy-content')) {
          element.classList.add('loaded');
          observer.unobserve(element);
        }
      }
    });
  });

  // 觀察懶加載內容區塊
  const lazyContents = document.querySelectorAll('.lazy-content');
  lazyContents.forEach(content => {
    lazyContentObserver.observe(content);
  });
}

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

  // 如果有完整的搜尋參數（從搜尋結果頁面跳轉過來），自動觸發房型查詢
  if (checkInParam && checkOutParam && guestsParam) {
    console.log("檢測到完整搜尋參數，自動觸發房型查詢");
    // 使用 setTimeout 確保 DOM 元素已經設置完成
    setTimeout(async () => {
      const campsiteId = getCurrentCampsiteId();
      try {
        await getAvailableRoomTypesFromAPI(
          campsiteId,
          guestsParam,
          checkInParam,
          checkOutParam
        );
      } catch (error) {
        console.error("自動查詢可用房型失敗:", error);
        // 如果API調用失敗，回退到原有邏輯
        loadCampsiteTypesByGuestCount();
      }
    }, 500);
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
      // 清空房型區域
      const roomTypesSection = document.querySelector(".room-types-section");
      if (roomTypesSection) roomTypesSection.innerHTML = "";

      // 調試：檢查 .room-types-section 的數量
      console.log(
        "房型區域數量:",
        document.querySelectorAll(".room-types-section").length
      );

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
  const apiPrefix = window.api_prefix || "http://localhost:8081/CJA101G02";

  // 建立所有圖片URL陣列
  const imageUrls = [];
  for (let i = 1; i <= 4; i++) {
    imageUrls.push(`${apiPrefix}/campsitetype/${campsiteTypeId}/${campId}/images/${i}`);
  }

  // 使用 Promise.allSettled 同時檢查所有圖片
  const imageCheckPromises = imageUrls.map(url => 
    checkImageExists(url).then(isValid => ({ url, isValid }))
  );

  try {
    const results = await Promise.allSettled(imageCheckPromises);
    
    // 過濾出有效的圖片URL
    const validPhotos = results
      .filter(result => result.status === 'fulfilled' && result.value.isValid)
      .map(result => result.value.url);

    console.log(`房型 ${campsiteTypeId} 找到 ${validPhotos.length} 張有效圖片`);
    return validPhotos;
  } catch (error) {
    console.error(`房型圖片檢查失敗:`, error);
    return [];
  }
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
      img.onload = null;
      img.onerror = null;
      resolve(false);
    }, 1500); // 減少超時時間到1.5秒，提升載入速度

    img.onload = () => {
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
      resolve(false);
    };

    // 添加 crossOrigin 屬性以避免 CORS 問題
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  });
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
    console.log("檢查營地", campId);
    console.log("檢查房型", campsiteTypeId);

    // 檢查是否有可用房型數據，如果沒有則先獲取
    if (!window.availableRoomData) {
      console.log("沒有可用房型數據，重新獲取...");
      await getAvailableRoomTypesFromAPI(
        campId,
        guests,
        checkInDate,
        checkOutDate
      );
    }

    const remainingCount = getRemainingCount(campId, campsiteTypeId);
    console.log("從全域變數獲取剩餘數量:", remainingCount);

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
    console.log("AAAAAAA:", window.availableRoomData);
    console.log("購物車中該房型的數量:", existingCount);
    console.log("該房型的剩餘數量:", remainingCount);

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
      time: new Date().toISOString(),
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

    console.log("requestBody1:", checkIn, checkOut);

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

    // 更新全域變數
    window.availableRoomData = {
      timestamp: new Date().getTime(),
      data: data,
      requestParams: { campId, campsiteTypeId, guests, checkIn, checkOut },
    };
    console.log("已更新全域變數 availableRoomData:", window.availableRoomData);

    // 查找對應房型的剩餘數量
    const roomTypeData = data.find(
      (item) =>
        item.campId === parseInt(campId) &&
        item.campsiteTypeId === parseInt(campsiteTypeId)
    );

    return roomTypeData ? roomTypeData.remaining : 0;
  } catch (error) {
    console.error("檢查剩餘房型數量失敗:", error);
    throw error;
  }
}

/**
 * 使用API獲取可用房型數據並顯示
 * @param {string} campId - 營地ID
 * @param {int} guests - 人數
 * @param {string} checkIn - 入住日期
 * @param {string} checkOut - 退房日期
 */
async function getAvailableRoomTypesFromAPI(campId, guests, checkIn, checkOut) {
  try {
    // 預設人數為 2，如果 guests 為 null 則使用 2
    const finalPeople = guests == "null" ? 2 : guests;

    // 預設日期為明天和後天
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    // 將日期格式轉為 yyyy-mm-dd
    const formatDate = (d) => d.toISOString().split("T")[0];

    // 如果 checkIn 或 checkOut 為 null，使用預設值
    const finalCheckIn = checkIn == "null" ? formatDate(tomorrow) : checkIn;
    const finalCheckOut =
      checkOut == "null" ? formatDate(dayAfterTomorrow) : checkOut;
    // 建立請求內容
    const requestBody = new URLSearchParams({
      campIds: campId,
      people: finalPeople,
      checkIn: finalCheckIn,
      checkOut: finalCheckOut,
    });

    console.log(
      "requestBody2:",
      campId,
      finalCheckIn,
      finalCheckOut,
      finalPeople
    );
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

    const availableDataJson = await response.json();
    const availableData = availableDataJson.data;
    console.log("可用房型API回應:", availableData);

    // 更新全域變數
    window.availableRoomData = {
      timestamp: new Date().getTime(),
      data: availableData,
      requestParams: { campId, guests, checkIn, checkOut },
    };
    console.log("已更新全域變數 availableRoomData:", window.availableRoomData);

    // 過濾出該營地的可用房型
    const campAvailableTypes = availableData.filter(
      (item) => item.campId === parseInt(campId) && item.remaining > 0
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

      // 使用 displayCampsiteTypes 函數並傳遞 availableData
      await displayCampsiteTypes(availableTypes, guests, availableData);
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
 * 獲取或創建房型區塊，確保頁面中只有一個房型區塊
 * @returns {HTMLElement} 房型區塊元素
 */
function getOrCreateRoomTypesSection() {
  let section = document.querySelector(".room-types-section");

  if (!section) {
    section = document.createElement("div");
    section.className = "room-types-section";
    section.style.display = "none"; // 預設隱藏
    const campsiteInfo = document.querySelector(".campsite-info");
    if (campsiteInfo) {
      campsiteInfo.appendChild(section);
    }
  } else {
    section.innerHTML = ""; // 清空內容
    // section.remove();
    console.log("清空內容");
  }
  section.style.display = "block"; // 顯示
  return section;
}

/**
 * 顯示沒有可用房型的訊息
 * @param {string} guests - 人數
 */
function displayNoAvailableRooms(guests) {
  const roomTypesSection = getOrCreateRoomTypesSection();

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
  const roomTypesSection = getOrCreateRoomTypesSection();

  if (!roomTypesSection) return;

  roomTypesSection.innerHTML = `
    <h3>適合 ${guests} 人的可用房型</h3>
    <div class="room-types-container" id="room-types-container"></div>
  `;

  const roomTypesContainer = document.getElementById("room-types-container");

  for (const type of availableTypes) {
    console.log("availableTypes1:", type);

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
      <p>剩餘數量: <span class="remaining-count">${type.remaining}</span>間</p>
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
  const roomTypesSection = getOrCreateRoomTypesSection();

  if (!roomTypesSection) return;

  roomTypesSection.innerHTML = `
    <h3>可用房型查詢結果</h3>
    <div class="available-rooms-list">
      ${availableData
        .map(
          (item) => `
        <div class="available-room-item">
          <p>房型ID: ${item.campsiteTypeId}</p>
          <p>剩餘數量: ${item.remaining} 間</p>
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
 * @param {Array} availableData - API返回的可用房型數據
 */
async function displayCampsiteTypes(types, guestCount, availableData) {
  const roomTypesSection = getOrCreateRoomTypesSection();
  console.log("displayCampsiteTypes:", availableData);

  if (!roomTypesSection) return;

  roomTypesSection.innerHTML = `
    <h3>適合 ${guestCount} 人的房型選擇</h3>
    <div class="room-types-container" id="roomTypesContainer"></div>
  `;

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

    // 從 availableData 中獲取剩餘數量
    let remainingCount = 0;
    if (availableData && availableData.data) {
      const availableInfo = availableData.data.find(
        (item) =>
          item.campId === parseInt(campId) &&
          item.campsiteTypeId === parseInt(type.campsiteTypeId)
      );
      remainingCount = availableInfo ? availableInfo.remaining : 0;
    } else if (availableData && Array.isArray(availableData)) {
      // 如果 availableData 直接是陣列
      const availableInfo = availableData.find(
        (item) =>
          item.campId === parseInt(campId) &&
          item.campsiteTypeId === parseInt(type.campsiteTypeId)
      );
      remainingCount = availableInfo ? availableInfo.remaining : 0;
    } else {
      // 如果沒有 availableData，使用預設值或 type 中的 remaining 欄位
      remainingCount = type.remaining || 5; // 預設顯示 5 間可用
    }

    // 獲取房型照片（使用 API 格式）
    let photos = [];
    try {
      photos = await getCampsiteTypePhotos(type.campsiteTypeId, campId);
      console.log(`房型 ${type.campsiteTypeId} 獲取到 ${photos.length} 張照片`);
    } catch (error) {
      console.error(`獲取房型 ${type.campsiteTypeId} 照片失敗:`, error);
      photos = [];
    }

    const defaultPhoto = "images/camp-1.jpg";
    const mainPhoto = photos.length > 0 ? photos[0] : defaultPhoto;

    // 創建照片輪播
    let photoCarousel = ``;
    if (photos.length >= 1) {
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
          <p><i class="fas fa-tent"></i> 剩餘 ${remainingCount} 帳</p>
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
  // 檢查是否已經添加了樣式
  if (document.getElementById("room-types-styles")) return;

  // 創建樣式元素
  const style = document.createElement("style");
  style.id = "room-types-styles";
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
/**
 * 根據人數載入並顯示房型
 */
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

    // 使用 available/Remaing API 的資料，如果沒有則嘗試獲取基本房型資料
    if (!window.availableRoomData || !window.availableRoomData.data) {
      console.log("沒有可用房型資料，嘗試載入基本房型資料...");
      try {
        // 載入基本房型資料
        await loadCampsiteTypesData();
        
        // 如果有基本房型資料，顯示它們
        if (window.campsiteTypes && window.campsiteTypes.length > 0) {
          const campsiteTypes = window.campsiteTypes.filter((type) => type.campId == campId);
          const filteredTypes = campsiteTypes.filter((type) => {
            const maxPeople = parseInt(type.campsitePeople);
            return maxPeople >= guestCount;
          });
          
          console.log("使用基本房型資料顯示:", filteredTypes);
          await displayCampsiteTypes(filteredTypes, guestCount, null);
          addRoomTypesStyles();
        }
      } catch (error) {
        console.error("載入基本房型資料也失敗:", error);
      }
      return;
    }

    // 從 available/Remaing API 資料中提取房型資訊
    const availableData = window.availableRoomData.data;
    console.log(
      "loadCampsiteTypesByGuestCount - 可用房型資料數量:",
      availableData.length
    );

    // 篩選當前營地的房型
    const campsiteTypes = availableData.filter((type) => type.campId == campId);
    console.log("OKKKK:",availableData,campsiteTypes);
    
    // 篩選適合人數的房型
    const filteredTypes = campsiteTypes.filter((type) => {
      const maxPeople = parseInt(type.campsitePeople);
      return maxPeople >= guestCount;
    });

    // 保存房型數據到全局變量，以便在addToCart函數中使用
    window.campsiteTypes = campsiteTypes;

    // 顯示篩選後的房型
    await displayCampsiteTypes(
      filteredTypes,
      guestCount,
      window.availableRoomData
    );

    // 添加房型區域的樣式
    addRoomTypesStyles();

    console.log("Loaded campsite types from available data:", campsiteTypes);
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

      // 先獲取可用房型資料，然後載入並顯示房型
      try {
        console.log("開始獲取可用房型資料...");
        await getAvailableRoomTypesFromAPI(campId, guests, checkIn, checkOut);
        console.log("可用房型資料獲取完成，開始載入房型...");
        await loadCampsiteTypesByGuestCount();
      } catch (error) {
        console.error("載入房型資料失敗:", error);
        // 如果 API 失敗，嘗試使用基本房型資料
        await loadCampsiteTypesByGuestCount();
      }

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
  const titleElement = document.getElementById("campsite-name");
  if (titleElement) titleElement.textContent = camp.campName;

  // 顯示營地標籤
  const tagElement = document.getElementById("camp-tag");
  if (tagElement) {
    tagElement.style.display = "inline-block";
    // 可以根據營地數據設置不同的標籤
    if (camp.campCommentNumberCount > 50) {
      tagElement.textContent = "人氣王";
    } else if (camp.campId % 3 === 0) {
      tagElement.textContent = "新上架";
    } else {
      tagElement.textContent = "推薦";
    }
  }

  // 更新營地位置
  const locationElement = document.getElementById("campsite-location");
  if (locationElement) {
    locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${camp.campCity}${camp.campDist}${camp.campAddr}`;
  }

  // 更新營地特色
  updateCampsiteFeatures(camp);

  // 更新營地描述
  const descriptionElement = document.getElementById(
    "campsite-description-content"
  );
  if (descriptionElement) {
    descriptionElement.innerHTML = `<p>${
      camp.campContent || "暫無詳細介紹"
    }</p>`;
  }

  // 更新營地設施
  updateCampsiteAmenities(camp);

  // 更新營地圖片（如果有）
  updateCampsiteImages(camp);

  // 更新評分
  updateRating(camp);
}

/**
 * 更新營地特色
 */
function updateCampsiteFeatures(camp) {
  const featuresElement = document.getElementById("campsite-features");
  if (!featuresElement) return;

  // 根據營地數據生成特色標籤
  const features = [];

  // 基本特色（可以根據實際數據調整）
  features.push(
    '<div class="feature-item"><i class="fas fa-mountain"></i> 山景</div>'
  );
  features.push(
    '<div class="feature-item"><i class="fas fa-shower"></i> 衛浴設施</div>'
  );
  features.push(
    '<div class="feature-item"><i class="fas fa-wifi"></i> 免費WiFi</div>'
  );
  features.push(
    '<div class="feature-item"><i class="fas fa-parking"></i> 停車場</div>'
  );

  // 根據營地位置添加特色
  if (camp.campCity && camp.campCity.includes("宜蘭")) {
    features.push(
      '<div class="feature-item"><i class="fas fa-tint"></i> 溪流</div>'
    );
  }
  if (
    camp.campCity &&
    (camp.campCity.includes("南投") || camp.campCity.includes("花蓮"))
  ) {
    features.push(
      '<div class="feature-item"><i class="fas fa-cloud"></i> 雲海</div>'
    );
  }

  featuresElement.innerHTML = features.join("");
}

/**
 * 更新營地設施
 */
function updateCampsiteAmenities(camp) {
  const amenitiesElement = document.getElementById("amenities-list");
  if (!amenitiesElement) return;

  // 分類設施列表，提供更好的視覺組織
  const amenityCategories = {
    basic: {
      title: '基本設施',
      icon: 'fas fa-home',
      items: [
        { icon: 'fas fa-toilet', name: '乾淨衛浴設施', color: '#4A90E2' },
        { icon: 'fas fa-shower', name: '熱水淋浴', color: '#4A90E2' },
        { icon: 'fas fa-parking', name: '免費停車場', color: '#7ED321' },
        { icon: 'fas fa-bolt', name: '電源插座', color: '#F5A623' }
      ]
    },
    dining: {
      title: '餐飲服務',
      icon: 'fas fa-utensils',
      items: [
        { icon: 'fas fa-utensils', name: '營地餐廳', color: '#BD10E0' },
        { icon: 'fas fa-store', name: '便利商店', color: '#BD10E0' },
        { icon: 'fas fa-fire', name: '烤肉營火區', color: '#D0021B' },
        { icon: 'fas fa-water', name: '飲用水供應', color: '#50E3C2' }
      ]
    },
    entertainment: {
      title: '休閒娛樂',
      icon: 'fas fa-gamepad',
      items: [
        { icon: 'fas fa-child', name: '兒童遊樂區', color: '#F8E71C' },
        { icon: 'fas fa-hiking', name: '登山步道', color: '#7ED321' },
        { icon: 'fas fa-wifi', name: '免費WiFi', color: '#4A90E2' },
        { icon: 'fas fa-swimming-pool', name: '戲水區域', color: '#50E3C2' }
      ]
    }
  };

  // 生成可展開的設施HTML
  let amenitiesHTML = `
    <div class="amenities-container">
      <div class="amenities-header" onclick="toggleAmenities()">
        <h4>
          <i class="fas fa-cogs"></i>
          營地設施
          <span class="amenities-count">(${Object.values(amenityCategories).reduce((total, cat) => total + cat.items.length, 0)}項)</span>
        </h4>
        <i class="fas fa-chevron-down toggle-icon"></i>
      </div>
      <div class="amenities-content" id="amenities-content">
  `;
  
  Object.entries(amenityCategories).forEach(([key, category]) => {
    amenitiesHTML += `
      <div class="amenity-category-compact">
        <h5 class="category-title-compact">
          <i class="${category.icon}"></i>
          ${category.title}
        </h5>
        <div class="amenity-grid-compact">
    `;
    
    category.items.forEach(item => {
      amenitiesHTML += `
        <div class="amenity-item-compact">
          <i class="${item.icon}" style="color: ${item.color}"></i>
          <span>${item.name}</span>
        </div>
      `;
    });
    
    amenitiesHTML += `
        </div>
      </div>
    `;
  });

  amenitiesHTML += `
      </div>
    </div>
  `;

  amenitiesElement.innerHTML = amenitiesHTML;
}

/**
 * 切換設施展開/收合狀態
 */
function toggleAmenities() {
  const content = document.getElementById('amenities-content');
  const toggleIcon = document.querySelector('.toggle-icon');
  
  if (content && toggleIcon) {
    const isExpanded = content.classList.contains('expanded');
    
    if (isExpanded) {
      content.classList.remove('expanded');
      toggleIcon.style.transform = 'rotate(0deg)';
    } else {
      content.classList.add('expanded');
      toggleIcon.style.transform = 'rotate(180deg)';
    }
  }
}

/**
 * 更新營地圖片
 */
function updateCampsiteImages(camp) {
  const mainImage = document.getElementById("main-image");
  if (!mainImage) return;

  // 設置預設圖片或使用營地圖片
  if (camp.campPic && camp.campPic.trim() !== "") {
    mainImage.src = camp.campPic;
  } else {
    // 使用預設圖片
    mainImage.src = "images/camp-1.jpg";
  }

  mainImage.alt = camp.campName || "營地圖片";
  mainImage.style.display = "block";
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
    // 使用 available/Remaing API 的資料，不再調用 getCampsiteTypes
    if (!window.availableRoomData || !window.availableRoomData.data) {
      console.log("沒有可用房型資料，無法更新最低房價");
      return;
    }

    // 從 available/Remaing API 資料中提取房型資訊
    const availableData = window.availableRoomData.data;

    // 篩選當前營地的房型
    const campsiteTypes = availableData.filter((type) => type.campId == campId);

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


// 初始化收藏清單
async function initFavoriteCampIds() {
  const saved =
    localStorage.getItem("currentMember") ||
    sessionStorage.getItem("currentMember");
  if (!saved) return;

  let currentMember;
  try {
    currentMember = JSON.parse(saved);
  } catch {
    window.favoriteCampIds = [];
    return;
  }

  const memId = currentMember.mem_id || currentMember.memId || currentMember.id;
  if (!memId) {
    window.favoriteCampIds = [];
    return;
  }

  try {
    const response = await fetch(
      `${window.api_prefix}/camptracklist/${memId}/getCampTrackLists`
    );
    if (!response.ok) throw new Error("API 錯誤");
    const json = await response.json();
    window.favoriteCampIds = json.data.map((item) => item.campId);
  } catch (error) {
    console.error("載入會員收藏清單失敗", error);
    window.favoriteCampIds = [];
  }
}

// 更新按鈕樣式
function updateFavoriteButton() {
  const campId = parseInt(new URLSearchParams(location.search).get("id"));
  const favBtn = document.getElementById("btn-favorite");
  if (!favBtn || isNaN(campId)) return;

  favBtn.dataset.campId = campId;
  const isFav = window.favoriteCampIds?.includes(campId);
  favBtn.classList.toggle("favorited", isFav);
  favBtn.title = isFav ? "已收藏" : "加入收藏";

  // 同時切換愛心圖示
  const icon = favBtn.querySelector("i");
  if (icon) {
    icon.classList.toggle("fas", isFav);
    icon.classList.toggle("far", !isFav);
  }
}

// 監聽 DOMReady
document.addEventListener("DOMContentLoaded", async () => {
  await initFavoriteCampIds();

  const favBtn = document.getElementById("btn-favorite");
  if (!favBtn) return;

  const campId = parseInt(new URLSearchParams(window.location.search).get("id"));
  if (isNaN(campId)) return;

  favBtn.dataset.campId = campId;

  updateFavoriteButton();

  favBtn.addEventListener("click", async () => {
    // 會員資料
    const saved =
      localStorage.getItem("currentMember") ||
      sessionStorage.getItem("currentMember");
    if (!saved) {
      localStorage.setItem("returnUrl", window.location.href);
      window.location.href = "login.html";
      return;
    }

    let currentMember;
    try {
      currentMember = JSON.parse(saved);
    } catch {
      localStorage.setItem("returnUrl", window.location.href);
      window.location.href = "login.html";
      return;
    }

    const memId = currentMember.mem_id || currentMember.memId || currentMember.id;
    if (!memId) {
      localStorage.setItem("returnUrl", window.location.href);
      window.location.href = "login.html";
      return;
    }

    const campId = parseInt(favBtn.dataset.campId);
    if (!Array.isArray(window.favoriteCampIds)) window.favoriteCampIds = [];

    const isFav = favBtn.classList.contains("favorited");
    const url = `${window.api_prefix}/camptracklist/${isFav ? "deleteCampTrackList" : "addCampTrackList"}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId, memId }),
      });
      if (!response.ok) {
        alert("操作失敗：" + response.statusText);
        return;
      }

      // 更新前端狀態與樣式
      if (isFav) {
        window.favoriteCampIds = window.favoriteCampIds.filter((id) => id !== campId);
      } else {
        window.favoriteCampIds.push(campId);
      }
      updateFavoriteButton();
    } catch {
      alert("網路錯誤，請稍後再試");
    }
  });
});