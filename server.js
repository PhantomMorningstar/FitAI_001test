require('dotenv').config();

const app = require('./src/app');
const config = require('./src/config');

const configurationErrors = config.validateProductionConfig(process.env);
if (configurationErrors.length) {
  throw new Error(`Invalid production configuration: ${configurationErrors.join(' ')}`);
}

app.listen(config.port, () => {
  console.log(`FitAI server running at http://localhost:${config.port}`);
});
