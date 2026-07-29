const express = require('express');
const profileController = require('../controllers/profile.controller');
const nutritionController = require('../controllers/nutrition.controller');
const visionController = require('../controllers/vision.controller');
const nutritionChatController = require('../controllers/nutrition-chat.controller');
const { visionRateLimit } = require('../middleware/vision-rate-limit.middleware');
const { chatRateLimit } = require('../middleware/chat-rate-limit.middleware');
const { createRateLimit } = require('../middleware/api-rate-limit.middleware');
const { requireFirebaseUser } = require('../middleware/firebase-auth.middleware');
const {
  clientErrorRateLimit,
  reportClientError
} = require('../middleware/client-error-monitor.middleware');

const router = express.Router();
const standardApiRateLimit = createRateLimit({ max: 60 });
const profileRateLimit = createRateLimit({ max: 30 });

router.post(
  '/vision/recognize-food',
  requireFirebaseUser,
  express.json({ limit: '8mb' }),
  visionRateLimit,
  visionController.recognize
);

router.use(express.json({ limit: '256kb' }));
router.post('/profile/validate', profileRateLimit, profileController.validate);
router.post(
  '/profile/calibration-safety',
  profileRateLimit,
  profileController.validateCalibrationTarget
);
router.get('/nutrition/search', standardApiRateLimit, nutritionController.search);
router.get('/nutrition/foods/:fdcId', standardApiRateLimit, nutritionController.details);
router.post('/nutrition/chat', requireFirebaseUser, chatRateLimit, nutritionChatController.chat);
router.post('/monitor/client-error', clientErrorRateLimit, reportClientError);

module.exports = router;
