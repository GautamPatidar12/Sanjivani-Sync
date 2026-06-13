import React, { useState } from 'react';

const emergencyCategories = [
  {
    id: 'accident',
    title: 'Accident',
    description: 'Road accident or vehicle collision',
    iconColor: 'text-[#d61c24] bg-red-50',
    icon: (
      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
        <path d="M19 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-14 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm13-6l-1.88-5.64c-.19-.57-.72-.96-1.32-.96H8.2c-.6 0-1.13.39-1.32.96L5 9v6c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V9zm-10.8 4c-.66 0-1.2-.54-1.2-1.2 0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2zm7.6 0c-.66 0-1.2-.54-1.2-1.2 0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2z" />
      </svg>
    )
  },
  {
    id: 'medical',
    title: 'Medical Emergency',
    description: 'Sudden illness or health issue',
    iconColor: 'text-[#d61c24] bg-red-50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h2.5L13 9.5l1.5 5 1-2.5H18" stroke="currentColor" />
      </svg>
    )
  },
  {
    id: 'fire',
    title: 'Fire',
    description: 'Fire incident or explosion',
    iconColor: 'text-amber-600 bg-amber-50',
    icon: (
      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1 14h-2V7.5L11 9.5v6.5zm4 0h-2V9.5l2-2v8.5z" />
        <path d="M17.66 8.24c-.38-.72-.92-1.35-1.58-1.84C14.79 5.34 13.46 5 12 5s-2.79.34-4.08 1.4c-.66.49-1.2 1.12-1.58 1.84C6.12 8.64 6 9.31 6 10c0 3.31 2.69 6 6 6s6-2.69 6-6c0-.69-.12-1.36-.34-1.76z" opacity="0.15" />
      </svg>
    )
  },
  {
    id: 'safety',
    title: 'Personal Safety',
    description: 'Threat, harassment or unsafe situation',
    iconColor: 'text-purple-600 bg-purple-50',
    icon: (
      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    )
  },
  {
    id: 'disaster',
    title: 'Disaster',
    description: 'Natural disaster or major incident',
    iconColor: 'text-blue-600 bg-blue-50',
    icon: (
      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
    )
  }
];

export default function EmergencyType({ onBack, onContinue }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleContinue = () => {
    if (selectedId) {
      const selectedOption = emergencyCategories.find(c => c.id === selectedId);
      onContinue(selectedOption);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      
      {/* Top back button, header texts and graphics */}
      <div>
        <div className="flex justify-between items-start gap-4">
          <button 
            onClick={onBack}
            className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-800 transition-colors focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Vector illustration of ambulance and map pin */}
          <div className="flex-shrink-0">
            <svg viewBox="0 0 120 80" className="w-24 h-16">
              <ellipse cx="60" cy="72" rx="35" ry="6" fill="#f4f4f5" />
              <g transform="translate(68, 5)">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#d61c24" />
              </g>
              <g transform="translate(10, 20)">
                <rect x="52" y="5" width="6" height="4" rx="2" fill="#ef4444" className="animate-pulse" />
                <rect x="15" y="9" width="45" height="30" rx="3" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
                <path d="M60 18 L72 18 L76 27 L76 39 L60 39 Z" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
                <path d="M60 21 L69 21 L72 27 L60 27 Z" fill="#93c5fd" />
                <rect x="20" y="22" width="55" height="4" fill="#d61c24" />
                <rect x="33" y="16" width="8" height="2" fill="#d61c24" />
                <rect x="36" y="13" width="2" height="8" fill="#d61c24" />
                <circle cx="28" cy="38" r="7" fill="#1f2937" />
                <circle cx="28" cy="38" r="3" fill="#ffffff" />
                <circle cx="62" cy="38" r="7" fill="#1f2937" />
                <circle cx="62" cy="38" r="3" fill="#ffffff" />
              </g>
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight mt-4">
          What type of emergency is this?
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Select the option that best describes your situation
        </p>

        {/* Emergency Selection Grid List */}
        <div className="flex flex-col gap-3 mt-6">
          {emergencyCategories.map((option) => {
            const isSelected = selectedId === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                type="button"
                className={`w-full bg-white border ${isSelected ? 'border-[#d61c24] ring-2 ring-[#d61c24]/10' : 'border-neutral-100 hover:border-neutral-200'} rounded-2xl p-4 flex items-center justify-between text-left transition-all duration-200 focus:outline-none active:scale-[0.99]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-full ${option.iconColor} flex items-center justify-center`}>
                    {option.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">{option.title}</h3>
                    <span className="text-3xs text-neutral-400 font-medium leading-none">{option.description}</span>
                  </div>
                </div>
                
                {/* Arrow chevron symbol */}
                <svg className={`w-4 h-4 transition-colors ${isSelected ? 'text-[#d61c24]' : 'text-neutral-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trust privacy badge and Continue call button */}
      <div className="flex flex-col gap-4 mt-6">
        
        {/* Your safety is our priority banner */}
        <div className="bg-green-50/50 rounded-2xl border border-green-100 p-4 flex items-start gap-3.5">
          <div className="bg-green-100/70 p-2 rounded-full mt-0.5 text-green-600 flex-shrink-0">
            <svg className="w-4 h-4 fill-none stroke-current" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-850">Your safety is our priority</h4>
            <p className="text-3xs text-neutral-400 font-medium leading-relaxed mt-0.5">
              Your location will be shared with verified responders. We're here to help you.
            </p>
          </div>
        </div>

        {/* Continue Call Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedId}
          type="button"
          className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-md ${
            selectedId 
              ? 'bg-[#d61c24] hover:bg-[#b31018] text-white shadow-red-500/10 cursor-pointer active:scale-[0.98]' 
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none'
          }`}
        >
          {/* Phone call icon */}
          <div className={`p-1 rounded-full ${selectedId ? 'bg-red-800' : 'bg-neutral-200'} flex items-center justify-center`}>
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </div>
          <span className="text-sm">Continue</span>
        </button>
      </div>

    </div>
  );
}
