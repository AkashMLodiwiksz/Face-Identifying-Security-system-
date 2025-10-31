"""
Clear all users from the database and recreate default admin
"""
from app import app, db, User

with app.app_context():
    print("⚠️  Clearing all users from database...")
    
    # Delete all users
    deleted_count = User.query.delete()
    db.session.commit()
    
    print(f"✅ Deleted {deleted_count} user(s)")
    
    # Recreate default admin user
    print("📝 Creating default admin user...")
    admin = User(
        username='1',
        email='admin@facesecurity.com',
        role='admin'
    )
    admin.set_password('1')
    db.session.add(admin)
    db.session.commit()
    
    print("✅ Default admin user created (username: 1, password: 1)")
    
    print("\n" + "="*50)
    print("✅ User database cleared successfully!")
    print("   Admin user: 1")
    print("   Password: 1")
    print("="*50)
