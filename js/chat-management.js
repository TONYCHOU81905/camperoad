/**
 * 聊天管理功能
 */

document.addEventListener("DOMContentLoaded", function () {
  // 添加系統消息橫幅樣式
  const style = document.createElement("style");
  style.textContent = `
    .system-message-banner {
      background-color: #ff6b35;
      color: white;
      padding: 10px;
      text-align: center;
      margin-bottom: 15px;
      border-radius: 5px;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);

  // 聊天管理初始化函數已定義，等待手動調用
  console.log("chat-management.js已載入，等待初始化調用");
});

/**
 * 初始化聊天管理
 */
window.initChatManagement = function () {
  console.log("=== 開始初始化聊天管理 ===");

  // 檢查是否在營地主後台
  const isOwnerDashboard = window.location.pathname.includes("owner-dashboard");
  console.log("是否為營地主後台:", isOwnerDashboard);
  console.log("當前路徑:", window.location.pathname);

  if (isOwnerDashboard) {
    console.log("營地主模式初始化");
    console.log(
      "ownerDashboard實例:",
      typeof ownerDashboard !== "undefined" ? "存在" : "不存在"
    );

    // 營地主模式：從ownerDashboard實例獲取營地主ID
    if (typeof ownerDashboard !== "undefined" && ownerDashboard.currentOwner) {
      const ownerId = ownerDashboard.currentOwner.ownerId;
      console.log("獲取到營地主ID:" + ownerId);

      // 設置隱藏的營地主ID輸入框
      const ownerIdInput = document.getElementById("ownerId");
      if (ownerIdInput) {
        ownerIdInput.value = ownerId;
        console.log("已設置隱藏輸入框的營地主ID");
      } else {
        console.error("找不到ownerId隱藏輸入框");
      }

      // 設置會員ID（營地主也是會員）
      const memIdInput = document.getElementById("memId");
      if (memIdInput) {
        let memId = null;

        // 優先從營地主資料中獲取會員ID
        if (ownerDashboard.currentOwner.memId) {
          memId = ownerDashboard.currentOwner.memId;
          console.log("從營地主資料獲取會員ID:" + memId);
        } else {
          // 如果營地主資料中沒有會員ID，嘗試從localStorage獲取
          const memberData =
            localStorage.getItem("currentMember") ||
            sessionStorage.getItem("currentMember");
          if (memberData) {
            try {
              const member = JSON.parse(memberData);
              if (member && member.memId) {
                memId = member.memId;
                console.log("從會員資料獲取會員ID:" + memId);
              }
            } catch (error) {
              console.error("解析會員資料失敗:", error);
            }
          }
        }

        if (memId) {
          memIdInput.value = memId;
          console.log("已設置隱藏輸入框的會員ID:" + memId);
        } else {
          console.warn("無法獲取會員ID，聊天功能可能受限");
        }
      } else {
        console.error("找不到memId隱藏輸入框");
      }

      // 從API獲取聊天記錄（營地主版本）
      console.log("準備獲取營地主聊天列表");
      fetchOwnerChatList(ownerId);

      // 初始化WebSocket連接
      console.log("初始化營地主WebSocket連接");
      initSimpleWebSocketConnection();

      // 初始化聊天窗口事件監聽器
      initChatEventListeners();
    } else {
      console.error("無法獲取營地主資訊");
      console.log(
        "ownerDashboard:",
        typeof ownerDashboard !== "undefined" ? ownerDashboard : "undefined"
      );
      if (typeof ownerDashboard !== "undefined") {
        console.log(
          "ownerDashboard.currentOwner:",
          ownerDashboard.currentOwner
        );
      }
      showEmptyState("無法獲取營地主資訊", "請重新登入營地主後台");
      return;
    }
  } else {
    // 會員模式：原有邏輯
    const memberData =
      localStorage.getItem("currentMember") ||
      sessionStorage.getItem("currentMember");

    if (!memberData) {
      showEmptyState("請先登入", "您需要登入才能查看聊天記錄");
      return;
    }

    const member = JSON.parse(memberData);
    const memId = member.memId;

    // 設置隱藏的會員ID輸入框
    document.getElementById("memId").value = memId;

    // 從API獲取聊天記錄
    fetchChatList(memId);
  }
};

/**
 * 加載營地數據
 */
async function loadCampData() {
  // 如果已經有營地數據，則不需要重新加載
  if (window.campData && window.campData.length > 0) {
    console.log("已有營地數據，無需重新加載");
    return;
  }

  try {
    console.log("開始加載營地數據");
    const campsResponse = await fetch(`${window.api_prefix}/api/getallcamps`);
    // 載入營地資料
    const campsData = await campsResponse.json();
    console.log("獲取營地資料:", campsData);

    if (campsData.status.trim() == "success") {
      this.camps = campsData.data;
    } else {
      console.error("獲取營地資料失敗:", campsData.message);
      this.camps = [];
    }

    window.campData = this.camps;
    console.log("營地數據加載成功，共", window.campData.length, "個營地");
  } catch (error) {
    console.error("加載營地數據失敗:", error);
    window.campData = [];
  }
}

/**
 * 從API獲取聊天列表
 * @param {string} memId - 會員ID
 */
async function fetchChatList(memId) {
  try {
    let data;
    let useMockData = false;

    console.log("開始獲取聊天列表，會員ID:", memId);

    try {
      // 嘗試從API獲取數據
      const response = await fetch(`${window.api_prefix}/api/cto/getonecto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          userId: parseInt(memId),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `API響應錯誤: ${response.status} ${response.statusText}`
        );
      }

      data = await response.json();
      console.log("從API獲取聊天列表數據:", data);

      // 檢查API回應格式
      if (!data || typeof data !== "object") {
        throw new Error("API回應格式錯誤");
      }
    } catch (apiError) {
      console.warn("API獲取失敗，使用模擬數據:", apiError);
      useMockData = true;

      // 使用模擬數據
      const mockResponse = await fetch("data/chat_list_mock.json");
      if (!mockResponse.ok) {
        throw new Error("無法加載模擬數據");
      }
      data = await mockResponse.json();
      console.log("使用模擬聊天列表數據:", data);
    }

    // 檢查數據格式並處理
    if (data && (data.status === "success" || data.secondList)) {
      // 獲取營地資料以顯示營地名稱
      await loadCampData();

      // 處理不同的數據格式
      const chatData = data.data || data;
      displayChatList(chatData, memId);

      if (useMockData) {
        // 如果使用的是模擬數據，顯示提示
        const systemMessage = document.createElement("div");
        systemMessage.className = "system-message-banner";
        systemMessage.textContent = "目前顯示的是模擬數據，API連接不可用";

        const chatList = document.getElementById("chat-list");
        if (chatList && chatList.parentNode) {
          chatList.parentNode.insertBefore(systemMessage, chatList);
        }
      }
    } else {
      const errorMessage = data?.message || "無法獲取聊天列表";
      console.error("聊天列表數據格式錯誤:", data);
      showEmptyState("獲取聊天列表失敗", errorMessage);
    }
  } catch (error) {
    console.error("獲取聊天列表錯誤:", error);
    showEmptyState("獲取聊天列表失敗", "請檢查網絡連接並稍後再試");
  }
}

