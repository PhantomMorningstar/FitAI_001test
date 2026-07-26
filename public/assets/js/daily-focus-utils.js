(function exposeDailyFocusUtils(root) {
    const TASKS = Object.freeze([
        { type: 'meal', title: 'Ghi bữa ăn', description: 'Ghi món và khẩu phần đã cân.', href: '/camera', action: 'Ghi món ăn', icon: 'fa-utensils' },
        { type: 'activity', title: 'Cập nhật vận động', description: 'Thêm số bước và phút vận động hôm nay.', href: '/profile#activity-history-section', action: 'Ghi vận động', icon: 'fa-person-walking' },
        { type: 'wellness', title: 'Kiểm tra phục hồi', description: 'Ghi giấc ngủ đêm qua và mức stress.', href: '/profile#wellness-history-section', action: 'Ghi phục hồi', icon: 'fa-moon' },
        { type: 'weight', title: 'Ghi cân nặng', description: 'Chỉ ghi khi đây là ngày bạn thường cân.', href: '/profile#weight-history-section', action: 'Ghi cân nặng', icon: 'fa-weight-scale' }
    ]);
    function buildDailyFocus(completion = {}, limit = 3) {
        const count = Math.max(1, Math.min(Number(limit) || 3, TASKS.length));
        return [...TASKS].sort((a, b) => Number(Boolean(completion[a.type])) - Number(Boolean(completion[b.type])))
            .slice(0, count).map((task) => ({ ...task, completed: completion[task.type] === true }));
    }
    const api = { buildDailyFocus, TASKS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIDailyFocusUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
