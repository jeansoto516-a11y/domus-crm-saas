import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/login';
import Register from './pages/register';
import Dashboard from './pages/dashboard';
import CreateLead from './pages/createlead';
import Leads from './pages/leads';
import Brokers from './pages/brokers';
import Checkout from './pages/checkout';
import ForgotPassword from './pages/forgotpassword';
import ResetPassword from './pages/resetpassword';
import Profile from './pages/profile';
import AdminPanel from './pages/adminpanel';
import Messages from './pages/messages';
import AdminMessages from './pages/adminmessages';
import Termos from './pages/termos';
import Privacidade from './pages/privacidade';
import Ranking from './pages/ranking';
import Goals from './pages/goals';

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
        <Route path="/termos" element={<Termos />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/esqueci-senha"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/redefinir-senha"
          element={
            <PublicRoute>
              <ResetPassword />
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
          path="/ranking"
          element={
            <PrivateRoute>
              <Ranking />
            </PrivateRoute>
          }
        />

                  <Route
          path="/metas"
          element={
            <PrivateRoute>
              <Goals />
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
          path="/checkout"
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />

          <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/mensagens"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/mensagens/:companyId"
          element={
            <PrivateRoute>
              <AdminMessages />
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

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
