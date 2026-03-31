// =============================================
// REISZA MINING & LEAGUE — app.js
// Firebase SDK v10 (Modular) + Full Game Logic
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection,
  query, orderBy, limit, getDocs, onSnapshot, serverTimestamp, increment, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ── Firebase Config ──────────────────────────
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
const db = getFirestore(app);
const storage = getStorage(app);

// ── CONSTANTS ────────────────────────────────
const MINER_TYPES = [
  { id: "kubra",  name: "Kübra",  icon: "👩", cost: 50,  kmrPerSec: 250,  phMult: 2.0,  color: "#00d4ff" },
  { id: "beyza",  name: "Beyza",  icon: "👧", cost: 80,  kmrPerSec: 500,  phMult: 2.5,  color: "#9b59ff" },
  { id: "mehmet", name: "Mehmet", icon: "👦", cost: 125, kmrPerSec: 750,  phMult: 3.0,  color: "#39ff14" },
  { id: "sevki",  name: "Şevki",  icon: "🧔", cost: 180, kmrPerSec: 1000, phMult: 3.5,  color: "#ffa502" },
  { id: "ali",    name: "Ali",    icon: "👑", cost: 300, kmrPerSec: 2000, phMult: 4.0,  color: "#f5c842" }
];

const LEAGUES = [
  { id: "cirak",  name: "Çırak",  icon: "⚔️", minPH: 0,     maxPH: 1000,  pool: 50,   label: "0 – 1.000 PH" },
  { id: "amator", name: "Amatör", icon: "🥊", minPH: 1001,  maxPH: 10000, pool: 200,  label: "1.001 – 10.000 PH" },
  { id: "usta",   name: "Usta",   icon: "👑", minPH: 10001, maxPH: Infinity, pool: 1000, label: "10.001+ PH" }
];

const ITEM_POOL = generateItemPool();
const SLOT_EXPAND_COSTS = [1, 2, 4, 8, 15, 25]; // cost in Çekip per expansion step
const ENERGY_DURATION_HOURS = 24; // full energy lasts 24 hours
const MAX_MINER_LEVEL = 10;

// ── STATE ────────────────────────────────────
let currentUser = null;
let userData = null;
let productionTimer = null;
let uiUpdateTimer = null;
let selectedMinerSlot = null;
let selectedBuyMinerType = null;
let currentLeagueTab = "cirak";
let currentStoreTab = "miners";
let unsubscribeUser = null;

// ── ITEM POOL GENERATOR ───────────────────────
function generateItemPool() {
  const pool = [];
  const emojis = ["⚒️","🪓","🔨","🪚","🔩","⚙️","🛠️","🧲","🔧","🪛",
    "💎","💍","🪙","🏅","🎖️","🥇","🔮","🗡️","🛡️","⚔️",
    "🌟","✨","💫","⚡","🔥","❄️","🌊","🌪️","☄️","🌈"];
  let id = 1;
  // Starter: PH 1-40 (items 1-40)
  for (let i = 0; i < 40; i++) {
    pool.push({ id: `item_${id++}`, name: `${emojis[i % emojis.length]} Starter Eşya ${i+1}`, rarity: "starter", ph: Math.floor(Math.random()*40)+1, icon: emojis[i % emojis.length] });
  }
  // Epic: PH 50-150 (items 41-70)
  for (let i = 0; i < 30; i++) {
    pool.push({ id: `item_${id++}`, name: `${emojis[(i+10) % emojis.length]} Epic Eşya ${i+1}`, rarity: "epic", ph: Math.floor(Math.random()*101)+50, icon: emojis[(i+10) % emojis.length] });
  }
  // Legendary: PH 200-300 (items 71-100)
  for (let i = 0; i < 30; i++) {
    pool.push({ id: `item_${id++}`, name: `${emojis[(i+15) % emojis.length]} Legendary Eşya ${i+1}`, rarity: "legendary", ph: Math.floor(Math.random()*101)+200, icon: emojis[(i+15) % emojis.length] });
  }
  return pool;
}

// ── HELPERS ───────────────────────────────────
function fmt(n) {
  if (n === undefined || n === null) return "0";
  if (n >= 1e9) return (n/1e9).toFixed(1)+"B";
  if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
  if (n >= 1e3) return (n/1e3).toFixed(1)+"K";
  return Math.floor(n).toLocaleString("tr-TR");
}
function fmtDec(n, d=3) { return parseFloat((n||0).toFixed(d)); }
function el(id) { return document.getElementById(id); }
function showToast(msg, type="", dur=2500) {
  const t = el("toast");
  t.textContent = msg; t.className = `toast ${type}`;
  t.classList.remove("hidden");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add("hidden"), dur);
}
function openModal(id) { el(id).classList.remove("hidden"); }
function closeModal(id) { el(id).classList.add("hidden"); }
function closeModalOnBg(e, id) { if (e.target.id === id) closeModal(id); }

// ── SPLASH LOADER ─────────────────────────────
function animateSplash(pct) {
  el("loaderFill").style.width = pct + "%";
  el("loaderText").textContent = pct < 100 ? "Yükleniyor..." : "Hazır!";
}

// ── AUTH FLOW ─────────────────────────────────
window.switchAuthTab = function(tab) {
  el("loginForm").classList.toggle("hidden", tab !== "login");
  el("registerForm").classList.toggle("hidden", tab !== "register");
  el("loginTab").classList.toggle("active", tab === "login");
  el("registerTab").classList.toggle("active", tab === "register");
};

