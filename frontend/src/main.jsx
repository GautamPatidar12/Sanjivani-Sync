import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { subscribeUserToPush, sendSubscriptionToBackend } from './utils/pwa'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1099022258529-verl29ed1b89dnif791i1mds0b76e6bg.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)

// Register SW and Push
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', async () => {
    try {
      // Wait for vite-plugin-pwa to register the SW
      const registration = await navigator.serviceWorker.ready;
      
      // Request permission only if not already granted or denied
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const subscription = await subscribeUserToPush(registration);
          if (subscription) {
            await sendSubscriptionToBackend(subscription);
          }
        }
      } else if (Notification.permission === 'granted') {
        const subscription = await registration.pushManager.getSubscription() || await subscribeUserToPush(registration);
        if (subscription) {
          await sendSubscriptionToBackend(subscription);
        }
      }
    } catch (err) {
      console.error('SW registration failed: ', err);
    }
  });
}
