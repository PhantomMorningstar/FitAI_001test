const path = require('path');

const rootDir = path.resolve(__dirname, '../..');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  foodDataCentralApiKey: process.env.FDC_API_KEY || 'DEMO_KEY',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiVisionModel: process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash',
  geminiChatModel: process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash',
  rootDir,
  publicDir: path.join(rootDir, 'public'),
  viewsDir: path.join(rootDir, 'views')
};

function validateProductionConfig(environment = process.env) {
  if ((environment.NODE_ENV || config.env) !== 'production') return [];
  const errors = [];
  const fdcKey = environment.FDC_API_KEY || '';
  if (!fdcKey || fdcKey === 'DEMO_KEY' || fdcKey.startsWith('your_')) {
    errors.push('FDC_API_KEY must use a private production FoodData Central key.');
  }
  return errors;
}

module.exports = { ...config, validateProductionConfig };
