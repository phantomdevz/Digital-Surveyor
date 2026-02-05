# logic.py
from shapely.geometry import box
from utils import encode_image_to_base64, generate_heatmap
from depth_service import analyze_dent_depth
import cv2

# --- PRICING DATABASE (Base Prices) ---
PRICES = {
    "door": {"dent": 200, "scratch": 150, "replace": 900},
    "bumper": {"dent": 180, "scratch": 120, "replace": 600},
    "fender": {"dent": 180, "scratch": 140, "replace": 500},
    "hood": {"dent": 300, "scratch": 200, "replace": 1100},
    "glass": {"shatter": 400, "crack": 300, "replace": 600},
    "unknown": {"dent": 100, "scratch": 80, "replace": 350}
}


def correct_damage_label(damage_type, box_coords, severity):
    """
    Correct damage labels based on geometry (aspect ratio) and severity.
    
    Args:
        damage_type: str (original AI label)
        box_coords: [x1, y1, x2, y2]
        severity: int (0-100)
    
    Returns:
        str: Corrected damage label
        
    Rules:
        - Ratio > 2.5 (Long & Thin) -> Force "Scratch"
        - Ratio < 2.0 & Severity > 60 (Round & Deep) -> Force "Dent"
        - Ratio < 2.0 & Severity < 40 (Round & Shallow) -> Force "Spot/Chip"
    """
    try:
        x1, y1, x2, y2 = map(int, box_coords)
        width = x2 - x1
        height = y2 - y1
        
        if width == 0 or height == 0:
            return damage_type
            
        ratio = max(width, height) / min(width, height)
        
        # Rule 1: Geometric Scratch (Long & Thin)
        if ratio > 2.5:
            # Force "Scratch" unless it's a crack (glass)
            if "crack" not in damage_type:
                return "scratch"
                
        # Rule 2: Geometric Dent (Round & Deep)
        elif ratio < 2.0 and severity > 60:
            if "shatter" not in damage_type:
                return "dent"
                
        # Rule 3: Spot/Chip (Round & Shallow)
        elif ratio < 2.0 and severity < 40:
            if "dent" in damage_type or "scratch" in damage_type:
                return "spot"
                
        return damage_type
        
    except Exception as e:
        print(f"⚠️ Label correction error: {e}")
        return damage_type


def determine_action(severity_score, damage_type, part_name):
    """
    Dynamically determine repair action based on severity, damage type, and part.
    
    Args:
        severity_score: int (0-100)
        damage_type: str (e.g., 'dent', 'scratch', 'crack')
        part_name: str (e.g., 'door', 'bumper', 'glass')
    
    Returns:
        dict: {"action": str, "base_cost": int}
    
    Action Categories:
        - Buffing & Polishing (₹1,500-3,000): Light scratches, score 0-25
        - Denting & Painting (₹4,000-8,000): Minor dents, score 26-55
        - Sheet Metal Repair (₹8,000-15,000): Deep dents, score 56-75
        - Part Replacement (₹12,000-50,000): Severe damage, score 76+
    """
    damage_type = damage_type.lower()
    part_name = part_name.lower()
    
    # --- CONTEXT-AWARE OVERRIDES ---
    
    # Override 1: Glass damage ALWAYS requires replacement
    if part_name == "glass" or any(glass_type in damage_type for glass_type in ["crack", "shatter", "smash"]):
        return {
            "action": "Windshield Replacement",
            "base_cost": 12000  # ₹12,000
        }
    
    # Override 2: Bumper with high severity requires replacement (plastic is hard to repair)
    if part_name == "bumper" and severity_score > 60:
        return {
            "action": "Bumper Replacement",
            "base_cost": 15000  # ₹15,000
        }
    
    # --- SEVERITY-BASED THRESHOLDS ---
    
    if severity_score <= 25:
        # Light damage - just cosmetic work needed
        return {
            "action": "Buffing & Polishing",
            "base_cost": 2000  # ₹2,000
        }
    
    elif severity_score <= 55:
        # Moderate damage - needs dent removal and repainting
        return {
            "action": "Denting & Painting",
            "base_cost": 6000  # ₹6,000
        }
    
    elif severity_score <= 75:
        # Severe damage - requires sheet metal work
        return {
            "action": "Sheet Metal Repair",
            "base_cost": 12000  # ₹12,000
        }
    
    else:  # severity_score > 75
        # Critical damage - replacement needed
        part_replacement_costs = {
            "door": 18000,
            "bumper": 15000,
            "fender": 14000,
            "hood": 25000,
            "unknown": 20000
        }
        return {
            "action": "Part Replacement",
            "base_cost": part_replacement_costs.get(part_name, 20000)
        }


