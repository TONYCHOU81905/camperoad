// 營地主後台管理系統
class OwnerDashboard {
  constructor() {
    this.currentOwner = null;
    this.campData = null;
    this.campsiteData = [];
    this.bundleItemData = [];
    this.orderData = [];
    this.discountCodeData = [];
    this.justUpdatedRoomTypeId = null; // 新增：記錄剛剛有上傳圖片的房型ID
    this.pendingCampImages = {}; // 新增：暫存待上傳的營地圖片
    this.deletedCampImages = {}; // 新增：記錄被刪除的營地圖片索引
    this.imageExistsCache = {}; // 新增：圖片存在性緩存
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
      await this.showTabContent(lastTab);

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
      console.log("aaaaaa11111:");
      // 右上角下拉選單
      const ownerProfileSelect = document.getElementById("ownerProfileSelect");
      if (ownerProfileSelect) {
        // 產生選項
        ownerProfileSelect.innerHTML = this.allCamps
          .map(
            (camp) =>
              `<option value="${camp.campId}">${camp.campId} - ${camp.campName}</option>`
          )
          .join("");
        // 設定預設值
        if (this.campData) ownerProfileSelect.value = this.campData.campId;

        // 綁定切換事件
        ownerProfileSelect.onchange = async () => {
          const campId = ownerProfileSelect.value;

          // 更新 campData
          this.campData = this.allCamps.find((camp) => camp.campId == campId);
          // 清空圖片刪除標記
          this.deletedCampImages = {};
          // 清除圖片存在性快取
          this.imageExistsCache = {};

          // 1. 只顯示/隱藏 loading 區塊，不覆蓋 camp-info
          let campInfoLoading = document.getElementById("campInfoLoading");
          if (!campInfoLoading) {
            // 如果沒有 loading 區塊，動態新增
            const formParent = document.querySelector(
              "#camp-info .camp-info-form"
            );
            if (formParent) {
              campInfoLoading = document.createElement("div");
              campInfoLoading.id = "campInfoLoading";
              campInfoLoading.className = "text-center py-4";
              campInfoLoading.innerText = "載入中...";
              formParent.insertBefore(campInfoLoading, formParent.firstChild);
            }
          }
          if (campInfoLoading) campInfoLoading.style.display = "";
          const campInfoForm = document.getElementById("campInfoForm");
          if (campInfoForm) campInfoForm.style.display = "none";
          console.log("bbbbbb:");
          // 其他分頁 loading 同前
          const roomTypesTableBody =
            document.getElementById("roomTypesTableBody");
          if (roomTypesTableBody) {
            roomTypesTableBody.innerHTML =
              '<tr><td colspan="9" class="text-center">載入中...</td></tr>';
          }
          const bundleItemsTableBody = document.getElementById(
            "bundleItemsTableBody"
          );
          if (bundleItemsTableBody) {
            bundleItemsTableBody.innerHTML =
              '<tr><td colspan="3" class="text-center py-4">載入中...</td></tr>';
          }
          const ordersTableBody = document.getElementById("ordersTableBody");
          if (ordersTableBody) {
            ordersTableBody.innerHTML =
              '<tr><td colspan="10" class="text-center py-4">載入中...</td></tr>';
          }
          const discountCodesTableBody = document.getElementById(
            "discountCodesTableBody"
          );
          if (discountCodesTableBody) {
            discountCodesTableBody.innerHTML =
              '<tr><td colspan="8" class="text-center py-4">載入中...</td></tr>';
          }
          console.log("aaaaaa:");
          // 2. 依序載入所有資料
          await this.renderRoomTypes(false, true); // 房型
          await this.loadBundleItemsByCampId(campId); // 加購商品
          const orderResponse = await fetch(
            `${window.api_prefix}/api/campsite/order/all`
          );
          console.log("orderResponse:" + orderResponse);

          if (orderResponse.ok) {
            const allOrdersJson = await orderResponse.json();
            const allOrders = allOrdersJson.data;
            console.log("orderData:" + allOrders);
            this.orderData = allOrders.filter(
              (order) => order.campId == campId
            );
          }
          const discountResponse = await fetch("data/discount_code.json");
          if (discountResponse.ok) {
            const allDiscountCodes = await discountResponse.json();
            this.discountCodeData = allDiscountCodes.filter(
              (code) => code.owner_id === this.currentOwner.owner_id
            );
          }

          // 3. 切換到營地基本資料分頁，並 render
          await this.showTabContent("camp-info");
          // loading 隱藏，表單顯示
          if (campInfoLoading) campInfoLoading.style.display = "none";
          if (campInfoForm) campInfoForm.style.display = "";
          this.initCampInfoForm();
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
      console.log("GGGGG:");
      // 載入營地資料，只載入當前營地主的營地
      const campResponse = await fetch(`${window.api_prefix}/api/getallcamps`);
      if (!campResponse.ok) {
        throw new Error(`載入營地資料失敗：${campResponse.status}`);
      }
      const allCampsJson = await campResponse.json();
      const allCamps = allCampsJson.data;

      // 根據登入的營地主ID篩選營地

      this.allCamps = allCamps.filter(
        (camp) => String(camp.ownerId) == String(this.currentOwner.owner_id)
      );

      // 如果該營地主沒有營地，顯示提示訊息
      if (this.allCamps.length === 0) {
        this.showMessage("您目前沒有營地資料，請先新增營地", "warning");
        // 不要呼叫 this.initUI();
        return;
      }

      // 預設選擇第一個營地
      this.campData = this.allCamps[0];
      // 清空圖片刪除標記
      this.deletedCampImages = {};
      // 清除圖片存在性快取
      this.imageExistsCache = {};

      // 載入營地房間資料
      const campsiteResponse = await fetch(
        `${window.api_prefix}/campsite/getAllCampsite`
      );

      if (!campsiteResponse.ok) {
        throw new Error(`載入營地房間資料失敗：${campsiteResponse.status}`);
      }

      const allCampsitesJson = await campsiteResponse.json();
      const allCampsites = allCampsitesJson.data;
      this.campsiteData = allCampsites.filter(
        (campsite) => this.campData && campsite.campId === this.campData.campId
      );

      // 載入加購商品資料 - 使用API
      console.log("載入加購商品資料:", this.campData.campId);

      await this.loadBundleItemsByCampId(this.campData.campId);

      // 載入訂單資料
      const orderResponse = await fetch(
        `${window.api_prefix}/api/campsite/order/all`
      );
      if (!orderResponse.ok) {
        throw new Error(`載入訂單資料失敗：${orderResponse.status}`);
      }
      const allOrdersJson = await orderResponse.json();
      const allOrders = allOrdersJson.data;
      console.log("allOrders111:" + allOrders);

      this.orderData = allOrders.filter(
        (order) => this.campData && order.campId === this.campData.campId
      );

      // 載入訂單詳細資料
      const orderDetailsResponse = await fetch(
        "data/campsite_order_details.json"
      );
      if (!orderDetailsResponse.ok) {
        throw new Error(`載入訂單詳細資料失敗：${orderDetailsResponse.status}`);
      }
      this.orderDetails = await orderDetailsResponse.json();

      // 載入會員資料
      const memberResponse = await fetch("data/mem.json");
      if (!memberResponse.ok) {
        throw new Error(`載入會員資料失敗：${memberResponse.status}`);
      }
      this.memberData = await memberResponse.json();

      // 載入房型資料
      const campsiteTypeResponse = await fetch("data/campsite_type.json");
      if (!campsiteTypeResponse.ok) {
        throw new Error(`載入房型資料失敗：${campsiteTypeResponse.status}`);
      }
      const allCampsiteTypes = await campsiteTypeResponse.json();
      this.campsiteTypeData = allCampsiteTypes.filter(
        (type) => this.campData && type.campId === this.campData.campId
      );

      // 載入折價券資料
      const discountResponse = await fetch("data/discount_code.json");
      if (!discountResponse.ok) {
        throw new Error(`載入折價券資料失敗：${discountResponse.status}`);
      }
      const allDiscountCodes = await discountResponse.json();
      this.discountCodeData = allDiscountCodes.filter(
        (code) => code.owner_id === this.currentOwner.owner_id
      );

      console.log("所有資料載入完成");
    } catch (error) {
      console.error("載入資料失敗：", error);
      this.showMessage(`載入資料失敗：${error.message}`, "error");
    }
  }

  // 新增：使用API載入特定營地的加購項目
  async loadBundleItemsByCampId(campId) {
    try {
      console.log(`正在載入營地 ${campId} 的加購項目...`);

      if (!campId) {
        console.warn("campId 為空，無法載入加購項目");
        this.bundleItemData = [];
        return;
      }

      const response = await fetch(
        `${window.api_prefix}/bundleitem/${campId}/getBundleItems`
      );
      if (!response.ok) {
        throw new Error(`載入加購項目失敗：${response.status}`);
      }

      const data = await response.json();
      console.log(`API回傳的加購項目資料：`, data);

      // 確保回傳的資料是陣列
      if (Array.isArray(data)) {
        this.bundleItemData = data;
      } else if (data && Array.isArray(data.data)) {
        // 如果API回傳的是包裝在data欄位中的陣列
        this.bundleItemData = data.data;
      } else if (data && typeof data === "object") {
        // 如果API回傳的是物件，嘗試轉換為陣列
        this.bundleItemData = [data];
      } else {
        console.warn("API回傳的資料格式不正確，使用空陣列");
        this.bundleItemData = [];
      }

      console.log(`載入營地 ${campId} 的加購項目完成：`, this.bundleItemData);
    } catch (error) {
      console.error("載入加購項目失敗：", error);
      this.showMessage(`載入加購項目失敗：${error.message}`, "error");
      // 如果API失敗，使用空陣列
      this.bundleItemData = [];
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
        "camp-name": this.campData.campName,
        "camp-location":
          this.campData.campCity +
          this.campData.campDist +
          this.campData.campAddr,
        "camp-status": this.campData.campReleaseStatus,
        "camp-score":
          this.campData.campCommentNumberCount > 0
            ? (
                this.campData.campCommentSumScore /
                this.campData.campCommentNumberCount
              ).toFixed(1)
            : "0.0",
        "camp-description": this.campData.campContent || "",
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
    // 檢查緩存
    if (this.imageExistsCache.hasOwnProperty(url)) {
      return Promise.resolve(this.imageExistsCache[url]);
    }

    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          this.imageExistsCache[url] = true;
          resolve(true);
        };
        img.onerror = () => {
          this.imageExistsCache[url] = false;
          resolve(false);
        };
        img.src = url;
      } catch (error) {
        console.error("檢查圖片存在性時發生錯誤：", error);
        this.imageExistsCache[url] = false;
        resolve(false);
      }
    });
  }

  // 清除圖片存在性緩存
  clearImageCache(url = null) {
    if (url) {
      // 清除特定URL的緩存
      delete this.imageExistsCache[url];
    } else {
      // 清除所有緩存
      this.imageExistsCache = {};
    }
  }

  async renderCampImages() {
    try {
      if (!this.campData || !this.campData.campId) {
        throw new Error("無法渲染營地圖片：缺少營地資料或營地ID");
      }

      const campId = this.campData.campId;

      for (let i = 1; i <= 4; i++) {
        const container = document.getElementById(`campImage${i}Container`);
        if (!container) continue;

        // 檢查是否有暫存的圖片
        const pendingImage = this.pendingCampImages[i];

        if (pendingImage) {
          // 顯示暫存的圖片
          container.innerHTML = `
            <div class="image-container">
              <img src="${pendingImage.previewUrl}" class="thumbnail" onclick="ownerDashboard.showCampImageModal('${pendingImage.previewUrl}', ${i})" />
              <div class="image-actions">
                <button class="btn btn-sm btn-camping" onclick="ownerDashboard.uploadCampImage(${i}, event)"><i class="fas fa-upload"></i></button>
                <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteCampImage(${i})"><i class="fas fa-trash"></i></button>
              </div>
              <div class="image-status pending">待保存</div>
            </div>
          `;
        } else {
          // 檢查是否有現有圖片數據
          const hasImageData = true;
          if (hasImageData) {
            // 構建API圖片URL，添加時間戳破除快取
            const timestamp = new Date().getTime();
            const apiImageUrl = `${window.api_prefix}/api/camps/${campId}/${i}`;
            const apiImageUrlWithCache = `${apiImageUrl}?t=${timestamp}`;
            console.log("apiImageUrl:" + apiImageUrlWithCache);

            // 檢查API圖片是否可訪問（使用原始URL檢查）
            const apiImageExists = await this.checkImageExists(apiImageUrl);
            console.log(i + ":" + apiImageExists);

            if (apiImageExists) {
              // 如果API圖片存在，顯示圖片（使用帶時間戳的URL）
              container.innerHTML = `
                 <div class="image-container">
                   <img src="${apiImageUrlWithCache}" class="thumbnail" onclick="ownerDashboard.showCampImageModal('${apiImageUrlWithCache}', ${i})" />
                   <div class="image-actions">
                     <button class="btn btn-sm btn-camping" onclick="ownerDashboard.uploadCampImage(${i}, event)"><i class="fas fa-upload"></i></button>
                     <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteCampImage(${i})"><i class="fas fa-trash"></i></button>
                   </div>
                 </div>
               `;
            } else {
              // 如果API圖片不存在，顯示上傳佔位符
              container.innerHTML = `
                 <div class="image-placeholder" onclick="ownerDashboard.uploadCampImage(${i}, event)">
                   <i class="fas fa-plus"></i>
                   <span>上傳圖片</span>
                 </div>
               `;
            }
          } else {
            container.innerHTML = `
               <div class="image-placeholder" onclick="ownerDashboard.uploadCampImage(${i}, event)">
                 <i class="fas fa-plus"></i>
                 <span>上傳圖片</span>
               </div>
             `;
          }
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
        item.addEventListener("click", async (e) => {
          e.preventDefault();
          const tab = item.getAttribute("data-tab");
          await this.showTabContent(tab);

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
    // const editForm = document.getElementById("editRoomTypeForm");
    // if (editForm) {
    //   editForm.onsubmit = async (e) => {
    //     e.preventDefault();
    //     const formData = new FormData(editForm);
    //     // 取得現有房型資料
    //     const roomType = this.campsiteTypeData.find(
    //       (type) => (type.campsiteTypeId || type.campsite_type_id) == formData.get("campsiteTypeId")
    //     );
    //     const roomTypeData = {
    //       id: {
    //         campId: parseInt(formData.get("campId")),
    //         campsiteTypeId: parseInt(formData.get("campsiteTypeId")),
    //       },
    //       campsiteName: formData.get("campsiteName"),
    //       campsitePeople: parseInt(formData.get("campsitePeople")),
    //       campsiteNum: parseInt(formData.get("campsiteNum")),
    //       campsitePic1: roomType?.campsitePic1 || roomType?.campsite_pic1 || null,
    //       campsitePic2: roomType?.campsitePic2 || roomType?.campsite_pic2 || null,
    //       campsitePic3: roomType?.campsitePic3 || roomType?.campsite_pic3 || null,
    //       campsitePic4: roomType?.campsitePic4 || roomType?.campsite_pic4 || null,
    //     };
    //     // 呼叫 API
    //     const response = await fetch(
    //       "http://localhost:8081/CJA101G02/campsitetype/updateCampsiteType",
    //       {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify(roomTypeData),
    //       }
    //     );
    //     const result = await response.json();
    //     if (result.status === "success") {
    //       // 關閉 modal
    //       bootstrap.Modal.getInstance(
    //         document.getElementById("editRoomTypeModal")
    //       ).hide();
    //       this.showMessage("房型更改成功", "success");
    //       // 重新載入房型資料
    //       await this.loadCampsiteTypesByCampId(roomTypeData.id.campId);
    //     } else {
    //       this.showMessage(
    //         "房型修改失敗：" + (result.message || "未知錯誤"),
    //         "error"
    //       );
    //     }
    //   };
    // }

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
          campsiteTypeId: parseInt(formData.get("campsiteTypeId")),
        };
        try {
          const response = await fetch(
            `${window.api_prefix}/campsite/addCampsite`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            }
          );
          if (!response.ok) throw new Error(`新增房間失敗：${response.status}`);
          const result = await response.json();

          if (result.status === "success") {
            // 改用標準bootstrap.Modal關閉modal，避免抖動
            const modal = bootstrap.Modal.getInstance(
              document.getElementById("addRoomModal")
            );
            if (modal) {
              modal.hide();
              // 強制移除焦點，徹底解決 aria-hidden/focus 警告
              setTimeout(() => {
                document.body.focus();
              }, 0);
            }
            this.showMessage("房間新增成功！", "success");

            await this.showRoomDetails(data.campsiteTypeId);
            this.renderRoomTypes().catch((error) => {
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
              campId: parseInt(formData.get("campId")),
            },
          },
        };
        try {
          const response = await fetch(
            `${window.api_prefix}/campsite/updateCampsite`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            }
          );
          if (!response.ok) throw new Error(`編輯房間失敗：${response.status}`);
          const result = await response.json();
          if (result.status === "success") {
            // 改用標準bootstrap.Modal關閉modal，避免抖動
            const modal = bootstrap.Modal.getInstance(
              document.getElementById("editRoomModal")
            );
            if (modal) modal.hide();
            this.showMessage("房間編輯成功！", "success");
            await this.showRoomDetails(data.campsiteType.id.campsiteTypeId);
          } else {
            this.showMessage(
              "房間編輯失敗：" + (result.message || "未知錯誤"),
              "error"
            );
          }
        } catch (error) {
          this.showMessage(`房間編輯失敗：${error.message}`, "error");
        }
      };
    }

    // 綁定房間明細modal的關閉事件
    const roomDetailModal = document.getElementById("roomDetailModal");
    if (roomDetailModal) {
      // 關閉前先移除焦點，避免 aria-hidden 警告
      roomDetailModal.addEventListener("hide.bs.modal", () => {
        const focused = roomDetailModal.querySelector(":focus");
        if (focused) focused.blur();
        setTimeout(() => {
          document.body.focus();
        }, 0);
      });

      // 關閉後做 DOM 清理
      roomDetailModal.addEventListener("hidden.bs.modal", () => {
        removeAllBackdrops();
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      });

      // 在modal開啟時也處理焦點問題
      roomDetailModal.addEventListener("shown.bs.modal", () => {
        // 確保modal開啟時焦點在正確的位置
        const firstFocusableElement = roomDetailModal.querySelector(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
      });
    }

    // 綁定新增房型表單送出
    const addRoomTypeForm = document.getElementById("addRoomTypeForm");
    if (addRoomTypeForm) {
      // 移除重複的事件綁定，改為在bindModalEvents中統一處理
      // addRoomTypeForm.onsubmit = (e) => this.handleAddRoomType(e);

      // 綁定新增房型圖片預覽
      for (let i = 1; i <= 4; i++) {
        const imgInput = document.getElementById(`add-roomtype-img${i}`);
        const previewImg = document.getElementById(
          `add-roomtype-img-preview${i}`
        );
        const uploadHint = document.getElementById(`add-upload-hint${i}`);

        if (imgInput && previewImg && uploadHint) {
          imgInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewImg.style.display = "block";
                uploadHint.style.display = "none";
              };
              reader.readAsDataURL(file);
            } else {
              previewImg.style.display = "none";
              uploadHint.style.display = "flex";
            }
          };
        }
      }
    }

    // 新增房間 modal 無障礙焦點處理
    const addRoomModal = document.getElementById("addRoomModal");
    if (addRoomModal) {
      // 關閉前先移除焦點，避免 aria-hidden 警告
      addRoomModal.addEventListener("hide.bs.modal", () => {
        const focused = addRoomModal.querySelector(":focus");
        if (focused) focused.blur();
        setTimeout(() => {
          document.body.focus();
        }, 0);
      });
      // 開啟時聚焦
      addRoomModal.addEventListener("shown.bs.modal", () => {
        const firstFocusableElement = addRoomModal.querySelector(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
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
      orderStatusFilter.addEventListener("change", async () => await this.renderOrders());
    }
  }

  async showTabContent(tabName) {
    // 隱藏所有內容
    document.querySelectorAll(".profile-section").forEach((content) => {
      content.classList.remove("active");
    });

    // 顯示指定內容
    const targetContent = document.getElementById(tabName);
    if (targetContent) {
      targetContent.classList.add("active");
    }

    // 同步左側 menu active 狀態
    document.querySelectorAll(".profile-menu-item").forEach((item) => {
      item.classList.remove("active");
      if (item.getAttribute("data-tab") === tabName) {
        item.classList.add("active");
      }
    });

    // 保存當前頁面到 localStorage
    localStorage.setItem("ownerDashboardLastTab", tabName);

    // 根據不同頁面載入對應資料
    switch (tabName) {
      case "room-types":
        // 這裡改成每次都強制呼叫API
        this.renderRoomTypes(false, true).catch((error) => {
          console.error("載入房型資料失敗：", error);
        });
        break;
      case "bundle-items":
        this.renderBundleItems();
        break;
      case "orders":
        await this.renderOrders();
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

  // 新增：直接將新房型新增到表格底部
  addRoomTypeToTable(roomType) {
    const tableBody = document.getElementById("roomTypesTableBody");
    if (!tableBody) {
      console.error("找不到房型表格主體元素");
      return;
    }

    // 取得房型ID和營地ID
    const campsiteTypeId = roomType.campsiteTypeId || roomType.campsite_type_id;
    const campId = roomType.campId || roomType.camp_id;

    // 檢查是否有圖片資料
    const hasImages = [1, 2, 3, 4].some((i) => {
      const pic = roomType[`campsitePic${i}`] || roomType[`campsite_pic${i}`];
      return pic && pic.length > 0;
    });

    // 輪播 HTML
    let carouselHtml = "";
    if (hasImages && campsiteTypeId && campId) {
      const carouselId = `carousel-${campsiteTypeId}`;
      carouselHtml = `
        <div id="${carouselId}" class="carousel slide" style="width:200px;height:160px;border-radius:12px;overflow:hidden;">
          <div class="carousel-inner" style="width:200px;height:160px;">
            ${[1, 2, 3, 4]
              .map((index, idx) => {
                const pic =
                  roomType[`campsitePic${index}`] ||
                  roomType[`campsite_pic${index}`];
                if (pic && pic.length > 0) {
                  return `
                  <div class="carousel-item${idx === 0 ? " active" : ""}">
                    <img src="${
                      window.api_prefix
                    }/campsitetype/${campsiteTypeId}/${campId}/images/${index}" 
                         class="d-block w-100 roomtype-carousel-img" 
                         style="width:100%;height:100%;object-fit:cover;" 
                         onerror="this.style.display='none'; this.parentElement.style.display='none';" />
                  </div>
                `;
                }
                return "";
              })
              .filter(Boolean)
              .join("")}
          </div>
          ${
            [1, 2, 3, 4].filter((index) => {
              const pic =
                roomType[`campsitePic${index}`] ||
                roomType[`campsite_pic${index}`];
              return pic && pic.length > 0;
            }).length > 1
              ? `
          <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev" style="width:24px;height:160px;">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next" style="width:24px;height:160px;">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </button>
          `
              : ""
          }
        </div>
      `;
    } else {
      carouselHtml =
        '<div style="width:80px;height:60px;display:flex;align-items:center;justify-content:center;background:rgba(128,128,128,0.12);border-radius:4px;">無圖片</div>';
    }

    // 建立新的表格行
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td>${carouselHtml}</td>
      <td>${campsiteTypeId}</td>
      <td>${roomType.campsiteName || roomType.campsiteName || ""}</td>
      <td>${
        roomType.campsiteNum || roomType.campsiteNum
          ? (roomType.campsiteNum || roomType.campsiteNum) + "間"
          : ""
      }</td>
      <td>
        <button class="btn btn-link p-0" onclick="ownerDashboard.showRoomDetails(${
          roomType.campsiteTypeId || roomType.campsiteTypeId
        })">
          載入中...
        </button>
      </td>
      <td>${roomType.campsitePeople || roomType.campsite_people || ""} 人</td>
      <td>NT$ ${
        roomType.campsitePrice !== undefined
          ? roomType.campsitePrice
          : roomType.campsite_price !== undefined
          ? roomType.campsite_price
          : ""
      }</td>
      <td>
        <div class="d-flex">
          <button class="btn btn-sm btn-secondary" onclick="ownerDashboard.editRoomType(${
            roomType.campsiteTypeId || roomType.campsite_type_id
          })">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger ms-2" onclick="ownerDashboard.deleteRoomType(${
            roomType.campsiteTypeId || roomType.campsite_type_id
          })">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    // 新增到表格底部
    tableBody.appendChild(newRow);

    // 移除「尚未設定任何房型」的提示
    const noDataRow = tableBody.querySelector('tr td[colspan="9"]');
    if (noDataRow && noDataRow.textContent.includes("尚未設定任何房型")) {
      noDataRow.parentElement.remove();
    }

    // 載入實際房間數量
    this.loadRoomCountForRow(newRow, campsiteTypeId, campId);
  }

  // 新增函數：為特定行載入房間數量
  async loadRoomCountForRow(row, campsiteTypeId, campId) {
    try {
      // 驗證參數
      if (!campsiteTypeId || !campId) {
        console.warn(
          `無法載入房間數量：campsiteTypeId=${campsiteTypeId}, campId=${campId}`
        );
        const button = row.querySelector('button[onclick*="showRoomDetails"]');
        if (button) {
          button.textContent = "0 間";
        }
        return;
      }

      const apiUrl = `${window.api_prefix}/campsitetype/${campsiteTypeId}/${campId}/getcampsites`;
      console.log(`載入房間數量 API: ${apiUrl}`);

      const response = await fetch(apiUrl);
      if (response.ok) {
        const result = await response.json();
        const actualRoomCount = Array.isArray(result.data)
          ? result.data.length
          : 0;

        // 更新按鈕文字
        const button = row.querySelector('button[onclick*="showRoomDetails"]');
        if (button) {
          button.textContent = `${actualRoomCount} 間`;
        }
      } else {
        console.warn(`載入房間數量失敗：${response.status}`);
        // 如果載入失敗，顯示 0 間
        const button = row.querySelector('button[onclick*="showRoomDetails"]');
        if (button) {
          button.textContent = "0 間";
        }
      }
    } catch (error) {
      console.error(`載入房型 ${campsiteTypeId} 的房間數量失敗：`, error);
      // 如果載入失敗，顯示 0 間
      const button = row.querySelector('button[onclick*="showRoomDetails"]');
      if (button) {
        button.textContent = "0 間";
      }
    }
  }

  async renderRoomTypes(useLocalData = false, loadRoomCounts = true) {
    console.log("renderRoomTypes called");

    const tableBody = document.getElementById("roomTypesTableBody");
    if (!tableBody) {
      console.error("找不到房型表格主體元素");
      return;
    }

    // 顯示載入中
    tableBody.innerHTML =
      '<tr><td colspan="9" class="text-center">載入中...</td></tr>';

    // 取得當前選中的營地ID
    let campId = null;
    const ownerProfileSelect = document.getElementById("ownerProfileSelect");
    if (ownerProfileSelect && ownerProfileSelect.value) {
      campId = ownerProfileSelect.value;
    } else if (this.campData && this.campData.campId) {
      campId = this.campData.campId;
    }
    if (!campId) {
      console.warn("無法取得當前營地ID，無法載入房型資料");
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center">無法取得營地ID，請先選擇營地</td></tr>';
      return;
    }

    // 如果沒有本地資料或強制重新載入，則呼叫API
    if (
      !useLocalData ||
      !this.campsiteTypeData ||
      this.campsiteTypeData.length === 0
    ) {
      try {
        const apiUrl = `${window.api_prefix}/campsitetype/${campId}/getCampsiteTypes`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API回應失敗：${response.status}`);
        const result = await response.json();
        this.campsiteTypeData = Array.isArray(result.data) ? result.data : [];
      } catch (error) {
        console.error("取得房型資料失敗：", error);
        tableBody.innerHTML =
          '<tr><td colspan="9" class="text-center">載入房型資料失敗</td></tr>';
        return;
      }
    }

    // 過濾當前營地的房型資料
    const currentCampRoomTypes = this.campsiteTypeData.filter(
      (roomType) => (roomType.campId || roomType.campId) == campId
    );

    if (!currentCampRoomTypes || currentCampRoomTypes.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center">尚未設定任何房型</td></tr>';
      return;
    }

    // 取得所有房型的房間數量（可選）
    let roomTypeData;
    if (loadRoomCounts) {
      const roomTypePromises = currentCampRoomTypes.map(async (roomType) => {
        const roomTypeId = roomType.campsiteTypeId || roomType.campsite_type_id;
        const campId = roomType.campId || roomType.campId;
        let actualRoomCount = 0;

        // 驗證參數
        if (roomTypeId && campId) {
          try {
            const apiUrl = `${window.api_prefix}/campsitetype/${roomTypeId}/${campId}/getcampsites`;
            console.log(`載入房型 ${roomTypeId} 房間數量: ${apiUrl}`);
            const response = await fetch(apiUrl);
            if (response.ok) {
              const result = await response.json();
              actualRoomCount = Array.isArray(result.data)
                ? result.data.length
                : 0;
            }
          } catch (error) {
            console.warn(`載入房型 ${roomTypeId} 房間數量失敗:`, error);
            actualRoomCount = 0;
          }
        } else {
          console.warn(
            `房型資料不完整：roomTypeId=${roomTypeId}, campId=${campId}`
          );
        }

        return { roomType, actualRoomCount };
      });
      roomTypeData = await Promise.all(roomTypePromises);
    } else {
      // 不載入房間數量，使用預設值
      roomTypeData = currentCampRoomTypes.map((roomType) => ({
        roomType,
        actualRoomCount: 0,
      }));
    }

    const html = roomTypeData
      .map(({ roomType, actualRoomCount }) => {
        // 取得房型ID和營地ID
        const campsiteTypeId =
          roomType.campsiteTypeId || roomType.campsite_type_id;
        const campId = roomType.campId || roomType.campId;
        // 檢查是否有圖片資料（檢查是否有base64資料）
        const hasImages = [1, 2, 3, 4].some((i) => {
          const pic =
            roomType[`campsitePic${i}`] || roomType[`campsite_pic${i}`];
          return pic && pic.length > 0;
        });
        // 輪播 HTML
        let carouselHtml = "";
        if (hasImages && campsiteTypeId && campId) {
          const carouselId = `carousel-${campsiteTypeId}`;
          const isJustUpdated =
            this.justUpdatedRoomTypeId ===
            (roomType.campsiteTypeId || roomType.campsite_type_id);
          const tsParam = isJustUpdated ? `?t=${Date.now()}` : "";
          carouselHtml = `
          <div id="${carouselId}" class="carousel slide" style="width:200px;height:160px;border-radius:12px;overflow:hidden;">
            <div class="carousel-inner" style="width:200px;height:160px;">
              ${[1, 2, 3, 4]
                .map((index, idx) => {
                  const pic =
                    roomType[`campsitePic${index}`] ||
                    roomType[`campsite_pic${index}`];
                  if (pic && pic.length > 0) {
                    return `
                    <div class="carousel-item${idx === 0 ? " active" : ""}">
                      <img src="${
                        window.api_prefix
                      }/campsitetype/${campsiteTypeId}/${campId}/images/${index}${tsParam}" 
                           class="d-block w-100 roomtype-carousel-img" 
                           style="width:100%;height:100%;object-fit:cover;" 
                           onerror="this.style.display='none'; this.parentElement.style.display='none';" />
                    </div>
                  `;
                  }
                  return "";
                })
                .filter(Boolean)
                .join("")}
            </div>
            ${
              [1, 2, 3, 4].filter((index) => {
                const pic =
                  roomType[`campsitePic${index}`] ||
                  roomType[`campsite_pic${index}`];
                return pic && pic.length > 0;
              }).length > 1
                ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev" style="width:24px;height:160px;">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next" style="width:24px;height:160px;">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>
            `
                : ""
            }
          </div>
        `;
        } else {
          carouselHtml =
            '<div style="width:80px;height:60px;display:flex;align-items:center;justify-content:center;background:rgba(128,128,128,0.12);border-radius:4px;">無圖片</div>';
        }
        return `
        <tr>
          <td>${carouselHtml}</td>
          <td>${campsiteTypeId}</td>
          <td>${roomType.campsiteName || roomType.campsiteName || ""}</td>
          <td>${
            roomType.campsiteNum || roomType.campsiteNum
              ? (roomType.campsiteNum || roomType.campsiteNum) + "間"
              : ""
          }</td>
          <td>
            <button class="btn btn-link p-0" onclick="ownerDashboard.showRoomDetails(${
              roomType.campsiteTypeId || roomType.campsiteTypeId
            })">
              ${actualRoomCount} 間
            </button>
          </td>
          <td>${
            roomType.campsitePeople || roomType.campsitePeople || ""
          } 人</td>
          <td>NT$ ${
            roomType.campsitePrice !== undefined
              ? roomType.campsitePrice
              : roomType.campsitePrice !== undefined
              ? roomType.campsitePrice
              : ""
          }</td>
          <td>
            <div class="d-flex">
              <button class="btn btn-sm btn-secondary" onclick="ownerDashboard.editRoomType(${
                roomType.campsiteTypeId || roomType.campsiteTypeId
              })">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger ms-2" onclick="ownerDashboard.deleteRoomType(${
                roomType.campsiteTypeId || roomType.campsiteTypeId
              })">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");
    tableBody.innerHTML = html;

    // 在 renderRoomTypes 結尾清空 justUpdatedRoomTypeId
    this.justUpdatedRoomTypeId = null;
  }

  renderBundleItems() {
    const tableBody = document.getElementById("bundleItemsTableBody");
    if (!tableBody) return;

    // 確保 bundleItemData 是陣列
    if (!Array.isArray(this.bundleItemData)) {
      console.warn("bundleItemData 不是陣列，重置為空陣列");
      this.bundleItemData = [];
    }

    if (this.bundleItemData.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="4" class="text-center py-4">尚未設定任何加購商品</td></tr>';
      return;
    }

    const html = this.bundleItemData
      .map(
        (item) => `
      <tr>
        <td>${item.bundle_name || item.bundleName || "未命名"}</td>
        <td>NT$ ${item.bundle_price || item.bundlePrice || 0}</td>
        <td>${item.bundle_add_date || item.bundleAddDate || "-"}</td>
        <td>
          <div class="d-flex">
            <button class="btn btn-sm btn-secondary" onclick="ownerDashboard.editBundleItem('${
              item.bundle_id || item.bundleId || ""
            }')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger ms-2" onclick="ownerDashboard.deleteBundleItem('${
              item.bundle_id || item.bundleId || ""
            }')">
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

  async renderOrders() {
    const tableBody = document.getElementById("ordersTableBody");
    const statusFilter = document.getElementById("orderStatusFilter");
    if (!tableBody) return;

    let filteredOrders = this.orderData;
    if (statusFilter && statusFilter.value) {
      filteredOrders = this.orderData.filter(
        (order) => order.campsiteOrderStatus === statusFilter.value
      );
    }

    if (filteredOrders.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="10" class="text-center py-4">沒有符合條件的訂單</td></tr>';
      return;
    }

    const htmlPromises = filteredOrders.map(async (order) => {
      // 使用 API 獲取該訂單的詳細資料
      let orderDetails = [];
      try {
        const response = await fetch(`${window.api_prefix}/api/campsite/order/getone/${order.campsiteOrderId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.status === "success" && result.data && result.data.orderDetails) {
            orderDetails = result.data.orderDetails;
          }
        }
      } catch (error) {
        console.error(`獲取訂單 ${order.campsiteOrderId} 詳細資料失敗:`, error);
      }
      console.log("orderDetails:", orderDetails);
        // 獲取會員姓名
        const member = this.memberData.find((m) => m.memId === order.memId);
        const memberName = member ? member.mem_name : `會員${order.memId}`;

        // 計算總營地數量和金額
        const totalCampsiteNum = orderDetails.reduce(
          (sum, detail) => sum + detail.campsiteNum,
          0
        );
        const totalCampsiteAmount = orderDetails.reduce(
          (sum, detail) => sum + detail.campsiteAmount,
          0
        );

        // 獲取房型名稱（顯示第一個房型，如果有多個則顯示"等N種房型"）
        let roomTypeDisplay = "無";
        if (orderDetails.length > 0) {
          const firstRoomType = this.campsiteTypeData.find(
            (type) => type.campsiteTypeId === orderDetails[0].campsiteTypeId
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
        <td>#${order.campsiteOrderId}</td>
        <td>${memberName}</td>
        <td>${roomTypeDisplay}</td>
        <td>${totalCampsiteNum}</td>
        <td>NT$ ${order.campsiteAmount.toLocaleString()}</td>
        <td>${order.checkIn.split(" ")[0]}</td>
        <td>${order.checkOut.split(" ")[0]}</td>
        <td>NT$ ${order.aftAmount.toLocaleString()}</td>
        <td>
          <span class="badge bg-${
            order.campsiteOrderStatus === "1"
              ? "warning"
              : order.campsiteOrderStatus === "2"
              ? "info"
              : order.campsiteOrderStatus === "3"
              ? "success"
              : "danger"
          }">
            ${this.getOrderStatusText(order.campsiteOrderStatus)}
          </span>
        </td>
        <td>
          ${this.getOrderActionButtons(order)}
        </td>
      </tr>
    `;
      });

    const htmlArray = await Promise.all(htmlPromises);
    const html = htmlArray.join("");

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
        <td>${code.discountCodeId}</td>
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
            code.discountCodeId
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
      <button class="btn btn-sm btn-info me-1" onclick="ownerDashboard.showOrderDetails('${order.campsiteOrderId}')">
        <i class="fas fa-info-circle"></i> 細節
      </button>
    `;

    switch (order.campsiteOrderStatus) {
      case 1:
        actionButtons += `
          <button class="btn btn-sm btn-danger" onclick="ownerDashboard.cancelOrder('${order.campsiteOrderId}')">
            <i class="fas fa-times"></i>
          </button>
        `;
        break;
      case 2:
        actionButtons += `
          <button class="btn btn-sm btn-camping me-1" onclick="ownerDashboard.checkInOrder('${order.campsiteOrderId}')">
            <i class="fas fa-sign-in-alt"></i>
          </button>
          <button class="btn btn-sm btn-warning" onclick="ownerDashboard.checkOutOrder('${order.campsiteOrderId}')">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        `;
        break;
    }

    return actionButtons;
  }

  // 顯示訂單詳細資料
  showOrderDetails(orderId) {
    const order = this.orderData.find((o) => o.campsiteOrderId === orderId);
    if (!order) return;

    // 獲取訂單詳細資料
    const orderDetails = this.orderDetails.filter(
      (detail) => detail.campsiteOrderId === orderId
    );
    console.log(this.campData);
    console.log(campData);

    // 查找折價券信息
    let discountInfo = null;
    if (order.discountCodeId) {
      discountInfo = this.discountCodeData.find(
        (discount) => discount.discountCodeId === order.discountCodeId
      );
    }

    // 獲取會員資料
    const member = memberData.find((m) => m.memId == order.memId);
    const memberName = member ? member.mem_name : `會員${order.memId}`;

    // 獲取營地資料
    const camp = campData.find((c) => c.campId == order.campId);
    const campName = camp ? camp.camp_name : "營地名稱";

    // 生成營地類型詳細資料
    const campsiteDetailsHtml = orderDetails
      .map((detail) => {
        const campsiteType = this.campsiteTypeData.find(
          (type) => type.campsiteTypeId === detail.campsiteTypeId
        );

        return `
        <div class="campsite-detail-item">
          <div class="campsite-info">
            <h6>${campsiteType ? campsiteType.campsite_name : "未知房型"}</h6>
            <p class="text-muted">房型ID: ${detail.campsiteTypeId}</p>
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
            <p><strong>預訂數量:</strong> ${detail.campsiteNum} 間</p>
            <p><strong>小計金額:</strong> NT$ ${detail.campsiteAmount.toLocaleString()}</p>
          </div>
        </div>
      `;
      })
      .join("");

    // 計算總數量和金額
    const totalCampsiteNum = orderDetails.reduce(
      (sum, detail) => sum + detail.campsiteNum,
      0
    );
    const totalCampsiteAmount = orderDetails.reduce(
      (sum, detail) => sum + detail.campsiteAmount,
      0
    );

    // 獲取訂單狀態文字
    const statusText = this.getOrderStatusText(order.campsiteOrderStatus);
    const statusClass =
      order.campsiteOrderStatus === "1"
        ? "warning"
        : order.campsiteOrderStatus === "2"
        ? "info"
        : order.campsiteOrderStatus === "3"
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
                    <p><strong>訂單編號:</strong> ${order.campsiteOrderId}</p>
                    <p><strong>營地名稱:</strong> ${campName}</p>
                    <p><strong>客戶姓名:</strong> ${memberName}</p>
                    <p><strong>下訂日期:</strong> ${order.orderDate}</p>
                  </div>
                  <div class="col-md-6">
                    <h6>住宿資訊</h6>
                    <p><strong>入住日期:</strong> ${
                      order.checkIn.split(" ")[0]
                    }</p>
                    <p><strong>退房日期:</strong> ${
                      order.checkOut.split(" ")[0]
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
                      <span>NT$ ${order.campsiteAmount.toLocaleString()}</span>
                    </div>
                    ${
                      order.bundleAmount > 0
                        ? `
                    <div class="amount-item">
                      <span>加購項目:</span>
                      <span>NT$ ${order.bundleAmount.toLocaleString()}</span>
                    </div>
                    `
                        : ""
                    }
                    <div class="amount-item">
                      <span>小計:</span>
                      <span>NT$ ${order.befAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    ${
                      order.disAmount > 0
                        ? `
                    <div class="amount-item discount">
                      <span>折扣:</span>
                      <span class="text-success">-NT$ ${order.disAmount.toLocaleString()}</span>
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
                      <span><strong class="text-primary">NT$ ${order.aftAmount.toLocaleString()}</strong></span>
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
      // 在關閉前處理焦點問題
      const focusedElements = modalElement.querySelectorAll(":focus");
      focusedElements.forEach((element) => {
        element.blur();
      });

      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
      // 清空表單
      const form = modalElement.querySelector("form");
      if (form) form.reset();

      // 確保焦點回到頁面主體
      document.body.focus();
    }
  }

  showAddRoomTypeModal() {
    const modal = new bootstrap.Modal(
      document.getElementById("addRoomTypeModal")
    );
    modal.show();

    // 設定背景罩遮樣式
    removeAllBackdrops();

    // 在modal開啟後處理焦點
    const modalElement = document.getElementById("addRoomTypeModal");
    if (modalElement) {
      modalElement.addEventListener(
        "shown.bs.modal",
        () => {
          // 確保modal開啟時焦點在正確的位置
          const firstFocusableElement = modalElement.querySelector(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusableElement) {
            firstFocusableElement.focus();
          }
        },
        { once: true }
      ); // 只執行一次

      // 在modal關閉時處理焦點
      modalElement.addEventListener("hidden.bs.modal", () => {
        // 確保所有modal內的焦點元素都失去焦點
        const focusedElements = modalElement.querySelectorAll(":focus");
        focusedElements.forEach((element) => {
          element.blur();
        });

        // 確保焦點回到頁面主體
        document.body.focus();
      });
    }
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

    // 設定背景罩遮樣式
    removeAllBackdrops();

    // 在modal開啟後處理焦點
    const modalElement = document.getElementById("addBundleItemModal");
    if (modalElement) {
      modalElement.addEventListener(
        "shown.bs.modal",
        () => {
          // 確保modal開啟時焦點在正確的位置
          const firstFocusableElement = modalElement.querySelector(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusableElement) {
            firstFocusableElement.focus();
          }
        },
        { once: true }
      ); // 只執行一次

      // 在modal關閉時處理焦點
      modalElement.addEventListener("hidden.bs.modal", () => {
        // 確保所有modal內的焦點元素都失去焦點
        const focusedElements = modalElement.querySelectorAll(":focus");
        focusedElements.forEach((element) => {
          element.blur();
        });

        // 確保焦點回到頁面主體
        document.body.focus();
      });
    }
  }

  showAddDiscountCodeModal() {
    // 使用Bootstrap方式顯示模態框
    const modal = new bootstrap.Modal(
      document.getElementById("addDiscountCodeModal")
    );
    modal.show();

    // 設定背景罩遮樣式
    removeAllBackdrops();

    // 在modal開啟後處理焦點
    const modalElement = document.getElementById("addDiscountCodeModal");
    if (modalElement) {
      modalElement.addEventListener(
        "shown.bs.modal",
        () => {
          // 確保modal開啟時焦點在正確的位置
          const firstFocusableElement = modalElement.querySelector(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusableElement) {
            firstFocusableElement.focus();
          }
        },
        { once: true }
      ); // 只執行一次

      // 在modal關閉時處理焦點
      modalElement.addEventListener("hidden.bs.modal", () => {
        // 確保所有modal內的焦點元素都失去焦點
        const focusedElements = modalElement.querySelectorAll(":focus");
        focusedElements.forEach((element) => {
          element.blur();
        });

        // 確保焦點回到頁面主體
        document.body.focus();
      });
    }
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

  async handleCampInfoUpdate(e) {
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
      ? this.campData.campCommentNumberCount || 0
      : 0;
    const campCommentSumScore = this.campData
      ? this.campData.campCommentSumScore || 0
      : 0;

    // 獲取營地註冊日期，如果沒有則使用當前日期
    const today = new Date();
    const campRegDate =
      this.campData && this.campData.campRegDate
        ? this.campData.campRegDate
        : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(today.getDate()).padStart(2, "0")}`;

    // 獲取營地主ID
    const ownerId = this.currentOwner.owner_id;

    // 創建FormData對象用於API請求
    const apiFormData = new FormData();
    apiFormData.append("campId", this.campData.campId);
    apiFormData.append("ownerId", ownerId);
    apiFormData.append("campName", campName);
    apiFormData.append("campContent", campContent);
    apiFormData.append("campCity", campCity);
    apiFormData.append("campDist", campDist);
    apiFormData.append("campAddr", campAddr);
    apiFormData.append("campReleaseStatus", 1);
    apiFormData.append("campCommentNumberCount", 0);
    apiFormData.append("campCommentSumScore", 0);
    apiFormData.append("campRegDate", campRegDate);

    console.log("apiFormData", apiFormData);

    console.log("campId", this.campData.campId);
    console.log("ownerId", ownerId);
    console.log("上傳圖片");

    // 處理營地圖片
    try {
      console.log("刪除的圖片索引:", this.deletedCampImages);
      const imageResults = await this.handleCampImageUpload();
      console.log("圖片處理結果:", imageResults);

      // 處理所有4個圖片位置，被刪除的傳送null
      for (let i = 1; i <= 4; i++) {
        console.log("deletedCampImages:", this.deletedCampImages[i], i);

        if (this.deletedCampImages[i]) {
          // 被刪除的圖片傳送null
          apiFormData.append(`campPic${i}`, null);
          console.log(`添加圖片到FormData: campPic${i} = null (已刪除)`);
        } else {
          // 查找對應的圖片結果
          const result = imageResults.find((r) => r.index === i);
          if (result) {
            const filename = result.filename || `campPic${i}.jpg`;
            apiFormData.append(`campPic${i}`, result.file, filename);
            console.log(`添加圖片到FormData: campPic${i} (${filename})`);
          } else {
            // 如果沒有圖片，也傳送null
            apiFormData.append(`campPic${i}`, null);
            console.log(`添加圖片到FormData: campPic${i} = null (無圖片)`);
          }
        }
      }

      console.log("所有圖片已處理完成");
    } catch (error) {
      console.error("圖片處理失敗:", error);
      this.showMessage("圖片處理失敗，請稍後再試", "error");
      return;
    }

    console.log("apiFormData", apiFormData, apiFormData.campPic4);

    // 發送API請求
    fetch(
      //create
      // "http://localhost:8081/CJA101G02/api/camps/createonecamp?withOrders=false",

      //update
      // "http://localhost:8081/CJA101G02/api/camps/updateonecamp",
      `${window.api_prefix}/api/camps/updateonecamp`,
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

          // 清空暫存的圖片
          this.pendingCampImages = {};

          // 清除圖片存在性快取，確保重新檢查圖片
          this.imageExistsCache = {};

          // 重新渲染營地圖片
          this.renderCampImages();

          console.log("營地資料和圖片更新完成，已清除圖片快取");
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

  async handleAddRoomType(e) {
    e.preventDefault();

    // 防重複提交
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton && submitButton.disabled) {
      console.log("表單正在處理中，請勿重複提交");
      return;
    }

    // 禁用提交按鈕
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "處理中...";
    }

    try {
      const form = e.target;
      const formData = new FormData(form);

      const campsiteName = formData.get("campsite_name");
      const campsitePeople = formData.get("campsite_people");
      const campsiteNum = formData.get("campsiteNum");
      const campsitePrice = formData.get("campsite_price");
      const imgFiles = [
        form.querySelector("#add-roomtype-img1").files[0],
        form.querySelector("#add-roomtype-img2").files[0],
        form.querySelector("#add-roomtype-img3").files[0],
        form.querySelector("#add-roomtype-img4").files[0],
      ];

      // 驗證
      if (!campsiteName || campsiteName.trim() === "") {
        this.showMessage("請輸入房型名稱", "error");
        return;
      }
      if (!campsitePeople || isNaN(parseInt(campsitePeople))) {
        this.showMessage("請輸入有效的可入住人數", "error");
        return;
      }
      if (!campsiteNum || isNaN(parseInt(campsiteNum))) {
        this.showMessage("請輸入有效的房間數量", "error");
        return;
      }
      const campsiteNumValue = parseInt(campsiteNum);
      if (campsiteNumValue < 0 || campsiteNumValue > 50) {
        this.showMessage("房間數量必須在 0-50 之間", "error");
        return;
      }
      if (!campsitePrice || isNaN(parseInt(campsitePrice))) {
        this.showMessage("請輸入有效的房間價格", "error");
        return;
      }
      if (!imgFiles[0]) {
        this.showMessage("請上傳房間照片1（必填項目）", "error");
        return;
      }

      // 驗證圖片檔案
      const maxFileSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];

      for (let i = 0; i < imgFiles.length; i++) {
        if (imgFiles[i]) {
          if (imgFiles[i].size > maxFileSize) {
            this.showMessage(`圖片${i + 1}檔案大小超過5MB限制`, "error");
            return;
          }
          if (!allowedTypes.includes(imgFiles[i].type)) {
            this.showMessage(
              `圖片${i + 1}格式不支援，請使用 JPG、PNG 或 GIF 格式`,
              "error"
            );
            return;
          }
        }
      }

      // 重新組FormData，欄位名稱與後端一致
      const apiFormData = new FormData();
      apiFormData.append("campsiteName", campsiteName.trim());
      apiFormData.append("campsitePeople", campsitePeople);
      apiFormData.append("campsiteNum", campsiteNum);
      apiFormData.append("campsitePrice", campsitePrice);
      apiFormData.append("id.campId", this.campData.campId);
      // 移除 id.campsiteTypeId，後端會自動產生
      if (imgFiles[0]) apiFormData.append("campsitePic1", imgFiles[0]);
      if (imgFiles[1]) apiFormData.append("campsitePic2", imgFiles[1]);
      if (imgFiles[2]) apiFormData.append("campsitePic3", imgFiles[2]);
      if (imgFiles[3]) apiFormData.append("campsitePic4", imgFiles[3]);

      try {
        const res = await fetch(
          `${window.api_prefix}/campsitetype/${this.campData.campId}/addCampsiteType`,
          {
            method: "POST",
            body: apiFormData, // 不要加headers，瀏覽器自動處理
          }
        );

        // 取得回應內容
        const responseText = await res.text();

        if (!res.ok) {
          console.error("API錯誤回應:", responseText);
          throw new Error(
            `HTTP error! Status: ${res.status}, Response: ${responseText}`
          );
        }

        // 嘗試解析JSON
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error("JSON解析失敗:", parseError);
          throw new Error(`回應格式錯誤: ${responseText}`);
        }

        // 檢查回應格式
        if (result.status && result.status !== "success") {
          this.showMessage(
            `新增房型失敗：${result.message || "未知錯誤"}`,
            "error"
          );
          return;
        }

        // 如果沒有status欄位，檢查是否有id欄位表示成功
        if (result.id && result.campsiteName) {
          console.log("房型新增成功，新房型ID:", result.id);
          this.showMessage("房型新增成功！", "success");
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("addRoomTypeModal")
          );
          if (modal) modal.hide();
          e.target.reset();

          // 建立新房型物件
          const newRoomType = {
            campsiteTypeId: result.id.campsiteTypeId || result.campsiteTypeId,
            campId: result.id.campId || this.campData.campId,
            campsiteName: result.campsiteName,
            campsitePeople: result.campsitePeople,
            campsiteNum: result.campsiteNum,
            campsitePrice: result.campsitePrice,
            campsitePic1: result.campsitePic1,
            campsitePic2: result.campsitePic2,
            campsitePic3: result.campsitePic3,
            campsitePic4: result.campsitePic4,
          };

          // 將新房型加入本地資料
          if (!this.campsiteTypeData) {
            this.campsiteTypeData = [];
          }
          this.campsiteTypeData.push(newRoomType);

          // 直接新增到表格底部，不需要重新渲染整個列表
          this.addRoomTypeToTable(newRoomType);
        } else {
          this.showMessage("新增房型失敗：回應格式異常", "error");
        }
      } catch (error) {
        console.error("新增房型失敗：", error);
        this.showMessage(
          `新增房型失敗：${error.message || "未知錯誤"}`,
          "error"
        );
      }
    } finally {
      // 恢復提交按鈕
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "新增房型";
      }
    }
  }

  editRoomType(campsiteTypeId) {
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
    const editForm = document.getElementById("editRoomTypeForm");
    if (editForm) {
      const campId =
        roomType.campId || roomType.campId || this.campData?.campId;
      editForm.querySelector('[name="campId"]').value = campId;
      editForm.querySelector('[name="campsiteTypeId"]').value = campsiteTypeId;
      editForm.querySelector('[name="campsiteName"]').value =
        roomType.campsiteName || roomType.campsiteName || "";
      editForm.querySelector('[name="campsitePeople"]').value =
        roomType.campsitePeople || roomType.campsitePeople || "";
      editForm.querySelector('[name="campsiteNum"]').value =
        roomType.campsiteNum || roomType.campsiteNum || "";
      editForm.querySelector('[name="campsitePrice"]').value =
        roomType.campsitePrice || roomType.campsitePrice || "";
      // 新增：初始化圖片預覽
      initRoomTypeImagePreview(roomType);
    }

    // 開啟modal並處理無障礙問題
    const editModal = new bootstrap.Modal(
      document.getElementById("editRoomTypeModal")
    );
    editModal.show();

    // 設定背景罩遮樣式
    removeAllBackdrops();

    // 在modal開啟後處理焦點
    const modalElement = document.getElementById("editRoomTypeModal");
    if (modalElement) {
      modalElement.addEventListener(
        "shown.bs.modal",
        () => {
          // 確保modal開啟時焦點在正確的位置
          const firstFocusableElement = modalElement.querySelector(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusableElement) {
            firstFocusableElement.focus();
          }
        },
        { once: true }
      ); // 只執行一次

      // 在modal關閉時處理焦點
      modalElement.addEventListener("hidden.bs.modal", () => {
        // 確保所有modal內的焦點元素都失去焦點
        const focusedElements = modalElement.querySelectorAll(":focus");
        focusedElements.forEach((element) => {
          element.blur();
        });

        // 確保焦點回到頁面主體
        document.body.focus();
      });
    }
  }

  async handleEditRoomType(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const typeId =
      formData.get("campsiteTypeId") || formData.get("campsite_type_id");
    const campId = formData.get("campId") || formData.get("campId");

    // 前端驗證
    const campsiteName =
      formData.get("campsiteName") || formData.get("campsiteName");
    const campsitePeople =
      formData.get("campsitePeople") || formData.get("campsitePeople");
    const campsiteNum =
      formData.get("campsiteNum") || formData.get("campsiteNum");
    const campsitePrice =
      formData.get("campsitePrice") || formData.get("campsitePrice");

    if (!campsiteName || campsiteName.trim() === "") {
      this.showMessage("請輸入房型名稱", "error");
      return;
    }
    if (!campsitePeople || isNaN(parseInt(campsitePeople))) {
      this.showMessage("請輸入有效的可入住人數", "error");
      return;
    }
    if (!campsiteNum || isNaN(parseInt(campsiteNum))) {
      this.showMessage("請輸入有效的房間數量", "error");
      return;
    }
    const campsiteNumValue = parseInt(campsiteNum);
    if (campsiteNumValue < 0 || campsiteNumValue > 50) {
      this.showMessage("房間數量必須在 0-50 之間", "error");
      return;
    }
    if (!campsitePrice || isNaN(parseInt(campsitePrice))) {
      this.showMessage("請輸入有效的房間價格", "error");
      return;
    }

    async function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // 取得 input
    const imgInputs = [
      form.querySelector("#edit-roomtype-img1"),
      form.querySelector("#edit-roomtype-img2"),
      form.querySelector("#edit-roomtype-img3"),
      form.querySelector("#edit-roomtype-img4"),
    ];

    // 直接取得 File 物件
    const pics = imgInputs.map((input) =>
      input && input.files[0] ? input.files[0] : null
    );

    console.log(
      "所有圖片資料:",
      pics.map((pic, index) => ({
        index: index + 1,
        hasData: !!pic,
        dataType: pic ? Object.prototype.toString.call(pic) : null,
        name: pic ? pic.name : null,
        size: pic ? pic.size : null,
      }))
    );

    try {
      // 步驟1：更新房型基本資訊（不含圖片）
      const basicData = {
        campsiteTypeId: parseInt(typeId),
        campId: parseInt(campId),
        campsiteName:
          formData.get("campsiteName") || formData.get("campsiteName"),
        campsitePeople: parseInt(
          formData.get("campsitePeople") || formData.get("campsitePeople")
        ),
        campsiteNum: parseInt(
          formData.get("campsiteNum") || formData.get("campsiteNum")
        ),
        campsitePrice: parseInt(
          formData.get("campsitePrice") || formData.get("campsitePrice")
        ),
      };

      const basicRes = await fetch(
        `${window.api_prefix}/campsitetype/updateCampsiteType`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basicData),
        }
      ).then((r) => r.json());

      if (!basicRes || basicRes.status !== "success") {
        this.showMessage(
          "房型基本資訊更新失敗" +
            (basicRes && basicRes.message ? ":" + basicRes.message : ""),
          "error"
        );
        return;
      }

      // 步驟2：更新房型圖片
      const picFormData = new FormData();
      picFormData.append("campsiteTypeId", parseInt(typeId));
      picFormData.append("campId", parseInt(campId));
      if (pics[0]) picFormData.append("pic1", pics[0]);
      if (pics[1]) picFormData.append("pic2", pics[1]);
      if (pics[2]) picFormData.append("pic3", pics[2]);
      if (pics[3]) picFormData.append("pic4", pics[3]);

      console.log("步驟2：更新房型圖片", {
        campsiteTypeId: parseInt(typeId),
        campId: parseInt(campId),
        campsitePic1: pics[0] ? "有圖片" : "無圖片",
        campsitePic2: pics[1] ? "有圖片" : "無圖片",
        campsitePic3: pics[2] ? "有圖片" : "無圖片",
        campsitePic4: pics[3] ? "有圖片" : "無圖片",
      });

      // 記錄FormData內容
      console.log("FormData內容:");
      for (let [key, value] of picFormData.entries()) {
        if (typeof value === "string" && value.length > 100) {
          console.log(`${key}: base64字串 (長度: ${value.length})`);
          // 驗證base64格式
          console.log(`${key} base64前10字元:`, value.substring(0, 10));
          console.log(
            `${key} base64後10字元:`,
            value.substring(value.length - 10)
          );
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // 驗證是否有圖片資料
      const hasImageData = pics.some((pic) => pic && pic.length > 0);
      console.log("是否有圖片資料:", hasImageData);
      console.log("圖片資料統計:", {
        pic1: pics[0] ? `有資料 (${pics[0].length}字元)` : "無資料",
        pic2: pics[1] ? `有資料 (${pics[1].length}字元)` : "無資料",
        pic3: pics[2] ? `有資料 (${pics[2].length}字元)` : "無資料",
        pic4: pics[3] ? `有資料 (${pics[3].length}字元)` : "無資料",
      });

      // 檢查FormData的詳細資訊
      console.log("FormData詳細資訊:");
      console.log("FormData entries數量:", picFormData.entries().length);
      console.log("FormData keys:", Array.from(picFormData.keys()));

      const imageUpdateUrl = `${window.api_prefix}/campsitetype/${parseInt(
        typeId
      )}/${parseInt(campId)}/update-images`;
      console.log("圖片更新API URL:", imageUpdateUrl);

      try {
        const picRes = await fetch(imageUpdateUrl, {
          method: "POST",
          body: picFormData,
        });

        console.log("圖片更新API回應狀態:", picRes.status, picRes.statusText);

        if (!picRes.ok) {
          throw new Error(`HTTP ${picRes.status}: ${picRes.statusText}`);
        }

        const picResData = await picRes.json();
        console.log("圖片更新API回應:", picResData);

        if (!picResData || picResData.status !== "success") {
          this.showMessage(
            "房型圖片更新失敗" +
              (picResData && picResData.message
                ? ":" + picResData.message
                : ""),
            "error"
          );
          return;
        }

        console.log("步驟2完成：房型圖片更新成功");
        this.justUpdatedRoomTypeId = parseInt(typeId);

        // 驗證圖片是否真的更新成功
        console.log("開始驗證圖片更新結果...");
        try {
          // 延遲一下再檢查，確保後端有時間處理
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 重新載入房型資料來驗證更新
          const verifyResponse = await fetch(
            `${window.api_prefix}/campsitetype/${parseInt(
              campId
            )}/getCampsiteTypes`
          );
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            const updatedRoomType = verifyData.data.find(
              (type) => type.campsiteTypeId == parseInt(typeId)
            );
            console.log("驗證更新後的房型資料:", updatedRoomType);

            if (updatedRoomType) {
              console.log("房型圖片欄位檢查:", {
                campsitePic1: updatedRoomType.campsitePic1
                  ? `有資料 (${updatedRoomType.campsitePic1.length}字元)`
                  : "無資料",
                campsitePic2: updatedRoomType.campsitePic2
                  ? `有資料 (${updatedRoomType.campsitePic2.length}字元)`
                  : "無資料",
                campsitePic3: updatedRoomType.campsitePic3
                  ? `有資料 (${updatedRoomType.campsitePic3.length}字元)`
                  : "無資料",
                campsitePic4: updatedRoomType.campsitePic4
                  ? `有資料 (${updatedRoomType.campsitePic4.length}字元)`
                  : "無資料",
              });
            }
          }
        } catch (verifyError) {
          console.error("驗證圖片更新失敗:", verifyError);
        }
      } catch (fetchError) {
        console.error("圖片更新API呼叫失敗:", fetchError);
        console.error("API URL:", imageUpdateUrl);
        console.error("FormData內容:");
        for (let [key, value] of picFormData.entries()) {
          if (typeof value === "string" && value.length > 100) {
            console.error(`${key}: base64字串 (長度: ${value.length})`);
            // 驗證base64格式
            console.error(`${key} base64前10字元:`, value.substring(0, 10));
            console.error(
              `${key} base64後10字元:`,
              value.substring(value.length - 10)
            );
          } else {
            console.error(`${key}: ${value}`);
          }
        }
        this.showMessage("房型圖片更新失敗: " + fetchError.message, "error");
        return;
      }

      this.showMessage("房型更新完成", "success");
      const editModalEl = document.getElementById("editRoomTypeModal");
      if (editModalEl) {
        // 關閉前先移除焦點，避免 aria-hidden 警告
        const focused = editModalEl.querySelector(":focus");
        if (focused) focused.blur();
        setTimeout(() => {
          document.body.focus();
        }, 0);
        const modal = bootstrap.Modal.getInstance(editModalEl);
        if (modal) modal.hide();
      }

      // 更新本地資料
      const roomTypeIndex = this.campsiteTypeData.findIndex(
        (type) =>
          (type.campsiteTypeId || type.campsite_type_id) == parseInt(typeId)
      );
      if (roomTypeIndex !== -1) {
        // 更新本地資料
        this.campsiteTypeData[roomTypeIndex] = {
          ...this.campsiteTypeData[roomTypeIndex],
          campsiteName:
            formData.get("campsiteName") || formData.get("campsiteName"),
          campsitePeople: parseInt(
            formData.get("campsitePeople") || formData.get("campsitePeople")
          ),
          campsiteNum: parseInt(
            formData.get("campsiteNum") || formData.get("campsiteNum")
          ),
          campsitePrice: parseInt(
            formData.get("campsitePrice") || formData.get("campsitePrice")
          ),
        };

        // 直接更新表格中的資料
        this.updateRoomTypeInTable(this.campsiteTypeData[roomTypeIndex]);
      }
    } catch (err) {
      console.error("房型更新失敗：", err);
      this.showMessage("房型資訊更新失敗(API 錯誤): " + err.message, "error");
      return;
    }
  }

  async handleAddBundleItem(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (!this.campData) {
      this.showMessage("請先設定營地基本資料", "error");
      return;
    }

    const bundleName = formData.get("bundle_name");
    const bundlePrice = parseInt(formData.get("bundle_price"));

    if (this.isEditingBundle && this.editingBundleId) {
      // 編輯模式 - 使用API
      try {
        const bundleData = {
          bundleId: Number(this.editingBundleId),
          campId: this.campData.campId,
          bundleName: bundleName,
          bundlePrice: bundlePrice,
        };
        const response = await fetch(
          `${window.api_prefix}/bundleitem/updateBundleItem`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(bundleData),
          }
        );
        if (!response.ok) {
          throw new Error(`編輯加購項目失敗：${response.status}`);
        }
        this.showMessage("加購商品更新成功！", "success");
        // 重新載入加購項目列表
        await this.loadBundleItemsByCampId(this.campData.campId);
      } catch (error) {
        console.error("編輯加購項目失敗：", error);
        this.showMessage(`編輯加購項目失敗：${error.message}`, "error");
        return;
      }
    } else {
      // 新增模式 - 使用API
      try {
        const bundleData = {
          campId: this.campData.campId,
          bundleName: bundleName,
          bundlePrice: bundlePrice,
        };

        const response = await fetch(
          `${window.api_prefix}/bundleitem/addBundleItem`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(bundleData),
          }
        );

        if (!response.ok) {
          throw new Error(`新增加購項目失敗：${response.status}`);
        }

        const result = await response.json();
        console.log("API新增加購項目結果：", result);
        this.showMessage("加購商品新增成功！", "success");

        // 重新載入加購項目列表
        await this.loadBundleItemsByCampId(this.campData.campId);
      } catch (error) {
        console.error("新增加購項目失敗：", error);
        this.showMessage(`新增加購項目失敗：${error.message}`, "error");
        return;
      }
    }

    this.hideModal("addBundleItemModal");

    // 重新渲染加購商品列表
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
  async cancelOrder(orderId) {
    if (confirm("確定要取消此訂單嗎？")) {
      const order = this.orderData.find((o) => o.campsiteOrderId === orderId);
      if (order && order.campsiteOrderStatus === 1) {
        order.campsiteOrderStatus = 4;
        console.log("取消訂單：", orderId);
        this.showMessage("訂單已取消", "success");
        await this.renderOrders();
      } else {
        this.showMessage("只有待付款的訂單才能取消", "error");
      }
    }
  }

  async checkInOrder(orderId) {
    if (confirm("確定客人已入住嗎？")) {
      const order = this.orderData.find((o) => o.campsiteOrderId === orderId);
      if (order && order.campsiteOrderStatus === 2) {
        console.log("入住確認：", orderId);
        this.showMessage("入住確認完成", "success");
        await this.renderOrders();
      } else {
        this.showMessage("只有已付款的訂單才能確認入住", "error");
      }
    }
  }

  async checkOutOrder(orderId) {
    if (confirm("確定客人已退房嗎？")) {
      const order = this.orderData.find((o) => o.campsiteOrderId === orderId);
      if (order && order.campsiteOrderStatus === 2) {
        order.campsiteOrderStatus = 3;
        console.log("退房確認：", orderId);
        this.showMessage("退房確認完成", "success");
        await this.renderOrders();
      } else {
        this.showMessage("只有已付款的訂單才能確認退房", "error");
      }
    }
  }

  // 加購商品操作
  editBundleItem(bundleId) {
    // 支援 bundle_id 或 bundleId
    const bundleItem = this.bundleItemData.find(
      (item) => item.bundle_id == bundleId || item.bundleId == bundleId
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
    document.getElementById("bundle-id").value =
      bundleItem.bundle_id || bundleItem.bundleId;
    document.getElementById("bundle-name").value =
      bundleItem.bundle_name || bundleItem.bundleName;
    document.getElementById("bundle-price").value =
      bundleItem.bundle_price || bundleItem.bundlePrice;

    // 使用Bootstrap方式顯示模態框
    const modal = new bootstrap.Modal(
      document.getElementById("addBundleItemModal")
    );
    modal.show();
  }

  async deleteBundleItem(bundleId) {
    if (!bundleId) {
      this.showMessage("加購商品ID無效", "error");
      return;
    }
    if (confirm("確定要刪除此加購商品嗎？")) {
      try {
        const response = await fetch(
          `${window.api_prefix}/bundleitem/deleteBundleItem`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ bundleId: Number(bundleId) }),
          }
        );
        if (!response.ok) {
          throw new Error(`刪除加購商品失敗：${response.status}`);
        }
        this.showMessage("加購商品已刪除", "success");
        // 重新載入加購商品列表
        await this.loadBundleItemsByCampId(this.campData.campId);
        this.renderBundleItems();
      } catch (error) {
        console.error("刪除加購商品失敗：", error);
        this.showMessage(`刪除加購商品失敗：${error.message}`, "error");
      }
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

  // 處理登出
  handleLogout() {
    if (confirm("確定要登出嗎？")) {
      // 清除所有相關的儲存資料
      localStorage.removeItem("currentOwner");
      sessionStorage.removeItem("currentOwner");
      // 也清除可能的其他相關資料
      localStorage.removeItem("ownerRememberMe");
      sessionStorage.removeItem("ownerRememberMe");

      // 跳轉到登入頁面
      window.location.href = "login.html";
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
        campId = this.campData ? this.campData.campId : null;
      }

      if (!campId) {
        throw new Error("無法獲取營地ID");
      }

      // 強制轉換ID型別
      campsiteTypeId = Number(campsiteTypeId);

      console.log(`載入房型 ${campsiteTypeId} 的房間資料，營地ID: ${campId}`);

      const response = await fetch(
        `${window.api_prefix}/campsitetype/${campsiteTypeId}/${campId}/getcampsites`
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
        // 嘗試獲取房型名稱與編號
        const roomType = this.campsiteTypeData.find((type) => {
          const typeId =
            type.campsiteTypeId ||
            type.id?.campsiteTypeId ||
            type.campsite_type_id ||
            type.id;
          return typeId == campsiteTypeId;
        });
        const roomTypeId = roomType
          ? roomType.campsiteTypeId ||
            roomType.campsite_type_id ||
            campsiteTypeId
          : campsiteTypeId;
        const roomTypeName = roomType
          ? roomType.campsiteName || roomType.campsite_name
          : `房型${campsiteTypeId}`;
        modalTitle.textContent = `${roomTypeId} - ${roomTypeName} - 房間明細`;
      }

      // 渲染房間列表（移除入住日、預計退房日）
      if (!roomList || roomList.length === 0) {
        tableBody.innerHTML =
          '<tr><td colspan="4" class="text-center">此房型目前沒有房間</td></tr>';
      } else {
        // 按照campsiteId排序房間列表
        const sortedRoomList = roomList.sort(
          (a, b) =>
            (a.campsiteId || a.campsite_id) - (b.campsiteId || b.campsite_id)
        );
        const html = sortedRoomList
          .map(
            (room) => `
          <tr>
            <td>${room.campsiteId || room.campsite_id || "-"}</td>
            <td>${
              room.campsiteIdName ||
              room.campsite_id_name ||
              `房間${room.campsiteId || room.campsite_id}`
            }</td>
            <td>${room.camperName || room.camper_name || "-"}</td>
            <td>
              <div class="d-flex">
                <button class="btn btn-sm btn-secondary" onclick="ownerDashboard.editRoom(${
                  room.campsiteId || room.campsite_id
                })">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger ms-2" onclick="ownerDashboard.deleteRoom(${
                  room.campsiteId || room.campsite_id
                })">
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
    const roomTypeId = Number(
      document.getElementById("add-room-type-id").value
    );
    const roomName = document.getElementById("add-room-name").value;

    if (!roomName) {
      this.showMessage("請輸入房間名稱", "error");
      return;
    }

    // 找到房型信息，支援多種可能的欄位名稱
    const roomType = this.campsiteTypeData.find((type) => {
      const typeId =
        type.campsiteTypeId ||
        type.id?.campsiteTypeId ||
        type.campsite_type_id ||
        type.id;
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
      campsiteId: newRoomId,
      campId: roomType.campId,
      campsiteTypeId: parseInt(roomTypeId),
      campsiteIdName: roomName,
      camperName: null, // 新增時入住者姓名為空
    };

    // 添加到數據中
    this.campsiteData.push(newRoom);

    // 更新房型的房間數量
    roomType.campsiteNum += 1;

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
      room = window._latestRoomList.find(
        (r) => r.campsiteId == roomId || r.campsite_id == roomId
      );
    }
    // 如果找不到再從this.campsiteData查找
    if (!room) {
      room = this.campsiteData.find(
        (r) => r.campsiteId == roomId || r.campsite_id == roomId
      );
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
      fetch(`${window.api_prefix}/campsite/deleteCampsite`, {
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

            // 立即從前端資料移除
            this.campsiteData = this.campsiteData.filter((room) => {
              return room.campsiteId != roomId && room.campsite_id != roomId;
            });

            // 新增：刪除房間後即時更新房型主表格的間數
            this.renderRoomTypes();
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
        await this.loadCampsiteTypesByCampId(this.allCamps[0].campId);
        return;
      }

      // 如果有多個營地，顯示下拉選單
      campIdSelect.innerHTML = this.allCamps
        .map(
          (camp) =>
            `<option value="${camp.campId}">${camp.campId} - ${camp.camp_name}</option>`
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
          const campsiteResponse = await fetch(
            `${window.api_prefix}/campsite/getAllCampsite`
          );
          if (!campsiteResponse.ok) {
            throw new Error(`載入營地房間資料失敗：${campsiteResponse.status}`);
          }
          const allCampsites = await campsiteResponse.json();
          this.campsiteData = allCampsites.filter(
            (campsite) => campsite.campId == campIdSelect.value
          );

          const bundleResponse = await fetch("data/bundle_item.json");
          if (!bundleResponse.ok) {
            throw new Error(`載入加購商品資料失敗：${bundleResponse.status}`);
          }
          const allBundles = await bundleResponse.json();
          this.bundleItemData = allBundles.filter(
            (bundle) => bundle.campId == campIdSelect.value
          );

          const orderResponse = await fetch("data/campsite_order.json");
          if (!orderResponse.ok) {
            throw new Error(`載入訂單資料失敗：${orderResponse.status}`);
          }
          const allOrders = await orderResponse.json();
          this.orderData = allOrders.filter(
            (order) => order.campId == campIdSelect.value
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
          await this.renderOrders();
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
      this.campData = this.allCamps.find((camp) => camp.campId == campId);

      if (!this.campData) {
        throw new Error(`找不到營地ID為 ${campId} 的營地資料`);
      }

      console.log("開始呼叫API獲取房型資料");
      const response = await fetch(
        `${window.api_prefix}/campsitetype/${campId}/getCampsiteTypes`
      );
      if (!response.ok) {
        throw new Error(`載入房型資料失敗：${response.status}`);
      }
      const result = await response.json();
      console.log("API回應結果：", result);

      this.campsiteTypeData = Array.isArray(result.data) ? result.data : [];
      console.log("更新後的房型資料：", this.campsiteTypeData);
      console.log("房型資料長度：", this.campsiteTypeData.length);

      this.renderRoomTypes(true, true).catch((error) => {
        console.error("重新渲染房型列表失敗：", error);
      });
    } catch (error) {
      console.error("載入房型資料失敗：", error);
      this.showMessage(`載入房型資料失敗：${error.message}`, "error");
    }
  }

  deleteRoomType(campsiteTypeId) {
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

    const deleteData = {
      campId: roomType.campId || roomType.campId,
      campsiteTypeId: parseInt(campsiteTypeId),
    };

    fetch(`${window.api_prefix}/campsitetype/deleteCampsiteType`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deleteData),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.status === "success") {
          this.showMessage("房型刪除成功！", "success");
          // 立即從前端資料移除
          this.campsiteTypeData = this.campsiteTypeData.filter((type) => {
            const typeId =
              type.campsiteTypeId ||
              type.id?.campsiteTypeId ||
              type.campsite_type_id ||
              type.id;
            return typeId != campsiteTypeId;
          });
          // 只移除該房型的表格列
          this.removeRoomTypeFromTable(campsiteTypeId);
          // 如果沒有房型了，顯示「尚未設定任何房型」
        } else {
          // 檢查是否為房型內還有房間的錯誤
          const errorMessage = result.message || "未知錯誤";
          if (
            errorMessage.includes("房間") ||
            errorMessage.includes("campsite") ||
            errorMessage.includes("room")
          ) {
            this.showMessage("房型內還有房間，無法刪除", "error");
          } else {
            this.showMessage("房型刪除失敗：" + errorMessage, "error");
          }
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
      // 在關閉前處理焦點問題
      const focusedElements = modal.querySelectorAll(":focus");
      focusedElements.forEach((element) => {
        element.blur();
      });

      // 關閉modal
      const bootstrapModal = bootstrap.Modal.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }

      // 手動移除背景遮罩
      removeAllBackdrops();

      // 移除body的modal-open類別
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      // 確保焦點回到頁面主體
      document.body.focus();
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
    if (memIdInput && this.currentOwner.memId) {
      memIdInput.value = this.currentOwner.memId;
      console.log("設置會員ID:", this.currentOwner.memId);
    } else if (memIdInput) {
      // 如果營地主資料中沒有 mem_id，嘗試從 localStorage 或 sessionStorage 獲取會員資料
      const memberData =
        localStorage.getItem("currentMember") ||
        sessionStorage.getItem("currentMember");
      if (memberData) {
        try {
          const member = JSON.parse(memberData);
          if (member && member.memId) {
            memIdInput.value = member.memId;
            console.log("從會員資料設置會員ID:", member.memId);
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
    document.getElementById("add-room-camp-id").value = campId;
    document.getElementById("add-room-type-id").value = campsiteTypeId;
    document.getElementById("add-room-name").value = "";
    const modal = new bootstrap.Modal(document.getElementById("addRoomModal"));
    modal.show();
  }

  // 編輯房間modal開啟時自動帶入資料
  showEditRoomModal(room) {
    console.log("編輯房間modal帶入的room物件：", room);

    // 使用正確的欄位ID
    document.getElementById("edit-room-id").value =
      room.campsiteId || room.campsite_id;
    document.getElementById("edit-room-name").value =
      room.campsiteIdName || room.campsite_id_name || "";
    document.getElementById("edit-camper-name").value = room.camperName || "";
    document.getElementById("edit-room-type-id").value =
      (room.campsiteType &&
        room.campsiteType.id &&
        room.campsiteType.id.campsiteTypeId) ||
      room.campsiteTypeId ||
      room.campsite_type_id ||
      "";
    document.getElementById("edit-room-camp-id").value =
      (room.campsiteType &&
        room.campsiteType.id &&
        room.campsiteType.id.campId) ||
      room.campId ||
      room.campId ||
      "";

    // 開啟modal並設定背景罩遮樣式
    const modal = new bootstrap.Modal(document.getElementById("editRoomModal"));
    modal.show();

    // 設定背景罩遮樣式，參考新增房型的樣式
    removeAllBackdrops();
  }

  // 新增：直接更新表格中的房型資料
  updateRoomTypeInTable(roomType) {
    const tableBody = document.getElementById("roomTypesTableBody");
    if (!tableBody) {
      console.error("找不到房型表格主體元素");
      return;
    }

    const campsiteTypeId = roomType.campsiteTypeId || roomType.campsite_type_id;

    // 找到對應的表格行
    const rows = tableBody.querySelectorAll("tr");
    for (let row of rows) {
      const idCell = row.querySelector("td:nth-child(2)"); // 房型ID欄位
      if (idCell && idCell.textContent.trim() == campsiteTypeId) {
        // 更新房型名稱
        const nameCell = row.querySelector("td:nth-child(3)");
        if (nameCell) {
          nameCell.textContent =
            roomType.campsiteName || roomType.campsite_name || "";
        }

        // 更新房間數量
        const numCell = row.querySelector("td:nth-child(4)");
        if (numCell) {
          numCell.textContent =
            roomType.campsiteNum || roomType.campsiteNum
              ? (roomType.campsiteNum || roomType.campsiteNum) + "間"
              : "";
        }

        // 更新可入住人數
        const peopleCell = row.querySelector("td:nth-child(6)");
        if (peopleCell) {
          peopleCell.textContent =
            roomType.campsitePeople || roomType.campsite_people || "" + " 人";
        }

        // 更新價格
        const priceCell = row.querySelector("td:nth-child(7)");
        if (priceCell) {
          priceCell.textContent =
            "NT$ " +
            (roomType.campsitePrice !== undefined
              ? roomType.campsitePrice
              : roomType.campsite_price !== undefined
              ? roomType.campsite_price
              : "");
        }

        // 更新圖片（如果需要）
        const imgCell = row.querySelector("td:nth-child(1)");
        if (imgCell) {
          const campId = roomType.campId || roomType.campId;
          const hasImages = [1, 2, 3, 4].some((i) => {
            const pic =
              roomType[`campsitePic${i}`] || roomType[`campsite_pic${i}`];
            return pic && pic.length > 0;
          });

          if (hasImages && campsiteTypeId && campId) {
            const carouselId = `carousel-${campsiteTypeId}`;
            const tsParam = `?t=${Date.now()}`; // 加入時間戳避免快取
            imgCell.innerHTML = `
              <div id="${carouselId}" class="carousel slide" style="width:200px;height:160px;border-radius:12px;overflow:hidden;">
                <div class="carousel-inner" style="width:200px;height:160px;">
                  ${[1, 2, 3, 4]
                    .map((index, idx) => {
                      const pic =
                        roomType[`campsitePic${index}`] ||
                        roomType[`campsite_pic${index}`];
                      if (pic && pic.length > 0) {
                        return `
                        <div class="carousel-item${idx === 0 ? " active" : ""}">
                          <img src="${
                            window.api_prefix
                          }/campsitetype/${campsiteTypeId}/${campId}/images/${index}${tsParam}" 
                               class="d-block w-100 roomtype-carousel-img" 
                               style="width:100%;height:100%;object-fit:cover;" 
                               onerror="this.style.display='none'; this.parentElement.style.display='none';" />
                        </div>
                      `;
                      }
                      return "";
                    })
                    .filter(Boolean)
                    .join("")}
                </div>
                ${
                  [1, 2, 3, 4].filter((index) => {
                    const pic =
                      roomType[`campsitePic${index}`] ||
                      roomType[`campsite_pic${index}`];
                    return pic && pic.length > 0;
                  }).length > 1
                    ? `
                <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev" style="width:24px;height:160px;">
                  <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next" style="width:24px;height:160px;">
                  <span class="carousel-control-next-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Next</span>
                </button>
                `
                    : ""
                }
              </div>
            `;
          }
        }

        // 重新載入實際房間數量
        const campId = roomType.campId || roomType.camp_id;
        this.loadRoomCountForRow(row, campsiteTypeId, campId);

        break;
      }
    }
  }

  async renderRoomTypes(useLocalData = false, loadRoomCounts = true) {
    console.log("renderRoomTypes called");

    const tableBody = document.getElementById("roomTypesTableBody");
    if (!tableBody) {
      console.error("找不到房型表格主體元素");
      return;
    }

    // 顯示載入中
    tableBody.innerHTML =
      '<tr><td colspan="9" class="text-center">載入中...</td></tr>';

    // 取得當前選中的營地ID
    let campId = null;
    const ownerProfileSelect = document.getElementById("ownerProfileSelect");
    if (ownerProfileSelect && ownerProfileSelect.value) {
      campId = ownerProfileSelect.value;
    } else if (this.campData && this.campData.campId) {
      campId = this.campData.campId;
    }
    if (!campId) {
      console.warn("無法取得當前營地ID，無法載入房型資料");
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center">無法取得營地ID，請先選擇營地</td></tr>';
      return;
    }

    // 如果沒有本地資料或強制重新載入，則呼叫API
    if (
      !useLocalData ||
      !this.campsiteTypeData ||
      this.campsiteTypeData.length === 0
    ) {
      try {
        const apiUrl = `${window.api_prefix}/campsitetype/${campId}/getCampsiteTypes`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API回應失敗：${response.status}`);
        const result = await response.json();
        this.campsiteTypeData = Array.isArray(result.data) ? result.data : [];
      } catch (error) {
        console.error("取得房型資料失敗：", error);
        tableBody.innerHTML =
          '<tr><td colspan="9" class="text-center">載入房型資料失敗</td></tr>';
        return;
      }
    }

    // 過濾當前營地的房型資料
    const currentCampRoomTypes = this.campsiteTypeData.filter(
      (roomType) => (roomType.campId || roomType.campId) == campId
    );

    if (!currentCampRoomTypes || currentCampRoomTypes.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center">尚未設定任何房型</td></tr>';
      return;
    }

    // 取得所有房型的房間數量（可選）
    let roomTypeData;
    if (loadRoomCounts) {
      const roomTypePromises = currentCampRoomTypes.map(async (roomType) => {
        const roomTypeId = roomType.campsiteTypeId || roomType.campsite_type_id;
        const campId = roomType.campId || roomType.camp_id;
        let actualRoomCount = 0;

        // 驗證參數
        if (roomTypeId && campId) {
          try {
            const apiUrl = `${window.api_prefix}/campsitetype/${roomTypeId}/${campId}/getcampsites`;
            console.log(`載入房型 ${roomTypeId} 房間數量: ${apiUrl}`);
            const response = await fetch(apiUrl);
            if (response.ok) {
              const result = await response.json();
              actualRoomCount = Array.isArray(result.data)
                ? result.data.length
                : 0;
            }
          } catch (error) {
            console.warn(`載入房型 ${roomTypeId} 房間數量失敗:`, error);
            actualRoomCount = 0;
          }
        } else {
          console.warn(
            `房型資料不完整：roomTypeId=${roomTypeId}, campId=${campId}`
          );
        }

        return { roomType, actualRoomCount };
      });
      roomTypeData = await Promise.all(roomTypePromises);
    } else {
      // 不載入房間數量，使用預設值
      roomTypeData = currentCampRoomTypes.map((roomType) => ({
        roomType,
        actualRoomCount: 0,
      }));
    }

    const html = roomTypeData
      .map(({ roomType, actualRoomCount }) => {
        // 取得房型ID和營地ID
        const campsiteTypeId =
          roomType.campsiteTypeId || roomType.campsite_type_id;
        const campId = roomType.campId || roomType.camp_id;
        // 檢查是否有圖片資料（檢查是否有base64資料）
        const hasImages = [1, 2, 3, 4].some((i) => {
          const pic =
            roomType[`campsitePic${i}`] || roomType[`campsite_pic${i}`];
          return pic && pic.length > 0;
        });
        // 輪播 HTML
        let carouselHtml = "";
        if (hasImages && campsiteTypeId && campId) {
          const carouselId = `carousel-${campsiteTypeId}`;
          const isJustUpdated =
            this.justUpdatedRoomTypeId ===
            (roomType.campsiteTypeId || roomType.campsite_type_id);
          const tsParam = isJustUpdated ? `?t=${Date.now()}` : "";
          carouselHtml = `
          <div id="${carouselId}" class="carousel slide" style="width:200px;height:160px;border-radius:12px;overflow:hidden;">
            <div class="carousel-inner" style="width:200px;height:160px;">
              ${[1, 2, 3, 4]
                .map((index, idx) => {
                  const pic =
                    roomType[`campsitePic${index}`] ||
                    roomType[`campsite_pic${index}`];
                  if (pic && pic.length > 0) {
                    return `
                    <div class="carousel-item${idx === 0 ? " active" : ""}">
                      <img src="${
                        window.api_prefix
                      }/campsitetype/${campsiteTypeId}/${campId}/images/${index}${tsParam}" 
                           class="d-block w-100 roomtype-carousel-img" 
                           style="width:100%;height:100%;object-fit:cover;" 
                           onerror="this.style.display='none'; this.parentElement.style.display='none';" />
                    </div>
                  `;
                  }
                  return "";
                })
                .filter(Boolean)
                .join("")}
            </div>
            ${
              [1, 2, 3, 4].filter((index) => {
                const pic =
                  roomType[`campsitePic${index}`] ||
                  roomType[`campsite_pic${index}`];
                return pic && pic.length > 0;
              }).length > 1
                ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev" style="width:24px;height:160px;">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next" style="width:24px;height:160px;">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>
            `
                : ""
            }
          </div>
        `;
        } else {
          carouselHtml =
            '<div style="width:80px;height:60px;display:flex;align-items:center;justify-content:center;background:rgba(128,128,128,0.12);border-radius:4px;">無圖片</div>';
        }
        return `
        <tr>
          <td>${carouselHtml}</td>
          <td>${campsiteTypeId}</td>
          <td>${roomType.campsiteName || roomType.campsite_name || ""}</td>
          <td>${
            roomType.campsiteNum || roomType.campsiteNum
              ? (roomType.campsiteNum || roomType.campsiteNum) + "間"
              : ""
          }</td>
          <td>
            <button class="btn btn-link p-0" onclick="ownerDashboard.showRoomDetails(${
              roomType.campsiteTypeId || roomType.campsite_type_id
            })">
              ${actualRoomCount} 間
            </button>
          </td>
          <td>${
            roomType.campsitePeople || roomType.campsite_people || ""
          } 人</td>
          <td>NT$ ${
            roomType.campsitePrice !== undefined
              ? roomType.campsitePrice
              : roomType.campsite_price !== undefined
              ? roomType.campsite_price
              : ""
          }</td>
          <td>
            <div class="d-flex">
              <button class="btn btn-sm btn-secondary" onclick="ownerDashboard.editRoomType(${
                roomType.campsiteTypeId || roomType.campsite_type_id
              })">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger ms-2" onclick="ownerDashboard.deleteRoomType(${
                roomType.campsiteTypeId || roomType.campsite_type_id
              })">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");
    tableBody.innerHTML = html;

    // 在 renderRoomTypes 結尾清空 justUpdatedRoomTypeId
    this.justUpdatedRoomTypeId = null;
  }

  // 新增：直接從表格中移除房型
  removeRoomTypeFromTable(campsiteTypeId) {
    const tableBody = document.getElementById("roomTypesTableBody");
    if (!tableBody) {
      console.error("找不到房型表格主體元素");
      return;
    }

    // 找到對應的表格行並移除
    const rows = tableBody.querySelectorAll("tr");
    for (let row of rows) {
      const idCell = row.querySelector("td:nth-child(2)"); // 房型ID欄位
      if (idCell && idCell.textContent.trim() == campsiteTypeId) {
        row.remove();
        break;
      }
    }

    // 如果沒有房型了，顯示「尚未設定任何房型」
    if (tableBody.children.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center">尚未設定任何房型</td></tr>';
    }
  }

  // 營地圖片選擇功能
  uploadCampImage(imageIndex, event) {
    // 防止事件冒泡和默認行為
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        this.handleCampImageSelection(file, imageIndex);
      }
    };
    input.click();
  }

  // 處理營地圖片選擇和預覽
  handleCampImageSelection(file, imageIndex) {
    try {
      // 驗證文件類型
      if (!file.type.startsWith("image/")) {
        alert("請選擇圖片文件");
        return;
      }

      // 驗證文件大小（限制為5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert("圖片文件大小不能超過5MB");
        return;
      }

      // 創建預覽URL
      const previewUrl = URL.createObjectURL(file);

      // 將選中的圖片暫存
      this.pendingCampImages[imageIndex] = {
        file: file,
        previewUrl: previewUrl,
      };

      // 清除刪除標記（如果存在）
      if (this.deletedCampImages[imageIndex]) {
        delete this.deletedCampImages[imageIndex];
      }

      // 更新頁面顯示
      const container = document.getElementById(
        `campImage${imageIndex}Container`
      );
      if (container) {
        container.innerHTML = `
          <div class="image-container">
            <img src="${previewUrl}" class="thumbnail" onclick="ownerDashboard.showCampImageModal('${previewUrl}', ${imageIndex})" />
            <div class="image-actions">
              <button class="btn btn-sm btn-camping" onclick="ownerDashboard.uploadCampImage(${imageIndex}, event)"><i class="fas fa-upload"></i></button>
              <button class="btn btn-sm btn-danger" onclick="ownerDashboard.deleteCampImage(${imageIndex})"><i class="fas fa-trash"></i></button>
            </div>
            <div class="image-status pending">待保存</div>
          </div>
        `;
      }

      console.log(`圖片 ${imageIndex} 已選擇，等待保存`);
    } catch (error) {
      console.error("圖片選擇錯誤:", error);
      alert("圖片選擇失敗，請稍後再試");
    }
  }

  // 處理營地圖片上傳（在保存營地資料時調用）
  async handleCampImageUpload() {
    try {
      // 獲取當前營地資料
      if (!this.campData) {
        throw new Error("找不到營地資料");
      }
      console.log("handleCampImageUpload");

      // 處理圖片文件，返回所有圖片的Promise數組
      const imagePromises = [];
      for (let i = 1; i <= 4; i++) {
        if (this.pendingCampImages[i]) {
          // 如果有暫存的新圖片，使用新圖片
          imagePromises.push(
            Promise.resolve({
              index: i,
              file: this.pendingCampImages[i].file,
              filename: `campPic${i}.jpg`,
            })
          );
        } else if (this.deletedCampImages[i]) {
          // 如果圖片被標記為刪除，返回null
          imagePromises.push(Promise.resolve(null));
        } else {
          // 嘗試從API獲取現有圖片
          const promise = (async () => {
            try {
              const apiImageUrl = `${window.api_prefix}/api/camps/${this.campData.campId}/${i}`;
              const imageResponse = await fetch(apiImageUrl);
              if (imageResponse.ok) {
                const imageBlob = await imageResponse.blob();
                return {
                  index: i,
                  file: imageBlob,
                  filename: `existing_pic${i}.jpg`,
                };
              } else {
                // 如果API沒有圖片，創建一個1x1像素的透明圖片
                return new Promise((resolve) => {
                  const canvas = document.createElement("canvas");
                  canvas.width = 1;
                  canvas.height = 1;
                  const ctx = canvas.getContext("2d");
                  ctx.clearRect(0, 0, 1, 1);
                  canvas.toBlob((blob) => {
                    resolve({
                      index: i,
                      file: blob,
                      filename: `empty_pic${i}.png`,
                    });
                  }, "image/png");
                });
              }
            } catch (error) {
              console.warn(`無法獲取圖片${i}:`, error);
              // 創建一個1x1像素的透明圖片
              return new Promise((resolve) => {
                const canvas = document.createElement("canvas");
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, 1, 1);
                canvas.toBlob((blob) => {
                  resolve({
                    index: i,
                    file: blob,
                    filename: `empty_pic${i}.png`,
                  });
                }, "image/png");
              });
            }
          })();
          imagePromises.push(promise);
        }
      }

      // 等待所有圖片處理完成並過濾掉null值
      const results = await Promise.all(imagePromises);
      return results.filter((result) => result !== null);
    } catch (error) {
      console.error("圖片處理錯誤:", error);
      throw error;
    }
  }

  // 營地圖片刪除功能
  deleteCampImage(imageIndex) {
    if (!confirm("確定要刪除這張圖片嗎？")) {
      return;
    }

    try {
      // 如果有暫存的圖片，直接刪除
      if (this.pendingCampImages[imageIndex]) {
        delete this.pendingCampImages[imageIndex];
      }

      // 標記圖片為已刪除
      this.deletedCampImages[imageIndex] = true;

      // 更新頁面顯示為空白狀態
      const container = document.getElementById(
        `campImage${imageIndex}Container`
      );
      if (container) {
        container.innerHTML = `
          <div class="image-placeholder" onclick="ownerDashboard.uploadCampImage(${imageIndex}, event)">
            <i class="fas fa-plus"></i>
            <span>上傳圖片</span>
          </div>
        `;
      }

      console.log(`圖片 ${imageIndex} 已標記為刪除，等待保存`);
    } catch (error) {
      console.error("圖片刪除錯誤:", error);
      alert("圖片刪除失敗，請稍後再試");
    }
  }

  // 顯示營地圖片模態框
  showCampImageModal(imageSource, imageIndex) {
    // 創建模態框HTML
    const modalHtml = `
      <div class="modal fade" id="campImageModal" tabindex="-1" aria-labelledby="campImageModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="campImageModalLabel">營地圖片 ${imageIndex}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <img src="${imageSource}" class="img-fluid" alt="營地圖片" style="max-height: 500px;">
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
              <button type="button" class="btn btn-camping" onclick="ownerDashboard.uploadCampImage(${imageIndex}, event); bootstrap.Modal.getInstance(document.getElementById('campImageModal')).hide();">更換圖片</button>
              <button type="button" class="btn btn-danger" onclick="ownerDashboard.deleteCampImage(${imageIndex}); bootstrap.Modal.getInstance(document.getElementById('campImageModal')).hide();">刪除圖片</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 移除現有的模態框
    const existingModal = document.getElementById("campImageModal");
    if (existingModal) {
      existingModal.remove();
    }

    // 添加新的模態框到頁面
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 顯示模態框
    const modal = new bootstrap.Modal(
      document.getElementById("campImageModal")
    );
    modal.show();
  }
}

// 初始化營地主後台
let ownerDashboard;
document.addEventListener("DOMContentLoaded", function () {
  ownerDashboard = new OwnerDashboard();
});

// 編輯房型時初始化圖片預覽區
function initRoomTypeImagePreview(roomType) {
  console.log("初始化房型圖片預覽，房型資料:", roomType);

  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById("edit-roomtype-img" + i);
    const previewImg = document.getElementById("edit-roomtype-img-preview" + i);
    const pic =
      roomType[`campsitePic${i}`] || roomType[`campsite_pic${i}`] || null;

    console.log(`圖片${i}:`, {
      input: input ? "找到" : "未找到",
      previewImg: previewImg ? "找到" : "未找到",
      hasPic: !!pic,
    });

    if (pic && previewImg) {
      // 取得房型ID和營地ID
      const campsiteTypeId =
        roomType.campsiteTypeId || roomType.campsite_type_id;
      const campId = roomType.campId || roomType.camp_id;

      if (campsiteTypeId && campId) {
        // 使用新的API端點
        const apiUrl = `${window.api_prefix}/campsitetype/${campsiteTypeId}/${campId}/images/${i}`;
        console.log(`圖片${i} API URL:`, apiUrl);
        previewImg.src = apiUrl;
        previewImg.style.display = "block";
        previewImg.style.width = "100%";
        previewImg.style.height = "100%";
        previewImg.style.objectFit = "cover";
        previewImg.style.borderRadius = "12px";
        // 隱藏上傳提示
        const uploadHint = document.getElementById(`upload-hint${i}`);
        if (uploadHint) uploadHint.style.display = "none";
        if (input) input.setAttribute("data-old", pic); // 存原本 base64
      } else {
        // 如果沒有ID，使用原本的base64方式
        console.log(`圖片${i} 使用base64方式`);
        previewImg.src = "data:image/jpeg;base64," + pic;
        previewImg.style.display = "block";
        previewImg.style.width = "100%";
        previewImg.style.height = "100%";
        previewImg.style.objectFit = "cover";
        previewImg.style.borderRadius = "12px";
        // 隱藏上傳提示
        const uploadHint = document.getElementById(`upload-hint${i}`);
        if (uploadHint) uploadHint.style.display = "none";
        if (input) input.setAttribute("data-old", pic);
      }
    } else if (previewImg) {
      console.log(`圖片${i} 無現有圖片，顯示上傳提示`);
      previewImg.src = "#";
      previewImg.style.display = "none";
      // 顯示上傳提示
      const uploadHint = document.getElementById(`upload-hint${i}`);
      if (uploadHint) uploadHint.style.display = "flex";
      if (input) input.removeAttribute("data-old");
    }

    // 綁定圖片上傳change事件
    if (input && previewImg) {
      console.log(`綁定圖片${i}上傳事件`);
      // 移除舊的事件監聽器（如果有的話）
      input.removeEventListener("change", input._imagePreviewHandler);

      // 創建新的事件處理函數，使用立即執行函數來捕獲正確的索引值和元素
      input._imagePreviewHandler = (function (index, imgElement) {
        return function (e) {
          console.log(
            `圖片${index}上傳事件觸發，檔案:`,
            e.target.files ? e.target.files[0] : "無檔案"
          );
          if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function (ev) {
              console.log(`圖片${index}預覽載入完成`);
              imgElement.src = ev.target.result;
              imgElement.style.display = "block";
              imgElement.style.width = "100%";
              imgElement.style.height = "100%";
              imgElement.style.objectFit = "cover";
              imgElement.style.borderRadius = "12px";
              // 隱藏上傳提示
              const uploadHint = document.getElementById(`upload-hint${index}`);
              if (uploadHint) uploadHint.style.display = "none";
            };
            reader.readAsDataURL(e.target.files[0]);
          } else {
            console.log(`圖片${index}清除預覽`);
            imgElement.src = "#";
            imgElement.style.display = "none";
            // 顯示上傳提示
            const uploadHint = document.getElementById(`upload-hint${index}`);
            if (uploadHint) uploadHint.style.display = "flex";
          }
        };
      })(i, previewImg);

      // 添加新的事件監聽器
      input.addEventListener("change", input._imagePreviewHandler);
    }
  }
}

// 將 backdrop 移除方式統一改為移除所有 .modal-backdrop
const removeAllBackdrops = () => {
  document.querySelectorAll(".modal-backdrop").forEach((bd) => bd.remove());
};
