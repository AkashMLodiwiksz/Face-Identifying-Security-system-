from flask import Flask, jsonify, request, send_file, Response, stream_with_context
from flask_cors import CORS
from datetime import datetime
from models import db, User, Camera, DetectionEvent, SystemLog, AuthorizedPerson, FaceEncoding, Intruder, IntruderAppearance, IntruderFaceEncoding, Alert, ObjectDetection
from recording_manager import recording_manager
from dotenv import load_dotenv
import os
import base64
import subprocess
import requests
from io import BytesIO


# Load environment variables
load_dotenv()

# Helper function to get recordings directory
def get_recordings_dir(username=None, camera_id=None, camera_name=None):
    """Get the recordings directory path from system settings or fallback to user's Videos folder."""
    user_profile = os.environ.get('USERPROFILE', '')  # e.g., C:\Users\YourActualUsername

    # default base recordings directory
    default_base = os.path.join(user_profile, 'Videos', 'recordings') if user_profile else os.path.join('recordings')

    base_recordings_dir = default_base
    try:
        # use custom recordings path if set in system_settings
        setting = SystemSettings.query.filter_by(setting_key='recordings_path').first()
        if setting and setting.setting_value:
            custom_path = setting.setting_value.strip()
            custom_path = os.path.expanduser(custom_path)
            if not os.path.isabs(custom_path):
                # Relative paths are interpreted under the user profile Videos directory
                # to avoid creating folders under the backend working directory.
                if user_profile:
                    custom_path = os.path.join(user_profile, custom_path)
                else:
                    custom_path = os.path.abspath(custom_path)
            base_recordings_dir = custom_path
    except Exception as e:
        print(f"[WARNING] Could not read recordings_path setting: {e}")
        base_recordings_dir = default_base

    # get the user-specific base directory (if requested)
    if username:
        user_dir = os.path.join(base_recordings_dir, username)

        # If camera info is provided, return camera-specific directory
        if camera_id and camera_name:
            # Sanitize camera name for folder name
            safe_camera_name = "".join(c for c in camera_name if c.isalnum() or c in (' ', '-', '_')).strip()
            camera_folder = f"camera_{camera_id}_{safe_camera_name}"
            return os.path.join(user_dir, camera_folder)

        return user_dir

    return base_recordings_dir

# helper to fetch configuration from database
from models import SystemSettings

# Helper to choose which camera the recorder should use. Exclude the
# built-in admin account ('1') so its default 'laptop' camera does not
# trigger recordings.
def get_latest_camera():
    """Return the most recently added camera that isn't owned by admin.
    If none exist, return None."""
    cam = Camera.query.filter(Camera.username != '1').order_by(Camera.id.desc()).first()
    return cam

# Configuration helpers

def get_segment_duration():
    """Return configured recording segment duration (seconds) or default."""
    setting = SystemSettings.query.filter_by(setting_key='segment_duration').first()
    if setting:
        try:
            return int(setting.setting_value)
        except Exception:
            pass
    # default segment duration in seconds
    return 120

# Helper function to ensure default laptop camera exists for user
def ensure_laptop_camera(username):
    """Create default laptop camera for user if it doesn't exist"""
    try:
        # Check if user already has a laptop camera
        laptop_camera = Camera.query.filter_by(
            username=username,
            camera_type='USB'
        ).first()
        
        if not laptop_camera:
            # Create default laptop camera
            laptop_camera = Camera(
                name=f'Laptop Camera',
                location='Local Device',
                rtsp_url='',
                camera_type='USB',
                status='offline',
                is_active=True,
                is_ptz=False,
                fps=30,
                resolution='1280x720',
                username=username
            )
            db.session.add(laptop_camera)
            db.session.commit()
            print(f"[SUCCESS] Created default laptop camera for user '{username}'")
            return True
        return False
    except Exception as e:
        print(f"[ERROR] Failed to create laptop camera for '{username}': {e}")
        db.session.rollback()
        return False

app = Flask(__name__,
    static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend-react', 'dist', 'assets'),
    static_url_path='/assets'
)

# Path to React production build
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend-react', 'dist')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize database
db.init_app(app)

# Enable CORS
CORS(app)

# Create tables
with app.app_context():
    db.create_all()
    print("[SUCCESS] Database tables created successfully!")
    
    # Create default admin user if doesn't exist
    admin = User.query.filter_by(username='1').first()
    if not admin:
        admin = User(
            username='1',
            email='admin@facesecurity.com',
            role='admin'
        )
        admin.set_password('1')
        db.session.add(admin)
        db.session.commit()
        print("[SUCCESS] Default admin user created (username: 1, password: 1)")
    
    # Create recordings directory for admin user
    admin_recordings_dir = get_recordings_dir('1')
    if not os.path.exists(admin_recordings_dir):
        os.makedirs(admin_recordings_dir)
        print(f"[SUCCESS] Admin recordings directory created at: {admin_recordings_dir}")
    
    # Create captures directory if it doesn't exist
    captures_dir = os.path.join(os.path.dirname(__file__), 'captures')
    if not os.path.exists(captures_dir):
        os.makedirs(captures_dir)
        print("[SUCCESS] Captures directory created")
    
    # Create recordings directory in user Videos folder
    recordings_dir = get_recordings_dir()
    if not os.path.exists(recordings_dir):
        os.makedirs(recordings_dir)
        print(f"[SUCCESS] Recordings directory created at: {recordings_dir}")
    else:
        print(f"[INFO] Using recordings directory: {recordings_dir}")
    
    # at startup record from every existing non-admin RTSP/IP camera
    # USB/Webcam cameras are recorded from the browser (composite canvas with overlays)
    cameras = Camera.query.filter(Camera.username != '1').all()
    if cameras:
        print(f"[RECORDER] cameras present at startup: {[c.id for c in cameras]}")
        duration = get_segment_duration()
        for cam in cameras:
            if cam.camera_type in ('USB', 'Webcam'):
                print(f"[RECORDER] Skipping ffmpeg for webcam '{cam.name}' (ID {cam.id}) - browser records with overlays")
                continue
            recording_manager.start_recording(cam.id, cam.rtsp_url or '', cam.username, cam.name, duration=duration)
    # Create camera-specific folders for all existing cameras
    print("[INFO] Creating camera-specific recording folders...")
    all_users = User.query.all()
    for user in all_users:
        user_cameras = Camera.query.filter_by(username=user.username).all()
        for camera in user_cameras:
            try:
                camera_dir = get_recordings_dir(user.username, camera.id, camera.name)
                if not os.path.exists(camera_dir):
                    os.makedirs(camera_dir)
                    print(f"[SUCCESS] Created folder for camera '{camera.name}' (ID: {camera.id})")
            except Exception as e:
                print(f"[WARNING] Could not create folder for camera '{camera.name}': {e}")
    print("[SUCCESS] Camera folders initialization complete")

# Sample data (will be replaced with database)
cameras_data = [
    {"id": 1, "name": "Laptop Camera", "status": "online", "fps": 30, "location": "Local Device"}
]

intruders_data = [
    {
        "id": 1,
        "firstSeen": "2025-10-05 14:30:25",
        "lastSeen": "2025-10-05 18:45:12",
        "appearances": 5,
        "threatLevel": "critical",
        "status": "active",
        "location": "Front Entrance"
    },
    {
        "id": 2,
        "firstSeen": "2025-10-04 09:15:30",
        "lastSeen": "2025-10-05 16:20:45",
        "appearances": 12,
        "threatLevel": "high",
        "status": "active",
        "location": "Parking Lot"
    }
]

# Root endpoint
@app.route('/')
def home():
    return jsonify({
        "message": "Face Recognition Security System API",
        "version": "1.0.0",
        "status": "running"
    })

# Health check
@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

