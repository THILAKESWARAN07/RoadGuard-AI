from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="RoadGuard AI", description="Application name")
    app_version: str = Field(default="0.1.0", description="Application version")
    debug: bool = Field(default=False, description="Debug mode")
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", description="Logging level"
    )

    # Database
    database_url: str = Field(
        default="sqlite:///./data/roadguard.db", description="Database connection URL"
    )

    # Security
    secret_key: str = Field(
        default="change-this-secret-key-in-production", description="Secret key for JWT"
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(
        default=30, description="Access token expiration in minutes"
    )

    # File Upload
    upload_directory: str = Field(default="./uploads", description="Upload directory")
    max_upload_size_mb: int = Field(default=10, description="Maximum upload size in MB")
    allowed_image_types: str = Field(
        default="image/jpeg,image/png,image/webp", description="Allowed image MIME types"
    )

    @field_validator("upload_directory")
    @classmethod
    def ensure_upload_directory(cls, v: str) -> str:
        """Ensure upload directory exists."""
        upload_path = Path(v)
        upload_path.mkdir(parents=True, exist_ok=True)
        return str(upload_path.absolute())

    # AI/ML Configuration
    yolo_model_path: str = Field(
        default="./models/yolov8n.pt", description="Path to YOLO model"
    )
    yolo_confidence_threshold: float = Field(
        default=0.5, ge=0.0, le=1.0, description="YOLO confidence threshold"
    )
    yolo_iou_threshold: float = Field(
        default=0.45, ge=0.0, le=1.0, description="YOLO IoU threshold"
    )

    # Maps Configuration
    google_maps_api_key: str = Field(
        default="", description="Google Maps API key"
    )
    default_latitude: float = Field(default=28.6139, description="Default latitude")
    default_longitude: float = Field(default=77.2090, description="Default longitude")

    # CORS Configuration
    allowed_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        description="Allowed CORS origins (comma-separated)"
    )
    allowed_methods: str = Field(default="*", description="Allowed CORS methods")
    allowed_headers: str = Field(default="*", description="Allowed CORS headers")
    allow_credentials: bool = Field(default=True, description="Allow CORS credentials")

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse allowed origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def allowed_image_types_list(self) -> list[str]:
        """Parse allowed image types into a list."""
        return [t.strip() for t in self.allowed_image_types.split(",")]

    # Cache Configuration
    redis_url: str = Field(default="redis://localhost:6379/0", description="Redis URL")
    cache_ttl_seconds: int = Field(default=300, description="Cache TTL in seconds")

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, description="Rate limit per minute")
    rate_limit_per_hour: int = Field(default=1000, description="Rate limit per hour")

    # Background Tasks
    celery_broker_url: str = Field(
        default="redis://localhost:6379/1", description="Celery broker URL"
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/2", description="Celery result backend"
    )

    # Email Configuration
    smtp_host: str = Field(default="smtp.gmail.com", description="SMTP host")
    smtp_port: int = Field(default=587, description="SMTP port")
    smtp_user: str = Field(default="", description="SMTP username")
    smtp_password: str = Field(default="", description="SMTP password")
    smtp_from: str = Field(default="noreply@roadguard.ai", description="From email address")

    # Monitoring
    sentry_dsn: str = Field(default="", description="Sentry DSN for error tracking")
    prometheus_port: int = Field(default=9090, description="Prometheus metrics port")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
