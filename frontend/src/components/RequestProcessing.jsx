import React, { useState, useEffect, useRef } from 'react';

export default function RequestProcessing({
  user,
  selectedEmergency,
  selectedSeverity,
  activeContacts,
  onCancel,
  onComplete,
  setCreatedRequestId, // Lifted up to parent Dashboard
}) {
  const [createdRequestId, setCreatedRequestIdLocal] = useState(null);

  const saveRequestId = (id) => {
    setCreatedRequestIdLocal(id);
    if (setCreatedRequestId) {
      setCreatedRequestId(id);
    }
  };
  const [stepStates, setStepStates] = useState({
    received: 'idle',      // 'idle' | 'loading' | 'success' | 'error'
    matching: 'idle',
    finding: 'idle',
    notifying: 'idle',
  });
  const [errorMessage, setErrorMessage] = useState('');
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const pollIntervalRef = useRef(null);

  // Helper: map emergency ID to allowed backend helpType
  const mapEmergencyToHelpType = (id) => {
    switch (id) {
      case 'medical':
        return 'blood';
      case 'accident':
        return 'transport';
      case 'fire':
        return 'shelter';
      case 'safety':
        return 'shelter';
      case 'disaster':
        return 'shelter';
      default:
        return 'transport';
    }
  };

  // Helper: map frontend severity to backend urgency
  const mapSeverityToUrgency = (id) => {
    switch (id) {
      case 'minor':
        return 'low';
      case 'serious':
        return 'high';
      case 'critical':
        return 'critical';
      default:
        return 'medium';
    }
  };

  // 1. Create the Help Request on backend
  useEffect(() => {
    const createRequest = async () => {
      setStepStates(prev => ({ ...prev, received: 'loading' }));
      
      const payload = {
        helpType: mapEmergencyToHelpType(selectedEmergency?.id),
        description: `[SOS Distress Alert] Category: ${selectedEmergency?.title || 'General Emergency'}. Severity: ${selectedSeverity?.toUpperCase() || 'CRITICAL'}. Notified Emergency Contacts: ${activeContacts.map(c => `${c.name} (${c.phone})`).join(', ') || 'None'}.`,
        urgency: mapSeverityToUrgency(selectedSeverity),
        location: {
          address: user?.location?.address || 'New Market, Bhopal, MP',
          coordinates: user?.location?.coordinates?.coordinates || [77.4126, 23.2599] // default to Bhopal if missing
        }
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/help-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to create emergency request');
        }

        const requestObj = data.helpRequest;
        saveRequestId(requestObj._id);
        setStepStates(prev => ({ 
          ...prev, 
          received: 'success',
          matching: 'loading' 
        }));
      } catch (err) {
        console.error('API Error:', err);
        setStepStates(prev => ({ ...prev, received: 'error' }));
        setErrorMessage(err.message || 'Connection failed.');
      }
    };

    createRequest();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // 2. Poll the Help Request status
  useEffect(() => {
    if (!createdRequestId || !user?.token) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/help-requests/my-requests`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!res.ok) return;

        const requests = await res.json();
        const currentRequest = requests.find(r => r._id === createdRequestId);

        if (currentRequest) {
          // If status changes to accepted
          if (currentRequest.status === 'accepted') {
            clearInterval(pollIntervalRef.current);
            setStepStates({
              received: 'success',
              matching: 'success',
              finding: 'success',
              notifying: 'success',
            });
            // Brief delay to let the user see all steps checked before redirecting
            setTimeout(() => {
              onComplete();
            }, 800);
          } else if (currentRequest.status === 'cancelled' || currentRequest.status === 'resolved') {
            clearInterval(pollIntervalRef.current);
            onCancel();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    pollIntervalRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [createdRequestId, user?.token]);

  // No offline fallback - wait for real response

  // 3. Cancel Help Request
  const handleCancelRequest = async () => {
    // Trigger vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    if (createdRequestId && user?.token) {
      try {
        await fetch(`${API_BASE_URL}/api/help-requests/${createdRequestId}/cancel`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
      } catch (err) {
        console.error('Failed to cancel request in backend:', err);
      }
    }
    onCancel();
  };

  return (
    <div className="flex-1 flex flex-col justify-between items-center px-6 py-4 md:py-8 max-w-md md:max-w-4xl mx-auto w-full h-full bg-white md:bg-white/60 md:backdrop-blur-xl md:border md:border-neutral-100/60 md:shadow-xl md:shadow-neutral-250/20 md:rounded-3xl select-none relative z-10">
      
      {/* 1. Header with Red Tag Banner */}
      <div className="w-full flex justify-center mt-2 md:mt-0">
        <div className="bg-[#d61c24] text-white text-[11px] font-black tracking-widest px-5 py-2.5 rounded-full uppercase shadow-md shadow-red-500/10">
          SOS Dispatch
        </div>
      </div>

      {/* Grid container wrapper */}
      <div className="w-full flex-1 flex flex-col md:grid md:grid-cols-2 md:gap-12 md:items-center justify-center my-auto px-2 md:px-6">
        
        {/* Left Column: Pulsing Radar & Header Title */}
        <div className="flex flex-col items-center justify-center text-center">
          
          {/* Status Titles */}
          <div className="mt-4 md:mt-0 md:mb-6">
            <h2 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight leading-tight">
              Finding nearest help...
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 mt-1.5 font-medium">
              Please don't close the app
            </p>
          </div>

          {/* Concentric SOS Radar Ripple */}
          <div className="relative w-56 h-56 md:w-60 md:h-60 flex items-center justify-center my-4 md:my-0">
            {/* Animated Ripple Waves */}
            <div className="absolute w-36 h-36 md:w-40 md:h-40 rounded-full border border-red-500/25 animate-radar-1" />
            <div className="absolute w-36 h-36 md:w-40 md:h-40 rounded-full border border-red-500/20 animate-radar-2" />
            <div className="absolute w-36 h-36 md:w-40 md:h-40 rounded-full border border-red-500/15 animate-radar-3" />
            
            {/* Radar Ring Accents */}
            <div className="absolute w-44 h-44 md:w-48 md:h-48 rounded-full border border-red-100/50 flex items-center justify-center">
              <div className="absolute w-36 h-36 md:w-40 md:h-40 rounded-full border border-red-100/30 flex items-center justify-center">
                <div className="absolute w-28 h-28 md:w-32 md:h-32 rounded-full border border-red-100/10" />
              </div>
            </div>

            {/* SOS Center Circle */}
            <div className="relative w-22 h-22 md:w-26 md:h-26 rounded-full bg-red-50 flex items-center justify-center shadow-lg shadow-red-500/10 z-10">
              <div className="absolute inset-1 rounded-full bg-red-100/60" />
              <div className="absolute inset-2 rounded-full bg-[#d61c24] flex items-center justify-center text-white font-black text-lg md:text-xl tracking-wider shadow-inner shadow-black/15">
                SOS
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Progress Checklist, Cancel Button, Warning notice */}
        <div className="flex flex-col items-center md:items-stretch justify-center w-full max-w-[280px] md:max-w-none md:px-2">
          
          {/* Checklist items */}
          <div className="w-full flex flex-col gap-4.5">
            {/* Step 1: Request Received */}
            <div className="flex items-center gap-4">
              <ChecklistIcon state={stepStates.received} />
              <span className={`text-xs md:text-sm font-bold transition-colors duration-300 ${
                stepStates.received === 'success' ? 'text-neutral-800' : 'text-neutral-400'
              }`}>
                Request Received
              </span>
            </div>

            {/* Step 2: Matching Responders */}
            <div className="flex items-center gap-4">
              <ChecklistIcon state={stepStates.matching} />
              <span className={`text-xs md:text-sm font-bold transition-colors duration-300 ${
                stepStates.matching === 'success' ? 'text-neutral-800' : 'text-neutral-400'
              }`}>
                Matching Responders
              </span>
            </div>

            {/* Step 3: Finding Nearest Resources */}
            <div className="flex items-center gap-4">
              <ChecklistIcon state={stepStates.finding} />
              <span className={`text-xs md:text-sm font-bold transition-colors duration-300 ${
                stepStates.finding === 'success' ? 'text-neutral-800' : 'text-neutral-400'
              }`}>
                Finding Nearest Resources
              </span>
            </div>

            {/* Step 4: Notifying Contacts */}
            <div className="flex items-center gap-4">
              <ChecklistIcon state={stepStates.notifying} />
              <span className={`text-xs md:text-sm font-bold transition-colors duration-300 ${
                stepStates.notifying === 'success' ? 'text-neutral-800' : 'text-neutral-400'
              }`}>
                Notifying Contacts
              </span>
            </div>

            {/* Cancel Button below the checklist */}
            <button
              onClick={handleCancelRequest}
              type="button"
              className="mt-2 w-full border border-red-200 text-[#d61c24] hover:bg-red-50 py-3 rounded-xl font-bold transition-all text-xs md:text-sm active:scale-95 focus:outline-none shadow-sm shadow-red-500/5"
            >
              Cancel Request
            </button>
          </div>

          {/* Warning Notice Card inside column */}
          <div className="w-full bg-[#f0f4ff]/70 border border-[#e0e8ff]/80 rounded-2xl p-4 flex items-start gap-3.5 mt-6 shadow-sm shadow-[#e0e8ff]/10">
            <div className="w-5.5 h-5.5 rounded-full bg-[#e0e8ff] text-[#1e50bb] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-2xs md:text-xs font-extrabold text-[#1e50bb] leading-none">
                This may take a few seconds
              </p>
              <p className="text-[10px] md:text-2xs text-neutral-450 font-semibold mt-1.5 leading-snug">
                We are working on it.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

// Checklist Icon helper component
function ChecklistIcon({ state }) {
  if (state === 'success') {
    return (
      <div className="w-5.5 h-5.5 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-300">
        <svg className="w-3 h-3 stroke-current fill-none" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="w-5.5 h-5.5 rounded-full bg-red-50 text-red-500 border border-red-200 flex items-center justify-center flex-shrink-0 relative">
        <div className="absolute inset-0.5 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="w-5.5 h-5.5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  // idle state
  return (
    <div className="w-5.5 h-5.5 rounded-full border-2 border-neutral-200 bg-white flex-shrink-0 transition-colors duration-300" />
  );
}
