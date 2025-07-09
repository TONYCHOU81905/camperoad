// 營地資料管理和購物車功能
window.campData = [];
// window.api_prefix = "http://localhost:8080";
window.api_prefix = "http://localhost:8081/CJA101G02";
// window.api_prefix = "http://lutu.ddnsking.com";
let cartItems = [];
let memberData = [];
let currentMember = null;

// 載入營地資料
async function loadCampData() {
  console.log(window.location.origin);
  try {
    // const response = await fetch("http://localhost:8081/CJA101G02/api/camps");
    // console.log("response:", response);
    // const json = await response.json();
    // window.campData = json.data; // 這裡就是你要的陣列
    // console.log(window.campData);
    // const response = await fetch(`${window.api_prefix}/api/getallcamps`);
    const response = await fetch(`${window.api_prefix}/api/getallcamps`, {
      method: "GET",
      // credentials: "include",
    });
    const campDataJson = await response.json();
    window.campData = campDataJson.data;
    console.log("營地資料載入成功:", window.campData.length, "筆資料");
    return window.campData;
  } catch (error) {
    console.error("載入營地資料失敗:", error);
    window.campData = [];
    return [];
  }
}

// 載入會員資料
async function loadMemberData() {
  try {
    const response = await fetch("/data/mem.json");
    memberData = await response.json();
    console.log("會員資料載入成功:", memberData.length, "筆資料");
    return memberData;
  } catch (error) {
    console.error("載入會員資料失敗:", error);
    return [];
  }
}

// 渲染營地卡片
async function renderCampCards(camps, containerId = "camp-cards") {
  const container =
    document.getElementById(containerId) ||
    document.querySelector(".camp-cards");
  if (!container) {
    console.error("找不到營地卡片容器");
    return;
  }

  container.innerHTML = "";

  // 預載入所有房型資料以減少API調用
  const allCampsiteTypes = await loadCampsiteTypesData();
  const urlParams = new URLSearchParams(window.location.search);

  // 使用 DocumentFragment 進行批量DOM操作
  const fragment = document.createDocumentFragment();

  // 批量處理營地卡片創建
  const campCardPromises = camps.map((camp) =>
    createCampCard(camp, allCampsiteTypes, urlParams)
  );

  const campCards = await Promise.all(campCardPromises);
  campCards.forEach((card) => fragment.appendChild(card));

  // 一次性添加到DOM
  container.appendChild(fragment);

  // 如果是搜尋結果頁面，更新結果數量
  if (containerId === "search-results") {
    updateSearchResultsCount(camps.length);
  }
}

// 更新搜尋結果數量
function updateSearchResultsCount(count) {
  const resultsCount = document.getElementById("results-count");
  const totalResults = document.getElementById("total-results");

  if (resultsCount) resultsCount.textContent = count.toString();
  if (totalResults) totalResults.textContent = count.toString();
}

// 初始化營地收藏清單，獲取會員資料與會員
async function initFavoriteCampIds() {
  const saved =
    localStorage.getItem("currentMember") ||
    sessionStorage.getItem("currentMember");
  if (!saved) return;

  const currentMember = JSON.parse(saved);
  const memId = currentMember.mem_id || currentMember.memId || currentMember.id;

  try {
    const response = await fetch(
      `${window.api_prefix}/camptracklist/${memId}/getCampTrackLists`
    );
    const json = await response.json();
    // 假設 API 回傳格式為 { status: "success", data: [{ campId: 1001 }, ...] }
    window.favoriteCampIds = json.data.map((item) => item.campId);
  } catch (error) {
    console.error("載入會員收藏清單失敗", error);
    window.favoriteCampIds = [];
  }
}

