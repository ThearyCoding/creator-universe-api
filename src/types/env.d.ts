declare namespace NodeJS {
  interface ProcessEnv {
    // Core
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    
    // Database
    MONGODB_URI: string;
    
    // Auth
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    
    // OTP/SMS
    PLASGATE_API_URL: string;
    PLASGATE_PRIVATE_KEY: string;
    PLASGATE_X_SECRET: string;
    PLASGATE_SENDER_ID: string;
    
    // Frontend
    FRONTEND_URL: string;

    BASE_URL: string;
    
    // Add other variables as needed
  }
}