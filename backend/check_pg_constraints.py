"""
Direct PostgreSQL query to check and fix constraints
"""
from app import app, db
from sqlalchemy import text

with app.app_context():
    print("="*70)
    print("Checking PostgreSQL Foreign Key Constraints Directly")
    print("="*70)
    
    # Query actual constraints from PostgreSQL system tables
    result = db.session.execute(text("""
        SELECT
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
            ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND (tc.table_name = 'detection_events' OR tc.table_name = 'intruder_appearances')
            AND ccu.table_name = 'cameras'
        ORDER BY tc.table_name, tc.constraint_name;
    """))
    
    print("\n📋 Current Camera Foreign Keys:")
    print("-" * 70)
    for row in result:
        print(f"Table: {row[1]}")
        print(f"  Constraint: {row[0]}")
        print(f"  Column: {row[2]} -> {row[3]}.{row[4]}")
        print(f"  ON DELETE: {row[5]}")
        print()
