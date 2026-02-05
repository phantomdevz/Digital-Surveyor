# logic/averaging.py
"""
Multi-angle averaging logic for refined severity assessment.
Analyzes 3 close-up photos from different angles to calculate average severity.
"""

import cv2
import numpy as np
from depth_service import analyze_dent_depth


def calculate_average_verdict(
    images: list,
    damage_type: str,
    part_name: str,
    base_cost: int = 10000
) -> dict:
    """
    Analyze 3 close-up photos and return averaged verdict.
    
    Args:
        images: List of 3 cv2 images [left, center, right]
        damage_type: e.g., "Dent", "Scratch"
        part_name: e.g., "Door", "Fender"
        base_cost: Base repair cost for this part
    
    Returns:
        {
            "severity_scores": [85, 90, 88],
            "final_severity": 87,
            "action": "Part Replacement",
            "cost": 18000,
            "confidence": "high",
            "std_deviation": 2.16
        }
    """
    severity_scores = []
    
    # Analyze each image
    for idx, img in enumerate(images):
        try:
            # Full image bounding box for close-up
            h, w = img.shape[:2]
            full_box = [0, 0, w, h]
            
            # Use depth analysis for dents, fixed severity for scratches
            if damage_type.lower() in ['dent', 'crash']:
                depth_result = analyze_dent_depth(img)
                severity = int(depth_result['score'] * 100)
            else:
                severity = 50  # Fixed moderate severity (contrast detection removed)
            
            severity_scores.append(severity)
            print(f"📸 Photo {idx+1} severity: {severity}")
            
        except Exception as e:
            print(f"⚠️ Error analyzing photo {idx+1}: {e}")
            # Use average of other scores if one fails
            if severity_scores:
                severity_scores.append(int(np.mean(severity_scores)))
            else:
                severity_scores.append(50)  # Fallback
    
    # Calculate statistics
    avg_severity = int(np.mean(severity_scores))
    std_dev = float(np.std(severity_scores))
    
    # Determine confidence based on consistency
    if std_dev < 10:
        confidence = "high"  # All photos agree
    elif std_dev < 20:
        confidence = "medium"  # Some variation
    else:
        confidence = "low"  # High disagreement
    
    # Determine action based on average severity
    if avg_severity > 75:
        action = "Part Replacement"
        cost_multiplier = 2.0
    elif avg_severity > 50:
        action = "Sheet Metal Repair"
        cost_multiplier = 1.0
    else:
        action = "Polish/Paint"
        cost_multiplier = 0.5
    
    final_cost = int(base_cost * cost_multiplier)
    
    result = {
        "severity_scores": severity_scores,
        "final_severity": avg_severity,
        "action": action,
        "cost": final_cost,
        "confidence": confidence,
        "std_deviation": std_dev
    }
    
    print(f"📊 Average Verdict: {avg_severity}/100 | Action: {action} | Confidence: {confidence}")
    
    return result


def get_part_base_cost(part_name: str) -> int:
    """Get base repair cost for a car part."""
    cost_map = {
        "door": 12000,
        "fender": 10000,
        "bumper": 8000,
        "hood": 15000,
        "trunk": 12000,
        "quarter panel": 18000,
        "roof": 20000,
        "windshield": 10000,
        "headlight": 5000,
        "taillight": 4000,
        "mirror": 3000,
        "wheel": 6000
    }
    
    part_lower = part_name.lower()
    for key in cost_map:
        if key in part_lower:
            return cost_map[key]
    
    return 10000  # Default
