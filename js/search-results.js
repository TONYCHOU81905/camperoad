document.addEventListener("DOMContentLoaded", function () {
  // 載入營地資料並渲染搜尋結果
  loadSearchResults();

  // 初始化排序功能
  initSorting();

  // 初始化分頁功能
  initPagination();

  // 解析URL參數並顯示搜尋條件
  parseUrlParams();

  // 更新營地卡片連結
  updateCampsiteLinks();

  // 模擬頁面載入
  simulatePageLoading();
});

// 載入搜尋結果
async function loadSearchResults() {
  try {
    // 等待營地資料載入
    if (!campData || campData.length === 0) {
      await loadCampData();
    }

    // 渲染所有營地到搜尋結果頁面
    renderCampCards(campData, "search-results");

    // 初始化搜尋結果
    initSearchResults();
  } catch (error) {
    console.error("載入搜尋結果失敗:", error);
    showNoResults();
  }
}

// 顯示無結果狀態
function showNoResults() {
  const searchResults = document.getElementById("search-results");
  const noResults = document.getElementById("no-results");

  if (searchResults) searchResults.style.display = "none";
  if (noResults) noResults.style.display = "block";

  updateSearchResultsCount(0);
}

// 初始化搜尋結果
function initSearchResults() {
  const searchResults = document.getElementById("search-results");
  const noResults = document.getElementById("no-results");
  const resultsCount = document.getElementById("results-count");
  const totalResults = document.getElementById("total-results");

  // 檢查是否有搜尋結果
  const hasResults = searchResults.children.length > 0;

  if (!hasResults) {
    // 如果沒有結果，顯示無結果訊息
    searchResults.style.display = "none";
    noResults.style.display = "block";
    document.getElementById("pagination").style.display = "none";
    if (resultsCount) resultsCount.textContent = "0";
    if (totalResults) totalResults.textContent = "0";
  } else {
    // 更新結果數量
    const count = searchResults.children.length;
    if (resultsCount) resultsCount.textContent = count.toString();
    if (totalResults) totalResults.textContent = count.toString();
  }
}

// 初始化排序功能
function initSorting() {
  const sortSelect = document.getElementById("sort-by");
  if (!sortSelect) return;

  sortSelect.addEventListener("change", function () {
    const sortValue = this.value;
    const searchResults = document.getElementById("search-results");
    const campCards = Array.from(
      searchResults.getElementsByClassName("camp-card")
    );

    // 根據選擇的排序方式進行排序
    switch (sortValue) {
      case "price-low":
        sortByPrice(campCards, true);
        break;
      case "price-high":
        sortByPrice(campCards, false);
        break;
      case "rating":
        sortByRating(campCards);
        break;
      case "popular":
        sortByPopularity(campCards);
        break;
      case "new":
        sortByNew(campCards);
        break;
    }

    // 清空並重新添加排序後的卡片
    searchResults.innerHTML = "";
    campCards.forEach((card) => {
      searchResults.appendChild(card);
    });

    // 顯示載入動畫
    showLoadingOverlay();
  });
}

// 按價格排序
function sortByPrice(cards, ascending) {
  return cards.sort((a, b) => {
    const priceA = extractPrice(a.querySelector(".camp-price").textContent);
    const priceB = extractPrice(b.querySelector(".camp-price").textContent);
    return ascending ? priceA - priceB : priceB - priceA;
  });
}

// 按評分排序
function sortByRating(cards) {
  return cards.sort((a, b) => {
    const ratingA = countStars(a.querySelector(".stars"));
    const ratingB = countStars(b.querySelector(".stars"));
    return ratingB - ratingA;
  });
}

// 按人氣（評論數）排序
function sortByPopularity(cards) {
  return cards.sort((a, b) => {
    const reviewsA = extractReviewCount(
      a.querySelector(".rating-count").textContent
    );
    const reviewsB = extractReviewCount(
      b.querySelector(".rating-count").textContent
    );
    return reviewsB - reviewsA;
  });
}

// 按新上架排序（這裡使用標籤作為判斷依據）
function sortByNew(cards) {
  return cards.sort((a, b) => {
    const isNewA = a.querySelector(".camp-tag").textContent.includes("新上架")
      ? 1
      : 0;
    const isNewB = b.querySelector(".camp-tag").textContent.includes("新上架")
      ? 1
      : 0;
    return isNewB - isNewA;
  });
}

// 提取價格數字
function extractPrice(priceText) {
  const match = priceText.match(/\d+[,\d]*/g);
  if (match && match.length > 0) {
    return parseInt(match[0].replace(/,/g, ""));
  }
  return 0;
}

// 計算星星數量
function countStars(starsElement) {
  if (!starsElement) return 0;
  const fullStars = starsElement.querySelectorAll(".fa-star").length;
  const halfStars = starsElement.querySelectorAll(".fa-star-half-alt").length;
  return fullStars + halfStars * 0.5;
}

// 提取評論數量
function extractReviewCount(countText) {
  const match = countText.match(/\d+/);
  if (match && match.length > 0) {
    return parseInt(match[0]);
  }
  return 0;
}

