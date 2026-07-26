(function exposeReminderUtils(root) {
    const TYPES = Object.freeze(['meal', 'weight', 'activity', 'wellness']);
    const MESSAGES = Object.freeze({
        meal: { title: 'Nhắc nhật ký thực phẩm', body: 'Hãy ghi các món và khẩu phần đã cân trong hôm nay.' },
        weight: { title: 'Nhắc cân nặng', body: 'Hãy ghi cân nặng hôm nay nếu đây là ngày bạn thường cân.' },
        activity: { title: 'Nhắc vận động', body: 'Hãy thêm số bước chân và số phút vận động hôm nay.' },
        wellness: { title: 'Nhắc phục hồi', body: 'Hãy ghi số giờ ngủ đêm qua và mức stress hôm nay.' }
    });

    function isValidTime(value) {
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
    }

    function normalizeSettings(settings) {
        const source = settings && typeof settings === 'object' ? settings : {};
        const items = {};
        TYPES.forEach((type) => {
            items[type] = {
                enabled: Boolean(source.items?.[type]?.enabled),
                time: isValidTime(source.items?.[type]?.time) ? source.items[type].time : '20:00'
            };
        });
        return { enabled: Boolean(source.enabled), items };
    }

    function getDueReminders(settings, completion, sentState, now = new Date()) {
        const normalized = normalizeSettings(settings);
        if (!normalized.enabled) return [];
        const dateKey = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        ].join('-');
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        return TYPES.filter((type) => {
            const item = normalized.items[type];
            const [hour, minute] = item.time.split(':').map(Number);
            return item.enabled
                && currentMinutes >= hour * 60 + minute
                && completion?.[type] !== true
                && sentState?.[type] !== dateKey;
        }).map((type) => ({ type, dateKey, ...MESSAGES[type] }));
    }

    const api = { getDueReminders, isValidTime, MESSAGES, normalizeSettings, TYPES };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIReminderUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
