'use strict';

// ═══════════════════════════════════════════════════════════════
//  MadenOyunu — Firebase Client SDK (GitHub Pages compatible)
// ═══════════════════════════════════════════════════════════════
firebase.initializeApp({
  apiKey: 'AIzaSyDuKLuoePZ6mNsKhQBGXumxMwF0UKTQvc8',
  authDomain: 'oyun-75056.firebaseapp.com',
  databaseURL: 'https://oyun-75056-default-rtdb.firebaseio.com',
  projectId: 'oyun-75056',
  storageBucket: 'oyun-75056.firebasestorage.app',
  messagingSenderId: '980660244755',
  appId: '1:980660244755:web:47889c4b6637ab05cdcae6'
});
const fbAuth = firebase.auth();
const fbDb   = firebase.database();

// ─── Firebase Helpers ──────────────────────────────────────────
async function fbGetUser(uid) {
  const s = await fbDb.ref(`users/${uid}`).once('value');
  return s.val();
}
async function fbUpdateUser(uid, updates) {
  await fbDb.ref(`users/${uid}`).update(updates);
}
async function fbUpdateLeaderboard(uid, username, totalPH, league) {
  await fbDb.ref(`leaderboard/${uid}`).set({ username, totalPH, league, updatedAt: Date.now() });
}
function fbCalcLeague(ph) {
  if (ph >= 2000) return 'usta';
  if (ph >= 500)  return 'amator';
  return 'cirak';
}
function fbCalcPH(equipment) {
  // PH values indexed by item id
  const PH=[0,2,3,2,3,4,2,3,4,5,5,6,6,7,7,8,8,9,9,10,10,4,5,6,8,10,12,14,15,16,17,18,19,20,20,21,22,22,23,24,25,25,26,27,28,28,29,29,30,13,30,35,38,40,42,44,46,48,50,52,54,56,58,60,62,65,67,68,70,72,74,76,33,78,79,80,90,95,100,105,110,115,120,125,130,135,140,150,155,160,165,168,171,174,177,180,185,188,192,196,200];
  let total = 0;
  for (const [id, cnt] of Object.entries(equipment || {})) {
    total += (PH[parseInt(id)] || 0) * cnt;
  }
  return total;
}
function fbGenerateReward(boxId) {
  const r = Math.random() * 100;
  const pick = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
  const pickArr = (arr) => arr[Math.floor(Math.random()*arr.length)];
  const common=Array.from({length:25},(_,i)=>i+1),uncommon=Array.from({length:25},(_,i)=>i+26);
  const rare=Array.from({length:25},(_,i)=>i+51),epic=Array.from({length:12},(_,i)=>i+76);
  const legendary=Array.from({length:13},(_,i)=>i+88);
  switch(boxId){
    case'komur': if(r<70)return{type:'kmr',amount:pick(100,500)}; if(r<90)return{type:'banknot',amount:pick(1,5)}; return{type:'equipment',itemId:pickArr(common)};
    case'bronz': if(r<40)return{type:'kmr',amount:pick(500,2000)}; if(r<75)return{type:'banknot',amount:pick(5,20)}; if(r<95)return{type:'equipment',itemId:pickArr(common)}; return{type:'equipment',itemId:pickArr(uncommon)};
    case'gumus': if(r<35)return{type:'banknot',amount:pick(20,100)}; if(r<70)return{type:'equipment',itemId:pickArr(uncommon)}; if(r<95)return{type:'equipment',itemId:pickArr(rare)}; return{type:'equipment',itemId:pickArr(epic)};
    case'altin': if(r<20)return{type:'banknot',amount:pick(100,500)}; if(r<60)return{type:'equipment',itemId:pickArr(rare)}; if(r<90)return{type:'equipment',itemId:pickArr(epic)}; return{type:'equipment',itemId:pickArr(legendary)};
    default: return{type:'kmr',amount:100};
  }
}

