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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, username } = req.body;
        const user = yield (0, auth_service_1.registerUser)(email, password, username);
        res.status(201).json({ message: 'User registered successfully', user });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const token = yield (0, auth_service_1.loginUser)(email, password);
        res.status(200).json({ message: 'Login successful', token });
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
});
exports.login = login;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const userId = req.user.id; // Safely access `user.id`
        const user = yield (0, auth_service_1.getUserProfile)(userId);
        res.status(200).json({ user });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.getProfile = getProfile;
