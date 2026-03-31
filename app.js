import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getDatabase, ref, set, get, update, onValue, push, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-functions.js";

// Firebase config
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const functions = getFunctions(app);

// Callable functions
const claimOfflineEarnings = httpsCallable(functions, 'claimOfflineEarnings');
const buyMiner = httpsCallable(functions, 'buyMiner');
const convertCurrency = httpsCallable(functions, 'convertCurrency');
const openBox = httpsCallable(functions, 'openBox');
const spinWheel = httpsCallable(functions, 'spinWheel');
const scratchGame = httpsCallable(functions, 'scratchGame');
const claimDailyTask = httpsCallable(functions, 'claimDailyTask');
const inviteFriend = httpsCallable(functions, 'inviteFriend');

// DOM elements
const authContainer = document.getElementById('auth-container');
const gameContainer = document.getElementById('game-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');
const registerConfirm = document.getElementById('register-confirm');
const authError = document.getElementById('auth-error');

// Game UI elements
const menuButtons = document.querySelectorAll('.menu-btn');
const contentArea = document.getElementById('content-area');
const homeContent = document.getElementById('home-content');
const profileContent = document.getElementById('profile-content');
const storeContent = document.getElementById('store-content');
const leaderboardContent = document.getElementById('leaderboard-content');
const gamesContent = document.getElementById('games-content');
const settingsContent = document.getElementById('settings-content');

// Dynamic data holders
let currentUser = null;
let userData = null;
let minersData = {};
let itemsData = {};
let leaderboardData = [];

// Helper: show section
function showSection(sectionId) {
  const sections = ['home', 'profile', 'store', 'leaderboard', 'games', 'settings'];
  sections.forEach(s => {
    document.getElementById(`${s}-content`).style.display = 'none';
  });
  document.getElementById(`${sectionId}-content`).style.display = 'block';
}

// Update home screen
function updateHomeScreen() {
  if (!userData) return;
  const minerId = userData.activeMinerId;
  const miner = minersData[minerId];
  const hourly = miner ? miner.hourlyKMR : 0;
  document.getElementById('active-miner-name').innerText = miner ? miner.name : 'Yok';
  document.getElementById('hourly-earn').innerText = hourly;
  document.getElementById('kmr-balance').innerText = userData.kmr || 0;
  document.getElementById('banknot-balance').innerText = userData.banknot || 0;
  document.getElementById('kasa-balance').innerText = userData.kasa || 0;
  document.getElementById('energy-value').innerText = Math.floor(userData.energy || 100);
  document.getElementById('total-ph-value').innerText = userData.totalPH || 0;
  // League info
  let league = "Çırak";
  if (userData.totalPH >= 5000) league = "Usta";
  else if (userData.totalPH >= 1000) league = "Amatör";
  document.getElementById('league-name').innerText = league;
}

// Update profile screen
function updateProfileScreen() {
  if (!userData) return;
  document.getElementById('profile-username').innerText = userData.username;
  document.getElementById('profile-ph').innerText = userData.totalPH;
  document.getElementById('profile-miner').innerText = minersData[userData.activeMinerId]?.name || 'Yok';
  document.getElementById('profile-kmr').innerText = userData.kmr;
  document.getElementById('profile-banknot').innerText = userData.banknot;
  document.getElementById('profile-kasa').innerText = userData.kasa;
  // Achievements list
  const achList = document.getElementById('achievements-list');
  achList.innerHTML = '';
  if (userData.achievements) {
    userData.achievements.forEach(achId => {
      const div = document.createElement('div');
      div.className = 'achievement-badge';
      div.innerText = achId; // simplified, would use full name from db
      achList.appendChild(div);
    });
  }
}

