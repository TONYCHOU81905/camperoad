// 登入頁面功能
document.addEventListener("DOMContentLoaded", function () {
  // 載入會員資料
  loadMemberData();

  // 綁定露營者登入表單事件
  const camperLoginForm = document.getElementById("camperLoginForm");
  if (camperLoginForm) {
    camperLoginForm.addEventListener("submit", handleLogin);
  }

  // 綁定露營者註冊表單事件
  const camperRegisterForm = document.getElementById("camperRegisterForm");
  if (camperRegisterForm) {
    camperRegisterForm.addEventListener("submit", handleRegister);
  }

  // 綁定營地主註冊表單事件
  const ownerRegisterForm = document.getElementById("ownerRegisterForm");
  if (ownerRegisterForm) {
    ownerRegisterForm.addEventListener("submit", handleOwnerRegister);
  }

  // 綁定營地主登入表單事件
  const ownerLoginForm = document.getElementById("ownerLoginForm");
  if (ownerLoginForm) {
    ownerLoginForm.addEventListener("submit", handleOwnerLogin);
  }

  // 綁定管理員登入表單事件
  const adminLoginForm = document.getElementById("adminLoginForm");
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", handleAdminLogin);
  }
});

// 處理登入
async function handleLogin(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const memAcc = formData.get("mem_acc") || formData.get("username");
  const password = formData.get("password");
  const remember = formData.get("remember");

  console.log("登入請求：", { memAcc, password, remember });

  if (!memAcc || !password) {
    showMessage("請輸入露營者帳號和密碼", "error");
    return;
  }

  // 等待會員資料載入
  if (!memberData || memberData.length === 0) {
    await loadMemberData();
  }

  // 驗證登入
  const member = memberData.find(
    (m) => m.mem_acc == memAcc && m.mem_pwd == password
  );

  if (member) {
    // 登入成功
    currentMember = member;

    // 根據remember checkbox決定存儲方式
    if (remember) {
      localStorage.setItem("currentMember", JSON.stringify(member));
    } else {
      sessionStorage.setItem("currentMember", JSON.stringify(member));
    }

    showMessage("登入成功！", "success");

    // 延遲跳轉到首頁
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } else {
    showMessage("露營者帳號或密碼錯誤", "error");
  }
}

// 處理註冊（簡化版）
function handleRegister(e) {
  e.preventDefault();
  showMessage("註冊功能尚未開放，請使用現有會員帳號登入", "info");
}

// 處理營地主註冊
async function handleOwnerRegister(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const ownerData = {
    owner_acc: formData.get("owner_acc"),
    owner_pwd: formData.get("owner_pwd"),
    owner_name: formData.get("owner_name"),
    owner_gui: formData.get("owner_gui"),
    owner_rep: formData.get("owner_rep"),
    owner_tel: formData.get("owner_tel"),
    owner_poc: formData.get("owner_poc"),
    owner_con_phone: formData.get("owner_con_phone"),
    owner_addr: formData.get("owner_addr"),
    owner_email: formData.get("owner_email"),
    bank_account: formData.get("bank_account"),
  };

  // 驗證必填欄位
  for (const [key, value] of Object.entries(ownerData)) {
    if (!value || value.trim() === "") {
      showMessage("請填寫所有必填欄位", "error");
      return;
    }
  }

  // 驗證統一編號格式（8位數字）
  if (!/^\d{8}$/.test(ownerData.owner_gui)) {
    showMessage("統一編號必須為8位數字", "error");
    return;
  }

  // 驗證Email格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (
    !emailRegex.test(ownerData.owner_acc) ||
    !emailRegex.test(ownerData.owner_email)
  ) {
    showMessage("請輸入正確的Email格式", "error");
    return;
  }

  try {
    // 載入現有營地主資料
    const response = await fetch("data/owner.json");
    const owners = await response.json();

    // 檢查帳號是否已存在
    const existingOwner = owners.find(
      (owner) => owner.owner_acc === ownerData.owner_acc
    );
    if (existingOwner) {
      showMessage("此Email帳號已被註冊", "error");
      return;
    }

    // 生成新的owner_id
    const maxId = Math.max(...owners.map((owner) => parseInt(owner.owner_id)));
    const newOwnerId = (maxId + 1).toString().padStart(3, "0");

    // 建立新營地主資料
    const newOwner = {
      owner_id: newOwnerId,
      ...ownerData,
      owner_status: "1", // 預設啟用狀態
      owner_reg_date: new Date().toISOString().split("T")[0], // 今天日期
      owner_pic: "", // 預設空白圖片
    };

    // 模擬新增到JSON（實際應用需要後端API）
    console.log("新營地主資料：", newOwner);
    showMessage("營地主註冊成功！請使用註冊的帳號密碼登入", "success");

    // 清空表單
    e.target.reset();

    // 3秒後切換到營地主登入頁面
    setTimeout(() => {
      document.querySelector('[data-tab="owner-login"]').click();
    }, 2000);
  } catch (error) {
    console.error("註冊失敗：", error);
    showMessage("註冊失敗，請稍後再試", "error");
  }
}

