import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav data-testid="navigation">
      <Link data-testid="dashboard-nav" to="/dashboard">Dashboard</Link>
      <Link data-testid="repos-nav" to="/repositories">Repositories</Link>
      <Link data-testid="vulns-nav" to="/vulnerabilities">Vulnerabilities</Link>
      <Link data-testid="notifs-nav" to="/notifications">Notifications</Link>
      <button data-testid="mobile-menu-toggle" className="mobile-only">☰</button>
      <div data-testid="user-menu">
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navigation; 