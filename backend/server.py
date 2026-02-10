from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
import logging
from pathlib import Path

from database import engine, Base

# Route modules
from routes.auth import router as auth_router
from routes.tags import router as tags_router
from routes.tasks import router as tasks_router
from routes.notes import router as notes_router
from routes.posts import router as posts_router
from routes.data import router as data_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Flow API",
    description="Productivity dashboard API with tasks, notes, posts, analytics, and more.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount uploads directory for static files
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# CORS
ALLOWED_ORIGINS = [
    os.environ.get('FRONTEND_URL', 'http://localhost:3000'),
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

# Create a router with the /api prefix and include all route modules
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(tags_router)
api_router.include_router(tasks_router)
api_router.include_router(notes_router)
api_router.include_router(posts_router)
api_router.include_router(data_router)

# Health check and root routes
@api_router.get("/")
async def root():
    return {"message": "Flow API is running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)
