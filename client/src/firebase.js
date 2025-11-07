// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "dnbds-485a5.firebaseapp.com",
  projectId: "dnbds-485a5",
  storageBucket: "dnbds-485a5.firebasestorage.app",
  messagingSenderId: "812631426543",
  appId: "1:812631426543:web:255b0f0fec172e32cd621a"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);