// ============================================================
//  SapanKing v2.0 - game.js
//  3D FPS View | Combo | League | Shop | Firebase
// ============================================================

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
const auth = firebase.auth();
const db   = firebase.firestore();

// ---------- GLOBAL STATE ----------
let currentUser  = null;
let userData     = {};
let soundEnabled = true;
let musicEnabled = true;
let overlayCallback = null;

// League pay timer state
let leaguePayTimer       = null;
let leagueCountdownTimer = null;
let leagueNextPayAt      = null; // timestamp ms

// ---------- SHOP CONFIG ----------
const SHOP_PARTS = generateShopParts();

function generateShopParts() {
  const types = [
    { name: 'Y Çatal',        emoji: '🔱', ph: 1.2, cat: 'fork' },
    { name: 'Titanyum Kol',   emoji: '⚙️', ph: 1.5, cat: 'arm'  },
    { name: 'Karbon Bant',    emoji: '🖤', ph: 1.8, cat: 'band' },
    { name: 'Çelik Çatal',    emoji: '🔧', ph: 2.0, cat: 'fork' },
    { name: 'Kevlar Kol',     emoji: '🛡️', ph: 2.2, cat: 'arm'  },
    { name: 'Lateks Bant',    emoji: '🟡', ph: 1.1, cat: 'band' },
    { name: 'Tungsten Çatal', emoji: '⚡', ph: 2.8, cat: 'fork' },
    { name: 'Nano Kol',       emoji: '🔬', ph: 3.0, cat: 'arm'  },
    { name: 'Plazma Bant',    emoji: '💜', ph: 3.5, cat: 'band' },
    { name: 'Altın Çatal',    emoji: '✨', ph: 4.0, cat: 'fork' },
    { name: 'Elmas Kol',      emoji: '💎', ph: 4.5, cat: 'arm'  },
    { name: 'Kuantum Bant',   emoji: '🌀', ph: 5.0, cat: 'band' },
    { name: 'Obsidyen Çatal', emoji: '🖤', ph: 5.5, cat: 'fork' },
    { name: 'Mithril Kol',    emoji: '🌟', ph: 6.0, cat: 'arm'  },
    { name: 'Kozmik Bant',    emoji: '🌌', ph: 6.5, cat: 'band' },
    { name: 'Meteor Çatal',   emoji: '☄️', ph: 7.0, cat: 'fork' },
    { name: 'Kristal Kol',    emoji: '🔮', ph: 7.5, cat: 'arm'  },
    { name: 'Aura Bant',      emoji: '🌈', ph: 8.0, cat: 'band' },
    { name: 'Ejderha Çatal',  emoji: '🐉', ph: 9.0, cat: 'fork' },
    { name: 'Fırtına Kol',    emoji: '⛈️', ph: 9.5, cat: 'arm'  },
    { name: 'Şimşek Bant',    emoji: '⚡', ph:10.0, cat: 'band' },
    { name: 'Volkan Çatal',   emoji: '🌋', ph:10.5, cat: 'fork' },
    { name: 'Galaksi Kol',    emoji: '🌠', ph:11.0, cat: 'arm'  },
    { name: 'Kara Delik Bant',emoji: '🕳️', ph:11.5, cat: 'band' },
    { name: 'Yıldız Çatal',   emoji: '💫', ph:12.0, cat: 'fork' },
    { name: 'Zaman Kol',      emoji: '⏳', ph:12.5, cat: 'arm'  },
    { name: 'Boyut Bant',     emoji: '🔄', ph:13.0, cat: 'band' },
    { name: 'Tanrı Çatal',    emoji: '👑', ph:14.0, cat: 'fork' },
    { name: 'Evren Kol',      emoji: '🌍', ph:14.5, cat: 'arm'  },
    { name: 'Sonsuz Bant',    emoji: '♾️', ph:15.0, cat: 'band' },
  ];
  const parts = [];
  for (let i = 0; i < 110; i++) {
    const base = types[i % types.length];
    const tier = Math.floor(i / types.length) + 1;
    parts.push({
      id: i,
      name: `${base.name}${tier > 1 ? ' Mk.' + tier : ''}`,
      emoji: base.emoji,
      ph: +(base.ph * tier * 0.7).toFixed(1),
      cat: base.cat,
      rarity: tier <= 1 ? 'common' : tier <= 2 ? 'rare' : tier <= 3 ? 'epic' : 'legendary',
      color: tier <= 1 ? '#aaa' : tier <= 2 ? '#3498db' : tier <= 3 ? '#9b59b6' : '#f7c948'
    });
  }
  return parts;
}

const BOXES = [
  { id:'box_bronze', name:'Bronz Kutu', emoji:'📦', cost:5000,  color:'#cd7f32', partsCount:[0,29],   guaranteed:'common'    },
  { id:'box_silver', name:'Gümüş Kutu', emoji:'🎁', cost:20000, color:'#aaa',    partsCount:[30,69],  guaranteed:'rare'      },
  { id:'box_gold',   name:'Altın Kutu', emoji:'👑', cost:80000, color:'#f7c948', partsCount:[70,109], guaranteed:'epic'      },
];

// ---------- LEVEL CONFIG ----------
const LEVELS = [
  { minPts:     0, cups: 5,  balls:8, ptsPerCup:10, targetCups:3,  dist:12 },
  { minPts:   500, cups: 6,  balls:7, ptsPerCup:12, targetCups:4,  dist:13 },
  { minPts:  1200, cups: 7,  balls:7, ptsPerCup:14, targetCups:5,  dist:14 },
  { minPts:  2500, cups: 8,  balls:6, ptsPerCup:16, targetCups:5,  dist:15 },
  { minPts:  4500, cups: 9,  balls:6, ptsPerCup:18, targetCups:6,  dist:16 },
  { minPts:  7000, cups:10,  balls:5, ptsPerCup:20, targetCups:7,  dist:17 },
  { minPts: 10000, cups:12,  balls:5, ptsPerCup:22, targetCups:8,  dist:18 },
  { minPts: 15000, cups:14,  balls:5, ptsPerCup:25, targetCups:10, dist:19 },
  { minPts: 22000, cups:16,  balls:4, ptsPerCup:28, targetCups:12, dist:20 },
  { minPts: 32000, cups:18,  balls:4, ptsPerCup:32, targetCups:14, dist:21 },
];

function getLevelConfig(level) {
  return LEVELS[Math.min(level - 1, LEVELS.length - 1)];
}
function getLevel(totalPoints) {
  let lv = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVELS[i].minPts) { lv = i + 1; break; }
  }
  return lv;
}
function getNextLevelPts(totalPoints) {
  const lv = getLevel(totalPoints);
  if (lv >= LEVELS.length) return null;
  return LEVELS[lv].minPts;
}

// ---------- pH POWER ----------
function getUserPH() {
  const parts = userData.ownedParts || [];
  let ph = 1.0;
  parts.forEach(pid => {
    const p = SHOP_PARTS[pid];
    if (p) ph += p.ph * 0.1;
  });
  return Math.round(ph * 10) / 10;
}

// ============================================================
//  SCREEN NAVIGATION
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'menu-screen')        initMenuCanvas();
  if (id === 'leaderboard-screen') loadLeaderboard();
  if (id === 'wallet-screen')      refreshWallet();
  if (id === 'profile-screen')     refreshProfile();
  if (id === 'shop-screen')        initShop();
}

