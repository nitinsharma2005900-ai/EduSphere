from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid

from app.config import settings
from app.routers import grading, analytics, utilities

app = FastAPI(
    title="EduSphere Learning Analytics & Grading Microservice",
    description="Domain-specific Python microservice for deterministic assessment grading, cohort analytics, rubric aggregation, and content utilities.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured request correlation ID middleware
@app.middleware("http")
async def add_correlation_and_metrics(request: Request, call_next):
    req_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    response.headers["x-request-id"] = req_id
    response.headers["x-response-time-sec"] = f"{duration:.4f}"
    return response

# Routers
app.include_router(grading.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(utilities.router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "UP",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": time.time()
    }

@app.get("/ready", tags=["Health"])
def readiness_check():
    return {
        "ready": True,
        "dependencies": {
            "grading_engine": "READY",
            "analytics_engine": "READY",
            "csv_processor": "READY"
        }
    }
