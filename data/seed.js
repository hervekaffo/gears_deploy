import admin from 'firebase-admin'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

//  resolve __dirname in ESM
const __dirname = dirname(fileURLToPath(import.meta.url))

//  load service account (rename your JSON to serviceAccountKey.json)
const serviceAccount = JSON.parse(
  await readFile(join(__dirname, 'serviceAccountKey.json'), 'utf8')
)

//  initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

//  grab your CAR_DATA
import { CAR_DATA } from './cars.js'

//  get Firestore
const db = admin.firestore()

//  iterate & seed
async function seedCars() {
  for (const { id, ...data } of CAR_DATA) {
    await db
      .collection('cars')
      .doc(id)                // use the `id` field as document ID
      .set({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    console.log(`✅ Seeded car ${id}`)
  }
}

try {
  await seedCars()
  console.log('🎉 All done!')
  process.exit(0)
} catch (err) {
  console.error('🔥 Error seeding cars:', err)
  process.exit(1)
}
