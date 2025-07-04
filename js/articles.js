// 文章數據管理
class ArticleManager {
    constructor() {
        this.articles = [];
        this.currentArticle = null;
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.currentTypeId = null;
        this.currentSortType = 'latest'; // 新增：記錄目前排序方式
    }

    // 載入文章數據 - 使用 Spring Boot API
    async loadArticles(acTypeId = null) {
        try {
            let url = `${window.api_prefix}/api/articles`;

            // 如果有指定 acTypeId，使用進階搜尋 API 來過濾
            if (acTypeId) {
                url = `${window.api_prefix}/api/articles/search/advanced?keyword=&acTypeId=${acTypeId}`;
            }

            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'success' && result.data) {
                this.articles = result.data || [];
            } else {
                console.error('API 回應錯誤:', result);
                this.articles = [];
            }

            return this.articles;
        } catch (error) {
            console.error('載入文章數據失敗:', error);
            return [];
        }
    }

    // 載入會員數據
    async loadMembers() {
        try {
            console.log('開始載入會員資料...');
            const response = await fetch('data/mem.json');
            console.log('會員資料回應狀態:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const members = await response.json();
            this.members = members;
            console.log('會員資料載入成功:', members.length, '筆');
            console.log('會員資料範例:', members[0]);
            return members;
        } catch (error) {
            console.error('載入會員數據失敗:', error);
            this.members = [];
            return [];
        }
    }

    // 根據 ID 獲取文章
    getArticleById(id) {
        return this.articles.find(article => article.acId === parseInt(id));
    }

    // 根據類型獲取文章列表
    getArticlesByType(typeId) {
        return this.articles.filter(article => article.acTypeId === parseInt(typeId));
    }

    // 獲取最新文章
    getLatestArticles(limit = 10) {
        return this.articles
            .filter(article => article.acStatus === 0)
            .sort((a, b) => new Date(b.acTime) - new Date(a.acTime))
            .slice(0, limit);
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    }

    // 格式化短日期（用於列表顯示）
    formatDateShort(dateString) {
        const date = new Date(dateString);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${month}/${day} ${hours}:${minutes}`;
    }

    // 根據會員ID獲取作者名稱
    getAuthorName(memberVO) {
        if (!memberVO) {
            return '露營愛好者';
        }

        // 優先檢查 Java 實體屬性名稱 (camelCase) - 適用於扁平化結構
        if (memberVO.memName) {
            return memberVO.memName;
        }

        // 檢查資料庫欄位名稱 (snake_case)
        if (memberVO.mem_name) {
            return memberVO.mem_name;
        }

        // 檢查其他可能的屬性名
        for (const key in memberVO) {
            if (key.toLowerCase().includes('name') || key.toLowerCase().includes('mem')) {
                return memberVO[key];
            }
        }

        // 檢查是否為嵌套物件結構
        if (typeof memberVO === 'object') {
            // 遞迴檢查所有屬性
            const findNameProperty = (obj) => {
                for (const key in obj) {
                    if (typeof obj[key] === 'string' && (key.toLowerCase().includes('name') || key.toLowerCase().includes('mem'))) {
                        return obj[key];
                    }
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        const result = findNameProperty(obj[key]);
                        if (result) return result;
                    }
                }
                return null;
            };

            const nestedName = findNameProperty(memberVO);
            if (nestedName) {
                return nestedName;
            }
        }

        // 如果都沒有找到，返回預設值
        return '露營愛好者';
    }

    // 生成模擬留言數
    generateCommentCount(articleId) {
        // 使用文章ID生成一個相對穩定的隨機數
        const base = (articleId * 73) % 50;
        return (base + Math.floor(Math.random() * 20)).toString();
    }

    // 獲取文章類型名稱
    getArticleTypeName(typeId) {
        const typeMap = {
            30001: '新手指南',
            30002: '裝備評測',
            30003: '營地推薦'
        };
        return typeMap[typeId] || '其他';
    }

    // 獲取作者的發文數 - 使用後端API
    async getAuthorArticleCount(authorId) {
        console.log('getAuthorArticleCount 被調用，作者ID:', authorId);

        if (!authorId) {
            console.log('缺少作者ID，返回0');
            return 0;
        }

        try {
            const response = await fetch(`${window.api_prefix}/api/articles/member/${authorId}/count`);
            console.log('發文數API回應狀態:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('發文數API回應:', result);

            if (result.status === 'success' && result.data !== undefined) {
                console.log('作者發文數:', result.data);
                return result.data;
            } else {
                console.error('發文數API回應錯誤:', result);
                return 0;
            }
        } catch (error) {
            console.error('獲取作者發文數失敗:', error);
            return 0;
        }
    }

    // 獲取作者註冊時間
    getAuthorRegDate(authorId) {
        console.log('getAuthorRegDate 被調用，作者ID:', authorId);
        console.log('會員資料是否存在:', !!this.members);
        console.log('會員資料數量:', this.members ? this.members.length : 0);

        if (!authorId) {
            console.log('缺少作者ID，返回未知');
            return '未知';
        }

        try {
            // 從會員資料中獲取註冊時間
            const memberData = this.members || [];
            console.log('搜尋會員資料，尋找ID:', authorId);

            const member = memberData.find(m => {
                console.log(`檢查會員 ${m.mem_id}: ${m.mem_id === authorId ? '匹配' : '不匹配'}`);
                return m.mem_id === authorId;
            });

            if (member && member.mem_reg_date) {
                console.log('找到會員:', member);
                console.log('註冊時間:', member.mem_reg_date);

                // 格式化註冊時間為 YYYY/MM/DD 格式
                const regDate = new Date(member.mem_reg_date);
                const year = regDate.getFullYear();
                const month = String(regDate.getMonth() + 1).padStart(2, '0');
                const day = String(regDate.getDate()).padStart(2, '0');
                const formattedDate = `${year}/${month}/${day}`;
                console.log('格式化後的日期:', formattedDate);
                return formattedDate;
            }

            console.log('未找到會員或註冊時間');
            return '未知';
        } catch (error) {
            console.error('獲取作者註冊時間失敗:', error);
            return '未知';
        }
    }

    // 處理文章內容中的圖片占位符
    async processImagePlaceholders(htmlContent, articleId) {
        if (!htmlContent || !htmlContent.includes('[[IMAGE_PLACEHOLDER_')) {
            console.log('沒有圖片占位符需要處理');
            return htmlContent;
        }

        try {
            console.log('開始處理圖片占位符，文章ID:', articleId);

            // 獲取文章圖片列表
            const imagesResponse = await fetch(`${window.api_prefix}/api/article-images/article/${articleId}`);
            const imagesResult = await imagesResponse.json();

            if (!imagesResponse.ok || imagesResult.status !== 'success') {
                console.warn('無法載入文章圖片列表');
                return htmlContent;
            }

            const images = imagesResult.data || [];
            console.log('找到圖片列表:', images);

            let processedContent = htmlContent;

            // 替換圖片占位符
            images.forEach((image, index) => {
                const placeholder = `[[IMAGE_PLACEHOLDER_${index + 1}]]`;
                const imageUrl = `${window.api_prefix}/api/article-images/${image.acImgId}/image`;

                // 創建 img 標籤
                const imgTag = `<img src="${imageUrl}" alt="文章圖片 ${index + 1}" class="article-image" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px;" />`;

                processedContent = processedContent.replace(placeholder, imgTag);
                console.log(`替換 ${placeholder} 為圖片 ID: ${image.acImgId}`);
            });

            // 移除剩餘的占位符（如果圖片數量少於占位符數量）
            processedContent = processedContent.replace(/\[\[IMAGE_PLACEHOLDER_\d+\]\]/g, '');

            console.log('圖片占位符處理完成');
            return processedContent;

        } catch (error) {
            console.error('處理圖片占位符時發生錯誤:', error);
            return htmlContent;
        }
    }

    // 設置當前文章
    setCurrentArticle(articleId) {
        this.currentArticle = this.getArticleById(articleId);
        return this.currentArticle;
    }

    // 獲取分頁數據（排序邏輯貫穿所有頁數）
    getPaginatedArticles(typeId, page = 1, sortType = 'latest') {
        let articles = typeId ? this.getArticlesByType(typeId) : this.articles;

        // 只顯示已發布的文章
        articles = articles.filter(article => article.acStatus === 0);

        // 排序（先排序再分頁）
        switch (sortType) {
            case 'latest':
                articles.sort((a, b) => new Date(b.acTime) - new Date(a.acTime));
                break;
            case 'popular':
                articles.sort((a, b) => (b.acViewCount || 0) - (a.acViewCount || 0));
                break;
            case 'most-liked':
                articles.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
                break;
            case 'most-commented':
                articles.sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0));
                break;
        }

        const totalArticles = articles.length;
        const totalPages = Math.ceil(totalArticles / this.itemsPerPage);
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;

        return {
            articles: articles.slice(startIndex, endIndex),
            totalArticles,
            totalPages,
            currentPage: page,
            allSortedArticles: articles // 新增：完整排序後的資料
        };
    }

    // 渲染分頁控制（帶入排序方式）
    renderPagination(totalPages, currentPage, typeId, sortType) {
        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) return;

        let paginationHTML = '';

        if (totalPages <= 1) {
            // 只顯示「1」
            paginationHTML = '<a href="#" class="active">1</a>';
        } else {
            // 頁碼按鈕
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            // 上一頁按鈕（在最前面）
            if (currentPage > 1) {
                paginationHTML += `<a href="#" data-page="${currentPage - 1}" data-type="${typeId}" data-sort="${sortType || this.currentSortType}"><i class="fas fa-chevron-left"></i> 上一頁</a>`;
            }

            for (let i = startPage; i <= endPage; i++) {
                const activeClass = i === currentPage ? 'active' : '';
                paginationHTML += `<a href="#" class="${activeClass}" data-page="${i}" data-type="${typeId}" data-sort="${sortType || this.currentSortType}">${i}</a>`;
            }

            // 下一頁按鈕（在最後面）
            if (currentPage < totalPages) {
                paginationHTML += `<a href="#" data-page="${currentPage + 1}" data-type="${typeId}" data-sort="${sortType || this.currentSortType}">下一頁 <i class="fas fa-chevron-right"></i></a>`;
            }
        }
        paginationContainer.innerHTML = paginationHTML;

        // 移除舊的事件監聽器
        const oldListener = paginationContainer._paginationListener;
        if (oldListener) {
            paginationContainer.removeEventListener('click', oldListener);
        }

        // 添加新的點擊事件
        const clickListener = (e) => {
            e.preventDefault();
            if (e.target.tagName === 'A') {
                const page = parseInt(e.target.dataset.page);
                const type = parseInt(e.target.dataset.type);
                const sort = e.target.dataset.sort || this.currentSortType;
                this.goToPage(page, type, sort);
            }
        };

        paginationContainer.addEventListener('click', clickListener);
        paginationContainer._paginationListener = clickListener;
    }

    // 跳轉到指定頁面（帶入排序方式）
    goToPage(page, typeId, sortType) {
        this.currentPage = page;
        this.currentTypeId = typeId;
        this.currentSortType = sortType || this.currentSortType;
        this.renderArticleList('articles-container', typeId, page, this.currentSortType);
        this.renderPopularArticles(typeId);

        // 更新 URL 參數
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        if (typeId) {
            url.searchParams.set('type', typeId);
        }
        if (this.currentSortType) {
            url.searchParams.set('sort', this.currentSortType);
        }
        window.history.pushState({}, '', url);
    }

    // 渲染文章詳情
    renderArticleDetail(articleId) {
        console.log('開始渲染文章詳情，文章ID:', articleId);
        const article = this.currentArticle;
        console.log('當前文章物件:', article);

        if (!article) {
            console.error('找不到文章:', articleId);
            return;
        }

        // 更新頁面標題
        document.title = `${article.acTitle} - 露營路`;

        // 渲染文章內容
        const postContent = document.querySelector('.post-content');
        if (postContent) {
            const authorName = this.getAuthorName(article); // 直接傳入整個文章物件
            const typeName = this.getArticleTypeName(article.acTypeId);
            const formattedDate = this.formatDate(article.acTime);

            // 檢查是否為文章作者，如果是則添加刪除按鈕
            const isAuthor = this.isCurrentUserAuthor(article);

            // 更新文章標題區域，添加刪除按鈕
            const postHeader = postContent.querySelector('.post-header');
            if (postHeader) {
                const postTitle = postHeader.querySelector('.post-title');
                if (postTitle) {
                    postTitle.textContent = article.acTitle;
                }

                // 如果是作者，添加編輯和刪除按鈕
                if (isAuthor) {
                    // 移除現有的按鈕（如果存在）
                    const existingEditBtn = postHeader.querySelector('.edit-article-btn');
                    const existingDeleteBtn = postHeader.querySelector('.delete-article-btn');
                    if (existingEditBtn) {
                        existingEditBtn.remove();
                    }
                    if (existingDeleteBtn) {
                        existingDeleteBtn.remove();
                    }

                    // 創建按鈕容器
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'article-action-buttons';
                    buttonContainer.style.cssText = `
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                    flex-wrap: wrap;
                `;

                    // 創建編輯按鈕
                    const editBtn = document.createElement('button');
                    editBtn.className = 'edit-article-btn';
                    editBtn.innerHTML = '<i class="fas fa-edit"></i> 編輯文章';
                    editBtn.title = '編輯這篇文章';
                    editBtn.style.cssText = `
                    background: #17a2b8;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                `;

                    // 編輯按鈕懸停效果
                    editBtn.addEventListener('mouseenter', () => {
                        editBtn.style.background = '#138496';
                        editBtn.style.transform = 'translateY(-1px)';
                    });
                    editBtn.addEventListener('mouseleave', () => {
                        editBtn.style.background = '#17a2b8';
                        editBtn.style.transform = 'translateY(0)';
                    });

                    // 添加編輯按鈕點擊事件
                    editBtn.addEventListener('click', () => {
                        console.log('編輯文章，文章ID:', article.acId);
                        window.location.href = `article-edit.html?id=${article.acId}`;
                    });

                    // 創建刪除按鈕
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-article-btn';
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 刪除文章';
                    deleteBtn.title = '刪除這篇文章';
                    deleteBtn.style.cssText = `
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                `;

                    // 刪除按鈕懸停效果
                    deleteBtn.addEventListener('mouseenter', () => {
                        deleteBtn.style.background = '#c82333';
                        deleteBtn.style.transform = 'translateY(-1px)';
                    });
                    deleteBtn.addEventListener('mouseleave', () => {
                        deleteBtn.style.background = '#dc3545';
                        deleteBtn.style.transform = 'translateY(0)';
                    });

                    // 添加刪除按鈕點擊事件
                    deleteBtn.addEventListener('click', () => {
                        this.showDeleteConfirmation(article.acId, article.acTitle);
                    });

                    // 將按鈕添加到容器
                    buttonContainer.appendChild(editBtn);
                    buttonContainer.appendChild(deleteBtn);

                    // 將按鈕容器插入到標題後面
                    postTitle.insertAdjacentElement('afterend', buttonContainer);
                }
            }

            // 更新發布時間
            const postDate = postContent.querySelector('.post-date');
            if (postDate) {
                postDate.innerHTML = `<i class="fas fa-calendar"></i> 發布時間：${formattedDate}`;
            }

            // 更新作者資訊
            const authorNameElement = document.querySelector('.author-name');
            if (authorNameElement) {
                authorNameElement.textContent = authorName;
            }

            // 更新作者統計資訊（使用真實數據）
            console.log('開始更新作者統計資訊...');
            // 作者統計資訊在 post-author 區域內，不是在 post-content 內
            const authorStats = document.querySelector('.post-author .author-stats');
            console.log('找到作者統計元素:', authorStats);

            if (authorStats) {
                const stats = authorStats.querySelectorAll('span:last-child');
                console.log('找到統計項目數量:', stats.length);
                console.log('統計項目:', stats);

                if (stats.length >= 2) {
                    // 計算作者的發文數
                    const authorId = article.memId || article.mem_id;
                    console.log('作者ID:', authorId);
                    console.log('文章資料:', article);
                    console.log('會員資料:', this.members);

                    // 使用異步方法獲取發文數
                    this.getAuthorArticleCount(authorId).then(count => {
                        console.log('作者發文數:', count);
                        stats[0].textContent = count;
                    }).catch(error => {
                        console.error('獲取發文數失敗:', error);
                        stats[0].textContent = '0';
                    });

                    // 獲取作者註冊時間
                    const authorRegDate = this.getAuthorRegDate(authorId);
                    console.log('作者註冊時間:', authorRegDate);
                    stats[1].textContent = authorRegDate;
                } else {
                    console.log('統計項目數量不足，需要2個但只有', stats.length, '個');
                }
            } else {
                console.log('未找到作者統計元素');
            }

            // 更新作者徽章
            const authorBadges = postContent.querySelector('.author-badges');
            if (authorBadges) {
                let badges = [];

                // 根據文章類型添加相關徽章
                if (article.acTypeId === 30001) { // 新手指南
                    badges.push('<span class="author-badge">新手指導員</span>');
                    badges.push('<span class="author-badge">經驗分享者</span>');
                } else if (article.acTypeId === 30002) { // 裝備評測
                    badges.push('<span class="author-badge">料理達人</span>');
                    badges.push('<span class="author-badge">野外廚師</span>');
                } else if (article.acTypeId === 30003) { // 營地推薦
                    badges.push('<span class="author-badge">評測專家</span>');
                    badges.push('<span class="author-badge">裝備達人</span>');
                }

                badges.push('<span class="author-badge">露營愛好者</span>');
                authorBadges.innerHTML = badges.join('');
            }

            // === 文章內容插入與圖片處理 ===
            const postBody = postContent.querySelector('.post-body');
            if (postBody && article.acContext) {
                // 先處理圖片占位符
                this.processImagePlaceholders(article.acContext, article.acId).then(processedContent => {
                    postBody.innerHTML = processedContent;

                    // 修正圖片路徑與增強圖片顯示
                    const images = postBody.querySelectorAll('img');
                    console.log('找到圖片數量:', images.length);

                    images.forEach((img, index) => {
                        const currentSrc = img.getAttribute('src') || '';
                        console.log(`處理圖片 ${index + 1}:`, currentSrc);

                        // 先添加載入中的樣式
                        img.classList.add('loading');
                        img.style.display = 'block';
                        img.style.minHeight = '100px';
                        img.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
                        img.style.backgroundSize = '200% 100%';
                        img.style.animation = 'loading 1.5s infinite';

                        // 修正各種可能的圖片路徑格式
                        let correctedSrc = currentSrc;

                        // 1. 修正 API 圖片路徑 (api/article-images/...)
                        if (currentSrc.includes('api/article-images')) {
                            const pathMatch = currentSrc.match(/api\/article-images\/(\d+)\/(.+)$/);
                            if (pathMatch) {
                                const imageId = pathMatch[1];
                                const imagePath = pathMatch[2];
                                correctedSrc = `${window.api_prefix}/api/article-images/${imageId}/${imagePath}`;
                                console.log('修正 API 圖片路徑:', correctedSrc);
                            }
                        }
                        // 2. 修正相對路徑 (/api/article-images/...)
                        else if (currentSrc.startsWith('/api/article-images')) {
                            correctedSrc = `${window.api_prefix}${currentSrc}`;
                            console.log('修正相對路徑:', correctedSrc);
                        }
                        // 3. 修正相對路徑 (./api/article-images/...)
                        else if (currentSrc.startsWith('./api/article-images')) {
                            correctedSrc = `${window.api_prefix}${currentSrc.substring(1)}`;
                            console.log('修正相對路徑:', correctedSrc);
                        }
                        // 4. 修正相對路徑 (../api/article-images/...)
                        else if (currentSrc.startsWith('../api/article-images')) {
                            correctedSrc = `${window.api_prefix}${currentSrc.substring(2)}`;
                            console.log('修正相對路徑:', correctedSrc);
                        }
                        // 5. 修正 data:image 格式（保持不變）
                        else if (currentSrc.startsWith('data:image')) {
                            correctedSrc = currentSrc;
                            console.log('保持 data:image 格式');
                        }
                        // 6. 修正絕對路徑（如果沒有協議）
                        else if (currentSrc.startsWith('//')) {
                            correctedSrc = `https:${currentSrc}`;
                            console.log('修正協議相對路徑:', correctedSrc);
                        }
                        // 7. 其他情況，嘗試添加 API 前綴
                        else if (!currentSrc.startsWith('http') && !currentSrc.startsWith('data:')) {
                            correctedSrc = `${window.api_prefix}${currentSrc.startsWith('/') ? '' : '/'}${currentSrc}`;
                            console.log('添加 API 前綴:', correctedSrc);
                        }

                        // 設置修正後的 src
                        img.src = correctedSrc;

                        // 圖片載入失敗處理
                        img.onerror = function () {
                            console.error('圖片載入失敗:', this.src);
                            this.classList.remove('loading');
                            this.classList.add('error');
                            this.src = 'images/default-color.png'; // 使用預設圖片
                            this.alt = '圖片載入失敗';
                            this.style.background = '#fff5f5';
                            this.style.border = '2px dashed #feb2b2';
                            this.style.color = '#c53030';
                            this.style.display = 'flex';
                            this.style.alignItems = 'center';
                            this.style.justifyContent = 'center';
                            this.style.minHeight = '100px';
                            this.style.fontSize = '0.9rem';
                            this.textContent = '圖片載入失敗';
                        };

                        // 圖片載入成功處理
                        img.onload = function () {
                            console.log('圖片載入成功:', this.src);
                            this.classList.remove('loading');
                            this.classList.remove('error');
                            this.style.background = 'transparent';
                            this.style.border = '1px solid #e9ecef';
                            this.style.color = 'inherit';
                            this.style.display = 'block';
                            this.style.alignItems = 'auto';
                            this.style.justifyContent = 'auto';
                            this.style.minHeight = 'auto';
                            this.style.fontSize = 'inherit';
                            this.textContent = '';
                        };

                        // 點擊放大
                        img.style.cursor = 'pointer';
                        img.onclick = function () {
                            window.open(this.src, '_blank');
                        };

                        // 添加樣式類別
                        img.classList.add('article-image');

                        // 確保圖片有適當的樣式
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                        img.style.borderRadius = '8px';
                        img.style.margin = '15px 0';
                        img.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                        img.style.transition = 'all 0.3s ease';
                    });

                    console.log('圖片處理完成');
                }).catch(error => {
                    console.error('處理圖片占位符失敗:', error);
                    // 如果占位符處理失敗，直接顯示原始內容
                    postBody.innerHTML = article.acContext;
                });
            }

            // === 顯示瀏覽次數 ===
            const viewCountElements = document.querySelectorAll('.view-count');
            if (viewCountElements.length > 0 && typeof article.acViewCount !== 'undefined') {
                viewCountElements.forEach(el => {
                    el.textContent = article.acViewCount;
                });
            }
        }

        // 更新麵包屑導航
        const breadcrumbElement = document.querySelector('.forum-breadcrumb');
        if (breadcrumbElement) {
            const typeName = this.getArticleTypeName(article.acTypeId);
            const listPage = this.getArticleListPage(article.acTypeId);
            breadcrumbElement.innerHTML = `
                <a href="index.html">首頁</a> &gt;
                <a href="article-type.html">論壇攻略</a> &gt;
                <a href="${listPage}" class="article-category">${typeName}</a> &gt;
                <span class="article-title">${article.acTitle}</span>
            `;
        }

        // 觸發文章載入完成事件，通知收藏功能
        window.dispatchEvent(new CustomEvent('articleLoaded', {
            detail: { articleId: article.acId }
        }));

        // 假設有一個 setArticleDetail(article) 或 renderArticleDetail(article) 之類的函數
        // 在載入文章資料後，將 acId 填入 #article-acid
        // 例如：
        if (article && article.acId && document.getElementById('article-acid')) {
            document.getElementById('article-acid').textContent = article.acId;
        }

        // --- 文章詳情 Like 功能 ---
        this.setupLikeFeature(article);

        // --- 顯示文章詳細統計資訊 ---
        // this.displayArticleStats(article.acId); // 已暫時隱藏統計資訊顯示

        // --- 顯示圖片管理界面（僅作者可見）---
        // const isAuthor = this.isCurrentUserAuthor(article);
        // this.displayImageManagement(article.acId, isAuthor); // 已暫時隱藏圖片管理功能
    }

    // 獲取對應的列表頁面編號
    getListPageNumber(typeId) {
        const pageMap = {
            30001: 1, // 新手指南
            30002: 2, // 料理技巧
            30003: 3  // 裝備評測
        };
        return pageMap[typeId] || 1;
    }

    // 渲染文章列表
    renderArticleList(containerId, typeId = null, page = 1, sortType = 'latest') {
        this.currentSortType = sortType; // 新增：記錄目前排序方式
        const container = document.getElementById(containerId);
        if (!container) return;

        let paginatedData = this.getPaginatedArticles(typeId, page, sortType);
        let articlesToShow = paginatedData.articles;

        // 更新文章計數
        const countElement = document.getElementById('article-count');
        if (countElement) {
            countElement.textContent = paginatedData.totalArticles;
        }

        // 如果沒有文章，顯示提示訊息
        if (articlesToShow.length === 0) {
            container.innerHTML = '<div class="loading-message">沒有找到相關文章</div>';
            return;
        }

        // 論壇風格的文章列表HTML
        const htmlContent = articlesToShow.map((article, index) => {
            const authorName = this.getAuthorName(article); // 直接傳入整個文章物件
            const typeName = this.getArticleTypeName(article.acTypeId);

            // 清理 HTML 標籤，只保留純文字內容
            let cleanContent = '';
            if (article.acContext) {
                // 創建臨時 DOM 元素來清理 HTML 標籤
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = article.acContext;
                cleanContent = tempDiv.textContent || tempDiv.innerText || '';
            }

            // 截取預覽文字（限制在 80 字元內）
            const preview = cleanContent ? (cleanContent.length > 80 ? cleanContent.substring(0, 80) + '...' : cleanContent) : '無內容預覽';

            return `
                <div class="article-item">
                    <div class="article-image-cell">
                        <img src="images/camp-${(index % 5) + 1}.jpg" alt="${article.acTitle}" class="article-image">
                    </div>
                    <div class="article-title-cell">
                        <a href="articles.html?id=${article.acId}" class="article-title-link">
                            ${article.acTitle}
                        </a>
                        <div class="article-preview">
                            ${preview}
                        </div>
                        <span class="article-tag">${typeName}
                            <span class="reply-count" data-article-id="${article.acId}" style="margin-left:18px;color:#fff;font-size:0.92em;">
                                <i class='fas fa-comments' style="color:#fff;"></i> ${article.replyCount || 0}
                            </span>
                        </span>
                    </div>
                    <div class="article-author-cell">
                        ${authorName}
                    </div>
                    <div class="article-date-cell">
                        ${this.formatDateShort(article.acTime)}
                    </div>
                    <div class="article-stats-cell">
                        <div class="stat-item">
                            <i class="fas fa-eye"></i>
                            <span class="view-count" data-article-id="${article.acId}">${article.acViewCount || 0}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-thumbs-up" style="color:#dc3545;"></i>
                            <span class="like-count" data-article-id="${article.acId}">${article.likeCount || 0}</span>
                        </div>
                    </div>
                    <div class="article-content-mobile">
                        <div class="article-title-cell">
                            <a href="articles.html?id=${article.acId}" class="article-title-link">
                                ${article.acTitle}
                            </a>
                            <div class="article-preview">
                                ${preview}
                            </div>
                        </div>
                        <div class="article-meta-mobile">
                            <span>作者：${authorName}</span>
                            <span>${this.formatDateShort(article.acTime)}</span>
                       </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = htmlContent;
        this.renderPagination(paginatedData.totalPages, page, typeId, sortType);
    }

    // 初始化文章詳情頁面
    async initArticleDetail() {
        try {
            // 從 URL 參數獲取文章 ID
            const urlParams = new URLSearchParams(window.location.search);
            const articleId = urlParams.get('id');

            if (articleId) {
                await this.loadSingleArticle(parseInt(articleId));
            } else {
                // 如果沒有指定 ID，顯示錯誤訊息
                this.showArticleError('缺少文章ID參數');
            }
        } catch (error) {
            console.error('初始化文章詳情頁面失敗:', error);
        }
    }

    // 載入單一文章
    async loadSingleArticle(articleId) {
        try {
            console.log('開始載入單一文章，ID:', articleId);

            // 確保會員資料和所有文章資料已載入（用於計算發文數）
            if (!this.members) {
                console.log('會員資料未載入，開始載入...');
                await this.loadMembers();
            }

            if (!this.articles || this.articles.length === 0) {
                console.log('文章資料未載入，開始載入所有文章...');
                await this.loadArticles();
            }

            const response = await fetch(`${window.api_prefix}/api/articles/${articleId}`);
            const result = await response.json();
            console.log('單一文章API回應:', result);

            if (result.status === 'success' && result.data) {
                this.currentArticle = result.data;
                console.log('設置當前文章:', this.currentArticle);
                // 新增：呼叫 API 增加瀏覽次數
                await this.incrementViewCount(articleId);
                this.renderArticleDetail(articleId);

                // 初始化留言功能
                await this.initReplyFeatures(articleId);
            } else {
                console.error('載入文章失敗:', result);
                this.showArticleError('找不到指定的文章');
            }
        } catch (error) {
            console.error('載入文章時發生錯誤:', error);
            this.showArticleError('載入文章時發生錯誤');
        }
    }

    // 新增：增加瀏覽次數
    async incrementViewCount(articleId) {
        try {
            const response = await fetch(`${window.api_prefix}/api/articles/${articleId}/view`, {
                method: 'POST'
            });
            const result = await response.json();
            if (result.status === 'success') {
                console.log('瀏覽次數已增加');
            } else {
                console.warn('增加瀏覽次數失敗:', result);
            }
        } catch (error) {
            console.error('呼叫增加瀏覽次數 API 失敗:', error);
        }
    }

    // 顯示文章錯誤訊息
    showArticleError(message) {
        // 更新頁面標題
        document.title = '文章不存在 - 露營路';

        // 更新麵包屑導航
        const breadcrumbElement = document.querySelector('.forum-breadcrumb');
        if (breadcrumbElement) {
            breadcrumbElement.innerHTML = `
                <a href="index.html">首頁</a> &gt;
                <a href="article-type.html">論壇攻略</a> &gt;
                <a href="article-type.html">文章分類</a> &gt;
                <span>文章不存在</span>
            `;
        }

        // 更新文章內容區域
        const articleContainer = document.querySelector('.post-content');
        if (articleContainer) {
            articleContainer.innerHTML = `
                <div class="post-header">
                    <h1 class="post-title">文章不存在</h1>
                    <div class="post-meta">
                        <div class="post-date">
                            <i class="fas fa-exclamation-triangle"></i>
                            錯誤訊息
                        </div>
                    </div>
                </div>
                <div class="post-body">
                    <p>${message}</p>
                    <p><a href="article_type.html">返回文章分類</a></p>
                </div>
            `;
        }
    }

    // 渲染熱門文章側邊欄（用排序後的完整資料）
    renderPopularArticles(typeId = null) {
        const container = document.getElementById('popular-articles-list');
        if (!container) return;

        // 直接用 articleManager.articles 做比對
        let articles = this.articles.filter(article => article.acTypeId === parseInt(typeId));

        // 根據 acViewCount 排序（從高到低）
        articles.sort((a, b) => (b.acViewCount || 0) - (a.acViewCount || 0));

        articles = articles.slice(0, 4); // 只顯示前4篇

        const images = ['camp-1.jpg', 'camp-2.jpg', 'camp-3.jpg', 'camp-4.jpg', 'camp-5.jpg'];

        const htmlContent = articles.map((article, index) => {
            const authorName = this.getAuthorName(article); // 直接傳入整個文章物件
            return `
                <li>
                    <a href="articles.html?id=${article.acId}">
                        <img src="images/${images[index % images.length]}" alt="${article.acTitle}" />
                        <div class="popular-guide-info">
                            <h4>${article.acTitle}</h4>
                            <div class="popular-guide-meta">
                                <span><i class='fas fa-eye'></i> ${article.acViewCount || 0}</span>
                                <span><i class='fas fa-thumbs-up'></i> ${article.likeCount || 0}</span>
                            </div>
                        </div>
                    </a>
                </li>
            `;
        }).join('');

        container.innerHTML = htmlContent;
    }

    // 初始化文章列表頁面
    async initArticleList(typeId = null) {
        try {
            // 同時載入文章和會員資料
            await Promise.all([
                this.loadArticles(typeId),
                this.loadMembers()
            ]);

            // 從 URL 參數獲取頁碼
            const urlParams = new URLSearchParams(window.location.search);
            const page = parseInt(urlParams.get('page')) || 1;

            this.currentPage = page;
            this.currentTypeId = typeId;

            this.renderArticleList('articles-container', typeId, page);
            this.renderPopularArticles(typeId);
        } catch (error) {
            console.error('初始化文章列表頁面失敗:', error);
        }
    }

    // 載入文章留言
    async loadArticleReplies(articleId) {
        try {
            console.log('開始載入留言，文章ID:', articleId);
            const response = await fetch(`${window.api_prefix}/api/replies/article/${articleId}`);
            const result = await response.json();
            console.log('載入留言 API 回應:', result);

            if (result.status === 'success' && result.data) {
                console.log('成功載入留言:', result.data);
                return result.data;
            } else {
                console.error('載入留言失敗:', result);
                return [];
            }
        } catch (error) {
            console.error('載入留言時發生錯誤:', error);
            return [];
        }
    }

    // 新增留言
    async addReply(articleId, replyContent) {
        try {
            console.log('開始新增留言，文章ID:', articleId, '內容:', replyContent);

            // 檢查登入狀態 - 使用正確的鍵名
            const memberData = localStorage.getItem('currentMember') || sessionStorage.getItem('currentMember');
            console.log('會員資料:', memberData);

            if (!memberData) {
                console.log('未找到會員資料');
                alert('請先登入後再發表留言');
                return false;
            }

            const member = JSON.parse(memberData);
            console.log('解析後的會員資料:', member);

            if (!member.mem_id) {
                console.log('會員資料中沒有 mem_id');
                alert('請先登入後再發表留言');
                return false;
            }

            const replyData = {
                acId: articleId,
                memId: member.mem_id,
                replyContext: replyContent,
                replyTime: new Date().toISOString(),
                replyStatus: 0
            };

            console.log('準備發送的留言資料:', replyData);

            const response = await fetch(`${window.api_prefix}/api/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(replyData)
            });

            const result = await response.json();
            console.log('API 回應:', result);

            if (result.status === 'success') {
                console.log('留言新增成功:', result);
                return true;
            } else {
                console.error('留言新增失敗:', result);
                alert('留言新增失敗: ' + result.message);
                return false;
            }
        } catch (error) {
            console.error('新增留言時發生錯誤:', error);
            alert('新增留言時發生錯誤');
            return false;
        }
    }

    // --- 修改：留言分頁渲染 ---
    renderReplyPagination(replies, currentPage = 1, repliesPerPage = 10) {
        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) return;

        const totalReplies = replies.length;
        const totalPages = Math.ceil(totalReplies / repliesPerPage);
        let paginationHTML = '';

        if (totalPages <= 1) {
            // 只顯示「1」
            paginationHTML = '<a href="#" class="page-btn active">1</a>';
        } else {
            // 上一頁
            if (currentPage > 1) {
                paginationHTML += `<a href="#" class="page-btn" data-page="${currentPage - 1}">上一頁</a>`;
            }
            for (let i = 1; i <= totalPages; i++) {
                const activeClass = i === currentPage ? 'page-btn active' : 'page-btn';
                paginationHTML += `<a href="#" class="${activeClass}" data-page="${i}">${i}</a>`;
            }
            // 下一頁
            if (currentPage < totalPages) {
                paginationHTML += `<a href="#" class="page-btn" data-page="${currentPage + 1}">下一頁</a>`;
            }
        }
        paginationContainer.innerHTML = paginationHTML;

        // 綁定點擊事件
        paginationContainer.onclick = (e) => {
            if (e.target.tagName === 'A' && e.target.dataset.page) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                this.renderReplies(replies, page, repliesPerPage);
                this.renderReplyPagination(replies, page, repliesPerPage);
            }
        };
    }

    // --- 修改：留言渲染支援分頁 ---
    renderReplies(replies, page = 1, repliesPerPage = 10) {
        console.log('開始渲染留言，留言數量:', replies ? replies.length : 0);
        const commentsList = document.querySelector('.comments-list');
        if (!commentsList) {
            console.error('找不到留言列表容器');
            return;
        }
        if (!replies || replies.length === 0) {
            commentsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">還沒有留言，來發表第一個留言吧！</div>';
            // 清空分頁
            const paginationContainer = document.querySelector('.pagination');
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }
        // 取得當前登入會員ID
        let currentMemId = null;
        try {
            const memberData = localStorage.getItem('currentMember') || sessionStorage.getItem('currentMember');
            if (memberData) {
                const member = JSON.parse(memberData);
                currentMemId = member.mem_id || member.memId;
            }
        } catch (e) { currentMemId = null; }
        // 先 reverse，讓最新留言在最上面（#1為最新，最舊在最下）
        const reversedReplies = replies.slice().reverse();
        const start = (page - 1) * repliesPerPage;
        const end = start + repliesPerPage;
        const pageReplies = reversedReplies.slice(start, end);
        // 計算正確的樓層號碼（根據原始replies順序）
        const totalReplies = replies.length;
        const floorMap = new Map();
        replies.forEach((reply, idx) => {
            floorMap.set(reply.replyId || reply.id || idx, idx + 1); // replyId優先，否則用index
        });
        // 建立樓層對應內容的Map
        const replyContentMap = new Map();
        replies.forEach((reply, idx) => {
            replyContentMap.set(reply.replyId || reply.id || idx, reply.replyContext);
        });
        const htmlContent = pageReplies.map((reply, index) => {
            const authorName = reply.memName || reply.mem_name || '露營愛好者';
            const replyDate = this.formatDate(reply.replyTime);
            let floorNum = null;
            if (reply.replyId && floorMap.has(reply.replyId)) {
                floorNum = floorMap.get(reply.replyId);
            } else if (reply.id && floorMap.has(reply.id)) {
                floorNum = floorMap.get(reply.id);
            } else {
                floorNum = replies.findIndex(r => r === reply) + 1;
            }
            let replyQuoteHtml = '';
            if (reply.replyToFloor && reply.replyToContent) {
                replyQuoteHtml = `<div class=\"reply-quote\" style=\"color:#555;background:#f2f2f2;padding:8px 12px;margin-bottom:8px;border-left:4px solid #bbb;font-size:0.97em;\">回覆 #${reply.replyToFloor}: ${reply.replyToContent}</div>`;
            }
            // 刪除按鈕（僅本人可見）
            let deleteBtnHtml = '';
            if (currentMemId && (reply.memId == currentMemId || reply.mem_id == currentMemId)) {
                deleteBtnHtml = `<button class=\"delete-reply-btn\" data-replyid=\"${reply.replyId || reply.id}\" style=\"position:absolute;top:8px;right:12px;background:#dc3545;color:#fff;border:none;border-radius:3px;padding:2px 10px;cursor:pointer;font-size:0.95em;z-index:2;\">刪除</button>`;
            }
            return `
                <div class=\"comment-item\" style=\"position:relative;\">
                    ${deleteBtnHtml}
                    <div class=\"comment-header\">
                        <div class=\"comment-avatar\">
                            <img src=\"images/user-${((start + index) % 4) + 1}.jpg\" alt=\"留言者頭像\" />
                        </div>
                        <div class=\"comment-author\">
                            <div class=\"comment-author-name\">${authorName}</div>
                            <div class=\"comment-date\">${replyDate}</div>
                        </div>
                        <div class=\"comment-floor\">#${floorNum}</div>
                    </div>
                    <div class=\"comment-content\">
                        ${replyQuoteHtml}
                        ${reply.replyContext ? reply.replyContext.replace(/\n/g, '<br>') : '無內容'}
                    </div>
                    <div class=\"comment-actions\">
                        <a href=\"#\" class=\"comment-action reply-btn\" data-floor=\"${floorNum}\" data-content=\"${(reply.replyContext || '').replace(/\"/g, '&quot;')}\">
                            <i class=\"fas fa-reply\"></i>
                            <span>回覆</span>
                        </a>
                    </div>
                </div>
            `;
        }).join('');
        commentsList.innerHTML = htmlContent;
        this.renderReplyPagination(replies, page, repliesPerPage);

        // 綁定回覆按鈕事件
        setTimeout(() => {
            const replyBtns = document.querySelectorAll('.reply-btn');
            replyBtns.forEach(btn => {
                btn.onclick = function (e) {
                    e.preventDefault();
                    const floor = this.getAttribute('data-floor');
                    const content = this.getAttribute('data-content');
                    if (window.setReplyTo) window.setReplyTo(floor, content);
                };
            });
            // 刪除留言按鈕事件
            const delBtns = document.querySelectorAll('.delete-reply-btn');
            delBtns.forEach(btn => {
                btn.onclick = async function (e) {
                    e.preventDefault();
                    if (!confirm('確定要刪除此留言嗎？')) return;
                    const replyId = this.getAttribute('data-replyid');
                    try {
                        const response = await fetch(`${window.api_prefix}/api/replies/${replyId}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            alert('留言已刪除');
                            location.reload();
                        } else {
                            alert('刪除失敗');
                        }
                    } catch (err) {
                        alert('刪除失敗，請稍後再試');
                    }
                };
            });
        }, 0);
    }

    // 更新留言數量
    updateReplyCount(count) {
        const commentsTitle = document.querySelector('.comments-title');
        if (commentsTitle) {
            commentsTitle.textContent = `留言討論 (${count})`;
        }
    }

    // --- 修改：initReplyFeatures 呼叫分頁渲染 ---
    async initReplyFeatures(articleId) {
        console.log('初始化留言功能，文章ID:', articleId);
        const replies = await this.loadArticleReplies(articleId);
        this.renderReplies(replies, 1, 10);
        this.updateReplyCount(replies.length);
        // ...（後續表單事件邏輯不變）
    }

    // 檢查當前登入會員是否為文章作者
    isCurrentUserAuthor(article) {
        try {
            const memberData = localStorage.getItem('currentMember') || sessionStorage.getItem('currentMember');
            if (!memberData || !article) {
                return false;
            }

            const member = JSON.parse(memberData);

            // 檢查會員ID是否匹配 - 處理多種可能的屬性名稱
            const memId = member.mem_id || member.memId;
            const articleMemberId = article.mem_id || article.memId || article.memberId;

            if (memId && articleMemberId) {
                return memId === articleMemberId;
            }

            return false;
        } catch (error) {
            console.error('檢查作者身份時發生錯誤:', error);
            return false;
        }
    }

    // 刪除文章（使用級聯刪除，包含相關圖片）
    async deleteArticle(articleId) {
        try {
            console.log('開始刪除文章，使用級聯刪除 API...');

            // 使用新的級聯刪除 API
            const response = await fetch(`${window.api_prefix}/api/articles/${articleId}/cascade`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            console.log('級聯刪除 API 回應:', result);

            if (result.status === 'success') {
                console.log('文章及相關資源刪除成功');

                const deletedInfo = result.data;
                let message = '文章已成功刪除！';

                if (deletedInfo && deletedInfo.deletedImageCount > 0) {
                    message += `\n同時刪除了 ${deletedInfo.deletedImageCount} 張相關圖片。`;
                }

                alert(message);
                console.log('刪除統計:', deletedInfo);

                // 根據文章類型重定向到對應的列表頁面
                const targetPage = this.getArticleListPage(this.currentArticle.acTypeId);
                window.location.href = targetPage;
                return true;
            } else {
                console.error('級聯刪除失敗:', result);
                throw new Error(result.message || '級聯刪除失敗');
            }
        } catch (error) {
            console.error('級聯刪除發生錯誤，嘗試使用備用刪除方式:', error);

            // 如果新API失敗，回退到舊API
            try {
                console.log('使用備用刪除方式...');
                const fallbackResponse = await fetch(`${window.api_prefix}/api/articles/${articleId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const fallbackResult = await fallbackResponse.json();
                console.log('備用刪除 API 回應:', fallbackResult);

                if (fallbackResult.status === 'success') {
                    console.log('備用刪除成功');
                    alert('文章已刪除（注意：相關圖片可能未被清理）');

                    // 根據文章類型重定向到對應的列表頁面
                    const targetPage = this.getArticleListPage(this.currentArticle.acTypeId);
                    window.location.href = targetPage;
                    return true;
                } else {
                    console.error('備用刪除也失敗:', fallbackResult);
                    alert('刪除文章失敗: ' + (fallbackResult.message || '未知錯誤'));
                    return false;
                }
            } catch (fallbackError) {
                console.error('備用刪除也發生錯誤:', fallbackError);
                alert('刪除文章時發生錯誤，請稍後再試');
                return false;
            }
        }
    }

    // 根據文章類型獲取對應的列表頁面
    getArticleListPage(acTypeId) {
        const pageMap = {
            30001: 'articles-list-1.html', // 新手指南
            30002: 'articles-list-2.html', // 料理技巧
            30003: 'articles-list-3.html'  // 裝備評測
        };
        return pageMap[acTypeId] || 'article-type.html';
    }

    // 顯示刪除確認對話框
    showDeleteConfirmation(articleId, articleTitle) {
        const confirmed = confirm(`確定要刪除文章「${articleTitle}」嗎？\n\n此操作無法復原。`);
        if (confirmed) {
            this.deleteArticle(articleId);
        }
    }

    // 新增：獲取文章詳細統計資訊
    async getArticleStats(articleId) {
        try {
            console.log('獲取文章統計資訊:', articleId);

            const response = await fetch(`${window.api_prefix}/api/articles/${articleId}/stats`);
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                console.log('文章統計資訊:', result.data);
                return result.data;
            } else {
                console.error('獲取統計資訊失敗:', result);
                return null;
            }
        } catch (error) {
            console.error('獲取統計資訊時發生錯誤:', error);
            return null;
        }
    }

    // 新增：獲取上傳建議
    async getUploadRecommendations() {
        try {
            const response = await fetch(`${window.api_prefix}/api/articles/upload-recommendations`);
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                console.log('上傳建議:', result.data);
                return result.data;
            } else {
                console.error('獲取上傳建議失敗:', result);
                return null;
            }
        } catch (error) {
            console.error('獲取上傳建議時發生錯誤:', error);
            return null;
        }
    }

    // 新增：測試上傳策略
    async testUploadStrategy(fileSize) {
        try {
            const response = await fetch(`${window.api_prefix}/api/article-images/upload-strategy?fileSize=${fileSize}`);
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                console.log('上傳策略測試結果:', result.data);
                return result.data;
            } else {
                console.error('測試上傳策略失敗:', result);
                return null;
            }
        } catch (error) {
            console.error('測試上傳策略時發生錯誤:', error);
            return null;
        }
    }

    // 新增：分析文章內容中的圖片
    async analyzeArticleImages(htmlContent) {
        try {
            const response = await fetch(`${window.api_prefix}/api/articles/analyze-images`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(htmlContent)
            });

            const result = await response.json();
            if (response.ok && result.status === 'success') {
                console.log('圖片分析結果:', result.data);
                return result.data;
            } else {
                console.error('圖片分析失敗:', result);
                return null;
            }
        } catch (error) {
            console.error('圖片分析時發生錯誤:', error);
            return null;
        }
    }

    // 新增：獲取文章的所有圖片
    async getArticleImages(articleId) {
        try {
            console.log('獲取文章圖片列表:', articleId);

            const response = await fetch(`${window.api_prefix}/api/articles/${articleId}/images`);
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                console.log('文章圖片列表:', result.data);
                return result.data;
            } else {
                console.error('獲取圖片列表失敗:', result);
                return [];
            }
        } catch (error) {
            console.error('獲取圖片列表時發生錯誤:', error);
            return [];
        }
    }

    // 新增：顯示文章圖片管理界面（僅作者可見）
    async displayImageManagement(articleId, isAuthor = false) {
        if (!isAuthor) return; // 只有作者才能看到圖片管理

        const images = await this.getArticleImages(articleId);
        if (images.length === 0) return;

        console.log('=== 文章圖片管理 ===');
        console.log(`共找到 ${images.length} 張圖片:`);

        images.forEach((image, index) => {
            const imageSize = image.acImg ? (image.acImg.length / 1024).toFixed(2) : '未知';
            console.log(`圖片 ${index + 1}:`);
            console.log(`  - ID: ${image.acImgId}`);
            console.log(`  - 大小: ${imageSize} KB`);
            console.log(`  - 預覽: ${window.api_prefix}/api/article-images/${image.acImgId}/image`);
        });

        // 在文章標題下方添加圖片管理按鈕
        const postHeader = document.querySelector('.post-header');
        if (postHeader && !postHeader.querySelector('.image-management-btn')) {
            const imageManageBtn = document.createElement('button');
            imageManageBtn.className = 'image-management-btn';
            imageManageBtn.innerHTML = `<i class="fas fa-images"></i> 管理圖片 (${images.length})`;
            imageManageBtn.style.cssText = `
                background: #17a2b8;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 0.85rem;
                cursor: pointer;
                margin-left: 10px;
                transition: all 0.3s ease;
            `;

            imageManageBtn.addEventListener('click', () => {
                this.showImageManagementModal(images, articleId);
            });

            const deleteBtn = postHeader.querySelector('.delete-article-btn');
            if (deleteBtn) {
                deleteBtn.insertAdjacentElement('beforebegin', imageManageBtn);
            } else {
                postHeader.appendChild(imageManageBtn);
            }
        }
    }

    // 新增：顯示圖片管理彈窗 - 增強版
    showImageManagementModal(images, articleId) {
        // 創建彈窗
        const modal = document.createElement('div');
        modal.className = 'image-management-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            width: 90%;
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                <h3 style="margin: 0; color: #3a5a40;">圖片管理 (${images.length} 張)</h3>
                <button onclick="this.closest('.image-management-modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div class="image-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                ${images.map((image, index) => {
            const imageSize = image.acImg ? (image.acImg.length / 1024).toFixed(2) : '未知';
            return `
                        <div class="image-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center;">
                            <img src="${window.api_prefix}/api/article-images/${image.acImgId}/image" 
                                 alt="文章圖片 ${index + 1}" 
                                 style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                            <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px;">
                                ID: ${image.acImgId}<br>
                                大小: ${imageSize} KB
                            </div>
                            <button onclick="window.open('${window.api_prefix}/api/article-images/${image.acImgId}/image', '_blank')" 
                                    style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;">
                                查看
                            </button>
                            <button onclick="navigator.clipboard.writeText('${window.api_prefix}/api/article-images/${image.acImgId}/image')" 
                                    style="background: #17a2b8; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">
                                複製連結
                            </button>
                        </div>
                    `;
        }).join('')}
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // 點擊背景關閉彈窗
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 新增：顯示文章統計資訊
    async displayArticleStats(articleId) {
        /* === 統計資訊顯示已暫時隱藏 === */
        /*
        const stats = await this.getArticleStats(articleId);
        if (!stats) return;

        // 更新文章標題旁的統計資訊
        const statsContainer = document.querySelector('.post-meta');
        if (statsContainer) {
            const existingStats = statsContainer.querySelector('.article-stats');
            if (existingStats) {
                existingStats.remove();
            }

            const statsElement = document.createElement('div');
            statsElement.className = 'article-stats';
            statsElement.style.cssText = `
                display: flex;
                gap: 15px;
                margin-top: 10px;
                font-size: 0.9rem;
                color: #666;
                flex-wrap: wrap;
            `;

            statsElement.innerHTML = `
                <span title="瀏覽次數"><i class="fas fa-eye"></i> ${stats.viewCount.toLocaleString()}</span>
                <span title="圖片數量"><i class="fas fa-images"></i> ${stats.imageCount}</span>
                <span title="內容長度"><i class="fas fa-file-text"></i> ${stats.contentLength.toLocaleString()} 字</span>
                <span title="圖片總大小"><i class="fas fa-database"></i> ${stats.totalImageSizeMB} MB</span>
            `;

            statsContainer.appendChild(statsElement);
        }

        // 在控制台顯示詳細統計
        console.log('=== 文章詳細統計 ===');
        console.log('文章ID:', stats.acId);
        console.log('標題:', stats.title);
        console.log('瀏覽次數:', stats.viewCount.toLocaleString());
        console.log('圖片數量:', stats.imageCount);
        console.log('內容長度:', stats.contentLength.toLocaleString(), '字');
        console.log('圖片總大小:', stats.totalImageSizeMB, 'MB');
        console.log('發布時間:', new Date(stats.publishTime).toLocaleString());
        console.log('文章狀態:', stats.status === 0 ? '顯示' : '隱藏');
        */
    }

    // --- 文章詳情 Like 功能 ---
    async setupLikeFeature(article) {
        const likeBtn = document.querySelector('.like-article-btn');
        const likeCountSpan = document.querySelector('.like-count');
        if (!likeBtn || !likeCountSpan || !article || !article.acId) return;

        // 取得會員ID
        let memId = null;
        try {
            const memberData = localStorage.getItem('currentMember') || sessionStorage.getItem('currentMember');
            if (memberData) {
                const member = JSON.parse(memberData);
                memId = member.mem_id || member.memId;
            }
        } catch (e) { memId = null; }

        // 查詢是否已按讚
        async function fetchLikeStatus() {
            if (!memId) return false;
            try {
                const res = await fetch(`${window.api_prefix}/api/nice-articles/check?acId=${article.acId}&memId=${memId}`);
                const result = await res.json();
                return result.status === 'success' && result.data === true;
            } catch { return false; }
        }

        // 查詢按讚數
        async function fetchLikeCount() {
            try {
                const res = await fetch(`${window.api_prefix}/api/nice-articles/article/${article.acId}/count`);
                const result = await res.json();
                return result.status === 'success' ? result.data : 0;
            } catch { return 0; }
        }

        // 刷新UI
        async function refreshLikeUI() {
            const liked = await fetchLikeStatus();
            const likeCount = await fetchLikeCount();
            likeBtn.classList.toggle('liked', liked);
            likeBtn.querySelector('span').textContent = liked ? '已按讚' : '按讚';
            likeCountSpan.textContent = likeCount;
        }

        await refreshLikeUI();

        // 綁定點擊事件
        likeBtn.onclick = async function () {
            if (!memId) {
                alert('請先登入才能按讚');
                setTimeout(() => { window.location.href = 'login.html'; }, 1200);
                return;
            }
            const liked = await fetchLikeStatus();
            if (liked) {
                // 取消按讚
                try {
                    const res = await fetch(`${window.api_prefix}/api/nice-articles?acId=${article.acId}&memId=${memId}`, { method: 'DELETE' });
                    const result = await res.json();
                    if (result.status === 'success') {
                        await refreshLikeUI();
                    } else {
                        alert(result.message || '取消按讚失敗');
                    }
                } catch {
                    alert('取消按讚失敗');
                }
            } else {
                // 新增按讚
                try {
                    const now = new Date();
                    const likeTime = now.toISOString().split('.')[0]; // 產生 2025-07-02T19:26:15
                    const res = await fetch(`${window.api_prefix}/api/nice-articles`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ acId: article.acId, memId: memId, likeTime })
                    });
                    const result = await res.json();
                    if (result.status === 'success') {
                        await refreshLikeUI();
                    } else {
                        alert(result.message || '按讚失敗');
                    }
                } catch {
                    alert('按讚失敗');
                }
            }
        };
    }

    // 新增：載入所有文章並查詢每篇的 likeCount、replyCount、viewCount
    async loadArticlesWithStats(acTypeId = null) {
        // 1. 取得所有文章
        let articles = await this.loadArticles(acTypeId);
        // 2. 依序查詢每篇的 likeCount、replyCount、viewCount
        await Promise.all(articles.map(async (article) => {
            // 按讚數
            try {
                const res = await fetch(`${window.api_prefix}/api/nice-articles/article/${article.acId}/count`);
                const result = await res.json();
                article.likeCount = (result.status === 'success') ? result.data : 0;
            } catch { article.likeCount = 0; }
            // 留言數
            try {
                const res = await fetch(`${window.api_prefix}/api/replies/article/${article.acId}/count`);
                const result = await res.json();
                article.replyCount = (result.status === 'success') ? result.data : 0;
            } catch { article.replyCount = 0; }

        }));
        return articles;
    }
}

