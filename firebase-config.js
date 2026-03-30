// ──────────────────────────────────────────────────────────
//  firebase-config.js
//  Firebase projenizi oluşturduktan sonra bu değerleri değiştir
// ──────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyDuKLuoePZ6mNsKhQBGXumxMwF0UKTQvc8",
  authDomain: "oyun-75056.firebaseapp.com",
  databaseURL: "https://oyun-75056-default-rtdb.firebaseio.com",
  projectId: "oyun-75056",
  storageBucket: "oyun-75056.firebasestorage.app",
  messagingSenderId: "980660244755",
  appId: "1:980660244755:web:47889c4b6637ab05cdcae6",
  measurementId: "G-J9RKPSVT8B"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
