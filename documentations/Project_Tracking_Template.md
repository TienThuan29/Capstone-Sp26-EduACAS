# PROJECT WORK BREAKDOWN STRUCTURE

| # | Function/Screen | Feature | Level* | Function/Screen Details | Planned | Status |
|---|----------------|---------|--------|----------------------|---------|--------|
| 0 | Landing Page | Landing | Medium | Public homepage: hero section with CTA, platform features showcase (coding platform, exam management, online judge), stats overview (total users, problems, submissions), programming language highlights (Python, Java, C/C++, JavaScript), contact information. Responsive design, dark/light theme support. | Iteration 1 | Pending |
| 1 | Login Page | Authentication | Medium | Email/password login form with real-time validation, Google OAuth integration button, remember-me checkbox, link to register page, link to forgot password page. Error handling for invalid credentials, disabled accounts, network errors. Dark/light theme support. | Iteration 1 | Pending |
| 2 | Register Page | Authentication | Medium | User registration with full name, email, role selection (Student/Lecturer), password with strength indicator, confirm password, terms of service checkbox. Real-time validation, email format check, password matching check, role dropdown. Google OAuth registration option. | Iteration 1 | Pending |
| 3 | Forgot Password Page | Authentication | Medium | Password reset request flow: enter registered email address, send reset request button, success confirmation message, option to try with different email, back to login link. Security: does not reveal whether email exists. | Iteration 1 | Pending |
| 4 | Reset Password Page | Authentication | Simple | Enter new password after receiving reset link/token via URL query parameters (token + email). Password field with strength indicator, confirm password field. Token validation (validity, expiration). Redirect to login on success. | Iteration 1 | Pending |
| 5 | First Login Password Change | Authentication | Simple | Forced password change page for admin-granted accounts. Fields: current password (provided by admin), new password, confirm new password. On submit, redirects to role-based dashboard. Only accessible on first login (IsFirstLogin flag). | Iteration 2 | Pending |
| 6 | Google OAuth Login | Authentication | Complex | Google OAuth2 integration: redirect to Google account selection, callback handling with Google ID token, token exchange and validation via Google API, auto-create account for new Google users, link existing account if Google email matches, JWT token generation after successful auth. | Iteration 2 | Pending |
| 7 | Email Verification | Authentication | Medium | Send verification email on successful registration with OTP 6-digit code. OTP input page with 6 separate digit boxes, auto-focus next box, resend OTP button with countdown timer, max retry limit (5 attempts), success redirect to login. | Iteration 1 | Pending |
| 8 | User Authorization (RBAC) | Authentication | Complex | Role-based access control: STUDENT role (access to student features), LECTURER role (access to lecturer features), ADMIN role (full system access). JWT token with role claims, middleware authorization on API routes, route guards on frontend (redirect unauthorized access), protected page wrapper component. | Iteration 1 | Pending |
| 9 | Profile Settings | User Profile | Medium | View and update user profile: full name display/edit, avatar upload to S3 with preview, email display (read-only), role info display, birthday field. Edit mode toggle with Save/Cancel buttons. Avatar validation: max 5MB, JPEG/PNG/WebP/GIF formats. | Iteration 2 | Pending |
| 10 | Student Home / Dashboard | Student Dashboard | Medium | Student landing page after login: enrolled classrooms overview with cards showing class name, lecturer, subject, semester. Upcoming deadlines widget (assignments, exams within 7 days), recent notifications widget, quick stats (total enrolled classes, pending assignments, completed exams). Tab navigation to All / Joining / Moved Out classrooms. | Iteration 2 | Pending |
| 11 | Not Enrolling Classroom List | Student Classroom | Medium | Browse available classrooms not yet enrolled. Display: class code badge, class name, lecturer name, subject, semester, date range. Search bar (by class name/code), semester dropdown filter, sort dropdown (Newest/Oldest/A-Z/Z-A). "Join class" button opens enrollment key modal. | Iteration 2 | Pending |
| 12 | Enrolling Classroom List | Student Classroom | Simple | Display all currently enrolled classrooms. Display: class code, class name, lecturer, subject, semester. Access button navigates to classroom detail. "Moved Out" tab shows previously enrolled but left classrooms. | Iteration 2 | Pending |
| 13 | Student Classroom Detail | Student Classroom | Complex | Tabbed classroom hub page: Overview, Exams, Assignments, Materials, Discussion, Practice tabs. Role-specific views with appropriate permissions. Breadcrumb navigation back to classroom list. | Iteration 2 | Pending |
| 14 | Student - Overview Tab | Student Classroom | Simple | Read-only classroom info display: class name, class code, lecturer name with avatar, subject, semester, description, date range, enrollment status badge. | Iteration 2 | Pending |
| 15 | Student - Exams Tab | Student Classroom | Medium | View available exams for this classroom: exam name, mode badge (PRACTICAL/EXAMINATION), status badge (Upcoming/Open/Completed), start/end time, duration, number of problems, start/continue button for Open exams. Empty state when no exams. | Iteration 3 | Pending |
| 16 | Student - Assignments Tab | Student Classroom | Medium | View and complete class assignments/practice problems. List: assignment name, due date, status (Pending/Submitted/Graded), score display. Submit button navigates to code editor. "Under development" badge on placeholder items. | Iteration 4 | Pending |
| 17 | Student - Materials Tab | Student Classroom | Simple | View and download lecturer-provided materials organized by category. Display: file name, file type icon (PDF/DOCX/PPT), upload date, download count. Material preview or download on click. | Iteration 3 | Pending |
| 18 | Student - Discussion Tab | Student Classroom | Medium | Participate in classroom discussions: view thread list with title, author, reply count, resolved badge. Create new issue, view issue detail with replies, add reply/comment, upvote questions. Filter: All/Unresolved/Resolved. | Iteration 3 | Pending |
| 19 | Student - Practice Tab | Student Classroom | Medium | Self-paced practice exercises without grading. List of practice problems, navigate to code editor, results displayed without affecting scores. "Under development" placeholder. | Iteration 4 | Pending |
| 20 | Exam Taking Page | Student Exercises | Complex | Take a specific exam: view problem list, navigate between problems, countdown timer with HH:MM:SS display, submit all button, problem progress indicator. PRACTICAL mode: submit anytime. EXAMINATION mode: strict session enforcement, confirm before submit, auto-submit on timer expiry. | Iteration 3 | Pending |
| 21 | Code Editor Workspace | Student Coding | Complex | In-browser IDE: Monaco Editor integration, language/version selection dropdown (Python/Java/C/C++/JavaScript), theme toggle (dark/light), split-pane layout with resizable panels, editor settings (font size, tab size, minimap), keyboard shortcuts (Ctrl+S save, Ctrl+/ comment, Ctrl+Shift+F format). Auto-save indicator. | Iteration 2 | Pending |
| 22 | Problem Panel | Student Coding | Medium | Problem description display: statement in Markdown, constraints, input/output specifications, sample test cases (public), difficulty badge (Easy/Medium/Hard), scoring info. Scrollable panel, collapsible sections. | Iteration 2 | Pending |
| 23 | Console Panel | Student Coding | Medium | Test execution output panel: compile status indicator, runtime results with stdout/stderr, per-testcase pass/fail with color coding (green/red), custom input testing area, execution time display, memory usage display. Scrollable output. | Iteration 3 | Pending |
| 24 | Run Code (Custom Testcase) | Code Execution | Complex | Execute code against user-provided custom input in sandbox container (external CodeRunner API). Display stdout/stderr, execution time, memory usage. Timeout handling per language (5s Python/JS, 10s Java, 5s C/C++). Compilation error display. | Iteration 3 | Pending |
| 25 | Run Code (Public Testcases) | Code Execution | Complex | Execute code against problem's public test cases in sandbox. Show per-testcase pass/fail results with diff view (expected vs actual output). Execution time per test case. Stop on first failure option. | Iteration 3 | Pending |
| 26 | Submit Solution | Code Submission | Complex | Submit code for grading: format check, save submission with timestamp, run against all testcases (public + hidden) via CodeRunner API, compute score based on passed/total testcases. Submission versioning (resubmit increments version). Real-time notification on grading complete. | Iteration 3 | Pending |
| 27 | Exercise/Assignment Result | Student Result | Medium | Display submission outcomes: pass/fail summary, score display (obtained/max), per-problem breakdown with points, per-testcase results with diff, error logs for failed cases, compilation error display. Grade notification badge. | Iteration 3 | Pending |
| 28 | Lecturer Home / Dashboard | Lecturer Dashboard | Medium | Lecturer landing page: managed classrooms overview with statistics (total students, upcoming exams), recent submission activity feed, quick action cards (create classroom, create exam, manage problems), pending regrading requests widget. | Iteration 2 | Pending |
| 29 | Own Classroom List | Lecturer Classroom | Medium | Display classes the lecturer owns. Table view: classroom code, name, subject, semester, student count, date range, actions (Details button). Search by name/code, semester filter, sort options. "Create new classroom" button opens modal form. Pagination. | Iteration 2 | Pending |
| 30 | Lecturer Classroom Detail | Lecturer Classroom | Complex | Classroom admin hub: tabbed view with Overview, Dashboard, Slots, Exams, Materials, Discussion, Assignments, Practice, Students tabs. Classroom header with code, name, enrollment key copy button. Breadcrumb navigation. | Iteration 2 | Pending |
| 31 | Lecturer - Overview Tab | Lecturer Classroom | Medium | Class info with edit capabilities: editable fields for name, code, enrollment key, subject, semester, description. Enrollment key generator with validation rules (6-20 chars, special char required). Student count / max slot display. Delete classroom button with confirmation. | Iteration 2 | Pending |
| 32 | Lecturer - Dashboard Tab | Lecturer Classroom | Complex | Classroom analytics dashboard: student performance trends chart, submission statistics, grade distribution chart. Top performers list. Recent activity timeline. "Under development" placeholder with coming soon message. | Iteration 4 | Pending |
| 33 | Lecturer - Slots Tab | Lecturer Classroom | Medium | Manage class session slots: create slot (date, start/end time, room), bulk create slots, update slot details, delete slot. Assign exams to slots. Overlap validation (same room, overlapping times). Calendar view and list view toggle. | Iteration 3 | Pending |
| 34 | Lecturer - Exams Tab | Lecturer Classroom | Complex | CRUD exams: create/edit/delete exam. Set mode (PRACTICAL/EXAMINATION), status (PENDING/ONGOING/COMPLETED/CANCELLED), time window (start/end datetime), programming language selection. Link problems or Exam Templates. Schedule automatic open/close via background jobs. | Iteration 3 | Pending |
| 35 | Exam Detail - Overview | Lecturer Exam | Medium | Exam overview: name, description, mode badge, status badge, time window display, language settings, creation date, assigned slots. Edit button to modify exam settings. Delete exam option. | Iteration 3 | Pending |
| 36 | Exam Detail - Problems | Lecturer Exam | Complex | Manage problems in exam: add from problem bank, reorder problems via drag-and-drop, set per-problem scoring (marks). Link existing problems or create new problems inline. Total marks auto-calculation. Problem preview. | Iteration 3 | Pending |
| 37 | Exam Detail - Submissions | Lecturer Exam | Complex | View all student submissions: filter by student, filter by problem, sort by time/score. Table: student name, problem, version, score, status, submission time. Click row to view submission detail. Bulk grade all button. Export to CSV. | Iteration 3 | Pending |
| 38 | Submission Detail View | Lecturer Exam | Medium | Detailed submission review: student name, problem, language/version, submitted code display (Monaco read-only), execution results per testcase, test case outcomes (pass/fail/error), manual comment input. Regrade button. Score override input. | Iteration 3 | Pending |
| 39 | Lecturer - Materials Tab | Lecturer Materials | Medium | Upload/manage learning materials: file upload to private S3 with drag-and-drop, categorize materials (folder structure), edit description, delete with confirmation. Supported formats: PDF, DOCX, PPT, images. Max file size: 50MB. | Iteration 3 | Pending |
| 40 | Lecturer - Discussion Tab | Lecturer Materials | Medium | View and manage classroom discussions: list of issues with student name, title, reply count, resolved status. Mark issue as resolved. Delete inappropriate posts. Reply to issues. Filter by resolved/unresolved. | Iteration 3 | Pending |
| 41 | Lecturer - Assignments Tab | Lecturer Materials | Medium | Create and manage assignments: assignment name, description (Markdown), due date/time, problem selection from bank. View submission count, grade distribution. Student submission list. "Under development" placeholder. | Iteration 4 | Pending |
| 42 | Lecturer - Practice Tab | Lecturer Materials | Medium | Create and manage practice problems: similar to assignments but without grading/due dates. Self-paced exercises for students. "Under development" placeholder. | Iteration 4 | Pending |
| 43 | Lecturer - Students Tab | Lecturer Classroom | Medium | View enrolled students: table with name, email, enrollment date, status (active/moved out). Add student manually (by email), bulk add, import from Excel/CSV file. Remove student with confirmation. Search and filter. Student count display. | Iteration 2 | Pending |
| 44 | Problem Banks Page | Problem Management | Medium | Paginated list of lecturer's problems: title, difficulty badge (Easy/Medium/Hard), tag chips, test case count, created date, updated date, actions (View/Edit/Delete). Search by title, filter by difficulty. "Add problem" button. Pagination (10 per page). | Iteration 2 | Pending |
| 45 | Problem Create Page | Problem Management | Medium | Create problem form: title input (3-500 chars), content textarea with Markdown support and preview, file name input (e.g., Solution.java), difficulty dropdown (Easy/Medium/Hard), code template editor (key-value: language -> template), tags input (comma-separated). Create and Cancel buttons. Validation. | Iteration 2 | Pending |
| 46 | Problem Detail Page | Problem Management | Medium | Problem detail with tabs: Overview, Test Cases, AI Generate. Overview: display all problem fields. Edit button to modify problem. | Iteration 2 | Pending |
| 47 | Test Cases Tab | Problem Management | Medium | Manage test cases: list with input preview, expected output preview, isPublic toggle, compare mode dropdown (Exact/CaseInsensitive/FloatingPoint/Token/UnorderedToken), tolerance input (for FloatingPoint). Add/Edit/Delete test cases. Drag-and-drop reorder. AI auto-generate test cases button. Import/Export JSON. | Iteration 2 | Pending |
| 48 | AI Generate Test Cases | Problem Management | Medium | Auto-generate test cases using AI based on problem description and sample inputs/outputs. Preview generated test cases before saving. Lecturer reviews and approves. Verification run on generated cases. | Iteration 2 | Pending |
| 49 | Exam Banks Page | Exam Management | Medium | Paginated list of examination templates: exam name, description, number of problems, total marks, status (Active/Deleted), created date, actions (Edit/Delete). "Include deleted" checkbox toggle. "Add Template" button. | Iteration 2 | Pending |
| 50 | Exam Template Create | Exam Management | Medium | Create examination template: template name, description, problem selection from bank with mark input per problem. Total marks auto-calculated. Save as template. | Iteration 2 | Pending |
| 51 | Question Banks Page | Question Management | Medium | Paginated list of question banks: bank name, description, question count, created date. "Add Question Bank" button. Search and filter. "Under development" placeholder. | Iteration 4 | Pending |
| 52 | Quiz Banks Page | Quiz Management | Medium | Paginated list of quiz banks: quiz name, description, question count, time limit, status. "Add Quiz" button. "Under development" placeholder. | Iteration 4 | Pending |
| 53 | Admin Dashboard | Admin Dashboard | Medium | Admin landing page: statistics cards (total classrooms, total subjects, programming languages, total students, total lecturers), quick action cards (manage subjects, manage programming languages, manage classes, manage users), recent activities list. | Iteration 3 | Pending |
| 54 | Admin - Subjects Page | Admin Management | Medium | CRUD subjects: table with subject code, subject name, isDeleted status, actions (Edit/Delete). "Add Subject" button opens modal: subject code (unique), subject name, description. Soft delete with confirmation. | Iteration 3 | Pending |
| 55 | Admin - Programming Languages Page | Admin Management | Medium | CRUD programming languages: table with language name, compiler ID, version, actions (Edit/Delete). "Add Language" button: name, compiler ID, version. Cannot delete language used by exams. | Iteration 3 | Pending |
| 56 | Admin - Classes Page | Admin Management | Simple | Read-only view of all classrooms across all lecturers: table with classroom code, name, lecturer name, subject, semester, student count, end date. Search and filter by lecturer/subject. | Iteration 3 | Pending |
| 57 | Admin - Users Page | Admin Management | Complex | Full user management: paginated table with full name, email, role badge (Student/Lecturer/Admin), status (Enabled/Disabled), last login date, actions. Search by name/email. Role filter dropdown. "Grant Account" button sends invitation email. Enable/Disable user toggle. Pagination. | Iteration 3 | Pending |
| 58 | Notification Bell | Notifications | Simple | Real-time notification bell icon in navbar with unread count badge. Click opens dropdown with notification list: icon, title, message, timestamp. Click notification navigates to relevant page. Mark as read on click. "Mark all as read" button. | Iteration 3 | Pending |
| 59 | Notification List Page | Notifications | Simple | Full notification history page: all notifications sorted by date (newest first). Filter by type (grade result, exam started, discussion reply, etc.). Pagination. Mark individual/all as read. Delete notification. | Iteration 3 | Pending |
| 60 | Notification Real-time (SignalR) | Notifications | Medium | Real-time notifications via SignalR Hub: grade result notification, exam started notification, discussion reply notification, enrollment notification. Toast popup for new notifications while browsing. Badge update without page refresh. | Iteration 3 | Pending |
| 61 | Mobile - Login Page | Mobile App | Medium | Mobile-optimized login screen: email input with validation, password input with show/hide toggle, remember-me toggle, "Sign in with Google" button, "Forgot password?" link, "Do not have an account? Register" link. Loading state on submit. Error message display. | Iteration 3 | Pending |
| 62 | Mobile - Register Page | Mobile App | Medium | Mobile registration form: full name, email, role selection (Student/Lecturer), password, confirm password, terms checkbox. Real-time validation, password strength indicator. "Already have an account? Login" link. Google OAuth option. | Iteration 3 | Pending |
| 63 | Mobile - Forgot Password (Email) | Mobile App | Simple | Enter email to initiate password recovery, send OTP/reset link. Success message, option to try different email. | Iteration 3 | Pending |
| 64 | Mobile - Forgot Password (OTP) | Mobile App | Simple | Enter 6-digit OTP code received via email for verification. Auto-focus next digit, countdown timer for resend. | Iteration 3 | Pending |
| 65 | Mobile - Forgot Password (Reset) | Mobile App | Simple | Enter new password after OTP verification with confirmation field. Password strength indicator. | Iteration 3 | Pending |
| 66 | Mobile - Student Home | Mobile App | Medium | Student mobile dashboard with role-based sidebar navigation. Enrolled classrooms list with cards, upcoming exams widget, notifications access. Bottom navigation bar with Home, Classrooms, Notifications, Profile tabs. | Iteration 4 | Pending |
| 67 | Mobile - Classroom Features | Mobile App | Complex | Mobile classroom experience: join class with enrollment key, view reports (enrolled classes overview), view scores (submission history), participate in discussion (read/create threads, reply). Note: coding exam not available on mobile, show message redirecting to web app. | Iteration 4 | Pending |
| 68 | About Us Page | Static Pages | Simple | Platform information page: about EduACAS mission and vision, team introduction, platform features overview with icons, technology stack, contact information, FPT University branding. | Iteration 1 | Pending |
| 69 | Features Page | Static Pages | Simple | Detailed platform features showcase page with feature categories, descriptions, screenshots/mockups, benefits for students and lecturers. Responsive grid layout. | Iteration 1 | Pending |
| 70 | Contact Page | Static Pages | Simple | Contact information: office address, email, phone number. Contact form for support inquiries (name, email, subject, message). Social media links. | Iteration 1 | Pending |
| 71 | Navigation Bar | Shared UI | Medium | Top navigation bar: logo/brand, menu items (role-based), user avatar dropdown (Profile, Change Password, Logout), dark/light theme toggle button. Responsive design: hamburger menu on mobile. Active route highlighting. | Iteration 1 | Pending |
| 72 | Sidebar | Shared UI | Medium | Collapsible sidebar navigation: role-based menu items with icons (Dashboard, My Classroom, Manage Classroom, Problem Banks, Exam Banks, Admin, etc.). Collapse/expand toggle, active state indicator. Responsive overlay on mobile. | Iteration 1 | Pending |
| 73 | Rich Text Editor | Shared UI | Complex | TipTap-based rich text editor component: formatting toolbar (bold, italic, underline, strikethrough), heading levels, bullet/numbered lists, code blocks with syntax highlighting, link insertion, image upload to S3, table support, Markdown shortcut support. Used in Discussion posts and Problem descriptions. | Iteration 2 | Pending |
| 74 | Dark/Light Theme | Shared UI | Medium | Theme provider with TailwindCSS dark mode support: dark mode and light mode toggle in navbar, persisted user preference in localStorage and backend, CSS variable switching for all components, system preference detection (prefers-color-scheme). Smooth transition animation. | Iteration 1 | Pending |

