# depth_service.py
from transformers import pipeline
from PIL import Image
import numpy as np
import cv2
import base64

# Load the Depth Model (First run downloads ~300MB, subsequent runs are instant)
print("⏳ Loading Depth AI... (This may take a moment)")
depth_estimator = pipeline(task="depth-estimation", model="LiheYoung/depth-anything-small-hf")
print("✅ Depth AI Loaded.")


def analyze_dent_depth(image_crop_bgr):
    """
    Use deep learning to analyze dent depth.
    
    Input: OpenCV Image (BGR) of just the dent.
    Output: {score: 0.0-1.0, heatmap: base64_string}
    """
    try:
        # Convert BGR to RGB (PIL)
        img_rgb = cv2.cvtColor(image_crop_bgr, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(img_rgb)

        # Run AI Inference
        result = depth_estimator(pil_image)
        depth_map = np.array(result["depth"])

        # --- MATH: CALCULATE SEVERITY ---
        # 1. Normalize Depth Map to 0-1 range globally for this crop
        # This removes the issue of arbitrary raw value scales from the model
        d_min, d_max = depth_map.min(), depth_map.max()
        if d_max > d_min:
            depth_norm = (depth_map - d_min) / (d_max - d_min)
        else:
            depth_norm = depth_map * 0  # Flat surface if min == max
            
        # 2. Calculate Standard Deviation on Normalized Map
        # For a 0-1 range, max possible std is 0.5 (binary image). 
        # Realistic deep dents are ~0.15 - 0.25. Scratches ~0.05.
        depth_std = np.std(depth_norm)
        
        # 3. Scale to 0-1 Score
        # 0.25 std -> 1.0 score (Very severe)
        score = min(depth_std * 4.0, 1.0)
        
        print(f"📉 DEBUG: Raw Min: {d_min:.2f}, Max: {d_max:.2f} | Norm Std: {depth_std:.4f} | Final Score: {score:.2f}")

        # --- VISUAL: GENERATE HEATMAP ---
        # Reuse normalized map
        # Apply JET colormap
        depth_8bit = (depth_norm * 255).astype(np.uint8)
        heatmap_colored = cv2.applyColorMap(depth_8bit, cv2.COLORMAP_JET)

        # Resize heatmap to match original image dimensions
        heatmap_resized = cv2.resize(heatmap_colored, (image_crop_bgr.shape[1], image_crop_bgr.shape[0]))

        # Blend original image with heatmap (60% car, 40% heatmap for ghostly effect)
        final_overlay = cv2.addWeighted(image_crop_bgr, 0.6, heatmap_resized, 0.4, 0)

        # Encode blended result to Base64 for Frontend
        is_success, buffer = cv2.imencode(".png", final_overlay)
        heatmap_base64 = base64.b64encode(buffer).decode("utf-8") if is_success else None

        return {
            "score": round(score, 2),
            "severity": int(min(score * 100, 95)),  # Cap at 95
            "heatmap": heatmap_base64
        }

    except Exception as e:
        print(f"⚠️ Depth AI Error: {e}")
        return {"score": 0.0, "severity": 50, "heatmap": None}