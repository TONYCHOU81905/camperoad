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

    // 生成模擬瀏覽數
    generateViewCount(articleId) {
        // 使用文章ID生成一個相對穩定的隨機數
        const base = (articleId * 137) % 1000;
        return (base + 500 + Math.floor(Math.random() * 200)).toString();
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
            30002: '料理技巧',
            30003: '裝備評測'
        };
        return typeMap[typeId] || '其他';
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
        const article = this.currentArticle;
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

            // 更新作者資訊
            const authorNameElement = document.querySelector('.author-name');
            if (authorNameElement) {
                authorNameElement.textContent = authorName;
            }

            // 更新作者統計資訊（模擬數據）
            const authorStats = postContent.querySelector('.author-stats');
            if (authorStats) {
                const stats = authorStats.querySelectorAll('span:last-child');
                if (stats.length >= 4) {
                    stats[0].textContent = Math.floor(Math.random() * 200) + 50; // 發文數
                    stats[1].textContent = Math.floor(Math.random() * 50) + 10;  // 精華文
                    stats[2].textContent = Math.floor(Math.random() * 10000) + 1000; // 經驗值
                    stats[3].textContent = '2021/' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0'); // 註冊時間
                }
            }

            // 更新作者徽章
            const authorBadges = postContent.querySelector('.author-badges');
            if (authorBadges) {
                let badges = [];

                // 根據文章類型添加相關徽章
                if (article.acTypeId === 30001) { // 新手指南
                    badges.push('<span class="author-badge">新手指導員</span>');
                    badges.push('<span class="author-badge">經驗分享者</span>');
                } else if (article.acTypeId === 30002) { // 料理技巧
                    badges.push('<span class="author-badge">料理達人</span>');
                    badges.push('<span class="author-badge">野外廚師</span>');
                } else if (article.acTypeId === 30003) { // 裝備評測
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

            // 更新標籤
            const postTags = postContent.querySelector('.post-tags');
            if (postTags) {
                let tags = [`<span class="post-tag">${typeName}</span>`];

                // 根據文章類型添加相關標籤
                if (article.acTypeId === 30001) { // 新手指南
                    tags.push('<span class="post-tag">新手推薦</span>');
                    tags.push('<span class="post-tag">基礎教學</span>');
                } else if (article.acTypeId === 30002) { // 料理技巧
                    tags.push('<span class="post-tag">料理技巧</span>');
                    tags.push('<span class="post-tag">野外烹飪</span>');
                } else if (article.acTypeId === 30003) { // 裝備評測
                    tags.push('<span class="post-tag">裝備測試</span>');
                    tags.push('<span class="post-tag">產品評比</span>');
                }

                tags.push('<span class="post-tag">經驗分享</span>');
                postTags.innerHTML = tags.join('');
            }
        }

        // 更新麵包屑導航
        const breadcrumbElement = document.querySelector('.forum-breadcrumb');
        if (breadcrumbElement) {
            const typeName = this.getArticleTypeName(article.acTypeId);
            breadcrumbElement.innerHTML = `
                <a href="index.html">首頁</a> &gt;
                <a href="article-type.html">論壇攻略</a> &gt;
                <a href="article-type.html">文章分類</a> &gt;
                <a href="articles-list-${this.getListPageNumber(article.acTypeId)}.html">${typeName}</a> &gt;
                <span>${article.acTitle}</span>
            `;
        }
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
    renderArticleList(containerId, typeId = null, page = 1) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const paginatedData = this.getPaginatedArticles(typeId, page);
        const articlesToShow = paginatedData.articles;

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
                        <span class="article-tag">${typeName}</span>
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
                            <span>${this.generateViewCount(article.acId)}</span>
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
                            <span><i class="fas fa-eye"></i> ${this.generateViewCount(article.acId)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = htmlContent;

        // 渲染分頁控制
        this.renderPagination(paginatedData.totalPages, page, typeId);
    }

    // 初始化文章詳情頁面
    async initArticleDetail() {
        // 從 URL 參數獲取文章 ID
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');

        if (articleId) {
            await this.loadSingleArticle(parseInt(articleId));
        } else {
            // 如果沒有指定 ID，先載入所有文章，然後顯示第一篇
            await this.loadArticles();
            const firstArticle = this.getLatestArticles(1)[0];
            if (firstArticle) {
                await this.loadSingleArticle(firstArticle.acId);
                // 更新 URL 以反映當前顯示的文章
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('id', firstArticle.acId);
                window.history.replaceState({}, '', newUrl);
            }
        }
    }

    // 載入單一文章
    async loadSingleArticle(articleId) {
        try {
            const response = await fetch(`http://localhost:8081/CJA101G02/api/articles/${articleId}`);
            const result = await response.json();

            if (result.status === 'success' && result.data) {
                this.currentArticle = result.data;
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

        let articles = typeId ? this.getArticlesByType(typeId) : this.getLatestArticles(5);
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
                                <span><i class="fas fa-eye"></i> ${this.generateViewCount(article.acId)}</span>
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
        await this.loadArticles(typeId);

        // 從 URL 參數獲取頁碼
        const urlParams = new URLSearchParams(window.location.search);
        const page = parseInt(urlParams.get('page')) || 1;

        this.currentPage = page;
        this.currentTypeId = typeId;

        this.renderArticleList('articles-container', typeId, page);
        this.renderPopularArticles(typeId);
    }

    // 載入文章留言
    async loadArticleReplies(articleId) {
        try {
            console.log('開始載入留言，文章ID:', articleId);
            const response = await fetch(`http://localhost:8081/CJA101G02/api/replies/article/${articleId}`);
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

            const response = await fetch('http://localhost:8081/CJA101G02/api/replies', {
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

    // 渲染留言列表
    renderReplies(replies) {
        console.log('開始渲染留言，留言數量:', replies ? replies.length : 0);

        const commentsList = document.querySelector('.comments-list');
        console.log('找到留言列表容器:', commentsList);

        if (!commentsList) {
            console.error('找不到留言列表容器');
            return;
        }

        if (!replies || replies.length === 0) {
            console.log('沒有留言，顯示空狀態');
            commentsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">還沒有留言，來發表第一個留言吧！</div>';
            return;
        }

        const htmlContent = replies.map((reply, index) => {
            const authorName = this.getAuthorName(reply); // 直接傳入整個回覆物件
            const replyDate = this.formatDate(reply.replyTime);
            console.log(`渲染第 ${index + 1} 個留言:`, reply);

            return `
                <div class="comment-item">
                    <div class="comment-header">
                        <div class="comment-avatar">
                            <img src="images/user-${(index % 4) + 1}.jpg" alt="留言者頭像" />
                        </div>
                        <div class="comment-author">
                            <div class="comment-author-name">${authorName}</div>
                            <div class="comment-date">${replyDate}</div>
                        </div>
                        <div class="comment-floor">#${index + 1}</div>
                    </div>
                    <div class="comment-content">
                        ${reply.replyContext ? reply.replyContext.replace(/\n/g, '<br>') : '無內容'}
                    </div>
                    <div class="comment-actions">
                        <a href="#" class="comment-action">
                            <i class="fas fa-heart"></i>
                            <span>0</span>
                        </a>
                        <a href="#" class="comment-action">
                            <i class="fas fa-reply"></i>
                            <span>回覆</span>
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        console.log('生成的 HTML 內容:', htmlContent);
        commentsList.innerHTML = htmlContent;
    }

    // 更新留言數量
    updateReplyCount(count) {
        const commentsTitle = document.querySelector('.comments-title');
        if (commentsTitle) {
            commentsTitle.textContent = `留言討論 (${count})`;
        }
    }

    // 初始化留言功能
    async initReplyFeatures(articleId) {
        console.log('初始化留言功能，文章ID:', articleId);

        // 載入留言
        const replies = await this.loadArticleReplies(articleId);
        console.log('載入到的留言:', replies);
        this.renderReplies(replies);
        this.updateReplyCount(replies.length);

        // 設置留言表單提交事件
        const commentForm = document.querySelector('.comment-form');
        console.log('找到留言表單:', commentForm);

        if (commentForm) {
            const textarea = commentForm.querySelector('textarea');
            const submitBtn = commentForm.querySelector('.btn-submit-comment');
            console.log('找到 textarea:', textarea);
            console.log('找到 submitBtn:', submitBtn);

            // 使用更簡單的事件綁定方式
            if (submitBtn) {
                console.log('綁定提交按鈕事件');

                // 移除可能存在的舊事件監聽器
                submitBtn.removeEventListener('click', submitBtn._clickHandler);

                // 創建新的事件處理函數
                submitBtn._clickHandler = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('提交按鈕被點擊');

                    // 重新獲取當前的 textarea 元素
                    const currentTextarea = commentForm.querySelector('textarea');
                    console.log('當前 textarea:', currentTextarea);
                    console.log('textarea 值:', currentTextarea ? currentTextarea.value : 'null');

                    if (!currentTextarea || !currentTextarea.value.trim()) {
                        alert('請輸入留言內容');
                        return;
                    }

                    const replyContent = currentTextarea.value.trim();
                    console.log('留言內容:', replyContent);

                    // 顯示載入狀態
                    submitBtn.textContent = '發布中...';
                    submitBtn.disabled = true;

                    try {
                        const success = await this.addReply(articleId, replyContent);
                        console.log('留言發布結果:', success);

                        if (success) {
                            // 清空輸入框
                            currentTextarea.value = '';

                            // 重新載入留言
                            const newReplies = await this.loadArticleReplies(articleId);
                            this.renderReplies(newReplies);
                            this.updateReplyCount(newReplies.length);

                            alert('留言發布成功！');
                        }
                    } catch (error) {
                        console.error('發布留言時發生錯誤:', error);
                        alert('發布留言時發生錯誤');
                    } finally {
                        // 恢復按鈕狀態
                        submitBtn.textContent = '發布留言';
                        submitBtn.disabled = false;
                    }
                };

                // 綁定事件
                submitBtn.addEventListener('click', submitBtn._clickHandler);
            }

            // 添加按ENTER鍵發布功能
            if (textarea) {
                console.log('綁定 textarea 鍵盤事件');

                // 移除可能存在的舊事件監聽器
                textarea.removeEventListener('keypress', textarea._keypressHandler);

                // 創建新的事件處理函數
                textarea._keypressHandler = async (event) => {
                    if (event.key === 'Enter' && event.ctrlKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        console.log('Ctrl+Enter 被按下');

                        if (!textarea.value.trim()) {
                            alert('請輸入留言內容');
                            return;
                        }

                        const replyContent = textarea.value.trim();
                        const currentSubmitBtn = commentForm.querySelector('.btn-submit-comment');

                        // 顯示載入狀態
                        currentSubmitBtn.textContent = '發布中...';
                        currentSubmitBtn.disabled = true;

                        try {
                            const success = await this.addReply(articleId, replyContent);

                            if (success) {
                                // 清空輸入框
                                textarea.value = '';

                                // 重新載入留言
                                const newReplies = await this.loadArticleReplies(articleId);
                                this.renderReplies(newReplies);
                                this.updateReplyCount(newReplies.length);

                                alert('留言發布成功！');
                            }
                        } catch (error) {
                            console.error('發布留言時發生錯誤:', error);
                            alert('發布留言時發生錯誤');
                        } finally {
                            // 恢復按鈕狀態
                            currentSubmitBtn.textContent = '發布留言';
                            currentSubmitBtn.disabled = false;
                        }
                    }
                };

                // 綁定事件
                textarea.addEventListener('keypress', textarea._keypressHandler);
            }
        } else {
            console.error('找不到留言表單元素');
        }
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
            const memberId = member.mem_id || member.memId;
            const articleMemberId = article.mem_id || article.memId || article.memberId;

            if (memberId && articleMemberId) {
                return memberId === articleMemberId;
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
            const response = await fetch(`http://localhost:8081/CJA101G02/api/articles/${articleId}`, {
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
