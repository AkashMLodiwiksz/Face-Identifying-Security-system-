# 🧪 Login & Signup Testing Guide

## Quick Start Testing

### 1️⃣ Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```
Server should start at: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend-react
npm run dev
```
Server should start at: `http://localhost:5173`

### 2️⃣ Open Browser
Navigate to: `http://localhost:5173`

---

## 🔍 Test Cases

### ✅ Signup Page Tests

#### Test 1: Successful Account Creation
**Steps:**
1. Navigate to `/signup` or click "Create Account" from login page
2. Fill in the form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
   - Role: `User`
3. Click "Create Account"

**Expected Result:**
- ✅ Success message: "Account created successfully!"
- ✅ Redirected to login page
- ✅ New user appears in database

#### Test 2: Password Strength Indicator
**Steps:**
1. Go to signup page
2. Type different passwords in password field:
   - `abc` → Should show "Weak" (red)
   - `password123` → Should show "Medium" (orange/yellow)
   - `SecurePass123!` → Should show "Strong/Very Strong" (green)

**Expected Result:**
- ✅ Bar color changes dynamically
- ✅ Text updates with strength level
- ✅ Bar width increases with strength

#### Test 3: Password Visibility Toggle
**Steps:**
1. Enter password: `myPassword123`
2. Click the eye icon next to password field
3. Click again to hide

**Expected Result:**
- ✅ Password becomes visible as plain text
- ✅ Icon changes from Eye to EyeOff
- ✅ Same for confirm password field

#### Test 4: Form Validation - Username
**Steps:**
1. Try submitting with username: `ab` (too short)

**Expected Result:**
- ❌ Error: "Username must be at least 3 characters long"
- ❌ Form not submitted

#### Test 5: Form Validation - Email
**Steps:**
1. Try submitting with email: `notanemail`

**Expected Result:**
- ❌ Error: "Please enter a valid email address"
- ❌ Form not submitted

#### Test 6: Form Validation - Password Length
**Steps:**
1. Try submitting with password: `12345`

**Expected Result:**
- ❌ Error: "Password must be at least 6 characters long"
- ❌ Form not submitted

#### Test 7: Form Validation - Password Mismatch
**Steps:**
1. Password: `SecurePass123`
2. Confirm Password: `SecurePass456`
3. Click "Create Account"

**Expected Result:**
- ❌ Error: "Passwords do not match"
- ❌ Form not submitted

#### Test 8: Duplicate Username
**Steps:**
1. Create account with username: `testuser`
2. Try creating another account with same username

**Expected Result:**
- ❌ Error: "Username already exists"
- ❌ Status code: 409

#### Test 9: Duplicate Email
**Steps:**
1. Create account with email: `test@example.com`
2. Try creating another account with same email

**Expected Result:**
- ❌ Error: "Email already registered"
- ❌ Status code: 409

#### Test 10: Admin Role Restriction
**Steps:**
1. Try to manually set role to "admin" (via browser dev tools)
2. Submit form

**Expected Result:**
- ❌ Error: "Admin accounts require approval"
- ❌ Status code: 403

---

### ✅ Login Page Tests

#### Test 11: Login with New Account
**Steps:**
1. Create account via signup
2. Go to login page
3. Enter credentials
4. Click "Sign In"

**Expected Result:**
- ✅ Successfully logged in
- ✅ Redirected to dashboard
- ✅ Background recording starts

#### Test 12: Invalid Credentials
**Steps:**
1. Try logging in with wrong password

**Expected Result:**
- ❌ Error: "Invalid username or password"
- ❌ Stay on login page

#### Test 13: Remember Me Functionality
**Steps:**
1. Login with "Remember me" checked
2. Close browser
3. Reopen and navigate to app

**Expected Result:**
- ✅ Still logged in (token in localStorage)

#### Test 14: Session-Only Login
**Steps:**
1. Login without "Remember me" checked
2. Close browser
3. Reopen and navigate to app

**Expected Result:**
- ✅ Need to login again (token in sessionStorage)

---

### ✅ Navigation Tests

#### Test 15: Login to Signup
**Steps:**
1. On login page, click "Create Account"

**Expected Result:**
- ✅ Navigates to `/signup`

#### Test 16: Signup to Login
**Steps:**
1. On signup page, click "Sign In" link

**Expected Result:**
- ✅ Navigates to `/login`

#### Test 17: Direct URL Access
**Steps:**
1. Type `http://localhost:5173/signup` in browser

**Expected Result:**
- ✅ Loads signup page directly

---

### ✅ Responsive Design Tests

#### Test 18: Mobile View
**Steps:**
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone or Android device
4. Navigate through login and signup pages

