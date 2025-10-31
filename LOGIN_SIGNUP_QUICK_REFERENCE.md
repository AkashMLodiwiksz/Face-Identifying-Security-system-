# 🚀 Quick Reference - Login & Signup

## 📍 Routes

| Route     | Component | Access | Description                |
|-----------|-----------|--------|----------------------------|
| `/login`  | Login     | Public | User authentication page   |
| `/signup` | Signup    | Public | New account registration   |

## 🔌 API Endpoints

### POST `/api/auth/signup`
Create a new user account.

**Request:**
```json
{
  "username": "string",
  "email": "string", 
  "password": "string",
  "role": "user|viewer"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Errors:**
- `400` - Missing/invalid fields
- `403` - Admin role restricted
- `409` - Username/email exists
- `500` - Server error

### POST `/api/auth/login`
Authenticate existing user.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "token-1-1234567890",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid credentials/disabled account
- `500` - Server error

## 🎨 Components

### Signup Component
**Location:** `frontend-react/src/pages/Signup.jsx`

**Key Features:**
- Form validation
- Password strength meter
- Password visibility toggles
- Role selection
- Error handling
- Loading states

**State:**
```javascript
const [formData, setFormData] = useState({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user'
});
```

### Login Component
**Location:** `frontend-react/src/pages/Login.jsx`

**Key Features:**
- Authentication form
- Remember me option
- Auto-start recording
- Error handling
- Link to signup

**State:**
```javascript
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [rememberMe, setRememberMe] = useState(false);
```

## 🔐 Validation Rules

| Field            | Rule                          | Error Message                          |
|------------------|-------------------------------|----------------------------------------|
| Username         | Min 3 characters              | "Username must be at least 3..."       |
| Email            | Valid email format            | "Please enter a valid email address"   |
| Password         | Min 6 characters              | "Password must be at least 6..."       |
| Confirm Password | Must match password           | "Passwords do not match"               |
| Role             | user, viewer, or admin        | "Admin accounts require approval"      |

## 🎯 Password Strength Scoring

```javascript
let score = 0;
if (password.length >= 8) score++;      // +1 for length
if (password.length >= 12) score++;     // +1 for extra length
if (/[a-z].*[A-Z]|[A-Z].*[a-z]/) score++; // +1 for mixed case
if (/\d/) score++;                       // +1 for digits
if (/[^a-zA-Z0-9]/) score++;            // +1 for special chars

// Score 0-1: Weak
// Score 2-3: Medium  
// Score 4: Strong
// Score 5: Very Strong
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

### System Logs Table
```sql
CREATE TABLE system_logs (
  id INTEGER PRIMARY KEY,
  event_type VARCHAR(50),
  severity VARCHAR(20),
  message TEXT,
  user_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Helper Functions

### Backend (Python)

**Hash Password:**
```python
from werkzeug.security import generate_password_hash

user.set_password(password)
# Stores: pbkdf2:sha256:...
```

**Verify Password:**
```python
from werkzeug.security import check_password_hash

user.check_password(password)
# Returns: True/False
```

### Frontend (JavaScript)

**Check Password Strength:**
```javascript
const checkPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  return { score, feedback: getFeedback(score) };
};
```

**Validate Email:**
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValid = emailRegex.test(email);
```

## 🎨 Styling Classes

### Form Input
```jsx
className="w-full px-4 py-3 border border-gray-300 rounded-lg 
           focus:ring-2 focus:ring-primary focus:border-transparent 
           text-gray-900 placeholder-gray-400"
```

### Submit Button
```jsx
className="w-full bg-gradient-primary text-white py-3 px-6 
           rounded-lg font-semibold hover:opacity-90 
           transition-all duration-200 flex items-center 
           justify-center disabled:opacity-50 
           disabled:cursor-not-allowed"
```

### Error Message
```jsx
className="bg-red-50 border border-red-200 text-red-700 
           px-4 py-3 rounded-lg text-sm"
```

## 📦 Icons Used

```javascript
import { 
  UserPlus,    // Signup button
  LogIn,       // Login button
  Shield,      // Logo
  Camera,      // Features
  Users,       // Features
  Bell,        // Features
  Eye,         // Show password
  EyeOff       // Hide password
} from 'lucide-react';
```

## 🔄 User Flow Diagram

```
┌─────────┐
│ Landing │
└────┬────┘
     │
     ├─────────► /login ──────► Dashboard
     │              │
     │              ▼
     └─────────► /signup ──────► /login ──────► Dashboard
```

## 🌐 API Service

**Location:** `frontend-react/src/services/api.js`

```javascript
import api from '../services/api';

// Signup
const response = await api.post('/auth/signup', {
  username, email, password, role
});

// Login
const response = await api.post('/auth/login', {
  username, password
});
```

## 🔑 Token Storage

### With "Remember Me"
```javascript
localStorage.setItem('authToken', token);
localStorage.setItem('username', username);
localStorage.setItem('userRole', role);
```

### Without "Remember Me"
```javascript
sessionStorage.setItem('authToken', token);
// Also set in localStorage for recording service
```

## 🎭 Loading States

```javascript
// Button disabled
disabled={loading}

// Loading spinner
{loading ? (
  <>
    <div className="animate-spin rounded-full h-5 w-5 
                    border-b-2 border-white mr-2"></div>
    Creating Account...
  </>
) : (
  <>
    <UserPlus className="w-5 h-5 mr-2" />
    Create Account
  </>
)}
```

## 🚨 Error Handling

```javascript
try {
  const response = await api.post('/auth/signup', data);
  // Success handling
} catch (err) {
  setError(
    err.response?.data?.message || 
    'Failed to create account. Please try again.'
  );
}
```

## 🔍 Testing Commands

**Test Backend:**
```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@ex.com","password":"pass123","role":"user"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass123"}'
```

**Check Database:**
```sql
SELECT * FROM users;
SELECT * FROM system_logs WHERE event_type = 'user_created';
```

## 📱 Responsive Breakpoints

```css
/* Mobile */
< 768px: Stack vertically

/* Tablet/Desktop */
≥ 768px: Side-by-side layout (md:flex-row)
```

## ⚡ Performance Tips

1. **Debounce password strength check** (optional)
2. **Lazy load components** for faster initial load
3. **Memoize validation functions** to prevent re-renders
4. **Use form libraries** like Formik or React Hook Form (optional)

## 🛠️ Common Customizations

### Change Password Requirements
**File:** `backend/app.py` line ~197
```python
if len(password) < 8:  # Change minimum length
```

### Change Password Strength Levels
**File:** `frontend-react/src/pages/Signup.jsx` line ~28
```javascript
if (password.length >= 10) score++;  // Adjust thresholds
```

### Add New Role
**File:** `backend/app.py` line ~220
```python
if role not in ['user', 'viewer', 'manager']:  # Add 'manager'
```

---

**Version:** 1.0.0  
**Last Updated:** October 29, 2025  
**Quick Access:** [Testing Guide](LOGIN_SIGNUP_TESTING_GUIDE.md) | [Implementation Details](LOGIN_SIGNUP_IMPLEMENTATION.md)
