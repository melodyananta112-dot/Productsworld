import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isQuotaError } from '../lib/firebase';

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
    const fetchFlashSales = async () => {
      try {
        const q = query(collection(db, 'flash_sale'));
        const snapshot = await getDocs(q);
        const sales = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FlashSale[];
        
        setFlashSales(sales);
      } catch (error) {
        if (isQuotaError(error)) {
          console.warn('Flash sale fetch blocked by quota.');
        } else {
          handleFirestoreError(error, OperationType.LIST, 'flash_sale');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSales();
  }, []);

  return { flashSales, loading };
}