**Expected Result:**
- ✅ Forms stack vertically
- ✅ Branding section appears above form
- ✅ All elements readable and clickable
- ✅ No horizontal scrolling

#### Test 19: Tablet View
**Steps:**
1. Set viewport to iPad dimensions (768px)

**Expected Result:**
- ✅ Layout adapts appropriately
- ✅ Good spacing and readability

---

### ✅ Backend API Tests

#### Test 20: API - Signup Endpoint
**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apitest",
    "email": "apitest@example.com",
    "password": "TestPass123",
    "role": "user"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 2,
    "username": "apitest",
    "email": "apitest@example.com",
    "role": "user"
  }
}
```

#### Test 21: API - Login Endpoint
**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apitest",
    "password": "TestPass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "token-2-1730188800.123",
  "user": {
    "id": 2,
    "username": "apitest",
    "email": "apitest@example.com",
    "role": "user"
  }
}
```

---

### ✅ Database Tests

#### Test 22: Verify User in Database
**Steps:**
1. Create a new account
2. Check database (use database viewer or SQL query)

**SQL Query:**
```sql
SELECT * FROM users WHERE username = 'testuser';
```

**Expected Result:**
- ✅ User record exists
- ✅ Password is hashed (not plain text)
- ✅ Email is stored correctly
- ✅ Role is set correctly
- ✅ `is_active` is true
- ✅ `created_at` timestamp is set

#### Test 23: Verify System Log
**SQL Query:**
```sql
SELECT * FROM system_logs WHERE event_type = 'user_created' ORDER BY timestamp DESC LIMIT 5;
```

**Expected Result:**
- ✅ Log entry created for new user
- ✅ Severity is 'info'
- ✅ Message includes username

---

### ✅ Security Tests

#### Test 24: SQL Injection Prevention
**Steps:**
1. Try signup with username: `admin' OR '1'='1`

**Expected Result:**
- ✅ Treated as literal string
- ✅ No database breach

#### Test 25: XSS Prevention
**Steps:**
1. Try signup with username: `<script>alert('XSS')</script>`

**Expected Result:**
- ✅ Script not executed
- ✅ Stored as plain text

#### Test 26: Password Hashing
**Steps:**
1. Create account
2. Check database password_hash field

**Expected Result:**
- ✅ Password is hashed (starts with method like `pbkdf2:sha256`)
- ✅ Original password not visible

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Symptom:** Console shows CORS policy error
**Solution:** 
```python
# backend/app.py should have:
CORS(app)
```

### Issue 2: 404 on API Calls
**Symptom:** API calls return 404
**Solution:** Check backend is running on port 5000

### Issue 3: Database Error
**Symptom:** "Table doesn't exist"
**Solution:** 
```bash
cd backend
python reset_database.py
```

### Issue 4: Form Not Submitting
**Symptom:** Button click does nothing
**Solution:** Check browser console for JavaScript errors

### Issue 5: Redirect Not Working
**Symptom:** Stay on signup after success
**Solution:** Check React Router is properly configured

---

## 📊 Testing Checklist

Print this and check off as you test:

**Signup Form:**
- [ ] Page loads without errors
- [ ] All fields render correctly
- [ ] Username validation works
- [ ] Email validation works
- [ ] Password validation works
- [ ] Confirm password validation works
- [ ] Password strength meter updates
- [ ] Password visibility toggles work
- [ ] Role selection works
- [ ] Submit button shows loading state
- [ ] Success redirects to login
- [ ] Error messages display correctly
- [ ] Duplicate username prevented
- [ ] Duplicate email prevented
- [ ] Admin role restricted

**Login Form:**
- [ ] Can login with new account
- [ ] "Create Account" link works
- [ ] Invalid credentials rejected
- [ ] Remember me works
- [ ] Session-only works

**Responsive:**
- [ ] Works on mobile (< 768px)
- [ ] Works on tablet (768-1024px)
- [ ] Works on desktop (> 1024px)

**Backend:**
- [ ] Signup endpoint works
- [ ] Login endpoint works
- [ ] Database records created
- [ ] System logs created
- [ ] Password hashing works

**Security:**
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] Passwords hashed
- [ ] Admin creation blocked

---

## 🎯 Quick Smoke Test (5 minutes)

1. ✅ Start backend and frontend
2. ✅ Go to `/signup`
3. ✅ Create account with valid data
4. ✅ Verify redirect to login
5. ✅ Login with new account
6. ✅ Verify dashboard loads

If all above pass, basic functionality is working! ✨

---

**Last Updated:** October 29, 2025
**Test Coverage:** Frontend + Backend + Database
