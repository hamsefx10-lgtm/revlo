// PWA Registration Script
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, refresh the page
                if (confirm('New version available! Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Handle PWA install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install buttons or prompt
  const installButton = document.getElementById('pwa-install-button');
  const installButtonMain = document.getElementById('pwa-install-button-main');
  
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', () => {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
    });
  }
  
  if (installButtonMain) {
    installButtonMain.style.display = 'block';
    installButtonMain.addEventListener('click', () => {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
    });
  }
});

// Handle app installed event
window.addEventListener('appinstalled', (evt) => {
  console.log('PWA was installed');
  // Hide install buttons
  const installButton = document.getElementById('pwa-install-button');
  const installButtonMain = document.getElementById('pwa-install-button-main');
  
  if (installButton) {
    installButton.style.display = 'none';
  }
  
  if (installButtonMain) {
    installButtonMain.style.display = 'none';
  }
});

// Check if app is running in standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('App is running in standalone mode');
  // Hide install buttons if app is already installed
  const installButton = document.getElementById('pwa-install-button');
  const installButtonMain = document.getElementById('pwa-install-button-main');
  
  if (installButton) {
    installButton.style.display = 'none';
  }
  
  if (installButtonMain) {
    installButtonMain.style.display = 'none';
  }
}

// Handle online/offline status
window.addEventListener('online', () => {
  console.log('App is online');
  // Show online indicator
  const onlineIndicator = document.getElementById('online-indicator');
  if (onlineIndicator) {
    onlineIndicator.textContent = 'Online';
    onlineIndicator.className = 'text-green-500';
  }
});

window.addEventListener('offline', () => {
  console.log('App is offline');
  // Show offline indicator
  const onlineIndicator = document.getElementById('online-indicator');
  if (onlineIndicator) {
    onlineIndicator.textContent = 'Offline';
    onlineIndicator.className = 'text-red-500';
  }
});

// Request notification permission
if ('Notification' in window) {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    });
  }
}
