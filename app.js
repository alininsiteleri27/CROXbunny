// ============================================
//   KÖMÜR MADENİ - ANA OYUN MANTIĞI
//   Firebase Realtime Database + Auth
// ============================================

// ===== FIREBASE CONFIG =====
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
const db = firebase.database();

// ===== MADENCİ TANIMLAMALARI =====
const MINERS = [
  {
    id: 'mehmet',
    name: 'Mehmet Dayı',
    emoji: '👴',
    price: 10000, // banknot
    hourlyKmr: 100,
    multiplier: 2,
    desc: 'Tecrübeli köy madencisi. Sade ama güvenilir.',
    color: '#795548'
  },
  {
    id: 'semsi',
    name: 'Şemsi Dayı',
    emoji: '🧔',
    price: 20000,
    hourlyKmr: 250,
    multiplier: 4,
    desc: 'Yılların verdiği bilgelikle çalışır.',
    color: '#607D8B'
  },
  {
    id: 'kubra',
    name: 'Kübra Teyze',
    emoji: '👩‍🦱',
    price: 50000,
    hourlyKmr: 750,
    multiplier: 6,
    desc: 'Mahallenin en hızlı madencisi!',
    color: '#E91E63'
  },
  {
    id: 'beyza',
    name: 'Beyza Nene',
    emoji: '👵',
    price: 100000,
    hourlyKmr: 2000,
    multiplier: 8,
    desc: 'Görünüşe aldanma, 50 yıllık tecrübe!',
    color: '#9C27B0'
  },
  {
    id: 'ali',
    name: 'Ali Usta',
    emoji: '👷',
    price: 250000,
    hourlyKmr: 5000,
    multiplier: 10,
    desc: 'Efsanevi Usta Ali. Madencilerin efendisi.',
    color: '#FF6B00'
  }
];

// ===== DÖNÜŞÜM ORANLARI =====
const RATES = { KMR_TO_BANKNOT: 1000, BANKNOT_TO_CHEQUE: 10000 };

// ===== OYUN DURUMU =====
let currentUser = null;
let userData = null;
let mineInterval = null;
let leagueInterval = null;
let saveTimeout = null;
let currentScreen = 'mine';
let currentLeagueTab = 'cirak';
let pendingBoxReward = null;
let boxOpenCount = 0; // başarım için

// ===== ÖĞE REFERANSLARI =====
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ============================================
//   BAŞLATMA
// ============================================
window.addEventListener('load', () => {
  generateParticles();
  generateStalactites();
  generateSparks();

  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      loadUserData();
    } else {
      showAuthScreen();
    }
  });
});

// ===== AUTH EKRANI =====
function showAuthScreen() {
  $('loading-screen').style.display = 'none';
  $('auth-screen').style.display = 'flex';
  $('game-screen').style.display = 'none';
}

function showGameScreen() {
  $('loading-screen').style.display = 'none';
  $('auth-screen').style.display = 'none';
  $('game-screen').style.display = 'block';
  renderAll();
  startMineLoop();
  startLeagueLoop();
  checkDailyTasks();
}

// ===== PARÇACIK EFEKTLER =====
function generateParticles() {
  const container = document.querySelector('.auth-bg');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'coal-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (3 + Math.random() * 5) + 's';
    p.style.animationDelay = Math.random() * 5 + 's';
    p.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
    p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
    container.appendChild(p);
  }
}

function generateStalactites() {
  const container = document.querySelector('.cave-stalactites');
  if (!container) return;
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('div');
    s.className = 'stalactite';
    const w = 15 + Math.random() * 25;
    const h = 20 + Math.random() * 40;
    s.style.cssText = `left:${i * 8.5 + Math.random() * 4}%;width:${w}px;height:${h}px;animation-delay:${Math.random()*2}s`;
    container.appendChild(s);
  }
}

function generateSparks() {
  const container = document.querySelector('.cave-sparks');
  if (!container) return;
  for (let i = 0; i < 15; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.cssText = `left:${Math.random()*90}%;top:${Math.random()*80+10}%;--dur:${1+Math.random()*2}s;--delay:${Math.random()*2}s`;
    container.appendChild(s);
  }
}

// ============================================
//   GİRİŞ / KAYIT
// ============================================
window.switchTab = function(tab) {
  $$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $('login-form').style.display = tab === 'login' ? 'block' : 'none';
  $('register-form').style.display = tab === 'register' ? 'block' : 'none';
  clearAuthErrors();
};

