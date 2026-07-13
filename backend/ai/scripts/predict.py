#!/usr/bin/env python3
"""
YOLOv8 Prediction Script for RoadGuard AI
Supports single image, folder, video, and webcam prediction.
"""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import json

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from backend.ai.utils.logger import get_logger
from backend.ai.inference.detector import RoadDamageDetector

logger = get_logger(__name__)


def predict_single_image(
    model_path: str,
    image_path: str,
    conf: float = 0.25,
    iou: float = 0.45,
    device: str = 'auto',
    output_dir: Optional[str] = None,
    save_annotated: bool = True,
    save_json: bool = True,
    class_names: Optional[Dict[int, str]] = None
) -> Dict[str, Any]:
    """
    Run prediction on a single image.
    
    Args:
        model_path: Path to model weights
        image_path: Path to input image
        conf: Confidence threshold
        iou: IoU threshold
        device: Device to use
        output_dir: Directory to save results
        save_annotated: Whether to save annotated image
        save_json: Whether to save results as JSON
        class_names: Dictionary mapping class IDs to names
        
    Returns:
        Dictionary containing prediction results
    """
    logger.info("=" * 60)
    logger.info("SINGLE IMAGE PREDICTION")
    logger.info("=" * 60)
    
    # Initialize detector
    detector = RoadDamageDetector(
        model_path=model_path,
        conf_threshold=conf,
        iou_threshold=iou,
        device=device,
        class_names=class_names
    )
    
    # Load model
    detector.load_model()
    
    # Run prediction
    results = detector.predict_image(image_path)
    
    # Save results
    if output_dir:
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Save annotated image
        if save_annotated:
            annotated_path = output_path / f"annotated_{Path(image_path).name}"
            detector.draw_boxes(image_path, results, str(annotated_path))
            logger.info(f"Saved annotated image to {annotated_path}")
        
        # Save JSON
        if save_json:
            json_path = output_path / f"results_{Path(image_path).stem}.json"
            with open(json_path, 'w') as f:
                json.dump(results, f, indent=2)
            logger.info(f"Saved results to {json_path}")
    
    # Print summary
    logger.info(f"\nDetections: {len(results['detections'])}")
    for det in results['detections']:
        logger.info(f"  {det['class_name']}: {det['confidence']:.2f}")
    
    return results


def predict_folder(
    model_path: str,
    folder_path: str,
    conf: float = 0.25,
    iou: float = 0.45,
    device: str = 'auto',
    output_dir: Optional[str] = None,
    save_annotated: bool = True,
    save_json: bool = True,
    class_names: Optional[Dict[int, str]] = None
) -> List[Dict[str, Any]]:
    """
    Run prediction on all images in a folder.
    
    Args:
        model_path: Path to model weights
        folder_path: Path to input folder
        conf: Confidence threshold
        iou: IoU threshold
        device: Device to use
        output_dir: Directory to save results
        save_annotated: Whether to save annotated images
        save_json: Whether to save results as JSON
        class_names: Dictionary mapping class IDs to names
        
    Returns:
        List of prediction results
    """
    logger.info("=" * 60)
    logger.info("FOLDER PREDICTION")
    logger.info("=" * 60)
    
    # Initialize detector
    detector = RoadDamageDetector(
        model_path=model_path,
        conf_threshold=conf,
        iou_threshold=iou,
        device=device,
        class_names=class_names
    )
    
    # Load model
    detector.load_model()
    
    # Get all images
    folder = Path(folder_path)
    image_extensions = ('.jpg', '.jpeg', '.png', '.webp')
    images = [f for f in folder.iterdir() if f.suffix.lower() in image_extensions]
    
    logger.info(f"Found {len(images)} images in {folder_path}")
    
    # Run predictions
    all_results = []
    for i, image_path in enumerate(images, 1):
        logger.info(f"\nProcessing {i}/{len(images)}: {image_path.name}")
        
        results = detector.predict_image(str(image_path))
        all_results.append(results)
        
        # Save results
        if output_dir:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Save annotated image
            if save_annotated:
                annotated_path = output_path / f"annotated_{image_path.name}"
                detector.draw_boxes(str(image_path), results, str(annotated_path))
            
            # Save JSON
            if save_json:
                json_path = output_path / f"results_{image_path.stem}.json"
                with open(json_path, 'w') as f:
                    json.dump(results, f, indent=2)
    
    # Print summary
    total_detections = sum(len(r['detections']) for r in all_results)
    logger.info(f"\nProcessed {len(images)} images")
    logger.info(f"Total detections: {total_detections}")
    
    return all_results


