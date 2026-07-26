(function exposePlanCalibrationUtils(root) {
    const KCAL_PER_KG = 7700;
    const MIN_WEIGHT_ENTRIES = 6;
    const MIN_DIARY_DAYS = 10;
    const MIN_SPAN_DAYS = 14;

    function dayNumber(dateKey) {
        return Math.floor(new Date(`${dateKey}T12:00:00Z`).getTime() / 86400000);
    }

    function roundTo(value, increment) {
        return Math.round(value / increment) * increment;
    }

    function calculateRegressionRate(entries, weightUtils) {
        const weights = weightUtils.normalizeEntries(entries);
        if (weights.length < 2) return null;
        const origin = dayNumber(weights[0].dateKey);
        const points = weights.map((entry) => ({
            x: dayNumber(entry.dateKey) - origin,
            y: entry.weightKg
        }));
        const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
        const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
        const denominator = points.reduce((sum, point) => sum + ((point.x - meanX) ** 2), 0);
        if (!denominator) return 0;
        const slope = points.reduce(
            (sum, point) => sum + ((point.x - meanX) * (point.y - meanY)),
            0
        ) / denominator;
        return Number((slope * 7).toFixed(2));
    }

    function summarizeDiary(entries, startDay, endDay) {
        const totals = new Map();
        (entries || []).forEach((entry) => {
            const calories = Number(entry.calories);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey) || !Number.isFinite(calories) || calories < 0) return;
            const day = dayNumber(entry.dateKey);
            if (day < startDay || day > endDay) return;
            totals.set(entry.dateKey, (totals.get(entry.dateKey) || 0) + calories);
        });
        const values = [...totals.values()];
        return {
            days: values.length,
            averageCalories: values.length
                ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
                : null
        };
    }

    function signedPlannedRate(profile) {
        const rate = Number(profile?.plan?.estimatedWeeklyChangeKg);
        if (!Number.isFinite(rate)) return null;
        if (profile.goal === 'lose') return -Math.abs(rate);
        if (profile.goal === 'gain') return Math.abs(rate);
        return 0;
    }

    function buildPlanCalibration(profile, weightEntries, diaryEntries, weightUtils) {
        const weights = weightUtils.normalizeEntries(weightEntries);
        const baseCalories = Number(profile?.plan?.targetCalories);
        const hasPlan = Number.isFinite(baseCalories) && baseCalories > 0;
        const firstDay = weights.length ? dayNumber(weights[0].dateKey) : null;
        const lastDay = weights.length ? dayNumber(weights[weights.length - 1].dateKey) : null;
        const spanDays = firstDay === null ? 0 : lastDay - firstDay;
        const diary = firstDay === null
            ? { days: 0, averageCalories: null }
            : summarizeDiary(diaryEntries, firstDay, lastDay);
        const requirements = {
            weightEntries: weights.length,
            requiredWeightEntries: MIN_WEIGHT_ENTRIES,
            diaryDays: diary.days,
            requiredDiaryDays: MIN_DIARY_DAYS,
            spanDays,
            requiredSpanDays: MIN_SPAN_DAYS
        };
        const healthBlocked = profile?.safety?.allowed === false;
        const ready = hasPlan
            && !healthBlocked
            && weights.length >= MIN_WEIGHT_ENTRIES
            && diary.days >= MIN_DIARY_DAYS
            && spanDays >= MIN_SPAN_DAYS;

        if (!ready) {
            return {
                ready: false,
                status: healthBlocked ? 'health-review' : 'collecting',
                requirements,
                currentTargetCalories: hasPlan ? baseCalories : null,
                observedWeeklyRateKg: null,
                plannedWeeklyRateKg: signedPlannedRate(profile),
                averageLoggedCalories: diary.averageCalories,
                observedTdee: null,
                suggestedTargetCalories: null,
                adjustmentCalories: 0,
                confidence: 'insufficient'
            };
        }

        const observedWeeklyRateKg = calculateRegressionRate(weights, weightUtils);
        const plannedWeeklyRateKg = signedPlannedRate(profile);
        const dailyWeightEnergy = (observedWeeklyRateKg / 7) * KCAL_PER_KG;
        const observedTdee = Math.round(diary.averageCalories - dailyWeightEnergy);
        if (observedTdee < 800 || observedTdee > 6000) {
            return {
                ready: false,
                status: 'data-quality',
                requirements,
                currentTargetCalories: baseCalories,
                observedWeeklyRateKg,
                plannedWeeklyRateKg,
                averageLoggedCalories: diary.averageCalories,
                observedTdee,
                suggestedTargetCalories: null,
                adjustmentCalories: 0,
                confidence: 'insufficient'
            };
        }
        const tolerance = profile.goal === 'maintain'
            ? 0.2
            : Math.max(0.15, Math.abs(plannedWeeklyRateKg || 0) * 0.35);
        let status = 'on-track';
        let adjustmentCalories = 0;

        if (profile.goal === 'lose') {
            if (observedWeeklyRateKg < plannedWeeklyRateKg - tolerance) {
                status = 'too-fast';
                adjustmentCalories = 100;
            } else if (observedWeeklyRateKg > plannedWeeklyRateKg + tolerance) {
                status = observedWeeklyRateKg >= 0 ? 'wrong-direction' : 'too-slow';
                adjustmentCalories = -100;
            }
        } else if (profile.goal === 'gain') {
            if (observedWeeklyRateKg > plannedWeeklyRateKg + tolerance) {
                status = 'too-fast';
                adjustmentCalories = -100;
            } else if (observedWeeklyRateKg < plannedWeeklyRateKg - tolerance) {
                status = observedWeeklyRateKg <= 0 ? 'wrong-direction' : 'too-slow';
                adjustmentCalories = 100;
            }
        } else if (Math.abs(observedWeeklyRateKg) > tolerance) {
            status = 'drifting';
            adjustmentCalories = observedWeeklyRateKg > 0 ? -100 : 100;
        }

        const confidence = spanDays >= 21 && weights.length >= 10 && diary.days >= 18 ? 'high' : 'medium';
        return {
            ready: true,
            status,
            requirements,
            currentTargetCalories: baseCalories,
            observedWeeklyRateKg,
            plannedWeeklyRateKg,
            averageLoggedCalories: diary.averageCalories,
            observedTdee,
            suggestedTargetCalories: adjustmentCalories
                ? Math.max(1200, roundTo(baseCalories + adjustmentCalories, 10))
                : baseCalories,
            adjustmentCalories,
            confidence
        };
    }

    const api = { buildPlanCalibration, calculateRegressionRate, summarizeDiary };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIPlanCalibrationUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
