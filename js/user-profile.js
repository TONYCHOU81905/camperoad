// 用戶資料管理
class UserProfileManager {
  constructor() {
    this.currentMember = null;
    this.campsiteOrders = [];
    this.favoriteCamps = [];
    this.camps = [];
    // WebSocket 相關屬性
    this.stompClient = null;
    this.memId = null;
    this.ownerId = null;
    this.currentOwnerId = null; // 記錄當前連接的營地主ID
    this.init();
  }

  // 更新登入按鈕顯示
  updateLoginButton() {
    const btnLogin = document.querySelector(".btn-login");
    if (!btnLogin) return;

    // 已登入狀態 - 確保樣式一致
    btnLogin.href = "user-profile.html";
    btnLogin.innerHTML = `<i class="fas fa-user"></i> ${this.currentMember.memName}`;
    btnLogin.title = `會員：${this.currentMember.memName}`;
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

  // 顯示更改密碼模態框
  showChangePasswordModal() {
    // 檢查是否已存在模態框
    let modal = document.getElementById("change-password-modal");

    if (!modal) {
      // 創建模態框
      modal = document.createElement("div");
      modal.id = "change-password-modal";
      modal.className = "modal";
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-btn">&times;</span>
          <h3>更改密碼</h3>
          <form id="change-password-form">
            <div class="form-group">
              <label for="current-password">目前密碼</label>
              <input type="password" id="current-password" required>
            </div>
            <div class="form-group">
              <label for="new-password">新密碼</label>
              <input type="password" id="new-password" required>
              <div class="password-strength-meter">
                <div class="strength-bar"></div>
              </div>
              <p class="password-hint">密碼須包含至少8個字符，包括大小寫字母、數字和特殊符號</p>
            </div>
            <div class="form-group">
              <label for="confirm-password">確認新密碼</label>
              <input type="password" id="confirm-password" required>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-save">確認更改</button>
              <button type="button" class="btn-cancel">取消</button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modal);

      // 關閉按鈕事件
      const closeBtn = modal.querySelector(".close-btn");
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });

