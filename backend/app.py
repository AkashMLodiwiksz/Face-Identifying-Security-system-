from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
from models import db, User
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

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

# Camera endpoints
@app.route('/api/cameras')
def get_cameras():
    return jsonify(cameras_data)

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

# Detection events
@app.route('/api/detections')
def get_detections():
    return jsonify([
        {
            "id": 1,
            "cameraId": 1,
            "type": "person",
            "confidence": 0.98,
            "timestamp": "2025-10-05 18:45:12"
        }
    ])

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
