/**
 * Theme Management Module
 * Handles dark/light theme switching with localStorage persistence
 */

const Theme = {
    STORAGE_KEY: 'vku360-theme',
    DARK: 'dark',
    LIGHT: 'light',

    /**
     * Get current theme
     * @returns {string} 'dark' or 'light'
     */
    getCurrent() {
        // Lấy chủ đề hiện tại từ bộ nhớ đệm
        // Mục đích: Kiểm tra localStorage để biết người dùng đang dùng Dark mode hay Light mode, mặc định là Dark.
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored === this.LIGHT || stored === this.DARK) {
            return stored;
        }
        return this.DARK;
    },

    /**
     * Set theme
     * @param {string} theme - 'dark' or 'light'
     */
    set(theme) {
        // Thiết lập chủ đề mới
        // Mục đích: Lưu chủ đề vào localStorage, áp dụng lên giao diện và cập nhật trạng thái các nút bấm tương ứng.
        if (theme !== this.DARK && theme !== this.LIGHT) {
            console.warn('Invalid theme:', theme);
            return;
        }

        localStorage.setItem(this.STORAGE_KEY, theme);
        this.apply(theme);
        this.updateToggleButtons(theme);

        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },

    /**
     * Apply theme to document
     * @param {string} theme - 'dark' or 'light'
     */
    apply(theme) {
        // Áp dụng chủ đề lên toàn bộ trang web
        // Mục đích: Thay đổi thuộc tính 'data-theme' trên thẻ HTML để CSS cập nhật màu sắc toàn hệ thống.
        if (theme === this.LIGHT) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    },

    /**
     * Toggle between dark and light
     */
    toggle() {
        // Đảo ngược chủ đề hiện tại
        // Mục đích: Chuyển từ Sáng sang Tối hoặc ngược lại khi người dùng nhấn nút chuyển đổi nhanh.
        const current = this.getCurrent();
        const next = current === this.DARK ? this.LIGHT : this.DARK;
        this.set(next);
    },

    /**
     * Update toggle button states
     * @param {string} currentTheme - 'dark' or 'light'
     */
    updateToggleButtons(currentTheme) {
        // Cập nhật giao diện các nút chuyển chủ đề
        // Mục đích: Thay đổi icon (mặt trời/mặt trăng) và nhãn văn bản của nút bấm cho phù hợp với chế độ đang chọn.
        const targetTheme = currentTheme === this.DARK ? this.LIGHT : this.DARK;
        const targetLabel = targetTheme === this.LIGHT ? 'Light' : 'Dark';
        const iconClass = targetTheme === this.LIGHT ? 'ph ph-sun' : 'ph ph-moon';
        const ariaLabel = targetTheme === this.LIGHT ? 'Switch to light theme' : 'Switch to dark theme';

        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.setAttribute('data-target-theme', targetTheme);
            btn.setAttribute('aria-label', ariaLabel);
            btn.setAttribute('title', ariaLabel);
            btn.classList.remove('active');

            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = iconClass;
            }

            const label = btn.querySelector('span');
            if (label) {
                label.textContent = targetLabel;
            }
        });
    },

    /**
     * Initialize theme on page load
     */
    init() {
        // Khởi tạo hệ thống chủ đề khi tải trang
        // Mục đích: Tự động áp dụng chủ đề đã lưu và gắn sự kiện click cho tất cả các nút chuyển đổi chủ đề trên trang.
        const theme = this.getCurrent();
        this.apply(theme);

        // Set up toggle button listeners
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTheme = btn.getAttribute('data-target-theme');
                if (targetTheme) {
                    this.set(targetTheme);
                } else {
                    this.toggle();
                }
            });
        });

        // Update button states
        this.updateToggleButtons(theme);
    }
};

// Export for ES modules
export default Theme;
