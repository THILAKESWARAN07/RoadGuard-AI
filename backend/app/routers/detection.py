"""
AI Detection Router for RoadGuard AI
Handles image upload and AI-based road damage detection.
"""

import os
import shutil
import uuid
from pathlib import Path
from typing import Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse

from ai.inference.detector import RoadDamageDetector
from ai.services.detection_service import DetectionService
from ai.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/detect", tags=["AI Detection"])

# Global detector and service instances (loaded once at startup)
_detector: RoadDamageDetector = None
_detection_service: DetectionService = None

# Configuration
UPLOAD_DIR = Path("uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def get_detector() -> RoadDamageDetector:
    """Get the global detector instance."""
    global _detector
    if _detector is None:
        raise RuntimeError("Detector not initialized")
    return _detector


def get_detection_service() -> DetectionService:
    """Get the global detection service instance."""
    global _detection_service
    if _detection_service is None:
        raise RuntimeError("Detection service not initialized")
    return _detection_service


def initialize_ai_detection():
    """
    Initialize AI detection system on startup.
    This is called when FastAPI starts up.
    """
    global _detector, _detection_service
    
    try:
        logger.info("Initializing AI detection system...")
        
        # Create uploads directory
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        logger.info(f"Uploads directory: {UPLOAD_DIR.absolute()}")
        
        # Initialize detector - use absolute path
        model_path = Path(__file__).resolve().parents[2] / "ai" / "models" / "best.pt"
        logger.info(f"Loading model from: {model_path}")
        
        _detector = RoadDamageDetector(
            model_path=str(model_path),
            conf_threshold=0.25,
            iou_threshold=0.45,
            class_names={0: 'pothole', 1: 'manhole'}
        )
        
        # Initialize detection service
        _detection_service = DetectionService(_detector)
        
        logger.info("AI detection system initialized successfully")
        
    except FileNotFoundError as e:
        logger.error(f"Model file not found: {e}")
        logger.warning("AI detection will not be available until model is placed at backend/ai/models/best.pt")
    except Exception as e:
        logger.error(f"Failed to initialize AI detection: {e}")
        logger.warning("AI detection endpoints will not be available")
        # Do not raise - allow server to start even if AI fails


def _validate_upload_file(file: UploadFile) -> None:
    """
    Validate uploaded file.
    
    Args:
        file: UploadFile object
        
    Raises:
        HTTPException: If file is invalid
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )


def _save_temp_file(file: UploadFile) -> Path:
    """
    Save uploaded file to temporary location.
    
    Args:
        file: UploadFile object
        
    Returns:
        Path to saved file
    """
    # Generate unique filename
    file_ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    temp_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with temp_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"Saved temporary file: {temp_path}")
        return temp_path
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file"
        )


def _cleanup_temp_file(file_path: Path) -> None:
    """
    Delete temporary file.
    
    Args:
        file_path: Path to file to delete
    """
    try:
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to cleanup temporary file {file_path}: {e}")


@router.post("", response_model=Dict[str, Any])
async def detect_road_damage(image: UploadFile = File(...)):
    """
    Detect road damage from uploaded image.
    
    Args:
        image: Uploaded image file
        
    Returns:
        Detection results with summary and detections
    """
    # Check if detection service is initialized
    service = get_detection_service()
    
    temp_file_path = None
    
    try:
        logger.info(f"Detection request received: {image.filename}")
        
        # Validate file
        _validate_upload_file(image)
        
        # Save temporary file
        temp_file_path = _save_temp_file(image)
        
        # Process image
        logger.info("Starting AI detection...")
        result = service.process_image(str(temp_file_path))
        
        # Check if processing was successful
        if result['status'] == 'error':
            logger.error(f"Detection failed: {result.get('error')}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get('error', 'Detection failed')
            )
        
        # Return success response
        logger.info(f"Detection completed: {result['summary']['total_detections']} detections")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                'status': 'success',
                'summary': result['summary'],
                'detections': result['detections']
            }
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error during detection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )
    finally:
        # Cleanup temporary file
        if temp_file_path:
            _cleanup_temp_file(temp_file_path)


@router.get("/health", response_model=Dict[str, Any])
async def detection_health():
    """
    Get AI detection system health status.
    
    Returns:
        Health status with model information
    """
    try:
        detector = get_detector()
        
        # Determine device string
        if detector.device == 0 or detector.device == '0':
            device = 'cuda'
        else:
            device = 'cpu'
        
        return {
            'model_loaded': detector.model is not None,
            'device': device,
            'classes': ['pothole', 'manhole'],
            'model_path': detector.model_path,
            'confidence_threshold': detector.conf_threshold,
            'iou_threshold': detector.iou_threshold
        }
    except RuntimeError as e:
        # Detector not initialized
        return {
            'model_loaded': False,
            'error': str(e),
            'device': 'cpu',
            'classes': []
        }
    except Exception as e:
        # Unexpected error
        return {
            'model_loaded': False,
            'error': str(e),
            'device': 'cpu',
            'classes': []
        }
