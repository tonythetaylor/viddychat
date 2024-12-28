"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = exports.createJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_SECRET || 'your_secret_key';
const createJWT = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, SECRET, { expiresIn: '1h' });
};
exports.createJWT = createJWT;
const verifyJWT = (token) => {
    return jsonwebtoken_1.default.verify(token, SECRET);
};
exports.verifyJWT = verifyJWT;
