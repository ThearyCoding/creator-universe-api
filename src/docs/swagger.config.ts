import { Options } from 'swagger-jsdoc';

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Creator Universe API',
      version: '1.0.0',
      description: 'API documentation for Creator Universe backend',
    },
    servers: [
      {
        // url: 'https://creator-universe-api.onrender.com/',
        url: 'http://localhost:5050/',
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
],
};


export default swaggerOptions;
