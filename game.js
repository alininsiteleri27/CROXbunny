// ============================================================
//  SapanKing - game.js
//  Firebase Auth + Firestore (no Storage)
// ============================================================

// ---------- FIREBASE CONFIG ----------
// !! Kendi Firebase projenin bilgilerini buraya gir !!
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
let currentUser  = null;   // Firebase user obj
let userData     = {};     // Firestore data
let soundEnabled = true;
let musicEnabled = true;
let overlayCallback = null;

// ---------- LEVEL CONFIG ----------
// Her level için gereken toplam puan ve o leveldeki atış hakkı/bardak sayısı
const LEVELS = [
  // {minPts, cups, balls, pts_per_cup, target_cups}
  { minPts:     0, cups:  4, balls: 7, ptsPerCup:  8, targetCups: 4  }, // Lv1
  { minPts:   200, cups:  5, balls: 7, ptsPerCup: 10, targetCups: 4  }, // Lv2
  { minPts:   500, cups:  6, balls: 7, ptsPerCup: 12, targetCups: 5  }, // Lv3
  { minPts:   900, cups:  7, balls: 6, ptsPerCup: 14, targetCups: 5  }, // Lv4
  { minPts:  1400, cups:  8, balls: 6, ptsPerCup: 15, targetCups: 6  }, // Lv5
  { minPts:  2000, cups:  9, balls: 6, ptsPerCup: 16, targetCups: 7  }, // Lv6
  { minPts:  2700, cups: 10, balls: 5, ptsPerCup: 18, targetCups: 8  }, // Lv7
  { minPts:  3500, cups: 11, balls: 5, ptsPerCup: 20, targetCups: 9  }, // Lv8
  { minPts:  4500, cups: 12, balls: 5, ptsPerCup: 22, targetCups:10  }, // Lv9
  { minPts:  6000, cups: 14, balls: 5, ptsPerCup: 25, targetCups:12  }, // Lv10+
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
}

// ============================================================
//  AUTH TABS
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
  el.textContent = msg;
  el.className = 'auth-msg' + (isError ? '' : ' success');
}

// ============================================================
//  AUTH FUNCTIONS
// ============================================================
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) return setMsg('auth-msg', 'Lütfen tüm alanları doldur.');
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(e) {
    setMsg('auth-msg', firebaseErrTR(e.code));
  }
}

