import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute } from '../utils/routing';

const PrivateRoute = ({ children, roles }) => {
  const { token, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(user?.role)) return <Navigate to={getDefaultRoute(user?.role)} />;

  return children;
};

export default PrivateRoute;
