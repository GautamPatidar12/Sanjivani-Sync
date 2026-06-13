import React from 'react';

export default function Logo({ className = "w-20 h-20" }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} rounded-2xl shadow-lg shadow-red-500/20 relative z-10`}
    >
      <rect width="100" height="100" rx="22" fill="#d61c24" />
      <path 
        d="M 10 50 L 30 50 L 36 38 L 41 62 L 47 25 L 53 75 L 58 50 L 64 50 L 69 41 L 74 54 L 79 50 L 90 50" 
        fill="none" 
        stroke="white" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        opacity="0.85" 
      />
      <text 
        x="50" 
        y="66" 
        textAnchor="middle" 
        fill="white" 
        fontSize="55" 
        fontFamily="Georgia, serif" 
        fontWeight="bold"
      >
        S
      </text>
    </svg>
  );
}
