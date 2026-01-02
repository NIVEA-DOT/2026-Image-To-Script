
import { SavedProject } from '../types';

const DB_NAME = 'KoreanScriptImageGeneratorDB';
const STORE_NAME = 'projects';
const DB_VERSION = 1;

// API key management functions removed as per guidelines. 
// Keys must be obtained exclusively from process.env.API_KEY or via window.aistudio.

// IndexedDB Management for Projects
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Check if indexedDB is supported
    if (!window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this browser."));
        return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveProject = async (project: SavedProject): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(project);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
      console.error("Failed to save project to DB:", e);
      throw e;
  }
};

export const getProjects = async (): Promise<SavedProject[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const results = request.result as SavedProject[];
            // Sort by timestamp descending (newest first)
            results.sort((a, b) => b.timestamp - a.timestamp);
            resolve(results);
        };
    });
  } catch (e) {
      console.error("Failed to get projects from DB:", e);
      return [];
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
      console.error("Failed to delete project from DB:", e);
      throw e;
  }
};
