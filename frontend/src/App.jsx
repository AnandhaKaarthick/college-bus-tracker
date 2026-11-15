import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusProvider } from './context/BusContext';
import BottomNavBar from './components/BottomNavBar';

// Old routes
import DriverApp from './components/DriverApp';
import AdminHub from './pages/admin/AdminHub';

// New redesign pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TrackingPage from './pages/TrackingPage';
import MapPage from './pages/MapPage';
import SafetyHub from './pages/SafetyHub';
import ProfilePage from './pages/ProfilePage';

// Protected Route Wrapper
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const defaultPath = user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/dashboard';
    return <Navigate to={defaultPath} replace />;
  }

  return children;
}

// Layout wrapper to conditionally show BottomNavBar
function AppLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const hideNav = !isAuthenticated || 
                  location.pathname === '/login' || 
                  location.pathname.startsWith('/driver') || 
                  location.pathname.startsWith('/admin');

  return (
    <>
      <main className={!hideNav ? "pb-16 min-h-screen" : "min-h-screen"} style={!hideNav ? { background: "var(--bg-primary)" } : {}}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
          <Route path="/tracking"  element={<ProtectedRoute allowedRoles={['student']}><TrackingPage /></ProtectedRoute>} />
          <Route path="/map"       element={<ProtectedRoute allowedRoles={['student']}><MapPage /></ProtectedRoute>} />
          <Route path="/safety"    element={<ProtectedRoute allowedRoles={['student']}><SafetyHub /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute allowedRoles={['student']}><ProfilePage /></ProtectedRoute>} />

          <Route path="/driver"    element={<ProtectedRoute allowedRoles={['driver']}><DriverApp /></ProtectedRoute>} />
          <Route path="/admin/*"   element={<ProtectedRoute allowedRoles={['admin']}><AdminHub /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
      
      {!hideNav && <BottomNavBar />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BusProvider>
          <Router>
            <AppLayout />
          </Router>
        </BusProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