      // 取消按鈕事件
      const cancelBtn = modal.querySelector(".btn-cancel");
      cancelBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });

      // 表單提交事件
      const form = modal.querySelector("#change-password-form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const currentPassword =
          document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword =
          document.getElementById("confirm-password").value;

        // 驗證新密碼與確認密碼是否一致
        if (newPassword !== confirmPassword) {
          showMessage("新密碼與確認密碼不一致", "error");
          return;
        }

        // 驗證密碼強度
        const strength = this.checkPasswordStrength(newPassword);
        if (strength < 60) {
          showMessage("新密碼強度不足，請設置更複雜的密碼", "error");
          return;
        }

        try {
          // 使用API更改密碼
          const response = await fetch(
            `${window.api_prefix}/api/member/changePassword`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                memId: this.currentMember.memId,
                old_password: currentPassword,
                new_password: newPassword,
              }),
              credentials: "include", // 包含Cookie
            }
          );

          if (!response.ok) {
            throw new Error("密碼更改請求失敗");
          }

          const data = await response.json();

          if (data.success) {
            showMessage("密碼已成功更改", "success");
            modal.style.display = "none";
            form.reset();
          } else {
            showMessage(
              data.message || "密碼更改失敗，請檢查當前密碼是否正確",
              "error"
            );
          }
        } catch (error) {
          console.error("密碼更改錯誤：", error);
          showMessage("密碼更改失敗，請稍後再試", "error");
        }
      });

      // 密碼強度檢測
      const newPasswordInput = document.getElementById("new-password");
      const strengthBar = modal.querySelector(".strength-bar");

      newPasswordInput.addEventListener("input", () => {
        const password = newPasswordInput.value;
        const strength = this.checkPasswordStrength(password);

        // 更新強度條
        strengthBar.style.width = `${strength}%`;

        // 根據強度設置顏色
        if (strength < 30) {
          strengthBar.style.backgroundColor = "#ff4d4d"; // 弱
        } else if (strength < 60) {
          strengthBar.style.backgroundColor = "#ffa64d"; // 中
        } else {
          strengthBar.style.backgroundColor = "#4CAF50"; // 強
        }
      });
    }

    // 顯示模態框
    modal.style.display = "block";
  }

  // 檢查密碼強度
  checkPasswordStrength(password) {
    let strength = 0;

    // 長度檢查
    if (password.length >= 8) {
      strength += 20;
    }

    // 包含大寫字母
    if (/[A-Z]/.test(password)) {
      strength += 20;
    }

    // 包含小寫字母
    if (/[a-z]/.test(password)) {
      strength += 20;
    }

    // 包含數字
    if (/[0-9]/.test(password)) {
      strength += 20;
    }

    // 包含特殊字符
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 20;
    }

    return strength;
  }

  // 登出功能
  async logout() {
    try {
      // 呼叫登出API
      const response = await fetch(`${window.api_prefix}/api/member/logout`, {
        method: "POST",
        credentials: "include", // 包含Cookie
      });

      // 無論API回應如何，都清除本地儲存的會員資訊
      localStorage.removeItem("currentMember");
      sessionStorage.removeItem("currentMember");

      // 重定向到首頁
      window.location.href = "index.html";
    } catch (error) {
      console.error("登出錯誤：", error);
      // 即使API呼叫失敗，仍然清除本地儲存並登出
      localStorage.removeItem("currentMember");
      sessionStorage.removeItem("currentMember");
      window.location.href = "index.html";
    }
  }

  async init() {
    await this.loadData();
    this.initTabs();
    this.loadMemberData();
    this.loadFavoriteCamps();
    this.loadCoupons();
    this.loadCampsiteOrders();
    this.loadPaymentMethods();
    this.initChatManagement();

    this.loadMemberAvatar();
  }

  // 載入會員頭像
  loadMemberAvatar() {
    if (!this.currentMember || !this.currentMember.memId) return;

    // 添加頁面載入遮罩
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);

    const memId = this.currentMember.memId;
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
      console.log("loadData:" + memberData);

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

      // 載入營地訂單 - 從API獲取
      const memId = this.currentMember.memId;
      console.log("memId:" + memId);

      const ordersResponse = await fetch(
        `${window.api_prefix}/member/${memId}/orders`
      );
      const ordersData = await ordersResponse.json();

      if (ordersData.status.trim() === "success") {
        this.campsiteOrders = ordersData.data;

        // 將orderDetails整合到訂單中
        this.orderDetails = [];
        this.bundleDetails = [];

        // 處理新的API資料結構
        this.campsiteOrders.forEach((order) => {
          if (order.orderDetails && order.orderDetails.length > 0) {
            order.orderDetails.forEach((detail) => {
              this.orderDetails.push({
                order_details_id: detail.campsiteDetailsId,
                campsite_order_id: order.campsiteOrderId,
                campsite_type_id: detail.campsiteTypeId,
                campsite_num: detail.campsiteNum,
                campsite_amount: detail.campsiteAmount,
              });
            });
          }
        });
      } else {
        console.error("獲取訂單資料失敗:", ordersData.message);
        this.campsiteOrders = [];
        this.orderDetails = [];
        this.bundleDetails = [];
      }

      // 載入營地收藏
      try {
        const favoritesResponse = await fetch(
          `${window.api_prefix}/camptracklist/${memId}/getCampTrackLists`
        );
        if (favoritesResponse.ok) {
          const favoriteCampsJson = await favoritesResponse.json();
          this.favoriteCamps = favoriteCampsJson; // 保持完整的響應結構
          console.log("favoriteCamps:", this.favoriteCamps);
        } else {
          console.error("獲取收藏營地失敗:", favoritesResponse.status);
          this.favoriteCamps = { data: [] }; // 保持一致的數據結構
        }
      } catch (error) {
        console.error("載入收藏營地時發生錯誤:", error);
        this.favoriteCamps = { data: [] }; // 保持一致的數據結構
      }

      // 載入折價券清單
      const couponResponse = await fetch(
        `${window.api_prefix}/api/userdiscount/search/${memId}`
      );
      this.memberCoupons = await couponResponse.json();
      console.log("memberCoupons:", this.memberCoupons);


      // 載入營地資料
      const campsResponse = await fetch(`${window.api_prefix}/api/getallcamps`);
      const campsData = await campsResponse.json();

      if (campsData.status.trim() === "success") {
        this.camps = campsData.data;
      } else {
        console.error("獲取營地資料失敗:", campsData.message);
        this.camps = [];
      }
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

          // 如果是聊天管理標籤，初始化聊天管理功能
          if (targetTab === "chat-management") {
            // 調用本地的聊天管理初始化方法
            this.initChatManagement();
          }
        }
      });
    });

    // 初始化訂單狀態篩選器
    this.initOrderFilter();
    console.log("initOrderFilter:" + this.campsiteOrders);
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

    // API已經根據會員ID篩選過訂單，直接使用
    let memberOrders = [...this.campsiteOrders];
    console.log("memberOrders:" + memberOrders);

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
        (order) => order.campsiteOrderStatus === targetStatus
      );
    }

    this.renderOrders(memberOrders);
  }

  renderOrders(orders) {
    const ordersList = document.getElementById("campsite-orders-list");
    console.log("ordersList:" + ordersList);

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

    // 按訂單日期排序，最新的在上面
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.orderDate || "1970-01-01");
      const dateB = new Date(b.orderDate || "1970-01-01");
      return dateB - dateA; // 降序排列，最新的在前
    });

    ordersList.innerHTML = sortedOrders
      .map((order) => {
        console.log("ORDER:" + order.checkIn);

        const camp = this.camps.find((c) => c.campId === order.campId);
        const statusText = this.getOrderStatusText(order.campsiteOrderStatus);
        const statusClass = this.getOrderStatusClass(order.campsiteOrderStatus);
        const payMethodText = this.getPayMethodText(order.payMethod);

        // 獲取該訂單的加購商品
        const orderDetailsList = this.orderDetails.filter(
          (detail) => detail.campsite_order_id === order.campsiteOrderId
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
              <h4>${camp ? camp.campName : "營地名稱"}</h4>
              <p class="order-id">訂單編號: ${order.campsiteOrderId}</p>
              <p class="order-date"><i class="fas fa-clock"></i> 下訂日期: ${order.orderDate || "未提供"
          }</p>
            </div>
            <div class="order-status ${statusClass}">
              ${statusText}
            </div>
          </div>
          
          <div class="order-details">
            <div class="order-dates">
              <span><i class="fas fa-calendar-check"></i> 入住: ${order.checkIn || "未提供"
          }</span>
              <span><i class="fas fa-calendar-times"></i> 退房: ${order.checkOut || "未提供"
          }</span>
            </div>
            <div class="payment-method">
              <span><i class="fas fa-credit-card"></i> ${payMethodText}</span>
            </div>
          </div>
          
          ${orderDetailsList.length > 0
            ? `
            <div class="order-details-section">
              <h5><i class="fas fa-list"></i> 訂單明細</h5>
              <div class="details-list">
                ${orderDetailsList
              .map(
                (detail) => `
                  <div class="detail-item">
                    <span>營地類型ID: ${detail.campsite_type_id}</span>
                    <span>營地數量: ${detail.campsite_num}</span>
                    <span>營地金額: NT$ ${(
                    detail.campsite_amount || 0
                  ).toLocaleString()}</span>
                  </div>
                `
              )
              .join("")}
              </div>
            </div>
          `
            : ""
          }
          
          <div class="amount-breakdown">
            <div class="amount-row">
              <span>營地費用:</span>
              <span>NT$ ${(order.campsiteAmount || 0).toLocaleString()}</span>
            </div>
            ${(order.bundleAmount || 0) > 0
            ? `
              <div class="amount-row">
                <span>加購項目:</span>
                <span>NT$ ${order.bundleAmount.toLocaleString()}</span>
              </div>
            `
            : ""
          }
            <div class="amount-row">
              <span>小計:</span>
              <span>NT$ ${(order.befAmount || 0).toLocaleString()}</span>
            </div>
            ${(order.disAmount || 0) > 0
            ? `
              <div class="amount-row discount">
                <span>折扣:</span>
                <span>-NT$ ${order.disAmount.toLocaleString()}</span>
              </div>
            `
            : ""
          }
            <div class="amount-row total">
              <span>實付金額:</span>
              <span>NT$ ${(order.aftAmount || 0).toLocaleString()}</span>
            </div>
          </div>
          
          ${bundleItems.length > 0
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
          
          ${order.commentContent
            ? `
            <div class="order-comment">
              <div class="rating">
                ${this.generateStars(order.commentSatisfaction)}
              </div>
              <p>${order.commentContent}</p>
            </div>
          `
            : ""
          }
        </div>
      `;
      })
      .join("");

    // 渲染完商品明細表格後
    bindCommentButtons();
  }


  // 載入營地訂單
  loadCampsiteOrders() {
    // 初始顯示所有訂單（不篩選狀態）
    this.renderOrders(this.campsiteOrders);
  }


  loadMemberData() {
    if (!this.currentMember) return;

    // 初始化更改密碼按鈕
    const changePasswordBtn = document.querySelector(".btn-change-password");
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener("click", () => {
        // 創建密碼更改模態框
        this.showChangePasswordModal();
      });
    }

    // 設置隱藏的memId輸入框，供WebSocket連接使用
    const memIdInput = document.getElementById("memId");
    if (memIdInput) {
      memIdInput.value = this.currentMember.memId || "";
      console.log("設置memId隱藏輸入框:", this.currentMember.memId);
    }

    // 填入基本資料
    document.getElementById("profile-id").value =
      this.currentMember.memId || "";
    document.getElementById("profile-name").value =
      this.currentMember.memName || "";
    document.getElementById("profile-email").value =
      this.currentMember.memEmail || "";
    document.getElementById("profile-phone").value =
      this.currentMember.memMobile || "";
    document.getElementById("profile-address").value =
      this.currentMember.memAddr || "";
    document.getElementById("profile-birthday").value =
      this.currentMember.memBirth || "";
    document.getElementById("profile-gender").value =
      this.currentMember.memGender || "";

    // 綁定表單提交事件
    const profileForm = document.querySelector(".profile-form");
    if (profileForm) {
      profileForm.addEventListener(
        "submit",
        this.handleProfileUpdate.bind(this)
      );
    }
  }

  // 處理會員資料更新
  async handleProfileUpdate(e) {
    e.preventDefault();

    if (!this.currentMember) {
      showMessage("無法獲取會員資料，請重新登入", "error");
      return;
    }

    // 收集表單資料
    const memData = {
      memId: document.getElementById("profile-id").value,
      memName: document.getElementById("profile-name").value,
      memEmail: document.getElementById("profile-email").value,
      memMobile: document.getElementById("profile-phone").value,
      memAddr: document.getElementById("profile-address").value,
      memBirth: document.getElementById("profile-birthday").value,
      memGender: document.getElementById("profile-gender").value,
    };

    // 驗證必填欄位
    if (!memData.memName || !memData.memMobile || !memData.memAddr) {
      showMessage("請填寫所有必填欄位", "error");
      return;
    }

    try {
      // 使用API更新會員資料
      const response = await fetch(`${window.api_prefix}/api/member/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(memData),
        credentials: "include", // 包含Cookie
      });

      if (!response.ok) {
        throw new Error("更新請求失敗");
      }

      const data = await response.json();

      if (data.success) {
        // 更新成功，更新本地儲存的會員資料
        this.currentMember = { ...this.currentMember, ...memData };

        // 更新localStorage和sessionStorage中的會員資訊
        if (localStorage.getItem("currentMember")) {
          localStorage.setItem(
            "currentMember",
            JSON.stringify(this.currentMember)
          );
        }
        if (sessionStorage.getItem("currentMember")) {
          sessionStorage.setItem(
            "currentMember",
            JSON.stringify(this.currentMember)
          );
        }

        showMessage("會員資料更新成功", "success");
      } else {
        showMessage(data.message || "更新失敗，請檢查資料是否正確", "error");
      }
    } catch (error) {
      console.error("更新失敗：", error);
      showMessage("更新失敗，請稍後再試", "error");
    }
  }

  loadCampsiteOrders() {
    // API已經根據會員ID篩選過訂單，直接使用
    this.renderOrders(this.campsiteOrders);
  }

  async loadFavoriteCamps() {
    console.log("loadFavoriteCamps 方法開始執行");
    const favoritesGrid = document.getElementById("favorite-camps-grid");
    console.log("favoritesGrid 元素:", favoritesGrid);
    if (!favoritesGrid) {
      console.log("找不到 favorite-camps-grid 元素，方法提前返回");
      return;
    }
    console.log("memberInfo11:");
    // 取得會員ID
    let memId = null;
    const memberInfo =
      localStorage.getItem("currentMember") ||
      sessionStorage.getItem("currentMember");

    console.log("memberInfo11:", memberInfo);

    if (memberInfo) {
      try {
        const memberObj = JSON.parse(memberInfo);
        memId = memberObj.memId || memberObj.mem_id || memberObj.id;
      } catch (e) {
        memId = null;
      }
    }

    console.log("memId1", memId);

    if (!memId) {
      favoritesGrid.innerHTML = `<div class="empty-state"><i class="fas fa-heart"></i><h3>請先登入會員以查看收藏營地</h3></div>`;
      return;
    }

    try {
      // 檢查 favoriteCamps 的資料結構
      let camps = [];
      if (this.favoriteCamps) {
        // 如果有 data 屬性，使用 data；否則直接使用 favoriteCamps
        camps = this.favoriteCamps.data || this.favoriteCamps;
      }

      if (!Array.isArray(camps) || camps.length === 0) {
        favoritesGrid.innerHTML = `<div class="empty-state"><i class="fas fa-heart"></i><h3>尚無收藏營地</h3></div>`;
        return;
      }

      // 渲染收藏卡片
      favoritesGrid.innerHTML = camps
        .map(
          (camp) => `
        <div class="favorite-camp-item" data-camp-id="${camp.campId}">
          <div class="camp-image">
            <img src="${window.api_prefix}/api/camps/${camp.campId}/1" alt="${camp.campName || ""
            }" />
            <button class="btn-remove-favorite" data-camp-id="${camp.campId
            }"><i class="fas fa-heart"></i></button>
          </div>
          <div class="camp-info">
            <h4>${camp.campName || ""}</h4>
            <p class="camp-description">${camp.campContent || ""}</p>
            <div class="camp-actions">
              <a href="campsite-detail.html?id=${camp.campId
            }" class="btn-view">查看詳情</a>
            </div>
          </div>
        </div>
      `
        )
        .join("");

      // 綁定每個愛心按鈕點擊事件
      favoritesGrid.querySelectorAll(".btn-remove-favorite").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const campId = btn.dataset.campId;

          if (!campId || !memId) {
            alert("資料錯誤，請重新登入或刷新頁面");
            return;
          }

          const confirmDelete = confirm("確定要移除這個收藏營地嗎？");
          if (!confirmDelete) return;

          try {

            const res = await fetch(
              `${window.api_prefix}/camptracklist/deleteCampTrackList`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  campId: parseInt(campId),
                  memId: parseInt(memId),
                }),
              }
            );




            const result = await res.json();

            if (result.status === "success") {
              const card = btn.closest(".favorite-camp-item");

              // ✅ 加上動畫 class
              card.classList.add("removing");

              // ✅ 動畫結束後再移除 DOM
              setTimeout(() => card.remove(), 300);

              // ✅ 如果全部都刪完了，顯示空狀態（延後一點再判斷）
              setTimeout(() => {
                if (
                  favoritesGrid.querySelectorAll(".favorite-camp-item")
                    .length === 0
                ) {
                  favoritesGrid.innerHTML = `<div class="empty-state"><i class="fas fa-heart"></i><h3>尚無收藏營地</h3></div>`;
                }
              }, 350);
            } else {
              alert("移除失敗：" + result.message);
            }
          } catch (err) {
            console.error(err);
            alert("發生錯誤，請稍後再試");
          }
        });
      });
    } catch (err) {
      favoritesGrid.innerHTML = `<div class="empty-state"><i class="fas fa-heart"></i><h3>無法取得收藏列表，請稍後再試</h3></div>`;
    }
  }

  async loadCoupons() {
    const couponsGrid = document.getElementById("coupon-grid");
    if (!couponsGrid) return;

    const coupons = this.memberCoupons;

    if (!Array.isArray(coupons) || coupons.length === 0) {
      couponsGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-ticket-alt"></i>
          <h3>尚無可用折價券</h3>
        </div>`;
      return;
    }

    // 渲染折價券卡片
    couponsGrid.innerHTML = coupons
      .map((coupon) => {
        const now = new Date();
        const end = new Date(coupon.endDate);
        const isExpired = end < now;
        const isUsed = coupon.usedDate != null;

        let statusClass = "available";
        let statusText = "可使用";
        if (isUsed) {
          statusClass = "used";
          statusText = "已使用";
        } else if (isExpired) {
          statusClass = "expired";
          statusText = "已過期";
        }

        const typeText = coupon.discountCodeType === 0 ? "營地折價券" : "商城折價券";

        return `
          <div class="coupon-card ${statusClass}">
            <div class="coupon-header">
              <div class="coupon-type">${typeText}</div>
              <div class="coupon-status">${statusText}</div>
            </div>
            <div class="coupon-content">
              <div class="coupon-title">活動名稱:${coupon.discountCode}</div>
              <div class="coupon-description">單筆滿 NT$${coupon.minOrderAmount} 可使用</div>
              <div class="coupon-valid">使用期限：${coupon.startDate.substring(0, 10)} ~ ${coupon.endDate.substring(0, 10)}</div>
            </div>
            <div class="coupon-footer">
              <div class="coupon-code">請使用優惠碼：${coupon.discountCodeId}</div>
              ${!isExpired && !isUsed
            ? `<button class="btn-copy-code" data-code="${coupon.discountCodeId}">複製代碼</button>`
            : ""
          }
              ${isUsed
            ? `<div class="coupon-used-date">使用日期：${coupon.usedDate.substring(0, 10)}</div>`
            : ""
          }
            </div>
          </div>`;
      })
      .join("");

    // 複製按鈕功能
    document.querySelectorAll(".btn-copy-code").forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.dataset.code;
        navigator.clipboard.writeText(code).then(() => {
          alert(`已複製折價券代碼：${code}`);
        });
      });
    });

    this.setupCouponFilters();
  }

  // 載入付款方式
  async loadPaymentMethods() {
    console.log("=== 開始載入付款方式 ===");
    try {
      if (!this.currentMember || !this.currentMember.memId) {
        console.log("無會員資訊，跳過載入付款方式");
        return;
      }

      const memId = this.currentMember.memId;
      console.log("載入會員付款方式，會員ID:", memId);

      // 這裡可以添加 API 調用來獲取真實的付款方式數據
      // const response = await fetch(`${window.api_prefix}/api/member/${memId}/payment-methods`);
      // const paymentData = await response.json();

      // 目前顯示靜態示範數據，實際應用時可以替換為 API 數據
      const paymentMethodsList = document.querySelector('.payment-methods-list');
      if (paymentMethodsList) {
        console.log("付款方式區域已載入，顯示示範數據");
        // 可以在這裡動態渲染真實的付款方式數據
        this.initPaymentMethodEvents();
      }
    } catch (error) {
      console.error("載入付款方式失敗:", error);
    }
  }

  // 初始化付款方式事件
  initPaymentMethodEvents() {
    // 新增付款方式按鈕
    const addPaymentBtn = document.querySelector('.btn-add-payment');
    if (addPaymentBtn) {
      addPaymentBtn.addEventListener('click', () => {
        console.log('新增付款方式');
        // 這裡可以打開新增付款方式的模態框
        alert('新增付款方式功能開發中');
      });
    }

    // 編輯按鈕
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        console.log('編輯付款方式');
        alert('編輯付款方式功能開發中');
      });
    });

    // 刪除按鈕
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('確定要刪除此付款方式嗎？')) {
          console.log('刪除付款方式');
          alert('刪除付款方式功能開發中');
        }
      });
    });

    // 設為預設按鈕
    document.querySelectorAll('.btn-set-default').forEach(btn => {
      btn.addEventListener('click', () => {
        console.log('設為預設付款方式');
        alert('設為預設付款方式功能開發中');
      });
    });
  }

  // 初始化聊天管理
  initChatManagement() {
    console.log("=== 開始初始化聊天管理 ===");
    try {
      if (!this.currentMember || !this.currentMember.memId) {
        console.log("無會員資訊，跳過初始化聊天管理");
        return;
      }

      const memId = this.currentMember.memId;
      console.log("初始化聊天管理，會員ID:", memId);

      // 檢查聊天管理容器是否存在
      const chatList = document.getElementById("chat-list");
      if (chatList) {
        // 檢查是否已載入 chat-management.js
        if (typeof window.initChatManagement === "function") {
          console.log("調用 initChatManagement 函數");
          window.initChatManagement();
        } else {
          console.log("chat-management.js 尚未載入，顯示載入中狀態");
          chatList.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-comments"></i>
              <h3>載入中...</h3>
              <p>正在載入您的聊天記錄</p>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error("初始化聊天管理失敗:", error);
      const chatList = document.getElementById("chat-list");
      if (chatList) {
        chatList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>載入失敗</h3>
            <p>無法載入聊天記錄，請稍後再試</p>
          </div>
        `;
      }
    }
  }

  setupCouponFilters() {
    const filterTabs = document.querySelectorAll(".filter-tab");


    filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const status = tab.getAttribute("data-status");

        // 切換 active 樣式
        filterTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        // ✅ 每次點擊重新取得卡片（動態渲染的才抓得到）
        const couponCards = document.querySelectorAll(".coupon-card");


        couponCards.forEach((card) => {
          const isUsed = card.classList.contains("used");
          const isExpired = card.classList.contains("expired");
          const isAvailable = card.classList.contains("available");

          let show = false;
          switch (status) {
            case "all":
              show = true;
              break;
            case "available":
              show = isAvailable;
              break;
            case "used":
              show = isUsed;
              break;
            case "expired":
              show = isExpired;
              break;
          }

          card.style.display = show ? "block" : "none";
        });
      });
    });
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

  // WebSocket 連接方法
  connect() {
    // 每次連接時都重新獲取最新的ID值
    this.memId = document.getElementById("memId").value.trim();
    this.ownerId = document.getElementById("ownerId").value.trim();

    console.log(
      "準備連接 WebSocket，會員ID:",
      this.memId,
      "營地主ID:",
      this.ownerId,
      "當前連接的營地主ID:",
      this.currentOwnerId
    );

    if (!this.memId || !this.ownerId) {
      this.log("⚠️ 無法建立聊天連線：缺少會員ID或營地主ID");
      return;
    }

    // 如果是訪客，顯示提示訊息
    if (this.memId === "guest") {
      this.addMessage("請先登入以使用聊天功能", "system");
      return;
    }

    // 如果已經連接且ownerId相同，不要重複連接
    if (
      this.stompClient &&
      this.stompClient.connected &&
      this.currentOwnerId === this.ownerId
    ) {
      return;
    }

    // 如果已經連接但ownerId不同，先斷開連接
    if (
      this.stompClient &&
      this.stompClient.connected &&
      this.currentOwnerId !== this.ownerId
    ) {
      console.log("切換到不同的營地主，重新建立連接");
      this.disconnect();
    }

    // 記錄當前的ownerId
    this.currentOwnerId = this.ownerId;

    try {
      const socket = new SockJS(`${window.api_prefix}/ws-chat`);
      this.stompClient = Stomp.over(socket);

      console.log("嘗試連接 WebSocket...");

      this.stompClient.connect(
        {},
        () => {
          this.log(`🔗 已與伺服器建立連線`);

          // 即時訊息
          this.stompClient.subscribe("/user/queue/messages", (msg) => {
            console.log("收到新訊息:", msg.body);
            const message = JSON.parse(msg.body);
            const time = this.formatTime(message.chatMsgTime);

            // 根據訊息方向決定顯示方式
            if (message.chatMsgDirect === 0) {
              // 會員發送的訊息
              this.addMessage(message.chatMsgContent, "user", time);
            } else {
              // 營地主發送的訊息
              this.addMessage(message.chatMsgContent, "other", time);
            }
          });

          // 一次性歷史訊息接收
          const historyTopic = "/user/queue/history";
          console.log("訂閱歷史訊息頻道:", historyTopic);

          this.stompClient.subscribe(historyTopic, (msg) => {
            console.log("收到歷史訊息:", msg.body);
            const messageList = JSON.parse(msg.body);
            if (Array.isArray(messageList)) {
              // 清空現有訊息
              const messagesContainer =
                document.getElementById("chat-messages");
              if (messagesContainer) {
                messagesContainer.innerHTML = "";
              }

              // 顯示歷史訊息
              messageList.forEach((message) => {
                const time = this.formatTime(message.chatMsgTime);
                if (message.chatMsgDirect === 0) {
                  // 會員發送的訊息
                  this.addMessage(message.chatMsgContent, "user", time);
                } else {
                  // 營地主發送的訊息
                  this.addMessage(message.chatMsgContent, "other", time);
                }
              });
            } else {
              this.log("⚠️ 歷史訊息格式錯誤");
            }
          });

          // 已讀通知（可選）
          this.stompClient.subscribe(
            "/user/" + this.memId + "/queue/read",
            (msg) => {
              const message = JSON.parse(msg.body);
              this.log(`📖 [已讀通知] ${message.chatMsgContent}`);
            }
          );

          // 發送請求歷史資料
          const currentMemId = parseInt(this.memId);
          const currentOwnerId = parseInt(this.ownerId);
          console.log("請求歷史訊息數據:", {
            memId: currentMemId,
            ownerId: currentOwnerId,
          });
          this.stompClient.send(
            "/app/chat.history",
            {},
            JSON.stringify({
              memId: currentMemId,
              ownerId: currentOwnerId,
            })
          );
        },
        (error) => {
          // 連接錯誤處理
          console.error("WebSocket連接錯誤:", error);
          this.addMessage("無法連接到聊天服務，請稍後再試", "system");
        }
      );
    } catch (error) {
      console.error("WebSocket初始化錯誤:", error);
      this.addMessage("聊天服務暫時不可用", "system");
    }
  }

  // 日誌輔助方法
  log(message) {
    console.log(message);
  }

  // 添加訊息到聊天視窗
  addMessage(content, type, time) {
    const messagesContainer = document.getElementById("chat-messages");
    if (!messagesContainer) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${type}`;

    // 如果沒有提供時間，使用當前時間
    if (!time) {
      time = new Date().toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // 檢查是否在營地主後台
    const isOwnerDashboard =
      window.location.pathname.includes("owner-dashboard");

    if (type === "user") {
      if (isOwnerDashboard) {
        // 在營地主後台，"user"類型的訊息是營地主發送的，應該顯示在右側
        messageDiv.innerHTML = `
          <div class="message-content">${content}</div>
          <div class="message-info">${time}</div>
        `;
      } else {
        // 在會員頁面，"user"類型的訊息是會員發送的，顯示在右側
        messageDiv.innerHTML = `
          <div class="message-content">${content}</div>
          <div class="message-info">${time}</div>
        `;
      }
    } else if (type === "other") {
      if (isOwnerDashboard) {
        // 在營地主後台，"other"類型的訊息是會員發送的，顯示在左側
        messageDiv.innerHTML = `
          <div class="chat-user">
            <img src="images/user-1.jpg" alt="會員">
            <span>會員</span>
          </div>
          <div class="message-content">${content}</div>
          <div class="message-info">${time}</div>
        `;
      } else {
        // 在會員頁面，"other"類型的訊息是營地主發送的，顯示在左側
        messageDiv.innerHTML = `
          <div class="chat-user">
            <img src="images/user-1.jpg" alt="客服">
            <span>客服小露</span>
          </div>
          <div class="message-content">${content}</div>
          <div class="message-info">${time}</div>
        `;
      }
    } else if (type === "system") {
      // 系統訊息
      messageDiv.innerHTML = `
        <div class="message-content system-message">${content}</div>
        <div class="message-info">${time}</div>
      `;
      messageDiv.className = `chat-message system`;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // 格式化時間
  formatTime(millis) {
    return new Date(millis).toLocaleString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 斷開WebSocket連接
  disconnect() {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        console.log("WebSocket連接已斷開");
        this.currentOwnerId = null; // 重置當前營地主ID
      });
    }
  }
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  // UserProfileManager實例已在文件末尾創建

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
      const memId = userProfileManager.currentMember?.memId;

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
      fetch(`${window.api_prefix}/member/${memId}/picture`, {
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
            const memId = userProfileManager.currentMember?.memId;

            // 添加載入指示器
            const loadingIndicator = document.createElement("div");
            loadingIndicator.className = "avatar-loading";
            const avatarPreviewContainer =
              document.querySelector(".avatar-preview");
            if (avatarPreviewContainer) {
              avatarPreviewContainer.appendChild(loadingIndicator);
            }

            // 從服務器獲取最新頭像
            fetch(`${window.api_prefix}/member/${memId}/pic?t=${timestamp}`)
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
    <i class="fas ${type === "success"
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
    background: ${type === "success" ? "#d4edda" : type === "error" ? "#f8d7da" : "#d1ecf1"
    };
    color: ${type === "success" ? "#155724" : type === "error" ? "#721c24" : "#0c5460"
    };
    border: 1px solid ${type === "success" ? "#c3e6cb" : type === "error" ? "#f5c6cb" : "#bee5eb"
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

// WebSocket方法已在UserProfileManager類內部定義

// 創建全局UserProfileManager實例
window.userProfileManager = new UserProfileManager();

// 導出UserProfileManager類（如果需要）
if (typeof module !== "undefined" && module.exports) {
  module.exports = UserProfileManager;
}

// 商城訂單管理功能
function loadShopOrders() {
  const memId = document.getElementById("profile-id").value;
  const listDiv = document.getElementById("shop-orders-list");
  listDiv.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h3>載入中...</h3></div>';
  if (!memId) {
    listDiv.innerHTML =
      '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>請先登入</h3></div>';
    return;
  }
  fetch(`${window.api_prefix}/api/getOneByMemId?memId=${memId}`)
    .then((res) => res.json())
    .then((data) => {
      if (!data || !data.data || data.data.length === 0) {
        listDiv.innerHTML =
          '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>尚無商城訂單</h3><p>您還沒有購買任何商品</p><a href="shop.html" class="btn-primary">前往商城</a></div>';
        return;
      }
      let html =
        '<table class="data-table"><thead><tr><th>訂單編號</th><th>日期</th><th>金額</th><th>狀態</th><th>操作</th></tr></thead><tbody>';
      data.data.forEach((order) => {
        html += `<tr>
          <td>${order.shopOrderId}</td>
          <td>${order.shopOrderDate ? order.shopOrderDate.split("T")[0] : ""
          }</td>
          <td>NT$ ${order.afterDiscountAmount}</td>
          <td>${order.shopOrderStatusStr || ""}</td>
          <td><button class="btn-view" onclick="viewShopOrderDetail(${order.shopOrderId
          })">查看詳情</button></td>
        </tr>`;
      });
      html += "</tbody></table>";
      listDiv.innerHTML = html;
    })
    .catch(() => {
      listDiv.innerHTML =
        '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>載入失敗</h3></div>';
    });
}

function viewShopOrderDetail(orderId) {
  const modal = document.getElementById("shop-order-detail-modal");
  const contentDiv = document.getElementById("shop-order-detail-content");
  contentDiv.innerHTML =
    '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><h3>載入中...</h3></div>';
  modal.style.display = "block";

  // 先取得訂單主檔
  fetch(`${window.api_prefix}/api/getOneById?shopOrderId=${orderId}`)
    .then((res) => res.json())
    .then((orderRes) => {
      const order = orderRes.data;
      if (!order) {
        contentDiv.innerHTML =
          '<div class="empty-state"><i class="fas fa-info-circle"></i><h3>查無訂單資料</h3></div>';
        return;
      }
      // 再取得明細
      fetch(
        `${window.api_prefix}/api/getDetailsByShopOrderId?shopOrderId=${orderId}`
      )
        .then((res) => res.json())
        .then((detailRes) => {
          const details = detailRes.data || [];
          // 格式化
          const statusText = order.shopOrderStatusStr || "";
          const paymentMethod = order.shopOrderPaymentStr || "";
          const shipmentMethod = order.shopOrderShipmentStr || "";
          const returnApplyText = order.shopReturnApplyStr || "";
          const orderDate = order.shopOrderDate
            ? order.shopOrderDate.split("T")[0]
            : "";
          const totalItems = details.reduce(
            (sum, item) => sum + (item.shopOrderQty || 0),
            0
          );
          let productRows = "";
          details.forEach((detail) => {
            const productName = detail.prodName || `商品 #${detail.prodId}`;
            const colorName =
              detail.prodColorName || `顏色 #${detail.prodColorId || "無"}`;
            const specName =
              detail.prodSpecName || `規格 #${detail.prodSpecId || "無"}`;
            const unitPrice =
              detail.prodOrderPrice != null ? detail.prodOrderPrice : 0;
            const subtotal = detail.shopOrderQty * unitPrice;
            const commentSatis =
              detail.commentSatis != null ? detail.commentSatis : "";
            const commentContent = detail.commentContent || "";
            // 只有訂單狀態為3時才顯示評論按鈕
            const canComment = order.shopOrderStatus === 3;

            productRows += `
              <tr>
                <td>${productName}</td>
                <td>${colorName}</td>
                <td>${specName}</td>
                <td>${detail.shopOrderQty}</td>
                <td>NT$ ${unitPrice}</td>
                <td>NT$ ${subtotal.toLocaleString()}</td>
                <td>${commentSatis}</td>
                <td>${commentContent}</td>

                <td>
                  ${canComment
                ? `<button class="btn-comment"
                        data-order-id="${order.shopOrderId}"
                        data-prod-id="${detail.prodId}"
                        data-prod-color-id="${detail.prodColorId != null ? detail.prodColorId : ""
                }"
                        data-prod-spec-id="${detail.prodSpecId != null ? detail.prodSpecId : ""
                }"
                        data-comment-satis="${detail.commentSatis || ""}"
                        data-comment-content="${detail.commentContent || ""}">
                        評分/評論
                      </button>`
                : `<span class="text-muted"> </span>`
              }
                </td>

              </tr>
            `;
          });
          contentDiv.innerHTML = `
            <div class="order-detail-modal">
              <div class="modal-header">
                <h3>訂單詳情 #${order.shopOrderId}</h3>
              </div>
              <div class="order-info-section-group">
                <div class="order-info-section">
                  <h4>基本資訊</h4>
                  <div class="info-grid">
                    <div class="info-item"><span class="info-label">訂單編號:</span><span class="info-value">${order.shopOrderId
            }</span></div>
                    <div class="info-item"><span class="info-label">訂單日期:</span><span class="info-value">${orderDate}</span></div>
                    <div class="info-item"><span class="info-label">訂單狀態:</span><span class="info-value status-badge">${statusText}</span></div>
                    <div class="info-item"><span class="info-label">付款方式:</span><span class="info-value">${paymentMethod}</span></div>
                    <div class="info-item"><span class="info-label">配送方式:</span><span class="info-value">${shipmentMethod}</span></div>
                    <div class="info-item"><span class="info-label">商品總數:</span><span class="info-value">${totalItems} 件</span></div>
                    <div class="info-item"><span class="info-label">退貨申請狀態:</span><span class="info-value">${returnApplyText}</span></div>
                    <div class="info-item"><span class="info-label">出貨日期:</span><span class="info-value">${order.shopOrderShipDate
              ? order.shopOrderShipDate.split("T")[0]
              : ""
            }</span></div>
                  </div>
                </div>
                <div class="order-info-section">
                  <h4>收件人資訊</h4>
                  <div class="info-grid">
                    <div class="info-item"><span class="info-label">姓名:</span><span class="info-value">${order.orderName || ""
            }</span></div>
                    <div class="info-item"><span class="info-label">電話:</span><span class="info-value">${order.orderPhone || ""
            }</span></div>
                    <div class="info-item"><span class="info-label">Email:</span><span class="info-value">${order.orderEmail || ""
            }</span></div>
                    <div class="info-item"><span class="info-label">收件地址:</span><span class="info-value">${order.orderShippingAddress || ""
            }</span></div>
                  </div>
                </div>
              </div>
              <div class="order-info-section">
                <h4>商品明細</h4>
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>商品名稱</th>
                        <th>顏色</th>
                        <th>規格</th>
                        <th>數量</th>
                        <th>單價</th>
                        <th>小計</th>
                        <th>評分</th>
                        <th>評論內容</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${productRows}
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="order-actions" style="margin: 20px 0 0 0;">
                <button id="btn-cancel-order" data-order-id="${order.shopOrderId
            }" style="display:none; margin-right: 12px;">申請取消訂單</button>
                <button id="btn-return-order" data-order-id="${order.shopOrderId
            }" style="display:none;">申請退貨</button>
                <div id="order-action-error" style="color:red;margin-top:8px;"></div>
              </div>
              <div class="order-info-section">
                <h4>金額明細</h4>
                <div class="amount-breakdown">
                  <div class="amount-item"><span class="amount-label">商品總額:</span><span class="amount-value">NT$ ${order.beforeDiscountAmount
            }</span></div>
                  <div class="amount-item"><span class="amount-label">運費:</span><span class="amount-value">NT$ ${order.shopOrderShipFee
            }</span></div>
                  <div class="amount-item discount"><span class="amount-label">折扣金額:</span><span class="amount-value">- NT$ ${order.discountAmount == null ? 0 : order.discountAmount
            }</span></div>
                  <div class="amount-item total"><span class="amount-label">訂單總額:</span><span class="amount-value">NT$ ${order.afterDiscountAmount
            }</span></div>
                </div>
              </div>
              <div class="modal-actions">
                <button class="action-btn btn-close" onclick="closeShopOrderDetailModal()">關閉</button>
              </div>
            </div>
          `;
          // 控制按鈕顯示
          const btnCancel = document.getElementById("btn-cancel-order");
          const btnReturn = document.getElementById("btn-return-order");
          if (btnCancel) btnCancel.style.display = "none";
          if (btnReturn) btnReturn.style.display = "none";
          if (order.shopOrderStatus === 0 || order.shopOrderStatus === 1) {
            btnCancel.style.display = "";
          }

          if (order.shopOrderStatus === 3 && order.shopReturnApply === 0) {
            btnReturn.style.display = "";
          }
          // 綁定事件
          if (btnCancel) {
            btnCancel.onclick = async function () {
              const orderId = this.dataset.orderId;
              const data = { shopOrderId: orderId, shopOrderStatus: 5 };
              try {
                const resp = await fetch(
                  `${window.api_prefix}/api/updateShopOrderByMember`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  }
                );
                const result = await resp.json();
                if (!resp.ok || result.error)
                  throw new Error(result.message || "申請失敗");
                alert("已申請取消訂單");
                closeShopOrderDetailModal();
              } catch (err) {
                document.getElementById("order-action-error").textContent =
                  err.message;
              }
            };
          }
          if (btnReturn) {
            btnReturn.onclick = async function () {
              const orderId = this.dataset.orderId;
              const data = { shopOrderId: orderId, shopReturnApply: 1 };
              try {
                const resp = await fetch(
                  `${window.api_prefix}/api/updateShopOrderByMember`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  }
                );
                const result = await resp.json();
                if (!resp.ok || result.error)
                  throw new Error(result.message || "申請失敗");
                alert("已申請退貨");
                closeShopOrderDetailModal();
              } catch (err) {
                document.getElementById("order-action-error").textContent =
                  err.message;
              }
            };
          }
        });
    });
}

