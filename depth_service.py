# depth_service.py
from transformers import pipeline
from PIL import Image
import numpy as np
import cv2
import base64
import matplotlib.pyplot as plt

# 1. Load the Depth Model
# First run will download ~300MB. Subsequent runs will be instant.
print("⏳ Loading Depth AI... (This may take a moment)")
depth_estimator = pipeline(task="depth-estimation", model="LiheYoung/depth-anything-small-hf")
print("✅ Depth AI Loaded.")


def analyze_dent_depth(image_crop_bgr):
    """
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
        # Calculate standard deviation (variance) of depth.
        # High variance = Deep hole vs surrounding metal.
        depth_std = np.std(depth_map)

        # Normalize score (Empirical: ~20.0 variance is a deep dent)
        score = min(depth_std / 20.0, 1.0)

        # --- VISUAL: GENERATE HEATMAP ---
        # Normalize to 0-255
        depth_min = depth_map.min()
        depth_max = depth_map.max()
        depth_normalized = (depth_map - depth_min) / (depth_max - depth_min)

        # Apply "Inferno" colormap (looks like X-Ray/Heat)
        colormap = plt.get_cmap('inferno')
        heatmap_colored = (colormap(depth_normalized) * 255).astype(np.uint8)[:, :, :3]

        # Encode to Base64 for Frontend
        is_success, buffer = cv2.imencode(".png", cv2.cvtColor(heatmap_colored, cv2.COLOR_RGB2BGR))
        heatmap_base64 = base64.b64encode(buffer).decode("utf-8")

        return {
            "score": round(score, 2),
            "heatmap": heatmap_base64
        }

    except Exception as e:
        print(f"⚠️ Depth Error: {e}")
        return {"score": 0.0, "heatmap": None}