# Authentication endpoints
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                "success": False,
                "message": "Username and password are required"
            }), 400
        
        # Find user in database
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid username or password"
            }), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({
                "success": False,
                "message": "Account is disabled"
            }), 401
        
        # Verify password
        if not user.check_password(password):
            return jsonify({
                "success": False,
                "message": "Invalid username or password"
            }), 401
        
        # Update last login
        user.last_login = datetime.now()
        db.session.commit()
        
        # Ensure user has a default laptop camera
        ensure_laptop_camera(username)
        
        # Generate token (in production, use JWT)
        token = f"token-{user.id}-{datetime.now().timestamp()}"
        
        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred during login"
        }), 500

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'user')  # Default role is 'user'
        
        # Validate required fields
        if not username or not email or not password:
            return jsonify({
                "success": False,
                "message": "Username, email, and password are required"
            }), 400
        
        # Validate username length
        if len(username) < 3:
            return jsonify({
                "success": False,
                "message": "Username must be at least 3 characters long"
            }), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({
                "success": False,
                "message": "Password must be at least 6 characters long"
            }), 400
        
        # Check if username already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({
                "success": False,
                "message": "Username already exists"
            }), 409
        
        # Check if email already exists
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            return jsonify({
                "success": False,
                "message": "Email already registered"
            }), 409
        
        # Prevent non-admin users from creating admin accounts
        if role == 'admin':
            return jsonify({
                "success": False,
                "message": "Admin accounts require approval from existing administrators"
            }), 403
        
        # Validate role
        if role not in ['user', 'viewer']:
            role = 'user'
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            role=role
        )
        new_user.set_password(password)
        
        # Add to database
        db.session.add(new_user)
        db.session.commit()
        
        # Create user-specific recordings directory
        user_recordings_dir = get_recordings_dir(username)
        if not os.path.exists(user_recordings_dir):
            os.makedirs(user_recordings_dir)
            print(f"[SUCCESS] Created recordings directory for user '{username}': {user_recordings_dir}")
        
        # Create default laptop camera for the new user
        ensure_laptop_camera(username)
        
        # Log the new user creation
        log = SystemLog(
            event_type='user_created',
            severity='info',
            message=f'New user account created: {username}',
            user_id=new_user.id
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Account created successfully",
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email,
                "role": new_user.role
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error during signup: {e}")
        return jsonify({
            "success": False,
            "message": "An error occurred during registration"
        }), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    return jsonify({
        "success": True,
        "message": "Logout successful"
    }), 200

# Dashboard statistics
@app.route('/api/dashboard/stats')
def dashboard_stats():
    return jsonify({
        "cameras": 6,
        "authorizedPersons": 24,
        "intrudersDetected": 12,
        "detectionsToday": 156
    })

# Camera Management endpoints
@app.route('/api/cameras', methods=['GET', 'POST'])
def manage_cameras():
    """Get all cameras or create a new camera"""
    if request.method == 'GET':
        username = request.args.get('username')
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        # Get all cameras for this user
        cameras = Camera.query.filter_by(username=username).all()
        cameras_list = [{
            'id': cam.id,
            'name': cam.name,
            'location': cam.location,
            'rtsp_url': cam.rtsp_url,
            'camera_type': cam.camera_type,
            'status': cam.status,
            'is_active': cam.is_active,
            'is_ptz': cam.is_ptz,
            'fps': cam.fps,
            'resolution': cam.resolution,
            'created_at': cam.created_at.isoformat() if cam.created_at else None
        } for cam in cameras]
        
        return jsonify(cameras_list)
    
    elif request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        # Verify user exists
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Create new camera
        camera_type = data.get('camera_type', 'IP')
        # Set webcam/USB cameras as online by default, others as offline
        default_status = 'online' if camera_type in ['Webcam', 'USB'] else 'offline'
        
        new_camera = Camera(
            name=data.get('name'),
            location=data.get('location'),
            rtsp_url=data.get('rtsp_url'),
            camera_type=camera_type,
            status=data.get('status', default_status),
            is_active=True,
            is_ptz=data.get('is_ptz', False),
            fps=data.get('fps', 30),
            resolution=data.get('resolution', '1920x1080'),
            username=username
        )
        
        db.session.add(new_camera)
        db.session.commit()
        
        # Create recording folder for this camera
        try:
            camera_recordings_dir = get_recordings_dir(username, new_camera.id, new_camera.name)
            if not os.path.exists(camera_recordings_dir):
                os.makedirs(camera_recordings_dir)
                print(f"[SUCCESS] Created recordings folder for camera '{new_camera.name}': {camera_recordings_dir}")
        except Exception as e:
            print(f"[WARNING] Could not create recordings folder for camera: {e}")
        
        # whenever a camera is added, switch the global recorder to it
        print("[RECORDER] camera added, ensuring recorder uses newest camera")
        duration = get_segment_duration()
        # if the new camera is owned by admin user '1', ignore it
        if username != '1':
            if new_camera.camera_type in ('USB', 'Webcam'):
                print(f"[RECORDER] Skipping ffmpeg for webcam '{new_camera.name}' - browser records with overlays")
            else:
                recording_manager.start_recording(new_camera.id, new_camera.rtsp_url or '', username, new_camera.name, duration=duration)
        else:
            print("[RECORDER] added admin camera, not changing recorder target")
        
        return jsonify({
            "success": True,
            "message": "Camera added successfully",
            "camera": {
                'id': new_camera.id,
                'name': new_camera.name,
                'location': new_camera.location,
                'camera_type': new_camera.camera_type,
                'status': new_camera.status
            }
        }), 201



def compute_face_encoding(img_b64):
    """Compute face encoding from a base64 image using face_recognition library."""
    import face_recognition
    import numpy as np
    import io
    from PIL import Image

    # Decode base64
    if ',' in img_b64:
        img_b64 = img_b64.split(',')[1]
    img_bytes = base64.b64decode(img_b64)
    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    img_array = np.array(img)

    encodings = face_recognition.face_encodings(img_array)
    if not encodings:
        raise ValueError('No face detected in image')
    return encodings[0].tolist()


@app.route('/api/authorized_persons', methods=['GET','POST'])
def add_authorized_person():
    if request.method == 'GET':
        # return list of authorized persons (simple representation)
        persons = AuthorizedPerson.query.all()
        return jsonify([{'id': p.id, 'name': p.name} for p in persons])

    data = request.json or {}
    name = data.get('name')
    images = data.get('images', [])

    if not name or not images:
        return jsonify({'error': 'name and at least one image required'}), 400

    # create person record
    person = AuthorizedPerson(name=name)
    db.session.add(person)
    db.session.commit()  # need ID for encodings

    # compute encodings and store each
    for img in images:
        try:
            vec = compute_face_encoding(img)
            # store as binary pickle
            import pickle
            enc_blob = pickle.dumps(vec)
            fe = FaceEncoding(person_id=person.id, encoding=enc_blob)
            db.session.add(fe)
        except Exception as e:
            print('encoding error', e)
    db.session.commit()

    return jsonify({'id': person.id}), 201


@app.route('/api/authorized_persons/<int:person_id>', methods=['DELETE'])
def delete_authorized_person(person_id):
    person = AuthorizedPerson.query.get(person_id)
    if not person:
        return jsonify({'error': 'Person not found'}), 404
    db.session.delete(person)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


@app.route('/api/system_settings', methods=['GET','POST'])
def system_settings():
    """Retrieve or update global system settings."""
    if request.method == 'GET':
        settings = SystemSettings.query.all()
        result = {s.setting_key: s.setting_value for s in settings}
        return jsonify(result)

    data = request.get_json() or {}
    key = data.get('key')
    value = data.get('value')
    if not key:
        return jsonify({'error': 'key is required'}), 400

    setting = SystemSettings.query.filter_by(setting_key=key).first()
    if setting:
        setting.setting_value = str(value)
    else:
        setting = SystemSettings(setting_key=key, setting_value=str(value))
        db.session.add(setting)
    db.session.commit()

    # if segment duration changed, notify recorder
    if key == 'segment_duration':
        try:
            newdur = int(value)
            recording_manager.update_duration(newdur)
        except Exception:
            pass

    # if recordings directory changed, restart recorder sessions on new path
    if key == 'recordings_path':
        try:
            # stop all active sessions and restart with latest camera (if any)
            recording_manager.stop_all()
            latest = get_latest_camera()
            if latest:
                duration = get_segment_duration()
                recording_manager.start_recording(latest.id, latest.rtsp_url or '', latest.username, latest.name, duration=duration)
        except Exception as e:
            print(f"[RECORDER] Could not apply new recordings_path: {e}")

    return jsonify({'success': True})


@app.route('/api/user/password', methods=['POST'])
def change_password():
    """Allow a logged-in user to update their password."""
    data = request.get_json() or {}
    username = data.get('username')
    current = data.get('current_password')
    new = data.get('new_password')
    if not username or not current or not new:
        return jsonify({'error': 'username, current_password and new_password are required'}), 400
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if not user.check_password(current):
        return jsonify({'error': 'Current password is incorrect'}), 403
    if len(new) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    user.set_password(new)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Password updated'})


@app.route('/api/cameras/<int:camera_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_camera(camera_id):
    """Get, update or delete a specific camera"""
    username = request.args.get('username') or (request.get_json() or {}).get('username')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    camera = Camera.query.filter_by(id=camera_id, username=username).first()
    
    if not camera:
        return jsonify({"error": "Camera not found"}), 404
    
    if request.method == 'GET':
        return jsonify({
            'id': camera.id,
            'name': camera.name,
            'location': camera.location,
            'rtsp_url': camera.rtsp_url,
            'camera_type': camera.camera_type,
            'status': camera.status,
            'is_active': camera.is_active,
            'is_ptz': camera.is_ptz,
            'fps': camera.fps,
            'resolution': camera.resolution,
            'created_at': camera.created_at.isoformat() if camera.created_at else None
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        # Update camera fields
        if 'name' in data:
            camera.name = data['name']
        if 'location' in data:
            camera.location = data['location']
        if 'rtsp_url' in data:
            camera.rtsp_url = data['rtsp_url']
        if 'camera_type' in data:
            camera.camera_type = data['camera_type']
        if 'status' in data:
            camera.status = data['status']
        if 'is_active' in data:
            camera.is_active = data['is_active']
        if 'is_ptz' in data:
            camera.is_ptz = data['is_ptz']
        if 'fps' in data:
            camera.fps = data['fps']
        if 'resolution' in data:
            camera.resolution = data['resolution']
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Camera updated successfully",
            "camera": {
                'id': camera.id,
                'name': camera.name,
                'status': camera.status
            }
        })
    
    elif request.method == 'DELETE':
        try:
            # Delete the camera
            db.session.delete(camera)
            db.session.commit()
            
            # stop session for deleted camera (if running)
            recording_manager.stop_recording(camera_id)

            # after deletion, look at total cameras across all users
            # count only non-admin cameras
            remaining = Camera.query.filter(Camera.username != '1').count()
            if remaining == 0:
                print("[RECORDER] no non-admin cameras remain, stopping recorder")
                recording_manager.stop_all()
            else:
                # restart on newest existing non-admin camera
                latest = get_latest_camera()
                if latest:
                    print(f"[RECORDER] switching recorder to camera {latest.id} (user {latest.username})")
                    duration = get_segment_duration()
                    recording_manager.start_recording(latest.id, latest.rtsp_url or '', latest.username, latest.name, duration=duration)
            
            return jsonify({
                "success": True,
                "message": "Camera deleted successfully"
            })
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Failed to delete camera {camera_id}: {str(e)}")
            return jsonify({
                "error": f"Failed to delete camera: {str(e)}"
            }), 500

@app.route('/api/cameras/<int:camera_id>/test', methods=['POST'])
def test_camera_connection(camera_id):
    """Test camera connection"""
    username = request.get_json().get('username')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    camera = Camera.query.filter_by(id=camera_id, username=username).first()
    
    if not camera:
        return jsonify({"error": "Camera not found"}), 404
    
    # Here you would implement actual connection testing
    # For now, we'll simulate it
    import time
    time.sleep(1)  # Simulate connection test
    
    return jsonify({
        "success": True,
        "status": "online",
        "message": "Camera connection successful"
    })

    return jsonify({'success': True})


@app.route('/api/cameras/<int:camera_id>/ptz', methods=['POST'])
def control_camera_ptz(camera_id):
    """Control PTZ (Pan-Tilt-Zoom) for camera"""
    data = request.get_json()
    username = data.get('username')
    direction = data.get('direction')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    camera = Camera.query.filter_by(id=camera_id, username=username).first()
    
    if not camera:
        return jsonify({"error": "Camera not found"}), 404
    
    if not camera.is_ptz:
        return jsonify({"error": "Camera does not support PTZ"}), 400
    
    # Log PTZ command
    print(f"[PTZ] Camera: {camera.name}, Direction: {direction}")
    
    # Here you would implement actual PTZ control via camera API
    # Example for common CCTV cameras:
    # - Send HTTP request to camera's CGI interface
    # - Use ONVIF protocol
    # - Send RTSP commands
    
    # For IP camera at 192.168.137.189, typical CGI commands would be:
    # http://192.168.137.189/cgi-bin/ptz.cgi?action=start&channel=0&code={direction}&arg1=0&arg2=1&arg3=0
    
    return jsonify({
        "success": True,
        "message": f"PTZ command '{direction}' executed",
        "camera": camera.name
    })

@app.route('/api/cameras/<int:camera_id>/settings', methods=['POST'])
def update_camera_settings(camera_id):
    """Update camera settings (night vision, color mode, etc.)"""
    data = request.get_json()
    username = data.get('username')
    setting = data.get('setting')
    value = data.get('value')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    camera = Camera.query.filter_by(id=camera_id, username=username).first()
    
    if not camera:
        return jsonify({"error": "Camera not found"}), 404
    
    # Log setting change
    print(f"[SETTINGS] Camera: {camera.name}, Setting: {setting}, Value: {value}")
    
    # Here you would implement actual camera setting changes
    # Example for night vision modes:
    # - 'auto': Automatic IR switching
    # - 'ir': Force infrared night vision
    # - 'color': Force full color (with external light)
    
    # For IP camera at 192.168.137.189:
    # http://192.168.137.189/cgi-bin/configManager.cgi?action=setConfig&VideoInMode[0].Config[0]={mode}
    
    return jsonify({
        "success": True,
        "message": f"Setting '{setting}' updated to '{value}'",
        "camera": camera.name,
        "setting": setting,
        "value": value
    })

# Camera Stream Proxy - Convert RTSP to MJPEG using OpenCV
@app.route('/api/cameras/<int:camera_id>/mjpeg-stream')
def stream_camera_mjpeg(camera_id):
    """Stream camera as MJPEG using OpenCV"""
    username = request.args.get('username')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    camera = Camera.query.filter_by(id=camera_id, username=username).first()
    
    if not camera:
        return jsonify({"error": "Camera not found"}), 404
    
    # Construct RTSP URL
    rtsp_url = camera.rtsp_url or f'rtsp://admin:admin@192.168.137.189:554/stream1'
    
    def generate():
        """Generate MJPEG frames from RTSP stream using OpenCV"""
        try:
            import cv2
            import time
            
            cap = cv2.VideoCapture(rtsp_url)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
            
            print(f"[STREAM] Starting MJPEG stream for camera {camera.name}")
            
            while True:
                success, frame = cap.read()
                if not success:
                    print("[STREAM] Failed to read frame")
                    break
                
                # Resize for better performance
                frame = cv2.resize(frame, (1280, 720))
                
                # Encode as JPEG
                ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if not ret:
                    continue
                    
                frame_bytes = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                time.sleep(0.03)  # ~30 fps
            
            cap.release()
            print(f"[STREAM] Stopped stream for camera {camera.name}")
            
        except ImportError:
            print("[ERROR] OpenCV (cv2) is not installed. Install with: pip install opencv-python")
            yield b''
        except Exception as e:
            print(f"[STREAM ERROR] {e}")
            yield b''
    
    return Response(
        generate(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

# Camera Stream Proxy - Proxy camera feed to avoid CORS issues
@app.route('/api/cameras/<int:camera_id>/stream')
def stream_camera(camera_id):
    """Proxy camera stream to frontend"""
    username = request.args.get('username')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    camera = Camera.query.filter_by(id=camera_id, username=username).first()
    
    if not camera:
        return jsonify({"error": "Camera not found"}), 404
    
    # Get camera IP
    camera_ip = '192.168.137.189'  # Default to the CCTV IP
    
    try:
        # Try multiple stream URLs
        stream_urls = [
            f'http://{camera_ip}/cgi-bin/mjpg/video.cgi?channel=0&subtype=1',
            f'http://{camera_ip}/video.mjpg',
            f'http://{camera_ip}/videostream.cgi',
            f'http://admin:admin@{camera_ip}/video.mjpg'
        ]
        
        for stream_url in stream_urls:
            try:
                # Stream the camera feed
                req = requests.get(stream_url, stream=True, timeout=5, auth=('admin', 'admin'))
                
                if req.status_code == 200:
                    return Response(
                        stream_with_context(req.iter_content(chunk_size=1024)),
                        content_type=req.headers.get('content-type', 'multipart/x-mixed-replace; boundary=frame')
                    )
            except:
                continue
        
        return jsonify({"error": "Could not connect to camera stream"}), 503
        
    except Exception as e:
        print(f"Stream proxy error: {e}")
        return jsonify({"error": str(e)}), 500

# Camera Snapshot Proxy
@app.route('/api/cameras/<int:camera_id>/snapshot')
def snapshot_camera(camera_id):
    """Proxy camera snapshot to frontend"""
    username = request.args.get('username')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    camera = Camera.query.filter_by(id=camera_id, username=username).first()
    
    if not camera:
        return jsonify({"error": "Camera not found"}), 404
    
    # Get camera IP
    camera_ip = '192.168.137.189'  # Default to the CCTV IP
    
    try:
        # Try multiple snapshot URLs
        snapshot_urls = [
            f'http://{camera_ip}/cgi-bin/snapshot.cgi',
            f'http://admin:admin@{camera_ip}/snapshot.jpg',
            f'http://{camera_ip}/tmpfs/auto.jpg',
            f'http://{camera_ip}/jpg/image.jpg'
        ]
        
        for snapshot_url in snapshot_urls:
            try:
                req = requests.get(snapshot_url, timeout=3, auth=('admin', 'admin'))
                
                if req.status_code == 200:
                    return Response(
                        req.content,
                        content_type=req.headers.get('content-type', 'image/jpeg')
                    )
            except:
                continue
        
        return jsonify({"error": "Could not get camera snapshot"}), 503
        
    except Exception as e:
        print(f"Snapshot proxy error: {e}")
        return jsonify({"error": str(e)}), 500

# Intruder endpoints
@app.route('/api/intruders')
def get_intruders():
    status = request.args.get('status')
    date_from = request.args.get('dateFrom')
    date_to = request.args.get('dateTo')

    query = Intruder.query.order_by(Intruder.last_seen.desc())

    if status:
        query = query.filter(Intruder.status == status)
    if date_from:
        try:
            query = query.filter(Intruder.first_seen >= datetime.strptime(date_from, '%Y-%m-%d'))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Intruder.first_seen <= datetime.strptime(date_to + ' 23:59:59', '%Y-%m-%d %H:%M:%S'))
        except ValueError:
            pass

    intruders = query.all()
    result = []
    for i in intruders:
        # Get all appearances for this intruder, newest first
        all_appearances = IntruderAppearance.query.filter_by(intruder_id=i.id).order_by(IntruderAppearance.timestamp.desc()).all()
        latest_appearance = all_appearances[0] if all_appearances else None
        image_path = latest_appearance.image_path if latest_appearance else None

        # Get camera name from latest appearance
        camera_name = None
        if latest_appearance and latest_appearance.camera_id:
            cam = Camera.query.get(latest_appearance.camera_id)
            camera_name = cam.name if cam else f'Camera {latest_appearance.camera_id}'

        # Build appearance list with timestamps and image URLs
        appearances_list = []
        for ap in all_appearances:
            ap_cam = None
            if ap.camera_id:
                c = Camera.query.get(ap.camera_id)
                ap_cam = c.name if c else f'Camera {ap.camera_id}'
            appearances_list.append({
                'id': ap.id,
                'timestamp': ap.timestamp.strftime('%Y-%m-%d %H:%M:%S') if ap.timestamp else None,
                'camera': ap_cam or 'Unknown',
                'imageUrl': f'/api/captures/{ap.image_path}' if ap.image_path else None,
            })

        # Find recording segments where this intruder appears
        # Recordings are files named recording_YYYYMMDD_HHMMSS.webm
        # Look for the camera owner to build recording paths
        recording_segments = []
        if latest_appearance and latest_appearance.camera_id:
            cam_obj = Camera.query.get(latest_appearance.camera_id)
            if cam_obj and cam_obj.username:
                rec_dir = get_recordings_dir(cam_obj.username, cam_obj.id, cam_obj.name)
                if os.path.exists(rec_dir):
                    rec_files = sorted([f for f in os.listdir(rec_dir) if f.endswith('.webm') or f.endswith('.mp4')])
                    for rf in rec_files:
                        ts_str = rf.replace('recording_', '').replace('.webm', '').replace('.mp4', '')
                        try:
                            rec_start = datetime.strptime(ts_str, '%Y%m%d_%H%M%S')
                        except ValueError:
                            continue
                        # Get file size to estimate duration (or use stat mtime)
                        rec_path = os.path.join(rec_dir, rf)
                        stat = os.stat(rec_path)
                        # Use next file's start time or file modified time as end estimate
                        rec_end = datetime.fromtimestamp(stat.st_mtime)

                        # Check if intruder was seen during this recording window
                        for ap in all_appearances:
                            if ap.timestamp and rec_start <= ap.timestamp <= rec_end:
                                recording_segments.append({
                                    'filename': rf,
                                    'camera': cam_obj.name,
                                    'startTime': rec_start.strftime('%Y-%m-%d %H:%M:%S'),
                                    'endTime': rec_end.strftime('%Y-%m-%d %H:%M:%S'),
                                    'detectedAt': ap.timestamp.strftime('%H:%M:%S'),
                                })
                                break  # One match per segment is enough

        result.append({
            'id': i.id,
            'status': i.status or 'active',
            'firstSeen': i.first_seen.strftime('%Y-%m-%d %H:%M:%S') if i.first_seen else None,
            'lastSeen': i.last_seen.strftime('%Y-%m-%d %H:%M:%S') if i.last_seen else None,
            'appearances': i.appearance_count,
            'camera': camera_name or 'Unknown',
            'imageUrl': f'/api/captures/{image_path}' if image_path else None,
            'appearancesList': appearances_list,
            'recordingSegments': recording_segments,
        })
    return jsonify(result)


@app.route('/api/intruders/<int:intruder_id>', methods=['GET', 'PATCH', 'DELETE'])
def get_intruder(intruder_id):
    intruder = Intruder.query.get(intruder_id)
    if not intruder:
        return jsonify({"error": "Intruder not found"}), 404

    if request.method == 'PATCH':
        data = request.get_json() or {}
        if 'status' in data:
            intruder.status = data['status']
        if 'notes' in data:
            intruder.notes = data['notes']
        db.session.commit()
        return jsonify({'message': 'Updated'})

    if request.method == 'DELETE':
        db.session.delete(intruder)
        db.session.commit()
        return jsonify({'message': 'Deleted'})

    return jsonify({
        'id': intruder.id,
        'status': intruder.status,
        'firstSeen': intruder.first_seen.strftime('%Y-%m-%d %H:%M:%S') if intruder.first_seen else None,
        'lastSeen': intruder.last_seen.strftime('%Y-%m-%d %H:%M:%S') if intruder.last_seen else None,
        'appearances': intruder.appearance_count
    })

# Authorized persons endpoints

# Alerts endpoints
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    alerts = Alert.query.order_by(Alert.created_at.desc()).limit(100).all()
    result = []
    for a in alerts:
        result.append({
            'id': a.id,
            'type': a.alert_type,
            'severity': a.severity,
            'message': a.message,
            'timestamp': a.created_at.strftime('%Y-%m-%d %H:%M:%S') if a.created_at else None,
            'isAcknowledged': a.is_acknowledged
        })
    return jsonify(result)


@app.route('/api/alerts/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404
    alert.is_acknowledged = True
    alert.acknowledged_at = datetime.now()
    db.session.commit()
    return jsonify({'message': 'Acknowledged'})


@app.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404
    db.session.delete(alert)
    db.session.commit()
    return jsonify({'message': 'Alert deleted'})


@app.route('/api/alerts', methods=['DELETE'])
def delete_all_alerts():
    count = Alert.query.count()
    Alert.query.delete()
    db.session.commit()
    return jsonify({'message': f'{count} alerts deleted'})


@app.route('/api/detections')
def get_detections():
    try:
        # Get detections from database
        detections = DetectionEvent.query.order_by(DetectionEvent.timestamp.desc()).limit(100).all()
        
        detection_list = []
        for detection in detections:
            detection_list.append({
                "id": detection.id,
                "cameraId": detection.camera_id,
                "personId": detection.person_id if detection.person_id else None,
                "confidence": float(detection.confidence) if detection.confidence else 0.0,
                "timestamp": detection.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                "isAuthorized": detection.person_id is not None
            })
        
        return jsonify(detection_list)
    except Exception as e:
        print(f"Error fetching detections: {e}")
        return jsonify([])

# Process captured frame for face detection
@app.route('/api/detection/process-frame', methods=['POST'])
def process_frame():
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        # Get the base64 image data
        image_data = data['image']
        camera_id = data.get('cameraId', 1)  # Default to camera 1 (laptop camera)
        
        # Save image to file
        captures_dir = os.path.join(os.path.dirname(__file__), 'captures')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        filename = f'capture_{camera_id}_{timestamp}.jpg'
        filepath = os.path.join(captures_dir, filename)
        
        # Decode base64 image and save
        try:
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
        except Exception as e:
            print(f"Error saving image: {e}")
            filepath = None
        
        # attempt face detection/recognition if face_recognition available
        identifications = []
        intruder_image = False  # Track if this image is used for an intruder appearance
        try:
            import face_recognition
            import pickle
            import numpy as np

            # load image from bytes
            image = face_recognition.load_image_file(filepath)
            face_locations = face_recognition.face_locations(image)
            face_encs = face_recognition.face_encodings(image, face_locations)

            # load stored authorized encodings
            all_encodings = []  # tuples (person_id, name, encoding array)
            persons = AuthorizedPerson.query.all()
            for person in persons:
                for enc in person.face_encodings:
                    vec = pickle.loads(enc.encoding)
                    all_encodings.append((person.id, person.name, np.array(vec)))

            # compare each face
            for loc, face_enc in zip(face_locations, face_encs):
                top, right, bottom, left = loc
                name = None
                confidence = 0.0
                best_dist = 1.0
                for pid, pname, vec in all_encodings:
                    dist = np.linalg.norm(vec - face_enc)
                    if dist < best_dist:
                        best_dist = dist
                        name = pname
                if best_dist < 0.6 and name:
                    confidence = 1.0 - best_dist
                else:
                    name = None
                identifications.append({
                    'top': top, 'left': left, 'bottom': bottom, 'right': right,
                    'name': name, 'confidence': confidence
                })

                # Unknown face => add to intruder gallery
                if not name:
                    intruder_image = True  # This image is needed for intruder appearance
                    # Check if this face matches an existing intruder
                    matched_intruder = None
                    existing_intruders = Intruder.query.all()
                    for ei in existing_intruders:
                        for eie in ei.face_encodings:
                            stored_vec = pickle.loads(eie.encoding)
                            d = np.linalg.norm(np.array(stored_vec) - face_enc)
                            if d < 0.6:
                                matched_intruder = ei
                                break
                        if matched_intruder:
                            break

                    if matched_intruder:
                        # Update existing intruder
                        matched_intruder.last_seen = datetime.now()
                        matched_intruder.appearance_count += 1
                        appearance = IntruderAppearance(
                            intruder_id=matched_intruder.id,
                            camera_id=camera_id,
                            timestamp=datetime.now(),
                            image_path=filename if filepath else None,
                            confidence=float(best_dist)
                        )
                        db.session.add(appearance)
                    else:
                        # Create new intruder
                        new_intruder = Intruder(
                            first_seen=datetime.now(),
                            last_seen=datetime.now(),
                            appearance_count=1,
                            status='active',
                            threat_level='medium'
                        )
                        db.session.add(new_intruder)
                        db.session.flush()  # get ID

                        # Save face encoding
                        enc_blob = pickle.dumps(face_enc.tolist())
                        ife = IntruderFaceEncoding(
                            intruder_id=new_intruder.id,
                            encoding=enc_blob
                        )
                        db.session.add(ife)

                        # Save appearance
                        appearance = IntruderAppearance(
                            intruder_id=new_intruder.id,
                            camera_id=camera_id,
                            timestamp=datetime.now(),
                            image_path=filename if filepath else None,
                            confidence=float(best_dist)
                        )
                        db.session.add(appearance)

                        # Create alert for new intruder
                        cam = Camera.query.get(camera_id)
                        cam_name = cam.name if cam else f'Camera {camera_id}'
                        alert = Alert(
                            alert_type='intruder_detected',
                            severity='critical',
                            message=f'Unknown person detected on {cam_name}',
                            created_at=datetime.now()
                        )
                        db.session.add(alert)

            db.session.commit()

        except Exception as e:
            # face_recognition not installed or error, ignore
            print('face recognition error', e)

        # Delete the capture file if it's NOT needed for an intruder appearance
        if filepath and os.path.exists(filepath) and not intruder_image:
            try:
                os.remove(filepath)
            except Exception:
                pass  # best-effort cleanup

        return jsonify({
            "success": True,
            "message": "Frame processed successfully",
            "filename": filename if intruder_image else None,
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "faces_detected": len(identifications),
            "identifications": identifications
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error processing frame: {e}")
        return jsonify({"error": str(e)}), 500

# Get camera info from database (legacy endpoint - currently unused)
@app.route('/api/cameras/database')
def get_cameras_from_db():
    try:
        cameras = Camera.query.all()
        
        camera_list = []
        for camera in cameras:
            camera_list.append({
                "id": camera.id,
                "name": camera.name,
                "location": camera.location,
                "status": camera.status,
                "rtspUrl": camera.rtsp_url,
                "isActive": camera.is_active
            })
        
        return jsonify(camera_list)
    except Exception as e:
        print(f"Error fetching cameras: {e}")
        return jsonify(cameras_data)  # Fallback to sample data

# Get all saved captures with pagination
@app.route('/api/captures')
def get_captures():
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('perPage', 20))
        camera_id = request.args.get('cameraId')
        
        # Query detection events with images
        query = DetectionEvent.query.filter(DetectionEvent.image_path.isnot(None))
        
        if camera_id:
            query = query.filter_by(camera_id=camera_id)
        
        # Order by newest first
        query = query.order_by(DetectionEvent.timestamp.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        captures = []
        for detection in pagination.items:
            captures.append({
                "id": detection.id,
                "cameraId": detection.camera_id,
                "filename": detection.image_path,
                "timestamp": detection.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                "date": detection.timestamp.strftime('%Y-%m-%d'),
                "time": detection.timestamp.strftime('%H:%M:%S'),
                "confidence": float(detection.confidence) if detection.confidence else 0,
                "isAuthorized": detection.person_id is not None
            })
        
        return jsonify({
            "captures": captures,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": page,
            "per_page": per_page
        })
        
    except Exception as e:
        print(f"Error fetching captures: {e}")
        return jsonify({"captures": [], "total": 0}), 500

# Delete a capture by ID
@app.route('/api/captures/delete/<int:capture_id>', methods=['DELETE'])
def delete_capture(capture_id):
    try:
        detection = DetectionEvent.query.get(capture_id)
        if not detection:
            return jsonify({"error": "Capture not found"}), 404

        # Delete the file from disk
        if detection.image_path:
            captures_dir = os.path.join(os.path.dirname(__file__), 'captures')
            filepath = os.path.join(captures_dir, detection.image_path)
            if os.path.exists(filepath):
                os.remove(filepath)

        # Delete the DB record
        db.session.delete(detection)
        db.session.commit()
        return jsonify({"success": True, "message": "Capture deleted"})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting capture: {e}")
        return jsonify({"error": str(e)}), 500

# Delete all captures
@app.route('/api/captures/delete-all', methods=['DELETE'])
def delete_all_captures():
    try:
        captures_dir = os.path.join(os.path.dirname(__file__), 'captures')
        detections = DetectionEvent.query.all()
        deleted = 0
        for d in detections:
            if d.image_path:
                filepath = os.path.join(captures_dir, d.image_path)
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except Exception:
                        pass
            db.session.delete(d)
            deleted += 1
        db.session.commit()
        return jsonify({"success": True, "message": f"{deleted} captures deleted"})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting all captures: {e}")
        return jsonify({"error": str(e)}), 500

# Serve capture image
@app.route('/api/captures/<filename>')
def serve_capture(filename):
    try:
        captures_dir = os.path.join(os.path.dirname(__file__), 'captures')
        filepath = os.path.join(captures_dir, filename)
        
        if os.path.exists(filepath):
            return send_file(filepath, mimetype='image/jpeg')
        else:
            return jsonify({"error": "Image not found"}), 404
            
    except Exception as e:
        print(f"Error serving capture: {e}")
        return jsonify({"error": str(e)}), 500

# Add/Update laptop camera
@app.route('/api/cameras/laptop', methods=['POST'])
def register_laptop_camera():
    try:
        data = request.get_json()
        username = data.get('username') if data else None
        
        # Get username from localStorage if not provided
        if not username:
            username = request.headers.get('X-Username', 'admin')
        
        camera_name = data.get('name', 'Laptop Camera') if data else 'Laptop Camera'
        
        # Check if this user already has a laptop camera
        laptop_camera = Camera.query.filter_by(
            username=username,
            name=camera_name
        ).first()
        
        if not laptop_camera:
            laptop_camera = Camera(
                name=camera_name,
                location=data.get('location', 'Live Monitoring') if data else 'Live Monitoring',
                rtsp_url='webcam://0',
                camera_type='Webcam',
                status='online',
                is_active=True,
                username=username
            )
            db.session.add(laptop_camera)
            db.session.commit()
            
            return jsonify({
                "success": True,
                "message": "Laptop camera registered",
                "cameraId": laptop_camera.id
            })
        else:
            # Update status
            laptop_camera.status = 'online'
            laptop_camera.is_active = True
            db.session.commit()
            
            return jsonify({
                "success": True,
                "message": "Laptop camera updated",
                "cameraId": laptop_camera.id
            })
            
    except Exception as e:
        db.session.rollback()
        print(f"Error registering laptop camera: {e}")
        return jsonify({"error": str(e)}), 500

# Update laptop camera status
@app.route('/api/cameras/laptop/status', methods=['PUT'])
def update_laptop_camera_status():
    try:
        data = request.get_json()
        status = data.get('status', 'online')
        username = data.get('username', 'admin')  # Get username from request or default to admin
        
        # Find webcam/laptop camera for this user (prioritize by camera type, then by name)
        laptop_camera = Camera.query.filter_by(username=username).filter(
            (Camera.camera_type.in_(['Webcam', 'USB'])) | 
            (Camera.name.ilike('%laptop%'))
        ).first()
        
        if not laptop_camera:
            return jsonify({"error": "Webcam/Laptop camera not found"}), 404
        
        # Update status
        laptop_camera.status = status
        laptop_camera.is_active = (status == 'online')
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Camera status updated to {status}",
            "cameraId": laptop_camera.id,
            "cameraName": laptop_camera.name,
            "status": status
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating camera status: {e}")
        return jsonify({"error": str(e)}), 500

# Upload recorded video
@app.route('/api/recordings/upload', methods=['POST'])
def upload_recording():
    try:
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files['video']
        duration = request.form.get('duration', 0)
        username = request.form.get('username')  # Get username from request
        camera_id = request.form.get('camera_id')  # Get camera ID
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        if video_file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        # Get camera name if camera_id is provided
        camera_name = "Default"
        if camera_id:
            camera = Camera.query.filter_by(id=camera_id, username=username).first()
            if camera:
                camera_name = camera.name
        
        # Generate unique filename using local time
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'recording_{timestamp}.webm'
        
        # Use camera-specific recordings directory
        recordings_dir = get_recordings_dir(username, camera_id, camera_name)
        
        # Create camera directory if it doesn't exist
        if not os.path.exists(recordings_dir):
            os.makedirs(recordings_dir)
        
        filepath = os.path.join(recordings_dir, filename)
        
        # Save video file
        video_file.save(filepath)
        
        # Log the recording
        log = SystemLog(
            action='video_recorded',
            description=f'Video recording saved for user {username}: {filename} (Duration: {duration}s)',
            timestamp=datetime.now()
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Video uploaded successfully",
            "filename": filename,
            "filepath": filepath,
            "duration": duration
        })
        
    except Exception as e:
        print(f"Error uploading video: {e}")
        return jsonify({"error": str(e)}), 500

# Open recordings folder in file explorer
@app.route('/api/recordings/open-folder', methods=['POST'])
def open_recordings_folder():
    try:
        data = request.get_json()
        username = data.get('username')
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        # Get user-specific recordings directory
        abs_path = get_recordings_dir(username)
        
        print("=" * 60)
        print("[OPEN FOLDER] Request received")
        print(f"[OPEN FOLDER] Username: {username}")
        print(f"[OPEN FOLDER] Opening: {abs_path}")
        print("=" * 60)
        
        # Create directory if it doesn't exist
        try:
            if not os.path.exists(abs_path):
                os.makedirs(abs_path)
                print("[SUCCESS] Created recordings directory")
        except Exception as e:
            print(f"[WARNING] Could not create directory: {e}")
        
        # Try multiple methods to open explorer
        try:
            # Method 1: os.startfile (most reliable for Windows)
            os.startfile(abs_path)
            print("[SUCCESS] Explorer opened with os.startfile")
            
            return jsonify({
                "success": True,
                "message": "Recordings folder opened",
                "path": abs_path
            })
        except Exception as e:
            print(f"[WARNING] os.startfile failed: {e}")
            
            # Method 2: subprocess.Popen with shell
            try:
                import subprocess
                subprocess.Popen(f'explorer "{abs_path}"', shell=True)
                print("[SUCCESS] Explorer opened with subprocess shell")
                
                return jsonify({
                    "success": True,
                    "message": "Recordings folder opened",
                    "path": abs_path
                })
            except Exception as e2:
                print(f"[ERROR] All methods failed: {e2}")
                return jsonify({
                    "success": False,
                    "error": f"Failed to open folder: {str(e)}",
                    "path": abs_path
                }), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/recordings/select-folder', methods=['GET'])
def select_recordings_folder():
    """System folder picker for selecting recordings path (desktop only)."""
    try:
        try:
            import tkinter as tk
            from tkinter import filedialog
        except Exception as ie:
            return jsonify({'error': 'tkinter not available', 'detail': str(ie)}), 500

        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)

        folder_path = filedialog.askdirectory()
        root.destroy()

        if not folder_path:
            return jsonify({'canceled': True}), 200

        return jsonify({'path': folder_path}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Get all recordings
@app.route('/api/recordings')
def get_recordings():
    try:
        # Get username from query parameter
        username = request.args.get('username')
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        # Get user's cameras
        cameras = Camera.query.filter_by(username=username).all()
        
        # Use user-specific recordings directory
        user_recordings_dir = get_recordings_dir(username)
        
        if not os.path.exists(user_recordings_dir):
            os.makedirs(user_recordings_dir)
            return jsonify({"recordings": [], "cameras": [], "total": 0, "totalSizeMB": 0})
        
        recordings_by_camera = {}
        all_recordings = []
        
        # Scan each camera's folder
        for camera in cameras:
            camera_dir = get_recordings_dir(username, camera.id, camera.name)
            camera_recordings = []
            
            if os.path.exists(camera_dir):
                for filename in os.listdir(camera_dir):
                    if filename.endswith('.webm') or filename.endswith('.mp4'):
                        filepath = os.path.join(camera_dir, filename)
                        stats = os.stat(filepath)
                        
                        # Extract timestamp from filename
                        timestamp_str = filename.replace('recording_', '').replace('.webm', '').replace('.mp4', '')
                        try:
                            # Parse the timestamp from filename (local time)
                            file_time = datetime.strptime(timestamp_str, '%Y%m%d_%H%M%S')
                            formatted_time = file_time.strftime('%Y-%m-%d %H:%M:%S')
                        except:
                            # Fallback to file creation time
                            file_time = datetime.fromtimestamp(stats.st_mtime)
                            formatted_time = file_time.strftime('%Y-%m-%d %H:%M:%S')
                        
                        recording_data = {
                            "filename": filename,
                            "camera_id": camera.id,
                            "camera_name": camera.name,
                            "size": stats.st_size,
                            "sizeMB": round(stats.st_size / (1024 * 1024), 2),
                            "created": formatted_time,
                            "timestamp": stats.st_mtime
                        }
                        camera_recordings.append(recording_data)
                        all_recordings.append(recording_data)
            
            # Sort camera recordings by newest first
            camera_recordings.sort(key=lambda x: x['timestamp'], reverse=True)
            
            recordings_by_camera[camera.id] = {
                "camera_id": camera.id,
                "camera_name": camera.name,
                "camera_type": camera.camera_type,
                "recordings": camera_recordings,
                "count": len(camera_recordings),
                "totalSizeMB": round(sum(r['size'] for r in camera_recordings) / (1024 * 1024), 2)
            }
        
        # Sort all recordings by newest first
        all_recordings.sort(key=lambda x: x['timestamp'], reverse=True)
        
        base_path = get_recordings_dir()  # current global base path
        return jsonify({
            "recordings": all_recordings,
            "recordingsByCamera": recordings_by_camera,
            "cameras": [{
                "id": c.id,
                "name": c.name,
                "type": c.camera_type
            } for c in cameras],
            "total": len(all_recordings),
            "totalSizeMB": round(sum(r['size'] for r in all_recordings) / (1024 * 1024), 2),
            "segmentDuration": get_segment_duration(),
            "recordingsPath": base_path
        })
        
    except Exception as e:
        print(f"Error getting recordings: {e}")
        return jsonify({"error": str(e)}), 500

# Delete all recordings (Format) - MUST come BEFORE /<filename> route
@app.route('/api/recordings/format', methods=['DELETE'])
def format_recordings():
    try:
        data = request.get_json()
        username = data.get('username')
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        print(f"[FORMAT] Formatting all recordings for user: {username}...")
        user_dir = get_recordings_dir(username)
        
        if not os.path.exists(user_dir):
            print("[WARNING] No recordings directory found")
            return jsonify({"success": True, "message": "No recordings to delete", "deleted": 0, "failed": 0})
        
        deleted_count = 0
        failed_count = 0
        errors = []
        
        # Delete from all camera folders
        cameras = Camera.query.filter_by(username=username).all()
        for camera in cameras:
            camera_dir = get_recordings_dir(username, camera.id, camera.name)
            
            if os.path.exists(camera_dir):
                for filename in os.listdir(camera_dir):
                    if filename.endswith('.webm') or filename.endswith('.mp4'):
                        filepath = os.path.join(camera_dir, filename)
                        try:
                            os.remove(filepath)
                            deleted_count += 1
                            print(f"[SUCCESS] Deleted: {filename} from {camera.name}")
                        except PermissionError as pe:
                            failed_count += 1
                            error_msg = f"Permission denied: {filename}"
                            errors.append(error_msg)
                            print(f"[ERROR] {error_msg}")
                        except Exception as e:
                            failed_count += 1
                            error_msg = f"Error deleting {filename}: {str(e)}"
                            errors.append(error_msg)
                            print(f"[ERROR] {error_msg}")
        
        message = f"Deleted {deleted_count} recording(s)"
        if failed_count > 0:
            message += f" ({failed_count} failed - files may be in use)"
        
        print(f"[SUCCESS] Format complete: {message}")
        
        return jsonify({
            "success": True,
            "message": message,
            "deleted": deleted_count,
            "failed": failed_count,
            "errors": errors
        })
        
    except Exception as e:
        print(f"[ERROR] Error formatting recordings: {e}")
        return jsonify({"error": str(e)}), 500

# Serve recording video
@app.route('/api/recordings/<filename>', methods=['GET'])
def serve_recording(filename):
    try:
        # Get username and camera_id from query parameters
        username = request.args.get('username')
        camera_id = request.args.get('camera_id')
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        # If camera_id is provided, look in camera-specific folder
        if camera_id:
            camera = Camera.query.filter_by(id=camera_id, username=username).first()
            if camera:
                recordings_dir = get_recordings_dir(username, camera.id, camera.name)
                filepath = os.path.join(recordings_dir, filename)
                
                if os.path.exists(filepath):
                    return send_file(filepath, mimetype='video/webm')
        
        # Fallback: search all camera folders
        cameras = Camera.query.filter_by(username=username).all()
        for camera in cameras:
            recordings_dir = get_recordings_dir(username, camera.id, camera.name)
            filepath = os.path.join(recordings_dir, filename)
            
            if os.path.exists(filepath):
                return send_file(filepath, mimetype='video/webm')
        
        return jsonify({"error": "Video not found"}), 404
            
    except Exception as e:
        print(f"Error serving recording: {e}")
        return jsonify({"error": str(e)}), 500

# Delete recording
@app.route('/api/recordings/<filename>', methods=['DELETE'])
def delete_recording(filename):
    try:
        data = request.get_json()
        username = data.get('username')
        camera_id = data.get('camera_id')
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        print(f"Attempting to delete recording: {filename} for user: {username}")
        
        # If camera_id is provided, look in camera-specific folder
        if camera_id:
            camera = Camera.query.filter_by(id=camera_id, username=username).first()
            if camera:
                recordings_dir = get_recordings_dir(username, camera.id, camera.name)
                filepath = os.path.join(recordings_dir, filename)
                
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                        print(f"Successfully deleted: {filename}")
                        return jsonify({"success": True, "message": "Recording deleted successfully"})
                    except PermissionError as pe:
                        print(f"Permission error: {pe}")
                        return jsonify({"error": "File is in use or permission denied"}), 403
                    except Exception as e:
                        print(f"Error deleting file: {e}")
                        return jsonify({"error": str(e)}), 500
        
        # Fallback: search all camera folders
        cameras = Camera.query.filter_by(username=username).all()
        for camera in cameras:
            recordings_dir = get_recordings_dir(username, camera.id, camera.name)
            filepath = os.path.join(recordings_dir, filename)
            
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                    print(f"Successfully deleted: {filename}")
                    return jsonify({"success": True, "message": "Recording deleted successfully"})
                except PermissionError as pe:
                    print(f"Permission error: {pe}")
                    return jsonify({"error": "File is in use or permission denied"}), 403
                except Exception as e:
                    print(f"Error deleting file: {e}")
                    return jsonify({"error": str(e)}), 500
        
        print(f"Video not found: {filename}")
        return jsonify({"error": "Video not found"}), 404
            
    except Exception as e:
        print(f"Error in delete_recording: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Get real-time system health
@app.route('/api/system/health', methods=['GET'])
def get_system_health():
    try:
        import psutil
        import platform
        
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_used_gb = round(memory.used / (1024**3), 2)
        memory_total_gb = round(memory.total / (1024**3), 2)
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_used_gb = round(disk.used / (1024**3), 2)
        disk_total_gb = round(disk.total / (1024**3), 2)
        
        # Network IO
        net_io = psutil.net_io_counters()
        network_sent_mb = round(net_io.bytes_sent / (1024**2), 2)
        network_recv_mb = round(net_io.bytes_recv / (1024**2), 2)
        
        # System info
        system_info = {
            'os': platform.system(),
            'os_version': platform.version(),
            'processor': platform.processor(),
            'architecture': platform.machine()
        }
        
        return jsonify({
            'cpu': {
                'percent': cpu_percent,
                'cores': psutil.cpu_count()
            },
            'memory': {
                'percent': memory_percent,
                'used_gb': memory_used_gb,
                'total_gb': memory_total_gb
            },
            'disk': {
                'percent': disk_percent,
                'used_gb': disk_used_gb,
                'total_gb': disk_total_gb
            },
            'network': {
                'sent_mb': network_sent_mb,
                'recv_mb': network_recv_mb
            },
            'system': system_info
        })
        
    except ImportError:
        return jsonify({
            'error': 'psutil not installed. Run: pip install psutil'
        }), 500
    except Exception as e:
        print(f"Error getting system health: {e}")
        return jsonify({"error": str(e)}), 500

# Recording manager (automatic, global)
from recording_manager import recording_manager

# manual stop endpoint will refuse unless no cameras remain
@app.route('/api/cameras/<int:camera_id>/recording/stop', methods=['POST'])
def recording_stop_disabled(camera_id):
    # only stop when there are no cameras
    total = Camera.query.count()
    if total == 0:
        recording_manager.stop_all()
        return jsonify({"success": True, "message": "Recording stopped (no cameras)"})
    return jsonify({"error": "Cannot stop recording while cameras exist"}), 403

@app.route('/api/recordings/active', methods=['GET'])
def active_recordings_disabled():
    # just report whether global recorder is running
    return jsonify({"recording": recording_manager.is_recording()})


# ── YOLOv8 Object Detection ──────────────────────────────────────────────────

# Category mapping for COCO classes
YOLO_CATEGORIES = {
    'bicycle': 'vehicle', 'car': 'vehicle', 'motorcycle': 'vehicle', 'airplane': 'vehicle',
    'bus': 'vehicle', 'train': 'vehicle', 'truck': 'vehicle', 'boat': 'vehicle',
    'traffic light': 'infrastructure', 'fire hydrant': 'infrastructure', 'stop sign': 'infrastructure',
    'parking meter': 'infrastructure', 'bench': 'furniture',
    'bird': 'animal', 'cat': 'animal', 'dog': 'animal', 'horse': 'animal', 'sheep': 'animal',
    'cow': 'animal', 'elephant': 'animal', 'bear': 'animal', 'zebra': 'animal', 'giraffe': 'animal',
    'backpack': 'accessory', 'umbrella': 'accessory', 'handbag': 'accessory', 'tie': 'accessory',
    'suitcase': 'accessory',
    'frisbee': 'sports', 'skis': 'sports', 'snowboard': 'sports', 'sports ball': 'sports',
    'kite': 'sports', 'baseball bat': 'sports', 'baseball glove': 'sports', 'skateboard': 'sports',
    'surfboard': 'sports', 'tennis racket': 'sports',
    'bottle': 'kitchen', 'wine glass': 'kitchen', 'cup': 'kitchen', 'fork': 'kitchen',
    'knife': 'kitchen', 'spoon': 'kitchen', 'bowl': 'kitchen',
    'banana': 'food', 'apple': 'food', 'sandwich': 'food', 'orange': 'food', 'broccoli': 'food',
    'carrot': 'food', 'hot dog': 'food', 'pizza': 'food', 'donut': 'food', 'cake': 'food',
    'chair': 'furniture', 'couch': 'furniture', 'potted plant': 'furniture', 'bed': 'furniture',
    'dining table': 'furniture', 'toilet': 'furniture',
    'tv': 'electronics', 'laptop': 'electronics', 'mouse': 'electronics', 'remote': 'electronics',
    'keyboard': 'electronics', 'cell phone': 'electronics', 'microwave': 'electronics',
    'oven': 'electronics', 'toaster': 'electronics', 'sink': 'electronics',
    'refrigerator': 'electronics',
    'book': 'item', 'clock': 'item', 'vase': 'item', 'scissors': 'tool',
    'teddy bear': 'item', 'hair drier': 'item', 'toothbrush': 'item',
}

_yolo_model = None

def get_yolo_model():
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            model_path = os.path.join(os.path.dirname(__file__), 'yolov8n.pt')
            _yolo_model = YOLO(model_path)
            print('[YOLO] Model loaded successfully')
        except Exception as e:
            print(f'[YOLO] Failed to load model: {e}')
    return _yolo_model


@app.route('/api/detection/detect-objects', methods=['POST'])
def detect_objects():
    """Run YOLOv8 object detection on a frame (non-human objects only)."""
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400

        camera_id = data.get('cameraId', 1)
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        # Decode image
        import numpy as np
        from PIL import Image
        from io import BytesIO as BIO
        img_bytes = base64.b64decode(image_data)
        img = Image.open(BIO(img_bytes)).convert('RGB')
        img_np = np.array(img)

        model = get_yolo_model()
        if model is None:
            return jsonify({'error': 'YOLO model not available'}), 500

        # Run inference — read confidence threshold from settings
        conf_threshold = 0.70
        try:
            s = SystemSettings.query.filter_by(setting_key='object_confidence').first()
            if s:
                conf_threshold = float(s.setting_value)
        except Exception:
            pass
        results = model(img_np, verbose=False, conf=conf_threshold)

        objects = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                label = model.names[cls_id]
                # Skip 'person' — we only want non-human objects
                if label == 'person':
                    continue
                conf = float(box.conf[0])
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                category = YOLO_CATEGORIES.get(label, 'other')
                objects.append({
                    'label': label,
                    'category': category,
                    'confidence': round(conf, 3),
                    'x': int(x1), 'y': int(y1),
                    'w': int(x2 - x1), 'h': int(y2 - y1),
                })

        # Save detections to DB (only if objects found)
        if objects:
            for obj in objects:
                det = ObjectDetection(
                    camera_id=camera_id,
                    label=obj['label'],
                    category=obj['category'],
                    confidence=obj['confidence'],
                    bbox_x=obj['x'], bbox_y=obj['y'],
                    bbox_w=obj['w'], bbox_h=obj['h'],
                    timestamp=datetime.now(),
                )
                db.session.add(det)
            db.session.commit()

        return jsonify({
            'success': True,
            'objects': objects,
            'frame_width': img_np.shape[1],
            'frame_height': img_np.shape[0],
        })
    except Exception as e:
        db.session.rollback()
        print(f'[YOLO] detect-objects error: {e}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/object-detections', methods=['GET'])
def get_object_detections():
    """Return recent object detections from DB."""
    try:
        limit = request.args.get('limit', 200, type=int)
        dets = ObjectDetection.query.order_by(ObjectDetection.timestamp.desc()).limit(limit).all()
        # Build camera name lookup
        cam_ids = set(d.camera_id for d in dets if d.camera_id)
        cam_map = {}
        if cam_ids:
            cams = Camera.query.filter(Camera.id.in_(cam_ids)).all()
            cam_map = {c.id: c.name for c in cams}
        result = []
        for d in dets:
            result.append({
                'id': d.id,
                'cameraId': d.camera_id,
                'cameraName': cam_map.get(d.camera_id, f'Camera {d.camera_id}'),
                'label': d.label,
                'category': d.category,
                'confidence': d.confidence,
                'bbox': {'x': d.bbox_x, 'y': d.bbox_y, 'w': d.bbox_w, 'h': d.bbox_h},
                'timestamp': d.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            })
        return jsonify(result)
    except Exception as e:
        print(f'Error fetching object detections: {e}')
        return jsonify([])


@app.route('/api/object-detections/<int:det_id>', methods=['DELETE'])
def delete_object_detection(det_id):
    try:
        d = ObjectDetection.query.get(det_id)
        if not d:
            return jsonify({'error': 'Not found'}), 404
        db.session.delete(d)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/object-detections', methods=['DELETE'])
def delete_all_object_detections():
    try:
        count = ObjectDetection.query.delete()
        db.session.commit()
        return jsonify({'success': True, 'deleted': count})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ─── AI CHATBOT (Groq + Gemini fallback) ───────────────────────────────────
from groq import Groq
try:
    from google import genai
    from google.genai import types as genai_types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

SYSTEM_KNOWLEDGE = """
You are **SecureVision AI Assistant**, the built-in AI support chatbot for the **Face Recognition Security System (SecureVision AI)** — a full-stack, AI-powered security platform developed by **Akash M Lodiwiks** (GitHub: @AkashMLodiwiksz).

Your job is to help users with ANY question about the system — features, troubleshooting, setup, architecture, database, API, code structure, technologies, or how to use any part of the UI. You know every single detail of this system.

Priority response style:
• Focus on concise user-friendly steps (e.g., “Go to Camera Management → select camera → delete”).
• Avoid code snippets or API request examples unless the user explicitly asks for programming help.
• Prefer exact navigation actions and plain language for feature usage requests.
• If asked for code, provide a short code sample with minimal extra detail.
• Keep answers simple and actionable by default.

────────────────────────────────────────
PROJECT OVERVIEW
────────────────────────────────────────
• Name: Face Recognition Security System (SecureVision AI)
• Version: 1.0.0 (initial release v0.1.0, 2025-10-06)
• License: MIT
• Repository: https://github.com/AkashMLodiwiksz/Face-Identifying-Security-system-
• Developer: Akash M Lodiwiks (@AkashMLodiwiksz)
• Default Login: Username "1", Password "1" (auto-created admin account)

────────────────────────────────────────
TECH STACK
────────────────────────────────────────
Frontend:
• React 19.1.1 — UI library
• Vite 7.1.7 — Build tool & dev server (localhost:3000)
• React Router DOM 7.9.3 — Client-side routing
• Tailwind CSS 3.4.1 — Utility-first CSS (dark mode)
• Axios 1.12.2 — HTTP client (baseURL: http://localhost:5000/api)
• Chart.js 4.5.0 + react-chartjs-2 — Data visualisation
• Lucide React 0.544.0 — Icon library
• PostCSS + Autoprefixer — Build pipeline

Backend:
• Python 3.12 — Language
• Flask 3.0.3 — Web framework (localhost:5000)
• Flask-CORS 5.0.0 — Cross-origin support
• Flask-SQLAlchemy 3.1.1 — ORM
• PostgreSQL 18+ — Database
• psycopg2-binary 2.9.9 — PostgreSQL adapter
• Flask-JWT-Extended 4.6.0 — JWT auth (installed but tokens are simple timestamp-based)
• bcrypt 4.2.0 — Password hashing (werkzeug used instead)
• OpenCV 4.10.0 — Video processing / RTSP streaming
• NumPy 2.1.2 — Array operations
• Pillow 11.0.0 — Image processing
• python-dotenv 1.0.1 — Env vars
• psutil 6.1.0 — System health (CPU, RAM, disk, net)
• ffmpeg-python 0.2.0 — Video recording
• face_recognition 1.2.3 + dlib 20.0.0 — Face detection/recognition
• Ultralytics 8.4.19 + PyTorch — YOLOv8 object detection (yolov8n.pt, 80 COCO classes)
• Groq SDK + Llama 3.3 70B — THIS chatbot (primary AI provider, free & fast)
• Google Gemini 2.0 Flash — Fallback AI provider for chatbot

Dev Tools:
• concurrently 9.1.0 — Run frontend+backend together
• ESLint 9.36.0 — Linting
• ffmpeg — System-level video segment recording

────────────────────────────────────────
DATABASE (PostgreSQL)
────────────────────────────────────────
Connection: DATABASE_URL env var (postgresql://postgres:PASSWORD@localhost:5432/face_recognition_db)
ORM: Flask-SQLAlchemy

Tables (12 total):
1. users — id, username (unique), email (unique), password_hash, role (admin/user/viewer), is_active, created_at, last_login
2. authorized_persons — id, name, employee_id, department, designation, phone, email, is_active, photo_path, registered_at
3. face_encodings — id, person_id (FK→authorized_persons), encoding (LargeBinary 128-dim), encoding_model (default 'FaceNet')
4. cameras — id, name, location, rtsp_url, camera_type (IP/USB/PTZ/CCTV/Webcam), status (online/offline), is_active, is_ptz, fps, resolution, username (owner)
5. detection_events — id, camera_id (FK), person_id (FK nullable), detection_type (face/person/object/animal), is_authorized, confidence, timestamp, image_path, bounding_box (JSON)
6. intruders — id, first_seen, last_seen, appearance_count, status (active/identified), threat_level (low/medium/high), notes
7. intruder_appearances — id, intruder_id (FK), detection_event_id (FK), camera_id (FK), timestamp, image_path, confidence
8. intruder_face_encodings — id, intruder_id (FK), encoding (LargeBinary), encoding_model
9. alerts — id, detection_event_id (FK), alert_type, severity (low/medium/high/critical), message, is_acknowledged, acknowledged_by (FK→users), acknowledged_at, created_at
10. system_logs — id, user_id (FK), action, entity_type, entity_id, description, ip_address, timestamp
11. system_settings — id, setting_key (unique), setting_value, description, updated_at (stores object_confidence and segment_duration)
12. object_detections — id, camera_id, label, category, confidence, bbox_x/y/w/h, timestamp

Key Relationships:
- AuthorizedPerson → many FaceEncoding (cascade delete)
- Camera → many DetectionEvent (cascade delete)
- DetectionEvent → one Alert (cascade delete)
- Intruder → many IntruderAppearance + IntruderFaceEncoding (cascade delete)

────────────────────────────────────────
API ENDPOINTS
────────────────────────────────────────
Authentication:
• POST /api/auth/login — Login (returns token + user info, creates default laptop camera)
• POST /api/auth/signup — Register (username ≥3, password ≥6, no admin self-reg)
• POST /api/auth/logout — Logout (stateless)

Dashboard:
• GET /api/dashboard/stats — Stats (cameras, authorized, intruders, detections)

Cameras:
• GET /api/cameras?username=X — List cameras
• POST /api/cameras — Add camera
• GET /api/cameras/<id>?username=X — Get camera
• PUT /api/cameras/<id> — Update camera
• DELETE /api/cameras/<id>?username=X — Delete camera
• POST /api/cameras/<id>/test — Test connection
• POST /api/cameras/<id>/ptz — PTZ command
• POST /api/cameras/<id>/settings — Camera settings
• GET /api/cameras/<id>/mjpeg-stream — MJPEG proxy (RTSP→frames)
• GET /api/cameras/<id>/stream — Proxy HTTP stream
• GET /api/cameras/<id>/snapshot — Proxy snapshot
• POST /api/cameras/laptop — Register laptop camera
• PUT /api/cameras/laptop/status — Update laptop status

Face Detection:
• POST /api/detection/process-frame — Process base64 image for faces (detects, compares, creates intruders/alerts)
• GET /api/detections — Recent face detection events

YOLO Object Detection:
• POST /api/detection/detect-objects — YOLOv8 inference (skips 'person', saves non-human objects)
• GET /api/object-detections?limit=N — Recent object detections (with camera name)
• DELETE /api/object-detections/<id> — Delete single object detection
• DELETE /api/object-detections — Delete all

Authorized Persons:
• GET /api/authorized_persons — List
• POST /api/authorized_persons — Add person with face images
• DELETE /api/authorized_persons/<id> — Delete

Intruders:
• GET /api/intruders?status=X&dateFrom=X&dateTo=X — List with appearances
• GET /api/intruders/<id> — Detail
• PATCH /api/intruders/<id> — Update status/notes
• DELETE /api/intruders/<id> — Delete

Alerts:
• GET /api/alerts — List (newest first)
• POST /api/alerts/<id>/acknowledge — Acknowledge
• DELETE /api/alerts/<id> — Delete
• DELETE /api/alerts — Delete all

Recordings:
• POST /api/recordings/upload — Upload browser-recorded segment
• GET /api/recordings?username=X — List grouped by camera
• GET /api/recordings/<filename>?username=X&camera_id=X — Serve file
• DELETE /api/recordings/<filename> — Delete recording
• DELETE /api/recordings/format — Delete ALL recordings for user
• POST /api/recordings/open-folder — Open Windows Explorer
• GET /api/recordings/active — Check if recorder running
• POST /api/cameras/<id>/recording/stop — Stop recording

Captures:
• GET /api/captures — Paginated captures list
• DELETE /api/captures/delete/<id> — Delete capture
• DELETE /api/captures/delete-all — Delete all
• GET /api/captures/<filename> — Serve image

System:
• GET /api/health — Health check
• GET /api/system/health — CPU, memory, disk, network
• GET /api/system_settings — Get settings
• POST /api/system_settings — Set setting
• POST /api/user/password — Change password

AI Chatbot:
• POST /api/chat — Send message to AI assistant (this endpoint)

────────────────────────────────────────
PAGES & FEATURES (Frontend)
────────────────────────────────────────
1. Login (/login) — Split layout: left branding panel (SecureVision AI), right form. Username/password, "Remember Me".
2. Signup (/signup) — Registration form with password strength indicator (weak→very strong).
3. Dashboard (/dashboard) — 4 gradient stat cards (Active Cameras, Authorized Persons, Intruders, Total Detections with animals/vehicles/others). Recent Alerts, Camera Status, System Health (CPU/Memory/Storage/Network bars). Polls every 3-10s.
4. Live Monitoring (/live-monitoring) — Multi-camera grid/single view. WebcamCapture draws face boxes (green=authorized, red=intruder) + YOLO object boxes (color-coded). Captures gallery.
5. Recordings (/recordings) — Advanced player with segment-based continuous playback, prev/next, seek, fullscreen. Table with camera, filename, times, size. Format All (double-confirm).
6. Detections (/detections) — YOLO object detection history. 4 stat cards, filters (search, category pills, date), table with category badges, confidence bars.
7. Intruders (/intruders) — Grid of intruder cards with images, status, threats, appearances timeline, recording segments.
8. Authorized Persons (/authorized-persons) — Webcam capture modal, add/delete persons.
9. Alerts (/alerts) — Severity-styled cards, acknowledge/delete, filter tabs, auto-poll.
10. Camera Management (/cameras) — Add/edit/delete cameras. IP or Webcam type, RTSP URL auto-gen, resolution/FPS/PTZ. Camera cards with status, test, edit.
11. Settings (/settings) — 3 tabs: Recording (segment duration), Detection (YOLO confidence 10-100%), Account (change password).
12. AI Assistant (/ai-assistant) — THIS chatbot page.

────────────────────────────────────────
KEY COMPONENTS
────────────────────────────────────────
• Layout — Sidebar (collapsible w-64↔w-20) + top navbar. REC indicator, LiveClock, alert bell badge, user dropdown.
• WebcamCapture — Opens webcam, draws video + face + object overlays on canvas. Browser MediaRecorder records from composite canvas (overlays in recording).
• RTSPCameraFeed — IP camera viewer via backend MJPEG proxy. PTZ controls, night vision, VLC, snapshot.
• DetectionContext (BackgroundDetectionProvider) — Wraps entire app. Hidden webcam → captures frame every 3s → sends to BOTH face + YOLO endpoints in parallel via Promise.allSettled. Auto-starts with cameras, auto-stops without.
• api.js — Axios instance, baseURL: http://localhost:5000/api, 10s timeout, auth token interceptor, 401 redirect.

────────────────────────────────────────
RECORDING SYSTEM
────────────────────────────────────────
• RecordingManager (singleton) manages one ffmpeg thread per camera
• Dual recording: RTSP/IP → ffmpeg → .mp4 | USB/Webcam → browser MediaRecorder → upload .webm
• Storage: C:\\Users\\{OS_User}\\Videos\\recordings\\{app_username}\\camera_{id}_{name}\\
• Segment duration configurable via Settings, stored in system_settings table
• Auto-start on server boot for RTSP cameras, webcam started from browser

────────────────────────────────────────
AI / ML FEATURES
────────────────────────────────────────
Face Recognition:
• face_recognition library → face_locations() for detection, face_encodings() for 128-dim vectors
• Matching: Euclidean distance < 0.6 = authorized, ≥ 0.6 = intruder
• Intruders auto-added to DB with face encodings, matched against existing intruders, alerts created

YOLO Object Detection:
• YOLOv8n (yolov8n.pt), 80 COCO classes (skips 'person')
• Confidence configurable (default 70%), stored as object_confidence in system_settings
• Categories: vehicle, animal, electronics, food, kitchen, sports, furniture, accessory, infrastructure, tool, item, other
• Color-coded overlays on Live Monitoring feeds

────────────────────────────────────────
AUTH SYSTEM
────────────────────────────────────────
• Password hashing: werkzeug.security
• Token: "token-{userId}-{timestamp}" (simple, not JWT)
• Frontend: localStorage (Remember Me) or sessionStorage
• ProtectedRoute checks localStorage.getItem('authToken')
• Axios interceptor adds Bearer token
• Roles: admin, user, viewer

────────────────────────────────────────
STYLING
────────────────────────────────────────
• Tailwind CSS dark mode (gray-900 backgrounds)
• Custom theme: primary blue #4e73df, dark sidebar #16213e, dark card #0f3460, dark bg #1a1a2e
• Gradients: purple→violet, emerald→teal, rose→pink, amber→orange
• Font: Inter, system-ui, sans-serif
• Icons: Lucide React
• Custom animations: fade-in, slide-in

────────────────────────────────────────
HOW TO RUN
────────────────────────────────────────
1. Install Python dependencies: pip install -r backend/requirements.txt
2. Install Node dependencies: cd frontend-react && npm install
3. Set up PostgreSQL, create face_recognition_db database
4. Set DATABASE_URL in backend/.env
5. npm run dev (runs both frontend & backend via concurrently)
   OR: Backend: cd backend && python app.py | Frontend: cd frontend-react && npm run dev
6. Access at http://localhost:3000, login with 1/1

────────────────────────────────────────
INSTRUCTIONS FOR YOUR BEHAVIOR
────────────────────────────────────────
• You are a FRIENDLY, HELPFUL, and KNOWLEDGEABLE assistant.
• Answer questions about ANY part of the system.
• Provide step-by-step solutions for troubleshooting.
• Explain code, architecture, database schema, API endpoints.
• Help with setup, configuration, and usage.
• Give code examples when helpful.
• If asked about something unrelated to the system, you can answer generally but always mention you're primarily the SecureVision AI assistant.
• Keep responses concise but thorough.
• Use markdown formatting for code blocks and structured answers.
• You know the developer is Akash M Lodiwiks.
"""

# Initialize AI clients (lazy)
_groq_client = None
_gemini_client = None

def get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.environ.get('GROQ_API_KEY', '')
        if not api_key:
            return None
        _groq_client = Groq(api_key=api_key)
    return _groq_client

def get_gemini_client():
    global _gemini_client
    if _gemini_client is None and GEMINI_AVAILABLE:
        api_key = os.environ.get('GEMINI_API_KEY', '')
        if not api_key:
            return None
        _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client

# In-memory chat history keyed by username (list of {role, content} dicts)
_chat_histories = {}

def _call_groq(messages):
    """Call Groq API with Llama 3.3 70B"""
    client = get_groq_client()
    if not client:
        return None, 'Groq not configured'
    try:
        response = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=messages,
            max_tokens=4096,
            temperature=0.7,
        )
        return response.choices[0].message.content, None
    except Exception as e:
        return None, str(e)

def _call_gemini(messages):
    """Call Gemini API as fallback"""
    client = get_gemini_client()
    if not client:
        return None, 'Gemini not configured'
    try:
        # Convert message format for Gemini
        contents = []
        for msg in messages:
            if msg['role'] == 'system':
                continue  # system instruction handled separately
            role = 'user' if msg['role'] == 'user' else 'model'
            contents.append(
                genai_types.Content(role=role, parts=[genai_types.Part.from_text(text=msg['content'])])
            )
        sys_instruction = next((m['content'] for m in messages if m['role'] == 'system'), '')
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=contents,
            config=genai_types.GenerateContentConfig(
                system_instruction=sys_instruction,
                temperature=0.7,
                max_output_tokens=4096,
            )
        )
        return response.text, None
    except Exception as e:
        return None, str(e)

@app.route('/api/chat', methods=['POST'])
def ai_chat():
    """AI Chatbot endpoint — tries Groq (Llama 3.3 70B) first, falls back to Gemini"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        username = data.get('username', 'anonymous')

        if not message:
            return jsonify({'error': 'Message is required'}), 400

        # Check if any AI provider is configured
        groq_available = bool(os.environ.get('GROQ_API_KEY', ''))
        gemini_available = GEMINI_AVAILABLE and bool(os.environ.get('GEMINI_API_KEY', ''))
        if not groq_available and not gemini_available:
            return jsonify({
                'error': 'AI chatbot is not configured. Please set GROQ_API_KEY (https://console.groq.com/keys) or GEMINI_API_KEY (https://aistudio.google.com/apikey) in backend/.env'
            }), 503

        # Get or create chat history for this user
        if username not in _chat_histories:
            _chat_histories[username] = []

        # Enrich message with live system context
        context_note = ""
        try:
            cam_count = Camera.query.filter(Camera.username != '1').count()
            auth_count = AuthorizedPerson.query.count()
            intruder_count = Intruder.query.filter_by(status='active').count()
            alert_count = Alert.query.filter_by(is_acknowledged=False).count()
            detection_count = ObjectDetection.query.count()
            user_count = User.query.count()
            context_note = (
                f"[LIVE SYSTEM STATUS — Cameras: {cam_count}, Authorized Persons: {auth_count}, "
                f"Active Intruders: {intruder_count}, Unread Alerts: {alert_count}, "
                f"Object Detections: {detection_count}, Registered Users: {user_count}]\n\n"
            )
        except Exception:
            pass

        enriched = context_note + message

        # Add user message to history
        _chat_histories[username].append({'role': 'user', 'content': enriched})

        # Keep last 30 messages to avoid token overflow
        if len(_chat_histories[username]) > 30:
            _chat_histories[username] = _chat_histories[username][-30:]

        # Build full messages list with system prompt
        messages = [{'role': 'system', 'content': SYSTEM_KNOWLEDGE}] + _chat_histories[username]

        # Try Groq first (primary), then Gemini (fallback)
        reply = None
        provider = None
        errors = []

        if groq_available:
            reply, err = _call_groq(messages)
            if reply:
                provider = 'Groq (Llama 3.3 70B)'
            else:
                errors.append(f'Groq: {err}')

        if not reply and gemini_available:
            reply, err = _call_gemini(messages)
            if reply:
                provider = 'Gemini 2.0 Flash'
            else:
                errors.append(f'Gemini: {err}')

        if not reply:
            error_detail = ' | '.join(errors) if errors else 'No AI provider available'
            return jsonify({'error': f'AI service error: {error_detail}'}), 500

        # Add assistant response to history
        _chat_histories[username].append({'role': 'assistant', 'content': reply})

        return jsonify({
            'reply': reply,
            'provider': provider,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
    except Exception as e:
        print(f'Chat error: {e}')
        return jsonify({'error': f'AI service error: {str(e)}'}), 500


@app.route('/api/chat/clear', methods=['POST'])
def clear_chat():
    """Clear chat history for a user"""
    try:
        data = request.get_json()
        username = data.get('username', 'anonymous')
        if username in _chat_histories:
            del _chat_histories[username]
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    import webbrowser, threading
    port = int(os.environ.get('PORT', 5000))
    is_production = not app.debug and os.path.exists(os.path.join(FRONTEND_BUILD_DIR, 'index.html'))

    if is_production or os.environ.get('SERVE_FRONTEND') == '1':
        # Serve React SPA — catch-all route (must be registered last)
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_react(path):
            # Serve static files if they exist
            full_path = os.path.join(FRONTEND_BUILD_DIR, path)
            if path and os.path.exists(full_path) and not os.path.isdir(full_path):
                return send_file(full_path)
            # Otherwise serve index.html for SPA routing
            return send_file(os.path.join(FRONTEND_BUILD_DIR, 'index.html'))

        print(f'\n  SecureVision AI — Production Mode')
        print(f'  Open http://localhost:{port} in your browser\n')
        # Auto-open browser after a short delay
        threading.Timer(1.5, lambda: webbrowser.open(f'http://localhost:{port}')).start()
        app.run(debug=False, host='0.0.0.0', port=port)
    else:
        print(f'\n  SecureVision AI — Development Mode')
        print(f'  Backend: http://localhost:{port}')
        print(f'  Frontend: http://localhost:3000\n')
        app.run(debug=True, host='0.0.0.0', port=port)
