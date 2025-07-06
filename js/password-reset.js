window.api_prefix = "http://localhost:8081/CJA101G02";

//阻擋main.js
window.addEventListener("error", function (event) {
  if (event.message && event.message.includes("Cannot read properties of null")) {
    console.warn("忽略來自其他 JS 的 null 錯誤：", event.message);
    event.preventDefault(); // 阻止錯誤訊息顯示
  }
});

// 密碼重設相關功能
document.addEventListener("DOMContentLoaded", function () {
  // 忘記密碼表單處理
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", handleForgotPassword);
  }

  // 重設密碼表單處理
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", handleResetPassword);
  }

  // 密碼可見性切換
  const togglePasswordButtons = document.querySelectorAll(".toggle-password");
  if (togglePasswordButtons) {
    togglePasswordButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const passwordInput = this.parentElement.querySelector("input");
        const icon = this.querySelector("i");

        if (passwordInput.type === "password") {
          passwordInput.type = "text";
          icon.classList.remove("fa-eye");
          icon.classList.add("fa-eye-slash");
        } else {
          passwordInput.type = "password";
          icon.classList.remove("fa-eye-slash");
          icon.classList.add("fa-eye");
        }
      });
    });
  }

  // 密碼強度檢測
  const newPasswordInput = document.getElementById("new-password");
  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", checkPasswordStrength);
  }

  // 密碼匹配檢測
  const confirmPasswordInput = document.getElementById("confirm-password");
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
  }
});

// 處理忘記密碼表單提交
async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById("email").value;

  if (!email) {
    showMessage("請輸入電子郵件地址", "error");
    return;
  }

  // 驗證Email格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMessage("請輸入有效的電子郵件地址", "error");
    return;
  }

  try {
    // 使用API發送重設密碼請求
    const response = await fetch(`${window.api_prefix}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: email }),
      credentials: "include" // 包含Cookie
    });

    const data = await response.json();

    if (data.success) {
      showMessage(data.message || "密碼重設連結已發送，請查收信箱", "success");
    } else {
      showMessage(data.message || "信箱未註冊", "error");
    }
  } catch (error) {
    console.error("發送忘記密碼時出錯：", error);
    showMessage("伺服器錯誤，請稍後再試", "error");
  }
}

// 處理重設密碼表單提交
async function handleResetPassword(e) {
  e.preventDefault();
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  // 從URL獲取令牌和電子郵件
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  // const email = urlParams.get("email");

  
  if (!token) {

    showMessage("無效的密碼重設連結，請重新申請", "error");
    return;
  }

  if (!newPassword || !confirmPassword) {
    showMessage("請填寫所有必填欄位", "error");
    return;
  }

  // if (newPassword.length < 8) {
  //   showMessage("密碼長度必須至少為8個字符", "error");
  //   return;
  // }

  if (newPassword !== confirmPassword) {
    showMessage("兩次輸入的密碼不一致", "error");
    return;
  }

  // 檢查密碼強度
  // const strengthBar = document.querySelector(".password-strength-bar");
  // const strengthPercentage = parseInt(strengthBar.style.width) || 0;
  // if (strengthPercentage < 50) {
  //   showMessage("密碼強度不足，請設置更複雜的密碼", "error");
  //   return;
  // }

  try {
    // 使用API重設密碼
    const response = await fetch(`${window.api_prefix}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: token,
        newPassword: newPassword
      }),
      credentials: "include" // 包含Cookie
    });

    // if (!response.ok) {
    //   throw new Error("密碼重設請求失敗");
    // }

    const data = await response.json();

    if (data.success) {
      // 清除重設令牌
      // sessionStorage.removeItem("resetToken");
      // sessionStorage.removeItem("resetEmail");

      // 顯示成功訊息
      showMessage("密碼重設成功，即將跳轉到登入頁面", "success");

      // 延遲跳轉到登入頁面
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      // 顯示API返回的錯誤訊息
      showMessage(data.message || "密碼重設失敗，請稍後再試", "error");
    }

  } catch (error) {
    console.error("重設密碼時出錯：", error);
    showMessage("重設密碼時出錯，請稍後再試", "error");
  }
}

// 檢查密碼強度
function checkPasswordStrength() {
  const password = document.getElementById("new-password").value;
  const strengthBar = document.querySelector(".password-strength-bar");
  const strengthText = document.querySelector(".password-strength-text");

  if (!password) {
    strengthBar.style.width = "0%";
    strengthBar.style.backgroundColor = "#e9ecef";
    strengthText.textContent = "密碼強度: 尚未輸入";
    strengthText.style.color = "#6c757d";
    return;
  }

  let strength = 0;
  let strengthLabel = "弱";
  let color = "#dc3545";

  // 檢查密碼長度
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;

  // 檢查字符類型
  if (password.match(/[a-z]/)) strength += 1;
  if (password.match(/[A-Z]/)) strength += 1;
  if (password.match(/[0-9]/)) strength += 1;
  if (password.match(/[^a-zA-Z0-9]/)) strength += 1;

  // 根據強度設置標籤和顏色
  if (strength <= 2) {
    strengthLabel = "弱";
    color = "#dc3545";
  } else if (strength <= 4) {
    strengthLabel = "中";
    color = "#ffc107";
  } else {
    strengthLabel = "強";
    color = "#28a745";
  }

  // 更新UI
  const percentage = (strength / 6) * 100;
  strengthBar.style.width = `${percentage}%`;
  strengthBar.style.backgroundColor = color;
  strengthText.textContent = `密碼強度: ${strengthLabel}`;
  strengthText.style.color = color;

  // 檢查密碼匹配
  checkPasswordMatch();
}

// 檢查密碼匹配
function checkPasswordMatch() {
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const matchText = document.querySelector(".password-match-text");

  if (!confirmPassword) {
    matchText.textContent = "請確認密碼";
    matchText.className = "password-match-text";
    return;
  }

  if (newPassword === confirmPassword) {
    matchText.textContent = "密碼匹配";
    matchText.className = "password-match-text match";
  } else {
    matchText.textContent = "密碼不匹配";
    matchText.className = "password-match-text not-match";
  }
}

// 生成重設令牌
function generateResetToken() {
  // 生成一個隨機的令牌
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 載入會員資料
async function loadMemberData() {
  try {
    const response = await fetch("data/mem.json");
    return await response.json();
  } catch (error) {
    console.error("載入會員資料失敗：", error);
    return [];
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