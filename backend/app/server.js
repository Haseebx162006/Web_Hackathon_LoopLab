require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
