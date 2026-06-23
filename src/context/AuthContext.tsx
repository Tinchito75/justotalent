"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, DocumentData } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserData = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      setUserData(docSnap.data());
    } else {
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          profilePictureUrl: user.photoURL,
          role: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await fetchUserData(user.uid);
        router.push("/onboarding");
      } else {
        await fetchUserData(user.uid);
        const data = docSnap.data();
        if (!data.role || !data.basicInfo) {
          router.push("/onboarding");
        } else {
          router.push("/profile");
        }
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
