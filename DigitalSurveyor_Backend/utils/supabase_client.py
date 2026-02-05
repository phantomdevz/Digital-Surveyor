# utils/supabase_client.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET", "images")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_to_storage(file_path: str, folder: str) -> str:
    """
    Upload a file to Supabase Storage.
    
    Args:
        file_path: Local path to the file
        folder: Folder name in bucket (e.g., 'original', 'processed', 'heatmaps', 'reports')
    
    Returns:
        Public URL of the uploaded file
    """
    try:
        filename = os.path.basename(file_path)
        unique_filename = f"{folder}/{uuid.uuid4()}_{filename}"
        
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Upload to Supabase Storage
        supabase.storage.from_(STORAGE_BUCKET).upload(
            unique_filename,
            file_data,
            file_options={"content-type": get_content_type(filename)}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(unique_filename)
        
        print(f"✅ Uploaded {filename} to {folder}")
        return public_url
        
    except Exception as e:
        print(f"⚠️ Upload error for {file_path}: {e}")
        return None


def insert_scan_record(user_id: str, car_name: str, damage_data: dict, image_urls: dict) -> str:
    """
    Insert a scan record into the scans table.
    
    Args:
        user_id: User's UUID
        car_name: Name of the vehicle
        damage_data: Dictionary containing damages list and total_estimate
        image_urls: Dict with keys: original, processed, heatmap, pdf
    
    Returns:
        Scan ID (UUID)
    """
    try:
        scan_id = str(uuid.uuid4())
        
        scan_record = {
            "id": scan_id,
            "user_id": user_id,
            "car_name": car_name,
            "original_image_url": image_urls.get("original"),
            "processed_image_url": image_urls.get("processed"),
            "heatmap_image_url": image_urls.get("heatmap"),
            "report_pdf_url": image_urls.get("pdf"),
            "total_cost": int(damage_data.get("total_estimate", 0)),
            "damage_count": int(len(damage_data.get("damages", []))),
            "damages": damage_data.get("damages", []),  # TODO: Add this column to Supabase table first
            "status": "complete",
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("scans").insert(scan_record).execute()
        
        print(f"✅ Scan record created: {scan_id}")
        return scan_id
        
    except Exception as e:
        print(f"⚠️ Database insert error: {e}")
        return None


def get_content_type(filename: str) -> str:
    """Get MIME type based on file extension."""
    ext = filename.lower().split('.')[-1]
    types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'pdf': 'application/pdf'
    }
    return types.get(ext, 'application/octet-stream')


def create_damage_records(scan_id: str, damages_list: list):
    """
    Create individual damage records in the damages table.
    
    Args:
        scan_id: UUID of the parent scan
        damages_list: List of damage dictionaries from AI analysis
    
    Returns:
        List of created damage IDs
    """
    try:
        damage_ids = []
        
        for damage in damages_list:
            damage_id = str(uuid.uuid4())
            
            damage_record = {
                "id": damage_id,
                "scan_id": scan_id,
                "part_name": damage.get("part", "Unknown"),
                "damage_type": damage.get("type", "Unknown"),
                "is_manual": False,
                "detection_source": "ai",
                "global_box": damage.get("box", []),
                "preliminary_severity": int(damage.get("severity", 50)),
                "preliminary_cost": int(damage.get("cost", 0)),
                "final_severity": int(damage.get("severity", 50)),
                "action": damage.get("action", "Repair"),
                "cost": int(damage.get("cost", 0)),
                "status": "preliminary"
            }
            
            supabase.table("damages").insert(damage_record).execute()
            damage_ids.append(damage_id)
            print(f"✅ Created damage record: {damage_id}")
        
        return damage_ids
        
    except Exception as e:
        print(f"⚠️ Error creating damage records: {e}")
        return []


def update_damage_refinement(
    damage_id: str,
    closeup_urls: list,
    severity_scores: list,
    final_severity: int,
    action: str,
    cost: int,
    confidence: str
):
    """
    Update a damage record with multi-angle refinement data.
    
    Args:
        damage_id: UUID of the damage to update
        closeup_urls: [left_url, center_url, right_url]
        severity_scores: [score1, score2, score3]
        final_severity: Average severity
        action: Final action recommendation
        cost: Final cost estimate
        confidence: 'high' | 'medium' | 'low'
    """
    try:
        update_data = {
            "closeup_urls": closeup_urls,
            "severity_scores": severity_scores,
            "final_severity": final_severity,
            "action": action,
            "cost": cost,
            "confidence": confidence,
            "status": "verified",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("damages").update(update_data).eq("id", damage_id).execute()
        print(f"✅ Updated damage {damage_id} with refinement")
        return True
        
    except Exception as e:
        print(f"⚠️ Error updating damage refinement: {e}")
        return False


def get_damages_by_scan(scan_id: str):
    """Get all damages for a specific scan."""
    try:
        result = supabase.table("damages").select("*").eq("scan_id", scan_id).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"⚠️ Error fetching damages: {e}")
        return []
