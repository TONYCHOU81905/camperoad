// 用戶資料管理
class UserProfileManager {
  constructor() {
    this.currentMember = null;
    this.campsiteOrders = [];
    this.favoriteCamps = [];
    this.camps = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.initTabs();
    this.loadMemberData();
    this.loadCampsiteOrders();
    this.loadFavoriteCamps();
  }

  async loadData() {
    try {
      // 載入會員資料
      const memResponse = await fetch("data/mem.json");
      const memData = await memResponse.json();
      this.currentMember = memData[0]; // 使用第一個會員作為當前登入會員

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
});
