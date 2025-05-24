import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCi_C7T1iIayYfiq6g45MTj1qAmsbsiYRI",
  authDomain: "ecommerce-cms-578f4.firebaseapp.com",
  projectId: "ecommerce-cms-578f4",
  storageBucket: "ecommerce-cms-578f4.firebasestorage.app",
  messagingSenderId: "609199158290",
  appId: "1:609199158290:web:68029b4ccd8307648254cb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export { db };