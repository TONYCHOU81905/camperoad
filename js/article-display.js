/**
 * 文章顯示處理模組
 * 負責載入和顯示包含圖片的文章內容
 */
class ArticleDisplayManager {
    constructor() {
        this.currentArticle = null;
        this.currentArticleId = null;
        this.init();
    }

    init() {
        // 從 URL 獲取文章 ID
        const urlParams = new URLSearchParams(window.location.search);
        this.currentArticleId = urlParams.get('id');

        console.log('ArticleDisplayManager 初始化，文章 ID:', this.currentArticleId);
        console.log('API 前綴:', window.api_prefix);

        // 檢查並設置默認 API 前綴
        if (!window.api_prefix) {
            window.api_prefix = `http://localhost:8081/CJA101G02`;
            console.warn('API 前綴未設定，使用默認值:', window.api_prefix);
        }

        if (this.currentArticleId) {
            this.loadArticle();
        } else {
            this.showError('未指定文章 ID');
        }
    }

    /**
     * 載入文章內容
     */
    async loadArticle() {
        try {
            console.log('載入文章 ID:', this.currentArticleId);

            // 使用 with-images API 端點獲取包含處理過圖片的文章
            const response = await fetch(`${window.api_prefix}/api/articles/${this.currentArticleId}/with-images`);
            const result = await response.json();

            console.log('with-images API 回應:', result);

            if (response.ok && result.status === 'success') {
                this.currentArticle = result.data;

                // 檢查是否還有未處理的占位符
                if (this.currentArticle.acContext && this.currentArticle.acContext.includes('[[IMAGE_PLACEHOLDER_')) {
                    console.log('檢測到未處理的圖片占位符，需要進一步處理...');
                    await this.processRemainingPlaceholders();
                } else {
                    console.log('圖片已完全處理，直接顯示文章');
                }

                this.displayArticle();

                // 設置全局變數供其他模組使用
                window.currentArticle = this.currentArticle;
            } else {
                // 如果 with-images API 失敗，嘗試使用原始 API
                console.log('with-images API 失敗，嘗試使用原始 API');
                await this.loadArticleFallback();
            }
        } catch (error) {
            console.error('載入文章時發生錯誤:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showError('無法連接到後端服務器，請確認服務器是否運行在 ' + window.api_prefix);
                return;
            }
            // 嘗試使用原始 API 作為備用方案
            await this.loadArticleFallback();
        }
    }

    /**
     * 處理 with-images API 返回但仍未處理的占位符
     */
    async processRemainingPlaceholders() {
        try {
            console.log('處理剩餘的圖片占位符...');

            // 獲取文章圖片列表
            const imagesResponse = await fetch(`${window.api_prefix}/api/article-images/article/${this.currentArticleId}`);
            const imagesResult = await imagesResponse.json();

            if (imagesResponse.ok && imagesResult.status === 'success') {
                console.log('圖片列表載入成功:', imagesResult.data);

                // 處理圖片占位符
                this.processImagePlaceholders(imagesResult.data);
            } else {
                console.warn('無法載入文章圖片列表');
            }
        } catch (error) {
            console.warn('處理圖片占位符時發生錯誤:', error);
        }
    }

    /**
     * 備用方案：使用原始 API 載入文章
     */
    async loadArticleFallback() {
        try {
            console.log('使用備用方案載入文章...');

            // 第一步：獲取文章內容
            const articleResponse = await fetch(`${window.api_prefix}/api/articles/${this.currentArticleId}`);
            const articleResult = await articleResponse.json();

            if (!articleResponse.ok || articleResult.status !== 'success') {
                this.showError('無法載入文章');
                return;
            }

            this.currentArticle = articleResult.data;
            console.log('文章內容載入成功:', this.currentArticle);

            // 第二步：獲取文章圖片
            try {
                const imagesResponse = await fetch(`${window.api_prefix}/api/article-images/article/${this.currentArticleId}`);
                const imagesResult = await imagesResponse.json();

                if (imagesResponse.ok && imagesResult.status === 'success') {
                    console.log('圖片列表載入成功:', imagesResult.data);

                    // 處理圖片占位符
                    this.processImagePlaceholders(imagesResult.data);
                } else {
                    console.warn('無法載入文章圖片，將使用原始內容');
                }
            } catch (imageError) {
                console.warn('載入圖片時發生錯誤:', imageError);
            }

            // 顯示文章
            this.displayArticle();

            // 設置全局變數供其他模組使用
            window.currentArticle = this.currentArticle;

        } catch (error) {
            console.error('使用備用 API 載入文章失敗:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showError('無法連接到後端服務器，請確認服務器是否運行在 ' + window.api_prefix);
            } else {
                this.showError('載入文章時發生錯誤: ' + error.message);
            }
        }
    }

