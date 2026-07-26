(function exposeWeightUtils(root) {
    function normalizeEntries(entries) {
        return (entries || [])
            .map((entry) => ({ ...entry, weightKg: Number(entry.weightKg) }))
            .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey)
                && Number.isFinite(entry.weightKg)
                && entry.weightKg >= 30
                && entry.weightKg <= 350)
            .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    }

    function calculateWeightTrend(entries) {
        const sorted = normalizeEntries(entries);
        if (!sorted.length) {
            return { count: 0, first: null, latest: null, changeKg: null, days: 0, weeklyRateKg: null };
        }
        const first = sorted[0];
        const latest = sorted[sorted.length - 1];
        const start = new Date(`${first.dateKey}T12:00:00`);
        const end = new Date(`${latest.dateKey}T12:00:00`);
        const days = Math.round((end - start) / 86400000);
        const changeKg = Number((latest.weightKg - first.weightKg).toFixed(1));
        const weeklyRateKg = days >= 7 ? Number((changeKg / days * 7).toFixed(2)) : null;
        return { count: sorted.length, first, latest, changeKg, days, weeklyRateKg };
    }

    function calculateRollingAverages(entries, windowDays = 7, minimumMeasurements = 3) {
        const sorted = normalizeEntries(entries);
        return sorted.map((entry, index) => {
            const currentDate = new Date(`${entry.dateKey}T12:00:00`);
            const windowStart = new Date(currentDate);
            windowStart.setDate(windowStart.getDate() - (windowDays - 1));
            const windowEntries = sorted.slice(0, index + 1).filter((candidate) => {
                const candidateDate = new Date(`${candidate.dateKey}T12:00:00`);
                return candidateDate >= windowStart && candidateDate <= currentDate;
            });
            const averageKg = windowEntries.length >= minimumMeasurements
                ? Number((windowEntries.reduce((sum, item) => sum + item.weightKg, 0) / windowEntries.length).toFixed(2))
                : null;
            return {
                dateKey: entry.dateKey,
                weightKg: entry.weightKg,
                averageKg,
                sampleCount: windowEntries.length
            };
        });
    }

    function getLatestRollingAverage(entries, windowDays = 7, minimumMeasurements = 3) {
        const averages = calculateRollingAverages(entries, windowDays, minimumMeasurements);
        return averages.length ? averages[averages.length - 1] : null;
    }

    function calculateGoalProgress(entries, targetWeight, goal) {
        const sorted = normalizeEntries(entries);
        const target = Number(targetWeight);
        if (!sorted.length || !Number.isFinite(target)) {
            return {
                status: 'no-data',
                startWeightKg: null,
                latestWeightKg: null,
                targetWeightKg: Number.isFinite(target) ? target : null,
                changeTowardGoalKg: null,
                remainingKg: null,
                progressPercent: null
            };
        }

        const startWeightKg = sorted[0].weightKg;
        const latestWeightKg = sorted[sorted.length - 1].weightKg;
        const remainingKg = Number(Math.abs(target - latestWeightKg).toFixed(1));
        if (goal === 'maintain') {
            const inMaintenanceRange = Math.abs(latestWeightKg - target) <= 2;
            return {
                status: inMaintenanceRange ? 'maintaining' : 'outside-range',
                startWeightKg,
                latestWeightKg,
                targetWeightKg: target,
                changeTowardGoalKg: Number((Math.abs(startWeightKg - target) - remainingKg).toFixed(1)),
                remainingKg,
                progressPercent: inMaintenanceRange ? 100 : 0
            };
        }

        const direction = goal === 'gain' ? 1 : -1;
        const totalDistance = (target - startWeightKg) * direction;
        const changeTowardGoalKg = Number(((latestWeightKg - startWeightKg) * direction).toFixed(1));
        const reached = totalDistance <= 0 || changeTowardGoalKg >= totalDistance;
        const progressPercent = totalDistance > 0
            ? Math.round(Math.min(Math.max(changeTowardGoalKg / totalDistance * 100, 0), 100))
            : 100;

        return {
            status: reached ? 'reached' : changeTowardGoalKg > 0 ? 'toward-goal' : changeTowardGoalKg < 0 ? 'away-from-goal' : 'unchanged',
            startWeightKg,
            latestWeightKg,
            targetWeightKg: target,
            changeTowardGoalKg,
            remainingKg,
            progressPercent
        };
    }

    const api = {
        calculateRollingAverages,
        calculateGoalProgress,
        calculateWeightTrend,
        getLatestRollingAverage,
        normalizeEntries
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIWeightUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
