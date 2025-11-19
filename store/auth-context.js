import React, { createContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google     from 'expo-auth-session/providers/google';

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

import { auth, db } from '../firebase';

WebBrowser.maybeCompleteAuthSession();

export const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  updateProfile: async (updates) => {}
});

export default function AuthContextProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  //
  // 1️⃣ Email / password handlers
  //
  async function signUp(email, pwd) {
    const cred = await createUserWithEmailAndPassword(auth, email, pwd);
    // Create their Firestore profile document
    await setDoc(doc(db, 'users', cred.user.uid), {
      email:    cred.user.email,
      joinedAt: serverTimestamp(),
      isHost:   false,
      name:     '',
      phone:    '',
      about:    ''
    });
  }

  function signIn(email, pwd) {
    return signInWithEmailAndPassword(auth, email, pwd);
  }

  function signOut() {
    return firebaseSignOut(auth);
  }

  //
  // 2️⃣ Google Sign-In
  //
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:    '<YOUR_EXPO_CLIENT_ID>',
    iosClientId:     '<YOUR_IOS_CLIENT_ID>',
    androidClientId: '<YOUR_ANDROID_CLIENT_ID>',
    webClientId:     '<YOUR_WEB_CLIENT_ID>',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const cred = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, cred).catch(console.error);
    }
  }, [response]);

  function signInWithGoogle() {
    return promptAsync();
  }

  //
  // 3️⃣ Watch auth state & sync Firestore “profile” doc
  //
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setLoading(true);

      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const snap    = await getDoc(userRef);

        if (!snap.exists()) {
          // New Google user or missing doc: create it
          await setDoc(userRef, {
            email:    u.email,
            joinedAt: serverTimestamp(),
            isHost:   false,
            name:     '',
            phone:    '',
            about:    ''
          });
          setProfile({
            email:    u.email,
            joinedAt: new Date(), // approximate until we re-fetch if you care
            isHost:   false,
            name:     '',
            phone:    '',
            about:    ''
          });
        } else {
          setProfile(snap.data());
        }

        setUser(u);
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  //
  // 4️⃣ Helper to update any fields on your /users/{uid} doc
  //
  async function updateProfile(updates) {
    if (!user) throw new Error('Not signed in');
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, updates);
    setProfile((prev) => ({ ...prev, ...updates }));
  }

  // While we're (re)hydrating from auth, don't render children:
  if (loading) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
