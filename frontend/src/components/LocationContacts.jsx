import React, { useState } from 'react';

const mockContacts = [
  { name: 'Dr. Sanjiv (On-duty Responder)', relation: 'Doctor / Primary', phone: '+91 99887 76655', selected: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80' },
  { name: 'Rajesh Kumar', relation: 'Father', phone: '+91 98765 00001', selected: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80' },
  { name: 'Sunita Sharma', relation: 'Mother', phone: '+91 98765 00002', selected: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80' },
  { name: 'Amit Kumar', relation: 'Brother', phone: '+91 98765 00003', selected: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80' },
  { name: 'Pooja Sharma', relation: 'Sister', phone: '+91 98765 00004', selected: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80' }
];

export default function LocationContacts({ onBack, onConfirm }) {
  const [contacts, setContacts] = useState(mockContacts);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedContacts = contacts.filter(c => c.selected);

  const handleConfirm = () => {
    // Trigger browser vibration if supported
    if (navigator.vibrate) {
      navigator.vibrate([150, 100, 150]);
    }
    onConfirm(selectedContacts);
  };

  return (
    <div className="flex-1 flex flex-col justify-between relative max-w-xl mx-auto w-full md:bg-white/60 md:backdrop-blur-xl md:border md:border-neutral-100/60 md:shadow-xl md:shadow-neutral-250/20 md:rounded-3xl md:p-8">
      
      {/* Scrollable Container block */}
      <div>
        <button 
          onClick={onBack}
          className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-800 transition-colors focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight mt-4">
          Help us confirm your location
        </h1>

        {/* Vector SVG Map Panel */}
        <div className="w-full h-44 bg-neutral-100 border border-neutral-200/60 rounded-2xl overflow-hidden mt-5 relative shadow-inner">
          <svg className="w-full h-full" viewBox="0 0 400 176">
            {/* Background block fill */}
            <rect width="400" height="176" fill="#f4f4f5" />
            
            {/* New Market Park (green zone) */}
            <rect x="20" y="40" width="100" height="60" rx="8" fill="#dcfce7" />
            <text x="70" y="72" textAnchor="middle" fill="#15803d" fontSize="9" fontWeight="bold" fontFamily="system-ui">
              New Market Park
            </text>

            {/* Road lines grid */}
            <path d="M 0,20 L 400,20 M 0,110 L 400,110 M 0,150 L 400,150" fill="none" stroke="#e4e4e7" strokeWidth="8" />
            <path d="M 150,0 L 150,176 M 260,0 L 260,176 M 350,0 L 350,176" fill="none" stroke="#e4e4e7" strokeWidth="8" strokeDasharray="6 4" />
            
            {/* Landmark text labels */}
            <text x="200" y="35" textAnchor="middle" fill="#a1a1aa" fontSize="8" fontWeight="semibold">
              Shastri Market Colony
            </text>
            <text x="305" y="100" textAnchor="middle" fill="#a1a1aa" fontSize="8" fontWeight="semibold">
              M.P. Nagar
            </text>

            {/* Accuracy pulsing halo */}
            <circle cx="200" cy="85" r="22" fill="#3b82f6" fillOpacity="0.15">
              <animate attributeName="r" values="12;24;12" dur="3s" repeatCount="indefinite" />
              <animate attributeName="fillOpacity" values="0.25;0.05;0.25" dur="3s" repeatCount="indefinite" />
            </circle>
            
            {/* Locator core dot */}
            <circle cx="200" cy="85" r="7" fill="#2563eb" stroke="white" strokeWidth="2.5" />
          </svg>
        </div>

        {/* Location Detected Details Card */}
        <div className="w-full bg-white border border-neutral-100 rounded-2xl p-4 flex items-start gap-4.5 mt-4">
          <div className="w-11 h-11 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-green-600">Location Detected</h3>
            <p className="text-xs font-bold text-neutral-800 mt-1">New Market, Bhopal, MP</p>
            <span className="text-3xs text-neutral-450 font-medium leading-none mt-1.5 block">Accuracy: 10m</span>
          </div>
        </div>

        {/* Emergency Contacts Card: triggers modal checklist */}
        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="w-full bg-white border border-neutral-100 hover:border-neutral-200 rounded-2xl p-4 flex flex-col gap-4 mt-4 transition-all duration-200 text-left focus:outline-none"
        >
          <div className="flex items-start gap-4.5 w-full">
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-850">Emergency Contacts</h3>
              <p className="text-2xs text-neutral-400 mt-0.5">{selectedContacts.length} selected</p>
            </div>
          </div>

          {/* Contact photo avatars row */}
          <div className="flex items-center gap-2 pl-15">
            {selectedContacts.map((contact, idx) => (
              <div key={idx} className="relative w-8 h-8 rounded-full overflow-hidden border border-white ring-2 ring-neutral-100">
                <img 
                  src={contact.avatar} 
                  alt={contact.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none' }} className="w-full h-full bg-red-150 text-red-700 flex items-center justify-center text-3xs font-extrabold">
                  {contact.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            ))}
            
            {/* Remainder circle indicator */}
            {contacts.length - selectedContacts.length > 0 && (
              <div className="w-8 h-8 rounded-full bg-neutral-100 border border-white ring-2 ring-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                +{contacts.length - selectedContacts.length}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Confirm & Send Button */}
      <div className="flex flex-col gap-4 mt-6">
        <button
          onClick={handleConfirm}
          type="button"
          className="w-full bg-[#1e50bb] hover:bg-[#1a449d] text-white py-3.5 rounded-xl font-bold transition-all duration-300 text-sm shadow-md shadow-blue-500/10 flex items-center justify-center active:scale-98 focus:outline-none"
        >
          Confirm &amp; Send Request
        </button>
        <p className="text-2xs text-neutral-400 font-semibold text-center max-w-[280px] mx-auto leading-relaxed">
          We will notify your contacts and nearby responders.
        </p>
      </div>

      {/* PRE-CONFIGURED EMERGENCY CONTACTS DIRECTORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-100 shadow-2xl p-6 relative flex flex-col scale-up-animation">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full transition-colors focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-base font-extrabold text-neutral-800">Prefilled Contacts</h3>
            <p className="text-xs text-neutral-400 mt-1">Configured during your account setup:</p>

            <div className="flex flex-col gap-2.5 mt-4 max-h-56 overflow-y-auto pr-1">
              {contacts.map((contact, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    const updated = [...contacts];
                    updated[idx].selected = !updated[idx].selected;
                    setContacts(updated);
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-colors ${
                    contact.selected ? 'border-blue-500 bg-blue-50/20' : 'border-neutral-100 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-neutral-200">
                      <img 
                        src={contact.avatar} 
                        alt={contact.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div style={{ display: 'none' }} className="w-full h-full bg-red-100 text-red-700 flex items-center justify-center text-3xs font-extrabold">
                        {contact.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800 leading-tight">{contact.name}</h4>
                      <span className="text-3xs text-neutral-450 leading-none">{contact.relation} • {contact.phone}</span>
                    </div>
                  </div>

                  {/* Checkbox circle status */}
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    contact.selected ? 'bg-[#1e50bb] border-[#1e50bb] text-white' : 'border-neutral-350 bg-white'
                  }`}>
                    {contact.selected && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-5 w-full bg-[#1e50bb] hover:bg-[#1a449d] text-white py-3 rounded-xl font-bold transition-all duration-300 text-xs shadow-md shadow-blue-500/10"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
