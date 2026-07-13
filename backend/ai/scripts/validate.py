#!/usr/bin/env python3
"""
YOLOv8 Validation Script for RoadGuard AI
Validates trained model on validation dataset.
"""

import sys
from pathlib import Path
from typing import Dict, Any
import json

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from backend.ai.utils.logger import get_logger

logger = get_logger(__name__)


def validate_model(
    model_path: str,
    data_yaml: str,
    conf: float = 0.001,
    iou: float = 0.6,
    device: str = 'auto',
    batch: int = 16,
    imgsz: int = 640,
    plots: bool = True,
    save_json: bool = False
) -> Dict[str, Any]:
    """
    Validate a trained YOLO model on the validation dataset.
    
    Args:
        model_path: Path to trained model weights (.pt file)
        data_yaml: Path to data.yaml configuration
        conf: Confidence threshold for validation
        iou: IoU threshold for validation
        device: Device to use ('auto', 'cuda', 'cpu')
        batch: Batch size for validation
        imgsz: Image size for validation
        plots: Whether to save validation plots
        save_json: Whether to save results as JSON
        
    Returns:
        Dictionary containing validation metrics
    """
    logger.info("=" * 60)
    logger.info("YOLOv8 MODEL VALIDATION")
    logger.info("=" * 60)
    
    logger.info(f"Model: {model_path}")
    logger.info(f"Dataset: {data_yaml}")
    logger.info(f"Confidence: {conf}")
    logger.info(f"IoU: {iou}")
    logger.info(f"Device: {device}")
    
    # Check if model exists
    model_file = Path(model_path)
    if not model_file.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    # Check if data.yaml exists
    data_file = Path(data_yaml)
    if not data_file.exists():
        raise FileNotFoundError(f"data.yaml not found: {data_yaml}")
    
    try:
        from ultralytics import YOLO
        
        # Load model
        logger.info("Loading model...")
        model = YOLO(model_path)
        
        # Run validation
        logger.info("Running validation...")
        results = model.val(
            data=data_yaml,
            conf=conf,
            iou=iou,
            device=device,
            batch=batch,
            imgsz=imgsz,
            plots=plots,
            save_json=save_json,
            verbose=True
        )
        
        # Extract metrics
        metrics = {
            'precision': float(results.box.mp),  # Mean precision
            'recall': float(results.box.mr),  # Mean recall
            'map50': float(results.box.map50),  # mAP at 0.5 IoU
            'map50_95': float(results.box.map),  # mAP at 0.5:0.95 IoU
            'fitness': float(results.box.fitness),  # Fitness score
        }
        
        # Print results
        logger.info("\n" + "=" * 60)
        logger.info("VALIDATION RESULTS")
        logger.info("=" * 60)
        logger.info(f"Precision: {metrics['precision']:.4f}")
        logger.info(f"Recall: {metrics['recall']:.4f}")
        logger.info(f"mAP@50: {metrics['map50']:.4f}")
        logger.info(f"mAP@50-95: {metrics['map50_95']:.4f}")
        logger.info(f"Fitness: {metrics['fitness']:.4f}")
        logger.info("=" * 60)
        
        return metrics
        
    except ImportError:
        raise ImportError("Ultralytics YOLO not installed. Install with: pip install ultralytics")
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        raise


def save_metrics(metrics: Dict[str, Any], output_path: Path) -> None:
    """
    Save validation metrics to JSON file.
    
    Args:
        metrics: Dictionary of metrics
        output_path: Path to save JSON file
    """
    logger.info(f"Saving metrics to {output_path}")
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    logger.info("Metrics saved successfully")


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate YOLOv8 model for RoadGuard AI")
    parser.add_argument(
        '--model',
        type=str,
        required=True,
        help='Path to trained model weights (.pt file)'
    )
    parser.add_argument(
        '--data',
        type=str,
        default='../../data/road_damage/data.yaml',
        help='Path to data.yaml configuration'
    )
    parser.add_argument(
        '--conf',
        type=float,
        default=0.001,
        help='Confidence threshold'
    )
    parser.add_argument(
        '--iou',
        type=float,
        default=0.6,
        help='IoU threshold'
    )
    parser.add_argument(
        '--device',
        type=str,
        default='auto',
        help='Device to use (auto, cuda, cpu)'
    )
    parser.add_argument(
        '--batch',
        type=int,
        default=16,
        help='Batch size'
    )
    parser.add_argument(
        '--imgsz',
        type=int,
        default=640,
        help='Image size'
    )
    parser.add_argument(
        '--no-plots',
        action='store_true',
        help='Disable validation plots'
    )
    parser.add_argument(
        '--save-json',
        action='store_true',
        help='Save results as JSON'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='backend/ai/results/metrics.json',
        help='Path to save metrics JSON'
    )
    
    args = parser.parse_args()
    
    # Resolve paths
    base_dir = Path(__file__).resolve().parents[3]
    model_path = base_dir / args.model if not Path(args.model).is_absolute() else Path(args.model)
    data_path = base_dir / args.data if not Path(args.data).is_absolute() else Path(args.data)
    output_path = base_dir / args.output if not Path(args.output).is_absolute() else Path(args.output)
    
    try:
        # Run validation
        metrics = validate_model(
            model_path=str(model_path),
            data_yaml=str(data_path),
            conf=args.conf,
            iou=args.iou,
            device=args.device,
            batch=args.batch,
            imgsz=args.imgsz,
            plots=not args.no_plots,
            save_json=args.save_json
        )
        
        # Save metrics if requested
        if args.save_json:
            save_metrics(metrics, output_path)
        
        logger.info("\n✓ Validation complete")
        
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
