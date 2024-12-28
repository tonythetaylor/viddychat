"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cors_2 = require("./config/cors");
const environment_1 = require("./config/environment");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)(cors_2.corsOptions));
app.use('/auth', auth_routes_1.default);
app.get('/', (req, res) => {
    res.send(`Video Chat Backend is running in ${environment_1.ENV} mode over HTTPS.`);
});
exports.default = app;
