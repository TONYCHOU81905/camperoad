// 管理員後台 JavaScript

// 全域變數
let currentAdmin = null;
let membersData = [];
let ownersData = [];
let adminsData = [];
let ordersData = [];
let ordersDetailData = [];
let campData = [];
let campsiteTypeData = [];
let reportsData = [];
let discountCodesData = [];
let isEdit = false;
let currentEditDiscountId = null;
let campReportsData = [];
let shopOrdersData = [];
let shopOrderDetailsData = [];

// 初始化區段狀態追蹤器
let sectionInitialized = {
  productManagement: false,
};

// 頁面載入時初始化
document.addEventListener("DOMContentLoaded", function () {
  checkAdminAuth();
  loadAllData();

  // 初始化侧边栏切换功能
  initSidebarToggle();

  // 檢查 URL 參數並顯示對應區段
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get("section");
  if (section) {
    showSection(section);
  }
});

// 初始化侧边栏切换功能
function initSidebarToggle() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");

  // 隐藏切换按钮
  if (sidebarToggle) {
    sidebarToggle.style.display = "none";
  }

  // 始终应用收缩样式
  sidebar.classList.add("collapsed");
  mainContent.classList.add("expanded");

  // 将收缩状态保存到本地存储
  localStorage.setItem("sidebarCollapsed", "true");
}

// 檢查管理員身份驗證
function checkAdminAuth() {
  const adminData =
    localStorage.getItem("currentAdmin") ||
    sessionStorage.getItem("currentAdmin");

  if (!adminData) {
    alert("請先登入管理員帳號");
    window.location.href = "login.html";
    return;
  }

  currentAdmin = JSON.parse(adminData);
  document.getElementById("adminName").textContent = currentAdmin.admin_name;
}

// 載入所有資料
async function loadAllData() {
  try {
    // 載入會員資料
    const membersResponse = await fetch("data/mem.json");
    membersData = await membersResponse.json();

    // 載入營地主資料
    const ownersResponse = await fetch("data/owner.json");
    ownersData = await ownersResponse.json();

    // 載入管理員資料
    const adminsResponse = await fetch("data/administrator.json");
    adminsData = await adminsResponse.json();

    // 載入營地訂單資料
    const campOrderResponse = await fetch("data/campsite_order.json");
    ordersData = await campOrderResponse.json();

    // 載入營地訂單詳細資料
    const campOrderDetailResponse = await fetch(
      "data/campsite_order_details.json"
    );
    ordersDetailData = await campOrderDetailResponse.json();

    // 載入營地資料
    const campResponse = await fetch("data/camp.json");
    campData = await campResponse.json();

    // 載入營地類型資料
    const campsiteTypeResponse = await fetch("data/campsite_type.json");
    campsiteTypeData = await campsiteTypeResponse.json();

    // 載入商品訂單資料
    try {
      console.log("開始載入商品訂單資料...");
      // 使用 API（如果 CORS 問題解決）
      const shopOrderResponse = await fetch(
        `${window.api_prefix}/api/getAllShopOrders`
        // "data/shop_order.json"  // 備用本地檔案
      );

      if (!shopOrderResponse.ok) {
        throw new Error(`HTTP error! status: ${shopOrderResponse.status}`);
      }

      const responseData = await shopOrderResponse.json();

      // 處理資料結構差異
      if (responseData.data) {
        // API 回應格式
        shopOrdersData = responseData.data;
      } else {
        // 本地 JSON 格式，需要轉換欄位名稱
        shopOrdersData = responseData.map((order) => ({
          shopOrderId: order.shop_order_id,
          memId: order.mem_id,
          shopOrderDate: order.shop_order_date,
          shopOrderShipment: order.shop_order_shipment,
          shopOrderShipFee: order.shop_order_ship_fee,
          beforeDiscountAmount: order.before_discount_amount,
          discountCodeId: order.discount_code_id,
          discountAmount: order.discount_amount,
          afterDiscountAmount: order.after_discount_amount,
          shopOrderPayment: order.shop_order_payment,
          orderName: order.order_name,
          orderEmail: order.order_email,
          orderPhone: order.order_phone,
          orderShippingAddress: order.order_shipping_address,
          shopOrderNote: order.shop_order_note,
          shopOrderShipDate: order.shop_order_ship_date,
          shopOrderStatus: order.shop_order_status,
          shopReturnApply: order.shop_return_apply,
          // 添加狀態文字（本地 JSON 沒有這些欄位）
          shopOrderStatusStr: getShopOrderStatusInfo(order.shop_order_status)
            .text,
          shopOrderPaymentStr: getPaymentMethodText(order.shop_order_payment),
          shopOrderShipmentStr: getShipmentMethodText(
            order.shop_order_shipment
          ),
          shopReturnApplyStr: getReturnApplyText(order.shop_return_apply),
        }));
      }
    } catch (error) {
      console.log("商品訂單資料載入失敗，使用空陣列");
      console.log("錯誤詳情:", error);
      shopOrdersData = [];
    }

    // 載入商品訂單詳細資料
    try {
      const shopOrderDetailsResponse = await fetch(
        `${window.api_prefix}/api/getAllShopOrdersDetails`
      ); //data/shop_order_details.json
      shopOrderDetailsData = await shopOrderDetailsResponse.json();
      shopOrderDetailsData = shopOrderDetailsData.data;
    } catch (error) {
      console.log("商品訂單詳細資料載入失敗，使用空陣列");
      shopOrderDetailsData = [];
    }

    // 載入營地檢舉資料
    try {
      const campReportsResponse = await fetch("data/camp_report.json");
      campReportsData = await campReportsResponse.json();
    } catch (error) {
      console.log("營地檢舉資料載入失敗，使用空陣列");
      campReportsData = [];
    }

    // 初始化帳號管理頁面
    loadAccountManagement();

    // 在資料載入完成後檢查資料
    console.log("loadAllData 完成 - shopOrdersData:", shopOrdersData);
    console.log(
      "loadAllData 完成 - shopOrderDetailsData",
      shopOrderDetailsData
    );

    // 如果當前在商品訂單管理頁面，重新載入
    const currentSection = document.querySelector(".content-section.active");
    if (currentSection && currentSection.id === "order-management") {
      console.log("重新載入商品訂單管理頁面");
      loadOrderManagement();
    }
  } catch (error) {
    console.error("資料載入失敗:", error);
    alert("資料載入失敗，請重新整理頁面");
  }
}

// 顯示指定區段
function showSection(sectionId) {
  // ***如果是商品管理，則跳轉到商品管理頁面
  if (sectionId === "product-management") {
    window.location.href = "product-management.html";
    return;
  }

  // 隱藏所有區段
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  // 移除所有導航連結的 active 狀態
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });

  // 顯示指定區段
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");

    // 設定對應導航連結為 active
    const navLink = document.querySelector(
      `.nav-link[onclick*="'${sectionId}'"`
    );
    if (navLink) {
      navLink.classList.add("active");
    }

    // 更新頁面標題
    const pageTitle = navLink ? navLink.textContent.trim() : "管理員後台";
    document.title = `${pageTitle} - 露營趣管理員後台`;

    // 根據區段載入對應內容
    switch (sectionId) {
      case "account-management":
        loadAccountManagement();
        break;
      case "campsite-orders":
        loadCampsiteOrders();
        break;
      case "customer-service":
        loadCustomerService();
        break;
      case "forum-management":
        loadForumManagement();
        break;
      case "order-management":
        loadOrderManagement();
        break;
      case "discount-management":
        loadDiscountManagement();
        break;
      // case "product-management":
      //   loadProductManagement();
      //   break;
    }

    // 分發區段顯示事件，通知其他模組
    const event = new CustomEvent("sectionShown", {
      detail: { sectionId: sectionId },
    });
    document.dispatchEvent(event);
  }
}

// 帳號管理相關功能
function loadAccountManagement() {
  showAccountTab("campers");
}

function showAccountTab(tabType, event) {
  // 移除所有標籤的 active 狀態
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.querySelectorAll(".account-tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // 設定當前標籤為 active
  if (event && event.target) {
    event.target.classList.add("active");
  } else {
    // 如果沒有event，找到對應的按鈕並設為active
    const targetBtn = document.querySelector(
      `[onclick*="showAccountTab('${tabType}')"]`
    );
    if (targetBtn) {
      targetBtn.classList.add("active");
    }
  }
  document.getElementById(`${tabType}-tab`).classList.add("active");

  // 載入對應資料
  switch (tabType) {
    case "campers":
      loadCampersTable();
      break;
    case "owners":
      loadOwnersTable();
      break;
    case "admins":
      loadAdminsTable();
      break;
  }
}

// 載入露營者表格
function loadCampersTable() {
  const tbody = document.getElementById("campers-table-body");
  tbody.innerHTML = "";

  membersData.forEach((member) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${member.mem_id}</td>
            <td>${member.mem_acc}</td>
            <td>${member.mem_name}</td>
            <td>${member.mem_email}</td>
            <td>${new Date(member.mem_reg_date).toLocaleDateString()}</td>
            <td><span class="status-badge ${getStatusClass(
              member.acc_status
            )}">${getStatusText(member.acc_status)}</span></td>
            <td>
                ${
                  member.acc_status !== 1
                    ? `<button class="action-btn btn-activate" onclick="updateAccountStatus('member', ${member.mem_id}, 1)">啟用</button>`
                    : ""
                }
                ${
                  member.acc_status !== 2
                    ? `<button class="action-btn btn-suspend" onclick="updateAccountStatus('member', ${member.mem_id}, 2)">停權</button>`
                    : ""
                }
                ${
                  member.acc_status !== 0
                    ? `<button class="action-btn btn-deactivate" onclick="updateAccountStatus('member', ${member.mem_id}, 0)">停用</button>`
                    : ""
                }
            </td>
        `;
    tbody.appendChild(row);
  });
}

// 載入營地主表格
function loadOwnersTable() {
  const tbody = document.getElementById("owners-table-body");
  tbody.innerHTML = "";

  ownersData.forEach((owner) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${owner.owner_id}</td>
            <td>${owner.owner_acc}</td>
            <td>${owner.owner_name}</td>
            <td>${owner.owner_rep}</td>
            <td>${owner.owner_email}</td>
            <td>${new Date(owner.owner_reg_date).toLocaleDateString()}</td>
            <td><span class="status-badge ${getStatusClass(
              owner.acc_status
            )}">${getStatusText(owner.acc_status)}</span></td>
            <td>
                ${
                  owner.acc_status !== 1
                    ? `<button class="action-btn btn-activate" onclick="updateAccountStatus('owner', ${owner.owner_id}, 1)">啟用</button>`
                    : ""
                }
                ${
                  owner.acc_status !== 2
                    ? `<button class="action-btn btn-suspend" onclick="updateAccountStatus('owner', ${owner.owner_id}, 2)">停權</button>`
                    : ""
                }
                ${
                  owner.acc_status !== 0
                    ? `<button class="action-btn btn-deactivate" onclick="updateAccountStatus('owner', ${owner.owner_id}, 0)">停用</button>`
                    : ""
                }
            </td>
        `;
    tbody.appendChild(row);
  });
}

