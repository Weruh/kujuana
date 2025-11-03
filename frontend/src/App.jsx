import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Discover from './pages/Discover.jsx';
import Matches from './pages/Matches.jsx';
import Profile from './pages/Profile.jsx';
import Upgrade from './pages/Upgrade.jsx';
import AuthenticatedLayout from './layouts/AuthenticatedLayout.jsx';
import { useAuthStore } from './store/auth.js';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => (
  <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={(
        <ProtectedRoute>
          <AuthenticatedLayout />
        </ProtectedRoute>
      )}
      >
        <Route path="/discover" element={<Discover />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/upgrade" element={<Upgrade />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default App;
