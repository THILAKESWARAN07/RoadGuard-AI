"""
Logger utility for AI module.
Standalone logger that doesn't depend on app module.
"""

import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler


def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger instance for AI module.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Avoid adding handlers multiple times
    if logger.handlers:
        return logger

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler (optional)
    base_dir = Path(__file__).resolve().parents[3]
    logs_dir = base_dir / "backend" / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    
    file_handler = RotatingFileHandler(
        logs_dir / "ai.log", maxBytes=10485760, backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    return logger


__all__ = ["get_logger"]
