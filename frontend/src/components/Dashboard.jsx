import React, { useState, useEffect, useRef } from 'react';
import EmergencyType from './EmergencyType.jsx';
import Severity from './Severity.jsx';
import LocationContacts from './LocationContacts.jsx';
import RequestProcessing from './RequestProcessing.jsx';
import LiveTracking from './LiveTracking.jsx';
import Listings from './Listings.jsx';

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
  } else if (currentHash === '#/listings') {
    activeTab = 'listings';
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

  const isLocked = activeTab === 'sos' && (sosStep === 'processing');

  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  const [activeContacts, setActiveContacts] = useState([]);
  const [createdRequestId, setCreatedRequestId] = useState(null);

  // 3-second hold SOS states
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(0);

  // Active alerts nearby (Give Help Console)
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  const [nearbyResources, setNearbyResources] = useState([
    { id: 'amb', title: 'Ambulances', count: 2, distance: 5, icon: 'M19 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-14 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm13-6l-1.88-5.64c-.19-.57-.72-.96-1.32-.96H8.2c-.6 0-1.13.39-1.32.96L5 9v6c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V9z', color: 'green' },
    { id: 'hosp', title: 'Hospitals', count: 3, distance: 3, icon: 'M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z', color: 'blue' },
    { id: 'bld', title: 'Blood Banks', count: 1, distance: 8, icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', color: 'red' }
  ]);

  useEffect(() => {
    if (activeTab === 'home') {
      const interval = setInterval(() => {
        setNearbyResources(prev => prev.map(res => {
          const newCount = Math.max(1, res.count + Math.floor(Math.random() * 3) - 1);
          const newDist = Math.max(1, res.distance + Math.floor(Math.random() * 3) - 1);
          return { ...res, count: newCount, distance: newDist };
        }));
        if (navigator.vibrate) navigator.vibrate(50);
        // Play subtle positive ping (base64 simple tick/ping)
        const audio = new Audio('data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTEAAAAcHR0eHh4fHx8fHyAgICAhISEhISEiIiIiIyMjIyMjJCQkJCUlJSUlJg==');
        audio.volume = 0.1;
        audio.play().catch(e => { }); // Ignore play errors (user interaction rules)
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const removeNearbyResource = (id) => {
    setNearbyResources(prev => prev.filter(res => res.id !== id));
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  };

  const [selectedFormResource, setSelectedFormResource] = useState(null);
  const [formInputs, setFormInputs] = useState({
    name: user?.name || 'User',
    contact: user?.contactNumber || '98765 43210',
    address: user?.location?.address || 'Unknown Address',
    description: '',
    urgency: 'high',
    bloodGroup: 'A+',
    foodType: 'Vegetarian',
    peopleCount: '1',
    prescription: '',
    passengers: '1',
    skills: 'General Help'
  });

  const [activeSosCancelled, setActiveSosCancelled] = useState(false);
  const [sosActiveSeconds, setSosActiveSeconds] = useState(0);

  // Providers Modal State
  const [selectedResourceCategory, setSelectedResourceCategory] = useState(null);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [isProvidersLoading, setIsProvidersLoading] = useState(false);
  const [isShowingResourceForm, setIsShowingResourceForm] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Profile Revamp States
  const [profileSubTab, setProfileSubTab] = useState('menu');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [personalDetailsForm, setPersonalDetailsForm] = useState({
    name: user?.name || '',
    contactNumber: user?.contactNumber || '',
    address: user?.location?.address || '',
    age: '',
    gender: 'Prefer not to say',
    bloodGroup: 'Unknown',
    emergencyContacts: user?.emergencyContacts || []
  });
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', relation: '', phone: '' });
  const [medicalInfo, setMedicalInfo] = useState({
    allergies: '',
    conditions: '',
    medications: '',
    insurance: '',
    notes: ''
  });
  const [aadhaarDetails, setAadhaarDetails] = useState({
    aadhaarNo: '',
    status: 'unverified'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    smsEnabled: true,
    locationSharing: 'sos_only',
    emailAlerts: false
  });

  const storageSuffix = user?._id || user?.email || 'default';

  useEffect(() => {
    if (activeTab === 'profile') {
      const savedPersonal = localStorage.getItem(`sanjivani_personal_${storageSuffix}`);
      if (savedPersonal) {
        setPersonalDetailsForm(JSON.parse(savedPersonal));
      } else {
        setPersonalDetailsForm(prev => ({
          ...prev,
          name: user?.name || '',
          contactNumber: user?.contactNumber || '',
          address: user?.location?.address || ''
        }));
      }

      const savedContacts = localStorage.getItem(`sanjivani_contacts_${storageSuffix}`);
      if (savedContacts) {
        setEmergencyContacts(JSON.parse(savedContacts));
      }

      const savedMedical = localStorage.getItem(`sanjivani_medical_${storageSuffix}`);
      if (savedMedical) {
        setMedicalInfo(JSON.parse(savedMedical));
      }

      const savedAadhaar = localStorage.getItem(`sanjivani_aadhaar_${storageSuffix}`);
      if (savedAadhaar) {
        setAadhaarDetails(JSON.parse(savedAadhaar));
      }

      const savedSettings = localStorage.getItem(`sanjivani_settings_${storageSuffix}`);
      if (savedSettings) {
        setNotificationSettings(JSON.parse(savedSettings));
      }
    }
  }, [activeTab, storageSuffix, user]);



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

  // SOS hold progress event handlers
  const handleHoldStart = (e) => {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(50);
    setIsHolding(true);
    holdStartRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, (elapsed / 3000) * 100);
      setHoldProgress(progress);
      if (elapsed >= 3000) {
        clearInterval(holdTimerRef.current);
        if (navigator.vibrate) navigator.vibrate(300);
        setHoldProgress(0);
        setIsHolding(false);
        window.location.hash = '#/sos/type'; // Go to first step of SOS selection
      }
    }, 30);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  };

  // Toggle availability status on backend
  const toggleAvailability = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token') || user?.token;
      
      const response = await fetch(`${API_URL}/api/users/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isOnline: nextStatus,
          location: {
            address: user?.location?.address || 'Current Location',
            coordinates: user?.location?.coordinates?.coordinates || [77.5946, 12.9716]
          }
        })
      });
      if (!response.ok) {
        console.error('Failed to update online status on server');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Fetch active dispatches nearby
  const fetchActiveAlerts = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token') || user?.token;
      if (!token) return;
      const res = await fetch(`${API_URL}/api/help-requests/all-pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveAlerts(data.slice(0, 3)); // show top 3 alerts
      }
    } catch (err) {
      console.error('Error fetching active alerts:', err);
    }
  };

  // Poll active alerts and auto-set online on server
  useEffect(() => {
    if (activeTab === 'home') {
      const forceOnlineOnServer = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const token = localStorage.getItem('token') || user?.token;
          if (!token) return;
          await fetch(`${API_URL}/api/users/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              isOnline: true,
              location: {
                address: user?.location?.address || 'Current Location',
                coordinates: user?.location?.coordinates?.coordinates || [77.5946, 12.9716]
              }
            })
          });
        } catch (err) {
          console.error('Failed to auto-set online status on server:', err);
        }
      };

      forceOnlineOnServer();
      fetchActiveAlerts();
      const interval = setInterval(fetchActiveAlerts, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, user]);

  const savePersonalDetails = async (e) => {
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
          name: personalDetailsForm.name,
          contactNumber: personalDetailsForm.contactNumber,
          location: { address: personalDetailsForm.address }
        })
      });
      if (response.ok) {
        localStorage.setItem(`sanjivani_personal_${storageSuffix}`, JSON.stringify(personalDetailsForm));
        alert('Personal details updated successfully!');
        setProfileSubTab('menu');
      } else {
        const data = await response.json();
        alert(data.message || 'Error updating profile');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      localStorage.setItem(`sanjivani_personal_${storageSuffix}`, JSON.stringify(personalDetailsForm));
      alert('Updated locally. Server connection failed.');
      setProfileSubTab('menu');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) {
      alert('Please fill out Name and Phone number.');
      return;
    }
    const updated = [...emergencyContacts, { ...newContact, id: Date.now().toString() }];
    setEmergencyContacts(updated);
    localStorage.setItem(`sanjivani_contacts_${storageSuffix}`, JSON.stringify(updated));
    setNewContact({ name: '', relation: '', phone: '' });
  };

  const handleDeleteContact = (id) => {
    const updated = emergencyContacts.filter(c => c.id !== id);
    setEmergencyContacts(updated);
    localStorage.setItem(`sanjivani_contacts_${storageSuffix}`, JSON.stringify(updated));
  };

  const saveMedicalDetails = (e) => {
    e.preventDefault();
    localStorage.setItem(`sanjivani_medical_${storageSuffix}`, JSON.stringify(medicalInfo));
    alert('Medical information saved successfully!');
    setProfileSubTab('menu');
  };

  const handleVerifyAadhaar = (e) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(aadhaarDetails.aadhaarNo)) {
      alert('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setAadhaarDetails(prev => ({ ...prev, status: 'verifying' }));
    setTimeout(() => {
      const updated = { ...aadhaarDetails, status: 'verified' };
      setAadhaarDetails(updated);
      localStorage.setItem(`sanjivani_aadhaar_${storageSuffix}`, JSON.stringify(updated));
    }, 2000);
  };

  const handleToggleSetting = (key) => {
    const updated = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    setNotificationSettings(updated);
    localStorage.setItem(`sanjivani_settings_${storageSuffix}`, JSON.stringify(updated));
  };

  const handleSelectSetting = (key, value) => {
    const updated = {
      ...notificationSettings,
      [key]: value
    };
    setNotificationSettings(updated);
    localStorage.setItem(`sanjivani_settings_${storageSuffix}`, JSON.stringify(updated));
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

  const handleResourceFormSubmit = async (e) => {
    e.preventDefault();

    // Construct description based on type
    let finalDescription = formInputs.description;
    if (selectedFormResource?.id === 'blood') finalDescription = `Blood Group Needed: ${formInputs.bloodGroup} | ${finalDescription}`;
    if (selectedFormResource?.id === 'food') finalDescription = `Food Preference: ${formInputs.foodType} | ${finalDescription}`;
    if (selectedFormResource?.id === 'shelter') finalDescription = `People needing shelter: ${formInputs.peopleCount} | ${finalDescription}`;
    if (selectedFormResource?.id === 'medicine') finalDescription = `Medical Details: ${formInputs.prescription} | ${finalDescription}`;
    if (selectedFormResource?.id === 'transport') finalDescription = `Passengers: ${formInputs.passengers} | ${finalDescription}`;
    if (selectedFormResource?.id === 'volunteer') finalDescription = `Required Skills: ${formInputs.skills} | ${finalDescription}`;

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
          helpType: selectedFormResource?.id || 'volunteer',
          description: finalDescription,
          urgency: formInputs.urgency,
          location: {
            address: formInputs.address,
            coordinates: user?.location?.coordinates?.coordinates || [0, 0]
          }
        })
      });
      setRequestSubmitted(true);
      setTimeout(() => {
        setSelectedFormResource(null);
        setRequestSubmitted(false);
        // Automatically jump to listings to see the active requests!
        window.location.hash = '#/listings';
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit request');
    }
  };

  const isConfigRoute = activeTab === 'sos' && (sosStep === 'type' || sosStep === 'severity' || sosStep === 'location-contacts' || sosStep === 'processing');

  return (
    <div className="flex flex-col md:flex-row w-full h-full relative">
      {/* Navigation Sidebar (Desktop) / Bottom Bar (Mobile) */}
      <div className="bg-neutral-50 md:bg-neutral-100/60 border-t md:border-t-0 md:border-r border-neutral-200/90 px-6 md:px-0 py-2.5 md:py-8 flex md:flex-col justify-between md:justify-start items-center z-20 order-last md:order-first md:w-24 md:h-full shrink-0 md:gap-8">
        <button
          disabled={isLocked}
          onClick={() => window.location.hash = '#/dashboard'}
          type="button"
          className={`flex flex-col items-center justify-center gap-1 focus:outline-none transition-all flex-1 md:flex-none md:w-full ${activeTab === 'home' ? 'text-[#d61c24]' : 'text-neutral-400 hover:text-neutral-500'} ${isLocked ? 'pointer-events-none opacity-30' : ''}`}
        >
          <svg className="w-5.5 h-5.5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="text-3xs font-extrabold tracking-tight">Home</span>
        </button>

        <button
          disabled={isLocked}
          onClick={() => window.location.hash = '#/listings'}
          type="button"
          className={`flex flex-col items-center gap-1.5 focus:outline-none transition-all flex-1 md:flex-none md:w-full ${activeTab === 'listings' ? 'text-[#d61c24]' : 'text-neutral-400 hover:text-neutral-500'} ${isLocked ? 'pointer-events-none opacity-30' : ''}`}
        >
          <svg className="w-5.5 h-5.5 md:w-6 md:h-6 fill-none stroke-current" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="text-3xs font-extrabold tracking-tight">Alerts</span>
        </button>

        <button
          disabled={isLocked}
          onClick={() => window.location.hash = '#/profile'}
          type="button"
          className={`flex flex-col items-center gap-1.5 focus:outline-none transition-all flex-1 md:flex-none md:w-full md:mt-auto ${activeTab === 'profile' ? 'text-[#d61c24]' : 'text-neutral-400 hover:text-neutral-500'} ${isLocked ? 'pointer-events-none opacity-30' : ''}`}
        >
          <svg className="w-5.5 h-5.5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span className="text-3xs font-extrabold tracking-tight">Profile</span>
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
            <div className="relative group cursor-pointer" onClick={() => window.location.hash = '#/profile'}>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white ring-2 ring-red-500/10 group-hover:ring-red-500/30 transition-all duration-300 bg-red-100 flex items-center justify-center text-red-700 font-black text-xl uppercase">
                {(user?.name || 'U').substring(0, 2)}
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
                {/* Verified profile header */}
                <div className="w-full bg-white rounded-2xl border border-neutral-100 shadow-md shadow-neutral-100/50 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-855">Verified Emergency Profile</h3>
                    <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-green-600 mt-1">
                      Verified Identity
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                  </div>

                  <div className="text-right w-1/2">
                    <div className="flex justify-between items-center text-3xs font-semibold text-neutral-400 mb-1">
                      <span>Responder Availability</span>
                      <span className="font-extrabold text-neutral-800">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden p-0.5 border border-neutral-200/80">
                      <div className={`h-full rounded-full transition-all duration-500 ${isOnline ? 'bg-gradient-to-r from-green-400 to-emerald-600 shadow-sm' : 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm'}`} style={{ width: isOnline ? '100%' : '50%' }} />
                    </div>
                  </div>
                </div>

                {/* Unified Get Help / Give Help Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
                  
                  {/* CONSOLE 1: GET EMERGENCY HELP */}
                  <div className="flex flex-col gap-5 bg-white rounded-3xl border border-neutral-100 shadow-md shadow-neutral-100/30 p-5 md:p-6">
                    <div className="flex items-center gap-2 border-b border-neutral-50 pb-3">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                      </span>
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">Distress Console (Get Help)</h3>
                    </div>

                    {/* SOS Button holding box */}
                    <div className="w-full bg-red-50/10 rounded-2xl border border-red-100/50 p-6 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
                      <div className="absolute w-[240px] h-[240px] rounded-full bg-red-500/5 filter blur-2xl animate-pulse pointer-events-none" />
                      
                      <button
                        onMouseDown={handleHoldStart}
                        onMouseUp={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                        onTouchStart={handleHoldStart}
                        onTouchEnd={handleHoldEnd}
                        type="button"
                        className={`relative w-40 h-40 rounded-full bg-red-50 flex items-center justify-center cursor-pointer transition-transform duration-300 ${isHolding ? 'scale-95' : 'hover:scale-105'} group focus:outline-none select-none`}
                      >
                        {/* Circular Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="44"
                            fill="transparent"
                            stroke="rgba(214, 28, 36, 0.08)"
                            strokeWidth="5"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="44"
                            fill="transparent"
                            stroke="#d61c24"
                            strokeWidth="5"
                            strokeDasharray={2 * Math.PI * 44}
                            strokeDashoffset={2 * Math.PI * 44 * (1 - holdProgress / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-75 ease-out"
                          />
                        </svg>

                        {/* Button Core */}
                        <div className={`absolute inset-4 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${
                          isHolding ? 'bg-[#b31018] shadow-red-600/30' : 'bg-[#d61c24] shadow-red-500/30'
                        } text-white z-10`}>
                          <span className="text-3xl font-black tracking-wider leading-none">SOS</span>
                          <span className="text-[8px] font-black uppercase tracking-widest mt-1.5 text-red-100">
                            {isHolding ? `${Math.ceil((100 - holdProgress) / 33)}s...` : 'Hold to Alert'}
                          </span>
                        </div>
                      </button>

                      <div className="flex flex-col items-center mt-4 gap-1 select-none">
                        <span className="text-[13px] font-extrabold tracking-widest text-[#d61c24] uppercase animate-pulse">TAP FOR HELP</span>
                        <p className="text-3xs text-neutral-450 font-semibold text-center max-w-[200px] leading-relaxed">
                          {isHolding ? 'Holding dispatch beacon...' : 'Press and hold for 3 seconds to dispatch immediate nearby emergency teams.'}
                        </p>
                      </div>
                    </div>

                    {/* Quick Resources */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-800">Quick Resource Request</h4>
                        <button
                          onClick={() => window.location.hash = '#/resources'}
                          className="text-3xs font-extrabold text-blue-600 hover:underline transition-colors"
                        >
                          View All
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {resourceTypes.map((res) => (
                          <button
                            key={res.id}
                            onClick={() => setSelectedFormResource(res)}
                            type="button"
                            className="bg-white hover:bg-red-50/20 border border-neutral-100 hover:border-red-100 rounded-xl p-2.5 flex flex-col items-center text-center transition-all duration-200 focus:outline-none active:scale-[0.97]"
                          >
                            <div className={`p-2 rounded-full ${res.iconColor} mb-1.5`}>
                              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                                <path d={res.icon} />
                              </svg>
                            </div>
                            <span className="text-3xs font-black text-neutral-700 tracking-tight leading-snug">
                              {res.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nearby Resources */}
                    <div className="flex flex-col gap-3 border-t border-neutral-50 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-800">Nearby Resources</h4>
                        <span className="text-3xs font-extrabold text-[#d61c24] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d61c24] animate-ping" />
                          Live Radar
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {nearbyResources.map((res) => (
                          <div
                            key={res.id}
                            className="bg-white border border-neutral-100 rounded-xl p-3 flex flex-col items-center text-center relative group shadow-2xs hover:shadow-sm transition-all duration-200"
                          >
                            {/* Dismiss button */}
                            <button
                              onClick={() => removeNearbyResource(res.id)}
                              type="button"
                              className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-neutral-100 hover:bg-red-50 text-neutral-455 hover:text-[#d61c24] flex items-center justify-center text-[10px] font-bold focus:outline-none transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                              title="Dismiss"
                            >
                              ×
                            </button>
                            <div className={`p-2.5 rounded-full ${
                              res.color === 'green' ? 'text-green-600 bg-green-50' :
                              res.color === 'blue' ? 'text-blue-600 bg-blue-50' : 'text-red-655 bg-red-50'
                            } mb-2 shadow-2xs`}>
                              <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                                <path d={res.icon} />
                              </svg>
                            </div>
                            <h5 className="text-[10px] font-extrabold text-neutral-800 leading-tight">
                              {res.count} {res.title}
                            </h5>
                            <span className="text-3xs text-neutral-450 font-bold mt-1">
                              {res.distance} km away
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CONSOLE 2: GIVE HELP / RESPONDER RADAR */}
                  <div className="flex flex-col gap-5 bg-white rounded-3xl border border-neutral-100 shadow-md shadow-neutral-100/30 p-5 md:p-6">
                    <div className="flex items-center gap-2 border-b border-neutral-50 pb-3">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-green-400' : 'bg-amber-400'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-green-600' : 'bg-amber-500'}`}></span>
                      </span>
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">Responder Console (Give Help)</h3>
                    </div>

                    {/* Active Dispatch Monitor indicator */}
                    <div className="bg-green-50/50 rounded-2xl border border-green-100 p-4.5 flex items-center gap-3.5 shadow-sm">
                      <div className="bg-green-100 text-green-700 w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 animate-pulse">
                        📡
                      </div>
                      <div>
                        <h4 className="text-2xs font-extrabold text-neutral-800 flex items-center gap-1.5">
                          Active Dispatch Monitor
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        </h4>
                        <p className="text-[10px] text-green-700/90 leading-relaxed mt-0.5">
                          Always active. Continuously scanning for local distress beacons.
                        </p>
                      </div>
                    </div>

                    {/* Active dispatches nearby */}
                    <div className="flex flex-col gap-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-800">Nearby Distress Beacons</h4>
                        <button
                          onClick={() => window.location.hash = '#/listings'}
                          className="text-3xs font-extrabold text-blue-600 hover:underline transition-colors"
                        >
                          Incident Map
                        </button>
                      </div>

                      <div className="flex-1 flex flex-col gap-2.5 justify-center">
                        {activeAlerts.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-neutral-150 rounded-2xl p-4 text-center bg-neutral-50/20 py-8 min-h-[140px]">
                            <span className="text-lg">📡</span>
                            <h4 className="text-[10px] font-bold text-neutral-600 mt-1">Radar Scanning...</h4>
                            <p className="text-3xs text-neutral-450 max-w-[180px] mt-0.5 leading-relaxed">
                              No pending emergency distress dispatches found nearby.
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {activeAlerts.map(alert => (
                              <div
                                key={alert._id}
                                className="bg-white border border-neutral-100 hover:border-red-100 rounded-xl p-3 flex items-center justify-between shadow-2xs hover:shadow-sm transition-all cursor-pointer"
                                onClick={() => window.location.hash = '#/listings'}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-lg flex-shrink-0">🚨</span>
                                  <div>
                                    <h5 className="text-[11px] font-black text-neutral-800 uppercase flex items-center gap-1.5 leading-none">
                                      {alert.helpType}
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        alert.urgency === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-orange-400'
                                      }`} />
                                    </h5>
                                    <p className="text-[10px] text-neutral-600 font-semibold mt-1 line-clamp-1 max-w-[150px] sm:max-w-xs leading-none">
                                      {alert.location.address}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-black text-white bg-[#d61c24] hover:bg-[#b31018] px-2.5 py-1.5 rounded-lg transition-colors uppercase leading-none">
                                  Help
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
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
                  <button onClick={() => window.location.hash = '#/dashboard'} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                  <h2 className="text-lg font-bold text-neutral-800">Resources Directory</h2>
                </div>
                <p className="text-xs text-neutral-400">Select an emergency category below to log a resource request or find nearby support groups:</p>

                <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
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
                    user={user}
                    onBack={() => window.location.hash = '#/sos/severity'}
                    onConfirm={(contacts) => {
                      setActiveContacts(contacts);
                      window.location.hash = '#/sos/processing';
                    }}
                  />
                )}

                {/* SUBSTEP 4: REQUEST PROCESSING */}
                {sosStep === 'processing' && (
                  <RequestProcessing
                    user={user}
                    selectedEmergency={selectedEmergency}
                    selectedSeverity={selectedSeverity}
                    activeContacts={activeContacts}
                    setCreatedRequestId={setCreatedRequestId}
                    onCancel={() => {
                      window.location.hash = '#/sos/location-contacts';
                    }}
                    onComplete={() => {
                      window.location.hash = '#/sos/tracking';
                    }}
                  />
                )}

                {/* SUBSTEP 5: LIVE DISTRESS BEACON TRACKER */}
                {sosStep === 'tracking' && (
                  <LiveTracking
                    user={user}
                    selectedEmergency={selectedEmergency}
                    selectedSeverity={selectedSeverity}
                    activeContacts={activeContacts}
                    createdRequestId={createdRequestId}
                    onCancel={() => {
                      window.location.hash = '#/dashboard';
                    }}
                  />
                )}

              </div>
            )}

            {/* TAB 5: LISTINGS */}
            {activeTab === 'listings' && (
              <Listings
                user={user}
                onBack={() => window.location.hash = '#/dashboard'}
              />
            )}

            {/* TAB 4: PROFILE */}
            {activeTab === 'profile' && (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-10">
                
                {/* 1. MAIN PROFILE MENU */}
                {profileSubTab === 'menu' && (
                  <div className="flex flex-col gap-4 animate-scaleUp">
                    <div className="flex items-center gap-2">
                      <button onClick={() => window.location.hash = '#/dashboard'} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                      <h2 className="text-lg font-bold text-neutral-800">Emergency Profile</h2>
                    </div>

                    {/* Main Avatar Summary Card */}
                    <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-4 flex flex-col gap-4 mt-1 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-red-500 bg-red-50 text-[#d61c24] flex items-center justify-center font-black text-xl uppercase shadow-inner">
                          {(personalDetailsForm.name || user?.name || 'U').substring(0, 2)}
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-neutral-850 leading-snug">{personalDetailsForm.name || user?.name || 'User'}</h3>
                          <span className="text-xs text-neutral-400 font-semibold">{user?.email || 'user@example.com'}</span>
                          <div>
                            {aadhaarDetails.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 mt-1">
                                <svg className="w-3 h-3 text-green-600 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                Aadhaar Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 mt-1">
                                ⚠️ Aadhaar Unverified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Options List */}
                    <div className="flex flex-col gap-2 mt-2">
                      {/* Personal Details Row */}
                      <button
                        onClick={() => setProfileSubTab('personal')}
                        className="bg-white border border-neutral-100 hover:border-red-100 rounded-xl p-4 flex items-center justify-between text-left transition-all hover:bg-red-50/5 hover:shadow-sm focus:outline-none"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 bg-red-50 text-[#d61c24] rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">
                            👤
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-neutral-850">Personal Details</h4>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Name, Age, Gender, Blood Group & Address</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* Emergency Contacts Row */}
                      <button
                        onClick={() => setProfileSubTab('contacts')}
                        className="bg-white border border-neutral-100 hover:border-red-100 rounded-xl p-4 flex items-center justify-between text-left transition-all hover:bg-red-50/5 hover:shadow-sm focus:outline-none"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">
                            📞
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-neutral-850">Emergency Contacts</h4>
                            <p className="text-[10px] text-neutral-400 mt-0.5">{emergencyContacts.length} trusted contacts registered</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* Medical Information Row */}
                      <button
                        onClick={() => setProfileSubTab('medical')}
                        className="bg-white border border-neutral-100 hover:border-red-100 rounded-xl p-4 flex items-center justify-between text-left transition-all hover:bg-red-50/5 hover:shadow-sm focus:outline-none"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">
                            🏥
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-neutral-850">Medical Information</h4>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Blood Group: {personalDetailsForm.bloodGroup || 'Unknown'} • Health Records</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* Verification Status Row */}
                      <button
                        onClick={() => setProfileSubTab('verification')}
                        className="bg-white border border-neutral-100 hover:border-red-100 rounded-xl p-4 flex items-center justify-between text-left transition-all hover:bg-red-50/5 hover:shadow-sm focus:outline-none"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">
                            🛡️
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-neutral-850">Verification Status</h4>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              Aadhaar status: <span className={`font-bold uppercase ${aadhaarDetails.status === 'verified' ? 'text-green-600' : 'text-orange-500'}`}>{aadhaarDetails.status}</span>
                            </p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* Settings Row */}
                      <button
                        onClick={() => setProfileSubTab('settings')}
                        className="bg-white border border-neutral-100 hover:border-red-100 rounded-xl p-4 flex items-center justify-between text-left transition-all hover:bg-red-50/5 hover:shadow-sm focus:outline-none"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">
                            ⚙️
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-neutral-850">Settings &amp; Preferences</h4>
                            <p className="text-[10px] text-neutral-400 mt-0.5">SMS notifications, push preferences &amp; privacy</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>

                    <button
                      onClick={onLogout}
                      type="button"
                      className="mt-6 border border-red-200 text-[#d61c24] hover:bg-red-50 font-bold py-3.5 rounded-xl text-xs transition-colors shadow-sm focus:outline-none"
                    >
                      Logout Account
                    </button>
                  </div>
                )}

                {/* 2. PERSONAL DETAILS VIEW */}
                {profileSubTab === 'personal' && (
                  <form onSubmit={savePersonalDetails} className="flex flex-col gap-4 animate-scaleUp">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setProfileSubTab('menu')} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                      <h2 className="text-lg font-bold text-neutral-800">Personal Details</h2>
                    </div>

                    <div className="flex flex-col gap-3.5 mt-2 bg-white border border-neutral-100 p-5 rounded-2xl shadow-sm">
                      <div className="flex flex-col gap-1">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Full Name</label>
                        <input
                          type="text"
                          required
                          value={personalDetailsForm.name}
                          onChange={(e) => setPersonalDetailsForm({ ...personalDetailsForm, name: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Contact Phone Number</label>
                        <input
                          type="text"
                          required
                          value={personalDetailsForm.contactNumber}
                          onChange={(e) => setPersonalDetailsForm({ ...personalDetailsForm, contactNumber: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Home Address</label>
                        <input
                          type="text"
                          required
                          value={personalDetailsForm.address}
                          onChange={(e) => setPersonalDetailsForm({ ...personalDetailsForm, address: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Age</label>
                          <input
                            type="number"
                            placeholder="Years"
                            value={personalDetailsForm.age}
                            onChange={(e) => setPersonalDetailsForm({ ...personalDetailsForm, age: e.target.value })}
                            className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Gender</label>
                          <select
                            value={personalDetailsForm.gender}
                            onChange={(e) => setPersonalDetailsForm({ ...personalDetailsForm, gender: e.target.value })}
                            className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800 cursor-pointer"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Blood Group</label>
                        <select
                          value={personalDetailsForm.bloodGroup}
                          onChange={(e) => setPersonalDetailsForm({ ...personalDetailsForm, bloodGroup: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800 cursor-pointer"
                        >
                          <option value="Unknown">Unknown / Select</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="mt-4 w-full bg-[#d61c24] hover:bg-[#b31018] text-white py-3 rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 active:scale-95 disabled:opacity-50"
                    >
                      {isUpdatingProfile ? 'Saving Changes...' : 'Save Personal Details'}
                    </button>
                  </form>
                )}

                {/* 3. EMERGENCY CONTACTS VIEW */}
                {profileSubTab === 'contacts' && (
                  <div className="flex flex-col gap-4 animate-scaleUp">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setProfileSubTab('menu')} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                      <h2 className="text-lg font-bold text-neutral-800">Emergency Contacts</h2>
                    </div>

                    {/* Active Contacts List */}
                    <div className="flex flex-col gap-2 bg-neutral-50 rounded-2xl border border-neutral-100 p-4 mt-2 max-h-56 overflow-y-auto">
                      <h3 className="text-3xs font-extrabold uppercase tracking-wider text-neutral-450 mb-1">Registered Contacts</h3>
                      {emergencyContacts.length === 0 ? (
                        <div className="text-2xs text-neutral-400 italic py-4 text-center">No trusted contacts added yet. Responders won't have contacts to notify in an emergency.</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {emergencyContacts.map(contact => (
                            <div key={contact.id} className="bg-white border border-neutral-100 p-3 rounded-xl flex items-center justify-between shadow-3xs">
                              <div>
                                <h4 className="text-xs font-bold text-neutral-800">{contact.name}</h4>
                                <p className="text-3xs text-neutral-450 mt-0.5">{contact.relation} • {contact.phone}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
                                className="p-2 text-neutral-300 hover:text-red-650 hover:bg-red-50/50 rounded-lg transition-colors focus:outline-none"
                              >
                                <svg className="w-4.5 h-4.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Contact Form */}
                    <form onSubmit={handleAddContact} className="bg-white border border-neutral-100 p-5 rounded-2xl flex flex-col gap-3 shadow-sm">
                      <h3 className="text-2xs font-extrabold text-neutral-800 border-b border-neutral-50 pb-1.5">Add New Emergency Contact</h3>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-450">Contact Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Kumar"
                          value={newContact.name}
                          onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-450">Relationship</label>
                          <select
                            value={newContact.relation}
                            onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                            className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800 cursor-pointer"
                          >
                            <option value="">Select Relation</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Child">Child</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-450">Phone Number</label>
                          <input
                            type="tel"
                            required
                            placeholder="10-digit number"
                            value={newContact.phone}
                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                            className="w-full text-xs font-semibold px-3.5 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="mt-2 w-full bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        ➕ Add Contact
                      </button>
                    </form>
                  </div>
                )}

                {/* 4. MEDICAL INFORMATION VIEW */}
                {profileSubTab === 'medical' && (
                  <form onSubmit={saveMedicalDetails} className="flex flex-col gap-4 animate-scaleUp">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setProfileSubTab('menu')} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                      <h2 className="text-lg font-bold text-neutral-800">Medical Information</h2>
                    </div>

                    <div className="flex flex-col gap-3.5 mt-2 bg-white border border-neutral-100 p-5 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-center bg-blue-50/35 border border-blue-100/40 p-3 rounded-xl">
                        <span className="text-xs font-bold text-blue-800">Blood Group Verification:</span>
                        <span className="text-xs font-black text-white bg-blue-600 px-3 py-1 rounded-md">{personalDetailsForm.bloodGroup || 'Unknown'}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Known Allergies</label>
                        <textarea
                          rows={2}
                          placeholder="List any drug, food, or chemical allergies (e.g., Penicillin, Peanuts). If none, write None."
                          value={medicalInfo.allergies}
                          onChange={(e) => setMedicalInfo({ ...medicalInfo, allergies: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Chronic Medical Conditions</label>
                        <textarea
                          rows={2}
                          placeholder="e.g., Asthma, Type-1 Diabetes, Heart Condition..."
                          value={medicalInfo.conditions}
                          onChange={(e) => setMedicalInfo({ ...medicalInfo, conditions: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Current Medications &amp; Dosages</label>
                        <textarea
                          rows={2}
                          placeholder="List critical prescription medications you take regularly..."
                          value={medicalInfo.medications}
                          onChange={(e) => setMedicalInfo({ ...medicalInfo, medications: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800 resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Health Insurance Provider &amp; ID</label>
                        <input
                          type="text"
                          placeholder="e.g. Star Health - Policy No: 12345"
                          value={medicalInfo.insurance}
                          onChange={(e) => setMedicalInfo({ ...medicalInfo, insurance: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Special Notes for Responders</label>
                        <textarea
                          rows={2}
                          placeholder="Any other crucial emergency medical instructions..."
                          value={medicalInfo.notes}
                          onChange={(e) => setMedicalInfo({ ...medicalInfo, notes: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800 resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-95"
                    >
                      Save Medical Records
                    </button>
                  </form>
                )}

                {/* 5. AADHAAR VERIFICATION VIEW */}
                {profileSubTab === 'verification' && (
                  <div className="flex flex-col gap-4 animate-scaleUp">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setProfileSubTab('menu')} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                      <h2 className="text-lg font-bold text-neutral-800">Verification Status</h2>
                    </div>

                    {aadhaarDetails.status === 'verified' ? (
                      <div className="bg-green-50/40 border border-green-200 p-6 rounded-2xl flex flex-col items-center text-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl">
                          🛡️
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-green-800">Identity Fully Verified</h3>
                          <p className="text-[11px] text-green-600/80 mt-1 max-w-xs leading-relaxed">Your digital identity is linked and verified. SOS beacons sent from your device will be flagged as authenticated for immediate action.</p>
                        </div>
                        <div className="bg-white border border-green-100 rounded-xl px-4 py-2 text-xs font-bold text-neutral-700 tracking-wider">
                          Aadhaar: XXXX-XXXX-{aadhaarDetails.aadhaarNo.slice(-4) || '9999'}
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyAadhaar} className="bg-white border border-neutral-100 p-5 rounded-2xl flex flex-col gap-4 shadow-sm mt-2">
                        <div className="p-3 bg-orange-50/50 border border-orange-100/50 rounded-xl flex gap-3 text-left">
                          <span className="text-base flex-shrink-0">⚠️</span>
                          <div>
                            <h4 className="text-2xs font-extrabold text-orange-700 uppercase tracking-tight">Action Required</h4>
                            <p className="text-3xs text-orange-600/80 mt-0.5 leading-relaxed">Unverified accounts have lower dispatch weight to curb false alarms. Verify your identity to elevate responder speed.</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-450">Enter Aadhaar Card Number</label>
                          <input
                            type="text"
                            required
                            maxLength={12}
                            placeholder="12 Digit Number"
                            value={aadhaarDetails.aadhaarNo}
                            disabled={aadhaarDetails.status === 'verifying'}
                            onChange={(e) => setAadhaarDetails({ ...aadhaarDetails, aadhaarNo: e.target.value.replace(/\D/g, '') })}
                            className="w-full text-center tracking-widest text-sm font-black px-3.5 py-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                          />
                        </div>

                        {aadhaarDetails.status === 'verifying' ? (
                          <div className="py-2 flex flex-col items-center justify-center gap-2">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-3xs font-extrabold text-orange-500 tracking-wider uppercase animate-pulse">Requesting OTP and verifying...</span>
                          </div>
                        ) : (
                          <button
                            type="submit"
                            disabled={aadhaarDetails.aadhaarNo.length !== 12}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1.5 shadow-md shadow-green-500/10 active:scale-95"
                          >
                            Verify &amp; Link Profile
                          </button>
                        )}
                      </form>
                    )}
                  </div>
                )}

                {/* 6. SETTINGS VIEW */}
                {profileSubTab === 'settings' && (
                  <div className="flex flex-col gap-4 animate-scaleUp">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setProfileSubTab('menu')} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                      <h2 className="text-lg font-bold text-neutral-800">Settings</h2>
                    </div>

                    <div className="bg-white border border-neutral-100 p-5 rounded-2xl flex flex-col gap-4 mt-2 shadow-sm">
                      <h3 className="text-2xs font-extrabold text-neutral-800 border-b border-neutral-50 pb-1.5 uppercase tracking-wide">Notifications &amp; Alerts</h3>
                      
                      {/* Push Toggle */}
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-800">Push Notifications</h4>
                          <p className="text-3xs text-neutral-400 mt-0.5">Receive immediate incident updates</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('pushEnabled')}
                          className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${notificationSettings.pushEnabled ? 'bg-green-600' : 'bg-neutral-200'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${notificationSettings.pushEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>

                      {/* SMS Toggle */}
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-800">SMS Distress Alerts</h4>
                          <p className="text-3xs text-neutral-400 mt-0.5">Get safety checks sent via mobile SMS</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('smsEnabled')}
                          className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${notificationSettings.smsEnabled ? 'bg-green-600' : 'bg-neutral-200'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${notificationSettings.smsEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>

                      {/* Email Toggle */}
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-800">Email Updates</h4>
                          <p className="text-3xs text-neutral-400 mt-0.5">Weekly community safety digest reports</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('emailAlerts')}
                          className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${notificationSettings.emailAlerts ? 'bg-green-600' : 'bg-neutral-200'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${notificationSettings.emailAlerts ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>

                      <h3 className="text-2xs font-extrabold text-neutral-800 border-b border-neutral-50 pb-1.5 uppercase tracking-wide mt-2">Privacy &amp; Location</h3>

                      {/* Location Sharing select */}
                      <div className="flex flex-col gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-800">Location Access Level</h4>
                          <p className="text-3xs text-neutral-400 mt-0.5">Define when emergency services can view coordinates</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => handleSelectSetting('locationSharing', 'sos_only')}
                            className={`py-2 px-3 text-3xs font-extrabold border rounded-xl transition-all ${
                              notificationSettings.locationSharing === 'sos_only'
                                ? 'bg-red-50 border-red-200 text-[#d61c24] shadow-sm'
                                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                            }`}
                          >
                            ⚠️ SOS Only (Rec.)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectSetting('locationSharing', 'always')}
                            className={`py-2 px-3 text-3xs font-extrabold border rounded-xl transition-all ${
                              notificationSettings.locationSharing === 'always'
                                ? 'bg-red-50 border-red-200 text-[#d61c24] shadow-sm'
                                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                            }`}
                          >
                            Always On
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


              </div>
            )}

          </div>
        </div>

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
                      onChange={(e) => setFormInputs({ ...formInputs, name: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Contact Number</label>
                    <input
                      type="text"
                      required
                      value={formInputs.contact}
                      onChange={(e) => setFormInputs({ ...formInputs, contact: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Current Location / Address</label>
                    <input
                      type="text"
                      required
                      value={formInputs.address}
                      onChange={(e) => setFormInputs({ ...formInputs, address: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Requirements Details</label>
                    <textarea
                      required
                      rows={2.5}
                      placeholder="Specify quantities, or additional details..."
                      value={formInputs.description}
                      onChange={(e) => setFormInputs({ ...formInputs, description: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-red-500 text-neutral-800 resize-none"
                    />
                  </div>

                  {/* DYNAMIC FORM FIELDS BASED ON CATEGORY */}
                  {selectedFormResource.id === 'blood' && (
                    <div className="flex flex-col gap-1 animate-scaleUp">
                      <label className="text-3xs font-extrabold uppercase tracking-wider text-red-500">Required Blood Group</label>
                      <select
                        value={formInputs.bloodGroup}
                        onChange={(e) => setFormInputs({ ...formInputs, bloodGroup: e.target.value })}
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-red-50 rounded-xl border border-red-200 focus:outline-none focus:border-red-500 text-red-800 cursor-pointer"
                      >
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B-">B-</option>
                        <option value="O+">O+</option><option value="O-">O-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      </select>
                    </div>
                  )}

                  {selectedFormResource.id === 'food' && (
                    <div className="flex flex-col gap-1 animate-scaleUp">
                      <label className="text-3xs font-extrabold uppercase tracking-wider text-amber-600">Dietary Preference</label>
                      <select
                        value={formInputs.foodType}
                        onChange={(e) => setFormInputs({ ...formInputs, foodType: e.target.value })}
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-500 text-amber-800 cursor-pointer"
                      >
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                        <option value="Any">Any</option>
                      </select>
                    </div>
                  )}

                  {selectedFormResource.id === 'shelter' && (
                    <div className="flex flex-col gap-1 animate-scaleUp">
                      <label className="text-3xs font-extrabold uppercase tracking-wider text-blue-600">Number of People</label>
                      <input
                        type="number"
                        min="1"
                        value={formInputs.peopleCount}
                        onChange={(e) => setFormInputs({ ...formInputs, peopleCount: e.target.value })}
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-200 focus:outline-none focus:border-blue-500 text-blue-800"
                      />
                    </div>
                  )}

                  {selectedFormResource.id === 'medicine' && (
                    <div className="flex flex-col gap-1 animate-scaleUp">
                      <label className="text-3xs font-extrabold uppercase tracking-wider text-teal-600">Medical Specifics</label>
                      <input
                        type="text"
                        placeholder="e.g. Insulin, Inhaler, First Aid"
                        value={formInputs.prescription}
                        onChange={(e) => setFormInputs({ ...formInputs, prescription: e.target.value })}
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-teal-50 rounded-xl border border-teal-200 focus:outline-none focus:border-teal-500 text-teal-800"
                      />
                    </div>
                  )}

                  {selectedFormResource.id === 'transport' && (
                    <div className="flex flex-col gap-1 animate-scaleUp">
                      <label className="text-3xs font-extrabold uppercase tracking-wider text-indigo-600">Passengers</label>
                      <input
                        type="number"
                        min="1"
                        value={formInputs.passengers}
                        onChange={(e) => setFormInputs({ ...formInputs, passengers: e.target.value })}
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-indigo-50 rounded-xl border border-indigo-200 focus:outline-none focus:border-indigo-500 text-indigo-800"
                      />
                    </div>
                  )}

                  {selectedFormResource.id === 'volunteer' && (
                    <div className="flex flex-col gap-1 animate-scaleUp">
                      <label className="text-3xs font-extrabold uppercase tracking-wider text-emerald-600">Required Skills</label>
                      <input
                        type="text"
                        placeholder="e.g. Doctor, Search & Rescue, Labor"
                        value={formInputs.skills}
                        onChange={(e) => setFormInputs({ ...formInputs, skills: e.target.value })}
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-200 focus:outline-none focus:border-emerald-500 text-emerald-800"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-extrabold uppercase tracking-wider text-neutral-400">Urgency Level</label>
                    <select
                      value={formInputs.urgency}
                      onChange={(e) => setFormInputs({ ...formInputs, urgency: e.target.value })}
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
    </div>
  );
}
