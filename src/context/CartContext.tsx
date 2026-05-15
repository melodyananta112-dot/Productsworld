import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isQuotaError } from '../lib/firebase';
import { Product } from '../types';

interface CartItem {
  productId: string;
  quantity: number;
  color?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, quantity: number, color?: string) => void;
  removeFromCart: (productId: string, color?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, color?: string) => void;
  updateCartColor: (productId: string, oldColor: string | undefined, newColor: string) => void;
  clearCart: () => void;
  totalItems: number;
  quotaExceeded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('fallback_products');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'));
        const snapshot = await getDocs(q);
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        setProducts(productsData);
        localStorage.setItem('fallback_products', JSON.stringify(productsData));
        localStorage.removeItem('firestore_quota_exceeded');
        setLoading(false);
        setQuotaExceeded(false);
      } catch (error) {
        if (isQuotaError(error)) {
          localStorage.setItem('firestore_quota_exceeded', 'true');
          setQuotaExceeded(true);
          setLoading(false);
          console.warn('Using local fallback products due to quota limit.');
        } else {
          handleFirestoreError(error, OperationType.LIST, 'products');
        }
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Clean up "ghost" items
  useEffect(() => {
    if (!loading && products.length > 0 && cart.length > 0) {
      const validCart = cart.filter(item => 
        products.some(p => p.id === item.productId)
      );
      if (validCart.length !== cart.length) {
        setCart(validCart);
      }
    }
  }, [loading, products, cart]);

  const addToCart = (productId: string, quantity: number = 1, color?: string) => {
    console.log('AddToCart called:', { productId, quantity, color });
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId && item.color === color);
      if (existing) {
        return prev.map(item => 
          (item.productId === productId && item.color === color) ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { productId, quantity, color }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number, color?: string) => {
    setCart(prev => prev.map(item =>
      (item.productId === productId && item.color === color) ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const updateCartColor = (productId: string, oldColor: string | undefined, newColor: string) => {
    setCart(prev => {
      // Find the item to be moved
      const itemToUpdate = prev.find(item => item.productId === productId && item.color === oldColor);
      if (!itemToUpdate || oldColor === newColor) return prev;

      // Remove both the old-color item and the new-color item if they exist
      const others = prev.filter(item => 
        !(item.productId === productId && (item.color === oldColor || item.color === newColor))
      );
      
      // Add a single item with the new color and quantity 1
      return [...others, { ...itemToUpdate, color: newColor, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string, color?: string) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.color === color)));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateCartQuantity, updateCartColor, clearCart, totalItems, quotaExceeded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
