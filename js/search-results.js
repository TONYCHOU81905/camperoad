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

  // 初始化修改搜尋按鈕
  initModifySearchButton();

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

    // 等待台灣地區資料載入
    await loadTaiwanDistrictData();

    // 根據搜尋條件篩選營地
    const filteredCamps = await filterCampsBySearchCriteria();

    // 使用分頁渲染篩選後的營地
    await renderPaginatedResults(filteredCamps);
    console.log(
      "renderPaginatedResults from search-result: " + filteredCamps.length
    );

    // 初始化搜尋結果
    initSearchResults();
  } catch (error) {
    console.error("載入搜尋結果失敗:", error);
    showNoResults();
  }
}

// 根據搜尋條件篩選營地
async function filterCampsBySearchCriteria() {
  const urlParams = new URLSearchParams(window.location.search);
  let filteredCamps = [...campData];

  // 根據地區篩選
  const location = urlParams.get("location");
  console.log("location:" + location);
  console.log(taiwanDistrictData);

  if (location && taiwanDistrictData) {
    const regionCounties = taiwanDistrictData[location].County;
    console.log("regionCounties:" + regionCounties);

    if (regionCounties) {
      filteredCamps = filteredCamps.filter((camp) =>
        regionCounties.includes(camp.camp_city)
      );
    }
  }

  // 根據縣市篩選
  const county = urlParams.get("county");
  if (county) {
    filteredCamps = filteredCamps.filter((camp) => camp.camp_city == county);
  }

  // 根據鄉鎮市區篩選
  // const district = urlParams.get('district');
  // if (district) {
  //   filteredCamps = filteredCamps.filter(camp =>
  //     camp.camp_dist === district
  //   );
  // }

  // 檢查是否有日期和人數參數，如果有則調用API檢查可用性
  const checkIn = urlParams.get("check-in");
  const checkOut = urlParams.get("check-out");
  const guests = urlParams.get("guests");
  console.log("checkIn:" + checkIn);
  console.log("checkOut:" + checkOut);
  console.log("guests:" + guests);
  if (checkIn && checkOut && guests) {
    console.log("日期篩選");
    // 如果有完整的搜尋條件，調用API獲取可用營地
    const availableCamps = await getAvailableCampsFromAPI(
      checkIn,
      checkOut,
      guests,
      filteredCamps
    );
    return availableCamps;
  }

  // 根據人數篩選（原有邏輯，當沒有日期時使用）
  if (guests) {
    const guestCount = parseInt(guests);
    console.log("篩選人數:" + guestCount);

    // 載入房型資料
    await loadCampsiteTypesData();

    // 篩選出有符合人數條件房型的營地
    filteredCamps = filteredCamps.filter(async (camp) => {
      console.log("camp_id1:" + camp.camp_id);

      const campsiteTypes = await getCampsiteTypesByCampId(
        camp.camp_id,
        guestCount
      );

      // 檢查是否有房型可容納指定人數或更多

      return campsiteTypes.filter(
        (type) => parseInt(type.campsite_people) >= parseInt(guestCount)
      );
    });

    // console.log("人數篩選後的營地數量:" + filteredCamps[0]);
  }

  return filteredCamps;
}

