(function exposeWellnessUtils(root) {
    function normalizeEntries(entries) {
        return (entries || [])
            .map((entry) => ({
                ...entry,
                sleepHours: Number(entry.sleepHours),
                stressLevel: Number(entry.stressLevel)
            }))
            .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey)
                && Number.isFinite(entry.sleepHours) && entry.sleepHours >= 0 && entry.sleepHours <= 24
                && Number.isInteger(entry.stressLevel) && entry.stressLevel >= 1 && entry.stressLevel <= 5)
            .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    }

    function summarizeWellness(entries) {
        const sorted = normalizeEntries(entries);
        if (!sorted.length) {
            return {
                sampleDays: 0, averageSleepHours: null, averageStress: null,
                sleepGoalDays: 0, highStressDays: 0, insight: 'insufficient'
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
        const averageSleepHours = Number((windowEntries.reduce((sum, entry) => sum + entry.sleepHours, 0) / sampleDays).toFixed(1));
        const averageStress = Number((windowEntries.reduce((sum, entry) => sum + entry.stressLevel, 0) / sampleDays).toFixed(1));
        const sleepGoalDays = windowEntries.filter((entry) => entry.sleepHours >= 7).length;
        const highStressDays = windowEntries.filter((entry) => entry.stressLevel >= 4).length;
        let insight = 'balanced';
        if (sampleDays < 4) insight = 'insufficient';
        else if (averageSleepHours < 7 && averageStress >= 4) insight = 'sleep-and-stress';
        else if (averageSleepHours < 7) insight = 'short-sleep';
        else if (averageStress >= 4) insight = 'high-stress';

        return { sampleDays, averageSleepHours, averageStress, sleepGoalDays, highStressDays, insight };
    }

    const api = { normalizeEntries, summarizeWellness };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIWellnessUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
