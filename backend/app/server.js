require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./src/config/db');
const { initializeChatSocket } = require('./src/sockets/chatSocket');
const logger = require('./src/utils/logger');

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || true,
        credentials: true,
    },
});

initializeChatSocket(io);
app.set('io', io);

httpServer.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
