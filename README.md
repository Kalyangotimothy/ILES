<<<<<<< HEAD
[![Build status](https://github.com/git/git/workflows/CI/badge.svg)](https://github.com/git/git/actions?query=branch%3Amaster+event%3Apush)

Git - fast, scalable, distributed revision control system
=========================================================

Git is a fast, scalable, distributed revision control system with an
unusually rich command set that provides both high-level operations
and full access to internals.

Git is an Open Source project covered by the GNU General Public
License version 2 (some parts of it are under different licenses,
compatible with the GPLv2). It was originally written by Linus
Torvalds with help of a group of hackers around the net.

Please read the file [INSTALL][] for installation instructions.

Many Git online resources are accessible from <https://git-scm.com/>
including full documentation and Git related tools.

See [Documentation/gittutorial.adoc][] to get started, then see
[Documentation/giteveryday.adoc][] for a useful minimum set of commands, and
`Documentation/git-<commandname>.adoc` for documentation of each command.
If git has been correctly installed, then the tutorial can also be
read with `man gittutorial` or `git help tutorial`, and the
documentation of each command with `man git-<commandname>` or `git help
<commandname>`.

CVS users may also want to read [Documentation/gitcvs-migration.adoc][]
(`man gitcvs-migration` or `git help cvs-migration` if git is
installed).

The user discussion and development of Git take place on the Git
mailing list -- everyone is welcome to post bug reports, feature
requests, comments and patches to git@vger.kernel.org (read
[Documentation/SubmittingPatches][] for instructions on patch submission
and [Documentation/CodingGuidelines][]).

Those wishing to help with error message, usage and informational message
string translations (localization l10) should see [po/README.md][]
(a `po` file is a Portable Object file that holds the translations).

To subscribe to the list, send an email to <git+subscribe@vger.kernel.org>
(see https://subspace.kernel.org/subscribing.html for details). The mailing
list archives are available at <https://lore.kernel.org/git/>,
<https://marc.info/?l=git> and other archival sites.

Issues which are security relevant should be disclosed privately to
the Git Security mailing list <git-security@googlegroups.com>.

The maintainer frequently sends the "What's cooking" reports that
list the current status of various development topics to the mailing
list.  The discussion following them give a good reference for
project status, development direction and remaining tasks.

The name "git" was given by Linus Torvalds when he wrote the very
first version. He described the tool as "the stupid content tracker"
and the name as (depending on your mood):

 - random three-letter combination that is pronounceable, and not
   actually used by any common UNIX command.  The fact that it is a
   mispronunciation of "get" may or may not be relevant.
 - stupid. contemptible and despicable. simple. Take your pick from the
   dictionary of slang.
 - "global information tracker": you're in a good mood, and it actually
   works for you. Angels sing, and a light suddenly fills the room.
 - "goddamn idiotic truckload of sh*t": when it breaks

[INSTALL]: INSTALL
[Documentation/gittutorial.adoc]: Documentation/gittutorial.adoc
[Documentation/giteveryday.adoc]: Documentation/giteveryday.adoc
[Documentation/gitcvs-migration.adoc]: Documentation/gitcvs-migration.adoc
[Documentation/SubmittingPatches]: Documentation/SubmittingPatches
[Documentation/CodingGuidelines]: Documentation/CodingGuidelines
[po/README.md]: po/README.md
=======
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

cd backend
python -m venv venv
# Linux/macOS: source venv/bin/activate | Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

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
>>>>>>> 8255b558b2e9c9e118a8b5d52ecb484ca28a46d5
