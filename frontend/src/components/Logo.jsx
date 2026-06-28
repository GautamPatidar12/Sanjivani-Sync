import React from 'react';

export default function Logo({ className = "w-20 h-20" }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} shadow-lg shadow-emerald-500/10 rounded-[22%] overflow-hidden`}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#05c46b" /> {/* Teal-green */}
          <stop offset="50%" stopColor="#0be881" />
          <stop offset="100%" stopColor="#0984e3" /> {/* Blue */}
        </linearGradient>
      </defs>
      
      {/* Background Rounded Rect */}
      <rect width="100" height="100" rx="22" fill="url(#logoGrad)" />
      
      {/* Heart Outline */}
      <path 
        d="M 50 36 C 44 24, 25 24, 25 41 C 25 58, 50 75, 50 75 C 50 75, 75 58, 75 41 C 75 24, 56 24, 50 36 Z" 
        fill="none" 
        stroke="white" 
        strokeWidth="4.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* ECG Line (inside the heart) */}
      <path 
        d="M 28 44 H 38 L 41 35 L 45 58 L 49 22 L 53 62 L 57 46 L 60 51 H 70" 
        fill="none" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Plus sign at bottom right of the heart (overlapping contour) */}
      <path 
        d="M 64 64 H 74 M 69 59 V 69" 
        stroke="white" 
        strokeWidth="4.5" 
        strokeLinecap="round" 
      />
    </svg>
  );
}

