/**
 * 聊天室組件 - 適用於user-profile.html和campsite-detail.html
 */

class ChatWidget {
  constructor() {
    this.stompClient = null;
    this.chatId = null;
    this.memId = null;
    this.ownerId = null;
    this.isConnected = false;
    this.isVisitor = false;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // 初始重連延遲 2 秒
    this.hasSubscribedMessages = false; // 避免重複訂閱

    this.init();
  }

  init() {
    this.getElements();
    this.bindEvents();
    this.setupIds();
  }

  getElements() {
    // 聊天室元素
    this.chatIcon = document.getElementById("chat-icon");
    this.chatWindow = document.getElementById("chat-window");
    this.closeBtn = document.getElementById("btn-close-chat");
    this.messagesContainer = document.getElementById("chat-messages");
    this.messageInput = document.getElementById("message-input");
    this.sendBtn = document.getElementById("btn-send");
  }

  bindEvents() {
    // 綁定聊天室開關事件
    if (this.chatIcon) {
      this.chatIcon.addEventListener("click", () => this.toggleChat());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.closeChat());
    }

    // 綁定發送訊息事件
    if (this.sendBtn) {
      this.sendBtn.addEventListener("click", () => this.sendMessage());
    }

    if (this.messageInput) {
      this.messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }

  setupIds() {
    // 從隱藏輸入框獲取會員ID和營地主ID
    const memIdInput = document.getElementById("memId");
    const ownerIdInput = document.getElementById("ownerId");

    if (memIdInput) {
      this.memId = memIdInput.value;
    }

    if (ownerIdInput) {
      this.ownerId = ownerIdInput.value;
    }

    // 如果沒有設置會員ID或營地主ID，嘗試從URL參數獲取
    if (!this.memId || !this.ownerId) {
      const urlParams = new URLSearchParams(window.location.search);
      const campId = urlParams.get("id");

      // 如果有營地ID，嘗試從campData獲取營地主ID
      if (campId && window.campData) {
        const camp = window.campData.find((c) => c.camp_id == campId);
        if (camp) {
          this.ownerId = camp.owner_id;
        }
      }

      // 從localStorage或sessionStorage獲取會員ID
      const memberData =
        localStorage.getItem("currentMember") ||
        sessionStorage.getItem("currentMember");

      if (memberData) {
        const member = JSON.parse(memberData);
        this.memId = member.mem_id;
      }
    }

    // 如果有會員ID和營地主ID，則生成聊天ID
    if (this.memId && this.ownerId) {
      this.chatId = `CTOROOM:${this.ownerId}:${this.memId}`;
      this.log(`聊天ID: ${this.chatId}`);
    } else {
      this.log("無法獲取會員ID或營地主ID");
    }
  }

  toggleChat() {
    if (this.chatWindow) {
      if (this.chatWindow.classList.contains("active")) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }
  }

  openChat() {
    if (this.chatWindow) {
      this.chatWindow.classList.add("active");
      // 如果尚未連接，則連接WebSocket
      if (!this.isConnected) {
        this.connect();
      }
    }
  }

  closeChat() {
    if (this.chatWindow) {
      this.chatWindow.classList.remove("active");
    }
  }

