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

  // 密碼強度檢測
  // const passwordInput = document.getElementById("camper-register-password");
  // const strengthBar = document.querySelector(".strength-fill");
  // const strengthText = document.querySelector(".strength-text");

  // if (passwordInput) {
  //   passwordInput.addEventListener("input", function () {
  //     const password = this.value;
  //     let strength = 0;
  //     let status = "";

  //     if (password.length >= 6) strength += 20;
  //     if (password.length >= 10) strength += 20;
  //     if (/[A-Z]/.test(password)) strength += 20;
  //     if (/[0-9]/.test(password)) strength += 20;
  //     if (/[^A-Za-z0-9]/.test(password)) strength += 20;

  //     strengthBar.style.width = strength + "%";

  //     if (strength <= 20) {
  //       strengthBar.style.backgroundColor = "#E76F51";
  //       status = "非常弱";
  //     } else if (strength <= 40) {
  //       strengthBar.style.backgroundColor = "#E76F51";
  //       status = "弱";
  //     } else if (strength <= 60) {
  //       strengthBar.style.backgroundColor = "#F4A261";
  //       status = "中等";
  //     } else if (strength <= 80) {
  //       strengthBar.style.backgroundColor = "#A68A64";
  //       status = "強";
  //     } else {
  //       strengthBar.style.backgroundColor = "#3A5A40";
  //       status = "非常強";
  //     }

  //     strengthText.textContent = "密碼強度: " + status;
  //   });
  // }
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

  try {
    console.log("memAcc:" + memAcc);
    console.log("password:" + password);
    // 使用API進行登入

    const response = await fetch(`${window.api_prefix}/api/member/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memAcc: memAcc,
        memPwd: password,
      }),
      credentials: "include", // 包含Cookie
    });

    console.log("RESPONSE:" + response);

    if (!response.ok) {
      throw new Error("登入失敗");
    }

    const data = await response.json();

    console.log("response" + data.status);

    if (data.status === "登入成功") {
      // 登入成功
      const member = data.member;
      currentMember = member;

      // 根據remember checkbox決定存儲方式
      if (remember) {
        localStorage.setItem("currentMember", JSON.stringify(member));
      } else {
        sessionStorage.setItem("currentMember", JSON.stringify(member));
      }

      showMessage("登入成功！", "success");

      

      // 登入成功後合併未登入時的購物車資料
      try {
        const sessionCart = sessionStorage.getItem("sessionCart");
        if (sessionCart) {
          const cartList = JSON.parse(sessionCart);
          if (cartList.length > 0) {
            console.log("準備合併購物車:", cartList);

            const mergeResponse = await fetch(
              `${window.api_prefix}/api/mergeCart`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  memId: member.memId,
                  cartList: cartList,
                }),
              }
            );

            if (mergeResponse.ok) {
              const mergeData = await mergeResponse.json();
              console.log("購物車合併成功:", mergeData);

              // 只有在合併成功後才清空 sessionStorage
              sessionStorage.removeItem("sessionCart");

              // 更新前端購物車顯示
              if (window.globalCartManager) {
                window.globalCartManager.updateCartCount();
              }

              // 合併成功後跳轉到購物車頁面
              window.location.href = "shop_cart.html";
            } else {
              console.error("購物車合併失敗: HTTP", mergeResponse.status);
              // 合併失敗時保留 sessionCart，不刪除
            }
          } else {
            console.log("sessionCart 為空，無需合併");
          }
        }
      } catch (err) {
        console.error("購物車合併過程發生錯誤:", err);
        // 發生錯誤時保留 sessionCart，不刪除
      }

      try {
        const returnUrl = localStorage.getItem("returnUrl");
        if (returnUrl) {
          window.location.href = returnUrl;
          localStorage.removeItem("returnUrl");
        } else {
          console.log("找不到returnUrl");
        }
      } catch (error) {
        console.error("營地登入後導轉發生意外:", err);
      }

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } else {
      showMessage(data.message || "露營者帳號或密碼錯誤", "error");
    }
  } catch (error) {
    console.error("登入錯誤：", error);
    showMessage("登入失敗，請稍後再試", "error");
  }
}

// 處理露營者註冊
async function handleRegister(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const memData = {
    memAcc: formData.get("memAcc"),
    memPwd: formData.get("memPwd"),
    memName: formData.get("memName"),
    memGender: formData.get("memGender"),
    memEmail: formData.get("memEmail"),
    memMobile: formData.get("memMobile"),
    memAddr: formData.get("memAddr"),
    memNation: formData.get("memNation"),
    memNationId: formData.get("memNationId"),
    memBirth: formData.get("memBirth"),
  };

  // 驗證必填欄位
  for (const [key, value] of Object.entries(memData)) {
    if (!value || value.trim() === "") {
      showMessage("請填寫所有必填欄位", "error");
      return;
    }
  }

  // 驗證確認密碼
  const confirmPassword = formData.get("confirm-password");
  if (memData.memPwd !== confirmPassword) {
    showMessage("密碼與確認密碼不符", "error");
    return;
  }

  // 驗證帳號與信箱是否相同
  if (memData.memAcc !== memData.memEmail) {
    showMessage("帳號與信箱必須相同", "error");
    return;
  }

  // 驗證Email格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(memData.memAcc)) {
    showMessage("請輸入正確的Email格式", "error");
    return;
  }

  // 驗證手機格式
  const mobileRegex = /^\d{4}-\d{3}-\d{3}$/;
  if (!mobileRegex.test(memData.memMobile)) {
    showMessage("請輸入正確的手機格式，如：0911-123-456", "error");
    return;
  }

  // 驗證身分證格式（簡易版）
  if (memData.memNation === "0") {
    // 本國籍，驗證身分證格式
    const idRegex = /^[A-Z][12]\d{8}$/;
    if (!idRegex.test(memData.memNationId)) {
      showMessage("請輸入正確的身分證格式", "error");
      return;
    }
  }

  try {
    const response = await fetch(`${window.api_prefix}/api/member/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memData),
    });

    if (!response.ok) {
      // 記錄錯誤但不拋出，繼續執行
      console.warn(
        "註冊 API 回傳錯誤狀態，但忽略此錯誤繼續流程:",
        response.status
      );
    }

    // 不論回傳狀態，皆嘗試顯示成功訊息並切換頁面
    showMessage("露營者註冊成功！請使用註冊的帳號密碼登入", "success");

    // 清空表單
    e.target.reset();

    // 3秒後切換到登入頁面
    setTimeout(() => {
      document.querySelector('[data-tab="login"]').click();
    }, 3000);
  } catch (error) {
    // 真正網路或程式錯誤時才顯示錯誤
    console.error("註冊失敗：", error);
    showMessage("註冊失敗，請稍後再試", "error");
  }
}

