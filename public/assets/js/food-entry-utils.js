(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.FitAIFoodEntryUtils = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const nutrients = ['calories', 'protein', 'carbs', 'fat', 'fiber'];

    function round(value, decimals) {
        const factor = 10 ** decimals;
        return Math.round((value + Number.EPSILON) * factor) / factor;
    }

    function normalizeServingGrams(value) {
        const grams = Number(value);
        if (!Number.isFinite(grams) || grams < 1 || grams > 2000) {
            throw new RangeError('Portion must be between 1 and 2000 grams.');
        }
        return round(grams, 1);
    }

    function scaleFoodEntry(entry, requestedGrams) {
        const servingGrams = normalizeServingGrams(requestedGrams);
        const currentGrams = normalizeServingGrams(entry.servingGrams || 100);
        const ratio = servingGrams / currentGrams;
        const scaled = { servingGrams };

        nutrients.forEach((nutrient) => {
            const value = Number(entry[nutrient] || 0);
            if (!Number.isFinite(value) || value < 0) throw new TypeError(`Invalid ${nutrient} value.`);
            scaled[nutrient] = round(value * ratio, nutrient === 'calories' ? 0 : 1);
        });
        return scaled;
    }

    return { normalizeServingGrams, scaleFoodEntry };
}));
