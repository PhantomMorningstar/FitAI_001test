(function exposeDietaryUtils(root) {
    const ANIMAL_FOOD_PATTERN = /(^|[\s,(/-])(thịt|gà|bò|heo|lợn|cá|tôm|cua|mực|xúc xích|giăm bông|nước mắm|chicken|beef|pork|fish|shrimp|prawn|crab|squid|salmon|tuna|bacon|ham|sausage)(?=$|[\s,)./-])/iu;
    const VEGAN_EXCLUSION_PATTERN = /(^|[\s,(/-])(trứng|sữa|phô mai|mật ong|gelatin|egg|milk|cheese|yogurt|yoghurt|honey|whey|gelatin)(?=$|[\s,)./-])/iu;

    function findDietaryConflict(foodName, dietaryPreference) {
        if (!['vegetarian', 'vegan'].includes(dietaryPreference) || typeof foodName !== 'string') {
            return { conflict: false, matchedTerm: null };
        }
        const normalizedName = foodName.trim();
        const match = normalizedName.match(ANIMAL_FOOD_PATTERN)
            || (dietaryPreference === 'vegan' ? normalizedName.match(VEGAN_EXCLUSION_PATTERN) : null);
        return {
            conflict: Boolean(match),
            matchedTerm: match?.[2] || null
        };
    }

    const findVegetarianConflict = (foodName, dietaryPreference) =>
        findDietaryConflict(foodName, dietaryPreference);
    const api = { findDietaryConflict, findVegetarianConflict };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIDietaryUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
