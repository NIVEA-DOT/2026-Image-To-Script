
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB2RKDsb2ngIAYx4tdwU4T93mi4Fg6BPt4",
  authDomain: "script-to-image-1c3a7.firebaseapp.com",
  projectId: "script-to-image-1c3a7",
  storageBucket: "script-to-image-1c3a7.firebasestorage.app",
  messagingSenderId: "932650039548",
  appId: "1:932650039548:web:1af53246492fa523c7bf79"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
