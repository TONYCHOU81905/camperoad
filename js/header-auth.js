// 處理網站標頭的登入狀態顯示
class HeaderAuth {
  constructor() {
    this.init();
  }

  init() {
    this.updateLoginButton();
  }

  // 檢查當前登入狀態
  getCurrentUser() {
    // 檢查營地主登入狀態
    const ownerData =
      localStorage.getItem("currentOwner") ||
      sessionStorage.getItem("currentOwner");
    if (ownerData) {
      return {
        type: "owner",
        data: JSON.parse(ownerData),
      };
    }

    // 檢查會員登入狀態
    const memberData =
      localStorage.getItem("currentMember") ||
      sessionStorage.getItem("currentMember");
    if (memberData) {
      return {
        type: "member",
        data: JSON.parse(memberData),
      };
    }

    return null;
  }

  // 更新登入按鈕顯示
  async updateLoginButton() {
    const btnLogin = document.querySelector(".btn-login");
    if (!btnLogin) return;

    const currentUser = this.getCurrentUser();

    if (currentUser) {
      if (currentUser.type === "owner") {
        // 營地主登入狀態
        await this.updateOwnerButton(btnLogin, currentUser.data);
      } else if (currentUser.type === "member") {
        // 會員登入狀態
        this.updateMemberButton(btnLogin, currentUser.data);
      }
    } else {
      // 未登入狀態
      this.updateGuestButton(btnLogin);
    }
  }

  // 更新營地主按鈕
  async updateOwnerButton(btnLogin, ownerData) {
    try {
      // 載入營地資料
      const response = await fetch("data/camp.json");
      const camps = await response.json();
      const camp = camps.find((c) => c.owner_id === ownerData.owner_id);

      const campName = camp ? camp.camp_name : ownerData.owner_name;

      btnLogin.href = "owner-dashboard.html";
      btnLogin.innerHTML = `<i class="fas fa-user"></i> ${campName}`;
      btnLogin.title = `營地主：${campName}`;

      // 添加登出功能
      this.addLogoutMenu(btnLogin, "owner");
    } catch (error) {
      console.error("載入營地資料失敗：", error);
      btnLogin.href = "owner-dashboard.html";
      btnLogin.innerHTML = `<i class="fas fa-user"></i> ${ownerData.owner_name}`;
      btnLogin.title = `營地主：${ownerData.owner_name}`;
    }
  }

  // 更新會員按鈕
  updateMemberButton(btnLogin, memberData) {
    btnLogin.href = "user-profile.html";
    btnLogin.innerHTML = `<i class="fas fa-user"></i> ${memberData.mem_name}`;
    btnLogin.title = `會員：${memberData.mem_name}`;

    // 添加登出功能
    this.addLogoutMenu(btnLogin, "member");
  }

  // 更新訪客按鈕
  updateGuestButton(btnLogin) {
    btnLogin.href = "login.html";
    btnLogin.innerHTML = "登入 / 註冊";
    btnLogin.title = "登入或註冊";

    // 移除登出選單
    this.removeLogoutMenu();
  }

