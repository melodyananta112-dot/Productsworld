import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isQuotaError } from '../lib/firebase';
import { Product } from '../types';

export function useProducts(limitCount: number = 20) {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('fallback_products');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
        try {
            const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(limitCount));
            const snapshot = await getDocs(q);
            const productsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Product[];
            
            setProducts(productsData);
            localStorage.setItem('fallback_products', JSON.stringify(productsData));
            localStorage.removeItem('firestore_quota_exceeded');
        } catch (error) {
            if (isQuotaError(error)) {
                localStorage.setItem('firestore_quota_exceeded', 'true');
                console.warn('Using local fallback products in hook due to quota.');
            } else {
                handleFirestoreError(error, OperationType.LIST, 'products');
            }
        } finally {
            setLoading(false);
        }
    };

    fetchProducts();
  }, [limitCount]);

  return { products, loading };
}
