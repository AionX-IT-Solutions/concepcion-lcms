import { useEffect, useState } from 'react'
import { createDoc, patchDoc, removeDoc, subscribeCollection } from './firestore-sync'

/**
 * Generic Firestore-backed CRUD resource — one real-time collection with
 * create/update/remove, each create/remove atomically bumping a counter doc
 * named after the collection.
 */
export function useFirestoreResource<T extends { id: string }>(collectionName: string) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeCollection<T>(collectionName, (list) => {
      setItems(list)
      setLoading(false)
    })
    return unsubscribe
  }, [collectionName])

  return {
    items,
    loading,
    create: (data: Omit<T, 'id'>) =>
      createDoc(collectionName, data, { counter: collectionName }),
    update: (id: string, patch: Partial<Omit<T, 'id'>>) => patchDoc(collectionName, id, patch),
    remove: (id: string) => removeDoc(collectionName, id, { counter: collectionName })
  }
}