// ─── Equipment Data (100 items) ────────────────────────────────
const EQUIPMENT = [
  // ── Common (1-25) ──────────────────────────
  {id:1,  name:'Eski Madenci Şapkası', ph:2,  rarity:'common',    emoji:'⛑️'},
  {id:2,  name:'Tahta Kazma',          ph:3,  rarity:'common',    emoji:'⛏️'},
  {id:3,  name:'Bez Eldiven',          ph:2,  rarity:'common',    emoji:'🧤'},
  {id:4,  name:'Lastik Çizme',         ph:3,  rarity:'common',    emoji:'👢'},
  {id:5,  name:'Pamuk Yelek',          ph:4,  rarity:'common',    emoji:'🦺'},
  {id:6,  name:'Eski Lamba',           ph:2,  rarity:'common',    emoji:'🔦'},
  {id:7,  name:'Küçük Çanta',          ph:3,  rarity:'common',    emoji:'🎒'},
  {id:8,  name:'Pas Kemeri',           ph:4,  rarity:'common',    emoji:'🧰'},
  {id:9,  name:'Demir Kazma',          ph:5,  rarity:'common',    emoji:'⛏️'},
  {id:10, name:'Hafif Miğfer',         ph:5,  rarity:'common',    emoji:'⛑️'},
  {id:11, name:'Deri Eldiven',         ph:6,  rarity:'common',    emoji:'🧤'},
  {id:12, name:'Madenci Feneri',       ph:6,  rarity:'common',    emoji:'🏮'},
  {id:13, name:'Küçük Kazma',          ph:7,  rarity:'common',    emoji:'⛏️'},
  {id:14, name:'Kauçuk Çizme',         ph:7,  rarity:'common',    emoji:'👢'},
  {id:15, name:'Çelik Miğfer',         ph:8,  rarity:'common',    emoji:'⛑️'},
  {id:16, name:'Deri Çanta',           ph:8,  rarity:'common',    emoji:'🎒'},
  {id:17, name:'Keten Gömlek',         ph:9,  rarity:'common',    emoji:'👕'},
  {id:18, name:'Eski Yüzük',           ph:9,  rarity:'common',    emoji:'💍'},
  {id:19, name:'Tahta Kürek',          ph:10, rarity:'common',    emoji:'🪣'},
  {id:20, name:'Madenci Pantolonu',    ph:10, rarity:'common',    emoji:'👖'},
  {id:21, name:'Basit Baret',          ph:4,  rarity:'common',    emoji:'⛑️'},
  {id:22, name:'Tel Kanca',            ph:5,  rarity:'common',    emoji:'🔩'},
  {id:23, name:'Cam Gözlük',           ph:6,  rarity:'common',    emoji:'🥽'},
  {id:24, name:'Toz Maskesi',          ph:8,  rarity:'common',    emoji:'😷'},
  {id:25, name:'Madenci Sözleşmesi',   ph:10, rarity:'common',    emoji:'📜'},
  // ── Uncommon (26-50) ───────────────────────
  {id:26, name:'Bronz Kazma',          ph:12, rarity:'uncommon',  emoji:'⛏️'},
  {id:27, name:'Güçlenmiş Miğfer',     ph:14, rarity:'uncommon',  emoji:'⛑️'},
  {id:28, name:'Madenci Çizmeleri',    ph:15, rarity:'uncommon',  emoji:'👢'},
  {id:29, name:'Kalın Eldiven',        ph:16, rarity:'uncommon',  emoji:'🧤'},
  {id:30, name:'Çelik Kürek',          ph:17, rarity:'uncommon',  emoji:'🪣'},
  {id:31, name:'LED Kafa Lambası',     ph:18, rarity:'uncommon',  emoji:'🔦'},
  {id:32, name:'Madenci Kalkanı',      ph:19, rarity:'uncommon',  emoji:'🛡️'},
  {id:33, name:'Deri Yelek',           ph:20, rarity:'uncommon',  emoji:'🦺'},
  {id:34, name:'Bronz Yüzük',          ph:20, rarity:'uncommon',  emoji:'💍'},
  {id:35, name:'Madenci Kemeri',       ph:21, rarity:'uncommon',  emoji:'🧰'},
  {id:36, name:'Filtreli Maske',       ph:22, rarity:'uncommon',  emoji:'😷'},
  {id:37, name:'Büyük Sırt Çantası',   ph:22, rarity:'uncommon',  emoji:'🎒'},
  {id:38, name:'Gümüş Kemeri',         ph:23, rarity:'uncommon',  emoji:'🧰'},
  {id:39, name:'Titanyum Gözlük',      ph:24, rarity:'uncommon',  emoji:'🥽'},
  {id:40, name:'Çelik Kazma',          ph:25, rarity:'uncommon',  emoji:'⛏️'},
  {id:41, name:'Sağlam Pantolon',      ph:25, rarity:'uncommon',  emoji:'👖'},
  {id:42, name:'Madenci Tılsımı',      ph:26, rarity:'uncommon',  emoji:'🪬'},
  {id:43, name:'Bronz Miğfer',         ph:27, rarity:'uncommon',  emoji:'⛑️'},
  {id:44, name:'Feneri Pro',           ph:28, rarity:'uncommon',  emoji:'🏮'},
  {id:45, name:'Güçlü Çizme',          ph:28, rarity:'uncommon',  emoji:'👢'},
  {id:46, name:'Madenci Gömleği',      ph:29, rarity:'uncommon',  emoji:'👕'},
  {id:47, name:'İş Elbisesi',          ph:29, rarity:'uncommon',  emoji:'🦺'},
  {id:48, name:'Madenci Kolyesi',      ph:30, rarity:'uncommon',  emoji:'📿'},
  {id:49, name:'Madenci Tokası',       ph:13, rarity:'uncommon',  emoji:'🧰'},
  {id:50, name:'Maden Haritası',       ph:30, rarity:'uncommon',  emoji:'🗺️'},
  // ── Rare (51-75) ───────────────────────────
  {id:51, name:'Gümüş Kazma',          ph:35, rarity:'rare',      emoji:'⛏️'},
  {id:52, name:'Gümüş Miğfer',         ph:38, rarity:'rare',      emoji:'⛑️'},
  {id:53, name:'Çelik Eldiven',        ph:40, rarity:'rare',      emoji:'🧤'},
  {id:54, name:'Madenci Zırhı',        ph:42, rarity:'rare',      emoji:'🛡️'},
  {id:55, name:'Güçlü Bot',            ph:44, rarity:'rare',      emoji:'👢'},
  {id:56, name:'Ultra LED Lamba',      ph:46, rarity:'rare',      emoji:'🔦'},
  {id:57, name:'Gümüş Yüzük',          ph:48, rarity:'rare',      emoji:'💍'},
  {id:58, name:'Madenci Umudu',        ph:50, rarity:'rare',      emoji:'⭐'},
  {id:59, name:'Gümüş Kürek',          ph:52, rarity:'rare',      emoji:'🪣'},
  {id:60, name:'Dağ Keçisi Çizmesi',   ph:54, rarity:'rare',      emoji:'👢'},
  {id:61, name:'Kripto Kask',          ph:56, rarity:'rare',      emoji:'⛑️'},
  {id:62, name:'Güncelleme Paketi',    ph:58, rarity:'rare',      emoji:'📦'},
  {id:63, name:'Üstat Kemeri',         ph:60, rarity:'rare',      emoji:'🧰'},
  {id:64, name:'Maden Dedektörü',      ph:62, rarity:'rare',      emoji:'📡'},
  {id:65, name:'Titanyum Kazma',       ph:65, rarity:'rare',      emoji:'⛏️'},
  {id:66, name:'Güçlü Eldiven',        ph:67, rarity:'rare',      emoji:'🧤'},
  {id:67, name:'Madenci Güç Taşı',     ph:68, rarity:'rare',      emoji:'💎'},
  {id:68, name:'Profesyonel Gözlük',   ph:70, rarity:'rare',      emoji:'🥽'},
  {id:69, name:'Güçlü Sırt Çantası',   ph:72, rarity:'rare',      emoji:'🎒'},
  {id:70, name:'Usta Kolyesi',         ph:74, rarity:'rare',      emoji:'📿'},
  {id:71, name:'Karbür Kazma',         ph:76, rarity:'rare',      emoji:'⛏️'},
  {id:72, name:'Büyü Taşı',            ph:33, rarity:'rare',      emoji:'✨'},
  {id:73, name:'Gece Görüş Kaskı',     ph:78, rarity:'rare',      emoji:'⛑️'},
  {id:74, name:'Gelişmiş Maske',       ph:79, rarity:'rare',      emoji:'😷'},
  {id:75, name:'Madenci Baronu',       ph:80, rarity:'rare',      emoji:'👑'},
  // ── Epic (76-87) ───────────────────────────
  {id:76, name:'Altın Kazma',          ph:90,  rarity:'epic',     emoji:'⛏️'},
  {id:77, name:'Altın Miğfer',         ph:95,  rarity:'epic',     emoji:'⛑️'},
  {id:78, name:'Altın Zırh',           ph:100, rarity:'epic',     emoji:'🛡️'},
  {id:79, name:'Altın Eldiven',        ph:105, rarity:'epic',     emoji:'🧤'},
  {id:80, name:'Altın Çizme',          ph:110, rarity:'epic',     emoji:'👢'},
  {id:81, name:'Altın Lamba',          ph:115, rarity:'epic',     emoji:'🏮'},
  {id:82, name:'Altın Yüzük',          ph:120, rarity:'epic',     emoji:'💍'},
  {id:83, name:'Altın Kolye',          ph:125, rarity:'epic',     emoji:'📿'},
  {id:84, name:'Elmas Çekirdeği',      ph:130, rarity:'epic',     emoji:'💠'},
  {id:85, name:'Efsane Kemer',         ph:135, rarity:'epic',     emoji:'🧰'},
  {id:86, name:'Güç Kristali',         ph:140, rarity:'epic',     emoji:'🔮'},
  {id:87, name:'Ejderha Gözlüğü',      ph:150, rarity:'epic',     emoji:'🥽'},
  // ── Legendary (88-100) ─────────────────────
  {id:88,  name:'Elmas Kazma',         ph:155, rarity:'legendary', emoji:'💎'},
  {id:89,  name:'Efsanevi Miğfer',     ph:160, rarity:'legendary', emoji:'👑'},
  {id:90,  name:'Ejderha Zırhı',       ph:165, rarity:'legendary', emoji:'🐉'},
  {id:91,  name:'Ejderha Eldiveni',    ph:168, rarity:'legendary', emoji:'🐉'},
  {id:92,  name:'Ejderha Çizmesi',     ph:171, rarity:'legendary', emoji:'🐉'},
  {id:93,  name:'Güneş Lambası',       ph:174, rarity:'legendary', emoji:'☀️'},
  {id:94,  name:'Efsane Yüzük',        ph:177, rarity:'legendary', emoji:'💍'},
  {id:95,  name:'Tanrı Kolyesi',       ph:180, rarity:'legendary', emoji:'⚡'},
  {id:96,  name:'Kömür Tanrısı',       ph:185, rarity:'legendary', emoji:'🌟'},
  {id:97,  name:'Maden Efsanesi',      ph:188, rarity:'legendary', emoji:'🏆'},
  {id:98,  name:'Sonsuzluk Taşı',      ph:192, rarity:'legendary', emoji:'♾️'},
  {id:99,  name:'Büyük Madenci Tacı',  ph:196, rarity:'legendary', emoji:'👑'},
  {id:100, name:'Kömür İmparatoru',    ph:200, rarity:'legendary', emoji:'🔱'},
];
const EQ_MAP = {};
EQUIPMENT.forEach(e => EQ_MAP[e.id] = e);

