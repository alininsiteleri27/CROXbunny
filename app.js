// ═══════════════════════════════════════
//  NEONDRIVE — app.js
//  Firebase Auth + Game Logic
// ═══════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  query,
  orderByChild,
  limitToLast
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ── Firebase Config ──
const firebaseConfig = {
  apiKey: "AIzaSyD88CFBRWV8YM49V_YDjluMFXUIQO8V1iM",
  authDomain: "mht4-aa21c.firebaseapp.com",
  databaseURL: "https://mht4-aa21c-default-rtdb.firebaseio.com",
  projectId: "mht4-aa21c",
  storageBucket: "mht4-aa21c.firebasestorage.app",
  messagingSenderId: "681370223057",
  appId: "1:681370223057:web:4074c8f6793b9aad5860f0",
  measurementId: "G-JNEZGMPJ28"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ── Global State ──
let currentUser = null;
let userData = null;
let gameRunning = false;
let gamePaused = false;
let animationId = null;

// ════════════════════════════════════════
//  AUTH STATE
// ════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadUserData(user.uid);
    showScreen("mainScreen");
    showSection("games");
    updateNavbar();
  } else {
    currentUser = null;
    userData = null;
    showScreen("loginScreen");
  }
});

// ── Load user data from DB ──
async function loadUserData(uid) {
  const snap = await get(ref(db, `users/${uid}`));
  if (snap.exists()) {
    userData = snap.val();
  } else {
    // New user — create profile
    userData = {
      username: currentUser.email.split("@")[0],
      email: currentUser.email,
      score: 0,
      coins: 100,
      gamesPlayed: 0,
      level: 1,
      achievements: [],
      inventory: [],
      createdAt: Date.now()
    };
    await set(ref(db, `users/${uid}`), userData);
  }
}

async function saveUserData() {
  if (!currentUser) return;
  await update(ref(db, `users/${currentUser.uid}`), userData);
}

// ════════════════════════════════════════
//  AUTH FUNCTIONS (global)
// ════════════════════════════════════════
window.switchTab = (tab) => {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".auth-form").forEach(f => f.classList.add("hidden"));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add("active");
  document.getElementById(`${tab}Form`).classList.remove("hidden");
  clearMessage();
};

window.loginUser = async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const pass  = document.getElementById("loginPassword").value;
  if (!email || !pass) { showMessage("E-posta ve şifre gerekli!", "error"); return; }
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    showMessage(firebaseError(e.code), "error");
  }
};

window.registerUser = async () => {
  const username = document.getElementById("regUsername").value.trim();
  const email    = document.getElementById("regEmail").value.trim();
  const pass     = document.getElementById("regPassword").value;
  if (!username || !email || !pass) { showMessage("Tüm alanları doldur!", "error"); return; }
  if (pass.length < 6) { showMessage("Şifre en az 6 karakter olmalı!", "error"); return; }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    userData = {
      username, email,
      score: 0, coins: 100, gamesPlayed: 0,
      level: 1, achievements: [], inventory: [],
      createdAt: Date.now()
    };
    await set(ref(db, `users/${cred.user.uid}`), userData);
    showMessage("Hesap oluşturuldu! Giriş yapılıyor...", "success");
  } catch (e) {
    showMessage(firebaseError(e.code), "error");
  }
};

window.forgotPassword = async () => {
  const email = document.getElementById("loginEmail").value.trim();
  if (!email) { showMessage("E-postanı gir!", "error"); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Sıfırlama maili gönderildi!", "success");
  } catch (e) {
    showMessage(firebaseError(e.code), "error");
  }
};

window.logoutUser = async () => {
  if (gameRunning) stopGame();
  await signOut(auth);
  closeProfile();
};

// ════════════════════════════════════════
//  UI HELPERS
// ════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.add("hidden"); s.classList.remove("active");
  });
  const s = document.getElementById(id);
  s.classList.remove("hidden"); s.classList.add("active");
}

window.showSection = (name) => {
  document.querySelectorAll(".section").forEach(s => {
    s.classList.add("hidden"); s.classList.remove("active");
  });
  const el = document.getElementById(`section-${name}`);
  if (el) { el.classList.remove("hidden"); el.classList.add("active"); }

  if (name === "leaderboard") loadLeaderboard();
  if (name === "achievements") renderAchievements();
  if (name === "store") document.getElementById("storeCoins").textContent = `${userData?.coins || 0} 🪙`;
};

function updateNavbar() {
  if (!userData) return;
  const initial = (userData.username || "?")[0].toUpperCase();
  document.getElementById("navAvatar").textContent = initial;
  document.getElementById("profileAvatar").textContent = initial;
  document.getElementById("navUsername").textContent = userData.username || "Oyuncu";
  document.getElementById("navLevel").textContent = `⭐ Seviye ${userData.level || 1}`;
}

window.toggleMenu = () => {
  document.getElementById("menuOverlay").classList.toggle("hidden");
};

window.openProfile = () => {
  if (!userData) return;
  const d = userData;
  document.getElementById("profileName").textContent = d.username;
  document.getElementById("profileEmail").textContent = d.email;
  document.getElementById("profileLevelBig").textContent = `⭐ Seviye ${d.level}`;
  document.getElementById("profileScore").textContent = d.score.toLocaleString();
  document.getElementById("profileCoins").textContent = d.coins;
  document.getElementById("profileGames").textContent = d.gamesPlayed;
  document.getElementById("profileAvatar").textContent = (d.username || "?")[0].toUpperCase();
  document.getElementById("profileModal").classList.remove("hidden");
};

window.closeProfile = () => {
  document.getElementById("profileModal").classList.add("hidden");
};

function showMessage(msg, type = "") {
  const el = document.getElementById("authMessage");
  el.textContent = msg;
  el.className = `auth-message ${type}`;
}
function clearMessage() { showMessage(""); }

function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

function firebaseError(code) {
  const map = {
    "auth/user-not-found": "Kullanıcı bulunamadı.",
    "auth/wrong-password": "Hatalı şifre.",
    "auth/email-already-in-use": "Bu e-posta zaten kayıtlı.",
    "auth/invalid-email": "Geçersiz e-posta.",
    "auth/weak-password": "Şifre çok zayıf.",
    "auth/network-request-failed": "Ağ bağlantısı hatası.",
    "auth/invalid-credential": "E-posta veya şifre hatalı.",
  };
  return map[code] || "Bir hata oluştu: " + code;
}

// ════════════════════════════════════════
//  LEADERBOARD
// ════════════════════════════════════════
function loadLeaderboard() {
  const listEl = document.getElementById("leaderboardList");
  listEl.innerHTML = '<div class="lb-loading">Yükleniyor...</div>';

  const q = query(ref(db, "users"), orderByChild("score"), limitToLast(20));
  onValue(q, (snap) => {
    const players = [];
    snap.forEach(child => players.push({ ...child.val(), uid: child.key }));
    players.sort((a, b) => b.score - a.score);

    if (players.length === 0) {
      listEl.innerHTML = '<div class="lb-loading">Henüz kayıt yok.</div>';
      return;
    }

    listEl.innerHTML = players.map((p, i) => {
      const rankClass = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
      return `
        <div class="lb-row">
          <span class="lb-rank ${rankClass}">${medal}</span>
          <span class="lb-name">${p.username || "?"}</span>
          <span class="lb-score">${p.score.toLocaleString()}</span>
          <span class="lb-level">Sv. ${p.level || 1}</span>
        </div>`;
    }).join("");
  }, { onlyOnce: true });
}

// ════════════════════════════════════════
//  ACHIEVEMENTS
// ════════════════════════════════════════
const ACHIEVEMENTS = [
  { id: "first_game",   icon: "🎮", name: "İLK OYUN",       desc: "İlk oyununu oynadın!" },
  { id: "score_100",    icon: "💯", name: "YÜZE 100",       desc: "100 skor kazan" },
  { id: "score_500",    icon: "🔥", name: "ATEŞ OYUNCU",    desc: "500 skor kazan" },
  { id: "score_1000",   icon: "⚡", name: "ŞIMŞEK",         desc: "1000 skor kazan" },
  { id: "score_5000",   icon: "🏆", name: "ŞAMPİYON",       desc: "5000 skor kazan" },
  { id: "games_5",      icon: "🎯", name: "KARARLI",        desc: "5 oyun oyna" },
  { id: "games_10",     icon: "🌟", name: "DENEYİMLİ",      desc: "10 oyun oyna" },
  { id: "buy_item",     icon: "🛒", name: "ALIŞVERİŞ",      desc: "Mağazadan ürün al" },
  { id: "level_5",      icon: "🚀", name: "YÜKSELİŞ",       desc: "Seviye 5'e ulaş" },
];

function renderAchievements() {
  const grid = document.getElementById("achievementsGrid");
  const unlocked = userData?.achievements || [];
  grid.innerHTML = ACHIEVEMENTS.map(a => `
    <div class="achievement-item ${unlocked.includes(a.id) ? "unlocked" : "locked"}">
      <div class="achievement-icon">${a.icon}</div>
      <div class="achievement-name">${a.name}</div>
      <div class="achievement-desc">${a.desc}</div>
    </div>
  `).join("");
}

function checkAchievements() {
  if (!userData) return;
  const unlocked = userData.achievements || [];
  const newOnes = [];

  const check = (id, cond) => {
    if (cond && !unlocked.includes(id)) { unlocked.push(id); newOnes.push(id); }
  };

  check("first_game",  userData.gamesPlayed >= 1);
  check("score_100",   userData.score >= 100);
  check("score_500",   userData.score >= 500);
  check("score_1000",  userData.score >= 1000);
  check("score_5000",  userData.score >= 5000);
  check("games_5",     userData.gamesPlayed >= 5);
  check("games_10",    userData.gamesPlayed >= 10);
  check("buy_item",    (userData.inventory || []).length >= 1);
  check("level_5",     userData.level >= 5);

  if (newOnes.length > 0) {
    userData.achievements = unlocked;
    const a = ACHIEVEMENTS.find(x => x.id === newOnes[0]);
    if (a) showToast(`🎖 Başarım açıldı: ${a.name}`);
  }
}

// ════════════════════════════════════════
//  STORE
// ════════════════════════════════════════
window.buyItem = (id, price) => {
  if (!userData) return;
  if (userData.coins < price) { showToast("Yeterli coin yok!", "error"); return; }
  if ((userData.inventory || []).includes(id)) { showToast("Bu ürün zaten sende!", "error"); return; }
  userData.coins -= price;
  userData.inventory = [...(userData.inventory || []), id];
  document.getElementById("storeCoins").textContent = `${userData.coins} 🪙`;
  checkAchievements();
  saveUserData();
  showToast("✅ Satın alındı!");
};

// ════════════════════════════════════════
//  CAR GAME ENGINE
// ════════════════════════════════════════
let canvas, ctx;
let car, obstacles = [], coins_arr = [];
let gameScore = 0, gameSpeed = 3, gameSpeedMax = 12;
let gameLives = 3, gameFrame = 0;
let keys = {};
let roadOffset = 0;

const CANVAS_W = 400;
const CANVAS_H = 600;
const ROAD_W = 280;
const ROAD_X = (CANVAS_W - ROAD_W) / 2;
const LANE_W = ROAD_W / 3;

window.startGame = (type) => {
  if (type === "car") {
    showSection("car-game");
    setTimeout(() => {
      canvas = document.getElementById("gameCanvas");
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      ctx = canvas.getContext("2d");
      document.getElementById("gameOverlay").classList.remove("hidden");
      document.getElementById("overlayTitle").textContent = "HAZIR MISIN?";
      document.getElementById("overlayMsg").textContent = "← → veya A D ile sürt";
      document.getElementById("overlayScore").textContent = "";
      document.getElementById("overlayBtn").textContent = "BAŞLA ▶";
      document.getElementById("overlayBtn").onclick = startCarGame;
      drawStartScreen();
    }, 100);
  }
};

function drawStartScreen() {
  if (!ctx) return;
  ctx.fillStyle = "#050810";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawRoad(0);
  drawCar(CANVAS_W / 2, CANVAS_H - 100, "#00f5ff");
}

window.startCarGame = () => {
  document.getElementById("gameOverlay").classList.add("hidden");
  car = { x: CANVAS_W / 2, y: CANVAS_H - 100, w: 34, h: 60, color: "#00f5ff", speed: 5, lane: 1 };
  obstacles = []; coins_arr = [];
  gameScore = 0; gameSpeed = 3; gameLives = 3; gameFrame = 0;
  gameRunning = true; gamePaused = false;
  updateHUD();
  document.removeEventListener("keydown", onKey);
  document.removeEventListener("keyup", offKey);
  document.addEventListener("keydown", onKey);
  document.addEventListener("keyup", offKey);
  if (animationId) cancelAnimationFrame(animationId);
  gameLoop();
};

