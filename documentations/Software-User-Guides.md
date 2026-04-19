# Capstone Project Report

## Report 6 - Software User Guides

### EduACAS - Online Examination & Learning Management System

---

**Project:** EduACAS
**Project Code:** EDU-ACAS-2026
**Version:** 1.0
**Date:** April 17, 2026
**Status:** In Development

---

# Table of Contents

1. [Record of Changes](#1-record-of-changes)
2. [Release Package & User Guides](#2-release-package--user-guides)
   1. [Deliverable Package](#21-deliverable-package)
   2. [Installation Guides](#22-installation-guides)
      - [System Requirements](#221-system-requirements)
      - [Installation Instruction](#222-installation-instruction)
   3. [User Manual](#23-user-manual)
      - [3.1 Overview](#231-overview)
      - [3.2 Workflow 1: Authentication](#232-workflow-1-authentication)
      - [3.3 Workflow 2: Student Classroom & Exam](#233-workflow-2-student-classroom--exam)
      - [3.4 Workflow 3: Lecturer - Classroom Management](#234-workflow-3-lecturer---classroom-management)
      - [3.5 Workflow 4: Lecturer - Problem & Exam Management](#235-workflow-4-lecturer---problem--exam-management)
      - [3.6 Workflow 5: Admin Dashboard](#236-workflow-5-admin-dashboard)
      - [3.7 Workflow 6: Code Editor & Submission](#237-workflow-6-code-editor--submission)

---

# 1. Record of Changes

| Date | A / M / D | In Charge | Change Description |
|------|-----------|-----------|-------------------|
| 17/04/2026 | A | Development Team | Initial document creation |
| | | | |
| | | | |
| | | | |
| | | | |

*A - Added | M - Modified | D - Deleted*

---

# 2. Release Package & User Guides

## 2.1 Deliverable Package

| No. | Deliverable Item | Description | Version |
|-----|-----------------|-------------|---------|
| 1 | Source Codes | Full project source code (Backend, Frontend, Mobile) | 1.0 |
| 2 | Database Scripts | SQL migration scripts, seed data | 1.0 |
| 3 | Configuration Files | Environment configs, API documentation | 1.0 |
| 4 | Test Documentation | Test Cases, Unit Test Requirements | 1.0 |
| 5 | Test Schedule | Testing timeline and milestones | 1.0 |
| 6 | Software User Guides | This document | 1.0 |
| 7 | Project Reports | All capstone project reports | 1.0 |

---

## 2.2 Installation Guides

### 2.2.1 System Requirements

#### Backend Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows Server 2019 / Ubuntu 20.04 LTS | Windows Server 2022 / Ubuntu 22.04 LTS |
| **.NET SDK** | .NET 9 SDK | .NET 9 SDK (latest) |
| **Runtime** | .NET 9.0 Runtime | .NET 9.0 Runtime |
| **Database** | SQL Server 2019 / PostgreSQL 14 | SQL Server 2022 / PostgreSQL 16 |
| **Memory (RAM)** | 4 GB | 8 GB |
| **Storage** | 20 GB | 50 GB |
| **Redis** | Redis 6.0 | Redis 7.0 |

#### Frontend Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | Node.js 18.x LTS | Node.js 20.x LTS |
| **Package Manager** | npm 9.x | npm 10.x |
| **Browser** | Chrome 100+, Firefox 100+, Safari 15+, Edge 100+ | Chrome latest |
| **Memory (RAM)** | 4 GB | 8 GB |
| **Resolution** | 1280 x 720 | 1920 x 1080 |

#### Mobile App Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Android 8.0 (API 26) | Android 13 (API 33) |
| **iOS** | iOS 13 | iOS 17 |
| **Flutter SDK** | Flutter 3.x | Flutter 3.19+ |
| **Dart** | Dart 3.x | Dart 3.3+ |
| **Memory (RAM)** | 3 GB | 4 GB |

### 2.2.2 Installation Instruction

#### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/eduacas.git
cd eduacas
```

#### Step 2: Backend Setup (.NET 9)

```bash
# Navigate to server directory
cd servers

# Restore dependencies
dotnet restore

# Update database connection string in appsettings.json
# Navigate to each service and update connection strings:
# - Services/AcasService/appsettings.json
# - Services/AuthService/appsettings.json

# Run database migrations
cd Services/AcasService
dotnet ef database update

cd Services/AuthService
dotnet ef database update

# Run the services
cd Services/AcasService
dotnet run --urls="http://localhost:5001"

# In another terminal
cd Services/AuthService
dotnet run --urls="http://localhost:5002"

# Run the API Gateway
cd ApiGateway
dotnet run --urls="http://localhost:5000"
```

#### Step 3: Frontend Setup (Next.js)

```bash
# Navigate to web_app directory
cd web_app

# Install dependencies
npm install

# Configure environment variables
# Create .env.local file with:
# NEXT_PUBLIC_API_URL=http://localhost:5000
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Run the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

#### Step 4: Mobile App Setup (Flutter)

```bash
# Navigate to mobile_app directory
cd mobile_app

# Get dependencies
flutter pub get

# Run on device/emulator
flutter run

# Build APK for Android
flutter build apk --release

# Build for iOS
flutter build ios --release
```

#### Step 5: Configure API Gateway

Update the `appsettings.json` in ApiGateway:

```json
{
  "ReverseProxy": {
    "Routes": {
      "acas": "http://localhost:5001",
      "auth": "http://localhost:5002"
    }
  }
}
```

---

## 2.3 User Manual

### 2.3.1 Overview

EduACAS is a comprehensive online examination and learning management system designed for educational institutions. The system supports three primary user roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | System administrator | Full system access - manage users, subjects, classrooms, programming languages |
| **Lecturer** | Instructor / Teacher | Classroom management, problem creation, exam management, grading |
| **Student** | Learner | Enroll in classrooms, take exams, submit code, view results |

#### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────┬─────────────┬─────────────┬─────────────┬──────┤
│   Web App   │   Mobile    │   Web App   │   Web App   │      │
│   (Student) │   (Flutter) │  (Lecturer)│   (Admin)   │      │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────┘
       │              │             │             │
       └──────────────┴──────┬──────┴─────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │   (YARP)       │
                    │  Port: 5000    │
                    └────────┬────────┘
                             │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │  AcasService │  │ AuthService │  │   Redis     │
   │  Port: 5001 │  │  Port: 5002 │  │  Cache      │
   └──────┬──────┘  └──────┬──────┘  └─────────────┘
          │                 │
          └────────┬────────┘
                   │
          ┌──────▼──────┐
          │  Database    │
          │ (SQL Server) │
          └──────────────┘
```

#### Main Features

| Module | Features |
|--------|----------|
| **Authentication** | Login, Register, Google OAuth, Forgot Password, Reset Password, Email Verification |
| **Profile Management** | View/Edit profile, Upload avatar, Change password |
| **Classroom** | Create/Edit/Delete classroom, Enroll students, Enrollment key management |
| **Problem Management** | Create/Edit/Delete problems, Difficulty levels (Easy/Medium/Hard), Code templates |
| **Test Case Management** | Public/Hidden test cases, Multiple compare modes, Auto-generate test cases |
| **Examination** | Create/Edit/Delete exams, Exam templates, PRACTICAL and EXAMINATION modes |
| **Code Editor** | Monaco Editor, Syntax highlighting, Auto-save, Multiple languages |
| **Submission & Grading** | Auto-grading, Regrading, Score override, Real-time notifications |
| **Plagiarism Detection** | Code similarity comparison, Side-by-side diff view |
| **Quiz** | Multiple-choice questions, Auto-grading, Time limits |
| **Discussion** | Q&A forum per classroom, Reply threads, Mark as resolved |
| **Materials** | Upload/Download documents (PDF, DOCX, PPT) |
| **Notifications** | Real-time notifications via SignalR |
| **Exam Proctoring** | Keystroke logging, Tab switch detection, Copy-paste detection |
| **Admin Dashboard** | Manage subjects, programming languages, classrooms, users |

#### Navigation Overview

| Role | Main Pages |
|------|-----------|
| **All Users** | Home, Login, Register, Forgot Password, Profile |
| **Student** | My Classes, Take Exam, Code Editor, Notifications |
| **Lecturer** | Manage Classroom, Problem Banks, Exam Banks, Quiz Banks, Submissions |
| **Admin** | Admin Dashboard, Manage Subjects, Manage Programming Languages, Manage Classes, User Management |

---

### 2.3.2 Workflow 1: Authentication

#### Purpose

This workflow covers all authentication-related operations: login, registration, password recovery, and account verification.

#### Workflow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Landing     │────▶│    Login     │────▶│   Dashboard  │
│    Page       │     │    Page      │     │   (Role-     │
└──────────────┘     └──────┬───────┘     │   based)      │
       │                    │              └──────────────┘
       │                    │
       │            ┌──────▼───────┐
       │            │  Google OAuth │
       │            │   (Option)   │
       │            └──────┬───────┘
       │                   │
       ▼                   ▼
┌──────────────┐  ┌──────────────┐
│   Register   │  │  Forgot      │
│    Page      │  │  Password    │
└──────┬───────┘  └──────┬───────┘
       │                   │
       │            ┌──────▼───────┐
       │            │   Email      │
       │            │   Sent       │
       │            └──────┬───────┘
       │                   │
       ▼            ┌──────▼───────┐
┌──────────────┐     │  Reset       │
│  Register   │     │  Password    │
│  Success     │     │  Page        │
└──────────────┘     └──────────────┘
```

---

#### Step-by-Step Guide

---

##### 1. Login

**Path:** Navigate to `http://localhost:3000/login`

**Steps:**

1. On the landing page, click the **"Login"** button in the top-right corner.
2. You will be redirected to the Login page (`/login`).
3. Enter your **Email Address** in the email field.
   - Example: `student@eduacas.edu.vn`
4. Enter your **Password** in the password field.
5. *(Optional)* Check the **"Remember me"** checkbox to stay logged in longer.
6. Click the **"Login"** button.
7. If credentials are correct, you will be redirected to the Dashboard based on your role:
   - Admin -> Admin Dashboard (`/admin`)
   - Lecturer -> Lecturer Dashboard (`/manage-classroom`)
   - Student -> Student Dashboard (`/my-classroom`)
8. If credentials are invalid, an error message will be displayed: **"Invalid email or password"**.

**Interface Elements:**

- Email input field with placeholder: `example@edu-acas.com`
- Password input field (hidden by default)
- "Remember me" checkbox
- "Forgot password?" link
- "Login" button
- "Register now" link for new users
- "Sign in with Google" button (Google OAuth option)
- Dark/Light theme toggle

---

##### 2. Login with Google OAuth

**Path:** `http://localhost:3000/login` -> Click **"Sign in with Google"**

**Steps:**

1. On the Login page, click the **"Sign in with Google"** button.
2. A Google account selection popup will appear.
3. Select your Google account or sign in to Google.
4. After successful authentication, you will be redirected to the Dashboard.
5. If this is your first login with Google, a new account will be automatically created.

**Notes:**

- Your Google email will be used as your account email.
- Your Google display name will be used as your full name.
- You can later set a password and update your profile.

---

##### 3. Register New Account

**Path:** Navigate to `http://localhost:3000/register`

**Steps:**

1. On the Login page, click the **"Register now"** link at the bottom.
2. You will be redirected to the Registration page (`/register`).
3. Fill in all required fields:
   - **Full Name**: Enter your full name (e.g., "Nguyen Van A")
   - **Email**: Enter a valid email address
   - **Role**: Select your role from the dropdown:
     - **Student** (Sinh viên)
     - **Lecturer** (Giảng viên)
   - **Password**: Enter a password (minimum 8 characters)
   - **Confirm Password**: Re-enter your password
4. Check the checkbox to agree to the **Terms of Service** and **Privacy Policy**.
5. Click the **"Register"** button.
6. Upon success, you will see a confirmation and may be redirected to email verification or login.

**Validation Rules:**

- Full Name: Required, non-empty
- Email: Required, valid email format, must be unique in the system
- Role: Required, must select one
- Password: Minimum 8 characters
- Confirm Password: Must match the password field
- Terms: Must be checked to proceed

**Interface Elements:**

- Full name input field
- Email input field
- Role dropdown (Student / Lecturer)
- Password input field with visibility toggle
- Confirm password input field
- Terms & Privacy checkbox
- "Register" button
- "Sign in with Google" button (optional registration)
- Link back to Login page

---

##### 4. Forgot Password

**Path:** `http://localhost:3000/forgot-password`

**Steps:**

1. On the Login page, click the **"Forgot password?"** link.
2. You will be redirected to the Forgot Password page.
3. Enter your **registered email address**.
4. Click the **"Send password reset request"** button.
5. A success message will appear: **"Check your email"**.
6. Check your email inbox for a password reset link.
7. If the email is found in the system, you will receive instructions to reset your password.
8. Click the **"Try again with another email"** button to request for a different email.

**Notes:**

- For security reasons, the system does not reveal whether an email exists or not.
- If your email is registered, you will receive the reset link.
- Check your spam/junk folder if you don't see the email.

---

##### 5. Reset Password via Email Link

**Path:** Link received in email (format: `/forgot-password/reset?token=xxx&email=xxx`)

**Steps:**

1. Click the password reset link in your email.
2. You will be redirected to the Reset Password page with your email pre-filled.
3. Enter your **New Password** (minimum 5 characters).
4. Re-enter your **Confirm Password**.
5. Click the **"Reset Password"** button.
6. Upon success, you will see a confirmation and will be redirected to the Login page.
7. Log in with your new password.

**Notes:**

- The reset link is valid for a limited time (typically 1 hour).
- Each reset link can only be used once.
- After successful reset, the link becomes invalid.

---

##### 6. First Login Password Reset (For Granted Accounts)

**Path:** `http://localhost:3000/first-login`

**Steps:**

1. If your account was created by an admin, you may need to set your password on first login.
2. Enter your **Current Password** (provided by admin).
3. Enter your **New Password** (minimum 8 characters).
4. Re-enter your **Confirm New Password**.
5. Click the **"Reset Password"** button.
6. You will be redirected to the Dashboard.

**Notes:**

- This page is only accessible for first-time login.
- After setting the password, you will not be prompted again.

---

##### 7. Change Password (Logged-in User)

**Path:** `http://localhost:3000/profile`

**Steps:**

1. Log in to the system.
2. Navigate to your **Profile** page (`/profile`).
3. Look for the **"Change Password"** section (if available on your version).
4. Enter your **Current Password**.
5. Enter your **New Password** (minimum 8 characters).
6. Re-enter your **Confirm New Password**.
7. Click the **"Change Password"** button.
8. Upon success, you will see a confirmation message.

---

### 2.3.3 Workflow 2: Student Classroom & Exam

#### Purpose

This workflow covers how students enroll in classrooms and take programming exams using the code editor.

#### Workflow Diagram

```
┌──────────────┐
│  Dashboard   │
│  (Student)  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│               My Classes Page                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │    All     │  │  Joining  │  │ Moved Out  │   │
│  └─────┬──────┘  └────────────┘  └────────────┘   │
│        │                                         │
│  ┌────▼────┐                                    │
│  │ Join    │                                    │
│  │ Class   │                                    │
│  └────┬────┘                                    │
│       │ (Requires enrollment key)                │
│       ▼                                          │
│  ┌────────────┐     ┌────────────┐             │
│  │ Classroom  │────▶│  Exams     │             │
│  │  Detail    │     │   Tab      │             │
│  └────────────┘     └─────┬──────┘             │
│                           │                     │
│                    ┌─────▼─────┐             │
│                    │  Start    │             │
│                    │  Exam     │             │
│                    └─────┬─────┘             │
│                          │                     │
│                          ▼                     │
│              ┌───────────────────────┐       │
│              │    Code Editor        │       │
│              │  ┌─────┐ ┌────────┐ │       │
│              │  │Problem│ │  Code   │ │       │
│              │  │ Panel │ │ Editor  │ │       │
│              │  └─────┘ │        │ │       │
│              │           │ ┌──────┐│ │       │
│              │           │ │Console││ │       │
│              │           │ └──────┘│ │       │
│              │           └──────────┘ │       │
│              │  [Run] [Submit] [Save]│       │
│              └───────────┬────────────┘       │
│                          │                     │
│                    ┌─────▼─────┐             │
│                    │  Submit   │             │
│                    │  (Auto    │             │
│                    │  Timer)   │             │
│                    └───────────┘             │
└──────────────────────────────────────────────────┘
```

---

#### Step-by-Step Guide

---

##### 1. View My Classes

**Path:** `http://localhost:3000/my-classroom`

**Steps:**

1. Log in as a **Student**.
2. Click on **"My Classes"** in the navigation menu or go to `/my-classroom`.
3. The page displays three tabs:
   - **All**: Shows all available classrooms (for enrollment)
   - **Joining**: Shows classrooms you are currently enrolled in
   - **Moved Out**: Shows classrooms you have left
4. Use the **Search** bar to filter by class name or class code.
5. Use the **Semester** dropdown to filter by semester.
6. Use the **Sort** dropdown to sort by Newest, Oldest, Name (A-Z), or Name (Z-A).
7. Each classroom card displays:
   - Class code badge
   - Class name
   - Lecturer name
   - Subject name
   - Semester
   - Date range (start - end)

**Interface Elements:**

- Tab navigation (All / Joining / Moved Out)
- Search input field
- Semester dropdown filter
- Sort dropdown (Newest / Oldest / A-Z / Z-A)
- Classroom cards with "Access", "Join class", or "Moved Out" button
- Empty state message when no classes are found

---

##### 2. Join a Class

**Path:** `http://localhost:3000/my-classroom` -> Click **"Join class"** on a classroom card

**Steps:**

1. On the **"All"** tab of My Classes, find the classroom you want to join.
2. Click the **"Join class"** button on the classroom card.
3. A modal dialog will appear titled **"Join class: [Class Name]"**.
4. Enter the **Enrollment Key** provided by your lecturer.
5. Click the **"Join class"** button.
6. Upon success, the modal will close and you will see the classroom under the **"Joining"** tab.
7. The classroom card button will change to **"Access"**.

**Validation:**

- Enrollment key is required (cannot be empty)
- Incorrect key will show error: **"Failed to join class. Check the enrollment key and try again."**
- Already enrolled: The button will show **"Access"** instead of **"Join class"**

**Interface Elements:**

- Modal dialog with classroom name header
- Enrollment key input field
- Cancel and Join class buttons
- Error message display area

---

##### 3. Access Classroom Detail

**Path:** `http://localhost:3000/my-classroom` -> Click **"Access"** on a classroom card

**Steps:**

1. On the **"Joining"** tab, click the **"Access"** button on a classroom.
2. You will be redirected to the classroom detail page (`/my-classroom/[id]`).
3. The page displays multiple tabs:
   - **Overview**: Classroom summary, lecturer info
   - **Exams**: Available exams for this classroom
   - **Assignments**: Assignments / Practise problems
   - **Materials**: Learning materials (PDF, DOCX, etc.)
   - **Discussions**: Q&A forum for the classroom

**Interface Elements:**

- Classroom name and code header
- Lecturer information card
- Tab navigation bar
- Action buttons based on tab content

---

##### 4. View Available Exams

**Path:** `http://localhost:3000/my-classroom/[id]` -> **"Exams"** tab

**Steps:**

1. Inside a classroom, click the **"Exams"** tab.
2. You will see a list of exams assigned to this classroom.
3. Each exam item displays:
   - Exam name
   - Start time and end time
   - Duration
   - Number of problems
   - Status (e.g., "Upcoming", "Open", "Completed")
4. Exams may have the following statuses:
   - **Upcoming**: Exam has not started yet
   - **Open**: Exam is currently available to take
   - **Completed**: Exam has ended

**Interface Elements:**

- Exam list with cards or table rows
- Status badge (color-coded)
- Time information
- Start/Continue button for Open exams

---

##### 5. Take an Exam (Start Exam Session)

**Path:** Exam list -> Click **"Start"** or **"Continue"** on an Open exam

**Steps:**

1. On the Exams tab, find an exam with status **"Open"**.
2. Click the **"Start"** button to begin the exam.
3. *(For EXAMINATION mode only)* A confirmation dialog may appear:
   - "Are you sure you want to start? Once started, you cannot leave until you submit."
4. Click **"Start"** or **"Confirm"** to proceed.
5. The exam timer will start counting down.
6. You will be redirected to the Code Editor page.

**Exam Timer:**

- A countdown timer is displayed at the top of the Code Editor.
- The timer shows the remaining time in HH:MM:SS format.
- At **5 minutes remaining**, a warning notification will appear.
- At **1 minute remaining**, a critical warning will appear.
- When the timer reaches **0**, the exam will be **automatically submitted**.

**Interface Elements:**

- Timer display (top bar)
- Warning modal for EXAMINATION mode
- Auto-submit confirmation

---

##### 6. Solve Problems in Code Editor

**Path:** Exam Code Editor (`/code-editor/[problemId]`)

**Steps:**

1. You are now in the Code Editor workspace.
2. The interface is divided into three main panels:

   **Left Panel - Problem Description:**
   - Problem title and difficulty badge (Easy/Medium/Hard)
   - Problem description (supports Markdown formatting)
   - Input/Output specifications
   - Sample test cases (for reference)

   **Center Panel - Code Editor:**
   - Monaco Editor with syntax highlighting
   - Language selector dropdown (Python, Java, C++, JavaScript, etc.)
   - Code template (pre-filled starter code)
   - Auto-save indicator
   - Format code button (auto-indent/format)

   **Bottom Panel - Console:**
   - Output display area
   - Test results (Passed/Failed for each test case)

3. Write your code solution in the center panel.
4. Click the **"Run"** button to test your code with sample test cases.
5. The console will display the output and show which test cases passed/failed.
6. You can also click the **"Submit"** button to submit your solution for grading.
7. Use the **"Reset"** button to reset code back to the template (with confirmation).

**Interface Elements:**

- Problem panel (left, resizable)
- Monaco Code Editor (center, resizable)
- Console panel (bottom, resizable)
- Language selector dropdown
- "Run" button (test with sample cases)
- "Submit" button (submit for grading)
- "Reset" button (reset to template)
- "Fullscreen" toggle
- Font size adjustment
- Timer countdown bar
- Problem navigation (if multiple problems)

---

##### 7. Submit Exam

**Path:** Code Editor -> Click **"Submit"** button

**Steps:**

1. When you have completed all problems (or are ready to submit):
   - Click the **"Submit Exam"** button in the top-right or action bar.
2. A confirmation dialog will appear:
   - "Are you sure you want to submit? You cannot change your answers after submission."
3. Click **"Submit"** to confirm.
4. The exam will be submitted and you will be redirected to the exam results page.
5. Your submission will be automatically graded using hidden test cases.
6. You will receive a notification (real-time) when grading is complete.

**Notes:**

- In **PRACTICAL** mode, you can submit individual problems and continue.
- In **EXAMINATION** mode, once you submit, you cannot modify your answers.
- The timer will stop when you submit.
- If the timer reaches zero, the exam is automatically submitted.

**Interface Elements:**

- "Submit Exam" button (prominent, often in red or primary color)
- Confirmation dialog with warning text
- Submission progress indicator
- Post-submission results page

---

##### 8. View Exam Results

**Path:** After submitting -> Results page or Exam list

**Steps:**

1. After submitting an exam, you will see your results.
2. The results page displays:
   - Final score
   - Grading status (Graded / Pending / Error)
   - Per-problem breakdown:
     - Problem name
     - Score obtained / Max score
     - Number of test cases passed
     - Time taken to grade
3. Click on a specific problem to view:
   - Submitted code
   - Test case results (public test cases only)
   - Compilation/runtime errors (if any)

**Interface Elements:**

- Score summary card
- Problem-by-problem result table
- Detail view for each problem
- "View Code" and "View Results" buttons

---

### 2.3.4 Workflow 3: Lecturer - Classroom Management

#### Purpose

This workflow covers how lecturers create and manage classrooms, enroll students, and organize classroom content.

#### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Lecturer Dashboard                               │
│               Manage Classroom (`/manage-classroom`)              │
└─────────────────────────────────────────────────────────────────────┘
                              │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Create New      │ │  Classroom      │ │   Classroom     │
│ Classroom       │ │  List View     │ │   Detail Page   │
│ (Modal Form)   │ │  (Search/     │ │   (Tabs)        │
│                 │ │   Filter)      │ │                 │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │                   │           ┌───────┴───────┐
         │                   │           │             │
         ▼                   ▼           ▼             ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────────┐
│ Form Fields:   │ │ List Items:    │ │  ┌──────────────────────────┐   │
│ - Class Code   │ │ - Class Code   │ │  │ Overview | Exams |      │   │
│ - Class Name   │ │ - Class Name   │ │  │ Students | Discussion | │   │
│ - Subject      │ │ - Subject      │ │  │ Materials | Quiz |     │   │
│ - Semester     │ │ - Semester     │ │  │ Slot | Assignment |    │   │
│ - Max Slot     │ │ - Date Range  │ │  │ Dashboard              │   │
│ - Enrol Key    │ │ - [Details]   │ │  └──────────────────────────┘   │
│ - End Date     │ │               │ │                                 │
└─────────────────┘ └───────────────┘ └─────────────────────────────────┘
```

---

#### Step-by-Step Guide

---

##### 1. View Manage Classroom Page

**Path:** `http://localhost:3000/manage-classroom`

**Steps:**

1. Log in as a **Lecturer**.
2. Click on **"Manage Classroom"** in the navigation menu or go to `/manage-classroom`.
3. You will see a list of classrooms you own/manage.
4. Use the **Search** bar to filter by class name or class code.
5. Use the **Semester** dropdown to filter by semester.
6. Use the **Sort** dropdown to sort results.
7. Click the **"Details"** button on any classroom card to view the detail page.

**Interface Elements:**

- Page header: "Classroom Management"
- Subtitle: "List of classrooms you are responsible for"
- "Create new classroom" button
- Search input field
- Semester dropdown filter
- Sort dropdown
- Classroom list table with columns:
  - Classroom code (badge)
  - Classroom name
  - Subject
  - Semester
  - Time (created - end date)
  - Action (Details button)

---

##### 2. Create a New Classroom

**Path:** `http://localhost:3000/manage-classroom` -> Click **"+ Create new classroom"**

**Steps:**

1. Click the **"+ Create new classroom"** button in the top-right corner.
2. A modal dialog titled **"Create new classroom"** will appear.
3. Fill in all required fields:

   **Classroom Code** *(Required)*
   - Enter a unique code for the classroom
   - Example: `SE1801`
   - Must be unique in the system

   **Classroom Name** *(Required)*
   - Enter the full name of the classroom
   - Example: `Software Engineering - Class A`
   - Maximum 100 characters

   **Subject** *(Required)*
   - Select a subject from the dropdown
   - Subjects are managed by Admin

   **Semester** *(Required)*
   - Select a semester from the dropdown
   - Options: Spring/Summer/Fall [Year]
   - Example: `Spring 2026`

   **Max Slot** *(Required)*
   - Enter the maximum number of students
   - Must be at least 2

   **Enrol Key** *(Optional)*
   - Enter an enrollment key for students to join
   - Rules: 6-20 characters, must contain at least one special character, no spaces
   - If left empty, a key will be auto-generated
   - Share this key with your students

   **End Date** *(Required)*
   - Select the end date for the classroom
   - Must be a future date

4. Click the **"Create classroom"** button.
5. Upon success, the modal will close and the new classroom will appear in the list.
6. A success toast message will appear: **"Tạo lớp học thành công!"**

**Validation:**

- Class code: Required, unique
- Class name: Required, max 100 characters
- Subject: Required, from available subjects
- Semester: Required, from available options
- Max slot: Required, minimum 2
- Enrol key: Optional, 6-20 chars, special char required, no spaces
- End date: Required, must be a future date

**Interface Elements:**

- Modal dialog with form fields
- Subject dropdown (populated from database)
- Semester dropdown (auto-generated)
- Max slot number input
- Enrol key password input with rules tooltip
- End date picker
- Cancel and Create classroom buttons

---

##### 3. View Classroom Detail

**Path:** Classroom list -> Click **"Details"** button

**Steps:**

1. Click the **"Details"** button on any classroom in the list.
2. You will be redirected to the classroom detail page (`/manage-classroom/[id]`).
3. The page has multiple tabs:

   **Overview Tab:**
   - Classroom summary (code, name, subject, semester)
   - Enrolment key (with copy button)
   - Date range
   - Max slot / Current enrollment
   - Quick statistics

   **Exams Tab:**
   - List of exams for this classroom
   - Create exam button
   - Exam templates access

   **Students Tab:**
   - List of enrolled students
   - Add/Remove students
   - Import students from file (Excel/CSV)

   **Discussion Tab:**
   - Q&A forum for the classroom
   - View and respond to student questions

   **Materials Tab:**
   - Upload/Download learning materials
   - PDF, DOCX, PPT support

   **Quiz Tab:**
   - Manage quizzes for the classroom

   **Slot Tab:**
   - Manage exam time slots

   **Assignment Tab:**
   - Manage practice problems (non-exam)

   **Dashboard Tab:**
   - Overview statistics and charts

---

##### 4. Manage Students in Classroom

**Path:** Classroom detail -> **"Students"** tab

**Steps:**

1. Inside the classroom detail page, click the **"Students"** tab.
2. You will see a list of enrolled students with:
   - Student name
   - Email
   - Enrollment date
   - Status (active/moved out)
3. **To add a student manually:**
   - Click the **"Add student"** button.
   - Enter the student's email address.
   - Click **"Add"**.
4. **To remove a student:**
   - Find the student in the list.
   - Click the **"Remove"** or trash icon.
   - Confirm the removal.
5. **To import multiple students:**
   - Click the **"Import"** or **"Import from file"** button.
   - Upload an Excel/CSV file with student emails.
   - Preview and confirm the import.
6. **To search for a student:**
   - Use the search bar to filter by name or email.

**Notes:**

- You cannot remove a student who is currently in an active exam session.
- Students can also self-enroll using the enrollment key from the Overview tab.
- The max slot limit applies when adding students.

**Interface Elements:**

- Student list table
- "Add student" button (opens modal with email input)
- "Import" button (file upload)
- Search bar
- Remove button per student row
- Student count display

---

##### 5. Copy Classroom Enrollment Key

**Path:** Classroom detail -> **"Overview"** tab

**Steps:**

1. Inside the classroom detail page, click the **"Overview"** tab.
2. Find the **Enrollment Key** section.
3. Click the **"Copy"** button next to the key.
4. The key is copied to your clipboard.
5. Share this key with your students so they can enroll.

**Interface Elements:**

- Enrollment key display field
- Copy button (clipboard icon)

---

### 2.3.5 Workflow 4: Lecturer - Problem & Exam Management

#### Purpose

This workflow covers how lecturers create problems, manage test cases, create exams, and manage exam templates.

#### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              Problem Banks Page (`/problem-banks`)               │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌───────────────────┴───────────────────┐
         │                                       │
         ▼                                       ▼
┌─────────────────┐                 ┌─────────────────────────┐
│  Problem List   │                 │   Create/Edit Problem    │
│  (Table View)  │                 │   Modal Form            │
│  - Search      │                 │   - Title               │
│  - Filter      │                 │   - Difficulty          │
│  - Pagination  │                 │   - Content (Markdown)  │
└────────┬────────┘                 │   - Code Template      │
         │                           │   - File Name          │
         │                           └───────────┬─────────────┘
         │                                       │
         │                           ┌───────────▼─────────────┐
         ▼                           │   Problem Detail Page  │
┌─────────────────┐                  │   (`/problem-banks/[id]`) │
│  Exam Banks     │                  │                         │
│  (`/exam-banks`)│                 │   - Test Cases Tab     │
└────────┬────────┘                  │     - Add/Edit/Delete  │
         │                           │     - Public/Hidden     │
         │                           │     - Compare Modes     │
         ▼                           │                         │
┌─────────────────┐                  │   - Generate AI Tab    │
│  Create Exam    │                  │     - Auto-generate     │
│  or Template    │                  └─────────────────────────┘
│  Modal          │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Classroom Detail -> Exams Tab                 │
│    Create Exam -> Assign to Classroom -> Schedule       │
│    Exam Modes: PRACTICAL | EXAMINATION                  │
└─────────────────────────────────────────────────────────────┘
```

---

#### Step-by-Step Guide

---

##### 1. View Problem Banks

**Path:** `http://localhost:3000/problem-banks`

**Steps:**

1. Log in as a **Lecturer**.
2. Click on **"Problem Banks"** in the navigation menu or go to `/problem-banks`.
3. You will see a paginated list of problems you have created.
4. Use the **Search** bar to filter by problem title.
5. Use the **Difficulty** dropdown to filter by Easy/Medium/Hard.
6. Each problem row displays:
   - Title
   - Difficulty badge (color-coded: green/yellow/red)
   - Tags
   - Number of test cases
   - Created date
   - Updated date
   - Actions (View, Edit, Delete)

**Interface Elements:**

- Page header: "Problem Bank"
- Subtitle: "Create and manage coding problems"
- Search input field
- Difficulty filter dropdown (All / Easy / Medium / Hard)
- "Add problem" button
- Table with columns: Title, Difficulty, Tags, Test cases, Created, Updated, Actions
- Pagination controls

---

##### 2. Create a New Problem

**Path:** `http://localhost:3000/problem-banks` -> Click **"Add problem"** OR navigate to `/problem-banks/create`

**Steps:**

1. Click the **"Add problem"** button in the top-right corner.
2. You will be redirected to the problem creation page (`/problem-banks/create`).
3. Fill in the problem details:

   **Title** *(Required)*
   - Enter the problem title
   - 3-500 characters
   - Example: `Two Sum`

   **Content** *(Required)*
   - Enter the problem description
   - Supports Markdown formatting
   - 10-50,000 characters
   - Include:
     - Problem statement
     - Input specifications
     - Output specifications
     - Sample input/output
     - Constraints
     - Hints (optional)

   **File Name** *(Required)*
   - Enter the expected file name for submission
   - Example: `Solution.java`, `main.py`, `main.cpp`

   **Difficulty** *(Required)*
   - Select from dropdown:
     - **Easy** (green badge)
     - **Medium** (yellow badge)
     - **Hard** (red badge)

   **Code Template** *(Optional)*
   - Enter starter code that will be pre-filled in the code editor
   - Supports multiple languages via key-value format
   - Example: `{"python": "def solve(): pass", "java": "public class Solution {}"}`

   **Tags** *(Optional)*
   - Add tags to categorize the problem
   - Example: Array, String, Dynamic Programming

4. Click the **"Create"** button.
5. Upon success, you will be redirected to the problem detail page.
6. A success toast will appear.

**Interface Elements:**

- Form with fields: Title, Content (textarea), File Name, Difficulty dropdown, Code Template (code editor), Tags input
- Preview panel for Markdown rendering
- "Create" and "Cancel" buttons

---

##### 3. Manage Test Cases for a Problem

**Path:** Problem detail page (`/problem-banks/[id]`) -> **"Test Cases"** tab

**Steps:**

1. From the Problem Banks list, click **"View"** on a problem to go to its detail page.
2. Click the **"Test Cases"** tab.
3. You will see a list of test cases for this problem.

   **To add a test case:**
   - Click the **"Add test case"** button.
   - Fill in:
     - **Input**: The input data for the test case
     - **Expected Output**: The expected result
     - **Is Public**: Checkbox - if checked, students can see this test case
     - **Compare Mode**: Select comparison method:
       - **Exact**: Exact string match
       - **Case Insensitive**: Ignore case differences
       - **Floating Point**: With tolerance for decimal comparisons
       - **Token**: Compare word-by-word
       - **Unordered Token**: Compare ignoring order
   - For Floating Point mode, enter a **Tolerance** value.
   - Click **"Save"**.

   **To edit a test case:**
   - Click the **"Edit"** icon on a test case row.
   - Modify the fields.
   - Click **"Save"**.

   **To delete a test case:**
   - Click the **"Delete"** icon on a test case row.
   - Confirm the deletion.

   **To reorder test cases:**
   - Drag and drop test cases to reorder their sequence.

   **To auto-generate test cases:**
   - Click the **"Auto-generate"** or **"AI Generate"** button.
   - The system will generate test cases based on sample inputs/outputs.
   - Review and save the generated test cases.

**Test Case Visibility:**

- **Public test cases**: Visible to students, used for self-testing with "Run" button
- **Hidden test cases**: Not visible to students, used for final grading

**Interface Elements:**

- Test case list table
- "Add test case" button
- Input/Expected output fields
- Public checkbox
- Compare mode dropdown
- Tolerance input (for floating point)
- Drag handle for reordering
- Edit/Delete buttons per row

---

##### 4. View Exam Banks

**Path:** `http://localhost:3000/exam-banks`

**Steps:**

1. Log in as a **Lecturer**.
2. Click on **"Exam Banks"** in the navigation menu or go to `/exam-banks`.
3. You will see a list of examination templates you have created.
4. Each template row displays:
   - Exam name
   - Description
   - Number of problems
   - Total mark
   - Status (Active/Deleted)
   - Created date
   - Actions (Edit, Delete/Restore)
5. Use the **"Include deleted"** checkbox to show soft-deleted templates.

**Interface Elements:**

- Page header: "Examination Bank"
- Subtitle: "Manage examination templates and problem sets"
- Filter dropdown (Active only / Include deleted)
- "Add Template" button
- Table with columns: Exam Name, Description, Problems, Total Mark, Status, Created, Actions

---

##### 5. Create an Examination Template

**Path:** `http://localhost:3000/exam-banks` -> Click **"Add Template"**

**Steps:**

1. Click the **"Add Template"** button.
2. A modal dialog titled **"Add Template"** will appear.
3. Fill in the template details:

   **Exam Name** *(Required)*
   - Enter a name for the exam template
   - Example: `Midterm Exam - Spring 2026`

   **Description** *(Optional)*
   - Enter a description of the exam
   - Example: `Covers topics: Arrays, Strings, and Basic Algorithms`

   **Problems**
   - Click **"Select Problems"** to open the problem picker.
   - Select problems from your Problem Bank.
   - For each problem, set the **Mark** (points).
   - The total mark is auto-calculated.

4. Click **"Save"** to create the template.
5. Upon success, the modal will close and the template will appear in the list.

**Interface Elements:**

- Exam name input field
- Description textarea
- Problem selection section
- "Select Problems" button (opens picker modal)
- Problem list with mark input
- Total mark display
- Save and Cancel buttons

---

##### 6. Create an Exam for a Classroom

**Path:** Classroom detail (`/manage-classroom/[id]`) -> **"Exams"** tab -> Click **"Create Exam"**

**Steps:**

1. Navigate to a classroom detail page.
2. Click the **"Exams"** tab.
3. Click the **"Create Exam"** button.
4. A modal dialog will appear with exam configuration:

   **Exam Name** *(Required)*
   - Enter the exam name

   **Description** *(Optional)*
   - Enter exam description

   **Mode** *(Required)*
   - Select exam mode:
     - **PRACTICAL**: Students can submit anytime, no proctoring
     - **EXAMINATION**: Students must start a session, timer enforced, proctoring enabled

   **Start Time** *(Required)*
   - Select the exam start date and time
   - If in the past, the exam will start immediately

   **End Time** *(Required)*
   - Select the exam end date and time
   - Must be after the start time

   **Problems**
   - Select problems from your Problem Bank or Exam Templates
   - Set marks for each problem

   **Programming Languages**
   - Select which programming languages students can use

5. Click **"Create"** to create the exam.
6. The exam will be scheduled and will automatically open at the start time.

**Exam Status Progression:**

```
PENDING (Scheduled) --> ONGOING (Started) --> COMPLETED (Ended)
                          |
                          +--> AUTO-SUBMIT (Timer expires)
```

**Interface Elements:**

- Exam creation modal form
- Date/time pickers
- Problem selector
- Language multi-selector
- Create and Cancel buttons

---

### 2.3.6 Workflow 5: Admin Dashboard

#### Purpose

This workflow covers how administrators manage the overall system: subjects, programming languages, classrooms, and users.

#### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  Admin Dashboard (`/admin`)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Manage        │ │  Manage        │ │  Manage        │
│  Subjects      │ │  Programming   │ │  Classes       │
│  (`/admin/     │ │  Languages     │ │  (`/admin/     │
│  subjects`)    │ │ (`/admin/      │ │  classes`)     │
│                 │ │  programming-  │ │                 │
│                 │ │  languages`)    │ │                 │
│                 │ │                 │ │                 │
│  ┌───────────┐ │ │  ┌───────────┐ │ │  ┌───────────┐ │
│  │ Subject   │ │ │  │ Language  │ │ │  │ Classroom │ │
│  │ List      │ │ │  │ List      │ │ │  │ List      │ │
│  │ + Add     │ │ │  │ + Add     │ │ │  │ + Add     │ │
│  │ + Edit    │ │ │  │ + Edit    │ │ │  │ + View    │ │
│  │ + Delete  │ │ │  │ + Delete  │ │ │  │ + Delete  │ │
│  └───────────┘ │ │  └───────────┘ │ │  └───────────┘ │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                                                            │
                                                            ▼
                                                  ┌─────────────────┐
                                                  │  Manage Users   │
                                                  │  (`/admin/users`)│
                                                  │                 │
                                                  │  ┌───────────┐ │
                                                  │  │ User List │ │
                                                  │  │ + Filter  │ │
                                                  │  │ + Search  │ │
                                                  │  │ + Grant   │ │
                                                  │  │ + Disable │ │
                                                  │  └───────────┘ │
                                                  └─────────────────┘
```

---

#### Step-by-Step Guide

---

##### 1. Access Admin Dashboard

**Path:** `http://localhost:3000/admin`

**Steps:**

1. Log in as an **Admin** user.
2. The system will automatically redirect you to the Admin Dashboard.
3. The Dashboard displays:

   **Overview Statistics:**
   - Total Classrooms count
   - Total Subjects count
   - Programming Languages count
   - Total Students count
   - Total Lecturers count

   **Quick Actions:**
   - Manage Classrooms
   - Manage Subjects
   - Manage Programming Languages
   - Manage Users

   **Recent Activities:**
   - List of recent system changes (add/update/delete operations)

**Interface Elements:**

- Dashboard header: "Admin Dashboard"
- Welcome message
- Statistics cards (5 cards in a row)
- Quick action cards with icons and descriptions
- Recent activities list with timestamps

---

##### 2. Manage Subjects

**Path:** Admin Dashboard -> Click **"Manage Subjects"** or go to `/admin/subjects`

**Steps:**

1. On the Admin Dashboard, click the **"Manage Subjects"** quick action card.
2. You will see a list of all subjects in the system.
3. Each subject displays:
   - Subject code
   - Subject name
   - Is Deleted status
   - Actions (Edit, Delete)

   **To add a new subject:**
   - Click the **"Add Subject"** button.
   - Fill in the form:
     - **Subject Code**: Unique code (e.g., `CS101`)
     - **Subject Name**: Full name (e.g., `Introduction to Computer Science`)
   - Click **"Save"**.

   **To edit a subject:**
   - Click the **"Edit"** button on a subject row.
   - Modify the fields.
   - Click **"Save"**.

   **To delete a subject:**
   - Click the **"Delete"** button on a subject row.
   - Confirm the deletion.
   - *Note*: Cannot delete subjects that are being used by classrooms.

**Interface Elements:**

- Subject list table
- "Add Subject" button
- Edit/Delete buttons per row
- Soft-delete indicator

---

##### 3. Manage Programming Languages

**Path:** Admin Dashboard -> Click **"Manage Programming Languages"** or go to `/admin/programming-languages`

**Steps:**

1. On the Admin Dashboard, click the **"Manage Programming Languages"** quick action.
2. You will see a list of all supported programming languages.
3. Each language displays:
   - Language name
   - Compiler ID
   - Version
   - Actions

   **To add a new programming language:**
   - Click the **"Add Language"** button.
   - Fill in the form:
     - **Language Name**: Display name (e.g., `Python`)
     - **Compiler ID**: Internal compiler identifier (e.g., `python3`)
     - **Version**: Version string (e.g., `3.11`)
   - Click **"Save"**.

   **To edit a language:**
   - Click the **"Edit"** button.
   - Modify fields.
   - Click **"Save"**.

   **To delete a language:**
   - Click the **"Delete"** button.
   - *Note*: Cannot delete languages that are being used by exams.

**Interface Elements:**

- Programming language list
- "Add Language" button
- Language name, Compiler ID, Version columns
- Edit/Delete action buttons

---

##### 4. Manage Classes (Admin View)

**Path:** Admin Dashboard -> Click **"Manage Classes"** or go to `/admin/classes`

**Steps:**

1. On the Admin Dashboard, click the **"Manage Classes"** quick action.
2. You will see a list of all classrooms in the system.
3. This is a read-only view showing all classrooms across all lecturers.
4. Each classroom displays:
   - Class code
   - Class name
   - Lecturer name
   - Subject
   - Semester
   - Number of students
   - End date

**Interface Elements:**

- Classroom list table
- Read-only view (no create/edit from admin)

---

##### 5. Manage Users

**Path:** Admin Dashboard -> Click **"Manage Users"** or go to `/admin/users`

**Steps:**

1. On the Admin Dashboard, click the **"Manage Users"** quick action.
2. You will see a list of all users in the system.
3. Each user displays:
   - Full name
   - Email
   - Role (Student / Lecturer / Admin)
   - Status (Enabled / Disabled)
   - Last login date
   - Actions

   **To search for a user:**
   - Use the search bar to filter by name or email.

   **To filter by role:**
   - Use the Role dropdown to filter by Student/Lecturer/Admin.

   **To grant a new account:**
   - Click the **"Grant Account"** button.
   - Enter the user's email.
   - Select the role to assign.
   - The system will send an invitation email.

   **To disable a user:**
   - Click the **"Disable"** button on a user row.
   - The user will not be able to log in.

   **To enable a disabled user:**
   - Click the **"Enable"** button.

**Interface Elements:**

- User list table
- Search bar
- Role filter dropdown
- "Grant Account" button
- Enable/Disable buttons per user

---

### 2.3.7 Workflow 6: Code Editor & Submission

#### Purpose

This workflow provides detailed guidance on using the integrated code editor for solving programming problems during exams or practice sessions.

#### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Code Editor Workspace                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Problem Panel (Left)    │ Code Editor (Center)          │    │
│  │                        │                               │    │
│  │ ┌──────────────────┐  │ ┌───────────────────────────┐ │    │
│  │ │ Title: Two Sum   │  │ │ Language: [Python ▼]    │ │    │
│  │ │ Difficulty: Easy │  │ └───────────────────────────┘ │    │
│  │ │                  │  │ ┌───────────────────────────┐ │    │
│  │ │ Description:     │  │ │ def two_sum(nums, target)│ │    │
│  │ │ Given an array...│  │ │     ...                  │ │    │
│  │ │                  │  │ │                         │ │    │
│  │ │ Input:           │  │ │                         │ │    │
│  │ │ [1,2,3,4]       │  │ │                         │ │    │
│  │ │                  │  │ └───────────────────────────┘ │    │
│  │ │ Output:          │  │                               │    │
│  │ │ [0,1]           │  │ ┌───────────────────────────┐ │    │
│  │ │                  │  │ │ [Run] [Submit] [Reset] │ │    │
│  │ │ Sample Test:     │  │ └───────────────────────────┘ │    │
│  │ │ Input: [2,7,...] │  │                               │    │
│  │ │ Output: [0,1]  │  └───────────────────────────────┘    │
│  │ └──────────────────┘                                    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Console Panel (Bottom)                                    │    │
│  │                                                           │    │
│  │ Test Case 1: ✓ PASSED                                   │    │
│  │ Test Case 2: ✗ FAILED (Expected: 5, Got: 4)           │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [Timer: 01:45:32]                            [Submit Exam]     │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Step-by-Step Guide

---

##### 1. Navigate to the Code Editor

**Path:** During an exam -> Click on a problem in the problem list OR navigate directly to `/code-editor/[problemId]`

**Steps:**

1. When taking an exam, you will see a list of problems in the exam.
2. Click on any problem to open it in the Code Editor.
3. The Code Editor page will load with:
   - **Problem Panel** (left): Shows the problem description
   - **Code Editor** (center): Monaco Editor for writing code
   - **Console Panel** (bottom): Shows output and test results

---

##### 2. Read the Problem Description

The Problem Panel displays:

**Header Section:**
- Problem title (e.g., "Two Sum")
- Difficulty badge (Easy: green, Medium: yellow, Hard: red)

**Description Section:**
- Problem statement in Markdown format
- Includes context, requirements, and constraints

**Input/Output Section:**
- Input format specification
- Output format specification

**Sample Test Cases:**
- Example inputs and expected outputs
- These are **public** test cases (visible to students)

**Interface Elements:**

- Scrollable problem description panel
- Markdown rendering support
- Collapsible sections
- Sample I/O examples

---

##### 3. Select Programming Language

**Steps:**

1. In the Code Editor toolbar, find the **Language Selector** dropdown.
2. Click the dropdown to see available languages.
3. Select your preferred programming language.
4. Available languages (configured by lecturer/admin):
   - Python
   - Java
   - C++
   - C
   - JavaScript
   - TypeScript
   - And others...

5. When you change the language:
   - The code template updates (if a template exists)
   - Syntax highlighting changes
   - Console output format may change

**Interface Elements:**

- Language dropdown selector (top of editor)
- Current language indicator
- Template auto-load on language change

---

##### 4. Write Code in the Editor

**Steps:**

1. Click inside the Monaco Editor area (center panel).
2. Write your solution code.
3. The editor provides:
   - **Syntax highlighting** for the selected language
   - **Auto-completion** suggestions
   - **Bracket matching**
   - **Auto-indentation**
   - **Line numbers**

**Editor Features:**

| Feature | Description |
|---------|-------------|
| Syntax Highlighting | Color-coded code elements |
| Auto-complete | Tab suggestions for functions, variables |
| Bracket Matching | Highlight matching brackets |
| Line Numbers | Show line numbers on the left |
| Minimap | Overview of code structure on the right |
| Find & Replace | Ctrl+F to find, Ctrl+H to replace |

**Keyboard Shortcuts:**

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save (auto-save is enabled) |
| `Ctrl + /` | Toggle comment |
| `Ctrl + Shift + F` | Format code |
| `Ctrl + D` | Duplicate line |
| `Alt + Up/Down` | Move line up/down |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |

---

##### 5. Use Code Templates

**Steps:**

1. When you first open a problem, the code template is automatically loaded.
2. The template provides starter code with function signatures.
3. You only need to implement the solution inside the template.
4. To view the original template:
   - Click the **"Reset"** button (with confirmation).
   - This will replace your code with the original template.

**Interface Elements:**

- Pre-loaded template code
- "Reset" button to restore template
- Confirmation dialog before reset

---

##### 6. Run Code with Sample Test Cases

**Steps:**

1. Write your code solution.
2. Click the **"Run"** button in the editor toolbar.
3. The system will execute your code against the **public sample test cases**.
4. Results will appear in the **Console Panel** (bottom).
5. For each test case, you will see:
   - **PASSED** (green checkmark): Your output matches expected
   - **FAILED** (red X): Your output does not match
     - Shows expected vs actual output
   - **ERROR**: Compilation or runtime error
     - Shows error message

**Console Panel Contents:**

```
=== Running Sample Test Cases ===

Test Case 1: ✓ PASSED
  Input:  [1,2,3,4], target=6
  Expected: [1,2]
  Your Output: [1,2]
  Execution Time: 5ms

Test Case 2: ✗ FAILED
  Input:  [3,3], target=6
  Expected: [0,1]
  Your Output: [0,0]
  Execution Time: 3ms

Test Case 3: ✓ PASSED
  Input:  [1,2,3], target=4
  Expected: [0,2]
  Your Output: [0,2]
  Execution Time: 4ms

===========================
Result: 2/3 test cases passed
```

**Notes:**

- "Run" only tests **public** sample test cases.
- "Submit" tests **all** test cases (including hidden ones) and counts toward your final score.
- Running code does NOT submit it for grading.

**Interface Elements:**

- "Run" button (often blue or green)
- Console output area (scrollable)
- Test result indicators (pass/fail)
- Execution time display

---

##### 7. Format Code

**Steps:**

1. Click the **"Format"** button or press `Ctrl + Shift + F`.
2. The system will auto-format your code according to language standards.
3. Supported formatters:
   - Python: `black` or `autopep8`
   - Java: Built-in formatter
   - C/C++: `clang-format`
   - JavaScript/TypeScript: Prettier

**Interface Elements:**

- "Format" button in toolbar
- Keyboard shortcut hint

---

##### 8. Submit Solution for Grading

**Steps:**

1. When you are confident with your solution, click the **"Submit"** button.
2. **Important**: This submits your code for final grading against **all test cases** (including hidden ones).
3. A confirmation dialog may appear:
   - "Are you sure you want to submit? This will grade your submission."
4. Click **"Submit"** to confirm.
5. The system will:
   - Compile your code
   - Run all test cases (public + hidden)
   - Calculate your score
   - Display results in the Console Panel

**Grading Results:**

```
=== Grading Results ===

Problem: Two Sum
Submitted: 14:32:05
Status: GRADED

Test Case 1: ✓ PASSED (Public)
Test Case 2: ✓ PASSED (Public)
Test Case 3: ✓ PASSED (Hidden)
Test Case 4: ✓ PASSED (Hidden)
Test Case 5: ✓ PASSED (Hidden)

Score: 10/10
```

**Interface Elements:**

- "Submit" button (often prominent, primary color)
- Confirmation dialog
- Grading progress indicator
- Results display

---

##### 9. Auto-Save Feature

**Steps:**

1. Your code is **automatically saved** to the browser's local storage.
2. Every few seconds, the system saves your current code.
3. If you accidentally close the browser or refresh:
   - When you return to the same problem, your code will be restored.
4. The auto-save indicator shows the last save time.

**Interface Elements:**

- "Last saved: 2 seconds ago" indicator
- Auto-save confirmation toast

---

##### 10. Full-Screen Mode

**Steps:**

1. Click the **"Fullscreen"** or expand icon in the editor toolbar.
2. The editor will expand to fill the entire screen.
3. To exit fullscreen, press `Escape` or click the collapse icon.

**Interface Elements:**

- Fullscreen toggle button
- Collapse/Exit button

---

##### 11. Adjust Font Size

**Steps:**

1. In the editor toolbar, find the **Font Size** control.
2. Click +/- buttons or use the dropdown to select a font size.
3. The editor font size will update immediately.

**Interface Elements:**

- Font size selector (A+ / A- or dropdown)
- Available sizes: 12px, 14px, 16px, 18px, 20px

---

##### 12. Timer and Exam Warnings

**During an EXAMINATION mode exam:**

1. The timer is always visible at the top of the page.
2. **At 5 minutes remaining:**
   - A warning notification will appear.
   - "Warning: 5 minutes remaining. Please submit your exam soon."
3. **At 1 minute remaining:**
   - A critical warning will appear.
   - "Critical: 1 minute remaining! Submit immediately!"
4. **At 0 minutes:**
   - The exam will be **automatically submitted**.
   - All your current code will be submitted as final answers.
   - You will be redirected to the results page.

**Interface Elements:**

- Countdown timer (top bar)
- Warning modal (5 minutes)
- Critical warning modal (1 minute)
- Auto-submit on timer expiry

---

# Appendix

## A. Glossary

| Term | Definition |
|------|------------|
| **EduACAS** | Educational Assessment and Computerized Academic System |
| **ACAS** | AcasService - Core backend service for examination and learning features |
| **AuthService** | Authentication and Authorization backend service |
| **PRACTICAL Mode** | Exam mode where students can submit anytime without strict proctoring |
| **EXAMINATION Mode** | Exam mode with proctoring, session management, and strict time limits |
| **Test Case (Public)** | Sample test case visible to students for self-testing |
| **Test Case (Hidden)** | Test case not visible to students, used for final grading |
| **Compare Mode** | Method used to compare expected output with actual output |
| **Soft Delete** | Marking a record as deleted without physically removing from database |
| **SignalR** | Real-time communication library for notifications |
| **Monaco Editor** | The code editor component (by Microsoft) used in the application |

## B. User Roles and Permissions

| Feature | Admin | Lecturer | Student |
|---------|-------|----------|---------|
| Manage Users | Yes | No | No |
| Manage Subjects | Yes | No | No |
| Manage Programming Languages | Yes | No | No |
| Manage All Classrooms | Yes | Own Only | No |
| Create Problems | No | Yes | No |
| Create Exams | No | Yes | No |
| Grade Submissions | No | Yes | No |
| Enroll in Classrooms | No | No | Yes |
| Take Exams | No | No | Yes |
| View Own Results | No | Yes | Yes |
| View All Results | No | Yes (own classes) | Own Only |

## C. Error Messages Reference

| Error Message | Cause | Resolution |
|--------------|-------|-----------|
| "Invalid email or password" | Incorrect credentials | Check email/password |
| "User is forbidden" | Account is disabled | Contact admin |
| "Exam session is not active..." | Not started exam in EXAMINATION mode | Start exam from exam page |
| "Token has expired" | Password reset link expired | Request new link |
| "Classroom code already exists" | Duplicate class code | Use a unique code |
| "Enrollment key is incorrect" | Wrong key entered | Check with lecturer |
| "Maximum slot reached" | Classroom is full | Contact lecturer |
| "Compilation error" | Code has syntax errors | Fix code syntax |
| "Time limit exceeded" | Code took too long | Optimize algorithm |
| "Memory limit exceeded" | Code used too much memory | Optimize memory usage |

## D. Keyboard Shortcuts Reference

### Code Editor

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Manual save (auto-save is enabled) |
| `Ctrl + /` | Toggle line comment |
| `Ctrl + Shift + F` | Format code |
| `Ctrl + D` | Select next occurrence |
| `Alt + Up` | Move line up |
| `Alt + Down` | Move line down |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + F` | Find |
| `Ctrl + H` | Find and Replace |
| `Ctrl + /` | Block comment |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Tab` | Next tab/panel |
| `Shift + Tab` | Previous tab/panel |
| `Escape` | Close modal/exit fullscreen |

## E. Technical Support

For technical issues, please contact:

- **Email:** support@eduacas.edu.vn
- **Documentation:** https://docs.eduacas.edu.vn
- **Issue Tracker:** https://github.com/your-org/eduacas/issues

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 17, 2026 | Development Team | Initial release |

---

**Last Updated:** April 17, 2026
**Approved By:** ___________________ (Project Manager)
