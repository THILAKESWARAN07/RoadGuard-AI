#!/usr/bin/env python3
"""
YOLOv8 Dataset Preparation Script
Prepares the RoadGuard-AI dataset for YOLOv8 training.
"""

import os
import shutil
import random
from pathlib import Path
from typing import List, Tuple, Dict
from collections import Counter

# Set random seed for reproducibility
random.seed(42)

# Paths
BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
IMAGES_DIR = DATA_DIR / "images"
LABELS_DIR = DATA_DIR / "labels-YOLO"
OUTPUT_DIR = DATA_DIR / "road_damage"

# Dataset split ratios
TRAIN_RATIO = 0.70
VAL_RATIO = 0.20
TEST_RATIO = 0.10

# Class names mapping
CLASS_NAMES = {
    0: "pothole",
    1: "crack",
    2: "manhole"
}


def analyze_dataset() -> Tuple[List[str], List[str], List[str]]:
    """
    Analyze the dataset and match images with labels.
    
    Returns:
        Tuple of (matched_pairs, missing_labels, extra_labels)
    """
    print("=" * 60)
    print("DATASET ANALYSIS")
    print("=" * 60)
    
    # Get all image files
    image_files = [f.stem for f in IMAGES_DIR.glob("*.jpg")]
    image_files.sort()
    
    # Get all label files
    label_files = [f.stem for f in LABELS_DIR.glob("*.txt")]
    label_files.sort()
    
    print(f"\nTotal images found: {len(image_files)}")
    print(f"Total labels found: {len(label_files)}")
    
    # Find matched pairs
    matched_pairs = set(image_files) & set(label_files)
    matched_pairs = sorted(list(matched_pairs))
    
    # Find missing labels
    missing_labels = set(image_files) - set(label_files)
    missing_labels = sorted(list(missing_labels))
    
    # Find extra labels (labels without images)
    extra_labels = set(label_files) - set(image_files)
    extra_labels = sorted(list(extra_labels))
    
    print(f"\nMatched image-label pairs: {len(matched_pairs)}")
    print(f"Images missing labels: {len(missing_labels)}")
    print(f"Labels without images: {len(extra_labels)}")
    
    if missing_labels:
        print(f"\n⚠️  Images missing labels (will be skipped):")
        for img in missing_labels[:10]:
            print(f"   - {img}.jpg")
        if len(missing_labels) > 10:
            print(f"   ... and {len(missing_labels) - 10} more")
    
    if extra_labels:
        print(f"\n⚠️  Labels without images (will be skipped):")
        for lbl in extra_labels[:10]:
            print(f"   - {lbl}.txt")
        if len(extra_labels) > 10:
            print(f"   ... and {len(extra_labels) - 10} more")
    
    return matched_pairs, missing_labels, extra_labels


