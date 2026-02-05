# main.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
import cv2
import numpy as np
import os
from logic import process_damage
from quality_service import validate_image_quality
from averaging_logic import calculate_average_verdict, get_part_base_cost
from utils.supabase_client import (
    upload_to_storage, insert_scan_record, create_damage_records,
    update_damage_refinement
)
from utils.pdf_generator import create_damage_report

app = FastAPI()

# --- 1. CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. DIRECTORIES ---
os.makedirs("analyzed_images", exist_ok=True)

# --- 3. SERVE STATIC FILES ---
app.mount("/analyzed", StaticFiles(directory="analyzed_images"), name="analyzed")

# --- 4. LOAD MODELS ---
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


# --- 5. OPTIMIZED DETECTION FUNCTIONS ---

def apply_clahe(image):
    """Apply CLAHE to enhance scratches (LAB color space)."""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l_channel_clahe = clahe.apply(l_channel)
    lab_clahe = cv2.merge([l_channel_clahe, a_channel, b_channel])
    enhanced = cv2.cvtColor(lab_clahe, cv2.COLOR_LAB2BGR)
    return enhanced


def merge_close_boxes(boxes, distance_threshold=50):
    """
    Merge bounding boxes that are close together (< distance_threshold pixels).
    Turns 'dotted line' detections into single scratches.
    """
    if len(boxes) == 0:
        return boxes
    
    merged = []
    used = [False] * len(boxes)
    
    for i in range(len(boxes)):
        if used[i]:
            continue
            
        current_box = boxes[i].copy()
        used[i] = True
        
        # Find all boxes close to this one
        for j in range(i + 1, len(boxes)):
            if used[j]:
                continue
                
            # Calculate center distance
            center1 = ((current_box[0] + current_box[2]) / 2, (current_box[1] + current_box[3]) / 2)
            center2 = ((boxes[j][0] + boxes[j][2]) / 2, (boxes[j][1] + boxes[j][3]) / 2)
            distance = np.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)
            
            if distance < distance_threshold:
                # Merge boxes (take min/max coordinates)
                current_box[0] = min(current_box[0], boxes[j][0])  # x1
                current_box[1] = min(current_box[1], boxes[j][1])  # y1
                current_box[2] = max(current_box[2], boxes[j][2])  # x2
                current_box[3] = max(current_box[3], boxes[j][3])  # y2
                used[j] = True
        
        merged.append(current_box)
    
    return np.array(merged)


def filter_reflections(boxes, image_shape, max_area_ratio=0.25, square_aspect_tolerance=0.15):
    """
    Filter out likely reflections:
    - Boxes larger than 25% of image area
    - Perfectly square boxes (aspect ratio ~1.0) unless very small
    """
    if len(boxes) == 0:
        return boxes
    
    img_h, img_w = image_shape[:2]
    img_area = img_h * img_w
    filtered = []
    
    for box in boxes:
        x1, y1, x2, y2 = box
        box_w = x2 - x1
        box_h = y2 - y1
        box_area = box_w * box_h
        
        
        
        # Filter 2: Square aspect ratio (likely reflection, unless small)
        aspect_ratio = box_w / box_h if box_h > 0 else 0
        is_square = abs(aspect_ratio - 1.0) < square_aspect_tolerance
        is_small = box_area < (img_area * 0.01)  # < 1% of image
        
        if is_square and not is_small:
            continue
        
        filtered.append(box)
    
    return np.array(filtered) if filtered else np.array([])


