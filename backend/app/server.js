require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./src/config/db');
const { getSocketCorsOptions } = require('./src/config/cors');
const { initializeChatSocket } = require('./src/sockets/chatSocket');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: getSocketCorsOptions(),
});

initializeChatSocket(io);
app.set('io', io);

const startServer = async () => {
    await connectDB();

    httpServer.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
};

const shutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown.`);

    httpServer.close(async () => {
        try {
            await mongoose.connection.close(false);
            logger.info('MongoDB connection closed. Shutdown complete.');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown', error);
            process.exit(1);
        }
    });

    setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer().catch((error) => {
    logger.error('Server startup failed', error);
    process.exit(1);
});
