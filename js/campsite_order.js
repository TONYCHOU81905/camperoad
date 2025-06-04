document.addEventListener("DOMContentLoaded", function () {
  // 初始化分頁功能
  initPagination();
});

function initPagination() {
  const orderTable = document.querySelector(".order-table");
  if (!orderTable) return;

  const rows = orderTable.querySelectorAll("tbody tr");
  const pageButtons = document.querySelectorAll(".page-btn.page-number");
  const prevButton = document.querySelector(".prev-page");
  const nextButton = document.querySelector(".next-page");
  const pageInfo = document.querySelector(".page-info");

  const rowsPerPage = 5;
  const totalRows = rows.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  let currentPage = 1;

  // 顯示指定頁碼的數據
  function showPage(pageNum) {
    // 隱藏所有行
    rows.forEach((row) => {
      row.classList.add("hidden-row");
    });

    // 計算當前頁的起始和結束索引
    const startIndex = (pageNum - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);

    // 顯示當前頁的行
    for (let i = startIndex; i < endIndex; i++) {
      rows[i].classList.remove("hidden-row");
    }

    // 更新頁碼信息
    pageInfo.textContent = `顯示 ${
      startIndex + 1
    }-${endIndex} 筆，共 ${totalRows} 筆`;

    // 更新頁碼按鈕狀態
    pageButtons.forEach((button, index) => {
      if (index + 1 === pageNum) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });

    // 更新上一頁/下一頁按鈕狀態
    prevButton.disabled = pageNum === 1;
    nextButton.disabled = pageNum === totalPages;

    // 更新當前頁碼
    currentPage = pageNum;
  }

  // 初始顯示第一頁
  showPage(1);

  // 為頁碼按鈕添加點擊事件
  pageButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      showPage(index + 1);
    });
  });

  // 為上一頁按鈕添加點擊事件
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      showPage(currentPage - 1);
    }
  });

  // 為下一頁按鈕添加點擊事件
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      showPage(currentPage + 1);
    }
  });
}