function closeShopOrderDetailModal() {
  document.getElementById("shop-order-detail-modal").style.display = "none";
}

// 自動載入商城訂單管理（切換到該分頁時）
document.addEventListener("DOMContentLoaded", function () {
  const shopOrdersTab = document.querySelector('[data-tab="shop-orders"]');
  if (shopOrdersTab) {
    shopOrdersTab.addEventListener("click", loadShopOrders);
  }
  // 若預設顯示商城訂單管理，也可自動載入
  if (document.getElementById("shop-orders").classList.contains("active")) {
    loadShopOrders();
  }
});

// ====== 商品明細評分/評論功能（事件代理版） ======

// 2. 評分/評論 Modal HTML（建議插入到 user-profile.html 尾端）
if (!document.getElementById("commentModal")) {
  const modalHtml = `
  <div id="commentModal" class="order-details-modal">
    <div class="modal-content" style="max-width:400px;">
      <div class="modal-header">
        <h2>商品評分/評論</h2>
        <span class="close" id="closeCommentModal">&times;</span>
      </div>
      <div class="modal-body">
        <form id="commentForm">
          <input type="hidden" name="shopOrderId">
          <input type="hidden" name="prodId">
          <input type="hidden" name="prodColorId">
          <input type="hidden" name="prodSpecId">
          <div style="margin-bottom:12px;">
            <label>評分（0~5分）</label>
            <input type="number" name="commentSatis" min="0" max="5" required style="width:60px;">
          </div>
          <div style="margin-bottom:12px;">
            <label>評論內容</label>
            <textarea name="commentContent" rows="3" maxlength="200" style="width:100%;"></textarea>
          </div>
          <div style="margin-top:16px;">
            <button type="submit" class="btn-upload">送出</button>
          </div>
          <div id="commentError" style="color:red;margin-top:8px;"></div>
        </form>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

// 事件代理：所有 .btn-comment 按鈕都能正確觸發
if (!window._commentBtnDelegation) {
  document.body.addEventListener("click", function (e) {
    if (e.target.classList && e.target.classList.contains("btn-comment")) {
      const btn = e.target;
      const modal = document.getElementById("commentModal");
      if (!modal) {
        alert("評論視窗未正確載入");
        return;
      }
      modal.querySelector('input[name="shopOrderId"]').value =
        btn.dataset.orderId;
      modal.querySelector('input[name="prodId"]').value = btn.dataset.prodId;
      modal.querySelector('input[name="prodColorId"]').value =
        btn.dataset.prodColorId;
      modal.querySelector('input[name="prodSpecId"]').value =
        btn.dataset.prodSpecId;
      modal.querySelector('input[name="commentSatis"]').value =
        btn.dataset.commentSatis || "";
      modal.querySelector('textarea[name="commentContent"]').value =
        btn.dataset.commentContent || "";
      modal.classList.add("show");
      document.getElementById("commentError").textContent = "";
    }
    if (e.target.id === "closeCommentModal") {
      document.getElementById("commentModal").classList.remove("show");
    }
  });
  window._commentBtnDelegation = true;
}

// 送出評論
if (document.getElementById("commentForm")) {
  document.getElementById("commentForm").onsubmit = async function (e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      shopOrderId: form.shopOrderId.value,
      prodId: form.prodId.value,
      prodColorId:
        form.prodColorId.value && form.prodColorId.value !== "undefined"
          ? form.prodColorId.value
          : null,
      prodSpecId:
        form.prodSpecId.value && form.prodSpecId.value !== "undefined"
          ? form.prodSpecId.value
          : null,
      commentSatis: form.commentSatis.value,
      commentContent: form.commentContent.value,
    };
    // 基本欄位檢查
    if (
      data.commentSatis === "" ||
      isNaN(data.commentSatis) ||
      data.commentSatis < 0 ||
      data.commentSatis > 5
    ) {
      document.getElementById("commentError").textContent = "請輸入0~5分的評分";
      return;
    }
    try {
      const resp = await fetch(`${window.api_prefix}/api/updateComments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await resp.json();
      if (!resp.ok || result.error) {
        throw new Error(result.message || "更新失敗");
      }
      alert("評論已更新！");
      document.getElementById("commentModal").classList.remove("show");
      // 你可以在這裡刷新明細資料
    } catch (err) {
      document.getElementById("commentError").textContent = err.message;
    }
  };
}

