// 用戶資料管理
class UserProfileManager {
  constructor() {
    this.currentMember = null;
    this.campsiteOrders = [];
    this.favoriteCamps = [];
    this.camps = [];
    this.init();
  }

  // 更新登入按鈕顯示
  updateLoginButton() {
    const btnLogin = document.querySelector(".btn-login");
    if (!btnLogin) return;

    // 已登入狀態 - 確保樣式一致
    btnLogin.href = "user-profile.html";
    btnLogin.innerHTML = `<i class="fas fa-user"></i> ${this.currentMember.mem_name}`;
    btnLogin.title = `會員：${this.currentMember.mem_name}`;
    btnLogin.classList.add("logged-in");

    // 添加登出功能
    this.addLogoutMenu(btnLogin);
  }

  // 添加登出選單
  addLogoutMenu(btnLogin) {
    // 檢查是否已存在登出選單
    let logoutMenu = document.querySelector(".logout-menu");

    if (!logoutMenu) {
      // 創建登出選單
      logoutMenu = document.createElement("div");
      logoutMenu.className = "logout-menu";
      logoutMenu.innerHTML = `<a href="#" class="logout-link"><i class="fas fa-sign-out-alt"></i> 登出</a>`;

      // 插入到登入按鈕後面
      btnLogin.parentNode.insertBefore(logoutMenu, btnLogin.nextSibling);

      // 添加登出事件
      const logoutLink = logoutMenu.querySelector(".logout-link");
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });

