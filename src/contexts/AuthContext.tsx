'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

import { UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profileComplete: boolean;
  role: UserRole;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profileComplete: false,
  role: 'PATIENT',
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [role, setRole] = useState<UserRole>('PATIENT');
  const router = useRouter();

  useEffect(() => {
    const firestore = db;
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          setProfileComplete(userDoc.exists() && !!userData?.profile?.age);
          setRole(userData?.role || 'PATIENT');
        } catch (e) {
          console.error('Error fetching profile:', e);
          setProfileComplete(false);
          setRole('PATIENT');
        }
      } else {
        setProfileComplete(false);
        setRole('PATIENT');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const firestore = db;
    if (!auth || !firestore) {
      alert('Authentication is not configured. Please check your environment variables.');
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);

      const firebaseUser = result.user;
      const userRef = doc(firestore, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          role: 'PATIENT' as UserRole,
          createdAt: new Date(),
          profile: null,
        };
        await setDoc(userRef, newUserProfile);
        setRole('PATIENT');
        router.push('/onboarding');
      } else {
        const userData = userSnap.data();
        setRole(userData?.role || 'PATIENT');
        if (!userData?.profile?.age) {
          router.push('/onboarding');
        } else if (userData?.role && userData.role !== 'PATIENT') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const logout = async () => {
    if (auth) await signOut(auth);
    router.push('/');
  };


  return (
    <AuthContext.Provider value={{ user, loading, profileComplete, role, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
