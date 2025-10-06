# 🔐 Face Recognition Security System

A modern, full-stack AI-powered security system with real-time face recognition, intruder detection, and comprehensive monitoring capabilities.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)
![Flask](https://img.shields.io/badge/Flask-3.1.2-black.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.0-336791.svg)

## 🌟 Features

### Core AI/ML Capabilities
- **Real-time Face Recognition** - Identify authorized personnel instantly
- **Intruder Detection** - Automatic detection and tracking of unknown persons
- **Object Detection** - YOLO-based object and person detection
- **Animal Detection** - Specialized detection for wildlife/pets
- **PTZ Camera Control** - Automated camera tracking

### System Features
- **Multi-Camera Support** - Manage multiple IP cameras with RTSP streaming
- **Live Monitoring Dashboard** - Real-time video feeds and alerts
- **Intruder Database** - Track and analyze unauthorized access attempts
- **Alert System** - Instant notifications for security events
- **Personnel Management** - Add/remove authorized persons with face registration
- **Detection History** - Comprehensive logs of all detection events
- **Camera Configuration** - Easy setup and management of cameras
- **System Health Monitoring** - CPU, memory, storage, and network monitoring

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - Modern UI library
- **Vite 5.4.8** - Lightning-fast build tool
- **Tailwind CSS 3.x** - Utility-first styling
- **React Router 6.26.2** - Client-side routing
- **Axios 1.7.7** - HTTP client
- **Chart.js 4.4.4** - Data visualization
- **Lucide React** - Beautiful icons

### Backend
- **Flask 3.1.2** - Python web framework
- **SQLAlchemy 2.0** - Database ORM
- **PostgreSQL 18.0** - Production database
- **Flask-Migrate** - Database migrations
- **psycopg2** - PostgreSQL adapter

### AI/ML Models (Planned)
- **FaceNet** - Face recognition embeddings
- **MTCNN** - Face detection
- **YOLO v8/v9** - Object detection
- **Custom Models** - Animal detection

## 📋 Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.9+
- **PostgreSQL** 18.0+
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/AkashMLodiwiksz/Face-Identifying-Security-system-.git
cd Face-Identifying-Security-system-
```

### 2. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install-all
```

Or install separately:

```bash
# Frontend
cd frontend-react
npm install

# Backend
cd ../backend
pip install -r requirements.txt
```

### 3. Configure Database

Create a PostgreSQL database:

```sql
CREATE DATABASE face_recognition_db;
```

Update `backend/.env` with your credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/face_recognition_db
SECRET_KEY=your-secret-key-here
```

### 4. Run the Application

**Single Command (Recommended):**

```bash
npm run dev
```

This starts both frontend and backend concurrently:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

**Or run separately:**

```bash
# Terminal 1 - Frontend
npm run frontend

# Terminal 2 - Backend
npm run backend
```

### 5. Login

- **Username:** `1`
- **Password:** `1`

(Default admin account created automatically)

## 📁 Project Structure

```
Face-Identifying-Security-system-/
├── frontend-react/          # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
│
├── backend/                # Flask backend application
│   ├── app.py             # Main Flask application
│   ├── models.py          # Database models
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
│
├── package.json           # Root package (concurrently scripts)
└── README.md             # This file
```

## 🗄️ Database Schema

The system uses PostgreSQL with 11 tables:

1. **users** - System administrators and operators
2. **authorized_persons** - Registered personnel
3. **face_encodings** - Face recognition data (128-dim vectors)
4. **cameras** - Camera configurations
5. **detection_events** - All detection events
6. **intruders** - Unknown persons database
7. **intruder_appearances** - Individual intruder sightings
8. **intruder_face_encodings** - Face data for intruders
9. **alerts** - Security alerts
10. **system_logs** - Activity logs
11. **system_settings** - Configuration

## 🔧 Development

### Available Scripts

```bash
npm run dev           # Run both frontend and backend
npm run frontend      # Run frontend only
npm run backend       # Run backend only
npm run build         # Build frontend for production
npm run install-all   # Install all dependencies
```

### Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/face_recognition_db

# Security
SECRET_KEY=your-secret-key-change-in-production

# Upload Configuration
UPLOAD_FOLDER=./uploads
MAX_CONTENT_LENGTH=16777216

# Camera Settings
DEFAULT_CAMERA_FPS=30
DETECTION_CONFIDENCE_THRESHOLD=0.7

# AI Model Paths
FACE_DETECTION_MODEL=models/mtcnn
FACE_RECOGNITION_MODEL=models/facenet
OBJECT_DETECTION_MODEL=models/yolov8
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Akash M Lodiwiks**
- GitHub: [@AkashMLodiwiksz](https://github.com/AkashMLodiwiksz)

## 🙏 Acknowledgments

- React Team for the amazing framework
- Flask community for the lightweight backend
- Tailwind CSS for the styling utilities
- PostgreSQL for reliable database

## 🗺️ Roadmap

- [x] Basic authentication system
- [x] Database setup and models
- [x] Frontend UI with React + Tailwind
- [x] Dashboard with real-time stats
- [ ] Face detection integration
- [ ] Face recognition implementation
- [ ] Camera RTSP streaming
- [ ] Real-time alerts
- [ ] Mobile app (React Native)
- [ ] Cloud deployment

---

⭐ **Star this repository if you find it helpful!**