// 自動關閉商城訂單詳情視窗（只要點擊商城訂單管理以外的區域）
document.addEventListener("click", function (e) {
  const modal = document.getElementById("shop-order-detail-modal");
  const shopOrderSection = document.getElementById("shop-orders");
  if (
    modal &&
    modal.style.display !== "none" &&
    !modal.contains(e.target) &&
    shopOrderSection &&
    !shopOrderSection.contains(e.target)
  ) {
    closeShopOrderDetailModal();
  }
});

// === 收藏文章管理器（從 articles-favorites.html 移植，並整合到 user-profile.js） ===
class FavoritesManager {
  constructor() {
    this.currentMember = null;
    this.favorites = [];
    this.filteredFavorites = [];
    this.membersData = null;
    this.currentCategory = 'all';
    this.currentSearchKeyword = '';
    this.currentSortType = 'latest';
    this.init();
  }

  async init() {
    this.checkLoginStatus();
    await this.loadMembersData();
    await this.loadFavorites();
    this.setupEventListeners();
  }

  checkLoginStatus() {
    const memberData = localStorage.getItem("currentMember") || sessionStorage.getItem("currentMember");
    if (memberData) {
      this.currentMember = JSON.parse(memberData);
      this.currentMember.memId = this.currentMember.mem_id || this.currentMember.memId;
      this.updateUserInfo();
    } else {
      this.showEmptyState('請先登入才能查看收藏');
    }
  }

