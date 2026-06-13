import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import Dashboard from './components/Dashboard.jsx';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Custom Hash Router State
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/login');

  useEffect(() => {
    // Sync current URL hash with state
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/login');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isLoggedIn = user !== null;

  // Authentication Route Guards
  useEffect(() => {
    const isPublic = currentHash === '#/login' || currentHash === '#/signup';
    if (!isLoggedIn && !isPublic) {
      window.location.hash = '#/login';
    } else if (isLoggedIn && isPublic) {
      window.location.hash = '#/dashboard';
    }
  }, [currentHash, isLoggedIn]);

  const handleLoginSuccess = (userData) => {
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    window.location.hash = '#/dashboard';
  };

  const handleUserUpdate = (newUserData) => {
    setUser(prev => {
      if (!prev) return newUserData;
      const token = prev.token;
      return { ...prev, ...newUserData, token };
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.hash = '#/login';
  };

  const isLoginRoute = currentHash === '#/login';
  const isSignupRoute = currentHash === '#/signup';

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden select-none">
      
      {/* Soft Aurora Blurry Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-red-100/40 mix-blend-multiply filter blur-[70px] sm:blur-[100px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-rose-100/40 mix-blend-multiply filter blur-[70px] sm:blur-[100px] animate-blob animation-delay-2000" />

      {/* Full Screen Container */}
      <div className="w-full h-full bg-transparent flex flex-col justify-between overflow-hidden relative z-10">
        {isLoginRoute ? (
          <Login 
            onSuccess={handleLoginSuccess} 
            currentHash={currentHash} 
          />
        ) : isSignupRoute ? (
          <Signup 
            onSuccess={handleLoginSuccess} 
            currentHash={currentHash} 
          />
        ) : (
          <Dashboard 
            user={user} 
            onLogout={handleLogout} 
            onUserUpdate={handleUserUpdate}
            currentHash={currentHash}
          />
        )}
      </div>

    </div>
  );
}

export default App;