const MINERS_DATA = {
  mehmet_dayi: { name:'Mehmet Dayı', emoji:'👨‍🦳', price:10000,  kmrPerHour:100,  multiplier:2, desc:'Eski usta, yavaş ama güvenilir.' },
  semsi_dayi:  { name:'Şemsi Dayı',  emoji:'👴',   price:20000,  kmrPerHour:250,  multiplier:4, desc:'Deneyimli madenci, sağ eli güçlü.' },
  kubra_teyze: { name:'Kübra Teyze', emoji:'👩‍🦳', price:50000,  kmrPerHour:750,  multiplier:6, desc:'Keskin gözlü, altın burun.' },
  beyza_nene:  { name:'Beyza Nene',  emoji:'👵',   price:100000, kmrPerHour:2000, multiplier:8, desc:'Efsanevi maden ustası.' },
  ali_usta:    { name:'Ali Usta',    emoji:'🧑‍🏭', price:250000, kmrPerHour:5000, multiplier:10,desc:'Efsane. Onun gücüne erişilemez.' },
};
const MINER_ORDER = ['mehmet_dayi','semsi_dayi','kubra_teyze','beyza_nene','ali_usta'];

const BOXES_DATA = {
  komur: { name:'Kömür Kutusu', emoji:'📦', price:500, currency:'kmr', rarity:1,
           odds:'🪨 70% KMR · 💵 20% Banknot · 🗡️ 10% Eşya (Common)' },
  bronz: { name:'Bronz Sandık', emoji:'🟫', price:2000, currency:'kmr', rarity:2,
           odds:'🪨 40% KMR · 💵 35% Banknot · 🗡️ 20% Common · ✨ 5% Uncommon' },
  gumus: { name:'Gümüş Sandık', emoji:'⬜', price:5000, currency:'kmr', rarity:3,
           odds:'💵 35% Banknot · ✨ 35% Uncommon · 🔵 25% Rare · 🟣 5% Epic' },
  altin: { name:'Altın Sandık', emoji:'🟨', price:15000, currency:'kmr', rarity:4,
           odds:'💵 20% Banknot · 🔵 40% Rare · 🟣 30% Epic · 🟠 10% Legendary' },
};

const LEAGUES = {
  cirak:  { name:'Çırak',  emoji:'🪨', min:0,    max:499  },
  amator: { name:'Amatör', emoji:'⚒️', min:500,  max:1999 },
  usta:   { name:'Usta',   emoji:'🏅', min:2000, max:Infinity },
};
const RARITY_COLOR = { common:'var(--common)', uncommon:'var(--uncommon)', rare:'var(--rare)', epic:'var(--epic)', legendary:'var(--legendary)' };
const RARITY_LABEL = { common:'⚪ Common', uncommon:'🟢 Uncommon', rare:'🔵 Rare', epic:'🟣 Epic', legendary:'🟠 Legendary' };

