const path = require('path');

const rootDir = path.resolve(__dirname, '../..');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  foodDataCentralApiKey: process.env.FDC_API_KEY || 'DEMO_KEY',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiVisionModel: process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash',
  geminiChatModel: process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'fitai-test1-2c5b8',
  firebaseWebConfig: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || 'fitai-test1-2c5b8',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
  },
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
  if (!environment.FIREBASE_PROJECT_ID || environment.FIREBASE_PROJECT_ID.startsWith('your_')) {
    errors.push('FIREBASE_PROJECT_ID is required to verify Firebase ID tokens.');
  }
  [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ].forEach((name) => {
    if (!environment[name] || environment[name].startsWith('your_')) {
      errors.push(`${name} is required to configure the Firebase web app.`);
    }
  });
  return errors;
}

module.exports = { ...config, validateProductionConfig };
