"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedOrigins = exports.origins = exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ENV = process.env.NODE_ENV || 'development';
exports.origins = {
    development: ((_a = process.env.DEV_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['http://localhost:3000'],
    testing: ((_b = process.env.TEST_ORIGINS) === null || _b === void 0 ? void 0 : _b.split(',')) || [],
    production: ((_c = process.env.PROD_ORIGINS) === null || _c === void 0 ? void 0 : _c.split(',')) || [],
};
exports.allowedOrigins = exports.origins[exports.ENV] || [];
