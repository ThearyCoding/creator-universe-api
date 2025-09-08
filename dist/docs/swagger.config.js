"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Creator Universe API',
            version: '1.0.2',
            description: 'API documentation for Creator Universe backend',
        },
        servers: [
            {
                url: process.env.BASE_URL,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        "./src/auth/routes/**/*.ts",
        "./src/auth/controllers/**/*.ts",
        "./src/user/routes/**/*.ts",
        "./src/user/controllers/**/*.ts",
        "./src/category/routes/**/*.ts",
        "./src/category/controllers/**/*.ts",
        "./src/banner/routes/**/*.ts",
        "./src/banner/controllers/**/*.ts",
        "./src/product/routes/**/*.ts",
        "./src/product/controllers/**/*.ts",
        "./src/upload/routes/**/*.ts",
        "./src/upload/controllers/**/*.ts",
        "./src/attribute/controllers/**/*.ts",
        "./src/attribute/routes/**/*.ts"
    ],
};
exports.default = swaggerOptions;
