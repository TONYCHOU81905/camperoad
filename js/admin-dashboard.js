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

// 頁面載入時初始化
document.addEventListener("DOMContentLoaded", function () {
  checkAdminAuth();
  loadAllData();
});

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

// 載入訂單管理
function loadOrderManagement() {
  const content = document.getElementById("order-management-content");
  content.innerHTML = `
        <div class="loading">載入訂單管理資料中...</div>
    `;

  setTimeout(() => {
    content.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>訂單編號</th>
                            <th>會員</th>
                            <th>營地</th>
                            <th>入住日期</th>
                            <th>退房日期</th>
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
  }, 1000);
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