window.handleLogin = async function(e) {
  e.preventDefault();
  const btn = el("loginBtn"); btn.disabled = true;
  const errEl = el("loginError"); errEl.classList.add("hidden");
  try {
    await signInWithEmailAndPassword(auth, el("loginEmail").value.trim(), el("loginPassword").value);
  } catch(err) {
    errEl.textContent = getAuthError(err.code);
    errEl.classList.remove("hidden");
    btn.disabled = false;
  }
};

window.handleRegister = async function(e) {
  e.preventDefault();
  const btn = el("registerBtn"); btn.disabled = true;
  const errEl = el("registerError"); errEl.classList.add("hidden");
  const username = el("regUsername").value.trim();
  const email = el("regEmail").value.trim();
  const password = el("regPassword").value;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await initNewUser(cred.user, username);
  } catch(err) {
    errEl.textContent = getAuthError(err.code);
    errEl.classList.remove("hidden");
    btn.disabled = false;
  }
};

async function initNewUser(user, username) {
  const now = Date.now();
  const starterMiner = {
    typeId: "kubra", level: 1,
    kmrPerSec: 50 / 3600, // 50 KMR/hour => /3600
    energyMax: ENERGY_DURATION_HOURS * 3600,
    energyLeft: ENERGY_DURATION_HOURS * 3600,
    lastEnergyUpdate: now,
    active: true
  };
  const defaultData = {
    username, email: user.email, uid: user.uid,
    kmr: 1000, banknot: 0, cekip: 0,
    miners: [starterMiner],
    maxSlots: 5,
    inventory: [],
    depositedKmr: 0,
    lastDepositCollect: now,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    adminNotif: null, adminNotifAck: true,
    banned: false
  };
  await setDoc(doc(db, "users", user.uid), defaultData);
  showToast("Hesap oluşturuldu! 1.000 KMR hediye! 🎉", "success");
}

window.handleLogout = async function() {
  closeModal("profileModal");
  stopTimers();
  await signOut(auth);
};

function getAuthError(code) {
  const map = {
    "auth/email-already-in-use": "Bu e-posta zaten kullanılıyor.",
    "auth/invalid-email": "Geçersiz e-posta.",
    "auth/weak-password": "Şifre en az 6 karakter olmalı.",
    "auth/user-not-found": "Kullanıcı bulunamadı.",
    "auth/wrong-password": "Yanlış şifre.",
    "auth/invalid-credential": "E-posta veya şifre hatalı.",
    "auth/too-many-requests": "Çok fazla deneme. Lütfen bekleyin."
  };
  return map[code] || "Bir hata oluştu: " + code;
}

// ── AUTH STATE ────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    animateSplash(60);
    await loadUserData(user.uid);
    animateSplash(100);
    setTimeout(() => {
      el("splash-screen").style.opacity = "0";
      setTimeout(() => { el("splash-screen").classList.add("hidden"); }, 500);
      el("auth-screen").classList.add("hidden");
      el("main-app").classList.remove("hidden");
      startTimers();
      renderAll();
      checkAdminNotif();
    }, 400);
  } else {
    currentUser = null; userData = null;
    stopTimers();
    if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
    el("main-app").classList.add("hidden");
    el("splash-screen").style.opacity = "0";
    setTimeout(() => { el("splash-screen").classList.add("hidden"); el("auth-screen").classList.remove("hidden"); }, 600);
  }
});

// ── LOAD & SYNC USER ──────────────────────────
async function loadUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return;
  userData = snap.data();
  syncEnergyOffline();
  subscribeUser(uid);
}

function subscribeUser(uid) {
  if (unsubscribeUser) unsubscribeUser();
  unsubscribeUser = onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) {
      const prev = userData;
      userData = snap.data();
      if (!prev) return;
      syncEnergyOffline();
      updateTopBar();
    }
  });
}

// ── ENERGY SYNC (offline production calc) ─────
function syncEnergyOffline() {
  if (!userData || !userData.miners) return;
  const now = Date.now();
  let kmrAccumulated = 0;
  userData.miners = userData.miners.map(m => {
    if (!m || !m.active) return m;
    const elapsed = (now - (m.lastEnergyUpdate || now)) / 1000; // seconds
    const energyUsed = Math.min(elapsed, m.energyLeft || 0);
    const energyLeft = Math.max(0, (m.energyLeft || 0) - energyUsed);
    if (energyUsed > 0) {
      kmrAccumulated += m.kmrPerSec * energyUsed;
    }
    return { ...m, energyLeft, lastEnergyUpdate: now };
  });
  userData.depositedKmr = (userData.depositedKmr || 0) + kmrAccumulated;
}

// ── PRODUCTION TICK ───────────────────────────
function startTimers() {
  stopTimers();
  productionTimer = setInterval(tickProduction, 1000);
  uiUpdateTimer = setInterval(updateUI, 1000);
}
function stopTimers() {
  clearInterval(productionTimer);
  clearInterval(uiUpdateTimer);
}

function tickProduction() {
  if (!userData || !userData.miners) return;
  const now = Date.now();
  let produced = 0;
  userData.miners = userData.miners.map(m => {
    if (!m || m.energyLeft <= 0) return m;
    const energyLeft = Math.max(0, (m.energyLeft || 0) - 1);
    produced += m.kmrPerSec;
    return { ...m, energyLeft, lastEnergyUpdate: now };
  });
  userData.depositedKmr = (userData.depositedKmr || 0) + produced;
  // Batch write every 30s
  if (!window._saveCounter) window._saveCounter = 0;
  window._saveCounter++;
  if (window._saveCounter >= 30) { saveUserData(); window._saveCounter = 0; }
}

