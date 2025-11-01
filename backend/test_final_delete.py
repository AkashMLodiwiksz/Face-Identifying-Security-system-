"""
Final test - Try deleting a camera with the correct constraints
"""
from app import app, db, Camera, DetectionEvent

with app.app_context():
    print("="*60)
    print("Final Deletion Test")
    print("="*60)
    
    # List all cameras
    cameras = Camera.query.all()
    print(f"\n📷 Available cameras:")
    for cam in cameras:
        detection_count = DetectionEvent.query.filter_by(camera_id=cam.id).count()
        print(f"   - ID: {cam.id}, Name: '{cam.name}', User: '{cam.username}', Detections: {detection_count}")
    
    # Try to delete camera ID 1 (laptop)
    print(f"\n🗑️  Attempting to delete camera ID 1 (laptop)...")
    camera_to_delete = Camera.query.get(1)
    
    if camera_to_delete:
        try:
            print(f"   Camera: {camera_to_delete.name} (User: {camera_to_delete.username})")
            db.session.delete(camera_to_delete)
            db.session.commit()
            print("   ✅ Camera deleted successfully!")
            
            # Verify deletion
            remaining = Camera.query.all()
            print(f"\n📷 Remaining cameras: {len(remaining)}")
            for cam in remaining:
                print(f"   - ID: {cam.id}, Name: '{cam.name}'")
                
        except Exception as e:
            db.session.rollback()
            print(f"   ❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
    else:
        print("   Camera not found!")
