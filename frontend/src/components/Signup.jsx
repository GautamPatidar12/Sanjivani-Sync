import React, { useState, useRef, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Logo from './Logo.jsx';
import communityResilienceImg from '../assets/community_resilience.png';

export default function Signup({ onSuccess, currentHash }) {
  const [accountType, setAccountType] = useState('user'); // 'user' or 'organization'
  const [orgType, setOrgType] = useState('hospital');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');

  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

  const countries = [
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+1', flag: '🇺🇸', name: 'United States' },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' }
  ];

  const languages = ['English', 'हिन्दी', 'Español', 'Français'];
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !contactNumber) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      const fullContact = `${countryCode} ${contactNumber}`;
      const payload = {
        name,
        email,
        password,
        role: accountType === 'organization' ? 'organization' : 'requester',
        orgType: accountType === 'organization' ? orgType : 'none',
        contactNumber: fullContact,
        location: {
          address: 'Unknown Address',
          coordinates: [77.5946, 12.9716]
        }
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      onSuccess(data);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setAuthError('');
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: tokenResponse.token })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Google Signup failed');
        }

        onSuccess(data);
      } catch (err) {
        setAuthError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: error => {
      setAuthError('Google Signup failed');
      console.error(error);
    }
  });

  const activeCountry = countries.find(c => c.code === countryCode) || countries[0];

  return (
    <div className="relative w-full h-screen h-[100dvh] md:h-auto md:min-h-screen bg-[#f8fafc] overflow-hidden md:overflow-y-auto no-scrollbar flex flex-col justify-between select-none">
      
      {/* Top Header Navigation Row */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-1 md:py-4 flex justify-end items-center z-20 relative flex-shrink-0">
        <div className="relative" ref={langDropdownRef}>
          <button 
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[10px] sm:text-xs font-semibold text-slate-700 transition-all shadow-sm cursor-pointer select-none"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{currentLanguage}</span>
            <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showLanguageDropdown && (
            <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-30 animate-fadeIn">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setCurrentLanguage(lang);
                    setShowLanguageDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-1 md:py-10 flex flex-col md:flex-row items-center justify-start md:justify-center gap-2 md:gap-20 flex-grow overflow-hidden md:overflow-visible relative z-10">
        
        {/* Left Side (Branding Header & Community Illustration) */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left md:w-1/2 w-full max-w-sm md:max-w-xl flex-shrink-0">
          
          {/* Logo & Subtitle */}
          <div className="flex flex-col items-center md:items-start mb-1 md:mb-6">
            <Logo className="w-10 h-10 md:w-16 md:h-16 mb-1 md:mb-4 animate-bounce-slow" />
            
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
              Sanjivani Sync
            </h1>
            <p className="text-[9px] sm:text-xs font-black tracking-[0.25em] text-[#8a98a5] uppercase mt-0.5 md:mt-1">
              Community Resilience Grid
            </p>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 md:mt-4 leading-relaxed max-w-[280px] sm:max-w-md">
              Join the decentralized emergency resilience network. Every connection helps build a stronger community.
            </p>
          </div>

          {/* Generated Image illustration (hidden on mobile signup to allow form fields to fit within 100vh) */}
          <div className="w-full py-1 md:py-4 hidden md:flex justify-center md:justify-start max-h-[280px] overflow-hidden">
            <img 
              src={communityResilienceImg} 
              alt="Community Resilience Coordination" 
              className="w-full h-auto max-h-[280px] object-contain" 
            />
          </div>
        </div>

        {/* Right Side (Floating Card Form) */}
        <div className="md:w-1/2 w-full max-w-sm md:max-w-md relative z-10 flex-shrink-0">
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-8 shadow-lg shadow-slate-200/40 border border-slate-100 flex flex-col relative w-full animate-fadeIn">
            
            <h2 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">Create an Account</h2>
            <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5 md:mt-1 mb-4">
              Please fill in your details to register on Sanjivani Sync.
            </p>

            {/* Toggle Account Type */}
            <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setAccountType('user')}
                className={`flex-1 text-[10px] md:text-xs font-bold py-2 rounded-lg transition-all cursor-pointer ${accountType === 'user' ? 'bg-white text-slate-800 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Responder / Helper
              </button>
              <button
                type="button"
                onClick={() => setAccountType('organization')}
                className={`flex-1 text-[10px] md:text-xs font-bold py-2 rounded-lg transition-all cursor-pointer ${accountType === 'organization' ? 'bg-white text-slate-800 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Organization
              </button>
            </div>

            {/* Display validation error */}
            {authError && (
              <div className="mb-3 p-2 bg-rose-50 border border-rose-100 rounded-xl text-[10px] md:text-xs font-semibold text-rose-600 text-center animate-shake flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{authError}</span>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3">
              
              {/* Org Type Selection */}
              {accountType === 'organization' && (
                <div className="flex flex-col gap-1 animate-fadeIn">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Organization Type</label>
                  <div className="relative">
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-slate-800 cursor-pointer appearance-none h-10"
                    >
                      <option value="hospital">Hospital</option>
                      <option value="blood_bank">Blood Bank</option>
                      <option value="hotel">Hotel / Shelter</option>
                      <option value="vehicle_owner">Vehicle Fleet (Transport)</option>
                      <option value="none">Other</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Name Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {accountType === 'organization' ? 'Organization Name' : 'Full Name'}
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all px-3 h-10 gap-2">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={accountType === 'organization' ? "City Hospital" : "John Doe"}
                    className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all px-3 h-10 gap-2">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all overflow-hidden h-10">
                  <div className="relative h-full" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center gap-1 h-full px-2 border-r border-slate-100 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer select-none"
                    >
                      <span className="text-base">{activeCountry.flag}</span>
                      <span>{activeCountry.code}</span>
                      <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute left-0 mt-1 w-40 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-30 animate-fadeIn">
                        {countries.map((c) => (
                          <button
                            type="button"
                            key={c.code}
                            onClick={() => {
                              setCountryCode(c.code);
                              setShowCountryDropdown(false);
                            }}
                            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <span className="text-sm">{c.flag}</span>
                            <span>{c.code}</span>
                            <span className="text-slate-400 font-medium truncate">({c.name})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center flex-1 h-full px-3 gap-2">
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ''))} // Fix standard code matching
                      placeholder="98765 43210"
                      className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all px-3 h-10 gap-2">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-[#485ff7] hover:bg-[#394ed9] text-white rounded-xl font-black text-[10px] md:text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-70 cursor-pointer mt-1"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>CREATE ACCOUNT</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
          
          {/* Link to Login */}
          <p className="text-center text-xs font-semibold text-slate-500 mt-3 select-none">
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={() => window.location.hash = '#/login'} 
              className="text-[#485ff7] hover:text-[#394ed9] font-extrabold cursor-pointer hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>

      </div>

      {/* Bottom silhouette background */}
      <div className="w-full select-none relative h-14 md:h-28 overflow-hidden flex flex-col justify-end text-slate-200/50 flex-shrink-0">
        <svg viewBox="0 0 1000 100" fill="currentColor" className="w-full h-full object-cover">
          <path d="M 50 100 L 100 65 L 150 100 Z" opacity="0.4" />
          <path d="M 100 65 L 120 70 L 135 100 L 100 100 Z" opacity="0.3" />

          <g transform="translate(250, 45) scale(0.45)">
            <circle cx="20" cy="20" r="8" />
            <path d="M 12 35 C 12 30, 28 30, 28 35 L 26 120 L 14 120 Z" />
            <g transform="translate(35, 10)">
              <circle cx="20" cy="20" r="8" />
              <path d="M 14 35 C 14 30, 26 30, 26 35 L 30 110 L 10 110 Z" />
            </g>
            <g transform="translate(22, 45) scale(0.65)">
              <circle cx="20" cy="20" r="8" />
              <path d="M 12 35 C 12 30, 28 30, 28 35 L 25 100 L 15 100 Z" />
            </g>
          </g>

          <g transform="translate(580, 52) scale(0.85)">
            <rect x="0" y="10" width="80" height="35" rx="5" opacity="0.4" />
            <path d="M 80 20 L 100 28 L 100 45 L 80 45 Z" opacity="0.5" />
            <circle cx="25" cy="45" r="9" fill="#f8fafc" />
            <circle cx="75" cy="45" r="9" fill="#f8fafc" />
            <path d="M 36 28 H 44 M 40 24 V 32" stroke="#cbd5e1" strokeWidth="2.5" />
          </g>

          <g transform="translate(850, 25)">
            <rect x="0" y="10" width="85" height="65" rx="4" opacity="0.3" />
            <rect x="12" y="20" width="15" height="15" rx="1" fill="#f8fafc" opacity="0.8" />
            <rect x="35" y="20" width="15" height="15" rx="1" fill="#f8fafc" opacity="0.8" />
            <rect x="58" y="20" width="15" height="15" rx="1" fill="#f8fafc" opacity="0.8" />
            <rect x="12" y="45" width="15" height="15" rx="1" fill="#f8fafc" opacity="0.8" />
            <rect x="58" y="45" width="15" height="15" rx="1" fill="#f8fafc" opacity="0.8" />
            <rect x="35" y="45" width="15" height="30" rx="1" fill="#f8fafc" opacity="0.8" />
            <path d="M 37 3 H 47 M 42 -2 V 8" stroke="#cbd5e1" strokeWidth="3" />
          </g>
        </svg>
      </div>

    </div>
  );
}
