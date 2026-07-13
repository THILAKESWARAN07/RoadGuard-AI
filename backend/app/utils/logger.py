import logging
import sys
from logging.handlers import RotatingFileHandler

from app.config import settings


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance."""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, settings.log_level))

    # Avoid adding handlers multiple times
    if logger.handlers:
        return logger

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.log_level))
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler (optional, only if not in debug mode)
    if not settings.debug:
        from pathlib import Path
        logs_dir = Path("logs")
        logs_dir.mkdir(parents=True, exist_ok=True)
        
        file_handler = RotatingFileHandler(
            "logs/app.log", maxBytes=10485760, backupCount=5
        )
        file_handler.setLevel(getattr(logging, settings.log_level))
        file_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger
