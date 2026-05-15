import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isQuotaError } from '../lib/firebase';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

export function useOrders() {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('fallback_orders');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    if (!isAdmin) {
      q = query(collection(db, 'orders'), where('userId', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      if (!isAdmin) {
        ordersData.sort((a, b) => b.createdAt - a.createdAt);
      }
      
      setOrders(ordersData);
      localStorage.setItem('fallback_orders', JSON.stringify(ordersData));
      localStorage.removeItem('firestore_quota_exceeded');
      setLoading(false);
    }, (error) => {
      if (isQuotaError(error)) {
        localStorage.setItem('firestore_quota_exceeded', 'true');
        setLoading(false);
        console.warn('Using local fallback orders due to quota.');
      } else {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  return { orders, loading };
}