  connect() {
    if (!this.memId || !this.ownerId || !this.chatId) {
      this.log("缺少必要的ID，無法連接");
      this.displayMessage(
        "system",
        "無法建立聊天連接，請確保您已登入並選擇了營地",
        Date.now()
      );
      return;
    }

    // 檢查是否為訪客（未登入用戶）
    if (this.memId === "visitor") {
      this.isVisitor = true;
      this.displayMessage(
        "system",
        "您目前以訪客身份瀏覽，請登入後使用聊天功能",
        Date.now()
      );
      return;
    }

    // 如果正在重新連接，顯示提示
    if (this.isReconnecting) {
      this.displayMessage(
        "system",
        `正在嘗試重新連接... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
        Date.now()
      );
    }

    // 建立WebSocket連接
    const socket = new SockJS(`${window.api_prefix}/ws-chat`);
    this.stompClient = Stomp.over(socket);

    // 禁用調試日誌
    this.stompClient.debug = null;

    this.stompClient.connect(
      {},
      (frame) => {
        this.isConnected = true;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;

        this.log("WebSocket連接成功");
        this.displayMessage("system", "聊天室已連接", Date.now());

        // 訂閱即時消息 - 避免重複訂閱
        if (!this.hasSubscribedMessages) {
          this.stompClient.subscribe(`/topic/${this.chatId}`, (message) => {
            const messageData = JSON.parse(message.body);
            this.log("收到消息:", messageData);
            console.log("✅ 收到訊息:", messageData);

            // 加入排除自己發送的訊息（防止本地與推播重複）
            if (messageData.senderId == this.memId) {
              return; // 忽略自己已顯示的訊息
            }

            // 顯示消息
            this.displayMessage(
              messageData.senderId == this.memId ? "self" : "other",
              messageData.content,
              messageData.timestamp
            );
          });

          this.hasSubscribedMessages = true;
        }

        // 訂閱歷史消息
        this.stompClient.subscribe(
          `/user/${this.memId}/queue/history`,
          (message) => {
            const historyData = JSON.parse(message.body);
            this.log("收到歷史消息:", historyData);

            // 清空消息容器
            if (this.messagesContainer) {
              this.messagesContainer.innerHTML = "";
            }

            // 顯示歷史消息
            historyData.forEach((msg) => {
              this.displayMessage(
                msg.senderId == this.memId ? "self" : "other",
                msg.content,
                msg.timestamp
              );
            });

            // 如果沒有歷史消息，顯示歡迎消息
            if (historyData.length === 0) {
              this.displayMessage(
                "system",
                "歡迎使用聊天功能，有任何問題都可以向我們詢問",
                Date.now()
              );
            }
          }
        );

        // 訂閱已讀通知
        this.stompClient.subscribe(
          `/user/${this.memId}/queue/read`,
          (message) => {
            const readData = JSON.parse(message.body);
            this.log("收到已讀通知:", readData);
            // 可以在這裡處理已讀通知，例如更新UI
          }
        );

        // 發送請求獲取歷史消息

        const currentMemId = parseInt(this.memId);
        const currentOwnerId = parseInt(this.ownerId);
        this.stompClient.send(
          "/app/chat.history",
          {},
          JSON.stringify({
            memId: currentMemId,
            ownerId: currentOwnerId,
          })
        );
      },
      (error) => {
        this.isConnected = false;
        this.hasSubscribedMessages = false; // 重置訂閱標誌
        this.log("WebSocket連接錯誤:", error);
        this.displayMessage("system", "聊天室連接失敗，請稍後再試", Date.now());

        // 嘗試重新連接
        this.attemptReconnect();
      }
    );
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.isReconnecting = true;
      this.reconnectAttempts++;

      // 使用指數退避策略增加重連延遲
      const delay =
        this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

      this.log(
        `嘗試重新連接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})，延遲 ${delay}ms`
      );

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.isReconnecting = false;
      this.log("重連失敗，已達到最大重試次數");
      this.displayMessage(
        "system",
        "無法連接到聊天服務器，請稍後再試或刷新頁面",
        Date.now()
      );
    }
  }

  sendMessage() {
    if (!this.messageInput || !this.stompClient || !this.isConnected) return;

    const content = this.messageInput.value.trim();
    if (!content) return;

    // 清空輸入框
    this.messageInput.value = "";

    // 創建消息對象
    const currentMemId = this.memId;
    const currentOwnerId = this.ownerId;
    const message = {
      chatId: this.chatId,
      senderId: currentMemId,
      receiverId: currentOwnerId,
      content: content,
      timestamp: Date.now(),
    };

    // 發送消息
    this.stompClient.send("/app/chat", {}, JSON.stringify(message));

    // 在本地顯示消息
    this.displayMessage("self", content, message.timestamp);
  }

  displayMessage(sender, content, timestamp) {
    if (!this.messagesContainer) return;

    const messageElement = document.createElement("div");
    messageElement.className = `chat-message ${sender}`;

    const time = this.formatTime(timestamp);

    if (sender === "self") {
      // 自己發送的訊息
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

    this.messagesContainer.appendChild(messageElement);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
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

// 添加系統訊息樣式
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
});
