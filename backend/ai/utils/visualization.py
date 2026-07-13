"""
Visualization utilities for AI module.
Functions for drawing detections and creating visual outputs.
"""

import cv2
import numpy as np
from typing import Dict, List, Any, Tuple


# Color palette for different classes (BGR format for OpenCV)
CLASS_COLORS = {
    0: (0, 255, 255),    # Cyan for pothole
    1: (0, 0, 255),      # Red for crack
    2: (255, 0, 0),      # Blue for manhole
}


def get_color(class_id: int) -> Tuple[int, int, int]:
    """
    Get color for a class ID.
    
    Args:
        class_id: Class identifier
        
    Returns:
        BGR color tuple
    """
    return CLASS_COLORS.get(class_id, (0, 255, 0))  # Default green


def draw_detections(
    image: np.ndarray,
    detections: List[Dict[str, Any]],
    class_names: Dict[int, str],
    show_confidence: bool = True,
    line_thickness: int = 2,
    font_scale: float = 0.5
) -> np.ndarray:
    """
    Draw bounding boxes and labels on image.
    
    Args:
        image: Input image (numpy array)
        detections: List of detection dictionaries
        class_names: Dictionary mapping class IDs to names
        show_confidence: Whether to show confidence scores
        line_thickness: Thickness of bounding box lines
        font_scale: Scale of font for labels
        
    Returns:
        Annotated image
    """
    # Create a copy to avoid modifying original
    annotated = image.copy()
    
    for detection in detections:
        bbox = detection['bbox']
        class_id = detection['class_id']
        class_name = detection['class_name']
        confidence = detection['confidence']
        
        # Extract coordinates
        x1, y1, x2, y2 = bbox['x1'], bbox['y1'], bbox['x2'], bbox['y2']
        
        # Get color
        color = get_color(class_id)
        
        # Draw bounding box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, line_thickness)
        
        # Prepare label text
        if show_confidence:
            label = f"{class_name}: {confidence:.2f}"
        else:
            label = class_name
        
        # Get label size
        (text_width, text_height), baseline = cv2.getTextSize(
            label,
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale,
            line_thickness
        )
        
        # Draw label background
        label_y1 = max(y1, text_height + 10)
        cv2.rectangle(
            annotated,
            (x1, label_y1 - text_height - baseline - 5),
            (x1 + text_width + baseline, label_y1 + baseline),
            color,
            -1
        )
        
        # Draw label text
        cv2.putText(
            annotated,
            label,
            (x1 + baseline, label_y1 - baseline - 2),
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale,
            (255, 255, 255),
            line_thickness
        )
    
    return annotated


def draw_single_detection(
    image: np.ndarray,
    bbox: Dict[str, int],
    class_name: str,
    confidence: float,
    color: Tuple[int, int, int] = (0, 255, 0),
    line_thickness: int = 2
) -> np.ndarray:
    """
    Draw a single detection on image.
    
    Args:
        image: Input image
        bbox: Bounding box dictionary with x1, y1, x2, y2
        class_name: Class name
        confidence: Confidence score
        color: BGR color tuple
        line_thickness: Line thickness
        
    Returns:
        Annotated image
    """
    annotated = image.copy()
    
    x1, y1, x2, y2 = bbox['x1'], bbox['y1'], bbox['x2'], bbox['y2']
    
    # Draw box
    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, line_thickness)
    
    # Draw label
    label = f"{class_name}: {confidence:.2f}"
    (text_width, text_height), baseline = cv2.getTextSize(
        label,
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        line_thickness
    )
    
    label_y1 = max(y1, text_height + 10)
    cv2.rectangle(
        annotated,
        (x1, label_y1 - text_height - baseline - 5),
        (x1 + text_width + baseline, label_y1 + baseline),
        color,
        -1
    )
    
    cv2.putText(
        annotated,
        label,
        (x1 + baseline, label_y1 - baseline - 2),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (255, 255, 255),
        line_thickness
    )
    
    return annotated


