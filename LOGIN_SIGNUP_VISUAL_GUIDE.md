# 🎨 Login & Signup Pages - Visual Guide

## 📸 Page Layouts

### Login Page (`/login`)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────┬──────────────────┐                      │
│  │                  │                  │                      │
│  │   🛡️ BRANDING   │   📝 LOGIN FORM  │                      │
│  │                  │                  │                      │
│  │  SecureVision AI │   Welcome Back   │                      │
│  │                  │                  │                      │
│  │  • Real-time     │   [Username]     │                      │
│  │    Monitoring    │   [Password]     │                      │
│  │                  │   □ Remember me  │                      │
│  │  • Intruder      │                  │                      │
│  │    Detection     │   [Sign In 🔐]   │                      │
│  │                  │                  │                      │
│  │  • Instant       │   Create Account →│                      │
│  │    Alerts        │                  │                      │
│  │                  │                  │                      │
│  └──────────────────┴──────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Signup Page (`/signup`)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────┬──────────────────┐                      │
│  │                  │                  │                      │
│  │   🛡️ BRANDING   │  📝 SIGNUP FORM  │                      │
│  │                  │                  │                      │
│  │  SecureVision AI │  Create Account  │                      │
│  │                  │                  │                      │
│  │  • Real-time     │   [Username]     │                      │
│  │    Monitoring    │   [Email]        │                      │
│  │                  │   [Password] 👁️  │                      │
│  │  • Intruder      │   ▓▓▓▓░░ Strong  │ ← Password Strength │
│  │    Detection     │   [Confirm] 👁️   │                      │
│  │                  │   [Role ▼]       │                      │
│  │  • Instant       │                  │                      │
│  │    Alerts        │   [Create 👤]    │                      │
│  │                  │                  │                      │
│  │                  │  ← Sign In       │                      │
│  └──────────────────┴──────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Color Scheme

### Gradients
- **Background**: `from-blue-900 via-purple-900 to-indigo-900`
- **Buttons**: `bg-gradient-primary` (blue to indigo)

### Password Strength Colors
| Strength      | Color      | Bar Width |
|--------------|------------|-----------|
| Weak         | 🔴 Red     | 20%       |
| Medium       | 🟠 Orange  | 40%       |
| Good         | 🟡 Yellow  | 60%       |
| Strong       | 🟢 Green   | 80%       |
| Very Strong  | 🟩 Emerald | 100%      |

### Form States
- **Default**: Gray border (`border-gray-300`)
- **Focus**: Primary ring (`ring-primary`)
- **Error**: Red background (`bg-red-50`)
- **Disabled**: Reduced opacity (`opacity-50`)

## 🔄 User Flow

```
┌─────────────┐
│   Landing   │
│    Page     │
└──────┬──────┘
       │
       ├───────────────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│   Login     │  │   Signup    │
│    Page     │◄─┤    Page     │
└──────┬──────┘  └─────────────┘
       │               │
       │               ├─► [Submit Form]
       │               │
       │               ├─► ❌ Error (stays on page)
       │               │
       │               └─► ✅ Success
       │                         │
       └─────────────────────────┘
                │
                ▼
         [Redirect to Login]
                │
                ▼
         [User Signs In]
                │
                ▼
         ┌─────────────┐
         │  Dashboard  │
         └─────────────┘
```

## 🎯 Interactive Elements

### Signup Form Features

1. **Username Input**
   - ✅ Min 3 characters validation
   - 🔄 Real-time character count (optional)
   - ⚠️ Shows error if duplicate

2. **Email Input**
   - ✅ Email format validation
   - 🔄 Real-time format check
   - ⚠️ Shows error if already registered

3. **Password Input**
   - 👁️ Toggle visibility button
   - 📊 Live strength indicator
   - ✅ Min 6 characters
   - 🎨 Color-coded bar
   - Checks: length, uppercase, lowercase, numbers, special chars

4. **Confirm Password**
   - 👁️ Separate toggle button
   - ✅ Match validation
   - ⚠️ Shows mismatch error

5. **Role Selection**
   - 📋 Dropdown menu
   - Options: User, Viewer
   - ℹ️ Info text about admin approval

6. **Submit Button**
   - 🔄 Loading spinner when processing
   - ❌ Disabled during submission
   - ✅ Success feedback

## 📱 Responsive Breakpoints

```
Mobile (< 768px)
┌──────────────┐
│  🛡️ BRANDING │
├──────────────┤
│ SIGNUP FORM  │
└──────────────┘

Tablet/Desktop (≥ 768px)
┌─────────────┬─────────────┐
│ 🛡️ BRANDING │ SIGNUP FORM │
└─────────────┴─────────────┘
```

## 🎭 States & Feedback

### Loading State
```
┌──────────────────────────┐
│  ⏳ Creating Account...  │
└──────────────────────────┘
```

### Success State
```
┌──────────────────────────────────┐
│  ✅ Account created successfully!│
│     Redirecting to login...      │
└──────────────────────────────────┘
```

### Error States
```
┌──────────────────────────────────┐
│  ⚠️ Username already exists      │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│  ⚠️ Passwords do not match       │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│  ⚠️ Please enter a valid email   │
└──────────────────────────────────┘
```

## 🔐 Security Visual Indicators

### Password Strength Meter
```
Weak:        ▓▓░░░░░░░░  (20%)  🔴
Medium:      ▓▓▓▓░░░░░░  (40%)  🟠
Good:        ▓▓▓▓▓▓░░░░  (60%)  🟡
Strong:      ▓▓▓▓▓▓▓▓░░  (80%)  🟢
Very Strong: ▓▓▓▓▓▓▓▓▓▓ (100%)  🟩
```

## 📋 Form Labels & Placeholders

| Field            | Label              | Placeholder                    |
|------------------|-------------------|--------------------------------|
| Username         | Username          | Choose a username              |
| Email            | Email Address     | your.email@example.com         |
| Password         | Password          | Create a strong password       |
| Confirm Password | Confirm Password  | Re-enter your password         |
| Role             | Account Type      | (dropdown)                     |

## ✨ Animation Effects

1. **Page Load**: Fade-in animation
2. **Form Focus**: Ring animation (2px primary color)
3. **Button Hover**: Opacity change (90%)
4. **Password Bar**: Smooth width transition (300ms)
5. **Error Display**: Slide in from top
6. **Loading Spinner**: Continuous rotation

## 🎪 Branding Section Content

### Logo & Title
- 🛡️ Shield Icon (48x48px)
- "SecureVision AI" (text-4xl, bold)
- Tagline: "Advanced Face Recognition Security System"

### Feature Cards
1. **📷 Real-time Monitoring**
   - "24/7 surveillance with instant face detection"

2. **👥 Intruder Detection**
   - "Automatic identification of unauthorized personnel"

3. **🔔 Instant Alerts**
   - "Real-time notifications for security events"

---

**Design System**: Tailwind CSS v3
**Icons**: Lucide React
**Color Palette**: Blue/Purple/Indigo gradient theme
