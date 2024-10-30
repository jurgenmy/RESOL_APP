//FirebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore} from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgxbjViRg590zQpkj1DkYvmB4c_Hk2Ql0",
  authDomain: "resolapp-61783.firebaseapp.com",
  projectId: "resolapp-61783",
  storageBucket: "resolapp-61783.appspot.com",
  messagingSenderId: "640080702918",
  appId: "1:640080702918:web:dd0d880ff6e92c270b16c7"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);