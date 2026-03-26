import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User, db, doc, getDoc, setDoc } from '../firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user exists in Firestore, if not create
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const isDefaultAdmin = currentUser.email === 'wlgp911114@gmail.com';
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            role: isDefaultAdmin ? 'admin' : 'user',
            displayName: currentUser.displayName
          });
          setIsAdmin(isDefaultAdmin);
        } else {
          setIsAdmin(userDoc.data().role === 'admin');
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
