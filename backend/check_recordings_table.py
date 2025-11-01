"""
Check recordings table structure
"""
from app import app, db
from sqlalchemy import text

with app.app_context():
    print("="*70)
    print("Checking Recordings Table")
    print("="*70)
    
    # Check if recordings table exists
    result = db.session.execute(text("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'recordings'
        ORDER BY ordinal_position;
    """))
    
    print("\n📋 Recordings Table Columns:")
    print("-" * 70)
    for row in result:
        print(f"  {row[0]:<20} {row[1]:<15} Nullable: {row[2]}")
    
    # Check foreign keys on recordings table
    result = db.session.execute(text("""
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
            ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'recordings'
            AND tc.constraint_type = 'FOREIGN KEY';
    """))
    
    print("\n📋 Recordings Foreign Keys:")
    print("-" * 70)
    for row in result:
        print(f"  Constraint: {row[0]}")
        print(f"    Column: {row[1]} -> {row[2]}.{row[3]}")
        print(f"    ON DELETE: {row[4]}")
        print()
    
    # Count recordings per camera
    result = db.session.execute(text("""
        SELECT camera_id, COUNT(*) as count
        FROM recordings
        GROUP BY camera_id
        ORDER BY camera_id;
    """))
    
    print("📋 Recordings Per Camera:")
    print("-" * 70)
    for row in result:
        print(f"  Camera ID {row[0]}: {row[1]} recordings")
