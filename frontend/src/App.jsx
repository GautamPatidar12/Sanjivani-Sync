import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';

function App() {
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  
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

  const isLoggedIn = phone && phone.length >= 8;

  // Authentication Route Guards
  useEffect(() => {
    const isPublic = currentHash === '#/login' || currentHash === '#/verify';
    if (!isLoggedIn && !isPublic) {
      window.location.hash = '#/login';
    } else if (isLoggedIn && isPublic) {
      window.location.hash = '#/dashboard';
    }
  }, [currentHash, isLoggedIn]);

  const handleLoginSuccess = (verifiedPhone, country) => {
    setPhone(verifiedPhone);
    setSelectedCountry(country);
    window.location.hash = '#/dashboard';
  };

  const handleLogout = () => {
    setPhone('');
    setSelectedCountry(null);
    window.location.hash = '#/login';
  };

  const isLoginRoute = currentHash === '#/login' || currentHash === '#/verify';

  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col items-center justify-center p-0 sm:p-6 overflow-hidden select-none">
      
      {/* Soft Aurora Blurry Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-red-100/40 mix-blend-multiply filter blur-[70px] sm:blur-[100px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-rose-100/40 mix-blend-multiply filter blur-[70px] sm:blur-[100px] animate-blob animation-delay-2000" />

      {/* Mobile-Centered Responsive Screen Container */}
      <div className="w-full max-w-md sm:h-[844px] h-screen bg-white sm:rounded-[36px] border border-neutral-100 sm:shadow-2xl flex flex-col justify-between overflow-hidden relative z-10 transition-all duration-300">
        {isLoginRoute ? (
          <Login 
            onSuccess={handleLoginSuccess} 
            currentHash={currentHash} 
            phone={phone}
            setPhone={setPhone}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
          />
        ) : (
          <Dashboard 
            phone={phone} 
            selectedCountry={selectedCountry} 
            onLogout={handleLogout} 
            currentHash={currentHash}
          />
        )}
      </div>

    </div>
  );
}

export default App;
