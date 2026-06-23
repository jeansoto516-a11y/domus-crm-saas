import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/login';
import Register from './pages/register';
import Dashboard from './pages/dashboard';
import CreateLead from './pages/createlead';
import Leads from './pages/leads';
import Brokers from './pages/brokers';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <PrivateRoute>
              <Leads />
            </PrivateRoute>
          }
          />  

          <Route
          path="/brokers"
          element={
            <PrivateRoute>
              <Brokers />
            </PrivateRoute>
          }

        />
        <Route
          path="/leads/novo"
          element={
            <PrivateRoute>
              <CreateLead />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