      // 顯示/隱藏登出選單
      btnLogin.addEventListener("click", (e) => {
        e.preventDefault();
        logoutMenu.classList.toggle("show");
      });
    }
  }

  // 登出功能
  logout() {
    // 清除localStorage和sessionStorage中的會員資訊
    localStorage.removeItem("currentMember");
    sessionStorage.removeItem("currentMember");

    // 重定向到首頁
    window.location.href = "index.html";
  }

  async init() {
    await this.loadData();
    this.initTabs();
    this.loadMemberData();
    this.loadCampsiteOrders();
    this.loadFavoriteCamps();
    this.loadMemberAvatar();
  }

  // 載入會員頭像
  loadMemberAvatar() {
    if (!this.currentMember || !this.currentMember.mem_id) return;

    // 添加頁面載入遮罩
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);

    const memId = this.currentMember.mem_id;
    const avatarPreview = document.querySelector(".avatar-preview img");

    if (avatarPreview) {
      // 設置預設圖片作為備用
      const defaultAvatar = "images/user-1.jpg";

      // 添加時間戳參數避免緩存
      const timestamp = new Date().getTime();
      const api_url = `${window.api_prefix}/member/${memId}/pic?t=${timestamp}`;
      console.log("api_url:" + api_url);
      // 嘗試從API獲取頭像
      fetch(`${window.api_prefix}/member/${memId}/pic?t=${timestamp}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("頭像載入失敗");
          }
          return response.blob();
        })
        .then((blob) => {
          // 成功獲取頭像，設置為預覽圖片
          const imageUrl = URL.createObjectURL(blob);

          // 使用Image對象預加載圖片
          const img = new Image();
          img.onload = function () {
            // 圖片加載完成後，設置到頭像預覽並移除遮罩
            avatarPreview.src = imageUrl;
            document.body.removeChild(loadingOverlay);
          };
          img.onerror = function () {
            // 圖片加載失敗，使用預設圖片
            avatarPreview.src = defaultAvatar;
            document.body.removeChild(loadingOverlay);
          };
          img.src = imageUrl;
        })
        .catch((error) => {
          console.error("頭像載入錯誤:", error);
          // 載入失敗時使用預設圖片
          avatarPreview.src = defaultAvatar;
          document.body.removeChild(loadingOverlay);
        });
    }
  }

  async loadData() {
    try {
      // 檢查localStorage和sessionStorage是否有currentMember的資訊
      const memberData =
        localStorage.getItem("currentMember") ||
        sessionStorage.getItem("currentMember");

      if (memberData) {
        // 如果有會員資料，解析並設定為當前會員
        this.currentMember = JSON.parse(memberData);
        // 更新登入按鈕顯示
        this.updateLoginButton();
      } else {
        // 如果沒有會員資料，重定向到登入頁面
        window.location.href = "login.html";
        return;
      }

      // 載入營地訂單
      const ordersResponse = await fetch("data/campsite_order.json");
      this.campsiteOrders = await ordersResponse.json();

      // 載入訂單詳情
      const orderDetailsResponse = await fetch(
        "data/campsite_order_details.json"
      );
      this.orderDetails = await orderDetailsResponse.json();

      // 載入加購商品詳情
      const bundleDetailsResponse = await fetch(
        "data/bundle_item_details.json"
      );
      this.bundleDetails = await bundleDetailsResponse.json();

      // 載入營地收藏
      const favoritesResponse = await fetch("data/camp_track_list.json");
      this.favoriteCamps = await favoritesResponse.json();

      // 載入營地資料
      const campsResponse = await fetch("data/camp.json");
      this.camps = await campsResponse.json();
    } catch (error) {
      console.error("載入數據失敗:", error);
    }
  }

  initTabs() {
    const menuItems = document.querySelectorAll(".profile-menu-item");
    const sections = document.querySelectorAll(".profile-section");

    menuItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const targetTab = item.getAttribute("data-tab");

        // 移除所有active類
        menuItems.forEach((mi) => mi.classList.remove("active"));
        sections.forEach((section) => section.classList.remove("active"));

        // 添加active類到當前項目
        item.classList.add("active");
        const targetSection = document.getElementById(targetTab);
        if (targetSection) {
          targetSection.classList.add("active");
        }
      });
    });

    // 初始化訂單狀態篩選器
    this.initOrderFilter();
  }

  initOrderFilter() {
    const orderFilter = document.getElementById("order-status-filter");
    if (orderFilter) {
      orderFilter.addEventListener("change", (e) => {
        this.filterOrdersByStatus(e.target.value);
      });
    }
  }

  filterOrdersByStatus(status) {
    const ordersList = document.getElementById("campsite-orders-list");
    if (!ordersList) return;

    // 篩選當前會員的訂單
    let memberOrders = this.campsiteOrders.filter(
      (order) => order.mem_id === this.currentMember.mem_id
    );

    // 根據狀態篩選
    if (status) {
      const statusMap = {
        1: 0, // 待付款 -> 營地主未確認
        2: 1, // 已付款 -> 營地主已確認
        3: 3, // 已完成 -> 訂單結案
        4: 2, // 已取消 -> 露營者自行取消
      };
      const targetStatus = statusMap[status];
      memberOrders = memberOrders.filter(
        (order) => order.campsite_order_status === targetStatus
      );
    }

    this.renderOrders(memberOrders);
  }

  renderOrders(orders) {
    const ordersList = document.getElementById("campsite-orders-list");
    if (!ordersList) return;

    if (orders.length === 0) {
      ordersList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-campground"></i>
          <h3>尚無營地訂單</h3>
          <p>您還沒有預訂任何營地</p>
          <a href="campsites.html" class="btn-primary">前往預訂</a>
        </div>
      `;
      return;
    }

    ordersList.innerHTML = orders
      .map((order) => {
        const camp = this.camps.find((c) => c.camp_id === order.camp_id);
        const statusText = this.getOrderStatusText(order.campsite_order_status);
        const statusClass = this.getOrderStatusClass(
          order.campsite_order_status
        );
        const payMethodText = this.getPayMethodText(order.pay_method);

        // 獲取該訂單的加購商品
        const orderDetailsList = this.orderDetails.filter(
          (detail) => detail.campsite_order_id === order.campsite_order_id
        );

        const bundleItems = [];
        orderDetailsList.forEach((detail) => {
          const bundleDetail = this.bundleDetails.find(
            (bundle) => bundle.campsite_details_id === detail.order_details_id
          );
          if (bundleDetail && bundleDetail.bundle_buy_amount > 0) {
            bundleItems.push(bundleDetail);
          }
        });

        return `
        <div class="order-item">
          <div class="order-header">
            <div class="order-info">
              <h4>${camp ? camp.camp_name : "營地名稱"}</h4>
              <p class="order-id">訂單編號: ${order.campsite_order_id}</p>
              <p class="order-date"><i class="fas fa-clock"></i> 下訂日期: ${
                order.order_date
              }</p>
            </div>
            <div class="order-status ${statusClass}">
              ${statusText}
            </div>
          </div>
          
          <div class="order-details">
            <div class="order-dates">
              <span><i class="fas fa-calendar-check"></i> 入住: ${
                order.check_in
              }</span>
              <span><i class="fas fa-calendar-times"></i> 退房: ${
                order.check_out
              }</span>
            </div>
            <div class="payment-method">
              <span><i class="fas fa-credit-card"></i> ${payMethodText}</span>
            </div>
          </div>
          
          <div class="amount-breakdown">
            <div class="amount-row">
              <span>營地費用:</span>
              <span>NT$ ${order.camp_amount.toLocaleString()}</span>
            </div>
            ${
              order.bundle_amount > 0
                ? `
              <div class="amount-row">
                <span>加購項目:</span>
                <span>NT$ ${order.bundle_amount.toLocaleString()}</span>
              </div>
            `
                : ""
            }
            <div class="amount-row">
              <span>小計:</span>
              <span>NT$ ${order.bef_amount.toLocaleString()}</span>
            </div>
            ${
              order.dis_amount > 0
                ? `
              <div class="amount-row discount">
                <span>折扣:</span>
                <span>-NT$ ${order.dis_amount.toLocaleString()}</span>
              </div>
            `
                : ""
            }
            <div class="amount-row total">
              <span>實付金額:</span>
              <span>NT$ ${order.aft_amount.toLocaleString()}</span>
            </div>
          </div>
          
          ${
            bundleItems.length > 0
              ? `
            <div class="bundle-items">
              <h5><i class="fas fa-plus-circle"></i> 加購商品</h5>
              <div class="bundle-list">
                ${bundleItems
                  .map(
                    (item) => `
                  <div class="bundle-item">
                    <span>商品ID: ${item.bundle_id}</span>
                    <span>數量: ${item.bundle_buy_num}</span>
                    <span>金額: NT$ ${item.bundle_buy_amount.toLocaleString()}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
          
          ${
            order.comment_content
              ? `
            <div class="order-comment">
              <div class="rating">
                ${this.generateStars(order.comment_satisfaction)}
              </div>
              <p>${order.comment_content}</p>
            </div>
          `
              : ""
          }
        </div>
      `;
      })
      .join("");
  }

  loadMemberData() {
    if (!this.currentMember) return;

    // 填入基本資料
    document.getElementById("profile-name").value =
      this.currentMember.mem_name || "";
    document.getElementById("profile-email").value =
      this.currentMember.mem_email || "";
    document.getElementById("profile-phone").value =
      this.currentMember.mem_mobile || "";
    document.getElementById("profile-address").value =
      this.currentMember.mem_addr || "";
    document.getElementById("profile-birthday").value =
      this.currentMember.mem_birth || "";
    document.getElementById("profile-gender").value =
      this.currentMember.mem_gender || "";
  }

  loadCampsiteOrders() {
    // 篩選當前會員的訂單
    const memberOrders = this.campsiteOrders.filter(
      (order) => order.mem_id === this.currentMember.mem_id
    );

    this.renderOrders(memberOrders);
  }

  loadFavoriteCamps() {
    const favoritesGrid = document.getElementById("favorite-camps-grid");
    if (!favoritesGrid) return;

    // 篩選當前會員的收藏
    const memberFavorites = this.favoriteCamps.filter(
      (fav) => fav.mem_id === this.currentMember.mem_id
    );

    if (memberFavorites.length === 0) {
      favoritesGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-heart"></i>
          <h3>尚無收藏營地</h3>
          <p>您還沒有收藏任何營地</p>
          <a href="campsites.html" class="btn-primary">探索營地</a>
        </div>
      `;
      return;
    }

    favoritesGrid.innerHTML = memberFavorites
      .map((favorite) => {
        const camp = this.camps.find((c) => c.camp_id === favorite.camp_id);
        if (!camp) return "";

        const avgRating =
          camp.camp_comment_number_count > 0
            ? (
                camp.camp_comment_sun_score / camp.camp_comment_number_count
              ).toFixed(1)
            : "0.0";

        return `
        <div class="favorite-camp-item">
          <div class="camp-image">
            <img src="images/camp-${(camp.camp_id % 5) + 1}.jpg" alt="${
          camp.camp_name
        }" />
            <button class="btn-remove-favorite" data-camp-id="${camp.camp_id}">
              <i class="fas fa-heart"></i>
            </button>
          </div>
          <div class="camp-info">
            <h4>${camp.camp_name}</h4>
            <p class="camp-location">
              <i class="fas fa-map-marker-alt"></i>
              ${camp.camp_city} ${camp.camp_dist}
            </p>
            <div class="camp-rating">
              ${this.generateStars(Math.round(parseFloat(avgRating)))}
              <span class="rating-text">${avgRating} (${
          camp.camp_comment_number_count
        })</span>
            </div>
            <p class="camp-description">${camp.camp_content}</p>
            <div class="camp-actions">
              <a href="campsite-detail.html?id=${
                camp.camp_id
              }" class="btn-view">查看詳情</a>
              <a href="campsite-booking.html?id=${
                camp.camp_id
              }" class="btn-book">立即預訂</a>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  getOrderStatusText(status) {
    const statusMap = {
      0: "營地主未確認",
      1: "營地主已確認",
      2: "露營者自行取消",
      3: "訂單結案",
    };
    return statusMap[status] || "未知狀態";
  }

  getOrderStatusClass(status) {
    const classMap = {
      0: "pending",
      1: "confirmed",
      2: "cancelled",
      3: "completed",
    };
    return classMap[status] || "unknown";
  }

  getPayMethodText(method) {
    const methodMap = {
      1: "信用卡",
      2: "LINE PAY",
    };
    return methodMap[method] || "未知付款方式";
  }

  generateStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<i class="fas fa-star"></i>';
      } else {
        stars += '<i class="far fa-star"></i>';
      }
    }
    return stars;
  }
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  new UserProfileManager();

  // 頭像上傳功能
  const avatarInput = document.getElementById("avatar-input");
  const avatarPreview = document.querySelector(".avatar-preview img");
  const uploadBtn = document.querySelector(".btn-upload");
  const uploadProgress = document.createElement("div");
  uploadProgress.className = "upload-progress";
  uploadProgress.innerHTML = `<div class="progress-bar"></div>`;

  // 初始化上傳進度條
  const avatarEdit = document.querySelector(".avatar-edit");
  if (avatarEdit) {
    avatarEdit.appendChild(uploadProgress);
  }

  // 預覽選擇的圖片
  function previewImage(file) {
    if (!avatarPreview) return;

    // 立即使用 URL.createObjectURL 顯示預覽，提供即時反饋
    const objectUrl = URL.createObjectURL(file);
    avatarPreview.src = objectUrl;

    // 添加動畫效果
    avatarPreview.classList.add("preview-updated");
    setTimeout(() => {
      avatarPreview.classList.remove("preview-updated");
    }, 1000);

    // 同時使用 FileReader 讀取完整數據（作為備份方法）
    const reader = new FileReader();
    reader.onload = function (e) {
      // 如果 URL.createObjectURL 失敗，這將作為備份
      if (!avatarPreview.src || avatarPreview.src === "about:blank") {
        avatarPreview.src = e.target.result;
      }
      // 釋放 objectURL 以避免內存洩漏
      URL.revokeObjectURL(objectUrl);
    };
    reader.readAsDataURL(file);
  }

  // 更新上傳進度
  function updateProgress(percent) {
    const progressBar = uploadProgress.querySelector(".progress-bar");
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
      if (percent === 100) {
        setTimeout(() => {
          progressBar.style.width = "0%";
        }, 1000);
      }
    }
  }

  if (avatarInput && uploadBtn) {
    // 添加懸停效果
    uploadBtn.addEventListener("mouseover", function () {
      if (avatarPreview) {
        avatarPreview.classList.add("hover");
      }
    });

    uploadBtn.addEventListener("mouseout", function () {
      if (avatarPreview) {
        avatarPreview.classList.remove("hover");
      }
    });

    // 處理檔案選擇
    avatarInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      // 檢查檔案類型
      if (!file.type.match("image.*")) {
        showMessage("請選擇圖片檔案", "error");
        return;
      }

      // 檢查檔案大小 (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        showMessage("檔案大小不能超過 2MB", "error");
        return;
      }

      // 立即預覽圖片
      previewImage(file);

      // 顯示上傳中訊息
      showMessage("上傳中...", "info");

      // 獲取會員ID
      const userProfileManager = new UserProfileManager();
      const memId = userProfileManager.currentMember?.mem_id;

      if (!memId) {
        showMessage("無法獲取會員ID，請重新登入", "error");
        return;
      }

      // 建立 FormData 物件
      const formData = new FormData();
      formData.append("file", file);

      // 模擬上傳進度
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress > 90) clearInterval(progressInterval);
        updateProgress(progress);
      }, 100);

      // 發送 AJAX 請求
      fetch(`http://localhost:8081/CJA101G02/member/${memId}/picture`, {
        method: "POST",
        body: formData,
        // 不需要設定 Content-Type，fetch 會自動設定正確的 multipart/form-data 格式
      })
        .then((response) => {
          console.log("response:" + response.status);

          // if (response.status === 200) {
          //   throw new Error("網路回應不正常1");
          // }

          if (response.status !== 200) {
            throw new Error("網路回應不正常");
          }
          // 保存原始圖片URL，以便上傳失敗時恢復
          const originalImageSrc = avatarPreview.src;
          return response.json().then((data) => {
            // 返回包含原始圖片URL的對象
            return { data, originalImageSrc };
          });
        })
        .then((response) => {
          // 清除進度條計時器
          clearInterval(progressInterval);
          // 設置進度為100%
          updateProgress(100);

          // 從回應中獲取數據和原始圖片URL
          const { data, originalImageSrc } = response;

          // 檢查回傳的資料格式，可能是 {data: 'ok'} 或直接是 'ok'
          if (data === "ok" || (data && data.data === "ok")) {
            // 上傳成功後，重新載入頭像（添加時間戳避免緩存）
            const timestamp = new Date().getTime();
            const memId = userProfileManager.currentMember?.mem_id;

            // 添加載入指示器
            const loadingIndicator = document.createElement("div");
            loadingIndicator.className = "avatar-loading";
            const avatarPreviewContainer =
              document.querySelector(".avatar-preview");
            if (avatarPreviewContainer) {
              avatarPreviewContainer.appendChild(loadingIndicator);
            }

            // 從服務器獲取最新頭像
            fetch(
              `http://localhost:8081/CJA101G02/member/${memId}/pic?t=${timestamp}`
            )
              .then((response) => {
                if (!response.ok) {
                  throw new Error("更新頭像載入失敗");
                }
                return response.blob();
              })
              .then((blob) => {
                // 移除載入指示器
                if (loadingIndicator && loadingIndicator.parentNode) {
                  loadingIndicator.parentNode.removeChild(loadingIndicator);
                }

                // 更新頭像預覽
                const imageUrl = URL.createObjectURL(blob);
                const avatarPreview = document.querySelector(
                  ".avatar-preview img"
                );
                if (avatarPreview) {
                  avatarPreview.src = imageUrl;
                  // 添加更新動畫
                  avatarPreview.classList.add("preview-updated");
                  setTimeout(() => {
                    avatarPreview.classList.remove("preview-updated");
                  }, 1000);
                }

                showMessage("頭像上傳成功", "success");
              })
              .catch((error) => {
                console.error("更新頭像載入錯誤:", error);
                // 移除載入指示器
                if (loadingIndicator && loadingIndicator.parentNode) {
                  loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                // 上傳成功但無法載入新頭像時，保留已上傳的圖片
                showMessage("頭像上傳成功，但無法載入新頭像", "warning");
              });
          } else {
            // 上傳失敗，恢復原始圖片
            avatarPreview.src = originalImageSrc;
            throw new Error("上傳失敗");
          }
        })
        .catch((error) => {
          // 清除進度條計時器
          clearInterval(progressInterval);
          // 重置進度條
          updateProgress(0);

          console.error("上傳錯誤:", error);
          showMessage("上傳失敗，請稍後再試", "error");
        });
    });
  }
});

