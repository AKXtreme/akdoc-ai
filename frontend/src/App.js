import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { checkAuth } from './store/authSlice';
import { ThemeProvider } from './ThemeContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import DocumentList from './components/Documents/DocumentList';
import DocumentDetail from './components/Documents/DocumentDetail';
import DocumentUpload from './components/Documents/DocumentUpload';
import AdminPanel from './components/Admin/AdminPanel';
import Profile from './components/Profile/Profile';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, token } = useSelector((s) => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => { dispatch(checkAuth()); }, [dispatch]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="documents" element={<DocumentList />} />
            <Route path="documents/upload" element={<DocumentUpload />} />
            <Route path="documents/:id" element={<DocumentDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
