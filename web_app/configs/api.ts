import { config } from "./config";

export const Api = {
  BASE_API: config.API_GATEWAY_BASE_URL || "http://localhost:8080",

  Auth: {
    LOGIN: "/api/auth/v1/authenticate",
    REFRESH_TOKEN: "/api/auth/v1/refresh-token",
    REGISTER: "/api/auth/v1/register",
    REGISTER_VERIFICATION: "/api/auth/v1/register-verification",
    VERIFY_EMAIL: "/api/auth/v1/verify-email",
    FORGOT_PASSWORD: "/api/auth/v1/forgot-password",
    RESET_PASSWORD: "/api/auth/v1/reset-password",
    GET_PROFILE: "/api/auth/v1/profile",
    GOOGLE_LOGIN: "/api/auth/v1/google-login",
  },



  Classroom: {
    GET_STUDENT_CLASSROOMS: "/api/acas/v1/classrooms/student",
    GET_ALL_CLASSROOMS: "/api/acas/v1/classrooms",
    GET_BY_ID: "/api/acas/v1/classrooms",
    ENROLL: "/api/acas/v1/class-enrollments/enroll",
    LEAVE: "/api/acas/v1/class-enrollments/leave",
    GET_LECTURER_CLASSROOMS: '/api/acas/v1/classrooms/lecturer',
    CREATE_CLASSROOM: '/api/acas/v1/classrooms',
  },

  Examination: {
    GET_BY_CLASS: "/api/acas/v1/examinations/by-class",
  },



  Subject: {
    GET_ALL_SUBJECTS: '/api/acas/v1/subjects',
    CREATE_SUBJECT: '/api/acas/v1/subjects',
    UPDATE_SUBJECT: '/api/acas/v1/subjects',
    SOFT_DELETE_SUBJECT: '/api/acas/v1/subjects',
    DELETE_SUBJECT: '/api/acas/v1/subjects',
  }
};