// 登出按鈕事件監聽
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // 顯示確認對話框
    if (confirm("確定要登出嗎？")) {
      // 清除本地儲存的會員資料
      // 清除所有相關的儲存資料
      localStorage.removeItem("currentMember");
      sessionStorage.removeItem("currentMember");
      // 也清除可能的其他相關資料
      localStorage.removeItem("memberRememberMe");
      sessionStorage.removeItem("memberRememberMe");

      // 顯示登出成功訊息
      showMessage("已成功登出", "success");

      // 延遲跳轉到首頁
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    }
  });
}

// 顯示訊息函數
function showMessage(message, type = "info") {
  // 創建訊息元素
  const messageDiv = document.createElement("div");
  messageDiv.className = `message message-${type}`;
  messageDiv.innerHTML = `
    <i class="fas ${
      type === "success"
        ? "fa-check-circle"
        : type === "error"
        ? "fa-exclamation-circle"
        : "fa-info-circle"
    }"></i>
    <span>${message}</span>
  `;

  // 添加樣式
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      type === "success" ? "#d4edda" : type === "error" ? "#f8d7da" : "#d1ecf1"
    };
    color: ${
      type === "success" ? "#155724" : type === "error" ? "#721c24" : "#0c5460"
    };
    border: 1px solid ${
      type === "success" ? "#c3e6cb" : type === "error" ? "#f5c6cb" : "#bee5eb"
    };
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    animation: slideInRight 0.3s ease-out;
  `;

  // 添加動畫樣式
  if (!document.querySelector("#message-animations")) {
    const style = document.createElement("style");
    style.id = "message-animations";
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 添加到頁面
  document.body.appendChild(messageDiv);

  // 3秒後移除訊息
  setTimeout(() => {
    messageDiv.style.animation = "slideInRight 0.3s ease-out reverse";
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 300);
  }, 3000);
}
