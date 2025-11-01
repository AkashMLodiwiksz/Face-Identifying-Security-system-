"""
Delete all cameras from the database
"""
from app import app, db, Camera

with app.app_context():
    print("="*60)
    print("Deleting All Cameras")
    print("="*60)
    
    # List all cameras
    cameras = Camera.query.all()
    print(f"\n📷 Total cameras before deletion: {len(cameras)}")
    for cam in cameras:
        print(f"   - ID: {cam.id}, Name: '{cam.name}', User: '{cam.username}'")
    
    # Delete all cameras
    print(f"\n🗑️  Deleting all cameras...")
    deleted_count = 0
    
    for camera in cameras:
        try:
            print(f"   Deleting: {camera.name} (ID: {camera.id})...")
            db.session.delete(camera)
            db.session.commit()
            deleted_count += 1
            print(f"   ✅ Deleted successfully")
        except Exception as e:
            db.session.rollback()
            print(f"   ❌ Error: {str(e)}")
    
    print(f"\n✅ Total cameras deleted: {deleted_count}")
    
    # Verify deletion
    remaining = Camera.query.all()
    print(f"📷 Remaining cameras: {len(remaining)}")
    
    if len(remaining) == 0:
        print("\n✅ All cameras have been successfully deleted!")
    else:
        print("\n⚠️  Some cameras could not be deleted:")
        for cam in remaining:
            print(f"   - ID: {cam.id}, Name: '{cam.name}'")
    
    print("="*60)
