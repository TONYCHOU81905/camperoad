document.addEventListener("DOMContentLoaded", function () {
  // 初始化松果載入動畫
  initLoadingAnimation();

  // 模擬頁面載入
  simulatePageLoading();

  // 初始化行動選單
  initMobileMenu();

  // 初始化日期選擇器
  // initDatePickers();

  // 初始化滾動動畫
  // initScrollAnimations();

  // 初始化購物車功能
  // initCartFunctions();

  //初始化地區，等待完成後再解析URL參數
  initArea()
    .then(() => {
      console.log("地區初始化完成，開始解析URL參數");
      // 解析URL參數並填入表單
      parseAndFillSearchParams();
      
      // 初始化日期選擇器聯動
      initDatePickerInteraction();
      
      // 載入商品推薦
      loadRelatedProducts();
    })
    .catch((error) => {
      console.error("地區初始化失敗:", error);
      // 即使地區初始化失敗，仍然初始化日期選擇器聯動
      initDatePickerInteraction();
      
      // 載入商品推薦
      loadRelatedProducts();
    });
});

// 松果載入動畫
function initLoadingAnimation() {
  const pineCone = document.querySelector(".pine-cone");
  if (!pineCone) return;

  // 動態生成松果鱗片
  const scales = 8; // 鱗片數量
  const radius = 25; // 松果半徑

  for (let i = 0; i < scales; i++) {
    const angle = (i / scales) * Math.PI * 2;
    const scale = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    // 計算鱗片位置
    const x1 = 30 + Math.cos(angle) * radius * 0.5;
    const y1 = 30 + Math.sin(angle) * radius * 0.5;
    const x2 = 30 + Math.cos(angle) * radius;
    const y2 = 30 + Math.sin(angle) * radius;

    scale.setAttribute("d", `M30,30 L${x1},${y1} L${x2},${y2} Z`);
    scale.setAttribute("fill", "#A68A64");
    scale.setAttribute("class", "pine-cone-scale");
    scale.style.transformOrigin = "30px 30px";
    scale.style.animation = `pulse 1.5s infinite ease-in-out ${i * 0.2}s`;

    pineCone.appendChild(scale);
  }

  // 添加鱗片脈動動畫
  const style = document.createElement("style");
  style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(0.8); }
        }
    `;
  document.head.appendChild(style);
}

// 模擬頁面載入
function simulatePageLoading() {
  const loadingOverlay = document.querySelector(".loading-overlay");
  if (!loadingOverlay) return;

  // 顯示載入畫面
  loadingOverlay.classList.add("active");

  // 模擬載入時間
  setTimeout(() => {
    loadingOverlay.classList.remove("active");
  }, 2000);
}

// 初始化行動選單
function initMobileMenu() {
  const menuToggle = document.querySelector(".mobile-menu-toggle");
  const mainNav = document.querySelector(".main-nav");

  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener("click", function () {
    this.classList.toggle("active");
    mainNav.classList.toggle("active");

    // 切換漢堡選單動畫
    const spans = this.querySelectorAll("span");
    if (this.classList.contains("active")) {
      spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
      spans[1].style.opacity = "0";
      spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
    } else {
      spans[0].style.transform = "none";
      spans[1].style.opacity = "1";
      spans[2].style.transform = "none";
    }
  });

  // 添加行動選單樣式
  const style = document.createElement("style");
  style.textContent = `
        @media (max-width: 992px) {
            .main-nav.active {
                display: block;
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background-color: white;
                padding: 20px;
                box-shadow: 0 5px 10px rgba(0,0,0,0.1);
                z-index: 1000;
            }
}}
`;
  // 例如：Wed May 28 2025 00:00:00 GMT+0800 (台北標準時間)

  document.head.appendChild(style);
}

// 地區選單改變時觸發
document.addEventListener("DOMContentLoaded", function () {
  const locationSelect = document.getElementById("location");
  if (locationSelect) {
    locationSelect.addEventListener("change", function () {
      const selectedRegionValue = this.value;
      const selectedRegion = taiwanDistrictData[selectedRegionValue].DistName;
      console.log("selected region value: " + selectedRegionValue);
      console.log("selected region: " + selectedRegion);

      // 根據選擇的地區更新縣市選項
      updateCountyOptions(selectedRegionValue);

      // 清空鄉鎮市區選擇
      const districtSelect = document.getElementById("district");
      if (districtSelect) {
        districtSelect.innerHTML = '<option value="">請先選擇縣市</option>';
      }

      // 移除營地篩選功能，首頁固定顯示三個營地
      // filterCampsByRegion(selectedRegion);
    });
  }
});

const check_in_el = document.getElementById("check-in");
const check_out_el = document.getElementById("check-out");
const room_search_btn = document.getElementById("room_search_btn");

var check_in_date;
var check_out_date;

//======================取得入住日期資料=====================//
if (check_in_el) {
  check_in_el.addEventListener("change", function () {
    check_in_date = document.getElementById("check-in").valueAsDate;
    console.log("checkin: " + check_in_date);
  });
}
//======================取得出營日期資料=====================//
if (check_out_el) {
  check_out_el.addEventListener("change", function () {
    check_out_date = document.getElementById("check-out").valueAsDate;
    console.log("checkout: " + check_out_date);
  });
}

// 解析URL參數並填入表單
function parseAndFillSearchParams() {
  const urlParams = new URLSearchParams(window.location.search);
  console.log("解析URL參數");

  // 填入地區選擇
  const location = urlParams.get("location");
  if (location && taiwanDistrictData && taiwanDistrictData.length > 0) {
    const locationSelect = document.getElementById("location");
    if (locationSelect) {
      // 確保location是有效的索引


      if (location >= 0 && location < taiwanDistrictData.length) {
        console.log("設置地區選擇: " + taiwanDistrictData[location].DistName);

        locationSelect.value = location;


        // 觸發change事件以載入縣市選項
        locationSelect.dispatchEvent(new Event("change"));
      }
    }
  }

  // 填入縣市選擇
  const county = urlParams.get("county");
  if (county) {
    setTimeout(() => {
      const countySelect = document.getElementById("county");
      if (countySelect) {
        countySelect.value = county;
        countySelect.dispatchEvent(new Event("change"));
      }
    }, 100);
  }

  // 填入鄉鎮市區選擇
  const district = urlParams.get("district");
  if (district) {
    setTimeout(() => {
      const districtSelect = document.getElementById("district");
      if (districtSelect) {
        districtSelect.value = district;
      }
    }, 200);
  }

  // 填入日期
  const checkIn = urlParams.get("check-in");
  if (checkIn) {
    const checkInInput = document.getElementById("check-in");
    if (checkInInput) {
      checkInInput.value = checkIn;
      check_in_date = new Date(checkIn);
    }
  }

  const checkOut = urlParams.get("check-out");
  if (checkOut) {
    const checkOutInput = document.getElementById("check-out");
    if (checkOutInput) {
      checkOutInput.value = checkOut;
      check_out_date = new Date(checkOut);
    }
  }

  // 填入人數
  const guests = urlParams.get("guests");
  if (guests) {
    const guestsSelect = document.getElementById("guests");
    if (guestsSelect) {
      guestsSelect.value = guests;
    }
  }
}

// 初始化日期選擇器聯動
function initDatePickerInteraction() {
  const checkInInput = document.getElementById("check-in");
  const checkOutInput = document.getElementById("check-out");

  if (!checkInInput || !checkOutInput) return;

  // 設置今天為最小日期
  const today = new Date().toISOString().split("T")[0];
  checkInInput.min = today;

  // 當選擇入住日期時，更新退房日期的最小值
  checkInInput.addEventListener("change", function () {
    const checkInDate = this.value;
    if (checkInDate) {
      // 設置退房日期的最小值為入住日期的隔天
      const minCheckOut = new Date(checkInDate);
      minCheckOut.setDate(minCheckOut.getDate() + 1);
      checkOutInput.min = minCheckOut.toISOString().split("T")[0];

      // 如果當前退房日期早於或等於入住日期，清空退房日期
      if (checkOutInput.value && checkOutInput.value <= checkInDate) {
        checkOutInput.value = "";
        check_out_date = null;
      }

      // 啟用退房日期選擇器
      checkOutInput.disabled = false;
    } else {
      // 如果沒有選擇入住日期，禁用退房日期選擇器
      checkOutInput.disabled = true;
      checkOutInput.value = "";
      check_out_date = null;
    }
  });

  // 初始狀態：如果沒有入住日期，禁用退房日期選擇器
  if (!checkInInput.value) {
    checkOutInput.disabled = true;
  }
}

if (room_search_btn) {
  room_search_btn.addEventListener("click", function (e) {
    e.preventDefault(); // 阻止默認提交行為

    console.log("checkin_btn: " + check_in_date);
    console.log("checkout_btn: " + check_out_date);

    // 檢查必填欄位
    const checkInInput = document.getElementById("check-in");
    const checkOutInput = document.getElementById("check-out");

    if (!checkInInput.value) {
      alert("請選擇入住日期");
      checkInInput.focus();
      return;
    }

    if (!checkOutInput.value) {
      alert("請選擇退房日期");
      checkOutInput.focus();
      return;
    }

    // 檢查日期邏輯
    if (check_in_date && check_out_date && check_in_date >= check_out_date) {
      alert("退房日期必須晚於入住日期");
      checkOutInput.focus();
      return;
    }

    // 獲取表單元素並提交
    const form = this.closest("form");
    if (form) {
      form.submit(); // 提交表單
    }
  });
}

//所有地區資料
let taiwanDistricts = {};
let taiwanDistrictData = {};

//初始化地區
function initArea() {
  // 返回Promise以便可以等待初始化完成
  return new Promise((resolve, reject) => {
    // 載入台灣地區分類資料
    fetch("/data/taiwan_dist.json")
      .then((response) => response.json())
      .then((distData) => {
        taiwanDistrictData = distData;
        console.log("loading taiwan area data");

        // 動態生成地區選項
        populateLocationOptions(distData);

        // 載入詳細地區資料
        return fetch("/data/taiwan-area.json");
      })
      .then((response) => response.json())
      .then((data) => {
        taiwanDistricts = data;

        // 初始化時載入所有縣市
        updateCountyOptions();



        // 初始化地區選單改變監聽器
        initLocationChangeListener();



        // 初始化完成，解析Promise
        resolve();
      })
      .catch((error) => {
        console.error("初始化地區資料失敗:", error);
        reject(error);
      });
  });
}

// 動態生成地區選項
function populateLocationOptions(distData) {
  const locationSelect = document.getElementById("location");

  // 清除現有選項（保留預設選項）
  const defaultOption = locationSelect.querySelector('option[value=""]');
  locationSelect.innerHTML = "";


  if (defaultOption) {
    locationSelect.appendChild(defaultOption);
  }



  // 添加地區選項
  for (let i = 0; i < distData.length; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = distData[i].DistName;
    locationSelect.appendChild(option);
  }
}

// 更新縣市選項
function updateCountyOptions(selectedRegionValue = null) {
  const countySelect = document.getElementById("county");
  countySelect.innerHTML = '<option value="">選擇縣市</option>';

  let countiestoShow = [];

  if (selectedRegionValue && taiwanDistrictData[selectedRegionValue]) {
    // 如果選擇了地區，只顯示該地區的縣市
    countiestoShow = taiwanDistrictData[selectedRegionValue].County;
  } else {
    // 如果沒有選擇地區，顯示所有縣市
    countiestoShow = Object.values(taiwanDistricts).map(
      (county) => county.CityName
    );
  }

  // 根據taiwanDistricts的順序來排序縣市
  Object.values(taiwanDistricts).forEach((county_info) => {
    if (countiestoShow.includes(county_info.CityName)) {
      const option = document.createElement("option");
      option.value = county_info.CityName;
      option.textContent = county_info.CityName;
      countySelect.appendChild(option);
    }
  });
}

// 根據地區篩選營地
async function filterCampsByRegion(regionName) {
  try {
    // 確保營地資料已載入
    if (!campData || campData.length === 0) {
      await loadCampData();
    }

    let filteredCamps = campData;

    if (regionName && taiwanDistrictData[regionName]) {
      // 根據地區篩選營地
      const regionCounties = taiwanDistrictData[regionName];
      filteredCamps = campData.filter((camp) => {
        return regionCounties.includes(camp.camp_city);
      });
    }

    // 重新渲染營地卡片
    renderCampCards(filteredCamps, "camp-cards");

    console.log(
      `顯示 ${regionName || "全部"} 地區營地: ${filteredCamps.length} 個`
    );
  } catch (error) {
    console.error("篩選營地失敗:", error);
  }
}

// 縣市選單改變時觸發

const countySelectEl = document.getElementById("county");
if (countySelectEl) {
  countySelectEl.addEventListener("change", function () {

    console.log("county: " + this.value);

    const county = this.value;
    console.log(taiwanDistricts[county]);
    const districtSelect = document.getElementById("district");

    if (!districtSelect) return;

    districtSelect.innerHTML = '<option value="">請選擇鄉鎮市區</option>';

    if (county != "") {
      Object.values(taiwanDistricts).forEach((county_info) => {
        if (county_info.CityName == county) {
          county_info.AreaList.forEach((area_info) => {
            const option = document.createElement("option");
            option.value = area_info.AreaName;
            option.textContent = area_info.AreaName;
            districtSelect.appendChild(option);
          });
        }
      });
    } else {
      districtSelect.innerHTML = '<option value="">請先選擇縣市</option>';
    }
  });
}


// 載入商品卡片
function loadRelatedProducts() {
  const relatedProductsContainer = document.getElementById('index-product-container');
  if (!relatedProductsContainer) return;

  // 顯示載入中狀態
  relatedProductsContainer.innerHTML = '<div class="index-loading-indicator">載入中...</div>';

  // 使用隨機推薦商品 API
  fetch(`${window.api_prefix}/api/products/random?limit=3`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success' && Array.isArray(data.data)) {
        const relatedProducts = data.data;

        // 清空容器
        relatedProductsContainer.innerHTML = '';

        if (relatedProducts.length === 0) {
          relatedProductsContainer.innerHTML = '<p class="index-no-products">暫無相關商品推薦</p>';
          return;
        }

        // 渲染商品卡片
        relatedProducts.forEach(product => {
          relatedProductsContainer.appendChild(createProductCard(product));
        });

        // 綁定事件
        bindRelatedProductEvents();
      } else {
        relatedProductsContainer.innerHTML = '<p class="index-error">載入推薦商品失敗</p>';
      }
    })
    .catch(err => {
      console.error('載入推薦商品失敗：', err);
      relatedProductsContainer.innerHTML = '<p class="index-error">載入推薦商品失敗</p>';
    });
}

// 創建Random商品卡片
function createProductCard(product) {
  const hasDiscount = product.prodDiscount !== null && product.prodDiscount < 1;
  const firstSpec = product.prodSpecList?.[0];
  const originalPrice = firstSpec ? firstSpec.prodSpecPrice : 0;
  const discountedPrice = hasDiscount ? Math.round(originalPrice * product.prodDiscount) : originalPrice;

  // 創建商品卡片元素
  const card = document.createElement('div');
  card.className = 'index-product-card';
  card.dataset.productId = product.prodId;

  // 將原始價格和折扣信息存儲在卡片上，以便後續使用
  card.dataset.originalPrice = originalPrice;
  card.dataset.hasDiscount = hasDiscount;
  card.dataset.discountRate = product.prodDiscount || 1;

  // 構建商品圖片 HTML
  let productImageHtml = '';
  if (product.prodPicList && product.prodPicList.length > 0) {
    const firstPicId = product.prodPicList[0].prodPicId;
    productImageHtml = `<img src="${window.api_prefix}/api/prodpics/${firstPicId}" alt="${product.prodName}" onerror="this.onerror=null; this.src='images/default-product.jpg';" />`;
  } else {
    productImageHtml = `<img src="images/default-product.jpg" alt="無圖片" />`;
  }

  // 構建商品標籤 HTML
  let tagHtml = '';
  if (hasDiscount) {
    tagHtml = `<span class="index-product-tag">促銷</span>`;
  }

  // 構建商品價格 HTML，添加一個唯一的類名以便後續更新
  let priceHtml = `
    <div class="index-product-price" id="price-${product.prodId}">
      <span class="current-price">NT$ ${discountedPrice}</span>
      ${hasDiscount ? `<span class="original-price">NT$ ${originalPrice}</span>` : ''}
    </div>`;

  // 組合完整的商品卡片 HTML
  card.innerHTML = `
    <div class="index-product-image">
      ${productImageHtml}
      ${tagHtml}
    </div>
    <div class="index-product-info">
      <h3><a href="product-detail.html?id=${product.prodId}">${product.prodName}</a></h3>
      ${priceHtml}
      <div class="index-product-actions">
        <button class="index-btn-view-details"><i class="fas fa-search"></i> 查看詳情</button>
      </div>
    </div>
  `;

  return card;
}

// 綁定相關商品的事件
function bindRelatedProductEvents() {
  // 處理查看詳情按鈕
  const viewDetailsButtons = document.querySelectorAll('#index-product-container .index-btn-view-details');
  viewDetailsButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productCard = this.closest('.index-product-card');
      const productId = productCard.dataset.productId;
      window.location.href = `product-detail.html?id=${productId}`;
    });
  });
}