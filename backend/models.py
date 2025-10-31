"""
Database Models for Face Recognition Security System
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    """System users (admin, security personnel)"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # admin, user, viewer
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class AuthorizedPerson(db.Model):
    """Authorized personnel in the system"""
    __tablename__ = 'authorized_persons'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    employee_id = db.Column(db.String(50), unique=True)
    department = db.Column(db.String(100))
    designation = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    is_active = db.Column(db.Boolean, default=True)
    photo_path = db.Column(db.String(255))  # Path to photo file
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    face_encodings = db.relationship('FaceEncoding', backref='authorized_person', lazy=True, cascade='all, delete-orphan')


class FaceEncoding(db.Model):
    """Face encodings for authorized persons (128-dimensional vectors)"""
    __tablename__ = 'face_encodings'
    
    id = db.Column(db.Integer, primary_key=True)
    person_id = db.Column(db.Integer, db.ForeignKey('authorized_persons.id'), nullable=False)
    encoding = db.Column(db.LargeBinary, nullable=False)  # Stored as binary (numpy array)
    encoding_model = db.Column(db.String(50), default='FaceNet')  # FaceNet, VGGFace, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Camera(db.Model):
    """Camera configurations"""
    __tablename__ = 'cameras'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200))
    rtsp_url = db.Column(db.String(500))
    camera_type = db.Column(db.String(20), default='IP')  # IP, USB, PTZ, CCTV
    status = db.Column(db.String(20), default='offline')  # online, offline
    is_active = db.Column(db.Boolean, default=True)
    is_ptz = db.Column(db.Boolean, default=False)
    fps = db.Column(db.Integer, default=30)
    resolution = db.Column(db.String(20), default='1920x1080')
    username = db.Column(db.String(80), nullable=False)  # User who owns this camera
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    detections = db.relationship('DetectionEvent', backref='camera', lazy=True)


class DetectionEvent(db.Model):
    """Face/object detection events"""
    __tablename__ = 'detection_events'
    
    id = db.Column(db.Integer, primary_key=True)
    camera_id = db.Column(db.Integer, db.ForeignKey('cameras.id'), nullable=False)
    person_id = db.Column(db.Integer, db.ForeignKey('authorized_persons.id'))  # Null if intruder
    detection_type = db.Column(db.String(20), nullable=False)  # face, person, object, animal
    is_authorized = db.Column(db.Boolean, default=False)
    confidence = db.Column(db.Float)  # Detection confidence score
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    image_path = db.Column(db.String(255))  # Path to captured image
    bounding_box = db.Column(db.JSON)  # {x, y, width, height}
    
    # Relationships
    alert = db.relationship('Alert', backref='detection', uselist=False, cascade='all, delete-orphan')


class Intruder(db.Model):
    """Intruder database (unknown persons)"""
    __tablename__ = 'intruders'
    
    id = db.Column(db.Integer, primary_key=True)
    first_seen = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    appearance_count = db.Column(db.Integer, default=1)
    threat_level = db.Column(db.String(20), default='low')  # low, medium, high
    notes = db.Column(db.Text)
    
    # Relationships
    appearances = db.relationship('IntruderAppearance', backref='intruder', lazy=True, cascade='all, delete-orphan')
    face_encodings = db.relationship('IntruderFaceEncoding', backref='intruder', lazy=True, cascade='all, delete-orphan')


class IntruderAppearance(db.Model):
    """Individual intruder appearances"""
    __tablename__ = 'intruder_appearances'
    
    id = db.Column(db.Integer, primary_key=True)
    intruder_id = db.Column(db.Integer, db.ForeignKey('intruders.id'), nullable=False)
    detection_event_id = db.Column(db.Integer, db.ForeignKey('detection_events.id'))
    camera_id = db.Column(db.Integer, db.ForeignKey('cameras.id'))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    image_path = db.Column(db.String(255))
    confidence = db.Column(db.Float)


class IntruderFaceEncoding(db.Model):
    """Face encodings for intruders"""
    __tablename__ = 'intruder_face_encodings'
    
    id = db.Column(db.Integer, primary_key=True)
    intruder_id = db.Column(db.Integer, db.ForeignKey('intruders.id'), nullable=False)
    encoding = db.Column(db.LargeBinary, nullable=False)
    encoding_model = db.Column(db.String(50), default='FaceNet')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Alert(db.Model):
    """Security alerts"""
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    detection_event_id = db.Column(db.Integer, db.ForeignKey('detection_events.id'))
    alert_type = db.Column(db.String(50), nullable=False)  # intruder, suspicious_activity, etc.
    severity = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    message = db.Column(db.Text)
    is_acknowledged = db.Column(db.Boolean, default=False)
    acknowledged_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    acknowledged_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


class SystemLog(db.Model):
    """System activity logs"""
    __tablename__ = 'system_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(50))  # camera, user, person, etc.
    entity_id = db.Column(db.Integer)
    description = db.Column(db.Text)
    ip_address = db.Column(db.String(45))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)


class SystemSettings(db.Model):
    """System configuration settings"""
    __tablename__ = 'system_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False)
    setting_value = db.Column(db.Text)
    description = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