// 調用API獲取可用營地
async function getAvailableCampsFromAPI(
  checkIn,
  checkOut,
  guests,
  filteredCamps
) {
  try {
    // 從篩選後的營地中提取campId列表
    const campIds = filteredCamps.map((camp) => camp.camp_id);
    console.log("準備查詢的營地ID列表:", campIds);

    // 構建API請求參數
    const requestBody = new URLSearchParams();
    campIds.forEach((id) => {
      requestBody.append("campIds", id);
    });
    requestBody.append("people", guests);
    requestBody.append("checkIn", checkIn);
    requestBody.append("checkOut", checkOut);

    console.log("API請求參數:", requestBody.toString());

    // 調用API
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
      throw new Error(`API請求失敗: ${response.status}`);
    }

    const apiResult = await response.json();
    console.log("API回應:", apiResult);

    if (apiResult.status === "success" && apiResult.data) {
      // 從API回應中提取有可用房型的營地ID
      const availableCampIds = [
        ...new Set(apiResult.data.map((item) => item.campId)),
      ];
      console.log("有可用房型的營地ID:", availableCampIds);

      // 篩選出有可用房型的營地
      const availableCamps = filteredCamps.filter((camp) =>
        availableCampIds.includes(parseInt(camp.camp_id))
      );

      console.log("最終可用營地數量:", availableCamps.length);
      return availableCamps;
    } else {
      console.warn("API回應格式異常或無可用資料");
      return [];
    }
  } catch (error) {
    console.error("調用可用性API失敗:", error);
    // 如果API調用失敗，返回原始篩選結果
    return filteredCamps;
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
  const pagination = document.getElementById("pagination");

  // 檢查是否有搜尋結果（使用總數量而不是當前頁面的數量）
  const hasResults = totalItems > 0;
  console.log("total searchResults:" + totalItems);

  if (!hasResults) {
    // 如果沒有結果，顯示無結果訊息
    searchResults.style.display = "none";
    noResults.style.display = "block";
    if (pagination) pagination.style.display = "none";
    updateSearchResultsCount(0);
  } else {
    // 確保搜尋結果容器顯示
    searchResults.style.display = "grid";
    noResults.style.display = "none";
  }
}

// 初始化排序功能
function initSorting() {
  const sortSelect = document.getElementById("sort-by");
  if (!sortSelect) return;

  sortSelect.addEventListener("change", function () {
    const sortValue = this.value;

    // 如果沒有營地資料，直接返回
    if (!allCampCards || allCampCards.length === 0) return;

    // 顯示載入動畫
    showLoadingOverlay();

    // 使用setTimeout來確保載入動畫能夠顯示
    setTimeout(() => {
      // 對所有營地資料進行排序
      let sortedCamps = [...allCampCards];

      switch (sortValue) {
        case "price-low":
          sortedCamps = sortCampsByPrice(sortedCamps, true);
          break;
        case "price-high":
          sortedCamps = sortCampsByPrice(sortedCamps, false);
          break;
        case "rating":
          sortedCamps = sortCampsByRating(sortedCamps);
          break;
        case "popular":
          sortedCamps = sortCampsByPopularity(sortedCamps);
          break;
        case "new":
          sortedCamps = sortCampsByNew(sortedCamps);
          break;
        default:
          // 預設排序或無排序
          break;
      }

      // 更新營地資料並重新渲染分頁
      allCampCards = sortedCamps;
      currentPage = 1; // 重置到第一頁
      displayCurrentPage();
      generatePagination(Math.ceil(totalItems / itemsPerPage));

      // 隱藏載入動畫
      hideLoadingOverlay();
    }, 300);
  });
}

// 按價格排序（針對營地資料物件）
function sortCampsByPrice(camps, ascending) {
  return camps.sort((a, b) => {
    // 基於營地ID生成固定的價格，確保排序一致性
    const priceA = generateFixedPrice(a.camp_id);
    const priceB = generateFixedPrice(b.camp_id);
    return ascending ? priceA - priceB : priceB - priceA;
  });
}

// 基於營地ID生成固定價格
function generateFixedPrice(campId) {
  // 使用營地ID作為種子生成固定的價格
  const seed = parseInt(campId) || 1;
  const price = 2000 + ((seed * 137) % 3001); // 生成2000-5000之間的固定價格
  return price;
}

// 按評分排序（針對營地資料物件）
function sortCampsByRating(camps) {
  return camps.sort((a, b) => {
    const ratingA = calculateRating(
      a.camp_comment_sun_score,
      a.camp_comment_number_count
    );
    const ratingB = calculateRating(
      b.camp_comment_sun_score,
      b.camp_comment_number_count
    );
    return ratingB - ratingA;
  });
}

// 按人氣（評論數）排序（針對營地資料物件）
function sortCampsByPopularity(camps) {
  return camps.sort((a, b) => {
    const reviewsA = parseInt(a.camp_comment_number_count) || 0;
    const reviewsB = parseInt(b.camp_comment_number_count) || 0;
    return reviewsB - reviewsA;
  });
}