  // 添加登出選單
  addLogoutMenu(btnLogin, userType) {
    // 移除現有的登出選單
    this.removeLogoutMenu();

    // 創建下拉選單
    const dropdown = document.createElement("div");
    dropdown.className = "user-dropdown";
    dropdown.innerHTML = `
      <div class="dropdown-menu">
        <a href="#" class="dropdown-item logout-item">
          <i class="fas fa-sign-out-alt"></i> 登出
        </a>
      </div>
    `;

    // 添加樣式
    if (!document.getElementById("user-dropdown-styles")) {
      const style = document.createElement("style");
      style.id = "user-dropdown-styles";
      style.textContent = `
        .user-dropdown {
          position: relative;
          display: inline-block;
        }
        .dropdown-menu {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          min-width: 120px;
          z-index: 1000;
        }
        .dropdown-item {
          display: block;
          padding: 8px 16px;
          color: #333;
          text-decoration: none;
          font-size: 14px;
        }
        .dropdown-item:hover {
          background-color: #f5f5f5;
        }
        .user-dropdown:hover .dropdown-menu {
          display: block;
        }
      `;
      document.head.appendChild(style);
    }

    // 包裝按鈕
    const wrapper = document.createElement("div");
    wrapper.className = "user-dropdown";
    btnLogin.parentNode.insertBefore(wrapper, btnLogin);
    wrapper.appendChild(btnLogin);
    wrapper.appendChild(dropdown);

    // 綁定登出事件
    const logoutItem = dropdown.querySelector(".logout-item");
    logoutItem.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleLogout(userType);
    });
  }

  // 移除登出選單
  removeLogoutMenu() {
    const dropdown = document.querySelector(".user-dropdown");
    if (dropdown) {
      const btnLogin = dropdown.querySelector(".btn-login");
      if (btnLogin) {
        dropdown.parentNode.insertBefore(btnLogin, dropdown);
      }
      dropdown.remove();
    }
  }

  // 處理登出
  handleLogout(userType) {
    console.log("handleLogout:" + userType);

    if (confirm("確定要登出嗎？")) {
      if (userType == "owner") {
        // 清除所有相關的儲存資料
        localStorage.removeItem("currentOwner");
        sessionStorage.removeItem("currentOwner");
        // 也清除可能的其他相關資料
        localStorage.removeItem("ownerRememberMe");
        sessionStorage.removeItem("ownerRememberMe");
      } else if (userType == "member") {
        // 清除所有相關的儲存資料
        localStorage.removeItem("currentMember");
        sessionStorage.removeItem("currentMember");
        // 也清除可能的其他相關資料
        localStorage.removeItem("memberRememberMe");
        sessionStorage.removeItem("memberRememberMe");
      }

      // 重新載入頁面
      window.location.reload();
    }
  }
}

// 當頁面載入完成時初始化
document.addEventListener("DOMContentLoaded", () => {
  new HeaderAuth();
});

// 全域購物車管理器
// class GlobalCartManager {
//   constructor() {
//     this.init();
//   }

//   init() {
//     // 初始化購物車數量顯示
//     this.updateCartCount();
//   }

//   // 取得會員ID（從localStorage或session）
//   getMemberId() {
//     const memberInfo = localStorage.getItem('memberInfo');
//     if (memberInfo) {
//       const member = JSON.parse(memberInfo);
//       return member.memId || null;
//     }
//     return null;
//   }

//   // 更新購物車數量顯示
//   updateCartCount(count = null) {
//     const cartCountElements = document.querySelectorAll('.cart-count');
//     if (count !== null) {
//       cartCountElements.forEach(element => {
//         element.textContent = count;
//         element.style.display = count > 0 ? 'inline' : 'none';
//       });
//     } else {
//       // 如果沒有傳入數量，可以從後端取得購物車數量
//       this.fetchCartCount();
//     }
//   }

//   // 從後端取得購物車數量
//   fetchCartCount() {
//     const memId = this.getMemberId();
//     fetch(`${window.api_prefix}/api/getCart?memId=${memId || ''}`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     })
//     .then(response => response.json())
//     .then(data => {
//       if (data.status === 'success' && data.data) {
//         const cartItems = data.data;
//         const totalCount = cartItems.reduce((sum, item) => sum + item.cartProdQty, 0);
//         this.updateCartCount(totalCount);
//       } else {
//         this.updateCartCount(0);
//       }
//     })
//     .catch(error => {
//       console.error('取得購物車數量失敗:', error);
//       this.updateCartCount(0);
//     });
//   }

// }

// // 建立全域購物車管理實例
// const globalCartManager = new GlobalCartManager();

// // 頁面載入時初始化購物車數量
// document.addEventListener('DOMContentLoaded', function() {
//   globalCartManager.updateCartCount();
// });

// 導出供其他模組使用
window.globalCartManager = globalCartManager;