// 載入管理員表格
function loadAdminsTable() {
  const tbody = document.getElementById("admins-table-body");
  tbody.innerHTML = "";

  adminsData.forEach((admin) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${admin.admin_id}</td>
            <td>${admin.admin_acc}</td>
            <td>${admin.admin_name}</td>
            <td><span class="status-badge ${getStatusClass(
              admin.admin_status
            )}">${getStatusText(admin.admin_status)}</span></td>
            <td>
                ${
                  admin.admin_status !== 1
                    ? `<button class="action-btn btn-activate" onclick="updateAccountStatus('admin', ${admin.admin_id}, 1)">啟用</button>`
                    : ""
                }
                ${
                  admin.admin_status !== 2
                    ? `<button class="action-btn btn-suspend" onclick="updateAccountStatus('admin', ${admin.admin_id}, 2)">停權</button>`
                    : ""
                }
                ${
                  admin.admin_status !== 0
                    ? `<button class="action-btn btn-deactivate" onclick="updateAccountStatus('admin', ${admin.admin_id}, 0)">停用</button>`
                    : ""
                }
            </td>
        `;
    tbody.appendChild(row);
  });
}

// 取得狀態樣式類別
function getStatusClass(status) {
  switch (status) {
    case 1:
      return "status-active";
    case 2:
      return "status-suspended";
    case 0:
      return "status-inactive";
    default:
      return "status-inactive";
  }
}

// 取得狀態文字
function getStatusText(status) {
  switch (status) {
    case 1:
      return "已啟用";
    case 2:
      return "已停權";
    case 0:
      return "未啟用";
    default:
      return "未知";
  }
}

// 更新帳號狀態
function updateAccountStatus(type, id, newStatus) {
  const confirmText = `確定要將此帳號狀態更改為「${getStatusText(
    newStatus
  )}」嗎？`;

  if (!confirm(confirmText)) {
    return;
  }

  // 這裡應該發送 API 請求更新資料庫
  // 目前只更新本地資料
  switch (type) {
    case "member":
      const member = membersData.find((m) => m.mem_id === id);
      if (member) {
        member.acc_status = newStatus;
        loadCampersTable();
      }
      break;
    case "owner":
      const owner = ownersData.find((o) => o.owner_id === id);
      if (owner) {
        owner.acc_status = newStatus;
        loadOwnersTable();
      }
      break;
    case "admin":
      const admin = adminsData.find((a) => a.admin_id === id);
      if (admin) {
        admin.admin_status = newStatus;
        loadAdminsTable();
      }
      break;
  }

  alert("帳號狀態已更新");
}

// 載入營地訂單管理
function loadCampsiteOrders() {
  const content = document.getElementById("campsite-orders-content");
  content.innerHTML = `
        <div class="loading">載入營地訂單資料中...</div>
    `;

  // 載入實際訂單資料
  setTimeout(() => {
    let tableRows = "";

    if (ordersData && ordersData.length > 0) {
      tableRows = ordersData
        .map((order) => {
          const memberInfo = membersData.find(
            (member) => member.mem_id === order.mem_id
          );
          const campInfo = campData.find(
            (camp) => camp.camp_id === order.camp_id
          );

          return `
          <tr>
            <td>${order.campsite_order_id}</td>
            <td>${memberInfo ? memberInfo.mem_name : "未知會員"}</td>
            <td>${campInfo ? campInfo.camp_name : "未知營地"}</td>
            <td>${order.order_date}</td>
            <td>${order.check_in}</td>
            <td>${order.check_out}</td>
            <td>NT$ ${
              order.aft_amount ? order.aft_amount.toLocaleString() : "0"
            }</td>
            <td><span class="status-badge ${getOrderStatusClass(
              order.campsite_order_status
            )}">${getOrderStatusText(order.campsite_order_status)}</span></td>
            <td>
              <button class="btn btn-info btn-sm" onclick="viewOrderDetail('${
                order.campsite_order_id
              }')">
                <i class="fas fa-eye"></i> 查看詳情
              </button>
            </td>
          </tr>
        `;
        })
        .join("");
    } else {
      tableRows = `
        <tr>
          <td colspan="9" class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <h3>暫無訂單資料</h3>
            <p>目前沒有營地訂單需要處理</p>
          </td>
        </tr>
      `;
    }

    content.innerHTML = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>露營者</th>
              <th>營地</th>
              <th>下訂日期</th>
              <th>入住日期</th>
              <th>退房日期</th>
              <th>實付金額</th>
              <th>訂單狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }, 1000);
}

// 取得訂單狀態樣式類別
function getOrderStatusClass(status) {
  switch (status) {
    case 1:
      return "status-pending";
    case 2:
      return "status-active";
    case 3:
      return "status-processed";
    case 0:
      return "status-inactive";
    default:
      return "status-pending";
  }
}

// 取得訂單狀態文字
function getOrderStatusText(status) {
  switch (status) {
    case 1:
      return "待確認";
    case 2:
      return "已確認";
    case 3:
      return "已完成";
    case 0:
      return "已取消";
    default:
      return "未知狀態";
  }
}

// 查看訂單詳情
function viewOrderDetail(orderId) {
  const order = ordersData.find((o) => o.campsite_order_id === orderId);
  if (!order) {
    alert("找不到訂單資料");
    return;
  }

  const memberInfo = membersData.find(
    (member) => member.mem_id === order.mem_id
  );
  const campInfo = campData.find((camp) => camp.camp_id === order.camp_id);
  const orderDetails = ordersDetailData.filter(
    (detail) => detail.campsite_order_id === orderId
  );
  const discountInfo = order.discount_code_id
    ? discountCodesData.find(
        (discount) => discount.discount_code_id === order.discount_code_id
      )
    : null;

  // 建立營地類型詳細資料HTML
  const campsiteDetailsHtml = orderDetails
    .map((detail) => {
      const campsiteType = campsiteTypeData.find(
        (type) => type.campsite_type_id === detail.campsite_type_id
      );
      return `
      <div class="campsite-detail-item">
        <div class="campsite-info">
          <h6>${campsiteType ? campsiteType.campsite_name : "未知營地類型"}</h6>
          <p><strong>可容納人數:</strong> ${
            campsiteType ? campsiteType.campsite_people : "N/A"
          } 人</p>
          <p><strong>預訂數量:</strong> ${detail.campsite_num} 間</p>
          <p><strong>單價:</strong> NT$ ${
            campsiteType ? campsiteType.campsite_price.toLocaleString() : "0"
          }</p>
          <p><strong>小計金額:</strong> NT$ ${detail.campsite_amount.toLocaleString()}</p>
        </div>
      </div>
    `;
    })
    .join("");

  // 計算總數量
  const totalCampsiteNum = orderDetails.reduce(
    (sum, detail) => sum + detail.campsite_num,
    0
  );

  // 獲取訂單狀態文字和樣式
  const statusText = getOrderStatusText(order.campsite_order_status);
  const statusClass = getOrderStatusClass(order.campsite_order_status);

  // 付款方式文字
  const payMethodText =
    order.pay_method === 1
      ? "信用卡"
      : order.pay_method === 2
      ? "銀行轉帳"
      : "其他";

  const modalHtml = `
    <div class="modal-overlay" id="orderDetailsModal" onclick="closeOrderModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h5 class="modal-title">訂單詳細資料</h5>
          <button type="button" class="modal-close" onclick="closeOrderModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="order-summary">
            <div class="info-row">
              <div class="info-col">
                <h6>基本資訊</h6>
                <p><strong>訂單編號:</strong> ${order.campsite_order_id}</p>
                <p><strong>營地名稱:</strong> ${
                  campInfo ? campInfo.camp_name : "未知營地"
                }</p>
                <p><strong>客戶姓名:</strong> ${
                  memberInfo ? memberInfo.mem_name : "未知會員"
                }</p>
                <p><strong>下訂日期:</strong> ${order.order_date}</p>
                <p><strong>付款方式:</strong> ${payMethodText}</p>
              </div>
              <div class="info-col">
                <h6>住宿資訊</h6>
                <p><strong>入住日期:</strong> ${order.check_in}</p>
                <p><strong>退房日期:</strong> ${order.check_out}</p>
                <p><strong>訂單狀態:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
                ${
                  order.comment_satisfaction
                    ? `<p><strong>評價星數:</strong> ${order.comment_satisfaction} 星</p>`
                    : ""
                }
                ${
                  order.comment_content
                    ? `<p><strong>評價內容:</strong> ${order.comment_content}</p>`
                    : ""
                }
                ${
                  order.comment_date
                    ? `<p><strong>評價日期:</strong> ${order.comment_date}</p>`
                    : ""
                }
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
            <div class="amount-row">
              <div class="amount-col">
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
              <div class="amount-col">
                ${
                  order.dis_amount > 0
                    ? `
                <div class="amount-item discount">
                  <span>折扣金額:</span>
                  <span class="discount-amount">-NT$ ${order.dis_amount.toLocaleString()}</span>
                </div>
                ${
                  discountInfo
                    ? `
                <div class="discount-info">
                  <p><strong>折價券:</strong> ${discountInfo.discount_code}</p>
                 
                </div>
                `
                    : ""
                }
                `
                    : ""
                }
                <div class="amount-item total">
                  <span><strong>實付金額:</strong></span>
                  <span class="total-amount"><strong>NT$ ${order.aft_amount.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 移除現有的模態視窗
  const existingModal = document.getElementById("orderDetailsModal");
  if (existingModal) {
    existingModal.remove();
  }

  // 添加新的模態視窗到頁面
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

// 關閉訂單詳情模態視窗
function closeOrderModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const modal = document.getElementById("orderDetailsModal");
  if (modal) {
    modal.remove();
  }
}

