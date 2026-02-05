# utils.py
import cv2
import numpy as np


def calculate_severity(image, box):
    """
    Calculate damage severity using logarithmic scaling with Laplacian variance.
    
    Args:
        image: Full BGR image
        box: [x1, y1, x2, y2] bounding box coordinates
    
    Returns:
        int: Severity score from 10-95
        
    Logic:
        - Uses Laplacian variance to measure roughness/edges
        - Applies logarithmic scaling to dampen extreme values
        - Clean car: ~100 variance → ~4.6 log → ~55 score
        - Scratch: ~500 variance → ~6.2 log → ~74 score
        - Deep dent/crash: ~5000 variance → ~8.5 log → ~95 score
    """
    try:
        x1, y1, x2, y2 = map(int, box)
        
        # Extract ROI
        roi = image[y1:y2, x1:x2]
        
        if roi.size == 0:
            return 50  # Default middle score
        
        # Convert to grayscale
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian Blur to remove camera noise and grain
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Measure roughness using Laplacian variance
        laplacian_var = cv2.Laplacian(blurred, cv2.CV_64F).var()
        
        # Apply logarithmic scaling to dampen large values
        # np.log1p(x) = log(1 + x) to handle zero variance safely
        score = np.log1p(laplacian_var) * 12
        
        # Cap the result between 10 and 95
        final_severity = int(min(max(score, 10), 95))
        
        # Debug logging
        print(f"🔍 DEBUG: Box Raw Variance: {laplacian_var:.2f} → Final Score: {final_severity}")
        
        return final_severity
        
    except Exception as e:
        print(f"⚠️ Severity calculation error: {e}")
        return 50  # Default middle score


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
        print(f"⚠️ Heatmap generation error: {e}")
        return image


def encode_image_to_base64(image):
    """Convert CV2 image to base64 string for API response."""
    import base64
    
    try:
        _, buffer = cv2.imencode('.jpg', image)
        return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        print(f"⚠️ Base64 encoding error: {e}")
        return None
