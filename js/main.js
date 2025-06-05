document.addEventListener("DOMContentLoaded", function () {
  // 初始化松果載入動畫
  initLoadingAnimation();

  // 模擬頁面載入
  simulatePageLoading();

  // 初始化行動選單
  initMobileMenu();

  // 初始化日期選擇器
  initDatePickers();

  // 初始化滾動動畫
  initScrollAnimations();

  // 初始化購物車功能
  initCartFunctions();
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

const check_in_el = document.getElementById("check-in");
const check_out_el = document.getElementById("check-out");
const room_search_btn = document.getElementById("room_search_btn");

var check_in_date;
var check_out_date;

//======================取得入住日期資料=====================//
check_in_el.addEventListener("change", function () {
  check_in_date = document.getElementById("check-in").valueAsDate;
  console.log("checkin: " + check_in_date);
});
//======================取得出營日期資料=====================//
check_out_el.addEventListener("change", function () {
  check_out_date = document.getElementById("check-out").valueAsDate;
  console.log("checkout: " + check_out_date);
});

room_search_btn.addEventListener("click", function (e) {
  e.preventDefault();
  console.log("checkin_btn: " + check_in_date);
  console.log("checkout_btn: " + check_out_date);
  // console.log("checkin1: " + check_in_el.valueAsDate);
});
