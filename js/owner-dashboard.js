// 營地主後台管理系統
class OwnerDashboard {
  constructor() {
    this.currentOwner = null;
    this.campData = null;
    this.campsiteData = [];
    this.bundleItemData = [];
    this.orderData = [];
    this.discountCodeData = [];
    this.init();
  }

  async init() {
    try {
      // 檢查登入狀態
      this.checkLoginStatus();

      // 載入所有資料
      await this.loadAllData();

      // 初始化UI（在載入資料後）
      this.initUI();

      // 更新營地主資訊（在載入資料後）
      this.updateOwnerInfo();

      // 綁定事件
      this.bindEvents();

      // 從 localStorage 獲取上次訪問的頁面，如果沒有則顯示房型管理頁面
      const lastTab =
        localStorage.getItem("ownerDashboardLastTab") || "room-types";
      this.showTabContent(lastTab);

      // 更新選單狀態
      document.querySelectorAll(".profile-menu-item").forEach((menuItem) => {
        menuItem.classList.remove("active");
      });
      const activeMenuItem = document.querySelector(
        `.profile-menu-item[data-tab="${lastTab}"]`
      );
      if (activeMenuItem) {
        activeMenuItem.classList.add("active");
      }
    } catch (error) {
      console.error("初始化營地主後台失敗：", error);
      this.showMessage(`初始化營地主後台失敗：${error.message}`, "error");
    }
  }

  checkLoginStatus() {
    try {
      const savedOwner =
        localStorage.getItem("currentOwner") ||
        sessionStorage.getItem("currentOwner");
      if (!savedOwner) {
        alert("請先登入營地主帳號");
        window.location.href = "login.html";
        return;
      }

      this.currentOwner = JSON.parse(savedOwner);

      if (!this.currentOwner || !this.currentOwner.owner_id) {
        alert("營地主登入資料無效，請重新登入");
        localStorage.removeItem("currentOwner");
        sessionStorage.removeItem("currentOwner");
        window.location.href = "login.html";
        return;
      }
    } catch (error) {
      console.error("檢查登入狀態時發生錯誤：", error);
      alert("登入狀態檢查失敗，請重新登入");
      localStorage.removeItem("currentOwner");
      sessionStorage.removeItem("currentOwner");
      window.location.href = "login.html";
    }
  }

  updateOwnerInfo() {
    try {
      if (!this.currentOwner) {
        throw new Error("無法更新營地主資訊：缺少營地主資料");
      }


      // 右上角下拉選單
      const ownerProfileSelect = document.getElementById("ownerProfileSelect");
      if (ownerProfileSelect) {
        // 產生選項
        ownerProfileSelect.innerHTML = this.allCamps.map(camp =>
          `<option value="${camp.camp_id}">${camp.camp_id} - ${camp.camp_name}</option>`
        ).join("");
        // 設定預設值
        if (this.campData) ownerProfileSelect.value = this.campData.camp_id;
        // 綁定切換事件
        ownerProfileSelect.onchange = async () => {
          const campId = ownerProfileSelect.value;
          await this.loadCampsiteTypesByCampId(campId);
          // 重新載入該營地的相關資料
          const campsiteResponse = await fetch("data/campsite.json");
          if (campsiteResponse.ok) {
            const allCampsites = await campsiteResponse.json();
            this.campsiteData = allCampsites.filter(campsite => campsite.camp_id == campId);

          }
          const bundleResponse = await fetch("data/bundle_item.json");
          if (bundleResponse.ok) {
            const allBundles = await bundleResponse.json();
            this.bundleItemData = allBundles.filter(bundle => bundle.camp_id == campId);
          }
          const orderResponse = await fetch("data/campsite_order.json");
          if (orderResponse.ok) {
            const allOrders = await orderResponse.json();
            this.orderData = allOrders.filter(order => order.camp_id == campId);
          }
          // 更新營地基本資料表單
          this.campData = this.allCamps.find(camp => camp.camp_id == campId);
          this.initCampInfoForm();
          this.updateOwnerInfo();
          // 重新渲染所有頁面資料
          await this.renderRoomTypes().catch(error => {
            console.error("重新渲染房型列表失敗：", error);
          });
          this.renderBundleItems();
          this.renderOrders();
        };
      }
    } catch (error) {
      console.error("更新營地主資訊失敗：", error);
      this.showMessage(`更新營地主資訊失敗：${error.message}`, "error");
    }
  }

  async loadAllData() {
    try {
      if (!this.currentOwner || !this.currentOwner.owner_id) {
        console.error("無法載入資料：缺少營地主資料");
        return;
      }

      // 載入營地資料，只載入當前營地主的營地
      const campResponse = await fetch("data/camp.json");
      if (!campResponse.ok) {
        throw new Error(`載入營地資料失敗：${campResponse.status}`);
      }
      const allCamps = await campResponse.json();

      // 根據登入的營地主ID篩選營地

      this.allCamps = allCamps.filter(camp => String(camp.owner_id) == String(this.currentOwner.owner_id));
      

      // 如果該營地主沒有營地，顯示提示訊息
      if (this.allCamps.length === 0) {
        this.showMessage("您目前沒有營地資料，請先新增營地", "warning");
        // 不要呼叫 this.initUI();
        return;
      }

      // 預設選擇第一個營地
      this.campData = this.allCamps[0];

      // 載入營地房間資料
      const campsiteResponse = await fetch("data/campsite.json");
      if (!campsiteResponse.ok) {
        throw new Error(`載入營地房間資料失敗：${campsiteResponse.status}`);
      }
      const allCampsites = await campsiteResponse.json();
      this.campsiteData = allCampsites.filter(
        (campsite) =>
          this.campData && campsite.camp_id === this.campData.camp_id
      );

      // 載入加購商品資料
      const bundleResponse = await fetch("data/bundle_item.json");
      if (!bundleResponse.ok) {
        throw new Error(`載入加購商品資料失敗：${bundleResponse.status}`);
      }
      const allBundles = await bundleResponse.json();
      this.bundleItemData = allBundles.filter(
        (bundle) => this.campData && bundle.camp_id === this.campData.camp_id
      );

      // 載入訂單資料
      const orderResponse = await fetch("data/campsite_order.json");
      if (!orderResponse.ok) {
        throw new Error(`載入訂單資料失敗：${orderResponse.status}`);
      }
      const allOrders = await orderResponse.json();
      this.orderData = allOrders.filter(
        (order) => this.campData && order.camp_id === this.campData.camp_id
      );

      // 載入訂單詳細資料
      const orderDetailsResponse = await fetch(
        "data/campsite_order_details.json"
      );
      if (!orderDetailsResponse.ok) {
        throw new Error(`載入訂單詳細資料失敗：${orderDetailsResponse.status}`);
      }
      this.orderDetails = await orderDetailsResponse.json();

      // 載入折價券資料
      const discountResponse = await fetch("data/discount_code.json");
      if (!discountResponse.ok) {
        throw new Error(`載入折價券資料失敗：${discountResponse.status}`);
      }
      this.discountCodeData = await discountResponse.json();
      // 新增：初始化時直接渲染房型管理
      await this.renderRoomTypes();

      // 載入會員資料
      const memberResponse = await fetch("data/mem.json");
      if (!memberResponse.ok) {
        throw new Error(`載入會員資料失敗：${memberResponse.status}`);
      }
      this.memberData = await memberResponse.json();

      // 初始化下拉選單（在所有資料載入完成後）
      await this.initCampIdSelect();
    } catch (error) {
      console.error("載入資料失敗：", error);
      this.showMessage(`載入資料失敗：${error.message}`, "error");
    }
  }

  initUI() {
    try {
      // 初始化營地基本資料表單（只在有營地資料時）
      if (this.campData) {
        this.initCampInfoForm();
      }
    } catch (error) {
      console.error("初始化UI失敗：", error);
      this.showMessage(`初始化UI失敗：${error.message}`, "error");
    }
  }

  initCampInfoForm() {
    try {
      if (!this.campData) {
        throw new Error("無法初始化營地基本資料表單：缺少營地資料");
      }

      const form = document.getElementById("campInfoForm");
      if (!form) {
        throw new Error("找不到營地基本資料表單");
      }

      // 填入現有資料
      const fields = {
        "camp-name": this.campData.camp_name,
        "camp-location":
          this.campData.camp_city +
          this.campData.camp_dist +
          this.campData.camp_addr,
        "camp-status": this.campData.camp_release_status,
        "camp-score":
          this.campData.camp_comment_number_count > 0
            ? (
                this.campData.camp_comment_sun_score /
                this.campData.camp_comment_number_count
              ).toFixed(1)
            : "0.0",
        "camp-description": this.campData.camp_content || "",
      };

      Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
      });

