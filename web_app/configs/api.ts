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
        RESET_FIRST_LOGIN_PASSWORD: '/api/auth/v1/reset-first-login-password',
        GET_PROFILE: '/api/auth/v1/profile',
        GOOGLE_LOGIN: '/api/auth/v1/google-login',
        GRANT_ACCOUNT: '/api/auth/v1/grant-account',
    },

    User: {
        GET_ALL: '/api/auth/v1/users',
        UPDATE: (id: string) => `/api/auth/v1/users/${id}`,
    },

    Subject: {
        GET_ALL: '/api/acas/v1/subjects',
        GET_BY_ID: (id: string) => `/api/acas/v1/subjects/${id}`,
        SEARCH: '/api/acas/v1/subjects/search',
        GET_PAGED: '/api/acas/v1/subjects/paged',
        
        // admin
        CREATE: '/api/acas/v1/subjects',
        UPDATE: (id: string) => `/api/acas/v1/subjects/${id}`,
        DELETE: (id: string) => `/api/acas/v1/subjects/${id}`,
        SOFT_DELETE: (id: string) => `/api/acas/v1/subjects/${id}/soft-delete`,
        RESTORE: (id: string) => `/api/acas/v1/subjects/${id}/restore`,
        BULK_SOFT_DELETE: '/api/acas/v1/subjects/bulk/soft-delete',
        BULK_RESTORE: '/api/acas/v1/subjects/bulk/restore',
    },

    ProgrammingLanguage: {
        GET_ALL: '/api/acas/v1/programming-languages',
        GET_BY_ID: (id: string) => `/api/acas/v1/programming-languages/${id}`,
        SEARCH: '/api/acas/v1/programming-languages/search',
        GET_PAGED: '/api/acas/v1/programming-languages/paged',
        
        // admin
        CREATE: '/api/acas/v1/programming-languages',
        UPDATE: (id: string) => `/api/acas/v1/programming-languages/${id}`,
        DELETE: (id: string) => `/api/acas/v1/programming-languages/${id}`,
        TOGGLE_ENABLE: (id: string) => `/api/acas/v1/programming-languages/${id}/toggle-enable`,
    },

    Classroom: {
        GET_ALL: '/api/acas/v1/classrooms',
        GET_BY_ID: (id: string) => `/api/acas/v1/classrooms/${id}`,
    }

}