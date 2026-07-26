const renderPage = (view, title) => (req, res) => {
  res.render(`pages/${view}`, { title });
};

module.exports = {
  home: renderPage('index', 'Overview'),
  roadmap: renderPage('roadmap', 'Roadmap'),
  camera: renderPage('camera', 'Camera'),
  diary: renderPage('diary', 'Diary'),
  profile: renderPage('profile', 'Profile')
};
