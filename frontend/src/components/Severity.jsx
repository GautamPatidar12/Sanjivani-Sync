import React, { useState } from 'react';

const severityLevels = [
  {
    id: 'minor',
    title: 'Minor',
    description: 'No immediate danger',
    borderColor: 'border-green-100 hover:border-green-200',
    activeColor: 'border-green-500 ring-green-500/10',
    iconColor: 'bg-green-50 text-green-600',
    icon: (
      <svg className="w-6 h-6 fill-none stroke-current" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    id: 'serious',
    title: 'Serious',
    description: 'Urgent attention needed',
    borderColor: 'border-orange-100 hover:border-orange-200',
    activeColor: 'border-orange-500 ring-orange-500/10',
    iconColor: 'bg-orange-50 text-orange-500',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth={2} stroke="currentColor" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01" />
      </svg>
    )
  },
  {
    id: 'critical',
    title: 'Critical',
    description: 'Life-threatening',
    borderColor: 'border-red-100 hover:border-red-200',
    activeColor: 'border-red-500 ring-red-500/10',
    iconColor: 'bg-red-50 text-red-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth={2} stroke="currentColor" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01" />
      </svg>
    )
  }
];

export default function Severity({ onBack, onSelect }) {
  const [clickedId, setClickedId] = useState(null);

  const handleCardClick = (id) => {
    setClickedId(id);
    // Add a small 200ms delay to show the active click feedback before redirecting
    setTimeout(() => {
      onSelect(id);
    }, 200);
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-xl mx-auto w-full md:bg-white/60 md:backdrop-blur-xl md:border md:border-neutral-100/60 md:shadow-xl md:shadow-neutral-250/20 md:rounded-3xl md:p-8">
      
      {/* Top back button and title header */}
      <div>
        <button 
          onClick={onBack}
          className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-800 transition-colors focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight mt-6">
          How severe is the situation?
        </h1>

        {/* Severity levels list */}
        <div className="flex flex-col gap-4 mt-6">
          {severityLevels.map((lvl) => {
            const isActive = clickedId === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => handleCardClick(lvl.id)}
                type="button"
                className={`w-full bg-white border ${
                  isActive ? lvl.activeColor + ' ring-2 scale-[0.99]' : lvl.borderColor
                } rounded-2xl p-5 flex items-center justify-between text-left transition-all duration-200 focus:outline-none`}
              >
                <div className="flex items-center gap-4.5">
                  <div className={`w-11 h-11 rounded-full ${lvl.iconColor} flex items-center justify-center flex-shrink-0`}>
                    {lvl.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-neutral-850 leading-tight">
                      {lvl.title}
                    </h3>
                    <span className="text-3xs text-neutral-400 font-medium leading-none">
                      {lvl.description}
                    </span>
                  </div>
                </div>
                
                {/* Arrow chevron */}
                <svg className={`w-4 h-4 ${isActive ? 'text-[#d61c24]' : 'text-neutral-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* Information text panel at the bottom */}
      <div className="bg-neutral-50 rounded-2xl border border-neutral-100/60 p-4 text-center mt-6">
        <p className="text-xs font-semibold text-neutral-500 leading-relaxed max-w-[280px] mx-auto">
          Your response helps us prioritize and send faster help.
        </p>
      </div>

    </div>
  );
}
