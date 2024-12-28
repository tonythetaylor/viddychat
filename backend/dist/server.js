"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const ssl_1 = require("./config/ssl");
const socket_1 = require("./socket/socket");
const environment_1 = require("./config/environment");
const PORT = process.env.PORT || 5005;
const sslOptions = (0, ssl_1.loadSSLCertificates)();
const server = https_1.default.createServer(sslOptions, app_1.default);
(0, socket_1.initializeSocket)(server);
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`HTTPS Server is running on port ${PORT} in ${environment_1.ENV} mode`);
    try {
        yield database_1.default.$connect();
        console.log('Connected to the database');
    }
    catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}));