// 建立營地卡片
async function createCampCard(camp, preloadedTypes = null, urlParams = null) {
  const card = document.createElement("div");
  card.className = "camp-card";

  // // 預先計算評分和星星HTML
  // const rating = calculateRating(
  //   camp.campCommentSumScore,
  //   camp.campCommentNumberCount
  // );
  // const starsHtml = generateStarsHtml(rating);

  // 重用URL參數，避免重複解析
  if (!urlParams) {
    urlParams = new URLSearchParams(window.location.search);
  }
  const guests = urlParams.get("guests");
  const checkIn = urlParams.get("check-in");
  const checkOut = urlParams.get("check-out");

  // 使用預載入的房型資料或按需載入
  let campsiteTypes;
  if (preloadedTypes) {
    campsiteTypes = preloadedTypes.filter(
      (type) =>
        type.campId == camp.campId &&
        (!guests || parseInt(type.campsitePeople) >= parseInt(guests))
    );
  } else {
    campsiteTypes = await getCampsiteTypesByCampId(camp.campId, guests);
  }

  const priceListHtml = generatePriceListHtml(campsiteTypes);
  const formattedContent = formatCampContent(camp.campContent, 80);
  const regDate = formatDate(camp.campRegDate);

  const isFavorited = window.favoriteCampIds?.includes?.(camp.campId);

  card.innerHTML = `
    <div class="camp-image">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3C/svg%3E" 
           data-src="${window.api_prefix}/api/camps/${camp.campId}/1" 
           alt="${camp.campName}" 
           class="lazy-load" 
           loading="lazy" />
      <span class="camp-tag">熱門</span>
    </div>
    <div class="camp-info">
      <h3>${camp.campName}</h3>
      <p>${formattedContent}</p>
      <p class="camp-location">
        <i class="fas fa-map-marker-alt"></i> ${camp.campCity + camp.campDist}
      </p>
      <p class="camp-date">
        <i class="far fa-calendar-alt"></i> 上架日期: ${regDate}
      </p>
      
      
      <div class="camp-footer">
        <div class="camp-price-list">${priceListHtml}</div>
      </div>
      <div class="camp-actions">
        <a href="campsite-detail.html?id=${
          camp.campId
        }&guests=${guests}&check-in=${checkIn}&check-out=${checkOut}" class="btn-view btn-view-enhanced btn-view-full">
          <i class="fas fa-search-plus"></i> 查看詳情
        </a>
        <button class="btn-toggle-favorite ${isFavorited ? "favorited" : ""}" 
                data-camp-id="${camp.campId}" 
                title="${isFavorited ? "已收藏" : "加入收藏"}">
          <i class="fas fa-heart"></i>
        </button>
      </div>
    </div>
  `;

  const favBtn = card.querySelector(".btn-toggle-favorite");
  if (favBtn) {
    favBtn.addEventListener("click", async () => {
      // 檢查會員登入狀態
      const saved =
        localStorage.getItem("currentMember") ||
        sessionStorage.getItem("currentMember");

      if (!saved) {
        console.log("未找到會員資料，跳轉到登入頁面");
        localStorage.setItem("returnUrl", window.location.href);
        window.location.href = "login.html";
        return;
      }

      let currentMember;
      try {
        currentMember = JSON.parse(saved);
      } catch (e) {
        console.error("解析會員資料失敗:", e);
        localStorage.setItem("returnUrl", window.location.href);
        window.location.href = "login.html";
        return;
      }

      const memId =
        currentMember.mem_id || currentMember.memId || currentMember.id;

      if (!memId) {
        console.log("會員ID無效，跳轉到登入頁面");
        localStorage.setItem("returnUrl", window.location.href);
        window.location.href = "login.html";
        return;
      }

      const campId = parseInt(favBtn.dataset.campId);
      if (!Array.isArray(window.favoriteCampIds)) window.favoriteCampIds = [];

      try {
        const isFav = favBtn.classList.contains("favorited");
        const url = `${window.api_prefix}/camptracklist/${
          isFav ? "deleteCampTrackList" : "addCampTrackList"
        }`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campId, memId }),
        });
        if (!response.ok) {
          alert("操作失敗：" + response.statusText);
          return;
        }
        favBtn.classList.toggle("favorited", !isFav);
        favBtn.title = isFav ? "加入收藏" : "已收藏";
        if (isFav) {
          window.favoriteCampIds = window.favoriteCampIds.filter(
            (id) => id !== campId
          );
        } else if (!window.favoriteCampIds.includes(campId)) {
          window.favoriteCampIds.push(campId);
        }
      } catch (error) {
        alert("網路錯誤，請稍後再試");
      }
    });
  }

  // 設置懶載入
  setupLazyLoading(card);

  return card;
}

// 設置懶載入
function setupLazyLoading(card) {
  const img = card.querySelector(".lazy-load");
  if (!img) return;

  // 使用 Intersection Observer 進行懶載入
  if ("IntersectionObserver" in window) {
    if (!window.campImageObserver) {
      window.campImageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              const realSrc = img.dataset.src;
              if (realSrc) {
                img.src = realSrc;
                img.onload = () => {
                  img.classList.add("loaded");
                };
                img.onerror = () => {
                  img.src = "images/camp-1.jpg"; // 預設圖片
                  img.classList.add("error");
                };
                window.campImageObserver.unobserve(img);
              }
            }
          });
        },
        { rootMargin: "50px" }
      );
    }
    window.campImageObserver.observe(img);
  } else {
    // 降級處理：直接載入圖片
    img.src = img.dataset.src;
  }
}

