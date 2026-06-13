import React, { useState, useEffect } from 'react';
import EmergencyType from './EmergencyType.jsx';
import Severity from './Severity.jsx';
import LocationContacts from './LocationContacts.jsx';

const resourceTypes = [
  { id: 'blood', name: 'Blood Donor', iconColor: 'text-red-500 bg-red-50', icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  { id: 'food', name: 'Food Relief', iconColor: 'text-amber-500 bg-amber-50', icon: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3h-3v7h3V6zm0 10h-3v6h3v-6zm4-10h-3v16h3V6z' },
  { id: 'shelter', name: 'Shelter', iconColor: 'text-blue-500 bg-blue-50', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { id: 'volunteer', name: 'Volunteer', iconColor: 'text-emerald-500 bg-emerald-50', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
  { id: 'medicine', name: 'Medicine', iconColor: 'text-teal-500 bg-teal-50', icon: 'M6 3h12v2H6zm11 3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 9h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z' },
  { id: 'transport', name: 'Transport', iconColor: 'text-indigo-500 bg-indigo-50', icon: 'M19 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-14 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm13-6l-1.88-5.64c-.19-.57-.72-.96-1.32-.96H8.2c-.6 0-1.13.39-1.32.96L5 9v6c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V9zm-10.8 4c-.66 0-1.2-.54-1.2-1.2 0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2zm7.6 0c-.66 0-1.2-.54-1.2-1.2 0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2z' }
];

export default function Dashboard({ phone, selectedCountry, onLogout }) {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'resources' | 'sos' | 'profile'
  const [sosStep, setSosStep] = useState('type'); // 'type' | 'severity' | 'location-contacts' | 'processing' | 'tracking'
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  const [activeContacts, setActiveContacts] = useState([]);
  
  const [selectedFormResource, setSelectedFormResource] = useState(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [formInputs, setFormInputs] = useState({ 
    name: 'Bhawna', 
    contact: (selectedCountry ? selectedCountry.code : '+91') + ' ' + (phone || '98765 43210'), 
    address: 'Bhopal, MP', 
    description: '', 
    urgency: 'High' 
  });

  const [activeSosCancelled, setActiveSosCancelled] = useState(false);
  const [sosActiveSeconds, setSosActiveSeconds] = useState(0);

  // Reset SOS sub-flow steps when tab changes
  useEffect(() => {
    if (activeTab !== 'sos') {
      setSosStep('type');
      setSelectedEmergency(null);
      setSelectedSeverity(null);
      setActiveSosCancelled(false);
    }
  }, [activeTab]);

  // Active Emergency SOS seconds tracker
  useEffect(() => {
    let interval = null;
    if (activeTab === 'sos' && sosStep === 'tracking' && !activeSosCancelled) {
      interval = setInterval(() => {
        setSosActiveSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSosActiveSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeTab, sosStep, activeSosCancelled]);

  const handleResourceFormSubmit = (e) => {
    e.preventDefault();
    setRequestSubmitted(true);
    setTimeout(() => {
      setSelectedFormResource(null);
      setRequestSubmitted(false);
    }, 2200);
  };

  return (
    <>
      {/* Dashboard Core Header View */}
      {/* Do not show standard dashboard header if activeTab is SOS and we are in select configurations */}
      {!(activeTab === 'sos' && (sosStep === 'type' || sosStep === 'severity' || sosStep === 'location-contacts' || sosStep === 'processing')) && (
        <div className="flex justify-between items-center px-6 pt-5 pb-3 bg-white border-b border-neutral-50/50">
          <div>
            <h2 className="text-xs font-semibold text-neutral-400 tracking-wider">Good Evening,</h2>
            <h1 className="text-xl font-extrabold text-neutral-900 flex items-center gap-1.5 mt-0.5">
              Bhawna <span className="animate-bounce origin-bottom inline-block">👋</span>
            </h1>
            <div className="flex items-center gap-1 text-xs text-[#d61c24] mt-1.5 font-bold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Bhopal, Madhya Pradesh</span>
            </div>
          </div>
          
          {/* Avatar Image */}
          <div className="relative group cursor-pointer">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white ring-2 ring-red-500/10 group-hover:ring-red-500/30 transition-all duration-300">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none' }} className="w-full h-full bg-red-100 flex items-center justify-center text-red-700 font-black text-sm">
                BH
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
          </div>
        </div>
      )}

      {/* Scrollable Container Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 flex flex-col">
        <div className="flex-1 flex flex-col gap-5">
          
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <>
              {/* Emergency Profile verified banner */}
              <div className="w-full bg-white rounded-2xl border border-neutral-100 shadow-md shadow-neutral-100/50 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">Emergency Profile</h3>
                  <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-green-600 mt-1">
                    Verified
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </span>
                </div>
                
                <div className="text-right w-1/2">
                  <div className="flex justify-between items-center text-3xs font-semibold text-neutral-400 mb-1">
                    <span>Complete Contacts</span>
                    <span className="font-extrabold text-neutral-800">90%</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-50 h-full rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>
              </div>

              {/* Central SOS Button */}
              <div className="w-full bg-white rounded-3xl border border-neutral-100 shadow-md shadow-neutral-100/50 p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute w-[240px] h-[240px] rounded-full bg-red-500/5 filter blur-2xl animate-pulse" />
                <button
                  onClick={() => {
                    setActiveTab('sos');
                    setSosStep('type');
                  }}
                  type="button"
                  className="relative w-36 h-36 rounded-full bg-red-50 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 group focus:outline-none"
                >
                  <div className="absolute inset-2 rounded-full border border-red-200 animate-ping opacity-20 pointer-events-none" />
                  <div className="absolute inset-0 rounded-full bg-red-100 scale-95 group-hover:scale-100 transition-all duration-300 pointer-events-none" />
                  
                  <div className="absolute inset-3 rounded-full bg-[#d61c24] flex flex-col items-center justify-center shadow-lg shadow-red-500/30 text-white z-10">
                    <span className="text-3xl font-black tracking-wider leading-none">SOS</span>
                    <span className="text-[9px] font-black uppercase tracking-widest mt-1.5 text-red-100">Tap for Help</span>
                  </div>
                </button>
              </div>

              {/* Quick Resources */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-neutral-850">Quick Resources</h3>
                  <button 
                    onClick={() => setActiveTab('resources')}
                    className="text-2xs font-extrabold text-blue-600 hover:underline hover:text-blue-700 transition-colors"
                  >
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {resourceTypes.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setSelectedFormResource(res)}
                      type="button"
                      className="bg-white hover:bg-red-50/20 border border-neutral-100 hover:border-red-100 rounded-xl p-3.5 flex flex-col items-center text-center transition-all duration-200 focus:outline-none active:scale-[0.97]"
                    >
                      <div className={`p-2.5 rounded-full ${res.iconColor} mb-2`}>
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d={res.icon} />
                        </svg>
                      </div>
                      <span className="text-3xs font-extrabold text-neutral-700 tracking-tight leading-snug">
                        {res.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nearby Resources */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-neutral-850">Nearby Resources</h3>
                  <button 
                    onClick={() => setActiveTab('resources')}
                    className="text-2xs font-extrabold text-blue-600 hover:underline hover:text-blue-700 transition-colors"
                  >
                    View All
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  <div className="flex-shrink-0 bg-white border border-neutral-100 rounded-xl p-3 flex items-center gap-3 w-40">
                    <div className="p-2 rounded-lg bg-green-50 text-green-600">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-14 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm13-6l-1.88-5.64c-.19-.57-.72-.96-1.32-.96H8.2c-.6 0-1.13.39-1.32.96L5 9v6c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V9z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-2xs font-bold text-neutral-800">2 Ambulances</h4>
                      <span className="text-3xs text-neutral-400">Within 5 km</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 bg-white border border-neutral-100 rounded-xl p-3 flex items-center gap-3 w-40">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-2xs font-bold text-neutral-800">3 Hospitals</h4>
                      <span className="text-3xs text-neutral-400">Within 3 km</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 bg-white border border-neutral-100 rounded-xl p-3 flex items-center gap-3 w-40">
                    <div className="p-2 rounded-lg bg-red-50 text-red-600">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-2xs font-bold text-neutral-800">2 Blood Banks</h4>
                      <span className="text-3xs text-neutral-400">Within 4 km</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: RESOURCES DIRECTORY */}
          {activeTab === 'resources' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab('home')} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                <h2 className="text-lg font-bold text-neutral-800">Resources Directory</h2>
              </div>
              <p className="text-xs text-neutral-400">Select an emergency category below to log a resource request or find nearby support groups:</p>

              <div className="flex flex-col gap-3">
                {resourceTypes.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setSelectedFormResource(res)}
                    className="bg-white border border-neutral-100 rounded-2xl p-4 flex items-center justify-between text-left hover:border-red-100 hover:bg-red-50/10 transition-colors w-full focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${res.iconColor}`}>
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d={res.icon} />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-800">{res.name}</h4>
                        <span className="text-3xs text-neutral-400">Open request form for assistance</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SOS STEPS FLOW */}
          {activeTab === 'sos' && (
            <div className="flex-1 flex flex-col justify-between">
              
              {/* SUBSTEP 1: EMERGENCY TYPE SELECTION */}
              {sosStep === 'type' && (
                <EmergencyType 
                  onBack={() => setActiveTab('home')}
                  onContinue={(emergency) => {
                    setSelectedEmergency(emergency);
                    setSosStep('severity');
                  }}
                />
              )}

              {/* SUBSTEP 2: SEVERITY SELECTION */}
              {sosStep === 'severity' && (
                <Severity 
                  onBack={() => setSosStep('type')}
                  onSelect={(severity) => {
                    setSelectedSeverity(severity);
                    setSosStep('location-contacts');
                  }}
                />
              )}

              {/* SUBSTEP 3: LOCATION & CONTACTS CONFIRMATION */}
              {sosStep === 'location-contacts' && (
                <LocationContacts
                  onBack={() => setSosStep('severity')}
                  onConfirm={(contacts) => {
                    setActiveContacts(contacts);
                    setSosStep('processing');
                  }}
                />
              )}

              {/* SUBSTEP 4: REQUEST PROCESSING (Design Pending) */}
              {sosStep === 'processing' && (
                <div className="flex-1 flex flex-col justify-between items-center text-center p-4">
                  <div className="my-auto flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-6 relative">
                      <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
                      <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>

                    <h2 className="text-xl font-extrabold text-neutral-850 tracking-wide">Processing Request...</h2>
                    <p className="text-xs text-neutral-400 mt-2 max-w-[280px]">
                      Contacting nearest responders and establishing GPS tracking nodes.
                    </p>

                    {/* Simulation progress bar */}
                    <div className="w-56 bg-neutral-150 h-1.5 rounded-full overflow-hidden mt-6 relative">
                      <div className="bg-[#d61c24] h-full rounded-full animate-[progress-pulse_2s_infinite]" style={{ width: '40%' }} />
                    </div>
                  </div>

                  <button
                    onClick={() => setSosStep('tracking')}
                    type="button"
                    className="w-full py-3.5 bg-[#d61c24] hover:bg-[#b31018] text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 focus:outline-none"
                  >
                    <span>Continue to SOS Tracking</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}

              {/* SUBSTEP 5: LIVE DISTRESS BEACON TRACKER */}
              {sosStep === 'tracking' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  {!activeSosCancelled ? (
                    <>
                      <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-6 relative">
                        <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-25" />
                        <svg className="w-12 h-12 animate-wiggle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>

                      <h2 className="text-xl font-black text-red-650 tracking-wide uppercase">Active Emergency Mode</h2>
                      <div className="bg-red-500/20 text-red-600 font-extrabold px-4 py-1.5 rounded-full text-2xs tracking-widest mt-3 animate-pulse">
                        LIVE TRACKING EN ROUTE
                      </div>
                      
                      <div className="text-center mt-2.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-3xs font-bold text-red-750">
                        Type: {selectedEmergency ? selectedEmergency.title : 'General'} | Severity: {selectedSeverity ? selectedSeverity.toUpperCase() : 'Critical'}
                      </div>
                      
                      <p className="text-xs text-neutral-400 mt-4 max-w-[280px]">
                        Distress beacons active. Your location has been shared with emergency responders.
                      </p>

                      {/* Display notified active contacts count */}
                      <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-4 w-full mt-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-2xs">
                          <span className="text-neutral-400">Duration Active</span>
                          <span className="font-extrabold text-neutral-800">{sosActiveSeconds}s</span>
                        </div>
                        <div className="flex items-center justify-between text-2xs">
                          <span className="text-neutral-400">Notified Contacts</span>
                          <span className="font-extrabold text-blue-650">{activeContacts.length} numbers</span>
                        </div>
                        <div className="flex items-center justify-between text-2xs">
                          <span className="text-neutral-400">Responder Dispatch Status</span>
                          <span className="font-extrabold text-green-500">Contacted</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveSosCancelled(true)}
                        type="button"
                        className="mt-8 bg-neutral-900 hover:bg-neutral-850 text-white font-bold px-8 py-3 rounded-xl text-xs transition-colors shadow-lg"
                      >
                        Cancel Active Distress
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </div>
                      <h2 className="text-lg font-bold text-neutral-800">Distress Beacons Cancelled</h2>
                      <p className="text-xs text-neutral-400 mt-2 max-w-[240px]">The emergency alert has been closed. Automatic coordinate logging is paused.</p>
                      
                      <button
                        onClick={() => { setActiveSosCancelled(false); setActiveTab('home'); }}
                        type="button"
                        className="mt-6 bg-[#d61c24] hover:bg-[#b31018] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
                      >
                        Return to Home
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab('home')} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                <h2 className="text-lg font-bold text-neutral-800">Emergency Profile</h2>
              </div>

              <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-4 flex flex-col gap-4 mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-red-500">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-neutral-850">Bhawna</h3>
                    <span className="text-xs text-neutral-400">{(selectedCountry ? selectedCountry.code : '+91')} {phone || '98765 43210'}</span>
                    <div className="text-3xs font-extrabold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full inline-block mt-1">Verified Member</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-3 border-t border-neutral-200/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Medical Group</span>
                    <span className="font-bold text-neutral-800">O+ Positive</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Emergency Contact</span>
                    <span className="font-bold text-neutral-800">Dr. Sanjiv (+91 99887 76655)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Address</span>
                    <span className="font-bold text-neutral-800">Bhopal, Madhya Pradesh</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                type="button"
                className="mt-6 border border-red-200 text-[#d61c24] hover:bg-red-50 font-bold py-3 rounded-xl text-xs transition-colors"
              >
                Logout Account
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Bottom Navigation Tab Bar */}
      <div className="bg-white border-t border-neutral-100/80 px-6 py-2.5 flex justify-between items-center z-20">
        <button
          onClick={() => setActiveTab('home')}
          type="button"
          className={`flex flex-col items-center gap-1.5 focus:outline-none transition-colors w-14 ${activeTab === 'home' ? 'text-[#d61c24]' : 'text-neutral-400 hover:text-neutral-500'}`}
        >
          <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="text-3xs font-extrabold tracking-tight">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          type="button"
          className={`flex flex-col items-center gap-1.5 focus:outline-none transition-colors w-14 ${activeTab === 'resources' ? 'text-[#d61c24]' : 'text-neutral-400 hover:text-neutral-500'}`}
        >
          <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
          </svg>
          <span className="text-3xs font-extrabold tracking-tight">Resources</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('sos');
            setSosStep('type');
          }}
          type="button"
          className="relative flex flex-col items-center justify-center focus:outline-none transition-transform active:scale-95 z-30 w-16 -mt-6"
        >
          <div className="w-13 h-13 rounded-full bg-[#d61c24] flex items-center justify-center text-white shadow-lg shadow-red-500/30 border-4 border-white font-extrabold text-[10px] tracking-wider uppercase">
            SOS
          </div>
          <span className={`text-3xs font-extrabold tracking-tight mt-1 ${activeTab === 'sos' ? 'text-[#d61c24]' : 'text-neutral-400'}`}>SOS</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          type="button"
          className={`flex flex-col items-center gap-1.5 focus:outline-none transition-colors w-14 ${activeTab === 'profile' ? 'text-[#d61c24]' : 'text-neutral-400 hover:text-neutral-500'}`}
        >
          <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span className="text-3xs font-extrabold tracking-tight">Profile</span>
        </button>
      </div>

      {/* QUICK RESOURCE DETAIL INPUT FORM OVERLAY MODAL */}
      {selectedFormResource && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-100 shadow-2xl p-6 relative flex flex-col scale-up-animation">
            
            <button
              onClick={() => setSelectedFormResource(null)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full transition-colors focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {requestSubmitted ? (
              <div className="py-8 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-neutral-800">Request Registered</h3>
                <p className="text-xs text-neutral-400 mt-2">
                  Your requirements for <span className="font-semibold text-neutral-700">{selectedFormResource.name}</span> have been uploaded. Nearby responders are being notified.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResourceFormSubmit} className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-800">Request {selectedFormResource.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1">Please confirm your emergency details below:</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Your Name</label>
                    <input 
                      type="text" 
                      required
                      value={formInputs.name}
                      onChange={(e) => setFormInputs({...formInputs, name: e.target.value})}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Contact Number</label>
                    <input 
                      type="text" 
                      required
                      value={formInputs.contact}
                      onChange={(e) => setFormInputs({...formInputs, contact: e.target.value})}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Current Location / Address</label>
                    <input 
                      type="text" 
                      required
                      value={formInputs.address}
                      onChange={(e) => setFormInputs({...formInputs, address: e.target.value})}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Requirements Details</label>
                    <textarea 
                      required
                      rows={2.5}
                      placeholder="Specify quantities, prescriptions, or blood group details..."
                      value={formInputs.description}
                      onChange={(e) => setFormInputs({...formInputs, description: e.target.value})}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800 resize-none" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Urgency Level</label>
                    <select
                      value={formInputs.urgency}
                      onChange={(e) => setFormInputs({...formInputs, urgency: e.target.value})}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800 cursor-pointer"
                    >
                      <option value="Critical SOS">Critical SOS (Immediate Beacon)</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium</option>
                      <option value="Routine">Routine Request</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="mt-2 w-full bg-[#d61c24] hover:bg-[#b31018] text-white py-3 rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 active:scale-95"
                >
                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  <span>Submit Assistance Request</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
