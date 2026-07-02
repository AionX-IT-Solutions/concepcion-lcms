import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'
import { firebaseApp } from './firebase'
import type { MockFileRef } from '../types/lcms.types'

const storage = getStorage(firebaseApp)

/** Uploads a file under `folder/` and returns a ready-to-persist file reference. */
export async function uploadFile(folder: string, file: File): Promise<MockFileRef> {
  const path = `${folder}/${window.crypto.randomUUID()}-${file.name}`
  const objectRef = ref(storage, path)
  await uploadBytes(objectRef, file)
  const url = await getDownloadURL(objectRef)
  return {
    name: file.name,
    url,
    storagePath: path,
    sizeKb: Math.round(file.size / 1024),
    uploadedAt: new Date().toISOString()
  }
}

/**
 * Best-effort delete of a single file reference — used for cascade deletes, so a
 * missing object or a transient Storage error never blocks the caller's own delete.
 */
export async function deleteFileRef(fileRef?: MockFileRef | null): Promise<void> {
  if (!fileRef?.storagePath) return
  try {
    await deleteObject(ref(storage, fileRef.storagePath))
  } catch (err) {
    console.warn('Failed to delete storage file', fileRef.storagePath, err)
  }
}

/** Best-effort delete of many file references at once (e.g. every file owned by a deleted client). */
export async function deleteFileRefs(fileRefs: Array<MockFileRef | undefined | null>): Promise<void> {
  await Promise.all(fileRefs.map((f) => deleteFileRef(f)))
}
