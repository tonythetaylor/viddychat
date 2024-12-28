"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSSLCertificates = loadSSLCertificates;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SSL_KEY_PATH = path_1.default.join(__dirname, '..', '..', 'certs', 'server.key');
const SSL_CERT_PATH = path_1.default.join(__dirname, '..', '..', 'certs', 'server.cert');
function loadSSLCertificates() {
    if (!fs_1.default.existsSync(SSL_KEY_PATH) || !fs_1.default.existsSync(SSL_CERT_PATH)) {
        console.error('SSL certificates not found. Please generate them as per the instructions.');
        process.exit(1);
    }
    console.log('Using SSL Certificate:', SSL_CERT_PATH);
    console.log('Using SSL Key:', SSL_KEY_PATH);
    return {
        key: fs_1.default.readFileSync(SSL_KEY_PATH),
        cert: fs_1.default.readFileSync(SSL_CERT_PATH),
    };
}
