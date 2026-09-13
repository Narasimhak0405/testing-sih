import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth, firebaseConfigError } from "../firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedDemo = localStorage.getItem("terramind_demo_user");
    if (savedDemo) {
      try {
        setUser(JSON.parse(savedDemo));
        setLoading(false);
        return undefined;
      } catch {
        localStorage.removeItem("terramind_demo_user");
      }
    }
    if (!auth) {
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn: (email, password) => {
        if (!auth) return Promise.reject(new Error(firebaseConfigError));
        return signInWithEmailAndPassword(auth, email, password);
      },
      signInWithGoogle: () => {
        if (!auth) return Promise.reject(new Error(firebaseConfigError));
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
      },
      signInAsDemo: (role = "Senior Mining Geologist") => {
        const demoUser = {
          uid: "demo-geologist-moil",
          email: "ops.lead@moil.gov.in",
          displayName: role,
          photoURL: null,
          isDemo: true,
        };
        setUser(demoUser);
        localStorage.setItem("terramind_demo_user", JSON.stringify(demoUser));
        return Promise.resolve(demoUser);
      },
      signUp: (email, password) => {
        if (!auth) return Promise.reject(new Error(firebaseConfigError));
        return createUserWithEmailAndPassword(auth, email, password);
      },
      resetPassword: (email) => {
        if (!auth) return Promise.reject(new Error(firebaseConfigError));
        return sendPasswordResetEmail(auth, email);
      },
      signOut: () => {
        localStorage.removeItem("terramind_demo_user");
        setUser(null);
        return auth ? signOut(auth) : Promise.resolve();
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
