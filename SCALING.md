# Scaling & Production Architecture

This document outlines the strategy for scaling the **Flow** application from a single-server prototype to a high-availability production system.

## 1. Architecture Overview

### Current State (Development)

- **Frontend**: React (SPA) served via `npm start` (webpack dev server).
- **Backend**: FastAPI running on `uvicorn` (single worker).
- **Database**: SQLite (local file).
- **Auth**: Local JWT handling.

### Target State (Production)

- **Frontend**: Static assets hosted on CDNs (Cloudflare/AWS CloudFront).
- **Backend**: Dockerized FastAPI containers orchestrated by Kubernetes (K8s) or AWS ECS.
- **Database**: Managed PostgreSQL (AWS RDS / Google Cloud SQL) with connection pooling.
- **Cache**: Redis for session management and API response caching.

---

## 2. Frontend Scaling

### Content Delivery Network (CDN)

- **Strategy**: Build the React app (`npm run build`) and upload the `build/` directory to **AWS S3** or **Vercel/Netlify**.
- **Benefit**: Serves static assets (JS, CSS, Images) from edge locations closer to the user, strictly reducing latency.
- **Caching**: Implement `Cache-Control` headers. Immutable assets (hashed filenames) can be cached indefinitely (`max-age=31536000`).

### Optimization

- **Code Splitting**: Use `React.lazy()` or Next.js dynamic imports to split bundles by route.
- **Image Optimization**: Serve images in **WebP** format and use responsive `srcset`.

---

## 3. Backend Scaling

### Containerization (Docker)

- Wrap the FastAPI application in a `Dockerfile` (using `python:3.9-slim`).
- Use **Gunicorn** as a process manager with Uvicorn workers (`gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`) to utilize multiple CPU cores.

### Horizontal Scaling

- **Load Balancer**: Place **Nginx** or an **Application Load Balancer (ALB)** in front of the backend instances.
- **Auto-Scaling**: Configure K8s Horizontal Pod Autoscaler (HPA) to add more pods when CPU usage exceeds 70%.

---

## 4. Database Scaling

### PostgreSQL (Supabase)

- **Current Status**: The application is already connected to **Supabase PostgreSQL**.
- **Connection Pooling**: The connection string uses the **Supabase Transaction Pooler** (port 6543), which effectively handles high-concurrency connections without overloading the database.

### Read/Write Splitting

- **Strategy**: For extreme scale, configure **Read Replicas** in Supabase/AWS strategies.
- **Optimization**: Ensure proper indexing on frequently queried columns (e.g., `user_id`, `status`).

### Caching Layer (Redis)

- **Primary Node**: Handles all **WRITE** operations.
- **Read Replicas**: Multiple read-only copies handle **READ** traffic (e.g., fetching dashboard stats).
- **Router**: The backend selects the appropriate database based on the operation type.

- **Session Data**: Store standard sessions or frequent user profile data in Redis.
- **Expensive Queries**: Cache complex aggregations (like Analytics stats) for short durations (e.g., 60 seconds).

---

## 5. CI/CD Pipeline

- **GitHub Actions**:
  - Run Unit & Integration Tests on every PR.
  - Build Docker images and push to ECR/Docker Hub.
  - Deploy to Staging/Production environments using Helm charts.

---

## Summary Checklist for Production Launch

- [ ] Replace SQLite with PostgreSQL.
- [ ] Dockerize Backend.
- [ ] Set up Nginx/ALB.
- [ ] Deploy Frontend to Vercel/S3+CloudFront.
- [ ] Configure Environment Variables (Secrets Management).
