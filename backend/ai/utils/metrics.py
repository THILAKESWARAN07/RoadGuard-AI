"""
Metrics utilities for AI module.
Functions for calculating and analyzing detection metrics.
"""

import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from collections import defaultdict


def calculate_iou(
    box1: Dict[str, int],
    box2: Dict[str, int]
) -> float:
    """
    Calculate Intersection over Union (IoU) for two bounding boxes.
    
    Args:
        box1: First bounding box with x1, y1, x2, y2
        box2: Second bounding box with x1, y1, x2, y2
        
    Returns:
        IoU value between 0 and 1
    """
    # Calculate intersection
    x1_inter = max(box1['x1'], box2['x1'])
    y1_inter = max(box1['y1'], box2['y1'])
    x2_inter = min(box1['x2'], box2['x2'])
    y2_inter = min(box1['y2'], box2['y2'])
    
    # Check if there is no intersection
    if x2_inter <= x1_inter or y2_inter <= y1_inter:
        return 0.0
    
    inter_area = (x2_inter - x1_inter) * (y2_inter - y1_inter)
    
    # Calculate union
    box1_area = (box1['x2'] - box1['x1']) * (box1['y2'] - box1['y1'])
    box2_area = (box2['x2'] - box2['x1']) * (box2['y2'] - box2['y1'])
    
    union_area = box1_area + box2_area - inter_area
    
    if union_area == 0:
        return 0.0
    
    return inter_area / union_area


def calculate_precision_recall(
    predictions: List[Dict[str, Any]],
    ground_truths: List[Dict[str, Any]],
    iou_threshold: float = 0.5
) -> Tuple[float, float]:
    """
    Calculate precision and recall for detections.
    
    Args:
        predictions: List of predicted detections
        ground_truths: List of ground truth detections
        iou_threshold: IoU threshold for matching
        
    Returns:
        Tuple of (precision, recall)
    """
    if len(predictions) == 0:
        return 0.0, 0.0 if len(ground_truths) > 0 else 1.0
    
    if len(ground_truths) == 0:
        return 0.0, 1.0
    
    # Match predictions to ground truths
    matched_gt = set()
    true_positives = 0
    
    for pred in predictions:
        pred_box = pred['bbox']
        pred_class = pred['class_id']
        
        best_iou = 0.0
        best_gt_idx = -1
        
        for i, gt in enumerate(ground_truths):
            if i in matched_gt:
                continue
            
            if gt['class_id'] != pred_class:
                continue
            
            gt_box = gt['bbox']
            iou = calculate_iou(pred_box, gt_box)
            
            if iou > best_iou:
                best_iou = iou
                best_gt_idx = i
        
        if best_iou >= iou_threshold and best_gt_idx != -1:
            true_positives += 1
            matched_gt.add(best_gt_idx)
    
    # Calculate metrics
    false_positives = len(predictions) - true_positives
    false_negatives = len(ground_truths) - len(matched_gt)
    
    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
    
    return precision, recall


def calculate_f1_score(precision: float, recall: float) -> float:
    """
    Calculate F1 score from precision and recall.
    
    Args:
        precision: Precision value
        recall: Recall value
        
    Returns:
        F1 score
    """
    if precision + recall == 0:
        return 0.0
    
    return 2 * (precision * recall) / (precision + recall)


