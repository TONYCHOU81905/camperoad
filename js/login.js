// 登入頁面功能
document.addEventListener("DOMContentLoaded", function () {
  // 載入會員資料
  loadMemberData();

  // 綁定登入表單事件
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // 綁定註冊表單事件
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
});

// 處理登入
async function handleLogin(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const memId = formData.get("mem_id") || formData.get("username");
  const password = formData.get("password");

  console.log("登入請求：", { memId, password });

  if (!memId || !password) {
    showMessage("請輸入會員ID和密碼", "error");
    return;
  }

  // 等待會員資料載入
  if (!memberData || memberData.length === 0) {
    await loadMemberData();
  }

  // 驗證登入
  const member = memberData.find(
    (m) => m.mem_id == memId && m.mem_pwd == password
  );

  if (member) {
    // 登入成功
    currentMember = member;
    localStorage.setItem("currentMember", JSON.stringify(member));
    showMessage("登入成功！", "success");

    // 延遲跳轉到首頁
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } else {
    showMessage("會員ID或密碼錯誤", "error");
  }
}

// 處理註冊（簡化版）
function handleRegister(e) {
  e.preventDefault();
  showMessage("註冊功能尚未開放，請使用現有會員帳號登入", "info");
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