window.doLogin = async function() {
  const username = $('login-user').value.trim();
  const password = $('login-pass').value;
  if (!username || !password) return showAuthError('login', 'Tüm alanları doldurun!');

  try {
    // Kullanıcı adından email oluştur (Firebase email gerektirir)
    const email = username.toLowerCase() + '@madenci.oyun';
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    showAuthError('login', 'Kullanıcı adı veya şifre hatalı!');
  }
};

window.doRegister = async function() {
  const username = $('reg-user').value.trim();
  const password = $('reg-pass').value;
  const confirm = $('reg-confirm').value;

  if (!username || !password || !confirm) return showAuthError('register', 'Tüm alanları doldurun!');
  if (username.length > 20) return showAuthError('register', 'Kullanıcı adı max 20 karakter!');
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return showAuthError('register', 'Sadece harf, rakam ve _ kullanın!');
  if (password.length < 8) return showAuthError('register', 'Şifre min 8 karakter olmalı!');
  if (!/[0-9]/.test(password)) return showAuthError('register', 'Şifre en az 1 rakam içermeli!');
  if (!/[A-Z]/.test(password)) return showAuthError('register', 'Şifre en az 1 büyük harf içermeli!');
  if (password !== confirm) return showAuthError('register', 'Şifreler eşleşmiyor!');

  try {
    // Kullanıcı adı benzersizlik kontrolü
    const snap = await db.ref('usernames').child(username.toLowerCase()).once('value');
    if (snap.exists()) return showAuthError('register', 'Bu kullanıcı adı zaten alınmış!');

    const email = username.toLowerCase() + '@madenci.oyun';
    const cred = await auth.createUserWithEmailAndPassword(email, password);

    // İlk kullanıcı verisi
    const initData = {
      username,
      kmr: 0,
      banknot: 500, // başlangıç bonusu
      cheque: 0,
      miners: [],
      items: [],
      power: 0,
      joinedAt: Date.now(),
      lastMineTime: Date.now(),
      lastLeagueReward: 0,
      dailyTasks: {},
      dailyDate: getTodayStr(),
      achievements: [],
      totalBoxesOpened: 0,
      settings: { soundOn: true, notifOn: true }
    };

    await db.ref('users').child(cred.user.uid).set(initData);
    await db.ref('usernames').child(username.toLowerCase()).set(cred.user.uid);

    showToast('🎉 Hoş geldin ' + username + '! 500 Banknot hediye edildi!', 'success');
  } catch (e) {
    showAuthError('register', 'Kayıt başarısız: ' + (e.message || 'Hata oluştu'));
  }
};

function showAuthError(form, msg) {
  const el = $(form + '-error');
  el.textContent = msg;
  el.style.display = 'block';
}

function clearAuthErrors() {
  $$('.auth-error').forEach(e => e.style.display = 'none');
}

// ============================================
//   KULLANICI VERİSİ
// ============================================
async function loadUserData() {
  $('loading-screen').style.display = 'flex';
  try {
    const snap = await db.ref('users').child(currentUser.uid).once('value');
    userData = snap.val();
    if (!userData) {
      auth.signOut();
      return;
    }
    // Günlük görev sıfırlama
    if (userData.dailyDate !== getTodayStr()) {
      userData.dailyTasks = {};
      userData.dailyDate = getTodayStr();
    }
    showGameScreen();
  } catch (e) {
    showAuthError('login', 'Veri yüklenemedi, tekrar deneyin.');
    showAuthScreen();
  }
}

function saveUserData() {
  if (!currentUser || !userData) return;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    db.ref('users').child(currentUser.uid).update(userData);
  }, 1500);
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ============================================
//   RENDER FONKSİYONLARI
// ============================================
function renderAll() {
  renderTopbar();
  renderMineScreen();
  renderShop();
  renderLeaderboard();
  renderProfile();
  renderSettings();
}

function renderTopbar() {
  if (!userData) return;
  $('hud-kmr').textContent = formatNum(userData.kmr || 0);
  $('hud-banknot').textContent = formatNum(userData.banknot || 0);
  $('hud-cheque').textContent = formatNum(userData.cheque || 0);
  const league = getLeague(calcPower());
  const badge = $('league-badge');
  badge.textContent = league.icon + ' ' + league.name;
  badge.style.color = league.color;
  badge.style.borderColor = league.color;
  badge.style.background = league.color + '20';
  $('power-display').textContent = '⚡ ' + formatNum(calcPower()) + ' PH';
}

