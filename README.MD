# EduACAS

**Educational Automated Computerized Assessment System**

A comprehensive full-stack platform for programming education that connects lecturers and students in teaching, learning, and practicing programming languages. EduACAS provides automated code assessment, exam management, classroom management, and real-time notifications.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Running with Docker Compose](#running-with-docker-compose)
  - [Running Services Individually](#running-services-individually)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

EduACAS is designed to streamline programming education by automating the assessment of student code submissions. The system supports multiple programming languages, provides real-time feedback, and offers robust examination proctoring features.

**Target Users:**

- **Administrators** - Manage system-wide settings and user accounts
- **Lecturers** - Create problems, manage classrooms, conduct exams, and grade submissions
- **Students** - Practice programming, submit solutions, take quizzes and exams

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | Web application framework |
| [React 18](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS framework |
| [Flutter 3.9](https://flutter.dev/) | Cross-platform mobile development |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management (mobile) |
| [Radix UI](https://radix-ui.com/) | Unstyled, accessible UI components |
| [Flowbite React](https://flowbite.com/) | Tailwind UI component library |
| [Recharts](https://recharts.org/) | Composable charting library |
| [Firebase](https://firebase.google.com/) | Push notifications (mobile) |

### Backend

| Technology | Purpose |
|---|---|
| [.NET 9](https://dotnet.microsoft.com/) | Backend microservices framework |
| [Ocelot](https://ocelot.readthedocs.io/) | API Gateway |
| [DynamoDB](https://aws.amazon.com/dynamodb/) | NoSQL database |
| [Redis](https://redis.io/) | Caching & session storage |
| [RabbitMQ](https://www.rabbitmq.com/) | Message queue |
| [Hangfire](https://www.hangfire.io/) | Background job scheduling |
| [SignalR](https://learn.microsoft.com/aspnet/signalr) | Real-time web communication |
| [JPlag](https://jplag.github.io/jplag/) | Plagiarism detection |
| [NestJS](https://nestjs.com/) | Code runner service |

### Infrastructure

| Technology | Purpose |
|---|---|
| [Docker](https://www.docker.com/) | Containerization |
| [Docker Compose](https://docs.docker.com/compose/) | Multi-container orchestration |
| [AWS S3](https://aws.amazon.com/s3/) | File storage |
| [Google Gemini](https://ai.google.dev/) | AI-powered auto-grading |
| [Azure Form Recognizer](https://azure.microsoft.com/services/form-recognizer/) | OCR for scanned documents |
| [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2) | User authentication |

---

## Project Structure

```
Capstone-Sp26-EduACAS/
├── web_app/                    # Next.js web application
│   ├── src/
│   │   ├── app/                # App router pages
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities and helpers
│   │   ├── services/           # API service layers
│   │   └── types/              # TypeScript type definitions
│   ├── public/                 # Static assets
│   └── package.json
├── mobile_app/                 # Flutter mobile application
│   ├── lib/
│   │   ├── core/               # Core utilities and constants
│   │   ├── data/               # Data layer (models, repositories)
│   │   ├── domain/             # Business logic
│   │   └── presentation/       # UI screens and widgets
│   └── pubspec.yaml
├── servers/                    # .NET 9 backend microservices
│   ├── ApiGateway/             # Ocelot API Gateway
│   │   ├── Configuration/      # Route configurations
│   │   └── Program.cs
│   ├── Services/
│   │   ├── AuthService/        # Authentication & Authorization
│   │   │   ├── Controllers/   # API endpoints
│   │   │   ├── Models/         # DTOs and entities
│   │   │   ├── Services/       # Business logic
│   │   │   └── Program.cs
│   │   └── AcasService/        # Main ACAS business logic
│   │       ├── Controllers/   # API endpoints
│   │       ├── Hubs/           # SignalR hubs
│   │       ├── Models/         # DTOs and entities
│   │       ├── Repositories/   # Data access layer
│   │       ├── Services/       # Business logic
│   │       └── Program.cs
│   └── Tests/                  # Unit test projects
├── code-runner/                # NestJS code execution service
│   ├── src/
│   │   ├── compiler/           # Code compilation handlers
│   │   ├── executor/           # Code execution engine
│   │   └── sandbox/            # Docker-based sandboxing
│   └── test/
├── deploy/                     # Deployment configurations
│   ├── nginx/
│   └── prometheus/
├── docker-compose.yml          # Production deployment
├── docker-compose-local.yml    # Local development
├── .env.example                # Environment variables template
└── README.md
```

---

## Key Features

### 1. User Management & Authentication

- Google OAuth 2.0 integration for seamless login
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Lecturer, Student)
- Redis-backed session caching

### 2. Classroom Management

- Create and manage classrooms with customizable settings
- Student enrollment with enrollment codes
- Discussion forums for class communication
- Announcements and materials distribution
- Real-time progress tracking

### 3. Programming Problem Bank

- Rich problem editor with markdown support
- Multiple difficulty levels (Easy, Medium, Hard)
- Support for multiple programming languages:
  - Java
  - Python
  - C/C++
  - JavaScript
  - And more
- Template code and test case management
- JPlag integration for plagiarism detection

### 4. Automated Code Assessment

- Docker-based secure code execution sandbox
- Comprehensive test case evaluation
- Real-time submission feedback
- AI-powered auto-grading with Google Gemini
- Detailed error reporting and diagnostics

### 5. Examination System

- Flexible exam creation with templates
- Configurable exam settings:
  - Time limits
  - Number of attempts
  - Shuffle questions
  - Proctoring options
- Real-time exam monitoring dashboard
- Keystroke pattern logging for integrity
- Exam log tracking and analytics

### 6. Quiz System

- Multiple choice questions
- Short answer questions
- Auto-grading capabilities
- Quiz attempts and scoring
- Grade calculation and distribution

### 7. Regrading System

- Student request submission workflow
- Lecturer review interface
- Status tracking and notifications
- History preservation

### 8. Academic Analytics

- Student performance dashboard
- Classroom statistics
- Score distribution charts
- Academic warnings system
- Export capabilities

### 9. Real-time Notifications

- SignalR-powered live updates
- Firebase Cloud Messaging for mobile
- In-app notification center
- Email notifications (optional)

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                              Clients                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │   Web App    │  │ Mobile App  │  │     External Services        │ │
│  │  (Next.js)   │  │  (Flutter)  │  │  (Code Runner, JPlag)       │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬──────────────┘ │
└─────────┼─────────────────┼─────────────────────────┼────────────────┘
          │                 │                         │
          ▼                 ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Gateway (Ocelot)                        │
│                          Port: 8080                                 │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ AuthService   │       │  AcasService    │       │ Code Runner     │
│   .NET 9      │       │    .NET 9       │       │   NestJS        │
│   Port: 8081  │       │   Port: 8002    │       │   Port: 5000    │
└───────────────┘       └────────┬────────┘       └─────────────────┘
                                 │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Redis      │       │   DynamoDB     │       │    RabbitMQ     │
│   (Cache)     │       │  (Database)    │       │  (Message Queue)│
└───────────────┘       └─────────────────┘       └─────────────────┘
```

### Backend Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 8080 | Routes requests, rate limiting, Swagger aggregation |
| AuthService | 8081 | User authentication, JWT management, OAuth |
| AcasService | 8002 | Core business logic, repositories, SignalR hubs |
| Code Runner | 5000 | Secure code compilation and execution |

---

## Getting Started

### Prerequisites

- **Docker** (v24.0+) and **Docker Compose** (v2.20+)
- **Node.js** (v20+) - for web app development
- **.NET 9 SDK** - for backend development
- **Flutter SDK 3.9+** - for mobile app development
- **AWS Account** - for DynamoDB and S3 (credentials required)

### Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/your-org/Capstone-Sp26-EduACAS.git
cd Capstone-Sp26-EduACAS
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Configure the `.env` file with your credentials:

```bash
# Required: AWS credentials for DynamoDB & S3
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key

# Required: Google OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Required: JWT configuration (must match in AuthService and AcasService)
JWT_SECRET=your_jwt_secret_here
JWT_ISSUER=AuthService
JWT_AUDIENCE=AcasService

# Optional: AI auto-grading
GEMINI_API_KEY=your_gemini_api_key

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

4. Create DynamoDB tables using the table names defined in `.env`

### Running with Docker Compose

#### Local Development

Start all services with hot-reloading support:

```bash
docker compose -f docker-compose-local.yml up -d
```

Access the services:

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| API Gateway Swagger | http://localhost:8080/swagger/index.html |
| AuthService Swagger | http://localhost:8081/swagger |
| AcasService Swagger | http://localhost:8002/swagger |
| RabbitMQ Management | http://localhost:15672 (admin/admin) |
| Redis Commander | http://localhost:8082 |

#### Production

```bash
docker compose -f docker-compose.yml up -d
```

### Running Services Individually

#### Web Application

```bash
cd web_app
npm install
npm run dev
```

#### Mobile Application

```bash
cd mobile_app
flutter pub get
flutter run
```

#### Backend Services

```bash
cd servers

# Restore dependencies
dotnet restore

# Build all services
dotnet build

# Run AuthService
dotnet run --project Services/AuthService

# Run AcasService (in another terminal)
dotnet run --project Services/AcasService

# Run API Gateway (in another terminal)
dotnet run --project ApiGateway
```

#### Code Runner Service

```bash
cd code-runner
npm install
npm run start:dev
```

---

## API Documentation

### API Gateway Endpoints

The API Gateway routes requests at `http://localhost:8080`:

| Route | Service | Description |
|-------|---------|-------------|
| `/api/auth/*` | AuthService | Authentication endpoints |
| `/api/acas/*` | AcasService | Core ACAS functionality |
| `/swagger` | Aggregated | Unified Swagger UI |

### Key API Modules

- **Auth**: Login, logout, token refresh, password reset
- **Users**: Profile management, role assignment
- **Classrooms**: CRUD operations, enrollment
- **Problems**: Problem management, test cases
- **Submissions**: Code submission, status tracking
- **Examinations**: Exam creation, monitoring, logs
- **Quizzes**: Quiz management, attempts
- **Notifications**: Real-time notifications

---

## Database Schema

EduACAS uses Amazon DynamoDB with the following main tables:

### User & Auth Tables

| Table | Purpose |
|-------|---------|
| `acas-users` | User profiles and account information |
| `acas-user-devices` | Mobile device tokens for push notifications |

### Classroom Tables

| Table | Purpose |
|-------|---------|
| `acas-classrooms` | Classroom metadata |
| `acas-classroom-enrollments` | Student enrollments |
| `acas-subjects` | Subject definitions |
| `acas-slots` | Class schedule slots |
| `acas-materials` | Course materials and files |

### Assessment Tables

| Table | Purpose |
|-------|---------|
| `acas-problems` | Programming problem definitions |
| `acas-submissions` | Code submissions and results |
| `acas-programming-languages` | Supported programming languages |
| `acas-regrading-requests` | Regrading workflow |

### Examination Tables

| Table | Purpose |
|-------|---------|
| `acas-examinations` | Exam definitions |
| `acas-examination-templates` | Reusable exam templates |
| `acas-student-exam-sessions` | Active exam sessions |
| `acas-exam-logs` | Exam activity logs |
| `acas-keystroke-logs` | Keystroke pattern data |

### Quiz Tables

| Table | Purpose |
|-------|---------|
| `acas-quizzes` | Quiz definitions |
| `acas-questions` | Quiz questions |
| `acas-answer-options` | Question answer options |
| `acas-classroom-quizzes` | Classroom quiz assignments |
| `acas-quiz-attempts` | Student quiz attempts |
| `acas-student-answers` | Student answer records |

### Communication Tables

| Table | Purpose |
|-------|---------|
| `acas-discussion-issues` | Discussion forum threads |
| `acas-comments` | Comments on discussions |
| `acas-notifications` | Notification records |

### Analytics Tables

| Table | Purpose |
|-------|---------|
| `acas-academic-warnings` | Academic warning records |
| `acas-error-groups` | Error categorization |

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for DynamoDB/S3 | `ap-southeast-1` |
| `AWS_ACCESS_KEY` | AWS access key | - |
| `AWS_SECRET_KEY` | AWS secret key | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `JWT_SECRET` | Secret for JWT signing | (min 64 char) |
| `REDIS_CONNECTION_STRING` | Redis connection | `redis:6379` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for AI grading |
| `AZURE_FORM_RECOGNIZER_ENDPOINT` | Azure OCR endpoint |
| `AZURE_FORM_RECOGNIZER_API_KEY` | Azure OCR API key |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` | Email configuration |
| `FIREBASE_SERVICE_ACCOUNT_FILE` | Firebase service account JSON |

---

## Deployment

### Production Deployment

1. Configure production environment variables
2. Set up AWS resources (DynamoDB, S3 buckets)
3. Configure SSL/TLS certificates
4. Deploy using Docker Compose:

```bash
docker compose -f docker-compose.yml up -d
```

### Infrastructure Requirements

| Resource | Minimum Specification |
|----------|----------------------|
| CPU | 4 cores |
| Memory | 8 GB RAM |
| Disk | 50 GB SSD |
| Docker | Swarm mode for production |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is part of the Capstone Spring 2026 course. All rights reserved.

---

## Support

For questions and support, please contact the development team.

---

<p align="center">
  <strong>EduACAS</strong> — Empowering Programming Education
</p>
