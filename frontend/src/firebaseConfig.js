import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA7O3Dh0ytHUJwF2TAYuBl83RBrhDqKUNc",
  authDomain: "attendance-page-5e45c.firebaseapp.com",
  projectId: "attendance-page-5e45c",
  storageBucket: "attendance-page-5e45c.appspot.com",
  messagingSenderId: "931015390628",
  appId: "1:931015390628:web:b244fcb9be565c818abd31",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { auth, googleProvider };