def calculate_average_precision(
    predictions: List[Dict[str, Any]],
    ground_truths: List[Dict[str, Any]],
    iou_threshold: float = 0.5
) -> float:
    """
    Calculate Average Precision (AP) for a single class.
    
    Args:
        predictions: List of predicted detections with confidence
        ground_truths: List of ground truth detections
        iou_threshold: IoU threshold for matching
        
    Returns:
        Average precision value
    """
    if len(predictions) == 0 or len(ground_truths) == 0:
        return 0.0
    
    # Sort predictions by confidence (descending)
    predictions_sorted = sorted(predictions, key=lambda x: x['confidence'], reverse=True)
    
    # Calculate precision-recall at each threshold
    precisions = []
    recalls = []
    
    matched_gt = set()
    true_positives = 0
    false_positives = 0
    
    for pred in predictions_sorted:
        pred_box = pred['bbox']
        pred_class = pred['class_id']
        
        best_iou = 0.0
        best_gt_idx = -1
        
        for i, gt in enumerate(ground_truths):
            if i in matched_gt:
                continue
            
            if gt['class_id'] != pred_class:
                continue
            
            gt_box = gt['bbox']
            iou = calculate_iou(pred_box, gt_box)
            
            if iou > best_iou:
                best_iou = iou
                best_gt_idx = i
        
        if best_iou >= iou_threshold and best_gt_idx != -1:
            true_positives += 1
            matched_gt.add(best_gt_idx)
        else:
            false_positives += 1
        
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
        recall = true_positives / len(ground_truths)
        
        precisions.append(precision)
        recalls.append(recall)
    
    # Calculate AP using 11-point interpolation
    ap = 0.0
    for t in np.linspace(0, 1, 11):
        precisions_at_t = [p for p, r in zip(precisions, recalls) if r >= t]
        if precisions_at_t:
            ap += max(precisions_at_t)
    
    ap /= 11
    
    return ap


def calculate_map(
    all_predictions: Dict[int, List[Dict[str, Any]]],
    all_ground_truths: Dict[int, List[Dict[str, Any]]],
    iou_thresholds: List[float] = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]
) -> Dict[str, float]:
    """
    Calculate mean Average Precision (mAP) across multiple IoU thresholds.
    
    Args:
        all_predictions: Dictionary mapping class IDs to predictions
        all_ground_truths: Dictionary mapping class IDs to ground truths
        iou_thresholds: List of IoU thresholds to evaluate
        
    Returns:
        Dictionary with mAP metrics
    """
    class_ids = set(all_predictions.keys()) | set(all_ground_truths.keys())
    
    # Calculate AP for each class at each IoU threshold
    aps_per_threshold = defaultdict(list)
    
    for iou_threshold in iou_thresholds:
        for class_id in class_ids:
            predictions = all_predictions.get(class_id, [])
            ground_truths = all_ground_truths.get(class_id, [])
            
            ap = calculate_average_precision(predictions, ground_truths, iou_threshold)
            aps_per_threshold[iou_threshold].append(ap)
    
    # Calculate mAP@50
    map50 = np.mean(aps_per_threshold[0.5]) if aps_per_threshold[0.5] else 0.0
    
    # Calculate mAP@50-95
    map50_95 = np.mean([np.mean(aps) for aps in aps_per_threshold.values()])
    
    return {
        'map50': map50,
        'map50_95': map50_95,
        'aps_per_class': {class_id: calculate_average_precision(
            all_predictions.get(class_id, []),
            all_ground_truths.get(class_id, []),
            0.5
        ) for class_id in class_ids}
    }


def calculate_confusion_matrix(
    predictions: List[Dict[str, Any]],
    ground_truths: List[Dict[str, Any]],
    num_classes: int
) -> np.ndarray:
    """
    Calculate confusion matrix for classification.
    
    Args:
        predictions: List of predicted detections
        ground_truths: List of ground truth detections
        num_classes: Number of classes
        
    Returns:
        Confusion matrix (num_classes x num_classes)
    """
    confusion_matrix = np.zeros((num_classes, num_classes), dtype=int)
    
    # Match predictions to ground truths
    matched_gt = set()
    
    for pred in predictions:
        pred_box = pred['bbox']
        pred_class = pred['class_id']
        
        best_iou = 0.0
        best_gt_idx = -1
        
        for i, gt in enumerate(ground_truths):
            if i in matched_gt:
                continue
            
            gt_box = gt['bbox']
            iou = calculate_iou(pred_box, gt_box)
            
            if iou > best_iou:
                best_iou = iou
                best_gt_idx = i
        
        if best_iou >= 0.5 and best_gt_idx != -1:
            gt_class = ground_truths[best_gt_idx]['class_id']
            confusion_matrix[gt_class][pred_class] += 1
            matched_gt.add(best_gt_idx)
        else:
            # False positive
            confusion_matrix[pred_class][pred_class] += 1
    
    # Add false negatives (unmatched ground truths)
    for i, gt in enumerate(ground_truths):
        if i not in matched_gt:
            gt_class = gt['class_id']
            confusion_matrix[gt_class][gt_class] += 1
    
    return confusion_matrix


