# main.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import os
from logic import process_damage

app = FastAPI()

# --- 1. ENABLE FRONTEND COMMUNICATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. LOAD YOLO MODELS ---
model_parts = None
model_damage = None

print("------------------------------------------------")
print("🚀 STARTING AI ENGINE...")

if os.path.exists("parts.pt"):
    model_parts = YOLO('parts.pt')
    print("✅ SUCCESS: 'parts.pt' loaded.")
else:
    print("⚠️ WARNING: 'parts.pt' missing.")

if os.path.exists("damage.pt"):
    model_damage = YOLO('damage.pt')
    print("✅ SUCCESS: 'damage.pt' loaded.")
else:
    print("⚠️ WARNING: 'damage.pt' missing.")
print("------------------------------------------------")


@app.post("/analyze")
async def analyze_image(
        file: UploadFile = File(...),
        car_make: str = Form(...),
        car_model: str = Form(...)
):
    """
    Main Endpoint: Receives Image + Car Make/Model.
    Returns: JSON with costs, decisions, and depth heatmaps.
    """
    if not model_parts or not model_damage:
        return {"error": "Server Error: AI Models not loaded."}

    # A. Determine Price Multiplier (Luxury Logic)
    luxury_brands = ["bmw", "mercedes", "audi", "lexus", "porsche", "jaguar", "land rover"]
    price_multiplier = 1.0
    if car_make.lower() in luxury_brands:
        price_multiplier = 2.5  # Luxury Tax
        print(f"💰 Luxury Car ({car_make}): Applying 2.5x Multiplier")

    # B. Read Image
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        return {"error": "Invalid Image", "details": str(e)}

    # C. Run YOLO AI
    print("🔍 Scanning for Parts & Damage...")
    parts_results = model_parts(img)
    damage_results = model_damage(img, conf=0.40, iou=0.5)

    # D. Run Logic + Depth Analysis
    print("🧠 Processing Depth & Costs...")
    try:
        # Pass the full image so we can crop dents for depth analysis
        final_report = process_damage(parts_results, damage_results, img, price_multiplier)

        # Add vehicle info for frontend display
        final_report["vehicle_info"] = {
            "make": car_make,
            "model": car_model,
            "is_luxury": price_multiplier > 1.0
        }

        return final_report

    except Exception as e:
        print(f"❌ LOGIC ERROR: {e}")
        return {"error": "Calculation Failed", "details": str(e)}