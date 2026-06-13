import React, { useState, useEffect, useRef } from 'react';

export default function Listings({ user, onBack }) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [subTab, setSubTab] = useState('alerts'); // 'alerts' or 'missions'
  const [alerts, setAlerts] = useState([]);
  const [missions, setMissions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Map refs
  const mapRef = useRef(null);
  const activeMarkersRef = useRef([]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 1. Inject Leaflet CDN files
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  // 2. Geolocation: Send helper's real coordinates to backend to update DB
  useEffect(() => {
    if (!user?.token) return;

    const updateHelperLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              await fetch(`${API_BASE_URL}/api/users/status`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                  isOnline: true,
                  location: {
                    address: user.location?.address || 'Helper Live Location',
                    coordinates: [longitude, latitude] // [lng, lat]
                  }
                })
              });
            } catch (err) {
              console.error('Error updating helper location:', err);
            }
          },
          (err) => console.warn('Geolocation permission or error:', err),
          { enableHighAccuracy: true }
        );
      }
    };

    updateHelperLocation();
    const interval = setInterval(updateHelperLocation, 10000); // update helper GPS every 10s
    return () => clearInterval(interval);
  }, [user?.token]);

  // 3. Fetch Alerts & Missions
  const fetchAlerts = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/help-requests/all-pending`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Error fetching pending alerts:', err);
    }
  };

  const fetchMissions = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/help-requests/my-assignments`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMissions(data);
      }
    } catch (err) {
      console.error('Error fetching missions:', err);
    }
  };

  // Poll pending alerts every 3 seconds for quick response listing
  useEffect(() => {
    fetchAlerts();
    fetchMissions();

    const interval = setInterval(() => {
      fetchAlerts();
    }, 3000);

    return () => clearInterval(interval);
  }, [user?.token]);

  // Update lists and markers when subtab changes
  useEffect(() => {
    setSelectedItem(null);
    if (subTab === 'alerts') {
      fetchAlerts();
    } else {
      fetchMissions();
    }
  }, [subTab]);

  // 4. Initialize & Update Leaflet Map and Markers
  useEffect(() => {
    if (!leafletLoaded) return;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      const map = window.L.map('listings-map-container', {
        zoomControl: false
      }).setView([23.2599, 77.4126], 12); // Fallback to Bhopal

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;

    // Clear existing markers
    activeMarkersRef.current.forEach(marker => marker.remove());
    activeMarkersRef.current = [];

    // Select source list based on subTab
    const currentList = subTab === 'alerts' ? alerts : missions;

    // Icons
    const patientIcon = window.L.divIcon({
      html: `<div class="relative w-8 h-8 flex items-center justify-center">
               <div class="absolute w-7 h-7 rounded-full bg-red-500/20 animate-ping"></div>
               <div class="absolute w-5 h-5 rounded-full bg-red-500/35"></div>
               <div class="w-3 h-3 bg-red-600 border border-white rounded-full shadow-md"></div>
             </div>`,
      className: 'custom-leaflet-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const missionIcon = window.L.divIcon({
      html: `<div class="relative w-8 h-8 flex items-center justify-center">
               <div class="absolute w-7 h-7 rounded-full bg-blue-500/20 animate-pulse"></div>
               <div class="absolute w-5 h-5 rounded-full bg-blue-500/35"></div>
               <div class="w-3 h-3 bg-blue-600 border border-white rounded-full shadow-md"></div>
             </div>`,
      className: 'custom-leaflet-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const newMarkers = [];

    currentList.forEach(item => {
      const coords = item.location?.coordinates?.coordinates;
      if (!coords || coords.length < 2) return;

      const lng = coords[0];
      const lat = coords[1];

      // Prevent 0,0 default crashes
      if (lat === 0 && lng === 0) return;

      const marker = window.L.marker([lat, lng], {
        icon: subTab === 'alerts' ? patientIcon : missionIcon
      }).addTo(map);

      const typeLabel = item.helpType.toUpperCase();
      const urgencyLabel = item.urgency ? item.urgency.toUpperCase() : 'MEDIUM';

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 11px; padding: 2px;">
          <strong style="color: #d61c24;">${typeLabel} Alert</strong><br/>
          <strong>Name:</strong> ${item.requester?.name || 'Anonymous'}<br/>
          <strong>Urgency:</strong> ${urgencyLabel}<br/>
          <strong>Address:</strong> ${item.location.address}
        </div>
      `);

      marker.on('click', () => {
        setSelectedItem(item);
        map.setView([lat, lng], 14, { animate: true });
      });

      newMarkers.push(marker);
    });

    activeMarkersRef.current = newMarkers;

    // Adjust map view to fit all markers
    if (newMarkers.length > 0) {
      const group = new window.L.featureGroup(newMarkers);
      map.fitBounds(group.getBounds().pad(0.15));
    }

  }, [leafletLoaded, alerts, missions, subTab]);

  // Center Map on a specific item
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    const coords = item.location?.coordinates?.coordinates;
    if (coords && coords.length >= 2 && mapRef.current) {
      mapRef.current.setView([coords[1], coords[0]], 15, { animate: true });
    }
  };

  // Accept Help Request
  const handleAcceptAlert = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/help-requests/${id}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('SOS Alert Accepted! Heading to location...');
        fetchAlerts();
        fetchMissions();
        setSubTab('missions');
      } else {
        showToast(data.message || 'Could not accept alert.');
      }
    } catch (err) {
      console.error('Accept error:', err);
      showToast('Connection error.');
    }
  };

  // Resolve Help Request
  const handleResolveAlert = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/help-requests/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('SOS request marked as resolved.');
        fetchAlerts();
        fetchMissions();
        setSelectedItem(null);
      } else {
        showToast(data.message || 'Could not resolve alert.');
      }
    } catch (err) {
      console.error('Resolve error:', err);
      showToast('Connection error.');
    }
  };

  return (
    <div className="flex-1 flex flex-col md:grid md:grid-cols-[55%_45%] h-full w-full bg-white select-none relative z-10 overflow-hidden">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-neutral-800 scale-up-animation">
          {toastMessage}
        </div>
      )}

      {/* 1. Map Panel (Left side on desktop) */}
      <div className="flex-1 h-0 min-h-[300px] md:min-h-[auto] md:h-full relative overflow-hidden bg-neutral-100 z-10">
        <div id="listings-map-container" className="w-full h-full" />
        
        {/* Quick Back button overlay on mobile */}
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 z-20 p-2.5 bg-white border border-neutral-150 text-neutral-800 shadow-md rounded-xl hover:bg-neutral-50 md:hidden"
        >
          <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* 2. Listings Sidebar/Details (Right side) */}
      <div className="bg-white rounded-t-3xl shadow-[0_-12px_24px_rgba(0,0,0,0.04)] md:rounded-none md:shadow-none md:border-l md:border-neutral-100 flex flex-col shrink-0 z-20 max-h-[60%] md:max-h-none md:h-full overflow-hidden">
        
        {/* Section Header & SubTabs */}
        <div className="px-6 pt-5 pb-3 border-b border-neutral-100/80 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-650 rounded-full animate-ping" />
              Emergency Dashboard
            </h2>
            <button 
              onClick={onBack}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-700 hidden md:block"
            >
              Back to Home
            </button>
          </div>

          {/* SubTab Toggle buttons */}
          <div className="flex bg-neutral-100 p-1 rounded-xl mt-4">
            <button
              onClick={() => setSubTab('alerts')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${subTab === 'alerts' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              Active SOS Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setSubTab('missions')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${subTab === 'missions' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              My Missions ({missions.length})
            </button>
          </div>
        </div>

        {/* Scrollable Feed List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-4">
          
          {/* Detailed Selected Card View */}
          {selectedItem ? (
            <div className="bg-red-50/20 border border-red-100 rounded-2xl p-4 flex flex-col gap-4 animate-scaleUp">
              {/* Header info */}
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                    selectedItem.urgency === 'critical' ? 'bg-red-650 text-white animate-pulse' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedItem.urgency || 'medium'} urgency
                  </span>
                  <h3 className="text-sm font-extrabold text-neutral-850 mt-2.5">
                    {selectedItem.helpType.toUpperCase()} ALERT
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-xs font-bold text-neutral-400 hover:text-neutral-600"
                >
                  Close details
                </button>
              </div>

              {/* Patient info */}
              <div className="bg-white rounded-xl border border-neutral-100 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-black text-neutral-700 uppercase">
                  {(selectedItem.requester?.name || 'U').substring(0, 2)}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-neutral-800">{selectedItem.requester?.name || 'Anonymous Patient'}</h4>
                  <p className="text-[11px] text-neutral-450 mt-0.5">{selectedItem.requester?.contactNumber || 'N/A'}</p>
                </div>
              </div>

              {/* Description text */}
              <div className="text-xs text-neutral-600 leading-relaxed bg-white border border-neutral-100 rounded-xl p-3">
                <strong>Situation Details:</strong>
                <p className="mt-1 font-semibold">{selectedItem.description}</p>
                <div className="mt-2 text-[10px] text-neutral-400">
                  <strong>Address:</strong> {selectedItem.location.address}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-2">
                {subTab === 'alerts' ? (
                  <button
                    onClick={() => handleAcceptAlert(selectedItem._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-red-500/10 active:scale-95 transition-all text-center"
                  >
                    Accept SOS &amp; Respond
                  </button>
                ) : (
                  <>
                    <a
                      href={`tel:${selectedItem.requester?.contactNumber}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                      Call
                    </a>
                    <button
                      onClick={() => handleResolveAlert(selectedItem._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
                    >
                      Resolve SOS
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {/* List Feed items */}
          <div className="flex flex-col gap-3">
            {subTab === 'alerts' ? (
              alerts.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center">
                  <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 mb-3 text-lg">🔔</div>
                  <h3 className="text-xs font-bold text-neutral-800">No active SOS alerts</h3>
                  <p className="text-[11px] text-neutral-400 mt-1 max-w-[200px] leading-relaxed">System is polling. Alerts show up here instantly when a user taps SOS.</p>
                </div>
              ) : (
                alerts.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleSelectItem(item)}
                    className="w-full bg-white border border-neutral-100 hover:border-red-100 rounded-xl p-4 flex items-center justify-between text-left transition-all hover:shadow-md focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 text-red-650 rounded-full flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {item.helpType.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-neutral-850 flex items-center gap-2">
                          {item.helpType.toUpperCase()}
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.urgency === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                          }`} />
                        </h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1 max-w-[180px] sm:max-w-xs">{item.location.address}</p>
                      </div>
                    </div>
                    <span className="text-3xs text-neutral-400 font-bold bg-neutral-50 px-2.5 py-1 rounded-md uppercase">
                      View
                    </span>
                  </button>
                ))
              )
            ) : (
              missions.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center">
                  <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 mb-3 text-lg">🛡️</div>
                  <h3 className="text-xs font-bold text-neutral-800">No active missions</h3>
                  <p className="text-[11px] text-neutral-400 mt-1 max-w-[200px] leading-relaxed">Accept an SOS alert from the Active feed to start a rescue mission.</p>
                </div>
              ) : (
                missions.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleSelectItem(item)}
                    className="w-full bg-white border border-neutral-100 hover:border-blue-100 rounded-xl p-4 flex items-center justify-between text-left transition-all hover:shadow-md focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {item.helpType.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-neutral-850 flex items-center gap-2">
                          {item.helpType.toUpperCase()}
                          <span className="text-3xs text-green-500 font-bold uppercase">(Accepted)</span>
                        </h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1 max-w-[180px] sm:max-w-xs">{item.location.address}</p>
                      </div>
                    </div>
                    <span className="text-3xs text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-md uppercase">
                      Action
                    </span>
                  </button>
                ))
              )
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