// 初始化分頁功能
function initPagination() {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  const pageLinks = pagination.querySelectorAll("a");
  pageLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // 移除所有活動頁面的標記
      pageLinks.forEach((l) => l.classList.remove("active"));

      // 將當前頁面標記為活動頁面
      this.classList.add("active");

      // 顯示載入動畫
      showLoadingOverlay();

      // 模擬頁面切換（實際專案中這裡會加載新的數據）
      setTimeout(() => {
        hideLoadingOverlay();
      }, 1000);
    });
  });
}

// 解析URL參數並顯示搜尋條件
function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);

  // 地區
  if (urlParams.has("location")) {
    const locationValue = urlParams.get("location");
    const locationMap = {
      north: "北部",
      central: "中部",
      south: "南部",
      east: "東部",
      island: "離島",
    };
    const locationElement = document.getElementById("location-criteria");
    if (locationElement && locationValue) {
      const displayValue = locationMap[locationValue] || locationValue;
      locationElement.querySelector(".criteria-value").textContent =
        displayValue;
    }
  }

  // 日期
  if (urlParams.has("check-in") && urlParams.has("check-out")) {
    const checkIn = urlParams.get("check-in");
    const checkOut = urlParams.get("check-out");
    const dateElement = document.getElementById("date-criteria");
    if (dateElement && checkIn && checkOut) {
      const formattedCheckIn = formatDate(checkIn);
      const formattedCheckOut = formatDate(checkOut);
      dateElement.querySelector(
        ".criteria-value"
      ).textContent = `${formattedCheckIn} - ${formattedCheckOut}`;
    }
  }

  // 人數
  if (urlParams.has("guests")) {
    const guestsValue = urlParams.get("guests");
    const guestsMap = {
      "1-2": "1-2人",
      "3-4": "3-4人",
      "5-8": "5-8人",
      "9+": "9人以上",
    };
    const guestsElement = document.getElementById("guests-criteria");
    if (guestsElement && guestsValue) {
      const displayValue = guestsMap[guestsValue] || guestsValue;
      guestsElement.querySelector(".criteria-value").textContent = displayValue;
    }
  }

  // 價格範圍
  if (urlParams.has("price")) {
    const priceValue = urlParams.get("price");
    const priceMap = {
      "0-2000": "NT$0 - NT$2,000",
      "2000-3000": "NT$2,000 - NT$3,000",
      "3000-5000": "NT$3,000 - NT$5,000",
      "5000+": "NT$5,000以上",
    };
    const priceElement = document.getElementById("price-criteria");
    if (priceElement && priceValue) {
      const displayValue = priceMap[priceValue] || priceValue;
      priceElement.querySelector(".criteria-value").textContent = displayValue;
    }
  }

  // 特色（從進階篩選中獲取）
  const features = urlParams.getAll("features");
  if (features.length > 0) {
    const featureMap = {
      mountain: "山景",
      river: "溪流",
      sea: "海景",
      forest: "森林",
      stargazing: "觀星",
    };
    const featureElement = document.getElementById("features-criteria");
    if (featureElement) {
      const displayValues = features.map((f) => featureMap[f] || f).join(", ");
      featureElement.querySelector(".criteria-value").textContent =
        displayValues;
    }
  }
}

// 更新營地卡片連結，添加日期參數
function updateCampsiteLinks() {
  const urlParams = new URLSearchParams(window.location.search);
  const checkIn = urlParams.get("check-in");
  const checkOut = urlParams.get("check-out");
  const guests = urlParams.get("guests");

  // 如果有日期參數，更新所有營地卡片的連結
  if (checkIn && checkOut) {
    const campLinks = document.querySelectorAll(".btn-view");
    campLinks.forEach((link, index) => {
      // 獲取原始連結
      const originalHref = link.getAttribute("href");
      // 解析原始連結中的參數
      const hrefParts = originalHref.split("?");
      const baseUrl = hrefParts[0];
      const existingParams = new URLSearchParams(hrefParts[1] || "");

      // 設置營地ID（如果原始連結沒有ID參數，則使用索引+1作為ID）
      const campsiteId = existingParams.get("id") || (index + 1).toString();

      // 構建新的URL參數
      const newParams = new URLSearchParams();
      newParams.set("id", campsiteId);
      newParams.set("check-in", checkIn);
      newParams.set("check-out", checkOut);
      if (guests) {
        newParams.set("guests", guests);
      }

      // 更新連結
      link.setAttribute("href", `${baseUrl}?${newParams.toString()}`);
    });
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}/${month}/${day}`;
}

// 顯示載入動畫
function showLoadingOverlay() {
  const loadingOverlay = document.querySelector(".loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.classList.add("active");
  }
}

// 隱藏載入動畫
function hideLoadingOverlay() {
  const loadingOverlay = document.querySelector(".loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.classList.remove("active");
  }
}

// 模擬頁面載入
function simulatePageLoading() {
  showLoadingOverlay();

  setTimeout(() => {
    hideLoadingOverlay();
  }, 1500);
}
