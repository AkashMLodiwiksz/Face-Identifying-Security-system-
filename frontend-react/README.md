# Frontend - Face Recognition Security System

Modern React-based frontend with Tailwind CSS for the Face Recognition Security System.

## 🛠️ Technologies

- **React 18.3.1** - UI library
- **Vite 5.4.8** - Build tool and dev server
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **React Router DOM 6.26.2** - Client-side routing
- **Axios 1.7.7** - HTTP client
- **Chart.js 4.4.4** - Charts and graphs
- **react-chartjs-2 5.2.0** - React wrapper for Chart.js
- **Lucide React 0.445.0** - Icon library

## 📁 Structure

```
frontend-react/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout with sidebar
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── LiveMonitoring.jsx  # Live camera feeds
│   │   ├── Intruders.jsx       # Intruder gallery
│   │   ├── AuthorizedPersons.jsx  # Personnel management
│   │   ├── Alerts.jsx          # Alert management
│   │   ├── Detections.jsx      # Detection history
│   │   ├── Cameras.jsx         # Camera configuration
│   │   └── Settings.jsx        # System settings
│   ├── services/
│   │   └── api.js              # API configuration
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # Entry point
├── public/                      # Static assets
├── index.html
└── package.json
```

## 🚀 Setup

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Runs on: http://localhost:5173

### Build for Production

```bash
npm run build
```

Output in `dist/` folder.

## 🎨 Features

### Dashboard
- Real-time statistics (cameras, persons, intruders, detections)
- Recent alerts with timestamps
- Camera status monitoring
- System health metrics (CPU, memory, storage, network)

### Live Monitoring
- Real-time camera feeds
- Multi-camera view
- PTZ controls (planned)

### Intruder Gallery
- Unknown persons database
- Appearance tracking
- Threat level indicators

### Authorized Persons
- Personnel management
- Face registration
- Activity tracking

### Alerts
- Real-time security notifications
- Severity levels
- Acknowledgment system

### Detection Events
- Comprehensive detection history
- Filtering and search
- Image gallery

### Camera Management
- Add/remove cameras
- RTSP configuration
- Status monitoring

### Settings
- System configuration
- User preferences
- AI model settings

## 🎨 Styling

### Tailwind Configuration

Custom theme in `tailwind.config.js`:

- **Primary:** `#4e73df` (Blue)
- **Success:** `#1cc88a` (Green)
- **Danger:** `#e74a3b` (Red)
- **Dark Theme:** Full dark mode support

### Custom Scrollbars

Thin, styled scrollbars throughout the application.

### Animations

- Fade-in effects
- Pulse animations for live indicators
- Smooth transitions

## 🔌 API Integration

API base URL configured in `src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});
```

## 🔐 Authentication

Protected routes with authentication check:
- Redirects to login if not authenticated
- Stores token in localStorage
- Automatic logout on token expiration

Default credentials:
- **Username:** `1`
- **Password:** `1`

## 📱 Responsive Design

- Mobile-first approach
- Responsive sidebar
- Adaptive layouts
- Touch-friendly controls

## 🧪 Testing

```bash
npm run test
```

## 🔧 Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🌐 Deployment

### Vercel

```bash
npm run build
# Connect GitHub repo to Vercel
```

### Netlify

```bash
npm run build
# Deploy 'dist' folder
```

### Environment Variables

For production, update API base URL in `src/services/api.js` or use environment variables:

```env
VITE_API_URL=https://your-api-url.com
```

## 🎯 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Video playback controls
- [ ] Advanced filtering
- [ ] Export reports
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Accessibility improvements

## 🐛 Known Issues

None currently.

## 📝 Notes

- Uses React 18 features (automatic batching, transitions)
- Vite for lightning-fast HMR
- Code splitting for optimal performance
- Lazy loading for routes (can be implemented)


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
