import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isQuotaError } from '../lib/firebase';
import { UserProfile } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: user.email === 'melody.ananta112@gmail.com' ? 'admin' : 'customer',
              createdAt: Date.now(),
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          if (isQuotaError(error)) {
            console.warn("Profile fetch limited. Using auth data fallback.");
            setProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: user.email === 'melody.ananta112@gmail.com' ? 'admin' : 'customer',
              createdAt: Date.now(),
            });
          } else {
            console.error("Error fetching/creating user profile:", error);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
      toast.success('Successfully logged in');
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn('A login popup was already open and has been cancelled.');
        toast.error('Login popup was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup was closed by the user.');
        toast.error('Login popup was closed. Please try again.');
      } else {
        console.error('Authentication Error:', error);
        toast.error('Authentication failed. Please try again.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Successfully logged out');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