async function saveUserData() {
  if (!currentUser || !userData) return;
  try {
    await updateDoc(doc(db, "users", currentUser.uid), {
      kmr: userData.kmr || 0,
      banknot: userData.banknot || 0,
      cekip: userData.cekip || 0,
      miners: userData.miners || [],
      inventory: userData.inventory || [],
      depositedKmr: userData.depositedKmr || 0,
      maxSlots: userData.maxSlots || 5,
      lastSeen: serverTimestamp()
    });
  } catch(e) { console.warn("Save error:", e); }
}

// ── TOTAL STATS ───────────────────────────────
function calcTotalPH() {
  if (!userData) return 0;
  const inv = userData.inventory || [];
  const miners = userData.miners || [];
  const itemPH = inv.reduce((s, item) => s + (item.ph || 0), 0);
  const maxMult = miners.reduce((max, m) => {
    if (!m) return max;
    const type = MINER_TYPES.find(t => t.id === m.typeId);
    return type ? Math.max(max, type.phMult) : max;
  }, 1);
  return Math.floor(itemPH * maxMult);
}

function calcTotalProduction() {
  if (!userData || !userData.miners) return 0;
  return userData.miners.reduce((s, m) => {
    if (!m || m.energyLeft <= 0) return s;
    return s + (m.kmrPerSec || 0);
  }, 0);
}

function getUserLeague() {
  const ph = calcTotalPH();
  if (ph >= 10001) return LEAGUES[2];
  if (ph >= 1001)  return LEAGUES[1];
  return LEAGUES[0];
}

// ── RENDER ALL ────────────────────────────────
function renderAll() {
  updateTopBar();
  updateUI();
  renderMinersGrid();
  renderInventory();
  renderMinersShop();
  renderFeatured();
}

function updateTopBar() {
  if (!userData) return;
  const initial = (userData.username || "?")[0].toUpperCase();
  el("topAvatar").textContent = initial;
  el("topUserName").textContent = userData.username || "Madenci";
  const league = getUserLeague();
  el("topUserLeague").textContent = `${league.icon} ${league.name}`;
  el("topKmr").textContent = fmt(userData.kmr || 0);
  el("topBanknot").textContent = fmt(userData.banknot || 0);
  el("topCekip").textContent = fmtDec(userData.cekip || 0, 3);
}

function updateUI() {
  if (!userData) return;
  el("totalProduction").textContent = fmt(calcTotalProduction()) + " KMR/s";
  el("totalPH").textContent = fmt(calcTotalPH()) + " PH";
  el("depositAmount").textContent = fmt(userData.depositedKmr || 0) + " KMR";
  // update energy bars in miners grid
  const miners = userData.miners || [];
  document.querySelectorAll(".miner-slot.active-miner, .miner-slot.exhausted").forEach((slot, i) => {
    const m = miners[i];
    if (!m) return;
    const max = m.energyMax || (ENERGY_DURATION_HOURS * 3600);
    const pct = Math.max(0, Math.min(100, ((m.energyLeft || 0) / max) * 100));
    const fill = slot.querySelector(".energy-fill");
    const pctEl = slot.querySelector(".energy-pct");
    if (fill) { fill.style.width = pct + "%"; fill.className = "energy-fill " + (pct > 50 ? "high" : pct > 20 ? "mid" : "low"); }
    if (pctEl) pctEl.textContent = Math.floor(pct) + "%";
    const indicator = slot.querySelector(".miner-slot-indicator");
    if (indicator) { indicator.className = "miner-slot-indicator" + (m.energyLeft > 0 ? "" : " off"); }
    slot.className = "miner-slot " + (m.energyLeft > 0 ? "active-miner" : "exhausted");
  });
}

// ── HOME – MINERS GRID ────────────────────────
function renderMinersGrid() {
  if (!userData) return;
  const grid = el("minersGrid");
  grid.innerHTML = "";
  const miners = userData.miners || [];
  const maxSlots = userData.maxSlots || 5;
  for (let i = 0; i < maxSlots; i++) {
    const m = miners[i];
    if (m) {
      const type = MINER_TYPES.find(t => t.id === m.typeId) || MINER_TYPES[0];
      const max = m.energyMax || (ENERGY_DURATION_HOURS * 3600);
      const pct = Math.max(0, Math.min(100, ((m.energyLeft || 0) / max) * 100));
      const fillClass = pct > 50 ? "high" : pct > 20 ? "mid" : "low";
      const kmrS = ((m.kmrPerSec || 0) * (1 + 0.25 * (m.level - 1))).toFixed(1);
      const ph = (() => {
        const inv = userData.inventory || [];
        const itemPH = inv.reduce((s, it) => s + (it.ph || 0), 0);
        return Math.floor(itemPH * type.phMult);
      })();
      const slot = document.createElement("div");
      slot.className = `miner-slot ${m.energyLeft > 0 ? "active-miner" : "exhausted"}`;
      slot.onclick = () => openMinerModal(i);
      slot.innerHTML = `
        <div class="miner-slot-indicator ${m.energyLeft > 0 ? "" : "off"}"></div>
        <div class="miner-slot-header">
          <span class="miner-slot-name">${type.icon} ${type.name}</span>
          <span class="miner-slot-level">Lv.${m.level}</span>
        </div>
        <div class="miner-slot-rate">+${kmrS} KMR/s</div>
        <div class="miner-slot-ph">${fmt(ph)} PH katkı</div>
        <div class="energy-bar"><div class="energy-fill ${fillClass}" style="width:${pct}%"></div></div>
        <div class="energy-pct">${Math.floor(pct)}% Enerji</div>`;
      grid.appendChild(slot);
    } else {
      const slot = document.createElement("div");
      slot.className = "miner-slot empty";
      slot.innerHTML = `<span class="empty-icon">➕</span><span class="empty-text">Boş Slot</span>`;
      grid.appendChild(slot);
    }
  }
}

