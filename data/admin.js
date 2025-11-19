import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore }         from 'firebase-admin/firestore';
import { createRequire }        from 'module';

// Create a CommonJS `require` so we can pull in JSON without import assertions
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore();