// 載入客服管理
function loadCustomerService() {
  const content = document.getElementById("customer-service-content");
  content.innerHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>檢舉編號</th>
                        <th>訂單編號</th>
                        <th>檢舉人ID</th>
                        <th>檢舉內容</th>
                        <th>檢舉日期</th>
                        <th>處理狀態</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="camp-reports-table-body">
                    <!-- 動態載入營地檢舉資料 -->
                </tbody>
            </table>
        </div>
    `;

  loadCampReportsTable();
}

// 載入營地檢舉表格
function loadCampReportsTable() {
  const tbody = document.getElementById("camp-reports-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (campReportsData.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-headset"></i>
                    <h3>暫無檢舉資料</h3>
                    <p>目前沒有需要處理的檢舉案件</p>
                </td>
            </tr>
        `;
    return;
  }

  campReportsData.forEach((report) => {
    const member = membersData.find((m) => m.mem_id === report.mem_id);
    const memberName = member ? member.mem_name : "未知會員";

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${report.campsite_report_id}</td>
            <td>${report.campsite_order_id}</td>
            <td>${report.mem_id} (${memberName})</td>
            <td>${report.campsite_report_content}</td>
            <td>${report.campsite_report_date}</td>
            <td><span class="status-badge ${
              report.campsite_report_status === 1
                ? "status-active"
                : "status-inactive"
            }">${
      report.campsite_report_status === 1 ? "已處理" : "未處理"
    }</span></td>
            <td>
                <button class="action-btn btn-activate" onclick="openChatWindow(${
                  report.campsite_report_id
                })">查看對話</button>
                ${
                  report.campsite_report_status === 0
                    ? `<button class="action-btn btn-suspend" onclick="updateReportStatus(${report.campsite_report_id}, 1)">標記已處理</button>`
                    : ""
                }
            </td>
        `;
    tbody.appendChild(row);
  });
}

// 更新檢舉狀態
function updateReportStatus(reportId, newStatus) {
  const report = campReportsData.find((r) => r.campsite_report_id === reportId);
  if (report) {
    report.campsite_report_status = newStatus;
    loadCampReportsTable();
    alert("檢舉狀態已更新");
  }
}

// 載入論壇管理
function loadForumManagement() {
  const content = document.getElementById("forum-management-content");
  content.innerHTML = `
        <div class="loading">載入論壇管理資料中...</div>
    `;

  setTimeout(() => {
    content.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>檢舉編號</th>
                            <th>檢舉類型</th>
                            <th>檢舉內容</th>
                            <th>檢舉人</th>
                            <th>檢舉時間</th>
                            <th>處理狀態</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="7" class="empty-state">
                                <i class="fas fa-comments"></i>
                                <h3>暫無論壇檢舉</h3>
                                <p>目前沒有需要處理的論壇檢舉</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
  }, 1000);
}

// 載入商品訂單管理
function loadOrderManagement() {
  const content = document.getElementById("order-management-content");
  content.innerHTML = `
        <div class="loading">載入訂單管理資料中...</div>
    `;
  // 檢查是否有訂單數據
  if (!shopOrdersData || shopOrdersData.length === 0) {
    content.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>訂單編號</th>
                            <th style="min-width: 150px;">會員編號</th>
                            <th>訂單日期</th>
                            <th style="min-width: 150px;">訂單金額</th>
                            <th>訂單狀態</th>
                            <th>退貨申請</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="7" class="empty-state">
                                <i class="fas fa-shopping-cart"></i>
                                <h3>暫無訂單資料</h3>
                                <p>目前沒有需要處理的訂單</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    return;
  }
  // 生成訂單表格
  let tableRows = "";

  // 按訂單編號排序
  const sortedOrders = [...shopOrdersData].sort((a, b) => {
    return a.shopOrderId - b.shopOrderId;
  });

  // 分頁設置
  const itemsPerPage = 50;
  let currentPage = 1;
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  // 獲取當前頁的數據
  const currentPageData = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  currentPageData.forEach((order) => {
    // 查找會員資料
    // const member = membersData.find((m) => m.memId === order.memId) || {
    //   memName: "未知會員",
    // };

    // // 使用 DTO 的 str() 方法獲取狀態文字
    const statusText =
      order.shopOrderStatusStr ||
      getShopOrderStatusInfo(order.shopOrderStatus).text;
    const statusClass = getShopOrderStatusInfo(order.shopOrderStatus).class;

    // 使用 DTO 的 str() 方法獲取付款方式文字
    const paymentMethod =
      order.shopOrderPaymentStr || getPaymentMethodText(order.shopOrderPayment);

    // 使用 DTO 的 str() 方法獲取出貨方式文字
    const shipmentMethod =
      order.shopOrderShipmentStr ||
      getShipmentMethodText(order.shopOrderShipment);

    // 使用 DTO 的 str() 方法獲取退貨申請文字
    const returnApplyText =
      order.shopReturnApplyStr || getReturnApplyText(order.shopReturnApply);
    // 格式化日期（含時間）
    const orderDate = formatDateTime(order.shopOrderDate);
    // 只有訂單狀態為0(等待賣家確認中)才顯示編輯按鈕
    const canEdit = order.shopOrderStatus === 0;

    // 生成表格行
    tableRows += `
      <tr>
        <td>${order.shopOrderId}</td>
        <td style="min-width: 150px;">${order.memId}</td>
        <td>${orderDate}</td>
        <td style="min-width: 150px;">NT$ ${order.afterDiscountAmount}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td><span class="status-badge ${getReturnApplyClass(
          order.shopReturnApply
        )}">${returnApplyText}</span></td>
        <td>
          <button class="action-btn btn-view" onclick="viewShopOrderDetails(${
            order.shopOrderId
          })">查看詳情</button>
          <button class="action-btn btn-edit" onclick="showEditShopOrderModal(${
            order.shopOrderId
          })">編輯</button>
          ${
            order.shopOrderStatus === 3 && order.shopReturnApply === 1
              ? `<button class="action-btn btn-deactivate" onclick="showReturnProcessModal(${order.shopOrderId})">處理退貨</button>`
              : ""
          }
        </td>
      </tr>
    `;
  });

  // 更新內容
  content.innerHTML = `
    <div class="order-filter">
      <div class="filter-group">
        <label for="status-filter">訂單狀態:</label>
        <select id="status-filter" onchange="filterShopOrders()">
          <option value="all">全部</option>
          <option value="0">等待賣家確認中</option>
          <option value="1">準備出貨中</option>
          <option value="2">已出貨</option>
          <option value="3">已取貨，完成訂單</option>
          <option value="4">未取貨，退回賣家</option>
          <option value="5">已取消</option>
          <option value="6">付款失敗</option>
          <option value="7">付款成功，待賣家確認</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="return-filter">退貨申請:</label>
        <select id="return-filter" onchange="filterShopOrders()">
          <option value="all">全部</option>
          <option value="0">未申請退貨</option>
          <option value="1">申請退貨</option>
          <option value="2">退貨成功</option>
          <option value="3">退貨失敗</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="date-filter">日期範圍:</label>
        <input type="date" id="date-from" onchange="filterShopOrders()">
        <span>至</span>
        <input type="date" id="date-to" onchange="filterShopOrders()">
      </div>
      <button class="action-btn btn-reset" onclick="resetShopOrderFilters()">重置篩選</button>
    </div>
    <div class="table-container">
      <table class="data-table" id="shop-orders-table">
        <thead>
          <tr>
            <th>訂單編號</th>
            <th style="min-width: 150px;">會員編號</th>
            <th>訂單日期</th>
            <th style="min-width: 150px;">訂單金額</th>
            <th>訂單狀態</th>
            <th>退貨申請</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <button id="prev-page" class="page-btn" ${
        currentPage === 1 ? "disabled" : ""
      } onclick="changePage(${currentPage - 1})">上一頁</button>
      <span class="page-info">第 ${currentPage} 頁，共 ${totalPages} 頁</span>
      <button id="next-page" class="page-btn" ${
        currentPage === totalPages ? "disabled" : ""
      } onclick="changePage(${currentPage + 1})">下一頁</button>
    </div>
  `;

  // 將當前頁碼保存到全局變量
  window.currentOrderPage = currentPage;
}

// 獲取商品訂單狀態資訊
function getShopOrderStatusInfo(status) {
  switch (parseInt(status)) {
    case 0:
      return { text: "等待賣家確認中", class: "status-pending" };
    case 1:
      return { text: "準備出貨中", class: "status-confirmed" };
    case 2:
      return { text: "已出貨", class: "status-shipped" };
    case 3:
      return { text: "已取貨，完成訂單", class: "status-completed" };
    case 4:
      return { text: "未取貨，退回賣家", class: "status-returned" };
    case 5:
      return { text: "已取消", class: "status-canceled" };
    default:
      return { text: "等待賣家確認中", class: "status-pending" };
  }
}

// 獲取付款方式文字
function getPaymentMethodText(method) {
  switch (parseInt(method)) {
    case 1:
      return "LINEPAY";
    case 2:
      return "宅配取貨付款";
    case 3:
      return "超商取貨付款";
    default:
      return "其他";
  }
}

// 獲取配送方式文字
function getShipmentMethodText(method) {
  switch (parseInt(method)) {
    case 1:
      return "賣家宅配";
    case 2:
      return "超商取貨付款";
    default:
      return "尚未選取";
  }
}

// 獲取退貨申請文字
function getReturnApplyText(returnApply) {
  switch (parseInt(returnApply)) {
    case 0:
      return "未申請退貨";
    case 1:
      return "申請退貨";
    case 2:
      return "退貨成功";
    case 3:
      return "退貨失敗";
    default:
      return "未申請退貨";
  }
}

// 獲取退貨申請樣式類別
function getReturnApplyClass(returnApply) {
  switch (parseInt(returnApply)) {
    case 0:
      return "status-normal";
    case 1:
      return "status-pending";
    case 2:
      return "status-success";
    case 3:
      return "status-error";
    default:
      return "status-normal";
  }
}

// 篩選商品訂單
function filterShopOrders() {
  const statusFilter = document.getElementById("status-filter").value;
  const returnFilter = document.getElementById("return-filter").value;
  const dateFrom = document.getElementById("date-from").value;
  const dateTo = document.getElementById("date-to").value;

  // 篩選訂單
  let filteredOrders = [...shopOrdersData];

  // 按狀態篩選
  if (statusFilter !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) => order.shopOrderStatus.toString() === statusFilter
    );
  }

  // 按退貨申請篩選
  if (returnFilter !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) => order.shopReturnApply.toString() === returnFilter
    );
  }

  // 按日期範圍篩選
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filteredOrders = filteredOrders.filter(
      (order) => new Date(order.shopOrderDate) >= fromDate
    );
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59); // 設置為當天的最後一刻
    filteredOrders = filteredOrders.filter(
      (order) => new Date(order.shopOrderDate) <= toDate
    );
  }

  // 按訂單編號排序
  filteredOrders.sort((a, b) => a.shopOrderId - b.shopOrderId);

  // 更新表格，重置為第一頁
  updateShopOrdersTable(filteredOrders, 1);
}

// 重置商品訂單篩選
function resetShopOrderFilters() {
  document.getElementById("status-filter").value = "all";
  document.getElementById("return-filter").value = "all";
  document.getElementById("date-from").value = "";
  document.getElementById("date-to").value = "";
  filterShopOrders();
}

// 切換頁面
function changePage(pageNumber) {
  // 獲取當前篩選條件
  const statusFilter = document.getElementById("status-filter").value;
  const returnFilter = document.getElementById("return-filter").value;
  const dateFrom = document.getElementById("date-from").value;
  const dateTo = document.getElementById("date-to").value;

  // 篩選訂單
  let filteredOrders = [...shopOrdersData];

  // 按狀態篩選
  if (statusFilter !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) => order.shopOrderStatus.toString() === statusFilter
    );
  }

  // 按退貨申請篩選
  if (returnFilter !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) => order.shopReturnApply.toString() === returnFilter
    );
  }

  // 按日期範圍篩選
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filteredOrders = filteredOrders.filter(
      (order) => new Date(order.shopOrderDate) >= fromDate
    );
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59);
    filteredOrders = filteredOrders.filter(
      (order) => new Date(order.shopOrderDate) <= toDate
    );
  }

  // 更新表格，指定頁碼
  updateShopOrdersTable(filteredOrders, pageNumber);
}

// 更新商品訂單表格
function updateShopOrdersTable(orders, pageNumber = 1) {
  console.log("updateShopOrdersTable orders:", orders);
  const tbody = document.querySelector("#shop-orders-table tbody");
  const paginationDiv = document.querySelector(".pagination");

  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <i class="fas fa-shopping-cart"></i>
          <h3>無符合條件的訂單</h3>
          <p>請調整篩選條件</p>
        </td>
      </tr>
    `;
    if (paginationDiv) {
      paginationDiv.style.display = "none";
    }
    return;
  }

  // 分頁設置
  const itemsPerPage = 50;
  const currentPage = pageNumber;
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // 獲取當前頁的數據
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, orders.length);
  const currentPageData = orders.slice(startIndex, endIndex);

  let tableRows = "";
  currentPageData.forEach((order) => {
    // 查找會員資料
    const member = membersData.find((m) => m.memId === order.memId) || {
      memName: "未知會員",
    };

    // 使用 DTO 的 str() 方法獲取狀態文字
    const statusText =
      order.shopOrderStatusStr ||
      getShopOrderStatusInfo(order.shopOrderStatus).text;
    const statusClass = getShopOrderStatusInfo(order.shopOrderStatus).class;

    // 使用 DTO 的 str() 方法獲取付款方式文字
    const paymentMethod =
      order.shopOrderPaymentStr || getPaymentMethodText(order.shopOrderPayment);

    // 使用 DTO 的 str() 方法獲取出貨方式文字
    const shipmentMethod =
      order.shopOrderShipmentStr ||
      getShipmentMethodText(order.shopOrderShipment);

    // 使用 DTO 的 str() 方法獲取退貨申請文字
    const returnApplyText =
      order.shopReturnApplyStr || getReturnApplyText(order.shopReturnApply);

    // 格式化日期（含時間）
    const orderDate = formatDateTime(order.shopOrderDate);

    // 只有訂單狀態為0(等待賣家確認中)才顯示編輯按鈕
    const canEdit = order.shopOrderStatus === 0;

    // 生成表格行
    tableRows += `
      <tr>
        <td>${order.shopOrderId}</td>
        <td style="min-width: 150px;">${order.memId}</td>
        <td>${orderDate}</td>
        <td style="min-width: 150px;">NT$ ${order.afterDiscountAmount}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td><span class="status-badge ${getReturnApplyClass(
          order.shopReturnApply
        )}">${returnApplyText}</span></td>
        <td>
          <button class="action-btn btn-view" onclick="viewShopOrderDetails(${
            order.shopOrderId
          })">查看詳情</button>
          <button class="action-btn btn-edit" onclick="showEditShopOrderModal(${
            order.shopOrderId
          })">編輯</button>
          ${
            order.shopOrderStatus === 3 && order.shopReturnApply === 1
              ? `<button class="action-btn btn-deactivate" onclick="showReturnProcessModal(${order.shopOrderId})">處理退貨</button>`
              : ""
          }
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = tableRows;

  // 更新分頁控制
  if (paginationDiv) {
    paginationDiv.style.display = "flex";
    paginationDiv.innerHTML = `
      <button id="prev-page" class="page-btn" ${
        currentPage === 1 ? "disabled" : ""
      } onclick="changePage(${currentPage - 1})">上一頁</button>
      <span class="page-info">第 ${currentPage} 頁，共 ${totalPages} 頁</span>
      <button id="next-page" class="page-btn" ${
        currentPage === totalPages ? "disabled" : ""
      } onclick="changePage(${currentPage + 1})">下一頁</button>
    `;
  } else {
    // 如果分頁控制不存在，創建一個
    const content = document.getElementById("order-management-content");
    if (content) {
      const paginationElement = document.createElement("div");
      paginationElement.className = "pagination";
      paginationElement.innerHTML = `
        <button id="prev-page" class="page-btn" ${
          currentPage === 1 ? "disabled" : ""
        } onclick="changePage(${currentPage - 1})">上一頁</button>
        <span class="page-info">第 ${currentPage} 頁，共 ${totalPages} 頁</span>
        <button id="next-page" class="page-btn" ${
          currentPage === totalPages ? "disabled" : ""
        } onclick="changePage(${currentPage + 1})">下一頁</button>
      `;
      content.appendChild(paginationElement);
    }
  }

  // 保存當前頁碼到全局變量
  window.currentOrderPage = currentPage;
}

// 載入折價券資料
async function fetchDiscountList() {
  try {
    const discountResponse = await fetch(
      `${window.api_prefix}/api/discount/all`
    );
    discountCodesData = await discountResponse.json();
    console.log("折價券資料", discountCodesData);
  } catch (error) {
    console.log("折價券資料載入失敗，使用空陣列");
    discountCodesData = [];
  }

  console.log("目前折價券筆數：", discountCodesData.length);
  console.log(
    "discount-table-body 是否存在：",
    !!document.getElementById("discount-table-body")
  );

  loadDiscountTable(); // ⬅️ 抓完資料後渲染表格
}

// 載入折價券管理
function loadDiscountManagement() {
  const content = document.getElementById("discount-management-content");
  content.innerHTML = `
        <div class="section-actions" style="margin-bottom: 20px;">
            <button class="action-btn btn-activate" onclick="showCreateDiscountForm()">建立新折價券</button>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>折價券名稱</th>
                        <th>折扣說明</th>
                        <th>折扣金額/折扣百分比</th>
                        <th>最低消費金額</th>
                        <th>生效期間</th>
                        <th>狀態</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="discount-table-body">
                    <!-- 動態載入折價券資料 -->
                </tbody>
            </table>
        </div>
        
        <!-- 建立折價券表單 -->
        <div id="create-discount-form" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>建立新折價券</h3>
                <form id="discountForm">
                    <div class="form-group">
                        <label>折價券名稱:</label>
                        <input type="text" name="code" required>
                    </div>
                    <div class="form-group">
                        <label>折扣說明:</label>
                        <input type="text" name="explain" required>
                    </div>
                    <div class="form-group">
                        <label>折扣類型:</label>
                        <select name="type" required>
                            <option value="percentage">百分比折扣</option>
                            <option value="fixed">固定金額折扣</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>折扣金額/折扣百分比:</label>
                        <input type="number" name="value" required step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label>最低消費金額:</label>
                        <input type="number" name="min_amount" required>
                    </div>
                    <div class="form-group">
                        <label>生效日期:</label>
                        <input type="date" name="start_date" required>
                    </div>
                    <div class="form-group">
                        <label>失效日期:</label>
                        <input type="date" name="expiry_date" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="action-btn btn-activate">建立</button>
                        <button type="button" class="action-btn btn-deactivate" onclick="hideCreateDiscountForm()">取消</button>
                    </div>
                </form>
            </div>
        </div>
    `;

  fetchDiscountList(); // ✅ 抓資料 + 渲染畫面;
}

//折價券日期轉換
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date)) return "-";

  // YYYY-MM-DD
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

let isDiscountFormBound = false;
// 載入折價券表格
function loadDiscountTable() {
  // 失效日期由遠到近排序
  discountCodesData.sort((a, b) => {
    const dateA = new Date(a.endDate);
    const dateB = new Date(b.endDate);
    return dateB - dateA;
  });

  const tbody = document.getElementById("discount-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (discountCodesData.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-tags"></i>
                    <h3>暫無折價券</h3>
                    <p>目前沒有建立任何折價券</p>
                </td>
            </tr>
        `;
    return;
  }
  console.log("discountCodesData", discountCodesData);

  discountCodesData.forEach((discount, index) => {
    const currentDate = new Date();
    const endDate = new Date(discount.endDate);
    const isActive = endDate > currentDate;
    const isExpiredToday =
      endDate.toDateString() === currentDate.toDateString() &&
      endDate <= currentDate;
    const discountTypeText =
      discount.discount_type === 1 ? "百分比" : "固定金額";
    const discountValueText =
      discount.discountType === 1
        ? `${discount.discountValue * 100}%`
        : `${discount.discountValue}元`;

    // 格式化折價券建立日期、生效日期、失效日期、生效期間、更新日期
    const formattedStartDate = formatDate(discount.startDate);
    const formattedEndDate = formatDate(discount.endDate);
    const dateRangeText = `${formattedStartDate} ~ ${formattedEndDate}`;
    const formattedUpdateDate = formatDate(discount.updated);

    // 判斷是否顯示刪除按鈕（當日已過期則不顯示）
    const showDeleteButton = !isExpiredToday && endDate > currentDate;

    const row = document.createElement("tr");
    row.innerHTML = `
             <td>
               <button class="toggle-details-btn" id="toggle-btn-${index}" onclick="toggleDetails(${index})">▼</button>
               ${discount.discountCode}
            </td> 
            <td>${discount.discountExplain}</td>
            <td>${discountValueText}</td>  
            <td>${discount.minOrderAmount}元</td>  
            <td>${dateRangeText}</td>  
            <td>${isActive ? "有效" : "已過期"}</td> 
            <td>
            ${
              showDeleteButton
                ? `
              <button class="btn btn-edit-discount" onclick="editDiscount('${discount.discountCodeId}')">
                  <i class="fas fa-edit"></i> 編輯
              </button>
              `
                : `
              <span class="text-muted">已過期</span>
              `
            }
            </td>
        `;
    tbody.appendChild(row);

    // 折疊區塊（預設隱藏）
    const detailRow = document.createElement("tr");
    detailRow.classList.add("discount-details-row");
    detailRow.style.display = "none";
    detailRow.id = `detail-row-${index}`;

    detailRow.innerHTML = `
    <td colspan="7" class="discount-detail-cell">
      <div><strong>折價券編號：</strong>${discount.discountCodeId}</div>
      <div><strong>折扣類型：</strong>${discountTypeText}</div>
      <div><strong>建立日期：</strong>${formatDate(discount.created)}</div>
      <div><strong>更新日期：</strong>${formattedUpdateDate}</div>
    </td>
  `;

    tbody.appendChild(detailRow);
  });
}

