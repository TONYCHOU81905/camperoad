// 文章數據管理
class ArticleManager {
    constructor() {
        this.articles = [];
        this.currentArticle = null;
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.currentTypeId = null;
    }

    // 載入文章數據 - 使用 Spring Boot API
    async loadArticles(acTypeId = null) {
        try {
            let url = 'http://localhost:8081/CJA101G02/api/articles';

            // 如果有指定 acTypeId，使用進階搜尋 API 來過濾
            if (acTypeId) {
                url = `http://localhost:8081/CJA101G02/api/articles/search/advanced?keyword=&acTypeId=${acTypeId}`;
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

    // 獲取文章瀏覽數
    getViewCount(articleId) {
        // 如果 viewCounter 存在，使用真實的瀏覽統計
        if (typeof viewCounter !== 'undefined' && viewCounter) {
            return viewCounter.getViewCount(articleId);
        }

        // 否則使用模擬數據（200以下的隨機數）
        const randomViews = Math.floor(Math.random() * 200) + 1;
        return randomViews;
    }

    // 格式化瀏覽數顯示
    formatViewCount(articleId) {
        const count = this.getViewCount(articleId);

        if (typeof viewCounter !== 'undefined' && viewCounter) {
            return viewCounter.formatViewCount(articleId);
        }

        // 備用格式化邏輯
        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '萬';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        } else {
            return count.toString();
        }
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

    // 設置當前文章
    setCurrentArticle(articleId) {
        this.currentArticle = this.getArticleById(articleId);
        return this.currentArticle;
    }

    // 獲取分頁數據
    getPaginatedArticles(typeId, page = 1) {
        let articles = typeId ? this.getArticlesByType(typeId) : this.articles;

        // 只顯示已發布的文章
        articles = articles.filter(article => article.acStatus === 0);

        // 按發布時間排序（最新的在前）
        articles.sort((a, b) => new Date(b.acTime) - new Date(a.acTime));

        const totalArticles = articles.length;
        const totalPages = Math.ceil(totalArticles / this.itemsPerPage);
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;

        return {
            articles: articles.slice(startIndex, endIndex),
            totalArticles,
            totalPages,
            currentPage: page
        };
    }

    // 渲染分頁控制
    renderPagination(totalPages, currentPage, typeId) {
        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) return;

        let paginationHTML = '';

        // 上一頁按鈕
        if (currentPage > 1) {
            paginationHTML += `<a href="#" data-page="${currentPage - 1}" data-type="${typeId}">上一頁 <i class="fas fa-chevron-left"></i></a>`;
        }

        // 頁碼按鈕
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            paginationHTML += `<a href="#" class="${activeClass}" data-page="${i}" data-type="${typeId}">${i}</a>`;
        }

        // 下一頁按鈕
        if (currentPage < totalPages) {
            paginationHTML += `<a href="#" data-page="${currentPage + 1}" data-type="${typeId}">下一頁 <i class="fas fa-chevron-right"></i></a>`;
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
                this.goToPage(page, type);
            }
        };

        paginationContainer.addEventListener('click', clickListener);
        paginationContainer._paginationListener = clickListener;
    }

    // 跳轉到指定頁面
    goToPage(page, typeId) {
        this.currentPage = page;
        this.currentTypeId = typeId;
        this.renderArticleList('articles-container', typeId, page);
        this.renderPopularArticles(typeId);

        // 更新 URL 參數
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        if (typeId) {
            url.searchParams.set('type', typeId);
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

                // 如果是作者，添加刪除按鈕
                if (isAuthor) {
                    // 移除現有的刪除按鈕（如果存在）
                    const existingDeleteBtn = postHeader.querySelector('.delete-article-btn');
                    if (existingDeleteBtn) {
                        existingDeleteBtn.remove();
                    }

                    // 創建刪除按鈕
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-article-btn';
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 刪除文章';
                    deleteBtn.title = '刪除這篇文章';

                    // 添加點擊事件
                    deleteBtn.addEventListener('click', () => {
                        this.showDeleteConfirmation(article.acId, article.acTitle);
                    });

                    // 將刪除按鈕插入到標題後面
                    postTitle.insertAdjacentElement('afterend', deleteBtn);
                }
            }

            // 更新發布時間
            const postDate = postContent.querySelector('.post-date');
            if (postDate) {
                postDate.innerHTML = `<i class="fas fa-calendar"></i> 發布時間：${formattedDate}`;
            }

            // 更新瀏覽次數
            const viewCountElement = postContent.querySelector('.view-count');
            if (viewCountElement) {
                viewCountElement.setAttribute('data-article-id', article.acId);
                viewCountElement.textContent = this.formatViewCount(article.acId);
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

            // 更新文章內容
            const postBody = postContent.querySelector('.post-body');
            if (postBody) {
                const content = article.acContext ? article.acContext.replace(/\n/g, '<br>') : '無內容';
                postBody.innerHTML = `<p>${content}</p>`;
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
        const container = document.getElementById(containerId);
        if (!container) return;

        let paginatedData = this.getPaginatedArticles(typeId, page);
        let articlesToShow = paginatedData.articles;

        // 排序
        switch (sortType) {
            case 'latest':
                articlesToShow.sort((a, b) => new Date(b.acTime) - new Date(a.acTime));
                break;
            case 'popular': // 最多觀看
                articlesToShow.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
                break;
            case 'most-liked':
                articlesToShow.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
                break;
            case 'most-commented':
                articlesToShow.sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0));
                break;
        }

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
            const preview = article.acContext ? article.acContext.substring(0, 80) + '...' : '無內容預覽';
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
                            <span class="view-count" data-article-id="${article.acId}">${article.viewCount || 0}</span>
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
                            <span><i class="fas fa-eye"></i> <span class="view-count" data-article-id="${article.acId}">${article.viewCount || 0}</span></span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = htmlContent;
        this.renderPagination(paginatedData.totalPages, page, typeId);
    }

