import { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export const useEventUpdates = (callback) => {
  // keep a set of seen document ids to prevent duplicate 'added' callbacks
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    // Create a query for the events collection
    const q = query(collection(db, 'events'));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const id = change.doc.id;
        const seen = seenIdsRef.current;

        if (change.type === 'modified') {
          // Call the callback with the updated event data
          callback({
            type: 'modified',
            id,
            data: { id, ...change.doc.data() }
          });
        } else if (change.type === 'added') {
          // ignore duplicate 'added' notifications for the same id
          if (seen.has(id)) return;
          seen.add(id);
          callback({
            type: 'added',
            id,
            data: { id, ...change.doc.data() }
          });
        } else if (change.type === 'removed') {
          // if removed, allow future adds to be observed again
          seen.delete(id);
          callback({
            type: 'removed',
            id
          });
        }
      });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [callback]);
};