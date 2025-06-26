// 營地資料管理和購物車功能
window.campData = [];
window.api_prefix = "http://localhost:8081/CJA101G02";
let cartItems = [];
let memberData = [];
let currentMember = null;

// 載入營地資料
async function loadCampData() {
  try {
    // const response = await fetch("http://localhost:8081/CJA101G02/api/camps");
    // console.log("response:", response);
    // const json = await response.json();
    // window.campData = json.data; // 這裡就是你要的陣列
    // console.log(window.campData);
    const response = await fetch("/data/camp.json");
    window.campData = await response.json();
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
function renderCampCards(camps, containerId = "camp-cards") {
  const container =
    document.getElementById(containerId) ||
    document.querySelector(".camp-cards");
  if (!container) {
    console.error("找不到營地卡片容器");
    return;
  }

  container.innerHTML = "";

  camps.forEach(async (camp) => {
    const campCard = await createCampCard(camp);
    container.appendChild(campCard);
  });

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

// 建立營地卡片
async function createCampCard(camp) {
  const card = document.createElement("div");
  card.className = "camp-card";

  // 計算星星評分
  const rating = calculateRating(
    camp.camp_comment_sun_score,
    camp.camp_comment_number_count
  );
  const starsHtml = generateStarsHtml(rating);

  //確認URL夾帶資料
  const urlParams = new URLSearchParams(window.location.search);
  const guests = urlParams.get("guests");
  const checkIn = urlParams.get("check-in");
  const checkOut = urlParams.get("check-out");

  // 載入該營地的房型資料
  const campsiteTypes = await getCampsiteTypesByCampId(camp.camp_id, guests);
  const priceListHtml = generatePriceListHtml(campsiteTypes);

  // 格式化營地內容，限制長度並美化顯示
  const formattedContent = formatCampContent(camp.camp_content, 80);

  // 格式化註冊日期
  const regDate = formatDate(camp.camp_reg_date);

  card.innerHTML = `
        <div class="camp-image">
            <img src="${
              "data:image/jpeg;base64," + camp.campPic1 || "images/camp-1.jpg"
            }" alt="${camp.camp_name}" />
            <span class="camp-tag">熱門</span>
        </div>
        <div class="camp-info">
            <h3>${camp.camp_name}</h3>
            <p>${formattedContent}</p>
            <p class="camp-location">
                <i class="fas fa-map-marker-alt"></i> ${
                  camp.camp_city + camp.camp_dist
                }
            </p>
            <p class="camp-date">
                <i class="far fa-calendar-alt"></i> 上架日期: ${regDate}
            </p>
            <div class="camp-rating">
                <div class="stars">
                    ${starsHtml}
                </div>
                <span class="rating-count">(${
                  camp.camp_comment_number_count || 0
                })</span>
            </div>
            <div class="camp-features">
                <span><i class="fas fa-mountain"></i> 山景</span>
                <span><i class="fas fa-shower"></i> 衛浴</span>
                <span><i class="fas fa-utensils"></i> 餐廳</span>
            </div>
            <div class="camp-footer">
                <div class="camp-price-list">
                    ${priceListHtml}
                </div>
            </div>
            <div class="camp-actions">
                <a href="campsite-detail.html?id=${
                  camp.camp_id
                }&guests=${guests}&check-in=${checkIn}&check-out=${checkOut}" class="btn-view btn-view-enhanced btn-view-full">
                    <i class="fas fa-search-plus"></i> 查看詳情
                </a>
            </div>
        </div>
    `;

  return card;
}

// 載入營地房型資料
let campsiteTypesData = null;

async function loadCampsiteTypesData() {
  if (campsiteTypesData) {
    return campsiteTypesData;
  }

  try {
    const response = await fetch("/data/campsite_type.json");
    campsiteTypesData = await response.json();
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
      type.camp_id == campId && parseInt(type.campsite_people) >= guestCount
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
        <span class="room-type">${type.campsite_name}</span>
        <span class="room-people">(${type.campsite_people}人)</span>
        <span class="room-price">NT$ ${type.campsite_price.toLocaleString()}</span>
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
      <span class="user-name">${currentMember.mem_name}</span>
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
