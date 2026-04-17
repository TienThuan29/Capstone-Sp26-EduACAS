
export const PageUrl = {

    HOME_PAGE: '/',
    LOGIN_PAGE: '/login',
    REGISTER_PAGE: '/register',
    FIRST_LOGIN_PAGE: '/first-login',
    TEST_AUTH_PAGE: '/test-auth',
    DEFAULT_PAGE: '/default',
    ABOUT_US_PAGE: '/other/about-us',
    FEATURES_PAGE: '/other/features',
    CONTACT_PAGE: '/other/contact',

    // Dashboard routes
    DASHBOARD_PAGE: '/dashboard',
    MY_CLASSROOM_PAGE: '/my-classroom',
    ASSIGNMENTS_PAGE: '/assignments',
    ANNOUNCEMENTS_PAGE: '/announcements',
    PROFILE_PAGE: '/profile',
    NOTIFICATIONS_PAGE: '/notifications',

    // Lecturer routes
    MANAGE_CLASSROOM_PAGE: '/manage-classroom',
    QUESTION_BANKS_PAGE: '/problem-banks',
    QUESTION_BANK_PAGE: '/question-banks',
    EXAM_BANK_PAGE: '/exam-banks',
    QUIZ_BANK_PAGE: '/quiz-banks',
    QUIZ_BANK_DETAIL_PAGE: (id: string) => `/quiz-banks/${id}`,
    PROBLEM_BANKS_CREATE_PAGE: '/problem-banks/create',
    PROBLEM_BANKS_VIEW_PAGE: (id: string) => `/problem-banks/${id}`,
    PROBLEM_BANKS_EDIT_PAGE: (id: string) => `/problem-banks/${id}/edit`,

    // Admin routes
    ADMIN_PAGE: '/admin',
    ADMIN_CLASSES_PAGE: '/admin/classes',
    ADMIN_SUBJECTS_PAGE: '/admin/subjects',
    ADMIN_PROGRAMMING_LANGUAGES_PAGE: '/admin/programming-languages',
    ADMIN_USERS_PAGE: '/admin/users',
    ADMIN_NOTIFICATIONS_PAGE: '/admin/notifications',
    ADMIN_DISCUSSIONS_PAGE: '/admin/discussions',
    ADMIN_MATERIALS_PAGE: '/admin/materials',

}