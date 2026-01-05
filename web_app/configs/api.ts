import { config } from "./config";

export const Api = {
    
    BASE_API: config.API_GATEWAY_BASE_URL || 'http://localhost:8080',

    Auth: {
        LOGIN: '/api/auth/v1/authenticate',
        REFRESH_TOKEN: '/api/auth/v1/refresh-token',
        REGISTER: '/api/auth/v1/register',
        REGISTER_VERIFICATION: '/api/auth/v1/register-verification',
        VERIFY_EMAIL: '/api/auth/v1/verify-email',
        FORGOT_PASSWORD: '/api/auth/v1/forgot-password',
        RESET_PASSWORD: '/api/auth/v1/reset-password',
        GET_PROFILE: '/api/auth/v1/profile',
    }

}