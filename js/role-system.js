/**
 * 多角色系統JavaScript功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化角色切換頁面功能
    initRoleSwitchPage();
    
    // 初始化個人資料設定頁面功能
    initProfilePage();
    
    // 初始化後台頁面共用功能
    initDashboardPage();
});

/**
 * 角色切換頁面功能
 */
function initRoleSwitchPage() {
    // 檢查是否在角色切換頁面
    if (!document.querySelector('.role-switch-page')) return;
    
    // 角色卡片懸停效果
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 15px 30px rgba(58, 90, 64, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(58, 90, 64, 0.15)';
        });
    });
    
    // 角色進入按鈕點擊效果
    const roleButtons = document.querySelectorAll('.btn-enter-role');
    roleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 添加點擊波紋效果
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            this.appendChild(ripple);
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            // 移除波紋效果
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

/**
 * 個人資料設定頁面功能
 */
function initProfilePage() {
    // 檢查是否在個人資料設定頁面
    if (!document.querySelector('.profile-page')) return;
    
    // 標籤切換功能
    const menuItems = document.querySelectorAll('.profile-menu-item');
    const profileSections = document.querySelectorAll('.profile-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有活動狀態
            menuItems.forEach(i => i.classList.remove('active'));
            profileSections.forEach(s => s.classList.remove('active'));
            
            // 添加當前活動狀態
            this.classList.add('active');
            const targetId = this.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
            
            // 更新URL錨點但不跳轉
            history.pushState(null, null, this.getAttribute('href'));
        });
    });
    
    // 檢查URL錨點並激活對應標籤
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const targetMenuItem = document.querySelector(`.profile-menu-item[data-tab="${hash}"]`);
        if (targetMenuItem) {
            targetMenuItem.click();
        }
    }
    
    // 密碼強度檢測
    const passwordInputs = document.querySelectorAll('#new-password, #register-password');
    passwordInputs.forEach(input => {
        if (!input) return;
        
        input.addEventListener('input', function() {
            const password = this.value;
            const strengthBar = this.closest('.form-group').querySelector('.strength-fill');
            const strengthText = this.closest('.form-group').querySelector('.strength-text');
            
            if (!strengthBar || !strengthText) return;
            
            // 計算密碼強度
            let strength = 0;
            let strengthLabel = '';
            
            if (password.length >= 8) strength += 1;
            if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
            if (password.match(/\d/)) strength += 1;
            if (password.match(/[^a-zA-Z\d]/)) strength += 1;
            
            // 設置強度條寬度和顏色
            let strengthColor = '';
            switch (strength) {
                case 0:
                    strengthLabel = '密碼強度: 尚未輸入';
                    strengthColor = '#ccc';
                    strengthBar.style.width = '0%';
                    break;
                case 1:
                    strengthLabel = '密碼強度: 弱';
                    strengthColor = '#E76F51';
                    strengthBar.style.width = '25%';
                    break;
                case 2:
                    strengthLabel = '密碼強度: 中';
                    strengthColor = '#E9C46A';
                    strengthBar.style.width = '50%';
                    break;
                case 3:
                    strengthLabel = '密碼強度: 強';
                    strengthColor = '#A68A64';
                    strengthBar.style.width = '75%';
                    break;
                case 4:
                    strengthLabel = '密碼強度: 非常強';
                    strengthColor = '#3A5A40';
                    strengthBar.style.width = '100%';
                    break;
            }
            
            strengthBar.style.backgroundColor = strengthColor;
            strengthText.textContent = strengthLabel;
        });
    });
    
    // 密碼顯示切換
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // 頭像上傳預覽
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const avatarPreview = document.querySelector('.avatar-preview img');
                    if (avatarPreview) {
                        avatarPreview.src = e.target.result;
                    }
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // 表單提交前驗證
    const profileForms = document.querySelectorAll('.profile-form');
    profileForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 這裡可以添加表單驗證邏輯
            
            // 模擬表單提交成功
            showNotification('資料已成功更新', 'success');
        });
    });
}

/**
 * 後台頁面共用功能
 */