// ===== MADEN EKRANI =====
function renderMineScreen() {
  if (!userData) return;
  const ownedMiners = userData.miners || [];
  const container = $('mine-miners-grid');
  container.innerHTML = '';

  // Sahip olunan madenciler
  if (ownedMiners.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:40px;font-family:'Share Tech Mono',monospace;font-size:13px;">
      Henüz madenci yok. Mağazadan satın al! ⬇️
    </div>`;
  } else {
    ownedMiners.forEach(minerId => {
      const m = MINERS.find(x => x.id === minerId);
      if (!m) return;
      const card = createMinerDisplayCard(m);
      container.appendChild(card);
    });
  }

  // Mağaza maden bilgisi
  updateCaveInfo();
}

function createMinerDisplayCard(m) {
  const div = document.createElement('div');
  div.className = 'miner-card';
  div.style.borderColor = m.color + '44';
  div.innerHTML = `
    <span class="miner-emoji">${m.emoji}</span>
    <div class="miner-name">${m.name}</div>
    <div class="miner-stats">
      <div class="stat-item">
        <div class="stat-label">SAATLİK KMR</div>
        <div class="stat-value kmr">+${formatNum(m.hourlyKmr)}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">ÇARPAN</div>
        <div class="stat-value" style="color:${m.color}">x${m.multiplier}</div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--text-secondary);text-align:center;line-height:1.4;">${m.desc}</div>
  `;
  return div;
}

function updateCaveInfo() {
  if (!userData) return;
  const totalRate = getTotalHourlyRate();
  $('cave-rate').textContent = formatNum(totalRate) + ' KMR/SA';

  // Madenci emojisi
  const lastMiner = getLastMiner();
  const caveMiner = $('cave-miner');
  if (caveMiner) {
    caveMiner.textContent = lastMiner ? lastMiner.emoji : '⛏️';
  }
}

function getTotalHourlyRate() {
  if (!userData || !userData.miners) return 0;
  return userData.miners.reduce((sum, id) => {
    const m = MINERS.find(x => x.id === id);
    return sum + (m ? m.hourlyKmr : 0);
  }, 0);
}

function getLastMiner() {
  if (!userData || !userData.miners || !userData.miners.length) return null;
  const owned = userData.miners;
  return MINERS.slice().reverse().find(m => owned.includes(m.id));
}

function calcPower() {
  if (!userData) return 0;
  const items = userData.items || [];
  const itemPower = items.reduce((sum, itemId) => {
    const item = ITEMS.find(x => x.id === itemId);
    return sum + (item ? item.ph : 0);
  }, 0);

  const minerPower = (userData.miners || []).reduce((sum, id) => {
    const m = MINERS.find(x => x.id === id);
    return sum + (m ? m.multiplier * 10 : 0);
  }, 0);

  return itemPower + minerPower;
}

function getLeague(power) {
  return LEAGUES.slice().reverse().find(l => power >= l.minPh) || LEAGUES[0];
}

// ===== MAĞAZA =====
function renderShop() {
  renderShopMiners();
  renderBoxes();
}

function renderShopMiners() {
  const container = $('shop-miners-grid');
  if (!container) return;
  container.innerHTML = '';
  const ownedMiners = userData ? userData.miners || [] : [];

  MINERS.forEach(m => {
    const owned = ownedMiners.includes(m.id);
    const div = document.createElement('div');
    div.className = 'miner-card' + (owned ? '' : '');
    div.style.cssText = `background:var(--bg-card);border:1px solid ${m.color}44;border-radius:16px;padding:20px;text-align:center;`;
    div.innerHTML = `
      <span class="miner-emoji">${m.emoji}</span>
      <div class="miner-name">${m.name}</div>
      <div class="miner-stats">
        <div class="stat-item">
          <div class="stat-label">FİYAT</div>
          <div class="stat-value banknot">${formatNum(m.price)} 💵</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">SAATLİK</div>
          <div class="stat-value kmr">${formatNum(m.hourlyKmr)} 🪨</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;line-height:1.4;">${m.desc}</div>
      <button class="btn-buy ${owned ? 'owned' : ''}" 
        onclick="buyMiner('${m.id}')"
        ${owned ? 'disabled' : ''}
        style="pointer-events:${owned ? 'none' : 'auto'}">
        ${owned ? '✅ SAHİPSİN' : '🛒 SATIN AL'}
      </button>
    `;
    container.appendChild(div);
  });
}

function renderBoxes() {
  const container = $('shop-boxes-grid');
  if (!container) return;
  container.innerHTML = '';

  BOXES.forEach(box => {
    const div = document.createElement('div');
    div.className = 'box-card';
    div.style.borderColor = box.color + '55';

    let priceStr = '';
    if (box.id === 'box_legend') {
      priceStr = `<span style="color:var(--cheque)">${box.price} 💎 ÇEKİP</span>`;
    } else {
      priceStr = `<span style="color:var(--banknot)">${formatNum(box.price)} 💵 BANKNOT</span>`;
    }

    div.innerHTML = `
      <span class="box-icon">${box.icon}</span>
      <div class="box-name" style="color:${box.color}">${box.name}</div>
      <div class="box-price">${priceStr}</div>
      <div class="box-desc">${box.description}</div>
      <button class="btn-open-box" onclick="openBox('${box.id}')"
        style="background:linear-gradient(135deg, ${box.color}, ${box.color}88);color:#fff">
        📦 AÇ
      </button>
    `;
    container.appendChild(div);
  });
}

// ===== SIRALAMAM =====
function renderLeaderboard() {
  // Firebase'den sıralama çek
  loadLeaderboard(currentLeagueTab);
}

async function loadLeaderboard(leagueId) {
  const container = $('leaderboard-list');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px;font-family:\'Share Tech Mono\',monospace;">Yükleniyor...</div>';

  try {
    const snap = await db.ref('users').orderByChild('power').limitToLast(50).once('value');
    let users = [];
    snap.forEach(child => {
      const d = child.val();
      const power = d.power || 0;
      const league = getLeague(power);
      if (league.id === leagueId) {
        users.push({ uid: child.key, username: d.username, power, league });
      }
    });
    users.sort((a, b) => b.power - a.power);

    if (users.length === 0) {
      container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px;font-family:\'Share Tech Mono\',monospace;">Bu ligde henüz oyuncu yok.</div>';
      return;
    }

    const league = LEAGUES.find(l => l.id === leagueId);
    const totalPower = users.reduce((s, u) => s + u.power, 0) || 1;

    container.innerHTML = '';
    users.forEach((u, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const isMe = u.uid === currentUser?.uid;
      const share = totalPower > 0 ? ((u.power / totalPower) * league.reward).toFixed(2) : '0';

      const item = document.createElement('div');
      item.className = 'rank-item' + (isMe ? ' me' : '');
      item.innerHTML = `
        <div class="rank-num ${rankClass}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}</div>
        <div class="rank-name">${isMe ? '👤 ' : ''}${u.username || 'Bilinmiyor'}</div>
        <div class="rank-power">⚡ ${formatNum(u.power)} PH</div>
        <div class="rank-prize">~${share} 💎</div>
      `;
      container.appendChild(item);
    });
  } catch (e) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px;">Sıralama yüklenemedi.</div>';
  }
}

// ===== PROFİL =====
function renderProfile() {
  if (!userData) return;
  $('prof-username').textContent = userData.username || '';
  $('prof-power').textContent = formatNum(calcPower()) + ' PH';
  $('prof-miners').textContent = (userData.miners || []).length + ' / ' + MINERS.length;
  $('prof-items').textContent = (userData.items || []).length;
  $('prof-banknot').textContent = formatNum(userData.banknot || 0);
  $('prof-kmr').textContent = formatNum(userData.kmr || 0);
  $('prof-cheque').textContent = formatNum(userData.cheque || 0);
  $('prof-league').textContent = getLeague(calcPower()).icon + ' ' + getLeague(calcPower()).name;
  $('prof-joindate').textContent = userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString('tr-TR') : '-';

  renderInventory();
  renderAchievements();
  renderDailyTasks();
}

function renderInventory() {
  const grid = $('items-shelf-grid');
  if (!grid) return;
  const items = userData.items || [];
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = '<div style="color:var(--text-secondary);font-family:\'Share Tech Mono\',monospace;font-size:12px;padding:20px;grid-column:1/-1;text-align:center;">Henüz eşya yok. Kutu aç!</div>';
    return;
  }

  items.forEach((itemId, idx) => {
    const item = ITEMS.find(x => x.id === itemId);
    if (!item) return;
    const slot = document.createElement('div');
    slot.className = 'item-slot ' + item.rarity;
    slot.style.animationDelay = (idx * 0.03) + 's';
    slot.title = item.name + ' - ' + item.ph + ' PH\n' + item.desc;
    slot.innerHTML = `
      <span class="item-icon">${item.icon}</span>
      <div class="item-name">${item.name}</div>
      <div class="item-ph">${item.ph} PH</div>
    `;
    grid.appendChild(slot);
  });
}

function renderAchievements() {
  const grid = $('achievements-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const earned = userData.achievements || [];

  ACHIEVEMENTS.forEach(a => {
    const unlocked = earned.includes(a.id);
    const div = document.createElement('div');
    div.className = 'achievement-card' + (unlocked ? ' unlocked' : '');
    div.innerHTML = `
      <div class="achievement-icon">${unlocked ? a.icon : '🔒'}</div>
      <div class="achievement-info">
        <div class="achievement-name" style="color:${unlocked ? 'var(--gold)' : 'var(--text-secondary)'}">${a.name}</div>
        <div class="achievement-desc">${a.desc}</div>
        ${unlocked ? '' : '<div style="font-size:10px;color:var(--text-dim);font-family:\'Share Tech Mono\',monospace;margin-top:2px;">Kilitli</div>'}
      </div>
    `;
    grid.appendChild(div);
  });
}

function renderDailyTasks() {
  const list = $('daily-tasks-list');
  if (!list) return;
  const done = userData.dailyTasks || {};
  list.innerHTML = '';

  DAILY_TASKS.forEach(t => {
    const isDone = !!done[t.id];
    const div = document.createElement('div');
    div.className = 'task-item';
    div.innerHTML = `
      <span class="task-icon">${t.icon}</span>
      <div class="task-name" style="text-decoration:${isDone ? 'line-through' : 'none'};color:${isDone ? 'var(--text-dim)' : 'var(--text-primary)'}">
        ${t.name}
      </div>
      <div class="task-reward">+${formatNum(t.reward.amount)} ${t.reward.type === 'kmr' ? '🪨' : '💵'}</div>
      <div class="task-check ${isDone ? 'done' : ''}">${isDone ? '✓' : ''}</div>
    `;
    list.appendChild(div);
  });
}

// ===== AYARLAR =====
function renderSettings() {
  if (!userData) return;
  $('settings-username').textContent = userData.username || '';
  $('settings-joindate').textContent = userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString('tr-TR') : '-';
  $('settings-miners').textContent = (userData.miners || []).length;
  $('settings-items').textContent = (userData.items || []).length;
  $('settings-boxes').textContent = userData.totalBoxesOpened || 0;
}

// ============================================
//   NAVİGASYON
// ============================================
window.navTo = function(screen) {
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === screen));
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === screen + '-screen'));
  currentScreen = screen;

  if (screen === 'rank') renderLeaderboard();
  if (screen === 'profile') renderProfile();
  if (screen === 'shop') renderShop();
};

window.switchLeagueTab = function(id) {
  currentLeagueTab = id;
  $$('.league-tab').forEach(t => {
    const league = LEAGUES.find(l => l.id === t.dataset.league);
    t.classList.toggle('active', t.dataset.league === id);
    if (t.dataset.league === id && league) {
      t.style.background = league.color;
      t.style.borderColor = league.color;
    } else {
      t.style.background = 'var(--bg-card)';
      t.style.borderColor = 'var(--coal-light)';
    }
  });
  loadLeaderboard(id);
};

// ============================================
//   SATIN ALMA
// ============================================
window.buyMiner = async function(minerId) {
  if (!userData) return;
  const m = MINERS.find(x => x.id === minerId);
  if (!m) return;
  if ((userData.miners || []).includes(minerId)) return showToast('Bu madenciye zaten sahipsin!', 'info');
  if ((userData.banknot || 0) < m.price) return showToast('Yeterli banknot yok! 💵', 'error');

  userData.banknot -= m.price;
  userData.miners = [...(userData.miners || []), minerId];
  userData.power = calcPower();

  checkAchievement('first_miner');
  if (userData.miners.length === MINERS.length) checkAchievement('all_miners');

  saveUserData();
  renderAll();
  showToast('🎉 ' + m.name + ' ekibine katıldı!', 'success');
};

// ============================================
//   KUTU AÇMA
// ============================================
window.openBox = function(boxId) {
  if (!userData) return;
  const box = BOXES.find(b => b.id === boxId);
  if (!box) return;

  // Ödeme kontrolü
  if (boxId === 'box_legend') {
    if ((userData.cheque || 0) < box.price) return showToast('Yeterli çekip yok! 💎', 'error');
    userData.cheque -= box.price;
  } else {
    if ((userData.banknot || 0) < box.price) return showToast('Yeterli banknot yok! 💵', 'error');
    userData.banknot -= box.price;
  }

  // Ödülü hesapla
  const reward = calcBoxReward(box);
  pendingBoxReward = reward;

  // Modalı aç
  const modal = $('box-modal');
  modal.classList.add('active');
  $('box-modal-title').textContent = box.name + ' açılıyor...';
  $('modal-box-icon').textContent = box.icon;
  $('modal-box-anim').classList.remove('opening');
  $('reward-reveal').style.display = 'none';
  $('modal-box-anim').querySelector('.box-3d').style.cssText = '';
  $('btn-open-confirm').style.display = 'inline-block';
  $('btn-collect').style.display = 'none';

  // Günlük görev
  completeTask('open_box');

  // Başarım
  userData.totalBoxesOpened = (userData.totalBoxesOpened || 0) + 1;
  if (userData.totalBoxesOpened >= 10) checkAchievement('open_10_boxes');

  saveUserData();
  renderTopbar();
};

window.confirmBoxOpen = function() {
  $('modal-box-anim').classList.add('opening');
  $('btn-open-confirm').style.display = 'none';

  setTimeout(() => {
    showBoxReward(pendingBoxReward);
  }, 700);
};

function showBoxReward(reward) {
  const reveal = $('reward-reveal');
  reveal.style.display = 'block';

  if (reward.type === 'item') {
    $('reward-icon').textContent = reward.item.icon;
    $('reward-name').textContent = reward.item.name;
    $('reward-ph').textContent = reward.item.ph + ' PH';
    $('reward-rarity').className = 'rarity-badge rarity-' + reward.item.rarity;
    $('reward-rarity').textContent = rarityName(reward.item.rarity);
  } else if (reward.type === 'kmr') {
    $('reward-icon').textContent = '🪨';
    $('reward-name').textContent = formatNum(reward.amount) + ' KMR';
    $('reward-ph').textContent = 'Kömür Madeni';
    $('reward-rarity').className = 'rarity-badge';
    $('reward-rarity').textContent = '';
    $('reward-rarity').style.background = 'rgba(76,175,80,0.2)';
    $('reward-rarity').style.color = 'var(--kmr)';
    $('reward-rarity').textContent = 'KAYNAK';
  } else if (reward.type === 'banknot') {
    $('reward-icon').textContent = '💵';
    $('reward-name').textContent = formatNum(reward.amount) + ' Banknot';
    $('reward-ph').textContent = 'Nakit Para';
    $('reward-rarity').className = 'rarity-badge';
    $('reward-rarity').style.background = 'rgba(33,150,243,0.2)';
    $('reward-rarity').style.color = 'var(--banknot)';
    $('reward-rarity').textContent = 'KAYNAK';
  } else if (reward.type === 'cheque') {
    $('reward-icon').textContent = '💎';
    $('reward-name').textContent = formatNum(reward.amount) + ' Çekip';
    $('reward-ph').textContent = 'Premium Para';
    $('reward-rarity').className = 'rarity-badge';
    $('reward-rarity').style.background = 'rgba(233,30,99,0.2)';
    $('reward-rarity').style.color = 'var(--cheque)';
    $('reward-rarity').textContent = 'PREMİUM';
  }

  $('btn-collect').style.display = 'inline-block';
}

window.collectBoxReward = function() {
  if (!pendingBoxReward || !userData) return;
  const r = pendingBoxReward;

  if (r.type === 'item') {
    if (!userData.items) userData.items = [];
    // Tekrar eden eşya durumunu kontrol et - farklı kopyalar için id'ye sayı ekle
    const exists = userData.items.filter(id => id.startsWith(r.item.id)).length;
    userData.items.push(r.item.id + (exists > 0 ? '_' + exists : ''));
    userData.power = calcPower();
    checkPowerAchievements();
    showToast('🎉 ' + r.item.name + ' kazandın!', 'success');
  } else if (r.type === 'kmr') {
    userData.kmr = (userData.kmr || 0) + r.amount;
    showToast('🪨 ' + formatNum(r.amount) + ' KMR kazandın!', 'success');
  } else if (r.type === 'banknot') {
    userData.banknot = (userData.banknot || 0) + r.amount;
    showToast('💵 ' + formatNum(r.amount) + ' Banknot kazandın!', 'success');
  } else if (r.type === 'cheque') {
    userData.cheque = (userData.cheque || 0) + r.amount;
    showToast('💎 ' + formatNum(r.amount) + ' Çekip kazandın!', 'success');
  }

  pendingBoxReward = null;
  $('box-modal').classList.remove('active');
  saveUserData();
  renderAll();
};

window.closeBoxModal = function() {
  $('box-modal').classList.remove('active');
};

function calcBoxReward(box) {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const r of box.rewards) {
    cumulative += r.chance;
    if (roll < cumulative) {
      if (r.type === 'item') {
        const availableItems = ITEMS.filter(item => r.rarities.includes(item.rarity));
        const item = availableItems[Math.floor(Math.random() * availableItems.length)];
        return { type: 'item', item };
      } else {
        const amount = Math.floor(r.min + Math.random() * (r.max - r.min));
        return { type: r.type, amount };
      }
    }
  }

  // Fallback
  return { type: 'kmr', amount: 100 };
}

// ============================================
//   MADEN DÖNGÜSÜ (Otomatik KMR Kazanma)
// ============================================
function startMineLoop() {
  if (mineInterval) clearInterval(mineInterval);

  // İlk başta birikmiş KMR'yi hesapla
  collectOfflineKmr();

  mineInterval = setInterval(() => {
    if (!userData) return;
    const rate = getTotalHourlyRate();
    if (rate === 0) return;

    const earnedPerSecond = rate / 3600;
    userData.kmr = (userData.kmr || 0) + earnedPerSecond;
    userData.lastMineTime = Date.now();

    renderTopbar();
    // Her 30 saniyede bir kaydet
    if (Math.round(Date.now() / 1000) % 30 === 0) saveUserData();
  }, 1000);
}

function collectOfflineKmr() {
  if (!userData || !userData.lastMineTime) return;
  const elapsed = (Date.now() - userData.lastMineTime) / 3600000; // saat cinsinden
  const maxOffline = 8; // maks 8 saat offline kazanç
  const actualElapsed = Math.min(elapsed, maxOffline);
  const rate = getTotalHourlyRate();
  if (rate === 0 || actualElapsed <= 0) return;

  const earned = Math.floor(rate * actualElapsed);
  if (earned > 0) {
    userData.kmr = (userData.kmr || 0) + earned;
    userData.lastMineTime = Date.now();
    if (actualElapsed > 0.1) {
      showToast(`⛏️ Çevrimdışıyken ${formatNum(earned)} KMR kazandın!`, 'info');
    }
    saveUserData();
  }
}

// ============================================
//   LİG ÖDÜL DÖNGÜSÜ (20 dakikada bir)
// ============================================
function startLeagueLoop() {
  if (leagueInterval) clearInterval(leagueInterval);
  updateLeagueTimer();

  leagueInterval = setInterval(() => {
    distributeLeagueRewards();
    updateLeagueTimer();
  }, 20 * 60 * 1000); // 20 dakika
}

async function distributeLeagueRewards() {
  if (!userData) return;
  const userPower = calcPower();
  if (userPower === 0) return;

  const userLeague = getLeague(userPower);

  try {
    // Bu ligdeki tüm kullanıcıları al
    const snap = await db.ref('users').once('value');
    let leagueUsers = [];
    snap.forEach(child => {
      const d = child.val();
      const power = d.power || 0;
      if (getLeague(power).id === userLeague.id) {
        leagueUsers.push({ uid: child.key, power });
      }
    });

    const totalPower = leagueUsers.reduce((s, u) => s + u.power, 0);
    if (totalPower === 0) return;

    // Bu kullanıcının payı
    const share = (userPower / totalPower) * userLeague.reward;
    if (share <= 0) return;

    userData.cheque = (userData.cheque || 0) + share;
    userData.lastLeagueReward = Date.now();
    saveUserData();
    renderTopbar();

    showToast(`🏆 ${userLeague.name} ödülü: +${share.toFixed(2)} 💎 Çekip!`, 'success');
  } catch (e) {
    console.error('Lig ödülü dağıtılamadı:', e);
  }
}

function updateLeagueTimer() {
  const el = $('league-timer');
  if (!el) return;
  // Basit geri sayım (20 dk)
  let remaining = 20 * 60;
  const tick = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    el.textContent = `Sonraki lig ödülü: ${m}:${s.toString().padStart(2, '0')}`;
    remaining--;
    if (remaining >= 0) setTimeout(tick, 1000);
  };
  tick();
}

// ============================================
//   DÖNÜŞÜM
// ============================================
window.convertKmrToBanknot = function() {
  if (!userData) return;
  const amount = parseInt($('convert-kmr-amount').value) || 0;
  if (amount < RATES.KMR_TO_BANKNOT) return showToast('Min 1000 KMR gerekli!', 'error');
  if ((userData.kmr || 0) < amount) return showToast('Yeterli KMR yok!', 'error');

  const banknotEarned = Math.floor(amount / RATES.KMR_TO_BANKNOT);
  userData.kmr -= amount;
  userData.banknot = (userData.banknot || 0) + banknotEarned;

  saveUserData();
  renderAll();
  showToast(`✅ ${formatNum(amount)} KMR → ${formatNum(banknotEarned)} Banknot!`, 'success');
};

window.convertBanknotToCheque = function() {
  if (!userData) return;
  const amount = parseInt($('convert-banknot-amount').value) || 0;
  if (amount < RATES.BANKNOT_TO_CHEQUE) return showToast('Min 10000 Banknot gerekli!', 'error');
  if ((userData.banknot || 0) < amount) return showToast('Yeterli banknot yok!', 'error');

  const chequeEarned = Math.floor(amount / RATES.BANKNOT_TO_CHEQUE);
  userData.banknot -= amount;
  userData.cheque = (userData.cheque || 0) + chequeEarned;

  saveUserData();
  renderAll();
  showToast(`✅ ${formatNum(amount)} Banknot → ${formatNum(chequeEarned)} Çekip!`, 'success');
};

// Dönüşüm önizleme
window.previewKmr = function() {
  const amount = parseInt($('convert-kmr-amount').value) || 0;
  $('kmr-preview').textContent = `= ${Math.floor(amount / RATES.KMR_TO_BANKNOT)} Banknot`;
};

window.previewBanknot = function() {
  const amount = parseInt($('convert-banknot-amount').value) || 0;
  $('banknot-preview').textContent = `= ${Math.floor(amount / RATES.BANKNOT_TO_CHEQUE)} Çekip`;
};

// ============================================
//   GÜNLÜK GÖREVLER
// ============================================
function checkDailyTasks() {
  // Giriş görevi otomatik tamamla
  completeTask('login');
}

function completeTask(taskId) {
  if (!userData) return;
  if (!userData.dailyTasks) userData.dailyTasks = {};
  if (userData.dailyTasks[taskId]) return; // zaten yapılmış

  const task = DAILY_TASKS.find(t => t.id === taskId);
  if (!task) return;

  userData.dailyTasks[taskId] = true;
  if (task.reward.type === 'kmr') userData.kmr = (userData.kmr || 0) + task.reward.amount;
  else if (task.reward.type === 'banknot') userData.banknot = (userData.banknot || 0) + task.reward.amount;

  saveUserData();
  renderTopbar();
  if (currentScreen === 'profile') renderDailyTasks();
  showToast(`✅ Görev tamamlandı: ${task.name}! +${formatNum(task.reward.amount)} ${task.reward.type === 'kmr' ? '🪨' : '💵'}`, 'success');
}

// ============================================
//   BAŞARIMLAR
// ============================================
function checkAchievement(id) {
  if (!userData) return;
  if ((userData.achievements || []).includes(id)) return;

  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;

  if (!userData.achievements) userData.achievements = [];
  userData.achievements.push(id);

  // Ödül ver
  if (a.reward.type === 'banknot') userData.banknot = (userData.banknot || 0) + a.reward.amount;
  else if (a.reward.type === 'cheque') userData.cheque = (userData.cheque || 0) + a.reward.amount;
  else if (a.reward.type === 'kmr') userData.kmr = (userData.kmr || 0) + a.reward.amount;

  saveUserData();
  showToast(`🏆 Başarım: ${a.name}! +${formatNum(a.reward.amount)} ödül!`, 'success');
}

function checkPowerAchievements() {
  const power = calcPower();
  if (power >= 100) checkAchievement('power_100');
  if (power >= 500) checkAchievement('power_500');
}

// ============================================
//   ÇIKIŞŞ
// ============================================
window.doLogout = async function() {
  if (confirm('Çıkış yapmak istediğine emin misin?')) {
    clearInterval(mineInterval);
    clearInterval(leagueInterval);
    if (userData) saveUserData();
    await auth.signOut();
    userData = null;
    currentUser = null;
    showAuthScreen();
  }
};

// ============================================
//   YARDIMCI FONKSİYONLAR
// ============================================
function formatNum(n) {
  if (n === undefined || n === null) return '0';
  n = Math.floor(n);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function rarityName(r) {
  const names = { common: 'SIRADAN', uncommon: 'NADIR', rare: 'EPİK', epic: 'SÜPER', legendary: 'EFSANE', mythic: 'MİTOLOJİK' };
  return names[r] || r.toUpperCase();
}

let toastTimeout = null;
function showToast(msg, type = 'info') {
  const toast = $('toast');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  $('toast-icon').textContent = icons[type] || 'ℹ️';
  $('toast-msg').textContent = msg;
  toast.className = 'toast ' + type;
  setTimeout(() => toast.classList.add('show'), 10);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
}

// Mağara girişi animasyonu
window.enterCave = function() {
  completeTask('visit_mine');
  const cave = document.querySelector('.cave-scene');
  cave.style.transform = 'scale(1.05)';
  setTimeout(() => cave.style.transform = '', 300);
  showToast('⛏️ Madeniniz aktif! KMR kazanıyorsunuz.', 'info');
};
