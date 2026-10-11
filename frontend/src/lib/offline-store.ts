'use client';

export interface OfflineIssueDraft {
  id: string;
  title: string;
  description: string;
  category: string;
  settlementType: 'rural_panchayat' | 'urban_municipal';
  villageOrWard: string;
  officeId: string;
  isAssisted?: boolean;
  citizenName?: string;
  citizenPhone?: string;
  audioBlob?: Blob;
  photoBlobs?: Blob[];
  createdAt: number;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

const DB_NAME = 'raise_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_issues';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persists an issue draft and attached multimedia blobs directly to the device storage.
 */
export async function saveOfflineIssue(draft: Omit<OfflineIssueDraft, 'id' | 'createdAt' | 'syncStatus'>): Promise<OfflineIssueDraft> {
  const db = await openDatabase();
  const fullDraft: OfflineIssueDraft = {
    ...draft,
    id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: Date.now(),
    syncStatus: 'pending',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(fullDraft);

    req.onsuccess = () => resolve(fullDraft);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all offline grievances queued on this device.
 */
export async function getPendingOfflineIssues(): Promise<OfflineIssueDraft[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Removes a synced offline draft.
 */
export async function removeOfflineIssue(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Attempts to automatically synchronize all pending drafts with RAISE servers.
 */
export async function syncPendingIssues(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const items = await getPendingOfflineIssues();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const formData = new FormData();
      formData.append('title', item.title);
      formData.append('description', item.description);
      formData.append('category', item.category);
      formData.append('officeId', item.officeId);
      formData.append('settlementType', item.settlementType);
      formData.append('villageOrWard', item.villageOrWard);

      if (item.audioBlob) {
        formData.append('media', item.audioBlob, 'voice_note.webm');
      }

      if (item.photoBlobs) {
        item.photoBlobs.forEach((p, idx) => {
          formData.append('media', p, `photo_${idx + 1}.jpg`);
        });
      }

      const endpoint = item.isAssisted ? '/api/issues/assisted' : '/api/issues';
      if (item.isAssisted) {
        formData.append('citizenName', item.citizenName || 'Village Resident');
        formData.append('citizenPhone', item.citizenPhone || '');
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (res.ok) {
        await removeOfflineIssue(item.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
