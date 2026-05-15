import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isQuotaError } from '@/lib/firebase';

export interface SlideshowItem {
  id: string;
  url: string;
  order: number;
  createdAt: number;
}

export function useSlideshow() {
  const [images, setImages] = useState<SlideshowItem[]>(() => {
    const saved = localStorage.getItem('fallback_slideshow');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'slideshow'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SlideshowItem[];

      setImages(items);
      localStorage.setItem('fallback_slideshow', JSON.stringify(items));
      localStorage.removeItem('firestore_quota_exceeded');
      setLoading(false);
    }, (error) => {
      if (isQuotaError(error)) {
        localStorage.setItem('firestore_quota_exceeded', 'true');
        setLoading(false);
        console.warn('Using local fallback for slideshow due to quota.');
      } else {
        handleFirestoreError(error, OperationType.LIST, 'slideshow');
      }
    });

    return () => unsubscribe();
  }, []);

  return { images, loading };
}
