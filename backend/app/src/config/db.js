const mongoose = require('mongoose');
const logger = require('../utils/logger');

const toPositiveInteger = (value) => {
    if (!value) {
        return undefined;
    }

    const parsed = Number.parseInt(String(value), 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return undefined;
    }

    return parsed;
};

const buildMongooseOptions = () => {
    const options = {};

    const maxPoolSize = toPositiveInteger(process.env.MONGO_MAX_POOL_SIZE);
    const minPoolSize = toPositiveInteger(process.env.MONGO_MIN_POOL_SIZE);
    const maxIdleTimeMS = toPositiveInteger(process.env.MONGO_MAX_IDLE_TIME_MS);
    const connectTimeoutMS = toPositiveInteger(process.env.MONGO_CONNECT_TIMEOUT_MS);
    const socketTimeoutMS = toPositiveInteger(process.env.MONGO_SOCKET_TIMEOUT_MS);
    const serverSelectionTimeoutMS = toPositiveInteger(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS);

    if (maxPoolSize) options.maxPoolSize = maxPoolSize;
    if (minPoolSize) options.minPoolSize = minPoolSize;
    if (maxIdleTimeMS) options.maxIdleTimeMS = maxIdleTimeMS;
    if (connectTimeoutMS) options.connectTimeoutMS = connectTimeoutMS;
    if (socketTimeoutMS) options.socketTimeoutMS = socketTimeoutMS;
    if (serverSelectionTimeoutMS) options.serverSelectionTimeoutMS = serverSelectionTimeoutMS;

    return options;
};

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not set');
        }

        const options = buildMongooseOptions();
        await mongoose.connect(mongoUri, options);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error(`MongoDB connection failed`, error);
        process.exit(1);
    }
};

module.exports = connectDB;
