"""
Database migration script to add username column to cameras table
This allows user-specific camera isolation
"""

from app import app, db
from models import Camera, User
from sqlalchemy import text

def migrate_cameras():
    with app.app_context():
        print("🔄 Starting camera table migration...")
        
        try:
            # Check if username column exists
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('cameras')]
            
            if 'username' not in columns:
                print("📝 Adding username column to cameras table...")
                
                # Add username column
                with db.engine.connect() as conn:
                    conn.execute(text(
                        'ALTER TABLE cameras ADD COLUMN username VARCHAR(80)'
                    ))
                    conn.commit()
                
                print("✅ Username column added successfully!")
                
                # Update existing cameras with admin username if any exist
                cameras = Camera.query.all()
                if cameras:
                    print(f"📊 Found {len(cameras)} existing cameras")
                    admin_user = User.query.filter_by(username='1').first()
                    
                    if admin_user:
                        for camera in cameras:
                            if not camera.username:
                                camera.username = admin_user.username
                        db.session.commit()
                        print(f"✅ Updated {len(cameras)} cameras with admin username")
                    else:
                        print("⚠️ No admin user found. Existing cameras need manual assignment.")
            else:
                print("✅ Username column already exists!")
            
            print("\n🎉 Migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            db.session.rollback()

if __name__ == '__main__':
    migrate_cameras()