// ── HOME – INVENTORY ──────────────────────────
function renderInventory() {
  if (!userData) return;
  const grid = el("inventoryGrid");
  const inv = userData.inventory || [];
  el("itemCount").textContent = inv.length + " Eşya";
  if (!inv.length) { grid.innerHTML = `<div class="inventory-empty">📭 Envanteriniz boş<br>Sandıktan eşya kazanın!</div>`; return; }
  grid.innerHTML = inv.map(item => `
    <div class="inventory-item ${item.rarity}" title="${item.name} — ${item.ph} PH">
      <span>${item.icon}</span>
      <span class="item-ph">${item.ph}PH</span>
    </div>`).join("");
}

// ── COLLECT ALL ───────────────────────────────
window.collectAll = async function() {
  if (!userData || !currentUser) return;
  const amount = Math.floor(userData.depositedKmr || 0);
  if (amount <= 0) { showToast("Birikmiş KMR yok!", "error"); return; }
  userData.kmr = (userData.kmr || 0) + amount;
  userData.depositedKmr = 0;
  await saveUserData();
  updateTopBar(); updateUI();
  showToast(`+${fmt(amount)} KMR toplandı! 🪨`, "gold");
};

// ── EXPAND CAVE ───────────────────────────────
window.expandCave = function() {
  if (!userData) return;
  const slots = userData.maxSlots || 5;
  const step = slots - 5; // how many expansions done
  const cost = SLOT_EXPAND_COSTS[Math.min(step, SLOT_EXPAND_COSTS.length - 1)];
  el("expandCaveInfo").innerHTML = `
    <p>Mevcut Slot: <b>${slots}</b></p>
    <p>Yeni Slot: <b>${slots + 1}</b></p>
    <div class="expand-cost">💎 ${cost} Çekip</div>
    <div class="current-slots">Çekip bakiyeniz: ${fmtDec(userData.cekip||0,3)}</div>`;
  el("expandCaveBtn").dataset.cost = cost;
  openModal("expandCaveModal");
};

window.confirmExpandCave = async function() {
  if (!userData || !currentUser) return;
  const cost = parseFloat(el("expandCaveBtn").dataset.cost);
  if ((userData.cekip || 0) < cost) { showToast("Yeterli Çekip yok!", "error"); return; }
  userData.cekip = fmtDec((userData.cekip || 0) - cost, 3);
  userData.maxSlots = (userData.maxSlots || 5) + 1;
  await saveUserData();
  closeModal("expandCaveModal");
  renderMinersGrid(); updateTopBar();
  showToast("Mağara genişletildi! ✨", "success");
};

// ── MINER MODAL ───────────────────────────────
window.openMinerModal = function(slotIndex) {
  if (!userData) return;
  const m = (userData.miners || [])[slotIndex];
  if (!m) return;
  selectedMinerSlot = slotIndex;
  const type = MINER_TYPES.find(t => t.id === m.typeId) || MINER_TYPES[0];
  const level = m.level || 1;
  const kmrPerSec = (type.kmrPerSec * Math.pow(1.25, level-1)).toFixed(2);
  const maxEnergy = m.energyMax || (ENERGY_DURATION_HOURS * 3600);
  const pct = Math.max(0, Math.min(100, ((m.energyLeft || 0) / maxEnergy) * 100));
  const filledClass = pct > 50 ? "" : pct > 20 ? "orange" : "red";
  const energyCost = Math.floor(kmrPerSec * 3600 * 4); // hourly * 4
  const upgradeCost = level < MAX_MINER_LEVEL
    ? Math.floor(type.cost * Math.pow(1.2, level)) + " Banknot"
    : "MAX SEVİYE";

  el("minerModalIcon").textContent = type.icon;
  el("minerModalName").textContent = type.name;
  el("minerModalStats").innerHTML = `
    <div class="miner-stat-pill"><div class="label">Seviye</div><div class="val">Lv.${level}</div></div>
    <div class="miner-stat-pill"><div class="label">KMR/s</div><div class="val">${kmrPerSec}</div></div>
    <div class="miner-stat-pill"><div class="label">PH Çarpanı</div><div class="val">x${type.phMult}</div></div>
    <div class="miner-stat-pill"><div class="label">Enerji Maliyeti</div><div class="val">${fmt(energyCost)} KMR</div></div>`;
  el("minerModalEnergyFill").style.width = pct + "%";
  el("minerModalEnergyFill").className = `energy-fill-big ${filledClass}`;
  el("minerModalEnergyText").textContent = `${Math.floor(pct)}% — ${fmt(m.energyLeft || 0)}s`;
  el("minerModalEnergyBtn").dataset.cost = energyCost;
  el("minerModalUpgradeBtn").textContent = level >= MAX_MINER_LEVEL ? "✅ MAX SEVİYE" : `⬆️ Seviye Yükselt (${upgradeCost})`;
  el("minerModalUpgradeBtn").disabled = level >= MAX_MINER_LEVEL;
  openModal("minerModal");
};

