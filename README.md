# ILES - Internship Logbook and Evaluation System

A web application for managing student internship placements, logbooks, and evaluations.

## Tech Stack

- **Backend**: Django 4.2 + Django REST Framework + SimpleJWT
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Database**: SQLite (development)

## Prerequisites

- Python 3.9+
- Node.js 18+
- npm

## Project Structure

```
ILES/
├── backend/          # Django REST API
│   ├── config/       # Django settings and main URLs
│   ├── users/        # User authentication and management
│   ├── placements/   # Internship placement management
│   ├── logbook/      # Weekly log entries
│   ├── reviews/      # Supervisor reviews
│   ├── evaluations/  # Final evaluations
│   └── dashboard/    # Dashboard endpoints
└── frontend/         # React application
    └── src/
        ├── components/   # Reusable UI components
        ├── contexts/     # React contexts (Auth)
        ├── pages/        # Page components
        ├── services/     # API service layer
        └── types/        # TypeScript types
```

## Getting Started

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Running Both Servers

You need to run both servers simultaneously in separate terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Authentication

The system uses JWT (JSON Web Tokens) for authentication.

### Registration
- Navigate to `http://localhost:5173/register`
- Required fields:
  - Student Number
  - Full Name
  - Student Email
  - Password (min. 8 characters)

### Login
- Navigate to `http://localhost:5173/login`
- Login with:
  - Student Number
  - Password

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register/` | POST | Register a new user |
| `/api/v1/auth/login/` | POST | Login and get JWT tokens |
| `/api/v1/auth/refresh/` | POST | Refresh access token |
| `/api/v1/users/me/` | GET | Get current user profile |
| `/api/v1/placements/` | GET, POST | List/create placements |
| `/api/v1/logs/` | GET, POST | List/create weekly logs |
| `/api/v1/reviews/` | GET, POST | List/create reviews |
| `/api/v1/evaluations/` | GET, POST | List/create evaluations |

## User Roles

- **Student**: Submit weekly logs, view evaluations
- **Workplace Supervisor**: Review student logs
- **Academic Supervisor**: Review student logs, submit evaluations
- **Admin**: Full system access

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Development

### Backend Commands

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test
```

### Frontend Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```
