import os
import sys

# Add both the project root and the backend directory to sys.path
# The backend modules use relative imports (e.g. "from database import ...")
# so we need the backend dir in the path for those to resolve
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(project_root, 'backend')

if project_root not in sys.path:
    sys.path.insert(0, project_root)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the FastAPI app
from backend.server import app

# Vercel needs the variable 'app' to be available for ASGI
# This file is the entry point defined in vercel.json routes
