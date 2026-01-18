# logic.py
from shapely.geometry import box
from depth_service import analyze_dent_depth

# --- PRICING DATABASE (Base Prices) ---
PRICES = {
    "door": {"dent": 200, "scratch": 150, "replace": 900},
    "bumper": {"dent": 180, "scratch": 120, "replace": 600},
    "fender": {"dent": 180, "scratch": 140, "replace": 500},
    "hood": {"dent": 300, "scratch": 200, "replace": 1100},
    "glass": {"shatter": 400, "crack": 300, "replace": 600},
    "unknown": {"dent": 100, "scratch": 80, "replace": 350}
}


def clean_label(label):
    label = label.lower()
    if "door" in label: return "door"
    if "bumper" in label: return "bumper"
    if "fender" in label: return "fender"
    if "hood" in label: return "hood"
    if "glass" in label or "windshield" in label: return "glass"
    return "unknown"


def process_damage(parts_results, damage_results, full_image, price_multiplier=1.0):
    final_report = []
    total_cost = 0

    # 1. Parse Detected Parts
    parts_detected = []
    if parts_results[0].boxes:
        for box_data in parts_results[0].boxes:
            parts_detected.append({
                "name": clean_label(parts_results[0].names[int(box_data.cls[0])]),
                "coords": box_data.xyxy[0].tolist()
            })

    # 2. Parse Detected Damages
    damages_detected = []
    if damage_results[0].boxes:
        for box_data in damage_results[0].boxes:
            damages_detected.append({
                "name": damage_results[0].names[int(box_data.cls[0])],
                "coords": box_data.xyxy[0].tolist()
            })

    # 3. Match and Analyze
    for damage in damages_detected:
        best_part = "unknown"
        max_overlap = 0
        severity_ratio = 0.0
        depth_data = {"score": 0.0, "heatmap": None}

        # --- A. DEPTH ANALYSIS (Only for Dents) ---
        # We save time by only running heavy 3D AI on dents, not scratches.
        if "dent" in damage['name'].lower():
            x1, y1, x2, y2 = map(int, damage['coords'])
            dent_crop = full_image[y1:y2, x1:x2]

            # Check if crop is valid
            if dent_crop.size > 0:
                depth_data = analyze_dent_depth(dent_crop)

        # --- B. FIND THE PART (IoU Calculation) ---
        for part in parts_detected:
            poly_damage = box(*damage['coords'])
            poly_part = box(*part['coords'])
            intersection = poly_damage.intersection(poly_part).area

            if intersection > 0:
                coverage = intersection / poly_part.area
                if coverage > max_overlap:
                    max_overlap = coverage
                    best_part = part['name']
                    severity_ratio = coverage

        # --- C. DECISION LOGIC (The "Judge Pleaser") ---
        action = "Repair"

        # Rule 1: Area is HUGE (>25% of panel) -> Replace
        if severity_ratio > 0.25:
            action = "Replace"

        # Rule 2: Dent is DEEP (Depth Score > 0.6) -> Replace
        # This catches small but deep dents that area logic misses.
        elif depth_data['score'] > 0.6:
            action = "Replace"

        # Rule 3: Glass is broken -> Always Replace
        if damage['name'] in ["shatter", "crack", "smash"]:
            action = "Replace"

        # --- D. CALCULATE PRICE ---
        part_pricing = PRICES.get(best_part, PRICES["unknown"])
        if action == "Replace":
            base_cost = part_pricing.get("replace", 500)
        else:
            base_cost = part_pricing.get("dent", 150)

        final_cost = base_cost * price_multiplier
        total_cost += final_cost

        final_report.append({
            "part": best_part.title(),
            "damage_type": damage['name'].title(),
            "action": action,
            "area_severity": f"{round(severity_ratio * 100, 1)}%",
            "depth_severity": f"{int(depth_data['score'] * 100)}/100",
            "heatmap_image": depth_data['heatmap'],  # <--- The X-Ray Image
            "estimated_cost": round(final_cost, 2)
        })

    return {
        "breakdown": final_report,
        "total_estimate": round(total_cost, 2),
        "currency": "USD"
    }