// 創建全局實例
const articleManager = new ArticleManager();

// 當頁面載入完成時初始化
document.addEventListener('DOMContentLoaded', function () {
    // 根據頁面類型初始化
    if (window.location.pathname.includes('articles.html')) {
        articleManager.initArticleDetail();
    }
});

// 導出給其他模組使用
window.ArticleManager = ArticleManager;
window.articleManager = articleManager;

// 執行測試
// window.addEventListener('load', testGetAuthorName);

// 要啟用 API 調試，取消下面這行的註解
// window.addEventListener('load', debugApiResponse);

// 調試函數：測試 API 回應結構
async function debugApiResponse() {
    try {
        console.log('=== 開始調試 API 回應 ===');

        // 測試文章列表 API
        const listResponse = await fetch(`${window.api_prefix}/api/articles`);
        const listResult = await listResponse.json();
        console.log('文章列表 API 回應:', listResult);

        if (listResult.data && listResult.data.length > 0) {
            const firstArticle = listResult.data[0];
            console.log('第一篇文章完整結構:', firstArticle);
            console.log('第一篇文章的所有屬性:', Object.keys(firstArticle));
            console.log('第一篇文章的 memberVO:', firstArticle.memberVO);

            // 檢查是否有其他可能的成員屬性
            for (const key in firstArticle) {
                if (key.toLowerCase().includes('member') || key.toLowerCase().includes('mem') || key.toLowerCase().includes('user') || key.toLowerCase().includes('author')) {
                    console.log(`找到可能的成員屬性 ${key}:`, firstArticle[key]);
                }
            }

            // 測試 getAuthorName 方法
            const authorName = articleManager.getAuthorName(firstArticle.memberVO);
            console.log('解析出的作者名稱:', authorName);
        }

        // 測試單一文章 API
        if (listResult.data && listResult.data.length > 0) {
            const articleId = listResult.data[0].acId;
            const singleResponse = await fetch(`${window.api_prefix}/api/articles/${articleId}`);
            const singleResult = await singleResponse.json();
            console.log('單一文章 API 回應:', singleResult);

            if (singleResult.data) {
                console.log('單一文章完整結構:', singleResult.data);
                console.log('單一文章的所有屬性:', Object.keys(singleResult.data));
                console.log('單一文章的 memberVO:', singleResult.data.memberVO);

                // 檢查是否有其他可能的成員屬性
                for (const key in singleResult.data) {
                    if (key.toLowerCase().includes('member') || key.toLowerCase().includes('mem') || key.toLowerCase().includes('user') || key.toLowerCase().includes('author')) {
                        console.log(`找到可能的成員屬性 ${key}:`, singleResult.data[key]);
                    }
                }
            }
        }

    } catch (error) {
        console.error('調試 API 時發生錯誤:', error);
    }
}

