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
let campReportsData = [];
let shopOrdersData = [];
let shopOrderDetailsData = [];


// 初始化區段狀態追蹤器
let sectionInitialized = {
  productManagement: false
};

// 頁面載入時初始化
document.addEventListener("DOMContentLoaded", function () {
  checkAdminAuth();
  loadAllData();
  
  // 初始化侧边栏切换功能
  initSidebarToggle();
});

// 初始化侧边栏切换功能
function initSidebarToggle() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  
  // 隐藏切换按钮
  if (sidebarToggle) {
    sidebarToggle.style.display = 'none';
  }
  
  // 始终应用收缩样式
  sidebar.classList.add('collapsed');
  mainContent.classList.add('expanded');
  
  // 将收缩状态保存到本地存储
  localStorage.setItem('sidebarCollapsed', 'true');
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
      const shopOrderResponse = await fetch("http://localhost:8081/CJA101G02/api/getAllShopOrders");  //data/shop_order.json
      shopOrdersData = await shopOrderResponse.json();
      shopOrdersData = shopOrdersData.data;
      console.log(shopOrdersData); // Add this line to log the data t
    } catch (error) {
      
      console.log("商品訂單資料載入失敗，使用空陣列");
      shopOrdersData = [];
    }

    // 載入商品訂單詳細資料
    try {
      const shopOrderDetailsResponse = await fetch("http://localhost:8081/CJA101G02/api/getAllShopOrdersDetails"); //data/shop_order_details.json
      shopOrderDetailsData = await shopOrderDetailsResponse.json();
    } catch (error) {
      console.log("商品訂單詳細資料載入失敗，使用空陣列");
      shopOrderDetailsData = [];
    }

    // 載入折價券資料
    try {
      const discountResponse = await fetch("data/discount_code.json");
      discountCodesData = await discountResponse.json();
    } catch (error) {
      console.log("折價券資料載入失敗，使用空陣列");
      discountCodesData = [];
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
  } catch (error) {
    console.error("資料載入失敗:", error);
    alert("資料載入失敗，請重新整理頁面");
  }
}

// 顯示指定區段
function showSection(sectionId) {
  // 隱藏所有區段
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  // 移除所有導航連結的 active 狀態
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });

  // 顯示指定區段
  document.getElementById(sectionId).classList.add("active");

  // 設定對應導航連結為 active
  event.target.classList.add("active");

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
    case "product-management":
      loadProductManagement();
      break;
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
  switch(status) {
    case 1: return 'status-pending';
    case 2: return 'status-active';
    case 3: return 'status-processed';
    case 0: return 'status-inactive';
    default: return 'status-pending';
  }
}

// 取得訂單狀態文字
function getOrderStatusText(status) {
  switch(status) {
    case 1: return '待確認';
    case 2: return '已確認';
    case 3: return '已完成';
    case 0: return '已取消';
    default: return '未知狀態';
  }
}

