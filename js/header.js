console.log("header.js loaded");
  const loginLink = document.getElementById("login-button");
  console.log("loginLink:", loginLink);
  if (!loginLink) {

  }else{

  const loginText = loginLink.querySelector(".login-text");
  console.log("loginText:", loginText);

  let storedMember = null;
  try {
    const sessionData = sessionStorage.getItem("currentMember");
    const localData = localStorage.getItem("currentMember");
    console.log("sessionData:", sessionData);
    console.log("localData:", localData);

    if (sessionData) {
      storedMember = JSON.parse(sessionData);
    } else if (localData) {
      storedMember = JSON.parse(localData);
    }
    console.log("storedMember:", storedMember);
  } catch (e) {
    console.error("解析 currentMember 發生錯誤", e);
  }

  if (storedMember && storedMember.memName) {
    loginText.textContent = storedMember.memName;
    loginLink.setAttribute("href", "user-profile.html");
  } else {
    loginText.textContent = "登入 / 註冊";
    loginLink.setAttribute("href", "login.html");
  }
}