// 簡單測試 getAuthorName 方法
function testGetAuthorName() {
    console.log('=== 測試 getAuthorName 方法 ===');

    const testCases = [
        { memberVO: { memName: '施欣妤' }, expected: '施欣妤' },
        { memberVO: { mem_name: '陳柏瑋' }, expected: '陳柏瑋' },
        { memberVO: { name: '張小美' }, expected: '張小美' },
        { memberVO: { member: { memName: '林小強' } }, expected: '林小強' },
        { memberVO: null, expected: '露營愛好者' },
        { memberVO: {}, expected: '露營愛好者' }
    ];

    testCases.forEach((testCase, index) => {
        const result = articleManager.getAuthorName(testCase.memberVO);
        console.log(`測試 ${index + 1}: 期望 "${testCase.expected}", 實際 "${result}"`);
    });
}

// 初始化三個列表頁時掛上排序選單事件
function setupArticleListSort(typeId) {
    document.addEventListener('DOMContentLoaded', async function () {
        const sortSelect = document.getElementById('sort-guides');
        let articles = await articleManager.loadArticlesWithStats(typeId);
        let currentSort = sortSelect ? sortSelect.value : 'latest';
        articleManager.articles = articles;
        articleManager.renderArticleList('articles-container', typeId, 1, currentSort);
        articleManager.renderPopularArticles(typeId);
        if (sortSelect) {
            sortSelect.addEventListener('change', async function () {
                currentSort = this.value;
                // 每次切換都重新載入所有文章資料
                let articles = await articleManager.loadArticlesWithStats(typeId);
                articleManager.articles = articles;
                articleManager.renderArticleList('articles-container', typeId, 1, currentSort);
                articleManager.renderPopularArticles(typeId);
            });
        }
    });
}

