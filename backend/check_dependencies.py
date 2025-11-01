"""
Check for detection events linked to cameras
"""
from app import app, db, Camera, DetectionEvent

with app.app_context():
    print("="*60)
    print("Checking Camera Dependencies")
    print("="*60)
    
    cameras = Camera.query.all()
    for cam in cameras:
        detection_count = DetectionEvent.query.filter_by(camera_id=cam.id).count()
        print(f"\n📷 Camera: {cam.name} (ID: {cam.id}, User: {cam.username})")
        print(f"   Detection Events: {detection_count}")
        
        if detection_count > 0:
            print(f"   ⚠️  This camera has {detection_count} detection events!")
            print(f"   ⚠️  Cannot delete without CASCADE constraint!")
