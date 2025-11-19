import React, { createContext, useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

export const VehicleContext = createContext({
  vehicles: [],
  addVehicle: async () => {},
  updateVehicle: async () => {},
  deleteVehicle: async () => {}
});

export function VehicleContextProvider({ children }) {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'cars'),
      orderBy('createdAt','desc')
    );
    return onSnapshot(q, snap => {
      setVehicles(
        snap.docs.map(docSnap => {
          const data = docSnap.data();
          const firstPhoto = data.media?.photos?.[0]?.url;
          return {
            id: docSnap.id,
            ...data,
            image: firstPhoto
              ? { uri: firstPhoto }
              : data.imageUrl
              ? { uri: data.imageUrl }
              : null,
          };
        })
      );
    });
  }, []);

  async function addVehicle(vehicle) {
    await addDoc(collection(db,'cars'), {
      ...vehicle,
      createdAt: serverTimestamp()
    });
  }

  async function updateVehicle(id, updates) {
    const ref = doc(db,'cars',id);
    await updateDoc(ref, updates);
  }

  async function deleteVehicle(id) {
    const ref = doc(db,'cars',id);
    await deleteDoc(ref);
  }

  return (
    <VehicleContext.Provider value={{ vehicles, addVehicle, updateVehicle, deleteVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}