// ─── State ─────────────────────────────────────────────────────
let state = {
  uid:   localStorage.getItem('maden_uid') || null,
  user:  null,
  currentView: 'cave',
  pendingKmr:  0,
  lastCalcTime: Date.now(),
};

// ─── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  spawnParticles();
  buildStalactites();
  if (window.Telegram?.WebApp) { Telegram.WebApp.ready(); Telegram.WebApp.expand(); }

  fbAuth.onAuthStateChanged(async (fbUser) => {
    if (fbUser) {
      state.uid  = fbUser.uid;
      state.user = await fbGetUser(fbUser.uid);
      if (!state.user) { await fbAuth.signOut(); hideLoading(); show('page-auth'); return; }
      localStorage.setItem('maden_uid', fbUser.uid);
      showGame();
    } else {
      localStorage.removeItem('maden_uid');
      hideLoading();
      show('page-auth');
    }
  });
});

// ─── Auth ──────────────────────────────────────────────────────
function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab==='login');
  document.getElementById('tab-register').classList.toggle('active', tab==='register');
  document.getElementById('form-login').classList.toggle('hidden', tab!=='login');
  document.getElementById('form-register').classList.toggle('hidden', tab!=='register');
  document.getElementById('login-error').innerHTML = '';
  document.getElementById('register-error').innerHTML = '';
}

async function doLogin() {
  const username = qs('#login-username').value.trim().toLowerCase();
  const password = qs('#login-password').value;
  const errEl = qs('#login-error');
  errEl.innerHTML = '';
  if (!username || !password) { showAuthError(errEl, 'Tüm alanları doldurun'); return; }
  setBtnLoading('login-btn', true);
  try {
    // username → email mapping stored in RTDB
    const snap = await fbDb.ref(`usernames/${username}`).once('value');
    if (!snap.exists()) throw new Error('Kullanıcı adı veya şifre hatalı');
    const email = snap.val(); // stored as email
    await fbAuth.signInWithEmailAndPassword(email, password);
    // streak bonus
    const uid = fbAuth.currentUser.uid;
    const user = await fbGetUser(uid);
    const now = Date.now();
    const lastLogin = user?.stats?.lastLogin || 0;
    const daysSince = Math.floor((now - lastLogin) / 86400000);
    let streakBonus = 0, newStreak = user?.stats?.loginStreak || 1;
    if (daysSince === 1) { newStreak++; streakBonus = Math.min(newStreak * 100, 1000); }
    else if (daysSince > 1) { newStreak = 1; streakBonus = 100; }
    const upd = { 'stats/lastLogin': now, 'stats/loginStreak': newStreak, 'lastActive': now };
    if (streakBonus > 0) upd['balance/kmr'] = (user?.balance?.kmr || 0) + streakBonus;
    await fbUpdateUser(uid, upd);
    if (streakBonus > 0) state.pendingStreak = { bonus: streakBonus, streak: newStreak };
  } catch(e) { showAuthError(errEl, e.message.includes('auth')||e.message.includes('password')||e.message.includes('user')?'Kullanıcı adı veya şifre hatalı':e.message); }
  finally    { setBtnLoading('login-btn', false); }
}

async function doRegister() {
  const username  = qs('#reg-username').value.trim();
  const password  = qs('#reg-password').value;
  const password2 = qs('#reg-password2').value;
  const errEl = qs('#register-error');
  errEl.innerHTML = '';
  if (!username || !password || !password2) { showAuthError(errEl, 'Tüm alanları doldurun'); return; }
  if (username.length < 3 || username.length > 20) { showAuthError(errEl, 'Kullanıcı adı 3-20 karakter olmalı'); return; }
  if (password !== password2)  { showAuthError(errEl, 'Şifreler eşleşmiyor'); return; }
  if (password.length < 8)     { showAuthError(errEl, 'Şifre en az 8 karakter olmalı'); return; }
  if (!/[A-Z]/.test(password)) { showAuthError(errEl, 'Şifre en az 1 büyük harf içermeli'); return; }
  if (!/[0-9]/.test(password)) { showAuthError(errEl, 'Şifre en az 1 rakam içermeli'); return; }
  setBtnLoading('register-btn', true);
  try {
    const ukey = username.toLowerCase();
    const existing = await fbDb.ref(`usernames/${ukey}`).once('value');
    if (existing.exists()) throw new Error('Bu kullanıcı adı alınmış');
    const email = `${ukey}@madengame.app`;
    const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    const now = Date.now();
    const userData = {
      uid, username,
      createdAt: now, lastActive: now,
      balance: { kmr: 500, banknot: 0, cekip: 0 },
      miners: {}, equipment: {},
      stats: { totalPH: 0, league: 'cirak', totalMined: 0, loginStreak: 1, lastLogin: now, lastCollect: now },
      settings: { notifications: true, sound: true, theme: 'dark' }
    };
    await fbDb.ref(`users/${uid}`).set(userData);
    await fbDb.ref(`usernames/${ukey}`).set(email);
    await fbUpdateLeaderboard(uid, username, 0, 'cirak');
  } catch(e) { showAuthError(errEl, e.message); }
  finally    { setBtnLoading('register-btn', false); }
}

async function doLogout() {
  await fbAuth.signOut();
  state.uid = null; state.user = null;
  closeModal('profile'); closeModal('settings');
  hide('page-game'); show('page-auth');
  toast('Çıkış yapıldı', 'info');
}

function showAuthError(el, msg) { el.innerHTML = `<div class="error-msg">${msg}</div>`; }

// ─── Show Game ─────────────────────────────────────────────────
function showGame() {
  hideLoading();
  hide('page-auth');
  show('page-game');
  renderAll();
  startMiningLoop();

  if (state.pendingStreak) {
    const { bonus, streak } = state.pendingStreak;
    const banner = qs('#streak-banner');
    qs('#streak-title').textContent = `🔥 ${streak}. Gün Serisi!`;
    qs('#streak-desc').textContent  = `+${fmtKmr(bonus)} KMR kazandın`;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 5000);
    state.pendingStreak = null;
  }
}

// ─── Render ────────────────────────────────────────────────────
function renderAll() {
  renderTopBar();
  renderCaveMiners();
  renderMineView();
  renderShop();
}