// ============================================================
//  AUTH
// ============================================================
function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById('tab-btn-' + tab).classList.add('active');
  document.getElementById('form-' + tab).classList.add('active');
  setMsg('auth-msg', '', false);
}
function setMsg(id, msg, isError = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'auth-msg' + (isError ? '' : ' success');
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) return setMsg('auth-msg', 'Lütfen tüm alanları doldur.');
  try { await auth.signInWithEmailAndPassword(email, pass); }
  catch(e) { setMsg('auth-msg', firebaseErrTR(e.code)); }
}
async function doRegister() {
  const username = document.getElementById('reg-user').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const pass     = document.getElementById('reg-pass').value;
  if (!username || !email || !pass) return setMsg('auth-msg', 'Lütfen tüm alanları doldur.');
  if (pass.length < 6) return setMsg('auth-msg', 'Şifre en az 6 karakter olmalı.');
  try {
    const snap = await db.collection('users').where('username','==',username).get();
    if (!snap.empty) return setMsg('auth-msg', 'Bu kullanıcı adı zaten alınmış.');
  } catch(e) {}
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await db.collection('users').doc(cred.user.uid).set({
      username, email, points:0, level:1, totalShots:0, ph:1.0,
      ownedParts:[], lastLeaguePay:null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) { setMsg('auth-msg', firebaseErrTR(e.code)); }
}
async function doGuest() {
  try { await auth.signInAnonymously(); }
  catch(e) { setMsg('auth-msg', firebaseErrTR(e.code)); }
}
function doLogout() { auth.signOut(); }

function firebaseErrTR(code) {
  const map = {
    'auth/user-not-found':'Kullanıcı bulunamadı.',
    'auth/wrong-password':'Şifre yanlış.',
    'auth/email-already-in-use':'Bu e-posta zaten kullanımda.',
    'auth/invalid-email':'Geçersiz e-posta.',
    'auth/weak-password':'Şifre çok zayıf.',
    'auth/network-request-failed':'Bağlantı hatası.',
    'auth/operation-not-allowed':'Misafir girişi devre dışı.',
  };
  return map[code] || 'Hata: ' + code;
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    if (user.isAnonymous) {
      const docRef = db.collection('users').doc(user.uid);
      const snap = await docRef.get();
      if (!snap.exists) {
        await docRef.set({
          username:'Misafir#'+Math.floor(Math.random()*9999),
          email:'', points:0, level:1, totalShots:0, ph:1.0,
          ownedParts:[], lastLeaguePay:null, isGuest:true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      userData = (await docRef.get()).data();
    } else {
      const snap = await db.collection('users').doc(user.uid).get();
      userData = snap.exists ? snap.data() : {
        username:user.email, email:user.email, points:0, level:1,
        totalShots:0, ph:1.0, ownedParts:[]
      };
    }
    updateNavUI();
    scheduleLeaguePay();
    showScreen('menu-screen');
  } else {
    currentUser = null;
    userData = {};
    showScreen('auth-screen');
  }
});

function updateNavUI() {
  const lv = getLevel(userData.points || 0);
  const ph = getUserPH();
  document.getElementById('nav-username').textContent = userData.username || 'Oyuncu';
  document.getElementById('nav-level').textContent    = '⚡ Lv.' + lv;
  document.getElementById('nav-points').textContent   = (userData.points || 0).toLocaleString('tr-TR');
  const phEl = document.getElementById('nav-ph');
  if (phEl) phEl.textContent = 'pH ' + ph.toFixed(1);
}

// ============================================================
//  LEAGUE PAY SYSTEM - Every 20 minutes
// ============================================================
const LEAGUE_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes

function scheduleLeaguePay() {
  if (leaguePayTimer)       clearInterval(leaguePayTimer);
  if (leagueCountdownTimer) clearInterval(leagueCountdownTimer);

  // Determine next pay time
  const last = userData.lastLeaguePay?.toDate ? userData.lastLeaguePay.toDate() : null;
  const now  = Date.now();

  if (last) {
    const elapsed = now - last.getTime();
    if (elapsed >= LEAGUE_INTERVAL_MS) {
      // Missed payout - do immediately
      leagueNextPayAt = now + 2000;
    } else {
      leagueNextPayAt = last.getTime() + LEAGUE_INTERVAL_MS;
    }
  } else {
    leagueNextPayAt = now + LEAGUE_INTERVAL_MS;
  }

  // Countdown UI tick every second
  leagueCountdownTimer = setInterval(updateLeagueCountdownUI, 1000);
  updateLeagueCountdownUI();

  // Check every second if it's pay time
  leaguePayTimer = setInterval(async () => {
    if (Date.now() >= leagueNextPayAt) {
      await distributeLeaguePay();
      leagueNextPayAt = Date.now() + LEAGUE_INTERVAL_MS;
    }
  }, 1000);
}

function updateLeagueCountdownUI() {
  const el = document.getElementById('league-countdown');
  if (!el || !leagueNextPayAt) return;
  const remaining = Math.max(0, leagueNextPayAt - Date.now());
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  el.textContent = `⏱ Lig payı: ${m}:${s.toString().padStart(2,'0')}`;
}

async function distributeLeaguePay() {
  if (!currentUser || userData.isGuest) return;
  const POOL = 50000;
  try {
    const snap = await db.collection('users').orderBy('points','desc').limit(100).get();
    let totalPH = 0;
    const users = [];
    snap.forEach(d => {
      const u  = d.data();
      const ph = calculatePHFromParts(u.ownedParts || []);
      totalPH += ph;
      users.push({ id: d.id, ph });
    });
    if (totalPH === 0) return;
    const me = users.find(u => u.id === currentUser.uid);
    if (!me) return;
    const myShare = Math.floor((me.ph / totalPH) * POOL);
    if (myShare > 0) {
      await db.collection('users').doc(currentUser.uid).update({
        points: firebase.firestore.FieldValue.increment(myShare),
        lastLeaguePay: firebase.firestore.FieldValue.serverTimestamp()
      });
      userData.points = (userData.points || 0) + myShare;
      userData.lastLeaguePay = new Date();
      updateNavUI();
      showLeaguePayNotif(myShare);
    }
  } catch(e) { console.warn('League pay error:', e); }
}

function calculatePHFromParts(parts) {
  let ph = 1.0;
  parts.forEach(pid => {
    const p = SHOP_PARTS[pid];
    if (p) ph += p.ph * 0.1;
  });
  return Math.round(ph * 10) / 10;
}

function showLeaguePayNotif(pts) {
  const notif = document.getElementById('league-notif');
  if (!notif) return;
  document.getElementById('league-notif-pts').textContent = pts.toLocaleString('tr-TR');
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 4000);
}

// ============================================================
//  PROFILE
// ============================================================
async function refreshProfile() {
  if (!currentUser) return;
  const pts    = userData.points || 0;
  const lv     = getLevel(pts);
  const next   = getNextLevelPts(pts);
  const curMin = LEVELS[Math.min(lv-1, LEVELS.length-1)].minPts;
  const nxtMin = next || curMin + 10000;
  const pct    = Math.min(100, Math.round(((pts - curMin) / (nxtMin - curMin)) * 100));
  const ph     = getUserPH();

  document.getElementById('profile-username').textContent = userData.username || 'Misafir';
  document.getElementById('profile-email').textContent    = userData.email || '-';
  document.getElementById('ps-level').textContent  = lv;
  document.getElementById('ps-points').textContent = pts.toLocaleString('tr-TR');
  document.getElementById('ps-shots').textContent  = userData.totalShots || 0;
  document.getElementById('ps-ph').textContent     = ph.toFixed(1);
  document.getElementById('level-fill').style.width = pct + '%';
  document.getElementById('next-level-pts').textContent = next
    ? (next - pts).toLocaleString('tr-TR') + ' puan'
    : 'Max level!';

  try {
    const snap = await db.collection('users').orderBy('points','desc').get();
    let rank = 1;
    snap.forEach(d => { if (d.id !== currentUser.uid && (d.data().points||0) > pts) rank++; });
    document.getElementById('ps-rank').textContent = '#' + rank;
    document.getElementById('nav-rank').textContent = '#' + rank;
  } catch(e) {}
}

// ============================================================
//  WALLET
// ============================================================
function refreshWallet() {
  const pts = userData.points || 0;
  const tl  = (pts / 100000).toFixed(2);
  document.getElementById('w-points').textContent = pts.toLocaleString('tr-TR');
  document.getElementById('w-tl').textContent     = tl;
  loadWithdrawHistory();
}
function switchWTab(tab) {
  document.querySelectorAll('.wtab').forEach(b  => b.classList.remove('active'));
  document.querySelectorAll('.wform').forEach(f => f.classList.remove('active'));
  document.getElementById('wtab-' + tab).classList.add('active');
  document.getElementById('wform-' + tab).classList.add('active');
  setMsg('withdraw-msg', '', false);
}
async function submitWithdraw() {
  if (!currentUser || userData.isGuest) return setMsg('withdraw-msg','Misafirler çekim yapamaz. Kayıt ol!');
  const pts    = userData.points || 0;
  const isIban = document.getElementById('wtab-iban').classList.contains('active');
  let amount, payload;
  if (isIban) {
    const iban = document.getElementById('w-iban').value.trim();
    const name = document.getElementById('w-fullname').value.trim();
    amount     = parseInt(document.getElementById('w-amount-iban').value) || 0;
    if (!iban || !name || !amount) return setMsg('withdraw-msg','Lütfen tüm alanları doldur.');
    payload = { type:'iban', iban, fullName:name };
  } else {
    const ctype = document.getElementById('w-crypto-type').value;
    const addr  = document.getElementById('w-crypto-addr').value.trim();
    amount      = parseInt(document.getElementById('w-amount-crypto').value) || 0;
    if (!addr || !amount) return setMsg('withdraw-msg','Lütfen tüm alanları doldur.');
    payload = { type:'crypto', cryptoType:ctype, address:addr };
  }
  if (amount < 500000) return setMsg('withdraw-msg','Minimum çekim 500.000 puan (5 TL).');
  if (amount > pts)    return setMsg('withdraw-msg','Yetersiz puan.');
  try {
    const tlAmount = (amount / 100000).toFixed(2);
    await db.collection('withdrawals').add({
      uid:currentUser.uid, username:userData.username,
      points:amount, tl:parseFloat(tlAmount),
      status:'pending', ...payload,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await db.collection('users').doc(currentUser.uid).update({
      points: firebase.firestore.FieldValue.increment(-amount)
    });
    userData.points = pts - amount;
    updateNavUI(); refreshWallet();
    setMsg('withdraw-msg','✅ Talebiniz alındı!', false);
  } catch(e) { setMsg('withdraw-msg','Hata: ' + e.message); }
}
async function loadWithdrawHistory() {
  if (!currentUser) return;
  const list = document.getElementById('withdraw-list');
  try {
    const snap = await db.collection('withdrawals')
      .where('uid','==',currentUser.uid)
      .orderBy('createdAt','desc').limit(10).get();
    if (snap.empty) { list.innerHTML = '<div class="empty-state">Henüz talep yok</div>'; return; }
    list.innerHTML = '';
    snap.forEach(d => {
      const w = d.data();
      const date = w.createdAt ? w.createdAt.toDate().toLocaleDateString('tr-TR') : '-';
      const sc   = {pending:'w-status-pending', done:'w-status-done', rejected:'w-status-rejected'}[w.status] || '';
      const st   = {pending:'Beklemede', done:'Ödendi', rejected:'Reddedildi'}[w.status] || w.status;
      list.innerHTML += `
        <div class="withdraw-item">
          <div>
            <div style="font-weight:700">${w.points.toLocaleString('tr-TR')} puan</div>
            <div style="color:var(--text2);font-size:0.78rem">${w.tl} TL · ${w.type==='iban'?'🏦 IBAN':'₿ Kripto'} · ${date}</div>
          </div>
          <span class="${sc}">${st}</span>
        </div>`;
    });
  } catch(e) { list.innerHTML = '<div class="empty-state">Yüklenemedi</div>'; }
}

// ============================================================
//  LEADERBOARD
// ============================================================
async function loadLeaderboard() {
  const list = document.getElementById('lb-list');
  list.innerHTML = '<div class="empty-state">Yükleniyor...</div>';
  try {
    const snap = await db.collection('users').orderBy('points','desc').limit(50).get();
    list.innerHTML = '';
    let myRank = '-';
    let rank   = 1;
    const myPts = userData.points || 0;
    snap.forEach(d => {
      const u    = d.data();
      const isMe = d.id === currentUser?.uid;
      if (isMe) myRank = rank;
      const rankClass = rank===1?'gold':rank===2?'silver':rank===3?'bronze':'';
      const lv = getLevel(u.points || 0);
      const ph = calculatePHFromParts(u.ownedParts || []);
      list.innerHTML += `
        <div class="lb-item ${isMe?'me':''}">
          <div class="lb-rank ${rankClass}">${rank}</div>
          <div class="lb-info">
            <div class="lb-name">${u.username||'Oyuncu'} ${isMe?'👈':''}</div>
            <div class="lb-lvl">Lv.${lv} · pH ${ph.toFixed(1)}</div>
          </div>
          <div class="lb-pts">${(u.points||0).toLocaleString('tr-TR')}</div>
        </div>`;
      rank++;
    });
    document.getElementById('lb-rank-num').textContent = myRank!=='-'?'#'+myRank:'#'+rank;
    document.getElementById('lb-rank-pts').textContent = myPts.toLocaleString('tr-TR');
    document.getElementById('nav-rank').textContent    = myRank!=='-'?'#'+myRank:'#-';
  } catch(e) { list.innerHTML = '<div class="empty-state">Sıralama yüklenemedi</div>'; }
}

// ============================================================
//  SHOP
// ============================================================
let shopFilter = 'all';

function initShop() {
  renderShopBoxes();
  renderShopParts();
  updateShopPH();
}
function updateShopPH() {
  const ph = getUserPH();
  const el = document.getElementById('shop-ph');
  if (el) el.textContent = 'Gücün: pH ' + ph.toFixed(1);
}
function filterShop(cat) {
  shopFilter = cat;
  document.querySelectorAll('.shop-filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-filter="${cat}"]`).classList.add('active');
  renderShopParts();
}
function renderShopBoxes() {
  const el = document.getElementById('shop-boxes');
  if (!el) return;
  el.innerHTML = BOXES.map(box => `
    <div class="shop-box" onclick="openBox('${box.id}')">
      <div class="shop-box-emoji" style="filter:drop-shadow(0 0 12px ${box.color})">${box.emoji}</div>
      <div class="shop-box-name" style="color:${box.color}">${box.name}</div>
      <div class="shop-box-cost">💰 ${box.cost.toLocaleString('tr-TR')} puan</div>
      <div class="shop-box-hint">Parça kazan!</div>
    </div>`).join('');
}
function renderShopParts() {
  const el    = document.getElementById('shop-parts-list');
  if (!el) return;
  const owned = userData.ownedParts || [];
  const parts = shopFilter === 'all' ? SHOP_PARTS : SHOP_PARTS.filter(p => p.cat === shopFilter);
  el.innerHTML = parts.map(part => {
    const isOwned = owned.includes(part.id);
    return `
    <div class="shop-part ${isOwned?'owned':''}" style="border-color:${part.color}20">
      <div class="shop-part-emoji" style="color:${part.color}">${part.emoji}</div>
      <div class="shop-part-name">${part.name}</div>
      <div class="shop-part-ph" style="color:${part.color}">+pH ${part.ph}</div>
      <div class="shop-part-rarity" style="color:${part.color}">${part.rarity.toUpperCase()}</div>
      ${isOwned ? '<div class="owned-badge">✓ Sahip</div>' : ''}
    </div>`;
  }).join('');
}
async function openBox(boxId) {
  const box = BOXES.find(b => b.id === boxId);
  if (!box) return;
  const pts = userData.points || 0;
  if (pts < box.cost) { showBoxResult(null, `Yetersiz puan! ${box.cost.toLocaleString('tr-TR')} puan gerekli.`); return; }
  const [min, max] = box.partsCount;
  const partId = min + Math.floor(Math.random() * (max - min + 1));
  const part   = SHOP_PARTS[partId];
  try {
    const owned    = userData.ownedParts || [];
    const newOwned = [...new Set([...owned, part.id])];
    await db.collection('users').doc(currentUser.uid).update({
      points:    firebase.firestore.FieldValue.increment(-box.cost),
      ownedParts: newOwned,
      ph:        calculatePHFromParts(newOwned)
    });
    userData.points     = pts - box.cost;
    userData.ownedParts = newOwned;
    updateNavUI(); updateShopPH(); renderShopParts();
    showBoxResult(part, null);
  } catch(e) { showBoxResult(null, 'Hata: ' + e.message); }
}
function showBoxResult(part, error) {
  const modal   = document.getElementById('box-result-modal');
  const content = document.getElementById('box-result-content');
  if (!modal || !content) return;
  if (error) {
    content.innerHTML = `<div class="box-result-error">${error}</div>`;
  } else {
    content.innerHTML = `
      <div class="box-result-anim">
        <div class="box-result-emoji" style="color:${part.color}">${part.emoji}</div>
        <div class="box-result-name" style="color:${part.color}">${part.name}</div>
        <div class="box-result-ph">+pH ${part.ph} güç kazandın!</div>
        <div class="box-result-rarity" style="color:${part.color}">${part.rarity.toUpperCase()}</div>
      </div>`;
  }
  modal.classList.add('show');
}
function closeBoxModal() {
  document.getElementById('box-result-modal').classList.remove('show');
}

// ============================================================
//  SETTINGS
// ============================================================
function toggleSoundSetting() { soundEnabled = document.getElementById('set-sound').checked; }
function toggleMusic()        { musicEnabled = document.getElementById('set-music').checked; }
function toggleDark()         { document.body.classList.toggle('dark-mode', document.getElementById('set-dark').checked); }
function toggleSound() {
  soundEnabled = !soundEnabled;
  document.getElementById('sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
  document.getElementById('set-sound').checked      = soundEnabled;
}

// ============================================================
//  SOUND
// ============================================================
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, type, duration, vol=0.3) {
  if (!soundEnabled) return;
  try {
    const ctx  = getAudio();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}
function sfxLaunch() { playTone(200,'sawtooth',0.1,0.3); setTimeout(()=>playTone(400,'sine',0.15,0.2),80); }
function sfxHit()    { playTone(180,'square',0.1,0.4); playTone(340,'sine',0.08,0.25); setTimeout(()=>playTone(500,'sine',0.1,0.2),60); }
function sfxCombo(n) { const f=[523,659,784,880,1047][Math.min(n-2,4)]; playTone(f,'sine',0.4,0.5); }
function sfxMiss()   { playTone(120,'sine',0.3,0.2); }
function sfxWin()    { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.4),i*100)); }
function sfxFail()   { [300,200,150].forEach((f,i)=>setTimeout(()=>playTone(f,'sawtooth',0.3),i*150)); }

// ============================================================
//  MENU CANVAS ANIMATION
// ============================================================
let menuAnimId = null;
function initMenuCanvas() {
  const canvas = document.getElementById('menu-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const floaters = [];
  const stars    = [];
  for (let i = 0; i < 14; i++) {
    floaters.push({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      size:20+Math.random()*30,
      vx:(Math.random()-0.5)*0.5, vy:-0.2-Math.random()*0.4,
      opacity:0.06+Math.random()*0.1,
      emoji:['🥤','🏹','⭐','💰','🎯','⚡','🔱','💎'][Math.floor(Math.random()*8)]
    });
  }
  for (let i = 0; i < 60; i++) {
    stars.push({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      r:0.5+Math.random()*2, twinkle:Math.random()*Math.PI*2,
      speed:0.02+Math.random()*0.04
    });
  }

  if (menuAnimId) cancelAnimationFrame(menuAnimId);
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const grad = ctx.createRadialGradient(canvas.width/2,canvas.height/2,0,canvas.width/2,canvas.height/2,canvas.width);
    grad.addColorStop(0,'#1a1445'); grad.addColorStop(1,'#0f0c1d');
    ctx.fillStyle = grad; ctx.fillRect(0,0,canvas.width,canvas.height);
    stars.forEach(s => {
      s.twinkle += s.speed;
      const alpha = 0.3 + 0.4*Math.sin(s.twinkle);
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(255,240,180,${alpha})`; ctx.fill();
    });
    ctx.font = '28px serif';
    floaters.forEach(c => {
      ctx.globalAlpha = c.opacity;
      ctx.fillText(c.emoji, c.x, c.y);
      c.x += c.vx; c.y += c.vy;
      if (c.y < -40)                { c.y = canvas.height+40; c.x = Math.random()*canvas.width; }
      if (c.x < -40)                 c.x = canvas.width+40;
      if (c.x > canvas.width+40)    c.x = -40;
    });
    ctx.globalAlpha = 1;
    menuAnimId = requestAnimationFrame(draw);
  }
  draw();
}

// ============================================================
//  3D FPS GAME ENGINE
// ============================================================
let gameState  = null;
let gameAnimId = null;

// ---- DRAG / SLING STATE ----
let isDragging  = false;
let dragStartX  = 0;   // pointer start (screen)
let dragStartY  = 0;
let dragOffX    = 0;   // current offset from center
let dragOffY    = 0;
const MAX_PULL  = 90;  // max pixels pull

// Camera settings
const CAM = { fov:65, near:0.1, far:60 };

// ---- World-space sling anchor (where the ball rests) ----
// This is a fixed 3D point the player is "holding"
const SLING_ANCHOR = { x:0, y:-0.55, z:-1.1 };  // slightly below and in front of camera

function startGame() {
  if (menuAnimId) { cancelAnimationFrame(menuAnimId); menuAnimId = null; }
  showScreen('game-screen');
  initGameLevel(getLevel(userData.points || 0));
}
function exitGame() {
  if (gameAnimId) { cancelAnimationFrame(gameAnimId); gameAnimId = null; }
  gameState = null;
  isDragging = false;
  showScreen('menu-screen');
}

function initGameLevel(level) {
  const cfg    = getLevelConfig(level);
  const canvas = document.getElementById('game-canvas');
  canvas.width  = canvas.offsetWidth  || window.innerWidth;
  canvas.height = canvas.offsetHeight || (window.innerHeight - 100);

  gameState = {
    level, cfg, canvas,
    ctx:      canvas.getContext('2d'),
    cups:     build3DCups(cfg.cups, cfg.dist),
    balls:    cfg.balls,
    points:   0,
    sessionPoints: 0,
    lives:    3,
    cupsHit:  0,
    particles:[],
    projectile:null,
    launched: false,
    done:     false,
    frameCount:0,
    combo:    0,
    maxCombo: 0,
    totalShots:0,
    ph:       getUserPH(),
  };

  isDragging = false;
  dragOffX   = 0;
  dragOffY   = 0;

  updateGameHUD();
  setupGameInput(canvas);
  if (gameAnimId) cancelAnimationFrame(gameAnimId);
  gameLoop();
}

// ---- Build cups in 3D world space ----
function build3DCups(count, dist) {
  const cups = [];
  // Arrange in a grid, centred on Z axis
  const cols = Math.ceil(Math.sqrt(count * 1.6));
  const rows = Math.ceil(count / cols);
  let idx = 0;
  for (let r = 0; r < rows && idx < count; r++) {
    for (let c = 0; c < cols && idx < count; c++) {
      const x = (c - (cols-1)/2) * 1.1;
      const y = r * 0.95;          // stacked upward
      const z = -(dist + r * 0.4);
      cups.push({
        x, y, z,
        w: 0.38, h: 0.52,
        alive: true,
        color: ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#e91e63','#00bcd4','#ff6b35'][idx % 8],
        idx,
        hitAnim: 0,
        flyVx: 0, flyVy: 0, flyVz: 0, // when hit
        flying: false
      });
      idx++;
    }
  }
  return cups;
}

// ============================================================
//  INPUT  (pointer-based, works on touch & mouse)
// ============================================================
function setupGameInput(canvas) {
  canvas.addEventListener('mousedown',  onPointerDown, { passive:false });
  canvas.addEventListener('mousemove',  onPointerMove, { passive:false });
  canvas.addEventListener('mouseup',    onPointerUp,   { passive:false });
  canvas.addEventListener('mouseleave', onPointerUp,   { passive:false });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); const t=e.touches[0]; onPointerDown({clientX:t.clientX,clientY:t.clientY}); }, { passive:false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); const t=e.touches[0]; onPointerMove({clientX:t.clientX,clientY:t.clientY}); }, { passive:false });
  canvas.addEventListener('touchend',   e => { e.preventDefault(); onPointerUp(); }, { passive:false });
}

function getSlingScreenPos() {
  // Returns the pixel position on screen where the sling anchor projects
  if (!gameState) return { x:0, y:0 };
  return project3DtoScreen(SLING_ANCHOR.x, SLING_ANCHOR.y, SLING_ANCHOR.z, gameState.canvas);
}

function onPointerDown(e) {
  if (!gameState || gameState.launched || gameState.done || gameState.balls <= 0) return;
  const canvas = gameState.canvas;
  const rect   = canvas.getBoundingClientRect();
  const px     = e.clientX - rect.left;
  const py     = e.clientY - rect.top;

  // Hit test: within radius of sling anchor screen position
  const sp = getSlingScreenPos();
  if (!sp) return;
  const dist = Math.hypot(px - sp.x, py - sp.y);
  if (dist < 80) {
    isDragging = true;
    dragOffX   = 0;
    dragOffY   = 0;
  }
}

function onPointerMove(e) {
  if (!isDragging || !gameState) return;
  const canvas = gameState.canvas;
  const rect   = canvas.getBoundingClientRect();
  const px     = e.clientX - rect.left;
  const py     = e.clientY - rect.top;

  const sp   = getSlingScreenPos();
  if (!sp) return;

  // Raw offset from anchor
  let ox = px - sp.x;
  let oy = py - sp.y;

  // Clamp to circle
  const len = Math.hypot(ox, oy);
  if (len > MAX_PULL) {
    ox = (ox / len) * MAX_PULL;
    oy = (oy / len) * MAX_PULL;
  }

  // Only allow pulling DOWN (toward camera / below the anchor)
  if (oy < 0) oy = 0;

  dragOffX = ox;
  dragOffY = oy;
}

function onPointerUp() {
  if (!isDragging || !gameState) return;
  isDragging = false;

  const pullLen = Math.hypot(dragOffX, dragOffY);
  if (pullLen < 10) { dragOffX = 0; dragOffY = 0; return; } // too short, ignore

  const t     = pullLen / MAX_PULL;       // 0..1
  const ph    = gameState.ph;
  const speed = (8 + ph * 0.8) * t;      // launch speed proportional to pull + pH

  // Direction: opposite of pull
  const nx  = -dragOffX / pullLen;
  const ny  = -dragOffY / pullLen;

  // Map screen pull to 3D velocity
  // nx maps to world X (strafe), ny maps to world Y+Z (up+forward)
  const vx  =  nx * speed * 0.5;
  const vy  =  ny * speed * 0.6 + speed * 0.25;  // upward + forward component
  const vz  = -speed;                              // always shoots forward

  gameState.projectile = {
    x: SLING_ANCHOR.x,
    y: SLING_ANCHOR.y,
    z: SLING_ANCHOR.z,
    vx, vy, vz,
    r: 0.14,
    trail: [],
    age: 0,
    gravity: -0.022
  };

  gameState.launched   = true;
  gameState.balls--;
  gameState.totalShots++;
  dragOffX = 0;
  dragOffY = 0;
  sfxLaunch();
  updateGameHUD();
}

// ============================================================
//  GAME LOOP
// ============================================================
function gameLoop() {
  if (!gameState) return;
  update3D();
  render3D();
  if (!gameState.done) gameAnimId = requestAnimationFrame(gameLoop);
}

function update3D() {
  const gs = gameState;
  gs.frameCount++;

  // Particles
  gs.particles = gs.particles.filter(p => p.life > 0);
  gs.particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.z += p.vz;
    p.vy -= 0.006;
    p.life--;
    p.alpha = p.life / p.maxLife;
  });

  // Flying cups (after hit)
  gs.cups.forEach(cup => {
    if (!cup.flying) return;
    cup.x += cup.flyVx;
    cup.y += cup.flyVy;
    cup.z += cup.flyVz;
    cup.flyVy -= 0.04;
    cup.flyVz += 0.05;
    if (cup.y < -5 || cup.z > 2) cup.flying = false;
  });

  if (!gs.projectile) {
    // Auto-check end if no balls and no projectile
    if (!gs.launched && gs.balls <= 0 && !gs.done) checkRoundEnd();
    return;
  }

  const p = gs.projectile;
  p.age++;

  // Trail
  p.trail.push({ x:p.x, y:p.y, z:p.z });
  if (p.trail.length > 18) p.trail.shift();

  // Physics (per frame, ~60fps assumed)
  p.vy    += p.gravity;
  p.x     += p.vx  * 0.28;
  p.y     += p.vy  * 0.28;
  p.z     += p.vz  * 0.28;

  // ---- Hit detection ----
  let hitThisFrame = false;
  gs.cups.forEach(cup => {
    if (!cup.alive) return;
    const dx = Math.abs(p.x - cup.x);
    const dy = Math.abs(p.y - cup.y);
    const dz = Math.abs(p.z - cup.z);
    if (dx < cup.w + p.r && dy < cup.h + p.r && dz < 0.45 + p.r) {
      cup.alive   = false;
      cup.flying  = true;
      cup.flyVx   = (Math.random()-0.5)*0.12 + p.vx*0.04;
      cup.flyVy   =  0.15 + Math.random()*0.1;
      cup.flyVz   = -p.vz * 0.08;
      gs.cupsHit++;
      gs.combo++;
      gs.maxCombo = Math.max(gs.maxCombo, gs.combo);
      const comboBonus = gs.combo > 1 ? Math.floor(gs.cfg.ptsPerCup * (gs.combo * 0.5)) : 0;
      const earned     = gs.cfg.ptsPerCup + comboBonus;
      gs.points        += earned;
      gs.sessionPoints += earned;
      spawn3DParticles(cup.x, cup.y, cup.z, cup.color, earned);
      sfxHit();
      if (gs.combo > 1) sfxCombo(gs.combo);
      if (document.getElementById('set-vibrate')?.checked) navigator.vibrate?.(30);
      hitThisFrame = true;
      updateGameHUD();
      showComboUI(gs.combo);

      // Deflect ball slightly
      p.vx += (Math.random()-0.5)*0.5;
      p.vy += 0.3;
      p.vz  = p.vz * 0.6;
    }
  });
  if (!hitThisFrame) { /* combo resets only on full miss (no hit at all in flight) */ }

  // Out of range
  if (p.z < -60 || p.y < -8 || p.z > 2 || Math.abs(p.x) > 15) {
    gs.projectile = null;
    gs.launched   = false;
    if (!hitThisFrame) { gs.combo = 0; sfxMiss(); }
    checkRoundEnd();
  }
}

function showComboUI(combo) {
  if (combo < 2) return;
  const el = document.getElementById('combo-display');
  if (!el) return;
  el.textContent = 'COMBO x' + combo + '! 🔥';
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 1200);
}

function spawn3DParticles(x, y, z, color, pts) {
  const gs = gameState;
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = 0.04 + Math.random() * 0.10;
    gs.particles.push({
      x, y, z,
      vx: Math.cos(angle)*spd, vy:0.08+Math.random()*0.1, vz:Math.sin(angle)*spd*0.3,
      r:0.04+Math.random()*0.07, color, alpha:1,
      life:40+Math.random()*20, maxLife:60, text:null
    });
  }
  gs.particles.push({
    x, y:y+0.4, z, vx:0, vy:0.025, vz:0,
    r:0, color:'#f7c948', alpha:1, life:70, maxLife:70, text:'+'+pts
  });
}

function checkRoundEnd() {
  const gs = gameState;
  if (gs.done) return;
  const alive     = gs.cups.filter(c => c.alive).length;
  const allHit    = alive === 0;
  const noAmmo    = gs.balls <= 0 && !gs.projectile;
  const hitEnough = gs.cupsHit >= gs.cfg.targetCups;

  if (allHit || (noAmmo && hitEnough)) {
    gs.done = true; sfxWin();
    setTimeout(() => showOverlay('win'), 800);
  } else if (noAmmo && !hitEnough) {
    gs.lives--;
    gs.done = true; sfxFail();
    setTimeout(() => showOverlay(gs.lives <= 0 ? 'fail' : 'retry'), 800);
  }
}

function showOverlay(type) {
  const gs       = gameState;
  const earned   = gs.sessionPoints;
  const comboTxt = gs.maxCombo > 1 ? ` · Max Combo x${gs.maxCombo}` : '';
  document.getElementById('game-overlay').classList.remove('hidden');
  if (type === 'win') {
    document.getElementById('overlay-icon').textContent  = '🎉';
    document.getElementById('overlay-title').textContent = 'Level Tamamlandı!';
    document.getElementById('overlay-msg').textContent   = `+${earned.toLocaleString('tr-TR')} puan${comboTxt}`;
    document.getElementById('overlay-btn').textContent   = 'Sonraki Level →';
    overlayCallback = async () => { await savePoints(earned); initGameLevel(getLevel((userData.points||0))); };
  } else if (type === 'retry') {
    document.getElementById('overlay-icon').textContent  = '😅';
    document.getElementById('overlay-title').textContent = 'Yeterli Bardak Yıkılmadı!';
    document.getElementById('overlay-msg').textContent   = `${gs.cupsHit}/${gs.cfg.targetCups} bardak · ❤️ ${gs.lives} can · +${earned} puan`;
    document.getElementById('overlay-btn').textContent   = 'Tekrar Dene';
    overlayCallback = async () => { await savePoints(earned); initGameLevel(gs.level); };
  } else {
    document.getElementById('overlay-icon').textContent  = '💀';
    document.getElementById('overlay-title').textContent = 'Oyun Bitti!';
    document.getElementById('overlay-msg').textContent   = `+${earned.toLocaleString('tr-TR')} puan · Canın tükendi!`;
    document.getElementById('overlay-btn').textContent   = 'Ana Menü';
    overlayCallback = async () => { await savePoints(earned); document.getElementById('game-overlay').classList.add('hidden'); exitGame(); };
  }
}
function overlayAction() {
  document.getElementById('game-overlay').classList.add('hidden');
  if (overlayCallback) overlayCallback();
}
async function savePoints(pts) {
  if (!currentUser || pts === 0) return;
  try {
    const newTotal = (userData.points||0) + pts;
    const newLevel = getLevel(newTotal);
    const newShots = (userData.totalShots||0) + (gameState?.totalShots||0);
    await db.collection('users').doc(currentUser.uid).update({
      points:     firebase.firestore.FieldValue.increment(pts),
      level:      newLevel,
      totalShots: firebase.firestore.FieldValue.increment(gameState?.totalShots||0)
    });
    userData.points     = newTotal;
    userData.level      = newLevel;
    userData.totalShots = newShots;
    updateNavUI();
  } catch(e) { console.error('Save error:', e); }
}

// ============================================================
//  3D PROJECTION HELPERS
// ============================================================
function project3DtoScreen(wx, wy, wz, canvas) {
  // Camera is at origin looking down -Z
  const relZ = -wz;
  if (relZ <= CAM.near) return null;
  const fovRad = (CAM.fov * Math.PI) / 180;
  const f  = (canvas.height * 0.5) / Math.tan(fovRad * 0.5);
  const sx = (wx / relZ) * f + canvas.width  * 0.5;
  const sy = (-wy / relZ) * f + canvas.height * 0.5;
  return { sx, sy, scale: f / relZ, depth: relZ };
}

// ============================================================
//  RENDERER
// ============================================================
function render3D() {
  const gs = gameState;
  const { ctx, canvas, cups, projectile, particles } = gs;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // ---- SKY ----
  const sky = ctx.createLinearGradient(0,0,0,canvas.height*0.62);
  sky.addColorStop(0,'#060412');
  sky.addColorStop(1,'#1a1445');
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,canvas.width, canvas.height*0.62);

  // ---- FLOOR ----
  const horizonY = canvas.height * 0.62;
  const floor = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
  floor.addColorStop(0,'#1a1630');
  floor.addColorStop(1,'#0d0b1a');
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

  // Floor grid
  ctx.strokeStyle = 'rgba(100,80,200,0.18)';
  ctx.lineWidth   = 1;
  for (let i = 1; i <= 14; i++) {
    const t = i / 14;
    const y = horizonY + (canvas.height - horizonY) * Math.pow(t, 1.8);
    const w = canvas.width * t * 2.2;
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 - w/2, y);
    ctx.lineTo(canvas.width/2 + w/2, y);
    ctx.stroke();
  }
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 + i*(canvas.width/7), canvas.height + 20);
    ctx.lineTo(canvas.width/2, horizonY);
    ctx.stroke();
  }

  // Stars
  for (let i = 0; i < 50; i++) {
    const sx    = (Math.sin(i*137.5)*0.5+0.5)*canvas.width;
    const sy    = (Math.sin(i*97.3)*0.5+0.5)*horizonY*0.95;
    const r     = 0.4 + Math.sin(gs.frameCount*0.04+i)*0.35;
    ctx.fillStyle = `rgba(255,255,200,${0.4+Math.sin(gs.frameCount*0.03+i*2)*0.3})`;
    ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2); ctx.fill();
  }

  // ---- CUPS (back to front) ----
  const allCups = cups.filter(c => c.alive || c.flying)
    .sort((a,b) => a.z - b.z);

  allCups.forEach(cup => {
    const proj = project3DtoScreen(cup.x, cup.y, cup.z, canvas);
    if (!proj || proj.depth > CAM.far || proj.depth <= 0) return;
    const w = cup.w * proj.scale * 100;
    const h = cup.h * proj.scale * 100;
    draw3DCup(ctx, proj.sx - w/2, proj.sy - h/2, w, h, cup.color, proj.depth, cup.alive);
  });

  // ---- PARTICLES ----
  particles.forEach(p => {
    const proj = project3DtoScreen(p.x, p.y, p.z, canvas);
    if (!proj || proj.depth <= 0) return;
    ctx.globalAlpha = p.alpha;
    if (p.text) {
      const fs = Math.max(11, 20 * proj.scale * 10);
      ctx.font = `bold ${fs}px Boogaloo, cursive`;
      ctx.fillStyle = p.color;
      ctx.textAlign = 'center';
      ctx.fillText(p.text, proj.sx, proj.sy);
      ctx.textAlign = 'left';
    } else {
      const r = Math.max(1.5, p.r * proj.scale * 80);
      ctx.beginPath(); ctx.arc(proj.sx, proj.sy, r, 0, Math.PI*2);
      ctx.fillStyle = p.color; ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  // ---- PROJECTILE TRAIL ----
  if (projectile) {
    projectile.trail.forEach((pt,i) => {
      const proj = project3DtoScreen(pt.x, pt.y, pt.z, canvas);
      if (!proj || proj.depth <= 0) return;
      const alpha = (i / projectile.trail.length) * 0.55;
      const r     = Math.max(2, (3 + i*0.5) * proj.scale * 10);
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(proj.sx, proj.sy, r, 0, Math.PI*2);
      ctx.fillStyle = '#6dd5fa'; ctx.fill();
    });
    ctx.globalAlpha = 1;
    const bp = project3DtoScreen(projectile.x, projectile.y, projectile.z, canvas);
    if (bp && bp.depth > 0) {
      const br = Math.max(5, projectile.r * bp.scale * 100);
      drawBall3D(ctx, bp.sx, bp.sy, br);
    }
  }

  // ---- SLING (first-person, fixed bottom) ----
  drawSling3D(ctx, canvas);

  // ---- CROSSHAIR (fixed centre of screen) ----
  drawCrosshair(ctx, canvas);

  // ---- HUD progress ----
  const pct = gs.cupsHit / gs.cfg.targetCups;
  document.getElementById('game-progress').style.width = Math.min(pct*100,100) + '%';
}

// ---- Cup drawing ----
function draw3DCup(ctx, x, y, w, h, color, depth, alive) {
  if (w < 2 || h < 2) return;
  const alpha = Math.max(0.25, 1 - depth / CAM.far * 0.4);
  ctx.globalAlpha = alive ? alpha : alpha * 0.55;

  // Shadow ellipse on floor
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x+w/2, y+h+3, w*0.48, h*0.07, 0, 0, Math.PI*2);
  ctx.fill();

  // Cup body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + w*0.1, y);
  ctx.lineTo(x + w*0.9, y);
  ctx.lineTo(x + w,     y + h);
  ctx.lineTo(x,         y + h);
  ctx.closePath();
  ctx.fill();

  // Rim
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillRect(x + w*0.05, y, w*0.9, h*0.09);

  // Shine stripe
  const shine = ctx.createLinearGradient(x, y, x+w*0.35, y);
  shine.addColorStop(0,'rgba(255,255,255,0.28)');
  shine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.moveTo(x+w*0.1,  y+h*0.1);
  ctx.lineTo(x+w*0.24, y+h*0.1);
  ctx.lineTo(x+w*0.19, y+h*0.88);
  ctx.lineTo(x+w*0.05, y+h*0.88);
  ctx.closePath(); ctx.fill();

  // Right face 3D
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.moveTo(x+w*0.9, y);
  ctx.lineTo(x+w*0.9+w*0.07, y+h*0.1);
  ctx.lineTo(x+w+w*0.07,     y+h);
  ctx.lineTo(x+w,            y+h);
  ctx.closePath(); ctx.fill();

  // Bottom base
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + w*0.05, y+h - h*0.07, w*0.9, h*0.07);

  ctx.globalAlpha = 1;
}

function drawBall3D(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x-r*0.3, y-r*0.35, r*0.08, x, y, r);
  g.addColorStop(0,'#c8f0ff');
  g.addColorStop(0.35,'#3498db');
  g.addColorStop(1,'#0d2a4a');
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.stroke();
  // Highlight
  ctx.beginPath(); ctx.arc(x-r*0.32, y-r*0.32, r*0.26, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
}

// ============================================================
//  SLING RENDERER  (FPS first-person view, fixed to bottom)
// ============================================================
function drawSling3D(ctx, canvas) {
  const W  = canvas.width;
  const H  = canvas.height;

  // Anchor: where the ball rests in screen space
  const sp = project3DtoScreen(SLING_ANCHOR.x, SLING_ANCHOR.y, SLING_ANCHOR.z, canvas);
  const anchorX = sp ? sp.sx : W * 0.5;
  const anchorY = sp ? sp.sy : H * 0.72;

  // Fork tip positions in screen (relative to anchor)
  const forkSpread = W * 0.075;
  const forkLiftY  = H * 0.055;
  const leftTipX   = anchorX - forkSpread;
  const leftTipY   = anchorY - forkLiftY;
  const rightTipX  = anchorX + forkSpread;
  const rightTipY  = anchorY - forkLiftY;

  // Handle bottom (off-screen bottom)
  const handleX = anchorX;
  const handleY = H + 60;

  // ---- Handle / post ----
  const handleW = W * 0.045;
  const postGrad = ctx.createLinearGradient(handleX - handleW/2, 0, handleX + handleW/2, 0);
  postGrad.addColorStop(0,'#3a1a08');
  postGrad.addColorStop(0.4,'#7a3a10');
  postGrad.addColorStop(1,'#3a1a08');
  ctx.fillStyle  = postGrad;
  ctx.beginPath();
  ctx.moveTo(handleX - handleW/2, handleY);
  ctx.lineTo(handleX + handleW/2, handleY);
  ctx.lineTo(anchorX + handleW*0.35, anchorY + 10);
  ctx.lineTo(anchorX - handleW*0.35, anchorY + 10);
  ctx.closePath();
  ctx.fill();

  // Wood grain
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth   = 1.2;
  for (let i = 0; i < 4; i++) {
    const gx = handleX - handleW/2 + i * (handleW/4);
    ctx.beginPath();
    ctx.moveTo(gx, handleY);
    ctx.lineTo(anchorX - handleW*0.35 + i*(handleW*0.7/4), anchorY+10);
    ctx.stroke();
  }

  // ---- Left fork arm ----
  const armW = W * 0.022;
  const forkGradL = ctx.createLinearGradient(leftTipX, leftTipY, anchorX, anchorY);
  forkGradL.addColorStop(0,'#5a2800'); forkGradL.addColorStop(1,'#8b4513');
  ctx.strokeStyle = forkGradL;
  ctx.lineWidth   = armW;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(anchorX - handleW*0.2, anchorY + 5);
  ctx.quadraticCurveTo(anchorX - forkSpread*0.5, anchorY - forkLiftY*0.3, leftTipX, leftTipY);
  ctx.stroke();

  // ---- Right fork arm ----
  const forkGradR = ctx.createLinearGradient(rightTipX, rightTipY, anchorX, anchorY);
  forkGradR.addColorStop(0,'#5a2800'); forkGradR.addColorStop(1,'#8b4513');
  ctx.strokeStyle = forkGradR;
  ctx.beginPath();
  ctx.moveTo(anchorX + handleW*0.2, anchorY + 5);
  ctx.quadraticCurveTo(anchorX + forkSpread*0.5, anchorY - forkLiftY*0.3, rightTipX, rightTipY);
  ctx.stroke();

  // Fork tip caps
  ctx.fillStyle = '#3a1208';
  ctx.beginPath(); ctx.arc(leftTipX,  leftTipY,  armW*0.55, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(rightTipX, rightTipY, armW*0.55, 0, Math.PI*2); ctx.fill();

  // ---- Ball / drag position ----
  const ballR  = W * 0.03;
  const ballX  = isDragging ? anchorX + dragOffX : anchorX;
  const ballY  = isDragging ? anchorY + dragOffY : anchorY;

  if (isDragging || (!gameState.launched && gameState.balls > 0 && !gameState.done)) {
    // Rubber bands
    const bandColor = isDragging ? '#c08010' : '#a07030';
    const bandW     = W * 0.006;
    ctx.strokeStyle = bandColor;
    ctx.lineWidth   = bandW;
    ctx.lineCap     = 'round';

    // Left band
    ctx.beginPath();
    ctx.moveTo(leftTipX, leftTipY);
    ctx.quadraticCurveTo(
      (leftTipX + ballX)/2 + 3, (leftTipY + ballY)/2 + (isDragging ? 8 : 2),
      ballX, ballY
    );
    ctx.stroke();

    // Right band
    ctx.beginPath();
    ctx.moveTo(rightTipX, rightTipY);
    ctx.quadraticCurveTo(
      (rightTipX + ballX)/2 - 3, (rightTipY + ballY)/2 + (isDragging ? 8 : 2),
      ballX, ballY
    );
    ctx.stroke();

    // Stretch glow when dragging
    if (isDragging) {
      const stretch = Math.hypot(dragOffX, dragOffY) / MAX_PULL;
      if (stretch > 0.05) {
        ctx.strokeStyle = `rgba(247,180,50,${stretch*0.35})`;
        ctx.lineWidth   = bandW * 2.5;
        ctx.beginPath();
        ctx.moveTo(leftTipX, leftTipY);
        ctx.lineTo(ballX, ballY);
        ctx.lineTo(rightTipX, rightTipY);
        ctx.stroke();

        // Trajectory preview dots
        drawTrajectoryDots(ctx, canvas, ballX, ballY, anchorX, anchorY);
      }
    }

    // Draw ball
    drawBall3D(ctx, ballX, ballY, ballR);

    // Idle hint
    if (!isDragging && gameState.frameCount % 90 < 50) {
      ctx.fillStyle  = 'rgba(247,201,72,0.8)';
      ctx.font       = `bold ${W*0.033}px Boogaloo, cursive`;
      ctx.textAlign  = 'center';
      ctx.fillText('↙ Çek & Bırak!', anchorX, ballY - ballR - 14);
      ctx.textAlign  = 'left';
    }
  }

  // Reset lineCap
  ctx.lineCap = 'butt';
}

function drawTrajectoryDots(ctx, canvas, ballX, ballY, anchorX, anchorY) {
  // pullDir: direction of pull (from anchor to ball)
  const dx    = ballX - anchorX;
  const dy    = ballY - anchorY;
  const len   = Math.hypot(dx, dy);
  const t     = len / MAX_PULL;
  const speed = (6 + gameState.ph * 0.5) * t;

  // Launch direction is opposite the pull
  let lvx = -dx / len * speed * 1.1;
  let lvy = -dy / len * speed * 0.85;
  const gravity = 0.55;

  let px = ballX, py = ballY;
  ctx.fillStyle = 'rgba(247,201,72,0.55)';
  for (let i = 0; i < 24; i++) {
    lvy += gravity;
    px  += lvx * 0.45;
    py  += lvy * 0.45;
    if (py > canvas.height + 20 || px < -50 || px > canvas.width + 50) break;
    const r = Math.max(1.5, 3 - i * 0.1);
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
  }
}

function drawCrosshair(ctx, canvas) {
  const cx   = canvas.width  * 0.5;
  const cy   = canvas.height * 0.42;  // slightly above center (looking toward cups)
  const size = canvas.width  * 0.019;
  const gap  = size * 0.28;

  ctx.strokeStyle = 'rgba(247,220,72,0.85)';
  ctx.lineWidth   = 1.8;
  ctx.lineCap     = 'round';

  // Horizontal
  ctx.beginPath(); ctx.moveTo(cx-size, cy); ctx.lineTo(cx-gap, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+gap,  cy); ctx.lineTo(cx+size, cy); ctx.stroke();
  // Vertical
  ctx.beginPath(); ctx.moveTo(cx, cy-size); ctx.lineTo(cx, cy-gap); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy+gap);  ctx.lineTo(cx, cy+size); ctx.stroke();
  // Dot
  ctx.fillStyle = 'rgba(247,220,72,0.9)';
  ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, Math.PI*2); ctx.fill();

  ctx.lineCap = 'butt';
}

function updateGameHUD() {
  if (!gameState) return;
  const gs = gameState;
  document.getElementById('g-lives').textContent  = gs.lives;
  document.getElementById('g-points').textContent = gs.points.toLocaleString('tr-TR');
  document.getElementById('g-level').textContent  = gs.level;
  document.getElementById('g-balls').textContent  = gs.balls;
  const phEl = document.getElementById('g-ph');
  if (phEl) phEl.textContent = 'pH ' + gs.ph.toFixed(1);
}

// ============================================================
//  WINDOW RESIZE
// ============================================================
window.addEventListener('resize', () => {
  if (document.getElementById('menu-screen')?.classList.contains('active')) initMenuCanvas();
  if (gameState && !gameState.done) {
    const canvas = gameState.canvas;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
});

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('SapanKing v2.0 yüklendi 🏹');
});