def smart_detect(image, model):
    """
    Optimized detection:
    1. Apply CLAHE preprocessing
    2. Run YOLO with conf=0.25
    3. Merge close boxes
    4. Filter reflections
    5. Draw boxes on image
    """
    # Step 1: CLAHE enhancement
    enhanced_img = apply_clahe(image)
    
    # Step 2: Run YO LO detection (conf=0.25, imgsz=1280)
    results = model(enhanced_img, conf=0.25, iou=0.5, imgsz=1280, verbose=False)
    
    # Step 3: Extract boxes
    boxes = []
    classes = []
    confidences = []
    
    if results[0].boxes:
        for box in results[0].boxes:
            boxes.append(box.xyxy[0].cpu().numpy())
            confidences.append(float(box.conf[0]))
            classes.append(int(box.cls[0]))
    
    if len(boxes) == 0:
        return results, []
    
    boxes = np.array(boxes)
    
    # Step 4: Merge close boxes
    boxes = merge_close_boxes(boxes, distance_threshold=50)
    
    # Step 5: Filter reflections
    boxes = filter_reflections(boxes, enhanced_img.shape)
    
    # Step 6: Draw boxes on enhanced image
    annotated_img = enhanced_img.copy()
    for i, box in enumerate(boxes):
        x1, y1, x2, y2 = box.astype(int)
        cls = classes[i] if i < len(classes) else 0
        conf = confidences[i] if i < len(confidences) else 0
        
        cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        label = f"Class {cls}: {conf:.2f}"
        cv2.putText(annotated_img, label, (x1, y1 - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    return results, annotated_img


# --- 6. MAIN ENDPOINT ---

@app.post("/analyze")
async def analyze_image(
        file: UploadFile = File(...),
        user_id: str = Form(...),
        car_name: str = Form(...)
):
    """
    Main Endpoint: Receives Image + User ID + Car Name.
    Performs damage analysis, uploads to Supabase, and returns scan data.
    """
    if not model_parts or not model_damage:
        return {"error": "Server Error: AI Models not loaded."}

    # A. Extract car make for luxury pricing (parse from car_name)
    luxury_brands = ["bmw", "mercedes", "audi", "lexus", "porsche", "jaguar", "land rover"]
    price_multiplier = 2.5 if any(brand in car_name.lower() for brand in luxury_brands) else 1.0

    # B. Read image
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        return {"error": "Invalid Image", "details": str(e)}

    # C. Quality check
    quality_result = validate_image_quality(img)
    if quality_result is not True:
        return {"error": "Image Quality Issue", "details": quality_result}

    # D. Run YOLO AI
    print("🔍 Scanning for Parts & Damage...")
    parts_results = model_parts(img)
    
    print("🚀 Using Smart Detection (CLAHE + Merging + Filtering)...")
    damage_results, annotated_img = smart_detect(img, model_damage)
    
    # E. Save images locally (temporary)
    import uuid
    from utils import upload_to_storage, insert_scan_record, create_damage_report
    
    temp_id = str(uuid.uuid4())[:8]
    original_path = os.path.join("analyzed_images", f"original_{temp_id}.jpg")
    processed_path = os.path.join("analyzed_images", f"processed_{temp_id}.jpg")
    pdf_path = os.path.join("analyzed_images", f"report_{temp_id}.pdf")
    
    cv2.imwrite(original_path, img)
    cv2.imwrite(processed_path, annotated_img)

    # F. Run logic + depth analysis
    try:
        final_report = process_damage(parts_results, damage_results, img, price_multiplier)
        final_report["vehicle_info"] = {
            "car_name": car_name,
            "is_luxury": price_multiplier > 1.0
        }
        
        # G. Generate Heatmap Image using Gaussian Splatting
        heatmap_path = f"analyzed_images/heatmap_{temp_id}.jpg"
        
        # Create blank mask for thermal visualization
        mask = np.zeros(img.shape[:2], dtype=np.uint8)
        
        # Draw hot spots for each damage
        for damage in final_report.get("damages", []):
            x1, y1, x2, y2 = damage["box"]
            severity = damage.get("severity", 50)
            
            # Calculate center and radius for organic spread
            center = ((x1 + x2) // 2, (y1 + y2) // 2)
            radius = int(max(x2 - x1, y2 - y1) * 0.7)
            
            # Intensity based on severity (0-100 → 0-255)
            intensity = int((severity / 100) * 255)
            
            # Draw filled circle (hot spot)
            cv2.circle(mask, center, radius, intensity, -1)
        
        # Apply heavy Gaussian blur to create spreading thermal clouds
        heatmap_blurred = cv2.GaussianBlur(mask, (101, 101), 0)
        
        # Apply thermal color map (Blue=cold, Red=hot)
        heatmap_colored = cv2.applyColorMap(heatmap_blurred, cv2.COLORMAP_JET)
        
        # Mask out cold (blue) areas to keep car visible where no damage
        # Only show heat where mask intensity is above threshold
        alpha_mask = (heatmap_blurred > 30).astype(np.float32)
        alpha_mask = cv2.cvtColor((alpha_mask * 255).astype(np.uint8), cv2.COLOR_GRAY2BGR) / 255.0
        
        # Smart overlay: blend colored heatmap only where there's heat
        heatmap_img = img.copy().astype(np.float32)
        heatmap_img = heatmap_img * (1 - alpha_mask * 0.4) + heatmap_colored.astype(np.float32) * (alpha_mask * 0.4)
        heatmap_img = np.clip(heatmap_img, 0, 255).astype(np.uint8)
        
        cv2.imwrite(heatmap_path, heatmap_img)
        
        # H. Generate PDF
        pdf_data = {
            "car_name": car_name,
            "user_id": user_id,
            "scan_id": temp_id,
            "damages": final_report.get("damages", []),
            "total_estimate": final_report.get("total_estimate", 0),
            "currency": final_report.get("currency", "INR"),
            "original_image_path": original_path,
            "processed_image_path": processed_path
        }
        
        pdf_success = create_damage_report(pdf_data, pdf_path)
        if not pdf_success:
            print("⚠️ PDF generation failed, continuing without it")
        
        # I. Upload to Supabase Storage
        print("📤 Uploading to Supabase...")
        image_urls = {
            "original": upload_to_storage(original_path, "original"),
            "processed": upload_to_storage(processed_path, "processed"),
            "heatmap": upload_to_storage(heatmap_path, "heatmaps"),
            "pdf": upload_to_storage(pdf_path, "reports") if pdf_success else None
        }
        
        # J. Insert scan record into database
        scan_id = insert_scan_record(user_id, car_name, final_report, image_urls)
        
        # J2. Create individual damage records (NEW)
        if scan_id and final_report.get("damages"):
            damage_ids = create_damage_records(scan_id, final_report["damages"])
            print(f"✅ Created {len(damage_ids)} damage records")
        
        # K. Cleanup local files
        for path in [original_path, processed_path, heatmap_path, pdf_path]:
            if os.path.exists(path):
                os.remove(path)
        
        # L. Return response
        final_report["scan_id"] = scan_id
        final_report["total_cost"] = final_report.get("total_estimate", 0)  # Add total_cost for frontend
        final_report["original_image_url"] = image_urls["original"]
        final_report["processed_image_url"] = image_urls["processed"]
        final_report["heatmap_image_url"] = image_urls["heatmap"]
        final_report["pdf_url"] = image_urls["pdf"]
        
        return {
            "status": "success",
            "message": "Analysis complete",
            **final_report
        }
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {"error": "Analysis Failed", "details": str(e)}





@app.post("/analyze/refine")
async def refine_damage_analysis(
    damage_id: str = Form(...),
    part_name: str = Form(...),
    damage_type: str = Form(...),
    file_left: UploadFile = File(...),
    file_center: UploadFile = File(...),
    file_right: UploadFile = File(...)
):
    """
    Multi-angle refinement endpoint.
    Accepts 3 close-up photos and calculates averaged severity verdict.
    """
    try:
        print(f"🔄 Refining damage {damage_id} with 3 close-up photos...")
        
        # A. Save uploaded files
        import uuid
        temp_id = str(uuid.uuid4())[:8]
        
        file_paths = []
        for idx, upload_file in enumerate([file_left, file_center, file_right], 1):
            file_path = f"analyzed_images/closeup_{temp_id}_angle{idx}.jpg"
            
            with open(file_path, "wb") as f:
                f.write(await upload_file.read())
            
            file_paths.append(file_path)
            print(f"✅ Saved angle {idx}: {file_path}")
        
        # B. Load images
        images = [cv2.imread(path) for path in file_paths]
        
        # C. Calculate average verdict
        base_cost = get_part_base_cost(part_name)
        verdict = calculate_average_verdict(images, damage_type, part_name, base_cost)
        
        # D. Upload close-ups to Supabase
        print("📤 Uploading close-ups to Supabase...")
        closeup_urls = [
            upload_to_storage(file_paths[0], "closeups"),
            upload_to_storage(file_paths[1], "closeups"),
            upload_to_storage(file_paths[2], "closeups")
        ]
        
        # E. Update damage record
        success = update_damage_refinement(
            damage_id=damage_id,
            closeup_urls=closeup_urls,
            severity_scores=verdict["severity_scores"],
            final_severity=verdict["final_severity"],
            action=verdict["action"],
            cost=verdict["cost"],
            confidence=verdict["confidence"]
        )
        
        # F. Cleanup local files
        for path in file_paths:
            if os.path.exists(path):
                os.remove(path)
        
        # G. Return refined verdict
        return {
            "status": "success" if success else "error",
            "damage_id": damage_id,
            **verdict,
            "closeup_urls": closeup_urls
        }
        
    except Exception as e:
        print(f"❌ Refinement error: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


# --- SERVER STARTUP ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)