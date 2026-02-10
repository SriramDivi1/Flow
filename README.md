# Flow - Productivity Dashboard

**Flow** is a modern, full-stack productivity application designed to help users manage tasks, notes, and posts in a unified interface. It features a responsive design, secure authentication, and real-time analytics.

## 🚀 Features

### Core Functionality

- **Authentication**: Secure Register/Login system using **JWT** (JSON Web Tokens) with auto-refresh.
- **Dashboard**: Centralized hub with real-time statistics and quick actions.
- **Task Management**: Create, update, delete, and filter tasks. Supports drag-and-drop reordering.
- **Notes**: Rich text note-taking with pinning capability.
- **Posts**: Content management system for draft and published posts.
- **Activity Log**: Track recent actions (e.g., "Created task", "Updated note") in a timeline view.
- **Profile Management**: Update user details and upload avatars.

### Security & Performance

- **Rate Limiting**: Protects auth endpoints from abuse.
- **Input Sanitization**: Prevents SQL injection (using SQLAlchemy/ORM).
- **Optimization**:
  - Combined SQL queries for dashboard stats (8 → 3 queries).
  - Pagination implemented for all list endpoints.
  - React `useMemo` and `useCallback` for frontend performance.

### UI/UX

- **Responsive Design**: Fully optimized for Mobile (collapsible sidebar), Tablet, and Desktop.
- **Theming**: Seamless Dark/Light mode toggle with persisted preference.
- **Smooth Transitions**: Global CSS transitions for theme switching.
- **Analytics**: Visual charts powered by **Recharts**.

## 🛠️ Tech Stack

### Backend

- **Framework**: FastAPI (Python 3.9+)
- **Database**: PostgreSQL (via Supabase), SQLAlchemy (ORM), Alembic (Migrations)
- **Auth**: Typer, Python-Jose (JWT), Passlib (Bcrypt)
- **Testing**: Pytest

### Frontend

- **Framework**: React 19 (Create React App)
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **State Management**: React Context API
- **HTTP Client**: Axios (with Interceptors)
- **Charts**: Recharts

## 📂 Project Structure

```
/
├── backend/
│   ├── alembic/        # Database migrations
│   ├── routes/         # API endpoints (auth, tasks, data)
│   ├── models.py       # Database models
│   ├── schemas.py      # Pydantic validation schemas
│   ├── server.py       # Application entry point
│   └── tests/          # Pytest suite
│
├── frontend/
│   ├── public/         # Static assets (images, icons)
│   ├── src/
│   │   ├── components/ # Reusable UI components (UI kit, Layouts)
│   │   ├── context/    # Global state (Auth, Theme)
│   │   ├── hooks/      # Custom hooks (useAuth, useDebounce)
│   │   ├── pages/      # Application route views
│   │   └── utils/      # Helper functions
│
├── SCALING.md          # Production architecture guide
└── README.md           # Project documentation
```

## ⚙️ Configuration

Create `.env` files in both directories before running the app.

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
REACT_APP_BACKEND_URL=http://localhost:8000
SKIP_PREFLIGHT_CHECK=true
```

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run server (Auto-reloads on change)
uvicorn server:app --reload --port 8000
```

_API Docs available at: http://localhost:8000/docs_

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

_App opens at: http://localhost:3000_

## 🧪 Testing

Run the backend test suite to verify API functionality:

```bash
cd backend
pytest
```

## 📦 Deliverables & Documentation

- **[Scaling Guide](SCALING.md)**: Production architecture and scaling strategies (Docker, K8s, Redis).
- **[API Documentation](backend/openapi.json)**: OpenAPI 3.0 specification file (compatible with Postman).

---

© 2026 Flow. Built for the **Full Stack Development Assignment**.
