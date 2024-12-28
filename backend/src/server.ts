import https from 'https';
import app from './app';
import prisma from './config/database';
import { loadSSLCertificates } from './config/ssl';
import { initializeSocket } from './socket/socket';
import { ENV } from './config/environment';

const PORT = process.env.PORT || 5005;

// const sslOptions = loadSSLCertificates();
if (process.env.NODE_ENV !== 'production') {
    const sslOptions = loadSSLCertificates();
    https.createServer(sslOptions, app).listen(5005, () => {
        console.log('Server running on HTTPS');
    });
} else {
    app.listen(5005, () => {
        console.log('Server running on HTTP');
    });
}

const server = https.createServer(app);
// const server = https.createServer(sslOptions, app);

initializeSocket(server);

server.listen(PORT, async () => {
  console.log(`HTTPS Server is running on port ${PORT} in ${ENV} mode`);

  try {
    await prisma.$connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
});