function onKey(e) { keys[e.key] = true; }
function offKey(e) { keys[e.key] = false; }

window.togglePause = () => {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  document.getElementById("pauseBtn").textContent = gamePaused ? "▶ DEVAM" : "⏸ DURDUR";
  if (!gamePaused) gameLoop();
};

window.exitGame = () => {
  stopGame();
  showSection("games");
};

function stopGame() {
  gameRunning = false;
  if (animationId) cancelAnimationFrame(animationId);
  document.removeEventListener("keydown", onKey);
  document.removeEventListener("keyup", offKey);
}

function gameLoop() {
  if (!gameRunning || gamePaused) return;
  gameFrame++;
  update();
  render();
  animationId = requestAnimationFrame(gameLoop);
}

function update() {
  // Speed ramp
  gameSpeed = Math.min(gameSpeedMax, 3 + gameScore / 300);
  gameScore += Math.ceil(gameSpeed * 0.1);

  // Move car
  const laneTargets = [ROAD_X + LANE_W * 0.5, ROAD_X + LANE_W * 1.5, ROAD_X + LANE_W * 2.5];
  if ((keys["ArrowLeft"] || keys["a"] || keys["A"]) && car.lane > 0) {
    car.lane = Math.max(0, car.lane - 0.08);
  }
  if ((keys["ArrowRight"] || keys["d"] || keys["D"]) && car.lane < 2) {
    car.lane = Math.min(2, car.lane + 0.08);
  }
  car.x = laneTargets[0] * (car.lane <= 1 ? 1 - car.lane : 0) +
           laneTargets[1] * (car.lane <= 1 ? car.lane : 2 - car.lane) +
           laneTargets[2] * (car.lane >= 1 ? car.lane - 1 : 0);
  // Clamp
  car.x = Math.max(ROAD_X + car.w / 2 + 8, Math.min(ROAD_X + ROAD_W - car.w / 2 - 8, car.x));

  // Road scroll
  roadOffset = (roadOffset + gameSpeed) % 80;

  // Spawn obstacles
  if (gameFrame % Math.max(40, 90 - gameScore / 50) === 0) {
    const lane = Math.floor(Math.random() * 3);
    obstacles.push({
      x: ROAD_X + lane * LANE_W + LANE_W / 2,
      y: -80, w: 30, h: 56,
      color: ["#ff006e","#ff4500","#ff8800"][Math.floor(Math.random()*3)]
    });
  }

  // Spawn coins
  if (gameFrame % 60 === 0) {
    const lane = Math.floor(Math.random() * 3);
    coins_arr.push({ x: ROAD_X + lane * LANE_W + LANE_W / 2, y: -20, r: 10, collected: false });
  }

  // Move obstacles
  obstacles.forEach(o => { o.y += gameSpeed; });
  obstacles = obstacles.filter(o => o.y < CANVAS_H + 100);

  // Move coins
  coins_arr.forEach(c => { c.y += gameSpeed; });
  coins_arr = coins_arr.filter(c => c.y < CANVAS_H + 30 && !c.collected);

  // Collision — obstacles
  obstacles.forEach((o, i) => {
    if (rectsCollide(car, o)) {
      obstacles.splice(i, 1);
      gameLives--;
      updateHUD();
      screenFlash();
      if (gameLives <= 0) gameOver();
    }
  });

  // Collision — coins
  coins_arr.forEach(c => {
    if (!c.collected && circleRectCollide(c, car)) {
      c.collected = true;
      gameScore += 50;
      if (userData) userData.coins = (userData.coins || 0) + 1;
    }
  });

  updateHUD();
}

function rectsCollide(a, o) {
  return Math.abs(a.x - o.x) < (a.w / 2 + o.w / 2) - 6 &&
         Math.abs(a.y - o.y) < (a.h / 2 + o.h / 2) - 10;
}
function circleRectCollide(c, r) {
  return Math.abs(c.x - r.x) < r.w / 2 + c.r &&
         Math.abs(c.y - r.y) < r.h / 2 + c.r;
}

