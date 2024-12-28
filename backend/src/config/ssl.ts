import fs from 'fs';
import path from 'path';

const SSL_KEY_PATH = path.join(__dirname, '..', '..', 'certs', 'server.key');
const SSL_CERT_PATH = path.join(__dirname, '..', '..', 'certs', 'server.cert');

export function loadSSLCertificates() {
  if (!fs.existsSync(SSL_KEY_PATH) || !fs.existsSync(SSL_CERT_PATH)) {
    console.error('SSL certificates not found. Please generate them as per the instructions.');
    process.exit(1);
  }

  console.log('Using SSL Certificate:', SSL_CERT_PATH);
  console.log('Using SSL Key:', SSL_KEY_PATH);

  return {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  };
}