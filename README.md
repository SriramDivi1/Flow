# Flow - Productivity Dashboard

**Flow** is a modern, full-stack productivity application designed to help users manage tasks, notes, and posts in a unified interface. It features a responsive design, secure authentication, and real-time analytics.

## 📸 Screenshots

![Dashboard](screenshots/dashboard.png)

<p align="center">
  <img src="screenshots/tasks.png" width="45%" />
  <img src="screenshots/create_task.png" width="45%" />
</p>
![Notes](screenshots/notes.png)

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
- **Auth**: Python-Jose (JWT), Passlib (Bcrypt)

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
│   └── server.py       # Application entry point
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

## � API Endpoints

All API routes are prefixed with `/api`. Protected routes require a `Bearer <token>` header.

### Authentication

| Method | Endpoint             | Auth | Description                                       |
| ------ | -------------------- | ---- | ------------------------------------------------- |
| `POST` | `/api/auth/register` | ❌   | Register a new user (rate-limited: 5/min)         |
| `POST` | `/api/auth/login`    | ❌   | Login and receive JWT token (rate-limited: 5/min) |
| `POST` | `/api/auth/refresh`  | ✅   | Refresh an existing JWT token                     |

### Profile

| Method | Endpoint              | Auth | Description                            |
| ------ | --------------------- | ---- | -------------------------------------- |
| `GET`  | `/api/profile`        | ✅   | Get current user's profile             |
| `PUT`  | `/api/profile`        | ✅   | Update profile (name, bio, avatar URL) |
| `POST` | `/api/profile/avatar` | ✅   | Upload avatar image (max 5 MB)         |

### Tasks (CRUD)

| Method   | Endpoint             | Auth | Description                                                                         |
| -------- | -------------------- | ---- | ----------------------------------------------------------------------------------- |
| `GET`    | `/api/tasks`         | ✅   | List tasks (supports `search`, `status`, `priority`, `tag_id` filters + pagination) |
| `POST`   | `/api/tasks`         | ✅   | Create a new task                                                                   |
| `GET`    | `/api/tasks/:id`     | ✅   | Get a specific task                                                                 |
| `PUT`    | `/api/tasks/:id`     | ✅   | Update a task                                                                       |
| `DELETE` | `/api/tasks/:id`     | ✅   | Delete a task                                                                       |
| `POST`   | `/api/tasks/reorder` | ✅   | Reorder tasks by position                                                           |

### Notes (CRUD)

| Method   | Endpoint         | Auth | Description                                                                         |
| -------- | ---------------- | ---- | ----------------------------------------------------------------------------------- |
| `GET`    | `/api/notes`     | ✅   | List notes (supports `search`, `is_pinned`, `color`, `tag_id` filters + pagination) |
| `POST`   | `/api/notes`     | ✅   | Create a new note                                                                   |
| `GET`    | `/api/notes/:id` | ✅   | Get a specific note                                                                 |
| `PUT`    | `/api/notes/:id` | ✅   | Update a note                                                                       |
| `DELETE` | `/api/notes/:id` | ✅   | Delete a note                                                                       |

### Posts (CRUD)

| Method   | Endpoint         | Auth | Description                                                                   |
| -------- | ---------------- | ---- | ----------------------------------------------------------------------------- |
| `GET`    | `/api/posts`     | ✅   | List posts (supports `search`, `is_published`, `tag_id` filters + pagination) |
| `POST`   | `/api/posts`     | ✅   | Create a new post                                                             |
| `GET`    | `/api/posts/:id` | ✅   | Get a specific post                                                           |
| `PUT`    | `/api/posts/:id` | ✅   | Update a post                                                                 |
| `DELETE` | `/api/posts/:id` | ✅   | Delete a post                                                                 |

### Tags

| Method   | Endpoint        | Auth | Description   |
| -------- | --------------- | ---- | ------------- |
| `GET`    | `/api/tags`     | ✅   | List all tags |
| `POST`   | `/api/tags`     | ✅   | Create a tag  |
| `PUT`    | `/api/tags/:id` | ✅   | Update a tag  |
| `DELETE` | `/api/tags/:id` | ✅   | Delete a tag  |

### Dashboard & Analytics

| Method | Endpoint          | Auth | Description                                         |
| ------ | ----------------- | ---- | --------------------------------------------------- |
| `GET`  | `/api/dashboard`  | ✅   | Get dashboard statistics (counts, recent activity)  |
| `GET`  | `/api/analytics`  | ✅   | Get analytics data (configurable `days` param)      |
| `GET`  | `/api/activities` | ✅   | Get activity timeline (filterable by `entity_type`) |
| `POST` | `/api/export`     | ✅   | Export user data (CSV or JSON)                      |

> **Interactive Docs**: Run the backend and visit `http://localhost:8000/docs` for the full Swagger UI.

## �📦 Deliverables & Documentation

- **[Scaling Guide](SCALING.md)**: Production architecture and scaling strategies (Docker, K8s, Redis).
- **API Documentation**: Interactive Swagger UI available at `http://localhost:8000/docs` when running the backend.
- **[OpenAPI Spec](backend/openapi.json)**: OpenAPI 3.0 JSON file — importable into Postman.

---

© 2026 Flow. Built for the **Full Stack Development Assignment**.
