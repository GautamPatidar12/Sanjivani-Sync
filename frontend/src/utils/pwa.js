export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush(registration) {
  try {
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn('No VAPID key provided');
      return null;
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe user:', error);
    return null;
  }
}

export async function sendSubscriptionToBackend(subscription) {
  const token = localStorage.getItem('token');
  if (!token) return;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  await fetch(`${API_URL}/api/users/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ subscription }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
}