function toggleDetails(index) {
  const detailRow = document.getElementById(`detail-row-${index}`);
  const toggleBtn = document.getElementById(`toggle-btn-${index}`);

  if (!detailRow || !toggleBtn) return;

  const isVisible = detailRow.style.display !== "none";
  detailRow.style.display = isVisible ? "none" : "table-row";

  toggleBtn.classList.toggle("expanded", !isVisible);
}

// 顯示建立折價券表單
function showCreateDiscountForm() {
  document.getElementById("create-discount-form").style.display = "block";

  const todayStr = new Date().toISOString().split("T")[0]; // 取得今天 yyyy-MM-dd 格式

  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="expiry_date"]');

  startDateInput.min = todayStr;
  startDateInput.value = todayStr;

  endDateInput.min = todayStr; // 預設先設為今天，等使用者選了生效日再變動

  // 當使用者選擇生效日期時，自動調整失效日期的 min 值
  startDateInput.addEventListener("change", function () {
    endDateInput.min = this.value;
    if (endDateInput.value < this.value) {
      endDateInput.value = this.value; // 若原本日期小於，強制調整
    }
  });

  const typeSelect = document.querySelector('select[name="type"]');
  const valueInput = document.querySelector('input[name="value"]');

  typeSelect.addEventListener("change", function () {
    if (this.value === "percentage") {
      valueInput.step = "0.1";
      valueInput.min = "0.1";
      valueInput.max = "100";
      valueInput.placeholder = "請輸入百分比（例如 12.5）";
    } else {
      valueInput.step = "1";
      valueInput.min = "1";
      valueInput.removeAttribute("max");
      valueInput.placeholder = "請輸入整數金額";
    }

    valueInput.value = "";
  });

  // ✅ 預設觸發一次以設定初始格式
  typeSelect.dispatchEvent(new Event("change"));

  // ✅ 只綁定一次 submit 事件
  if (!isDiscountFormBound) {
    document
      .getElementById("discountForm")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        createDiscount();
      });
    isDiscountFormBound = true;
  }
}