(*) You can rate the functions' complexity based on the number of fields on the screens or the number of transactions in the function, with the details as below:

| Level | Fields | Transactions |
|-------|--------|--------------|
| simple | <=7 fields | <=3 transactions |
| medium | <=15 fields | <=7 transactions |
| complex | >15 fields | >7 transactions |

In which:
- fields: screen components or database table fields
- transactions: action buttons, user or database transactions

---

# PROJECT ISSUES

| # | Issue | Potential Impact | Priority | Owner | Open Date | Close Date | Status | Notes |
|---|-------|-----------------|----------|-------|-----------|-----------|--------|--------|
| 1 | CodeRunner API integration complexity - external sandbox service requires proper error handling, timeout management, and fallback strategies | High - Affects core code execution feature | High | Team | 01/04/2026 | | Open | Need to decide between CodeRunner self-host vs third-party API. Latency and availability SLA concerns. |
| 2 | Google OAuth token validation security - need to verify ID token signature and audience claims properly | High - Security vulnerability if not handled | High | Team | 01/04/2026 | | Open | Use google-auth-library or equivalent. Verify aud (audience) claim matches our client ID. |
| 3 | SignalR real-time notification reliability - need to handle connection drops, reconnection logic, and offline message queuing | Medium - Poor UX but non-critical | Medium | Team | 01/04/2026 | | Open | Implement Hub connection with automatic reconnection. Consider message persistence for offline users. |
| 4 | Large file uploads to S3 - need chunked upload, progress indicator, and resumable uploads for large materials | Medium - Affects lecturer experience | Medium | Team | 01/04/2026 | | Open | Use AWS S3 multipart upload. Set 50MB per-file limit. Show progress bar during upload. |
| 5 | Exam timer synchronization between frontend and backend - prevent cheating via clock manipulation | High - Academic integrity risk | High | Team | 01/04/2026 | | Open | Use server-side time for exam deadlines. Client timer is display only. Periodic sync with server. |
| 6 | Concurrent submission handling during exam - queue-based processing with RabbitMQ | High - Affects grading accuracy | High | Team | 01/04/2026 | | Open | Use RabbitMQ message queue for submission processing. Show 'pending' status until graded. |
| 7 | Multi-version compiler support in sandbox - different versions per language (Python 3.8, 3.9, 3.10, etc.) | Medium - Feature completeness | Medium | Team | 01/04/2026 | | Open | External CodeRunner API supports multiple versions. Map language+version to compiler ID. |
| 8 | Mobile app coding feature gap - coding exams cannot be taken on mobile, need clear user messaging | Medium - UX issue for mobile users | Medium | Team | 01/04/2026 | | Open | Show informative message on mobile: "Please use web browser for coding exams." Implement mobile-optimized score viewing and discussion. |
| 9 | AI-generated test case validation - need lecturer review and approval workflow before using generated cases | Medium - Quality assurance | Medium | Team | 01/04/2026 | | Open | Generated test cases shown in preview mode. Lecturer must explicitly approve. System provides run verification before approval. |
| 10 | Regrading request approval workflow - need status tracking from student request to lecturer review to re-run | Medium - Process clarity | Medium | Team | 01/04/2026 | | Open | Student submits regrading request with reason. Lecturer reviews and approves/rejects. System re-runs code. Status updates via notifications. |
| 11 | Academic integrity logs presentation - how to present tab switches, typing patterns, time spent to lecturers without being overwhelming | Medium - Lecturer UX | Medium | Team | 01/04/2026 | | Open | Dashboard per exam showing suspicious flags. Flagging threshold TBD based on testing. Detailed log view on demand. |
| 12 | Database backup and recovery strategy for DynamoDB - point-in-time recovery and S3 long-term backup | Low - DevOps concern | Low | Team | 01/04/2026 | | Open | Enable DynamoDB point-in-time recovery. Daily exports to S3 for long-term backup. |
| 13 | Staging and production deployment strategy - Docker Compose for local/staging, AWS ECS for production | Medium - DevOps concern | Medium | Team | 01/04/2026 | | Open | Docker Compose for local/staging. GitHub Actions CI/CD pipeline. AWS ECS or similar for production. |
| 14 | Test environment instability - need reliable dev/staging environments for QA testing | Medium - QA productivity | Medium | Team | 01/04/2026 | | Open | Set up local Docker environment as backup. Document environment setup steps. |
| 15 | Password strength policy - decide minimum requirements (length, complexity, special chars) | Low - Security policy | Low | Team | 01/04/2026 | | Open | Minimum 8 characters. Consider requiring mixed case, numbers. Display strength indicator on frontend. |
| 16 | OTP email delivery reliability - SMTP configuration and retry logic for email sending failures | Medium - UX concern | Medium | Team | 01/04/2026 | | Open | Configure SMTP with retry logic (3 attempts). Log email failures. Consider email service provider (SendGrid/AWS SES) for production. |
| 17 | Browser compatibility - ensure Monaco Editor works across Chrome, Firefox, Safari, Edge | Low - QA concern | Low | Team | 01/04/2026 | | Open | Test code editor in all target browsers. Monaco Editor has good cross-browser support but verify keyboard shortcuts. |
| 18 | JWT token refresh strategy - handle token expiration during long exam sessions | Medium - UX concern | Medium | Team | 01/04/2026 | | Open | Implement silent token refresh via refresh token rotation. Exam sessions should have extended token lifetime or session extension mechanism. |
| 19 | WebSocket connection limits - SignalR default limits and connection pooling for high concurrency exams | Medium - Scalability | Medium | Team | 01/04/2026 | | Open | Monitor WebSocket connections during concurrent exams. Consider connection pooling and load balancing for SignalR. |
| 20 | Rate limiting on API endpoints - prevent abuse of submission, login, and password reset endpoints | Medium - Security | Medium | Team | 01/04/2026 | | Open | Implement rate limiting: login (5 attempts/min), submission (10/min), password reset (3/min). Return 429 Too Many Requests with Retry-After header. |