// 按新上架排序（針對營地資料物件）
function sortCampsByNew(camps) {
  return camps.sort((a, b) => {
    const dateA = new Date(a.camp_reg_date);
    const dateB = new Date(b.camp_reg_date);
    return dateB - dateA; // 最新的在前面
  });
}

// 舊的DOM排序函數（保留以防其他地方使用）
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

// 分頁相關變數
let currentPage = 1;
let itemsPerPage = 9;
let totalItems = 0;
let allCampCards = [];

// 初始化分頁功能
function initPagination() {
  // 分頁功能將在renderPaginatedResults中動態生成
}

// 渲染分頁結果
async function renderPaginatedResults(camps) {
  totalItems = camps.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // 重置到第一頁
  currentPage = 1;

  // 儲存所有營地資料
  allCampCards = camps;

  // 顯示當前頁面的營地
  await displayCurrentPage();

  // 生成分頁控制項
  generatePagination(totalPages);
}

// 顯示當前頁面的營地
async function displayCurrentPage() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageCamps = allCampCards.slice(startIndex, endIndex);

  // 清空並渲染當前頁面的營地
  const searchResults = document.getElementById("search-results");
  if (searchResults) {
    searchResults.innerHTML = "";

    // 使用Promise.all來並行處理所有營地卡片的創建
    const campCardPromises = currentPageCamps.map((camp) =>
      createCampCard(camp)
    );
    const campCards = await Promise.all(campCardPromises);

    campCards.forEach((campCard) => {
      searchResults.appendChild(campCard);
    });
  }

  // 更新結果數量顯示
  updateSearchResultsCount(totalItems);
}

// 生成分頁控制項
function generatePagination(totalPages) {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  // 如果只有一頁或沒有結果，隱藏分頁
  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";
  pagination.innerHTML = "";

  // 上一頁按鈕
  if (currentPage > 1) {
    const prevBtn = createPageButton(
      "<i class='fas fa-chevron-left'></i>",
      currentPage - 1
    );
    pagination.appendChild(prevBtn);
  }

  // 頁碼按鈕
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = createPageButton(i.toString(), i);
    if (i === currentPage) {
      pageBtn.classList.add("active");
    }
    pagination.appendChild(pageBtn);
  }

  // 下一頁按鈕
  if (currentPage < totalPages) {
    const nextBtn = createPageButton(
      "<i class='fas fa-chevron-right'></i>",
      currentPage + 1
    );
    pagination.appendChild(nextBtn);
  }
}

