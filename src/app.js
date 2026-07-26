const express = require('express');
const config = require('./config');
const pageRoutes = require('./routes/page.routes');
const apiRoutes = require('./routes/api.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { productionSecurity } = require('./middleware/production-security.middleware');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', config.viewsDir);

app.use(productionSecurity);
app.use(express.urlencoded({ extended: false }));
app.use(express.static(config.publicDir));

app.get('/healthz', (req, res) => res.json({
  status: 'ok',
  release: process.env.APP_RELEASE || 'development'
}));
app.use('/api', apiRoutes);
app.use('/', pageRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
