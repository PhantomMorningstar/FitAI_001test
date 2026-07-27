const config = require('../config');
const { recognizeFood } = require('../services/food-vision.service');

const recognize = async (req, res) => {
  try {
    const result = await recognizeFood({
      imageDataUrl: req.body.imageDataUrl,
      apiKey: config.geminiApiKey,
      model: config.geminiVisionModel
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Không thể phân tích ảnh này. Hãy thử lại hoặc nhập tên món bằng tay.'
    });
  }
};

module.exports = { recognize };
