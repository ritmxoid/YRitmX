import { getTranslations } from '../i18n/translations';
import { SavedFolderEntry } from '../types/audio';

const DB_NAME = 'yritmx_handles_db';
const DB_VERSION = 3;
const STORE_NAME = 'directory_handles';
const FILES_STORE_NAME = 'folder_files';
const FILES_V2_STORE_NAME = 'folder_files_v2';
const META_STORE_NAME = 'folder_meta';
const SAVED_FOLDERS_META_KEY = 'saved_folders_list';
const MAX_MATERIALIZED_BLOB_BYTES = 120 * 1024 * 1024; // 120 MB per file safe buffer threshold

interface StoredFileRecord {
  key: string;
  folderId: string;
  index: number;
  name: string;
  type: string;
  lastModified: number;
  blob: Blob;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(FILES_STORE_NAME)) {
        db.createObjectStore(FILES_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(FILES_V2_STORE_NAME)) {
        const filesV2 = db.createObjectStore(FILES_V2_STORE_NAME, { keyPath: 'key' });
        filesV2.createIndex('folderId', 'folderId', { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE_NAME)) {
        db.createObjectStore(META_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirectoryHandle(
  id: string,
  handle: FileSystemDirectoryHandle
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(handle, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB may be restricted in private windows; ignore gracefully
  }
}

export async function getDirectoryHandle(
  id: string
): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteDirectoryHandle(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export async function saveSavedFoldersMeta(folders: SavedFolderEntry[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE_NAME, 'readwrite');
      tx.objectStore(META_STORE_NAME).put(folders, SAVED_FOLDERS_META_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore gracefully
  }
}

export async function getSavedFoldersMeta(): Promise<SavedFolderEntry[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE_NAME, 'readonly');
      const req = tx.objectStore(META_STORE_NAME).get(SAVED_FOLDERS_META_KEY);
      req.onsuccess = () => {
        const res = req.result;
        resolve(Array.isArray(res) ? (res as SavedFolderEntry[]) : []);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function clearFolderFilesV2(db: IDBDatabase, id: string): Promise<void> {
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(FILES_V2_STORE_NAME, 'readwrite');
      const index = tx.objectStore(FILES_V2_STORE_NAME).index('folderId');
      const cursorReq = index.openKeyCursor(IDBKeyRange.only(id));
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          tx.objectStore(FILES_V2_STORE_NAME).delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function toDurableBlob(file: File): Promise<Blob> {
  const mime = file.type || 'application/octet-stream';
  if (file.size <= MAX_MATERIALIZED_BLOB_BYTES) {
    try {
      const buf = await file.arrayBuffer();
      return new Blob([buf], { type: mime });
    } catch {
      // fall back to Blob slice if arrayBuffer fails
    }
  }
  return file.slice(0, file.size, mime);
}

export async function saveFolderFiles(id: string, files: File[]): Promise<void> {
  if (!files.length) return;
  try {
    const db = await openDb();
    await clearFolderFilesV2(db, id);

    // Save each file individually as a durable Blob so Safari/Android IndexedDB persists reliably across restarts
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const blob = await toDurableBlob(file);
        const record: StoredFileRecord = {
          key: `${id}::${i}`,
          folderId: id,
          index: i,
          name: file.name,
          type: file.type || 'application/octet-stream',
          lastModified: file.lastModified || Date.now(),
          blob,
        };
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(FILES_V2_STORE_NAME, 'readwrite');
          tx.objectStore(FILES_V2_STORE_NAME).put(record);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        // Continue saving remaining files even if one huge file exceeds quota
      }
    }
  } catch {
    // Gracefully ignore storage quota / private mode limits
  }
}

export async function getFolderFiles(id: string): Promise<File[] | null> {
  try {
    const db = await openDb();

    // Prefer durable v2 per-file Blob records
    const v2Records = await new Promise<StoredFileRecord[]>((resolve) => {
      try {
        const tx = db.transaction(FILES_V2_STORE_NAME, 'readonly');
        const index = tx.objectStore(FILES_V2_STORE_NAME).index('folderId');
        const req = index.getAll(IDBKeyRange.only(id));
        req.onsuccess = () =>
          resolve(Array.isArray(req.result) ? (req.result as StoredFileRecord[]) : []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });

    if (v2Records.length > 0) {
      v2Records.sort((a, b) => a.index - b.index);
      return v2Records.map(
        (rec) =>
          new File([rec.blob], rec.name, {
            type: rec.type || 'application/octet-stream',
            lastModified: rec.lastModified || Date.now(),
          })
      );
    }

    // Legacy fallback store
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(FILES_STORE_NAME, 'readonly');
      const req = tx.objectStore(FILES_STORE_NAME).get(id);
      req.onsuccess = () => {
        const res = req.result;
        resolve(Array.isArray(res) && res.length > 0 ? (res as File[]) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteFolderFiles(id: string): Promise<void> {
  try {
    const db = await openDb();
    await clearFolderFilesV2(db, id);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILES_STORE_NAME, 'readwrite');
      tx.objectStore(FILES_STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export async function queryDirectoryPermission(
  dirHandle: FileSystemDirectoryHandle
): Promise<PermissionState> {
  const handleWithPerm = dirHandle as FileSystemDirectoryHandle & {
    queryPermission?: (opts: { mode: 'read' }) => Promise<PermissionState>;
  };
  if (!handleWithPerm.queryPermission) return 'prompt';
  try {
    return await handleWithPerm.queryPermission({ mode: 'read' });
  } catch {
    return 'prompt';
  }
}

export async function readAudioFilesFromDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle
): Promise<File[]> {
  const handleWithPerm = dirHandle as FileSystemDirectoryHandle & {
    queryPermission?: (opts: { mode: 'read' }) => Promise<PermissionState>;
    requestPermission?: (opts: { mode: 'read' }) => Promise<PermissionState>;
  };

  if (handleWithPerm.queryPermission && handleWithPerm.requestPermission) {
    let state = await handleWithPerm.queryPermission({ mode: 'read' });
    if (state !== 'granted') {
      state = await handleWithPerm.requestPermission({ mode: 'read' });
    }
    if (state !== 'granted') {
      throw new Error(getTranslations().errFolderPermission);
    }
  }

  const audioFiles: Array<{ relPath: string; file: File }> = [];
  const collect = async (dir: FileSystemDirectoryHandle, prefix = '', depth = 0) => {
    if (depth > 3) return;
    const iterable = dir as unknown as {
      values: () => AsyncIterable<FileSystemHandle>;
    };
    for await (const entry of iterable.values()) {
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        if (
          file.type.startsWith('audio/') ||
          file.type.startsWith('video/') ||
          file.type.startsWith('image/') ||
          /\.(mp3|flac|wav|ogg|m4a|aac|mp4|webm|mov|m4v|jpg|jpeg|png|webp|gif)$/i.test(
            file.name
          )
        ) {
          audioFiles.push({ relPath, file });
        }
      } else if (entry.kind === 'directory') {
        await collect(entry as FileSystemDirectoryHandle, relPath, depth + 1);
      }
    }
  };

  await collect(dirHandle);
  audioFiles.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return audioFiles.map((item) => item.file);
}
