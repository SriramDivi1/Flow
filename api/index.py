import os
import sys

# Add the parent directory to sys.path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app
from backend.server import app

# Vercel needs the variable 'app' to be available for WSGI/ASGI
# This file is the entry point defined in vercel.json rewrites
