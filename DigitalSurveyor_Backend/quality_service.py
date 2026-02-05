# quality_service.py
import cv2
import numpy as np


def validate_image_quality(image):
    """
    Validate image quality before AI processing.
    
    Input: OpenCV Image (BGR numpy array)
    Output: True if image passes all checks, otherwise error message string
    """
    try:
        # --- 1. BLUR CHECK ---
        # Convert to grayscale for Laplacian calculation
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Calculate variance of Laplacian (higher = sharper)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if laplacian_var < 100:
            return "Too Blurry"
        
        # --- 2. DARKNESS CHECK ---
        # Calculate average pixel intensity
        mean_intensity = np.mean(gray)
        
        if mean_intensity < 50:
            return "Too Dark"
        
        # --- 3. GLARE CHECK ---
        # Count pixels that are pure white (255 in all channels)
        white_pixels = np.sum(np.all(image >= 250, axis=2))
        total_pixels = image.shape[0] * image.shape[1]
        white_percentage = (white_pixels / total_pixels) * 100
        
        if white_percentage > 5:
            return "Too Much Glare"
        
        # All checks passed
        return True
        
    except Exception as e:
        return f"Quality Check Failed: {str(e)}"
