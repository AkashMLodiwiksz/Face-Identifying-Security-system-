"""
Properly fix Camera Foreign Key Constraints
This script uses ALTER TABLE to correctly update the foreign key constraints
"""
from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        print("🔧 Fixing camera foreign key constraints (IMPROVED VERSION)...")
        print("="*60)
        
        # Step 1: Drop existing constraints
        print("\n1️⃣ Dropping old foreign key constraints...")
        
        # Drop DetectionEvent constraints
        try:
            db.session.execute(text("""
                ALTER TABLE detection_events 
                DROP CONSTRAINT IF EXISTS detection_events_camera_id_fkey;
            """))
            print("   ✓ Dropped detection_events_camera_id_fkey")
        except Exception as e:
            print(f"   ⚠️  {e}")
        
        # Drop IntruderAppearance constraints
        try:
            db.session.execute(text("""
                ALTER TABLE intruder_appearances 
                DROP CONSTRAINT IF EXISTS intruder_appearances_camera_id_fkey;
            """))
            print("   ✓ Dropped intruder_appearances_camera_id_fkey")
        except Exception as e:
            print(f"   ⚠️  {e}")
        
        db.session.commit()
        
        # Step 2: Add new constraints with proper CASCADE/SET NULL
        print("\n2️⃣ Creating new foreign key constraints...")
        
        # Add DetectionEvent constraint with CASCADE DELETE
        try:
            db.session.execute(text("""
                ALTER TABLE detection_events 
                ADD CONSTRAINT detection_events_camera_id_fkey 
                FOREIGN KEY (camera_id) 
                REFERENCES cameras(id) 
                ON DELETE CASCADE;
            """))
            print("   ✓ Added detection_events_camera_id_fkey (ON DELETE CASCADE)")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Add IntruderAppearance constraint with SET NULL
        try:
            db.session.execute(text("""
                ALTER TABLE intruder_appearances 
                ADD CONSTRAINT intruder_appearances_camera_id_fkey 
                FOREIGN KEY (camera_id) 
                REFERENCES cameras(id) 
                ON DELETE SET NULL;
            """))
            print("   ✓ Added intruder_appearances_camera_id_fkey (ON DELETE SET NULL)")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        db.session.commit()
        
        # Step 3: Verify the changes
        print("\n3️⃣ Verifying foreign key constraints...")
        
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        
        # Check DetectionEvent
        fks = inspector.get_foreign_keys('detection_events')
        for fk in fks:
            if 'camera_id' in fk['constrained_columns']:
                on_delete = fk.get('ondelete', 'NO ACTION')
                if on_delete == 'CASCADE':
                    print(f"   ✅ detection_events.camera_id -> ON DELETE {on_delete}")
                else:
                    print(f"   ⚠️  detection_events.camera_id -> ON DELETE {on_delete} (EXPECTED CASCADE)")
        
        # Check IntruderAppearance
        fks = inspector.get_foreign_keys('intruder_appearances')
        for fk in fks:
            if 'camera_id' in fk['constrained_columns']:
                on_delete = fk.get('ondelete', 'NO ACTION')
                if on_delete == 'SET NULL':
                    print(f"   ✅ intruder_appearances.camera_id -> ON DELETE {on_delete}")
                else:
                    print(f"   ⚠️  intruder_appearances.camera_id -> ON DELETE {on_delete} (EXPECTED SET NULL)")
        
        print("\n" + "="*60)
        print("✅ Migration completed!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Fatal Error: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
