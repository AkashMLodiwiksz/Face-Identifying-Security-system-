"""
Fix Recordings Foreign Key Constraint
This updates the recordings table to allow camera deletion
"""
from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        print("🔧 Fixing recordings.camera_id foreign key constraint...")
        print("="*70)
        
        # Step 1: Drop existing constraint
        print("\n1️⃣ Dropping old constraint...")
        db.session.execute(text("""
            ALTER TABLE recordings 
            DROP CONSTRAINT IF EXISTS recordings_camera_id_fkey;
        """))
        print("   ✓ Dropped recordings_camera_id_fkey")
        db.session.commit()
        
        # Step 2: Add new constraint with SET NULL
        # (We use SET NULL instead of CASCADE to preserve recording history)
        print("\n2️⃣ Adding new constraint with SET NULL...")
        db.session.execute(text("""
            ALTER TABLE recordings 
            ADD CONSTRAINT recordings_camera_id_fkey 
            FOREIGN KEY (camera_id) 
            REFERENCES cameras(id) 
            ON DELETE SET NULL;
        """))
        print("   ✓ Added recordings_camera_id_fkey (ON DELETE SET NULL)")
        db.session.commit()
        
        # Step 3: Verify
        print("\n3️⃣ Verifying constraint...")
        result = db.session.execute(text("""
            SELECT
                rc.delete_rule
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.referential_constraints AS rc
                ON rc.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'recordings'
                AND tc.constraint_name = 'recordings_camera_id_fkey';
        """))
        
        for row in result:
            delete_rule = row[0]
            if delete_rule == 'SET NULL':
                print(f"   ✅ recordings.camera_id -> ON DELETE {delete_rule}")
            else:
                print(f"   ⚠️  recordings.camera_id -> ON DELETE {delete_rule} (EXPECTED SET NULL)")
        
        print("\n" + "="*70)
        print("✅ Recordings constraint fixed!")
        print("   Cameras can now be deleted without losing recording files.")
        print("   Recording entries will remain with camera_id set to NULL.")
        print("="*70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
