"""
Helper functions for AI module.
"""

import sys
from pathlib import Path
from typing import List, Tuple

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from backend.ai.utils.logger import get_logger

logger = get_logger(__name__)


def validate_environment() -> bool:
    """
    Validate Python environment and required packages.
    
    Returns:
        True if environment is valid
    """
    logger.info("Checking Python environment...")
    
    # Check Python version
    python_version = sys.version_info
    logger.info(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        raise RuntimeError("Python 3.8+ is required")
    
    # Check required packages
    required_packages = {
        'torch': 'PyTorch',
        'cv2': 'OpenCV',
        'yaml': 'PyYAML',
        'numpy': 'NumPy'
    }
    
    missing_packages = []
    for module_name, package_name in required_packages.items():
        try:
            __import__(module_name)
            logger.info(f"✓ {package_name} installed")
        except ImportError:
            logger.warning(f"✗ {package_name} not installed")
            missing_packages.append(package_name)
    
    # Check ultralytics specifically
    try:
        from ultralytics import YOLO
        logger.info("✓ Ultralytics YOLO installed")
    except ImportError:
        logger.warning("✗ Ultralytics YOLO not installed")
        missing_packages.append("Ultralytics")
    
    if missing_packages:
        raise RuntimeError(
            f"Missing required packages: {', '.join(missing_packages)}. "
            "Install with: pip install ultralytics torch opencv-python pyyaml numpy"
        )
    
    logger.info("✓ Environment validation passed")
    return True


def validate_dataset_structure(dataset_path: Path) -> bool:
    """
    Validate that dataset has the required folder structure.
    
    Args:
        dataset_path: Path to dataset directory
        
    Returns:
        True if structure is valid
    """
    logger.info(f"Validating dataset structure at: {dataset_path}")
    
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset directory does not exist: {dataset_path}")
    
    required_folders = ['train', 'valid', 'test']
    for split in required_folders:
        split_path = dataset_path / split
        if not split_path.exists():
            raise FileNotFoundError(f"Missing {split} folder at {split_path}")
        
        images_path = split_path / 'images'
        labels_path = split_path / 'labels'
        
        if not images_path.exists():
            raise FileNotFoundError(f"Missing {split}/images folder")
        
        if not labels_path.exists():
            raise FileNotFoundError(f"Missing {split}/labels folder")
        
        # Count files
        image_count = len(list(images_path.glob("*.jpg")))
        label_count = len(list(labels_path.glob("*.txt")))
        
        logger.info(f"  {split}: {image_count} images, {label_count} labels")
        
        if image_count == 0:
            logger.warning(f"  No images found in {split}/images")
        
        if label_count == 0:
            logger.warning(f"  No labels found in {split}/labels")
    
    logger.info("✓ Dataset structure validation passed")
    return True


def validate_image_file(image_path: Path) -> bool:
    """
    Validate that an image file is readable.
    
    Args:
        image_path: Path to image file
        
    Returns:
        True if image is valid
    """
    try:
        import cv2
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")
        return True
    except Exception as e:
        logger.error(f"Image validation failed for {image_path}: {e}")
        return False


def get_device() -> str:
    """
    Determine the best available device for training/inference.
    
    Returns:
        Device string ('cuda', 'cpu', etc.)
    """
    try:
        import torch
        if torch.cuda.is_available():
            return 'cuda'
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return 'mps'
    except ImportError:
        pass
    
    return 'cpu'


def ensure_directory(path: Path) -> Path:
    """
    Ensure a directory exists, creating it if necessary.
    
    Args:
        path: Path to directory
        
    Returns:
        Path object
    """
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_image_files(directory: Path, extensions: Tuple[str, ...] = ('.jpg', '.jpeg', '.png', '.webp')) -> List[Path]:
    """
    Get all image files from a directory.
    
    Args:
        directory: Directory to search
        extensions: Tuple of valid file extensions
        
    Returns:
        List of image file paths
    """
    image_files = []
    for ext in extensions:
        image_files.extend(directory.glob(f"*{ext}"))
        image_files.extend(directory.glob(f"*{ext.upper()}"))
    return sorted(image_files)


def parse_label_file(label_path: Path) -> List[Tuple[int, float, float, float, float]]:
    """
    Parse a YOLO format label file.
    
    Args:
        label_path: Path to label file
        
    Returns:
        List of tuples (class_id, x_center, y_center, width, height)
    """
    labels = []
    with open(label_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line:
                parts = line.split()
                if len(parts) >= 5:
                    class_id = int(parts[0])
                    x_center = float(parts[1])
                    y_center = float(parts[2])
                    width = float(parts[3])
                    height = float(parts[4])
                    labels.append((class_id, x_center, y_center, width, height))
    return labels


def format_bbox(x_center: float, y_center: float, width: float, height: float, 
                img_width: int, img_height: int) -> Tuple[int, int, int, int]:
    """
    Convert YOLO format bbox to pixel coordinates.
    
    Args:
        x_center: Center x (normalized)
        y_center: Center y (normalized)
        width: Width (normalized)
        height: Height (normalized)
        img_width: Image width in pixels
        img_height: Image height in pixels
        
    Returns:
        Tuple of (x_min, y_min, x_max, y_max) in pixels
    """
    x_min = int((x_center - width / 2) * img_width)
    y_min = int((y_center - height / 2) * img_height)
    x_max = int((x_center + width / 2) * img_width)
    y_max = int((y_center + height / 2) * img_height)
    
    # Clamp to image bounds
    x_min = max(0, x_min)
    y_min = max(0, y_min)
    x_max = min(img_width, x_max)
    y_max = min(img_height, y_max)
    
    return (x_min, y_min, x_max, y_max)
