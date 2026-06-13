import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Logo from './Logo.jsx';

export default function Signup({ onSuccess, currentHash }) {
  const [accountType, setAccountType] = useState('user'); // 'user' or 'organization'
  const [orgType, setOrgType] = useState('hospital');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !contactNumber) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      const payload = {
        name,
        email,
        password,
        role: accountType === 'organization' ? 'organization' : 'requester',
        orgType: accountType === 'organization' ? orgType : 'none',
        contactNumber,
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

  return (
    <div className="flex flex-col md:flex-row w-full h-full relative bg-white">
      {/* Left side: Desktop Branding / Illustration */}
      <div className="hidden md:flex md:w-1/2 bg-[#d61c24] flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Subtle background patterns */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-800 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white p-2.5 rounded-2xl shadow-lg">
            <Logo className="w-8 h-8 text-[#d61c24]" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Sanjivani <span className="text-red-200">Sync</span></span>
        </div>

        <div className="relative z-10 max-w-sm mt-12 mb-auto">
          <h2 className="text-4xl font-black leading-[1.1] tracking-tight mb-6">
            Join The <br /> Emergency <br /> <span className="text-red-200">Network.</span>
          </h2>
          <p className="text-red-100 font-medium text-sm leading-relaxed">
            Create an account to become a part of our decentralized network. Whether you are an individual responder or an organization, every connection matters.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs font-bold text-red-200 uppercase tracking-widest">
          <span>Secure</span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span>Real-time</span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span>Verified</span>
        </div>
      </div>

      {/* Right side: Authentication Forms */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 md:py-12 md:px-16 lg:px-24 flex flex-col justify-center relative md:w-1/2">
        <div className="flex flex-col max-w-md w-full mx-auto">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <Logo className="w-16 h-16" />
            <h1 className="mt-4 text-xl font-extrabold text-neutral-900 tracking-tight">
              Sanjivani <span className="text-[#d61c24]">Sync</span>
            </h1>
            <p className="text-3xs text-neutral-400 uppercase tracking-widest font-bold mt-1">
              Emergency Resource Network
            </p>
          </div>

          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Create an Account</h2>
            <p className="text-sm text-neutral-500 mt-1 mb-8">Please enter your details to register.</p>

            {/* Social Login Buttons */}
            <div className="flex flex-col gap-3 mb-6">
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold py-3 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-neutral-200"></div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Or register with email</span>
              <div className="flex-1 h-px bg-neutral-200"></div>
            </div>

            {/* Toggle Account Type */}
            <div className="flex bg-neutral-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setAccountType('user')}
                className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${accountType === 'user' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Normal Account
              </button>
              <button
                type="button"
                onClick={() => setAccountType('organization')}
                className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${accountType === 'organization' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Organization
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600 text-center animate-shake">
                {authError}
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignupSubmit} className="flex flex-col gap-4">

              {accountType === 'organization' && (
                <div className="flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-neutral-700">Organization Type</label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full text-sm px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium text-neutral-800 cursor-pointer"
                  >
                    <option value="hospital">Hospital</option>
                    <option value="blood_bank">Blood Bank</option>
                    <option value="hotel">Hotel / Shelter</option>
                    <option value="vehicle_owner">Vehicle Fleet (Transport)</option>
                    <option value="none">Other</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-700">Full Name / Organization Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full text-sm px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium text-neutral-800 placeholder-neutral-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full text-sm px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium text-neutral-800 placeholder-neutral-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-700">Contact Number</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-sm px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium text-neutral-800 placeholder-neutral-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium text-neutral-800 placeholder-neutral-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full bg-[#d61c24] hover:bg-[#b31018] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/20 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Sign Up</span>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-neutral-500 font-medium mt-8">
              Already have an account? <button type="button" onClick={() => window.location.hash = '#/login'} className="text-[#d61c24] font-bold hover:underline">Log in</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
