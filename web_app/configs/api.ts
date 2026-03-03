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
    RESET_FIRST_LOGIN_PASSWORD: "/api/auth/v1/reset-first-login-password",
    GET_PROFILE: "/api/auth/v1/profile",
    UPDATE_PROFILE: "/api/auth/v1/profile",
    GOOGLE_LOGIN: "/api/auth/v1/google-login",
    GRANT_ACCOUNT: "/api/auth/v1/grant-account",
  },

  User: {
    GET_ALL: "/api/auth/v1/users",
    UPDATE: (id: string) => `/api/auth/v1/users/${id}`,
  },

  Subject: {
    GET_ALL: "/api/acas/v1/subjects",
    GET_BY_ID: (id: string) => `/api/acas/v1/subjects/${id}`,
    SEARCH: "/api/acas/v1/subjects/search",
    GET_PAGED: "/api/acas/v1/subjects/paged",

    // admin
    CREATE: "/api/acas/v1/subjects",
    UPDATE: (id: string) => `/api/acas/v1/subjects/${id}`,
    DELETE: (id: string) => `/api/acas/v1/subjects/${id}`,
    SOFT_DELETE: (id: string) => `/api/acas/v1/subjects/${id}/soft-delete`,
    RESTORE: (id: string) => `/api/acas/v1/subjects/${id}/restore`,
    BULK_SOFT_DELETE: "/api/acas/v1/subjects/bulk/soft-delete",
    BULK_RESTORE: "/api/acas/v1/subjects/bulk/restore",
  },

  ProgrammingLanguage: {
    GET_ALL: "/api/acas/v1/programming-languages",
    GET_ENABLED: "/api/acas/v1/programming-languages/enabled",
    GET_BY_ID: (id: string) => `/api/acas/v1/programming-languages/${id}`,
    SEARCH: "/api/acas/v1/programming-languages/search",
    GET_PAGED: "/api/acas/v1/programming-languages/paged",

    // admin
    CREATE: "/api/acas/v1/programming-languages",
    SYNC: "/api/acas/v1/programming-languages/sync",
    UPDATE: (id: string) => `/api/acas/v1/programming-languages/${id}`,
    UPDATE_STATUS: (id: string) => `/api/acas/v1/programming-languages/${id}/status`,
    UPDATE_LOGO: (id: string) => `/api/acas/v1/programming-languages/${id}/logo`,
    UPDATE_COMPILER_NAME: (id: string, compilerId: string) => `/api/acas/v1/programming-languages/${id}/compilers/${compilerId}/name`,
    DELETE: (id: string) => `/api/acas/v1/programming-languages/${id}`,
    TOGGLE_ENABLE: (id: string) => `/api/acas/v1/programming-languages/${id}/toggle-enable`,
  },

  Classroom: {
    GET_STUDENT_CLASSROOMS: "/api/acas/v1/classrooms/student",
    GET_ALL_CLASSROOMS: "/api/acas/v1/classrooms",
    GET_BY_ID: "/api/acas/v1/classrooms",
    ENROLL: "/api/acas/v1/class-enrollments/enroll",
    LEAVE: "/api/acas/v1/class-enrollments/leave",
    GET_LECTURER_CLASSROOMS: "/api/acas/v1/classrooms/lecturer",
    CREATE_CLASSROOM: "/api/acas/v1/classrooms",
    UPDATE_CLASSROOM: (id: string) => `/api/acas/v1/classrooms/${id}`,
    SOFT_DELETE_CLASSROOM: (id: string) => `/api/acas/v1/classrooms/${id}/soft-delete`,
  },

  Examination: {
    GET_BY_CLASS: "/api/acas/v1/examinations/by-class",
    GET_BY_ID: (id: string) => `/api/acas/v1/examinations/${id}`,
    CREATE: "/api/acas/v1/examinations",
    UPDATE: (id: string) => `/api/acas/v1/examinations/${id}`,
    DELETE: (id: string) => `/api/acas/v1/examinations/${id}`,
    GET_WITH_SPECIFIC_PROBLEM: (examId: string, problemId: string) => `/api/acas/v1/examinations/${examId}/with-problem/${problemId}`,
  },

  S3: {
    UPLOAD_AVATAR: "/api/acas/v1/public-s3/upload",
    PRIVATE_UPLOAD: "/api/acas/v1/private-s3/upload",
    PRIVATE_GET_FILE_URL: (filename: string) => `/api/acas/v1/private-s3/file/${encodeURIComponent(filename)}`,
  },

  Problem: {
    GET_ALL: "/api/acas/v1/problems",
    GET_BY_ID: (id: string) => `/api/acas/v1/problems/${id}`,
    GET_BY_LECTURER: (lecturerId: string) => `/api/acas/v1/problems/lecturer/${lecturerId}`,
    CREATE: "/api/acas/v1/problems",
    UPDATE: (id: string) => `/api/acas/v1/problems/${id}`,
    DELETE: (id: string) => `/api/acas/v1/problems/${id}`,
    OCR_EXTRACT: '/api/acas/v1/ocr/extract',
  },

  Slot: {
    CREATE: "/api/v1/slots",
    CREATE_ALL_SLOTS: (classroomId: string) => `/api/v1/slots/create-all-slots/${classroomId}`,
    GET_BY_CLASSROOM: (classroomId: string) => `/api/v1/slots/classroom/${classroomId}`,
    UPDATE: (id: string) => `/api/v1/slots/${id}`,
    DELETE: (id: string) => `/api/v1/slots/${id}`,
  },

  Material: {
    CREATE: '/api/acas/v1/materials',
    UPDATE: (id: string) => `/api/acas/v1/materials/${id}`,
    DELETE: (id: string) => `/api/acas/v1/materials/${id}`,
    SOFT_DELETE: (id: string) => `/api/acas/v1/materials/${id}/soft-delete`,
    GET_BY_CLASSROOM: (classroomId: string) => `/api/acas/v1/materials/classroom/${classroomId}`,
  },

  Submission: {
    EXECUTE_CUSTOM_TESTCASE: '/api/v1/submissions/execute/custom-testcase',
    EXECUTE_PUBLIC_TESTCASES: '/api/v1/submissions/execute/public-testcases',
  },

  TestcaseGeneration: {
    PREVIEW: '/api/acas/v1/testcase-generation/preview',
  },

  DiscussionIssue: {
    BASE: "/api/acas/v1/discussion-issues",
    GET_PAGED: "/api/acas/v1/discussion-issues",
    GET_COUNT: "/api/acas/v1/discussion-issues/count",
    GET_BY_ID: (id: string) => `/api/acas/v1/discussion-issues/${id}`,
    CREATE: "/api/acas/v1/discussion-issues",
    UPDATE: (id: string) => `/api/acas/v1/discussion-issues/${id}`,
    WRITE_COMMENT: "/api/acas/v1/discussion-issues/comments",
    REPLY_COMMENT: "/api/acas/v1/discussion-issues/comments/reply",
    UPVOTE_COMMENT: "/api/acas/v1/discussion-issues/comments/upvote",
    CHANGE_STATUS: (issueId: string) => `/api/acas/v1/discussion-issues/${issueId}/status`,
    SOFT_DELETE: (issueId: string) => `/api/acas/v1/discussion-issues/${issueId}/soft-delete`,
  },
};