    /**
     * 處理文章內容中的圖片占位符
     */
    processImagePlaceholders(images) {
        if (!this.currentArticle || !this.currentArticle.acContext || !images || images.length === 0) {
            console.log('沒有圖片需要處理');
            return;
        }

        let content = this.currentArticle.acContext;
        console.log('處理前的內容:', content);

        // 替換圖片占位符
        images.forEach((image, index) => {
            const placeholder = `[[IMAGE_PLACEHOLDER_${index + 1}]]`;
            const imageUrl = `${window.api_prefix}/api/article-images/${image.acImgId}/image`;

            // 創建 img 標籤
            const imgTag = `<img src="${imageUrl}" alt="文章圖片 ${index + 1}" class="article-image" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px;" />`;

            content = content.replace(placeholder, imgTag);
            console.log(`替換 ${placeholder} 為圖片 ID: ${image.acImgId}`);
        });

        // 移除剩餘的占位符（如果圖片數量少於占位符數量）
        content = content.replace(/\[\[IMAGE_PLACEHOLDER_\d+\]\]/g, '');

        // 更新文章內容
        this.currentArticle.acContext = content;
        console.log('處理後的內容:', content);
    }

    /**
     * 顯示文章內容
     */
    displayArticle() {
        if (!this.currentArticle) {
            this.showError('文章資料無效');
            return;
        }

        console.log('顯示文章:', this.currentArticle);

        // 更新頁面標題
        document.title = `${this.currentArticle.acTitle} - 露營路`;

        // 更新文章標題
        const titleElement = document.querySelector('.post-title');
        if (titleElement) {
            titleElement.textContent = this.currentArticle.acTitle;
        }

        // 更新文章 ID 顯示
        const articleIdElement = document.getElementById('article-acid');
        if (articleIdElement) {
            articleIdElement.textContent = this.currentArticle.acId;
        }

        // 更新作者資訊
        this.updateAuthorInfo();

        // 更新文章分類
        this.updateArticleCategory();

        // 更新面包屑導航中的文章標題
        const breadcrumbTitle = document.querySelector('.forum-breadcrumb .article-title');
        if (breadcrumbTitle) {
            breadcrumbTitle.textContent = this.currentArticle.acTitle;
        }

        // 更新發布時間
        this.updatePublishTime();

        // 更新文章內容（重點：這裡會正確顯示圖片）
        this.updateArticleContent();

        // 更新瀏覽次數
        this.updateViewCount();

        // 更新投稿同分類按鈕
        this.updateSameTypeButton();

        // 顯示刪除按鈕（如果是作者本人）
        this.updateDeleteButton();
    }

    /**
     * 更新作者資訊
     */
    updateAuthorInfo() {
        const authorName = this.currentArticle.memName || '露營愛好者';

        // 更新作者名稱
        const authorNameElement = document.querySelector('.author-name');
        if (authorNameElement) {
            authorNameElement.textContent = authorName;
        }

        // 更新作者統計資訊
        // 這裡可以添加更多作者相關資訊的顯示邏輯
    }

    /**
     * 更新文章分類
     */
    updateArticleCategory() {
        const categoryElement = document.querySelector('.article-category');
        if (categoryElement && this.currentArticle.acTypeKind) {
            categoryElement.textContent = this.currentArticle.acTypeKind;
        }
    }

    /**
     * 更新發布時間
     */
    updatePublishTime() {
        const timeElement = document.querySelector('.post-date');
        if (timeElement && this.currentArticle.acTime) {
            const publishTime = new Date(this.currentArticle.acTime);
            const timeString = publishTime.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            timeElement.innerHTML = `<i class="fas fa-calendar"></i> 發布時間：${timeString}`;
        }
    }

    /**
     * 更新文章內容（重點：正確處理圖片）
     */
    updateArticleContent() {
        const contentElement = document.querySelector('.post-body');
        if (contentElement && this.currentArticle.acContext) {
            // 直接設置 HTML 內容
            contentElement.innerHTML = this.currentArticle.acContext;

            // 修正圖片路徑
            this.fixImagePaths();

            // 為文章圖片添加樣式和錯誤處理
            this.enhanceArticleImages();
        }
    }

