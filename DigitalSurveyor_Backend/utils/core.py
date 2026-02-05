# utils/core.py
import cv2
import numpy as np


def calculate_severity(image, box):
    """
    Calculate damage severity using local contrast (standard deviation).
    
    Args:
        image: Full BGR image
        box: [x1, y1, x2, y2] bounding box coordinates
    
    Returns:
        int: Severity score from 10-95
        
    Logic:
        - Faint scratches have low std_dev (~20 score)
        - Deep dents have high std_dev (~80 score)
    """
    try:
        # Extract ROI
        x1, y1, x2, y2 = [int(coord) for coord in box]
        roi = image[y1:y2, x1:x2]

        if roi.size == 0:
            return 50

        # Apply Gaussian Blur to remove noise
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)

        # Calculate Laplacian variance (roughness)
        laplacian_var = cv2.Laplacian(blurred, cv2.CV_64F).var()

        # Logarithmic scaling (dampens large values)
        score = np.log1p(laplacian_var) * 12

        # Cap between 10-95
        final_severity = int(min(max(score, 10), 95))

        print(f"DEBUG: Box Raw Variance: {laplacian_var} -> Final Score: {final_severity}")

        return final_severity

    except Exception as e:
        print(f"Error calculating severity: {e}")
        return 50


def generate_heatmap(image, detections):
    """
    Generate a professional thermal heatmap using Gaussian Splatting with Ellipses.
    
    Improvements over circle-based approach:
    - Uses ellipses to match actual damage shape (long scratches = long heatmaps)
    - Soft alpha blending for smooth fade (no hard edges)
    
    Args:
        image: Full BGR image (numpy array)
        detections: List of damage dicts with keys: 'box' [x1,y1,x2,y2], 'severity' (0-100)
    
    Returns:
        numpy array: Blended heatmap overlay image
    """
    try:
        h, w = image.shape[:2]
        
        # 1. Create blank grayscale mask
        heatmap_mask = np.zeros((h, w), dtype=np.uint8)
        
        # 2. Add 'Heat Sources' using ELLIPSES (matches damage shape)
        for damage in detections:
            # Unpack coordinates
            box = damage.get('box', damage.get('bounding_box', []))
            if len(box) < 4:
                continue
                
            x1, y1, x2, y2 = map(int, box[:4])
            severity = damage.get('severity', 50)
            
            # Calculate center point
            center_x = int((x1 + x2) / 2)
            center_y = int((y1 + y2) / 2)
            
            # Calculate bounding box dimensions
            box_w = x2 - x1
            box_h = y2 - y1
            
            # Use ELLIPSE to match damage shape
            # Scale axes slightly (0.7x) so the glow is tight to the damage
            axes = (int(box_w * 0.7), int(box_h * 0.7))
            angle = 0
            
            # Map severity (0-100) to intensity (50-255)
            intensity = int(np.interp(severity, [0, 100], [50, 255]))
            
            # Draw filled ellipse (matches damage shape - long scratch = long heatmap)
            cv2.ellipse(heatmap_mask, (center_x, center_y), axes, angle, 0, 360, intensity, -1)
        
        # 3. Apply heavy Gaussian blur for 'Cloud' effect
        # (101, 101) kernel creates organic spreading clouds
        heatmap_mask = cv2.GaussianBlur(heatmap_mask, (101, 101), 0)
        
        # 4. Colorize with JET colormap (Blue→Green→Yellow→Red)
        heatmap_color = cv2.applyColorMap(heatmap_mask, cv2.COLORMAP_JET)
        
        # 5. Soft Alpha Blending (eliminates hard edges)
        # Normalize mask to 0.0 - 0.6 (Max 60% opacity for smooth fade)
        alpha = heatmap_mask.astype(float) / 255.0 * 0.6
        alpha = cv2.merge([alpha, alpha, alpha])  # 3 channels for RGB
        
        # Blend: Original * (1 - alpha) + Heatmap * alpha
        final_image = image.astype(float) * (1.0 - alpha) + heatmap_color.astype(float) * alpha
        
        return final_image.astype(np.uint8)
        
    except Exception as e:
        print(f"Error generating heatmap: {e}")
        return image


def encode_image_to_base64(image_path):
    """Encode image file to base64 string."""
    import base64
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None
