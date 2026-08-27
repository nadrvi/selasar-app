import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  GithubAuthProvider 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBDYtiwOQZ_dng1No4cug2a-LcQQ4uykNE",
  authDomain: "loginprojectregister.firebaseapp.com",
  projectId: "loginprojectregister",
  storageBucket: "loginprojectregister.firebasestorage.app",
  messagingSenderId: "363532190952",
  appId: "1:363532190952:web:d6ed44ab0b42e29bce355d",
  measurementId: "G-EHKF43FGFE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Setup Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Tambahkan scope email jika diperlukan
githubProvider.addScope("user:email");
facebookProvider.addScope("email");