---

# PROJECT DEFECTS

| Feature | Function/Screen | Tester | Defect Description | Assign To | Status | Notes |
|---------|---------------|--------|-------------------|-----------|--------|--------|
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |
| | | | | | Pending | |

---

# PROJECT Q&A

| Date | Question | By | Priority | Status | Note (answer, other notes) |
|------|----------|----|----------|--------|---------------------------|
| | Which programming languages should be supported at launch? | Team | High | Open | C/C++, Java, Python, JavaScript as per proposal. Each with multiple version support. |
| | How should the sandbox timeout limits be configured per language? | Team | High | Open | Proposed: 5s for Python/JS, 10s for Java (JVM startup), 5s for C/C++. TBD based on benchmarks. |
| | What is the maximum file size for material uploads? | Team | Medium | Open | Proposed: 50MB per file. Large files (videos) may need external hosting. |
| | How should AI-generated test cases be validated before use? | Team | Medium | Open | Lecturer must review and approve. System provides preview with run verification. |
| | What metrics should the admin analytics dashboard display? | Team | Medium | Open | Active users, total submissions, class usage, language popularity, submission trends. |
| | How should the mobile app handle features not available on mobile (coding exam)? | Team | Medium | Open | Show message redirecting to web app for coding exam. Mobile supports: discussion, scores, class join. |
| | What is the regrading request approval workflow? | Team | Medium | Open | Student requests -> Lecturer reviews -> Re-run code -> Update score. Need status tracking. |
| | How to handle concurrent submissions during exam? | Team | High | Open | Queue-based processing with RabbitMQ. Show 'pending' status until graded. |
| | Should the system support real-time collaboration or only async discussion? | Team | Low | Open | Async discussion only per proposal. Real-time chat is out of scope for initial release. |
| | How are academic integrity logs presented to lecturers? | Team | Medium | Open | Dashboard per exam showing tab switches, typing patterns, time spent. Flagging threshold TBD. |
| | What deployment strategy for staging and production? | Team | Medium | Open | Docker Compose for local/staging. AWS ECS or similar for production. CI/CD via GitHub Actions. |
| | How to handle multi-version compiler support in sandbox? | Team | Medium | Open | External CodeRunner API supports multiple versions. Map language+version to compiler ID. |
| | What is the backup and data recovery strategy for DynamoDB? | Team | Medium | Open | Enable DynamoDB point-in-time recovery. Daily exports to S3 for long-term backup. |
| | What is the JWT token expiration time for exam sessions? | Team | Medium | Open | Standard tokens: 1 hour. Exam sessions may need extended duration (up to 4 hours). Implement silent refresh. |
| | Should OTP verification be required for registration or optional? | Team | Medium | Open | Proposal: optional for registration, required before first exam. Students can register and browse but need email verified to take exams. |
| | What plagiarism detection algorithm to use for code similarity? | Team | Medium | Open | Proposal: AST-based similarity comparison (JPlag or custom). Threshold TBD (e.g., >70% similarity flagged). |
| | How to handle exam auto-submit when browser is closed accidentally? | Team | Medium | Open | Save submission state to server periodically (every 30s). Browser close triggers submission of last saved state. Show confirmation before close. |
| | What is the maximum number of concurrent users expected during peak exam hours? | Team | Medium | Open | Estimate: 500 concurrent students during mid-term/final exam period. Plan for horizontal scaling of API Gateway and AcasService. |
| | Should anonymous/guest access be supported for browsing public content? | Team | Low | Open | Landing page, About Us, Features, Contact pages are public. Login required for classroom/exam features. |
| | How to handle plagiarism detection between submissions in different programming languages? | Team | Low | Open | AST normalization before comparison. Code structure analysis rather than text comparison. |
