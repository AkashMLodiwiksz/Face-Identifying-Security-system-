"""
Reset or create admin user
Run this script to reset the admin password
"""
from app import app, db, User
from datetime import datetime

def get_local_time():
    return datetime.now()

with app.app_context():
    # Try to find existing admin user
    admin = User.query.filter_by(username='1').first()
    
    if admin:
        print(f"Found existing user: {admin.username}")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.role}")
        print(f"Active: {admin.is_active}")
        
        # Reset password
        admin.set_password('1')
        admin.is_active = True
        db.session.commit()
        print("\n✅ Password reset to '1'")
        print("✅ User activated")
    else:
        # Create new admin user
        admin = User(
            username='1',
            email='admin@facesecurity.com',
            role='admin',
            is_active=True
        )
        admin.set_password('1')
        db.session.add(admin)
        db.session.commit()
        print("\n✅ New admin user created!")
    
    print("\n" + "="*50)
    print("LOGIN CREDENTIALS:")
    print("="*50)
    print("Username: 1")
    print("Password: 1")
    print("="*50)
