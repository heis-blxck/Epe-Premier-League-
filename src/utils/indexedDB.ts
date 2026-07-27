export const setCustomSoundPreference = async (enabled: boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EpeSettingsDB', 1);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences');
      }
    };

    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const tx = db.transaction('preferences', 'readwrite');
      const store = tx.objectStore('preferences');
      const putReq = store.put(enabled, 'customSoundEnabled');
      
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    request.onerror = () => reject(request.error);
  });
};

export const getCustomSoundPreference = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EpeSettingsDB', 1);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences');
      }
    };

    request.onsuccess = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('preferences')) {
        resolve(true);
        return;
      }
      const tx = db.transaction('preferences', 'readonly');
      const store = tx.objectStore('preferences');
      const getReq = store.get('customSoundEnabled');
      
      getReq.onsuccess = () => {
        resolve(getReq.result !== undefined ? getReq.result : true);
      };
      getReq.onerror = () => resolve(true);
    };

    request.onerror = () => resolve(true);
  });
};