function renderTopBar() {
  const u = state.user;
  if (!u) return;
  const league = u.stats?.league || 'cirak';
  qs('#league-badge').textContent = `${LEAGUES[league].emoji} ${LEAGUES[league].name}`;
  qs('#bal-kmr').textContent      = fmtKmr(Math.floor((u.balance?.kmr||0) + state.pendingKmr));
  qs('#bal-banknot').textContent  = fmtKmr(u.balance?.banknot || 0);
  qs('#bal-cekip').textContent    = (u.balance?.cekip || 0).toFixed(3);
}

function renderCaveMiners() {
  const container = qs('#cave-miners');
  const hint = qs('#no-miner-hint');
  const miners = Object.keys(state.user?.miners || {}).filter(k => state.user.miners[k]);
  container.innerHTML = '';
  if (miners.length === 0) { hint.classList.remove('hidden'); return; }
  hint.classList.add('hidden');
  miners.forEach(mid => {
    const m = MINERS_DATA[mid]; if (!m) return;
    const card = el('div', 'cave-miner-card');
    card.innerHTML = `<span class="miner-emoji">${m.emoji}</span><div class="miner-name">${m.name}</div><div class="miner-rate">⛏️ ${fmtKmr(m.kmrPerHour)}/sa</div>`;
    container.appendChild(card);
  });
}

function renderMineView() {
  const u = state.user; if (!u) return;
  const miners = Object.keys(u.miners||{}).filter(k=>u.miners[k]);
  const totalPH = u.stats?.totalPH || 0;

  // Miners digging animation
  const minersEl = qs('#mine-miners');
  minersEl.innerHTML = '';
  if (miners.length === 0) {
    minersEl.innerHTML = '<div class="empty-state"><div class="empty-icon">⛏️</div><p>Mağazadan madenci satın al!</p></div>';
  } else {
    miners.forEach(mid => {
      const m = MINERS_DATA[mid]; if (!m) return;
      const bonus = 1 + (totalPH * m.multiplier / 1000);
      const rate  = Math.floor(m.kmrPerHour * bonus);
      const row = el('div', 'mine-miner-row');
      row.innerHTML = `<div class="mine-miner-anim">${m.emoji}</div>
        <div class="mine-miner-info">
          <div class="mine-miner-name">${m.name}</div>
          <div class="mine-miner-rate">⛏️ ${fmtKmr(rate)} KMR/saat <span style="color:var(--text3);font-size:11px">(${m.multiplier}x PH)</span></div>
        </div>`;
      minersEl.appendChild(row);
    });
  }

  // Stats
  let kmrPerHour = calcKmrPerHour();
  qs('#hourly-rate').textContent  = fmtKmr(Math.floor(kmrPerHour));
  qs('#pending-kmr').textContent  = fmtKmr(Math.floor(state.pendingKmr));
  qs('#total-ph').textContent     = totalPH;
  qs('#total-mined').textContent  = fmtKmr(u.stats?.totalMined || 0);

  // PH bar (max 2000 for bar display)
  const pct = Math.min(totalPH / 2000 * 100, 100);
  qs('#ph-bar').style.width = pct + '%';

  // Equipment shelves
  renderEquipmentShelves();
}

function renderEquipmentShelves() {
  const u = state.user; if (!u) return;
  const eq = u.equipment || {};
  const container = qs('#equipment-shelves');
  container.innerHTML = '';
  const owned = Object.entries(eq).filter(([,c])=>c>0);
  qs('#shelf-count').textContent = `(${owned.length})`;

  if (owned.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🗄️</div><p>Henüz eşyan yok. Kutulardan eşya kazan!</p></div>';
    return;
  }

  const byRarity = { legendary:[], epic:[], rare:[], uncommon:[], common:[] };
  owned.forEach(([id, cnt]) => {
    const item = EQ_MAP[parseInt(id)]; if (!item) return;
    byRarity[item.rarity].push({ ...item, count: cnt });
  });

  Object.entries(byRarity).forEach(([rarity, items]) => {
    if (items.length === 0) return;
    const shelf = el('div','shelf');
    shelf.innerHTML = `<div class="shelf-label" style="color:${RARITY_COLOR[rarity]}">${RARITY_LABEL[rarity]}</div><div class="shelf-items" id="shelf-${rarity}"></div>`;
    container.appendChild(shelf);
    const shelfItems = shelf.querySelector('.shelf-items');
    items.forEach(item => {
      const itemEl = el('div', `shelf-item rarity-${item.rarity}`);
      itemEl.style.animationDelay = Math.random() * 0.3 + 's';
      itemEl.innerHTML = `${item.emoji}<span class="item-count">${item.count}</span>`;
      itemEl.addEventListener('mouseenter', (e) => showTooltip(e, item));
      itemEl.addEventListener('mouseleave', hideTooltip);
      itemEl.addEventListener('click', () => toast(`${item.emoji} ${item.name} — +${item.ph} PH`, 'info'));
      shelfItems.appendChild(itemEl);
    });
  });
}

function renderShop() {
  renderShopMiners();
  renderShopBoxes();
}

function renderShopMiners() {
  const container = qs('#shop-miners');
  container.innerHTML = '';
  const owned = state.user?.miners || {};
  MINER_ORDER.forEach(mid => {
    const m = MINERS_DATA[mid]; if (!m) return;
    const isOwned = !!owned[mid];
    const card = el('div', `miner-shop-card ${isOwned ? 'owned' : ''}`);
    card.innerHTML = `
      <div class="miner-shop-emoji">${m.emoji}</div>
      <div class="miner-shop-info">
        <div class="miner-shop-name">${m.name}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:2px">${m.desc}</div>
        <div class="miner-shop-stats">
          <span class="miner-stat-pill gold-pill">⛏️ ${fmtKmr(m.kmrPerHour)}/sa</span>
          <span class="miner-stat-pill">💪 ${m.multiplier}x PH</span>
          <span class="miner-stat-pill">💵 ${fmtKmr(m.price)} BN</span>
        </div>
      </div>
      <div class="miner-shop-action">
        ${isOwned
          ? '<div class="owned-badge">✅ Sahipsin</div>'
          : `<button class="btn btn-gold btn-sm" onclick="buyMiner('${mid}')">Satın Al</button>`}
      </div>`;
    container.appendChild(card);
  });
}