/**
 * 從API獲取營地主聊天列表
 * @param {string} ownerId - 營地主ID
 */
async function fetchOwnerChatList(ownerId) {
  try {
    let data;
    let useMockData = false;

    console.log("開始獲取營地主聊天列表，營地主ID:", ownerId);

    try {
      // 嘗試從API獲取數據
      console.log("getonecto1:", ownerId);

      const response = await fetch(`${window.api_prefix}/api/cto/getonecto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          userId: parseInt(ownerId),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      data = await response.json();
      console.log("API響應數據:", data);
    } catch (apiError) {
      console.warn("API請求失敗，使用模擬數據:", apiError);
      useMockData = true;
      // 營地主模擬數據
      data = {
        success: true,
        data: {
          secondList: [
            {
              mem_id: 1,
              mem_name: "張小明",
              latest_message: "請問還有空位嗎？",
              latest_time: "2024-01-15 14:30:00",
              unread_count: 2,
            },
            {
              mem_id: 2,
              mem_name: "李小華",
              latest_message: "謝謝您的回覆",
              latest_time: "2024-01-15 13:45:00",
              unread_count: 0,
            },
          ],
        },
      };
    }

    if (data && (data.success || data.data || Array.isArray(data))) {
      // 確保營地數據已載入
      await loadCampData();

      // 處理不同的數據格式
      const chatData = data.data || data;
      displayOwnerChatList(chatData, ownerId);

      if (useMockData) {
        // 如果使用的是模擬數據，顯示提示
        const systemMessage = document.createElement("div");
        systemMessage.className = "system-message-banner";
        systemMessage.textContent = "目前顯示的是模擬數據，API連接不可用";

        const chatList = document.getElementById("chat-list");
        if (chatList && chatList.parentNode) {
          chatList.parentNode.insertBefore(systemMessage, chatList);
        }
      }
    } else {
      const errorMessage = data?.message || "無法獲取聊天列表";
      console.error("聊天列表數據格式錯誤:", data);
      showEmptyState("獲取聊天列表失敗", errorMessage);
    }
  } catch (error) {
    console.error("獲取營地主聊天列表錯誤:", error);
    showEmptyState("獲取聊天列表失敗", "請檢查網絡連接並稍後再試");
  }
}

/**
 * 顯示聊天列表
 * @param {Object} data - 聊天列表數據
 * @param {string} memId - 會員ID
 */
function displayChatList(data, memId) {
  const chatListContainer = document.getElementById("chat-list");
  if (!chatListContainer) return;

  // 清空容器
  chatListContainer.innerHTML = "";

  // 檢查是否有聊天記錄
  if (!data.secondList || data.secondList.length === 0) {
    showEmptyState("暫無聊天記錄", "您目前沒有任何聊天記錄");
    return;
  }

  // 獲取營地資料
  const campData = window.campData || [];

  // 創建聊天項目
  data.secondList.forEach((ownerId, index) => {
    // 查找營地資料
    const camp = campData.find((c) => c.ownerId == ownerId);

    const campName = camp ? camp.campName : `營地 ${ownerId}`;
    const chatId = data.chatIdList[index];

    // 創建聊天項目
    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";
    chatItem.dataset.ownerId = ownerId;
    chatItem.dataset.chatId = chatId;

    chatItem.innerHTML = `
      <div class="chat-item-avatar">
        <img src="images/camp-${(index % 5) + 1}.jpg" alt="${campName}">
      </div>
      <div class="chat-item-info">
        <div class="chat-item-name">${campName}</div>
        <div class="chat-item-preview">點擊開始聊天</div>
      </div>
      <div class="chat-item-time">${formatDate(new Date())}</div>
    `;

    // 添加點擊事件
    chatItem.addEventListener("click", function () {
      openChat(ownerId, campName);
    });

    // 添加到容器
    chatListContainer.appendChild(chatItem);
  });
}

/**
 * 顯示營地主聊天列表
 * @param {Object} data - 聊天列表數據
 * @param {string} ownerId - 營地主ID
 */
function displayOwnerChatList(data, ownerId) {
  const chatListContainer = document.getElementById("chat-list");
  if (!chatListContainer) return;

  // 清空容器
  chatListContainer.innerHTML = "";

  // 檢查是否有聊天記錄
  if (!data.secondList || data.secondList.length === 0) {
    showEmptyState("暫無聊天記錄", "目前沒有會員與您聊天");
    return;
  }

  // 創建聊天項目
  data.secondList.forEach((member, index) => {
    const memId = member.memId;
    const memName = member.memName || `會員 ${memId}`;
    const latestMessage = member.latestMessage || "點擊開始聊天";
    const latestTime = member.latestTime || new Date().toISOString();
    const unreadCount = member.unreadCount || 0;

    // 創建聊天項目
    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";
    chatItem.dataset.memId = memId;
    chatItem.dataset.ownerId = ownerId;

    chatItem.innerHTML = `
      <div class="chat-item-avatar">
        <img src="images/member-avatar-${
          (index % 5) + 1
        }.jpg" alt="${memName}" onerror="this.src='images/default-avatar.png'">
      </div>
      <div class="chat-item-info">
        <div class="chat-item-name">${memName}</div>
        <div class="chat-item-preview">${latestMessage}</div>
      </div>
      <div class="chat-item-meta">
        <div class="chat-item-time">${formatDate(new Date(latestTime))}</div>
        ${
          unreadCount > 0
            ? `<div class="chat-item-unread">${unreadCount}</div>`
            : ""
        }
      </div>
    `;

    // 添加點擊事件
    chatItem.addEventListener("click", function () {
      openOwnerChat(memId, memName, ownerId);
    });

    // 添加到容器
    chatListContainer.appendChild(chatItem);
  });
}

/**
 * 打開聊天窗口
 * @param {string} ownerId - 營地主ID
 * @param {string} campName - 營地名稱
 */
function openChat(ownerId, campName) {
  // 設置營地主ID
  document.getElementById("ownerId").value = ownerId;

  // 設置聊天標題
  document.getElementById("chat-title-text").textContent = campName;

  // 清空聊天訊息容器，準備載入新的歷史訊息
  const messagesContainer = document.getElementById("chat-messages");
  if (messagesContainer) {
    messagesContainer.innerHTML = "";
  }

  // 顯示聊天窗口
  const chatWidgetElement = document.querySelector(".chat-widget");
  if (chatWidgetElement) {
    chatWidgetElement.style.display = "block";

    // 打開聊天窗口
    const chatWindow = document.getElementById("chat-window");
    if (chatWindow) {
      chatWindow.classList.add("active");
    }

    // 使用UserProfileManager的WebSocket連接功能
    if (window.userProfileManager) {
      window.userProfileManager.connect();
      console.log("UserProfileManager存在，使用其WebSocket連接");
    } else {
      // 如果UserProfileManager不存在，創建一個簡化的WebSocket連接
      console.log("UserProfileManager不存在，創建簡化的WebSocket連接");
      initSimpleWebSocketConnection();
    }
  }

  // 添加關閉按鈕事件
  const closeBtn = document.getElementById("btn-close-chat");
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      closeChat();
    });
  }

  // 添加發送訊息事件
  const sendBtn = document.getElementById("btn-send-message");
  const messageInput = document.getElementById("chat-message-input");

  if (sendBtn) {
    sendBtn.addEventListener("click", function () {
      sendMessage();
    });
  }

  if (messageInput) {
    messageInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }
}

/**
 * 營地主打開聊天窗口
 * @param {string} memId - 會員ID
 * @param {string} memName - 會員名稱
 * @param {string} ownerId - 營地主ID
 */
function openOwnerChat(memId, memName, ownerId) {
  // 設置會員ID和營地主ID
  document.getElementById("memId").value = memId;
  document.getElementById("ownerId").value = ownerId;

  // 設置聊天標題
  document.getElementById(
    "chat-title-text"
  ).textContent = `與 ${memName} 的對話`;

  // 清空聊天訊息容器，準備載入新的歷史訊息
  const messagesContainer = document.getElementById("chat-messages");
  if (messagesContainer) {
    messagesContainer.innerHTML = "";
  }

  // 顯示聊天窗口
  const chatWidgetElement = document.querySelector(".chat-widget");
  if (chatWidgetElement) {
    chatWidgetElement.style.display = "block";

    // 打開聊天窗口
    const chatWindow = document.getElementById("chat-window");
    if (chatWindow) {
      chatWindow.classList.add("active");
    }

    // 使用UserProfileManager的WebSocket連接功能
    if (window.userProfileManager) {
      window.userProfileManager.connect();
    } else {
      // 如果UserProfileManager不存在，創建一個簡化的WebSocket連接
      console.log("UserProfileManager不存在，創建簡化的WebSocket連接");
      initSimpleWebSocketConnection();
    }
  }

  // 添加關閉按鈕事件
  const closeBtn = document.getElementById("btn-close-chat");
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      closeChat();
    });
  }

  // 添加發送訊息事件
  const sendBtn = document.getElementById("btn-send-message");
  const messageInput = document.getElementById("chat-message-input");

  if (sendBtn) {
    sendBtn.addEventListener("click", function () {
      sendMessage();
    });
  }

  if (messageInput) {
    messageInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }
}

/**
 * 關閉聊天窗口
 */
function closeChat() {
  const chatWidgetElement = document.querySelector(".chat-widget");
  const chatWindow = document.getElementById("chat-window");

  if (chatWindow) {
    chatWindow.classList.remove("active");
  }

  // 斷開WebSocket連線
  if (window.userProfileManager) {
    window.userProfileManager.disconnect();
  } else if (isSimpleWebSocketMode) {
    disconnectSimpleWebSocket();
  }

  // 清空聊天訊息
  const messagesContainer = document.getElementById("chat-messages");
  if (messagesContainer) {
    messagesContainer.innerHTML = "";
  }

  try {
    // 備用斷開邏輯（如果還有舊的stompClient）
    if (
      typeof stompClient !== "undefined" &&
      stompClient &&
      stompClient.connected
    ) {
      stompClient.disconnect(() => {
        console.log("備用WebSocket連線已斷開");
      });
    }
  } catch (error) {
    console.error("斷開WebSocket連線時發生錯誤:", error);
  }

  // 延遲隱藏整個聊天組件，以便動畫完成
  setTimeout(() => {
    if (chatWidgetElement) {
      chatWidgetElement.style.display = "none";
    }
  }, 300);
}

/**
 * 顯示空狀態
 * @param {string} title - 標題
 * @param {string} message - 訊息
 */
function showEmptyState(title, message) {
  const chatListContainer = document.getElementById("chat-list");
  if (!chatListContainer) return;

  chatListContainer.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-comments"></i>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
}

/**
 * 格式化日期
 * @param {Date} date - 日期對象
 * @returns {string} 格式化的日期字符串
 */
function formatDate(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (dateOnly.getTime() === today.getTime()) {
    return date.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return "昨天";
  } else {
    return date.toLocaleDateString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
    });
  }
}

// WebSocket 相關變數
let simpleStompClient = null;
let isSimpleWebSocketMode = false;

/**
 * 初始化簡化的WebSocket連接（當UserProfileManager不可用時使用）
 */
function initSimpleWebSocketConnection() {
  const memId = document.getElementById("memId").value.trim();
  const ownerId = document.getElementById("ownerId").value.trim();

  if (!memId && !ownerId) {
    console.error("無法獲取會員ID或營地主ID");
    return;
  }

  isSimpleWebSocketMode = true;

  try {
    const socket = new SockJS(`${window.api_prefix}/ws`);
    simpleStompClient = Stomp.over(socket);

    console.log("嘗試連接 WebSocket...");

    simpleStompClient.connect(
      {},
      function (frame) {
        console.log("WebSocket連接成功:", frame);

        // 訂閱個人訊息
        simpleStompClient.subscribe("/user/queue/messages", (msg) => {
          const message = JSON.parse(msg.body);
          console.log("收到個人訊息:", message);

          const time = new Date(message.chatMsgTime).toLocaleTimeString(
            "zh-TW",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          );

          // 根據訊息方向和當前頁面決定顯示類型
          const isOwnerDashboard =
            window.location.pathname.includes("owner-dashboard");
          let messageType;

          if (isOwnerDashboard) {
            // 在營地主後台：chatMsgDirect === 0 表示會員發送，顯示為 other（左側）
            // chatMsgDirect === 1 表示營地主發送，顯示為 user（右側）
            messageType = message.chatMsgDirect === 0 ? "other" : "user";
          } else {
            // 在會員頁面：chatMsgDirect === 0 表示會員發送，顯示為 user（右側）
            // chatMsgDirect === 1 表示營地主發送，顯示為 other（左側）
            messageType = message.chatMsgDirect === 0 ? "user" : "other";
          }

          addMessage(message.chatMsgContent, messageType, time);
        });

        // 訂閱聊天歷史記錄
        const historyTopic = `/topic/chat/history/${memId || ownerId}`;
        simpleStompClient.subscribe(historyTopic, (msg) => {
          const historyData = JSON.parse(msg.body);
          console.log("收到聊天歷史:", historyData);

          if (historyData && historyData.length > 0) {
            // 清空現有訊息
            const messagesContainer = document.getElementById("chat-messages");
            if (messagesContainer) {
              messagesContainer.innerHTML = "";
            }

            // 顯示歷史訊息
            historyData.forEach((msg) => {
              const time = new Date(msg.chatMsgTime).toLocaleTimeString(
                "zh-TW",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              // 根據訊息方向和當前頁面決定顯示類型
              const isOwnerDashboard =
                window.location.pathname.includes("owner-dashboard");
              let messageType;

              if (isOwnerDashboard) {
                // 在營地主後台：chatMsgDirect === 0 表示會員發送，顯示為 other（左側）
                // chatMsgDirect === 1 表示營地主發送，顯示為 user（右側）
                messageType = msg.chatMsgDirect === 0 ? "other" : "user";
              } else {
                // 在會員頁面：chatMsgDirect === 0 表示會員發送，顯示為 user（右側）
                // chatMsgDirect === 1 表示營地主發送，顯示為 other（左側）
                messageType = msg.chatMsgDirect === 0 ? "user" : "other";
              }

              addMessage(msg.chatMsgContent, messageType, time);
            });
          }
        });
        console.log("chat-management_mem:" + memId);
        console.log("chat-management_owner:" + ownerId);

        // 請求聊天歷史記錄
        const requestHistoryTopic = `/app/chat/history`;
        simpleStompClient.send(
          requestHistoryTopic,
          {},
          JSON.stringify({
            memId: parseInt(memId) || null,
            ownerId: parseInt(ownerId) || null,
          })
        );
      },
      function (error) {
        console.error("WebSocket連接錯誤:", error);
        addMessage("連接失敗，請稍後再試", "system");
      }
    );
  } catch (error) {
    console.error("WebSocket初始化錯誤:", error);
    addMessage("聊天功能暫時無法使用", "system");
  }
}

/**
 * 斷開簡化的WebSocket連接
 */
function disconnectSimpleWebSocket() {
  if (simpleStompClient && simpleStompClient.connected) {
    simpleStompClient.disconnect(() => {
      console.log("簡化WebSocket連接已斷開");
    });
    simpleStompClient = null;
  }
  isSimpleWebSocketMode = false;
}

/**
 * 發送訊息
 */
function sendMessage() {
  const messageInput = document.getElementById("chat-message-input");
  const message = messageInput.value.trim();

  if (!message) return;

  const memId = document.getElementById("memId").value.trim();
  const ownerId = document.getElementById("ownerId").value.trim();

  // 使用UserProfileManager的stompClient或簡化的stompClient
  let stompClient = null;

  if (window.userProfileManager) {
    stompClient = window.userProfileManager.stompClient;
  } else if (isSimpleWebSocketMode) {
    stompClient = simpleStompClient;
  }

  if (!stompClient || !stompClient.connected) {
    addMessage("聊天連線已斷開，請重新開啟聊天窗口", "system");
    return;
  }

  try {
    const currentMemId = parseInt(memId);
    const currentOwnerId = parseInt(ownerId);
    // 根據當前頁面決定訊息方向
    const isOwnerDashboard =
      window.location.pathname.includes("owner-dashboard");
    const chatMsgDirect = isOwnerDashboard ? 1 : 0; // 1表示營地主發送，0表示會員發送

    const chatMessage = {
      memId: currentMemId,
      ownerId: currentOwnerId,
      chatMsgContent: message,
      chatMsgTime: Date.now(),
      chatMsgDirect: chatMsgDirect,
      status: 1,
    };

    // 先在本地聊天界面顯示該消息
    const currentTime = new Date().toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
    addMessage(message, "user", currentTime);
    console.log("訊息已在本地顯示");

    stompClient.send("/app/chat.send", {}, JSON.stringify(chatMessage));
    messageInput.value = "";

    console.log("訊息已發送:", message);
  } catch (error) {
    console.error("發送訊息錯誤:", error);
    addMessage("訊息發送失敗，請稍後再試", "system");
  }
}

/**
 * 添加訊息到聊天窗口
 * @param {string} content - 訊息內容
 * @param {string} type - 訊息類型 (user, other, system)
 * @param {string} time - 時間
 */
function addMessage(content, type, time = null) {
  const messagesContainer = document.getElementById("chat-messages");
  if (!messagesContainer) return;

  // 檢查是否在營地主後台
  const isOwnerDashboard = window.location.pathname.includes("owner-dashboard");

  const messageDiv = document.createElement("div");

  // 如果沒有提供時間，使用當前時間
  if (!time) {
    time = new Date().toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (type === "user") {
    if (isOwnerDashboard) {
      // 在營地主後台，user類型表示營地主發送的訊息（顯示在右側）
      messageDiv.className = "chat-message user";
      messageDiv.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-info">${time}</div>
      `;
    } else {
      // 在會員頁面，user類型表示會員發送的訊息（顯示在右側）
      messageDiv.className = "chat-message user";
      messageDiv.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-info">${time}</div>
      `;
    }
  } else if (type === "other") {
    if (isOwnerDashboard) {
      // 在營地主後台，other類型表示會員發送的訊息（顯示在左側）
      messageDiv.className = "chat-message other";
      messageDiv.innerHTML = `
        <div class="chat-user">
          <img src="images/user-1.jpg" alt="會員">
          <span>會員</span>
        </div>
        <div class="message-content">${content}</div>
        <div class="message-info">${time}</div>
      `;
    } else {
      // 在會員頁面，other類型表示營地主發送的訊息（顯示在左側）
      messageDiv.className = "chat-message other";
      messageDiv.innerHTML = `
        <div class="chat-user">
          <img src="images/user-1.jpg" alt="客服">
          <span>客服小露</span>
        </div>
        <div class="message-content">${content}</div>
        <div class="message-info">${time}</div>
      `;
    }
  } else if (type === "system") {
    // 系統訊息
    messageDiv.innerHTML = `
      <div class="message-content system-message">${content}</div>
      <div class="message-info">${time}</div>
    `;
    messageDiv.className = `chat-message system`;
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * 格式化時間
 * @param {Date|string} time - 時間
 * @returns {string} 格式化的時間字符串
 */
function formatTime(time) {
  const date = typeof time === "string" ? new Date(time) : time;
  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 初始化聊天窗口事件監聽器
 */
function initChatEventListeners() {
  console.log("初始化聊天窗口事件監聽器");

  // 發送訊息按鈕事件
  const sendButton = document.getElementById("btn-send-message");
  if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
    console.log("已綁定發送按鈕事件");
  } else {
    console.error("找不到發送按鈕");
  }

  // 輸入框回車事件
  const messageInput = document.getElementById("chat-message-input");
  if (messageInput) {
    messageInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
    console.log("已綁定輸入框回車事件");
  } else {
    console.error("找不到訊息輸入框");
  }

  // 關閉聊天窗口事件
  const closeButton = document.getElementById("btn-close-chat");
  if (closeButton) {
    closeButton.addEventListener("click", function () {
      const chatWidget = document.querySelector(".chat-widget");
      if (chatWidget) {
        chatWidget.style.display = "none";
      }
    });
    console.log("已綁定關閉按鈕事件");
  } else {
    console.error("找不到關閉按鈕");
  }
}