function updateHUD() {
  document.getElementById("score").textContent = gameScore.toLocaleString();
  document.getElementById("speed").textContent = Math.round(gameSpeed * 20);
  document.getElementById("lives").textContent = "❤️".repeat(Math.max(0, gameLives));
}

function screenFlash() {
  const c = document.getElementById("gameCanvas");
  c.style.outline = "4px solid #ff006e";
  setTimeout(() => c.style.outline = "", 300);
}

function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  document.removeEventListener("keydown", onKey);
  document.removeEventListener("keyup", offKey);

  // Save score
  if (userData && gameScore > (userData.score || 0)) {
    userData.score = gameScore;
  }
  if (userData) {
    userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
    const xpGain = Math.floor(gameScore / 100);
    userData.level = Math.max(1, Math.floor(Math.sqrt((userData.score || 0) / 100)) + 1);
    checkAchievements();
    saveUserData();
    updateNavbar();
  }

  document.getElementById("overlayTitle").textContent = "OYUN BİTTİ";
  document.getElementById("overlayMsg").textContent = "Harika bir sürüş!";
  document.getElementById("overlayScore").textContent = `SKOR: ${gameScore.toLocaleString()}`;
  document.getElementById("overlayBtn").textContent = "TEKRAR OYNA ▶";
  document.getElementById("overlayBtn").onclick = startCarGame;
  document.getElementById("gameOverlay").classList.remove("hidden");
}

// ── Render ──
function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBackground();
  drawRoad(roadOffset);
  coins_arr.forEach(c => { if (!c.collected) drawCoin(c); });
  obstacles.forEach(o => drawObstacleCar(o));
  drawCar(car.x, car.y, car.color);
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, "#050810");
  grad.addColorStop(1, "#0a0f1e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Stars
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  for (let i = 0; i < 30; i++) {
    const x = ((i * 137 + gameFrame * 0.2) % CANVAS_W);
    const y = ((i * 97 + gameFrame * 0.1) % CANVAS_H);
    ctx.fillRect(x, y, 1, 1);
  }
}

function drawRoad(offset) {
  // Road base
  ctx.fillStyle = "#111827";
  ctx.fillRect(ROAD_X, 0, ROAD_W, CANVAS_H);

  // Edges glow
  ctx.shadowColor = "#00f5ff";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "#00f5ff";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ROAD_X, 0); ctx.lineTo(ROAD_X, CANVAS_H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ROAD_X + ROAD_W, 0); ctx.lineTo(ROAD_X + ROAD_W, CANVAS_H); ctx.stroke();
  ctx.shadowBlur = 0;

  // Lane dashes
  ctx.setLineDash([30, 20]);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  for (let lane = 1; lane < 3; lane++) {
    const lx = ROAD_X + lane * LANE_W;
    ctx.beginPath();
    for (let y = -80 + offset; y < CANVAS_H + 80; y += 80) {
      ctx.moveTo(lx, y);
      ctx.lineTo(lx, y + 40);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCar(x, y, color) {
  ctx.save();
  ctx.translate(x, y);

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-13, -28, 26, 56, 6);
  ctx.fill();

  // Cabin
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.beginPath();
  ctx.roundRect(-9, -22, 18, 28, 4);
  ctx.fill();

  // Headlights
  ctx.fillStyle = "#ffe600";
  ctx.shadowColor = "#ffe600";
  ctx.shadowBlur = 8;
  ctx.fillRect(-11, -30, 6, 4);
  ctx.fillRect(5, -30, 6, 4);

  // Tail lights
  ctx.fillStyle = "#ff006e";
  ctx.fillRect(-11, 26, 6, 4);
  ctx.fillRect(5, 26, 6, 4);

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawObstacleCar(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(Math.PI); // facing down

  ctx.shadowColor = o.color;
  ctx.shadowBlur = 15;
  ctx.fillStyle = o.color;
  ctx.beginPath();
  ctx.roundRect(-13, -28, 26, 56, 6);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.roundRect(-9, -22, 18, 28, 4);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawCoin(c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.shadowColor = "#ffe600";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#ffe600";
  ctx.beginPath();
  ctx.arc(0, 0, c.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#050810";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🪙", 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
}