// === 增強 API 測試工具 ===

// 測試上傳建議 API
async function testUploadRecommendations() {
    console.log('=== 測試上傳建議 API ===');
    const recommendations = await articleManager.getUploadRecommendations();

    if (recommendations) {
        console.log('上傳策略建議:', recommendations);
        console.table(recommendations.strategies);
    } else {
        console.error('獲取上傳建議失敗');
    }
}

// 測試上傳策略 API
async function testUploadStrategy() {
    console.log('=== 測試上傳策略 API ===');

    // 測試不同檔案大小
    const testSizes = [
        { size: 1024 * 512, name: '512KB 小檔案' },
        { size: 1024 * 1024 * 1.5, name: '1.5MB 小檔案' },
        { size: 1024 * 1024 * 5, name: '5MB 中檔案' },
        { size: 1024 * 1024 * 15, name: '15MB 大檔案' }
    ];

    for (const test of testSizes) {
        console.log(`\n測試 ${test.name} (${test.size} bytes):`);
        const strategy = await articleManager.testUploadStrategy(test.size);
        if (strategy) {
            console.log('建議策略:', strategy.strategy);
            console.log('檔案大小:', (test.size / 1024 / 1024).toFixed(2), 'MB');
        }
    }
}

// 測試圖片分析 API
async function testImageAnalysis() {
    console.log('=== 測試圖片分析 API ===');

    // 模擬包含多張圖片的 HTML 內容
    const testHtml = `
        <p>測試文章內容</p>
        <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...">
        <p>更多內容</p>
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAA...">
    `;

    const analysis = await articleManager.analyzeArticleImages(testHtml);
    if (analysis) {
        console.log('圖片分析結果:', analysis);
        console.log('總圖片數:', analysis.totalImages);
        console.log('總大小:', analysis.totalSizeMB, 'MB');
        console.log('策略分佈:', analysis.strategies);
    } else {
        console.error('圖片分析失敗');
    }
}

