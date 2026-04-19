# TEST SCHEDULE — EDUACAS

> Version: 1.0
> Created: 17/04/2026
> Project: EduACAS — Online Examination & Learning Management System
> Project Code: EDU-ACAS-2026
> Schedule Period: April 1, 2026 — June 24, 2026 (12 weeks)

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Testing Phases Timeline](#2-testing-phases-timeline)
3. [Detailed Weekly Schedule](#3-detailed-weekly-schedule)
4. [Resource Allocation](#4-resource-allocation)
5. [Test Environment Setup](#5-test-environment-setup)
6. [Milestones & Deliverables](#6-milestones--deliverables)
7. [Risk Management](#7-risk-management)
8. [Entry & Exit Criteria](#8-entry--exit-criteria)

---

## 1. OVERVIEW

### Project Information

| Field | Value |
|-------|-------|
| **Project Name** | EduACAS |
| **Project Code** | EDU-ACAS-2026 |
| **Document Type** | Test Schedule & Timeline |
| **Version** | 1.0 |
| **Start Date** | April 1, 2026 |
| **End Date** | June 24, 2026 |
| **Total Duration** | 12 Weeks (84 days) |
| **Status** | Draft |

### Testing Scope

| Layer | Technology | Test Types |
|-------|------------|------------|
| **Backend** | .NET 9, C#, Entity Framework, SignalR, Redis | Unit, Integration, API |
| **Frontend** | Next.js 16, React 19, TypeScript, TailwindCSS | Unit, Integration, E2E |
| **Mobile** | Flutter 3.x, Dart | Unit, Widget, Integration |
| **Database** | SQL Server / PostgreSQL | Schema, Data Integrity |
| **Infrastructure** | AWS S3, Docker, Kubernetes | Deployment, Performance |

### Total Test Cases Overview

| Test Level | Estimated Cases | Priority |
|------------|----------------|----------|
| **Feature Tests (E2E)** | 271 | P0–P2 |
| **Backend Unit Tests** | ~450 | P0–P2 |
| **Frontend Unit Tests** | ~50 | P0–P2 |
| **Mobile Tests** | ~30 | P0–P2 |
| **Integration Tests** | ~100 | P0–P2 |
| **Performance Tests** | ~20 | P1 |
| **Security Tests** | ~30 | P0 |
| **Total Estimated** | **~951** | — |

---

## 2. TESTING PHASES TIMELINE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EDUACAS TEST SCHEDULE                             │
│                          12 Weeks (Apr 1 – Apr 24)                          │
├────────────┬────────────┬────────────┬────────────┬────────────┬────────────┤
│  Week 1-2  │  Week 3-4  │  Week 5-6  │  Week 7-8  │  Week 9-10 │ Week 11-12 │
│  Apr 1-14  │  Apr 15-28 │  Apr 29-May12 │ May 13-26 │ May 27-Jun9 │ Jun 10-24  │
├────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤
│  ◼︎ Setup   │  ◼︎ Auth    │  ◼︎ Exam    │  ◼︎ Grading │  ◼︎ Proct-  │  ◼︎ E2E,    │
│  ◼︎ Utils   │  ◼︎ Profile │  ◼︎ Problem  │  ◼︎ Code     │  ◼︎ oring   │  ◼︎ Regression│
│  ◼︎ Jobs    │  ◼︎ Classrm │  ◼︎ TestCase │  ◼︎ Submit   │  ◼︎ Slot     │  ◼︎ UAT      │
│  ◼︎ Commands│  ◼︎ Subject │  ◼︎ Template │  ◼︎ Notify   │  ◼︎ Material │  ◼︎ Go-Live  │
│  ◼︎ Queries │  ◼︎ Enroll  │  ◼︎ Session  │  ◼︎ Quiz     │  ◼︎ Slot     │  ◼︎ Support  │
│  ◼︎ Mappers │  ◼︎ Materi- │  ◼︎ StartEnd │  ◼︎ Discus-  │  ◼︎ OCR      │             │
│  ◼︎ Ctrlrs  │  ◼︎ al      │  ◼︎ Plagiar- │  ◼︎ sion     │             │             │
│            │            │  ◼︎ ism      │            │            │             │
└────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘
```

### Phase Breakdown

| Phase | Duration | Start | End | Deliverables |
|-------|----------|-------|-----|--------------|
| **Phase 0 — Prep & Setup** | 2 weeks | Apr 1 | Apr 14 | Test env, CI/CD, test data |
| **Phase 1 — Auth & Core** | 4 weeks | Apr 15 | May 12 | AuthService, User, Profile |
| **Phase 2 — Exam & Problem** | 4 weeks | May 13 | Jun 9 | Exam, Problem, TestCase |
| **Phase 3 — Grading & Submit** | 2 weeks | Jun 10 | Jun 23 | AutoGrading, Submission |
| **Phase 4 — E2E & UAT** | 2 weeks | Jun 10 | Jun 24 | Full E2E, regression, UAT |
| **Phase 5 — Go-Live** | 1 day | Jun 24 | Jun 24 | Production release |

---

## 3. DETAILED WEEKLY SCHEDULE

### PHASE 0: PREPARATION & SETUP (Week 1-2)

**Week 1 — Apr 1–7: Environment & Infrastructure**

| Day | Date | Task | Owner | Expected Output |
|-----|------|------|-------|-----------------|
| Mon | Apr 1 | Kick-off meeting, review requirements | QA Lead, Devs | Meeting minutes, test plan |
| Tue | Apr 2 | Set up test environments (dev/staging) | DevOps | Env URLs, access credentials |
| Wed | Apr 3 | Configure CI/CD pipeline (GitHub Actions/Jenkins) | DevOps | Automated test runs |
| Thu | Apr 4 | Create test databases (seed data) | QA, Backend | DB scripts, seed data |
| Fri | Apr 5 | Install & configure testing tools | QA | xUnit, Vitest, Flutter test |
| Mon | Apr 6 | Create test accounts (admin/teacher/student) | QA | Account list, credentials |
| Tue | Apr 7 | Smoke test infrastructure | QA | Env health check report |

**Week 2 — Apr 8–14: Unit Test Framework & Smoke Tests**

| Day | Date | Task | Owner | Expected Output |
|-----|------|------|-------|-----------------|
| Wed | Apr 8 | Write AcasService Utils tests (RC-01 → RC-17) | BE Team | 17 test cases |
| Thu | Apr 9 | Write AcasService Jobs tests (EJS-01 → EJS-23) | BE Team | 23 test cases |
| Fri | Apr 10 | Write AuthService Utils tests (JWT, Hashing) | BE Team | 18 test cases |
| Mon | Apr 13 | Write AuthService Command tests (UC-01 → UC-16) | BE Team | 16 test cases |
| Tue | Apr 14 | Write AuthService Query tests (UQ-01 → UQ-08) | BE Team | 8 test cases |
| **Total** | — | **Unit tests written in Phase 0** | — | **~82 test cases** |

---

### PHASE 1: AUTHENTICATION & USER MANAGEMENT (Week 3-6)

**Week 3 — Apr 15–21: Authentication Service**

| Day | Date | Module | Test Cases | Owner |
|-----|------|--------|------------|-------|
| Wed | Apr 15 | F01 — Login (14 TC) | F01-TC01 → F01-TC14 | BE + FE |
| Thu | Apr 16 | F02 — Register (12 TC) | F02-TC01 → F02-TC12 | BE + FE |
| Fri | Apr 17 | F03 — Forgot Password (9 TC) | F03-TC01 → F03-TC09 | BE + FE |
| Mon | Apr 20 | F04 — Reset Password (13 TC) | F04-TC01 → F04-TC13 | BE + FE |
| Tue | Apr 21 | F05 — Google OAuth (6 TC) | F05-TC01 → F05-TC06 | BE + FE |
| **Week Total** | — | **Auth Features** | **54 TC** | — |

**Week 4 — Apr 22–28: Profile, Email, Change Password**

| Day | Date | Module | Test Cases | Owner |
|-----|------|--------|------------|-------|
| Wed | Apr 22 | F06 — Email Verification (9 TC) | F06-TC01 → F06-TC09 | BE + FE |
| Thu | Apr 23 | F07 — Profile Management (13 TC) | F07-TC01 → F07-TC13 | BE + FE |
| Fri | Apr 24 | F08 — Change Password (6 TC) | F08-TC01 → F08-TC06 | BE + FE |
| Mon | Apr 27 | AcasService — Commands (Submission, Problem) | SUB-01 → SUB-26 | BE |
| Tue | Apr 28 | AcasService — Queries (Examination, Problem) | EQ-01 → EQ-08 | BE |
| **Week Total** | — | **Profile & Core Commands** | **28 + 34** | — |

**Week 5 — Apr 29–May 5: Classroom & Subject Management**

| Day | Date | Module | Test Cases | Owner |
|-----|------|--------|------------|-------|
| Wed | Apr 29 | F09 — Classroom CRUD (13 TC) | F09-TC01 → F09-TC13 | BE + FE |
| Thu | Apr 30 | F10 — Student Enrollment (10 TC) | F10-TC01 → F10-TC10 | BE + FE |
| Fri | May 1 | F11 — Classroom Enrollment (9 TC) | F11-TC01 → F11-TC09 | BE + FE |
| Mon | May 4 | F12 — Subject Management (5 TC) | F12-TC01 → F12-TC05 | BE + FE |
| Tue | May 5 | AcasService — Mappers, Controllers | SM-01 → SM-06, EM/PM | BE |
| **Week Total** | — | **Classroom & Subject** | **37 + 15** | — |

**Week 6 — May 6–12: Problem & TestCase Management**

| Day | Date | Module | Test Cases | Owner |
|-----|------|--------|------------|-------|
| Wed | May 6 | F13 — Problem Management (13 TC) | F13-TC01 → F13-TC13 | BE + FE |
| Thu | May 7 | F14 — TestCase Management (13 TC) | F14-TC01 → F14-TC13 | BE + FE |
| Fri | May 8 | F15 — Programming Language (5 TC) | F15-TC01 → F15-TC05 | BE + FE |
| Mon | May 11 | AcasService — All remaining tests | ~50 cases | BE |
| Tue | May 12 | Phase 1 Review & Bug Fixing | — | QA, Devs |
| **Week Total** | — | **Problem & Setup** | **31 + 50** | — |

**Phase 1 Summary (Weeks 3-6):**
- **Feature Tests:** 158 cases (F01–F15)
- **Unit Tests:** ~200 cases (Commands, Queries, Mappers, Controllers)
- **Total Phase 1:** ~358 test cases

---

### PHASE 2: EXAMINATION & PROBLEM MANAGEMENT (Week 7-10)

**Week 7 — May 13–19: Examination & Template**

| Day | Date | Module | Test Cases | Owner |
|-----|------|--------|------------|-------|
| Wed | May 13 | F16 — Examination Management (15 TC) | F16-TC01 → F16-TC15 | BE + FE |
| Thu | May 14 | F17 — Examination Template (5 TC) | F17-TC01 → F17-TC05 | BE + FE |
| Fri | May 15 | AcasService — ExamCommand/Query | EXM-01 → EXM-18 | BE |
| Mon | May 18 | AcasService — SlotCommand/Query | SL-01 → SL-04, SLQ-01–03 | BE |
| Tue | May 19 | F29 — Slot Management (5 TC) | F29-TC01 → F29-TC05 | BE + FE |
| **Week Total** | — | **Exam & Slot** | **20 + 20** | — |

**Week 8 — May 20–26: Start/End Exam & Plagiarism**

| Day | Date | Module | Test Cases | Owner |
|-----|------|--------|------------|-------|
| Wed | May 20 | F18 — Start/End Examination (11 TC) | F18-TC01 → F18-TC11 | BE + FE |
| Thu | May 21 | F19 — Plagiarism Detection (5 TC) | F19-TC01 → F19-TC05 | BE + FE |
| Fri | May 22 | AcasService — KeystrokeLog, ExamLog | KSL-01–03, EL-01–03 | BE |
| Mon | May 25 | Web App — Hooks (exam, submission) | EXH-01 → EXH-08 | FE |
| Tue | May 26 | Web App — Code Editor hooks | CDH-01 → CDH-06 | FE |
| **Week Total** | — | **Start/End & Proctoring** | **16 + 11** | — |

**Week 9 — May 27–Jun 2: Student Session & Submission**

| Day | Date | Module | Test Cases | Owner |
|-----|------|--------|------------|-------|
| Wed | May 27 | F20 — Student Exam Session (6 TC) | F20-TC01 → F20-TC06 | BE + FE |
| Thu | May 28 | F21 — Submission (10 TC) | F21-TC01 → F21-TC10 | BE + FE |
| Fri | May 29 | F22 — Auto-Grading (14 TC) | F22-TC01 → F22-TC14 | BE + FE |
| Mon | Jun 1 | AcasService — SubmissionCommand | SUB-13 → SUB-26 | BE |
| Tue | Jun 2 | AcasService — QuizCommand | QZ-01 → QZ-07 | BE |
| **Week Total** | — | **Submission & Grading** | **30 + 14** | — |

**Week 10 — Jun 3–9: Discussion, Material, Notification**

| Day | Date | Module | Test Cases | Owner |
|-----|------|--------|------------|-------|
| Wed | Jun 3 | F24 — Discussion (7 TC) | F24-TC01 → F24-TC07 | BE + FE |
| Thu | Jun 4 | F26 — Material (6 TC) | F26-TC01 → F26-TC06 | BE + FE |
| Fri | Jun 5 | F27 — Notification (7 TC) | F27-TC01 → F27-TC07 | BE + FE |
| Mon | Jun 8 | Web App — Discussion, Material hooks | — | FE |
| Tue | Jun 9 | Web App — Notification hooks | — | FE |
| **Week Total** | — | **Discussion & Notify** | **20 + 0** | — |

**Phase 2 Summary (Weeks 7-10):**
- **Feature Tests:** 94 cases (F16–F29 except F25, F28)
- **Unit Tests:** ~150 cases (Exam, Submission, Grading, Quiz)
- **Total Phase 2:** ~244 test cases

---

### PHASE 3: GRADING, PROCTORING & REMAINING FEATURES (Week 11)

**Week 11 — Jun 10–16: Quiz & Proctoring**

| Day | Date | Module | Test Cases | Owner |
|-----|------|--------|------------|-------|
| Wed | Jun 10 | F25 — Quiz (8 TC) | F25-TC01 → F25-TC08 | BE + FE |
| Thu | Jun 11 | F28 — Exam Proctoring (6 TC) | F28-TC01 → F28-TC06 | BE + FE |
| Fri | Jun 12 | Web App — Quiz hooks, remaining utils | — | FE |
| Mon | Jun 15 | Mobile App — Unit & Widget tests | MA-01 → MA-15 | Mobile |
| Tue | Jun 16 | Integration tests — API contracts | — | QA |
| **Week Total** | — | **Quiz, Proctoring, Mobile** | **14 + 15** | — |

---

### PHASE 4: END-TO-END & REGRESSION (Week 11-12)

**Week 11 (cont.) — Jun 10–16: E2E Testing**

| Day | Date | Test Suite | Owner |
|-----|------|------------|-------|
| Wed | Jun 10 | User Flow 1: Register → Login → Profile | QA |
| Thu | Jun 11 | User Flow 2: Create Classroom → Enroll → Exam | QA |
| Fri | Jun 12 | User Flow 3: Create Problem → Take Exam → Submit | QA |
| Mon | Jun 15 | User Flow 4: Teacher grading → Notification | QA |
| Tue | Jun 16 | Cross-browser & mobile web testing | QA |

**Week 12 — Jun 17–24: UAT & Go-Live Prep**

| Day | Date | Task | Owner | Deliverable |
|-----|------|------|-------|-------------|
| Wed | Jun 17 | UAT — Admin features | Product, Stakeholders | UAT sign-off |
| Thu | Jun 18 | UAT — Teacher features | Product, Teachers | UAT sign-off |
| Fri | Jun 19 | UAT — Student features | Product, Students | UAT sign-off |
| Mon | Jun 22 | Regression test final pass | QA | Regression report |
| Tue | Jun 23 | Bug fix & hotfix verification | Devs, QA | Fixed bugs list |
| Wed | Jun 24 | **PRODUCTION GO-LIVE** | All | System live 🚀 |

---

## 4. RESOURCE ALLOCATION

### Team Structure

| Role | Headcount | Responsibilities |
|------|-----------|-----------------|
| **QA Lead / Test Manager** | 1 | Overall test strategy, coordination, reporting |
| **Backend QA Engineers** | 2 | .NET unit, integration, API tests |
| **Frontend QA Engineers** | 2 | Next.js unit, component, E2E tests |
| **Mobile QA Engineers** | 1 | Flutter unit, widget, integration tests |
| **Automation Engineers** | 2 | CI/CD, test automation framework |
| **DevOps Engineer** | 1 | Test environment, CI/CD pipeline |

**Total QA Team:** 9 people

### Workload Distribution

| Week | BE Tests | FE Tests | Mobile Tests | E2E Tests | Automation |
|------|----------|----------|--------------|-----------|------------|
| W1-2 | 100% | 50% | 30% | 0% | 100% |
| W3-4 | 100% | 80% | 30% | 20% | 80% |
| W5-6 | 100% | 70% | 30% | 30% | 70% |
| W7-8 | 100% | 70% | 30% | 50% | 60% |
| W9-10 | 100% | 70% | 50% | 60% | 50% |
| W11-12 | 50% | 50% | 100% | 100% | 30% |

---

## 5. TEST ENVIRONMENT SETUP

### Environment URLs

| Environment | Base URL | Purpose | Status |
|-------------|----------|---------|--------|
| **Development** | `https://dev.eduacas.edu.vn` | Daily dev testing | ✅ Ready Apr 1 |
| **Staging** | `https://staging.eduacas.edu.vn` | UAT, pre-prod | ✅ Ready Apr 15 |
| **Production** | `https://app.eduacas.edu.vn` | Live production | 🚀 Jun 24 |

### Test Data Strategy

| Data Type | Source | Volume |
|-----------|--------|--------|
| **Users** | Seeded | 500 (admin: 5, teacher: 50, student: 445) |
| **Classrooms** | Seeded | 100 |
| **Problems** | Seeded | 500 |
| **Submissions** | Generated | 1000+ (via API) |
| **Materials** | Sample files | 50 PDF/DOCX/PPT |

### Test Account Credentials

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Admin** | `admin@eduacas.edu.vn` | `Admin@123` | Full access |
| **Teacher** | `teacher@eduacas.edu.vn` | `Teacher@123` | Classroom mgmt |
| **Student** | `student@eduacas.edu.vn` | `Student@123` | Exam taker |
| **TA (Teaching Asst.)** | `ta@eduacas.edu.vn` | `TA@123` | Partial access |

---

## 6. MILESTONES & DELIVERABLES

| Milestone | Date | Deliverable | Owner |
|-----------|------|-------------|-------|
| **M1 — Test Plan Approved** | Apr 1 | Test Strategy, Schedule | QA Lead |
| **M2 — Env & CI Ready** | Apr 14 | Test env, CI/CD pipeline | DevOps |
| **M3 — Auth Tests Complete** | May 5 | F01–F08 + Auth Utils/Commands | BE/FE QA |
| **M4 — Classroom Tests Complete** | May 12 | F09–F15 + Commands/Queries | BE/FE QA |
| **M5 — Exam & Problem Tests Complete** | Jun 9 | F16–F22 + Exam/Slot modules | BE/FE QA |
| **M6 — All Feature Tests Done** | Jun 16 | F23–F29 + Web/Mobile | All QA |
| **M7 — E2E & Regression Pass** | Jun 23 | Test summary report | QA Lead |
| **M8 — UAT Sign-off** | Jun 23 | UAT sign-off document | Product |
| **M9 — Go-Live** | Jun 24 | Production release | All |

---

## 7. RISK MANAGEMENT

### Identified Risks

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| **R1** | Backend API delays | Medium | High | Start with contract tests (Postman), mock APIs |
| **R2** | Frontend UI not ready on time | Medium | Medium | Use Storybook, component stubs |
| **R3** | Test environment instability | Low | High | Set up local Docker env, backup env |
| **R4** | Test data quality issues | Medium | Medium | Seed scripts, data generation tools |
| **R5** | Test automation framework delays | Low | Medium | Use proven frameworks (xUnit, Vitest) |
| **R6** | Key resource unavailable (sick/leave) | Low | High | Cross-train team, pair programming |
| **R7** | Requirements change mid-sprint | Medium | Medium | Agile — adapt schedule, prioritize |

### Contingency Plan

- **Buffer Days:** 5 buffer days built into schedule (Jun 17–23)
- **Critical Path:** Auth → Exam → Grading must finish before E2E
- **Fallback:** If FE delays, test API directly with Postman

---

## 8. ENTRY & EXIT CRITERIA

### Entry Criteria (per test phase)

| Criterion | Description | Checked By |
|-----------|-------------|------------|
| **Requirements Ready** | All user stories/features reviewed | Product Owner |
| **Build Deployed** | Code deployed to test env | DevOps |
| **Test Data Seeded** | Test data available in DB | QA |
| **Test Cases Written** | All TCs for phase reviewed | QA Lead |
| **Test Env Healthy** | All services running | QA |

### Exit Criteria (per test phase)

| Criterion | Description | Target |
|-----------|-------------|--------|
| **All TCs Executed** | 100% of planned TCs run | 100% |
| **Pass Rate ≥ 95%** | Failed TCs ≤ 5% | ≥ 95% |
| **Critical Bugs Fixed** | P0/P1 bugs resolved | 100% |
| **Test Coverage Met** | Code coverage threshold met | BE: ≥80%, FE: ≥70% |
| **Sign-off Received** | PO/PM approval | ✅ |

### Go-Live Exit Criteria

| # | Criterion | Status |
|---|-----------|--------|
| **1** | All P0 test cases passed | Required |
| **2** | No open P0/P1 bugs | Required |
| **3** | Performance test passed (≤ 2s response) | Required |
| **4** | Security scan passed (no critical vulns) | Required |
| **5** | UAT signed off by stakeholders | Required |
| **6** | Backup & rollback plan ready | Required |
| **7** | Monitoring & alerting configured | Required |
| **8** | Documentation updated | Required |

---

## APPENDIX

### A. Holiday Calendar (2026)

| Date | Holiday | Notes |
|------|---------|-------|
| Apr 18 | Good Friday | — |
| Apr 20 | Easter Monday | — |
| May 1 | Labor Day | — |
| May 5 | Buddha's Birthday | — |
| **No major holidays** affecting schedule | — |

### B. Important Dates

| Date | Event |
|------|-------|
| Apr 1 | Test kickoff |
| May 5 | Mid-term review |
| Jun 17–23 | UAT & regression |
| Jun 24 | Production launch |

### C. Contact Information

| Role | Name | Email |
|------|------|-------|
| QA Lead | [Name] | qa.lead@eduacas.edu.vn |
| DevOps | [Name] | devops@eduacas.edu.vn |
| Product Owner | [Name] | po@eduacas.edu.vn |

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Apr 1, 2026 | QA Team | Initial draft |
| 1.1 | — | — | — |

---

**Last Updated:** April 1, 2026  
**Next Review:** May 1, 2026  
**Approved By:** ___________________ (QA Lead)
