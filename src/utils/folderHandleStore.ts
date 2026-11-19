import { getTranslations } from '../i18n/translations';

const DB_NAME = 'yritmx_handles_db';
const DB_VERSION = 2;
const STORE_NAME = 'directory_handles';
const FILES_STORE_NAME = 'folder_files';

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
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirectoryHandle(id: string, handle: FileSystemDirectoryHandle): Promise<void> {
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

export async function getDirectoryHandle(id: string): Promise<FileSystemDirectoryHandle | null> {
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

export async function saveFolderFiles(id: string, files: File[]): Promise<void> {
  if (!files.length) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILES_STORE_NAME, 'readwrite');
      tx.objectStore(FILES_STORE_NAME).put(files, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Gracefully ignore storage quota / private mode limits
  }
}

export async function getFolderFiles(id: string): Promise<File[] | null> {
  try {
    const db = await openDb();
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
          /\.(mp3|flac|wav|ogg|m4a|aac|mp4|webm|mov|m4v|jpg|jpeg|png|webp|gif)$/i.test(file.name)
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