function renderShopBoxes() {
  const container = qs('#shop-boxes');
  container.innerHTML = '<div class="box-cards"></div>';
  const grid = container.querySelector('.box-cards');
  Object.entries(BOXES_DATA).forEach(([bid, b]) => {
    const card = el('div', `box-card box-rarity-${b.rarity}`);
    card.innerHTML = `
      <div class="box-icon">${b.emoji}</div>
      <div class="box-name">${b.name}</div>
      <div class="box-price">💵 ${fmtKmr(b.price)} ${b.currency.toUpperCase()}</div>
      <div class="box-odds">${b.odds}</div>`;
    card.onclick = () => openBox(bid);
    grid.appendChild(card);
  });
}

// ─── View Switching ────────────────────────────────────────────
function showView(view) {
  state.currentView = view;
  if (view === 'cave') {
    hide('view-mine'); show('view-cave');
    qs('#nav-mine').classList.add('active');
  } else if (view === 'mine') {
    hide('view-cave'); show('view-mine');
    renderMineView();
  }
}

function enterMine() {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    Telegram.WebApp.HapticFeedback.impactOccurred('medium');
  }
  showView('mine');
}

// ─── Mining Loop ───────────────────────────────────────────────
function calcKmrPerHour() {
  const u = state.user; if (!u) return 0;
  const totalPH = u.stats?.totalPH || 0;
  let rate = 0;
  for (const mid of Object.keys(u.miners||{})) {
    if (!u.miners[mid] || !MINERS_DATA[mid]) continue;
    const m = MINERS_DATA[mid];
    const bonus = 1 + (totalPH * m.multiplier / 1000);
    rate += m.kmrPerHour * bonus;
  }
  return rate;
}

function startMiningLoop() {
  const lastCollect = state.user?.stats?.lastCollect || Date.now();
  const hoursPassed = Math.min((Date.now() - lastCollect) / 3600000, 24);
  state.pendingKmr  = calcKmrPerHour() * hoursPassed;
  state.lastCalcTime = Date.now();

  setInterval(() => {
    const rate = calcKmrPerHour();
    const dt   = (Date.now() - state.lastCalcTime) / 3600000;
    state.pendingKmr  += rate * dt;
    state.lastCalcTime = Date.now();
    renderTopBar();
    if (state.currentView === 'mine') {
      qs('#pending-kmr').textContent = fmtKmr(Math.floor(state.pendingKmr));
    }
  }, 2000);
}