// 測試文章統計 API
async function testArticleStats(articleId) {
    /* === 統計測試功能已暫時隱藏 === */
    /*
    if (!articleId) {
        console.error('請提供文章ID，例如: testArticleStats(30000082)');
        return;
    }

    console.log(`=== 測試文章統計 API (ID: ${articleId}) ===`);

    const stats = await articleManager.getArticleStats(articleId);
    if (stats) {
        console.log('文章統計:', stats);
        console.table({
            '瀏覽次數': stats.viewCount,
            '圖片數量': stats.imageCount,
            '內容長度': `${stats.contentLength} 字`,
            '圖片總大小': `${stats.totalImageSizeMB} MB`,
            '發布時間': new Date(stats.publishTime).toLocaleString(),
            '文章狀態': stats.status === 0 ? '顯示' : '隱藏'
        });
    } else {
        console.error('獲取文章統計失敗');
    }
    */
}

// 測試文章圖片管理 API
async function testArticleImages(articleId) {
    if (!articleId) {
        console.error('請提供文章ID，例如: testArticleImages(30000082)');
        return;
    }

    console.log(`=== 測試文章圖片管理 API (ID: ${articleId}) ===`);

    const images = await articleManager.getArticleImages(articleId);
    if (images && images.length > 0) {
        console.log(`找到 ${images.length} 張圖片:`);
        images.forEach((image, index) => {
            const imageSize = image.acImg ? (image.acImg.length / 1024).toFixed(2) : '未知';
            console.log(`圖片 ${index + 1}:`);
            console.log(`  - ID: ${image.acImgId}`);
            console.log(`  - 大小: ${imageSize} KB`);
            console.log(`  - 預覽: ${window.api_prefix}/api/article-images/${image.acImgId}/image`);
        });
    } else {
        console.log('該文章沒有圖片或獲取圖片失敗');
    }
}