    /**
     * 修正文章中的圖片路徑
     */
    fixImagePaths() {
        const images = document.querySelectorAll('.post-body img');

        images.forEach((img) => {
            const currentSrc = img.src;
            console.log('原始圖片路徑:', currentSrc);

            // 如果圖片路徑包含 api/article-images，修正伺服器位址
            if (currentSrc.includes('api/article-images')) {
                // 提取圖片ID和路徑部分
                const pathMatch = currentSrc.match(/api\/article-images\/(\d+)\/(.+)$/);
                if (pathMatch) {
                    const imageId = pathMatch[1];
                    const imagePath = pathMatch[2];
                    const newSrc = `${window.api_prefix}/api/article-images/${imageId}/${imagePath}`;
                    console.log('修正後圖片路徑:', newSrc);
                    img.src = newSrc;
                }
            }
            // 如果是相對路徑，也修正為完整的 API 路徑
            else if (currentSrc.startsWith('/api/article-images')) {
                const newSrc = `${window.api_prefix}${currentSrc}`;
                console.log('修正相對路徑:', newSrc);
                img.src = newSrc;
            }
        });
    }

    /**
     * 增強文章圖片的顯示效果
     */
    enhanceArticleImages() {
        const images = document.querySelectorAll('.post-body img');

        images.forEach((img, index) => {
            // 添加載入中效果
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';

            // 圖片載入成功後顯示
            img.onload = function () {
                this.style.opacity = '1';
            };

            // 圖片載入失敗的處理
            img.onerror = function () {
                this.src = 'images/image-placeholder.svg'; // 使用SVG占位圖片
                this.alt = '圖片載入失敗';
                this.style.opacity = '1';
                console.error(`文章圖片載入失敗: ${this.src}`);
            };

            // 添加點擊放大功能
            img.style.cursor = 'pointer';
            img.onclick = function () {
                // 可以實現圖片放大預覽功能
                window.open(this.src, '_blank');
            };

            // 添加樣式類別
            img.classList.add('article-image');
        });
    }

    /**
     * 更新瀏覽次數
     */
    updateViewCount() {
        const viewCountElements = document.querySelectorAll('.view-count');
        if (viewCountElements.length > 0 && this.currentArticle.acViewCount !== undefined) {
            viewCountElements.forEach(el => {
                el.textContent = this.currentArticle.acViewCount;
            });
        }
    }

    /**
     * 更新投稿同分類按鈕
     */
    updateSameTypeButton() {
        const btnAddSameType = document.getElementById('btn-add-same-type');
        if (btnAddSameType && this.currentArticle.acTypeId) {
            btnAddSameType.href = `articles-add.html?acTypeId=${this.currentArticle.acTypeId}`;
            btnAddSameType.style.display = '';
        }
    }

    /**
     * 更新刪除按鈕
     */
    updateDeleteButton() {
        // 檢查是否為文章作者
        const currentMember = this.getCurrentMember();
        if (currentMember && this.currentArticle.memId) {
            const memId = currentMember.mem_id || currentMember.memId;
            const articleMemId = this.currentArticle.memId;

            if (memId == articleMemId) {
                this.showDeleteButton();
            }
        }
    }

    /**
     * 顯示刪除按鈕
     */
    showDeleteButton() {
        const postHeader = document.querySelector('.post-header');
        if (postHeader && !document.querySelector('.delete-article-btn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-article-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 刪除文章';
            deleteBtn.onclick = () => this.deleteArticle();
            postHeader.appendChild(deleteBtn);
        }
    }

    /**
     * 刪除文章
     */
    async deleteArticle() {
        if (!confirm('確定要刪除這篇文章嗎？此操作無法復原。')) {
            return;
        }

        try {
            const response = await fetch(`${window.api_prefix}/api/articles/${this.currentArticleId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                alert('文章已刪除');
                window.location.href = 'article-type.html';
            } else {
                alert('刪除失敗: ' + (result.message || '未知錯誤'));
            }
        } catch (error) {
            console.error('刪除文章時發生錯誤:', error);
            alert('刪除失敗，請稍後再試');
        }
    }

    /**
     * 獲取當前登入會員
     */
    getCurrentMember() {
        const memberData = localStorage.getItem("currentMember") || sessionStorage.getItem("currentMember");
        if (memberData) {
            try {
                return JSON.parse(memberData);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * 顯示錯誤訊息
     */
    showError(message) {
        console.error('文章顯示錯誤:', message);

        const contentElement = document.querySelector('.post-body');
        if (contentElement) {
            contentElement.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>載入失敗</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        background: #3A5A40; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                    ">重新載入</button>
                </div>
            `;
        }
    }

    /**
     * 獲取當前文章資料
     */
    getCurrentArticle() {
        return this.currentArticle;
    }

    /**
     * 獲取當前文章 ID
     */
    getCurrentArticleId() {
        return this.currentArticleId;
    }
}

// 初始化文章顯示管理器
let articleDisplayManager;

document.addEventListener('DOMContentLoaded', function () {
    articleDisplayManager = new ArticleDisplayManager();
});

// 導出給其他模組使用
window.ArticleDisplayManager = ArticleDisplayManager; 