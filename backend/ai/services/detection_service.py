"""
Detection Service for RoadGuard AI
Handles detection processing, severity calculation, and summary statistics.
"""

import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import time

from ai.inference.detector import RoadDamageDetector
from ai.utils.logger import get_logger

logger = get_logger(__name__)


class DetectionService:
    """
    Service for processing road damage detections.
    
    Responsibilities:
    - Accept uploaded image path
    - Validate file exists
    - Call detector.predict_image()
    - Calculate severity for each detection
    - Calculate summary statistics
    - Return clean JSON-ready dictionary
    
    Does NOT:
    - Save files
    - Write to database
    - Perform visualization
    - Draw on images
    """
    
    def __init__(self, detector: RoadDamageDetector):
        """
        Initialize the detection service with a RoadDamageDetector instance.
        
        Args:
            detector: RoadDamageDetector instance (must be reused, not recreated)
        """
        self.detector = detector
        logger.info("DetectionService initialized with RoadDamageDetector")
    
    def _calculate_severity(self, area: int) -> str:
        """
        Calculate severity based on bounding box area.
        
        Args:
            area: Bounding box area in pixels
            
        Returns:
            Severity level: 'Low', 'Medium', or 'High'
        """
        if area < 3000:
            return 'Low'
        elif area < 9000:
            return 'Medium'
        else:
            return 'High'
    
    def _calculate_summary(
        self,
        detections: List[Dict[str, Any]],
        processing_time_ms: float
    ) -> Dict[str, Any]:
        """
        Calculate summary statistics for detections.
        
        Args:
            detections: List of detection dictionaries
            processing_time_ms: Processing time in milliseconds
            
        Returns:
            Summary dictionary with statistics
        """
        total_detections = len(detections)
        
        if total_detections == 0:
            return {
                'total_detections': 0,
                'pothole_count': 0,
                'manhole_count': 0,
                'highest_severity': 'None',
                'average_confidence': 0.0,
                'processing_time_ms': processing_time_ms
            }
        
        # Count by class
        pothole_count = sum(1 for d in detections if d['class_name'] == 'pothole')
        manhole_count = sum(1 for d in detections if d['class_name'] == 'manhole')
        
        # Calculate average confidence
        avg_confidence = sum(d['confidence'] for d in detections) / total_detections
        
        # Determine highest severity
        severity_order = {'Low': 0, 'Medium': 1, 'High': 2}
        highest_severity = max(
            detections,
            key=lambda d: severity_order.get(d['severity'], 0)
        )['severity']
        
        return {
            'total_detections': total_detections,
            'pothole_count': pothole_count,
            'manhole_count': manhole_count,
            'highest_severity': highest_severity,
            'average_confidence': avg_confidence,
            'processing_time_ms': processing_time_ms
        }
    
    def _validate_image_path(self, image_path: str) -> None:
        """
        Validate that the image path exists and is readable.
        
        Args:
            image_path: Path to image file
            
        Raises:
            FileNotFoundError: If image does not exist
            ValueError: If path is invalid
        """
        if not image_path:
            raise ValueError("Image path cannot be empty")
        
        image_file = Path(image_path)
        if not image_file.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        if not image_file.is_file():
            raise ValueError(f"Path is not a file: {image_path}")
    
    def process_image(self, image_path: str) -> Dict[str, Any]:
        """
        Process an image for road damage detection.
        
        Args:
            image_path: Path to input image
            
        Returns:
            Dictionary containing status, summary, and detections
        """
        start_time = time.time()
        
        try:
            logger.info(f"Processing image: {image_path}")
            
            # Validate image path
            self._validate_image_path(image_path)
            
            # Run detection
            detections = self.detector.predict_image(image_path)
            
            # Calculate severity for each detection
            for detection in detections:
                detection['severity'] = self._calculate_severity(detection['area'])
            
            # Calculate processing time
            processing_time_ms = (time.time() - start_time) * 1000
            
            # Calculate summary
            summary = self._calculate_summary(detections, processing_time_ms)
            
            result = {
                'status': 'success',
                'image': image_path,
                'summary': summary,
                'detections': detections
            }
            
            logger.info(f"Processing complete: {summary['total_detections']} detections")
            
            return result
            
        except FileNotFoundError as e:
            logger.error(f"Image not found: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'summary': {'total_detections': 0},
                'detections': []
            }
        except ValueError as e:
            logger.error(f"Invalid image path: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'summary': {'total_detections': 0},
                'detections': []
            }
        except Exception as e:
            logger.error(f"Unexpected error during detection: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'summary': {'total_detections': 0},
                'detections': []
            }
    
    def save_detection(self, detection: Dict[str, Any]) -> None:
        """
        Save detection result (placeholder).
        
        Args:
            detection: Detection dictionary to save
            
        TODO: Implement file saving logic
        """
        # TODO: Implement file saving logic
        logger.warning("save_detection() not implemented yet")
        pass
    
    def store_database(self, detection: Dict[str, Any]) -> None:
        """
        Store detection in database (placeholder).
        
        Args:
            detection: Detection dictionary to store
            
        TODO: Implement database storage logic
        """
        # TODO: Implement database storage logic
        logger.warning("store_database() not implemented yet")
        pass
    
    def save_image(self, image_path: str, output_path: str) -> None:
        """
        Save image to specified location (placeholder).
        
        Args:
            image_path: Source image path
            output_path: Destination image path
            
        TODO: Implement image saving logic
        """
        # TODO: Implement image saving logic
        logger.warning("save_image() not implemented yet")
        pass
