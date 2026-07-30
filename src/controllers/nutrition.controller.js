const config = require('../config');
const {
  fetchFoodDetails,
  searchBrandedFoodByBarcode,
  searchFoods
} = require('../services/nutrition.service');

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
      error: error.message || 'Không thể tìm kiếm dữ liệu dinh dưỡng. Hãy thử lại.'
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
      error: error.message || 'Không thể tải chi tiết dinh dưỡng. Hãy thử lại.'
    });
  }
};

const barcode = async (req, res) => {
  try {
    const foods = await searchBrandedFoodByBarcode({
      barcode: req.params.barcode,
      grams: req.query.grams,
      apiKey: config.foodDataCentralApiKey
    });
    return res.json({ foods, source: 'USDA FoodData Central' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Unable to search this barcode. Enter the product name instead.'
    });
  }
};

module.exports = { barcode, details, search };
