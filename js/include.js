document.addEventListener("DOMContentLoaded", function () {
  // 導入 header 與 footer
  fetch("header.html")
    .then((res) => res.text())
    .then((html) => {
      document.getElementById("header-container").innerHTML = html;
      // header 載入完成後再載入 header.js
      var script = document.createElement('script');
      script.src = 'js/header.js';
      document.body.appendChild(script);
    });

  fetch("footer.html")
    .then((res) => res.text())
    .then((html) => {
      document.getElementById("footer-container").innerHTML = html;
    });
});