// 查看訂單詳情
function viewOrderDetail(orderId) {
  const order = ordersData.find(o => o.campsite_order_id === orderId);
  if (!order) {
    alert('找不到訂單資料');
    return;
  }

  const memberInfo = membersData.find(member => member.mem_id === order.mem_id);
  const campInfo = campData.find(camp => camp.camp_id === order.camp_id);
  const orderDetails = ordersDetailData.filter(detail => detail.campsite_order_id === orderId);
  const discountInfo = order.discount_code_id ? discountCodesData.find(discount => discount.discount_code_id === order.discount_code_id) : null;

  // 建立營地類型詳細資料HTML
  const campsiteDetailsHtml = orderDetails.map(detail => {
    const campsiteType = campsiteTypeData.find(type => type.campsite_type_id === detail.campsite_type_id);
    return `
      <div class="campsite-detail-item">
        <div class="campsite-info">
          <h6>${campsiteType ? campsiteType.campsite_name : '未知營地類型'}</h6>
          <p><strong>可容納人數:</strong> ${campsiteType ? campsiteType.campsite_people : 'N/A'} 人</p>
          <p><strong>預訂數量:</strong> ${detail.campsite_num} 間</p>
          <p><strong>單價:</strong> NT$ ${campsiteType ? campsiteType.campsite_price.toLocaleString() : '0'}</p>
          <p><strong>小計金額:</strong> NT$ ${detail.campsite_amount.toLocaleString()}</p>
        </div>
      </div>
    `;
  }).join('');

  // 計算總數量
  const totalCampsiteNum = orderDetails.reduce((sum, detail) => sum + detail.campsite_num, 0);

  // 獲取訂單狀態文字和樣式
  const statusText = getOrderStatusText(order.campsite_order_status);
  const statusClass = getOrderStatusClass(order.campsite_order_status);

  // 付款方式文字
  const payMethodText = order.pay_method === 1 ? '信用卡' : order.pay_method === 2 ? '銀行轉帳' : '其他';

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
                <p><strong>營地名稱:</strong> ${campInfo ? campInfo.camp_name : '未知營地'}</p>
                <p><strong>客戶姓名:</strong> ${memberInfo ? memberInfo.mem_name : '未知會員'}</p>
                <p><strong>下訂日期:</strong> ${order.order_date}</p>
                <p><strong>付款方式:</strong> ${payMethodText}</p>
              </div>
              <div class="info-col">
                <h6>住宿資訊</h6>
                <p><strong>入住日期:</strong> ${order.check_in}</p>
                <p><strong>退房日期:</strong> ${order.check_out}</p>
                <p><strong>訂單狀態:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
                ${order.comment_satisfaction ? `<p><strong>評價星數:</strong> ${order.comment_satisfaction} 星</p>` : ''}
                ${order.comment_content ? `<p><strong>評價內容:</strong> ${order.comment_content}</p>` : ''}
                ${order.comment_date ? `<p><strong>評價日期:</strong> ${order.comment_date}</p>` : ''}
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
                ${order.bundle_amount > 0 ? `
                <div class="amount-item">
                  <span>加購項目:</span>
                  <span>NT$ ${order.bundle_amount.toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="amount-item">
                  <span>小計:</span>
                  <span>NT$ ${order.bef_amount.toLocaleString()}</span>
                </div>
              </div>
              <div class="amount-col">
                ${order.dis_amount > 0 ? `
                <div class="amount-item discount">
                  <span>折扣金額:</span>
                  <span class="discount-amount">-NT$ ${order.dis_amount.toLocaleString()}</span>
                </div>
                ${discountInfo ? `
                <div class="discount-info">
                  <p><strong>折價券:</strong> ${discountInfo.discount_code}</p>
                  <p><strong>說明:</strong> ${discountInfo.discount_explain}</p>
                </div>
                ` : ''}
                ` : ''}
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
  const existingModal = document.getElementById('orderDetailsModal');
  if (existingModal) {
    existingModal.remove();
  }

  // 添加新的模態視窗到頁面
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 關閉訂單詳情模態視窗
function closeOrderModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const modal = document.getElementById('orderDetailsModal');
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
                            <th>會員姓名</th>
                            <th>訂單日期</th>
                            <th>訂單金額</th>
                            <th>付款方式</th>
                            <th>訂單狀態</th>
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
  let tableRows = '';
  
  // 按訂單編號排序
  const sortedOrders = [...shopOrdersData].sort((a, b) => {
    return a.shopOrderId - b.shopOrderId;
  });
  
  // 分頁設置
  const itemsPerPage = 5;
  let currentPage = 1;
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  
  // 獲取當前頁的數據
  const currentPageData = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  currentPageData.forEach(order => {
    // 查找會員資料
    const member = membersData.find(m => m.memId === order.memId) || { memName: '未知會員' };
    
    // 訂單狀態文字和樣式
    const statusInfo = getShopOrderStatusInfo(order.shopOrderStatus);
    
    // 付款方式文字
    const paymentMethod = getPaymentMethodText(order.shopOrderPayment);
    
    // 格式化日期
    const orderDate = new Date(order.shopOrderDate).toLocaleDateString('zh-TW');
    
    // 生成表格行
    tableRows += `
      <tr>
        <td>${order.shopOrderId}</td>
        <td>${order.orderName}</td>
        <td>${orderDate}</td>
        <td>NT$ ${order.afterDiscountAmount}</td>
        <td>${paymentMethod}</td>
        <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
        <td>
          <button class="action-btn btn-view" onclick="viewShopOrderDetails(${order.shopOrderId})">查看詳情</button>
          ${order.shopOrderStatus === 0 ? `<button class="action-btn btn-activate" onclick="updateShopOrderStatus(${order.shopOrderId}, 1)">待確認</button>` : ''}
          ${order.shopOrderStatus === 1 ? `<button class="action-btn btn-activate" onclick="updateShopOrderStatus(${order.shopOrderId}, 2)">出貨</button>` : ''}
          ${order.shopOrderStatus === 2 ? `<button class="action-btn btn-activate" onclick="updateShopOrderStatus(${order.shopOrderId}, 3)">已送達</button>` : ''}
          ${order.shopRetyurnApply === 1 && order.shopOrderStatus !== 5 ? `<button class="action-btn btn-deactivate" onclick="updateShopOrderStatus(${order.shopOrderId}, 5)">處理退貨</button>` : ''}
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
          <option value="0">待確認</option>
          <option value="1">已取消</option>
          <option value="2">等待賣家確認中</option>
          <option value="3">準備出貨中</option>
          <option value="4">已出貨</option>
          <option value="5"> 已取貨，完成訂單</option>
          <option value="6"> 未取貨，退回賣家 </option>

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
            <th>會員姓名</th>
            <th>訂單日期</th>
            <th>訂單金額</th>
            <th>付款方式</th>
            <th>訂單狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <button id="prev-page" class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">上一頁</button>
      <span class="page-info">第 ${currentPage} 頁，共 ${totalPages} 頁</span>
      <button id="next-page" class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">下一頁</button>
    </div>
  `;
  
  // 將當前頁碼保存到全局變量
  window.currentOrderPage = currentPage;
}

// 獲取商品訂單狀態資訊
function getShopOrderStatusInfo(status) {
  switch (parseInt(status)) {
    case 0:
      return { text: '等待付款中', class: 'status-pending' };
    case 1:
      return { text: '已取消', class: 'status-canceled' };
    case 2:
      return { text: '等待賣家確認中', class: 'status-confirmed' };
    case 3:
      return { text: '準備出貨中', class: 'status-shipped' };
    case 4:
      return { text: '已出貨', class: 'status-delivered' };
    case 5:
      return { text: '已取貨，完成訂單', class: 'status-completed' };
    case 6:
      return { text: '未取貨，退回賣家 ', class: 'status-returned' };
    default:
      return { text: '未知狀態', class: 'status-unknown' };
  }
}

// 獲取付款方式文字
function getPaymentMethodText(method) {
  switch (parseInt(method)) {
    case 1:
      return '信用卡';
    case 2:
      return '銀行轉帳';
    case 3:
      return '超商付款';
    case 4:
      return '行動支付';
    default:
      return '其他';
  }
}

// 獲取配送方式文字
function getShipmentMethodText(method) {
  switch (parseInt(method)) {
    case 1:
      return '宅配';
    case 2:
      return '超商取貨';
    default:
      return '其他';
  }
}

// 篩選商品訂單
function filterShopOrders() {
  const statusFilter = document.getElementById('status-filter').value;
  const dateFrom = document.getElementById('date-from').value;
  const dateTo = document.getElementById('date-to').value;
  
  // 篩選訂單
  let filteredOrders = [...shopOrdersData];
  
  // 按狀態篩選
  if (statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.shopOrderStatus.toString() === statusFilter);
  }
  
  // 按日期範圍篩選
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filteredOrders = filteredOrders.filter(order => new Date(order.shopOrderDate) >= fromDate);
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59); // 設置為當天的最後一刻
    filteredOrders = filteredOrders.filter(order => new Date(order.shopOrderDate) <= toDate);
  }
  
  // 按訂單編號排序
  filteredOrders.sort((a, b) => a.shopOrderId - b.shopOrderId);
  
  // 更新表格，重置為第一頁
  updateShopOrdersTable(filteredOrders, 1);
}

// 重置商品訂單篩選
function resetShopOrderFilters() {
  document.getElementById('status-filter').value = 'all';
  document.getElementById('date-from').value = '';
  document.getElementById('date-to').value = '';
  
  // 重新載入所有訂單，重置為第一頁
  updateShopOrdersTable(shopOrdersData, 1);
}

// 切換頁面
function changePage(pageNumber) {
  // 獲取當前篩選條件
  const statusFilter = document.getElementById('status-filter').value;
  const dateFrom = document.getElementById('date-from').value;
  const dateTo = document.getElementById('date-to').value;
  
  // 篩選訂單
  let filteredOrders = [...shopOrdersData];
  
  // 按狀態篩選
  if (statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.shopOrderStatus.toString() === statusFilter);
  }
  
  // 按日期範圍篩選
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filteredOrders = filteredOrders.filter(order => new Date(order.shopOrderDate) >= fromDate);
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59);
    filteredOrders = filteredOrders.filter(order => new Date(order.shopOrderDate) <= toDate);
  }
  
  // 更新表格，指定頁碼
  updateShopOrdersTable(filteredOrders, pageNumber);
}

// 更新商品訂單表格
function updateShopOrdersTable(orders, pageNumber = 1) {
  const tbody = document.querySelector('#shop-orders-table tbody');
  const paginationDiv = document.querySelector('.pagination');
  
  if (!tbody) return;
  
  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <i class="fas fa-shopping-cart"></i>
          <h3>無符合條件的訂單</h3>
          <p>請調整篩選條件</p>
        </td>
      </tr>
    `;
    
    // 隱藏分頁控制
    if (paginationDiv) {
      paginationDiv.style.display = 'none';
    }
    
    return;
  }
  
  // 分頁設置
  const itemsPerPage = 5;
  const currentPage = pageNumber;
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  
  // 獲取當前頁的數據
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, orders.length);
  const currentPageData = orders.slice(startIndex, endIndex);
  
  let tableRows = '';
  
  currentPageData.forEach(order => {
    // 查找會員資料
    const member = membersData.find(m => m.memId === order.memId) || { memName: '未知會員' };
    
    // 訂單狀態文字和樣式
    const statusInfo = getShopOrderStatusInfo(order.shopOrderStatus);
    
    // 付款方式文字
    const paymentMethod = getPaymentMethodText(order.shopOrderPayment);
    
    // 格式化日期
    const orderDate = new Date(order.shopOrderDate).toLocaleDateString('zh-TW');
    
    // 生成表格行
    tableRows += `
      <tr>
        <td>${order.shopOrderId}</td>
        <td>${order.orderName}</td>
        <td>${orderDate}</td>
        <td>NT$ ${order.afterDiscountAmount}</td>
        <td>${paymentMethod}</td>
        <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
        <td>
          <button class="action-btn btn-view" onclick="viewShopOrderDetails(${order.shopOrderId})">查看詳情</button>
          ${order.shopOrderStatus === 0 ? `<button class="action-btn btn-activate" onclick="updateShopOrderStatus(${order.shopOrderId}, 1)">確認訂單</button>` : ''}
          ${order.shopOrderStatus === 1 ? `<button class="action-btn btn-activate" onclick="updateShopOrderStatus(${order.shopOrderId}, 2)">出貨</button>` : ''}
          ${order.shopOrderStatus === 2 ? `<button class="action-btn btn-activate" onclick="updateShopOrderStatus(${order.shopOrderId}, 3)">已送達</button>` : ''}
          ${order.shopReturnApply === 1 && order.shopOrderStatus !== 5 ? `<button class="action-btn btn-deactivate" onclick="updateShopOrderStatus(${order.shopOrderId}, 5)">處理退貨</button>` : ''}
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = tableRows;
  
  // 更新分頁控制
  if (paginationDiv) {
    paginationDiv.style.display = 'flex';
    paginationDiv.innerHTML = `
      <button id="prev-page" class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">上一頁</button>
      <span class="page-info">第 ${currentPage} 頁，共 ${totalPages} 頁</span>
      <button id="next-page" class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">下一頁</button>
    `;
  } else {
    // 如果分頁控制不存在，創建一個
    const content = document.getElementById("order-management-content");
    if (content) {
      const paginationElement = document.createElement('div');
      paginationElement.className = 'pagination';
      paginationElement.innerHTML = `
        <button id="prev-page" class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">上一頁</button>
        <span class="page-info">第 ${currentPage} 頁，共 ${totalPages} 頁</span>
        <button id="next-page" class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">下一頁</button>
      `;
      content.appendChild(paginationElement);
    }
  }
  
  // 保存當前頁碼到全局變量
  window.currentOrderPage = currentPage;
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
                        <th>折價券代碼</th>
                        <th>折價券名稱</th>
                        <th>折扣類型</th>
                        <th>折扣值</th>
                        <th>最低消費</th>
                        <th>建立日期</th>
                        <th>使用期限</th>
                        <th>使用次數</th>
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
                        <label>折價券代碼:</label>
                        <input type="text" name="code" required>
                    </div>
                    <div class="form-group">
                        <label>折價券名稱:</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>折扣類型:</label>
                        <select name="type" required>
                            <option value="percentage">百分比折扣</option>
                            <option value="fixed">固定金額折扣</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>折扣值:</label>
                        <input type="number" name="value" required>
                    </div>
                    <div class="form-group">
                        <label>最低消費:</label>
                        <input type="number" name="min_amount" required>
                    </div>
                    <div class="form-group">
                        <label>使用期限:</label>
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

  loadDiscountTable();
}

// 載入折價券表格
function loadDiscountTable() {
  const tbody = document.getElementById("discount-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (discountCodesData.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-tags"></i>
                    <h3>暫無折價券</h3>
                    <p>目前沒有建立任何折價券</p>
                </td>
            </tr>
        `;
    return;
  }

  discountCodesData.forEach((discount) => {
    const currentDate = new Date();
    const endDate = new Date(discount.end_date);
    const isActive = endDate > currentDate;
    const isExpiredToday = endDate.toDateString() === currentDate.toDateString() && endDate <= currentDate;
    const discountTypeText =
      discount.discount_type === 1 ? "百分比" : "固定金額";
    const discountValueText =
      discount.discount_type === 1
        ? `${discount.discount_value * 100}%`
        : `${discount.discount_value}元`;
    
    // 格式化建立日期
    const createdDate = discount.created ? discount.created.split(" ")[0] : "未知";
    
    // 判斷是否顯示刪除按鈕（當日已過期則不顯示）
    const showDeleteButton = !isExpiredToday && endDate > currentDate;

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${discount.discount_code}</td>
            <td>${discount.discount_explain}</td>
            <td>${discountTypeText}</td>
            <td>${discountValueText}</td>
            <td>${discount.min_order_amount}元</td>
            <td>${createdDate}</td>
            <td>${discount.start_date.split(" ")[0]} ~ ${
      discount.end_date.split(" ")[0]
    }</td>
            <td>-</td>
            <td><span class="status-badge ${
              isActive ? "status-active" : "status-inactive"
            }">${isActive ? "有效" : "已過期"}</span></td>
            <td>
                ${showDeleteButton ? `
                <button class="btn btn-danger" onclick="deleteDiscount('${
                  discount.discount_code_id
                }')">
                    <i class="fas fa-trash"></i> 刪除
                </button>
                ` : `
                <span class="text-muted">已過期</span>
                `}
            </td>
        `;
    tbody.appendChild(row);
  });
}

// 顯示建立折價券表單
function showCreateDiscountForm() {
  document.getElementById("create-discount-form").style.display = "block";

  // 綁定表單提交事件
  document
    .getElementById("discountForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      createDiscount();
    });
}

// 隱藏建立折價券表單
function hideCreateDiscountForm() {
  document.getElementById("create-discount-form").style.display = "none";
}

// 建立折價券
function createDiscount() {
  const form = document.getElementById("discountForm");
  const formData = new FormData(form);

  // 生成新的折價券ID
  const newId = "A" + String(discountCodesData.length + 1).padStart(5, "0");

  const discountType = formData.get("type") === "percentage" ? 1 : 0;
  let discountValue = parseFloat(formData.get("value"));

  // 如果是百分比，轉換為小數
  if (discountType === 1) {
    discountValue = discountValue / 100;
  }

  const newDiscount = {
    discount_code_id: newId,
    discount_code: formData.get("code"),
    owner_id: null,
    admin_id: currentAdmin.admin_id,
    discount_type: discountType,
    discount_value: discountValue,
    discount_explain: formData.get("name"),
    min_order_amount: parseFloat(formData.get("min_amount")),
    start_date: new Date().toISOString().replace("T", " ").split(".")[0],
    end_date: formData.get("expiry_date") + " 23:59:59",
    created: new Date().toISOString().replace("T", " ").split(".")[0],
    updated: null,
  };

  // 檢查代碼是否重複
  if (
    discountCodesData.some((d) => d.discount_code === newDiscount.discount_code)
  ) {
    alert("折價券代碼已存在，請使用其他代碼");
    return;
  }

  discountCodesData.push(newDiscount);
  loadDiscountTable();
  hideCreateDiscountForm();
  form.reset();

  alert("折價券建立成功！");
}

// 刪除折價券
function deleteDiscount(discountId) {
  if (confirm("確定要刪除這個折價券嗎？此操作無法復原。")) {
    const index = discountCodesData.findIndex(
      (d) => d.discount_code_id === discountId
    );
    if (index !== -1) {
      discountCodesData.splice(index, 1);
      loadDiscountTable();
      alert("折價券已成功刪除！");
    }
  }
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

  if (!report) {
    messagesContainer.innerHTML =
      '<div class="chat-message">找不到對話記錄</div>';
    return;
  }

  const member = membersData.find((m) => m.mem_id === report.mem_id);
  const memberName = member ? member.mem_name : "未知會員";

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
function logout() {
  if (confirm("確定要登出嗎？")) {
    // 清除儲存的管理員資料
    localStorage.removeItem("currentAdmin");
    sessionStorage.removeItem("currentAdmin");

    // 跳轉到登入頁面
    window.location.href = "login.html";
  }
}

// 查看商品訂單詳情
function viewShopOrderDetails(orderId) {
  // 查找訂單資料
  const order = shopOrdersData.find(o => o.shopOrderId === orderId);
  if (!order) {
    alert('找不到訂單資料'); 
    return;
  }

  
  // 查找訂單詳情
  const orderDetails = shopOrderDetailsData.data.filter(d => d.shopOrderId === orderId);
  
  // 建立模態框
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'shop-order-detail-modal';
  
  // 訂單狀態資訊
  const statusInfo = getShopOrderStatusInfo(order.shopOrderStatus);
  
  // 付款方式文字
  const paymentMethod = getPaymentMethodText(order.shopOrderPayment);
  
  // 配送方式文字
  const shipmentMethod = getShipmentMethodText(order.shopOrderShipment);
  
  // 格式化日期
  const orderDate = new Date(order.shopOrderDate).toLocaleDateString('zh-TW');
  
  // 計算商品總數
  const totalItems = orderDetails.reduce((sum, item) => sum + item.shopOrderQty, 0);
  
  // 生成商品列表
  let productRows = '';
  orderDetails.forEach(detail => {
    // 由於沒有商品資料，直接使用商品ID
    const productName = `商品 #${detail.prodId}`; // 從商品資料中獲取名稱
    
    // 顏色和規格ID
    const colorId = detail.prodColorId || '無'; // 從商品顏色資料表格中獲取名稱
    const specId = detail.prodSpecId || '無'; // 從商品規格資料表格中獲取名稱 
    
    // 計算小計
    const subtotal = detail.shopOrderQty * detail.prodOrderPrice;
    
    productRows += `
      <tr>
        <td>${productName}</td>
        <td>顏色 #${colorId}</td>
        <td>規格 #${specId}</td>
        <td>${detail.shopOrderQty}</td>
        <td>NT$ ${detail.prodOrderPrice}</td>
        <td>NT$ ${subtotal.toLocaleString()}</td>
        <td>
          ${detail.commentContent ? 
            `<button class="action-btn btn-view" onclick="viewProductComment(${detail.prodId}, ${orderId})">查看評論</button>` : 
            '尚未評論'}
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
            <span class="info-label">訂單日期:</span>
            <span class="info-value">${orderDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">訂單狀態:</span>
            <span class="info-value status-badge ${statusInfo.class}">${statusInfo.text}</span>
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
            <span class="amount-value">- NT$ ${(order.BeforeDiscountAmount - order.afterDiscountAmount).toLocaleString()}</span>
          </div>
          <div class="amount-item total">
            <span class="amount-label">訂單總額:</span>
            <span class="amount-value">NT$ ${order.afterDiscountAmount}</span>
          </div>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="action-btn btn-close" onclick="closeShopOrderDetailModal()">關閉</button>
        ${order.shopOrderStatus === 0 ? `<button class="action-btn btn-activate" onclick="updateShopOrderStatus(${order.shopOrderId}, 1); closeShopOrderDetailModal();">確認訂單</button>` : ''}
        ${order.shopOrderStatus === 1 ? `<button class="action-btn btn-activate" onclick="updateShopOrderStatus(${order.shopOrderId}, 2); closeShopOrderDetailModal();">出貨</button>` : ''}
        ${order.shopOrderStatus === 2 ? `<button class="action-btn btn-activate" onclick="updateShopOrderStatus(${order.shopOrderId}, 3); closeShopOrderDetailModal();">已送達</button>` : ''}
        ${order.shopReturnApply === 1 && order.shopOrderStatus !== 5 ? `<button class="action-btn btn-deactivate" onclick="updateShopOrderStatus(${order.shopOrderId}, 5); closeShopOrderDetailModal();">處理退貨</button>` : ''}
      </div>
    </div>
  `;
  
  // 添加到頁面
  document.body.appendChild(modal);
}

// 關閉商品訂單詳情模態框
function closeShopOrderDetailModal() {
  const modal = document.getElementById('shop-order-detail-modal');
  if (modal) {
    modal.remove();
  }
}

// 查看商品評論
function viewProductComment(productId, orderId) {
  // 查找訂單詳情
  const orderDetail = shopOrderDetailsData.data.find(d => d.prodId === productId && d.shopOrderId === orderId);
  
  if (!orderDetail || !orderDetail.commentContent) {
    alert('找不到評論資料');
    return;
  }
  
  // 由於沒有商品資料，直接使用商品ID
  const productName = `商品 #${productId}`;
  
  // 建立模態框
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'product-comment-modal';
  
  // 格式化日期
  const commentDate = orderDetail.commentDate ? new Date(orderDetail.commentDate).toLocaleDateString('zh-TW') : '未知日期';
  
  // 評分星星
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="fas fa-star ${i <= orderDetail.commentSatis ? 'active' : ''}"></i>`;
  }
  
  // 模態框內容
  modal.innerHTML = `
    <div class="modal-content comment-modal">
      <div class="modal-header">
        <h3>商品評論</h3>
        <button class="close-btn" onclick="closeProductCommentModal()">×</button>
      </div>
      
      <div class="comment-content">
        <h4>${productName}</h4>
        
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
  const modal = document.getElementById('product-comment-modal');
  if (modal) {
    modal.remove();
  }
}

// 更新商品訂單狀態
function updateShopOrderStatus(orderId, newStatus) {
  // 查找訂單
  const order = shopOrdersData.find(o => o.shopOrderId === orderId);
  if (!order) {
    alert('找不到訂單資料');
    return;
  }
  
  // 狀態文字對照
  const statusText = {
    0: '待確認',
    1: '已確認',
    2: '已出貨',
    3: '已送達',
    4: '已完成',
    5: '已退貨'
  };
  
  // 確認更新
  if (confirm(`確定要將訂單 #${orderId} 狀態更新為「${statusText[newStatus]}」嗎？`)) {
    // 更新狀態
    order.shopOrderStatus = newStatus;
    
    // 如果是標記為已完成，同時更新相關欄位
    if (newStatus === 5) {
      // 可以在這裡添加其他需要更新的欄位
    }
    
    // 如果是標記為已取消，重置退貨申請狀態
    if (newStatus === 1) {
     
    }
    
    // 重新載入訂單表格
    updateShopOrdersTable(shopOrdersData);
    
    alert(`訂單 #${orderId} 狀態已更新為「${statusText[newStatus]}」`);
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

// ... existing code ...

// 商品管理相關變量
let productsData = [];
let productTypesData = [];
let currentPage = 1;
let itemsPerPage = 10;
let filteredProducts = [];

// 載入商品管理功能
function loadProductManagement() {
  if (sectionInitialized.productManagement) return;
  
  // 載入商品數據
  loadProductsData();
  
  // 標記為已初始化
  sectionInitialized.productManagement = true;
}

// 載入商品數據
async function loadProductsData() {
  try {
    // 顯示載入中提示
    const content = document.getElementById("product-management-content");
    content.innerHTML = `<div class="loading">載入商品數據中...</div>`;
    
    // 模擬從API獲取數據
    // 實際項目中應該使用 fetch 從後端 API 獲取數據
    setTimeout(() => {
      // 生成模擬數據
      productsData = generateMockProducts(30);
      productTypesData = [
        { id: 1, name: "帳篷" },
        { id: 2, name: "睡袋" },
        { id: 3, name: "炊具" },
        { id: 4, name: "燈具" },
        { id: 5, name: "戶外家具" }
      ];
      
      // 初始化篩選後的商品為所有商品
      filteredProducts = [...productsData];
      
      // 顯示商品數據
      displayProducts();
      
      // 初始化商品類型篩選器
      initProductTypeFilter();
    }, 500);
  } catch (error) {
    console.error("載入商品數據失敗:", error);
    document.getElementById("product-management-content").innerHTML = 
      `<div class="error-message">載入商品數據失敗，請稍後再試</div>`;
  }
}

// 生成模擬商品數據
function generateMockProducts(count) {
  const products = [];
  const statuses = ["上架中", "已下架"];
  
  for (let i = 1; i <= count; i++) {
    const typeId = Math.floor(Math.random() * 5) + 1;
    const price = Math.floor(Math.random() * 10000) + 500;
    const stock = Math.floor(Math.random() * 100);
    
    products.push({
      id: i,
      name: `露營商品 ${i}`,
      typeId: typeId,
      price: price,
      stock: stock,
      imageUrl: `images/product-${(i % 4) + 1}.jpg`,
      description: `這是商品 ${i} 的詳細描述，包含了商品的特點和使用方法。`,
      status: statuses[Math.floor(Math.random() * 2)],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
    });
  }
  
  return products;
}

// 顯示商品數據
function displayProducts() {
  const content = document.getElementById("product-management-content");
  
  // 計算分頁
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);
  
  // 如果沒有商品數據
  if (currentProducts.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <h3>沒有商品數據</h3>
        <p>目前沒有符合條件的商品，請嘗試調整篩選條件或添加新商品</p>
      </div>
    `;
    return;
  }
  
  // 生成商品表格
  let html = `
    <div class="filter-section">
      <select id="product-type-filter" class="filter-select">
        <option value="all">所有類型</option>
        <!-- 動態添加商品類型選項 -->
      </select>
      <select id="product-status-filter" class="filter-select">
        <option value="all">所有狀態</option>
        <option value="上架中">上架中</option>
        <option value="已下架">已下架</option>
      </select>
    </div>
    
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>商品ID</th>
            <th>商品圖片</th>
            <th>商品名稱</th>
            <th>類型</th>
            <th>價格</th>
            <th>庫存</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // 添加商品行
  currentProducts.forEach(product => {
    html += `
      <tr>
        <td>${product.id}</td>
        <td><img src="${product.imageUrl}" alt="${product.name}" class="product-thumbnail" /></td>
        <td>${product.name}</td>
        <td>${getProductTypeName(product.typeId)}</td>
        <td>NT$ ${product.price.toLocaleString()}</td>
        <td>${product.stock}</td>
        <td>
          <span class="status-badge ${product.status === '上架中' ? 'active' : 'inactive'}">
            ${product.status}
          </span>
        </td>
        <td>
          <button class="action-btn btn-view" onclick="viewProductDetail(${product.id})">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn btn-edit" onclick="showEditProductModal(${product.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn ${product.status === '上架中' ? 'btn-deactivate' : 'btn-activate'}" 
                  onclick="toggleProductStatus(${product.id})">
            <i class="fas ${product.status === '上架中' ? 'fa-toggle-off' : 'fa-toggle-on'}"></i>
          </button>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  // 添加分頁控件
  if (totalPages > 1) {
    html += `
      <div class="pagination">
        <button class="page-btn" onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
          <i class="fas fa-angle-left"></i>
        </button>
        <span class="page-info">第 ${currentPage} 頁，共 ${totalPages} 頁</span>
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
          <i class="fas fa-angle-right"></i>
        </button>
        <button class="page-btn" onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>
    `;
  }
  
  content.innerHTML = html;
  
  // 初始化篩選器事件
  document.getElementById("product-status-filter").addEventListener("change", filterProducts);
  document.getElementById("product-type-filter").addEventListener("change", filterProducts);
}

// 初始化商品類型篩選器
function initProductTypeFilter() {
  const typeFilter = document.getElementById("product-type-filter");
  if (!typeFilter) return;
  
  // 清空現有選項（保留「所有類型」選項）
  while (typeFilter.options.length > 1) {
    typeFilter.remove(1);
  }
  
  // 添加商品類型選項
  productTypesData.forEach(type => {
    const option = document.createElement("option");
    option.value = type.id;
    option.textContent = type.name;
    typeFilter.appendChild(option);
  });
}

// 獲取商品類型名稱
function getProductTypeName(typeId) {
  const type = productTypesData.find(t => t.id === typeId);
  return type ? type.name : "未知類型";
}

// 篩選商品
function filterProducts() {
  const typeFilter = document.getElementById("product-type-filter").value;
  const statusFilter = document.getElementById("product-status-filter").value;
  
  // 重置為第一頁
  currentPage = 1;
  
  // 篩選商品
  filteredProducts = productsData.filter(product => {
    // 類型篩選
    if (typeFilter !== "all" && product.typeId !== parseInt(typeFilter)) {
      return false;
    }
    
    // 狀態篩選
    if (statusFilter !== "all" && product.status !== statusFilter) {
      return false;
    }
    
    return true;
  });
  
  // 重新顯示商品
  displayProducts();
}

// 搜索商品
function searchProducts() {
  const searchInput = document.getElementById("product-search").value.toLowerCase();
  
  // 如果搜索框為空，顯示所有商品
  if (!searchInput.trim()) {
    filteredProducts = [...productsData];
    currentPage = 1;
    displayProducts();
    return;
  }
  
  // 篩選符合搜索條件的商品
  filteredProducts = productsData.filter(product => {
    return (
      product.name.toLowerCase().includes(searchInput) ||
      product.id.toString().includes(searchInput) ||
      getProductTypeName(product.typeId).toLowerCase().includes(searchInput)
    );
  });
  
  // 重置為第一頁並顯示結果
  currentPage = 1;
  displayProducts();
}

// 切換頁面
function changePage(page) {
  currentPage = page;
  displayProducts();
}

// 查看商品詳情
function viewProductDetail(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) {
    alert("找不到商品資料");
    return;
  }
  
  // 創建模態框
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content product-detail-modal">
      <div class="modal-header">
        <h3>商品詳情</h3>
        <button class="close-btn" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="product-detail-container">
          <div class="product-detail-image">
            <img src="${product.imageUrl}" alt="${product.name}" />
          </div>
          <div class="product-detail-info">
            <h4>${product.name}</h4>
            <p><strong>商品ID:</strong> ${product.id}</p>
            <p><strong>類型:</strong> ${getProductTypeName(product.typeId)}</p>
            <p><strong>價格:</strong> NT$ ${product.price.toLocaleString()}</p>
            <p><strong>庫存:</strong> ${product.stock}</p>
            <p><strong>狀態:</strong> ${product.status}</p>
            <p><strong>建立日期:</strong> ${product.createdAt.toLocaleDateString()}</p>
          </div>
        </div>
        <div class="product-description">
          <h5>商品描述</h5>
          <p>${product.description}</p>
        </div>
      </div>
    </div>
  `;
  
  // 添加到頁面
  document.body.appendChild(modal);
}

// 顯示編輯商品模態框
function showEditProductModal(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) {
    alert("找不到商品資料");
    return;
  }
  
  // 創建模態框
  const modal = document.createElement("div");
  modal.className = "modal";
  
  // 生成商品類型選項
  let typeOptions = '';
  productTypesData.forEach(type => {
    typeOptions += `<option value="${type.id}" ${product.typeId === type.id ? 'selected' : ''}>${type.name}</option>`;
  });
  
  modal.innerHTML = `
    <div class="modal-content product-form-modal">
      <div class="modal-header">
        <h3>編輯商品</h3>
        <button class="close-btn" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <form id="edit-product-form">
          <input type="hidden" id="product-id" value="${product.id}">
          
          <div class="form-group">
            <label for="product-name">商品名稱</label>
            <input type="text" id="product-name" value="${product.name}" required>
          </div>
          
          <div class="form-group">
            <label for="product-type">商品類型</label>
            <select id="product-type" required>
              ${typeOptions}
            </select>
          </div>
          
          <div class="form-group">
            <label for="product-price">價格 (NT$)</label>
            <input type="number" id="product-price" value="${product.price}" min="0" required>
          </div>
          
          <div class="form-group">
            <label for="product-stock">庫存</label>
            <input type="number" id="product-stock" value="${product.stock}" min="0" required>
          </div>
          
          <div class="form-group">
            <label for="product-image">商品圖片URL</label>
            <input type="text" id="product-image" value="${product.imageUrl}">
          </div>
          
          <div class="form-group">
            <label for="product-description">商品描述</label>
            <textarea id="product-description" rows="4">${product.description}</textarea>
          </div>
          
          <div class="form-group">
            <label for="product-status">商品狀態</label>
            <select id="product-status" required>
              <option value="上架中" ${product.status === '上架中' ? 'selected' : ''}>上架中</option>
              <option value="已下架" ${product.status === '已下架' ? 'selected' : ''}>已下架</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
            <button type="submit" class="btn-save">保存更改</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // 添加到頁面
  document.body.appendChild(modal);
  
  // 綁定表單提交事件
  document.getElementById("edit-product-form").addEventListener("submit", function(e) {
    e.preventDefault();
    saveProductChanges();
  });
}

// 保存商品更改
async function saveProductChanges() {
  const productId = parseInt(document.getElementById("product-id").value);
  const productName = document.getElementById("product-name").value;
  const productType = parseInt(document.getElementById("product-type").value);
  const productPrice = parseInt(document.getElementById("product-price").value);
  const productStock = parseInt(document.getElementById("product-stock").value);
  const productImage = document.getElementById("product-image").value;
  const productDescription = document.getElementById("product-description").value;
  const productStatus = document.getElementById("product-status").value;
  
  // 表單驗證
  if (!productName || isNaN(productType) || isNaN(productPrice) || isNaN(productStock)) {
    alert("請填寫所有必填欄位");
    return;
  }
  
  try {
    // 在實際應用中，這裡應該發送 PUT 請求到 API
    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 更新本地數據
    const productIndex = productsData.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      productsData[productIndex] = {
        ...productsData[productIndex],
        name: productName,
        typeId: productType,
        price: productPrice,
        stock: productStock,
        imageUrl: productImage,
        description: productDescription,
        status: productStatus
      };
      
      // 更新篩選後的商品
      const filteredIndex = filteredProducts.findIndex(p => p.id === productId);
      if (filteredIndex !== -1) {
        filteredProducts[filteredIndex] = productsData[productIndex];
      }
      
      // 關閉模態框
      closeModal();
      
      // 重新顯示商品
      displayProducts();
      
      // 顯示成功消息
      showNotification("商品更新成功", "success");
    }
  } catch (error) {
    console.error("更新商品失敗:", error);
    showNotification("更新商品失敗，請稍後再試", "error");
  }
}

// 切換商品狀態
async function toggleProductStatus(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) {
    alert("找不到商品資料");
    return;
  }
  
  const newStatus = product.status === "上架中" ? "已下架" : "上架中";
  const confirmMessage = `確定要將商品「${product.name}」${newStatus === "上架中" ? "上架" : "下架"}嗎？`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    // 在實際應用中，這裡應該發送 PATCH 請求到 API
    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 更新本地數據
    product.status = newStatus;
    
    // 重新顯示商品
    displayProducts();
    
    // 顯示成功消息
    showNotification(`商品已${newStatus === "上架中" ? "上架" : "下架"}`, "success");
  } catch (error) {
    console.error("更新商品狀態失敗:", error);
    showNotification("更新商品狀態失敗，請稍後再試", "error");
  }
}

// 顯示添加商品模態框
function showAddProductModal() {
  // 創建模態框
  const modal = document.createElement("div");
  modal.className = "modal";
  
  // 生成商品類型選項
  let typeOptions = '';
  productTypesData.forEach(type => {
    typeOptions += `<option value="${type.id}">${type.name}</option>`;
  });
  
  modal.innerHTML = `
    <div class="modal-content product-form-modal">
      <div class="modal-header">
        <h3>添加新商品</h3>
        <button class="close-btn" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <form id="add-product-form">
          <div class="form-group">
            <label for="product-name">商品名稱</label>
            <input type="text" id="product-name" required>
          </div>
          
          <div class="form-group">
            <label for="product-type">商品類型</label>
            <select id="product-type" required>
              ${typeOptions}
            </select>
          </div>
          
          <div class="form-group">
            <label for="product-price">價格 (NT$)</label>
            <input type="number" id="product-price" min="0" required>
          </div>
          
          <div class="form-group">
            <label for="product-stock">庫存</label>
            <input type="number" id="product-stock" min="0" required>
          </div>
          
          <div class="form-group">
            <label for="product-image">商品圖片URL</label>
            <input type="text" id="product-image" value="images/product-1.jpg">
          </div>
          
          <div class="form-group">
            <label for="product-description">商品描述</label>
            <textarea id="product-description" rows="4"></textarea>
          </div>
          
          <div class="form-group">
            <label for="product-status">商品狀態</label>
            <select id="product-status" required>
              <option value="上架中">上架中</option>
              <option value="已下架">已下架</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
            <button type="submit" class="btn-save">添加商品</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // 添加到頁面
  document.body.appendChild(modal);
  
  // 綁定表單提交事件
  document.getElementById("add-product-form").addEventListener("submit", function(e) {
    e.preventDefault();
    addNewProduct();
  });
}

// 添加新商品
async function addNewProduct() {
  const productName = document.getElementById("product-name").value;
  const productType = parseInt(document.getElementById("product-type").value);
  const productPrice = parseInt(document.getElementById("product-price").value);
  const productStock = parseInt(document.getElementById("product-stock").value);
  const productImage = document.getElementById("product-image").value;
  const productDescription = document.getElementById("product-description").value;
  const productStatus = document.getElementById("product-status").value;
  
  // 表單驗證
  if (!productName || isNaN(productType) || isNaN(productPrice) || isNaN(productStock)) {
    alert("請填寫所有必填欄位");
    return;
  }
  
  try {
    // 在實際應用中，這裡應該發送 POST 請求到 API
    // 模擬 API 請求
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 生成新商品ID
    const newId = productsData.length > 0 ? Math.max(...productsData.map(p => p.id)) + 1 : 1;
    
    // 創建新商品對象
    const newProduct = {
      id: newId,
      name: productName,
      typeId: productType,
      price: productPrice,
      stock: productStock,
      imageUrl: productImage || "images/product-1.jpg",
      description: productDescription,
      status: productStatus,
      createdAt: new Date()
    };
    
    // 添加到本地數據
    productsData.push(newProduct);
    
    // 更新篩選後的商品
    if (shouldIncludeInFiltered(newProduct)) {
      filteredProducts.push(newProduct);
    }
    
    // 關閉模態框
    closeModal();
    
    // 重新顯示商品
    displayProducts();
    
    // 顯示成功消息
    showNotification("商品添加成功", "success");
  } catch (error) {
    console.error("添加商品失敗:", error);
    showNotification("添加商品失敗，請稍後再試", "error");
  }
}

// 檢查商品是否應該包含在篩選結果中
function shouldIncludeInFiltered(product) {
  const typeFilter = document.getElementById("product-type-filter").value;
  const statusFilter = document.getElementById("product-status-filter").value;
  
  // 類型篩選
  if (typeFilter !== "all" && product.typeId !== parseInt(typeFilter)) {
    return false;
  }
  
  // 狀態篩選
  if (statusFilter !== "all" && product.status !== statusFilter) {
    return false;
  }
  
  return true;
}

// 關閉模態框
function closeModal() {
  const modal = document.querySelector(".modal");
  if (modal) {
    modal.remove();
  }
}

// 顯示通知消息
function showNotification(message, type = "success") {
  // 創建通知元素
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i>
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