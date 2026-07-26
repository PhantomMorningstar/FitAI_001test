const config = require('../config');
const { chatNutrition } = require('../services/nutrition-chat.service');

const chat = async (req, res) => {
  try {
    const result = await chatNutrition({
      input: req.body,
      apiKey: config.geminiApiKey,
      model: config.geminiChatModel
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Không thể trả lời câu hỏi dinh dưỡng lúc này.'
    });
  }
};

module.exports = { chat };
