// 文章瀏覽統計系統
class ViewCounter {
    constructor() {
        this.viewData = this.loadViewData();
        this.currentSession = this.generateSessionId();
        this.init();
    }

    init() {
        // 為現有文章設置初始瀏覽數
        this.initializeExistingArticles();

        // 定期保存瀏覽數據
        setInterval(() => {
            this.saveViewData();
        }, 30000); // 每30秒保存一次

        // 頁面卸載時保存數據
        window.addEventListener('beforeunload', () => {
            this.saveViewData();
        });
    }

    // 生成會話ID（用於識別同一用戶的多次訪問）
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 載入瀏覽數據
    loadViewData() {
        try {
            const data = localStorage.getItem('articleViewData');
            const parsedData = data ? JSON.parse(data) : {
                views: {}, // 文章瀏覽次數
                sessions: {}, // 會話記錄
                lastUpdate: Date.now()
            };

            // 將 sessions 從陣列轉換回 Set
            Object.keys(parsedData.views).forEach(articleId => {
                if (parsedData.views[articleId].sessions && Array.isArray(parsedData.views[articleId].sessions)) {
                    parsedData.views[articleId].sessions = new Set(parsedData.views[articleId].sessions);
                } else {
                    parsedData.views[articleId].sessions = new Set();
                }
            });

            return parsedData;
        } catch (error) {
            console.error('載入瀏覽數據失敗:', error);
            return {
                views: {},
                sessions: {},
                lastUpdate: Date.now()
            };
        }
    }

    // 保存瀏覽數據
    saveViewData() {
        try {
            this.viewData.lastUpdate = Date.now();

            // 創建一個可序列化的副本
            const serializableData = {
                views: {},
                sessions: this.viewData.sessions,
                lastUpdate: this.viewData.lastUpdate
            };

            // 將 Set 轉換為陣列以便序列化
            Object.keys(this.viewData.views).forEach(articleId => {
                serializableData.views[articleId] = {
                    totalViews: this.viewData.views[articleId].totalViews,
                    uniqueViews: this.viewData.views[articleId].uniqueViews,
                    sessions: Array.from(this.viewData.views[articleId].sessions)
                };
            });

            localStorage.setItem('articleViewData', JSON.stringify(serializableData));
        } catch (error) {
            console.error('保存瀏覽數據失敗:', error);
        }
    }

    // 記錄文章瀏覽
    recordView(articleId) {
        if (!articleId) return;

        const articleIdStr = articleId.toString();

        // 初始化文章瀏覽記錄（如果不存在）
        if (!this.viewData.views[articleIdStr]) {
            // 新文章從0開始
            this.viewData.views[articleIdStr] = {
                totalViews: 0,
                uniqueViews: 0,
                sessions: new Set()
            };

            console.log(`文章 ${articleId} 初始化瀏覽記錄，從0開始`);
        }

        // 檢查是否為新的會話訪問
        const isNewSession = !this.viewData.views[articleIdStr].sessions.has(this.currentSession);

        if (isNewSession) {
            // 增加總瀏覽次數
            this.viewData.views[articleIdStr].totalViews++;

            // 增加獨立瀏覽次數
            this.viewData.views[articleIdStr].uniqueViews++;

            // 記錄會話
            this.viewData.views[articleIdStr].sessions.add(this.currentSession);

            console.log(`文章 ${articleId} 瀏覽記錄: 總瀏覽 ${this.viewData.views[articleIdStr].totalViews}, 獨立瀏覽 ${this.viewData.views[articleIdStr].uniqueViews}`);
        }

        // 立即保存數據
        this.saveViewData();
    }

    // 獲取文章瀏覽次數
    getViewCount(articleId) {
        if (!articleId) return 0;

        const articleIdStr = articleId.toString();
        const articleData = this.viewData.views[articleIdStr];

        if (!articleData) {
            // 新文章從0開始
            return 0;
        }

        // 返回總瀏覽次數
        return articleData.totalViews;
    }

    // 獲取文章獨立瀏覽次數
    getUniqueViewCount(articleId) {
        if (!articleId) return 0;

        const articleIdStr = articleId.toString();
        const articleData = this.viewData.views[articleIdStr];

        if (!articleData) return 0;

        // 返回獨立瀏覽次數
        return articleData.uniqueViews;
    }

    // 獲取所有文章的瀏覽統計
    getAllViewStats() {
        return this.viewData.views;
    }

    // 清理過期的會話數據（保留最近30天的數據）
    cleanupOldSessions() {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        Object.keys(this.viewData.views).forEach(articleId => {
            const articleData = this.viewData.views[articleId];
            if (articleData.lastAccess && articleData.lastAccess < thirtyDaysAgo) {
                delete this.viewData.views[articleId];
            }
        });
    }

    // 格式化瀏覽次數顯示
    formatViewCount(articleId) {
        const count = this.getViewCount(articleId);

        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '萬';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        } else {
            return count.toString();
        }
    }

    // 更新頁面上的瀏覽次數顯示
    updateViewDisplay(articleId, elementSelector = null) {
        const formattedCount = this.formatViewCount(articleId);

        if (elementSelector) {
            const element = document.querySelector(elementSelector);
            if (element) {
                element.textContent = formattedCount;
            }
        }

        return formattedCount;
    }

    // 批量更新頁面上的所有瀏覽次數
    updateAllViewDisplays() {
        // 查找頁面上所有的瀏覽次數元素
        const viewElements = document.querySelectorAll('[data-article-id]');

        viewElements.forEach(element => {
            const articleId = element.getAttribute('data-article-id');
            const formattedCount = this.formatViewCount(articleId);

            // 更新顯示
            const countSpan = element.querySelector('.view-count');
            if (countSpan) {
                countSpan.textContent = formattedCount;
            }
        });
    }

    // 導出瀏覽統計數據
    exportViewData() {
        return {
            views: this.viewData.views,
            exportTime: new Date().toISOString(),
            totalArticles: Object.keys(this.viewData.views).length
        };
    }

    // 為現有文章設置初始瀏覽數
    initializeExistingArticles() {
        // 定義現有文章ID列表（根據您的數據）
        const existingArticleIds = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
            31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
            41, 42, 43, 44, 45, 46, 47, 48, 49, 50
        ];

        let initializedCount = 0;
        existingArticleIds.forEach(articleId => {
            const articleIdStr = articleId.toString();

            // 如果文章還沒有瀏覽記錄，則設置初始隨機瀏覽數
            if (!this.viewData.views[articleIdStr]) {
                const randomViews = Math.floor(Math.random() * 200) + 1;

                this.viewData.views[articleIdStr] = {
                    totalViews: randomViews,
                    uniqueViews: randomViews,
                    sessions: new Set()
                };

                initializedCount++;
                console.log(`文章 ${articleId} 設置初始瀏覽數: ${randomViews}`);
            }
        });

        if (initializedCount > 0) {
            this.saveViewData();
            console.log(`已為 ${initializedCount} 篇現有文章設置初始瀏覽數`);
        }

        return initializedCount;
    }

    // 重置所有瀏覽數據
    resetAllData() {
        this.viewData = {
            views: {},
            sessions: {},
            lastUpdate: Date.now()
        };
        this.saveViewData();
        console.log('所有瀏覽數據已重置');
    }
}

// 創建全局實例
const viewCounter = new ViewCounter();

// 導出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewCounter;
} 