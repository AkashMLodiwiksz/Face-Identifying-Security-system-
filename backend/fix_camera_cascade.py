"""
Fix Camera Foreign Key Constraints
This script updates the database to allow deletion of cameras with detection events
"""
from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        print("🔧 Fixing camera foreign key constraints...")
        
        # Drop existing foreign key constraints
        print("  • Dropping old constraints...")
        
        # For DetectionEvent table
        db.session.execute(text("""
            ALTER TABLE detection_events 
            DROP CONSTRAINT IF EXISTS detection_events_camera_id_fkey CASCADE;
        """))
        
        # For IntruderAppearance table
        db.session.execute(text("""
            ALTER TABLE intruder_appearances 
            DROP CONSTRAINT IF EXISTS intruder_appearances_camera_id_fkey CASCADE;
        """))
        
        print("  • Adding new constraints with CASCADE/SET NULL...")
        
        # Add new constraint for DetectionEvent with CASCADE DELETE
        db.session.execute(text("""
            ALTER TABLE detection_events 
            ADD CONSTRAINT detection_events_camera_id_fkey 
            FOREIGN KEY (camera_id) 
            REFERENCES cameras(id) 
            ON DELETE CASCADE;
        """))
        
        # Add new constraint for IntruderAppearance with SET NULL
        db.session.execute(text("""
            ALTER TABLE intruder_appearances 
            ADD CONSTRAINT intruder_appearances_camera_id_fkey 
            FOREIGN KEY (camera_id) 
            REFERENCES cameras(id) 
            ON DELETE SET NULL;
        """))
        
        db.session.commit()
        
        print("\n" + "="*50)
        print("✅ Foreign key constraints updated successfully!")
        print("   You can now delete cameras including laptop cameras")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.session.rollback()
        print("\n⚠️  If the constraints don't exist yet, you can safely ignore this error.")
        print("   The models.py has been updated and new tables will use the correct constraints.")