def calculate_detection_statistics(
    detections: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Calculate statistics for a list of detections.
    
    Args:
        detections: List of detection dictionaries
        
    Returns:
        Dictionary with statistics
    """
    if not detections:
        return {
            'total_detections': 0,
            'class_distribution': {},
            'confidence_mean': 0.0,
            'confidence_std': 0.0,
            'confidence_min': 0.0,
            'confidence_max': 0.0,
            'avg_bbox_area': 0.0,
            'avg_bbox_width': 0.0,
            'avg_bbox_height': 0.0
        }
    
    # Count detections per class
    class_counts = defaultdict(int)
    confidences = []
    bbox_areas = []
    bbox_widths = []
    bbox_heights = []
    
    for det in detections:
        class_id = det['class_id']
        class_counts[class_id] += 1
        
        confidences.append(det['confidence'])
        
        bbox = det['bbox']
        width = bbox['width']
        height = bbox['height']
        area = width * height
        
        bbox_widths.append(width)
        bbox_heights.append(height)
        bbox_areas.append(area)
    
    confidences = np.array(confidences)
    
    return {
        'total_detections': len(detections),
        'class_distribution': dict(class_counts),
        'confidence_mean': float(np.mean(confidences)),
        'confidence_std': float(np.std(confidences)),
        'confidence_min': float(np.min(confidences)),
        'confidence_max': float(np.max(confidences)),
        'avg_bbox_area': float(np.mean(bbox_areas)) if bbox_areas else 0.0,
        'avg_bbox_width': float(np.mean(bbox_widths)) if bbox_widths else 0.0,
        'avg_bbox_height': float(np.mean(bbox_heights)) if bbox_heights else 0.0
    }


def format_metrics_report(metrics: Dict[str, Any]) -> str:
    """
    Format metrics dictionary into a readable report.
    
    Args:
        metrics: Dictionary of metrics
        
    Returns:
        Formatted report string
    """
    lines = [
        "=" * 60,
        "DETECTION METRICS REPORT",
        "=" * 60,
    ]
    
    if 'precision' in metrics:
        lines.append(f"\nPrecision: {metrics['precision']:.4f}")
    
    if 'recall' in metrics:
        lines.append(f"Recall: {metrics['recall']:.4f}")
    
    if 'f1_score' in metrics:
        lines.append(f"F1 Score: {metrics['f1_score']:.4f}")
    
    if 'map50' in metrics:
        lines.append(f"mAP@50: {metrics['map50']:.4f}")
    
    if 'map50_95' in metrics:
        lines.append(f"mAP@50-95: {metrics['map50_95']:.4f}")
    
    if 'total_detections' in metrics:
        lines.append(f"\nTotal Detections: {metrics['total_detections']}")
    
    if 'class_distribution' in metrics:
        lines.append("\nClass Distribution:")
        for class_id, count in metrics['class_distribution'].items():
            lines.append(f"  Class {class_id}: {count}")
    
    if 'confidence_mean' in metrics:
        lines.append(f"\nConfidence Statistics:")
        lines.append(f"  Mean: {metrics['confidence_mean']:.4f}")
        lines.append(f"  Std: {metrics['confidence_std']:.4f}")
        lines.append(f"  Min: {metrics['confidence_min']:.4f}")
        lines.append(f"  Max: {metrics['confidence_max']:.4f}")
    
    lines.append("=" * 60)
    
    return "\n".join(lines)
