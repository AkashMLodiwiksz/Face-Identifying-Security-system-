"""
Create user account with username='aa' and password='aa'
"""
from app import app, db
from models import User

with app.app_context():
    # Check if user already exists
    existing_user = User.query.filter_by(username='aa').first()
    
    if existing_user:
        print(f"[INFO] User 'aa' already exists!")
        print(f"      Username: {existing_user.username}")
        print(f"      Email: {existing_user.email}")
        print(f"      Role: {existing_user.role}")
    else:
        # Create new user
        new_user = User(
            username='aa',
            email='aa@example.com',
            role='user'
        )
        new_user.set_password('aa')
        
        db.session.add(new_user)
        db.session.commit()
        
        print("[SUCCESS] User account created successfully!")
        print(f"      Username: aa")
        print(f"      Password: aa")
        print(f"      Email: aa@example.com")
        print(f"      Role: user")