// 隱藏建立折價券表單
function hideCreateDiscountForm() {
  document.getElementById("create-discount-form").style.display = "none";
}

// 建立折價券(驗證)
function createDiscount() {
  const form = document.getElementById("discountForm");
  const formData = new FormData(form);

  const discountTypeRaw = formData.get("type"); // "percentage" 或 "fixed"
  const discountType = discountTypeRaw === "percentage" ? 1 : 0;

  let discountValue = formData.get("value");

  // ✅ 檢查金額格式
  if (discountType === 1) {
    // 百分比，允許小數但需在 0~100 範圍內
    const valueNum = parseFloat(discountValue);
    if (isNaN(valueNum) || valueNum <= 0 || valueNum > 100) {
      alert("百分比折扣請輸入 0~100 的數值");
      return;
    }
    discountValue = valueNum / 100; // 轉換成小數儲存
  } else {
    // 固定金額，只允許整數
    if (!/^\d+$/.test(discountValue)) {
      alert("固定金額折扣只能輸入整數金額");
      return;
    }
    discountValue = parseInt(discountValue);
  }

  // ✅ 日期驗證
  const startDate = formData.get("start_date") + " 00:00:00";
  const endDate = formData.get("expiry_date") + " 23:59:59";

  const today = new Date().setHours(0, 0, 0, 0);
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();

  if (startTime < today) {
    alert("生效日期不可早於今天");
    return;
  }

  if (endTime <= startTime) {
    alert("失效日期必須晚於生效日期");
    return;
  }

  // ✅ 建立折價券物件
  const newDiscount = {
    discountCode: formData.get("code"),
    discountExplain: formData.get("explain"),
    discountType: discountType,
    discountValue: discountValue,
    minOrderAmount: parseFloat(formData.get("min_amount")),
    startDate: startDate,
    endDate: endDate,
    adminId: currentAdmin.adminId,
    ownerId: null,
  };

  // 若是編輯，補上 discountCodeId
  if (isEdit) {
    newDiscount.discountCodeId = currentEditDiscountId;
  }

  const url = isEdit
    ? `${window.api_prefix}/api/discount/updateDiscount`
    : `${window.api_prefix}/api/discount/add?prefix=A`;

  const successMessage = isEdit ? "折價券更新成功！" : "折價券建立成功！";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newDiscount),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(err.message || (isEdit ? "更新失敗" : "新增失敗"));
        });
      }
      return response.json();
    })
    .then((data) => {
      alert(successMessage);
      hideCreateDiscountForm();
      form.reset();
      // 你可重新呼叫 API 載入折價券資料（如果有）
      fetchDiscountList();
      // 重置編輯狀態
      isEdit = false;
      currentEditDiscountId = null;
    })
    .catch((error) => {
      alert(error.message);
    });
}

// 編輯折價券
function editDiscount(discountCodeId) {
  isEdit = true;
  currentEditDiscountId = discountCodeId;

  const discount = discountCodesData.find(
    (d) => d.discountCodeId === discountCodeId
  );
  if (!discount) {
    alert("找不到此折價券資料");
    return;
  }

  // 顯示建立折價券表單（共用）
  showCreateDiscountForm();

  const form = document.getElementById("discountForm");

  // 修改表單標題與按鈕文字
  document.querySelector("#create-discount-form h3").textContent = "編輯折價券";
  form.querySelector('button[type="submit"]').textContent = "更新";

  // 將資料填入表單欄位
  form.elements["code"].value = discount.discountCode;
  form.elements["explain"].value = discount.discountExplain;
  form.elements["type"].value =
    discount.discountType === 1 ? "percentage" : "fixed";
  form.elements["value"].value =
    discount.discountType === 1
      ? discount.discountValue * 100
      : discount.discountValue;

  form.elements["min_amount"].value = discount.minOrderAmount;

  form.elements["start_date"].value = formatDate(discount.startDate);
  form.elements["expiry_date"].value = formatDate(discount.endDate);

  // 編輯狀態旗標 + 折價券編號記錄
  form.setAttribute("data-edit-id", discountCodeId);

  // 重新觸發折扣類型格式調整
  form.elements["type"].dispatchEvent(new Event("change"));
}

// 聊天視窗相關功能
function openChatWindow(reportId) {
  document.getElementById("chat-window").classList.remove("hidden");
  // 載入對話記錄
  loadChatMessages(reportId);
}

function closeChatWindow() {
  document.getElementById("chat-window").classList.add("hidden");
}