function initDashboardPage() {
    // 檢查是否在後台頁面
    if (!document.querySelector('.dashboard-page')) return;
    
    // 側邊欄折疊功能
    const navItems = document.querySelectorAll('.dashboard-nav > ul > li');
    navItems.forEach(item => {
        const link = item.querySelector('a');
        const subMenu = item.querySelector('.sub-menu');
        
        if (subMenu) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                item.classList.toggle('expanded');
                
                // 展開/收起子選單動畫
                if (item.classList.contains('expanded')) {
                    subMenu.style.maxHeight = subMenu.scrollHeight + 'px';
                } else {
                    subMenu.style.maxHeight = '0';
                }
            });
        }
    });
    
    // 用戶面板下拉選單
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.addEventListener('click', function() {
            this.classList.toggle('active');
        });
        
        // 點擊其他地方關閉下拉選單
        document.addEventListener('click', function(e) {
            if (!userInfo.contains(e.target)) {
                userInfo.classList.remove('active');
            }
        });
    }
    
    // 通知面板
    const notificationIcon = document.querySelector('.notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function(e) {
            e.preventDefault();
            // 這裡可以添加顯示通知面板的邏輯
        });
    }
    
    // 日期範圍選擇器
    const dateRange = document.getElementById('date-range');
    if (dateRange) {
        dateRange.addEventListener('change', function() {
            // 這裡可以添加日期範圍變更的邏輯
            if (this.value === 'custom') {
                // 顯示自訂日期範圍選擇器
            }
        });
    }
    
    // 儀表板小工具操作按鈕
    const widgetActions = document.querySelectorAll('.btn-widget-action');
    widgetActions.forEach(button => {
        button.addEventListener('click', function() {
            const widget = this.closest('.widget');
            if (this.querySelector('.fa-ellipsis-v')) {
                // 顯示小工具選項選單
            } else if (this.querySelector('.fa-sync-alt')) {
                // 重新載入小工具資料
                const widgetContent = widget.querySelector('.widget-content');
                if (widgetContent) {
                    // 添加載入動畫
                    widgetContent.classList.add('loading');
                    
                    // 模擬資料載入
                    setTimeout(() => {
                        widgetContent.classList.remove('loading');
                    }, 1000);
                }
            }
        });
    });
    
    // 表格操作按鈕
    const tableActions = document.querySelectorAll('.btn-table-action');
    tableActions.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            const row = this.closest('tr');
            
            // 根據按鈕文字執行不同操作
            switch (action) {
                case '處理':
                    // 處理訂單邏輯
                    break;
                case '追蹤':
                    // 追蹤訂單邏輯
                    break;
                case '詳情':
                    // 顯示訂單詳情
                    break;
                case '提醒':
                    // 發送提醒邏輯
                    break;
                case '補貨':
                    // 補貨邏輯
                    break;
            }
        });
    });
    
    // 圖表類型切換
    const chartTypeButtons = document.querySelectorAll('.btn-chart-type');
    chartTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            chartTypeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const chartType = this.getAttribute('data-type');
            // 這裡可以添加切換圖表類型的邏輯
        });
    });
    
    // 商品類型篩選
    const productTypeFilter = document.querySelector('.product-type-filter');
    if (productTypeFilter) {
        productTypeFilter.addEventListener('change', function() {
            // 這裡可以添加商品類型篩選邏輯
        });
    }
}

/**
 * 顯示通知訊息
 * @param {string} message - 通知訊息
 * @param {string} type - 通知類型 (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // 檢查是否已有通知容器
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // 設置通知圖標
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    // 設置通知內容
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // 添加到容器
    notificationContainer.appendChild(notification);
    
    // 添加關閉按鈕事件
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', function() {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // 顯示通知動畫
    setTimeout(() => {
        notification.classList.add('notification-show');
    }, 10);
    
    // 自動關閉通知
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

/**
 * 添加波紋效果CSS
 */
function addRippleEffectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .ripple-effect {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        }
        
        .notification {
            display: flex;
            align-items: center;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 10px;
            padding: 15px;
            width: 300px;
            transform: translateX(120%);
            transition: transform 0.3s ease;
        }
        
        .notification-show {
            transform: translateX(0);
        }
        
        .notification-hiding {
            transform: translateX(120%);
        }
        
        .notification-icon {
            margin-right: 10px;
            font-size: 1.2rem;
        }
        
        .notification-message {
            flex: 1;
        }
        
        .notification-close {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 0.8rem;
            color: #666;
        }
        
        .notification-success .notification-icon {
            color: #3A5A40;
        }
        
        .notification-error .notification-icon {
            color: #E76F51;
        }
        
        .notification-warning .notification-icon {
            color: #E9C46A;
        }
        
        .notification-info .notification-icon {
            color: #A68A64;
        }
    `;
    document.head.appendChild(style);
}

// 添加波紋效果CSS
addRippleEffectStyles();