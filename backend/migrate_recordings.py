"""
Migrate existing recording files to database
Run this once to add existing recordings to the database
"""
from app import app, db, Recording, Camera
from datetime import datetime
import os

def get_local_time():
    return datetime.now()

with app.app_context():
    recordings_dir = os.path.join(os.path.dirname(__file__), 'recordings')
    
    if not os.path.exists(recordings_dir):
        print("⚠️ No recordings directory found")
        exit()
    
    # Get or create laptop camera
    camera = Camera.query.filter_by(name='laptop').first()
    if not camera:
        camera = Camera(
            name='laptop',
            location='Local',
            camera_type='USB',
            status='online',
            is_active=True
        )
        db.session.add(camera)
        db.session.flush()
        print(f"✅ Created camera: laptop (ID: {camera.id})")
    else:
        print(f"✅ Found camera: laptop (ID: {camera.id})")
    
    added_count = 0
    skipped_count = 0
    
    print("\n📂 Scanning recordings directory...")
    
    for filename in os.listdir(recordings_dir):
        if filename.endswith('.webm') or filename.endswith('.mp4'):
            # Check if already in database
            existing = Recording.query.filter_by(filename=filename).first()
            
            if existing:
                print(f"⏭️  Skipped (already in DB): {filename}")
                skipped_count += 1
                continue
            
            filepath = os.path.join(recordings_dir, filename)
            file_size = os.path.getsize(filepath)
            
            # Extract timestamp from filename
            timestamp_str = filename.replace('recording_', '').replace('.webm', '').replace('.mp4', '')
            try:
                file_time = datetime.strptime(timestamp_str, '%Y%m%d_%H%M%S')
            except:
                file_time = datetime.fromtimestamp(os.path.getctime(filepath))
            
            # Create recording entry
            recording = Recording(
                filename=filename,
                filepath=filepath,
                camera_id=camera.id,
                file_size=file_size,
                format='webm' if filename.endswith('.webm') else 'mp4',
                created_at=file_time,
                is_deleted=False
            )
            
            db.session.add(recording)
            added_count += 1
            print(f"✅ Added: {filename}")
    
    db.session.commit()
    
    print("\n" + "="*50)
    print(f"✅ Migration Complete!")
    print(f"   Added: {added_count} recordings")
    print(f"   Skipped: {skipped_count} recordings (already in DB)")
    print("="*50)