def clean_label(label):
    label = label.lower()
    if "door" in label:
        return "door"
    if "bumper" in label:
        return "bumper"
    if "fender" in label:
        return "fender"
    if "hood" in label:
        return "hood"
    if "glass" in label or "windshield" in label:
        return "glass"
    return "unknown"


def process_damage(parts_results, damage_results, full_image, price_multiplier=1.0):
    damages_list = []
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

    # 3. Process Each Damage Individually
    for damage in damages_detected:
        best_part = "unknown"
        max_overlap = 0
        damage_coords = damage['coords']
        damage_type = damage['name'].lower()

        # --- A. CALCULATE SEVERITY (Hybrid Approach) ---
        severity = 50
        heatmap_base64 = None
        
        # DENTS: Use Deep Learning Depth Analysis
        if "dent" in damage_type:
            x1, y1, x2, y2 = map(int, damage_coords)
            dent_crop = full_image[y1:y2, x1:x2]
            
            if dent_crop.size > 0:
                print(f"🧠 Running Deep Learning Depth Analysis for dent...")
                depth_result = analyze_dent_depth(dent_crop)
                severity = depth_result['severity']
                heatmap_base64 = depth_result['heatmap']
        
        # SCRATCHES: Use fixed moderate severity (contrast detection removed to prevent false positives)
        else:
            severity = 50  # Default moderate severity
            # Generate professional heatmap with ellipses and soft alpha blending
            heatmap_image = generate_heatmap(full_image, [{
                'box': damage_coords,
                'severity': severity
            }])
            heatmap_base64 = encode_image_to_base64(heatmap_image)

        # --- B. FIND THE PART (IoU Calculation) ---
        # --- B. FIND THE PART (IoU & Centroid) ---
        # Setup coordinates for centroid check
        dx1, dy1, dx2, dy2 = damage_coords
        dx_center = (dx1 + dx2) / 2
        dy_center = (dy1 + dy2) / 2

        # 1. Intersection Check
        for part in parts_detected:
            poly_damage = box(*damage_coords)
            poly_part = box(*part['coords'])
            intersection = poly_damage.intersection(poly_part).area

            if intersection > 0:
                # Use intersection with DAMAGE box (how much of damage is inside part)
                # Logic: We care if the damage is *on* the part.
                damage_area = poly_damage.area
                coverage = intersection / damage_area if damage_area > 0 else 0
                
                if coverage > max_overlap:
                    max_overlap = coverage
                    best_part = part['name']
        
        # 2. Fallback: Centroid Check (if still unknown)
        if best_part == "unknown" and parts_detected:
            for part in parts_detected:
                px1, py1, px2, py2 = part['coords']
                # Check if centroid is strictly inside part box
                if px1 <= dx_center <= px2 and py1 <= dy_center <= py2:
                    best_part = part['name']
                    print(f"🧩 Centroid Fallback: Found {best_part} for damage at {damage_coords}")
                    break
        
        # Debug if still unknown
        if best_part == "unknown":
             print(f"⚠️ Part not found. Damage Box: {damage_coords} | Parts Avail: {[p['name'] for p in parts_detected]}")

        # --- GEOMETRY CORRECTION ---
        damage_type = correct_damage_label(damage_type, damage_coords, severity)

        # --- C. DECISION LOGIC (Dynamic Action Determination) ---
        action_result = determine_action(severity, damage_type, best_part)
        action = action_result["action"]
        base_cost = action_result["base_cost"]
        
        # Apply price multiplier (e.g., regional pricing, premium parts)
        final_cost = base_cost * price_multiplier
        total_cost += final_cost
        
        # Debug logging
        print(f"📋 {damage_type.title()} on {best_part.title()} | Severity: {severity} | Action: {action} | Cost: ₹{final_cost:,.0f}")

        # --- E. ADD TO INDIVIDUAL DAMAGES LIST ---
        damages_list.append({
            "type": damage_type.title(),
            "severity": severity,
            "cost": round(final_cost, 2),
            "box": [int(c) for c in damage_coords],
            "part": best_part.title(),
            "action": action,
            "heatmap": heatmap_base64
        })

    return {
        "damages": damages_list,
        "total_estimate": round(total_cost, 2),
        "currency": "INR"
    }