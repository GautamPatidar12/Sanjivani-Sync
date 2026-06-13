import React, { useState, useEffect } from 'react';

export default function ProfilePage({ user, onUserUpdate, onLogout }) {
  const [activeModal, setActiveModal] = useState(null); // null | 'personal' | 'contacts' | 'medical' | 'volunteer' | 'verification' | 'settings'
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // State forms
  const [personalForm, setPersonalForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    address: user?.location?.address || '',
    dob: user?.dob || '',
  });

  const [contactsList, setContactsList] = useState(
    user?.emergencyContacts && user.emergencyContacts.length > 0
      ? user.emergencyContacts
      : [
          { name: 'Dr. Sanjiv', phone: '+91 99887 76655', relation: 'Doctor' },
          { name: 'Rajesh Kumar', phone: '+91 98765 00001', relation: 'Father' },
          { name: 'Sunita Sharma', phone: '+91 98765 00002', relation: 'Mother' },
        ]
  );

  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });

  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: user?.notificationSettings?.pushEnabled ?? true,
    smsEnabled: user?.notificationSettings?.smsEnabled ?? true,
    soundType: user?.notificationSettings?.soundType ?? 'siren',
  });

  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');

  // Sync states with incoming user prop updates
  useEffect(() => {
    if (user) {
      setPersonalForm({
        name: user.name || '',
        email: user.email || '',
        contactNumber: user.contactNumber || '',
        address: user.location?.address || '',
        dob: user.dob || '',
      });
      if (user.emergencyContacts) {
        setContactsList(user.emergencyContacts);
      }
      if (user.notificationSettings) {
        setNotificationSettings({
          pushEnabled: user.notificationSettings.pushEnabled ?? true,
          smsEnabled: user.notificationSettings.smsEnabled ?? true,
          soundType: user.notificationSettings.soundType ?? 'siren',
        });
      }
    }
  }, [user]);

  // Show visual toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // 1. Save Personal Information (PUT /api/auth/profile)
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          name: personalForm.name,
          email: personalForm.email,
          contactNumber: personalForm.contactNumber,
          dob: personalForm.dob,
          location: {
            address: personalForm.address,
            coordinates: user?.location?.coordinates?.coordinates || [77.4126, 23.2599]
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      onUserUpdate(data);
      showToast('Profile updated successfully!');
      setActiveModal(null);
    } catch (err) {
      setErrorMsg(err.message || 'Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Save Emergency Contacts (PUT /api/auth/profile)
  const saveEmergencyContacts = async (updatedList) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          emergencyContacts: updatedList
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update emergency contacts');
      }

      onUserUpdate(data);
      showToast('Emergency contacts updated!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save changes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new emergency contact
  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    const updatedList = [...contactsList, newContact];
    setContactsList(updatedList);
    setNewContact({ name: '', phone: '', relation: '' });
    await saveEmergencyContacts(updatedList);
  };

  // Delete an emergency contact
  const handleDeleteContact = async (index) => {
    const updatedList = [...contactsList];
    updatedList.splice(index, 1);
    setContactsList(updatedList);
    await saveEmergencyContacts(updatedList);
  };

  // 3. Save Government ID Verification (PUT /api/auth/profile)
  const handleVerifyId = async (e) => {
    e.preventDefault();
    if (!idNumber) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          isIdVerified: true
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to verify ID');
      }

      onUserUpdate(data);
      showToast('ID verification successful!');
    } catch (err) {
      setErrorMsg(err.message || 'Verification connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Save Notification Settings (PUT /api/auth/profile)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          notificationSettings
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update settings');
      }

      onUserUpdate(data);
      showToast('Notification settings saved!');
      setActiveModal(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareInvite = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('Join me on Sanjivani Sync and earn emergency support tokens! Use code: SH12345').then(() => {
        showToast('Invite text copied!');
      });
    }
  };

  const isVolunteer = user?.role === 'helper' || user?.role === 'organization';

  return (
    <div className="flex-1 flex flex-col justify-between items-center px-4 py-4 md:py-8 max-w-md md:max-w-4xl mx-auto w-full h-full bg-white select-none relative z-10 overflow-y-auto no-scrollbar">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-neutral-800 scale-up-animation">
          {toastMessage}
        </div>
      )}

      {/* Grid wrapper for mobile/desktop layout */}
      <div className="w-full flex-1 flex flex-col md:grid md:grid-cols-[45%_55%] md:gap-10 items-stretch justify-start my-auto">
        
        {/* Left column (Primary Profile card, metrics, invite) */}
        <div className="flex flex-col gap-5">
          {/* User Detail Card wrapper */}
          <div className="bg-neutral-50/50 border border-neutral-100 rounded-3xl p-5 shadow-sm relative flex flex-col">
            
            <div className="flex items-center gap-4">
              {/* Profile image with camera icon */}
              <div className="relative group cursor-pointer">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white ring-2 ring-red-500/10">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-neutral-150 rounded-full flex items-center justify-center text-neutral-500 shadow hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3.2"/>
                    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                  </svg>
                </div>
              </div>

              {/* Identity details */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-extrabold text-neutral-850 leading-tight">
                    {user?.name || 'Bhavna Singh'}
                  </h3>
                  {/* Blue badge */}
                  <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                
                <span className="text-3xs font-semibold text-neutral-450 leading-none block mt-1">
                  {user?.contactNumber || '+91 98765 43210'}
                </span>
                
                <span className="text-3xs font-semibold text-neutral-450 leading-none block mt-1 text-ellipsis overflow-hidden whitespace-nowrap max-w-[170px]">
                  {user?.email || 'bhavna.singh@email.com'}
                </span>

                {/* Verified user tag */}
                {user?.isIdVerified ? (
                  <div className="mt-2.5 flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full w-fit">
                    <span>Verified User</span>
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-center gap-1 text-[10px] font-black text-amber-605 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit">
                    <span>Unverified Account</span>
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12S6.48 2 12 2zm1 14h-2v-6h-2v2h1v4zm0-8h-2V6h2v2z"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Edit button */}
              <button 
                onClick={() => setActiveModal('personal')}
                className="absolute top-5 right-5 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 px-2.5 py-1.5 rounded-lg text-3xs font-extrabold text-neutral-700 flex items-center gap-1 transition-all focus:outline-none"
              >
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                <span>Edit</span>
              </button>

            </div>

            {/* Metrics cards Strip */}
            <div className="grid grid-cols-3 gap-2 mt-5 border-t border-neutral-100 pt-5">
              {isVolunteer ? (
                <>
                  <div className="bg-white border border-neutral-100 rounded-xl p-2.5 text-center flex flex-col items-center">
                    <div className="w-6.5 h-6.5 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs">🛡️</div>
                    <span className="text-[9px] font-bold text-neutral-400 mt-1">Trust Score</span>
                    <p className="text-xs font-black text-neutral-800 mt-0.5">4.9/5</p>
                  </div>
                  <div className="bg-white border border-neutral-100 rounded-xl p-2.5 text-center flex flex-col items-center">
                    <div className="w-6.5 h-6.5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs">✔️</div>
                    <span className="text-[9px] font-bold text-neutral-400 mt-1">Helped</span>
                    <p className="text-xs font-black text-neutral-800 mt-0.5">7</p>
                  </div>
                  <div className="bg-white border border-neutral-100 rounded-xl p-2.5 text-center flex flex-col items-center">
                    <div className="w-6.5 h-6.5 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-xs">👥</div>
                    <span className="text-[9px] font-bold text-neutral-400 mt-1">Vol Hours</span>
                    <p className="text-xs font-black text-neutral-800 mt-0.5">32 hrs</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white border border-neutral-100 rounded-xl p-2.5 text-center flex flex-col items-center">
                    <div className="w-6.5 h-6.5 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs">🛡️</div>
                    <span className="text-[9px] font-bold text-neutral-400 mt-1">Trust Score</span>
                    <p className="text-xs font-black text-neutral-800 mt-0.5">5.0/5</p>
                  </div>
                  <div className="bg-white border border-neutral-100 rounded-xl p-2.5 text-center flex flex-col items-center">
                    <div className="w-6.5 h-6.5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs">📝</div>
                    <span className="text-[9px] font-bold text-neutral-400 mt-1">Requests</span>
                    <p className="text-xs font-black text-neutral-800 mt-0.5">4</p>
                  </div>
                  <div className="bg-white border border-neutral-100 rounded-xl p-2.5 text-center flex flex-col items-center">
                    <div className="w-6.5 h-6.5 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-xs">🤝</div>
                    <span className="text-[9px] font-bold text-neutral-400 mt-1">Helpers Met</span>
                    <p className="text-xs font-black text-neutral-800 mt-0.5">3</p>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Invite friends banner */}
          <div className="bg-[#f0f4ff]/70 border border-[#e0e8ff]/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#e0e8ff] text-[#1e50bb] flex items-center justify-center flex-shrink-0 text-base">🎁</div>
              <div>
                <h4 className="text-xs font-extrabold text-[#1e50bb]">Invite Friends</h4>
                <p className="text-[10px] text-neutral-450 font-semibold mt-0.5">Invite your friends and earn rewards</p>
              </div>
            </div>
            
            <button 
              onClick={handleShareInvite}
              type="button" 
              className="bg-[#1e50bb] hover:bg-[#1a449d] text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl shadow-md shadow-blue-500/10 focus:outline-none transition-colors"
            >
              Invite Now
            </button>
          </div>
        </div>

        {/* Right column (Submenu options list, logout, footer) */}
        <div className="flex flex-col justify-between pt-4 md:pt-0">
          <div className="bg-white md:bg-transparent border border-neutral-100 md:border-0 rounded-3xl p-3 md:p-0 flex flex-col gap-1 shadow-sm md:shadow-none">
            
            {/* Menu 1: Personal Info */}
            <button 
              onClick={() => setActiveModal('personal')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-neutral-50/70 border border-transparent hover:border-neutral-100/50 transition-all text-left focus:outline-none group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-650 flex items-center justify-center text-sm font-semibold">👤</div>
                <div>
                  <h4 className="text-xs font-extrabold text-neutral-800">Personal Information</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Name, Contact, Address, DOB</p>
                </div>
              </div>
              <span className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all">❯</span>
            </button>

            {/* Menu 2: Emergency Contacts */}
            <button 
              onClick={() => setActiveModal('contacts')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-neutral-50/70 border border-transparent hover:border-neutral-100/50 transition-all text-left focus:outline-none group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-sm font-semibold">📞</div>
                <div>
                  <h4 className="text-xs font-extrabold text-neutral-800">Emergency Contacts</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{contactsList.length} contacts</p>
                </div>
              </div>
              <span className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all">❯</span>
            </button>

            {/* Menu 3: Verification Status */}
            <button 
              onClick={() => setActiveModal('verification')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-neutral-50/70 border border-transparent hover:border-neutral-100/50 transition-all text-left focus:outline-none group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-cyan-50 text-cyan-605 flex items-center justify-center text-sm font-semibold">🪪</div>
                <div>
                  <h4 className="text-xs font-extrabold text-neutral-800">Verification Status</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {user?.isIdVerified ? 'Government ID Verified' : 'Verify ID Status'}
                  </p>
                </div>
              </div>
              <span className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all">❯</span>
            </button>

            {/* Menu 4: Settings */}
            <button 
              onClick={() => setActiveModal('settings')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-neutral-50/70 border border-transparent hover:border-neutral-100/50 transition-all text-left focus:outline-none group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-sm font-semibold">⚙️</div>
                <div>
                  <h4 className="text-xs font-extrabold text-neutral-800">Settings</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Notification Settings</p>
                </div>
              </div>
              <span className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all">❯</span>
            </button>

          </div>

          {/* Logout centered row */}
          <div className="w-full flex flex-col items-center gap-2 mt-8 md:mt-12">
            <button 
              onClick={onLogout}
              className="flex items-center justify-center gap-2 hover:bg-red-50/45 px-6 py-2.5 rounded-xl border border-red-100/50 text-[#d61c24] font-extrabold text-xs transition-colors focus:outline-none"
            >
              <span>🚪</span>
              <span>Logout Account</span>
            </button>
            <span className="text-4xs text-neutral-400 font-semibold tracking-wider uppercase mt-1">App Version 2.1.0</span>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* OVERLAY MODAL 1: PERSONAL INFORMATION */}
      {activeModal === 'personal' && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-100 shadow-2xl p-6 relative flex flex-col scale-up-animation">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full transition-colors focus:outline-none">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-base font-extrabold text-neutral-800">Personal Information</h3>
            <p className="text-xs text-neutral-400 mt-1">View and update your contact records:</p>

            {errorMsg && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-100 rounded-lg text-3xs font-bold text-red-655 text-center">{errorMsg}</div>
            )}

            <form onSubmit={handleSavePersonal} className="flex flex-col gap-3 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={personalForm.name}
                  onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={personalForm.email}
                  onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Phone Number</label>
                <input 
                  type="text" 
                  required
                  value={personalForm.contactNumber}
                  onChange={(e) => setPersonalForm({ ...personalForm, contactNumber: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Home Location</label>
                <input 
                  type="text" 
                  required
                  value={personalForm.address}
                  onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Date of Birth (DOB)</label>
                <input 
                  type="date" 
                  required
                  value={personalForm.dob}
                  onChange={(e) => setPersonalForm({ ...personalForm, dob: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800" 
                />
              </div>

              <div className="flex gap-2.5 mt-3">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-150 text-neutral-600 font-extrabold rounded-xl text-2xs transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-[#1e50bb] hover:bg-[#1a449d] text-white font-extrabold rounded-xl text-2xs transition-colors shadow-md shadow-blue-500/10 flex items-center justify-center">
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 2: EMERGENCY CONTACTS */}
      {activeModal === 'contacts' && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-100 shadow-2xl p-6 relative flex flex-col scale-up-animation h-[480px]">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full transition-colors focus:outline-none">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-base font-extrabold text-neutral-800">Emergency Contacts</h3>
            <p className="text-xs text-neutral-400 mt-1">Configure your primary notification nodes:</p>

            {/* List scroll */}
            <div className="flex-1 overflow-y-auto no-scrollbar gap-2 flex flex-col mt-4">
              {contactsList.map((contact, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-neutral-100 bg-neutral-50/30">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 leading-tight">{contact.name}</h4>
                    <span className="text-[10px] text-neutral-400">{contact.relation} • {contact.phone}</span>
                  </div>
                  <button onClick={() => handleDeleteContact(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors text-2xs font-extrabold">Delete</button>
                </div>
              ))}
            </div>

            {/* Inline add form */}
            <form onSubmit={handleAddContact} className="border-t border-neutral-100 pt-4 mt-3 flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Add Contact</span>
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="text" 
                  placeholder="Name" 
                  required
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="text-xs font-semibold px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-red-500" 
                />
                <input 
                  type="text" 
                  placeholder="Phone" 
                  required
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="text-xs font-semibold px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-red-500" 
                />
                <input 
                  type="text" 
                  placeholder="Relation" 
                  value={newContact.relation}
                  onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                  className="text-xs font-semibold px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-red-500" 
                />
              </div>
              <button type="submit" className="w-full py-2 bg-[#1e50bb] hover:bg-[#1a449d] text-white text-3xs font-extrabold rounded-lg tracking-wider uppercase mt-1 shadow focus:outline-none">
                Add Contact Node
              </button>
            </form>
          </div>
        </div>
      )}
      {activeModal === 'verification' && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-100 shadow-2xl p-6 relative flex flex-col scale-up-animation items-center">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full transition-colors focus:outline-none">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            {user?.isIdVerified ? (
              <div className="w-full flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4 text-2xl shadow-inner">
                  🪪
                </div>
                
                <h3 className="text-base font-extrabold text-neutral-850">Identity Verified</h3>
                <p className="text-xs text-neutral-450 mt-1.5 max-w-[260px] leading-relaxed mx-auto">
                  Your government identity record has been verified against databases.
                </p>

                <div className="w-full bg-neutral-50 border border-neutral-150 rounded-2xl px-4 py-3 mt-5 text-left flex flex-col gap-1.5">
                  <div className="flex justify-between text-2xs">
                    <span className="text-neutral-400">ID Reference Number</span>
                    <span className="font-extrabold text-neutral-800">XXXX XXXX 5678</span>
                  </div>
                  <div className="flex justify-between text-2xs">
                    <span className="text-neutral-400">Full Verified Name</span>
                    <span className="font-extrabold text-neutral-800">{user?.name || 'Bhavna Singh'}</span>
                  </div>
                  <div className="flex justify-between text-2xs">
                    <span className="text-neutral-400">Timestamp</span>
                    <span className="font-extrabold text-neutral-800">2026-06-01 10:24</span>
                  </div>
                  <div className="flex justify-between text-2xs">
                    <span className="text-neutral-400">Status</span>
                    <span className="font-extrabold text-green-600">Active / Verified</span>
                  </div>
                </div>

                <button onClick={() => setActiveModal(null)} className="mt-6 w-full bg-[#1e50bb] hover:bg-[#1a449d] text-white py-3 rounded-xl font-bold transition-all text-xs focus:outline-none shadow-md shadow-blue-500/10">
                  Done
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 text-2xl shadow-inner mx-auto">
                  🪪
                </div>
                
                <h3 className="text-base font-extrabold text-neutral-850 text-center">Verify Identity</h3>
                <p className="text-xs text-neutral-455 mt-1.5 leading-relaxed text-center">
                  Verify your account with a government-issued ID card to increase trust.
                </p>

                {errorMsg && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg text-3xs font-bold text-red-655 text-center">{errorMsg}</div>
                )}

                <form onSubmit={handleVerifyId} className="flex flex-col gap-3.5 mt-5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Select ID Type</label>
                    <select 
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-blue-500 text-neutral-850"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="VoterId">Voter ID Card</option>
                      <option value="PanCard">PAN Card</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Government ID Number</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 12-digit Aadhaar / Passport no."
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-blue-500 text-neutral-850" 
                    />
                  </div>

                  <div className="flex gap-2.5 mt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-150 text-neutral-600 font-extrabold rounded-xl text-2xs transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-[#1e50bb] hover:bg-[#1a449d] text-white font-extrabold rounded-xl text-2xs transition-colors shadow-md shadow-blue-500/10 flex items-center justify-center">
                      {isLoading ? 'Verifying...' : 'Verify Now'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 6: SETTINGS */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-100 shadow-2xl p-6 relative flex flex-col scale-up-animation">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full transition-colors focus:outline-none">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-base font-extrabold text-neutral-850">Notification Settings</h3>
            <p className="text-xs text-neutral-400 mt-1">Configure emergency alerts preferences:</p>

            {errorMsg && (
              <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg text-3xs font-bold text-red-655 text-center">{errorMsg}</div>
            )}

            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4 mt-4">
              
              {/* Push Notifications Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl">
                <div>
                  <span className="text-2xs font-extrabold text-neutral-800">Push Notifications</span>
                  <p className="text-[9px] text-neutral-400 mt-0.5">Receive immediate alerts for distress requests</p>
                </div>
                
                {/* Custom Switch checkbox toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.pushEnabled}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, pushEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              {/* SMS Notifications Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl">
                <div>
                  <span className="text-2xs font-extrabold text-neutral-800">SMS Alerts</span>
                  <p className="text-[9px] text-neutral-400 mt-0.5">Send notification SMS messages to contacts</p>
                </div>
                
                {/* Custom Switch checkbox toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.smsEnabled}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, smsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              {/* Sound alert dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Distress Ringtone/Alert Sound</label>
                <select 
                  value={notificationSettings.soundType}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, soundType: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-blue-500 text-neutral-850"
                >
                  <option value="siren">Emergency Ambulance Siren</option>
                  <option value="high-pitch">High-Pitch Chime</option>
                  <option value="chime">Subtle Alert Chime</option>
                  <option value="default">System Default Vibration</option>
                </select>
              </div>

              <div className="flex gap-2.5 mt-2.5">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-150 text-neutral-600 font-extrabold rounded-xl text-2xs transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-[#1e50bb] hover:bg-[#1a449d] text-white font-extrabold rounded-xl text-2xs transition-colors shadow-md shadow-blue-500/10">
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
