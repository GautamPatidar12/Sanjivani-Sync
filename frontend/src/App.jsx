import React, { useState } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';

function App() {
  const [step, setStep] = useState('login'); // 'login' | 'dashboard'
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);

  const handleLoginSuccess = (verifiedPhone, country) => {
    setPhone(verifiedPhone);
    setSelectedCountry(country);
    setStep('dashboard');
  };

  const handleLogout = () => {
    setPhone('');
    setSelectedCountry(null);
    setStep('login');
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col items-center justify-center p-0 sm:p-6 overflow-hidden select-none">
      
      {/* Soft Aurora Blurry Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-red-100/40 mix-blend-multiply filter blur-[70px] sm:blur-[100px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-rose-100/40 mix-blend-multiply filter blur-[70px] sm:blur-[100px] animate-blob animation-delay-2000" />

      {/* Mobile-Centered Responsive Screen Container */}
      <div className="w-full max-w-md sm:h-[844px] h-screen bg-white sm:rounded-[36px] border border-neutral-100 sm:shadow-2xl flex flex-col justify-between overflow-hidden relative z-10 transition-all duration-300">
        {step === 'login' ? (
          <Login onSuccess={handleLoginSuccess} />
        ) : (
          <Dashboard 
            phone={phone} 
            selectedCountry={selectedCountry} 
            onLogout={handleLogout} 
          />
        )}
      </div>

    </div>
  );
}

export default App;
