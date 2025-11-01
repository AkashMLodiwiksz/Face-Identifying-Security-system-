from flask import Flask, jsonify, request, send_file, Response, stream_with_context
from flask_cors import CORS
from datetime import datetime
from models import db, User, Camera, DetectionEvent, SystemLog
from dotenv import load_dotenv
import os
import base64
import subprocess
import requests
from io import BytesIO

# Load environment variables
load_dotenv()

# Helper function to get recordings directory
def get_recordings_dir(username=None):
    """Get the recordings directory path using the current user's Videos folder"""
    user_profile = os.environ.get('USERPROFILE')  # e.g., C:\Users\YourActualUsername
    base_recordings_dir = os.path.join(user_profile, 'Videos', 'recordings')
    
    # If username is provided, return user-specific directory
    if username:
        return os.path.join(base_recordings_dir, username)
    
    return base_recordings_dir

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

app = Flask(__name__)

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
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Ensure user has a default laptop camera
        ensure_laptop_camera(username)
        
        # Generate token (in production, use JWT)
        token = f"token-{user.id}-{datetime.utcnow().timestamp()}"
        
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
    # Get query parameters for filtering
    threat_level = request.args.get('threatLevel')
    status = request.args.get('status')
    
    filtered = intruders_data
    
    if threat_level:
        filtered = [i for i in filtered if i['threatLevel'] == threat_level]
    if status:
        filtered = [i for i in filtered if i['status'] == status]
    
    return jsonify(filtered)

@app.route('/api/intruders/<int:intruder_id>')
def get_intruder(intruder_id):
    intruder = next((i for i in intruders_data if i['id'] == intruder_id), None)
    if intruder:
        return jsonify(intruder)
    return jsonify({"error": "Intruder not found"}), 404

# Authorized persons endpoints
@app.route('/api/authorized-persons')
def get_authorized_persons():
    # Placeholder data
    return jsonify([
        {"id": 1, "name": "John Smith", "role": "Employee", "department": "IT"},
        {"id": 2, "name": "Jane Doe", "role": "Manager", "department": "HR"},
    ])

# Alerts endpoints
@app.route('/api/alerts')
def get_alerts():
    return jsonify([
        {
            "id": 1,
            "type": "intruder_detected",
            "message": "Unknown person detected at Front Entrance",
            "timestamp": "2025-10-05 18:45:12",
            "severity": "critical"
        }
    ])

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
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
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
        
        # Create a detection event in the database
        detection = DetectionEvent(
            camera_id=camera_id,
            person_id=None,  # Will be set after face recognition
            detection_type='face',
            is_authorized=False,
            confidence=0.0,  # Will be updated after processing
            timestamp=datetime.utcnow(),
            image_path=filename if filepath else None
        )
        
        db.session.add(detection)
        
        # Log the event
        log = SystemLog(
            event_type='frame_captured',
            description=f'Frame captured from camera {camera_id} and saved as {filename}',
            severity='info',
            created_at=datetime.utcnow()
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Frame processed and saved successfully",
            "detectionId": detection.id,
            "filename": filename,
            "timestamp": detection.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            "faces_detected": 0  # Will be updated when face detection is implemented
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
        # Check if laptop camera already exists
        laptop_camera = Camera.query.filter_by(name='Laptop Camera').first()
        
        if not laptop_camera:
            laptop_camera = Camera(
                name='Laptop Camera',
                location='Live Monitoring',
                rtsp_url='webcam://0',
                status='online',
                is_active=True
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
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        if video_file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        # Generate unique filename using local time
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'recording_{timestamp}.webm'
        
        # Use user-specific recordings directory
        recordings_dir = get_recordings_dir(username)
        
        # Create user directory if it doesn't exist
        if not os.path.exists(recordings_dir):
            os.makedirs(recordings_dir)
        
        filepath = os.path.join(recordings_dir, filename)
        
        # Save video file
        video_file.save(filepath)
        
        # Log the recording
        log = SystemLog(
            event_type='video_recorded',
            description=f'Video recording saved for user {username}: {filename} (Duration: {duration}s)',
            severity='info',
            created_at=datetime.now()
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

# Get all recordings
@app.route('/api/recordings')
def get_recordings():
    try:
        # Get username from query parameter
        username = request.args.get('username')
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        # Use user-specific recordings directory
        recordings_dir = get_recordings_dir(username)
        
        if not os.path.exists(recordings_dir):
            os.makedirs(recordings_dir)
            return jsonify({"recordings": [], "total": 0, "totalSizeMB": 0})
        
        recordings = []
        for filename in os.listdir(recordings_dir):
            if filename.endswith('.webm') or filename.endswith('.mp4'):
                filepath = os.path.join(recordings_dir, filename)
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
                
                recordings.append({
                    "filename": filename,
                    "size": stats.st_size,
                    "sizeMB": round(stats.st_size / (1024 * 1024), 2),
                    "created": formatted_time,
                    "timestamp": stats.st_mtime
                })
        
        # Sort by newest first
        recordings.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            "recordings": recordings,
            "total": len(recordings),
            "totalSizeMB": round(sum(r['size'] for r in recordings) / (1024 * 1024), 2)
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
        recordings_dir = get_recordings_dir(username)
        
        if not os.path.exists(recordings_dir):
            print("[WARNING] No recordings directory found")
            return jsonify({"success": True, "message": "No recordings to delete", "deleted": 0, "failed": 0})
        
        deleted_count = 0
        failed_count = 0
        errors = []
        
        for filename in os.listdir(recordings_dir):
            if filename.endswith('.webm') or filename.endswith('.mp4'):
                filepath = os.path.join(recordings_dir, filename)
                try:
                    os.remove(filepath)
                    deleted_count += 1
                    print(f"[SUCCESS] Deleted: {filename}")
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
        # Get username from query parameter
        username = request.args.get('username')
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        # Use user-specific recordings directory
        recordings_dir = get_recordings_dir(username)
        filepath = os.path.join(recordings_dir, filename)
        
        if os.path.exists(filepath):
            return send_file(filepath, mimetype='video/webm')
        else:
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
        
        if not username:
            return jsonify({"error": "Username is required"}), 400
        
        print(f"Attempting to delete recording: {filename} for user: {username}")
        recordings_dir = get_recordings_dir(username)
        filepath = os.path.join(recordings_dir, filename)
        
        print(f"Recordings directory: {recordings_dir}")
        print(f"Full filepath: {filepath}")
        print(f"File exists: {os.path.exists(filepath)}")
        
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
        else:
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
