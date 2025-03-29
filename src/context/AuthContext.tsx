'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  Auth
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase-init';

export interface AuthContextType {
  currentUser: User | null;
  auth: Auth;
  signup: (data: SignupData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signupWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: string;
  maritalStatus: string;
  hasChildren: boolean;
  numberOfChildren?: number;
  childrenAges?: string;
  suburb: string;
  state: string;
  educationLevel: string;
  incomeLevel: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const sexOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
];

export const incomeOptions = [
  { value: 'under_70000', label: 'Under $70,000' },
  { value: '70000_100000', label: '$70,000 - $100,000' },
  { value: '100000_150000', label: '$100,000 - $150,000' },
  { value: '150000_300000', label: '$150,000 - $300,000' },
  { value: 'over_300000', label: '$300,000+' }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (data: SignupData) => {
    try {
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Prepare user data for Firestore
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob,
        sex: data.sex,
        maritalStatus: data.maritalStatus,
        hasChildren: data.hasChildren,
        suburb: data.suburb,
        state: data.state,
        educationLevel: data.educationLevel,
        incomeLevel: data.incomeLevel,
        email: data.email,
        createdAt: new Date().toISOString(),
        ...(data.hasChildren ? {
          numberOfChildren: data.numberOfChildren || 0,
          childrenAges: data.childrenAges || ''
        } : {})
      };

      // Save user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    } catch (error: any) {
      console.error('Detailed signup error:', error);
      if (error?.code === 'auth/email-already-in-use') {
        throw new Error('Email is already registered');
      } else if (error?.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error?.code === 'auth/weak-password') {
        throw new Error('Password is too weak. It should be at least 6 characters');
      } else {
        throw new Error(`Authentication error: ${error?.message || 'Unknown error occurred'}`);
      }
    }
  };

  async function signupWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Create initial user profile
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        name: userCredential.user.displayName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Set default values for required fields
        dob: '',
        sex: '',
        suburb: '',
        state: 'NSW',
        educationLevel: '',
        incomeLevel: ''
      });
    }
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    auth,
    signup,
    signupWithGoogle,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
