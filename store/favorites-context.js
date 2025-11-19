import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { AuthContext } from './auth-context';

export const FavoritesContext = createContext({
  favorites: [],
  isFavorite: (id) => false,
  addFavorite: async (car) => {},
  removeFavorite: async (id) => {},
});

export function FavoritesContextProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    // if logged out, clear and don’t listen
    if (!user) {
      setFavorites([]);
      return;
    }

    // listen to /users/{uid}/favorites
    const favRef = collection(db, 'users', user.uid, 'favorites');
    const unsubscribe = onSnapshot(
      favRef,
      snap => {
        setFavorites(snap.docs.map(d => d.data()));
      },
      err => {
        console.warn('Favorites listener error:', err.message);
      }
    );

    // cleanup on unmount or user change
    return () => {
      unsubscribe();
      setFavorites([]);
    };
  }, [user]);

  async function addFavorite(car) {
    if (!user) throw new Error('Must be signed in to favorite');
    const ref = doc(db, 'users', user.uid, 'favorites', car.id);
    await setDoc(ref, car);
  }

  async function removeFavorite(id) {
    if (!user) throw new Error('Must be signed in to unfavorite');
    const ref = doc(db, 'users', user.uid, 'favorites', id);
    await deleteDoc(ref);
  }

  function isFavorite(id) {
    return favorites.some(f => f.id === id);
  }

  return (
    <FavoritesContext.Provider value={{
      favorites,
      isFavorite,
      addFavorite,
      removeFavorite
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}
