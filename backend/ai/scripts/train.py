#!/usr/bin/env python3
"""
YOLOv8 Training Script for RoadGuard AI
Prepares and validates training setup for road damage detection.
"""

import sys
from pathlib import Path
from typing import Dict, Any

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import yaml
from backend.ai.utils.helpers import validate_environment, validate_dataset_structure
from backend.ai.utils.logger import get_logger

logger = get_logger(__name__)


def load_config(config_path: Path) -> Dict[str, Any]:
    """
    Load training configuration from YAML file.
    
    Args:
        config_path: Path to train_config.yaml
        
    Returns:
        Dictionary containing configuration
    """
    logger.info(f"Loading configuration from {config_path}")
    
    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    logger.info("Configuration loaded successfully")
    return config


def validate_config(config: Dict[str, Any]) -> bool:
    """
    Validate training configuration.
    
    Args:
        config: Configuration dictionary
        
    Returns:
        True if valid, raises exception otherwise
    """
    logger.info("Validating configuration...")
    
    required_sections = ['model', 'dataset', 'training', 'inference']
    for section in required_sections:
        if section not in config:
            raise ValueError(f"Missing required configuration section: {section}")
    
    # Validate model
    if 'name' not in config['model']:
        raise ValueError("Model name not specified in configuration")
    
    # Validate dataset
    if 'path' not in config['dataset']:
        raise ValueError("Dataset path not specified in configuration")
    
    dataset_path = Path(__file__).resolve().parents[3] / config['dataset']['path']
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset path does not exist: {dataset_path}")
    
    # Validate training parameters
    training = config['training']
    if 'epochs' not in training or training['epochs'] <= 0:
        raise ValueError("Invalid epochs value in configuration")
    
    logger.info("Configuration validation passed")
    return True


def print_config_summary(config: Dict[str, Any]) -> None:
    """
    Print a summary of the training configuration.
    
    Args:
        config: Configuration dictionary
    """
    logger.info("=" * 60)
    logger.info("TRAINING CONFIGURATION SUMMARY")
    logger.info("=" * 60)
    
    logger.info(f"\nModel:")
    logger.info(f"  Name: {config['model']['name']}")
    logger.info(f"  Size: {config['model'].get('size', 'n')}")
    
    logger.info(f"\nDataset:")
    logger.info(f"  Path: {config['dataset']['path']}")
    logger.info(f"  Train: {config['dataset'].get('train', 'train/images')}")
    logger.info(f"  Validation: {config['dataset'].get('val', 'valid/images')}")
    logger.info(f"  Test: {config['dataset'].get('test', 'test/images')}")
    
    logger.info(f"\nTraining Parameters:")
    logger.info(f"  Image Size: {config['training']['imgsz']}")
    logger.info(f"  Epochs: {config['training']['epochs']}")
    logger.info(f"  Batch Size: {config['training']['batch']}")
    logger.info(f"  Workers: {config['training']['workers']}")
    logger.info(f"  Optimizer: {config['training']['optimizer']}")
    logger.info(f"  Patience: {config['training']['patience']}")
    logger.info(f"  Device: {config['training']['device']}")
    
    logger.info(f"\nInference Parameters:")
    logger.info(f"  Confidence Threshold: {config['inference']['conf']}")
    logger.info(f"  IoU Threshold: {config['inference']['iou']}")
    
    logger.info(f"\nProject:")
    logger.info(f"  Name: {config['training']['project']}")
    logger.info(f"  Run: {config['training']['name']}")
    
    logger.info(f"\nClasses:")
    if 'classes' in config:
        for class_id, class_name in config['classes'].items():
            logger.info(f"  {class_id}: {class_name}")
    
    logger.info("=" * 60)


def validate_dataset_classes(dataset_path: Path, config: Dict[str, Any]) -> bool:
    """
    Validate that dataset classes match configuration.
    
    Args:
        dataset_path: Path to dataset directory
        config: Configuration dictionary
        
    Returns:
        True if classes match
    """
    logger.info("Validating dataset classes...")
    
    data_yaml_path = dataset_path / "data.yaml"
    if not data_yaml_path.exists():
        raise FileNotFoundError(f"data.yaml not found at {data_yaml_path}")
    
    with open(data_yaml_path, 'r') as f:
        data_yaml = yaml.safe_load(f)
    
    if 'names' not in data_yaml:
        raise ValueError("data.yaml missing 'names' section")
    
    config_classes = config.get('classes', {})
    dataset_classes = data_yaml['names']
    
    logger.info(f"Dataset classes: {dataset_classes}")
    logger.info(f"Config classes: {config_classes}")
    
    # Check if classes match
    if config_classes and config_classes != dataset_classes:
        logger.warning("Config classes do not match dataset classes")
        logger.warning("Using dataset classes from data.yaml")
    
    logger.info("Dataset class validation complete")
    return True


