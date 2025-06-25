// 聊天室功能
class ChatWidget {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.stompClient = null;
    this.memId = null;
    this.ownerId = null;
    this.init();
  }

  init() {
    console.log("初始化聊天室");

    // 獲取DOM元素
    this.chatWidget = document.querySelector(".chat-widget");
    this.chatToggle = document.querySelector(".chat-toggle");
    this.chatClose = document.querySelector(".chat-close");
    this.chatMessages = document.querySelector(".chat-messages");
    this.messageInput = document.querySelector(".chat-input");
    this.sendButton = document.querySelector(".chat-send");
    this.memIdInput = document.getElementById("memId");
    this.ownerIdInput = document.getElementById("ownerId");

    // 綁定事件
    this.bindEvents();

    // 直接設置用戶ID，setupUserIds 方法內部會處理 campData 的可用性
    this.setupUserIds();
  }

  // 等待 campData 載入完成
  waitForCampData() {
    const checkInterval = 100; // 檢查間隔（毫秒）
    const maxWaitTime = 5000; // 最長等待時間（毫秒）
    let waitTime = 0;

    console.log("開始等待 campData 載入...");
    console.log("當前 URL:", window.location.href);
    console.log("URL 參數:", window.location.search);

    const checkCampData = () => {
      console.log("檢查 campData:", window.campData);

      if (
        window.campData &&
        Array.isArray(window.campData) &&
        window.campData.length > 0
      ) {
        // campData 已載入，設置用戶ID
        console.log("campData 已載入完成，長度:", window.campData.length);
        this.setupUserIds();
        return;
      }

      waitTime += checkInterval;
      if (waitTime >= maxWaitTime) {
        // 超過最長等待時間，使用備用方法設置用戶ID
        console.warn("等待 campData 載入超時，使用備用方法設置用戶ID");
        this.setupUserIds();
        return;
      }

      console.log("繼續等待 campData 載入，已等待:", waitTime, "毫秒");

      // 繼續等待
      setTimeout(checkCampData, checkInterval);
    };

    // 開始檢查
    setTimeout(checkCampData, checkInterval);
  }

  // 設置用戶ID和營地主ID
  setupUserIds() {
    console.log("執行 setupUserIds 方法");

    // 從URL獲取營地ID
    const urlParams = new URLSearchParams(window.location.search);
    // 在 campsite-detail.js 中，URL 參數名稱是 'id'
    const campId = urlParams.get("id") || "1";
    console.log("從 URL 獲取的營地ID:", campId);
    console.log("完整 URL 參數:", window.location.search);

    // 從 campData 中獲取對應的營地資料，以獲取 owner_id
    console.log(
      "window.campData 狀態:",
      window.campData ? `已載入 ${window.campData.length} 筆資料` : "未載入"
    );

    // 設置預設的 ownerId 為 campId
    let ownerId = campId;

    // 嘗試從 campData 中查找營地資料
    if (
      window.campData &&
      Array.isArray(window.campData) &&
      window.campData.length > 0
    ) {
      console.log("嘗試從 campData 中查找營地ID:", campId);
      // 嘗試將 campId 轉換為數字進行比較
      const campIdNum = parseInt(campId, 10);
      console.log("轉換後的營地ID (數字):", campIdNum);

      // 輸出前幾個營地資料，以便檢查
      console.log("前 3 筆營地資料:", window.campData.slice(0, 3));

      // 使用數字比較查找營地
      const camp = window.campData.find((c) => c.camp_id === campIdNum);
      console.log("查找結果:", camp);

      if (camp && camp.owner_id) {
        ownerId = camp.owner_id.toString();
        console.log("成功獲取營地主ID:", ownerId);
      } else {
        console.warn(
          `找不到營地ID為 ${campId} 的資料，使用 campId 作為 ownerId`
        );
      }
    } else {
      console.warn("campData 不可用，使用 campId 作為 ownerId");

      // 嘗試再次加載 campData
      if (typeof loadCampData === "function") {
        console.log("嘗試重新加載 campData");
        loadCampData()
          .then((data) => {
            console.log("重新加載 campData 完成:", data.length, "筆資料");
            // 重新嘗試設置 ownerId
            this.setupUserIds();
          })
          .catch((err) => {
            console.error("重新加載 campData 失敗:", err);
          });
      }
    }

    // 設置營地主ID
    document.getElementById("ownerId").value = ownerId;
    console.log("最終設置的營地主ID:", ownerId);

    // 獲取當前登入的會員資訊
    const memberData =
      localStorage.getItem("currentMember") ||
      sessionStorage.getItem("currentMember");
    console.log("獲取到的會員資訊:", memberData ? "已登入" : "未登入");

    if (memberData) {
      const member = JSON.parse(memberData);
      document.getElementById("memId").value = member.mem_id;
      console.log("設置會員ID:", member.mem_id);
    } else {
      // 如果未登入，可以設置一個預設值或提示用戶登入
      document.getElementById("memId").value = "guest";
      console.log("會員未登入，設置為guest");
    }
  }

  bindEvents() {
    const chatToggle = document.getElementById("chat-toggle");
    const closeBtn = document.getElementById("btn-close-chat");
    const sendBtn = document.getElementById("btn-send-message");
    const messageInput = document.getElementById("chat-message-input");

    if (chatToggle) {
      chatToggle.addEventListener("click", () => this.toggleChat());
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeChat());
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.sendMessage());
    }

    if (messageInput) {
      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.sendMessage();
        }
      });
    }
  }

  toggleChat() {
    const chatWindow = document.getElementById("chat-window");
    const chatIcon = document.getElementById("chat-toggle");
    if (chatWindow && chatIcon) {
      this.isOpen = !this.isOpen;
      chatWindow.classList.toggle("active", this.isOpen);

      // 當聊天室打開時，停止圖標動畫並連接WebSocket
      if (this.isOpen) {
        chatIcon.style.animation = "none";
        this.connect(); // 連接WebSocket
      } else {
        chatIcon.style.animation = "pulse 2s infinite";
      }
    }
  }

  closeChat() {
    const chatWindow = document.getElementById("chat-window");
    const chatIcon = document.getElementById("chat-toggle");
    if (chatWindow && chatIcon) {
      this.isOpen = false;
      chatWindow.classList.remove("active");
      chatIcon.style.animation = "pulse 2s infinite";
    }
  }

  // 連接WebSocket
  connect() {
    this.memId = document.getElementById("memId").value.trim();
    this.ownerId = document.getElementById("ownerId").value.trim();

    console.log(
      "準備連接 WebSocket，會員ID:",
      this.memId,
      "營地主ID:",
      this.ownerId
    );

    if (!this.memId || !this.ownerId) {
      this.log("⚠️ 無法建立聊天連線：缺少會員ID或營地主ID");
      return;
    }

    // 如果是訪客，顯示提示訊息
    if (this.memId === "guest") {
      this.addMessage("請先登入以使用聊天功能", "system");
      return;
    }

    // 如果已經連接，不要重複連接
    if (this.stompClient && this.stompClient.connected) {
      return;
    }

    try {
      const socket = new SockJS("http://localhost:8081/CJA101G02/ws-chat");
      this.stompClient = Stomp.over(socket);

      // 啟用 STOMP 客戶端的調試模式
      // this.stompClient.debug = function(str) {
      //   console.log("STOMP:", str);
      // };

      console.log("嘗試連接 WebSocket...");

      this.stompClient.connect(
        {},
        () => {
          this.log(`🔗 已與伺服器建立連線`);

          // 即時訊息
          this.stompClient.subscribe("/user/queue/messages", (msg) => {
            console.log("收到新訊息:", msg.body);
            const message = JSON.parse(msg.body);
            const time = this.formatTime(message.chatMsgTime);

            // 根據訊息方向決定顯示方式
            if (message.chatMsgDirect === 0) {
              // 會員發送的訊息
              this.addMessage(message.chatMsgContent, "user", time);
            } else {
              // 營地主發送的訊息
              this.addMessage(message.chatMsgContent, "other", time);
            }
          });

          // 一次性歷史訊息接收
          const historyTopic = "/user/queue/history";
          console.log("訂閱歷史訊息頻道:", historyTopic);

          this.stompClient.subscribe(historyTopic, (msg) => {
            console.log("收到歷史訊息:", msg.body);
            const messageList = JSON.parse(msg.body); // 是陣列
            if (Array.isArray(messageList)) {
              // 清空現有訊息
              const messagesContainer =
                document.getElementById("chat-messages");
              if (messagesContainer) {
                messagesContainer.innerHTML = "";
              }

              // 顯示歷史訊息
              messageList.forEach((message) => {
                const time = this.formatTime(message.chatMsgTime);
                if (message.chatMsgDirect === 0) {
                  // 會員發送的訊息
                  this.addMessage(message.chatMsgContent, "user", time);
                } else {
                  // 營地主發送的訊息
                  this.addMessage(message.chatMsgContent, "other", time);
                }
              });
            } else {
              this.log("⚠️ 歷史訊息格式錯誤");
            }
          });

          // 已讀通知（可選）
          this.stompClient.subscribe(
            "/user/" + this.memId + "/queue/read",
            (msg) => {
              const message = JSON.parse(msg.body);
              this.log(`📖 [已讀通知] ${message.chatMsgContent}`);
            }
          );

          // 發送請求歷史資料
          console.log("請求歷史訊息數據:", {
            memId: parseInt(this.memId),
            ownerId: parseInt(this.ownerId),
          });
          this.stompClient.send(
            "/app/chat.history",
            {},
            JSON.stringify({
              memId: parseInt(this.memId),
              ownerId: parseInt(this.ownerId),
            })
          );
        },
        (error) => {
          // 連接錯誤處理
          console.error("WebSocket連接錯誤:", error);
          this.addMessage("無法連接到聊天服務，請稍後再試", "system");
        }
      );
    } catch (error) {
      console.error("WebSocket初始化錯誤:", error);
      this.addMessage("聊天服務暫時不可用", "system");
    }
  }

  sendMessage() {
    const messageInput = document.getElementById("chat-message-input");
    if (!messageInput) return;

    const content = messageInput.value.trim();
    if (!content) return;

    // 如果WebSocket未連接，顯示錯誤
    if (!this.stompClient || !this.stompClient.connected) {
      this.addMessage("未連接到聊天服務，請重新開啟聊天視窗", "system");
      console.error("聊天連線尚未建立，無法發送訊息");
      return;
    }

    // 創建訊息物件
    const msg = {
      memId: parseInt(this.memId),
      ownerId: parseInt(this.ownerId),
      chatMsgContent: content,
      chatMsgDirect: 0, // 0表示會員發送
      chatMsgTime: Date.now(),
      status: 1,
    };

    console.log("準備發送訊息:", msg);

    // 先在本地聊天界面顯示該消息
    const currentTime = new Date().toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
    this.addMessage(content, "user", currentTime);
    console.log("訊息已在本地顯示");

    // 發送訊息到伺服器
    this.stompClient.send("/app/chat.send", {}, JSON.stringify(msg));
    console.log("訊息已發送到伺服器");

    // 清空輸入框
    messageInput.value = "";
    console.log("輸入框已清空");
  }

  addMessage(content, sender, time = null) {
    const messagesContainer = document.getElementById("chat-messages");
    if (!messagesContainer) return;

    const messageElement = document.createElement("div");
    messageElement.className = `chat-message ${sender}`;

    // 如果沒有提供時間，使用當前時間
    if (!time) {
      time = new Date().toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (sender === "user") {
      // 會員發送的訊息
      messageElement.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-info">${time}</div>
      `;
    } else if (sender === "other") {
      // 營地主發送的訊息
      messageElement.innerHTML = `
        <div class="chat-user">
          <img src="images/user-1.jpg" alt="客服">
          <span>客服小露</span>
        </div>
        <div class="message-content">${content}</div>
        <div class="message-info">${time}</div>
      `;
    } else if (sender === "system") {
      // 系統訊息
      messageElement.innerHTML = `
        <div class="message-content system-message">${content}</div>
        <div class="message-info">${time}</div>
      `;
      messageElement.className = `chat-message system`;
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // 格式化時間
  formatTime(millis) {
    return new Date(millis).toLocaleString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 記錄日誌（僅在控制台顯示）
  log(text) {
    console.log(text);
  }
}

// 初始化聊天室
document.addEventListener("DOMContentLoaded", function () {
  // 添加系統訊息樣式
  const style = document.createElement("style");
  style.textContent = `
    .chat-message.system .message-content {
      background-color: #f0f0f0;
      color: #666;
      border-radius: 18px;
      text-align: center;
      font-style: italic;
      max-width: 90%;
      margin: 0 auto;
    }
  `;
  document.head.appendChild(style);

  // 延遲初始化聊天室，給 campData 更多時間載入
  setTimeout(() => {
    console.log(
      "延遲初始化聊天室，campData 狀態:",
      window.campData ? window.campData.length : "未載入"
    );
    new ChatWidget();
  }, 1000); // 延遲 1 秒初始化
});
