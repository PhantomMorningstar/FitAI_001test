(function exposeActivityUtils(root) {
    const ACTIVITY_FACTORS = Object.freeze({ sedentary: 1.2, lightly: 1.375, moderately: 1.55 });

    function normalizeEntries(entries) {
        return (entries || [])
            .map((entry) => ({
                ...entry,
                steps: Number(entry.steps),
                activeMinutes: Number(entry.activeMinutes)
            }))
            .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey)
                && Number.isFinite(entry.steps) && entry.steps >= 0 && entry.steps <= 100000
                && Number.isFinite(entry.activeMinutes) && entry.activeMinutes >= 0 && entry.activeMinutes <= 1440)
            .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    }

    function summarizeActivity(entries, bmr) {
        const sorted = normalizeEntries(entries);
        if (!sorted.length) {
            return {
                sampleDays: 0, averageSteps: null, activeMinutes: 0, guidelinePercent: 0,
                observedActivity: null, activityFactor: null, adjustedTdee: null, confidence: 'insufficient'
            };
        }
        const anchor = new Date(`${sorted[sorted.length - 1].dateKey}T12:00:00`);
        const start = new Date(anchor);
        start.setDate(start.getDate() - 6);
        const windowEntries = sorted.filter((entry) => {
            const date = new Date(`${entry.dateKey}T12:00:00`);
            return date >= start && date <= anchor;
        });
        const sampleDays = windowEntries.length;
        const averageSteps = Math.round(windowEntries.reduce((sum, entry) => sum + entry.steps, 0) / sampleDays);
        const activeMinutes = windowEntries.reduce((sum, entry) => sum + entry.activeMinutes, 0);
        const averageActiveMinutes = activeMinutes / sampleDays;
        let observedActivity = 'sedentary';
        if (averageSteps >= 7500 || averageActiveMinutes >= 30) observedActivity = 'moderately';
        else if (averageSteps >= 5000 || averageActiveMinutes >= 15) observedActivity = 'lightly';
        const activityFactor = sampleDays >= 4 ? ACTIVITY_FACTORS[observedActivity] : null;
        const validBmr = Number(bmr);

        return {
            sampleDays,
            averageSteps,
            activeMinutes,
            guidelinePercent: Math.min(Math.round(activeMinutes / 150 * 100), 100),
            observedActivity,
            activityFactor,
            adjustedTdee: activityFactor && Number.isFinite(validBmr) ? Math.round(validBmr * activityFactor) : null,
            confidence: sampleDays >= 7 ? 'high' : sampleDays >= 4 ? 'medium' : 'insufficient'
        };
    }

    const api = { ACTIVITY_FACTORS, normalizeEntries, summarizeActivity };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIActivityUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
