import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define allowed environment keys
type Environment = 'development' | 'testing' | 'production';

// Load SSL certificates
const SSL_KEY_PATH = path.join(__dirname, '..', 'certs', 'server.key');
const SSL_CERT_PATH = path.join(__dirname, '..', 'certs', 'server.cert');

// Log certificate paths for verification
console.log('Using SSL Certificate:', SSL_CERT_PATH);
console.log('Using SSL Key:', SSL_KEY_PATH);

// Ensure certificate files exist
if (!fs.existsSync(SSL_KEY_PATH) || !fs.existsSync(SSL_CERT_PATH)) {
  console.error('SSL certificates not found. Please generate them as per the instructions.');
  process.exit(1);
}

const app = express();

// Determine environment (default to development)
const ENV: Environment = (process.env.NODE_ENV as Environment) || 'development';

// Load allowed origins from .env based on the environment
const origins: Record<Environment, string[]> = {
  development: process.env.DEV_ORIGINS?.split(',') || ['http://localhost:3000'],
  testing: process.env.TEST_ORIGINS?.split(',') || [],
  production: process.env.PROD_ORIGINS?.split(',') || [],
};

const allowedOrigins = origins[ENV] || [];

// Configure CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.send(`Video Chat Backend is running in ${ENV} mode over HTTPS.`);
});

// Create HTTPS server with the generated certificate and key
const server = https.createServer(
  {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  },
  app
);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Define interface for users
interface SocketUser {
  socketId: string;
  username: string;
}

// Store connected users
let users: SocketUser[] = [];

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('join-room', (username: string) => {
    // Remove any existing user with the same socketId to prevent duplicates
    users = users.filter((user) => user.socketId !== socket.id);

    const user: SocketUser = { socketId: socket.id, username };
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