function loadChatMessages(reportId) {
  const messagesContainer = document.getElementById("chat-messages");
  const report = campReportsData.find((r) => r.campsite_report_id === reportId);
  console.log("report" + report);

  if (!report) {
    messagesContainer.innerHTML =
      '<div class="chat-message">找不到對話記錄</div>';
    return;
  }

  const member = membersData.find((m) => m.mem_id === report.mem_id);
  const memberName = member ? member.mem_name : "未知會員";
  console.log("campsite_report_content" + report.campsite_report_content);
  messagesContainer.innerHTML = `
        <div class="chat-message">
            <strong>${memberName} (${report.campsite_report_date}):</strong><br>
            ${report.campsite_report_content}
        </div>
        ${
          report.campsite_report_reply
            ? `
        <div class="chat-message admin">
            <strong>客服回覆:</strong><br>
            ${report.campsite_report_reply}
        </div>`
            : ""
        }
    `;

  // 設定當前處理的檢舉ID
  messagesContainer.setAttribute("data-report-id", reportId);
}

function sendMessage() {
  const input = document.getElementById("chat-input-field");
  const message = input.value.trim();
  const messagesContainer = document.getElementById("chat-messages");
  const reportId = messagesContainer.getAttribute("data-report-id");

  if (message && reportId) {
    // 更新檢舉回覆
    const report = campReportsData.find(
      (r) => r.campsite_report_id == reportId
    );
    if (report) {
      report.campsite_report_reply = message;
      report.campsite_report_status = 1; // 標記為已處理

      // 重新載入對話
      loadChatMessages(reportId);

      // 重新載入檢舉表格
      loadCampReportsTable();

      input.value = "";
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      alert("回覆已發送並標記為已處理");
    }
  }
}

// 登出功能
// function logout() {
//   if (confirm("確定要登出嗎？")) {
//     // 清除儲存的管理員資料
//     localStorage.removeItem("currentAdmin");
//     sessionStorage.removeItem("currentAdmin");

//     // 跳轉到登入頁面
//     window.location.href = "login.html";
//   }
// }

// 新增：登出 API 呼叫
async function logout() {
  if (confirm("確定要登出嗎？")) {
    try {
      const response = await fetch(`${window.api_prefix}/api/admin/logout`, {
        method: "POST",
        credentials: "include", // 包含Cookie，讓後端 session 正確失效
      });
      if (!response.ok) {
        throw new Error(`登出失敗：${response.status}`);
      }
      const result = await response.text();
      // 可根據後端回傳格式調整
      alert(result || "登出成功");
      // 清除 localStorage/sessionStorage
      localStorage.removeItem("currentAdmin");
      sessionStorage.removeItem("currentAdmin");
      localStorage.removeItem("adminRememberMe");
      sessionStorage.removeItem("adminRememberMe");
      // 跳轉到登入頁
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } catch (error) {
      alert(`登出失敗：${error.message}`);
    }
  }
}

// 查看商品訂單詳情
function viewShopOrderDetails(orderId) {
  // 查找訂單資料
  const order = shopOrdersData.find((o) => o.shopOrderId === orderId);
  if (!order) {
    alert("找不到訂單資料");
    return;
  }

  // 查找訂單詳情
  const orderDetails = shopOrderDetailsData.filter(
    (d) => d.shopOrderId === orderId
  );

  // 建立模態框
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "shop-order-detail-modal";

  // 使用 DTO 的 str() 方法獲取狀態文字
  const statusText =
    order.shopOrderStatusStr ||
    getShopOrderStatusInfo(order.shopOrderStatus).text;
  const statusClass = getShopOrderStatusInfo(order.shopOrderStatus).class;

  // 使用 DTO 的 str() 方法獲取付款方式文字
  const paymentMethod =
    order.shopOrderPaymentStr || getPaymentMethodText(order.shopOrderPayment);

  // 使用 DTO 的 str() 方法獲取出貨方式文字
  const shipmentMethod =
    order.shopOrderShipmentStr ||
    getShipmentMethodText(order.shopOrderShipment);

  // 使用 DTO 的 str() 方法獲取退貨申請文字
  const returnApplyText =
    order.shopReturnApplyStr || getReturnApplyText(order.shopReturnApply);

  // 格式化日期（含時間）
  const orderDate = formatDateTime(order.shopOrderDate);

  // 計算商品總數
  const totalItems = orderDetails.reduce(
    (sum, item) => sum + item.shopOrderQty,
    0
  );

  // 生成商品列表
  let productRows = "";
  orderDetails.forEach((detail) => {
    // 商品名稱、顏色、規格、單價、小計都從 detail 拿取
    const productName = detail.prodName || `商品 #${detail.prodId}`;
    const colorName =
      detail.prodColorName || `顏色 #${detail.prodColorId || "無"}`;
    const specName =
      detail.prodSpecName || `規格 #${detail.prodSpecId || "無"}`;
    const unitPrice = detail.prodOrderPrice != null ? detail.prodOrderPrice : 0;
    const subtotal = detail.shopOrderQty * unitPrice;

    productRows += `
      <tr>
        <td>${productName}</td>
        <td>${colorName}</td>
        <td>${specName}</td>
        <td>${detail.shopOrderQty}</td>
        <td>NT$ ${unitPrice}</td>
        <td>NT$ ${subtotal.toLocaleString()}</td>
        <td>
          ${
            detail.commentContent
              ? `<button class="action-btn btn-view" onclick="viewProductComment(${detail.prodId}, ${orderId})">查看評論</button>`
              : "尚未評論"
          }
        </td>
      </tr>
    `;
  });

  // 模態框內容
  modal.innerHTML = `
    <div class="modal-content order-detail-modal">
      <div class="modal-header">
        <h3>訂單詳情 #${order.shopOrderId}</h3>
        <button class="close-btn" onclick="closeShopOrderDetailModal()">×</button>
      </div>
      
      <div class="order-info-section">
        <h4>基本資訊</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">訂單編號:</span>
            <span class="info-value">${order.shopOrderId}</span>
          </div>
          <div class="info-item">
            <span class="info-label">會員編號:</span>
            <span class="info-value">${order.memId}</span>
          </div>
          <div class="info-item">
            <span class="info-label">訂單日期:</span>
            <span class="info-value">${orderDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">訂單狀態:</span>
            <span class="info-value status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="info-item">
            <span class="info-label">付款方式:</span>
            <span class="info-value">${paymentMethod}</span>
          </div>
          <div class="info-item">
            <span class="info-label">配送方式:</span>
            <span class="info-value">${shipmentMethod}</span>
          </div>
          <div class="info-item">
            <span class="info-label">商品總數:</span>
            <span class="info-value">${totalItems} 件</span>
          </div>
          <div class="info-item">
            <span class="info-label">退貨申請狀態:</span>
            <span class="info-value">${returnApplyText}</span>
          </div>
          <div class="info-item">
            <span class="info-label">出貨日期:</span>
            <span class="info-value">${
              order.shopOrderShipDate
                ? formatDateOnly(order.shopOrderShipDate)
                : ""
            }</span>
          </div>
        </div>
      </div>
      
      <div class="order-info-section">
        <h4>收件人資訊</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">姓名:</span>
            <span class="info-value">${order.orderName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">電話:</span>
            <span class="info-value">${order.orderPhone}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">${order.orderEmail}</span>
          </div>
          <div class="info-item">
            <span class="info-label">收件地址:</span>
            <span class="info-value">${order.orderShippingAddress}</span>
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
                <th>評論</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="order-info-section">
        <h4>金額明細</h4>
        <div class="amount-breakdown">
          <div class="amount-item">
            <span class="amount-label">商品總額:</span>
            <span class="amount-value">NT$ ${order.beforeDiscountAmount}</span>
          </div>
          <div class="amount-item">
            <span class="amount-label">運費:</span>
            <span class="amount-value">NT$ ${order.shopOrderShipFee}</span>
          </div>
          <div class="amount-item discount">
            <span class="amount-label">折扣金額:</span>
            <span class="amount-value">- NT$ ${
              order.discountAmount == null ? 0 : order.discountAmount
            }</span>
          </div>
          <div class="amount-item total">
            <span class="amount-label">訂單總額:</span>
            <span class="amount-value">NT$ ${order.afterDiscountAmount}</span>
          </div>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="action-btn btn-close" onclick="closeShopOrderDetailModal()">關閉</button>
      </div>
    </div>
  `;

  // 添加到頁面
  document.body.appendChild(modal);
}

// 關閉商品訂單詳情模態框
function closeShopOrderDetailModal() {
  const modal = document.getElementById("shop-order-detail-modal");
  if (modal) {
    modal.remove();
  }
}

// 查看商品評論
function viewProductComment(productId, orderId) {
  // 查找訂單詳情
  const orderDetail = shopOrderDetailsData.find(
    (d) => d.prodId === productId && d.shopOrderId === orderId
  );

  if (!orderDetail || !orderDetail.commentContent) {
    alert("找不到評論資料");
    return;
  }

  // 建立模態框
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "product-comment-modal";

  // 格式化日期
  const commentDate = orderDetail.commentDate
    ? new Date(orderDetail.commentDate).toLocaleDateString("zh-TW")
    : "未知日期";

  // 評分星星
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="fas fa-star ${
      i <= orderDetail.commentSatis ? "active" : ""
    }"></i>`;
  }

  // 模態框內容
  modal.innerHTML = `
    <div class="modal-content comment-modal">
      <div class="modal-header">
        <h3>商品評論</h3>
        <button class="close-btn" onclick="closeProductCommentModal()">×</button>
      </div>
      
      <div class="comment-content">
        <h4>${orderDetail.prodName}</h4>
        
        <div class="comment-info">
          <div class="rating">
            <span class="rating-label">評分:</span>
            <span class="rating-stars">${stars}</span>
            <span class="rating-value">${orderDetail.commentSatis}/5</span>
          </div>
          
          <div class="comment-date">
            <span class="date-label">評論日期:</span>
            <span class="date-value">${commentDate}</span>
          </div>
        </div>
        
        <div class="comment-text">
          <p>${orderDetail.commentContent}</p>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="action-btn btn-close" onclick="closeProductCommentModal()">關閉</button>
      </div>
    </div>
  `;

  // 添加到頁面
  document.body.appendChild(modal);
}

// 關閉商品評論模態框
function closeProductCommentModal() {
  const modal = document.getElementById("product-comment-modal");
  if (modal) {
    modal.remove();
  }
}

