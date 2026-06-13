import React, { useState, useEffect } from 'react';
import EmergencyType from './EmergencyType.jsx';
import Severity from './Severity.jsx';
import LocationContacts from './LocationContacts.jsx';
import NotificationsFeed from './NotificationsFeed.jsx';

const resourceTypes = [
  { id: 'blood', name: 'Blood Donor', iconColor: 'text-red-500 bg-red-50', icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  { id: 'food', name: 'Food Relief', iconColor: 'text-amber-500 bg-amber-50', icon: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3h-3v7h3V6zm0 10h-3v6h3v-6zm4-10h-3v16h3V6z' },
  { id: 'shelter', name: 'Shelter', iconColor: 'text-blue-500 bg-blue-50', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { id: 'volunteer', name: 'Volunteer', iconColor: 'text-emerald-500 bg-emerald-50', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
  { id: 'medicine', name: 'Medicine', iconColor: 'text-teal-500 bg-teal-50', icon: 'M6 3h12v2H6zm11 3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 9h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z' },
  { id: 'transport', name: 'Transport', iconColor: 'text-indigo-500 bg-indigo-50', icon: 'M19 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-14 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm13-6l-1.88-5.64c-.19-.57-.72-.96-1.32-.96H8.2c-.6 0-1.13.39-1.32.96L5 9v6c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V9zm-10.8 4c-.66 0-1.2-.54-1.2-1.2 0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2zm7.6 0c-.66 0-1.2-.54-1.2-1.2 0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2z' }
];

const severityLevels = [
  { id: 'minor', title: 'Minor', desc: 'No immediate danger', color: 'border-green-500 ring-green-500/10 text-green-650 bg-green-50' },
  { id: 'serious', title: 'Serious', desc: 'Urgent attention needed', color: 'border-orange-500 ring-orange-500/10 text-orange-600 bg-orange-50' },
  { id: 'critical', title: 'Critical', desc: 'Life-threatening', color: 'border-red-500 ring-red-500/10 text-red-600 bg-red-50' }
];

export default function Dashboard({ user, onLogout, currentHash }) {
  // Determine active Tab and SOS Step based on global URL hash
  let activeTab = 'home';
  let sosStep = 'type';

  if (currentHash === '#/dashboard') {
    activeTab = 'home';
  } else if (currentHash === '#/resources') {
    activeTab = 'resources';
  } else if (currentHash === '#/notifications') {
    activeTab = 'notifications';
  } else if (currentHash === '#/profile') {
    activeTab = 'profile';
  } else if (currentHash.startsWith('#/sos')) {
    activeTab = 'sos';
    if (currentHash === '#/sos/type') sosStep = 'type';
    else if (currentHash === '#/sos/severity') sosStep = 'severity';
    else if (currentHash === '#/sos/location-contacts') sosStep = 'location-contacts';
    else if (currentHash === '#/sos/processing') sosStep = 'processing';
    else if (currentHash === '#/sos/tracking') sosStep = 'tracking';
  }

  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  const [activeContacts, setActiveContacts] = useState([]);

  const [activeSosCancelled, setActiveSosCancelled] = useState(false);
  const [sosActiveSeconds, setSosActiveSeconds] = useState(0);

  // Providers Modal State
  const [selectedResourceCategory, setSelectedResourceCategory] = useState(null);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [isProvidersLoading, setIsProvidersLoading] = useState(false);
  const [isShowingResourceForm, setIsShowingResourceForm] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    name: user?.name || '',
    contactNumber: user?.contactNumber || '',
    address: user?.location?.address || '',
  });

  // Fetch providers when category is selected
  useEffect(() => {
    if (selectedResourceCategory) {
      const fetchProviders = async () => {
        setIsProvidersLoading(true);
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          let url = `${API_URL}/api/marketplace/${selectedResourceCategory.id}`;
          
          if (user?.location?.coordinates?.length === 2) {
            url += `?lng=${user.location.coordinates[0]}&lat=${user.location.coordinates[1]}`;
          }
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setAvailableProviders(data);
          } else {
            console.error("Failed to fetch providers");
            setAvailableProviders([]);
          }
        } catch (error) {
          console.error("Error fetching providers:", error);
          setAvailableProviders([]);
        } finally {
          setIsProvidersLoading(false);
        }
      };
      fetchProviders();
    }
  }, [selectedResourceCategory, user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editProfileForm.name,
          contactNumber: editProfileForm.contactNumber,
          location: { address: editProfileForm.address }
        })
      });
      if (response.ok) {
        setIsEditingProfile(false);
        alert('Profile updated successfully! Refresh to see changes globally.');
      } else {
        const data = await response.json();
        alert(data.message || 'Error updating profile');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Error updating profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Sync state variables reset when navigating away from SOS page
  useEffect(() => {
    if (activeTab !== 'sos') {
      setSelectedEmergency(null);
      setSelectedSeverity(null);
      setActiveSosCancelled(false);
    }
  }, [activeTab]);

  // Process SOS Request when hitting processing step
  useEffect(() => {
    if (activeTab === 'sos' && sosStep === 'processing') {
      const createRequest = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const token = localStorage.getItem('token');
          
          await fetch(`${API_URL}/api/help-requests`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              helpType: selectedEmergency?.id || 'volunteer',
              description: `Emergency Level: ${selectedSeverity?.title || 'Unknown'}`,
              urgency: selectedSeverity?.id || 'medium',
              location: {
                address: user?.location?.address || 'Current Location',
                coordinates: user?.location?.coordinates?.coordinates || [0, 0]
              }
            })
          });

          setTimeout(() => {
            window.location.hash = '#/sos/tracking';
          }, 2000);
        } catch (error) {
          console.error('Failed to create emergency request', error);
          setTimeout(() => {
            window.location.hash = '#/sos/tracking';
          }, 2000);
        }
      };

      createRequest();
    }
  }, [activeTab, sosStep, selectedEmergency, selectedSeverity, user]);

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
      setSelectedResourceCategory(null);
      setIsShowingResourceForm(false);
      setRequestSubmitted(false);
    }, 2200);
  };

  const isConfigRoute = activeTab === 'sos' && (sosStep === 'type' || sosStep === 'severity' || sosStep === 'location-contacts' || sosStep === 'processing');

  return (
    <div className="flex flex-col md:flex-row w-full h-full relative">
      {/* Navigation Sidebar (Desktop) / Bottom Bar (Mobile) */}
      <div className="bg-white/95 backdrop-blur-md border-t md:border-t-0 md:border-r border-neutral-200/60 px-2 sm:px-6 py-2 md:py-8 flex md:flex-col justify-around md:justify-start items-center md:items-start z-50 order-last md:order-first md:w-64 md:h-full shrink-0 md:gap-4 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] md:shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Desktop Logo Area */}
        <div className="hidden md:flex items-center gap-3 w-full mb-8 px-2">
          <div className="w-8 h-8 rounded-xl bg-[#d61c24] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-500/30">
            S
          </div>
          <span className="font-black text-lg tracking-tight text-neutral-900">Sanjivani <span className="text-[#d61c24]">Sync</span></span>
        </div>

        <button
          onClick={() => window.location.hash = '#/dashboard'}
          type="button"
          className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 focus:outline-none transition-all flex-1 md:flex-none md:w-full md:px-4 md:py-3.5 md:rounded-xl ${activeTab === 'home' ? 'text-[#d61c24] md:bg-red-50/50 md:shadow-sm md:shadow-red-500/5' : 'text-neutral-400 hover:text-neutral-500 md:hover:bg-neutral-50'}`}
        >
          <svg className="w-5.5 h-5.5 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="text-3xs md:text-sm font-extrabold tracking-tight">Home</span>
        </button>

        <button
          onClick={() => window.location.hash = '#/resources'}
          type="button"
          className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 focus:outline-none transition-all flex-1 md:flex-none md:w-full md:px-4 md:py-3.5 md:rounded-xl ${activeTab === 'resources' ? 'text-[#d61c24] md:bg-red-50/50 md:shadow-sm md:shadow-red-500/5' : 'text-neutral-400 hover:text-neutral-500 md:hover:bg-neutral-50'}`}
        >
          <svg className="w-5.5 h-5.5 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
          </svg>
          <span className="text-3xs md:text-sm font-extrabold tracking-tight">Resources</span>
        </button>

        <button
          onClick={() => window.location.hash = '#/notifications'}
          type="button"
          className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 focus:outline-none transition-all flex-1 md:flex-none md:w-full md:px-4 md:py-3.5 md:rounded-xl ${activeTab === 'notifications' ? 'text-[#d61c24] md:bg-red-50/50 md:shadow-sm md:shadow-red-500/5' : 'text-neutral-400 hover:text-neutral-500 md:hover:bg-neutral-50'}`}
        >
          <svg className="w-5.5 h-5.5 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          <span className="text-3xs md:text-sm font-extrabold tracking-tight">Alerts</span>
        </button>

        <button
          onClick={() => {
            window.location.hash = '#/sos/type';
          }}
          type="button"
          className="relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 focus:outline-none transition-all active:scale-95 z-30 flex-[1.2] md:flex-none -mt-6 md:mt-4 md:mb-2 md:w-full md:px-4 md:py-3 md:bg-[#d61c24] md:rounded-2xl md:text-white md:shadow-xl md:shadow-red-500/30 md:hover:bg-[#b31018] group"
        >
          <div className="w-12 h-12 md:w-7 md:h-7 rounded-full bg-[#d61c24] md:bg-transparent flex items-center justify-center text-white shadow-lg md:shadow-none shadow-red-500/30 border-4 border-white md:border-none font-extrabold text-[10px] md:text-xs tracking-wider uppercase group-hover:scale-110 transition-transform">
            SOS
          </div>
          <span className={`text-[9px] md:text-sm font-extrabold tracking-tight mt-1 md:mt-0 ${activeTab === 'sos' ? 'text-[#d61c24] md:text-white' : 'text-neutral-400 md:text-white'}`}>SOS</span>
        </button>

        <button
          onClick={() => window.location.hash = '#/profile'}
          type="button"
          className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 focus:outline-none transition-all flex-1 md:flex-none md:mt-auto md:px-4 md:py-3.5 md:rounded-xl ${activeTab === 'profile' ? 'text-[#d61c24] md:bg-red-50/50 md:shadow-sm md:shadow-red-500/5' : 'text-neutral-400 hover:text-neutral-500 md:hover:bg-neutral-50'}`}
        >
          <svg className="w-5.5 h-5.5 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span className="text-3xs md:text-sm font-extrabold tracking-tight">Profile</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Dashboard Core Header View */}
      {!isConfigRoute && (
        <div className="flex justify-between items-center px-6 pt-5 pb-3 bg-white border-b border-neutral-50/50">
          <div>
            <h2 className="text-xs font-semibold text-neutral-400 tracking-wider">Good Evening,</h2>
            <h1 className="text-xl font-extrabold text-neutral-900 flex items-center gap-1.5 mt-0.5">
              {user?.name || 'User'} <span className="animate-bounce origin-bottom inline-block">👋</span>
            </h1>
            <div className="flex items-center gap-1 text-xs text-[#d61c24] mt-1.5 font-bold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{user?.location?.address || 'Location Unknown'}</span>
            </div>
          </div>
          
          {/* Avatar Image */}
          <div className="relative group cursor-pointer">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white ring-2 ring-red-500/10 group-hover:ring-red-500/30 transition-all duration-300">
              <div className="w-full h-full bg-red-50 text-red-600 flex items-center justify-center relative overflow-hidden">
                <svg className="w-7 h-7 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
          </div>
        </div>
      )}

      {/* Scrollable Container Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 md:px-10 py-4 md:py-8 flex flex-col bg-neutral-50/30">
        <div className="flex-1 flex flex-col gap-5 h-full">
          
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="md:grid md:grid-cols-12 md:gap-8 flex flex-col gap-5 flex-1">
              {/* Left Primary Column */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                {/* Emergency Profile verified banner */}
                <div className="w-full bg-white/70 backdrop-blur-lg rounded-3xl border border-neutral-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 md:p-6 flex items-center justify-between transition-transform hover:-translate-y-0.5 duration-300">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">Emergency Profile</h3>
                    <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-green-600 mt-1">
                      Verified
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                  </div>
                  
                  <div className="text-right w-1/2 max-w-[200px]">
                    <div className="flex justify-between items-center text-3xs font-semibold text-neutral-400 mb-2">
                      <span>Profile Completeness</span>
                      <span className="font-extrabold text-neutral-800">90%</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full" style={{ width: '90%' }} />
                    </div>
                  </div>
                </div>

                {/* Central SOS Button Card */}
                <div className="w-full bg-gradient-to-br from-white to-red-50/30 rounded-[2rem] border border-red-100/50 shadow-[0_20px_60px_rgba(214,28,36,0.08)] p-10 md:p-14 flex flex-col items-center justify-center relative overflow-hidden group flex-1 min-h-[320px]">
                  <div className="absolute w-[400px] h-[400px] rounded-full bg-red-500/5 filter blur-3xl animate-pulse pointer-events-none" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-30" />
                  
                  <button
                    onClick={() => {
                      window.location.hash = '#/sos/type';
                    }}
                    type="button"
                    className="relative w-40 h-40 md:w-56 md:h-56 rounded-full bg-red-50 flex items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-105 active:scale-95 group focus:outline-none"
                  >
                    <div className="absolute inset-2 rounded-full border-2 border-red-200 animate-ping opacity-30 pointer-events-none" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-0 rounded-full bg-red-100/80 scale-[0.9] group-hover:scale-[0.98] transition-all duration-500 pointer-events-none" />
                    
                    <div className="absolute inset-4 md:inset-6 rounded-full bg-gradient-to-br from-[#e52a32] to-[#b31018] flex flex-col items-center justify-center shadow-[0_15px_35px_rgba(214,28,36,0.4)] text-white z-10 transition-shadow group-hover:shadow-[0_20px_50px_rgba(214,28,36,0.5)]">
                      <span className="text-4xl md:text-6xl font-black tracking-widest leading-none drop-shadow-md">SOS</span>
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest mt-2 md:mt-3 text-red-100/90">Press for Help</span>
                    </div>
                  </button>
                  <p className="text-xs md:text-sm text-neutral-400 font-semibold mt-10 md:mt-12 tracking-wide text-center max-w-[280px]">
                    Alert nearby responders and broadcast your location immediately.
                  </p>
                </div>
              </div>

              {/* Right Secondary Column */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                
                {/* Quick Resources Desktop Panel */}
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-neutral-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 md:p-6 flex flex-col gap-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm md:text-base font-extrabold text-neutral-850">Quick Resources</h3>
                    <button 
                      onClick={() => window.location.hash = '#/resources'}
                      className="text-2xs md:text-xs font-extrabold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-full"
                    >
                      View All
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 md:gap-4 mt-2">
                    {resourceTypes.slice(0, 6).map((res) => (
                      <button
                        key={res.id}
                        onClick={() => setSelectedResourceCategory(res)}
                        type="button"
                        className="bg-neutral-50/50 hover:bg-white border border-neutral-100 hover:border-red-100 rounded-2xl p-3 md:p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:shadow-red-500/5 focus:outline-none hover:-translate-y-1"
                      >
                        <div className={`p-2.5 md:p-3 rounded-xl ${res.iconColor} mb-2 md:mb-3 shadow-inner`}>
                          <svg className="w-5 h-5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24">
                            <path d={res.icon} />
                          </svg>
                        </div>
                        <span className="text-[10px] md:text-xs font-extrabold text-neutral-700 tracking-tight leading-snug">
                          {res.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nearby Resources Panel */}
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-neutral-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 md:p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm md:text-base font-extrabold text-neutral-850">Nearby Alerts</h3>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-3 md:p-4 flex items-center gap-4 transition-all hover:border-green-200 hover:shadow-md cursor-pointer group">
                      <div className="p-2.5 md:p-3 rounded-xl bg-green-100 text-green-600 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M19 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-14 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm13-6l-1.88-5.64c-.19-.57-.72-.96-1.32-.96H8.2c-.6 0-1.13.39-1.32.96L5 9v6c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V9z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-neutral-800">2 Ambulances Active</h4>
                        <span className="text-[10px] md:text-xs font-semibold text-neutral-400">Within 5 km radius</span>
                      </div>
                    </div>

                    <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-3 md:p-4 flex items-center gap-4 transition-all hover:border-red-200 hover:shadow-md cursor-pointer group">
                      <div className="p-2.5 md:p-3 rounded-xl bg-red-100 text-red-600 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-neutral-800">Urgent Blood Required</h4>
                        <span className="text-[10px] md:text-xs font-semibold text-neutral-400">O+ Needed at City Hospital</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: RESOURCES DIRECTORY */}
          {activeTab === 'resources' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <button onClick={() => window.location.hash = '#/dashboard'} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                <h2 className="text-lg font-bold text-neutral-800">Resources Directory</h2>
              </div>
              <p className="text-xs text-neutral-400">Select an emergency category below to log a resource request or find nearby support groups:</p>

              <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
                {resourceTypes.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setSelectedResourceCategory(res)}
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

          {/* TAB 3: NOTIFICATIONS / ALERTS */}
          {activeTab === 'notifications' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <button onClick={() => window.location.hash = '#/dashboard'} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                <h2 className="text-lg font-bold text-neutral-800">Emergency Alerts</h2>
              </div>
              <p className="text-xs text-neutral-400">Nearby requests matching your capabilities.</p>
              
              {/* Notification Feed Component Placeholder - Will implement full logic next */}
              <NotificationsFeed />
            </div>
          )}

          {/* TAB 3: SOS STEPS FLOW */}
          {activeTab === 'sos' && (
            <div className="flex-1 flex flex-col items-center md:justify-center py-0 md:py-8 h-full">
              <div className="w-full md:max-w-md lg:max-w-lg bg-white/95 backdrop-blur-xl md:shadow-[0_20px_60px_rgba(214,28,36,0.08)] md:border border-red-100/50 rounded-[2.5rem] md:p-8 flex flex-col h-full md:h-auto overflow-hidden relative">
                {/* Desktop SOS Header Decoration */}
                <div className="hidden md:block absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-red-500 to-red-400" />
                <div className="hidden md:block absolute -top-20 -right-20 w-40 h-40 bg-red-100 rounded-full filter blur-3xl opacity-50 pointer-events-none" />
                
                <div className="flex-1 flex flex-col justify-between relative z-10 overflow-y-auto no-scrollbar">
              
              {/* SUBSTEP 1: EMERGENCY TYPE SELECTION */}
              {sosStep === 'type' && (
                <EmergencyType 
                  onBack={() => window.location.hash = '#/dashboard'}
                  onContinue={(emergency) => {
                    setSelectedEmergency(emergency);
                    window.location.hash = '#/sos/severity';
                  }}
                />
              )}

              {/* SUBSTEP 2: SEVERITY SELECTION */}
              {sosStep === 'severity' && (
                <Severity 
                  onBack={() => window.location.hash = '#/sos/type'}
                  onSelect={(severity) => {
                    setSelectedSeverity(severity);
                    window.location.hash = '#/sos/location-contacts';
                  }}
                />
              )}

              {/* SUBSTEP 3: LOCATION & CONTACTS CONFIRMATION */}
              {sosStep === 'location-contacts' && (
                <LocationContacts
                  onBack={() => window.location.hash = '#/sos/severity'}
                  onConfirm={(contacts) => {
                    setActiveContacts(contacts);
                    window.location.hash = '#/sos/processing';
                  }}
                />
              )}

              {/* SUBSTEP 4: REQUEST PROCESSING */}
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

                    <div className="w-56 bg-neutral-150 h-1.5 rounded-full overflow-hidden mt-6 relative">
                      <div className="bg-[#d61c24] h-full rounded-full animate-[progress-pulse_2s_infinite]" style={{ width: '40%' }} />
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.hash = '#/sos/tracking'}
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

                      <h2 className="text-xl font-black text-red-655 tracking-wide uppercase">Active Emergency Mode</h2>
                      <div className="bg-red-500/20 text-red-600 font-extrabold px-4 py-1.5 rounded-full text-2xs tracking-widest mt-3 animate-pulse">
                        LIVE TRACKING EN ROUTE
                      </div>
                      
                      <div className="text-center mt-2.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-3xs font-bold text-red-750">
                        Type: {selectedEmergency ? selectedEmergency.title : 'General'} | Severity: {selectedSeverity ? selectedSeverity.toUpperCase() : 'Critical'}
                      </div>
                      
                      <p className="text-xs text-neutral-400 mt-4 max-w-[280px]">
                        Distress beacons active. Your location has been shared with emergency responders.
                      </p>

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
                        onClick={() => {
                          setActiveSosCancelled(false);
                          window.location.hash = '#/dashboard';
                        }}
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
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="flex-1 flex flex-col gap-6 md:items-center">
              <div className="w-full md:max-w-2xl bg-white/80 backdrop-blur-lg md:rounded-[2rem] border-0 md:border border-neutral-100 shadow-none md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2 sm:p-6 md:p-10 flex flex-col gap-4 sm:gap-6 mt-0 md:mt-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <button onClick={() => window.location.hash = '#/dashboard'} className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-500 transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                  <h2 className="text-xl md:text-2xl font-black text-neutral-800 tracking-tight">Emergency Profile</h2>
                </div>

                <div className="bg-neutral-50/50 rounded-2xl border border-neutral-100 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 relative z-10">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg shadow-red-500/10 ring-2 ring-red-100 bg-red-50 text-red-600 flex items-center justify-center">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-neutral-850 tracking-tight">{user?.name || 'User'}</h3>
                      <span className="text-sm text-neutral-500 font-medium">{user?.email || 'user@example.com'}</span>
                      <div className="mt-2">
                        <span className="text-xs font-extrabold text-green-600 bg-green-50 px-3 py-1 rounded-full shadow-sm">Verified Member</span>
                      </div>
                    </div>
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 pt-5 border-t border-neutral-200/50">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">Full Name</label>
                        <input type="text" value={editProfileForm.name} onChange={e => setEditProfileForm({...editProfileForm, name: e.target.value})} className="w-full text-sm font-semibold px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-neutral-800" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">Contact Number</label>
                        <input type="text" value={editProfileForm.contactNumber} onChange={e => setEditProfileForm({...editProfileForm, contactNumber: e.target.value})} className="w-full text-sm font-semibold px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-neutral-800" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">Address</label>
                        <input type="text" value={editProfileForm.address} onChange={e => setEditProfileForm({...editProfileForm, address: e.target.value})} className="w-full text-sm font-semibold px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-neutral-800" />
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 rounded-xl text-xs transition-colors">Cancel</button>
                        <button disabled={isUpdatingProfile} type="submit" className="flex-1 bg-gradient-to-r from-[#d61c24] to-[#e53935] hover:from-[#b31018] hover:to-[#d32f2f] text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md shadow-red-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center">
                          {isUpdatingProfile ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : 'Save Profile'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4 pt-5 border-t border-neutral-200/50">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500 font-medium">Role</span>
                        <span className="font-bold text-neutral-800 uppercase tracking-wider">{user?.role || 'Requester'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500 font-medium">Contact Number</span>
                        <span className="font-bold text-neutral-800">{user?.contactNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500 font-medium">Address</span>
                        <span className="font-bold text-neutral-800 text-right max-w-[200px] md:max-w-xs">{user?.location?.address || 'Unknown'}</span>
                      </div>
                      <button onClick={() => setIsEditingProfile(true)} className="mt-2 w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-3 rounded-xl text-xs transition-colors">Edit Profile</button>
                    </div>
                  )}
                </div>

                <button
                  onClick={onLogout}
                  type="button"
                  className="mt-4 border-2 border-red-100 text-[#d61c24] hover:bg-red-50 font-bold py-3.5 rounded-xl text-sm transition-all shadow-sm active:scale-[0.98] relative z-10"
                >
                  Logout Account
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      </div>      {/* RESOURCE PROVIDERS MODAL */}
      {selectedResourceCategory && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="w-full md:max-w-xl bg-white/95 border border-blue-50 shadow-[0_20px_60px_rgba(37,99,235,0.12)] rounded-[2.5rem] p-6 md:p-8 relative flex flex-col scale-up-animation overflow-hidden max-h-[90vh]">
            
            {/* Header Decoration */}
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${selectedResourceCategory.id === 'blood' ? 'from-red-400 to-red-500' : 'from-blue-400 to-blue-500'}`} />
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-100 rounded-full filter blur-3xl opacity-60 pointer-events-none" />

            <button
              onClick={() => {
                setSelectedResourceCategory(null);
                setIsShowingResourceForm(false);
                setRequestSubmitted(false);
              }}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/80 rounded-full transition-colors focus:outline-none z-50 bg-white/50 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
              <div className="flex items-center gap-4">
                <div className={`p-3 md:p-4 rounded-2xl ${selectedResourceCategory.iconColor} shadow-inner`}>
                  <svg className="w-6 h-6 md:w-8 md:h-8 fill-current" viewBox="0 0 24 24">
                    <path d={selectedResourceCategory.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-neutral-850 tracking-tight">{isShowingResourceForm ? `Request ${selectedResourceCategory.name}` : `Available ${selectedResourceCategory.name}`}</h3>
                  <p className="text-xs md:text-sm text-neutral-400 mt-0.5 font-medium">{isShowingResourceForm ? 'Log a general request' : 'Nearby helpers and organizations.'}</p>
                </div>
              </div>
              {!isShowingResourceForm && (
                <button onClick={() => setIsShowingResourceForm(true)} className="hidden md:flex items-center gap-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New Request
                </button>
              )}
            </div>
            
            {!isShowingResourceForm && (
              <button onClick={() => setIsShowingResourceForm(true)} className="md:hidden w-full mb-4 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 px-4 py-3 rounded-xl transition-colors relative z-10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create New Request
              </button>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 flex flex-col gap-3">
              {isShowingResourceForm ? (
                requestSubmitted ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 scale-up-animation">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-neutral-800">Request Sent!</h2>
                    <p className="text-sm text-neutral-500 mt-2">Connecting with nearest available volunteers.</p>
                  </div>
                ) : (
                  <form onSubmit={handleResourceFormSubmit} className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-neutral-600">Urgency Level</label>
                      <select required className="w-full text-sm px-4 py-3 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-neutral-800 transition-all">
                        <option value="high">Critical / High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low / Planned</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-neutral-600">Additional Details</label>
                      <textarea required rows="3" placeholder="Any specific requirements..." className="w-full text-sm px-4 py-3 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-neutral-800 transition-all resize-none"></textarea>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button type="button" onClick={() => setIsShowingResourceForm(false)} className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3.5 rounded-xl text-sm transition-colors">Back</button>
                      <button type="submit" className={`flex-1 bg-gradient-to-r ${selectedResourceCategory.id === 'blood' ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-[0.98]`}>
                        Submit Request
                      </button>
                    </div>
                  </form>
                )
              ) : isProvidersLoading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-neutral-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-sm font-bold text-neutral-500 mt-4">Searching nearby providers...</span>
                </div>
              ) : availableProviders.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center bg-neutral-50/50 rounded-2xl border border-neutral-100">
                  <svg className="w-12 h-12 text-neutral-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-bold text-neutral-500">No active providers found in your area.</p>
                </div>
              ) : (
                availableProviders.map(provider => (
                  <div key={provider._id} className="bg-white border border-neutral-100 hover:border-blue-200 shadow-sm rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-neutral-800">{provider.name}</h4>
                        {provider.isOnline ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Online</span>
                        ) : (
                          <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">Offline</span>
                        )}
                      </div>
                      <p className="text-[10px] md:text-xs text-neutral-400 font-semibold mt-1">
                        {provider.orgType ? provider.orgType.toUpperCase().replace('_', ' ') : 'INDIVIDUAL HELPER'}
                      </p>
                      <p className="text-xs font-semibold text-neutral-600 mt-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {provider.location?.address || 'Location hidden'}
                      </p>
                    </div>
                    <a href={`tel:${provider.contactNumber}`} className="w-full md:w-auto bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 font-bold px-5 py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
                      Call Now
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