  updateUserInfo() {
    // 可根據 user-profile.html 結構補充
  }

  async loadMembersData() {
    try {
      const response = await fetch('data/mem.json');
      this.membersData = await response.json();
    } catch (error) {
      this.membersData = [];
    }
  }

  async loadFavorites() {
    if (!this.currentMember) {
      this.showEmptyState('請先登入');
      return;
    }
    try {
      const response = await fetch(`${window.api_prefix}/api/favorites`);
      const result = await response.json();
      if (response.ok && result.status === 'success' && result.data) {
        this.favorites = result.data.filter(fav => fav.memId === (this.currentMember.mem_id || this.currentMember.memId));
        await this.loadFavoriteArticles();
      } else {
        this.loadLocalFavorites();
      }
    } catch (error) {
      this.loadLocalFavorites();
    }
  }

  loadLocalFavorites() {
    const localFavorites = JSON.parse(localStorage.getItem('articleFavorites') || '[]');
    this.favorites = localFavorites.filter(fav => fav.memId === (this.currentMember.mem_id || this.currentMember.memId));
    if (this.favorites.length > 0) {
      this.loadFavoriteArticles();
    } else {
      this.showEmptyState();
    }
  }

  async loadFavoriteArticles() {
    try {
      const response = await fetch(`${window.api_prefix}/api/articles`);
      const result = await response.json();
      if (response.ok && result.status === 'success' && result.data) {
        const favoriteArticles = this.favorites.map(fav => {
          const article = result.data.find(art => art.acId === fav.acId);
          return {
            ...article,
            favoriteTime: fav.acFavTime
          };
        }).filter(article => article.acId);
        this.favorites = favoriteArticles;
        this.filteredFavorites = [...favoriteArticles];
        this.sortFavorites('latest');
        this.displayFavorites();
        this.updateCategories();
      } else {
        this.showEmptyState('無法載入文章資訊');
      }
    } catch (error) {
      this.showEmptyState('載入失敗');
    }
  }