// 創建分頁按鈕
function createPageButton(text, pageNumber) {
  const button = document.createElement("a");
  button.href = "#";
  button.innerHTML = text;

  button.addEventListener("click", async function (e) {
    e.preventDefault();

    if (pageNumber !== currentPage) {
      currentPage = pageNumber;
      await displayCurrentPage();
      generatePagination(Math.ceil(totalItems / itemsPerPage));

      // 滾動到頁面頂部
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  return button;
}

// 解析URL參數並顯示搜尋條件
function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchCriteriaContainer = document.querySelector(".search-criteria");

  // 檢查是否有任何搜尋參數
  const hasSearchParams =
    urlParams.has("location") ||
    urlParams.has("county") ||
    urlParams.has("district") ||
    urlParams.has("check-in") ||
    urlParams.has("check-out") ||
    urlParams.has("guests");

  // 如果沒有搜尋參數，隱藏搜尋條件區塊
  if (!hasSearchParams && searchCriteriaContainer) {
    searchCriteriaContainer.style.display = "none";
    return;
  }

  // 載入台灣地區分類資料
  loadTaiwanDistrictData().then(() => {
    // 處理地區參數
    if (urlParams.has("location")) {
      const locationValue = urlParams.get("location");
      const locationElement = document.getElementById("location-criteria");
      if (locationElement && locationValue) {
        let displayText = taiwanDistrictData[locationValue].DistName; // 直接使用地區名稱

        // 如果還有縣市和鄉鎮市區參數，也一併顯示
        const countyValue = urlParams.get("county");
        const districtValue = urlParams.get("district");

        if (countyValue) {
          displayText += ` - ${countyValue}`;
          if (districtValue) {
            displayText += ` - ${districtValue}`;
          }
        }

        locationElement.querySelector(".criteria-value").textContent =
          displayText;
      }
    } else if (urlParams.has("county")) {
      // 如果沒有地區參數但有縣市參數，根據縣市判斷地區
      const countyValue = urlParams.get("county");
      const districtValue = urlParams.get("district");

      const region = getRegionByCounty(countyValue);

      const locationElement = document.getElementById("location-criteria");
      if (locationElement && region) {
        let displayText = region;
        if (countyValue) {
          displayText += ` - ${countyValue}`;
          if (districtValue) {
            displayText += ` - ${districtValue}`;
          }
        }
        locationElement.querySelector(".criteria-value").textContent =
          displayText;
      }
    }
  });

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

// 更新營地卡片連結，添加日期和人數參數
function updateCampsiteLinks() {
  const urlParams = new URLSearchParams(window.location.search);
  const checkIn = urlParams.get("check-in");
  const checkOut = urlParams.get("check-out");
  const guests = urlParams.get("guests");

  console.log("updateCampsiteLinks - 當前URL參數:", {
    checkIn,
    checkOut,
    guests,
  });

  // 更新所有營地卡片的連結
  const campLinks = document.querySelectorAll(".btn-view");
  console.log(`找到 ${campLinks.length} 個營地卡片連結`);

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

    // 添加日期參數（如果有）
    if (checkIn && checkOut) {
      newParams.set("check-in", checkIn);
      newParams.set("check-out", checkOut);
    }

    // 添加人數參數（如果有）
    if (guests) {
      newParams.set("guests", guests);
    } else {
      // 如果沒有人數參數，默認設置為2人
      newParams.set("guests", "2");
    }

    // 更新連結
    const newHref = `${baseUrl}?${newParams.toString()}`;
    link.setAttribute("href", newHref);
    console.log(`更新連結 ${index + 1}:`, newHref);

    // 添加點擊事件，在控制台輸出訊息（用於調試）
    link.addEventListener("click", function (e) {
      // 阻止默認行為，以便在控制台查看參數（僅用於調試，實際使用時應移除）
      // e.preventDefault();

      console.log(
        `點擊查看詳情，前往營地ID: ${campsiteId}，日期: ${checkIn} 至 ${checkOut}，人數: ${
          guests || "2"
        }`
      );
    });
  });
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

// 初始化修改搜尋按鈕
function initModifySearchButton() {
  const modifySearchBtn = document.getElementById("btn-modify-search");
  if (!modifySearchBtn) return;

  // 獲取當前URL參數
  const urlParams = new URLSearchParams(window.location.search);

  // 構建帶參數的index.html URL
  const indexUrl = new URL(
    "index.html",
    window.location.origin + window.location.pathname.replace(/[^/]*$/, "")
  );

  // 將搜尋參數添加到index.html URL中
  for (const [key, value] of urlParams.entries()) {
    indexUrl.searchParams.set(key, value);
  }

  // 更新按鈕連結
  modifySearchBtn.href = indexUrl.toString();
}

// 台灣地區分類資料
let taiwanDistrictData = null;

// 載入台灣地區分類資料
async function loadTaiwanDistrictData() {
  if (taiwanDistrictData) {
    return taiwanDistrictData;
  }

  try {
    const response = await fetch("/data/taiwan_dist.json");
    taiwanDistrictData = await response.json();
    return taiwanDistrictData;
  } catch (error) {
    console.error("載入台灣地區資料失敗:", error);
    return null;
  }
}

// 根據縣市判斷地區
function getRegionByCounty(county) {
  if (!taiwanDistrictData || !county) {
    return null;
  }

  for (const [region, counties] of Object.entries(taiwanDistrictData)) {
    if (counties.includes(county)) {
      return region;
    }
  }

  return null;
}
