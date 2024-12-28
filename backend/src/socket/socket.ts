import { Server } from 'socket.io';
import { allowedOrigins } from '../config/environment';
import { SocketUser } from '../types/user';

let users: SocketUser[] = [];

export function initializeSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.on('join-room', (username: string) => {
      users = users.filter((user) => user.socketId !== socket.id);

      const user: SocketUser = { socketId: socket.id, username };
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