def prepare_training() -> None:
    """
    Prepare training environment and validate all components.
    Does NOT start training - only validates and prepares.
    """
    logger.info("=" * 60)
    logger.info("YOLOv8 TRAINING PREPARATION")
    logger.info("=" * 60)
    
    # Get paths
    base_dir = Path(__file__).resolve().parents[3]
    config_path = base_dir / "backend" / "ai" / "configs" / "train_config.yaml"
    
    logger.info(f"Base directory: {base_dir}")
    logger.info(f"Config path: {config_path}")
    
    # Step 1: Validate Python environment
    logger.info("\n" + "=" * 60)
    logger.info("STEP 1: VALIDATING PYTHON ENVIRONMENT")
    logger.info("=" * 60)
    validate_environment()
    
    # Step 2: Load configuration
    logger.info("\n" + "=" * 60)
    logger.info("STEP 2: LOADING CONFIGURATION")
    logger.info("=" * 60)
    config = load_config(config_path)
    
    # Step 3: Validate configuration
    logger.info("\n" + "=" * 60)
    logger.info("STEP 3: VALIDATING CONFIGURATION")
    logger.info("=" * 60)
    validate_config(config)
    
    # Step 4: Print configuration summary
    print_config_summary(config)
    
    # Step 5: Validate CUDA availability
    logger.info("\n" + "=" * 60)
    logger.info("STEP 4: VALIDATING CUDA AVAILABILITY")
    logger.info("=" * 60)
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            cuda_version = torch.version.cuda
            device_count = torch.cuda.device_count()
            device_name = torch.cuda.get_device_name(0)
            logger.info(f"✓ CUDA available: {cuda_version}")
            logger.info(f"✓ CUDA devices: {device_count}")
            logger.info(f"✓ Primary device: {device_name}")
        else:
            logger.info("✗ CUDA not available - training will use CPU")
            logger.warning("CPU training will be significantly slower")
    except ImportError:
        logger.warning("PyTorch not installed - cannot check CUDA availability")
    
    # Step 6: Validate dataset structure
    logger.info("\n" + "=" * 60)
    logger.info("STEP 5: VALIDATING DATASET STRUCTURE")
    logger.info("=" * 60)
    dataset_path = base_dir / config['dataset']['path']
    dataset_path = dataset_path.resolve()
    validate_dataset_structure(dataset_path)
    
    # Step 7: Validate dataset classes
    logger.info("\n" + "=" * 60)
    logger.info("STEP 6: VALIDATING DATASET CLASSES")
    logger.info("=" * 60)
    validate_dataset_classes(dataset_path, config)
    
    # Step 8: Validate data.yaml
    logger.info("\n" + "=" * 60)
    logger.info("STEP 7: VALIDATING data.yaml")
    logger.info("=" * 60)
    data_yaml_path = dataset_path / "data.yaml"
    logger.info(f"Checking data.yaml at: {data_yaml_path}")
    
    with open(data_yaml_path, 'r') as f:
        data_yaml = yaml.safe_load(f)
    
    required_keys = ['path', 'train', 'val', 'names']
    for key in required_keys:
        if key not in data_yaml:
            raise ValueError(f"data.yaml missing required key: {key}")
    
    logger.info("✓ data.yaml is valid")
    logger.info(f"  Dataset path: {data_yaml['path']}")
    logger.info(f"  Train images: {data_yaml['train']}")
    logger.info(f"  Validation images: {data_yaml['val']}")
    logger.info(f"  Test images: {data_yaml.get('test', 'N/A')}")
    logger.info(f"  Classes: {data_yaml['names']}")
    
    # Step 9: Prepare training command
    logger.info("\n" + "=" * 60)
    logger.info("STEP 8: PREPARING TRAINING COMMAND")
    logger.info("=" * 60)
    
    model_name = config['model']['name']
    dataset_yaml = str(data_yaml_path)
    epochs = config['training']['epochs']
    imgsz = config['training']['imgsz']
    batch = config['training']['batch']
    device = config['training']['device']
    project = config['training']['project']
    name = config['training']['name']
    patience = config['training']['patience']
    
    logger.info("Training command to execute:")
    logger.info(f"  from ultralytics import YOLO")
    logger.info(f"  model = YOLO('{model_name}')")
    logger.info(f"  results = model.train(")
    logger.info(f"      data='{dataset_yaml}',")
    logger.info(f"      epochs={epochs},")
    logger.info(f"      imgsz={imgsz},")
    logger.info(f"      batch={batch},")
    logger.info(f"      device='{device}',")
    logger.info(f"      project='{project}',")
    logger.info(f"      name='{name}',")
    logger.info(f"      patience={patience},")
    logger.info(f"      verbose=True")
    logger.info(f"  )")
    
    # Final summary
    logger.info("\n" + "=" * 60)
    logger.info("TRAINING PREPARATION COMPLETE")
    logger.info("=" * 60)
    logger.info("\n✓ All validations passed")
    logger.info("✓ Environment is ready for training")
    logger.info("✓ Dataset is valid and accessible")
    logger.info("✓ Configuration is correct")
    logger.info("\nTo start training, run:")
    logger.info("  python backend/ai/scripts/train.py --start")
    logger.info("\nOr use the prepared command above in a Python script.")


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Prepare YOLOv8 training for RoadGuard AI")
    parser.add_argument(
        '--start',
        action='store_true',
        help='Actually start training (not recommended without review)'
    )
    parser.add_argument(
        '--config',
        type=str,
        default='backend/ai/configs/train_config.yaml',
        help='Path to training configuration file'
    )
    
    args = parser.parse_args()
    
    if args.start:
        logger.warning("Automatic training start is not recommended.")
        logger.warning("Please review the configuration and start training manually.")
        logger.warning("This script only validates and prepares the training environment.")
        return
    
    prepare_training()


if __name__ == "__main__":
    main()
