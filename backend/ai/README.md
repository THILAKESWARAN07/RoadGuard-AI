# RoadGuard AI Module

Professional AI training infrastructure for road damage detection using YOLOv8.

## Overview

This module provides a complete AI pipeline for training, validating, and deploying YOLOv8 models for road damage detection. It includes:

- **Training**: Complete YOLOv8 training setup with configurable hyperparameters
- **Validation**: Model evaluation with precision, recall, and mAP metrics
- **Prediction**: Inference on images, folders, videos, and webcam streams
- **Inference Engine**: Reusable `RoadDamageDetector` class for integration
- **Utilities**: Visualization, metrics calculation, and helper functions

## Project Structure

```
backend/ai/
├── configs/
│   └── train_config.yaml    # Training configuration
├── inference/
│   └── detector.py          # Reusable detection engine
├── models/                  # Trained model weights (best.pt, last.pt)
├── results/                 # Training outputs and metrics
├── scripts/
│   ├── train.py             # Training preparation script
│   ├── validate.py          # Model validation script
│   └── predict.py           # Prediction script
├── utils/
│   ├── logger.py            # Logger utility
│   ├── helpers.py           # Helper functions
│   ├── visualization.py    # Drawing and visualization
│   └── metrics.py           # Metrics calculation
└── README.md               # This file
```

## Dataset

The dataset is located at `data/road_damage/` and contains:

- **Train**: 1,406 images (70%)
- **Validation**: 401 images (20%)
- **Test**: 202 images (10%)

### Classes

- `0: pothole` - Road potholes
- `1: crack` - Road cracks
- `2: manhole` - Manhole covers

### Dataset Statistics

- Total images: 2,009
- Total annotations: 4,737
- Average annotations per image: 2.36
- Class distribution:
  - Pothole: 1,261 annotations (26.6%)
  - Crack: 2,519 annotations (53.2%)
  - Manhole: 957 annotations (20.2%)

## Installation

### Required Packages

```bash
pip install ultralytics torch opencv-python pyyaml numpy
```

### Optional Packages

```bash
pip install pillow  # For additional image processing
```

## Training

### Configuration

Training configuration is defined in `configs/train_config.yaml`:

```yaml
model:
  name: yolov8n.pt  # Model variant (n, s, m, l, x)

training:
  imgsz: 640        # Image size
  epochs: 50        # Number of epochs
  batch: auto       # Batch size
  device: auto      # Device (auto, cuda, cpu)
  patience: 20      # Early stopping patience

inference:
  conf: 0.25        # Confidence threshold
  iou: 0.45         # IoU threshold
```

### Prepare Training

Run the training preparation script to validate the environment and dataset:

```bash
python backend/ai/scripts/train.py
```

This will:
- Validate Python environment and required packages
- Check CUDA availability
- Validate dataset structure
- Verify data.yaml configuration
- Print training configuration summary
- Prepare the training command (does NOT start training automatically)

### Start Training

After validation, start training manually:

```python
from ultralytics import YOLO

model = YOLO('yolov8n.pt')
results = model.train(
    data='../../data/road_damage/data.yaml',
    epochs=50,
    imgsz=640,
    batch=16,
    device='auto',
    project='RoadGuard-AI',
    name='pothole_detector',
    patience=20,
    verbose=True
)
```

Or use the prepared command shown by the training script.

### Training Outputs

Training results are saved to `RoadGuard-AI/pothole_detector/`:

- `best.pt` - Best model weights (highest validation mAP)
- `last.pt` - Last epoch weights
- `results.csv` - Training metrics per epoch
- `confusion_matrix.png` - Confusion matrix visualization
- `results.png` - Training curves
- `F1_curve.png` - F1 score curve
- `PR_curve.png` - Precision-Recall curve

## Validation

### Validate Trained Model

```bash
python backend/ai/scripts/validate.py \
    --model backend/ai/models/best.pt \
    --data ../../data/road_damage/data.yaml \
    --conf 0.001 \
    --iou 0.6 \
    --device auto
```

### Validation Metrics

The validation script returns:

- **Precision**: Mean precision across all classes
- **Recall**: Mean recall across all classes
- **mAP@50**: Mean Average Precision at IoU 0.5
- **mAP@50-95**: Mean Average Precision at IoU 0.5:0.95

### Save Validation Results

```bash
python backend/ai/scripts/validate.py \
    --model backend/ai/models/best.pt \
    --data ../../data/road_damage/data.yaml \
    --save-json \
    --output backend/ai/results/metrics.json
```

## Prediction

### Single Image Prediction

```bash
python backend/ai/scripts/predict.py \
    --image path/to/image.jpg \
    --model backend/ai/models/best.pt \
    --conf 0.25 \
    --iou 0.45 \
    --output backend/ai/results/predictions
```

### Folder Prediction

```bash
python backend/ai/scripts/predict.py \
    --folder path/to/images/ \
    --model backend/ai/models/best.pt \
    --output backend/ai/results/predictions
```

### Video Prediction

```bash
python backend/ai/scripts/predict.py \
    --video path/to/video.mp4 \
    --model backend/ai/models/best.pt \
    --output backend/ai/results/predictions
```

### Webcam Prediction

```bash
python backend/ai/scripts/predict.py \
    --webcam \
    --model backend/ai/models/best.pt
```

Press 'q' to quit webcam mode.

### Prediction Outputs

- **Annotated images/videos**: Bounding boxes drawn with class names and confidence
- **JSON results**: Structured detection results with coordinates and confidence

## Inference Engine

The `RoadDamageDetector` class provides a reusable interface for integration:

