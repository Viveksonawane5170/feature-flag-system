from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.routers.auth import router as auth_router
from app.routers.protected import router as protected_router
app = FastAPI(
    title="Feature Flag Management System",
    description="API for managing feature flags",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(protected_router)


@app.get("/")
def home():
    return {"message": "Feature Flag Management System API is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