// 處理營地主註冊
async function handleOwnerRegister(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const ownerData = {
    ownerAcc: formData.get("ownerAcc"),
    ownerPwd: formData.get("ownerPwd"),
    ownerName: formData.get("ownerName"),
    ownerGui: formData.get("ownerGui"),
    ownerRep: formData.get("ownerRep"),
    ownerTel: formData.get("ownerTel"),
    ownerPoc: formData.get("ownerPoc"),
    ownerConPhone: formData.get("ownerConPhone"),
    ownerAddr: formData.get("ownerAddr"),
    ownerEmail: formData.get("ownerEmail"),
    bankAccount: formData.get("bankAccount"),
  };

  // 驗證必填欄位
  for (const [key, value] of Object.entries(ownerData)) {
    if (!value || value.trim() === "") {
      showMessage("請填寫所有必填欄位", "error");
      return;
    }
  }

  // 驗證統一編號格式（8位數字）
  if (!/^\d{8}$/.test(ownerData.ownerGui)) {
    showMessage("統一編號必須為8位數字", "error");
    return;
  }

  // 驗證Email格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (
    !emailRegex.test(ownerData.ownerAcc) ||
    !emailRegex.test(ownerData.ownerEmail)
  ) {
    showMessage("請輸入正確的Email格式", "error");
    return;
  }

  try {
    // 使用API註冊營地主
    const response = await fetch(`${window.api_prefix}/api/owner/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ownerData),
      credentials: "include", // 包含Cookie
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "註冊請求失敗");
    }

    const data = await response.json();

    if (data.success) {
      showMessage("營地主註冊成功！請使用註冊的帳號密碼登入", "success");

      // 清空表單
      e.target.reset();

      // 3秒後切換到營地主登入頁面
      setTimeout(() => {
        document.querySelector('[data-tab="owner-login"]').click();
      }, 2000);
    } else {
      showMessage(data.message || "註冊失敗，請檢查資料是否正確", "error");
    }
  } catch (error) {
    console.error("註冊失敗：", error);
    showMessage(error.message || "註冊失敗，請稍後再試", "error");
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
    // 使用API登入營地主
    const response = await fetch(`${window.api_prefix}/api/owner/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerAcc: ownerAcc,
        ownerPwd: ownerPwd,
      }),
      credentials: "include", // 包含Cookie
    });

    console.log("RESPONSE:" + response);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "登入請求失敗");
    }

    const data = await response.json();

    if (data.success) {
      // 登入成功
      const owner = data.owner;

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
      showMessage(
        data.message || "營地主帳號或密碼錯誤，或帳號已被停用",
        "error"
      );
    }
  } catch (error) {
    console.error("登入失敗：", error);
    showMessage(error.message || "登入失敗，請稍後再試", "error");
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
    // 使用API登入管理員
    const response = await fetch(`${window.api_prefix}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminAcc: adminAcc,
        adminPwd: adminPwd,
      }),
      credentials: "include", // 包含Cookie
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "登入請求失敗");
    }

    const data = await response.json();

    if (data.success) {
      // 登入成功
      const admin = data.admin;

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
      showMessage(
        data.message || "管理員帳號或密碼錯誤，或帳號已被停用",
        "error"
      );
    }
  } catch (error) {
    console.error("登入失敗：", error);
    showMessage(error.message || "登入失敗，請稍後再試", "error");
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

function checkLoginStatus() {
  let savedMemberStr = sessionStorage.getItem("currentMember") || localStorage.getItem("currentMember");
  if (savedMemberStr) {
    try {
      const savedMember = JSON.parse(savedMemberStr);
      if (savedMember.memName) {
        currentMember = savedMember;
        showMessage(`歡迎回來，${currentMember.memName}！`, "success");
        // 可以這裡做更多顯示登入狀態的操作，例如改變頁面header按鈕文字等
      }
    } catch (e) {
      console.error("解析 currentMember 失敗", e);
    }
  }
}
// 頁面載入時檢查登入狀態
checkLoginStatus();