```python
from ai.inference.detector import RoadDamageDetector

# Initialize detector
detector = RoadDamageDetector(
    model_path='backend/ai/models/best.pt',
    conf_threshold=0.25,
    iou_threshold=0.45,
    device='auto',
    class_names={0: 'pothole', 1: 'crack', 2: 'manhole'}
)

# Load model
detector.load_model()

# Predict on image
results = detector.predict_image('path/to/image.jpg')

# Predict on video
results = detector.predict_video('path/to/video.mp4', 'output.mp4')

# Predict on folder
results = detector.predict_folder('path/to/folder/', 'output_dir/')

# Predict on webcam
detector.predict_webcam()

# Draw detections
detector.draw_boxes('path/to/image.jpg', results['detections'], 'output.jpg')

# Save results
detector.save_results(results, 'results.json')
```

### Detection Result Format

```python
{
    'image_path': 'path/to/image.jpg',
    'image_shape': (height, width, channels),
    'detections': [
        {
            'class_id': 0,
            'class_name': 'pothole',
            'confidence': 0.92,
            'bbox': {
                'x1': 100,
                'y1': 150,
                'x2': 300,
                'y2': 350,
                'width': 200,
                'height': 200
            },
            'center': {
                'x': 200,
                'y': 250
            }
        }
    ],
    'num_detections': 1
}
```

## Utilities

### Visualization

```python
from ai.utils.visualization import draw_detections, create_detection_grid

# Draw detections on image
annotated = draw_detections(image, detections, class_names)

# Create grid of detections
grid = create_detection_grid(images, detections_list, class_names, (3, 3))
```

### Metrics

```python
from ai.utils.metrics import (
    calculate_iou,
    calculate_precision_recall,
    calculate_map,
    calculate_confusion_matrix
)

# Calculate IoU between two boxes
iou = calculate_iou(box1, box2)

# Calculate precision and recall
precision, recall = calculate_precision_recall(predictions, ground_truths)

# Calculate mAP
map_metrics = calculate_map(all_predictions, all_ground_truths)

# Calculate confusion matrix
cm = calculate_confusion_matrix(predictions, ground_truths, num_classes=3)
```

### Helpers

```python
from ai.utils.helpers import (
    validate_environment,
    validate_dataset_structure,
    get_device,
    parse_label_file
)

# Validate environment
validate_environment()

# Validate dataset structure
validate_dataset_structure(dataset_path)

# Get best available device
device = get_device()

# Parse YOLO label file
labels = parse_label_file(label_path)
```

## Model Location

After training, model weights are saved to:

- **Best model**: `RoadGuard-AI/pothole_detector/weights/best.pt`
- **Last model**: `RoadGuard-AI/pothole_detector/weights/last.pt`

Copy the best model to the AI module for deployment:

```bash
cp RoadGuard-AI/pothole_detector/weights/best.pt backend/ai/models/best.pt
```

## Future Integration

### API Integration

The inference engine can be integrated into the FastAPI backend:

```python
# In app/services/detector.py
from ai.inference.detector import RoadDamageDetector

class DetectionService:
    def __init__(self):
        self.detector = RoadDamageDetector(
            model_path='backend/ai/models/best.pt',
            conf_threshold=0.25,
            iou_threshold=0.45
        )
        self.detector.load_model()
    
    def detect(self, image_path: str) -> dict:
        results = self.detector.predict_image(image_path)
        return results
```

### Real-time Detection

For real-time detection in the application:

```python
# Use webcam prediction
detector.predict_webcam(camera_index=0)

# Or process video stream
results = detector.predict_video(stream_url, output_path)
```

### Batch Processing

For processing uploaded images:

```python
results = detector.predict_folder(
    'uploads/',
    'results/'
)
```

## Configuration Reference

### Training Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `model.name` | `yolov8n.pt` | Model variant |
| `training.imgsz` | `640` | Image size |
| `training.epochs` | `50` | Number of epochs |
| `training.batch` | `auto` | Batch size |
| `training.patience` | `20` | Early stopping patience |
| `training.device` | `auto` | Device (auto/cuda/cpu) |
| `inference.conf` | `0.25` | Confidence threshold |
| `inference.iou` | `0.45` | IoU threshold |

### Model Variants

- `yolov8n.pt` - Nano (fastest, lowest accuracy)
- `yolov8s.pt` - Small
- `yolov8m.pt` - Medium
- `yolov8l.pt` - Large
- `yolov8x.pt` - Extra-large (slowest, highest accuracy)

## Troubleshooting

### CUDA Not Available

If CUDA is not available, training will use CPU (slower):

```bash
# Force CPU usage
python backend/ai/scripts/train.py --device cpu
```

### Out of Memory

Reduce batch size or image size:

```yaml
training:
  batch: 8  # Reduce from auto/16
  imgsz: 512  # Reduce from 640
```

### Model Not Found

Ensure the model path is correct:

```bash
# Download pretrained model
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### Dataset Validation Errors

Check dataset structure:

```bash
python -c "from ai.utils.helpers import validate_dataset_structure; validate_dataset_structure(Path('data/road_damage'))"
```

## Performance Tips

1. **Use GPU**: Training on CUDA GPU is 10-50x faster than CPU
2. **Batch size**: Larger batch sizes improve GPU utilization
3. **Image size**: Smaller images train faster but may reduce accuracy
4. **Model size**: Start with `yolov8n.pt` for faster iteration
5. **Mixed precision**: Enable `half=True` for faster training (if supported)

## License

This module is part of RoadGuard AI project.

## Support

For issues or questions, refer to the main project documentation.