def analyze_label_distribution(pairs: List[str]) -> Dict[int, int]:
    """
    Analyze the distribution of classes in the labels.
    
    Args:
        pairs: List of matched image-label pairs
        
    Returns:
        Dictionary mapping class IDs to their counts
    """
    print("\n" + "=" * 60)
    print("LABEL DISTRIBUTION ANALYSIS")
    print("=" * 60)
    
    class_counts = Counter()
    
    for pair in pairs:
        label_file = LABELS_DIR / f"{pair}.txt"
        if label_file.exists():
            with open(label_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        parts = line.split()
                        if parts:
                            class_id = int(parts[0])
                            class_counts[class_id] += 1
    
    print("\nClass distribution:")
    total = sum(class_counts.values())
    for class_id in sorted(class_counts.keys()):
        count = class_counts[class_id]
        percentage = (count / total * 100) if total > 0 else 0
        class_name = CLASS_NAMES.get(class_id, f"class_{class_id}")
        print(f"  {class_id} ({class_name}): {count} annotations ({percentage:.1f}%)")
    
    print(f"\nTotal annotations: {total}")
    
    return dict(class_counts)


def create_folder_structure() -> None:
    """Create the YOLOv8 folder structure."""
    print("\n" + "=" * 60)
    print("CREATING FOLDER STRUCTURE")
    print("=" * 60)
    
    folders = [
        OUTPUT_DIR / "train" / "images",
        OUTPUT_DIR / "train" / "labels",
        OUTPUT_DIR / "valid" / "images",
        OUTPUT_DIR / "valid" / "labels",
        OUTPUT_DIR / "test" / "images",
        OUTPUT_DIR / "test" / "labels",
    ]
    
    for folder in folders:
        folder.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created: {folder.relative_to(BASE_DIR)}")


def split_dataset(pairs: List[str]) -> Tuple[List[str], List[str], List[str]]:
    """
    Split the dataset into train, validation, and test sets.
    
    Args:
        pairs: List of matched image-label pairs
        
    Returns:
        Tuple of (train_pairs, val_pairs, test_pairs)
    """
    print("\n" + "=" * 60)
    print("SPLITTING DATASET")
    print("=" * 60)
    
    # Shuffle the pairs
    shuffled_pairs = pairs.copy()
    random.shuffle(shuffled_pairs)
    
    # Calculate split sizes
    total = len(shuffled_pairs)
    train_size = int(total * TRAIN_RATIO)
    val_size = int(total * VAL_RATIO)
    test_size = total - train_size - val_size
    
    # Split
    train_pairs = shuffled_pairs[:train_size]
    val_pairs = shuffled_pairs[train_size:train_size + val_size]
    test_pairs = shuffled_pairs[train_size + val_size:]
    
    print(f"\nDataset split (seed=42):")
    print(f"  Train:      {len(train_pairs)} images ({len(train_pairs)/total*100:.1f}%)")
    print(f"  Validation: {len(val_pairs)} images ({len(val_pairs)/total*100:.1f}%)")
    print(f"  Test:       {len(test_pairs)} images ({len(test_pairs)/total*100:.1f}%)")
    
    return train_pairs, val_pairs, test_pairs


def copy_files(pairs: List[str], split_name: str) -> None:
    """
    Copy image and label files to the appropriate split folder.
    
    Args:
        pairs: List of image-label pairs for this split
        split_name: Name of the split ('train', 'valid', 'test')
    """
    print(f"\nCopying {split_name} files...")
    
    images_dest = OUTPUT_DIR / split_name / "images"
    labels_dest = OUTPUT_DIR / split_name / "labels"
    
    copied_count = 0
    for pair in pairs:
        # Copy image
        src_image = IMAGES_DIR / f"{pair}.jpg"
        dst_image = images_dest / f"{pair}.jpg"
        if src_image.exists():
            shutil.copy2(src_image, dst_image)
            copied_count += 1
        
        # Copy label
        src_label = LABELS_DIR / f"{pair}.txt"
        dst_label = labels_dest / f"{pair}.txt"
        if src_label.exists():
            shutil.copy2(src_label, dst_label)
    
    print(f"  ✓ Copied {copied_count} image-label pairs to {split_name}/")


def create_data_yaml() -> None:
    """Create the data.yaml configuration file."""
    print("\n" + "=" * 60)
    print("CREATING data.yaml")
    print("=" * 60)
    
    yaml_content = f"""path: ./data/road_damage
train: train/images
val: valid/images
test: test/images

names:
  0: pothole
  1: crack
  2: manhole
"""
    
    yaml_path = OUTPUT_DIR / "data.yaml"
    with open(yaml_path, 'w') as f:
        f.write(yaml_content)
    
    print(f"✓ Created: {yaml_path.relative_to(BASE_DIR)}")
    print("\nYAML content:")
    print(yaml_content)


def verify_dataset(train_pairs: List[str], val_pairs: List[str], test_pairs: List[str]) -> None:
    """
    Verify the prepared dataset and print a final report.
    
    Args:
        train_pairs: Training set pairs
        val_pairs: Validation set pairs
        test_pairs: Test set pairs
    """
    print("\n" + "=" * 60)
    print("DATASET VERIFICATION")
    print("=" * 60)
    
    # Count files in each split
    train_images = len(list((OUTPUT_DIR / "train" / "images").glob("*.jpg")))
    train_labels = len(list((OUTPUT_DIR / "train" / "labels").glob("*.txt")))
    
    val_images = len(list((OUTPUT_DIR / "valid" / "images").glob("*.jpg")))
    val_labels = len(list((OUTPUT_DIR / "valid" / "labels").glob("*.txt")))
    
    test_images = len(list((OUTPUT_DIR / "test" / "images").glob("*.jpg")))
    test_labels = len(list((OUTPUT_DIR / "test" / "labels").glob("*.txt")))
    
    print("\nFile counts:")
    print(f"  Train:")
    print(f"    Images: {train_images}")
    print(f"    Labels: {train_labels}")
    print(f"  Validation:")
    print(f"    Images: {val_images}")
    print(f"    Labels: {val_labels}")
    print(f"  Test:")
    print(f"    Images: {test_images}")
    print(f"    Labels: {test_labels}")
    
    # Verify counts match
    assert train_images == train_labels, f"Train images ({train_images}) != labels ({train_labels})"
    assert val_images == val_labels, f"Val images ({val_images}) != labels ({val_labels})"
    assert test_images == test_labels, f"Test images ({test_images}) != labels ({test_labels})"
    
    print("\n✓ All image-label counts match!")


def print_final_report(
    matched_pairs: List[str],
    missing_labels: List[str],
    extra_labels: List[str],
    train_pairs: List[str],
    val_pairs: List[str],
    test_pairs: List[str],
    class_counts: Dict[int, int]
) -> None:
    """
    Print a comprehensive final report.
    
    Args:
        matched_pairs: All matched image-label pairs
        missing_labels: Images without labels
        extra_labels: Labels without images
        train_pairs: Training set pairs
        val_pairs: Validation set pairs
        test_pairs: Test set pairs
        class_counts: Class annotation counts
    """
    print("\n" + "=" * 60)
    print("FINAL REPORT")
    print("=" * 60)
    
    total_original = len(matched_pairs) + len(missing_labels)
    total_used = len(matched_pairs)
    
    print(f"\nOriginal Dataset:")
    print(f"  Total images: {total_original}")
    print(f"  Images with labels: {total_used}")
    print(f"  Images without labels: {len(missing_labels)}")
    print(f"  Labels without images: {len(extra_labels)}")
    
    print(f"\nPrepared Dataset:")
    print(f"  Total images used: {total_used}")
    print(f"  Train: {len(train_pairs)} ({len(train_pairs)/total_used*100:.1f}%)")
    print(f"  Validation: {len(val_pairs)} ({len(val_pairs)/total_used*100:.1f}%)")
    print(f"  Test: {len(test_pairs)} ({len(test_pairs)/total_used*100:.1f}%)")
    
    print(f"\nSkipped Files:")
    print(f"  Images without labels: {len(missing_labels)}")
    print(f"  Labels without images: {len(extra_labels)}")
    
    print(f"\nAnnotation Statistics:")
    total_annotations = sum(class_counts.values())
    print(f"  Total annotations: {total_annotations}")
    print(f"  Average annotations per image: {total_annotations/total_used:.2f}")
    
    print(f"\nOutput Location:")
    print(f"  {OUTPUT_DIR.relative_to(BASE_DIR)}")
    
    print("\n" + "=" * 60)
    print("✓ DATASET PREPARATION COMPLETE")
    print("=" * 60)


def main():
    """Main execution function."""
    print("\n" + "=" * 60)
    print("YOLOv8 DATASET PREPARATION")
    print("=" * 60)
    print(f"Base directory: {BASE_DIR}")
    print(f"Images directory: {IMAGES_DIR}")
    print(f"Labels directory: {LABELS_DIR}")
    print(f"Output directory: {OUTPUT_DIR}")
    
    # Step 1: Analyze dataset
    matched_pairs, missing_labels, extra_labels = analyze_dataset()
    
    # Step 2: Analyze label distribution
    class_counts = analyze_label_distribution(matched_pairs)
    
    # Step 3: Create folder structure
    create_folder_structure()
    
    # Step 4: Split dataset
    train_pairs, val_pairs, test_pairs = split_dataset(matched_pairs)
    
    # Step 5: Copy files
    copy_files(train_pairs, "train")
    copy_files(val_pairs, "valid")
    copy_files(test_pairs, "test")
    
    # Step 6: Create data.yaml
    create_data_yaml()
    
    # Step 7: Verify dataset
    verify_dataset(train_pairs, val_pairs, test_pairs)
    
    # Step 8: Print final report
    print_final_report(
        matched_pairs,
        missing_labels,
        extra_labels,
        train_pairs,
        val_pairs,
        test_pairs,
        class_counts
    )


if __name__ == "__main__":
    main()
