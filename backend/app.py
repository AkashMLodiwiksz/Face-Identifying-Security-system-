from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from datetime import datetime
from models import db, User, Camera, DetectionEvent, SystemLog
from dotenv import load_dotenv
import os
import base64
import subprocess
from io import BytesIO

# Load environment variables
load_dotenv()

# Helper function to get recordings directory
def get_recordings_dir():
    """Get the recordings directory path using the current user's Videos folder"""
    user_profile = os.environ.get('USERPROFILE')  # e.g., C:\Users\YourActualUsername
    return os.path.join(user_profile, 'Videos', 'recordings')

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
    {"id": 1, "name": "Front Entrance", "status": "online", "fps": 30, "location": "Building A"},
    {"id": 2, "name": "Back Door", "status": "online", "fps": 30, "location": "Building A"},
    {"id": 3, "name": "Parking Lot", "status": "online", "fps": 25, "location": "Outdoor"},
    {"id": 4, "name": "Reception Area", "status": "online", "fps": 30, "location": "Building B"},
    {"id": 5, "name": "Hallway", "status": "online", "fps": 30, "location": "Building B"},
    {"id": 6, "name": "Server Room", "status": "offline", "fps": 0, "location": "Building C"},
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

# Camera endpoints (legacy - keeping for backward compatibility)
@app.route('/api/cameras/<int:camera_id>')
def get_camera(camera_id):
    camera = next((c for c in cameras_data if c['id'] == camera_id), None)
    if camera:
        return jsonify(camera)
    return jsonify({"error": "Camera not found"}), 404

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

# Get camera info
@app.route('/api/cameras')
def get_cameras():
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
        
        # Find laptop camera
        laptop_camera = Camera.query.filter_by(name='Laptop Camera').first()
        
        if not laptop_camera:
            return jsonify({"error": "Laptop camera not found"}), 404
        
        # Update status
        laptop_camera.status = status
        laptop_camera.is_active = (status == 'online')
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Camera status updated to {status}",
            "cameraId": laptop_camera.id,
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
        
        if video_file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        # Generate unique filename
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f'recording_{timestamp}.webm'
        
        # Use recordings directory in user's Videos folder
        recordings_dir = get_recordings_dir()
        filepath = os.path.join(recordings_dir, filename)
        
        # Save video file
        video_file.save(filepath)
        
        # Log the recording
        log = SystemLog(
            event_type='video_recorded',
            description=f'Video recording saved: {filename} (Duration: {duration}s)',
            severity='info',
            created_at=datetime.utcnow()
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
    # Use environment variable to get actual user's Videos folder
    user_profile = os.environ.get('USERPROFILE')  # e.g., C:\Users\YourActualUsername
    abs_path = os.path.join(user_profile, 'Videos', 'recordings')
    
    print("=" * 60)
    print("[OPEN FOLDER] Request received")
    print(f"[OPEN FOLDER] User Profile: {user_profile}")
    print(f"[OPEN FOLDER] Opening: {abs_path}")
    print("=" * 60)
    
    # Create directory if it doesn't exist (handle read-only parent folder)
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

# Get all recordings
@app.route('/api/recordings')
def get_recordings():
    try:
        # Use recordings directory in user's Videos folder
        recordings_dir = get_recordings_dir()
        
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
                    file_time = datetime.strptime(timestamp_str, '%Y%m%d_%H%M%S')
                    formatted_time = file_time.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    formatted_time = datetime.fromtimestamp(stats.st_ctime).strftime('%Y-%m-%d %H:%M:%S')
                
                recordings.append({
                    "filename": filename,
                    "size": stats.st_size,
                    "sizeMB": round(stats.st_size / (1024 * 1024), 2),
                    "created": formatted_time,
                    "timestamp": stats.st_ctime
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
        print("[FORMAT] Formatting all recordings...")
        # Use recordings directory in user's Videos folder
        recordings_dir = get_recordings_dir()
        
        if not os.path.exists(recordings_dir):
            print("[WARNING] No recordings directory found")
            return jsonify({"success": True, "message": "No recordings to delete", "deleted": 0})
        
        deleted_count = 0
        failed_count = 0
        errors = []
        
        for filename in os.listdir(recordings_dir):
            if filename.endswith('.webm') or filename.endswith('.mp4'):
                filepath = os.path.join(recordings_dir, filename)
                try:
                    os.remove(filepath)
                    deleted_count += 1
                    print(f"✅ Deleted: {filename}")
                except PermissionError as pe:
                    failed_count += 1
                    error_msg = f"Permission denied: {filename}"
                    errors.append(error_msg)
                    print(f"❌ {error_msg}")
                except Exception as e:
                    failed_count += 1
                    error_msg = f"Error deleting {filename}: {str(e)}"
                    errors.append(error_msg)
                    print(f"❌ {error_msg}")
        
        # Log the format action
        log = SystemLog(
            event_type='recordings_formatted',
            description=f'Recordings deleted: {deleted_count} files, Failed: {failed_count}',
            severity='warning',
            created_at=datetime.utcnow()
        )
        db.session.add(log)
        db.session.commit()
        
        message = f"Deleted {deleted_count} recording(s)"
        if failed_count > 0:
            message += f" ({failed_count} failed - files may be in use)"
        
        print(f"✅ Format complete: {message}")
        
        return jsonify({
            "success": True,
            "message": message,
            "deleted": deleted_count,
            "failed": failed_count,
            "errors": errors
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error formatting recordings: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Serve recording video
@app.route('/api/recordings/<filename>')
def serve_recording(filename):
    try:
        # Use recordings directory in user's Videos folder
        recordings_dir = get_recordings_dir()
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
        print(f"Attempting to delete recording: {filename}")
        # Use recordings directory in user's Videos folder
        recordings_dir = get_recordings_dir()
        filepath = os.path.join(recordings_dir, filename)
        
        print(f"Recordings directory: {recordings_dir}")
        print(f"Full filepath: {filepath}")
        print(f"File exists: {os.path.exists(filepath)}")
        
        if os.path.exists(filepath):
            # Check if file is locked by another process
            try:
                os.remove(filepath)
                print(f"✅ Successfully deleted: {filename}")
            except PermissionError as pe:
                print(f"❌ Permission error deleting file: {pe}")
                return jsonify({"error": "File is in use or permission denied"}), 403
            
            # Log the deletion
            log = SystemLog(
                event_type='video_deleted',
                description=f'Video recording deleted: {filename}',
                severity='info',
                created_at=datetime.utcnow()
            )
            db.session.add(log)
            db.session.commit()
            
            return jsonify({"success": True, "message": "Recording deleted successfully"})
        else:
            print(f"❌ Video not found: {filename}")
            return jsonify({"error": "Video not found"}), 404
            
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting recording: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
