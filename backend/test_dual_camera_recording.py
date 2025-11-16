"""
Test server-side recording with duplication to both cameras
"""
from app import app, db, Camera
from recording_manager import recording_manager
import time

with app.app_context():
    # Get both cameras
    cameras = Camera.query.filter_by(username='1').all()
    
    print(f"Found {len(cameras)} cameras:")
    for cam in cameras:
        print(f"  - Camera {cam.id}: {cam.name} (type: {cam.camera_type})")
    
    if len(cameras) < 2:
        print("ERROR: Need at least 2 cameras!")
        exit(1)
    
    print("\n🎬 Starting server-side recording for both cameras...")
    
    # Start recording for both cameras (they share device 0)
    for i, camera in enumerate(cameras):
        success = recording_manager.start_recording(
            camera_id=camera.id,
            camera_name=camera.name,
            username='1',
            device_index=0,  # Both use same physical webcam
            duration=10  # 10 second test recording
        )
        print(f"Camera {camera.id} ({camera.name}): {'✅ Started' if success else '❌ Failed'}")
    
    print("\n⏳ Recording for 15 seconds...")
    print("Check the backend terminal for FFmpeg output...")
    time.sleep(15)
    
    print("\n✅ Test complete! Check these folders:")
    print(f"  - C:\\Users\\user\\Videos\\recordings\\1\\camera_{cameras[0].id}_{cameras[0].name}\\")
    print(f"  - C:\\Users\\user\\Videos\\recordings\\1\\camera_{cameras[1].id}_{cameras[1].name}\\")
    print("\nBoth folders should have the same .mp4 recording!")
