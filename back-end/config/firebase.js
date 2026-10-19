import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env file from the back-end directory
// Since the working directory is /home/react/peliswan-sales-crm, we need to go to back-end/.env
dotenv.config({ path: path.join(process.cwd(), 'back-end', '.env') })

import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Debug: Log environment variables with more detail
// console.log('Firebase Config Debug:', {
//   apiKey: process.env.FIREBASE_API_KEY
//     ? `Set (${process.env.FIREBASE_API_KEY.substring(0, 10)}...)`
//     : 'Missing',
//   authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'Missing',
//   projectId: process.env.FIREBASE_PROJECT_ID || 'Missing',
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'Missing',
//   messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'Missing',
//   appId: process.env.FIREBASE_APP_ID || 'Missing'
// })

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig)

// Initialize Firebase services
const storage = getStorage(firebaseApp)
const auth = getAuth(firebaseApp)
const firestore = getFirestore(firebaseApp)

export { firebaseApp, storage, auth, firestore }
