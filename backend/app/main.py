from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import initialize_database
from app.routers import alerts, auth, detections, health, reports
from app.routers import detection as ai_detection
from app.utils import get_logger

logger = get_logger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=settings.allow_credentials,
    allow_methods=settings.allowed_methods.split(",") if settings.allowed_methods != "*" else ["*"],
    allow_headers=settings.allowed_headers.split(",") if settings.allowed_headers != "*" else ["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(detections.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(ai_detection.router)


@app.on_event("startup")
def startup() -> None:
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    initialize_database()
    logger.info("Database initialized successfully")
    
    # Initialize AI detection system
    try:
        ai_detection.initialize_ai_detection()
        logger.info("AI detection system initialized")
    except Exception as e:
        logger.warning(f"AI detection system initialization failed: {e}")
        logger.warning("AI detection endpoints will not be available")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "RoadGuard AI backend is running."}
