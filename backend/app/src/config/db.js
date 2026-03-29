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

const parseCompressorList = (value) => {
    if (!value) {
        return ['zlib'];
    }

    const supported = new Set(['zlib', 'snappy', 'zstd']);
    const list = String(value)
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => supported.has(entry));

    return list.length > 0 ? list : ['zlib'];
};

const buildMongooseOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
        maxPoolSize: isProduction ? 20 : 10,
        minPoolSize: isProduction ? 2 : 1,
        maxIdleTimeMS: isProduction ? 60000 : 30000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        serverSelectionTimeoutMS: 5000,
        maxConnecting: 4,
        compressors: parseCompressorList(process.env.MONGO_COMPRESSORS),
        autoIndex: !isProduction,
    };

    const maxPoolSize = toPositiveInteger(process.env.MONGO_MAX_POOL_SIZE);
    const minPoolSize = toPositiveInteger(process.env.MONGO_MIN_POOL_SIZE);
    const maxIdleTimeMS = toPositiveInteger(process.env.MONGO_MAX_IDLE_TIME_MS);
    const connectTimeoutMS = toPositiveInteger(process.env.MONGO_CONNECT_TIMEOUT_MS);
    const socketTimeoutMS = toPositiveInteger(process.env.MONGO_SOCKET_TIMEOUT_MS);
    const serverSelectionTimeoutMS = toPositiveInteger(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS);
    const maxConnecting = toPositiveInteger(process.env.MONGO_MAX_CONNECTING);

    if (maxPoolSize) options.maxPoolSize = maxPoolSize;
    if (minPoolSize) options.minPoolSize = minPoolSize;
    if (maxIdleTimeMS) options.maxIdleTimeMS = maxIdleTimeMS;
    if (connectTimeoutMS) options.connectTimeoutMS = connectTimeoutMS;
    if (socketTimeoutMS) options.socketTimeoutMS = socketTimeoutMS;
    if (serverSelectionTimeoutMS) options.serverSelectionTimeoutMS = serverSelectionTimeoutMS;
    if (maxConnecting) options.maxConnecting = maxConnecting;

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
        logger.info('MongoDB connected successfully', {
            host: mongoose.connection.host,
            dbName: mongoose.connection.name,
            pool: {
                maxPoolSize: options.maxPoolSize,
                minPoolSize: options.minPoolSize,
                maxConnecting: options.maxConnecting,
            },
        });
    } catch (error) {
        logger.error(`MongoDB connection failed`, error);
        process.exit(1);
    }
};

module.exports = connectDB;
