import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FlashSale {
  id: string;
  bannerUrl?: string; // Legacy
  bannerUrls?: string[];
  endTime: number;
  linkUrl: string;
  isActive: boolean;
  price?: number;
  description?: string;
}

export function useFlashSale() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'flash_sale')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FlashSale[];
      
      setFlashSales(sales);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching flash sales", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { flashSales, loading };
}
