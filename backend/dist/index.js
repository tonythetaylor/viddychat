"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
// Load SSL certificates
const SSL_KEY_PATH = path_1.default.join(__dirname, '..', 'certs', 'server.key');
const SSL_CERT_PATH = path_1.default.join(__dirname, '..', 'certs', 'server.cert');
// Log certificate paths for verification
console.log('Using SSL Certificate:', SSL_CERT_PATH);
console.log('Using SSL Key:', SSL_KEY_PATH);
// Ensure certificate files exist
if (!fs_1.default.existsSync(SSL_KEY_PATH) || !fs_1.default.existsSync(SSL_CERT_PATH)) {
    console.error('SSL certificates not found. Please generate them as per the instructions.');
    process.exit(1);
}
const app = (0, express_1.default)();
// Determine environment (default to development)
const ENV = process.env.NODE_ENV || 'development';
// Load allowed origins from .env based on the environment
const origins = {
    development: ((_a = process.env.DEV_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['http://localhost:3000'],
    testing: ((_b = process.env.TEST_ORIGINS) === null || _b === void 0 ? void 0 : _b.split(',')) || [],
    production: ((_c = process.env.PROD_ORIGINS) === null || _c === void 0 ? void 0 : _c.split(',')) || [],
};
const allowedOrigins = origins[ENV] || [];
// Configure CORS
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.get('/', (req, res) => {
    res.send(`Video Chat Backend is running in ${ENV} mode over HTTPS.`);
});
// Create HTTPS server with the generated certificate and key
const server = https_1.default.createServer({
    key: fs_1.default.readFileSync(SSL_KEY_PATH),
    cert: fs_1.default.readFileSync(SSL_CERT_PATH),
}, app);
// Initialize Socket.IO server
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
// Store connected users
let users = [];
io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    socket.on('join-room', (username) => {
        // Remove any existing user with the same socketId to prevent duplicates
        users = users.filter((user) => user.socketId !== socket.id);
        const user = { socketId: socket.id, username };
        users.push(user);
        socket.broadcast.emit('user-connected', user); // Emit to all except sender
        console.log(`${username} connected.`);
    });
    socket.on('offer', (data) => {
        console.log('Received offer from', data.caller, 'to', data.target);
        io.to(data.target).emit('offer', {
            sdp: data.sdp,
            caller: data.caller,
        });
    });
    socket.on('answer', (data) => {
        console.log('Received answer from', data.responder, 'to', data.target);
        io.to(data.target).emit('answer', {
            sdp: data.sdp,
            responder: data.responder,
        });
    });
    socket.on('ice-candidate', (data) => {
        console.log('Received ICE candidate from', data.from, 'to', data.target);
        io.to(data.target).emit('ice-candidate', {
            candidate: data.candidate,
            from: data.from,
        });
    });
    socket.on('disconnect', () => {
        users = users.filter((user) => user.socketId !== socket.id);
        socket.broadcast.emit('user-disconnected', socket.id); // Emit to all except sender
        console.log(`Connection ${socket.id} disconnected.`);
    });
});
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
    console.log(`HTTPS Server is running on port ${PORT} in ${ENV} mode`);
});