// 一鍵測試所有增強 API
async function testAllEnhancedAPIs(articleId) {
    console.log('🚀 開始測試所有增強 API...\n');

    try {
        await testUploadRecommendations();
        console.log('\n' + '='.repeat(50) + '\n');

        await testUploadStrategy();
        console.log('\n' + '='.repeat(50) + '\n');

        if (articleId) {
            await testArticleStats(articleId);
            console.log('\n' + '='.repeat(50) + '\n');

            await testArticleImages(articleId);
        } else {
            console.log('⚠️ 未提供文章ID，跳過文章相關測試');
            console.log('如需測試文章功能，請使用: testAllEnhancedAPIs(30000082)');
        }

        console.log('\n✅ 所有 API 測試完成！');
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
    }
}

// 快速開始指南
/* === 測試工具提示已暫時隱藏 === */
/*
console.log(`
🎯 增強 API 測試工具已載入！

可用的測試函數：
📊 testUploadRecommendations() - 測試上傳建議
🔧 testUploadStrategy() - 測試上傳策略
📈 testArticleStats(articleId) - 測試文章統計
🖼️ testArticleImages(articleId) - 測試圖片管理
🚀 testAllEnhancedAPIs(articleId) - 一鍵測試所有API

範例使用：
testAllEnhancedAPIs(30000082)
testArticleStats(30000082)

💡 在 articles.html 頁面打開開發者工具控制台執行這些命令來測試新功能！
`);
*/
