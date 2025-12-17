# Revlo Desktop App - Electron Setup Guide

## 🚀 Qorshaha Desktop App-ka

Waxaan kuu diyaariyay qorshaha dhamaystiran oo ah desktop application oo online iyo offline u shaqeysa.

## 📦 Files-ka la Sameeyay

1. **electron/main.js** - Electron main process (app-ka furi)
2. **electron/preload.js** - Security bridge (safety)
3. **lib/offline-db.ts** - Offline database service (IndexedDB)
4. **lib/sync-service.ts** - Online/Offline sync service
5. **package.json** - Updated with Electron dependencies
6. **next.config.js** - Updated for Electron compatibility

## 🔧 Installation

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Development Mode

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Electron
npm run electron:dev
```

### Step 3: Build Desktop App

#### Windows:
```bash
npm run electron:build:win
```

#### Mac:
```bash
npm run electron:build:mac
```

#### Linux:
```bash
npm run electron:build:linux
```

## 📱 Features

### ✅ Online/Offline Support
- App-ka wuxuu shaqeeyaa online iyo offline
- Xogta offline-ka lagu keydinayaa IndexedDB
- Marka online noqoto, xogta si toos ah ayay u isku dhejisaa

### ✅ Auto-Sync
- Xogta cusub offline-ka lagu keydinayaa
- Marka online noqoto, si toos ah ayay u sync-gareysaa
- Conflict resolution leh

### ✅ Cross-Platform
- Windows (EXE installer)
- Mac (DMG installer)
- Linux (AppImage, DEB)

## 🎯 Sida loo Isticmaalo

### 1. Offline Database

```typescript
import { offlineDB } from '@/lib/offline-db';

// Save data offline
await offlineDB.save('expense-123', expenseData);

// Get data from offline
const data = await offlineDB.get('expense-123');
```

### 2. Sync Service

```typescript
import { syncService, fetchWithOfflineSupport } from '@/lib/sync-service';

// Save for sync (works offline)
await syncService.saveForSync(
  'expense-123',
  expenseData,
  '/api/expenses',
  'POST'
);

// Use fetch with offline support
const response = await fetchWithOfflineSupport(
  '/api/expenses',
  {
    method: 'POST',
    body: JSON.stringify(expenseData),
  },
  'expense-123' // offline key
);
```

## 🔐 Security

- Context isolation enabled
- Node integration disabled
- Sandbox enabled
- Preload script for secure IPC

## 📝 Notes

- Development: Electron connects to `http://localhost:3000`
- Production: Electron serves from built Next.js app
- Offline data stored in IndexedDB (browser storage)
- Auto-sync runs every 30 seconds when online

## 🐛 Troubleshooting

### Electron ma furan?
- Hubi in Next.js dev server uu shaqeynayo (`npm run dev`)
- Hubi in Electron dependencies la install-gareeyay

### Offline ma shaqeynayo?
- Hubi in browser-ka IndexedDB uu taageero
- Check browser console for errors

### Sync ma shaqeynayo?
- Hubi in online status uu sax yahay
- Check network tab for API calls

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Waxaa la sameeyay:** Revlo Desktop App Setup
**Taariikhda:** 2024


