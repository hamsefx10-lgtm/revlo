// electron/preload.js - Preload Script (Security Bridge)
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Online/Offline status
  checkOnlineStatus: () => ipcRenderer.invoke('check-online-status'),
  onOnlineStatusChange: (callback) => {
    ipcRenderer.on('online-status', (event, isOnline) => callback(isOnline));
  },
  
  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Platform info
  platform: process.platform,
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// Expose offline database API
contextBridge.exposeInMainWorld('offlineDB', {
  // These will be implemented in the offline service
  save: (key, data) => {
    return new Promise((resolve, reject) => {
      try {
        const db = indexedDB.open('revlo-offline-db', 1);
        db.onsuccess = () => {
          const transaction = db.result.transaction(['data'], 'readwrite');
          const store = transaction.objectStore('data');
          store.put({ key, data, timestamp: Date.now() });
          resolve();
        };
        db.onerror = reject;
      } catch (error) {
        reject(error);
      }
    });
  },
  
  get: (key) => {
    return new Promise((resolve, reject) => {
      try {
        const db = indexedDB.open('revlo-offline-db', 1);
        db.onsuccess = () => {
          const transaction = db.result.transaction(['data'], 'readonly');
          const store = transaction.objectStore('data');
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result?.data);
          request.onerror = reject;
        };
        db.onerror = reject;
      } catch (error) {
        reject(error);
      }
    });
  },
});

