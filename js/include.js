document.addEventListener("DOMContentLoaded", function () {
     // 導入 header 與 footer
    fetch("header.html")
      .then((res) => res.text())
      .then((html) => {
        document.getElementById("header-container").innerHTML = html;
      });
  
    fetch("footer.html")
      .then((res) => res.text())
      .then((html) => {
        document.getElementById("footer-container").innerHTML = html;
      });
  });
