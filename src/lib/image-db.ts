import { StoredImage } from "@/types";
import { generateId } from "./utils";

const DB_NAME = "utsavai_media_db";
const DB_VERSION = 1;
const STORE_NAME = "images";

// Fallback in-memory map for environments where IndexedDB is blocked or disabled
const memoryFallback = new Map<string, StoredImage>();

/**
 * Open or upgrade the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("eventId", "eventId", { unique: false });
        store.createIndex("analysisId", "analysisId", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });
}

/**
 * Compress an image file/blob to a web-friendly size and dimensions
 */
export async function compressImage(
  fileOrBlob: File | Blob,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.82
): Promise<{ blob: Blob; width: number; height: number; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Image compression requires browser environment"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mime = fileOrBlob.type === "image/png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mime, quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, width, height, dataUrl });
            } else {
              // Fallback to original blob if canvas export failed
              resolve({
                blob: fileOrBlob,
                width: img.width,
                height: img.height,
                dataUrl,
              });
            }
          },
          mime,
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Save an image to IndexedDB
 */
export async function saveImage(image: StoredImage): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(image);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Failed to save image in IndexedDB"));
    });
  } catch (err) {
    console.warn("IndexedDB save failed, falling back to memory fallback", err);
    memoryFallback.set(image.id, image);
  }
}

/**
 * Convenience method: Compress, create StoredImage, and persist into IndexedDB
 */
export async function saveImageBlob(params: {
  id?: string;
  eventId: string;
  analysisId?: string;
  fileOrBlob: Blob | File;
  filename?: string;
}): Promise<StoredImage> {
  const { id = generateId(), eventId, analysisId, fileOrBlob, filename = "image.jpg" } = params;

  // Compress to reasonable dimensions
  let blobToSave = fileOrBlob;
  try {
    const compressed = await compressImage(fileOrBlob);
    blobToSave = compressed.blob;
  } catch (e) {
    console.warn("Image compression skipped or failed, saving original blob", e);
  }

  const storedImage: StoredImage = {
    id,
    eventId,
    analysisId,
    filename,
    mimeType: blobToSave.type || "image/jpeg",
    size: blobToSave.size,
    data: blobToSave,
    createdAt: new Date().toISOString(),
  };

  await saveImage(storedImage);
  return storedImage;
}

/**
 * Retrieve an image record from IndexedDB
 */
export async function getImage(id: string): Promise<StoredImage | null> {
  if (memoryFallback.has(id)) {
    return memoryFallback.get(id) || null;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(request.error || new Error(`Failed to get image ${id} from IndexedDB`));
      };
    });
  } catch (err) {
    console.warn(`IndexedDB read failed for image ${id}:`, err);
    return null;
  }
}

/**
 * Get image as an Object URL (e.g. blob:http://...)
 * Caller should release with URL.revokeObjectURL when done.
 */
export async function getImageUrl(id: string): Promise<string | null> {
  const img = await getImage(id);
  if (!img) return null;

  if (img.data instanceof Blob) {
    return URL.createObjectURL(img.data);
  }

  if (typeof img.data === "string") {
    // If it's a data URL or external URL, return directly
    if (img.data.startsWith("data:") || img.data.startsWith("http")) {
      return img.data;
    }
  }

  return null;
}

/**
 * Delete an image from IndexedDB
 */
export async function deleteImage(id: string): Promise<void> {
  memoryFallback.delete(id);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error(`Failed to delete image ${id}`));
    });
  } catch (err) {
    console.warn(`IndexedDB delete failed for image ${id}:`, err);
  }
}

/**
 * Delete all images belonging to a specific event
 */
export async function deleteImagesByEvent(eventId: string): Promise<void> {
  // Clean memory fallback
  for (const [id, img] of memoryFallback.entries()) {
    if (img.eventId === eventId) {
      memoryFallback.delete(id);
    }
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("eventId");
      const request = index.openCursor(IDBKeyRange.only(eventId));

      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error || new Error("Failed to delete event images"));
    });
  } catch (err) {
    console.warn(`IndexedDB bulk delete failed for event ${eventId}:`, err);
  }
}

/**
 * Estimate storage quota usage using navigator.storage.estimate()
 */
export async function getStorageEstimate(): Promise<{
  quotaMB: number;
  usageMB: number;
  percentUsed: number;
  isAvailable: boolean;
}> {
  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));
      const usageMB = Math.round((estimate.usage || 0) / (1024 * 1024));
      const percentUsed = quotaMB > 0 ? Math.round((usageMB / quotaMB) * 100) : 0;
      return { quotaMB, usageMB, percentUsed, isAvailable: true };
    } catch (_err) {
      // Fallback
    }
  }
  return { quotaMB: 0, usageMB: 0, percentUsed: 0, isAvailable: false };
}
