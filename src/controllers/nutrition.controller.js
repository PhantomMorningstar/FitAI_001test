const config = require('../config');
const { fetchFoodDetails, searchFoods } = require('../services/nutrition.service');

const search = async (req, res) => {
  try {
    const foods = await searchFoods({
      query: req.query.q,
      grams: req.query.grams,
      apiKey: config.foodDataCentralApiKey
    });
    return res.json({ foods, source: 'USDA FoodData Central' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Unable to search nutrition data.'
    });
  }
};

const details = async (req, res) => {
  try {
    const result = await fetchFoodDetails({
      fdcId: req.params.fdcId,
      grams: req.query.grams,
      apiKey: config.foodDataCentralApiKey
    });
    return res.json({ ...result, source: 'USDA FoodData Central' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Unable to load nutrition details.'
    });
  }
};

module.exports = { details, search };
