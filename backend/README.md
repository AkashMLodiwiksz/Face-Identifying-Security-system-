# Backend - Face Recognition Security System

Flask-based REST API backend with PostgreSQL database.

## 📁 Structure

```
backend/
├── app.py              # Main Flask application
├── models.py           # SQLAlchemy database models
├── requirements.txt    # Python dependencies
├── .env               # Environment variables (not in git)
└── README.md          # This file
```

## 🛠️ Technologies

- **Flask 3.1.2** - Web framework
- **Flask-SQLAlchemy** - ORM
- **Flask-Migrate** - Database migrations
- **Flask-CORS** - Cross-origin resource sharing
- **PostgreSQL** - Database
- **psycopg2-binary** - PostgreSQL adapter
- **python-dotenv** - Environment configuration

## 🚀 Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/face_recognition_db
SECRET_KEY=your-secret-key-here
```

### 3. Create Database

```sql
CREATE DATABASE face_recognition_db;
```

### 4. Run Application

```bash
python app.py
```

Server runs on: http://localhost:5000

## 📊 Database Models

### Users
- System administrators and operators
- Password hashing with werkzeug
- Role-based access control

### Authorized Persons
- Registered personnel database
- Employee information
- Photo storage paths

### Face Encodings
- 128-dimensional face vectors
- Multiple encodings per person
- Model versioning (FaceNet, VGGFace, etc.)

### Cameras
- Camera configurations
- RTSP stream URLs
- PTZ support
- Status monitoring

### Detection Events
- All face/object detections
- Bounding box coordinates
- Confidence scores
- Image paths

### Intruders
- Unknown persons database
- Appearance tracking
- Threat level assessment

### Alerts
- Security notifications
- Severity levels
- Acknowledgment tracking

### System Logs
- Activity tracking
- Audit trail

### System Settings
- Configuration storage

## 🔌 API Endpoints (To be implemented)

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Cameras
```
GET    /api/cameras
POST   /api/cameras
PUT    /api/cameras/:id
DELETE /api/cameras/:id
```

### Authorized Persons
```
GET    /api/persons
POST   /api/persons
PUT    /api/persons/:id
DELETE /api/persons/:id
POST   /api/persons/:id/train
```

### Detections
```
GET /api/detections
GET /api/detections/:id
```

### Intruders
```
GET    /api/intruders
GET    /api/intruders/:id
PUT    /api/intruders/:id
DELETE /api/intruders/:id
```

### Alerts
```
GET  /api/alerts
POST /api/alerts/:id/acknowledge
```

## 🔐 Default Credentials

- **Username:** `1`
- **Password:** `1`
- **Role:** admin

(Change in production!)

## 🐛 Development

### Database Migrations

```bash
# Initialize migrations
flask db init

# Create migration
flask db migrate -m "Description"

# Apply migration
flask db upgrade
```

### Debug Mode

Set in app.py:
```python
app.run(debug=True, port=5000)
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| SECRET_KEY | Flask secret key | dev-secret-key |
| UPLOAD_FOLDER | File upload directory | ./uploads |
| MAX_CONTENT_LENGTH | Max upload size (bytes) | 16777216 |
| DEFAULT_CAMERA_FPS | Camera frame rate | 30 |

## 🧪 Testing

```bash
pytest
```

## 📦 Deployment

Use production WSGI server:

```bash
pip install gunicorn
gunicorn app:app
```

## 🔒 Security Notes

- Never commit `.env` file
- Change default admin password
- Use strong SECRET_KEY in production
- Enable HTTPS in production
- Implement rate limiting
- Add input validation
- Use parameterized queries (SQLAlchemy handles this)
