/**
 * 營地詳情頁面 JavaScript
 */

document.addEventListener("DOMContentLoaded", function () {
  // 初始化頁面
  initDetailPage();
});

/**
 * 初始化詳情頁面
 */
function initDetailPage() {
  // 初始化日期選擇器
  initDatePickers();

  // 初始化預訂按鈕
  initBookingButton();
}

/**
 * 初始化日期選擇器
 */
function initDatePickers() {
  // 獲取日期輸入元素
  const checkInInput = document.getElementById("check-in-date");
  const checkOutInput = document.getElementById("check-out-date");

  if (checkInInput && checkOutInput) {
    // 設置最小日期為今天
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = formatDateForInput(today);
    const tomorrowStr = formatDateForInput(tomorrow);

    checkInInput.min = todayStr;
    checkOutInput.min = tomorrowStr;

    // 當入住日期變更時，更新退房日期的最小值
    checkInInput.addEventListener("change", function () {
      const selectedDate = new Date(this.value);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      checkOutInput.min = formatDateForInput(nextDay);

      // 如果退房日期早於新的最小日期，則更新退房日期
      if (new Date(checkOutInput.value) <= selectedDate) {
        checkOutInput.value = formatDateForInput(nextDay);
      }
    });
  }
}

/**
 * 格式化日期為輸入框格式 (YYYY-MM-DD)
 * @param {Date} date - 日期對象
 * @returns {string} 格式化的日期字符串
 */
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 初始化預訂按鈕
 */
function initBookingButton() {
  const bookButton = document.getElementById("btn-book");

  if (bookButton) {
    bookButton.addEventListener("click", function () {
      // 獲取表單數據
      const checkInDate = document.getElementById("check-in-date").value;
      const checkOutDate = document.getElementById("check-out-date").value;
      const guests = document.getElementById("guests").value;
      const tentType = document.getElementById("tent-type").value;

      // 驗證日期
      if (!checkInDate || !checkOutDate) {
        alert("請選擇入住和退房日期");
        return;
      }

      // 獲取營地ID (從URL參數)
      const urlParams = new URLSearchParams(window.location.search);
      const campsiteId = urlParams.get("id") || "1";

      // 構建預訂頁面URL
      const bookingUrl = `campsite-booking.html?id=${campsiteId}&checkin=${checkInDate}&checkout=${checkOutDate}&guests=${guests}&tent=${tentType}`;

      // 導航到預訂頁面
      window.location.href = bookingUrl;
    });
  }
}