async function collectRewards() {
  const btn = qs('#collect-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Toplanıyor...';
  try {
    const u = state.user;
    const now = Date.now();
    const lastCollect = u?.stats?.lastCollect || now;
    const hoursPassed = Math.min((now - lastCollect) / 3600000, 24);
    const earned = Math.floor(calcKmrPerHour() * hoursPassed);
    if (earned <= 0) { toast('Henüz toplanacak KMR yok', 'info'); return; }
    const newKmr = (u.balance?.kmr || 0) + earned;
    await fbUpdateUser(state.uid, {
      'balance/kmr': newKmr,
      'stats/lastCollect': now,
      'stats/totalMined': (u.stats?.totalMined || 0) + earned
    });
    state.user.balance.kmr = newKmr;
    state.user.stats.lastCollect = now;
    state.user.stats.totalMined = (u.stats?.totalMined || 0) + earned;
    state.pendingKmr = 0;
    toast(`⛏️ ${fmtKmr(earned)} KMR toplandı!`, 'success');
    renderAll();
  } catch(e) { toast(e.message, 'error'); }
  finally {
    btn.disabled = false;
    btn.innerHTML = '<span>⬆️</span><span>KMR Topla</span>';
  }
}

// ─── Currency Convert ──────────────────────────────────────────
async function convertCurrency(from, to) {
  const input = from === 'kmr' ? qs('#conv-kmr') : qs('#conv-banknot');
  const amount = parseInt(input.value);
  if (!amount || amount <= 0) { toast('Geçerli bir miktar girin', 'error'); return; }
  const bal = state.user.balance;
  try {
    if (from === 'kmr' && to === 'banknot') {
      const needed = amount * 1000;
      if ((bal.kmr||0) < needed) throw new Error('Yetersiz KMR');
      await fbUpdateUser(state.uid, { 'balance/kmr': bal.kmr-needed, 'balance/banknot': (bal.banknot||0)+amount });
      bal.kmr -= needed; bal.banknot = (bal.banknot||0)+amount;
    } else if (from === 'banknot' && to === 'cekip') {
      const needed = amount * 10000;
      if ((bal.banknot||0) < needed) throw new Error('Yetersiz Banknot');
      await fbUpdateUser(state.uid, { 'balance/banknot': bal.banknot-needed, 'balance/cekip': (bal.cekip||0)+amount });
      bal.banknot -= needed; bal.cekip = (bal.cekip||0)+amount;
    } else throw new Error('Geçersiz dönüşüm');
    input.value = '';
    renderTopBar();
    toast(`✅ ${amount} ${to==='banknot'?'Banknot':'Çekip'} kazandın!`, 'success');
  } catch(e) { toast(e.message, 'error'); }
}

// ─── Buy Miner ─────────────────────────────────────────────────
async function buyMiner(minerId) {
  const m = MINERS_DATA[minerId];
  if (!confirm(`${m.name} satın almak istiyor musun? Fiyat: ${fmtKmr(m.price)} Banknot`)) return;
  try {
    const bal = state.user.balance;
    if ((bal?.banknot||0) < m.price) throw new Error('Yetersiz Banknot');
    if (state.user.miners?.[minerId]) throw new Error('Bu madenci zaten sizin');
    await fbUpdateUser(state.uid, {
      [`miners/${minerId}`]: true,
      'balance/banknot': (bal.banknot||0) - m.price
    });
    state.user.miners = state.user.miners || {};
    state.user.miners[minerId] = true;
    state.user.balance.banknot = (bal.banknot||0) - m.price;
    renderAll();
    toast(`✅ ${m.name} satın alındı!`, 'success');
    if (window.Telegram?.WebApp?.HapticFeedback)
      Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  } catch(e) { toast(e.message, 'error'); }
}

// ─── Open Box ──────────────────────────────────────────────────
async function openBox(boxId) {
  const b = BOXES_DATA[boxId];
  const u = state.user;
  try {
    const bal = u.balance?.[b.currency] || 0;
    if (bal < b.price) throw new Error(`Yetersiz ${b.currency.toUpperCase()}`);
    showBoxOpenAnim(b.emoji);
    const reward = fbGenerateReward(boxId);
    const updates = { [`balance/${b.currency}`]: bal - b.price };
    if (reward.type === 'kmr')     { updates['balance/kmr'] = (u.balance?.kmr||0) - (b.currency==='kmr'?b.price:0) + reward.amount; u.balance.kmr = updates['balance/kmr']; }
    if (reward.type === 'banknot') { updates['balance/banknot'] = (u.balance?.banknot||0) + reward.amount; u.balance.banknot = updates['balance/banknot']; }
    if (reward.type === 'equipment') {
      const cur = u.equipment?.[reward.itemId] || 0;
      updates[`equipment/${reward.itemId}`] = cur + 1;
      u.equipment = u.equipment || {};
      u.equipment[reward.itemId] = cur + 1;
      const newPH = fbCalcPH(u.equipment);
      updates['stats/totalPH'] = newPH;
      updates['stats/league']  = fbCalcLeague(newPH);
      u.stats.totalPH = newPH;
      u.stats.league  = fbCalcLeague(newPH);
      await fbUpdateLeaderboard(state.uid, u.username, newPH, fbCalcLeague(newPH));
    }
    u.balance[b.currency] = bal - b.price;
    await fbUpdateUser(state.uid, updates);
    setTimeout(() => { showReward(reward); renderAll(); }, 800);
  } catch(e) { hideBoxOpening(); toast(e.message, 'error'); }
}

function showBoxOpenAnim(boxEmoji) {
  qs('#box-anim-icon').textContent = boxEmoji;
  qs('#reward-reveal').style.opacity = '0';
  qs('#box-particles').innerHTML = '';
  show('box-open-overlay');
  spawnBoxParticles();
  if (window.Telegram?.WebApp?.HapticFeedback)
    Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
}

function showReward(reward) {
  let emoji, name, amount, rarityText, rarityColor;
  if (reward.type === 'kmr') {
    emoji='🪨'; name='KMR Kazandın!'; amount=`+${fmtKmr(reward.amount)} KMR`;
    rarityText=''; rarityColor='var(--coal2)';
  } else if (reward.type === 'banknot') {
    emoji='💵'; name='Banknot Kazandın!'; amount=`+${fmtKmr(reward.amount)} Banknot`;
    rarityText=''; rarityColor='var(--green)';
  } else {
    const item = EQ_MAP[reward.itemId];
    emoji=item.emoji; name=item.name; amount=`+${item.ph} PH`;
    rarityText=RARITY_LABEL[item.rarity]; rarityColor=RARITY_COLOR[item.rarity];
  }
  qs('#reward-emoji').textContent   = emoji;
  qs('#reward-name').textContent    = name;
  qs('#reward-amount').textContent  = amount;
  qs('#reward-rarity').textContent  = rarityText;
  qs('#reward-rarity').style.color  = rarityColor;
  qs('#reward-reveal').style.opacity= '1';
  if (window.Telegram?.WebApp?.HapticFeedback)
    Telegram.WebApp.HapticFeedback.notificationOccurred('success');
}

function closeBoxOpening() { hideBoxOpening(); }
function hideBoxOpening()  { hide('box-open-overlay'); }

function spawnBoxParticles() {
  const container = qs('#box-particles');
  const colors = ['#f5c842','#ff6b35','#3498db','#9b59b6','#2ecc71','#e74c3c'];
  for (let i = 0; i < 24; i++) {
    const p = el('div','box-open-particle');
    const angle = (i/24)*360; const dist = 80 + Math.random()*120;
    p.style.cssText = `left:50%;top:50%;background:${colors[i%colors.length]};
      --tx:calc(${Math.cos(angle*Math.PI/180)*dist}px - 4px) ;
      transform:translate(-50%,-50%);
      animation: burst ${0.6+Math.random()*0.6}s ease-out ${Math.random()*0.3}s forwards;`;
    container.appendChild(p);
  }
}

// ─── Modals ────────────────────────────────────────────────────
function openModal(name) {
  if (name === 'profile') fillProfileModal();
  if (name === 'rank')    loadLeaderboard('all');
  if (name === 'settings') fillSettingsModal();
  show(`modal-${name}`);
}
function closeModal(name) { hide(`modal-${name}`); }
function closeModalOutside(event, name) {
  if (event.target === event.currentTarget) closeModal(name);
}

function fillProfileModal() {
  const u = state.user; if (!u) return;
  qs('#profile-username').textContent = u.username;
  const league = u.stats?.league || 'cirak';
  qs('#profile-league-badge').innerHTML = `${LEAGUES[league].emoji} ${LEAGUES[league].name}`;
  qs('#profile-ph').textContent     = (u.stats?.totalPH || 0) + ' PH';
  qs('#profile-kmr').textContent    = fmtKmr(u.balance?.kmr || 0);
  qs('#profile-banknot').textContent= fmtKmr(u.balance?.banknot || 0);
  qs('#profile-cekip').textContent  = (u.balance?.cekip || 0).toFixed(3);
  qs('#profile-mined').textContent  = fmtKmr(u.stats?.totalMined || 0) + ' KMR';
}

function openChangePassword() {
  const s = qs('#change-pw-section');
  s.classList.toggle('hidden');
}

async function doChangePassword() {
  const newPw  = qs('#new-pw').value;
  const newPw2 = qs('#new-pw2').value;
  if (!newPw || !newPw2) { toast('Tüm alanları doldurun', 'error'); return; }
  if (newPw !== newPw2)  { toast('Şifreler eşleşmiyor', 'error'); return; }
  if (newPw.length < 8 || !/[A-Z]/.test(newPw) || !/[0-9]/.test(newPw)) { toast('Şifre gereksinimlerini karşılamıyor', 'error'); return; }
  try {
    await fbAuth.currentUser.updatePassword(newPw);
    toast('✅ Şifre güncellendi', 'success');
    qs('#change-pw-section').classList.add('hidden');
    qs('#new-pw').value = qs('#new-pw2').value = '';
  } catch(e) { toast(e.code === 'auth/requires-recent-login' ? 'Lütfen tekrar giriş yapın' : e.message, 'error'); }
}

async function doWithdraw() {
  const amount  = parseFloat(qs('#withdraw-amount').value);
  const address = qs('#withdraw-address').value.trim();
  if (!amount || amount < 1) { toast('Minimum 1 Çekip çekebilirsin', 'error'); return; }
  if (!address) { toast('Adres giriniz', 'error'); return; }
  const u = state.user;
  try {
    if ((u.balance?.cekip||0) < amount) throw new Error('Yetersiz Çekip');
    await fbDb.ref('withdrawals').push({ uid: state.uid, username: u.username, amount, address, status: 'pending', createdAt: Date.now() });
    const newCekip = (u.balance.cekip||0) - amount;
    await fbUpdateUser(state.uid, { 'balance/cekip': newCekip });
    u.balance.cekip = newCekip;
    toast('✅ Çekim talebiniz alındı', 'success');
    qs('#withdraw-amount').value = qs('#withdraw-address').value = '';
    renderAll(); fillProfileModal();
  } catch(e) { toast(e.message, 'error'); }
}

// Shop tabs
function switchShopTab(tab, btn) {
  document.querySelectorAll('.shop-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  if (tab === 'miners') { show('shop-miners'); hide('shop-boxes'); }
  else                  { hide('shop-miners'); show('shop-boxes'); }
}

// Rank
let leaderboardData = [];
async function loadLeaderboard(filter) {
  qs('#rank-list').innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Yükleniyor...</p></div>';
  try {
    const snap = await fbDb.ref('leaderboard').orderByChild('totalPH').limitToLast(100).once('value');
    leaderboardData = [];
    snap.forEach(c => leaderboardData.push({ uid: c.key, ...c.val() }));
    leaderboardData.sort((a,b) => b.totalPH - a.totalPH);
    renderLeaderboard(filter);
  } catch(e) { toast(e.message,'error'); }
}

function renderLeaderboard(filter) {
  let list = leaderboardData;
  if (filter !== 'all') list = list.filter(u=>u.league===filter);
  const container = qs('#rank-list');
  if (list.length === 0) { container.innerHTML='<div class="empty-state"><div class="empty-icon">🏆</div><p>Henüz kimse yok</p></div>'; return; }
  container.innerHTML = '';
  list.slice(0,100).forEach((u, i) => {
    const row = el('div', `rank-item${u.uid===state.uid?' me':''}`);
    const posClass = i===0?'top1':i===1?'top2':i===2?'top3':'';
    const posLabel = i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1;
    row.innerHTML = `<div class="rank-pos ${posClass}">${posLabel}</div>
      <div class="rank-name">${u.username}${u.uid===state.uid?' (Sen)':''}</div>
      <div class="rank-ph">${u.totalPH} PH</div>`;
    container.appendChild(row);
  });
}

function switchRankTab(filter, btn) {
  document.querySelectorAll('.rank-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderLeaderboard(filter);
}

// Settings
function fillSettingsModal() {
  const s = state.user?.settings;
  if (!s) return;
  qs('#toggle-notif').className = 'toggle' + (s.notifications ? ' on' : '');
  qs('#toggle-theme').className = 'toggle on'; // always dark for now
}

async function toggleSetting(key, btn) {
  btn.classList.toggle('on');
  const val = btn.classList.contains('on');
  if (!state.user.settings) state.user.settings = {};
  state.user.settings[key] = val;
  try { await fbUpdateUser(state.uid, { [`settings/${key}`]: val }); } catch{}
}

// ─── Tooltip ───────────────────────────────────────────────────
function showTooltip(e, item) {
  const tip = qs('#item-tooltip');
  qs('#tip-name').textContent   = item.name;
  qs('#tip-ph').textContent     = item.ph;
  qs('#tip-rarity').textContent = RARITY_LABEL[item.rarity];
  qs('#tip-rarity').style.color = RARITY_COLOR[item.rarity];
  tip.classList.remove('hidden');
  const rect = e.target.getBoundingClientRect();
  tip.style.left = rect.left + 'px';
  tip.style.top  = (rect.top - 90) + 'px';
}
function hideTooltip() { qs('#item-tooltip').classList.add('hidden'); }

// ─── UI Helpers ────────────────────────────────────────────────
function buildStalactites() {
  const top = qs('#cave-top');
  const count = Math.floor(window.innerWidth / 40);
  for (let i = 0; i < count; i++) {
    const s = el('div','stalactite');
    const w  = 12 + Math.random() * 20;
    const h  = 30 + Math.random() * 50;
    s.style.cssText = `left:${(i/count)*100}%;border-left-width:${w/2}px;border-right-width:${w/2}px;border-top-width:${h}px;`;
    top.appendChild(s);
  }
}

function spawnParticles() {
  const container = qs('#particles');
  for (let i = 0; i < 18; i++) {
    const p = el('div','particle');
    const size = 3 + Math.random() * 6;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;
      animation-duration:${10+Math.random()*15}s;
      animation-delay:${-Math.random()*20}s;`;
    container.appendChild(p);
  }
}

function toast(msg, type='info', dur=3000) {
  const t = el('div', `toast ${type}`);
  t.textContent = msg;
  qs('#toast-container').appendChild(t);
  setTimeout(() => { t.style.animation='toast-out 0.3s ease forwards'; setTimeout(()=>t.remove(), 300); }, dur);
}

function setBtnLoading(id, loading) {
  const btn = qs('#'+id);
  if (loading) { btn.disabled=true; btn._orig=btn.innerHTML; btn.innerHTML='<div class="spinner"></div>'; }
  else         { btn.disabled=false; btn.innerHTML=btn._orig||btn.innerHTML; }
}

function qs(sel) { return document.querySelector(sel); }
function el(tag, cls) { const e=document.createElement(tag); if(cls) e.className=cls; return e; }
function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }
function hideLoading() { const l=document.getElementById('loading-screen'); if(l){l.style.opacity='0'; setTimeout(()=>l.remove(),300);} }
function fmtKmr(n) {
  n = Math.floor(n);
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
  if (n >= 1000)    return (n/1000).toFixed(1)+'K';
  return n.toString();
}