window.refillEnergy = async function() {
  if (!userData || !currentUser || selectedMinerSlot === null) return;
  const m = userData.miners[selectedMinerSlot];
  if (!m) return;
  const cost = parseInt(el("minerModalEnergyBtn").dataset.cost) || 0;
  if ((userData.kmr || 0) < cost) { showToast("Yeterli KMR yok! Önce KMR topla.", "error"); return; }
  userData.kmr = (userData.kmr || 0) - cost;
  userData.miners[selectedMinerSlot] = { ...m, energyLeft: m.energyMax || (ENERGY_DURATION_HOURS * 3600), lastEnergyUpdate: Date.now() };
  await saveUserData();
  closeModal("minerModal");
  renderMinersGrid(); updateTopBar();
  showToast("⚡ Enerji yenilendi!", "success");
};

window.upgradeMiner = async function() {
  if (!userData || !currentUser || selectedMinerSlot === null) return;
  const m = userData.miners[selectedMinerSlot];
  if (!m) return;
  const type = MINER_TYPES.find(t => t.id === m.typeId);
  const level = m.level || 1;
  if (level >= MAX_MINER_LEVEL) return;
  const cost = Math.floor(type.cost * Math.pow(1.2, level));
  if ((userData.banknot || 0) < cost) { showToast(`Yeterli Banknot yok! ${fmt(cost)} Banknot gerekli.`, "error"); return; }
  userData.banknot = (userData.banknot || 0) - cost;
  const newLevel = level + 1;
  userData.miners[selectedMinerSlot] = { ...m, level: newLevel, kmrPerSec: type.kmrPerSec * Math.pow(1.25, newLevel-1) };
  await saveUserData();
  closeModal("minerModal");
  renderMinersGrid(); updateTopBar();
  showToast(`⬆️ ${type.name} Lv.${newLevel} oldu!`, "gold");
};

// ── STORE – MINERS SHOP ───────────────────────
function renderMinersShop() {
  if (!userData) return;
  const grid = el("minersShopGrid");
  grid.innerHTML = MINER_TYPES.map(type => {
    const owned = (userData.miners || []).filter(m => m && m.typeId === type.id).length;
    return `
    <div class="miner-shop-card">
      <div class="miner-shop-header">
        <div>
          <div class="miner-shop-name">${type.icon} ${type.name}</div>
          <div class="miner-shop-type">Madenci</div>
        </div>
        <span class="miner-count-badge">Sahip: ${owned}</span>
      </div>
      <div class="miner-shop-stats">
        <div class="miner-stat"><span class="miner-stat-val">${type.kmrPerSec} KMR/s</span><span class="miner-stat-label">Üretim</span></div>
        <div class="miner-stat"><span class="miner-stat-val">x${type.phMult}</span><span class="miner-stat-label">PH Çarpanı</span></div>
        <div class="miner-stat"><span class="miner-stat-val">${type.cost}</span><span class="miner-stat-label">Banknot</span></div>
      </div>
      <div class="miner-shop-actions">
        <button class="btn-gold" onclick="openBuyMiner('${type.id}')">Satın Al</button>
        <div class="miner-shop-price"><span class="pi">💵</span>${type.cost} BNK</div>
      </div>
    </div>`;
  }).join("");
}

window.openBuyMiner = function(typeId) {
  const type = MINER_TYPES.find(t => t.id === typeId);
  if (!type) return;
  selectedBuyMinerType = type;
  el("buyMinerIcon").textContent = type.icon;
  el("buyMinerName").textContent = type.name + " Satın Al";
  el("buyMinerInfo").innerHTML = `
    <div class="bm-row"><span class="bm-label">KMR/s Üretim</span><span class="bm-val">${type.kmrPerSec}</span></div>
    <div class="bm-row"><span class="bm-label">PH Çarpanı</span><span class="bm-val">x${type.phMult}</span></div>
    <div class="bm-row"><span class="bm-label">Fiyat</span><span class="bm-val">💵 ${type.cost} Banknot</span></div>
    <div class="bm-row"><span class="bm-label">Baknti</span><span class="bm-val">💵 ${fmt(userData?.banknot||0)} Banknot</span></div>`;
  el("buyMinerConfirmBtn").textContent = `💵 ${type.cost} Banknot ile Satın Al`;
  openModal("buyMinerModal");
};

window.confirmBuyMiner = async function() {
  if (!userData || !currentUser || !selectedBuyMinerType) return;
  const type = selectedBuyMinerType;
  if ((userData.banknot || 0) < type.cost) { showToast("Yeterli Banknot yok! Finans bölümünden yükle.", "error"); return; }
  const slots = userData.maxSlots || 5;
  if ((userData.miners || []).length >= slots) { showToast("Slot dolu! Mağaranı genişlet.", "error"); return; }
  userData.banknot = (userData.banknot || 0) - type.cost;
  const newMiner = { typeId: type.id, level: 1, kmrPerSec: type.kmrPerSec, energyMax: ENERGY_DURATION_HOURS*3600, energyLeft: ENERGY_DURATION_HOURS*3600, lastEnergyUpdate: Date.now(), active: true };
  userData.miners = [...(userData.miners || []), newMiner];
  await saveUserData();
  closeModal("buyMinerModal");
  renderMinersGrid(); renderMinersShop(); updateTopBar();
  showToast(`${type.icon} ${type.name} satın alındı!`, "gold");
};