  displayFavorites() {
    const container = document.getElementById('favorites-container');
    const countElement = document.getElementById('favorites-count');
    if (!container) return;
    if (this.filteredFavorites.length === 0) {
      this.showEmptyState();
      return;
    }
    if (countElement) {
      countElement.textContent = this.filteredFavorites.length;
    }
    let html = '';
    for (let index = 0; index < this.filteredFavorites.length; index++) {
      const article = this.filteredFavorites[index];
      const favoriteDate = article.favoriteTime ? new Date(article.favoriteTime).toLocaleDateString('zh-TW') : '未知時間';
      const authorName = this.getAuthorName(article);
      const articleType = this.getArticleType(article.acTypeId);
      html += `
                <div class="article-item" data-article-id="${article.acId}">
                    <div class="article-image-cell">
                        <img src="images/camp-${(index % 5) + 1}.jpg" alt="文章圖片" class="article-image" />
                    </div>
                    <div class="article-title-cell">
                        <a href="articles.html?id=${article.acId}" class="article-title-link">${article.acTitle}</a>
                        <div class="article-preview">${article.acContext ? article.acContext.substring(0, 100) + '...' : '無內容預覽'}</div>
                        <span class="article-tag">${articleType}
                          <span class="reply-count" data-article-id="${article.acId}" style="margin-left:18px;color:#fff;font-size:0.92em;">
                            <i class='fas fa-comments' style="color:#fff;"></i> ${article.replyCount || 0}
                          </span>
                          <span class="view-count" data-article-id="${article.acId}" style="margin-left:12px;color:#fff;font-size:0.92em;">
                            <i class='fas fa-eye' style="color:#fff;"></i> ${article.acViewCount || 0}
                          </span>
                        </span>
                    </div>
                    <div class="article-author-cell">${authorName}</div>
                    <div class="article-date-cell">${favoriteDate}</div>
                    <div class="article-stats-cell">
                        <button class="remove-favorite-btn" onclick="favoritesManager.removeFavorite(${article.acId})">
                            <i class="fas fa-trash"></i> 移除收藏
                        </button>
                    </div>
                </div>
            `;
    }
    container.innerHTML = html;
  }