// 更新商品訂單狀態
function updateShopOrderStatus(orderId, newStatus) {
  // 查找訂單
  const order = shopOrdersData.find((o) => o.shopOrderId === orderId);
  if (!order) {
    alert("找不到訂單資料");
    return;
  }

  // 狀態文字對照
  const statusText = {
    0: "等待付款中",
    1: "已取消",
    2: "等待賣家確認中",
    3: "準備出貨中",
    4: "已出貨",
    5: "已取貨，完成訂單",
    6: "未取貨，退回賣家 ",
    7: "付款成功，待賣家確認 ",
  };

  // 確認更新
  if (
    confirm(
      `確定要將訂單 #${orderId} 狀態更新為「${
        statusText[newStatus] || ""
      }」嗎？`
    )
  ) {
    // 呼叫 API 更新後端狀態
    fetch(`${window.api_prefix}/api/updateShopOrder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopOrderId: orderId,
        shopOrderStatus: newStatus,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result && (result.success || result.status === "success")) {
          // 前端同步更新
          order.shopOrderStatus = newStatus;
          updateShopOrdersTable(shopOrdersData);
          if (newStatus === 3) {
            alert("訂單已確認");
          }
          alert(
            `訂單 #${orderId} 狀態已更新為「${statusText[newStatus] || ""}」`
          );
        } else {
          alert("訂單狀態更新失敗");
        }
      })
      .catch(() => {
        alert("連線失敗");
      });
  }
}

// 模態框樣式
const modalStyles = `
<style>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.modal-content {
    background: white;
    padding: 30px;
    border-radius: 10px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
}

.order-detail-modal {
    max-width: 800px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.modal-header h3 {
    margin: 0;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
}

.close-btn:hover {
    color: #333;
}

.order-info-section {
    margin-bottom: 25px;
}

.order-info-section h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #555;
    font-size: 16px;
    border-left: 3px solid #4CAF50;
    padding-left: 10px;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

.info-item {
    display: flex;
    flex-direction: column;
}

.info-label {
    font-size: 12px;
    color: #777;
    margin-bottom: 5px;
}

.info-value {
    font-size: 14px;
    color: #333;
}

.amount-breakdown {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 5px;
}

.amount-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.amount-item.total {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px dashed #ddd;
    font-weight: bold;
    font-size: 16px;
}

.amount-item.discount .amount-value {
    color: #e53935;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.comment-content {
    padding: 15px;
    background: #f9f9f9;
    border-radius: 5px;
    margin-bottom: 20px;
}

.comment-content h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
}

.comment-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
}

.rating-stars {
    color: #ccc;
    margin: 0 5px;
}

.rating-stars .fa-star.active {
    color: #FFD700;
}

.comment-text {
    background: white;
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #eee;
}

.comment-text p {
    margin: 0;
    line-height: 1.5;
}

.order-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 5px;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.filter-group label {
    font-weight: 600;
    color: #555;
}

.filter-group select,
.filter-group input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #333;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
}

.form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
}
</style>
`;

// 將樣式加入頁面
document.head.insertAdjacentHTML("beforeend", modalStyles);

// 模擬圖片上傳
async function simulateImageUpload(file) {
  // 在實際應用中，這裡應該將圖片上傳到伺服器
  // 這裡僅返回一個模擬的URL
  return new Promise((resolve) => {
    setTimeout(() => {
      // 隨機選擇一個示例圖片URL
      const randomIndex = Math.floor(Math.random() * 4) + 1;
      resolve(`images/product-${randomIndex}.jpg`);
    }, 300);
  });
}

// 顯示通知消息
function showNotification(message, type = "success") {
  // 創建通知元素
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${
      type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
    }"></i>
    <span>${message}</span>
  `;

  // 添加到頁面
  document.body.appendChild(notification);

  // 設置自動消失
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

// 初始化區段標記
if (!sectionInitialized.productManagement) {
  sectionInitialized.productManagement = false;
}

// 新增 showEditShopOrderModal 函數
function showEditShopOrderModal(orderId) {
  const order = shopOrdersData.find((o) => o.shopOrderId === orderId);
  if (!order) {
    alert("找不到訂單資料");
    return;
  }

  // 使用 DTO 的 str() 方法獲取選項文字
  const statusOptions = [
    { value: 0, text: order.shopOrderStatusStr || "等待賣家確認中" },
    { value: 1, text: "準備出貨中" },
    { value: 2, text: "已出貨" },
    { value: 3, text: "已取貨，完成訂單" },
    { value: 4, text: "未取貨，退回賣家" },
    { value: 5, text: "已取消" },
  ];

  const canEditPayment =
    (order.shopOrderPayment === 2 || order.shopOrderPayment === 3) &&
    (order.shopOrderStatus === 0 || order.shopOrderStatus === 7);

  const paymentOptions = [
    { value: 1, text: order.shopOrderPaymentStr || "LINEPAY" },
    { value: 2, text: "宅配取貨付款" },
    { value: 3, text: "超商取貨付款" },
  ];

  const shipmentOptions = [
    { value: 1, text: order.shopOrderShipmentStr || "賣家宅配" },
    { value: 2, text: "超商取貨付款" },
  ];

  const returnApplyOptions = [
    { value: 0, text: order.shopReturnApplyStr || "未申請退貨" },
    { value: 1, text: "申請退貨" },
    { value: 2, text: "退貨成功" },
    { value: 3, text: "退貨失敗" },
  ];

  // 生成選項 HTML
  const statusOptionsHtml = statusOptions
    .map(
      (option) =>
        `<option value="${option.value}" ${
          order.shopOrderStatus == option.value ? "selected" : ""
        }>${option.text}</option>`
    )
    .join("");

  const paymentOptionsHtml = paymentOptions
    .map(
      (option) =>
        `<option value="${option.value}" ${
          order.shopOrderPayment == option.value ? "selected" : ""
        }>${option.text}</option>`
    )
    .join("");

  const shipmentOptionsHtml = shipmentOptions
    .map(
      (option) =>
        `<option value="${option.value}" ${
          order.shopOrderShipment == option.value ? "selected" : ""
        }>${option.text}</option>`
    )
    .join("");

  const returnApplyOptionsHtml = returnApplyOptions
    .map(
      (option) =>
        `<option value="${option.value}" ${
          order.shopReturnApply == option.value ? "selected" : ""
        }>${option.text}</option>`
    )
    .join("");

  // 根據後端邏輯決定哪些欄位可以編輯
  const canEditBasicFields =
    order.shopOrderStatus === 0 || order.shopOrderStatus === 7; // 只有狀態0或7可以編輯基本欄位
  const canEditStatus = true; // 永遠可以修改訂單狀態
  const canEditReturnApply = order.shopOrderStatus === 3; // 只有狀態3可以編輯退貨申請
  // 根據後端邏輯：出貨日期在訂單狀態為3、4、5時才無法編輯，其他時間都可以編輯
  const canEditShipDate = ![3, 4, 5].includes(order.shopOrderStatus);

  // 建立 modal
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "edit-shop-order-modal";
  modal.innerHTML = `
    <div class="modal-content order-detail-modal">
      <div class="modal-header">
        <h3>編輯訂單</h3>
        <button class="close-btn" onclick="closeEditShopOrderModal()">×</button>
      </div>
      <form id="edit-shop-order-form">
        <div class="form-group">
          <label>訂單編號</label>
          <input type="text" value="${order.shopOrderId}" disabled />
        </div>
        <div class="form-group">
          <label>會員編號</label>
          <input type="text" value="${order.memId}" disabled />
        </div>
        <div class="form-group">
          <label>訂單狀態</label>
          <select id="edit-order-status" required>
            ${statusOptionsHtml}
          </select>
        </div>
        <div class="form-group">
          <label>付款方式</label>
          <select id="edit-order-payment" ${canEditPayment ? "" : "disabled"}>
            ${paymentOptionsHtml}
          </select>
          ${
            !canEditPayment
              ? '<small style="color: #666;">只有宅配/超商取貨付款且訂單狀態為等待賣家確認或已取消時才能修改此欄位</small>'
              : ""
          }
        </div>
        <div class="form-group">
          <label>出貨方式</label>
          <select id="edit-order-shipment" ${
            canEditBasicFields ? "" : "disabled"
          }>
            ${shipmentOptionsHtml}
          </select>
          ${
            !canEditBasicFields
              ? '<small style="color: #666;">只有等待賣家確認中的訂單才能修改此欄位</small>'
              : ""
          }
        </div>
        <div class="form-group">
          <label>運費</label>
          <input type="number" id="edit-order-shipfee" value="${
            order.shopOrderShipFee ?? ""
          }" ${canEditBasicFields ? "" : "disabled"} />
          ${
            !canEditBasicFields
              ? '<small style="color: #666;">只有等待賣家確認中的訂單才能修改此欄位</small>'
              : ""
          }
        </div>
        <div class="form-group">
          <label>收件人姓名</label>
          <input type="text" id="edit-order-name" value="${
            order.orderName ?? ""
          }" ${canEditBasicFields ? "" : "disabled"} />
          ${
            !canEditBasicFields
              ? '<small style="color: #666;">只有等待賣家確認中的訂單才能修改此欄位</small>'
              : ""
          }
        </div>
        <div class="form-group">
          <label>收件人電話</label>
          <input type="text" id="edit-order-phone" value="${
            order.orderPhone ?? ""
          }" ${canEditBasicFields ? "" : "disabled"} />
          ${
            !canEditBasicFields
              ? '<small style="color: #666;">只有等待賣家確認中的訂單才能修改此欄位</small>'
              : ""
          }
        </div>
        <div class="form-group">
          <label>收件人Email</label>
          <input type="email" id="edit-order-email" value="${
            order.orderEmail ?? ""
          }" ${canEditBasicFields ? "" : "disabled"} />
          ${
            !canEditBasicFields
              ? '<small style="color: #666;">只有等待賣家確認中的訂單才能修改此欄位</small>'
              : ""
          }
        </div>
        <div class="form-group">
          <label>收件人地址</label>
          <input type="text" id="edit-order-address" value="${
            order.orderShippingAddress ?? ""
          }" ${canEditBasicFields ? "" : "disabled"} />
          ${
            !canEditBasicFields
              ? '<small style="color: #666;">只有等待賣家確認中的訂單才能修改此欄位</small>'
              : ""
          }
        </div>
        <div class="form-group">
          <label>備註</label>
          <input type="text" id="edit-order-note" value="${
            order.shopOrderNote ?? ""
          }" ${canEditBasicFields ? "" : "disabled"} />
          ${
            !canEditBasicFields
              ? '<small style="color: #666;">只有等待賣家確認中的訂單才能修改此欄位</small>'
              : ""
          }
        </div>
        <div class="form-group">
          <label>出貨日期</label>
          <input type="date" id="edit-order-shipdate" value="${
            order.shopOrderShipDate ? order.shopOrderShipDate.split("T")[0] : ""
          }" ${canEditShipDate ? "" : "disabled"} />
          ${
            !canEditShipDate
              ? '<small style="color: #666;">訂單狀態為已取貨完成、未取貨退回或已取消時無法修改出貨日期</small>'
              : ""
          }
        </div>
        <div class="form-group">
          <label>折扣碼ID</label>
          <input type="text" id="edit-discount-code-id" value="${
            order.discountCodeId ?? ""
          }" ${canEditBasicFields ? "" : "disabled"} />
          ${
            !canEditBasicFields
              ? '<small style="color: #666;">只有等待賣家確認中的訂單才能修改此欄位</small>'
              : ""
          }
        </div>
        <div class="form-group">
          <label>退貨申請</label>
          <select id="edit-order-return-apply" ${
            canEditReturnApply ? "" : "disabled"
          }>
            ${returnApplyOptionsHtml}
          </select>
          ${
            !canEditReturnApply
              ? '<small style="color: #666;">只有已取貨完成的訂單才能修改退貨申請</small>'
              : ""
          }
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick="closeEditShopOrderModal()">取消</button>
          <button type="submit" class="btn-save">儲存</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("edit-shop-order-form").onsubmit = function (e) {
    e.preventDefault();
    submitEditShopOrder(order.shopOrderId);
  };
}