def predict_video(
    model_path: str,
    video_path: str,
    conf: float = 0.25,
    iou: float = 0.45,
    device: str = 'auto',
    output_dir: Optional[str] = None,
    save_annotated: bool = True,
    class_names: Optional[Dict[int, str]] = None
) -> List[Dict[str, Any]]:
    """
    Run prediction on a video file.
    
    Args:
        model_path: Path to model weights
        video_path: Path to input video
        conf: Confidence threshold
        iou: IoU threshold
        device: Device to use
        output_dir: Directory to save results
        save_annotated: Whether to save annotated video
        class_names: Dictionary mapping class IDs to names
        
    Returns:
        List of frame prediction results
    """
    logger.info("=" * 60)
    logger.info("VIDEO PREDICTION")
    logger.info("=" * 60)
    
    # Initialize detector
    detector = RoadDamageDetector(
        model_path=model_path,
        conf_threshold=conf,
        iou_threshold=iou,
        device=device,
        class_names=class_names
    )
    
    # Load model
    detector.load_model()
    
    # Run prediction
    results = detector.predict_video(video_path, output_dir if save_annotated else None)
    
    # Save JSON summary
    if output_dir:
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        json_path = output_path / f"results_{Path(video_path).stem}.json"
        with open(json_path, 'w') as f:
            json.dump(results, f, indent=2)
        logger.info(f"Saved results to {json_path}")
    
    # Print summary
    logger.info(f"Processed {len(results)} frames")
    
    return results


def predict_webcam(
    model_path: str,
    conf: float = 0.25,
    iou: float = 0.45,
    device: str = 'auto',
    class_names: Optional[Dict[int, str]] = None
) -> None:
    """
    Run prediction on webcam stream.
    
    Args:
        model_path: Path to model weights
        conf: Confidence threshold
        iou: IoU threshold
        device: Device to use
        class_names: Dictionary mapping class IDs to names
    """
    logger.info("=" * 60)
    logger.info("WEBCAM PREDICTION")
    logger.info("=" * 60)
    
    # Initialize detector
    detector = RoadDamageDetector(
        model_path=model_path,
        conf_threshold=conf,
        iou_threshold=iou,
        device=device,
        class_names=class_names
    )
    
    # Load model
    detector.load_model()
    
    # Run prediction
    logger.info("Starting webcam prediction...")
    logger.info("Press 'q' to quit")
    
    detector.predict_webcam()


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="YOLOv8 prediction for RoadGuard AI")
    
    # Input type
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--image', type=str, help='Path to single image')
    input_group.add_argument('--folder', type=str, help='Path to folder of images')
    input_group.add_argument('--video', type=str, help='Path to video file')
    input_group.add_argument('--webcam', action='store_true', help='Use webcam')
    
    # Model and parameters
    parser.add_argument('--model', type=str, required=True, help='Path to model weights')
    parser.add_argument('--conf', type=float, default=0.25, help='Confidence threshold')
    parser.add_argument('--iou', type=float, default=0.45, help='IoU threshold')
    parser.add_argument('--device', type=str, default='auto', help='Device to use')
    
    # Output
    parser.add_argument('--output', type=str, help='Output directory')
    parser.add_argument('--no-annotated', action='store_true', help='Do not save annotated images')
    parser.add_argument('--no-json', action='store_true', help='Do not save JSON results')
    
    # Class names
    parser.add_argument('--classes', type=str, help='JSON file with class names mapping')
    
    args = parser.parse_args()
    
    # Load class names if provided
    class_names = None
    if args.classes:
        with open(args.classes, 'r') as f:
            class_names = json.load(f)
        # Convert string keys to int
        class_names = {int(k): v for k, v in class_names.items()}
    
    # Default class names for RoadGuard AI
    if not class_names:
        class_names = {0: 'pothole', 1: 'crack', 2: 'manhole'}
    
    try:
        if args.image:
            predict_single_image(
                model_path=args.model,
                image_path=args.image,
                conf=args.conf,
                iou=args.iou,
                device=args.device,
                output_dir=args.output,
                save_annotated=not args.no_annotated,
                save_json=not args.no_json,
                class_names=class_names
            )
        
        elif args.folder:
            predict_folder(
                model_path=args.model,
                folder_path=args.folder,
                conf=args.conf,
                iou=args.iou,
                device=args.device,
                output_dir=args.output,
                save_annotated=not args.no_annotated,
                save_json=not args.no_json,
                class_names=class_names
            )
        
        elif args.video:
            predict_video(
                model_path=args.model,
                video_path=args.video,
                conf=args.conf,
                iou=args.iou,
                device=args.device,
                output_dir=args.output,
                save_annotated=not args.no_annotated,
                class_names=class_names
            )
        
        elif args.webcam:
            predict_webcam(
                model_path=args.model,
                conf=args.conf,
                iou=args.iou,
                device=args.device,
                class_names=class_names
            )
        
        logger.info("\n✓ Prediction complete")
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
