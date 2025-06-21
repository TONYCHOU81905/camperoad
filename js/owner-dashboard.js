// 營地主後台管理系統
class OwnerDashboard {
  constructor() {
    this.currentOwner = null;
    this.campData = null;
    this.campsiteData = [];
    this.bundleItemData = [];
    this.orderData = [];
    this.discountCodeData = [];
    this.init();
  }

  async init() {
    // 檢查登入狀態
    this.checkLoginStatus();

    // 載入所有資料
    await this.loadAllData();

    // 更新營地主資訊（在載入資料後）
    this.updateOwnerInfo();

    // 初始化UI
    this.initUI();

    // 綁定事件
    this.bindEvents();

    // 顯示預設頁面
    this.showTabContent("camp-info");
  }

  checkLoginStatus() {
    const savedOwner =
      localStorage.getItem("currentOwner") ||
      sessionStorage.getItem("currentOwner");
    if (!savedOwner) {
      alert("請先登入營地主帳號");
      window.location.href = "login.html";
      return;
    }

    this.currentOwner = JSON.parse(savedOwner);
  }

  updateOwnerInfo() {
    const ownerDisplayName = document.getElementById("ownerDisplayName");
    const ownerProfileBtn = document.getElementById("ownerProfileBtn");

    if (ownerDisplayName)
      ownerDisplayName.textContent = this.currentOwner.owner_name;

    // 更新右上角用戶按鈕，顯示營地名稱
    if (ownerProfileBtn && this.campData) {
      ownerProfileBtn.title = `營地：${this.campData.camp_name}`;
      ownerProfileBtn.innerHTML = `<i class="fas fa-user"></i> ${this.campData.camp_name}`;

      // 添加點擊事件，跳轉到房型管理tab
      ownerProfileBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showTabContent("camp-info");

        // 更新選單狀態
        document.querySelectorAll(".profile-menu-item").forEach((menuItem) => {
          menuItem.classList.remove("active");
        });
        const roomTypesMenuItem = document.querySelector(
          '.profile-menu-item[data-tab="camp-info"]'
        );
        if (roomTypesMenuItem) {
          roomTypesMenuItem.classList.add("active");
        }
      });
    }
  }

  async loadAllData() {
    try {
      // 載入營地資料
      const campResponse = await fetch("data/camp.json");
      const allCamps = await campResponse.json();
      this.campData = allCamps.find(
        (camp) => camp.owner_id === this.currentOwner.owner_id
      );

      // 載入房型資料
      const campsiteTypeResponse = await fetch("data/campsite_type.json");
      const allCampsiteTypes = await campsiteTypeResponse.json();
      this.campsiteTypeData = allCampsiteTypes.filter(
        (type) => this.campData && type.camp_id === this.campData.camp_id
      );

      // 載入營地房間資料
      const campsiteResponse = await fetch("data/campsite.json");
      const allCampsites = await campsiteResponse.json();
      this.campsiteData = allCampsites.filter(
        (campsite) =>
          this.campData && campsite.camp_id === this.campData.camp_id
      );

      // 載入加購商品資料
      const bundleResponse = await fetch("data/bundle_item.json");
      const allBundles = await bundleResponse.json();
      this.bundleItemData = allBundles.filter(
        (bundle) => this.campData && bundle.camp_id === this.campData.camp_id
      );

      // 載入訂單資料
      const orderResponse = await fetch("data/campsite_order.json");
      const allOrders = await orderResponse.json();
      this.orderData = allOrders.filter(
        (order) => this.campData && order.camp_id === this.campData.camp_id
      );

      // 載入訂單詳細資料
      const orderDetailsResponse = await fetch(
        "data/campsite_order_details.json"
      );
      this.orderDetails = await orderDetailsResponse.json();

      // 載入折價券資料
      const discountResponse = await fetch("data/discount_code.json");
      const allDiscounts = await discountResponse.json();
      this.discountCodeData = allDiscounts.filter(
        (discount) => discount.owner_id === this.currentOwner.owner_id
      );

      // 載入會員資料
      const memberResponse = await fetch("data/mem.json");
      this.memberData = await memberResponse.json();
    } catch (error) {
      console.error("載入資料失敗：", error);
      this.showMessage("載入資料失敗，請重新整理頁面", "error");
    }
  }

  initUI() {
    // 初始化營地基本資料表單
    this.initCampInfoForm();
  }

  initCampInfoForm() {
    if (!this.campData) return;

    const form = document.getElementById("campInfoForm");
    if (!form) return;

    // 填入現有資料
    const fields = {
      "camp-name": this.campData.camp_name,
      "camp-location":
        this.campData.camp_city +
        this.campData.camp_dist +
        this.campData.camp_addr,
      "camp-status": this.campData.camp_release_status,
      "camp-score":
        this.campData.camp_comment_sun_score /
        this.campData.camp_comment_number_count,
      "camp-description": this.campData.camp_content || "",
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.value = value;
    });

    // 初始化營地照片顯示
    this.renderCampImages();
  }

  // 檢查圖片是否存在的輔助函數
  checkImageExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async renderCampImages() {
    if (!this.campData || !this.campData.camp_id) {
      console.warn("無法渲染營地圖片：缺少營地ID");
      return;
    }

    const campId = this.campData.camp_id;
    const defaultImagePath = "images/camp-1.jpg";

    for (let i = 1; i <= 4; i++) {
      const container = document.getElementById(`campImage${i}Container`);
      if (!container) continue;

      // 檢查是否有圖片數據
      // const hasImageData = this.campData[`camp_pic${i}`];
      const hasImageData = true;
      if (hasImageData) {
        // 構建API圖片URL
        const apiImageUrl = `http://localhost:8081/CJA101G02/api/camps/${campId}/${i}`;
        console.log("apiImageUrl:" + apiImageUrl);

        // 檢查API圖片是否可訪問
        const apiImageExists = await this.checkImageExists(apiImageUrl);
        console.log(i + ":" + apiImageExists);

        // 決定使用哪個圖片URL
        const imageUrl = apiImageExists ? apiImageUrl : defaultImagePath;
        const imageSource = apiImageExists
          ? apiImageUrl
          : this.campData[`camp_pic${i}`] || defaultImagePath;

        container.innerHTML = `
          <div class="image-container">
            <img src="${imageUrl}" class="thumbnail" onclick="ownerDashboard.showCampImageModal('${imageSource}', ${i})" />
            <div class="image-actions">
              <button class="btn btn-sm btn-camping" onclick="ownerDashboard.uploadCampImage(${i})"><i class="fas fa-upload"></i></button>
              <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteCampImage(${i})"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="image-placeholder" onclick="ownerDashboard.uploadCampImage(${i})">
            <i class="fas fa-plus"></i>
            <span>上傳圖片</span>
          </div>
        `;
      }
    }
  }

  bindEvents() {
    // 側邊選單切換
    document
      .querySelectorAll(".profile-menu-item[data-tab]")
      .forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const tab = item.getAttribute("data-tab");
          this.showTabContent(tab);

          // 更新選單狀態
          document
            .querySelectorAll(".profile-menu-item")
            .forEach((menuItem) => {
              menuItem.classList.remove("active");
            });
          item.classList.add("active");
        });
      });

    // 登出按鈕
    // 處理登出按鈕（側邊欄中的登出按鈕）
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // 營地資料表單
    const campInfoForm = document.getElementById("campInfoForm");
    if (campInfoForm) {
      campInfoForm.addEventListener("submit", (e) =>
        this.handleCampInfoUpdate(e)
      );
    }

    // 新增房型按鈕 - 現在使用Bootstrap data屬性控制
    // const addRoomTypeBtn = document.getElementById("addRoomTypeBtn");
    // if (addRoomTypeBtn) {
    //   addRoomTypeBtn.addEventListener("click", () =>
    //     this.showAddRoomTypeModal()
    //   );
    // }

    // 新增加購商品按鈕
    const addBundleItemBtn = document.getElementById("addBundleItemBtn");
    if (addBundleItemBtn) {
      addBundleItemBtn.addEventListener("click", () =>
        this.showAddBundleItemModal()
      );
    }

    // 新增折價券按鈕
    const addDiscountCodeBtn = document.getElementById("addDiscountCodeBtn");
    if (addDiscountCodeBtn) {
      addDiscountCodeBtn.addEventListener("click", () =>
        this.showAddDiscountCodeModal()
      );
    }

    // 模態框事件
    this.bindModalEvents();
  }

  bindModalEvents() {
    // 房型模態框
    const roomTypeModal = document.getElementById("addRoomTypeModal");
    const closeRoomTypeModal = document.getElementById("closeRoomTypeModal");
    const cancelRoomType = document.getElementById("cancelRoomType");
    const addRoomTypeForm = document.getElementById("addRoomTypeForm");

    if (closeRoomTypeModal) {
      closeRoomTypeModal.addEventListener("click", () =>
        this.hideModal("addRoomTypeModal")
      );
    }
    if (cancelRoomType) {
      cancelRoomType.addEventListener("click", () =>
        this.hideModal("addRoomTypeModal")
      );
    }
    if (addRoomTypeForm) {
      addRoomTypeForm.addEventListener("submit", (e) =>
        this.handleAddRoomType(e)
      );
    }

    // 編輯房型表單
    const editRoomTypeForm = document.getElementById("editRoomTypeForm");
    if (editRoomTypeForm) {
      editRoomTypeForm.addEventListener("submit", (e) =>
        this.handleEditRoomType(e)
      );
    }

    // 加購商品模態框
    const closeBundleItemModal = document.getElementById(
      "closeBundleItemModal"
    );
    const cancelBundleItem = document.getElementById("cancelBundleItem");
    const addBundleItemForm = document.getElementById("addBundleItemForm");

    if (closeBundleItemModal) {
      closeBundleItemModal.addEventListener("click", () =>
        this.hideModal("addBundleItemModal")
      );
    }
    if (cancelBundleItem) {
      cancelBundleItem.addEventListener("click", () =>
        this.hideModal("addBundleItemModal")
      );
    }
    if (addBundleItemForm) {
      addBundleItemForm.addEventListener("submit", (e) =>
        this.handleAddBundleItem(e)
      );
    }

    // 折價券模態框
    const closeDiscountCodeModal = document.getElementById(
      "closeDiscountCodeModal"
    );
    const cancelDiscountCode = document.getElementById("cancelDiscountCode");
    const addDiscountCodeForm = document.getElementById("addDiscountCodeForm");

    if (closeDiscountCodeModal) {
      closeDiscountCodeModal.addEventListener("click", () =>
        this.hideModal("addDiscountCodeModal")
      );
    }
    if (cancelDiscountCode) {
      cancelDiscountCode.addEventListener("click", () =>
        this.hideModal("addDiscountCodeModal")
      );
    }
    if (addDiscountCodeForm) {
      addDiscountCodeForm.addEventListener("submit", (e) =>
        this.handleAddDiscountCode(e)
      );
    }

    // 折價券表單驗證
    const discountTypeSelect = document.getElementById("discount-type");
    const discountValueInput = document.getElementById("discount-value");
    const startDateInput = document.getElementById("discount-start-date");
    const endDateInput = document.getElementById("discount-end-date");

    if (discountTypeSelect && discountValueInput) {
      discountTypeSelect.addEventListener("change", () => {
        const discountType = parseInt(discountTypeSelect.value);
        if (discountType === 1) {
          // 百分比折扣
          discountValueInput.setAttribute("max", "0.99");
          discountValueInput.setAttribute("step", "0.01");
          discountValueInput.setAttribute("placeholder", "例如：0.1 (代表10%)");
          discountValueInput.removeAttribute("min");
        } else {
          // 固定金額折扣
          discountValueInput.setAttribute("min", "1");
          discountValueInput.setAttribute("step", "1");
          discountValueInput.setAttribute("placeholder", "例如：100");
          discountValueInput.removeAttribute("max");
        }
        discountValueInput.value = ""; // 清空輸入值
      });

      // 初始化設定
      discountTypeSelect.dispatchEvent(new Event("change"));
    }

    if (startDateInput && endDateInput) {
      startDateInput.addEventListener("change", () => {
        const startDate = startDateInput.value;
        if (startDate) {
          // 設定結束日期的最小值為開始日期的隔天
          const minEndDate = new Date(startDate);
          minEndDate.setDate(minEndDate.getDate() + 1);
          endDateInput.setAttribute(
            "min",
            minEndDate.toISOString().split("T")[0]
          );

          // 如果當前結束日期早於或等於開始日期，清空結束日期
          if (
            endDateInput.value &&
            new Date(endDateInput.value) <= new Date(startDate)
          ) {
            endDateInput.value = "";
          }
        }
      });
    }

    // 訂單狀態篩選
    const orderStatusFilter = document.getElementById("orderStatusFilter");
    if (orderStatusFilter) {
      orderStatusFilter.addEventListener("change", () => this.renderOrders());
    }
  }

  showTabContent(tabName) {
    // 隱藏所有內容
    document.querySelectorAll(".profile-section").forEach((content) => {
      content.classList.remove("active");
    });

    // 顯示指定內容
    const targetContent = document.getElementById(tabName);
    if (targetContent) {
      targetContent.classList.add("active");
    }

    // 根據不同頁面載入對應資料
    switch (tabName) {
      case "room-types":
        this.renderRoomTypes();
        break;
      case "bundle-items":
        this.renderBundleItems();
        break;
      case "orders":
        this.renderOrders();
        break;
      case "discount-codes":
        this.renderDiscountCodes();
        break;
    }
  }
  renderRoomTypes() {
    console.log("renderRoomTypes called");
    const tableBody = document.getElementById("roomTypesTableBody");
    if (!tableBody) return;

    if (!this.campsiteTypeData || this.campsiteTypeData.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center">尚未設定任何房型</td></tr>';
      return;
    }

    const html = this.campsiteTypeData
      .map((roomType) => {
        return `
      <tr>
        <td>${roomType.campsite_name}</td>
        <td>
          <button class="btn btn-link p-0" onclick="ownerDashboard.showRoomDetails('${
            roomType.campsite_type_id
          }')">
            ${roomType.campsite_num} 間
          </button>
        </td>
        <td>${roomType.campsite_people} 人</td>
        <td>NT$ ${roomType.campsite_price.toLocaleString()}</td>
        <td class="image-cell">
          ${
            roomType.campsite_pic1
              ? `<div class="image-container">
                   <img src="${roomType.campsite_pic1}" class="thumbnail" onclick="ownerDashboard.showImageModal('${roomType.campsite_pic1}', '${roomType.campsite_type_id}', 1)" />
                   <div class="image-actions">
                     <button class="btn btn-sm btn-camping" onclick="ownerDashboard.uploadImage('${roomType.campsite_type_id}', 1)"><i class="fas fa-upload"></i></button>
                     <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteImage('${roomType.campsite_type_id}', 1)"><i class="fas fa-trash"></i></button>
                   </div>
                 </div>`
              : `<div class="image-placeholder" onclick="ownerDashboard.uploadImage('${roomType.campsite_type_id}', 1)">
                   <i class="fas fa-plus"></i>
                   <span>上傳圖片</span>
                 </div>`
          }
        </td>
        <td class="image-cell">
          ${
            roomType.campsite_pic2
              ? `<div class="image-container">
                   <img src="${roomType.campsite_pic2}" class="thumbnail" onclick="ownerDashboard.showImageModal('${roomType.campsite_pic2}', '${roomType.campsite_type_id}', 2)" />
                   <div class="image-actions">
                     <button class="btn btn-sm btn-camping" onclick="ownerDashboard.uploadImage('${roomType.campsite_type_id}', 2)"><i class="fas fa-upload"></i></button>
                     <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteImage('${roomType.campsite_type_id}', 2)"><i class="fas fa-trash"></i></button>
                   </div>
                 </div>`
              : `<div class="image-placeholder" onclick="ownerDashboard.uploadImage('${roomType.campsite_type_id}', 2)">
                   <i class="fas fa-plus"></i>
                   <span>上傳圖片</span>
                 </div>`
          }
        </td>
        <td class="image-cell">
          ${
            roomType.campsite_pic3
              ? `<div class="image-container">
                   <img src="${roomType.campsite_pic3}" class="thumbnail" onclick="ownerDashboard.showImageModal('${roomType.campsite_pic3}', '${roomType.campsite_type_id}', 3)" />
                   <div class="image-actions">
                     <button class="btn btn-sm btn-camping" onclick="ownerDashboard.uploadImage('${roomType.campsite_type_id}', 3)"><i class="fas fa-upload"></i></button>
                     <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteImage('${roomType.campsite_type_id}', 3)"><i class="fas fa-trash"></i></button>
                   </div>
                 </div>`
              : `<div class="image-placeholder" onclick="ownerDashboard.uploadImage('${roomType.campsite_type_id}', 3)">
                   <i class="fas fa-plus"></i>
                   <span>上傳圖片</span>
                 </div>`
          }
        </td>
        <td class="image-cell">
          ${
            roomType.campsite_pic4
              ? `<div class="image-container">
                   <img src="${roomType.campsite_pic4}" class="thumbnail" onclick="ownerDashboard.showImageModal('${roomType.campsite_pic4}', '${roomType.campsite_type_id}', 4)" />
                   <div class="image-actions">
                     <button class="btn btn-sm btn-camping" onclick="ownerDashboard.uploadImage('${roomType.campsite_type_id}', 4)"><i class="fas fa-upload"></i></button>
                     <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteImage('${roomType.campsite_type_id}', 4)"><i class="fas fa-trash"></i></button>
                   </div>
                 </div>`
              : `<div class="image-placeholder" onclick="ownerDashboard.uploadImage('${roomType.campsite_type_id}', 4)">
                   <i class="fas fa-plus"></i>
                   <span>上傳圖片</span>
                 </div>`
          }
        </td>
        <td>
          <button class="btn btn-sm btn-secondary me-1" onclick="ownerDashboard.editRoomType('${
            roomType.campsite_type_id
          }')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteRoomType('${
            roomType.campsite_type_id
          }')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
      })
      .join("");

    tableBody.innerHTML = html;
  }

  renderBundleItems() {
    const tableBody = document.getElementById("bundleItemsTableBody");
    if (!tableBody) return;

    if (this.bundleItemData.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="3" class="text-center py-4">尚未設定任何加購商品</td></tr>';
      return;
    }

    const html = this.bundleItemData
      .map(
        (item) => `
      <tr>
        <td>${item.bundle_name}</td>
        <td>NT$ ${item.bundle_price}</td>
        <td>
          <button class="btn btn-sm btn-secondary me-1" onclick="ownerDashboard.editBundleItem('${item.bundle_id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteBundleItem('${item.bundle_id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join("");

    tableBody.innerHTML = html;
  }

  renderOrders() {
    const tableBody = document.getElementById("ordersTableBody");
    const statusFilter = document.getElementById("orderStatusFilter");
    if (!tableBody) return;

    let filteredOrders = this.orderData;
    if (statusFilter && statusFilter.value) {
      filteredOrders = this.orderData.filter(
        (order) => order.campsite_order_status === statusFilter.value
      );
    }

    if (filteredOrders.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="10" class="text-center py-4">沒有符合條件的訂單</td></tr>';
      return;
    }

    const html = filteredOrders
      .map((order) => {
        // 獲取該訂單的詳細資料
        const orderDetails = this.orderDetails
          ? this.orderDetails.filter(
              (detail) => detail.campsite_order_id === order.campsite_order_id
            )
          : [];
        console.log("orderDetails:" + orderDetails);
        // 獲取會員姓名
        const member = this.memberData.find((m) => m.mem_id === order.mem_id);
        const memberName = member ? member.mem_name : `會員${order.mem_id}`;

        // 計算總營地數量和金額
        const totalCampsiteNum = orderDetails.reduce(
          (sum, detail) => sum + detail.campsite_num,
          0
        );
        const totalCampsiteAmount = orderDetails.reduce(
          (sum, detail) => sum + detail.campsite_amount,
          0
        );

        // 獲取房型名稱（顯示第一個房型，如果有多個則顯示"等N種房型"）
        let roomTypeDisplay = "無";
        if (orderDetails.length > 0) {
          const firstRoomType = this.campsiteTypeData.find(
            (type) => type.campsite_type_id === orderDetails[0].campsite_type_id
          );
          console.log("firstRoomType:" + firstRoomType);
          if (firstRoomType) {
            roomTypeDisplay =
              orderDetails.length > 1
                ? `${firstRoomType.campsite_name}等${orderDetails.length}種房型`
                : firstRoomType.campsite_name;
          }
        }

        return `
      <tr>
        <td>#${order.campsite_order_id}</td>
        <td>${memberName}</td>
        <td>${roomTypeDisplay}</td>
        <td>${totalCampsiteNum}</td>
        <td>NT$ ${order.camp_amount.toLocaleString()}</td>
        <td>${order.check_in.split(" ")[0]}</td>
        <td>${order.check_out.split(" ")[0]}</td>
        <td>NT$ ${order.aft_amount.toLocaleString()}</td>
        <td>
          <span class="badge bg-${
            order.campsite_order_status === "1"
              ? "warning"
              : order.campsite_order_status === "2"
              ? "info"
              : order.campsite_order_status === "3"
              ? "success"
              : "danger"
          }">
            ${this.getOrderStatusText(order.campsite_order_status)}
          </span>
        </td>
        <td>
          ${this.getOrderActionButtons(order)}
        </td>
      </tr>
    `;
      })
      .join("");

    tableBody.innerHTML = html;
  }

  renderDiscountCodes() {
    const tableBody = document.getElementById("discountCodesTableBody");
    if (!tableBody) return;

    if (this.discountCodeData.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="8" class="text-center py-4">尚未建立任何折價券</td></tr>';
      return;
    }

    const html = this.discountCodeData
      .map(
        (code) => `
      <tr>
        <td>${code.discount_code_id}</td>
        <td><strong>${code.discount_code}</strong></td>
        <td>${code.discount_explain || "折價券"}</td>
        <td>
          <span class="badge bg-${
            code.discount_type === 1 ? "success" : "primary"
          }">
            ${code.discount_type === 1 ? "百分比折扣" : "固定金額折扣"}
          </span>
        </td>
        <td>
          ${
            code.discount_type === 1
              ? code.discount_value * 100 + "%"
              : "NT$ " + code.discount_value
          }
        </td>
        <td>NT$ ${code.min_order_amount}</td>
        <td>
          ${code.start_date.split(" ")[0]} ~ ${code.end_date.split(" ")[0]}
        </td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteDiscountCode('${
            code.discount_code_id
          }')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join("");

    tableBody.innerHTML = html;
  }

  getOrderStatusText(status) {
    const statusMap = {
      1: "待付款",
      2: "已付款",
      3: "已完成",
      4: "已取消",
    };
    return statusMap[status] || "未知狀態";
  }

  getOrderActionButtons(order) {
    let actionButtons = `
      <button class="btn btn-sm btn-info me-1" onclick="ownerDashboard.showOrderDetails('${order.campsite_order_id}')">
        <i class="fas fa-info-circle"></i> 細節
      </button>
    `;

    switch (order.campsite_order_status) {
      case 1:
        actionButtons += `
          <button class="btn btn-sm btn-danger" onclick="ownerDashboard.cancelOrder('${order.campsite_order_id}')">
            <i class="fas fa-times"></i>
          </button>
        `;
        break;
      case 2:
        actionButtons += `
          <button class="btn btn-sm btn-camping me-1" onclick="ownerDashboard.checkInOrder('${order.campsite_order_id}')">
            <i class="fas fa-sign-in-alt"></i>
          </button>
          <button class="btn btn-sm btn-warning" onclick="ownerDashboard.checkOutOrder('${order.campsite_order_id}')">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        `;
        break;
    }

    return actionButtons;
  }

  // 顯示訂單詳細資料
  showOrderDetails(orderId) {
    const order = this.orderData.find((o) => o.campsite_order_id === orderId);
    if (!order) return;

    // 獲取訂單詳細資料
    const orderDetails = this.orderDetails.filter(
      (detail) => detail.campsite_order_id === orderId
    );
    console.log(this.campData);
    console.log(campData);

    // 查找折價券信息
    let discountInfo = null;
    if (order.discount_code_id) {
      discountInfo = this.discountCodeData.find(
        (discount) => discount.discount_code_id === order.discount_code_id
      );
    }

    // 獲取會員資料
    const member = memberData.find((m) => m.mem_id == order.mem_id);
    const memberName = member ? member.mem_name : `會員${order.mem_id}`;

    // 獲取營地資料
    const camp = campData.find((c) => c.camp_id == order.camp_id);
    const campName = camp ? camp.camp_name : "營地名稱";

    // 生成營地類型詳細資料
    const campsiteDetailsHtml = orderDetails
      .map((detail) => {
        const campsiteType = this.campsiteTypeData.find(
          (type) => type.campsite_type_id === detail.campsite_type_id
        );

        return `
        <div class="campsite-detail-item">
          <div class="campsite-info">
            <h6>${campsiteType ? campsiteType.campsite_name : "未知房型"}</h6>
            <p class="text-muted">房型ID: ${detail.campsite_type_id}</p>
            <p class="text-muted">可住人數: ${
              campsiteType ? campsiteType.campsite_people : "N/A"
            }人</p>
            <p class="text-muted">單價: NT$ ${
              campsiteType
                ? campsiteType.campsite_price.toLocaleString()
                : "N/A"
            }</p>
          </div>
          <div class="campsite-booking">
            <p><strong>預訂數量:</strong> ${detail.campsite_num} 間</p>
            <p><strong>小計金額:</strong> NT$ ${detail.campsite_amount.toLocaleString()}</p>
          </div>
        </div>
      `;
      })
      .join("");

    // 計算總數量和金額
    const totalCampsiteNum = orderDetails.reduce(
      (sum, detail) => sum + detail.campsite_num,
      0
    );
    const totalCampsiteAmount = orderDetails.reduce(
      (sum, detail) => sum + detail.campsite_amount,
      0
    );

    // 獲取訂單狀態文字
    const statusText = this.getOrderStatusText(order.campsite_order_status);
    const statusClass =
      order.campsite_order_status === "1"
        ? "warning"
        : order.campsite_order_status === "2"
        ? "info"
        : order.campsite_order_status === "3"
        ? "success"
        : "danger";

    const modalHtml = `
      <div class="modal fade" id="orderDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">訂單詳細資料</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="order-summary">
                <div class="row mb-3">
                  <div class="col-md-6">
                    <h6>基本資訊</h6>
                    <p><strong>訂單編號:</strong> ${order.campsite_order_id}</p>
                    <p><strong>營地名稱:</strong> ${campName}</p>
                    <p><strong>客戶姓名:</strong> ${memberName}</p>
                    <p><strong>下訂日期:</strong> ${order.order_date}</p>
                  </div>
                  <div class="col-md-6">
                    <h6>住宿資訊</h6>
                    <p><strong>入住日期:</strong> ${
                      order.check_in.split(" ")[0]
                    }</p>
                    <p><strong>退房日期:</strong> ${
                      order.check_out.split(" ")[0]
                    }</p>
                    <p><strong>訂單狀態:</strong> <span class="badge bg-${statusClass}">${statusText}</span></p>
                  </div>
                </div>
              </div>
              
              <hr>
              
              <div class="campsite-details">
                <h6>營地類型詳細資料</h6>
                <div class="campsite-details-list">
                  ${campsiteDetailsHtml}
                </div>
              </div>
              
              <hr>
              
              <div class="amount-breakdown">
                <h6>金額明細</h6>
                <div class="row">
                  <div class="col-md-6">
                    <div class="amount-item">
                      <span>營地總數量:</span>
                      <span><strong>${totalCampsiteNum} 間</strong></span>
                    </div>
                    <div class="amount-item">
                      <span>營地費用:</span>
                      <span>NT$ ${order.camp_amount.toLocaleString()}</span>
                    </div>
                    ${
                      order.bundle_amount > 0
                        ? `
                    <div class="amount-item">
                      <span>加購項目:</span>
                      <span>NT$ ${order.bundle_amount.toLocaleString()}</span>
                    </div>
                    `
                        : ""
                    }
                    <div class="amount-item">
                      <span>小計:</span>
                      <span>NT$ ${order.bef_amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    ${
                      order.dis_amount > 0
                        ? `
                    <div class="amount-item discount">
                      <span>折扣:</span>
                      <span class="text-success">-NT$ ${order.dis_amount.toLocaleString()}</span>
                    </div>
                    ${
                      discountInfo
                        ? `
                    <div class="amount-item discount-info">
                      <span>折價券:</span>
                      <span class="text-info">${discountInfo.discount_code}</span>
                    </div>
                    <div class="amount-item discount-detail">
                      <span>折價說明:</span>
                      <span class="text-muted">${discountInfo.discount_explain}</span>
                    </div>
                    `
                        : ""
                    }
                    `
                        : ""
                    }
                    <div class="amount-item total">
                      <span><strong>實付金額:</strong></span>
                      <span><strong class="text-primary">NT$ ${order.aft_amount.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 移除舊的彈窗（如果存在）
    const existingModal = document.getElementById("orderDetailsModal");
    if (existingModal) {
      existingModal.remove();
    }

    // 添加新彈窗到頁面
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 顯示彈窗
    const modal = new bootstrap.Modal(
      document.getElementById("orderDetailsModal")
    );
    modal.show();

    // 彈窗關閉後移除DOM元素
    document
      .getElementById("orderDetailsModal")
      .addEventListener("hidden.bs.modal", function () {
        this.remove();
      });
  }

  // 模態框控制
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "flex";
    }
  }

  hideModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
      // 清空表單
      const form = modalElement.querySelector("form");
      if (form) form.reset();
    }
  }

  showAddRoomTypeModal() {
    const modal = new bootstrap.Modal(
      document.getElementById("addRoomTypeModal")
    );
    modal.show();
  }

  showAddBundleItemModal() {
    // 重置為新增模式
    this.isEditingBundle = false;
    this.editingBundleId = null;

    // 更新模態框標題和按鈕
    document.getElementById("bundleModalTitle").textContent = "新增加購商品";
    const submitBtn = document.getElementById("submitBundleItem");
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> 新增商品';

    // 清空表單
    document.getElementById("addBundleItemForm").reset();
    document.getElementById("bundle-id").value = "";

    // 使用Bootstrap方式顯示模態框
    const modal = new bootstrap.Modal(
      document.getElementById("addBundleItemModal")
    );
    modal.show();
  }

  showAddDiscountCodeModal() {
    // 使用Bootstrap方式顯示模態框
    const modal = new bootstrap.Modal(
      document.getElementById("addDiscountCodeModal")
    );
    modal.show();
  }

  // 事件處理函數
  handleLogout() {
    if (confirm("確定要登出嗎？")) {
      // 清除所有相關的儲存資料
      localStorage.removeItem("currentOwner");
      sessionStorage.removeItem("currentOwner");
      // 也清除可能的其他相關資料
      localStorage.removeItem("ownerRememberMe");
      sessionStorage.removeItem("ownerRememberMe");
      this.showMessage("已成功登出", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    }
  }

  handleCampInfoUpdate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // 顯示載入中訊息，設置為不自動消失，並指定一個ID
    const messageId = "updating-camp-info";
    this.showMessage("正在更新營地資料...", "info", false, messageId);

    // 從表單獲取基本資料
    const campName = formData.get("camp_name");
    const campLocation = formData.get("camp_location");
    const campReleaseStatus = formData.get("camp_status");
    const campContent = formData.get("camp_description");

    // 解析地址為城市、區域和詳細地址
    // 假設格式為：城市區域詳細地址
    let campCity = "";
    let campDist = "";
    let campAddr = "";

    if (campLocation) {
      // 簡單的地址解析邏輯，實際應用可能需要更複雜的處理
      if (campLocation.length >= 3) {
        campCity = campLocation.substring(0, 3); // 假設前3個字是城市
        if (campLocation.length >= 6) {
          campDist = campLocation.substring(3, 6); // 假設接下來3個字是區域
          campAddr = campLocation.substring(6); // 剩餘部分是詳細地址
        } else {
          campAddr = campLocation.substring(3);
        }
      } else {
        campAddr = campLocation;
      }
    }

    // 獲取營地評分相關數據
    const campCommentNumberCount = this.campData
      ? this.campData.camp_comment_number_count || 0
      : 0;
    const campCommentSumScore = this.campData
      ? this.campData.camp_comment_sun_score || 0
      : 0;

    // 獲取營地註冊日期，如果沒有則使用當前日期
    const today = new Date();
    const campRegDate =
      this.campData && this.campData.camp_reg_date
        ? this.campData.camp_reg_date
        : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(today.getDate()).padStart(2, "0")}`;

    // 獲取營地主ID
    const ownerId = this.currentOwner.owner_id;

    // 創建FormData對象用於API請求
    const apiFormData = new FormData();
    apiFormData.append("campId", this.campData.camp_id);
    apiFormData.append("ownerId", ownerId);
    apiFormData.append("campName", campName);
    apiFormData.append("campContent", campContent);
    apiFormData.append("campCity", campCity);
    apiFormData.append("campDist", campDist);
    apiFormData.append("campAddr", campAddr);
    apiFormData.append("campReleaseStatus", campReleaseStatus);
    apiFormData.append("campCommentNumberCount", campCommentNumberCount);
    apiFormData.append("campCommentSumScore", campCommentSumScore);
    apiFormData.append("campRegDate", campRegDate);

    console.log("campId", this.campData.camp_id);
    console.log("ownerId", ownerId);

    // 獲取營地圖片
    // 檢查是否有圖片1和圖片2（必須的）
    if (!this.campData || !this.campData.campPic1 || !this.campData.campPic2) {
      this.showMessage("請上傳必要的營地圖片（至少需要圖片1和圖片2）", "error");
      return;
    }

    // 添加圖片到FormData
    apiFormData.append("campPic1", this.campData.campPic1);
    apiFormData.append("campPic2", this.campData.campPic2);

    // 添加可選圖片
    if (this.campData.campPic3) {
      apiFormData.append("campPic3", this.campData.campPic3);
    }

    if (this.campData.campPic4) {
      apiFormData.append("campPic4", this.campData.campPic4);
    }

    // 發送API請求
    fetch(
      //create
      // "http://localhost:8081/CJA101G02/api/camps/createonecamp?withOrders=false",

      //update
      "http://localhost:8081/CJA101G02/api/camps/updateonecamp?withOrders=false",
      {
        method: "POST",
        body: apiFormData,
      }
    )
      .then((response) => response.json())
      .then((data) => {
        // 移除更新中的提示語
        const updatingMessage = document.getElementById("updating-camp-info");
        if (updatingMessage) {
          updatingMessage.remove();
        }

        if (data && data.status === "success") {
          // 更新成功
          console.log("營地資料更新成功：", data);
          this.showMessage("營地資料更新成功！", "success");

          // 更新本地數據
          if (data.data) {
            this.campData = {
              ...this.campData,
              ...data.data,
            };
          }

          // 重新渲染營地圖片
          this.renderCampImages();
        } else {
          // 更新失敗
          console.error("營地資料更新失敗：", data);
          this.showMessage(
            `營地資料更新失敗：${data.message || "未知錯誤"}`,
            "error"
          );
        }
      })
      .catch((error) => {
        // 移除更新中的提示語
        const updatingMessage = document.getElementById("updating-camp-info");
        if (updatingMessage) {
          updatingMessage.remove();
        }

        console.error("API請求錯誤：", error);
        this.showMessage(
          `API請求錯誤：${error.message || "未知錯誤"}`,
          "error"
        );
      });
  }

  handleAddRoomType(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (!this.campData) {
      this.showMessage("請先設定營地基本資料", "error");
      return;
    }

    // 生成新的房型ID
    const newTypeId = this.generateRandomId();

    const roomTypeData = {
      campsite_type_id: newTypeId,
      camp_id: this.campData.camp_id,
      campsite_name: formData.get("campsite_name"),
      campsite_people: parseInt(formData.get("campsite_people")),
      campsite_num: parseInt(formData.get("campsite_num")),
      campsite_price: parseInt(formData.get("campsite_price")),
      campsite_pic1: formData.get("campsite_pic") || null,
      campsite_pic2: null,
      campsite_pic3: null,
      campsite_pic4: null,
    };

    // 添加到本地資料
    if (!this.campsiteTypeData) {
      this.campsiteTypeData = [];
    }
    this.campsiteTypeData.push(roomTypeData);

    console.log("新增房型：", roomTypeData);
    this.showMessage("房型新增成功！", "success");

    // 關閉模態框
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addRoomTypeModal")
    );
    if (modal) {
      modal.hide();
    }

    // 清空表單
    e.target.reset();

    // 立即重新載入房型資料
    this.renderRoomTypes();
  }

  handleEditRoomType(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const typeId = formData.get("campsite_type_id");
    // console.log("aaaaaa");
    // console.log("a:", this.campsiteTypeData);
    // console.log("編輯房型：", typeId);

    // this.campsiteTypeData.findIndex((type) =>
    //   console.log(
    //     "typeId:",
    //     typeId,
    //     "type.campsite_type_id:",
    //     type.campsite_type_id
    //   )
    // );

    // 找到要更新的房型資料
    const roomTypeIndex = this.campsiteTypeData.findIndex(
      (type) => type.campsite_type_id == typeId
    );

    console.log("更新前的房型資料：", this.campsiteTypeData[roomTypeIndex]);

    if (roomTypeIndex === -1) {
      this.showMessage("找不到房型資料", "error");
      return;
    }

    // 更新房型資料
    const updatedRoomType = {
      ...this.campsiteTypeData[roomTypeIndex],
      campsite_name: formData.get("campsite_name"),
      campsite_people: parseInt(formData.get("campsite_people")),
      campsite_num: parseInt(formData.get("campsite_num")),
      campsite_price: parseInt(formData.get("campsite_price")),
      campsite_pic1: formData.get("campsite_pic1") || null,
      campsite_pic2: formData.get("campsite_pic2") || null,
      campsite_pic3: formData.get("campsite_pic3") || null,
      campsite_pic4: formData.get("campsite_pic4") || null,
    };

    // 更新陣列中的資料
    this.campsiteTypeData[roomTypeIndex] = updatedRoomType;

    console.log("更新房型：", updatedRoomType);
    this.showMessage("房型更新成功！", "success");

    // 關閉模態框
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editRoomTypeModal")
    );
    if (modal) {
      modal.hide();
    }

    // 重新載入房型資料
    setTimeout(() => {
      this.renderRoomTypes();
    }, 500);
  }

  handleAddBundleItem(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (!this.campData) {
      this.showMessage("請先設定營地基本資料", "error");
      return;
    }

    const bundleName = formData.get("bundle_name");
    const bundlePrice = parseInt(formData.get("bundle_price"));

    if (this.isEditingBundle && this.editingBundleId) {
      // 編輯模式
      const bundleIndex = this.bundleItemData.findIndex(
        (item) => item.bundle_id === this.editingBundleId
      );
      if (bundleIndex !== -1) {
        this.bundleItemData[bundleIndex] = {
          ...this.bundleItemData[bundleIndex],
          bundle_name: bundleName,
          bundle_price: bundlePrice,
        };
        console.log("更新加購商品：", this.bundleItemData[bundleIndex]);
        this.showMessage("加購商品更新成功！", "success");
      }
    } else {
      // 新增模式
      const bundleData = {
        bundle_id: this.generateRandomId(),
        camp_id: this.campData.camp_id,
        bundle_name: bundleName,
        bundle_price: bundlePrice,
        bundle_add_date: new Date().toISOString().split("T")[0],
      };

      this.bundleItemData.push(bundleData);
      console.log("新增加購商品：", bundleData);
      this.showMessage("加購商品新增成功！", "success");
    }

    this.hideModal("addBundleItemModal");

    // 重新載入加購商品資料
    setTimeout(() => {
      this.renderBundleItems();
    }, 500);
  }

  handleAddDiscountCode(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // 表單驗證
    const discountType = parseInt(formData.get("discount_type"));
    const discountValue = parseFloat(formData.get("discount_value"));
    const startDate = formData.get("start_date");
    const endDate = formData.get("end_date");

    // 驗證折扣值
    if (discountType === 1) {
      // 百分比折扣
      if (discountValue >= 1 || discountValue <= 0) {
        this.showMessage(
          "百分比折扣值必須是0到1之間的小數（如0.1代表10%）",
          "error"
        );
        return;
      }
    } else {
      // 固定金額折扣
      if (discountValue < 1 || !Number.isInteger(discountValue)) {
        this.showMessage("固定金額折扣值必須是大於等於1的整數", "error");
        return;
      }
    }

    // 驗證日期
    if (new Date(endDate) <= new Date(startDate)) {
      this.showMessage("結束日期必須晚於開始日期", "error");
      return;
    }

    // 生成折價券ID
    const discountCodeId =
      "S" + String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0");

    const discountData = {
      discount_code_id: discountCodeId,
      discount_code: formData.get("discount_code"),
      owner_id: this.currentOwner.owner_id,
      admin_id: null,
      discount_type: discountType,
      discount_value: discountValue,
      discount_explain: formData.get("discount_explain"),
      min_order_amount: parseInt(formData.get("min_order_amount")),
      start_date: startDate + " 00:00:00",
      end_date: endDate + " 23:59:59",
      created: new Date().toISOString().replace("T", " ").substr(0, 19),
      updated: null,
    };

    console.log("新增折價券：", discountData);
    this.showMessage("折價券新增成功！", "success");
    this.hideModal("addDiscountCodeModal");

    // 重新載入折價券資料
    setTimeout(() => {
      this.renderDiscountCodes();
    }, 1000);
  }

  // 訂單操作
  cancelOrder(orderId) {
    if (confirm("確定要取消此訂單嗎？")) {
      const order = this.orderData.find((o) => o.campsite_order_id === orderId);
      if (order && order.campsite_order_status === 1) {
        order.campsite_order_status = 4;
        console.log("取消訂單：", orderId);
        this.showMessage("訂單已取消", "success");
        this.renderOrders();
      } else {
        this.showMessage("只有待付款的訂單才能取消", "error");
      }
    }
  }

  checkInOrder(orderId) {
    if (confirm("確定客人已入住嗎？")) {
      const order = this.orderData.find((o) => o.campsite_order_id === orderId);
      if (order && order.campsite_order_status === 2) {
        console.log("入住確認：", orderId);
        this.showMessage("入住確認完成", "success");
        this.renderOrders();
      } else {
        this.showMessage("只有已付款的訂單才能確認入住", "error");
      }
    }
  }

  checkOutOrder(orderId) {
    if (confirm("確定客人已退房嗎？")) {
      const order = this.orderData.find((o) => o.campsite_order_id === orderId);
      if (order && order.campsite_order_status === 2) {
        order.campsite_order_status = 3;
        console.log("退房確認：", orderId);
        this.showMessage("退房確認完成", "success");
        this.renderOrders();
      } else {
        this.showMessage("只有已付款的訂單才能確認退房", "error");
      }
    }
  }

  // 加購商品操作
  editBundleItem(bundleId) {
    const bundleItem = this.bundleItemData.find(
      (item) => item.bundle_id == bundleId
    );
    if (!bundleItem) {
      this.showMessage("找不到該加購商品", "error");
      return;
    }

    // 設置編輯模式
    this.isEditingBundle = true;
    this.editingBundleId = bundleId;

    // 更新模態框標題和按鈕
    document.getElementById("bundleModalTitle").textContent = "編輯加購商品";
    const submitBtn = document.getElementById("submitBundleItem");
    submitBtn.innerHTML = '<i class="fas fa-save"></i> 更新商品';

    // 填入現有數據
    document.getElementById("bundle-id").value = bundleItem.bundle_id;
    document.getElementById("bundle-name").value = bundleItem.bundle_name;
    document.getElementById("bundle-price").value = bundleItem.bundle_price;

    // 使用Bootstrap方式顯示模態框
    const modal = new bootstrap.Modal(
      document.getElementById("addBundleItemModal")
    );
    modal.show();
  }

  deleteBundleItem(bundleId) {
    if (confirm("確定要刪除此加購商品嗎？")) {
      console.log("刪除加購商品：", bundleId);
      this.showMessage("加購商品已刪除", "success");
      this.renderBundleItems();
    }
  }

  // 折價券操作
  deleteDiscountCode(discountId) {
    if (confirm("確定要刪除此折價券嗎？")) {
      console.log("刪除折價券：", discountId);
      this.showMessage("折價券已刪除", "success");
      this.renderDiscountCodes();
    }
  }

  // 房型操作
  getRoomNumbers(campsiteTypeId) {
    // 根據房型ID獲取所有房間號碼
    const rooms = this.campsiteData.filter(
      (room) => room.campsite_type_id == campsiteTypeId
    );
    return rooms.map(
      (room) => room.campsite_id_name || `房間${room.campsite_id}`
    );
  }

  showRoomDetails(campsiteTypeId) {
    // 根據房型ID獲取所有房間資料
    const rooms = this.campsiteData.filter(
      (room) => room.campsite_type_id == campsiteTypeId
    );

    if (rooms.length === 0) {
      this.showMessage("此房型尚無房間資料", "info");
      return;
    }

    // 創建房間資料表格
    const roomsHtml = rooms
      .map(
        (room) => `
      <tr>
        <td>${room.campsite_id}</td>
        <td>${room.campsite_id_name}</td>
        <td>${room.camper_name || "空房"}</td>
      </tr>
    `
      )
      .join("");

    // 顯示彈窗
    const modalHtml = `
      <div class="modal fade" id="roomDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">房間詳細資料</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>營地房間編號</th>
                    <th>營地名稱</th>
                    <th>入住狀態</th>
                  </tr>
                </thead>
                <tbody>
                  ${roomsHtml}
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 移除舊的彈窗（如果存在）
    const existingModal = document.getElementById("roomDetailsModal");
    if (existingModal) {
      existingModal.remove();
    }

    // 添加新彈窗到頁面
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 顯示彈窗
    const modal = new bootstrap.Modal(
      document.getElementById("roomDetailsModal")
    );
    modal.show();

    // 彈窗關閉後移除DOM元素
    document
      .getElementById("roomDetailsModal")
      .addEventListener("hidden.bs.modal", function () {
        this.remove();
      });
  }

  editRoomType(typeId) {
    console.log("編輯房型：", typeId);
    console.log("this.campsiteTypeData:", this.campsiteTypeData);

    // 找到要編輯的房型資料
    const roomType = this.campsiteTypeData.find(
      (type) => type.campsite_type_id == typeId
    );

    console.log("roomType:", roomType);

    if (!roomType) {
      this.showMessage("找不到房型資料", "error");
      return;
    }

    // 填入表單資料
    document.getElementById("edit-campsite-type-id").value =
      roomType.campsite_type_id;
    document.getElementById("edit-campsite-name").value =
      roomType.campsite_name;
    document.getElementById("edit-campsite-people").value =
      roomType.campsite_people;
    document.getElementById("edit-campsite-num").value = roomType.campsite_num;
    document.getElementById("edit-campsite-price").value =
      roomType.campsite_price;
    document.getElementById("edit-campsite-pic1").value =
      roomType.campsite_pic1 || "";
    document.getElementById("edit-campsite-pic2").value =
      roomType.campsite_pic2 || "";
    document.getElementById("edit-campsite-pic3").value =
      roomType.campsite_pic3 || "";
    document.getElementById("edit-campsite-pic4").value =
      roomType.campsite_pic4 || "";

    // 顯示編輯模態框
    const modal = new bootstrap.Modal(
      document.getElementById("editRoomTypeModal")
    );
    modal.show();
  }

  deleteRoomType(typeId) {
    if (confirm("確定要刪除此房型嗎？")) {
      console.log("刪除房型：", typeId);
      this.showMessage("房型已刪除", "success");
      this.renderRoomTypes();
    }
  }

  // 圖片相關方法
  showImageModal(imageUrl, typeId, imageIndex) {
    const modalHtml = `
      <div class="modal fade" id="imageModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">圖片預覽 - 圖片${imageIndex}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center">
              <img src="${imageUrl}" class="img-fluid" style="max-height: 500px;" />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-camping" onclick="ownerDashboard.uploadImage('${typeId}', ${imageIndex})">
                <i class="fas fa-upload"></i> 更新圖片
              </button>
              <button type="button" class="btn btn-danger" onclick="ownerDashboard.deleteImage('${typeId}', ${imageIndex})">
                <i class="fas fa-trash"></i> 刪除圖片
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 移除舊的模態框
    const existingModal = document.getElementById("imageModal");
    if (existingModal) {
      existingModal.remove();
    }

    // 添加新模態框
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 顯示模態框
    const modal = new bootstrap.Modal(document.getElementById("imageModal"));
    modal.show();

    // 模態框關閉後移除DOM
    document
      .getElementById("imageModal")
      .addEventListener("hidden.bs.modal", function () {
        this.remove();
      });
  }

  uploadImage(typeId, imageIndex) {
    // 創建文件輸入元素
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        // 檢查文件類型
        if (!file.type.startsWith("image/")) {
          this.showMessage("請選擇圖片文件", "error");
          return;
        }

        // 檢查文件大小（限制5MB）
        if (file.size > 5 * 1024 * 1024) {
          this.showMessage("圖片大小不能超過5MB", "error");
          return;
        }

        // 使用FileReader讀取文件
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target.result;
          this.updateRoomTypeImage(typeId, imageIndex, imageUrl);
        };
        reader.readAsDataURL(file);
      }
    });

    // 觸發文件選擇
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  updateRoomTypeImage(typeId, imageIndex, imageUrl) {
    // 找到房型資料
    const roomTypeIndex = this.campsiteTypeData.findIndex(
      (type) => type.campsite_type_id == typeId
    );

    if (roomTypeIndex === -1) {
      this.showMessage("找不到房型資料", "error");
      return;
    }

    // 更新圖片URL
    const fieldName = `campsite_pic${imageIndex}`;
    this.campsiteTypeData[roomTypeIndex][fieldName] = imageUrl;

    console.log(`更新房型 ${typeId} 的圖片${imageIndex}:`, imageUrl);
    this.showMessage(`圖片${imageIndex}更新成功！`, "success");

    // 關閉圖片模態框（如果存在）
    const imageModal = bootstrap.Modal.getInstance(
      document.getElementById("imageModal")
    );
    if (imageModal) {
      imageModal.hide();
    }

    // 重新渲染房型列表
    this.renderRoomTypes();
  }

  deleteImage(typeId, imageIndex) {
    if (!confirm(`確定要刪除圖片${imageIndex}嗎？`)) {
      return;
    }

    // 找到房型資料
    const roomTypeIndex = this.campsiteTypeData.findIndex(
      (type) => type.campsite_type_id == typeId
    );

    if (roomTypeIndex === -1) {
      this.showMessage("找不到房型資料", "error");
      return;
    }

    // 刪除圖片URL
    const fieldName = `campsite_pic${imageIndex}`;
    this.campsiteTypeData[roomTypeIndex][fieldName] = null;

    console.log(`刪除房型 ${typeId} 的圖片${imageIndex}`);
    this.showMessage(`圖片${imageIndex}已刪除！`, "success");

    // 關閉圖片模態框（如果存在）
    const imageModal = bootstrap.Modal.getInstance(
      document.getElementById("imageModal")
    );
    if (imageModal) {
      imageModal.hide();
    }

    // 重新渲染房型列表
    this.renderRoomTypes();
  }

  // 營地照片相關功能
  showCampImageModal(imageUrl, imageIndex) {
    // 移除舊的模態框
    const existingModal = document.getElementById("campImageModal");
    if (existingModal) {
      existingModal.remove();
    }

    // 檢查圖片URL是否為API URL
    const isApiUrl = imageUrl.includes("/api/camps/");

    // 如果是API URL，添加錯誤處理
    const imgHtml = isApiUrl
      ? `<img src="${imageUrl}" class="img-fluid" style="max-height: 500px;" onerror="this.onerror=null; this.src='images/camp-1.jpg';" />`
      : `<img src="${imageUrl}" class="img-fluid" style="max-height: 500px;" />`;

    const modalHtml = `
      <div class="modal fade" id="campImageModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">營地圖片預覽 - 圖片${imageIndex}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center">
              ${imgHtml}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-camping" onclick="ownerDashboard.uploadCampImage(${imageIndex})">
                <i class="fas fa-upload"></i> 更新圖片
              </button>
              <button type="button" class="btn btn-danger" onclick="ownerDashboard.deleteCampImage(${imageIndex})">
                <i class="fas fa-trash"></i> 刪除圖片
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 添加新模態框
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 顯示模態框
    const modal = new bootstrap.Modal(
      document.getElementById("campImageModal")
    );
    modal.show();

    // 模態框關閉後移除DOM
    document
      .getElementById("campImageModal")
      .addEventListener("hidden.bs.modal", function () {
        this.remove();
      });
  }

  uploadCampImage(imageIndex) {
    // 創建文件輸入元素
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        // 檢查文件類型
        if (!file.type.startsWith("image/")) {
          this.showMessage("請選擇圖片文件", "error");
          return;
        }

        // 檢查文件大小（限制5MB）
        if (file.size > 2 * 1024 * 1024) {
          this.showMessage("圖片大小不能超過2MB", "error");
          return;
        }

        // 直接使用文件對象更新營地圖片
        this.updateCampImage(imageIndex, file);

        // 同時使用FileReader讀取文件以顯示預覽
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target.result;
          // 更新UI顯示
          const container = document.getElementById(
            `campImage${imageIndex}Container`
          );
          if (container) {
            container.innerHTML = `
              <div class="image-container">
                <img src="${imageUrl}" class="thumbnail" onclick="ownerDashboard.showCampImageModal('${imageUrl}', ${imageIndex})" />
                <div class="image-actions">
                  <button class="btn btn-sm btn-camping" onclick="ownerDashboard.uploadCampImage(${imageIndex})"><i class="fas fa-upload"></i></button>
                  <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteCampImage(${imageIndex})"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            `;
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // 觸發文件選擇
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  updateCampImage(imageIndex, file) {
    if (!this.campData) {
      this.showMessage("找不到營地資料", "error");
      return;
    }

    // 更新圖片文件對象
    const fieldName = `campPic${imageIndex}`;
    this.campData[fieldName] = file;

    // 同時更新圖片URL用於顯示
    // 這裡不需要額外處理，因為在uploadCampImage中已經使用FileReader更新了UI

    console.log(`更新營地圖片${imageIndex}:`, file);
    this.showMessage(`圖片${imageIndex}更新成功！`, "success");

    // 關閉圖片模態框（如果存在）
    const imageModal = bootstrap.Modal.getInstance(
      document.getElementById("campImageModal")
    );
    if (imageModal) {
      imageModal.hide();
    }

    // 不需要重新渲染營地照片，因為在uploadCampImage中已經更新了UI
    // this.renderCampImages();
  }

  deleteCampImage(imageIndex) {
    if (!confirm(`確定要刪除圖片${imageIndex}嗎？`)) {
      return;
    }

    if (!this.campData) {
      this.showMessage("找不到營地資料", "error");
      return;
    }

    // 刪除圖片URL
    const fieldName = `camp_pic${imageIndex}`;
    this.campData[fieldName] = null;

    console.log(`刪除營地圖片${imageIndex}`);
    this.showMessage(`圖片${imageIndex}已刪除！`, "success");

    // 關閉圖片模態框（如果存在）
    const imageModal = bootstrap.Modal.getInstance(
      document.getElementById("campImageModal")
    );
    if (imageModal) {
      imageModal.hide();
    }

    // 重新渲染營地照片
    this.renderCampImages();
  }

  // 工具函數
  generateRandomId() {
    return Math.random().toString(36).substr(2, 9);
  }

  showMessage(message, type = "info", autoHide = true, messageId = null) {
    // 如果提供了messageId，先嘗試移除該ID的訊息
    if (messageId) {
      const specificMessage = document.getElementById(messageId);
      if (specificMessage) {
        specificMessage.remove();
      }
    } else {
      // 否則移除所有現有訊息
      const existingMessage = document.querySelector(".dashboard-message");
      if (existingMessage) {
        existingMessage.remove();
      }
    }

    // 建立新訊息
    const messageDiv = document.createElement("div");
    messageDiv.className = `dashboard-message ${type}`;
    messageDiv.textContent = message;

    // 如果提供了messageId，設置元素ID
    if (messageId) {
      messageDiv.id = messageId;
    }

    // 設定樣式
    const colors = {
      success: "#4CAF50",
      error: "#f44336",
      info: "#2196F3",
      warning: "#ff9800",
    };

    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;

    document.body.appendChild(messageDiv);

    // 如果autoHide為true，則設定自動消失
    if (autoHide) {
      setTimeout(() => {
        messageDiv.remove();
      }, 3000);
    }

    // 返回訊息元素，以便後續操作
    return messageDiv;
  }
}

// 初始化營地主後台
let ownerDashboard;
document.addEventListener("DOMContentLoaded", function () {
  ownerDashboard = new OwnerDashboard();
});
