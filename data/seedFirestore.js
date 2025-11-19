import { initializeApp }    from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { firebaseConfig }   from '../firebase.js';
import { CAR_DATA }         from './cars.plain.js';

async function seed() {
  // initialize
  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  const carsCol = collection(db, 'cars');

  for (const car of CAR_DATA) {
    // remove client‑only props if any, and add serverTimestamp if desired
    const { id, ...payload } = car;

    try {
      await addDoc(carsCol, {
        ...payload,
        createdAt: new Date()
      });
      console.log(`✓ inserted car ${id} (${car.make} ${car.model})`);
    } catch (err) {
      console.error(`✗ failed on car ${id}:`, err);
    }
  }

  console.log('🚀 All done!');
}

seed().catch(console.error);