// ── STORE – CHESTS ────────────────────────────
window.switchStoreTab = function(tab, btn) {
  document.querySelectorAll(".store-tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".store-tab-content").forEach(c => c.classList.add("hidden"));
  btn.classList.add("active");
  el(`storeTab-${tab}`).classList.remove("hidden");
  currentStoreTab = tab;
};

window.openChest = async function(type) {
  if (!userData || !currentUser) return;
  const cost = type === "basic" ? 1000 : 5000;
  if ((userData.kmr || 0) < cost) { showToast(`Yeterli KMR yok! ${fmt(cost)} KMR gerekli.`, "error"); return; }
  userData.kmr = (userData.kmr || 0) - cost;
  const result = rollChest(type);
  let title = "Tebrikler!", desc = "", itemHtml = "";

  if (result.type === "cekip") {
    userData.cekip = fmtDec((userData.cekip || 0) + result.amount, 3);
    title = "💎 Çekip Kazandın!"; desc = `${result.amount} Çekip hesabına eklendi.`;
    itemHtml = `<div class="result-icon">💎</div><div class="result-name">${result.amount} Çekip</div>`;
  } else {
    const item = result.item;
    userData.inventory = [...(userData.inventory || []), item];
    title = `${item.rarity === "legendary" ? "👑 LEGENDARY" : item.rarity === "epic" ? "⚡ EPIC" : "🎯 Starter"} Eşya!`;
    desc = `Envanterine eklendi!`;
    itemHtml = `<div class="result-icon">${item.icon}</div><div class="result-name">${item.name}</div><div class="result-ph">${item.ph} PH</div>`;
  }

  await saveUserData();
  el("chestResultAnim").textContent = type === "basic" ? "📦" : "💣";
  el("chestResultTitle").textContent = title;
  el("chestResultDesc").textContent = desc;
  el("chestResultItem").innerHTML = itemHtml;
  renderInventory(); updateTopBar();
  openModal("chestResultModal");
};

function rollChest(type) {
  const roll = Math.random();
  if (type === "basic") {
    if (roll < 0.10) return { type: "cekip", amount: 0.05 };
    if (roll < 0.40) return { type: "item", item: getRandomItem("epic") };
    return { type: "item", item: getRandomItem("starter") };
  } else {
    if (roll < 0.10) return { type: "cekip", amount: 0.50 };
    if (roll < 0.45) return { type: "item", item: getRandomItem("legendary") };
    return { type: "item", item: getRandomItem("epic") };
  }
}

function getRandomItem(rarity) {
  const pool = ITEM_POOL.filter(i => i.rarity === rarity);
  return { ...pool[Math.floor(Math.random() * pool.length)], uid: Date.now() + Math.random() };
}

// ── STORE – FEATURED ──────────────────────────
function renderFeatured() {
  const grid = el("featuredGrid");
  // Generate daily featured items seeded by date
  const today = new Date().toDateString();
  const seed = today.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const featured = [];
  for (let i = 0; i < 5; i++) {
    const idx = (seed * (i + 1) * 17) % ITEM_POOL.length;
    const item = ITEM_POOL[Math.abs(Math.floor(idx))];
    const priceType = i % 2 === 0 ? "banknot" : "cekip";
    const price = priceType === "banknot" ? (50 + i * 30) : (0.1 + i * 0.2);
    featured.push({ ...item, priceType, price });
  }
  grid.innerHTML = featured.map((item, i) => `
    <div class="featured-item">
      <div class="feat-left">
        <span class="feat-icon">${item.icon}</span>
        <div>
          <div class="feat-name">${item.name}</div>
          <div class="feat-ph">${item.ph} PH</div>
          <div class="feat-rarity rarity-${item.rarity}">${item.rarity}</div>
        </div>
      </div>
      <button class="btn-gold btn-sm" onclick="buyFeaturedItem(${i}, '${item.id}', '${item.priceType}', ${item.price})">
        ${item.priceType === "banknot" ? `💵 ${item.price}` : `💎 ${item.price}`}
      </button>
    </div>`).join("");
  window._featuredItems = featured;
}

window.buyFeaturedItem = async function(idx, itemId, priceType, price) {
  if (!userData || !currentUser) return;
  const featured = window._featuredItems;
  if (!featured || !featured[idx]) return;
  const item = featured[idx];
  if (priceType === "banknot") {
    if ((userData.banknot || 0) < price) { showToast("Yeterli Banknot yok!", "error"); return; }
    userData.banknot = (userData.banknot || 0) - price;
  } else {
    if ((userData.cekip || 0) < price) { showToast("Yeterli Çekip yok!", "error"); return; }
    userData.cekip = fmtDec((userData.cekip || 0) - price, 3);
  }
  const newItem = { ...item, uid: Date.now(), priceType: undefined, price: undefined };
  userData.inventory = [...(userData.inventory || []), newItem];
  await saveUserData();
  renderInventory(); updateTopBar();
  showToast(`${item.icon} ${item.name} satın alındı!`, "gold");
};

// ── LEADERBOARD ───────────────────────────────
window.switchLeagueTab = async function(leagueId, btn) {
  document.querySelectorAll(".league-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentLeagueTab = leagueId;
  const league = LEAGUES.find(l => l.id === leagueId);
  el("leaguePoolVal").textContent = league.pool + " Çekip";
  el("leagueRangeText").textContent = league.label;
  await loadLeaderboard(leagueId);
};

async function loadLeaderboard(leagueId) {
  el("leaderboardList").innerHTML = `<div class="lb-loading">Yükleniyor...</div>`;
  const league = LEAGUES.find(l => l.id === leagueId);
  try {
    // Query top 100 by total PH approximation via totalPH field if stored
    const q = query(collection(db, "users"), orderBy("lastSeen", "desc"), limit(100));
    const snap = await getDocs(q);
    const users = [];
    snap.forEach(d => {
      const data = d.data();
      const ph = calcPHForUser(data);
      if (ph >= (league.minPH || 0) && ph <= (league.maxPH || Infinity)) {
        users.push({ uid: d.id, username: data.username || "?", ph, kmr: data.kmr || 0 });
      }
    });
    users.sort((a, b) => b.ph - a.ph);
    const myPH = calcTotalPH();
    el("myPHVal").textContent = fmt(myPH) + " PH";
    const myRank = users.findIndex(u => u.uid === currentUser?.uid);
    el("myRank").textContent = myRank >= 0 ? `#${myRank + 1}` : "#--";

    if (!users.length) { el("leaderboardList").innerHTML = `<div class="lb-loading">Bu ligde henüz kimse yok.</div>`; return; }
    el("leaderboardList").innerHTML = users.slice(0, 100).map((u, i) => `
      <div class="lb-row ${u.uid === currentUser?.uid ? "lb-me" : ""}">
        <span class="lb-rank ${i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""}">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i+1)}</span>
        <div class="lb-avatar">${(u.username[0]||"?").toUpperCase()}</div>
        <div class="lb-info">
          <div class="lb-name">${u.username}</div>
          <div class="lb-ph">${fmt(u.ph)} PH</div>
        </div>
      </div>`).join("");
  } catch(e) { el("leaderboardList").innerHTML = `<div class="lb-loading">Yüklenemedi.</div>`; console.error(e); }
}

function calcPHForUser(data) {
  const inv = data.inventory || [];
  const miners = data.miners || [];
  const itemPH = inv.reduce((s, it) => s + (it?.ph || 0), 0);
  const maxMult = miners.reduce((max, m) => {
    if (!m) return max;
    const type = MINER_TYPES.find(t => t.id === m.typeId);
    return type ? Math.max(max, type.phMult) : max;
  }, 1);
  return Math.floor(itemPH * maxMult);
}

// ── NAVIGATE ──────────────────────────────────
window.navigate = function(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  el(`page-${page}`).classList.add("active");
  el(`nav${page.charAt(0).toUpperCase() + page.slice(1)}`).classList.add("active");

  if (page === "leaderboard") {
    const league = LEAGUES.find(l => l.id === currentLeagueTab) || LEAGUES[0];
    el("leaguePoolVal").textContent = league.pool + " Çekip";
    el("leagueRangeText").textContent = league.label;
    loadLeaderboard(currentLeagueTab);
  }
  if (page === "finance") {
    el("withdrawCekipBalance").textContent = fmtDec(userData?.cekip || 0, 3) + " 💎";
    loadFinanceHistory();
  }
  if (page === "store") { renderMinersShop(); renderFeatured(); }
};

// ── FINANCE ───────────────────────────────────
window.switchFinanceTab = function(tab, btn) {
  document.querySelectorAll(".finance-tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".finance-tab-content").forEach(c => c.classList.add("hidden"));
  btn.classList.add("active");
  el(`finTab-${tab}`).classList.remove("hidden");
  if (tab === "history") loadFinanceHistory();
};

// Track file for upload
el("depositReceipt")?.addEventListener("change", function() {
  el("depositFileName").textContent = this.files[0]?.name || "";
});

window.submitDeposit = async function(e) {
  e.preventDefault();
  if (!currentUser) return;
  const amount = parseFloat(el("depositAmount2").value);
  const currency = el("depositCurrency").value;
  const note = el("depositNote").value;
  const fileInput = el("depositReceipt");
  let receiptUrl = null;

  if (fileInput.files[0]) {
    try {
      const fileRef = ref(storage, `receipts/${currentUser.uid}/${Date.now()}_${fileInput.files[0].name}`);
      await uploadBytes(fileRef, fileInput.files[0]);
      receiptUrl = await getDownloadURL(fileRef);
    } catch(e) { console.warn("Upload error:", e); }
  }

  await addDoc(collection(db, "deposit_requests"), {
    uid: currentUser.uid,
    username: userData?.username || "?",
    amount, currency, note,
    receiptUrl: receiptUrl || null,
    status: "pending",
    createdAt: serverTimestamp()
  });
  el("depositForm").reset();
  el("depositFileName").textContent = "";
  showToast("✅ Yatırma talebi oluşturuldu!", "success");
};

window.submitWithdraw = async function(e) {
  e.preventDefault();
  if (!currentUser || !userData) return;
  const amount = parseFloat(el("withdrawAmount").value);
  const iban = el("withdrawIBAN").value.trim();
  const name = el("withdrawName").value.trim();
  if ((userData.cekip || 0) < amount) { showToast("Yeterli Çekip yok!", "error"); return; }

  await addDoc(collection(db, "withdraw_requests"), {
    uid: currentUser.uid,
    username: userData.username || "?",
    amount, iban, name,
    status: "pending",
    createdAt: serverTimestamp()
  });
  el("withdrawForm").reset();
  showToast("✅ Çekim talebi oluşturuldu!", "success");
};

async function loadFinanceHistory() {
  const list = el("financeHistoryList");
  if (!currentUser) return;
  list.innerHTML = `<div class="lb-loading">Yükleniyor...</div>`;
  try {
    const dQ = query(collection(db, "deposit_requests"), where("uid", "==", currentUser.uid), orderBy("createdAt", "desc"), limit(20));
    const wQ = query(collection(db, "withdraw_requests"), where("uid", "==", currentUser.uid), orderBy("createdAt", "desc"), limit(20));
    const [dSnap, wSnap] = await Promise.all([getDocs(dQ), getDocs(wQ)]);
    const items = [];
    dSnap.forEach(d => items.push({ ...d.data(), _type: "deposit" }));
    wSnap.forEach(d => items.push({ ...d.data(), _type: "withdraw" }));
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    if (!items.length) { list.innerHTML = `<div class="lb-loading">Henüz işlem yok.</div>`; return; }
    list.innerHTML = items.map(it => {
      const date = it.createdAt?.seconds ? new Date(it.createdAt.seconds * 1000).toLocaleDateString("tr-TR") : "--";
      const typeLabel = it._type === "deposit" ? "Yatırma" : "Çekim";
      const typeClass = it._type === "deposit" ? "deposit" : "withdraw";
      const currency = it.currency || "çekip";
      return `<div class="history-item">
        <div class="history-item-header">
          <span class="history-type ${typeClass}">${it._type === "deposit" ? "⬇️" : "⬆️"} ${typeLabel}</span>
          <span class="history-status ${it.status}">${it.status === "pending" ? "⏳ Bekliyor" : it.status === "approved" ? "✅ Onaylandı" : "❌ Reddedildi"}</span>
        </div>
        <div class="history-amount">${it.amount} ${currency}</div>
        <div class="history-date">${date}</div>
      </div>`;
    }).join("");
  } catch(e) { list.innerHTML = `<div class="lb-loading">Yüklenemedi.</div>`; }
}

// ── PROFILE ───────────────────────────────────
window.openProfileModal = function() {
  if (!userData) return;
  const initial = (userData.username || "?")[0].toUpperCase();
  el("profileAvatar").textContent = initial;
  el("profileName").textContent = userData.username || "Madenci";
  el("profileEmail").textContent = userData.email || currentUser?.email || "--";
  const league = getUserLeague();
  el("profileLeagueBadge").textContent = `${league.icon} ${league.name}`;
  el("pstatKmr").textContent = fmt(userData.kmr || 0);
  el("pstatBanknot").textContent = fmt(userData.banknot || 0);
  el("pstatCekip").textContent = fmtDec(userData.cekip || 0, 3);
  el("pstatPH").textContent = fmt(calcTotalPH());
  openModal("profileModal");
};

window.openChangePassword = function() {
  closeModal("profileModal");
  el("newPassword").value = "";
  el("changePassError").classList.add("hidden");
  openModal("changePassModal");
};

window.changePassword = async function(e) {
  e.preventDefault();
  const newPwd = el("newPassword").value;
  const errEl = el("changePassError");
  try {
    await updatePassword(auth.currentUser, newPwd);
    closeModal("changePassModal");
    showToast("🔑 Şifre güncellendi!", "success");
  } catch(err) {
    errEl.textContent = err.code === "auth/requires-recent-login" ? "Güvenlik için yeniden giriş yapınız." : err.message;
    errEl.classList.remove("hidden");
  }
};

// ── ADMIN NOTIFICATION ─────────────────────────
async function checkAdminNotif() {
  if (!userData || userData.adminNotifAck !== false || !userData.adminNotif) return;
  el("adminNotifText").textContent = userData.adminNotif;
  openModal("adminNotifModal");
}

window.acknowledgeAdminNotif = async function() {
  closeModal("adminNotifModal");
  if (!currentUser) return;
  await updateDoc(doc(db, "users", currentUser.uid), { adminNotifAck: true });
};

// ── NOTIF BANNER ──────────────────────────────
window.closeNotif = function() { el("notifBanner").classList.add("hidden"); };
function showNotifBanner(text) {
  el("notifText").textContent = text;
  el("notifBanner").classList.remove("hidden");
}

// ── CURRENCY CONVERTERS ───────────────────────
// Exposed for potential UI buttons
window.convertToKmr = async function() {
  // 1000 KMR = 1 Banknot (converting banknot back is not allowed, only KMR -> Banknot)
};
window.convertKmrToBanknot = async function(amount) {
  if (!userData) return;
  const lots = Math.floor(amount / 1000);
  if (lots <= 0) return;
  userData.kmr = (userData.kmr || 0) - lots * 1000;
  userData.banknot = (userData.banknot || 0) + lots;
  await saveUserData(); updateTopBar();
  showToast(`🔄 ${lots} Banknot kazandın!`, "gold");
};
window.convertBanknotToCekip = async function(amount) {
  if (!userData) return;
  const lots = Math.floor(amount / 1000);
  if (lots <= 0) return;
  userData.banknot = (userData.banknot || 0) - lots * 1000;
  userData.cekip = fmtDec((userData.cekip || 0) + lots, 3);
  await saveUserData(); updateTopBar();
  showToast(`💎 ${lots} Çekip kazandın!`, "gold");
};

// ── SPLASH PROGRESS ───────────────────────────
let _splashPct = 0;
const _splashInterval = setInterval(() => {
  _splashPct = Math.min(_splashPct + 15, 50);
  animateSplash(_splashPct);
  if (_splashPct >= 50) clearInterval(_splashInterval);
}, 200);

// ── INIT ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Telegram Web App integration
  try {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.setHeaderColor("#0a0a0f");
      window.Telegram.WebApp.setBackgroundColor("#0a0a0f");
    }
  } catch(e) {}
});