// Update store: miners and boxes
function updateStore() {
  // Miners
  const minersDiv = document.getElementById('miners-store');
  minersDiv.innerHTML = '';
  Object.values(minersData).forEach(miner => {
    const card = document.createElement('div');
    card.className = 'store-card';
    card.innerHTML = `
      <h3>${miner.name}</h3>
      <p>Fiyat: ${miner.cost} banknot</p>
      <p>Saatlik: ${miner.hourlyKMR} KMR</p>
      <p>Katsayı: ${miner.multiplier}x</p>
      <button class="buy-miner-btn" data-id="${miner.id}">Satın Al</button>
    `;
    minersDiv.appendChild(card);
  });
  document.querySelectorAll('.buy-miner-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const minerId = e.target.dataset.id;
      buyMiner({ minerId }).then(result => {
        alert(result.data.message);
        loadUserData(); // refresh
      }).catch(err => alert('Hata: ' + err.message));
    });
  });
  // Boxes
  const boxesDiv = document.getElementById('boxes-store');
  boxesDiv.innerHTML = `
    <div class="store-card"><h3>Küçük Kutu</h3><p>1000 KMR</p><button id="open-small">Aç</button></div>
    <div class="store-card"><h3>Orta Kutu</h3><p>5000 KMR</p><button id="open-medium">Aç</button></div>
    <div class="store-card"><h3>Büyük Kutu</h3><p>25000 KMR</p><button id="open-large">Aç</button></div>
    <div class="store-card"><h3>Efsanevi Kutu</h3><p>100000 KMR</p><button id="open-legendary">Aç</button></div>
  `;
  document.getElementById('open-small').onclick = () => openBox('small');
  document.getElementById('open-medium').onclick = () => openBox('medium');
  document.getElementById('open-large').onclick = () => openBox('large');
  document.getElementById('open-legendary').onclick = () => openBox('legendary');
}

async function openBox(boxType) {
  try {
    const result = await openBox({ boxType });
    alert(result.data.message);
    loadUserData();
  } catch (err) {
    alert('Kutu açılamadı: ' + err.message);
  }
}

// Update leaderboard
function updateLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  list.innerHTML = '';
  leaderboardData.forEach((entry, idx) => {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    row.innerHTML = `<span>${idx+1}. ${entry.username}</span><span>${entry.totalPH} PH</span>`;
    list.appendChild(row);
  });
  // find user's rank
  const myRank = leaderboardData.findIndex(e => e.uid === currentUser?.uid) + 1;
  document.getElementById('my-rank').innerText = myRank || '—';
}

// Update games section (wheel, scratch, daily tasks, achievements)
function updateGames() {
  // Daily tasks
  const tasksDiv = document.getElementById('daily-tasks');
  tasksDiv.innerHTML = '';
  // fetch daily tasks from DB
  get(ref(db, 'dailyRewards')).then(snap => {
    const tasks = snap.val() || {};
    Object.entries(tasks).forEach(([id, task]) => {
      const completed = userData.dailyTasksCompleted?.[id] || false;
      const btn = document.createElement('button');
      btn.innerText = `${task.name} (${task.reward} KMR)`;
      btn.disabled = completed;
      btn.onclick = () => claimDailyTask({ taskId: id }).then(() => loadUserData());
      tasksDiv.appendChild(btn);
    });
  });
  // Achievements
  const achDiv = document.getElementById('achievements-game');
  achDiv.innerHTML = '';
  get(ref(db, 'achievements')).then(snap => {
    const achievements = snap.val() || {};
    Object.values(achievements).forEach(ach => {
      const earned = userData.achievements?.includes(ach.id);
      const div = document.createElement('div');
      div.innerText = `${ach.name} (${ach.reward} KMR) ${earned ? '✓' : '❌'}`;
      achDiv.appendChild(div);
    });
  });
}

// Wheel spin
document.getElementById('spin-wheel-btn').onclick = async () => {
  try {
    const result = await spinWheel();
    alert(result.data.message);
    loadUserData();
  } catch (err) {
    alert('Hata: ' + err.message);
  }
};
// Scratch game
document.getElementById('scratch-btn').onclick = async () => {
  try {
    const result = await scratchGame();
    alert(result.data.message);
    loadUserData();
  } catch (err) {
    alert('Hata: ' + err.message);
  }
};

// Currency conversion
document.getElementById('convert-kmr-to-banknot').onclick = () => convert('kmr', 'banknot');
document.getElementById('convert-banknot-to-kmr').onclick = () => convert('banknot', 'kmr');
document.getElementById('convert-banknot-to-cekip').onclick = () => convert('banknot', 'cekip');
document.getElementById('convert-cekip-to-banknot').onclick = () => convert('cekip', 'banknot');
async function convert(from, to) {
  const amount = prompt(`Kaç ${from} dönüştürmek istiyorsunuz?`);
  if (!amount) return;
  try {
    const result = await convertCurrency({ from, to, amount: parseInt(amount) });
    alert(result.data.message);
    loadUserData();
  } catch (err) {
    alert('Hata: ' + err.message);
  }
}

