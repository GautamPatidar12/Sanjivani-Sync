import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo.jsx';

const countriesList = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
];

export default function Login({ onSuccess, currentHash, phone, setPhone, selectedCountry, setSelectedCountry }) {
  // Determine step based on global URL hash
  const step = currentHash === '#/verify' ? 'otp' : 'phone';

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [phoneError, setPhoneError] = useState(false);
  const [otpError, setOtpError] = useState(false);

  const dropdownRef = useRef(null);
  const countryButtonRef = useRef(null);

  // Set default country code if not set
  useEffect(() => {
    if (!selectedCountry) {
      setSelectedCountry(countriesList[0]);
    }
  }, [selectedCountry, setSelectedCountry]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !countryButtonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 12) {
      setPhone(val);
      setPhoneError(false);
    }
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (phone.length < 8) {
      setPhoneError(true);
      return;
    }
    // Update hash path to transition to OTP screen
    window.location.hash = '#/verify';
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    setOtpError(false);
  };

  const handleOtpChange = (index, value) => {
    const val = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    if (val !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) prevInput.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setOtpError(true);
      return;
    }
    
    // Accept demo OTP code "123456"
    if (otpCode === '123456') {
      onSuccess(phone, selectedCountry || countriesList[0]);
    } else {
      setOtpError(true);
    }
  };

  const handleResendOtp = () => {
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    setOtpError(false);
    setTimeout(() => {
      const firstInput = document.getElementById('otp-0');
      if (firstInput) firstInput.focus();
    }, 100);
  };

  const filteredCountries = countriesList.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
  );

  const activeCountry = selectedCountry || countriesList[0];

  return (
    <>
      <div className="h-6" />
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 flex flex-col justify-center">
        {step === 'phone' ? (
          <div className="flex flex-col">
            <div className="flex flex-col items-center mb-8">
              <Logo className="w-20 h-20" />
              <h1 className="mt-4 text-xl font-extrabold text-neutral-900 tracking-tight">
                Sanjivani <span className="text-[#d61c24]">Sync</span>
              </h1>
              <p className="text-3xs text-neutral-400 uppercase tracking-widest font-bold mt-1">
                Emergency Resource Network
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6">
              <form onSubmit={handlePhoneSubmit} className="flex flex-col">
                <h2 className="text-lg font-bold text-center text-neutral-800">Login with Phone</h2>
                <p className="text-xs text-neutral-400 text-center mt-1">Enter your mobile number to continue</p>

                <div className={`mt-6 flex items-center border ${phoneError ? 'border-red-500 animate-shake' : 'border-neutral-200'} rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all duration-200 relative`}>
                  
                  <button
                    ref={countryButtonRef}
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1 text-neutral-800 font-bold text-sm focus:outline-none"
                  >
                    <span>{activeCountry.flag}</span>
                    <span>{activeCountry.code}</span>
                    <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  <div className="h-5 w-px bg-neutral-200 mx-2" />

                  {isDropdownOpen && (
                    <div ref={dropdownRef} className="absolute top-16 left-4 right-4 bg-white border border-neutral-150 rounded-2xl shadow-xl z-30 p-2 flex flex-col gap-2 max-h-56 overflow-y-auto no-scrollbar">
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-neutral-50 rounded-lg border border-neutral-200 focus:outline-none text-neutral-800"
                      />
                      <div className="flex flex-col gap-0.5">
                        {filteredCountries.map((country, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => { setSelectedCountry(country); setIsDropdownOpen(false); setSearchQuery(''); }}
                            className="flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-red-50 text-neutral-700 hover:text-red-700 font-medium transition-colors w-full text-left"
                          >
                            <span className="flex items-center gap-2"><span>{country.flag}</span><span>{country.name}</span></span>
                            <span className="text-neutral-400">{country.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <input
                    type="tel"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="Enter Mobile Number"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="flex-1 text-sm bg-transparent border-none outline-none text-neutral-800 placeholder-neutral-400 font-semibold focus:ring-0 p-0 ml-1"
                  />
                </div>

                {phoneError && <span className="text-2xs text-red-500 mt-1 ml-1 font-semibold">Please enter a valid phone number.</span>}

                <button type="submit" className="mt-5 w-full bg-[#d61c24] hover:bg-[#b31018] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 group transition-all duration-300">
                  <span>Continue</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6">
              <form onSubmit={handleOtpSubmit} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => window.location.hash = '#/login'} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors focus:outline-none">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h2 className="text-lg font-bold text-center text-neutral-800 pr-7 flex-1">OTP Verification</h2>
                </div>
                <p className="text-xs text-neutral-400 text-center mt-2">
                  We've sent a 6-digit confirmation code to <span className="font-semibold text-neutral-800">{activeCountry.code} {phone}</span>
                </p>

                <div className="flex justify-between gap-2 mt-6">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="tel"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-12 text-center text-lg font-bold bg-neutral-50 border ${otpError ? 'border-red-500 animate-shake' : 'border-neutral-200'} rounded-xl focus:border-red-500 focus:bg-white focus:outline-none transition-all duration-150 text-neutral-800`}
                    />
                  ))}
                </div>

                {otpError && <span className="text-2xs text-red-500 mt-2 text-center font-semibold">Invalid OTP. Use demo code <span className="font-extrabold underline">123456</span>.</span>}

                <div className="mt-5 text-center">
                  {resendTimer > 0 ? (
                    <p className="text-2xs text-neutral-400 font-semibold">Resend code in <span className="text-red-500 font-bold">{resendTimer}s</span></p>
                  ) : (
                    <button type="button" onClick={handleResendOtp} className="text-2xs text-[#d61c24] hover:text-[#b31018] font-bold underline transition-colors">Resend Code</button>
                  )}
                </div>

                <button type="submit" className="mt-5 w-full bg-[#d61c24] hover:bg-[#b31018] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300">
                  <span>Verify &amp; Continue</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