// 處理營地主登入
async function handleOwnerLogin(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const ownerAcc = formData.get("owner_acc");
  const ownerPwd = formData.get("owner_pwd");
  const remember = formData.get("remember");

  console.log("營地主登入請求：", { ownerAcc, ownerPwd, remember });

  if (!ownerAcc || !ownerPwd) {
    showMessage("請輸入營地主帳號和密碼", "error");
    return;
  }

  try {
    // 載入營地主資料
    const response = await fetch("data/owner.json");
    const owners = await response.json();

    // 驗證登入
    const owner = owners.find(
      (o) =>
        o.owner_acc == ownerAcc && o.owner_pwd == ownerPwd && o.acc_status == 1
    );

    if (owner) {
      // 登入成功
      // 根據remember checkbox決定存儲方式
      if (remember) {
        localStorage.setItem("currentOwner", JSON.stringify(owner));
      } else {
        sessionStorage.setItem("currentOwner", JSON.stringify(owner));
      }

      showMessage("營地主登入成功！", "success");

      // 延遲跳轉到營地主後台
      setTimeout(() => {
        window.location.href = "owner-dashboard.html";
      }, 1500);
    } else {
      showMessage("營地主帳號或密碼錯誤，或帳號已被停用", "error");
    }
  } catch (error) {
    console.error("登入失敗：", error);
    showMessage("登入失敗，請稍後再試", "error");
  }
}

// 處理管理員登入
async function handleAdminLogin(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const adminAcc = formData.get("admin_acc");
  const adminPwd = formData.get("admin_pwd");
  const remember = formData.get("remember");

  if (!adminAcc || !adminPwd) {
    showMessage("請輸入管理員帳號和密碼", "error");
    return;
  }

  try {
    // 載入管理員資料
    const response = await fetch("data/administrator.json");
    const admins = await response.json();

    // 驗證登入
    const admin = admins.find(
      (a) =>
        a.admin_acc == adminAcc &&
        a.admin_pwd == adminPwd &&
        a.admin_status == 1
    );

    if (admin) {
      // 登入成功
      // 根據remember checkbox決定存儲方式
      if (remember) {
        localStorage.setItem("currentAdmin", JSON.stringify(admin));
      } else {
        sessionStorage.setItem("currentAdmin", JSON.stringify(admin));
      }
      
      showMessage("管理員登入成功！", "success");

      // 延遲跳轉到管理員後台
      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 1500);
    } else {
      showMessage("管理員帳號或密碼錯誤，或帳號已被停用", "error");
    }
  } catch (error) {
    console.error("登入失敗：", error);
    showMessage("登入失敗，請稍後再試", "error");
  }
}

// 顯示訊息
function showMessage(message, type = "info") {
  // 移除現有訊息
  const existingMessage = document.querySelector(".login-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  // 建立新訊息
  const messageDiv = document.createElement("div");
  messageDiv.className = `login-message ${type}`;
  messageDiv.textContent = message;

  // 設定樣式
  const colors = {
    success: "#4CAF50",
    error: "#f44336",
    info: "#2196F3",
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

  // 3秒後移除訊息
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// 檢查是否已登入
function checkLoginStatus() {
  const savedMember = localStorage.getItem("currentMember");
  if (savedMember) {
    currentMember = JSON.parse(savedMember);
    // 如果已登入，可以選擇跳轉到首頁或顯示已登入狀態
    showMessage(`歡迎回來，${currentMember.mem_name}！`, "success");
  }
}

// 頁面載入時檢查登入狀態
checkLoginStatus();
