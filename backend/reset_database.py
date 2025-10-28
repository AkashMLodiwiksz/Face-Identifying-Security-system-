"""
Drop and recreate all database tables
WARNING: This will delete all data!
"""
from app import app, db

with app.app_context():
    print("⚠️  Dropping all tables...")
    db.drop_all()
    print("✅ All tables dropped")
    
    print("📝 Creating all tables...")
    db.create_all()
    print("✅ All tables created")
    
    print("\n" + "="*50)
    print("✅ Database reset complete!")
    print("   Run reset_admin.py to create admin user")
    print("   Run migrate_recordings.py to import recordings")
    print("="*50)
