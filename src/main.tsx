import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';


if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered successfully:', registration);
        })
        .catch(err => {
          console.log('SW registration fallback to firebase SW:', err);
          navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <App />
  </StrictMode>,
);
