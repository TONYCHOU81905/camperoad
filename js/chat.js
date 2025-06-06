// 聊天室功能
class ChatWidget {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadInitialMessages();
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

      // 當聊天室打開時，停止圖標動畫
      if (this.isOpen) {
        chatIcon.style.animation = "none";
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

  sendMessage() {
    const messageInput = document.getElementById("chat-message-input");
    if (!messageInput) return;

    const message = messageInput.value.trim();
    if (!message) return;

    this.addMessage(message, "user");
    messageInput.value = "";

    // 模擬客服回覆
    setTimeout(() => {
      this.addAutoReply(message);
    }, 1000);
  }

  addMessage(content, sender) {
    const messagesContainer = document.getElementById("chat-messages");
    if (!messagesContainer) return;

    const messageElement = document.createElement("div");
    messageElement.className = `chat-message ${sender}`;

    const time = new Date().toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (sender === "user") {
      messageElement.innerHTML = `
                <div class="message-content">${content}</div>
                <div class="message-info">${time}</div>
            `;
    } else {
      messageElement.innerHTML = `
                <div class="chat-user">
                    <img src="images/user-1.jpg" alt="客服">
                    <span>客服小露</span>
                </div>
                <div class="message-content">${content}</div>
                <div class="message-info">${time}</div>
            `;
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  addAutoReply(userMessage) {
    let reply = "謝謝您的訊息，我們會盡快為您處理。";

    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("價格") || lowerMessage.includes("費用")) {
      reply =
        "我們的營地價格是每晚NT$ 2,800，包含基本設施使用。如需租借帳篷會有額外費用。";
    } else if (lowerMessage.includes("設施") || lowerMessage.includes("服務")) {
      reply =
        "我們提供完整的衛浴設施、餐廳、停車場、免費WiFi等服務，還有兒童遊樂區和登山步道。";
    } else if (lowerMessage.includes("預訂") || lowerMessage.includes("訂位")) {
      reply =
        "您可以直接在網站上選擇日期和人數進行預訂，或是加入購物車後一起結帳。";
    } else if (lowerMessage.includes("取消") || lowerMessage.includes("退款")) {
      reply = "我們提供入住前3天免費取消服務，可全額退款。";
    } else if (lowerMessage.includes("帳篷") || lowerMessage.includes("租借")) {
      reply =
        "我們提供帳篷租借服務：雙人帳每晚+NT$ 500、四人帳每晚+NT$ 800、六人帳每晚+NT$ 1,200。";
    } else if (
      lowerMessage.includes("交通") ||
      lowerMessage.includes("怎麼去")
    ) {
      reply =
        "營地位於新北市三峽區，距離台北市區約45分鐘車程，建議自行開車前往，我們有免費停車場。";
    }

    this.addMessage(reply, "other");
  }

  loadInitialMessages() {
    // 初始歡迎訊息已在HTML中設定
  }
}

// 初始化聊天室
document.addEventListener("DOMContentLoaded", function () {
  new ChatWidget();
});