    // 初始化文章詳情頁面
    async initArticleDetail() {
        try {
            // 同時載入文章和會員資料
            await Promise.all([
                this.loadArticles(),
                this.loadMembers()
            ]);

            // 從 URL 參數獲取文章 ID
            const urlParams = new URLSearchParams(window.location.search);
            const articleId = urlParams.get('id');

            if (articleId) {
                await this.loadSingleArticle(parseInt(articleId));
            } else {
                // 如果沒有指定 ID，顯示第一篇
                const firstArticle = this.getLatestArticles(1)[0];
                if (firstArticle) {
                    await this.loadSingleArticle(firstArticle.acId);
                    // 更新 URL 以反映當前顯示的文章
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('id', firstArticle.acId);
                    window.history.replaceState({}, '', newUrl);
                }
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
                this.renderArticleDetail(articleId);

                // 記錄文章瀏覽
                if (typeof viewCounter !== 'undefined' && viewCounter) {
                    viewCounter.recordView(articleId);
                }

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

    // 渲染熱門文章側邊欄
    renderPopularArticles(typeId = null) {
        const container = document.getElementById('popular-articles-list');
        if (!container) return;

        let articles = typeId ? this.getArticlesByType(typeId) : this.getLatestArticles(10);

        // 根據瀏覽次數排序（從高到低）
        articles.sort((a, b) => {
            const viewCountA = this.getViewCount(a.acId);
            const viewCountB = this.getViewCount(b.acId);
            return viewCountB - viewCountA; // 降序排列
        });

        articles = articles.slice(0, 3); // 只顯示前3篇

        const images = ['camp-1.jpg', 'camp-2.jpg', 'camp-3.jpg'];

        const htmlContent = articles.map((article, index) => {
            const authorName = this.getAuthorName(article); // 直接傳入整個文章物件

            return `
                <li>
                    <a href="articles.html?id=${article.acId}">
                        <img src="images/${images[index % images.length]}" alt="${article.acTitle}" />
                        <div class="popular-guide-info">
                            <h4>${article.acTitle}</h4>
                            <div class="popular-guide-meta">
                                <span><i class="fas fa-eye"></i> <span class="view-count" data-article-id="${article.acId}">${this.formatViewCount(article.acId)}</span></span>
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

    // 刪除文章
    async deleteArticle(articleId) {
        try {
            const response = await fetch(`${window.api_prefix}/api/articles/${articleId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            console.log('刪除文章 API 回應:', result);

            if (result.status === 'success') {
                console.log('文章刪除成功');
                alert('文章已成功刪除');

                // 根據文章類型重定向到對應的列表頁面
                const targetPage = this.getArticleListPage(this.currentArticle.acTypeId);
                window.location.href = targetPage;
                return true;
            } else {
                console.error('刪除文章失敗:', result);
                alert('刪除文章失敗: ' + result.message);
                return false;
            }
        } catch (error) {
            console.error('刪除文章時發生錯誤:', error);
            alert('刪除文章時發生錯誤');
            return false;
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
            // 瀏覽數
            try {
                article.viewCount = this.getViewCount(article.acId);
            } catch { article.viewCount = 0; }
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
        const listResponse = await fetch('http://localhost:8081/CJA101G02/api/articles');
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
            const singleResponse = await fetch(`http://localhost:8081/CJA101G02/api/articles/${articleId}`);
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
        if (sortSelect) {
            sortSelect.addEventListener('change', function () {
                currentSort = this.value;
                articleManager.renderArticleList('articles-container', typeId, 1, currentSort);
            });
        }
    });
}
