"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
const socket_io_1 = require("socket.io");
const environment_1 = require("../config/environment");
let users = [];
function initializeSocket(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: environment_1.allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        console.log(`New connection: ${socket.id}`);
        socket.on('join-room', (username) => {
            users = users.filter((user) => user.socketId !== socket.id);
            const user = { socketId: socket.id, username };
            users.push(user);
            socket.broadcast.emit('user-connected', user);
            console.log(`${username} connected.`);
        });
        socket.on('offer', (data) => {
            io.to(data.target).emit('offer', {
                sdp: data.sdp,
                caller: data.caller,
            });
        });
        socket.on('answer', (data) => {
            io.to(data.target).emit('answer', {
                sdp: data.sdp,
                responder: data.responder,
            });
        });
        socket.on('ice-candidate', (data) => {
            io.to(data.target).emit('ice-candidate', {
                candidate: data.candidate,
                from: data.from,
            });
        });
        socket.on('disconnect', () => {
            users = users.filter((user) => user.socketId !== socket.id);
            socket.broadcast.emit('user-disconnected', socket.id);
            console.log(`Connection ${socket.id} disconnected.`);
        });
    });
}
