"""
Delete the extra 'Laptop Camera (Background)' camera
"""
from app import app, db, Camera

with app.app_context():
    # Find and delete the background camera
    bg_camera = Camera.query.filter(
        Camera.name.like('%Background%')
    ).first()
    
    if bg_camera:
        print(f"Found camera: {bg_camera.name} (ID: {bg_camera.id}, User: {bg_camera.username})")
        db.session.delete(bg_camera)
        db.session.commit()
        print("✅ Deleted Laptop Camera (Background)")
    else:
        print("⚠️ No background camera found")
    
    # Show remaining cameras
    print("\nRemaining cameras:")
    cameras = Camera.query.all()
    for cam in cameras:
        print(f"  - {cam.name} (ID: {cam.id}, User: {cam.username}, Type: {cam.camera_type})")
