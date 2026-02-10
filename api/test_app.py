from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/test_app")
async def root():
    return JSONResponse(content={"message": "FastAPI is working on Vercel!"})
