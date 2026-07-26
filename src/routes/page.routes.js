const express = require('express');
const pages = require('../controllers/page.controller');

const router = express.Router();

router.get('/', pages.home);
router.get('/roadmap', pages.roadmap);
router.get('/camera', pages.camera);
router.get('/diary', pages.diary);
router.get('/profile', pages.profile);

router.get('/index.html', (req, res) => res.redirect(301, '/'));
['roadmap', 'camera', 'diary', 'profile'].forEach((page) => {
  router.get(`/${page}.html`, (req, res) => res.redirect(301, `/${page}`));
});

module.exports = router;