function closeEditShopOrderModal() {
  const modal = document.getElementById("edit-shop-order-modal");
  if (modal) modal.remove();
}

async function submitEditShopOrder(orderId) {
  function parseOrNull(val, type = "number") {
    if (val === undefined || val === null || val === "") return null;
    if (type === "number") return isNaN(Number(val)) ? null : Number(val);
    return val;
  }
  function parseDateTime(val) {
    if (!val) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val + "T00:00";
    if (/T/.test(val)) return val;
    return null;
  }

  // 取得原始訂單資料
  const order = shopOrdersData.find((o) => o.shopOrderId === orderId);

  // 取得表單欄位值
  const paymentVal = document.getElementById("edit-order-payment").value;
  const shipFeeVal = document.getElementById("edit-order-shipfee").value;
  const shipmentVal = document.getElementById("edit-order-shipment").value;
  const shipDateVal = document.getElementById("edit-order-shipdate").value;
  const returnApplyVal = document.getElementById(
    "edit-order-return-apply"
  ).value;

  // 只送出允許修改的欄位
  const payload = {
    shopOrderId: parseOrNull(orderId),
    shopOrderStatus: parseOrNull(
      document.getElementById("edit-order-status").value
    ),
  };

  // 狀態為0或7時，允許修改基本欄位
  if (order.shopOrderStatus === 0 || order.shopOrderStatus === 7) {
    payload.shopOrderPayment = paymentVal !== "" ? Number(paymentVal) : null;
    payload.shopOrderShipment = shipmentVal !== "" ? Number(shipmentVal) : null;
    payload.shopOrderShipFee = shipFeeVal !== "" ? Number(shipFeeVal) : null;
    payload.orderName =
      document.getElementById("edit-order-name").value || null;
    payload.orderPhone =
      document.getElementById("edit-order-phone").value || null;
    payload.orderEmail =
      document.getElementById("edit-order-email").value || null;
    payload.orderShippingAddress =
      document.getElementById("edit-order-address").value || null;
    payload.shopOrderNote =
      document.getElementById("edit-order-note").value || null;
    payload.discountCodeId =
      document.getElementById("edit-discount-code-id").value || null;
  }

  // 根據後端邏輯：出貨日期在訂單狀態為3、4、5時才無法編輯，其他時間都可以編輯
  if (![3, 4, 5].includes(order.shopOrderStatus)) {
    payload.shopOrderShipDate = parseDateTime(shipDateVal);
  }

  // 狀態為3時，允許修改退貨申請
  if (order.shopOrderStatus === 3) {
    payload.shopReturnApply =
      returnApplyVal !== "" ? Number(returnApplyVal) : null;
  }

  // 移除值為 null 或 undefined 的欄位（shopOrderId, shopOrderStatus, shopReturnApply 例外）
  Object.keys(payload).forEach((key) => {
    if (
      (payload[key] === null || payload[key] === undefined) &&
      !["shopOrderId", "shopOrderStatus", "shopReturnApply"].includes(key)
    ) {
      delete payload[key];
    }
  });

  try {
    const res = await fetch(`${window.api_prefix}/api/updateShopOrder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result && (result.success || result.status === "success")) {
      alert("訂單更新成功");
      closeEditShopOrderModal();
      await loadAllData();
      loadOrderManagement();
    } else {
      const errorMessage =
        result?.message || result?.error || result?.exception || "訂單更新失敗";
      alert(`訂單更新失敗：${errorMessage}`);
    }
  } catch (err) {
    alert("連線失敗：" + err.message);
  }
}

// 在 JS 結尾處插入樣式，統一所有 .action-btn 按鈕大小
if (!document.getElementById("order-btn-styles")) {
  const styleEl = document.createElement("style");
  styleEl.id = "order-btn-styles";
  styleEl.textContent = `
    .action-btn {
      min-width: 100px;
      padding: 8px 14px;
      box-sizing: border-box;
      display: inline-block;
      text-align: center;
      font-size: 15px;
    }
    .action-btn + .action-btn {
      margin-left: 2px;
    }
  `;
  document.head.appendChild(styleEl);
}

// 新增 showReturnProcessModal 函數
function showReturnProcessModal(orderId) {
  const order = shopOrdersData.find((o) => o.shopOrderId === orderId);
  if (!order) {
    alert("找不到訂單資料");
    return;
  }

  // 檢查訂單狀態是否為3(已取貨，完成訂單)
  if (order.shopOrderStatus !== 3) {
    alert("只有已取貨完成的訂單才能進行退貨處理");
    return;
  }

  // 檢查退貨申請狀態是否為1(申請退貨)
  if (order.shopReturnApply !== 1) {
    alert("只有申請退貨中的訂單才能進行退貨處理");
    return;
  }

  // 獲取當前退貨狀態文字
  const currentReturnStatus =
    order.shopReturnApplyStr || getReturnApplyText(order.shopReturnApply);

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "return-process-modal";
  modal.innerHTML = `
    <div class="modal-content order-detail-modal">
      <div class="modal-header">
        <h3>處理退貨</h3>
        <button class="close-btn" onclick="closeReturnProcessModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>訂單編號：</label>
          <span>${order.shopOrderId}</span>
        </div>
        <div class="form-group">
          <label>訂單狀態：</label>
          <span class="status-badge ${
            getShopOrderStatusInfo(order.shopOrderStatus).class
          }">${
    order.shopOrderStatusStr ||
    getShopOrderStatusInfo(order.shopOrderStatus).text
  }</span>
        </div>
        <div class="form-group">
          <label>當前退貨狀態：</label>
          <span class="status-badge ${getReturnApplyClass(
            order.shopReturnApply
          )}">${currentReturnStatus}</span>
        </div>
        <div class="form-group">
          <label>請選擇退貨處理結果：</label>
          <div class="button-group" style="margin-top: 10px;">
            <button class="action-btn btn-activate" onclick="processReturnApply(${orderId}, 2)">退貨成功</button>
            <button class="action-btn btn-deactivate" onclick="processReturnApply(${orderId}, 3)">退貨失敗</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeReturnProcessModal() {
  const modal = document.getElementById("return-process-modal");
  if (modal) modal.remove();
}

async function processReturnApply(orderId, returnStatus) {
  try {
    // 再次檢查訂單狀態
    const order = shopOrdersData.find((o) => o.shopOrderId === orderId);
    if (!order) {
      alert("找不到訂單資料");
      return;
    }

    if (order.shopOrderStatus !== 3) {
      alert("只有已取貨完成的訂單才能進行退貨處理");
      return;
    }

    if (order.shopReturnApply !== 1) {
      alert("只有申請退貨中的訂單才能進行退貨處理");
      return;
    }

    const payload = {
      shopOrderId: orderId,
      shopReturnApply: returnStatus,
    };

    console.log("處理退貨申請:", payload);

    const res = await fetch(`${window.api_prefix}/api/updateShopOrder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    console.log("退貨處理回應:", result);

    if (result && (result.success || result.status === "success")) {
      const statusText = returnStatus === 2 ? "退貨成功" : "退貨失敗";
      alert(`退貨狀態已更新為：${statusText}`);
      closeReturnProcessModal();
      await loadAllData();
      loadOrderManagement();
    } else {
      // 顯示後端返回的詳細錯誤訊息
      const errorMessage =
        result?.message ||
        result?.error ||
        result?.exception ||
        "退貨狀態更新失敗";
      alert(`退貨狀態更新失敗：${errorMessage}`);
    }
  } catch (err) {
    console.error("退貨處理錯誤:", err);
    alert("連線失敗：" + err.message);
  }
}

// 格式化日期（含時間）
function formatDateTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// 格式化日期（只包含日期部分）
function formatDateOnly(dateStr) {
  if (!dateStr) return "";
  const [datePart, timePart] = dateStr.split("T");
  return datePart;
}
