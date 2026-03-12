import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT || 3000;

// Validate essential environment variables
const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_INITDB_ROOT_USERNAME', 'MONGO_INITDB_ROOT_PASSWORD'];
const missingEnv = REQUIRED_ENV.filter(env => !process.env[env]);
if (missingEnv.length > 0) {
    console.error(`[CRITICAL ERROR] Missing required environment variables: ${missingEnv.join(', ')}`);
    process.exit(1);
}

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? [process.env.DOMAIN, /\.disher\.io$/]
            : true,
        credentials: true
    }
});

// Attach io to app for use in routes
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`[SOCKET] User ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
});

// Database Connection with Retry Logic
const connectDB = async () => {
    const mongoUser = encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME);
    const mongoPass = encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD);
    const mongoHost = process.env.MONGO_HOST || 'database';
    const MONGO_URI = `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:27017/disher?authSource=admin`;

    try {
        await mongoose.connect(MONGO_URI);
        console.log('[DATABASE] Connected to MongoDB');
    } catch (err) {
        console.error('[DATABASE ERROR] Connection failed, retrying in 5 seconds...', err.message);
        setTimeout(connectDB, 5000);
    }
};

connectDB();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export { io };