def create_detection_grid(
    images: List[np.ndarray],
    detections: List[List[Dict[str, Any]]],
    class_names: Dict[int, str],
    grid_size: Tuple[int, int] = (3, 3),
    cell_size: Tuple[int, int] = (320, 320)
) -> np.ndarray:
    """
    Create a grid of annotated detection images.
    
    Args:
        images: List of input images
        detections: List of detection lists for each image
        class_names: Dictionary mapping class IDs to names
        grid_size: Grid dimensions (rows, cols)
        cell_size: Size of each cell in grid
        
    Returns:
        Grid image
    """
    rows, cols = grid_size
    cell_width, cell_height = cell_size
    
    # Create blank grid
    grid = np.zeros((rows * cell_height, cols * cell_width, 3), dtype=np.uint8)
    
    # Fill grid with annotated images
    for i, (image, dets) in enumerate(zip(images, detections)):
        if i >= rows * cols:
            break
        
        row = i // cols
        col = i % cols
        
        # Resize image
        resized = cv2.resize(image, (cell_width, cell_height))
        
        # Draw detections
        annotated = draw_detections(resized, dets, class_names)
        
        # Place in grid
        y_start = row * cell_height
        y_end = y_start + cell_height
        x_start = col * cell_width
        x_end = x_start + cell_width
        
        grid[y_start:y_end, x_start:x_end] = annotated
    
    return grid


def draw_confidence_bar(
    image: np.ndarray,
    confidence: float,
    position: Tuple[int, int] = (10, 50),
    size: Tuple[int, int] = (200, 20),
    color: Tuple[int, int, int] = (0, 255, 0)
) -> np.ndarray:
    """
    Draw a confidence bar on image.
    
    Args:
        image: Input image
        confidence: Confidence value (0-1)
        position: (x, y) position of bar
        size: (width, height) of bar
        color: BGR color
        
    Returns:
        Annotated image
    """
    annotated = image.copy()
    x, y = position
    width, height = size
    
    # Draw background
    cv2.rectangle(annotated, (x, y), (x + width, y + height), (50, 50, 50), -1)
    
    # Draw filled portion
    filled_width = int(width * confidence)
    cv2.rectangle(annotated, (x, y), (x + filled_width, y + height), color, -1)
    
    # Draw border
    cv2.rectangle(annotated, (x, y), (x + width, y + height), (255, 255, 255), 1)
    
    # Draw text
    text = f"{confidence:.2f}"
    cv2.putText(
        annotated,
        text,
        (x + 5, y + height - 5),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.4,
        (255, 255, 255),
        1
    )
    
    return annotated


def overlay_heatmap(
    image: np.ndarray,
    detections: List[Dict[str, Any]],
    alpha: float = 0.3
) -> np.ndarray:
    """
    Overlay a heatmap based on detection density.
    
    Args:
        image: Input image
        detections: List of detection dictionaries
        alpha: Transparency of heatmap overlay
        
    Returns:
        Image with heatmap overlay
    """
    heatmap = np.zeros_like(image, dtype=np.float32)
    
    for detection in detections:
        bbox = detection['bbox']
        x1, y1, x2, y2 = bbox['x1'], bbox['y1'], bbox['x2'], bbox['y2']
        
        # Add Gaussian blob at detection center
        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2
        
        # Create simple heatmap point
        cv2.circle(heatmap, (center_x, center_y), 50, (0, 0, 255), -1)
    
    # Normalize heatmap
    if heatmap.max() > 0:
        heatmap = (heatmap / heatmap.max() * 255).astype(np.uint8)
    
    # Apply color map
    heatmap_colored = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    
    # Blend with original image
    result = cv2.addWeighted(image, 1 - alpha, heatmap_colored, alpha, 0)
    
    return result


def resize_with_aspect_ratio(
    image: np.ndarray,
    target_size: Tuple[int, int],
    padding: bool = True,
    padding_color: Tuple[int, int, int] = (0, 0, 0)
) -> np.ndarray:
    """
    Resize image while maintaining aspect ratio.
    
    Args:
        image: Input image
        target_size: (width, height) target size
        padding: Whether to add padding
        padding_color: Color for padding
        
    Returns:
        Resized image
    """
    target_width, target_height = target_size
    h, w = image.shape[:2]
    
    # Calculate scaling factor
    scale = min(target_width / w, target_height / h)
    new_width = int(w * scale)
    new_height = int(h * scale)
    
    # Resize
    resized = cv2.resize(image, (new_width, new_height))
    
    if not padding:
        return resized
    
    # Create canvas
    canvas = np.full((target_height, target_width, 3), padding_color, dtype=np.uint8)
    
    # Calculate padding
    pad_x = (target_width - new_width) // 2
    pad_y = (target_height - new_height) // 2
    
    # Place resized image on canvas
    canvas[pad_y:pad_y + new_height, pad_x:pad_x + new_width] = resized
    
    return canvas
