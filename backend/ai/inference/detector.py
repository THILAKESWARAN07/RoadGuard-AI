"""
Road Damage Detection Engine
Lightweight detector class that only loads model and performs predictions.
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import cv2
import numpy as np

from ai.utils.logger import get_logger

logger = get_logger(__name__)


class RoadDamageDetector:
    """
    Lightweight detector class for road damage detection using YOLOv8.
    
    Responsibilities:
    - Load YOLO model once and keep in memory
    - Perform predictions on images, videos, and frames
    - Return clean detection dictionaries
    
    Does NOT:
    - Save images
    - Talk to database
    - Handle HTTP requests
    - Calculate severity
    """
    
    def __init__(
        self,
        model_path: str,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        device: str = 'auto',
        class_names: Optional[Dict[int, str]] = None
    ):
        """
        Initialize the detector and automatically load the model.
        
        Args:
            model_path: Path to YOLO model weights (.pt file)
            conf_threshold: Confidence threshold for detections
            iou_threshold: IoU threshold for NMS
            device: Device to use ('auto', 'cuda', 'cpu')
            class_names: Dictionary mapping class IDs to names
        """
        self.model_path = model_path
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.class_names = class_names or {0: 'pothole', 1: 'manhole'}
        self.model = None
        
        # Detect and set device
        self._detect_device()
        
        # Auto-load model on initialization
        self._load_model()
        
        logger.info(f"RoadDamageDetector initialized with model: {model_path}")
    
    def _detect_device(self) -> None:
        """
        Detect the available device (CUDA or CPU) at startup.
        """
        try:
            import torch
            if torch.cuda.is_available():
                self.device = 0  # CUDA device index
                logger.info("CUDA available, using GPU")
            else:
                self.device = "cpu"
                logger.info("CUDA not available, using CPU")
        except ImportError:
            self.device = "cpu"
            logger.warning("PyTorch not installed, using CPU")
        except Exception as e:
            self.device = "cpu"
            logger.warning(f"Failed to detect CUDA, using CPU: {e}")
    
    def _load_model(self) -> None:
        """
        Load the YOLO model and keep it in memory.
        
        Raises:
            FileNotFoundError: If model file does not exist
            ImportError: If ultralytics is not installed
        """
        logger.info(f"Loading model from {self.model_path}")
        
        model_file = Path(self.model_path)
        if not model_file.exists():
            raise FileNotFoundError(f"Model file not found: {self.model_path}")
        
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            logger.info("Model loaded successfully and kept in memory")
        except ImportError:
            raise ImportError("Ultralytics YOLO not installed. Install with: pip install ultralytics")
    
    def predict_image(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Run prediction on a single image.
        
        Args:
            image_path: Path to input image
            
        Returns:
            List of detection dictionaries with class, confidence, bbox, area
        """
        logger.info(f"Predicting on {image_path}")
        
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Run inference
        results = self.model(
            image_path,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            device=self.device,
            verbose=False
        )
        
        # Parse results into clean dictionaries
        detections = self._parse_results(results[0], image.shape[:2])
        
        logger.info(f"Found {len(detections)} detections")
        
        return detections
    
    def predict_video(self, video_path: str) -> List[List[Dict[str, Any]]]:
        """
        Run prediction on a video file.
        
        Args:
            video_path: Path to input video
            
        Returns:
            List of frame detections (each frame is a list of detections)
        """
        logger.info(f"Predicting on video {video_path}")
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        logger.info(f"Video has {total_frames} frames")
        
        # Process frames
        all_detections = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            if frame_count % 30 == 0:
                logger.info(f"Processing frame {frame_count}/{total_frames}")
            
            # Run inference
            results = self.model(
                frame,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                device=self.device,
                verbose=False
            )
            
            # Parse results
            detections = self._parse_results(results[0], frame.shape[:2])
            all_detections.append(detections)
        
        # Cleanup
        cap.release()
        
        logger.info(f"Processed {frame_count} frames")
        
        return all_detections
    
    def predict_frame(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Run prediction on a single frame (numpy array).
        
        Args:
            frame: Input frame as numpy array (BGR format)
            
        Returns:
            List of detection dictionaries with class, confidence, bbox, area
        """
        # Run inference
        results = self.model(
            frame,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            device=self.device,
            verbose=False
        )
        
        # Parse results into clean dictionaries
        detections = self._parse_results(results[0], frame.shape[:2])
        
        return detections
    
    def _parse_results(
        self,
        result: Any,
        image_shape: Tuple[int, int]
    ) -> List[Dict[str, Any]]:
        """
        Parse YOLO results into clean detection dictionaries.
        
        Args:
            result: YOLO result object
            image_shape: Image shape (height, width)
            
        Returns:
            List of detection dictionaries with class, confidence, bbox, area
        """
        detections = []
        
        if result.boxes is None:
            return detections
        
        boxes = result.boxes
        height, width = image_shape
        
        for i in range(len(boxes)):
            box = boxes.xyxy[i].cpu().numpy()  # x1, y1, x2, y2
            conf = float(boxes.conf[i].cpu().numpy())
            class_id = int(boxes.cls[i].cpu().numpy())
            
            x1, y1, x2, y2 = box
            bbox_width = int(x2 - x1)
            bbox_height = int(y2 - y1)
            area = bbox_width * bbox_height
            
            detection = {
                'class_id': class_id,
                'class_name': self.class_names.get(class_id, f'class_{class_id}'),
                'confidence': conf,
                'bbox': {
                    'x1': int(x1),
                    'y1': int(y1),
                    'x2': int(x2),
                    'y2': int(y2),
                    'width': bbox_width,
                    'height': bbox_height
                },
                'area': area
            }
            
            detections.append(detection)
        
        return detections
