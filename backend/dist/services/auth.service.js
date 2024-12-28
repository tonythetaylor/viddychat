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
exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const jwt_utils_1 = require("../utils/jwt.utils");
const registerUser = (email, password, username) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield database_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('Email is already registered');
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    return database_1.default.user.create({
        data: { email, password: hashedPassword, username },
    });
});
exports.registerUser = registerUser;
const loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield database_1.default.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }
    return (0, jwt_utils_1.createJWT)(user.id);
});
exports.loginUser = loginUser;
const getUserProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield database_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, createdAt: true },
    });
    if (!user) {
        throw new Error('User not found');
    }
    return user;
});
exports.getUserProfile = getUserProfile;