async function doRegister() {
  const username = document.getElementById('reg-user').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const pass     = document.getElementById('reg-pass').value;
  if (!username || !email || !pass) return setMsg('auth-msg', 'Lütfen tüm alanları doldur.');
  if (pass.length < 6) return setMsg('auth-msg', 'Şifre en az 6 karakter olmalı.');
  // Check username unique - sadece kayıtlı kullanıcılarda kontrol et
  try {
    const snap = await db.collection('users').where('username','==',username).get();
    if (!snap.empty) return setMsg('auth-msg', 'Bu kullanıcı adı zaten alınmış.');
  } catch(e) { /* rules henüz izin vermiyorsa geç */ }
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await db.collection('users').doc(cred.user.uid).set({
      username, email,
      points: 0,
      level: 1,
      totalShots: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) {
    setMsg('auth-msg', firebaseErrTR(e.code));
  }
}

async function doGuest() {
  try {
    await auth.signInAnonymously();
  } catch(e) {
    setMsg('auth-msg', firebaseErrTR(e.code));
  }
}

function doLogout() {
  auth.signOut();
}

function firebaseErrTR(code) {
  const map = {
    'auth/user-not-found':       'Kullanıcı bulunamadı.',
    'auth/wrong-password':       'Şifre yanlış.',
    'auth/email-already-in-use': 'Bu e-posta zaten kullanımda.',
    'auth/invalid-email':        'Geçersiz e-posta adresi.',
    'auth/weak-password':        'Şifre çok zayıf.',
    'auth/network-request-failed':'Bağlantı hatası.',
    'auth/operation-not-allowed':'Misafir girişi devre dışı (Firebase konsolunda etkinleştir).',
  };
  return map[code] || 'Bir hata oluştu: ' + code;
}

// ============================================================
//  AUTH STATE OBSERVER
// ============================================================
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    if (user.isAnonymous) {
      userData = { username: 'Misafir', email: '', points: 0, level: 1, totalShots: 0 };
      // Create temp doc
      const docRef = db.collection('users').doc(user.uid);
      const snap = await docRef.get();
      if (!snap.exists) {
        await docRef.set({ username: 'Misafir#'+Math.floor(Math.random()*9999), email:'', points:0, level:1, totalShots:0, isGuest:true, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      userData = (await docRef.get()).data();
    } else {
      const snap = await db.collection('users').doc(user.uid).get();
      userData = snap.exists ? snap.data() : { username: user.email, email: user.email, points: 0, level: 1, totalShots: 0 };
    }
    updateNavUI();
    showScreen('menu-screen');
  } else {
    currentUser = null;
    userData = {};
    showScreen('auth-screen');
  }
});

function updateNavUI() {
  const lv = getLevel(userData.points || 0);
  document.getElementById('nav-username').textContent = userData.username || 'Oyuncu';
  document.getElementById('nav-level').textContent = '⚡ Lv.' + lv;
  document.getElementById('nav-points').textContent = (userData.points || 0).toLocaleString('tr-TR');
}

// ============================================================
//  PROFILE
// ============================================================
async function refreshProfile() {
  if (!currentUser) return;
  const pts  = userData.points || 0;
  const lv   = getLevel(pts);
  const next = getNextLevelPts(pts);
  const curMin = LEVELS[Math.min(lv-1, LEVELS.length-1)].minPts;
  const nextMin = next || curMin + 1000;
  const pct = Math.min(100, Math.round(((pts - curMin) / (nextMin - curMin)) * 100));

  document.getElementById('profile-username').textContent = userData.username || 'Misafir';
  document.getElementById('profile-email').textContent    = userData.email || '-';
  document.getElementById('ps-level').textContent  = lv;
  document.getElementById('ps-points').textContent = pts.toLocaleString('tr-TR');
  document.getElementById('ps-shots').textContent  = userData.totalShots || 0;
  document.getElementById('level-fill').style.width = pct + '%';
  document.getElementById('next-level-pts').textContent = next ? (next - pts) + ' puan' : 'Max level!';

  // Rank
  try {
    const snap = await db.collection('users').orderBy('points','desc').get();
    let rank = 1;
    snap.forEach(d => { if (d.id === currentUser.uid) return; if ((d.data().points||0) > pts) rank++; });
    document.getElementById('ps-rank').textContent = '#' + rank;
    document.getElementById('nav-rank').textContent = '#' + rank;
  } catch(e) {}
}

// ============================================================
//  WALLET
// ============================================================
function refreshWallet() {
  const pts = userData.points || 0;
  const tl  = (pts / 1000 * 10).toFixed(2);
  document.getElementById('w-points').textContent = pts.toLocaleString('tr-TR');
  document.getElementById('w-tl').textContent = tl;
  loadWithdrawHistory();
}
function switchWTab(tab) {
  document.querySelectorAll('.wtab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.wform').forEach(f => f.classList.remove('active'));
  document.getElementById('wtab-' + tab).classList.add('active');
  document.getElementById('wform-' + tab).classList.add('active');
  setMsg('withdraw-msg', '', false);
}
async function submitWithdraw() {
  if (!currentUser || userData.isGuest) return setMsg('withdraw-msg','Misafirler çekim yapamaz. Kayıt ol!');
  const pts = userData.points || 0;
  const isIban = document.getElementById('wtab-iban').classList.contains('active');
  let amount, payload;
  if (isIban) {
    const iban   = document.getElementById('w-iban').value.trim();
    const name   = document.getElementById('w-fullname').value.trim();
    amount       = parseInt(document.getElementById('w-amount-iban').value) || 0;
    if (!iban || !name || !amount) return setMsg('withdraw-msg','Lütfen tüm alanları doldur.');
    payload = { type:'iban', iban, fullName:name };
  } else {
    const ctype  = document.getElementById('w-crypto-type').value;
    const addr   = document.getElementById('w-crypto-addr').value.trim();
    amount       = parseInt(document.getElementById('w-amount-crypto').value) || 0;
    if (!addr || !amount) return setMsg('withdraw-msg','Lütfen tüm alanları doldur.');
    payload = { type:'crypto', cryptoType:ctype, address:addr };
  }
  if (amount < 5000) return setMsg('withdraw-msg','Minimum çekim 5.000 puan (50 TL).');
  if (amount > pts)  return setMsg('withdraw-msg','Yetersiz puan.');

  try {
    const tlAmount = (amount / 1000 * 10).toFixed(2);
    await db.collection('withdrawals').add({
      uid: currentUser.uid,
      username: userData.username,
      points: amount,
      tl: parseFloat(tlAmount),
      status: 'pending',
      ...payload,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Deduct points
    await db.collection('users').doc(currentUser.uid).update({
      points: firebase.firestore.FieldValue.increment(-amount)
    });
    userData.points = pts - amount;
    updateNavUI();
    refreshWallet();

    // EmailJS - Admin'e bildirim gönder
    try {
      await emailjs.send('service_eckhy9k', 'template_rovuigj', {
        username: userData.username || 'Bilinmiyor',
        points:   amount.toLocaleString('tr-TR') + ' puan',
        tl:       parseFloat(tlAmount).toFixed(2) + ' TL',
        method:   payload.type === 'iban'
                    ? '🏦 IBAN - ' + payload.fullName
                    : '₿ Kripto (' + payload.cryptoType + ')',
        address:  payload.type === 'iban' ? payload.iban : payload.address,
        date:     new Date().toLocaleString('tr-TR'),
        uid:      currentUser.uid
      });
    } catch(mailErr) {
      console.warn('Mail gönderilemedi:', mailErr);
      // Mail gitmese de çekim talebi Firestore'a kaydedildi, sorun değil
    }

    setMsg('withdraw-msg','✅ Talebiniz alındı! En kısa sürede işleme alınacak.', false);
  } catch(e) {
    setMsg('withdraw-msg','Hata: ' + e.message);
  }
}
async function loadWithdrawHistory() {
  if (!currentUser) return;
  const list = document.getElementById('withdraw-list');
  try {
    const snap = await db.collection('withdrawals')
      .where('uid','==',currentUser.uid)
      .orderBy('createdAt','desc')
      .limit(10).get();
    if (snap.empty) { list.innerHTML = '<div class="empty-state">Henüz talep yok</div>'; return; }
    list.innerHTML = '';
    snap.forEach(d => {
      const w = d.data();
      const date = w.createdAt ? w.createdAt.toDate().toLocaleDateString('tr-TR') : '-';
      const statusClass = {pending:'w-status-pending', done:'w-status-done', rejected:'w-status-rejected'}[w.status] || '';
      const statusTxt   = {pending:'Beklemede', done:'Ödendi', rejected:'Reddedildi'}[w.status] || w.status;
      list.innerHTML += `
        <div class="withdraw-item">
          <div>
            <div style="font-weight:700">${w.points.toLocaleString('tr-TR')} puan</div>
            <div style="color:var(--text2);font-size:0.78rem">${w.tl} TL · ${w.type === 'iban' ? '🏦 IBAN' : '₿ Kripto'} · ${date}</div>
          </div>
          <span class="${statusClass}">${statusTxt}</span>
        </div>`;
    });
  } catch(e) {
    list.innerHTML = '<div class="empty-state">Yüklenemedi</div>';
  }
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
    let myRank = '-'; let myPts = userData.points || 0;
    let rank = 1;
    snap.forEach(d => {
      const u = d.data();
      const isMe = d.id === currentUser?.uid;
      if (isMe) myRank = rank;
      const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
      const lv = getLevel(u.points || 0);
      list.innerHTML += `
        <div class="lb-item ${isMe ? 'me' : ''}">
          <div class="lb-rank ${rankClass}">${rank}</div>
          <div class="lb-info">
            <div class="lb-name">${u.username || 'Oyuncu'} ${isMe ? '👈' : ''}</div>
            <div class="lb-lvl">Lv.${lv}</div>
          </div>
          <div class="lb-pts">${(u.points||0).toLocaleString('tr-TR')}</div>
        </div>`;
      rank++;
    });
    document.getElementById('lb-rank-num').textContent = myRank !== '-' ? '#' + myRank : '#'+rank;
    document.getElementById('lb-rank-pts').textContent = myPts.toLocaleString('tr-TR');
    document.getElementById('nav-rank').textContent = myRank !== '-' ? '#' + myRank : '#-';
  } catch(e) {
    list.innerHTML = '<div class="empty-state">Sıralama yüklenemedi</div>';
  }
}

// ============================================================
//  SETTINGS
// ============================================================
function toggleSoundSetting() { soundEnabled = document.getElementById('set-sound').checked; }
function toggleMusic() { musicEnabled = document.getElementById('set-music').checked; }
function toggleDark() { document.body.classList.toggle('dark-mode', document.getElementById('set-dark').checked); }
function toggleSound() {
  soundEnabled = !soundEnabled;
  document.getElementById('sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
  document.getElementById('set-sound').checked = soundEnabled;
}

// ============================================================
//  SOUND (Web Audio API)
// ============================================================
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, type, duration, vol=0.3) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}
function sfxLaunch()  { playTone(300,'sawtooth',0.15,0.2); }
function sfxHit()     { playTone(180,'square',0.1,0.3); playTone(260,'square',0.05,0.2); }
function sfxMiss()    { playTone(120,'sine',0.3,0.2); }
function sfxWin()     { [523,659,784,1047].forEach((f,i) => setTimeout(()=>playTone(f,'sine',0.4),i*100)); }
function sfxFail()    { [300,200,150].forEach((f,i) => setTimeout(()=>playTone(f,'sawtooth',0.3),i*150)); }

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

  const cups = [];
  const stars = [];
  for (let i = 0; i < 12; i++) {
    cups.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 20 + Math.random() * 30,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -0.3 - Math.random() * 0.5,
      opacity: 0.05 + Math.random() * 0.12,
      emoji: ['🥤','🏹','⭐','💰','🎯'][Math.floor(Math.random()*5)]
    });
  }
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.5 + Math.random() * 2,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.04
    });
  }

  if (menuAnimId) cancelAnimationFrame(menuAnimId);
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Gradient bg
    const grad = ctx.createRadialGradient(canvas.width/2,canvas.height/2,0,canvas.width/2,canvas.height/2,canvas.width);
    grad.addColorStop(0,'#1a1445');
    grad.addColorStop(1,'#0f0c1d');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Stars
    stars.forEach(s => {
      s.twinkle += s.speed;
      const alpha = 0.3 + 0.4 * Math.sin(s.twinkle);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,240,180,${alpha})`;
      ctx.fill();
    });

    // Floating emojis
    ctx.font = '28px serif';
    cups.forEach(c => {
      ctx.globalAlpha = c.opacity;
      ctx.fillText(c.emoji, c.x, c.y);
      c.x += c.vx; c.y += c.vy;
      if (c.y < -40) { c.y = canvas.height + 40; c.x = Math.random() * canvas.width; }
      if (c.x < -40) c.x = canvas.width + 40;
      if (c.x > canvas.width + 40) c.x = -40;
    });
    ctx.globalAlpha = 1;
    menuAnimId = requestAnimationFrame(draw);
  }
  draw();
}

// ============================================================
//  GAME ENGINE
// ============================================================
let gameState    = null;
let gameAnimId   = null;
let isDragging   = false;
let dragStart    = { x: 0, y: 0 };
let dragCurrent  = { x: 0, y: 0 };
const MAX_DRAG   = 80;

function startGame() {
  if (menuAnimId) { cancelAnimationFrame(menuAnimId); menuAnimId = null; }
  showScreen('game-screen');
  initGameLevel(getLevel(userData.points || 0));
}
function exitGame() {
  if (gameAnimId) { cancelAnimationFrame(gameAnimId); gameAnimId = null; }
  gameState = null;
  showScreen('menu-screen');
}

function initGameLevel(level) {
  const cfg  = getLevelConfig(level);
  const canvas = document.getElementById('game-canvas');
  canvas.width  = canvas.offsetWidth  || window.innerWidth;
  canvas.height = canvas.offsetHeight || window.innerHeight - 100;

  const cups = buildCups(canvas.width, canvas.height, cfg.cups);
  const sling = {
    x: canvas.width * 0.12,
    y: canvas.height * 0.72,
    forkH: 38,
    armW: 16
  };

  gameState = {
    level, cfg, canvas,
    ctx: canvas.getContext('2d'),
    cups, sling,
    balls: cfg.balls,
    points: 0,
    sessionPoints: 0,
    lives: 3,
    cupsHit: 0,
    totalCups: cups.length,
    particles: [],
    projectile: null,
    launched: false,
    done: false,
    frameCount: 0
  };

  updateGameHUD();
  setupGameInput(canvas);
  if (gameAnimId) cancelAnimationFrame(gameAnimId);
  gameLoop();
}

function buildCups(w, h, count) {
  const cups = [];
  const rows = count <= 5 ? 1 : count <= 10 ? 2 : 3;
  const startX = w * 0.45;
  const cupW = 34, cupH = 40, gapX = 50, gapY = 55;

  let idx = 0;
  for (let r = 0; r < rows && idx < count; r++) {
    const inRow = Math.ceil((count - idx) / (rows - r));
    for (let c = 0; c < inRow && idx < count; c++) {
      cups.push({
        x: startX + c * gapX + (r % 2 === 1 ? gapX/2 : 0),
        y: h * 0.50 - r * gapY,
        w: cupW, h: cupH,
        alive: true,
        shake: 0,
        color: ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6'][idx % 5],
        idx
      });
      idx++;
    }
  }
  return cups;
}

// ---- INPUT ----
function setupGameInput(canvas) {
  canvas.onmousedown = (e) => startDrag(e.offsetX, e.offsetY);
  canvas.onmousemove = (e) => { if (isDragging) moveDrag(e.offsetX, e.offsetY); };
  canvas.onmouseup   = (e) => releaseDrag();
  canvas.onmouseleave = () => { if (isDragging) releaseDrag(); };

  canvas.ontouchstart = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    startDrag(t.clientX - r.left, t.clientY - r.top);
  };
  canvas.ontouchmove  = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    moveDrag(t.clientX - r.left, t.clientY - r.top);
  };
  canvas.ontouchend = () => releaseDrag();
}
function startDrag(x, y) {
  if (!gameState || gameState.launched || gameState.done || gameState.balls <= 0) return;
  if (!gameState.projectile) {
    const s = gameState.sling;
    const bx = s.x, by = s.y - s.forkH;
    if (Math.hypot(x - bx, y - by) < 50) {
      isDragging = true;
      dragStart = { x: bx, y: by };
      dragCurrent = { x, y };
    }
  }
}
function moveDrag(x, y) {
  if (!isDragging) return;
  const dx = x - dragStart.x, dy = y - dragStart.y;
  const dist = Math.min(Math.hypot(dx, dy), MAX_DRAG);
  const angle = Math.atan2(dy, dx);
  dragCurrent = {
    x: dragStart.x + Math.cos(angle) * dist,
    y: dragStart.y + Math.sin(angle) * dist
  };
}
function releaseDrag() {
  if (!isDragging || !gameState) return;
  isDragging = false;
  const dx = dragStart.x - dragCurrent.x;
  const dy = dragStart.y - dragCurrent.y;
  const speed = Math.hypot(dx, dy);
  if (speed < 10) return;
  const power = speed / MAX_DRAG * 18;
  gameState.projectile = {
    x: dragCurrent.x,
    y: dragCurrent.y,
    vx: (dx / speed) * power,
    vy: (dy / speed) * power,
    r: 12,
    trail: []
  };
  gameState.launched = true;
  gameState.balls--;
  gameState.totalShots = (gameState.totalShots || 0) + 1;
  sfxLaunch();
  updateGameHUD();
}

// ---- GAME LOOP ----
function gameLoop() {
  if (!gameState) return;
  update();
  render();
  if (!gameState.done) gameAnimId = requestAnimationFrame(gameLoop);
}

function update() {
  const gs = gameState;
  gs.frameCount++;

  // Particles
  gs.particles = gs.particles.filter(p => p.life > 0);
  gs.particles.forEach(p => {
    p.x += p.vx; p.y += p.vy + 0.2;
    p.vy += 0.15; p.life--;
    p.alpha = p.life / p.maxLife;
  });

  // Cup shake decay
  gs.cups.forEach(c => { if (c.shake > 0) c.shake -= 0.8; });

  // Projectile physics
  if (gs.projectile) {
    const p = gs.projectile;
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 14) p.trail.shift();
    p.vy += 0.45; // gravity
    p.x += p.vx; p.y += p.vy;

    // Hit cups
    gs.cups.forEach(cup => {
      if (!cup.alive) return;
      const cx = cup.x + cup.w/2, cy = cup.y + cup.h/2;
      if (Math.abs(p.x - cx) < (cup.w/2 + p.r) && Math.abs(p.y - cy) < (cup.h/2 + p.r)) {
        cup.alive = false;
        gs.cupsHit++;
        const earned = gs.cfg.ptsPerCup;
        gs.points += earned;
        gs.sessionPoints += earned;
        spawnParticles(cup.x + cup.w/2, cup.y, cup.color, earned);
        sfxHit();
        if (document.getElementById('set-vibrate').checked) navigator.vibrate && navigator.vibrate(30);
        updateGameHUD();
      }
    });

    // Out of bounds
    if (p.y > gs.canvas.height + 60 || p.x < -60 || p.x > gs.canvas.width + 60) {
      gs.projectile = null;
      gs.launched = false;
      sfxMiss();
      checkRoundEnd();
    }
  }
}

function spawnParticles(x, y, color, pts) {
  const gs = gameState;
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = 2 + Math.random() * 4;
    gs.particles.push({
      x, y,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 3,
      r: 2 + Math.random() * 4,
      color, alpha: 1,
      life: 30 + Math.random() * 20,
      maxLife: 50
    });
  }
  // Score popup
  gs.particles.push({
    x, y: y - 10,
    vx: 0, vy: -1.5,
    r: 0, color: '#f7c948',
    alpha: 1, life: 45, maxLife: 45,
    text: '+' + pts
  });
}

function checkRoundEnd() {
  const gs = gameState;
  const aliveCups = gs.cups.filter(c => c.alive).length;
  const allHit    = aliveCups === 0;
  const noAmmo    = gs.balls <= 0;
  const target    = gs.cfg.targetCups;
  const hitEnough = gs.cupsHit >= target;

  if (allHit || (noAmmo && hitEnough)) {
    // Level cleared
    gs.done = true;
    sfxWin();
    setTimeout(() => showOverlay('win'), 600);
  } else if (noAmmo && !hitEnough) {
    // Level failed
    gs.lives--;
    if (gs.lives <= 0) {
      gs.done = true;
      sfxFail();
      setTimeout(() => showOverlay('fail'), 600);
    } else {
      gs.done = true;
      sfxFail();
      setTimeout(() => showOverlay('retry'), 600);
    }
  }
}

function showOverlay(type) {
  const gs = gameState;
  const earned = gs.sessionPoints;
  document.getElementById('game-overlay').classList.remove('hidden');
  if (type === 'win') {
    document.getElementById('overlay-icon').textContent  = '🎉';
    document.getElementById('overlay-title').textContent = 'Level Tamamlandı!';
    document.getElementById('overlay-msg').textContent   = `+${earned} puan kazandın!`;
    document.getElementById('overlay-btn').textContent   = 'Sonraki Level →';
    overlayCallback = async () => {
      await savePoints(earned);
      const newLv = getLevel(userData.points || 0);
      initGameLevel(newLv);
    };
  } else if (type === 'retry') {
    document.getElementById('overlay-icon').textContent  = '😅';
    document.getElementById('overlay-title').textContent = 'Yeterli Bardak Vurulmadı!';
    document.getElementById('overlay-msg').textContent   = `${gs.cupsHit}/${gs.cfg.targetCups} bardak · ❤️ ${gs.lives} can kaldı · +${earned} puan`;
    document.getElementById('overlay-btn').textContent   = 'Tekrar Dene';
    overlayCallback = async () => {
      await savePoints(earned);
      initGameLevel(gs.level);
    };
  } else {
    document.getElementById('overlay-icon').textContent  = '💀';
    document.getElementById('overlay-title').textContent = 'Oyun Bitti!';
    document.getElementById('overlay-msg').textContent   = `+${earned} puan · Canın tükendi!`;
    document.getElementById('overlay-btn').textContent   = 'Ana Menü';
    overlayCallback = async () => {
      await savePoints(earned);
      document.getElementById('game-overlay').classList.add('hidden');
      exitGame();
    };
  }
}
function overlayAction() {
  document.getElementById('game-overlay').classList.add('hidden');
  if (overlayCallback) overlayCallback();
}
async function savePoints(pts) {
  if (!currentUser || pts === 0) return;
  try {
    const newTotal = (userData.points || 0) + pts;
    const newLevel = getLevel(newTotal);
    const newShots = (userData.totalShots || 0) + (gameState?.totalShots || 0);
    await db.collection('users').doc(currentUser.uid).update({
      points: firebase.firestore.FieldValue.increment(pts),
      level: newLevel,
      totalShots: firebase.firestore.FieldValue.increment(gameState?.totalShots || 0)
    });
    userData.points = newTotal;
    userData.level  = newLevel;
    userData.totalShots = newShots;
    updateNavUI();
  } catch(e) { console.error('Save error:', e); }
}

// ---- RENDER ----
function render() {
  const gs = gameState;
  const { ctx, canvas, sling, cups, projectile, particles } = gs;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#0f0c1d');
  bg.addColorStop(1, '#1a1630');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = '#2d2850';
  ctx.fillRect(0, canvas.height * 0.78, canvas.width, canvas.height * 0.22);
  ctx.fillStyle = '#3a3570';
  ctx.fillRect(0, canvas.height * 0.78, canvas.width, 6);

  // Target zone indicator
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(247,201,72,0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(canvas.width * 0.4, canvas.height * 0.2, canvas.width * 0.52, canvas.height * 0.45);
  ctx.setLineDash([]);

  // Draw particles
  particles.forEach(p => {
    ctx.globalAlpha = p.alpha;
    if (p.text) {
      ctx.font = 'bold 20px Boogaloo, cursive';
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  // Draw cups
  cups.forEach(cup => {
    if (!cup.alive) return;
    const sx = cup.shake > 0 ? (Math.random() - 0.5) * cup.shake : 0;
    const x = cup.x + sx, y = cup.y;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + cup.w/2, y + cup.h + 3, cup.w/2, 5, 0, 0, Math.PI*2);
    ctx.fill();

    // Cup body
    ctx.fillStyle = cup.color;
    ctx.beginPath();
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + cup.w - 4, y);
    ctx.lineTo(x + cup.w, y + cup.h);
    ctx.lineTo(x, y + cup.h);
    ctx.closePath();
    ctx.fill();

    // Cup shine
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 4);
    ctx.lineTo(x + 12, y + 4);
    ctx.lineTo(x + 10, y + cup.h - 6);
    ctx.lineTo(x + 5, y + cup.h - 6);
    ctx.closePath();
    ctx.fill();

    // Cup rim
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + 2, y, cup.w - 4, 5);
  });

  // Sling rubber band (when dragging)
  if (isDragging || (projectile && !gs.launched)) {
    const sx = sling.x, sy = sling.y - sling.forkH;
    const tx = isDragging ? dragCurrent.x : projectile?.x;
    const ty = isDragging ? dragCurrent.y : projectile?.y;
    ctx.strokeStyle = '#a0522d';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx - 8, sy); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 8, sy); ctx.lineTo(tx, ty); ctx.stroke();
  }

  // Sling structure
  drawSling(ctx, sling, canvas.height);

  // Ball on sling (waiting)
  if (!isDragging && !projectile && !gs.done && gs.balls > 0) {
    const bx = sling.x, by = sling.y - sling.forkH;
    drawBall(ctx, bx, by, 12);
    // Hint arrows
    if (gs.frameCount % 60 < 30) {
      ctx.fillStyle = 'rgba(247,201,72,0.6)';
      ctx.font = '14px sans-serif';
      ctx.fillText('← Çek!', bx - 55, by - 18);
    }
  }

  // Ball while dragging
  if (isDragging) {
    // Elastic indicator
    const dx = dragStart.x - dragCurrent.x, dy = dragStart.y - dragCurrent.y;
    const pct = Math.min(Math.hypot(dx,dy) / MAX_DRAG, 1);
    ctx.strokeStyle = `rgba(247,201,72,${pct * 0.4})`;
    ctx.setLineDash([4,4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dragCurrent.x, dragCurrent.y);
    const vx = (dx/Math.hypot(dx,dy)||0)*16*pct, vy = (dy/Math.hypot(dx,dy)||0)*16*pct - 0.45*4;
    for (let t = 0; t < 20; t++) {
      const tx2 = dragCurrent.x + vx*t;
      const ty2 = dragCurrent.y + vy*t + 0.45*0.5*t*t;
      if (t === 0) ctx.moveTo(tx2, ty2); else ctx.lineTo(tx2, ty2);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    drawBall(ctx, dragCurrent.x, dragCurrent.y, 12);
  }

  // Projectile in flight
  if (projectile) {
    // Trail
    projectile.trail.forEach((pt, i) => {
      const alpha = i / projectile.trail.length * 0.5;
      const r = 4 + (i / projectile.trail.length) * 8;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI*2);
      ctx.fillStyle = '#f7c948';
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    drawBall(ctx, projectile.x, projectile.y, projectile.r);
  }

  // Progress bar
  const pct = gs.cupsHit / gs.cfg.targetCups;
  document.getElementById('game-progress').style.width = Math.min(pct*100,100) + '%';
}

function drawSling(ctx, s, canvasH) {
  // Post
  ctx.fillStyle = '#6b3a1f';
  ctx.fillRect(s.x - s.armW/2, s.y - s.forkH - 10, s.armW, s.forkH + 10 + canvasH * 0.22);

  // Fork left
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = s.armW * 0.7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s.x, s.y - s.forkH + 6);
  ctx.lineTo(s.x - 16, s.y - s.forkH - 8);
  ctx.stroke();
  // Fork right
  ctx.beginPath();
  ctx.moveTo(s.x, s.y - s.forkH + 6);
  ctx.lineTo(s.x + 16, s.y - s.forkH - 8);
  ctx.stroke();
}

function drawBall(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
  g.addColorStop(0, '#6dd5fa');
  g.addColorStop(0.5,'#2980b9');
  g.addColorStop(1, '#1a4a7a');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Shine
  ctx.beginPath();
  ctx.arc(x - r*0.3, y - r*0.3, r*0.3, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
}

function updateGameHUD() {
  if (!gameState) return;
  const gs = gameState;
  document.getElementById('g-lives').textContent  = gs.lives;
  document.getElementById('g-points').textContent = gs.points.toLocaleString('tr-TR');
  document.getElementById('g-level').textContent  = gs.level;
  document.getElementById('g-balls').textContent  = gs.balls;
}

// ============================================================
//  WINDOW RESIZE
// ============================================================
window.addEventListener('resize', () => {
  if (document.getElementById('menu-screen').classList.contains('active')) initMenuCanvas();
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
  // Auth screen bg animation is CSS-only via float-obj keyframes
  console.log('SapanKing yüklendi 🏹');
});