// 初始化營地收藏清單，獲取會員資料與會員
async function initFavoriteCampIds() {
  const saved =
    localStorage.getItem("currentMember") ||
    sessionStorage.getItem("currentMember");
  if (!saved) return;

  const currentMember = JSON.parse(saved);
  const memId = currentMember.mem_id || currentMember.memId || currentMember.id;

  try {
    const response = await fetch(
      `${window.api_prefix}/camptracklist/${memId}/getCampTrackLists`
    );
    const json = await response.json();
    // 假設 API 回傳格式為 { status: "success", data: [{ campId: 1001 }, ...] }
    window.favoriteCampIds = json.data.map((item) => item.campId);
  } catch (error) {
    console.error("載入會員收藏清單失敗", error);
    window.favoriteCampIds = [];
  }
}

// 載入營地房型資料
let campsiteTypesData = null;

async function loadCampsiteTypesData() {
  if (campsiteTypesData) {
    return campsiteTypesData;
  }

  try {
    const response = await fetch(
      `${window.api_prefix}/campsitetype/getAllCampsiteTypes`
    );
    const campsiteTypesDataJson = await response.json();
    campsiteTypesData = campsiteTypesDataJson.data;
    return campsiteTypesData;
  } catch (error) {
    console.error("載入房型資料失敗:", error);
    return [];
  }
}

// 根據營地ID取得房型資料
async function getCampsiteTypesByCampId(campId, guestCount) {
  const allTypes = await loadCampsiteTypesData();
  console.log("getCampsiteTypesByCampId:" + guestCount);

  const allTypeFilter = allTypes.filter(
    (type) =>
      type.campId == campId && parseInt(type.campsitePeople) >= guestCount
  );
  return allTypeFilter;
}

// 生成價格列表HTML
function generatePriceListHtml(campsiteTypes) {
  if (!campsiteTypes || campsiteTypes.length === 0) {
    return '<div class="price-item">NT$ 2,000 <span>/ 晚</span></div>';
  }

  return campsiteTypes
    .map((type) => {
      return `
      <div class="price-item">
        <span class="room-type">${type.campsiteName}</span>
        <span class="room-people">(${type.campsitePeople}人)</span>
        <span class="room-price">NT$ ${type.campsitePrice.toLocaleString()}</span>
        <span class="price-unit">/ 晚</span>
      </div>
    `;
    })
    .join("");
}

// 格式化營地內容，限制長度並美化顯示
function formatCampContent(content, maxLength) {
  if (!content) return "";

  // 如果內容超過最大長度，截斷並添加省略號
  if (content.length > maxLength) {
    return content.substring(0, maxLength) + "...";
  }

  return content;
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return "未知";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // 如果日期無效，返回原始字符串

    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return dateString; // 如果解析出錯，返回原始字符串
  }
}

// 計算星星評分
function calculateRating(sunScore, commentCount) {
  if (!sunScore || !commentCount || commentCount === 0) {
    return 0;
  }
  return sunScore / commentCount;
}

// 生成星星評分HTML
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

// 購物車功能
function initCartFunctions() {
  // 從localStorage載入購物車資料
  const savedCart = localStorage.getItem("campingCart");
  if (savedCart) {
    cartItems = JSON.parse(savedCart);
    updateCartBadge();
  }

  // 綁定加入購物車按鈕事件
  document.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("btn-add-cart") ||
      e.target.closest(".btn-add-cart")
    ) {
      e.preventDefault();
      const button = e.target.classList.contains("btn-add-cart")
        ? e.target
        : e.target.closest(".btn-add-cart");
      addToCart(button);
    }
  });
}

// 加入購物車
function addToCart(button) {
  // 獲取商品資訊（這裡需要根據實際頁面結構調整）
  const productInfo = {
    id: Date.now(), // 臨時ID，實際應該從資料獲取
    name: "露營商品",
    price: 1000,
    quantity: 1,
    image: "images/default-product.jpg",
  };

  // 檢查是否已存在相同商品
  const existingItem = cartItems.find((item) => item.id === productInfo.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push(productInfo);
  }

  // 儲存到localStorage
  localStorage.setItem("campingCart", JSON.stringify(cartItems));

  // 更新購物車徽章
  updateCartBadge();

  // 顯示成功訊息
  showCartMessage("商品已加入購物車！");
}

