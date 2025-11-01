"""
Test script to delete a camera and see the exact error
"""
from app import app, db, Camera
from sqlalchemy import inspect

with app.app_context():
    print("="*60)
    print("Testing Camera Deletion")
    print("="*60)
    
    # List all cameras
    cameras = Camera.query.all()
    print(f"\n📷 Total cameras: {len(cameras)}")
    for cam in cameras:
        print(f"   - ID: {cam.id}, Name: {cam.name}, User: {cam.username}")
    
    if cameras:
        # Try to delete the first camera
        test_camera = cameras[0]
        print(f"\n🗑️  Attempting to delete: {test_camera.name} (ID: {test_camera.id})")
        
        try:
            db.session.delete(test_camera)
            db.session.commit()
            print("✅ Camera deleted successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error deleting camera: {str(e)}")
            print(f"   Error type: {type(e).__name__}")
            
            # Show more details
            import traceback
            print("\n📋 Full traceback:")
            traceback.print_exc()
    
    # Check foreign key constraints
    print("\n" + "="*60)
    print("Database Foreign Key Constraints")
    print("="*60)
    
    inspector = inspect(db.engine)
    
    # Check DetectionEvent constraints
    print("\n🔍 DetectionEvent table constraints:")
    fks = inspector.get_foreign_keys('detection_events')
    for fk in fks:
        print(f"   - {fk['name']}: {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
        print(f"     ON DELETE: {fk.get('ondelete', 'NO ACTION')}")
    
    # Check IntruderAppearance constraints
    print("\n🔍 IntruderAppearance table constraints:")
    fks = inspector.get_foreign_keys('intruder_appearances')
    for fk in fks:
        print(f"   - {fk['name']}: {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
        print(f"     ON DELETE: {fk.get('ondelete', 'NO ACTION')}")
    
    print("\n" + "="*60)