  showEmptyState(message = '') {
    const container = document.getElementById('favorites-container');
    const countElement = document.getElementById('favorites-count');
    if (countElement) {
      countElement.textContent = '0';
    }
    if (container) {
      container.innerHTML = `<div class="empty-favorites"><i class="fas fa-bookmark"></i><h3>還沒有收藏任何文章</h3><p>${message || '開始瀏覽論壇，收藏您喜歡的文章吧！'}</p><a href="article-type.html" class="btn-explore">瀏覽論壇</a></div>`;
    }
  }

  async removeFavorite(articleId) {
    if (!confirm('確定要移除這篇收藏嗎？')) return;
    try {
      await fetch(`${window.api_prefix}/api/favorites/${this.currentMember.mem_id}/${articleId}`, { method: 'DELETE' });
    } catch { }
    this.favorites = this.favorites.filter(fav => fav.acId !== articleId);
    this.filteredFavorites = this.filteredFavorites.filter(fav => fav.acId !== articleId);
    const localFavorites = JSON.parse(localStorage.getItem('articleFavorites') || '[]');
    const updatedFavorites = localFavorites.filter(fav => !(fav.memId === (this.currentMember.mem_id || this.currentMember.memId) && fav.acId === articleId));
    localStorage.setItem('articleFavorites', JSON.stringify(updatedFavorites));
    this.sortFavorites(document.getElementById('sort-favorites')?.value || 'latest');
    this.updateCategories();
    this.showMessage('已移除收藏', 'success');
  }