// 更新購物車徽章數量
function updateCartBadge() {
  const badge = document.querySelector(".cart-count");
  if (badge) {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? "block" : "none";
  }
}

// 顯示購物車訊息
function showCartMessage(message) {
  // 建立訊息元素
  const messageDiv = document.createElement("div");
  messageDiv.className = "cart-message";
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  // 添加動畫樣式
  if (!document.querySelector("#cart-message-style")) {
    const style = document.createElement("style");
    style.id = "cart-message-style";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(messageDiv);

  // 3秒後移除訊息
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// 會員登入功能
function loginMember(memId, password) {
  const member = memberData.find(
    (m) => m.mem_id === memId && m.mem_pwd === password
  );

  if (member) {
    currentMember = member;
    localStorage.setItem("currentMember", JSON.stringify(member));
    updateMemberDisplay();
    return true;
  }

  return false;
}

// 會員登出
function logoutMember() {
  currentMember = null;
  localStorage.removeItem("currentMember");
  updateMemberDisplay();
}

// 更新會員顯示
function updateMemberDisplay() {
  const loginBtn = document.querySelector(".btn-login");
  const userActions = document.querySelector(".user-actions");

  if (currentMember && loginBtn) {
    // 替換登入按鈕為會員資訊
    loginBtn.innerHTML = `
      <img src="images/user-3.jpg" alt="會員頭像" class="user-avatar">
      <span class="user-name">${currentMember.memName}</span>
    `;
    loginBtn.href = "user-profile.html";
    loginBtn.classList.add("logged-in");
    loginBtn.onclick = function (e) {
      // 直接跳轉到個人資料頁面
      window.location.href = "user-profile.html";
    };
  } else if (loginBtn) {
    // 恢復登入按鈕
    const currentPage = window.location.pathname;
    if (currentPage.includes("index.html") || currentPage === "/") {
      loginBtn.innerHTML = "登入 / 註冊";
    } else {
      loginBtn.innerHTML = '<i class="fas fa-user"></i>';
    }
    loginBtn.href = "login.html";
    loginBtn.classList.remove("logged-in");
    loginBtn.onclick = null;
  }
}

// 顯示會員選單
function showMemberMenu() {
  // 這裡可以實作會員選單的顯示邏輯
  const menu = document.createElement("div");
  menu.className = "member-menu";
  menu.style.cssText = `
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
  `;

  menu.innerHTML = `
    <div style="padding: 10px; border-bottom: 1px solid #eee;">
      <strong>${currentMember.mem_name}</strong><br>
      <small>${currentMember.mem_email}</small>
    </div>
    <div style="padding: 10px;">
      <a href="#" onclick="logoutMember(); this.closest('.member-menu').remove();">登出</a>
    </div>
  `;

  // 移除現有選單
  const existingMenu = document.querySelector(".member-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  // 添加新選單
  const userActions = document.querySelector(".user-actions");
  if (userActions) {
    userActions.style.position = "relative";
    userActions.appendChild(menu);

    // 點擊其他地方關閉選單
    setTimeout(() => {
      document.addEventListener("click", function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener("click", closeMenu);
        }
      });
    }, 100);
  }
}

// 初始化函數
async function initCampData() {
  // 載入資料
  await loadCampData();
  await loadMemberData();
  await initFavoriteCampIds(); // 載入收藏資料

  // 檢查是否有已登入的會員
  const savedMember = localStorage.getItem("currentMember");
  if (savedMember) {
    currentMember = JSON.parse(savedMember);
    updateMemberDisplay();
  }

  // 初始化購物車
  initCartFunctions();

  // 根據頁面渲染營地資料
  const currentPath = window.location.pathname;

  if (currentPath.includes("index.html") || currentPath === "/") {
    // 首頁始終只顯示前3個營地，無論URL是否帶有參數
    renderCampCards(campData.slice(0, 3));
    console.log("首頁顯示3個營地卡片");
  } else if (currentPath.includes("campsites.html")) {
    console.log("營地列表頁");

    // 營地列表頁顯示所有營地
    renderCampCards(campData);
  }
}

// 頁面載入完成後初始化
document.addEventListener("DOMContentLoaded", function () {
  initCampData();
});
