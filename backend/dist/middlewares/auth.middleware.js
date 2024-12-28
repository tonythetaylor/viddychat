"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const verifyToken = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Access denied' });
        return;
    }
    try {
        const decoded = (0, jwt_utils_1.verifyJWT)(token); // Decode the JWT
        req.user = decoded; // Attach the decoded user to `req.user`
        next(); // Call the next middleware
    }
    catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.verifyToken = verifyToken;
