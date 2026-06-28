import React, { useState, useRef, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Logo from './Logo.jsx';
import communityResilienceImg from '../assets/community_resilience.png';

export default function Login({ onSuccess, currentHash }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState({ code: '+91', flag: '🇮🇳', name: 'India' });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  
  // Login States
  const [step, setStep] = useState(1); // 1 = Phone Number, 2 = OTP Code
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resendTimer, setResendTimer] = useState(45);

  const otpInputsRef = useRef([]);
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

  // Handle outside clicks to close dropdowns
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

  // Timer for OTP Resend
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phoneNumber) {
      setAuthError('Please enter a valid mobile number.');
      return;
    }
    if (phoneNumber.length < 8) {
      setAuthError('Mobile number is too short.');
      return;
    }
    
    setIsLoading(true);
    setAuthError('');
    
    // Simulate sending OTP API request
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      setResendTimer(45);
      // Auto focus first OTP input field
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 100);
    }, 1200);
  };

  const handleOtpChange = (index, value) => {
    if (value && isNaN(value)) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value.substring(value.length - 1);
    setOtpCode(newOtp);

    // Auto-focus next field
    if (value && index < 5) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Move to previous field on backspace
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const fullCode = otpCode.join('');
    if (fullCode.length < 6) {
      setAuthError('Please enter the full 6-digit access code.');
      return;
    }
    
    setIsLoading(true);
    setAuthError('');

    // Simulate verification and login success
    setTimeout(() => {
      setIsLoading(false);
      onSuccess({
        token: 'mock-jwt-token-sanjivani-sync-' + Date.now(),
        name: 'First Responder',
        email: 'responder@sanjivanisync.org',
        role: 'requester',
        contactNumber: `${country.code} ${phoneNumber}`,
        location: {
          address: 'Rescue Center Alpha, Bengaluru',
          coordinates: [77.5946, 12.9716]
        }
      });
    }, 1500);
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
          throw new Error(data.message || 'Google Login failed');
        }
        onSuccess(data);
      } catch (err) {
        setAuthError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: error => {
      setAuthError('Google Login failed');
      console.error(error);
    }
  });

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setResendTimer(45);
    setOtpCode(['', '', '', '', '', '']);
    setAuthError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (otpInputsRef.current[0]) {
        otpInputsRef.current[0].focus();
      }
    }, 800);
  };

  const handleBackToPhone = () => {
    setStep(1);
    setOtpCode(['', '', '', '', '', '']);
    setAuthError('');
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] md:h-auto md:min-h-screen bg-[#f8fafc] overflow-hidden md:overflow-y-auto no-scrollbar flex flex-col justify-between select-none">
      
      {/* Top Header Navigation Row */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-1 md:py-4 flex justify-end items-center z-20 relative flex-shrink-0">
        <div className="relative" ref={langDropdownRef}>
          <button 
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[10px] sm:text-xs font-semibold text-slate-700 transition-all shadow-sm cursor-pointer"
          >
            <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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

      {/* Main Layout Area - Changed to justify-start on mobile to anchor elements at top and prevent cutoff */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-1 md:py-10 flex flex-col md:flex-row items-center justify-start md:justify-center gap-1.5 md:gap-20 flex-grow overflow-hidden md:overflow-visible relative z-10">
        
        {/* Left Side (Branding Header & Community Illustration) */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left md:w-1/2 w-full max-w-sm md:max-w-xl flex-shrink-0">
          
          {/* Logo & Subtitle */}
          <div className="flex flex-col items-center md:items-start mb-1 md:mb-6">
            <Logo className="w-10 h-10 md:w-16 md:h-16 mb-1 md:mb-3 animate-bounce-slow" />
            
            <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
              Sanjivani Sync
            </h1>
            <p className="text-[8px] sm:text-xs font-black tracking-[0.25em] text-[#8a98a5] uppercase mt-0.5 md:mt-1">
              Community Resilience Grid
            </p>
            <p className="text-[10px] sm:text-sm font-medium text-slate-500 mt-1 md:mt-4 leading-relaxed max-w-[260px] sm:max-w-md">
              Community-driven resource coordination for rapid crisis response.
            </p>
          </div>

          {/* Generated Image illustration (reduced height on mobile to guarantee logo visibility) */}
          <div className="w-full py-1 md:py-4 flex justify-center md:justify-start max-h-[10vh] md:max-h-[280px] overflow-hidden">
            <img 
              src={communityResilienceImg} 
              alt="Community Resilience Coordination" 
              className="h-[8vh] md:h-auto max-h-[80px] md:max-h-[280px] object-contain" 
            />
          </div>
        </div>

        {/* Right Side (Card Form with rounded borders, shadows) */}
        <div className="md:w-1/2 w-full max-w-xs sm:max-w-md relative z-10 flex-shrink-0">
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-8 shadow-lg shadow-slate-200/40 border border-slate-100 flex flex-col relative w-full animate-fadeIn">
            
            {/* Display validation error */}
            {authError && (
              <div className="mb-2 p-2 bg-rose-50 border border-rose-100 rounded-xl text-[10px] md:text-xs font-semibold text-rose-600 text-center animate-shake flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{authError}</span>
              </div>
            )}

            {step === 1 ? (
              // Step 1: Input Phone Number
              <div className="flex flex-col">
                <h2 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">Sign In</h2>
                <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5 md:mt-1 mb-2.5 md:mb-6">
                  Enter your mobile number to receive a secure access code.
                </p>

                <form onSubmit={handleSendOtp} className="flex flex-col gap-2 md:gap-4">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <label className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <div className="flex items-center border border-slate-200 rounded-xl md:rounded-2xl bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all overflow-hidden h-9 md:h-12">
                      
                      {/* Country dropdown picker */}
                      <div className="relative h-full" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-1 h-full px-2.5 border-r border-slate-100 hover:bg-slate-50 text-slate-700 font-bold text-[10px] sm:text-xs cursor-pointer"
                        >
                          <span className="text-sm">{country.flag}</span>
                          <span>{country.code}</span>
                          <svg className="w-2 h-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {showCountryDropdown && (
                          <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg py-0.5 z-30 animate-fadeIn">
                            {countries.map((c) => (
                              <button
                                type="button"
                                key={c.code}
                                onClick={() => {
                                  setCountry(c);
                                  setShowCountryDropdown(false);
                                }}
                                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-[9px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <span className="text-xs">{c.flag}</span>
                                <span>{c.code}</span>
                                <span className="text-slate-400 font-medium truncate">({c.name})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Phone text input */}
                      <div className="flex items-center flex-1 h-full px-2 gap-1">
                        <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="5" y="2" width="14" height="20" rx="2" />
                          <path d="M12 18h.01" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter mobile number"
                          className="w-full text-[11px] md:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Send OTP Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-9 md:h-12 bg-[#485ff7] hover:bg-[#394ed9] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>SEND SECURE OTP</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                {/* OR Google Login section */}
                <div className="flex items-center gap-2 my-2 md:my-5 select-none">
                  <div className="flex-1 h-px bg-slate-100"></div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Or</span>
                  <div className="flex-1 h-px bg-slate-100"></div>
                </div>

                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold py-2 md:py-3 px-3 rounded-xl md:rounded-2xl transition-all shadow-sm disabled:opacity-50 text-[9px] md:text-xs cursor-pointer"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

              </div>
            ) : (
              // Step 2: Input OTP Verification code
              <div className="flex flex-col animate-slideRight">
                <h2 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">Verify Code</h2>
                <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5 md:mt-1 mb-4 md:mb-6">
                  Enter the 6-digit access code sent to <span className="text-slate-800 font-bold">{country.code} {phoneNumber}</span>.
                </p>

                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3 md:gap-5">
                  <div className="flex items-center justify-between gap-1">
                    {otpCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputsRef.current[index] = el)}
                        type="text"
                        maxLength="6"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-8 h-8 sm:w-12 sm:h-12 border border-slate-200 rounded-lg md:rounded-xl bg-slate-50 font-black text-sm md:text-lg text-slate-800 text-center focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all animate-fadeIn"
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-[9px] md:text-xs font-semibold select-none">
                    <button
                      type="button"
                      onClick={handleBackToPhone}
                      className="text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>Back</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0}
                      className={`transition-colors cursor-pointer ${resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-[#485ff7] hover:text-[#394ed9]'}`}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-9 md:h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>VERIFY & SIGN IN</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Features badges at the bottom of the card - Shrunk to text-[8.5px] */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-4 md:mt-6 gap-2 text-[8px] sm:text-[8.5px] font-bold text-slate-400 uppercase select-none">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-emerald-500/70" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>End-to-end Encrypted</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-sky-500/70" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>Global Standards</span>
              </div>
            </div>

          </div>
          
          {/* Sign Up Link below Card */}
          <p className="text-center text-xs font-semibold text-slate-500 mt-2 md:mt-6 select-none">
            Don't have an account?{' '}
            <button 
              type="button" 
              onClick={() => window.location.hash = '#/signup'} 
              className="text-[#485ff7] hover:text-[#394ed9] font-extrabold cursor-pointer hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>

      </div>

      {/* Bottom background faded illustrations overlay */}
      <div className="w-full select-none relative h-10 md:h-28 overflow-hidden flex flex-col justify-end text-slate-200/50 flex-shrink-0">
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