      // 初始化營地照片顯示
      this.renderCampImages();
    } catch (error) {
      console.error("初始化營地基本資料表單失敗：", error);
      this.showMessage(`初始化營地基本資料表單失敗：${error.message}`, "error");
    }
  }

  // 檢查圖片是否存在的輔助函數
  checkImageExists(url) {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      } catch (error) {
        console.error("檢查圖片存在性時發生錯誤：", error);
        resolve(false);
      }
    });
  }

  async renderCampImages() {
    try {
      if (!this.campData || !this.campData.camp_id) {
        throw new Error("無法渲染營地圖片：缺少營地資料或營地ID");
      }

      const campId = this.campData.camp_id;
      const defaultImagePath = "images/camp-1.jpg";

      for (let i = 1; i <= 4; i++) {
        const container = document.getElementById(`campImage${i}Container`);
        if (!container) continue;

        // 檢查是否有圖片數據
        // const hasImageData = this.campData[`camp_pic${i}`];
        const hasImageData = true;
        if (hasImageData) {
          // 構建API圖片URL
          const apiImageUrl = `http://localhost:8081/CJA101G02/api/camps/${campId}/${i}`;
          console.log("apiImageUrl:" + apiImageUrl);

          // 檢查API圖片是否可訪問
          const apiImageExists = await this.checkImageExists(apiImageUrl);
          console.log(i + ":" + apiImageExists);

          // 決定使用哪個圖片URL
          const imageUrl = apiImageExists ? apiImageUrl : defaultImagePath;
          const imageSource = apiImageExists
            ? apiImageUrl
            : this.campData[`camp_pic${i}`] || defaultImagePath;

          container.innerHTML = `
            <div class="image-container">
              <img src="${imageUrl}" class="thumbnail" onclick="ownerDashboard.showCampImageModal('${imageSource}', ${i})" />
              <div class="image-actions">
                <button class="btn btn-sm btn-camping" onclick="ownerDashboard.uploadCampImage(${i})"><i class="fas fa-upload"></i></button>
                <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteCampImage(${i})"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="image-placeholder" onclick="ownerDashboard.uploadCampImage(${i})">
              <i class="fas fa-plus"></i>
              <span>上傳圖片</span>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error("渲染營地圖片失敗：", error);
      this.showMessage(`渲染營地圖片失敗：${error.message}`, "error");
    }
  }

  bindEvents() {
    // 側邊選單切換
    document
      .querySelectorAll(".profile-menu-item[data-tab]")
      .forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const tab = item.getAttribute("data-tab");
          this.showTabContent(tab);

          // 更新選單狀態
          document
            .querySelectorAll(".profile-menu-item")
            .forEach((menuItem) => {
              menuItem.classList.remove("active");
            });
          item.classList.add("active");
        });
      });

    // 登出按鈕
    // 處理登出按鈕（側邊欄中的登出按鈕）
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // 營地資料表單
    const campInfoForm = document.getElementById("campInfoForm");
    if (campInfoForm) {
      campInfoForm.addEventListener("submit", (e) =>
        this.handleCampInfoUpdate(e)
      );
    }

    // 新增房型按鈕 - 現在使用Bootstrap data屬性控制
    // const addRoomTypeBtn = document.getElementById("addRoomTypeBtn");
    // if (addRoomTypeBtn) {
    //   addRoomTypeBtn.addEventListener("click", () =>
    //     this.showAddRoomTypeModal()
    //   );
    // }

    // 新增加購商品按鈕
    const addBundleItemBtn = document.getElementById("addBundleItemBtn");
    if (addBundleItemBtn) {
      addBundleItemBtn.addEventListener("click", () =>
        this.showAddBundleItemModal()
      );
    }

    // 新增折價券按鈕
    const addDiscountCodeBtn = document.getElementById("addDiscountCodeBtn");
    if (addDiscountCodeBtn) {
      addDiscountCodeBtn.addEventListener("click", () =>
        this.showAddDiscountCodeModal()
      );
    }

    // 模態框事件
    this.bindModalEvents();

    // 綁定編輯房型表單送出
    const editForm = document.getElementById("editRoomTypeForm");
    if (editForm) {
      editForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(editForm);
        const roomTypeData = {
          id: {
            campId: parseInt(formData.get("campId")),
            campsiteTypeId: parseInt(formData.get("campsiteTypeId")),
          },
          campsiteName: formData.get("campsiteName"),
          campsitePeople: parseInt(formData.get("campsitePeople")),
          campsiteNum: parseInt(formData.get("campsiteNum")),
          campsitePrice: parseInt(formData.get("campsitePrice")),
          campsitePic1: formData.get("campsitePic1") || null,
          campsitePic2: formData.get("campsitePic2") || null,
          campsitePic3: formData.get("campsitePic3") || null,
          campsitePic4: formData.get("campsitePic4") || null,
        };
        // 呼叫 API
        const response = await fetch(
          "http://localhost:8081/CJA101G02/campsitetype/updateCampsiteType",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(roomTypeData),
          }
        );
        const result = await response.json();
        if (result.status === "success") {
          // 關閉 modal
          bootstrap.Modal.getInstance(
            document.getElementById("editRoomTypeModal")
          ).hide();
          this.showMessage("房型修改成功！", "success");
          // 重新載入房型資料
          await this.loadCampsiteTypesByCampId(roomTypeData.id.campId);
        } else {
          this.showMessage(
            "房型修改失敗：" + (result.message || "未知錯誤"),
            "error"
          );
        }
      };
    }

    // 綁定新增房間表單送出
    const addRoomForm = document.getElementById("addRoomForm");
    if (addRoomForm) {
      addRoomForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(addRoomForm);

        const data = {
          campsiteIdName: formData.get("campsiteIdName"),

          camperName: null,
          campId: parseInt(formData.get("campId")),
          campsiteTypeId: parseInt(formData.get("campsiteTypeId"))
        };
        try {
          const response = await fetch("http://localhost:8081/CJA101G02/campsite/addCampsite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });
          if (!response.ok) throw new Error(`新增房間失敗：${response.status}`);
          const result = await response.json();

          if (result.status === "success") {
            // 改用標準bootstrap.Modal關閉modal，避免抖動
            const modal = bootstrap.Modal.getInstance(document.getElementById("addRoomModal"));
            if (modal) modal.hide();
            this.showMessage("房間新增成功！", "success");

            await this.showRoomDetails(data.campsiteTypeId);
            this.renderRoomTypes().catch(error => {

              console.error("重新渲染房型列表失敗：", error);
            });
          } else {
            this.showMessage(
              "房間新增失敗：" + (result.message || "未知錯誤"),
              "error"
            );
          }
        } catch (error) {
          this.showMessage(`新增房間失敗：${error.message}`, "error");
        }
      };
    }

    // 綁定編輯房間表單送出
    const editRoomForm = document.getElementById("editRoomForm");
    if (editRoomForm) {
      editRoomForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(editRoomForm);
        const data = {
          campsiteId: parseInt(formData.get("campsiteId")),
          campsiteIdName: formData.get("campsiteIdName"),
          camperName: formData.get("camperName"),
          campsiteType: {
            id: {
              campsiteTypeId: parseInt(formData.get("campsiteTypeId")),
              campId: parseInt(formData.get("campId"))
            }
          }
        };
        try {
          const response = await fetch("http://localhost:8081/CJA101G02/campsite/updateCampsite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });
          if (!response.ok) throw new Error(`編輯房間失敗：${response.status}`);
          const result = await response.json();
          if (result.status === "success") {
            // 改用標準bootstrap.Modal關閉modal，避免抖動
            const modal = bootstrap.Modal.getInstance(document.getElementById("editRoomModal"));
            if (modal) modal.hide();
            this.showMessage("房間編輯成功！", "success");
            await this.showRoomDetails(data.campsiteType.id.campsiteTypeId);
          } else {
            this.showMessage("房間編輯失敗：" + (result.message || "未知錯誤"), "error");
          }
        } catch (error) {
          this.showMessage(`房間編輯失敗：${error.message}`, "error");
        }
      };
    }

    // 綁定房間明細modal的關閉事件
    const roomDetailModal = document.getElementById("roomDetailModal");
    if (roomDetailModal) {
      roomDetailModal.addEventListener("hidden.bs.modal", () => {
        // 當modal關閉時，確保清除背景遮罩
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      });
    }
  }

  bindModalEvents() {
    // 房型模態框
    const roomTypeModal = document.getElementById("addRoomTypeModal");
    const closeRoomTypeModal = document.getElementById("closeRoomTypeModal");
    const cancelRoomType = document.getElementById("cancelRoomType");
    const addRoomTypeForm = document.getElementById("addRoomTypeForm");

    if (closeRoomTypeModal) {
      closeRoomTypeModal.addEventListener("click", () =>
        this.hideModal("addRoomTypeModal")
      );
    }
    if (cancelRoomType) {
      cancelRoomType.addEventListener("click", () =>
        this.hideModal("addRoomTypeModal")
      );
    }
    if (addRoomTypeForm) {
      addRoomTypeForm.addEventListener("submit", (e) =>
        this.handleAddRoomType(e)
      );
    }

    // 編輯房型表單
    const editRoomTypeForm = document.getElementById("editRoomTypeForm");
    if (editRoomTypeForm) {
      editRoomTypeForm.addEventListener("submit", (e) =>
        this.handleEditRoomType(e)
      );
    }

    // 加購商品模態框
    const closeBundleItemModal = document.getElementById(
      "closeBundleItemModal"
    );
    const cancelBundleItem = document.getElementById("cancelBundleItem");
    const addBundleItemForm = document.getElementById("addBundleItemForm");

    if (closeBundleItemModal) {
      closeBundleItemModal.addEventListener("click", () =>
        this.hideModal("addBundleItemModal")
      );
    }
    if (cancelBundleItem) {
      cancelBundleItem.addEventListener("click", () =>
        this.hideModal("addBundleItemModal")
      );
    }
    if (addBundleItemForm) {
      addBundleItemForm.addEventListener("submit", (e) =>
        this.handleAddBundleItem(e)
      );
    }

    // 折價券模態框
    const closeDiscountCodeModal = document.getElementById(
      "closeDiscountCodeModal"
    );
    const cancelDiscountCode = document.getElementById("cancelDiscountCode");
    const addDiscountCodeForm = document.getElementById("addDiscountCodeForm");

    if (closeDiscountCodeModal) {
      closeDiscountCodeModal.addEventListener("click", () =>
        this.hideModal("addDiscountCodeModal")
      );
    }
    if (cancelDiscountCode) {
      cancelDiscountCode.addEventListener("click", () =>
        this.hideModal("addDiscountCodeModal")
      );
    }
    if (addDiscountCodeForm) {
      addDiscountCodeForm.addEventListener("submit", (e) =>
        this.handleAddDiscountCode(e)
      );
    }

    // 折價券表單驗證
    const discountTypeSelect = document.getElementById("discount-type");
    const discountValueInput = document.getElementById("discount-value");
    const startDateInput = document.getElementById("discount-start-date");
    const endDateInput = document.getElementById("discount-end-date");

    if (discountTypeSelect && discountValueInput) {
      discountTypeSelect.addEventListener("change", () => {
        const discountType = parseInt(discountTypeSelect.value);
        if (discountType === 1) {
          // 百分比折扣
          discountValueInput.setAttribute("max", "0.99");
          discountValueInput.setAttribute("step", "0.01");
          discountValueInput.setAttribute("placeholder", "例如：0.1 (代表10%)");
          discountValueInput.removeAttribute("min");
        } else {
          // 固定金額折扣
          discountValueInput.setAttribute("min", "1");
          discountValueInput.setAttribute("step", "1");
          discountValueInput.setAttribute("placeholder", "例如：100");
          discountValueInput.removeAttribute("max");
        }
        discountValueInput.value = ""; // 清空輸入值
      });

      // 初始化設定
      discountTypeSelect.dispatchEvent(new Event("change"));
    }

    if (startDateInput && endDateInput) {
      startDateInput.addEventListener("change", () => {
        const startDate = startDateInput.value;
        if (startDate) {
          // 設定結束日期的最小值為開始日期的隔天
          const minEndDate = new Date(startDate);
          minEndDate.setDate(minEndDate.getDate() + 1);
          endDateInput.setAttribute(
            "min",
            minEndDate.toISOString().split("T")[0]
          );

          // 如果當前結束日期早於或等於開始日期，清空結束日期
          if (
            endDateInput.value &&
            new Date(endDateInput.value) <= new Date(startDate)
          ) {
            endDateInput.value = "";
          }
        }
      });
    }

    // 訂單狀態篩選
    const orderStatusFilter = document.getElementById("orderStatusFilter");
    if (orderStatusFilter) {
      orderStatusFilter.addEventListener("change", () => this.renderOrders());
    }
  }

  showTabContent(tabName) {
    // 隱藏所有內容
    document.querySelectorAll(".profile-section").forEach((content) => {
      content.classList.remove("active");
    });

    // 顯示指定內容
    const targetContent = document.getElementById(tabName);
    if (targetContent) {
      targetContent.classList.add("active");
    }

    // 保存當前頁面到 localStorage
    localStorage.setItem("ownerDashboardLastTab", tabName);

    // 根據不同頁面載入對應資料
    switch (tabName) {
      case "room-types":
        this.renderRoomTypes().catch((error) => {
          console.error("載入房型資料失敗：", error);
        });
        break;
      case "bundle-items":
        this.renderBundleItems();
        break;
      case "orders":
        this.renderOrders();
        break;
      case "discount-codes":
        this.renderDiscountCodes();
        break;
      case "chat-management":
        this.initChatManagement();
        console.log("初始化聊天管理");
        break;
    }
  }
  async renderRoomTypes() {
    console.log("renderRoomTypes called");

    const tableBody = document.getElementById("roomTypesTableBody");
    if (!tableBody) {
      console.error("找不到房型表格主體元素");
      return;
    }
    // 取得當前選中的營地ID
    let campId = null;
    const ownerProfileSelect = document.getElementById("ownerProfileSelect");
    if (ownerProfileSelect && ownerProfileSelect.value) {
      campId = ownerProfileSelect.value;
    } else if (this.campData && this.campData.camp_id) {
      campId = this.campData.camp_id;
    }
    if (!campId) {
      console.warn("無法取得當前營地ID，無法載入房型資料");
      tableBody.innerHTML = '<tr><td colspan="9" class="text-center">無法取得營地ID，請先選擇營地</td></tr>';
      return;
    }

    // 直接呼叫API取得房型資料
    try {
      const apiUrl = `http://localhost:8081/CJA101G02/campsitetype/${campId}/getCampsiteTypes`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API回應失敗：${response.status}`);
      const result = await response.json();
      this.campsiteTypeData = Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error("取得房型資料失敗：", error);
      tableBody.innerHTML = '<tr><td colspan="9" class="text-center">載入房型資料失敗</td></tr>';
      return;
    }
    // ... existing code ...
    if (!this.campsiteTypeData || this.campsiteTypeData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" class="text-center">尚未設定任何房型</td></tr>';
      return;
    }
    // 取得所有房型的房間數量
    const roomTypePromises = this.campsiteTypeData.map(async (roomType) => {
      const roomTypeId = roomType.campsiteTypeId;
      let actualRoomCount = 0;
      try {
        const campId = roomType.campId;
        const apiUrl = `http://localhost:8081/CJA101G02/campsitetype/${roomTypeId}/${campId}/getcampsites`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const result = await response.json();
          actualRoomCount = Array.isArray(result.data) ? result.data.length : 0;
        }
      } catch (error) {
        actualRoomCount = 0;
      }
      return { roomType, actualRoomCount };
    });
    const roomTypeData = await Promise.all(roomTypePromises);
    const html = roomTypeData.map(({ roomType, actualRoomCount }) => `
      <tr>
        <td>${roomType.campsiteName || ""}</td>
        <td>
          <button class="btn btn-link p-0" onclick="ownerDashboard.showRoomDetails(${roomType.campsiteTypeId})">
            ${actualRoomCount} 間
          </button>
        </td>
        <td>${roomType.campsitePeople || ""} 人</td>
        <td>NT$ ${roomType.campsitePrice !== undefined ? roomType.campsitePrice : ""}</td>
        ${[1,2,3,4].map(i => `
        <td>
          <div style="display:flex;align-items:center;gap:4px;">
            ${roomType[`campsitePic${i}`]
              ? `<img src=\"data:image/jpeg;base64,${roomType[`campsitePic${i}`]}\" style=\"width:48px;height:36px;object-fit:cover;border-radius:4px;cursor:pointer;\" onclick=\"document.getElementById('upload-pic-${roomType.campsiteTypeId}-${i}').click()\">`
              : `<div style=\"width:48px;height:36px;display:flex;align-items:center;justify-content:center;background:rgba(128,128,128,0.12);border-radius:4px;cursor:pointer;\" onclick=\"document.getElementById('upload-pic-${roomType.campsiteTypeId}-${i}').click()\"><i class=\"fas fa-plus\" style=\"color:#888;font-size:20px;\"></i></div>`}
            <input type="file" accept="image/*" style="display:none;" id="upload-pic-${roomType.campsiteTypeId}-${i}" onchange="ownerDashboard.handleRoomTypeImageChange(event, ${roomType.campsiteTypeId}, ${i})">
          </div>
        </td>
        `).join('')}
        <td>
          <div class="d-flex">
            <button class="btn btn-sm btn-secondary" onclick="ownerDashboard.editRoomType(${roomType.campsiteTypeId})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger ms-2" onclick="ownerDashboard.deleteRoomType(${roomType.campsiteTypeId})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join("");
    tableBody.innerHTML = html;

  }

  renderBundleItems() {
    const tableBody = document.getElementById("bundleItemsTableBody");
    if (!tableBody) return;

    if (this.bundleItemData.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="3" class="text-center py-4">尚未設定任何加購商品</td></tr>';
      return;
    }

    const html = this.bundleItemData
      .map(
        (item) => `
      <tr>
        <td>${item.bundle_name}</td>
        <td>NT$ ${item.bundle_price}</td>
        <td>
          <div class="d-flex">
            <button class="btn btn-sm btn-secondary" onclick="ownerDashboard.editBundleItem('${item.bundle_id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger ms-2" onclick="ownerDashboard.deleteBundleItem('${item.bundle_id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");

    tableBody.innerHTML = html;
  }

  renderOrders() {
    const tableBody = document.getElementById("ordersTableBody");
    const statusFilter = document.getElementById("orderStatusFilter");
    if (!tableBody) return;

    let filteredOrders = this.orderData;
    if (statusFilter && statusFilter.value) {
      filteredOrders = this.orderData.filter(
        (order) => order.campsite_order_status === statusFilter.value
      );
    }

    if (filteredOrders.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="10" class="text-center py-4">沒有符合條件的訂單</td></tr>';
      return;
    }

    const html = filteredOrders
      .map((order) => {
        // 獲取該訂單的詳細資料
        const orderDetails = this.orderDetails
          ? this.orderDetails.filter(
              (detail) => detail.campsite_order_id === order.campsite_order_id
            )
          : [];
        console.log("orderDetails:" + orderDetails);
        // 獲取會員姓名
        const member = this.memberData.find((m) => m.mem_id === order.mem_id);
        const memberName = member ? member.mem_name : `會員${order.mem_id}`;

        // 計算總營地數量和金額
        const totalCampsiteNum = orderDetails.reduce(
          (sum, detail) => sum + detail.campsite_num,
          0
        );
        const totalCampsiteAmount = orderDetails.reduce(
          (sum, detail) => sum + detail.campsite_amount,
          0
        );

        // 獲取房型名稱（顯示第一個房型，如果有多個則顯示"等N種房型"）
        let roomTypeDisplay = "無";
        if (orderDetails.length > 0) {
          const firstRoomType = this.campsiteTypeData.find(
            (type) => type.campsite_type_id === orderDetails[0].campsite_type_id
          );
          console.log("firstRoomType:" + firstRoomType);
          if (firstRoomType) {
            roomTypeDisplay =
              orderDetails.length > 1
                ? `${firstRoomType.campsite_name}等${orderDetails.length}種房型`
                : firstRoomType.campsite_name;
          }
        }

        return `
      <tr>
        <td>#${order.campsite_order_id}</td>
        <td>${memberName}</td>
        <td>${roomTypeDisplay}</td>
        <td>${totalCampsiteNum}</td>
        <td>NT$ ${order.camp_amount.toLocaleString()}</td>
        <td>${order.check_in.split(" ")[0]}</td>
        <td>${order.check_out.split(" ")[0]}</td>
        <td>NT$ ${order.aft_amount.toLocaleString()}</td>
        <td>
          <span class="badge bg-${
            order.campsite_order_status === "1"
              ? "warning"
              : order.campsite_order_status === "2"
              ? "info"
              : order.campsite_order_status === "3"
              ? "success"
              : "danger"
          }">
            ${this.getOrderStatusText(order.campsite_order_status)}
          </span>
        </td>
        <td>
          ${this.getOrderActionButtons(order)}
        </td>
      </tr>
    `;
      })
      .join("");

    tableBody.innerHTML = html;
  }

  renderDiscountCodes() {
    const tableBody = document.getElementById("discountCodesTableBody");
    if (!tableBody) return;

    if (this.discountCodeData.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="8" class="text-center py-4">尚未建立任何折價券</td></tr>';
      return;
    }

    const html = this.discountCodeData
      .map(
        (code) => `
      <tr>
        <td>${code.discount_code_id}</td>
        <td><strong>${code.discount_code}</strong></td>
        <td>${code.discount_explain || "折價券"}</td>
        <td>
          <span class="badge bg-${
            code.discount_type === 1 ? "success" : "primary"
          }">
            ${code.discount_type === 1 ? "百分比折扣" : "固定金額折扣"}
          </span>
        </td>
        <td>
          ${
            code.discount_type === 1
              ? code.discount_value * 100 + "%"
              : "NT$ " + code.discount_value
          }
        </td>
        <td>NT$ ${code.min_order_amount}</td>
        <td>
          ${code.start_date.split(" ")[0]} ~ ${code.end_date.split(" ")[0]}
        </td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteDiscountCode('${
            code.discount_code_id
          }')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join("");

    tableBody.innerHTML = html;
  }

  getOrderStatusText(status) {
    const statusMap = {
      1: "待付款",
      2: "已付款",
      3: "已完成",
      4: "已取消",
    };
    return statusMap[status] || "未知狀態";
  }

  getOrderActionButtons(order) {
    let actionButtons = `
      <button class="btn btn-sm btn-info me-1" onclick="ownerDashboard.showOrderDetails('${order.campsite_order_id}')">
        <i class="fas fa-info-circle"></i> 細節
      </button>
    `;

    switch (order.campsite_order_status) {
      case 1:
        actionButtons += `
          <button class="btn btn-sm btn-danger" onclick="ownerDashboard.cancelOrder('${order.campsite_order_id}')">
            <i class="fas fa-times"></i>
          </button>
        `;
        break;
      case 2:
        actionButtons += `
          <button class="btn btn-sm btn-camping me-1" onclick="ownerDashboard.checkInOrder('${order.campsite_order_id}')">
            <i class="fas fa-sign-in-alt"></i>
          </button>
          <button class="btn btn-sm btn-warning" onclick="ownerDashboard.checkOutOrder('${order.campsite_order_id}')">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        `;
        break;
    }

    return actionButtons;
  }

  // 顯示訂單詳細資料
  showOrderDetails(orderId) {
    const order = this.orderData.find((o) => o.campsite_order_id === orderId);
    if (!order) return;

    // 獲取訂單詳細資料
    const orderDetails = this.orderDetails.filter(
      (detail) => detail.campsite_order_id === orderId
    );
    console.log(this.campData);
    console.log(campData);

    // 查找折價券信息
    let discountInfo = null;
    if (order.discount_code_id) {
      discountInfo = this.discountCodeData.find(
        (discount) => discount.discount_code_id === order.discount_code_id
      );
    }

    // 獲取會員資料
    const member = memberData.find((m) => m.mem_id == order.mem_id);
    const memberName = member ? member.mem_name : `會員${order.mem_id}`;

    // 獲取營地資料
    const camp = campData.find((c) => c.camp_id == order.camp_id);
    const campName = camp ? camp.camp_name : "營地名稱";

    // 生成營地類型詳細資料
    const campsiteDetailsHtml = orderDetails
      .map((detail) => {
        const campsiteType = this.campsiteTypeData.find(
          (type) => type.campsite_type_id === detail.campsite_type_id
        );

        return `
        <div class="campsite-detail-item">
          <div class="campsite-info">
            <h6>${campsiteType ? campsiteType.campsite_name : "未知房型"}</h6>
            <p class="text-muted">房型ID: ${detail.campsite_type_id}</p>
            <p class="text-muted">可住人數: ${
              campsiteType ? campsiteType.campsite_people : "N/A"
            }人</p>
            <p class="text-muted">單價: NT$ ${
              campsiteType
                ? campsiteType.campsite_price.toLocaleString()
                : "N/A"
            }</p>
          </div>
          <div class="campsite-booking">
            <p><strong>預訂數量:</strong> ${detail.campsite_num} 間</p>
            <p><strong>小計金額:</strong> NT$ ${detail.campsite_amount.toLocaleString()}</p>
          </div>
        </div>
      `;
      })
      .join("");

    // 計算總數量和金額
    const totalCampsiteNum = orderDetails.reduce(
      (sum, detail) => sum + detail.campsite_num,
      0
    );
    const totalCampsiteAmount = orderDetails.reduce(
      (sum, detail) => sum + detail.campsite_amount,
      0
    );

    // 獲取訂單狀態文字
    const statusText = this.getOrderStatusText(order.campsite_order_status);
    const statusClass =
      order.campsite_order_status === "1"
        ? "warning"
        : order.campsite_order_status === "2"
        ? "info"
        : order.campsite_order_status === "3"
        ? "success"
        : "danger";

    const modalHtml = `
      <div class="modal fade" id="orderDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">訂單詳細資料</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="order-summary">
                <div class="row mb-3">
                  <div class="col-md-6">
                    <h6>基本資訊</h6>
                    <p><strong>訂單編號:</strong> ${order.campsite_order_id}</p>
                    <p><strong>營地名稱:</strong> ${campName}</p>
                    <p><strong>客戶姓名:</strong> ${memberName}</p>
                    <p><strong>下訂日期:</strong> ${order.order_date}</p>
                  </div>
                  <div class="col-md-6">
                    <h6>住宿資訊</h6>
                    <p><strong>入住日期:</strong> ${
                      order.check_in.split(" ")[0]
                    }</p>
                    <p><strong>退房日期:</strong> ${
                      order.check_out.split(" ")[0]
                    }</p>
                    <p><strong>訂單狀態:</strong> <span class="badge bg-${statusClass}">${statusText}</span></p>
                  </div>
                </div>
              </div>
              
              <hr>
              
              <div class="campsite-details">
                <h6>營地類型詳細資料</h6>
                <div class="campsite-details-list">
                  ${campsiteDetailsHtml}
                </div>
              </div>
              
              <hr>
              
              <div class="amount-breakdown">
                <h6>金額明細</h6>
                <div class="row">
                  <div class="col-md-6">
                    <div class="amount-item">
                      <span>營地總數量:</span>
                      <span><strong>${totalCampsiteNum} 間</strong></span>
                    </div>
                    <div class="amount-item">
                      <span>營地費用:</span>
                      <span>NT$ ${order.camp_amount.toLocaleString()}</span>
                    </div>
                    ${
                      order.bundle_amount > 0
                        ? `
                    <div class="amount-item">
                      <span>加購項目:</span>
                      <span>NT$ ${order.bundle_amount.toLocaleString()}</span>
                    </div>
                    `
                        : ""
                    }
                    <div class="amount-item">
                      <span>小計:</span>
                      <span>NT$ ${order.bef_amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    ${
                      order.dis_amount > 0
                        ? `
                    <div class="amount-item discount">
                      <span>折扣:</span>
                      <span class="text-success">-NT$ ${order.dis_amount.toLocaleString()}</span>
                    </div>
                    ${
                      discountInfo
                        ? `
                    <div class="amount-item discount-info">
                      <span>折價券:</span>
                      <span class="text-info">${discountInfo.discount_code}</span>
                    </div>
                    <div class="amount-item discount-detail">
                      <span>折價說明:</span>
                      <span class="text-muted">${discountInfo.discount_explain}</span>
                    </div>
                    `
                        : ""
                    }
                    `
                        : ""
                    }
                    <div class="amount-item total">
                      <span><strong>實付金額:</strong></span>
                      <span><strong class="text-primary">NT$ ${order.aft_amount.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 移除舊的彈窗（如果存在）
    const existingModal = document.getElementById("orderDetailsModal");
    if (existingModal) {
      existingModal.remove();
    }

    // 添加新彈窗到頁面
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 顯示彈窗
    const modal = new bootstrap.Modal(
      document.getElementById("orderDetailsModal")
    );
    modal.show();

    // 彈窗關閉後移除DOM元素
    document
      .getElementById("orderDetailsModal")
      .addEventListener("hidden.bs.modal", function () {
        this.remove();
      });
  }

  // 模態框控制
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "flex";
    }
  }

  hideModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
      // 清空表單
      const form = modalElement.querySelector("form");
      if (form) form.reset();
    }
  }

  showAddRoomTypeModal() {
    const modal = new bootstrap.Modal(
      document.getElementById("addRoomTypeModal")
    );
    modal.show();
  }

  showAddBundleItemModal() {
    // 重置為新增模式
    this.isEditingBundle = false;
    this.editingBundleId = null;

    // 更新模態框標題和按鈕
    document.getElementById("bundleModalTitle").textContent = "新增加購商品";
    const submitBtn = document.getElementById("submitBundleItem");
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> 新增商品';

    // 清空表單
    document.getElementById("addBundleItemForm").reset();
    document.getElementById("bundle-id").value = "";

    // 使用Bootstrap方式顯示模態框
    const modal = new bootstrap.Modal(
      document.getElementById("addBundleItemModal")
    );
    modal.show();
  }

  showAddDiscountCodeModal() {
    // 使用Bootstrap方式顯示模態框
    const modal = new bootstrap.Modal(
      document.getElementById("addDiscountCodeModal")
    );
    modal.show();
  }

  // 事件處理函數
  handleLogout() {
    if (confirm("確定要登出嗎？")) {
      // 清除所有相關的儲存資料
      localStorage.removeItem("currentOwner");
      sessionStorage.removeItem("currentOwner");
      // 也清除可能的其他相關資料
      localStorage.removeItem("ownerRememberMe");
      sessionStorage.removeItem("ownerRememberMe");
      this.showMessage("已成功登出", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    }
  }

  handleCampInfoUpdate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // 顯示載入中訊息，設置為不自動消失，並指定一個ID
    const messageId = "updating-camp-info";
    this.showMessage("正在更新營地資料...", "info", false, messageId);

    // 從表單獲取基本資料
    const campName = formData.get("camp_name");
    const campLocation = formData.get("camp_location");
    const campReleaseStatus = formData.get("camp_status");
    const campContent = formData.get("camp_description");

    // 解析地址為城市、區域和詳細地址
    // 假設格式為：城市區域詳細地址
    let campCity = "";
    let campDist = "";
    let campAddr = "";

    if (campLocation) {
      // 簡單的地址解析邏輯，實際應用可能需要更複雜的處理
      if (campLocation.length >= 3) {
        campCity = campLocation.substring(0, 3); // 假設前3個字是城市
        if (campLocation.length >= 6) {
          campDist = campLocation.substring(3, 6); // 假設接下來3個字是區域
          campAddr = campLocation.substring(6); // 剩餘部分是詳細地址
        } else {
          campAddr = campLocation.substring(3);
        }
      } else {
        campAddr = campLocation;
      }
    }

    // 獲取營地評分相關數據
    const campCommentNumberCount = this.campData
      ? this.campData.camp_comment_number_count || 0
      : 0;
    const campCommentSumScore = this.campData
      ? this.campData.camp_comment_sun_score || 0
      : 0;

    // 獲取營地註冊日期，如果沒有則使用當前日期
    const today = new Date();
    const campRegDate =
      this.campData && this.campData.camp_reg_date
        ? this.campData.camp_reg_date
        : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(today.getDate()).padStart(2, "0")}`;

    // 獲取營地主ID
    const ownerId = this.currentOwner.owner_id;

    // 創建FormData對象用於API請求
    const apiFormData = new FormData();
    apiFormData.append("campId", this.campData.camp_id);
    apiFormData.append("ownerId", ownerId);
    apiFormData.append("campName", campName);
    apiFormData.append("campContent", campContent);
    apiFormData.append("campCity", campCity);
    apiFormData.append("campDist", campDist);
    apiFormData.append("campAddr", campAddr);
    apiFormData.append("campReleaseStatus", campReleaseStatus);
    apiFormData.append("campCommentNumberCount", campCommentNumberCount);
    apiFormData.append("campCommentSumScore", campCommentSumScore);
    apiFormData.append("campRegDate", campRegDate);

    console.log("campId", this.campData.camp_id);
    console.log("ownerId", ownerId);

    // 獲取營地圖片
    // 檢查是否有圖片1和圖片2（必須的）
    if (!this.campData || !this.campData.campPic1 || !this.campData.campPic2) {
      this.showMessage("請上傳必要的營地圖片（至少需要圖片1和圖片2）", "error");
      return;
    }

    // 添加圖片到FormData
    apiFormData.append("campPic1", this.campData.campPic1);
    apiFormData.append("campPic2", this.campData.campPic2);

    // 添加可選圖片
    if (this.campData.campPic3) {
      apiFormData.append("campPic3", this.campData.campPic3);
    }

    if (this.campData.campPic4) {
      apiFormData.append("campPic4", this.campData.campPic4);
    }

    // 發送API請求
    fetch(
      //create
      // "http://localhost:8081/CJA101G02/api/camps/createonecamp?withOrders=false",

      //update
      "http://localhost:8081/CJA101G02/api/camps/updateonecamp?withOrders=false",
      {
        method: "POST",
        body: apiFormData,
      }
    )
      .then((response) => response.json())
      .then((data) => {
        // 移除更新中的提示語
        const updatingMessage = document.getElementById("updating-camp-info");
        if (updatingMessage) {
          updatingMessage.remove();
        }

        if (data && data.status === "success") {
          // 更新成功
          console.log("營地資料更新成功：", data);
          this.showMessage("營地資料更新成功！", "success");

          // 更新本地數據
          if (data.data) {
            this.campData = {
              ...this.campData,
              ...data.data,
            };
          }

          // 重新渲染營地圖片
          this.renderCampImages();
        } else {
          // 更新失敗
          console.error("營地資料更新失敗：", data);
          this.showMessage(
            `營地資料更新失敗：${data.message || "未知錯誤"}`,
            "error"
          );
        }
      })
      .catch((error) => {
        // 移除更新中的提示語
        const updatingMessage = document.getElementById("updating-camp-info");
        if (updatingMessage) {
          updatingMessage.remove();
        }

        console.error("API請求錯誤：", error);
        this.showMessage(
          `API請求錯誤：${error.message || "未知錯誤"}`,
          "error"
        );
      });
  }

  handleAddRoomType(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (!this.campData) {
      this.showMessage("請先設定營地基本資料", "error");
      return;
    }

    // 準備要發送的數據（送假圖片 byte array）
    const fakeImage = [255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1]; // JPEG 檔頭
    const roomTypeData = {
      id: {
        campId: this.campData.camp_id,
        campsiteTypeId: null,
      },
      campsiteName: formData.get("campsite_name"),
      campsitePeople: parseInt(formData.get("campsite_people")),
      campsiteNum: parseInt(formData.get("campsite_num")),
      campsitePrice: parseInt(formData.get("campsite_price")),
      campsitePic1: fakeImage, // 傳一個假的圖片 byte array
      campsitePic2: null,
      campsitePic3: null,
      campsitePic4: null,
    };

    fetch("http://localhost:8081/CJA101G02/campsitetype/addCampsiteType", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roomTypeData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // 處理成功響應
        console.log("新增房型成功：", data);
        console.log("API回應狀態：", data.status);
        console.log("API回應資料：", data.data);
        this.showMessage("房型新增成功！", "success");

        // 關閉模態框
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("addRoomTypeModal")
        );
        if (modal) {
          modal.hide();
        }

        // 清空表單
        e.target.reset();

        // 重新載入房型資料
        if (this.campData && this.campData.camp_id) {
          console.log("開始重新載入房型資料，營地ID：", this.campData.camp_id);
          this.loadCampsiteTypesByCampId(this.campData.camp_id)
            .then(() => {
              console.log("房型資料重新載入完成，開始渲染");
              this.renderRoomTypes().catch((error) => {
                console.error("重新渲染房型列表失敗：", error);
              });
            })
            .catch((error) => {
              console.error("重新載入房型資料失敗：", error);
            });
        } else {
          console.error("無法重新載入房型資料：缺少營地資料");
        }
      })
      .catch((error) => {
        console.error("API請求錯誤：", error);
        this.showMessage(
          `新增房型失敗：${error.message || "未知錯誤"}`,
          "error"
        );
      });
  }

  editRoomType(campsiteTypeId) {
    console.log("編輯房型，ID:", campsiteTypeId);

    // 找到房型資料，支援多種可能的欄位名稱
    const roomType = this.campsiteTypeData.find((type) => {
      const typeId =
        type.campsiteTypeId ||
        type.id?.campsiteTypeId ||
        type.campsite_type_id ||
        type.id;
      return typeId == campsiteTypeId;
    });

    if (!roomType) {
      this.showMessage("找不到房型資料", "error");
      return;
    }

    console.log("要編輯的房型資料：", roomType);

    // 填充編輯表單
    const editForm = document.getElementById("editRoomTypeForm");
    if (editForm) {
      // 設定隱藏欄位
      editForm.querySelector('[name="campId"]').value =
        roomType.camp_id || roomType.campId;
      editForm.querySelector('[name="campsiteTypeId"]').value = campsiteTypeId;

      // 設定表單欄位
      editForm.querySelector('[name="campsiteName"]').value =
        roomType.campsiteName || roomType.campsite_name || "";
      editForm.querySelector('[name="campsitePeople"]').value =
        roomType.campsitePeople || roomType.campsite_people || "";
      editForm.querySelector('[name="campsiteNum"]').value =
        roomType.campsiteNum || roomType.campsite_num || "";
      editForm.querySelector('[name="campsitePrice"]').value =
        roomType.campsitePrice || roomType.campsite_price || "";
      editForm.querySelector('[name="campsitePic1"]').value =
        roomType.campsitePic1 || roomType.campsite_pic1 || "";
      editForm.querySelector('[name="campsitePic2"]').value =
        roomType.campsitePic2 || roomType.campsite_pic2 || "";
      editForm.querySelector('[name="campsitePic3"]').value =
        roomType.campsitePic3 || roomType.campsite_pic3 || "";
      editForm.querySelector('[name="campsitePic4"]').value =
        roomType.campsitePic4 || roomType.campsite_pic4 || "";
    }

    // 顯示編輯modal
    const editModal = new bootstrap.Modal(
      document.getElementById("editRoomTypeModal")
    );
    editModal.show();
  }

  handleEditRoomType(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const typeId = formData.get("campsite_type_id");
    // console.log("aaaaaa");
    // console.log("a:", this.campsiteTypeData);
    // console.log("編輯房型：", typeId);

    // this.campsiteTypeData.findIndex((type) =>
    //   console.log(
    //     "typeId:",
    //     typeId,
    //     "type.campsite_type_id:",
    //     type.campsite_type_id
    //   )
    // );

    // 找到要更新的房型資料
    const roomTypeIndex = this.campsiteTypeData.findIndex(
      (type) => type.campsite_type_id == typeId
    );

    console.log("更新前的房型資料：", this.campsiteTypeData[roomTypeIndex]);

    if (roomTypeIndex === -1) {
      this.showMessage("找不到房型資料", "error");
      return;
    }

    // 更新房型資料
    const updatedRoomType = {
      ...this.campsiteTypeData[roomTypeIndex],
      campsite_name: formData.get("campsite_name"),
      campsite_people: parseInt(formData.get("campsite_people")),
      campsite_num: parseInt(formData.get("campsite_num")),
      campsite_price: parseInt(formData.get("campsite_price")),
      campsite_pic1: formData.get("campsite_pic1") || null,
      campsite_pic2: formData.get("campsite_pic2") || null,
      campsite_pic3: formData.get("campsite_pic3") || null,
      campsite_pic4: formData.get("campsite_pic4") || null,
    };

    // 更新陣列中的資料
    this.campsiteTypeData[roomTypeIndex] = updatedRoomType;

    console.log("更新房型：", updatedRoomType);
    this.showMessage("房型更新成功！", "success");

    // 關閉模態框
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editRoomTypeModal")
    );
    if (modal) {
      modal.hide();
    }

    // 重新載入房型資料
    setTimeout(() => {
      this.renderRoomTypes().catch((error) => {
        console.error("重新渲染房型列表失敗：", error);
      });
    }, 500);
  }

  handleAddBundleItem(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (!this.campData) {
      this.showMessage("請先設定營地基本資料", "error");
      return;
    }

    const bundleName = formData.get("bundle_name");
    const bundlePrice = parseInt(formData.get("bundle_price"));

    if (this.isEditingBundle && this.editingBundleId) {
      // 編輯模式
      const bundleIndex = this.bundleItemData.findIndex(
        (item) => item.bundle_id === this.editingBundleId
      );
      if (bundleIndex !== -1) {
        this.bundleItemData[bundleIndex] = {
          ...this.bundleItemData[bundleIndex],
          bundle_name: bundleName,
          bundle_price: bundlePrice,
        };
        console.log("更新加購商品：", this.bundleItemData[bundleIndex]);
        this.showMessage("加購商品更新成功！", "success");
      }
    } else {
      // 新增模式
      const bundleData = {
        bundle_id: this.generateRandomId(),
        camp_id: this.campData.camp_id,
        bundle_name: bundleName,
        bundle_price: bundlePrice,
        bundle_add_date: new Date().toISOString().split("T")[0],
      };

      this.bundleItemData.push(bundleData);
      console.log("新增加購商品：", bundleData);
      this.showMessage("加購商品新增成功！", "success");
    }

    this.hideModal("addBundleItemModal");

    // 重新載入加購商品資料
    setTimeout(() => {
      this.renderBundleItems();
    }, 500);
  }

  handleAddDiscountCode(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // 表單驗證
    const discountType = parseInt(formData.get("discount_type"));
    const discountValue = parseFloat(formData.get("discount_value"));
    const startDate = formData.get("start_date");
    const endDate = formData.get("end_date");

    // 驗證折扣值
    if (discountType === 1) {
      // 百分比折扣
      if (discountValue >= 1 || discountValue <= 0) {
        this.showMessage(
          "百分比折扣值必須是0到1之間的小數（如0.1代表10%）",
          "error"
        );
        return;
      }
    } else {
      // 固定金額折扣
      if (discountValue < 1 || !Number.isInteger(discountValue)) {
        this.showMessage("固定金額折扣值必須是大於等於1的整數", "error");
        return;
      }
    }

    // 驗證日期
    if (new Date(endDate) <= new Date(startDate)) {
      this.showMessage("結束日期必須晚於開始日期", "error");
      return;
    }

    // 生成折價券ID
    const discountCodeId =
      "S" + String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0");

    const discountData = {
      discount_code_id: discountCodeId,
      discount_code: formData.get("discount_code"),
      owner_id: this.currentOwner.owner_id,
      admin_id: null,
      discount_type: discountType,
      discount_value: discountValue,
      discount_explain: formData.get("discount_explain"),
      min_order_amount: parseInt(formData.get("min_order_amount")),
      start_date: startDate + " 00:00:00",
      end_date: endDate + " 23:59:59",
      created: new Date().toISOString().replace("T", " ").substr(0, 19),
      updated: null,
    };

    console.log("新增折價券：", discountData);
    this.showMessage("折價券新增成功！", "success");
    this.hideModal("addDiscountCodeModal");

    // 重新載入折價券資料
    setTimeout(() => {
      this.renderDiscountCodes();
    }, 1000);
  }

  // 訂單操作
  cancelOrder(orderId) {
    if (confirm("確定要取消此訂單嗎？")) {
      const order = this.orderData.find((o) => o.campsite_order_id === orderId);
      if (order && order.campsite_order_status === 1) {
        order.campsite_order_status = 4;
        console.log("取消訂單：", orderId);
        this.showMessage("訂單已取消", "success");
        this.renderOrders();
      } else {
        this.showMessage("只有待付款的訂單才能取消", "error");
      }
    }
  }

  checkInOrder(orderId) {
    if (confirm("確定客人已入住嗎？")) {
      const order = this.orderData.find((o) => o.campsite_order_id === orderId);
      if (order && order.campsite_order_status === 2) {
        console.log("入住確認：", orderId);
        this.showMessage("入住確認完成", "success");
        this.renderOrders();
      } else {
        this.showMessage("只有已付款的訂單才能確認入住", "error");
      }
    }
  }

  checkOutOrder(orderId) {
    if (confirm("確定客人已退房嗎？")) {
      const order = this.orderData.find((o) => o.campsite_order_id === orderId);
      if (order && order.campsite_order_status === 2) {
        order.campsite_order_status = 3;
        console.log("退房確認：", orderId);
        this.showMessage("退房確認完成", "success");
        this.renderOrders();
      } else {
        this.showMessage("只有已付款的訂單才能確認退房", "error");
      }
    }
  }

  // 加購商品操作
  editBundleItem(bundleId) {
    const bundleItem = this.bundleItemData.find(
      (item) => item.bundle_id == bundleId
    );
    if (!bundleItem) {
      this.showMessage("找不到該加購商品", "error");
      return;
    }

    // 設置編輯模式
    this.isEditingBundle = true;
    this.editingBundleId = bundleId;

    // 更新模態框標題和按鈕
    document.getElementById("bundleModalTitle").textContent = "編輯加購商品";
    const submitBtn = document.getElementById("submitBundleItem");
    submitBtn.innerHTML = '<i class="fas fa-save"></i> 更新商品';

    // 填入現有數據
    document.getElementById("bundle-id").value = bundleItem.bundle_id;
    document.getElementById("bundle-name").value = bundleItem.bundle_name;
    document.getElementById("bundle-price").value = bundleItem.bundle_price;

    // 使用Bootstrap方式顯示模態框
    const modal = new bootstrap.Modal(
      document.getElementById("addBundleItemModal")
    );
    modal.show();
  }

  deleteBundleItem(bundleId) {
    if (confirm("確定要刪除此加購商品嗎？")) {
      console.log("刪除加購商品：", bundleId);
      this.showMessage("加購商品已刪除", "success");
      this.renderBundleItems();
    }
  }

  // 折價券操作
  deleteDiscountCode(discountId) {
    if (confirm("確定要刪除此折價券嗎？")) {
      console.log("刪除折價券：", discountId);
      this.showMessage("折價券已刪除", "success");
      this.renderDiscountCodes();
    }
  }

  // 房型操作
  getRoomNumbers(campsiteTypeId) {
    // 根據房型ID獲取所有房間號碼
    const rooms = this.campsiteData.filter(
      (room) => room.campsite_type_id == campsiteTypeId
    );
    return rooms.map(
      (room) => room.campsite_id_name || `房間${room.campsite_id}`
    );
  }

  async showRoomDetails(campsiteTypeId) {
    try {
      // 獲取當前選中的營地ID
      let campId;

      const ownerProfileSelect = document.getElementById("ownerProfileSelect");
      if (ownerProfileSelect) {
        campId = ownerProfileSelect.value;

      } else {
        campId = this.campData ? this.campData.camp_id : null;
      }

      if (!campId) {
        throw new Error("無法獲取營地ID");
      }

      
      // 強制轉換ID型別
      campsiteTypeId = Number(campsiteTypeId);
      

      console.log(`載入房型 ${campsiteTypeId} 的房間資料，營地ID: ${campId}`);

      const response = await fetch(
        `http://localhost:8081/CJA101G02/campsitetype/${campsiteTypeId}/${campId}/getcampsites`
      );

      if (!response.ok) {
        throw new Error(`載入房間資料失敗：${response.status}`);
      }

      const result = await response.json();
      const roomList = Array.isArray(result.data) ? result.data : [];

      console.log("房間資料：", roomList);

      // 檢查第一個房間的資料結構
      if (roomList.length > 0) {
        console.log("第一個房間的完整資料結構：", roomList[0]);
        console.log("房間ID欄位檢查：", {
          campsite_id: roomList[0].campsite_id,
          id: roomList[0].id,
          campsiteId: roomList[0].campsiteId,
        });
      }

      this.renderRoomDetailModal(roomList, campsiteTypeId, campId);

      // 顯示 modal
      const modal = new bootstrap.Modal(
        document.getElementById("roomDetailModal")
      );
      modal.show();
    } catch (error) {
      console.error("顯示房間詳情失敗：", error);
      this.showMessage(`顯示房間詳情失敗：${error.message}`, "error");
    }
  }

  renderRoomDetailModal(roomList, campsiteTypeId, campId) {
    try {
      window._latestRoomList = roomList;
      const tableBody = document.getElementById("roomDetailTableBody");

      if (!tableBody) {
        throw new Error("找不到房間明細表格");
      }

      // 將當前房型ID保存到modal的data屬性中，方便後續使用
      const roomDetailModal = document.getElementById("roomDetailModal");
      if (roomDetailModal) {
        roomDetailModal.setAttribute(
          "data-current-campsite-type-id",
          campsiteTypeId
        );
      }

      // 更新modal標題
      const modalTitle = document.getElementById("roomDetailModalLabel");
      if (modalTitle) {
        // 嘗試獲取房型名稱，支援多種可能的欄位名稱
        const roomType = this.campsiteTypeData.find((type) => {
          const typeId =
            type.campsiteTypeId ||
            type.id?.campsiteTypeId ||
            type.campsite_type_id ||
            type.id;
          return typeId == campsiteTypeId;
        });
        const roomTypeName = roomType
          ? roomType.campsiteName || roomType.campsite_name
          : `房型${campsiteTypeId}`;
        modalTitle.textContent = `${roomTypeName} - 房間明細`;
      }

      // 渲染房間列表（移除入住日、預計退房日）
      if (!roomList || roomList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">此房型目前沒有房間</td></tr>';
      } else {
        // 按照campsiteId排序房間列表
        const sortedRoomList = roomList.sort((a, b) => a.campsiteId - b.campsiteId);
        const html = sortedRoomList.map(room => `
          <tr>
            <td>${room.campsiteIdName || room.campsite_id_name || `房間${room.campsiteId}`}</td>
            <td>${room.camperName || room.camper_name || '-'}</td>

            <td>
              <div class="d-flex">
                <button class="btn btn-sm btn-secondary" onclick="ownerDashboard.editRoom(${
                  room.campsiteId
                })">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger ms-2" onclick="ownerDashboard.deleteRoom(${
                  room.campsiteId
                })">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>

        `).join("");
        tableBody.innerHTML = html;
      }
      // 設定新增房間按鈕的事件（不再關閉房間明細modal）
      const addRoomBtn = document.getElementById("addRoomBtn");
      if (addRoomBtn) {
        addRoomBtn.onclick = () => {
          this.showAddRoomModal(campsiteTypeId, campId);
          // 不再關閉房間明細modal

        };
      }
    } catch (error) {
      console.error("渲染房間明細modal失敗：", error);
      this.showMessage(`渲染房間明細modal失敗：${error.message}`, "error");
    }
  }

  handleAddRoom() {
    const form = document.getElementById("addRoomForm");
    const roomTypeId = Number(document.getElementById("add-room-type-id").value);
    const roomName = document.getElementById("add-room-name").value;
    const roomGuest = document.getElementById("add-camper-name").value;

    if (!roomName) {
      this.showMessage("請輸入房間名稱", "error");
      return;
    }

    // 找到房型信息，支援多種可能的欄位名稱
    const roomType = this.campsiteTypeData.find((type) => {

      const typeId = type.campsiteTypeId || type.id?.campsiteTypeId || type.campsite_type_id || type.id;
      return Number(typeId) === roomTypeId;

    });

    if (!roomType) {
      this.showMessage("找不到房型資料", "error");
      return;
    }

    // 生成新的房間ID（在實際應用中應由後端生成）
    const maxId = Math.max(
      ...this.campsiteData.map((room) => room.campsite_id),
      0
    );
    const newRoomId = maxId + 1;

    // 創建新房間對象
    const newRoom = {
      campsite_id: newRoomId,
      camp_id: roomType.camp_id,
      campsite_type_id: parseInt(roomTypeId),
      campsite_id_name: roomName,
      camper_name: roomGuest || null,
    };

    // 添加到數據中
    this.campsiteData.push(newRoom);

    // 更新房型的房間數量
    roomType.campsite_num += 1;

    // 關閉模態框
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addRoomModal")
    );
    if (modal) {
      modal.hide();
    }

    // 顯示成功訊息
    this.showMessage("房間新增成功", "success");

    // 重新渲染房型列表以更新房間數量
    this.renderRoomTypes().catch((error) => {
      console.error("重新渲染房型列表失敗：", error);
    });
  }

  editRoom(roomId) {

    // 先從最新房間明細modal的roomList查找
    let room = null;
    // 嘗試從modal的window作用域取得最新roomList
    if (window._latestRoomList && Array.isArray(window._latestRoomList)) {
      room = window._latestRoomList.find(r => (r.campsiteId == roomId || r.campsite_id == roomId));
    }
    // 如果找不到再從this.campsiteData查找
    if (!room) {
      room = this.campsiteData.find(r => (r.campsiteId == roomId || r.campsite_id == roomId));
    }
    if (!room) {
      this.showMessage("找不到房間資料", "error");
      return;

    }
    this.showEditRoomModal(room);
  }

  deleteRoom(roomId) {
    try {
      console.log("deleteRoom 被呼叫，roomId:", roomId, "類型:", typeof roomId);

      if (!confirm("確定要刪除此房間嗎？此操作無法復原。")) {
        return;
      }

      console.log("刪除房間，ID:", roomId);

      // 準備API請求資料
      const requestData = { campsiteId: parseInt(roomId) };
      console.log("API請求資料:", requestData);

      // 呼叫刪除房間API
      fetch("http://localhost:8081/CJA101G02/campsite/deleteCampsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })
        .then((response) => {
          console.log("API回應狀態:", response.status);
          return response.json();
        })
        .then((result) => {
          console.log("API回應結果:", result);
          if (result.status === "success") {
            this.showMessage("房間刪除成功！", "success");

            // 重新載入房間明細（如果房間明細modal還開著）
            const roomDetailModal = document.getElementById("roomDetailModal");
            if (roomDetailModal && roomDetailModal.classList.contains("show")) {
              // 從modal的data屬性中獲取當前房型ID
              const currentCampsiteTypeId = roomDetailModal.getAttribute(
                "data-current-campsite-type-id"
              );
              if (currentCampsiteTypeId) {
                // 延遲一下再重新載入，確保後端資料已更新
                setTimeout(() => {
                  this.showRoomDetails(currentCampsiteTypeId);
                }, 500);
              }
            }

            // 重新渲染房型列表以更新房間數量
            this.renderRoomTypes().catch((error) => {
              console.error("重新渲染房型列表失敗：", error);
            });
          } else {
            this.showMessage(
              "房間刪除失敗：" + (result.message || "未知錯誤"),
              "error"
            );
          }
        })
        .catch((error) => {
          console.error("刪除房間失敗：", error);
          this.showMessage(`刪除房間失敗：${error.message}`, "error");
        });
    } catch (error) {
      console.error("刪除房間失敗：", error);
      this.showMessage(`刪除房間失敗：${error.message}`, "error");
    }
  }

  // 工具函數
  generateRandomId() {
    return Math.random().toString(36).substr(2, 9);
  }

  showMessage(message, type = "info", autoHide = true, messageId = null) {
    try {
      // 如果提供了messageId，先嘗試移除該ID的訊息
      if (messageId) {
        const specificMessage = document.getElementById(messageId);
        if (specificMessage) {
          specificMessage.remove();
        }
      } else {
        // 否則移除所有現有訊息
        const existingMessage = document.querySelector(".dashboard-message");
        if (existingMessage) {
          existingMessage.remove();
        }
      }

      // 建立新訊息
      const messageDiv = document.createElement("div");
      messageDiv.className = `dashboard-message ${type}`;
      messageDiv.textContent = message;

      // 如果提供了messageId，設置元素ID
      if (messageId) {
        messageDiv.id = messageId;
      }

      // 設定樣式
      const colors = {
        success: "#4CAF50",
        error: "#f44336",
        info: "#2196F3",
        warning: "#ff9800",
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

      // 如果autoHide為true，則設定自動消失
      if (autoHide) {
        setTimeout(() => {
          messageDiv.remove();
        }, 3000);
      }

      // 返回訊息元素，以便後續操作
      return messageDiv;
    } catch (error) {
      console.error("顯示訊息失敗：", error);
      // 如果無法顯示自定義訊息，使用瀏覽器的alert
      alert(message);
    }
  }

  async initCampIdSelect() {
    try {
      const campIdSelect = document.getElementById("campIdSelect");
      if (!campIdSelect || !this.allCamps || this.allCamps.length === 0) {
        // 沒有營地資料時直接return，不丟錯誤
        return;
      }

      // 如果營地主只有一個營地，隱藏下拉選單
      if (this.allCamps.length === 1) {
        const selectContainer = campIdSelect.parentElement;
        if (selectContainer) {
          selectContainer.style.display = "none";
        }
        // 直接載入該營地的房型
        await this.loadCampsiteTypesByCampId(this.allCamps[0].camp_id);
        return;
      }

      // 如果有多個營地，顯示下拉選單
      campIdSelect.innerHTML = this.allCamps
        .map(
          (camp) =>
            `<option value="${camp.camp_id}">${camp.camp_id} - ${camp.camp_name}</option>`
        )
        .join("");

      // 預設載入第一個營地的房型
      if (campIdSelect.value) {
        await this.loadCampsiteTypesByCampId(campIdSelect.value);
      }

      campIdSelect.addEventListener("change", async () => {
        try {
          await this.loadCampsiteTypesByCampId(campIdSelect.value);

          // 重新載入該營地的相關資料
          const campsiteResponse = await fetch("data/campsite.json");
          if (!campsiteResponse.ok) {
            throw new Error(`載入營地房間資料失敗：${campsiteResponse.status}`);
          }
          const allCampsites = await campsiteResponse.json();
          this.campsiteData = allCampsites.filter(
            (campsite) => campsite.camp_id == campIdSelect.value
          );

          const bundleResponse = await fetch("data/bundle_item.json");
          if (!bundleResponse.ok) {
            throw new Error(`載入加購商品資料失敗：${bundleResponse.status}`);
          }
          const allBundles = await bundleResponse.json();
          this.bundleItemData = allBundles.filter(
            (bundle) => bundle.camp_id == campIdSelect.value
          );

          const orderResponse = await fetch("data/campsite_order.json");
          if (!orderResponse.ok) {
            throw new Error(`載入訂單資料失敗：${orderResponse.status}`);
          }
          const allOrders = await orderResponse.json();
          this.orderData = allOrders.filter(
            (order) => order.camp_id == campIdSelect.value
          );

          // 更新營地基本資料表單
          this.initCampInfoForm();

          // 更新右上角的營地主資訊
          this.updateOwnerInfo();

          // 重新渲染所有頁面資料
          this.renderRoomTypes().catch((error) => {
            console.error("重新渲染房型列表失敗：", error);
          });
          this.renderBundleItems();
          this.renderOrders();
        } catch (error) {
          console.error("切換營地時發生錯誤：", error);
          this.showMessage(`切換營地失敗：${error.message}`, "error");
        }
      });
    } catch (error) {
      console.error("初始化營地下拉選單失敗：", error);
      this.showMessage(`初始化營地下拉選單失敗：${error.message}`, "error");
    }
  }

  async loadCampsiteTypesByCampId(campId) {
    try {
      console.log("loadCampsiteTypesByCampId 被呼叫，營地ID：", campId);

      // 更新當前選中的營地資料
      this.campData = this.allCamps.find((camp) => camp.camp_id == campId);

      if (!this.campData) {
        throw new Error(`找不到營地ID為 ${campId} 的營地資料`);
      }

      console.log("開始呼叫API獲取房型資料");
      const response = await fetch(
        `http://localhost:8081/CJA101G02/campsitetype/${campId}/getCampsiteTypes`
      );
      if (!response.ok) {
        throw new Error(`載入房型資料失敗：${response.status}`);
      }
      const result = await response.json();
      console.log("API回應結果：", result);

      this.campsiteTypeData = Array.isArray(result.data) ? result.data : [];
      console.log("更新後的房型資料：", this.campsiteTypeData);
      console.log("房型資料長度：", this.campsiteTypeData.length);

      this.renderRoomTypes().catch((error) => {
        console.error("重新渲染房型列表失敗：", error);
      });
    } catch (error) {
      console.error("載入房型資料失敗：", error);
      this.showMessage(`載入房型資料失敗：${error.message}`, "error");
    }
  }

  deleteRoomType(campsiteTypeId) {
    console.log("刪除房型，ID:", campsiteTypeId);

    if (!confirm("確定要刪除此房型嗎？此操作無法復原。")) {
      return;
    }

    // 找到房型資料，支援多種可能的欄位名稱
    const roomType = this.campsiteTypeData.find((type) => {
      const typeId =
        type.campsiteTypeId ||
        type.id?.campsiteTypeId ||
        type.campsite_type_id ||
        type.id;
      return typeId == campsiteTypeId;
    });

    if (!roomType) {
      this.showMessage("找不到房型資料", "error");
      return;
    }

    console.log("要刪除的房型資料：", roomType);

    // 準備刪除資料
    const deleteData = {
      campId: roomType.camp_id || roomType.campId,
      campsiteTypeId: parseInt(campsiteTypeId),
    };

    // 呼叫刪除API
    fetch("http://localhost:8081/CJA101G02/campsitetype/deleteCampsiteType", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deleteData),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.status === "success") {
          this.showMessage("房型刪除成功！", "success");
          // 重新載入房型資料
          this.loadCampsiteTypesByCampId(deleteData.campId);
        } else {
          this.showMessage(
            "房型刪除失敗：" + (result.message || "未知錯誤"),
            "error"
          );
        }
      })
      .catch((error) => {
        console.error("刪除房型失敗：", error);
        this.showMessage(`刪除房型失敗：${error.message}`, "error");
      });
  }

  // 新增一個方法來正確關閉modal並清除背景遮罩
  closeModalAndClearBackdrop(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      // 關閉modal
      const bootstrapModal = bootstrap.Modal.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }

      // 手動移除背景遮罩
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) {
        backdrop.remove();
      }

      // 移除body的modal-open類別
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }

  // 初始化聊天管理功能
  initChatManagement() {
    console.log("初始化聊天管理功能");
    console.log("當前營地主資料:", this.currentOwner);

    // 檢查營地主資料是否存在
    if (!this.currentOwner || !this.currentOwner.owner_id) {
      console.error("營地主資料不存在，無法初始化聊天管理");
      // 嘗試重新檢查登入狀態
      this.checkLoginStatus();
      if (!this.currentOwner || !this.currentOwner.owner_id) {
        console.error("重新檢查後仍無法獲取營地主資料");
        return;
      }
    }

    // 設置營地主ID到隱藏輸入框
    const ownerIdInput = document.getElementById("ownerId");
    if (ownerIdInput) {
      ownerIdInput.value = this.currentOwner.owner_id;
      console.log("設置營地主ID:", this.currentOwner.owner_id);
    } else {
      console.error("找不到ownerId輸入框");
    }

    // 設置會員ID到隱藏輸入框（營地主也是會員）
    const memIdInput = document.getElementById("memId");
    if (memIdInput && this.currentOwner.mem_id) {
      memIdInput.value = this.currentOwner.mem_id;
      console.log("設置會員ID:", this.currentOwner.mem_id);
    } else if (memIdInput) {
      // 如果營地主資料中沒有 mem_id，嘗試從 localStorage 或 sessionStorage 獲取會員資料
      const memberData =
        localStorage.getItem("currentMember") ||
        sessionStorage.getItem("currentMember");
      if (memberData) {
        try {
          const member = JSON.parse(memberData);
          if (member && member.mem_id) {
            memIdInput.value = member.mem_id;
            console.log("從會員資料設置會員ID:", member.mem_id);
          }
        } catch (error) {
          console.error("解析會員資料失敗:", error);
        }
      } else {
        console.warn("無法獲取會員ID，聊天功能可能無法正常運作");
      }
    } else {
      console.error("找不到memId輸入框");
    }

    // 確保chat-management.js已載入並初始化
    if (typeof window.initChatManagement === "function") {
      console.log("調用window.initChatManagement");
      // 直接調用聊天管理初始化函數
      window.initChatManagement();
    } else {
      console.warn("chat-management.js尚未載入");
    }
  }

  // 新增房間modal開啟時自動帶入campId/campsiteTypeId
  showAddRoomModal(campsiteTypeId, campId) {
    // 強制轉換ID型別
    campsiteTypeId = Number(campsiteTypeId);
    campId = Number(campId);
    document.getElementById('add-room-camp-id').value = campId;
    document.getElementById('add-room-type-id').value = campsiteTypeId;
    document.getElementById('add-room-name').value = '';
    const modal = new bootstrap.Modal(document.getElementById('addRoomModal'));
    modal.show();
  }

  // 編輯房間modal開啟時自動帶入資料
  showEditRoomModal(room) {
    console.log('編輯房間modal帶入的room物件：', room);
    document.getElementById('edit-room-campsite-id').value = room.campsiteId;
    document.getElementById('edit-room-campsite-name').value = room.campsiteIdName || '';
    document.getElementById('edit-room-camper-name').value = room.camperName || '';
    document.getElementById('edit-room-campsite-type-id').value =
      (room.campsiteType && room.campsiteType.id && room.campsiteType.id.campsiteTypeId)
      || room.campsiteTypeId
      || '';
    document.getElementById('edit-room-camp-id').value =
      (room.campsiteType && room.campsiteType.id && room.campsiteType.id.campId)
      || room.campId
      || '';
    const modal = new bootstrap.Modal(document.getElementById('editRoomModal'));
    modal.show();
  }

  // 新增圖片上傳事件處理方法
  handleRoomTypeImageChange(event, campsiteTypeId, imgIndex) {
    const file = event.target.files[0];
    if (!file) return;
    this.uploadRoomTypeImage(campsiteTypeId, imgIndex, file);
  }

  // 新增圖片上傳API方法（僅前端範例，請依後端API調整）
  async uploadRoomTypeImage(campsiteTypeId, imgIndex, file) {
    try {
      const formData = new FormData();
      formData.append('campsiteTypeId', campsiteTypeId);
      formData.append('imgIndex', imgIndex);
      formData.append('file', file);
      // 假設API為 /campsitetype/uploadImage
      const response = await fetch('http://localhost:8081/CJA101G02/campsitetype/uploadImage', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (result.status === 'success') {
        this.showMessage('圖片上傳成功！', 'success');
        await this.renderRoomTypes();
      } else {
        this.showMessage('圖片上傳失敗：' + (result.message || '未知錯誤'), 'error');
      }
    } catch (error) {
      this.showMessage('圖片上傳失敗：' + error.message, 'error');
    }
  }
}

// 初始化營地主後台
let ownerDashboard;
document.addEventListener("DOMContentLoaded", function () {
  ownerDashboard = new OwnerDashboard();
});