// Withdrawal simulation
document.getElementById('withdraw-btn').onclick = () => {
  alert('Çekim talebi oluşturuldu (simülasyon).');
};

// Energy mining
document.getElementById('mine-btn').onclick = async () => {
  if (userData.energy < 10) {
    alert('Yeterli enerjiniz yok!');
    return;
  }
  // local energy decrease, but we'll also update server via callable or transaction
  const newEnergy = userData.energy - 10;
  const earn = 50; // base KMR per mine
  await update(ref(db, `users/${currentUser.uid}/energy`), newEnergy);
  await runTransaction(ref(db, `users/${currentUser.uid}/kmr`), (current) => (current || 0) + earn);
  alert(`Kazdınız! +${earn} KMR kazandınız. -10 enerji.`);
  loadUserData();
};

// Load user data and realtime listeners
function loadUserData() {
  if (!currentUser) return;
  const userRef = ref(db, `users/${currentUser.uid}`);
  onValue(userRef, (snap) => {
    userData = snap.val();
    if (userData) {
      updateHomeScreen();
      updateProfileScreen();
      updateStore();
      updateLeaderboard();
      updateGames();
    }
  });
  // Load leaderboard
  get(ref(db, 'leaderboard')).then(snap => {
    leaderboardData = Object.values(snap.val() || {});
    leaderboardData.sort((a,b) => b.totalPH - a.totalPH);
    updateLeaderboard();
  });
}

// Load static data (miners, items)
function loadStaticData() {
  get(ref(db, 'miners')).then(snap => minersData = snap.val() || {});
  get(ref(db, 'items')).then(snap => itemsData = snap.val() || {});
}

// Auth handlers
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    // claim offline earnings
    try {
      await claimOfflineEarnings();
    } catch (e) { console.error(e); }
    authContainer.style.display = 'none';
    gameContainer.style.display = 'flex';
    loadStaticData();
    loadUserData();
  } else {
    authContainer.style.display = 'flex';
    gameContainer.style.display = 'none';
    currentUser = null;
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginUsername.value + '@madenci.com';
  try {
    await signInWithEmailAndPassword(auth, email, loginPassword.value);
  } catch (err) {
    authError.innerText = 'Giriş başarısız: ' + err.message;
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = registerUsername.value;
  const password = registerPassword.value;
  const confirm = registerConfirm.value;
  if (username.length > 20) return authError.innerText = 'Kullanıcı adı max 20 karakter';
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return authError.innerText = 'Şifre en az 8 karakter, 1 büyük harf ve 1 rakam içermeli';
  }
  if (password !== confirm) return authError.innerText = 'Şifreler uyuşmuyor';
  const email = username + '@madenci.com';
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    // Create user profile in DB
    await set(ref(db, `users/${userCred.user.uid}`), {
      username: username,
      email: email,
      activeMinerId: 'miner1', // Mehmet Dayı
      totalPH: 0,
      kmr: 0,
      banknot: 0,
      kasa: 0,
      items: [],
      energy: 100,
      lastLogin: serverTimestamp(),
      achievements: [],
      dailyTasksCompleted: {}
    });
    // Also create username index
    await set(ref(db, `usernames/${username}`), userCred.user.uid);
    alert('Kayıt başarılı! Giriş yapabilirsiniz.');
  } catch (err) {
    authError.innerText = 'Kayıt hatası: ' + err.message;
  }
});

// Menu navigation
menuButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    showSection(section);
  });
});
showSection('home');

// Settings: logout & delete account
document.getElementById('logout-btn').onclick = () => signOut(auth);
document.getElementById('delete-account-btn').onclick = async () => {
  if (confirm('Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
    // Delete user data from DB and Auth (requires cloud function)
    alert('Bu işlem için sunucu tarafı gerekli, demo modunda.');
  }
};

// Telegram Web App init (optional)
if (window.Telegram?.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}
