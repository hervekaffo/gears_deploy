// store/car-context.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CAR_DATA } from '../data/cars';

export const CarContext = createContext({
  cars: [],
  addCar: (car) => {},
});

export function CarContextProvider({ children }) {
  const [cars, setCars] = useState([]);

  // 1️⃣ Load persisted cars (or fallback to static CAR_DATA)
  useEffect(() => {
    async function loadCars() {
      try {
        const json = await AsyncStorage.getItem('@my_app_cars');
        if (json != null) {
          setCars(JSON.parse(json));
        } else {
          setCars(CAR_DATA);
        }
      } catch (e) {
        console.warn('Failed loading cars:', e);
        setCars(CAR_DATA);
      }
    }
    loadCars();
  }, []);

  // 2️⃣ Persist helper
  async function persistCars(newList) {
    try {
      await AsyncStorage.setItem('@my_app_cars', JSON.stringify(newList));
    } catch (e) {
      console.warn('Failed saving cars:', e);
    }
  }

  // 3️⃣ Override addCar to update state + storage
  function addCar(car) {
    setCars((cur) => {
      const updated = [car, ...cur];
      persistCars(updated);
      return updated;
    });
  }

  return (
    <CarContext.Provider value={{ cars, addCar }}>
      {children}
    </CarContext.Provider>
  );
}
