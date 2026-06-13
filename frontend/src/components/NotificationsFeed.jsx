import React, { useState, useEffect } from 'react';

export default function NotificationsFeed() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/help-requests/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const getWhatsAppLink = (number, type) => {
    const text = encodeURIComponent(`I saw your emergency request for ${type} on Sanjivani Sync, how can I help?`);
    return `https://wa.me/${number}?text=${text}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-neutral-50 rounded-2xl p-8 text-center border border-neutral-100 flex flex-col items-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h3 className="text-neutral-800 font-bold mb-1">No Active Alerts</h3>
        <p className="text-xs text-neutral-500">There are no matching emergency requests in your area right now.</p>
      </div>
    );
  }

  const [permission, setPermission] = useState('Notification' in window ? Notification.permission : 'denied');

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        try {
          const { subscribeUserToPush, sendSubscriptionToBackend } = await import('../utils/pwa');
          const registration = await navigator.serviceWorker.ready;
          const subscription = await subscribeUserToPush(registration);
          if (subscription) {
            await sendSubscriptionToBackend(subscription);
            alert('Push notifications enabled!');
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {permission === 'default' && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-900">Enable Push Notifications</h4>
              <p className="text-xs text-blue-700 mt-0.5">Get instant alerts when someone nearby needs emergency help.</p>
            </div>
          </div>
          <button onClick={handleEnableNotifications} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm whitespace-nowrap">
            Allow Notifications
          </button>
        </div>
      )}

      {notifications.map((req) => (
        <div key={req._id} className="bg-white border border-red-100/50 shadow-[0_4px_20px_rgba(214,28,36,0.05)] rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1.5 h-full ${req.urgency === 'critical' ? 'bg-red-500' : req.urgency === 'serious' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
          
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide mb-2 ${req.urgency === 'critical' ? 'bg-red-100 text-red-700' : req.urgency === 'serious' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                {req.urgency} Priority
              </span>
              <h3 className="text-lg font-black text-neutral-800 tracking-tight">{req.helpType.charAt(0).toUpperCase() + req.helpType.slice(1)} Required</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{req.description}</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-neutral-700">{req.requester?.name || 'Unknown'}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5 max-w-[120px] truncate">{req.location?.address}</div>
            </div>
          </div>

          <div className="h-px w-full bg-neutral-100 my-3"></div>

          <div className="flex gap-3 mt-1">
            <a 
              href={`tel:${req.requester?.contactNumber}`}
              className="flex-1 flex items-center justify-center gap-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </a>
            <a 
              href={getWhatsAppLink(req.requester?.contactNumber, req.helpType)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
