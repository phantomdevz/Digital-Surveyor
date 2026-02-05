"""
Test script for multi-angle refinement endpoint.
Tests the /analyze/refine endpoint with 3 sample images.
"""

import requests
import os

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"

def test_refine_endpoint():
    """Test the /analyze/refine endpoint with 3 test images."""
    
    print("🧪 Testing /analyze/refine endpoint...")
    
    # You'll need to provide:
    # 1. A damage_id from an existing scan
    # 2. Three close-up photos of the same damage
    
    damage_id = input("Enter damage_id to refine (from existing scan): ")
    part_name = input("Enter part name (e.g., Door, Fender): ")
    damage_type = input("Enter damage type (e.g., Dent, Scratch): ")
    
    # File paths
    print("\nProvide paths to 3 close-up photos:")
    file_left_path = input("Left angle photo path: ")
    file_center_path = input("Center angle photo path: ")
    file_right_path = input("Right angle photo path: ")
    
    # Validate files exist
    for path in [file_left_path, file_center_path, file_right_path]:
        if not os.path.exists(path):
            print(f"❌ File not found: {path}")
            return
    
    # Prepare files
    files = {
        'file_left': open(file_left_path, 'rb'),
        'file_center': open(file_center_path, 'rb'),
        'file_right': open(file_right_path, 'rb')
    }
    
    data = {
        'damage_id': damage_id,
        'part_name': part_name,
        'damage_type': damage_type
    }
    
    try:
        print("\n📤 Sending request...")
        response = requests.post(
            f"{BACKEND_URL}/analyze/refine",
            files=files,
            data=data
        )
        
        # Close files
        for f in files.values():
            f.close()
        
        print(f"\n📊 Response Status: {response.status_code}")
        result = response.json()
        
        if result.get("status") == "success":
            print("\n✅ Refinement Successful!")
            print(f"Severity Scores: {result.get('severity_scores')}")
            print(f"Final Severity: {result.get('final_severity')}/100")
            print(f"Action: {result.get('action')}")
            print(f"Cost: ₹{result.get('cost'):,}")
            print(f"Confidence: {result.get('confidence')}")
            print(f"Std Deviation: {result.get('std_deviation', 0):.2f}")
        else:
            print(f"\n❌ Error: {result.get('message', 'Unknown error')}")
        
        return result
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return None


def quick_test_with_dummy_damage():
    """
    Quick test using a dummy damage record.
    You'll need to manually insert a test damage record or use one from a real scan.
    """
    print("⚠️ For quick testing, you need:")
    print("1. Run a scan first to get a damage_id")
    print("2. Or manually insert a test record in Supabase")
    print("\nAlternatively, run test_refine_endpoint() with real data")


if __name__ == "__main__":
    print("=" * 60)
    print("Multi-Angle Refinement Test")
    print("=" * 60)
    
    choice = input("\n1. Test with real damage_id\n2. Info for manual testing\n\nChoice: ")
    
    if choice == "1":
        test_refine_endpoint()
    else:
        quick_test_with_dummy_damage()
