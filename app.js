import { initializeApp } from "[gstatic.com](https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js)";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs } from "[gstatic.com](https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js)";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "[gstatic.com](https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js)";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDuKLuoePZ6mNsKhQBGXumxMwF0UKTQvc8",
  authDomain: "oyun-75056.firebaseapp.com",
  databaseURL: "[oyun-75056-default-rtdb.firebaseio.com](https://oyun-75056-default-rtdb.firebaseio.com)",
  projectId: "oyun-75056",
  storageBucket: "oyun-75056.firebasestorage.app",
  messagingSenderId: "980660244755",
  appId: "1:980660244755:web:47889c4b6637ab05cdcae6",
  measurementId: "G-J9RKPSVT8B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// References
const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');

let currentUser = null;
let userData = {};


// === AUTH ===
loginBtn.onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert("Giriş hatası: " + err.message);
  }
};

registerBtn.onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      kmr: 0,
      banknote: 0,
      cekip: 0,
      miners: [],
      ph: 0,
      role: "user",
      createdAt: Date.now(),
      lastCollect: Date.now()
    });
  } catch (err) {
    alert("Kayıt hatası: " + err.message);
  }
};

logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser = user;
    authSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    await loadUserData();
  } else {
    currentUser = null;
    authSection.classList.remove('hidden');
    gameSection.classList.add('hidden');
  }
});

// === LOAD USER ===
async function loadUserData() {
  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  userData = snap.data();

  document.getElementById('kmr-balance').innerText = userData.kmr;
  document.getElementById('banknote-balance').innerText = userData.banknote;
  document.getElementById('cekip-balance').innerText = userData.cekip;

  if (userData.role === "admin") {
    document.querySelectorAll('.admin-only').forEach(b => b.style.display = "inline-block");
  }

  renderMiners();
  renderStore();
}

// === NAVIGATION ===
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

// === GAME SYSTEM ===
const minersData = [
  { name:"Kübra", cost:50, rate:250, mult:2 },
  { name:"Beyza", cost:80, rate:500, mult:2.5 },
  { name:"Mehmet", cost:125, rate:750, mult:3 },
  { name:"Şevki", cost:180, rate:1000, mult:3.5 },
  { name:"Ali", cost:300, rate:2000, mult:4 }
];

function renderMiners() {
  const cont = document.getElementById('miners');
  cont.innerHTML = "";
  userData.miners.forEach((m,i) => {
    const div = document.createElement('div');
    div.className = 'miner-card';
    div.innerHTML = `
      <h4>${m.name} Lvl.${m.level}</h4>
      <p>${m.rate} KMR/s</p>
      <p>Enerji: ${m.energy}%</p>
      <button onclick="refillEnergy(${i})">⚡ Enerji Ver</button>
    `;
    cont.appendChild(div);
  });
}

window.refillEnergy = async (i) => {
  const miner = userData.miners[i];
  const cost = (miner.rate * 3600 / 1000) * 4;
  if (userData.kmr >= cost) {
    userData.kmr -= cost;
    userData.miners[i].energy = 100;
    await updateDoc(doc(db, "users", currentUser.uid), { kmr: userData.kmr, miners: userData.miners });
    loadUserData();
  } else alert("Yetersiz KMR!");
};

// === STORE ===
function renderStore() {
  const store = document.getElementById('miners-store');
  store.innerHTML = "";
  minersData.forEach((m, idx) => {
    const btn = document.createElement('button');
    btn.innerText = `${m.name} - ${m.cost} Banknot`;
    btn.onclick = () => buyMiner(idx);
    store.appendChild(btn);
  });
}

async function buyMiner(i) {
  const miner = minersData[i];
  if (userData.banknote >= miner.cost) {
    userData.banknote -= miner.cost;
    userData.miners.push({
      ...miner,
      level: 1,
      energy: 100
    });
    await updateDoc(doc(db, "users", currentUser.uid), { miners: userData.miners, banknote: userData.banknote });
    loadUserData();
  } else alert("Yetersiz Banknot!");
}

// === COLLECT ===
document.getElementById('collect-btn').onclick = async () => {
  const now = Date.now();
  const seconds = (now - userData.lastCollect) / 1000;
  const totalRate = userData.miners.reduce((sum, m) => sum + (m.rate * (m.energy/100)), 0);
  const earned = Math.floor(seconds * totalRate);
  userData.kmr += earned;
  userData.lastCollect = now;
  await updateDoc(doc(db, "users", currentUser.uid), { kmr: userData.kmr, lastCollect: userData.lastCollect });
  loadUserData();
  alert(`Toplanan: ${earned} KMR`);
};

