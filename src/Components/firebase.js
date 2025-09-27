import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDMVaWuMgSP9COQrxqzFOYh0l0tNYdIFwc",
  authDomain: "proyecto-d-7af76.firebaseapp.com",
  projectId: "proyecto-d-7af76",
  storageBucket: "proyecto-d-7af76.firebasestorage.app",
  messagingSenderId: "522454361091",
  appId: "1:522454361091:web:286cf6148265782a095a36"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);