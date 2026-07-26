(function exposeDateUtils(root) {
    function toDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function parseDateKey(dateKey) {
        const match = String(dateKey || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) throw new Error('Invalid date key.');
        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        if (toDateKey(date) !== dateKey) throw new Error('Invalid calendar date.');
        return date;
    }

    function getLocalDayRange(dateKey) {
        const start = parseDateKey(dateKey);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
    }

    function timestampToDate(timestamp) {
        if (!timestamp) return null;
        if (typeof timestamp.toDate === 'function') return timestamp.toDate();
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function belongsToLocalDay(timestamp, dateKey) {
        const date = timestampToDate(timestamp);
        if (!date) return false;
        const { start, end } = getLocalDayRange(dateKey);
        return date >= start && date < end;
    }

    function shiftDateKey(dateKey, days) {
        const date = parseDateKey(dateKey);
        date.setDate(date.getDate() + days);
        return toDateKey(date);
    }

    const api = { belongsToLocalDay, getLocalDayRange, parseDateKey, shiftDateKey, timestampToDate, toDateKey };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIDateUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
