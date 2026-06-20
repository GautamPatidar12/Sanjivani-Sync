import React, { useState, useEffect, useRef } from 'react';

export default function LiveTracking({
  user,
  selectedEmergency,
  selectedSeverity,
  activeContacts,
  createdRequestId,
  onCancel,
}) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [eta, setEta] = useState(8); // in minutes
  const [distance, setDistance] = useState(2.1); // in km
  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { sender: 'helper', text: 'Hello, I have accepted your request. I am heading to your coordinates now.', time: 'Just now' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const chatBottomRef = useRef(null);

  // Map refs
  const mapRef = useRef(null);
  const markerUserRef = useRef(null);
  const markerHelperRef = useRef(null);
  const polylineRef = useRef(null);
  const movementIntervalRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const displayId = createdRequestId ? `ID: #${createdRequestId.slice(-6).toUpperCase()}` : 'ID: EN123456';

  // coordinates
  const userCoords = user?.location?.coordinates?.coordinates || [77.4126, 23.2599]; // default Bhopal
  const userLat = userCoords[1];
  const userLng = userCoords[0];

  // Helper details (fallback mock)
  const [responderInfo, setResponderInfo] = useState({
    name: 'Ravi Kumar',
    role: 'Paramedic',
    rating: '4.8',
    phone: '+91 99887 76655',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  });
  const [helperCoords, setHelperCoords] = useState(null); // [lat, lng]

  // 1. Fetch live request data to get helper details if available (polled every 4s)
  useEffect(() => {
    if (!createdRequestId || !user?.token) return;
    
    const fetchHelperDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/help-requests/my-requests`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (!res.ok) return;

        const requests = await res.json();
        const currentReq = requests.find(r => r._id === createdRequestId);
        if (currentReq && currentReq.helper) {
          setResponderInfo({
            name: currentReq.helper.name || 'Responder Assigned',
            role: currentReq.helper.orgType === 'hospital' ? 'Ambulance Unit' : 'Volunteer Responder',
            rating: '4.9',
            phone: currentReq.helper.contactNumber || '+91 99887 76655',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
          });

          const coords = currentReq.helper.location?.coordinates?.coordinates;
          if (coords && coords.length >= 2 && (coords[0] !== 0 || coords[1] !== 0)) {
            setHelperCoords([coords[1], coords[0]]); // [latitude, longitude]
          }
        }
      } catch (err) {
        console.error('Error fetching helper details:', err);
      }
    };

    fetchHelperDetails();
    const interval = setInterval(fetchHelperDetails, 4000);
    return () => clearInterval(interval);
  }, [createdRequestId, user?.token]);

  // 2. Inject Leaflet CDN files
  useEffect(() => {
    // Inject stylesheet
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject script
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }

    return () => {
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    };
  }, []);

  // 3. Initialize Leaflet Map and Animate Marker Movement
  useEffect(() => {
    if (!leafletLoaded) return;
    if (mapRef.current) return;

    // Center coordinates
    const userLatLng = [userLat, userLng];
    // Start ambulance marker offset to simulate live driving
    const startHelperLat = userLat + 0.012;
    const startHelperLng = userLng - 0.014;

    // Custom icons matching the high fidelity mockups
    const patientIcon = window.L.divIcon({
      html: `<div class="relative w-8 h-8 flex items-center justify-center">
               <div class="absolute w-7 h-7 rounded-full bg-red-500/20 animate-ping"></div>
               <div class="absolute w-5 h-5 rounded-full bg-red-500/35"></div>
               <div class="w-3 h-3 bg-red-655 border border-white rounded-full shadow-md"></div>
             </div>`,
      className: 'custom-leaflet-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const ambulanceIcon = window.L.divIcon({
      html: `<div class="bg-white border border-neutral-100 rounded-full w-9 h-9 shadow-lg flex items-center justify-center text-lg hover:scale-105 transition-transform duration-200">🚑</div>`,
      className: 'custom-leaflet-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    // Create map instance
    const map = window.L.map('map-container', {
      zoomControl: false
    }).setView([userLat + 0.005, userLng - 0.005], 13.5);

    // Apply clean OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Add Patient location marker
    const uMarker = window.L.marker(userLatLng, { icon: patientIcon }).addTo(map);
    markerUserRef.current = uMarker;

    // Add Responder location marker
    const hMarker = window.L.marker([startHelperLat, startHelperLng], { icon: ambulanceIcon }).addTo(map);
    markerHelperRef.current = hMarker;

    // Add routing line path
    const routeLine = window.L.polyline([[startHelperLat, startHelperLng], userLatLng], {
      color: '#d61c24',
      weight: 4.5,
      dashArray: '4, 8',
      lineCap: 'round'
    }).addTo(map);
    polylineRef.current = routeLine;

    mapRef.current = map;

    // Fit map bounds to show both markers
    const bounds = window.L.latLngBounds([userLatLng, [startHelperLat, startHelperLng]]);
    map.fitBounds(bounds, { padding: [40, 40] });

    // 4. Simulate GPS movement
    const totalSteps = 25;
    let stepCount = 0;

    movementIntervalRef.current = setInterval(() => {
      stepCount++;
      if (stepCount > totalSteps) {
        clearInterval(movementIntervalRef.current);
        return;
      }

      const ratio = stepCount / totalSteps;
      const currentLat = startHelperLat + (userLat - startHelperLat) * ratio;
      const currentLng = startHelperLng + (userLng - startHelperLng) * ratio;

      // Update marker coordinates
      if (markerHelperRef.current) {
        markerHelperRef.current.setLatLng([currentLat, currentLng]);
      }
      
      // Update route polyline path
      if (polylineRef.current) {
        polylineRef.current.setLatLngs([[currentLat, currentLng], [userLat, userLng]]);
      }

      // Update distance and ETA text
      setDistance(Math.max(0.1, Number((2.1 * (1 - ratio)).toFixed(1))));
      setEta(Math.max(1, Math.round(8 * (1 - ratio))));
    }, 3000);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Haversine formula helper functions
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Sync Leaflet markers and route polyline to real-time helperCoords
  useEffect(() => {
    if (!helperCoords || !mapRef.current) return;

    // Stop simulated movement interval if it exists
    if (movementIntervalRef.current) {
      clearInterval(movementIntervalRef.current);
      movementIntervalRef.current = null;
    }

    const [hLat, hLng] = helperCoords;

    // Update responder marker location
    if (markerHelperRef.current) {
      markerHelperRef.current.setLatLng([hLat, hLng]);
    }

    // Update polyline route path
    if (polylineRef.current) {
      polylineRef.current.setLatLngs([[hLat, hLng], [userLat, userLng]]);
    }

    // Recalculate distance and ETA dynamically
    const dist = getDistanceFromLatLonInKm(hLat, hLng, userLat, userLng);
    setDistance(Number(dist.toFixed(1)));
    setEta(Math.max(1, Math.round(dist * 3))); // estimate 3 min per km

    // Adjust map to fit both markers
    const bounds = window.L.latLngBounds([[userLat, userLng], [hLat, hLng]]);
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });

  }, [helperCoords]);

  // Center on user position
  const reCenterMap = () => {
    if (mapRef.current) {
      mapRef.current.setView([userLat, userLng], 14, { animate: true });
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatDrawer]);

  // Handle message send
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // User message
    const msg = { sender: 'user', text: newMessage, time: 'Just now' };
    setChatMessages(prev => [...prev, msg]);
    setNewMessage('');

    // Trigger simulated responder response after 1.5s
    setTimeout(() => {
      const answers = [
        'Understood. I am on my way to your exact location.',
        'Preparing medical equipment. Please stay where you are.',
        'Almost there, keep the gate open if possible.',
        'Copy that. We are navigating through traffic.'
      ];
      const randomReply = answers[Math.floor(Math.random() * answers.length)];
      setChatMessages(prev => [...prev, { sender: 'helper', text: randomReply, time: 'Just now' }]);
    }, 1500);
  };

  // Cancel help request
  const handleCancelDistress = async () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);

    if (createdRequestId && user?.token) {
      try {
        await fetch(`${API_BASE_URL}/api/help-requests/${createdRequestId}/cancel`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
      } catch (err) {
        console.error('Cancellation error:', err);
      }
    }
    onCancel();
  };

  // Handle Share click
  const handleShare = () => {
    const shareUrl = `https://sanjivani.sync/track/${createdRequestId || 'EN123456'}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setToastMessage('Tracking link copied to clipboard!');
      setTimeout(() => setToastMessage(''), 2500);
    });
  };

  return (
    <div className="flex-1 flex flex-col md:grid md:grid-cols-[60%_40%] h-full w-full bg-white select-none relative z-10 overflow-hidden">
      
      {/* Visual Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-neutral-800 scale-up-animation">
          {toastMessage}
        </div>
      )}

      {/* 1. Header (Mobile Top bar / Desktop floating title) */}
      <div className="w-full flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-100 shrink-0 z-20 md:absolute md:top-4 md:left-4 md:w-auto md:bg-white/85 md:backdrop-blur-md md:rounded-2xl md:border md:shadow-lg md:px-5 md:py-3 md:gap-8">
        <button 
          onClick={handleCancelDistress}
          className="p-1.5 hover:bg-neutral-50 rounded-lg text-neutral-850 transition-colors focus:outline-none"
        >
          <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-sm font-extrabold text-neutral-900 tracking-tight">
          Live Tracking
        </h1>

        <div className="flex items-center gap-2.5">
          {/* Active Wiggling Bell Notification */}
          <button className="p-1 hover:bg-neutral-50 rounded-lg text-red-500 relative transition-colors focus:outline-none">
            <svg className="w-5.5 h-5.5 fill-current animate-[wiggle_1.5s_infinite_ease-in-out]" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-650 rounded-full" />
          </button>
          
          <button className="p-1 hover:bg-neutral-50 rounded-lg text-neutral-400 transition-colors focus:outline-none">
            <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Map Container (Pane 1) */}
      <div className="flex-1 h-0 min-h-[320px] md:min-h-[auto] md:h-full relative overflow-hidden bg-neutral-100 z-10">
        
        {/* Real Leaflet Map */}
        <div id="map-container" className="w-full h-full" />

        {/* Dynamic status floating card (Top Center) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-[calc(100%-32px)] sm:max-w-sm px-2">
          <div className="bg-white/90 backdrop-blur-md border border-neutral-100 shadow-md rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-red-500 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-md uppercase flex items-center gap-1 shadow-sm animate-pulse">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <span>Active</span>
              </div>
              <span className="text-[11px] font-black text-neutral-800 tracking-wider">SOS Distress</span>
            </div>
            <span className="text-[11px] font-bold text-neutral-500 tracking-wide font-mono">
              {displayId}
            </span>
          </div>
        </div>

        {/* Map Re-Center Button */}
        <button 
          onClick={reCenterMap}
          className="absolute bottom-4 right-4 z-20 w-11 h-11 bg-white border border-neutral-150 hover:bg-neutral-50 text-neutral-700 shadow-lg rounded-xl flex items-center justify-center transition-all focus:outline-none"
        >
          <svg className="w-5.5 h-5.5 stroke-current" fill="none" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        </button>
      </div>

      {/* 3. Details Panel / Bottom Sheet (Pane 2) */}
      <div className="bg-white rounded-t-3xl shadow-[0_-12px_24px_rgba(0,0,0,0.04)] px-6 py-6 md:rounded-none md:shadow-none md:border-l md:border-neutral-100 flex flex-col justify-between shrink-0 z-20 max-h-[50%] md:max-h-none overflow-y-auto md:h-full md:w-full">
        
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-4.5">
            <h3 className="text-sm font-extrabold text-neutral-850">
              Assigned Responder
            </h3>
            <span className="text-2xs font-extrabold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">
              En Route
            </span>
          </div>

          {/* Responder Card details */}
          <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-200 bg-white">
                <img 
                  src={responderInfo.avatar} 
                  alt={responderInfo.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-neutral-800 leading-tight">
                  {responderInfo.name}
                </h4>
                <span className="text-2xs text-neutral-450 leading-none block mt-0.5">
                  {responderInfo.role}
                </span>
              </div>
            </div>

            {/* Rating */}
            <div className="bg-green-50 text-green-700 font-extrabold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
              <span>★</span>
              <span>{responderInfo.rating}</span>
            </div>
          </div>

          {/* Metrics columns */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {/* ETA */}
            <div className="bg-neutral-50/50 border border-neutral-100 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">ETA</span>
              <p className="text-base font-extrabold text-neutral-850 mt-1">{eta} min</p>
            </div>
            
            {/* Distance */}
            <div className="bg-neutral-50/50 border border-neutral-100 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Distance</span>
              <p className="text-base font-extrabold text-neutral-850 mt-1">{distance} km</p>
            </div>

            {/* Priority */}
            <div className="bg-neutral-50/50 border border-neutral-100 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Priority</span>
              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-black text-neutral-850 leading-none">
                  {selectedSeverity ? (selectedSeverity.charAt(0).toUpperCase() + selectedSeverity.slice(1)) : 'Critical'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action button trigger bar */}
        <div className="flex flex-col gap-3 mt-6">
          <div className="grid grid-cols-3 gap-2.5">
            {/* Call */}
            <button 
              onClick={() => setShowCallModal(true)}
              type="button"
              className="bg-[#d61c24] hover:bg-[#b31018] text-white py-3 px-3.5 rounded-xl text-2xs font-extrabold flex items-center justify-center gap-1.5 transition-colors focus:outline-none active:scale-95 shadow-md shadow-red-500/10"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span>Call</span>
            </button>

            {/* Message */}
            <button 
              onClick={() => setShowChatDrawer(true)}
              type="button"
              className="bg-[#d61c24] hover:bg-[#b31018] text-white py-3 px-3.5 rounded-xl text-2xs font-extrabold flex items-center justify-center gap-1.5 transition-colors focus:outline-none active:scale-95 shadow-md shadow-red-500/10"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
              </svg>
              <span>Message</span>
            </button>

            {/* Share */}
            <button 
              onClick={handleShare}
              type="button"
              className="bg-[#d61c24] hover:bg-[#b31018] text-white py-3 px-3.5 rounded-xl text-2xs font-extrabold flex items-center justify-center gap-1.5 transition-colors focus:outline-none active:scale-95 shadow-md shadow-red-500/10"
            >
              <svg className="w-4 h-4 stroke-current fill-none" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.636-2.576m0 0a3 3 0 10-1.343-2.576m1.343 2.576a3 3 0 11-1.343 2.576m-4.636 2.576l4.636 2.576m0 0a3 3 0 121.343-2.576m-1.343 2.576a3 3 0 101.343 2.576" />
              </svg>
              <span>Share</span>
            </button>
          </div>

          {/* Abort Distress Action Button */}
          <button
            onClick={handleCancelDistress}
            type="button"
            className="w-full border border-red-200 text-[#d61c24] hover:bg-red-50 py-3 rounded-xl font-bold transition-all text-xs active:scale-95 focus:outline-none shadow-sm shadow-red-500/5 mt-1"
          >
            Cancel Alert
          </button>
        </div>

      </div>

      {/* CALL DIAL OVERLAY MODAL */}
      {showCallModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-100 shadow-2xl p-6 relative flex flex-col scale-up-animation">
            
            <button
              onClick={() => setShowCallModal(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full transition-colors focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center py-4 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02C8.79 6.42 8.6 5.23 8.6 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
                </svg>
              </div>
              <h3 className="text-base font-extrabold text-neutral-800">Call Paramedic</h3>
              <p className="text-xs text-neutral-400 mt-1">Speak directly with responder en route:</p>
              
              <span className="text-lg font-black text-neutral-850 tracking-wider mt-4 block">
                {responderInfo.phone}
              </span>
              
              <a 
                href={`tel:${responderInfo.phone.replace(/\s+/g, '')}`}
                className="mt-6 w-full bg-[#d61c24] hover:bg-[#b31018] text-white py-3.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 focus:outline-none"
              >
                <span>Call Now</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* CHAT INLINE DRAWER / OVERLAY */}
      {showChatDrawer && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-end justify-center md:items-center p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl border border-neutral-100 shadow-2xl flex flex-col h-[70vh] md:h-[550px] relative overflow-hidden scale-up-animation">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-150 flex items-center justify-between shrink-0 bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-200">
                  <img src={responderInfo.avatar} alt={responderInfo.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-neutral-850 leading-tight">{responderInfo.name}</h3>
                  <span className="text-3xs text-green-500 font-bold block">Online</span>
                </div>
              </div>
              
              <button 
                onClick={() => setShowChatDrawer(false)}
                className="p-1.5 hover:bg-neutral-150 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
              >
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 flex flex-col gap-4 bg-neutral-50/20">
              {chatMessages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={idx} className={`flex flex-col max-w-[80%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed font-semibold ${
                      isUser 
                        ? 'bg-[#d61c24] text-white rounded-tr-none' 
                        : 'bg-white border border-neutral-100 text-neutral-850 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-neutral-400 mt-1 tracking-wide font-medium">{msg.time}</span>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Input field footer */}
            <form onSubmit={handleSendMessage} className="px-5 py-3 border-t border-neutral-150 flex items-center gap-2 bg-white shrink-0">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 text-xs font-semibold px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:border-blue-500 text-neutral-850 placeholder-neutral-400"
              />
              <button 
                type="submit"
                className="w-10 h-10 bg-[#d61c24] hover:bg-[#b31018] text-white rounded-xl flex items-center justify-center shadow-md transition-colors focus:outline-none"
              >
                <svg className="w-4.5 h-4.5 fill-current text-white transform rotate-45" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