  updateCategories() {
    const categoriesList = document.getElementById('categories-list');
    if (!categoriesList) return;
    const categories = {};
    this.favorites.forEach(article => {
      const type = this.getArticleType(article.acTypeId);
      categories[type] = (categories[type] || 0) + 1;
    });
    if (Object.keys(categories).length === 0) {
      categoriesList.innerHTML = '<li><div style="text-align: center; padding: 20px; color: #666;">暫無分類</div></li>';
      return;
    }
    let html = '';
    const totalCount = this.favorites.length;
    html += `<li class="category-item active" data-category="all" style="cursor: pointer; background-color: #3A5A40; color: white; border-radius: 5px;"><span class="category-name">全部</span><span class="category-count">${totalCount}</span></li>`;
    Object.entries(categories).forEach(([type, count]) => {
      html += `<li class="category-item" data-category="${type}" style="cursor: pointer;"><span class="category-name">${type}</span><span class="category-count">${count}</span></li>`;
    });
    categoriesList.innerHTML = html;
    this.setupCategoryClickEvents();
  }

  getAuthorName(article) {
    if (!article) return '未知作者';
    const memberId = article.memId || article.mem_id;
    if (!memberId) return '未知作者';
    if (this.membersData) {
      const member = this.membersData.find(m => m.mem_id === memberId);
      return member ? member.mem_name : `用戶${memberId}`;
    }
    return `用戶${memberId}`;
  }

  getArticleType(acTypeId) {
    const typeMap = { 30001: '新手指南', 30002: '裝備評測', 30003: '營地推薦', 30004: '露營食譜', 30005: '戶外技巧' };
    return typeMap[acTypeId] || '其他';
  }

  // 統一過濾與排序流程
  applyFilters() {
    let filtered = [...this.favorites];
    // 1. 搜尋
    if (this.currentSearchKeyword.trim()) {
      const keyword = this.currentSearchKeyword.trim().toLowerCase();
      filtered = filtered.filter(article => {
        const authorName = this.getAuthorName(article).toLowerCase();
        return (
          (article.acTitle && article.acTitle.toLowerCase().includes(keyword)) ||
          (article.acContext && article.acContext.toLowerCase().includes(keyword)) ||
          authorName.includes(keyword)
        );
      });
    }
    // 2. 分類
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(article => this.getArticleType(article.acTypeId) === this.currentCategory);
    }
    // 3. 排序
    switch (this.currentSortType) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.favoriteTime) - new Date(a.favoriteTime));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.favoriteTime) - new Date(b.favoriteTime));
        break;
      case 'most-commented':
        filtered.sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0));
        break;
      case 'most-viewed':
        filtered.sort((a, b) => (b.acViewCount || 0) - (a.acViewCount || 0));
        break;
    }
    this.filteredFavorites = filtered;
    this.displayFavorites();
  }

  searchFavorites(keyword) {
    this.currentSearchKeyword = keyword;
    this.applyFilters();
  }

  sortFavorites(sortType) {
    this.currentSortType = sortType;
    this.applyFilters();
  }

  filterByCategory(category) {
    this.currentCategory = category;
    // 同步右側下拉選單
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      if (category === 'all') {
        categoryFilter.value = '';
      } else {
        for (let i = 0; i < categoryFilter.options.length; i++) {
          if (categoryFilter.options[i].text === category) {
            categoryFilter.selectedIndex = i;
            break;
          }
        }
      }
    }
    this.applyFilters();
    const countElement = document.getElementById('favorites-count');
    if (countElement) {
      countElement.textContent = this.filteredFavorites.length;
    }
    this.displayFavorites();
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.searchFavorites(searchInput.value.trim());
        }
      });
      // 新增：input 清空時自動重設搜尋
      searchInput.addEventListener('input', (event) => {
        if (!event.target.value) {
          this.searchFavorites('');
        }
      });
    }
    const sortSelect = document.getElementById('sort-favorites');
    if (sortSelect) {
      sortSelect.value = 'latest';
      sortSelect.addEventListener('change', (event) => {
        this.sortFavorites(event.target.value);
      });
    }
    // 新增：右側下拉分類選單同步
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (event) => {
        const val = event.target.value;
        this.filterByCategory(val === '' ? 'all' : categoryFilter.options[categoryFilter.selectedIndex].text);
        this.updateCategoryActiveState(val === '' ? 'all' : categoryFilter.options[categoryFilter.selectedIndex].text);
      });
    }
  }

  setupCategoryClickEvents() {
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      item.addEventListener('click', () => {
        const category = item.getAttribute('data-category');
        this.filterByCategory(category);
        this.updateCategoryActiveState(category);
        // 新增：同步右側下拉選單
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
          if (category === 'all') {
            categoryFilter.value = '';
          } else {
            // 根據 option 文字同步
            for (let i = 0; i < categoryFilter.options.length; i++) {
              if (categoryFilter.options[i].text === category) {
                categoryFilter.selectedIndex = i;
                break;
              }
            }
          }
        }
      });
    });
  }

  filterByCategory(category) {
    this.currentCategory = category; // 新增：記錄目前分類
    // 新增：同步右側下拉選單
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      if (category === 'all') {
        categoryFilter.value = '';
      } else {
        for (let i = 0; i < categoryFilter.options.length; i++) {
          if (categoryFilter.options[i].text === category) {
            categoryFilter.selectedIndex = i;
            break;
          }
        }
      }
    }
    this.sortFavorites(document.getElementById('sort-favorites')?.value || 'latest');
    const countElement = document.getElementById('favorites-count');
    if (countElement) {
      countElement.textContent = this.filteredFavorites.length;
    }
    this.displayFavorites();
  }

  updateCategoryActiveState(activeCategory) {
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      const category = item.getAttribute('data-category');
      if (category === activeCategory) {
        item.style.backgroundColor = '#3A5A40';
        item.style.color = 'white';
        item.style.borderRadius = '5px';
        item.classList.add('active');
      } else {
        item.style.backgroundColor = '#f8f9fa';
        item.style.color = '#333';
        item.style.borderRadius = '5px';
        item.classList.remove('active');
      }
    });
  }

  showMessage(message, type) {
    // 可複用現有 showMessage 實作
    window.showMessage?.(message, type);
  }
}

// 初始化收藏管理器
window.favoritesManager = new FavoritesManager();
