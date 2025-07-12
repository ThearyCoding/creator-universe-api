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
        url: 'http://localhost:5000/',
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

  apis: ['./src/auth/routes/**/*.ts', './src/auth/controllers/**/*.ts'],
};


export default swaggerOptions;
