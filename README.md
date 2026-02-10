<div align="center">
  <h1>🌊 Flow</h1>
  <h3>The Ultimate Full-Stack Productivity Dashboard</h3>
  <p>Manage tasks, notes, and posts in one unified, beautiful interface.</p>

  <p>
    <a href="https://flow-app-zeta.vercel.app">
      <img src="https://img.shields.io/badge/🚀_Live_Demo-Visit_Now-00D1B2?style=for-the-badge&logo=vercel" alt="Live Demo" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy" />
    <br />
    <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
  </p>
</div>

<br />

## 📸 Screenshots

![Dashboard](screenshots/dashboard.png)

<p align="center">
  <img src="screenshots/tasks.png" width="48%" />
  <img src="screenshots/create_task.png" width="48%" />
</p>

![Notes](screenshots/notes.png)

<br />

## 🚀 Features

### Core Functionality

- 🔐 **Secure Auth**: JWT-based authentication with auto-refresh mechanism.
- 📊 **Dashboard**: Real-time overview of your productivity stats.
- ✅ **Task Management**: Create, filter, prioritize, and drag-and-drop reorder tasks.
- 📝 **Rich Notes**: Create and pin notes with a clean editor.
- ✍️ **Posts**: CMS-style post management with draft/publish states.
- 👤 **Profile**: Customizable user profiles with avatar uploads.

### Performance & Security

- 🛡️ **Rate Limiting**: API endpoints protected against abuse.
- ⚡ **Optimized Queries**: Dashboard stats aggregated efficiently (80% fewer queries).
- 📱 **Responsive**: Mobile-first design that works perfectly on all devices.
- 🌓 **Dark Mode**: Beautiful dark/light theme switching.

<br />

## 🛠️ Tech Stack

### Backend

- **FastAPI**: High-performance async Python web framework.
- **Supabase (PostgreSQL)**: Scalable relational database.
- **SQLAlchemy (Async)**: Modern ORM for database interactions.
- **Alembic**: Database migration management.

### Frontend

- **React 19**: Latest React features with functional components.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **Recharts**: Composable charting library for analytics.
- **Lucide React**: Beautiful & consistent icon set.

<br />

## ⚡ Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

<br />

## 📂 Project Structure

```bash
/
├── backend/          # FastAPI application
│   ├── routes/       # API endpoints
│   ├── models.py     # Database models
│   └── server.py     # Entry point
│
├── frontend/         # React application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route views
│   │   └── context/     # Global state
│
└── screenshots/      # Demo images
```

<br />

---

<p align="center">
  Made with ❤️ by <strong>Sriram Naidu</strong> for the Full Stack Assignment.
</p>
