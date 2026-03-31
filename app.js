import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDuKLuoePZ6mNsKhQBGXumxMwF0UKTQvc8",
  authDomain: "oyun-75056.firebaseapp.com",
  databaseURL: "https://oyun-75056-default-rtdb.firebaseio.com ",
  projectId: "oyun-75056",
  storageBucket: "oyun-75056.firebasestorage.app",
  messagingSenderId: "980660244755",
  appId: "1:980660244755:web:47889c4b6637ab05cdcae6",
  measurementId: "G-J9RKPSVT8B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const MINERS = [
  { key: "cirak", name: "Çırak", baseCost: 0, baseKmrPerSec: (50 / 3600), multiplier: 1.2, starterOnly: true },
  { key: "kubra", name: "Kübra", baseCost: 50, baseKmrPerSec: 250, multiplier: 2 },
  { key: "beyza", name: "Beyza", baseCost: 80, baseKmrPerSec: 500, multiplier: 2.5 },
  { key: "mehmet", name: "Mehmet", baseCost: 125, baseKmrPerSec: 750, multiplier: 3 },
  { key: "sevki", name: "Şevki", baseCost: 180, baseKmrPerSec: 1000, multiplier: 3.5 },
  { key: "ali", name: "Ali", baseCost: 300, baseKmrPerSec: 2000, multiplier: 4 }
];

const LEAGUES = [
  { name: "Çırak", min: 0, max: 1000, rewardPoolCekip: 50 },
  { name: "Amatör", min: 1001, max: 10000, rewardPoolCekip: 200 },
  { name: "Usta", min: 10001, max: Number.MAX_SAFE_INTEGER, rewardPoolCekip: 1000 }
];

const MAX_LEVEL = 10;
const DEFAULT_SLOTS = 5;
const SLOT_EXPAND_COST_CEKIP = 1;
const ENERGY_HOURS = 1;
const KMR_PER_BANKNOT = 1000;
const BANKNOT_PER_CEKIP = 1000;

let currentUser = null;
let currentData = null;
let refreshTimer = null;

const el = {
  authView: document.getElementById("authView"),
  gameView: document.getElementById("gameView"),
  leftSidebar: document.getElementById("leftSidebar"),
  userBadge: document.getElementById("userBadge"),
  openProfileBtn: document.getElementById("openProfileBtn"),
  closeProfileBtn: document.getElementById("closeProfileBtn"),
  profileModal: document.getElementById("profileModal"),
  profileForm: document.getElementById("profileForm"),
  profileUsername: document.getElementById("profileUsername"),
  profileMessage: document.getElementById("profileMessage"),
  logoutBtn: document.getElementById("logoutBtn"),
  authMessage: document.getElementById("authMessage"),
  registerForm: document.getElementById("registerForm"),
  loginForm: document.getElementById("loginForm"),
  regUsername: document.getElementById("regUsername"),
  regEmail: document.getElementById("regEmail"),
  regPassword: document.getElementById("regPassword"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  kmrValue: document.getElementById("kmrValue"),
  banknotValue: document.getElementById("banknotValue"),
  cekipValue: document.getElementById("cekipValue"),
  phValue: document.getElementById("phValue"),
  convertKmrBtn: document.getElementById("convertKmrBtn"),
  convertBanknotBtn: document.getElementById("convertBanknotBtn"),
  pendingKmrValue: document.getElementById("pendingKmrValue"),
  slotInfo: document.getElementById("slotInfo"),
  minersContainer: document.getElementById("minersContainer"),
  collectAllBtn: document.getElementById("collectAllBtn"),
  expandCaveBtn: document.getElementById("expandCaveBtn"),
  minerStore: document.getElementById("minerStore"),
  openBasicChestBtn: document.getElementById("openBasicChestBtn"),
  openBombChestBtn: document.getElementById("openBombChestBtn"),
  chestResult: document.getElementById("chestResult"),
  dailyShop: document.getElementById("dailyShop"),
  leaderboardBody: document.getElementById("leaderboardBody"),
  depositForm: document.getElementById("depositForm"),
  withdrawForm: document.getElementById("withdrawForm"),
  financeMessage: document.getElementById("financeMessage"),
  adminTabBtn: document.getElementById("adminTabBtn"),
  adminUserActionForm: document.getElementById("adminUserActionForm"),
  adminSetRoleForm: document.getElementById("adminSetRoleForm"),
  adminItemActionForm: document.getElementById("adminItemActionForm"),
  adminMinerActionForm: document.getElementById("adminMinerActionForm"),
  adminDepositRequests: document.getElementById("adminDepositRequests"),
  adminWithdrawRequests: document.getElementById("adminWithdrawRequests"),
  adminMessage: document.getElementById("adminMessage"),
  supportWidget: document.getElementById("supportWidget"),
  toggleSupportBtn: document.getElementById("toggleSupportBtn"),
  supportPanel: document.getElementById("supportPanel"),
  supportForm: document.getElementById("supportForm"),
  supportTitle: document.getElementById("supportTitle"),
  supportMessageInput: document.getElementById("supportMessageInput"),
  supportMessage: document.getElementById("supportMessage"),
  supportTicketsList: document.getElementById("supportTicketsList"),
  supportMessages: document.getElementById("supportMessages"),
  supportReplyForm: document.getElementById("supportReplyForm"),
  supportReplyInput: document.getElementById("supportReplyInput"),
  adminSupportTickets: document.getElementById("adminSupportTickets"),
  adminSupportMessages: document.getElementById("adminSupportMessages"),
  adminSupportReplyForm: document.getElementById("adminSupportReplyForm"),
  adminSupportReplyText: document.getElementById("adminSupportReplyText"),
  adminCloseTicketBtn: document.getElementById("adminCloseTicketBtn")
};

let selectedUserTicketId = null;
let selectedAdminTicketId = null;

function fmt(n, d = 0) {
  return Number(n || 0).toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: d });
}

function getMinerByKey(key) {
  return MINERS.find((m) => m.key === key);
}

function getMinerLevelCost(baseCost, level) {
  return Math.ceil(baseCost * Math.pow(1.2, level - 1));
}

function getMinerKmrPerSec(baseRate, level) {
  return Number((baseRate * Math.pow(1.25, level - 1)).toFixed(4));
}

function getLeagueByPh(ph) {
  return LEAGUES.find((l) => ph >= l.min && ph <= l.max) || LEAGUES[0];
}

function buildItemPool() {
  const items = [];
  for (let i = 1; i <= 70; i += 1) {
    items.push({ id: `starter-${i}`, name: `Starter Cevher #${i}`, rarity: "Starter", ph: 1 + (i % 40) });
  }
  for (let i = 1; i <= 20; i += 1) {
    items.push({ id: `epic-${i}`, name: `Epic Kristal #${i}`, rarity: "Epic", ph: 50 + (i * 5) });
  }
  for (let i = 1; i <= 10; i += 1) {
    items.push({ id: `legendary-${i}`, name: `Legendary Artefakt #${i}`, rarity: "Legendary", ph: 200 + (i * 10) });
  }
  return items.slice(0, 100);
}

const ITEM_POOL = buildItemPool();

function randomItemByRarity(allowedRarities) {
  const filtered = ITEM_POOL.filter((i) => allowedRarities.includes(i.rarity));
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function getHighestMinerMultiplier(miners) {
  const active = miners.length ? miners : [];
  if (!active.length) return 1;
  return Math.max(...active.map((m) => getMinerByKey(m.typeKey)?.multiplier || 1));
}

function getTotalPh(inventory, highestMultiplier) {
  const raw = inventory.reduce((sum, i) => sum + Number(i.ph || 0), 0);
  return Math.floor(raw * highestMultiplier);
}

function getDailySeed() {
  const d = new Date();
  return Number(`${d.getUTCFullYear()}${d.getUTCMonth() + 1}${d.getUTCDate()}`);
}

function getDailyShopItems() {
  const seed = getDailySeed();
  const idx1 = seed % ITEM_POOL.length;
  const idx2 = (seed * 7) % ITEM_POOL.length;
  const idx3 = (seed * 13) % ITEM_POOL.length;
  const picks = [ITEM_POOL[idx1], ITEM_POOL[idx2], ITEM_POOL[idx3]];
  return picks.map((it, i) => ({
    ...it,
    priceBanknot: Math.ceil((it.ph * 0.8) + i * 5),
    priceCekip: Number((it.ph / 300).toFixed(2))
  }));
}

function tryTelegramBootstrap() {
  const tg = window?.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
}

async function ensureUserDoc(user, username) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) return snapshot.data();

  const newUser = {
    uid: user.uid,
    email: user.email || "",
    username: username || user.displayName || `user_${user.uid.slice(0, 6)}`,
    isAdmin: false,
    isBanned: false,
    wallet: { kmr: 500, banknot: 0, cekip: 0 },
    pendingKmr: 0,
    maxSlots: DEFAULT_SLOTS,
    miners: [{
      typeKey: "cirak",
      level: 1,
      energy: 3600,
      maxEnergy: 3600,
      updatedAtMs: Date.now(),
      source: "starter"
    }],
    inventory: [],
    highestMultiplier: 1,
    totalPH: 0,
    league: "Çırak",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastTickMs: Date.now(),
    starterGranted: true
  };

  await setDoc(userRef, newUser);
  return newUser;
}

function showMsg(target, msg, isError = false) {
  target.textContent = msg;
  target.style.color = isError ? "#ff8fa3" : "#9aa4c7";
}

function toSafeNumber(value, min = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return n;
}

async function syncProduction(uid) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.isBanned) return;
    const now = Date.now();
    const lastTick = Number(data.lastTickMs || now);
    const elapsedSec = Math.max(0, Math.floor((now - lastTick) / 1000));
    if (elapsedSec <= 0) return;

    const miners = Array.isArray(data.miners) ? data.miners : [];
    let produced = 0;
    const updatedMiners = miners.map((m) => {
      const minerCfg = getMinerByKey(m.typeKey);
      if (!minerCfg) return m;
      const level = m.level || 1;
      const perSec = getMinerKmrPerSec(minerCfg.baseKmrPerSec, level);
      const energy = Number(m.energy || 0);
      if (energy <= 0) return { ...m, energy: 0 };
      const productiveSeconds = Math.min(energy, elapsedSec);
      produced += perSec * productiveSeconds;
      return { ...m, energy: Math.max(0, energy - productiveSeconds), updatedAtMs: now };
    });

    tx.update(userRef, {
      miners: updatedMiners,
      pendingKmr: Math.floor(Number(data.pendingKmr || 0) + produced),
      lastTickMs: now,
      updatedAt: serverTimestamp()
    });
  });
}

async function refreshUserData(uid) {
  await syncProduction(uid);
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data.starterGranted) {
    const miners = Array.isArray(data.miners) ? [...data.miners] : [];
    const hasStarter = miners.some((m) => m.typeKey === "cirak");
    if (!hasStarter) {
      miners.push({
        typeKey: "cirak",
        level: 1,
        energy: 3600,
        maxEnergy: 3600,
        updatedAtMs: Date.now(),
        source: "starter"
      });
    }
    await updateDoc(userRef, {
      miners,
      "wallet.kmr": Math.max(500, Number(data.wallet?.kmr || 0)),
      starterGranted: true,
      updatedAt: serverTimestamp()
    });
    const refreshed = await getDoc(userRef);
    if (!refreshed.exists()) return null;
    Object.assign(data, refreshed.data());
  }
  const highestMultiplier = getHighestMinerMultiplier(data.miners || []);
  const totalPH = getTotalPh(data.inventory || [], highestMultiplier);
  const league = getLeagueByPh(totalPH).name;

  if (data.totalPH !== totalPH || data.league !== league || data.highestMultiplier !== highestMultiplier) {
    await updateDoc(userRef, {
      highestMultiplier,
      totalPH,
      league,
      updatedAt: serverTimestamp()
    });
    data.totalPH = totalPH;
    data.league = league;
    data.highestMultiplier = highestMultiplier;
  }
  return data;
}

function renderWallet(data) {
  el.kmrValue.textContent = fmt(data.wallet?.kmr || 0);
  el.banknotValue.textContent = fmt(data.wallet?.banknot || 0);
  el.cekipValue.textContent = fmt(data.wallet?.cekip || 0, 2);
  el.pendingKmrValue.textContent = fmt(data.pendingKmr || 0);
  el.phValue.textContent = fmt(data.totalPH || 0);
  el.slotInfo.textContent = `${(data.miners || []).length} / ${data.maxSlots || DEFAULT_SLOTS}`;
  el.userBadge.textContent = `${data.username} • ${data.league}`;
}

function renderMiners(data) {
  const miners = data.miners || [];
  if (!miners.length) {
    el.minersContainer.innerHTML = "<p class='muted'>Henüz aktif madencin yok. Mağazadan alabilirsin.</p>";
    return;
  }
  el.minersContainer.innerHTML = miners.map((m, i) => {
    const cfg = getMinerByKey(m.typeKey);
    if (!cfg) return "";
    const level = m.level || 1;
    const perSec = getMinerKmrPerSec(cfg.baseKmrPerSec, level);
    const hourGain = perSec * 3600;
    const maxEnergy = Number(m.maxEnergy || hourGain * ENERGY_HOURS);
    const energy = Number(m.energy || 0);
    const pct = Math.max(0, Math.min(100, (energy / maxEnergy) * 100));
    const refillCost = hourGain * 4;
    const avatarClass = `miner-avatar avatar-${cfg.key}`;
    return `
      <article class="miner-card">
        <div class="${avatarClass}"></div>
        <h4>${cfg.name} • Lvl ${level}</h4>
        <p>Kazanç: ${fmt(perSec, 2)} KMR/s • ${fmt(hourGain)} KMR/saat</p>
        <p>PH Çarpanı: x${cfg.multiplier}</p>
        <p>Enerji: ${fmt(energy)} / ${fmt(maxEnergy)}</p>
        <div class="energy-wrap"><div class="energy-fill" style="width:${pct}%"></div></div>
        <button class="btn small energy-btn" data-idx="${i}" data-cost="${refillCost}">Enerji Ver (${fmt(refillCost)} KMR)</button>
      </article>
    `;
  }).join("");
}

function renderMinerStore() {
  el.minerStore.innerHTML = MINERS.filter((m) => !m.starterOnly).map((m) => `
    <article class="miner-card">
      <div class="miner-avatar avatar-${m.key}"></div>
      <h4>${m.name}</h4>
      <p>Alım: ${fmt(m.baseCost)} Banknot</p>
      <p>Üretim: ${fmt(m.baseKmrPerSec)} KMR/s</p>
      <p>Çarpan: x${m.multiplier}</p>
      <button class="btn small buy-miner-btn" data-key="${m.key}">Madenci Al</button>
    </article>
  `).join("");
}

function renderDailyShop() {
  const items = getDailyShopItems();
  el.dailyShop.innerHTML = items.map((it, idx) => `
    <article class="miner-card">
      <h4>${it.name}</h4>
      <p>Nadirlik: ${it.rarity}</p>
      <p>PH: ${it.ph}</p>
      <p>Fiyat: ${fmt(it.priceBanknot)} Banknot veya ${fmt(it.priceCekip, 2)} Çekip</p>
      <div class="chest-row">
        <button class="btn small buy-daily-banknot-btn" data-idx="${idx}">Banknot ile al</button>
        <button class="btn small buy-daily-cekip-btn" data-idx="${idx}">Çekip ile al</button>
      </div>
    </article>
  `).join("");
}

async function renderLeaderboard() {
  const q = query(collection(db, "users"), orderBy("totalPH", "desc"), limit(100));
  const snaps = await getDocs(q);
  let rank = 1;
  const rows = [];
  snaps.forEach((s) => {
    const d = s.data();
    rows.push(`<tr><td>${rank}</td><td>${d.username || "?"}</td><td>${fmt(d.totalPH || 0)}</td><td>${d.league || "-"}</td></tr>`);
    rank += 1;
  });
  el.leaderboardBody.innerHTML = rows.join("") || "<tr><td colspan='4'>Veri yok</td></tr>";
}

async function collectAll(uid) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const pendingKmr = Math.floor(Number(data.pendingKmr || 0));
    if (pendingKmr <= 0) return;
    tx.update(userRef, {
      "wallet.kmr": Math.floor(Number(data.wallet?.kmr || 0) + pendingKmr),
      pendingKmr: 0,
      updatedAt: serverTimestamp()
    });
  });
}

async function convertKmrToBanknot(uid) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const kmr = Number(data.wallet?.kmr || 0);
    if (kmr < KMR_PER_BANKNOT) throw new Error("Yeterli KMR yok.");
    const take = Math.floor(kmr / KMR_PER_BANKNOT);
    tx.update(userRef, {
      "wallet.kmr": kmr - (take * KMR_PER_BANKNOT),
      "wallet.banknot": Number(data.wallet?.banknot || 0) + take,
      updatedAt: serverTimestamp()
    });
  });
}

async function convertBanknotToCekip(uid) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const banknot = Number(data.wallet?.banknot || 0);
    if (banknot < BANKNOT_PER_CEKIP) throw new Error("Yeterli Banknot yok.");
    const take = Math.floor(banknot / BANKNOT_PER_CEKIP);
    tx.update(userRef, {
      "wallet.banknot": banknot - (take * BANKNOT_PER_CEKIP),
      "wallet.cekip": Number((Number(data.wallet?.cekip || 0) + take).toFixed(2)),
      updatedAt: serverTimestamp()
    });
  });
}

async function expandCave(uid) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const cekip = Number(data.wallet?.cekip || 0);
    if (cekip < SLOT_EXPAND_COST_CEKIP) throw new Error("Yetersiz Çekip.");
    tx.update(userRef, {
      "wallet.cekip": Number((cekip - SLOT_EXPAND_COST_CEKIP).toFixed(2)),
      maxSlots: Number(data.maxSlots || DEFAULT_SLOTS) + 1,
      updatedAt: serverTimestamp()
    });
  });
}

async function buyMiner(uid, minerKey) {
  const cfg = getMinerByKey(minerKey);
  if (!cfg) return;
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const miners = Array.isArray(data.miners) ? data.miners : [];
    const slots = Number(data.maxSlots || DEFAULT_SLOTS);
    if (miners.length >= slots) throw new Error("Boş slot yok.");
    const banknot = Number(data.wallet?.banknot || 0);
    if (banknot < cfg.baseCost) throw new Error("Yetersiz Banknot.");
    const perSec = getMinerKmrPerSec(cfg.baseKmrPerSec, 1);
    const maxEnergy = perSec * 3600 * ENERGY_HOURS;
    miners.push({
      typeKey: cfg.key,
      level: 1,
      energy: maxEnergy,
      maxEnergy,
      updatedAtMs: Date.now()
    });
    tx.update(userRef, {
      miners,
      "wallet.banknot": banknot - cfg.baseCost,
      updatedAt: serverTimestamp()
    });
  });
}

async function levelUpMiner(uid, minerIndex) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const miners = Array.isArray(data.miners) ? [...data.miners] : [];
    const m = miners[minerIndex];
    if (!m) throw new Error("Madenci bulunamadı.");
    if (m.level >= MAX_LEVEL) throw new Error("Maksimum seviyede.");
    const cfg = getMinerByKey(m.typeKey);
    if (!cfg) throw new Error("Madenci tipi geçersiz.");
    const nextLevel = Number(m.level || 1) + 1;
    const cost = getMinerLevelCost(cfg.baseCost, nextLevel);
    const banknot = Number(data.wallet?.banknot || 0);
    if (banknot < cost) throw new Error("Yetersiz Banknot.");
    const perSec = getMinerKmrPerSec(cfg.baseKmrPerSec, nextLevel);
    const maxEnergy = perSec * 3600 * ENERGY_HOURS;
    miners[minerIndex] = { ...m, level: nextLevel, maxEnergy, energy: Math.min(maxEnergy, Number(m.energy || 0)) };
    tx.update(userRef, {
      miners,
      "wallet.banknot": banknot - cost,
      updatedAt: serverTimestamp()
    });
  });
}

async function refillEnergy(uid, minerIndex, cost) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const miners = Array.isArray(data.miners) ? [...data.miners] : [];
    const m = miners[minerIndex];
    if (!m) throw new Error("Madenci yok.");
    const kmr = Number(data.wallet?.kmr || 0);
    const safeCost = Math.floor(Number(cost || 0));
    if (safeCost <= 0 || kmr < safeCost) throw new Error("KMR yetersiz.");
    miners[minerIndex] = { ...m, energy: Number(m.maxEnergy || 0), updatedAtMs: Date.now() };
    tx.update(userRef, {
      miners,
      "wallet.kmr": kmr - safeCost,
      updatedAt: serverTimestamp()
    });
  });
}

function rollChest(type) {
  if (type === "basic") {
    const r = Math.random();
    if (r < 0.05) return { cekip: 0.05 };
    if (r < 0.85) return { item: randomItemByRarity(["Starter"]) };
    return { item: randomItemByRarity(["Epic"]) };
  }
  const r = Math.random();
  if (r < 0.08) return { cekip: 0.5 };
  if (r < 0.75) return { item: randomItemByRarity(["Epic"]) };
  return { item: randomItemByRarity(["Legendary"]) };
}

async function openChest(uid, chestType) {
  const cost = chestType === "basic" ? 1000 : 5000;
  const reward = rollChest(chestType);
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const kmr = Number(data.wallet?.kmr || 0);
    if (kmr < cost) throw new Error("Yetersiz KMR.");
    const inv = Array.isArray(data.inventory) ? [...data.inventory] : [];
    let update = { "wallet.kmr": kmr - cost, updatedAt: serverTimestamp() };
    if (reward.item) {
      inv.push({ ...reward.item, obtainedAtMs: Date.now() });
      update.inventory = inv;
    }
    if (reward.cekip) {
      update["wallet.cekip"] = Number((Number(data.wallet?.cekip || 0) + reward.cekip).toFixed(2));
    }
    tx.update(userRef, update);
  });
  return reward;
}

async function buyDailyItem(uid, shopIndex, currency) {
  const shop = getDailyShopItems();
  const picked = shop[shopIndex];
  if (!picked) throw new Error("Ürün bulunamadı.");
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const inv = Array.isArray(data.inventory) ? [...data.inventory] : [];
    inv.push({ ...picked, obtainedAtMs: Date.now(), source: "dailyShop" });
    const updates = { inventory: inv, updatedAt: serverTimestamp() };
    if (currency === "banknot") {
      const walletVal = Number(data.wallet?.banknot || 0);
      if (walletVal < picked.priceBanknot) throw new Error("Yetersiz Banknot.");
      updates["wallet.banknot"] = walletVal - picked.priceBanknot;
    } else {
      const walletVal = Number(data.wallet?.cekip || 0);
      if (walletVal < picked.priceCekip) throw new Error("Yetersiz Çekip.");
      updates["wallet.cekip"] = Number((walletVal - picked.priceCekip).toFixed(2));
    }
    tx.update(userRef, updates);
  });
}

async function createDepositRequest(uid, amount, receiptUrl, note) {
  await addDoc(collection(db, "depositrequests"), {
    uid,
    amountCekip: Number(amount),
    receiptUrl,
    note: note || "",
    status: "pending",
    createdAt: serverTimestamp()
  });
}

async function createWithdrawRequest(uid, amount, iban, fullName) {
  await addDoc(collection(db, "withdrawrequests"), {
    uid,
    amountCekip: Number(amount),
    iban,
    fullName,
    status: "pending",
    createdAt: serverTimestamp()
  });
}

async function createSupportTicket(uid, title, message) {
  const ticketRef = await addDoc(collection(db, "supporttickets"), {
    uid,
    title,
    lastMessage: message,
    message,
    status: "open",
    lastSenderRole: "user",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
  await addDoc(collection(db, "supportmessages"), {
    ticketId: ticketRef.id,
    uid,
    senderRole: "user",
    text: message,
    createdAt: serverTimestamp()
  });
  return ticketRef.id;
}

async function sendSupportMessage(ticketId, uid, text, senderRole) {
  const ticketRef = doc(db, "supporttickets", ticketId);
  const ticketSnap = await getDoc(ticketRef);
  if (!ticketSnap.exists()) throw new Error("Talep bulunamadı.");
  const tData = ticketSnap.data();
  if (senderRole === "user" && tData.uid !== uid) throw new Error("Bu talep sana ait değil.");
  if (tData.status !== "open") throw new Error("Talep kapalı.");

  await addDoc(collection(db, "supportmessages"), {
    ticketId,
    uid,
    senderRole,
    text,
    createdAt: serverTimestamp()
  });

  await updateDoc(ticketRef, {
    lastMessage: text,
    lastSenderRole: senderRole,
    updatedAt: serverTimestamp()
  });
}

async function closeSupportTicket(ticketId) {
  await updateDoc(doc(db, "supporttickets", ticketId), {
    status: "closed",
    updatedAt: serverTimestamp()
  });
}

async function loadUserTickets(uid) {
  const qRef = query(collection(db, "supporttickets"), where("uid", "==", uid), orderBy("createdAt", "desc"), limit(20));
  const snap = await getDocs(qRef);
  const tickets = [];
  snap.forEach((d) => tickets.push({ id: d.id, ...d.data() }));
  return tickets;
}

async function loadAllTicketsForAdmin() {
  const qRef = query(collection(db, "supporttickets"), orderBy("createdAt", "desc"), limit(40));
  const snap = await getDocs(qRef);
  const tickets = [];
  snap.forEach((d) => tickets.push({ id: d.id, ...d.data() }));
  return tickets;
}

async function loadSupportMessages(ticketId) {
  const qRef = query(collection(db, "supportmessages"), where("ticketId", "==", ticketId), orderBy("createdAt", "asc"), limit(200));
  const snap = await getDocs(qRef);
  const messages = [];
  snap.forEach((d) => messages.push({ id: d.id, ...d.data() }));
  return messages;
}

function renderMessageList(target, list) {
  if (!list.length) {
    target.innerHTML = "<p class='muted'>Mesaj yok.</p>";
    return;
  }
  target.innerHTML = list.map((m) => `
    <div class="msg-bubble ${m.senderRole === "admin" ? "msg-admin" : "msg-user"}">
      <div><strong>${m.senderRole === "admin" ? "Admin" : "Sen"}</strong></div>
      <div>${m.text || ""}</div>
    </div>
  `).join("");
  target.scrollTop = target.scrollHeight;
}

async function renderUserSupportArea() {
  if (!currentUser) return;
  const tickets = await loadUserTickets(currentUser.uid);
  if (!selectedUserTicketId && tickets.length) selectedUserTicketId = tickets[0].id;
  if (selectedUserTicketId && !tickets.find((t) => t.id === selectedUserTicketId)) selectedUserTicketId = tickets[0]?.id || null;

  el.supportTicketsList.innerHTML = tickets.map((t) => `
    <div class="support-ticket-item ${t.id === selectedUserTicketId ? "active" : ""}" data-ticket-id="${t.id}">
      <div><strong>${t.title}</strong></div>
      <div class="muted">${t.status === "open" ? "Açık" : "Kapalı"} • ${t.lastSenderRole === "admin" ? "Admin cevapladı" : "Sen yazdın"}</div>
    </div>
  `).join("") || "<p class='muted'>Henüz talebin yok.</p>";

  if (!selectedUserTicketId) {
    el.supportMessages.innerHTML = "<p class='muted'>Bir talep seç.</p>";
    return;
  }
  const messages = await loadSupportMessages(selectedUserTicketId);
  renderMessageList(el.supportMessages, messages);
}

async function renderAdminSupportArea() {
  if (!currentData?.isAdmin) return;
  const tickets = await loadAllTicketsForAdmin();
  if (!selectedAdminTicketId && tickets.length) selectedAdminTicketId = tickets[0].id;
  if (selectedAdminTicketId && !tickets.find((t) => t.id === selectedAdminTicketId)) selectedAdminTicketId = tickets[0]?.id || null;

  el.adminSupportTickets.innerHTML = tickets.map((t) => `
    <div class="support-ticket-item ${t.id === selectedAdminTicketId ? "active" : ""}" data-admin-ticket-id="${t.id}">
      <div><strong>${t.title}</strong></div>
      <div class="muted">UID: ${t.uid}</div>
      <div class="muted">${t.status === "open" ? "Açık" : "Kapalı"} • Son: ${t.lastSenderRole === "admin" ? "Admin" : "Kullanıcı"}</div>
    </div>
  `).join("") || "<p class='muted'>Talep yok.</p>";

  if (!selectedAdminTicketId) {
    el.adminSupportMessages.innerHTML = "<p class='muted'>Bir talep seç.</p>";
    return;
  }
  const messages = await loadSupportMessages(selectedAdminTicketId);
  renderMessageList(el.adminSupportMessages, messages);
}

async function adminResolveRequest(kind, requestId, approve) {
  const col = kind === "deposit" ? "depositrequests" : "withdrawrequests";
  const reqRef = doc(db, col, requestId);
  await runTransaction(db, async (tx) => {
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists()) throw new Error("Talep bulunamadı.");
    const req = reqSnap.data();
    if (req.status !== "pending") throw new Error("Talep zaten işlenmiş.");
    tx.update(reqRef, {
      status: approve ? "approved" : "rejected",
      resolvedAt: serverTimestamp(),
      resolvedBy: currentUser.uid
    });

    if (!approve) return;
    const userRef = doc(db, "users", req.uid);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return;
    const user = userSnap.data();
    const walletCekip = Number(user.wallet?.cekip || 0);
    const amount = Number(req.amountCekip || 0);
    if (kind === "deposit") {
      tx.update(userRef, { "wallet.cekip": Number((walletCekip + amount).toFixed(2)), updatedAt: serverTimestamp() });
    } else {
      const next = Number((walletCekip - amount).toFixed(2));
      if (next < 0) throw new Error("Kullanıcı bakiyesi yetersiz.");
      tx.update(userRef, { "wallet.cekip": next, updatedAt: serverTimestamp() });
    }
  });
}

async function adminUserAction(uid, deltaKmr, deltaBanknot, deltaCekip, banState) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error("Kullanıcı yok.");
    const data = snap.data();
    const kmr = Math.max(0, Math.floor(Number(data.wallet?.kmr || 0) + deltaKmr));
    const banknot = Math.max(0, Math.floor(Number(data.wallet?.banknot || 0) + deltaBanknot));
    const cekip = Math.max(0, Number((Number(data.wallet?.cekip || 0) + deltaCekip).toFixed(2)));
    const updates = {
      "wallet.kmr": kmr,
      "wallet.banknot": banknot,
      "wallet.cekip": cekip,
      updatedAt: serverTimestamp()
    };
    if (banState === "ban") updates.isBanned = true;
    if (banState === "unban") updates.isBanned = false;
    tx.update(userRef, updates);
  });
}

async function adminItemAction(uid, itemName, ph, action) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error("Kullanıcı yok.");
    const data = snap.data();
    let inventory = Array.isArray(data.inventory) ? [...data.inventory] : [];
    if (action === "add") {
      inventory.push({
        id: `admin-${Date.now()}`,
        name: itemName,
        rarity: "Admin",
        ph: Math.floor(Math.max(1, Number(ph))),
        obtainedAtMs: Date.now(),
        source: "admin"
      });
    } else {
      const idx = inventory.findIndex((it) => it.name === itemName && Number(it.ph) === Number(ph));
      if (idx === -1) throw new Error("Silinecek eşya bulunamadı.");
      inventory.splice(idx, 1);
    }
    tx.update(userRef, { inventory, updatedAt: serverTimestamp() });
  });
}

async function adminSetRole(uid, action) {
  const userRef = doc(db, "users", uid);
  const target = await getDoc(userRef);
  if (!target.exists()) throw new Error("Kullanıcı yok.");
  await updateDoc(userRef, {
    isAdmin: action === "grant",
    updatedAt: serverTimestamp()
  });
}

async function adminMinerAction(uid, minerType, action) {
  const cfg = getMinerByKey(minerType);
  if (!cfg) throw new Error("Madenci tipi yok.");
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error("Kullanıcı yok.");
    const data = snap.data();
    const miners = Array.isArray(data.miners) ? [...data.miners] : [];
    if (action === "add") {
      const level = 1;
      const perSec = getMinerKmrPerSec(cfg.baseKmrPerSec, level);
      miners.push({
        typeKey: cfg.key,
        level,
        energy: perSec * 3600 * ENERGY_HOURS,
        maxEnergy: perSec * 3600 * ENERGY_HOURS,
        updatedAtMs: Date.now(),
        source: "admin"
      });
      tx.update(userRef, { miners, updatedAt: serverTimestamp() });
      return;
    }
    if (!miners.length) throw new Error("Silinecek madenci yok.");
    miners.pop();
    tx.update(userRef, { miners, updatedAt: serverTimestamp() });
  });
}

function bindTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const id = btn.getAttribute("data-tab");
      const panel = document.getElementById(`tab-${id}`);
      if (panel) panel.classList.add("active");
    });
  });
}

function bindAuth() {
  el.registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const username = el.regUsername.value.trim();
      const email = el.regEmail.value.trim();
      const password = el.regPassword.value;
      if (username.length < 3) throw new Error("Kullanıcı adı en az 3 karakter olmalı.");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });
      await ensureUserDoc(cred.user, username);
      showMsg(el.authMessage, "Kayıt başarılı.");
    } catch (err) {
      showMsg(el.authMessage, err.message || "Kayıt hatası.", true);
    }
  });

  el.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const email = el.loginEmail.value.trim();
      const password = el.loginPassword.value;
      await signInWithEmailAndPassword(auth, email, password);
      showMsg(el.authMessage, "Giriş başarılı.");
    } catch (err) {
      showMsg(el.authMessage, err.message || "Giriş hatası.", true);
    }
  });

  el.logoutBtn.addEventListener("click", () => signOut(auth));
}

function bindProfileAndSupport() {
  el.openProfileBtn.addEventListener("click", () => {
    if (!currentData) return;
    el.profileUsername.value = currentData.username || "";
    el.profileModal.classList.remove("hidden");
  });

  el.closeProfileBtn.addEventListener("click", () => {
    el.profileModal.classList.add("hidden");
  });

  el.profileModal.addEventListener("click", (ev) => {
    if (ev.target === el.profileModal) el.profileModal.classList.add("hidden");
  });

  el.profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const nextUsername = el.profileUsername.value.trim();
      if (nextUsername.length < 3) throw new Error("Kullanıcı adı en az 3 karakter olmalı.");
      if (!currentUser) throw new Error("Oturum bulunamadı.");
      await updateProfile(currentUser, { displayName: nextUsername });
      await updateDoc(doc(db, "users", currentUser.uid), {
        username: nextUsername,
        updatedAt: serverTimestamp()
      });
      showMsg(el.profileMessage, "Profil güncellendi.");
      await rerender();
    } catch (err) {
      showMsg(el.profileMessage, err.message || "Profil güncellenemedi.", true);
    }
  });

  el.toggleSupportBtn.addEventListener("click", () => {
    el.supportPanel.classList.toggle("hidden");
  });

  el.supportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      if (!currentUser) throw new Error("Oturum bulunamadı.");
      const title = el.supportTitle.value.trim();
      const message = el.supportMessageInput.value.trim();
      if (!title || !message) throw new Error("Konu ve mesaj zorunlu.");
      const newId = await createSupportTicket(currentUser.uid, title, message);
      selectedUserTicketId = newId;
      showMsg(el.supportMessage, "Destek talebin gönderildi.");
      el.supportForm.reset();
      await renderUserSupportArea();
    } catch (err) {
      showMsg(el.supportMessage, err.message || "Destek talebi gönderilemedi.", true);
    }
  });

  el.supportTicketsList.addEventListener("click", async (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    const wrap = target.closest("[data-ticket-id]");
    if (!wrap) return;
    selectedUserTicketId = wrap.getAttribute("data-ticket-id");
    await renderUserSupportArea();
  });

  el.supportReplyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      if (!currentUser) throw new Error("Oturum yok.");
      if (!selectedUserTicketId) throw new Error("Önce bir talep seç.");
      const text = el.supportReplyInput.value.trim();
      if (!text) throw new Error("Mesaj boş olamaz.");
      await sendSupportMessage(selectedUserTicketId, currentUser.uid, text, "user");
      el.supportReplyInput.value = "";
      await renderUserSupportArea();
      if (currentData?.isAdmin) await renderAdminSupportArea();
    } catch (err) {
      showMsg(el.supportMessage, err.message || "Mesaj gönderilemedi.", true);
    }
  });

  el.adminSupportTickets.addEventListener("click", async (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    const wrap = target.closest("[data-admin-ticket-id]");
    if (!wrap) return;
    selectedAdminTicketId = wrap.getAttribute("data-admin-ticket-id");
    await renderAdminSupportArea();
  });

  el.adminSupportReplyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      if (!currentUser || !currentData?.isAdmin) throw new Error("Admin yetkisi yok.");
      if (!selectedAdminTicketId) throw new Error("Talep seç.");
      const text = el.adminSupportReplyText.value.trim();
      if (!text) throw new Error("Mesaj boş.");
      await sendSupportMessage(selectedAdminTicketId, currentUser.uid, text, "admin");
      el.adminSupportReplyText.value = "";
      await renderAdminSupportArea();
      await renderUserSupportArea();
    } catch (err) {
      showMsg(el.adminMessage, err.message || "Admin mesaj gönderilemedi.", true);
    }
  });

  el.adminCloseTicketBtn.addEventListener("click", async () => {
    try {
      if (!currentUser || !currentData?.isAdmin) throw new Error("Admin yetkisi yok.");
      if (!selectedAdminTicketId) throw new Error("Talep seç.");
      await closeSupportTicket(selectedAdminTicketId);
      showMsg(el.adminMessage, "Talep kapatıldı.");
      await renderAdminSupportArea();
      await renderUserSupportArea();
    } catch (err) {
      showMsg(el.adminMessage, err.message || "Talep kapatılamadı.", true);
    }
  });
}

async function renderAdminLists() {
  if (!currentData?.isAdmin) return;
  const dQ = query(collection(db, "depositrequests"), where("status", "==", "pending"), orderBy("createdAt", "desc"), limit(20));
  const wQ = query(collection(db, "withdrawrequests"), where("status", "==", "pending"), orderBy("createdAt", "desc"), limit(20));
  const [dSnap, wSnap] = await Promise.all([getDocs(dQ), getDocs(wQ)]);

  const dHtml = [];
  dSnap.forEach((s) => {
    const d = s.data();
    dHtml.push(`
      <div class="request-card">
        <p><strong>UID:</strong> ${d.uid}</p>
        <p><strong>Tutar:</strong> ${fmt(d.amountCekip, 2)} Çekip</p>
        <p><a href="${d.receiptUrl}" target="_blank">Dekont URL</a></p>
        <div class="chest-row">
          <button class="btn small admin-resolve-btn" data-kind="deposit" data-id="${s.id}" data-appr="1">Onayla</button>
          <button class="btn small admin-resolve-btn" data-kind="deposit" data-id="${s.id}" data-appr="0">Reddet</button>
        </div>
      </div>
    `);
  });
  el.adminDepositRequests.innerHTML = dHtml.join("") || "<p class='muted'>Bekleyen talep yok.</p>";

  const wHtml = [];
  wSnap.forEach((s) => {
    const d = s.data();
    wHtml.push(`
      <div class="request-card">
        <p><strong>UID:</strong> ${d.uid}</p>
        <p><strong>Tutar:</strong> ${fmt(d.amountCekip, 2)} Çekip</p>
        <p><strong>Ad:</strong> ${d.fullName}</p>
        <p><strong>IBAN:</strong> ${d.iban}</p>
        <div class="chest-row">
          <button class="btn small admin-resolve-btn" data-kind="withdraw" data-id="${s.id}" data-appr="1">Onayla</button>
          <button class="btn small admin-resolve-btn" data-kind="withdraw" data-id="${s.id}" data-appr="0">Reddet</button>
        </div>
      </div>
    `);
  });
  el.adminWithdrawRequests.innerHTML = wHtml.join("") || "<p class='muted'>Bekleyen talep yok.</p>";
}

function bindGameActions() {
  el.collectAllBtn.addEventListener("click", async () => {
    if (!currentUser) return;
    await collectAll(currentUser.uid);
    await rerender();
  });

  el.expandCaveBtn.addEventListener("click", async () => {
    try {
      await expandCave(currentUser.uid);
      await rerender();
    } catch (err) {
      alert(err.message || "İşlem başarısız.");
    }
  });

  el.convertKmrBtn.addEventListener("click", async () => {
    try {
      await convertKmrToBanknot(currentUser.uid);
      await rerender();
    } catch (err) {
      alert(err.message || "Dönüşüm başarısız.");
    }
  });

  el.convertBanknotBtn.addEventListener("click", async () => {
    try {
      await convertBanknotToCekip(currentUser.uid);
      await rerender();
    } catch (err) {
      alert(err.message || "Dönüşüm başarısız.");
    }
  });

  el.minersContainer.addEventListener("click", async (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains("energy-btn")) {
      try {
        const idx = Number(target.getAttribute("data-idx"));
        const cost = Number(target.getAttribute("data-cost"));
        await refillEnergy(currentUser.uid, idx, cost);
        await rerender();
      } catch (err) {
        alert(err.message || "Enerji doldurulamadı.");
      }
      return;
    }
    if (target.classList.contains("lvlup-btn")) {
      try {
        const idx = Number(target.getAttribute("data-idx"));
        await levelUpMiner(currentUser.uid, idx);
        await rerender();
      } catch (err) {
        alert(err.message || "Level up başarısız.");
      }
    }
  });

  el.minerStore.addEventListener("click", async (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains("buy-miner-btn")) return;
    try {
      await buyMiner(currentUser.uid, target.getAttribute("data-key"));
      await rerender();
    } catch (err) {
      alert(err.message || "Madenci alınamadı.");
    }
  });

  el.openBasicChestBtn.addEventListener("click", async () => {
    try {
      const r = await openChest(currentUser.uid, "basic");
      el.chestResult.textContent = r.item ? `Kazanç: ${r.item.name} (+${r.item.ph} PH)` : `Kazanç: +${r.cekip} Çekip`;
      await rerender();
    } catch (err) {
      el.chestResult.textContent = err.message || "Sandık açılamadı.";
    }
  });

  el.openBombChestBtn.addEventListener("click", async () => {
    try {
      const r = await openChest(currentUser.uid, "bomb");
      el.chestResult.textContent = r.item ? `Kazanç: ${r.item.name} (+${r.item.ph} PH)` : `Kazanç: +${r.cekip} Çekip`;
      await rerender();
    } catch (err) {
      el.chestResult.textContent = err.message || "Bomba kutusu açılamadı.";
    }
  });

  el.dailyShop.addEventListener("click", async (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    try {
      const idx = Number(target.getAttribute("data-idx"));
      if (target.classList.contains("buy-daily-banknot-btn")) await buyDailyItem(currentUser.uid, idx, "banknot");
      if (target.classList.contains("buy-daily-cekip-btn")) await buyDailyItem(currentUser.uid, idx, "cekip");
      await rerender();
    } catch (err) {
      alert(err.message || "Satın alma başarısız.");
    }
  });

  el.depositForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await createDepositRequest(
        currentUser.uid,
        toSafeNumber(document.getElementById("depositAmount").value, 1),
        document.getElementById("depositReceiptUrl").value.trim(),
        document.getElementById("depositNote").value.trim()
      );
      showMsg(el.financeMessage, "Yatırma talebi alındı.");
      el.depositForm.reset();
    } catch (err) {
      showMsg(el.financeMessage, err.message || "Yatırma talebi hatası.", true);
    }
  });

  el.withdrawForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const amount = toSafeNumber(document.getElementById("withdrawAmount").value, 0.1);
      if ((currentData?.wallet?.cekip || 0) < amount) throw new Error("Yetersiz Çekip.");
      await createWithdrawRequest(
        currentUser.uid,
        amount,
        document.getElementById("withdrawIban").value.trim(),
        document.getElementById("withdrawName").value.trim()
      );
      showMsg(el.financeMessage, "Çekim talebi alındı.");
      el.withdrawForm.reset();
    } catch (err) {
      showMsg(el.financeMessage, err.message || "Çekim talebi hatası.", true);
    }
  });

  el.adminUserActionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const uid = document.getElementById("adminTargetUid").value.trim();
      const dK = toSafeNumber(document.getElementById("adminDeltaKmr").value, 0);
      const dB = toSafeNumber(document.getElementById("adminDeltaBanknot").value, 0);
      const dC = toSafeNumber(document.getElementById("adminDeltaCekip").value, 0);
      const banState = document.getElementById("adminBanState").value;
      await adminUserAction(uid, dK, dB, dC, banState);
      showMsg(el.adminMessage, "Kullanıcı işlemi başarılı.");
    } catch (err) {
      showMsg(el.adminMessage, err.message || "Kullanıcı işlemi hatası.", true);
    }
  });

  el.adminItemActionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const uid = document.getElementById("adminItemUid").value.trim();
      const name = document.getElementById("adminItemName").value.trim();
      const ph = toSafeNumber(document.getElementById("adminItemPh").value, 1);
      const action = document.getElementById("adminItemAction").value;
      await adminItemAction(uid, name, ph, action);
      showMsg(el.adminMessage, "Eşya işlemi başarılı.");
    } catch (err) {
      showMsg(el.adminMessage, err.message || "Eşya işlemi hatası.", true);
    }
  });

  el.adminSetRoleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const uid = document.getElementById("adminRoleUid").value.trim();
      const action = document.getElementById("adminRoleAction").value;
      await adminSetRole(uid, action);
      showMsg(el.adminMessage, "Rol işlemi başarılı.");
    } catch (err) {
      showMsg(el.adminMessage, err.message || "Rol işlemi hatası.", true);
    }
  });

  el.adminMinerActionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const uid = document.getElementById("adminMinerUid").value.trim();
      const minerType = document.getElementById("adminMinerType").value;
      const action = document.getElementById("adminMinerAction").value;
      await adminMinerAction(uid, minerType, action);
      showMsg(el.adminMessage, "Madenci işlemi başarılı.");
    } catch (err) {
      showMsg(el.adminMessage, err.message || "Madenci işlemi hatası.", true);
    }
  });

  document.getElementById("tab-admin").addEventListener("click", async (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains("admin-resolve-btn")) return;
    try {
      const kind = target.getAttribute("data-kind");
      const id = target.getAttribute("data-id");
      const appr = target.getAttribute("data-appr") === "1";
      await adminResolveRequest(kind, id, appr);
      showMsg(el.adminMessage, "Talep işlendi.");
      await renderAdminLists();
    } catch (err) {
      showMsg(el.adminMessage, err.message || "Talep işleme hatası.", true);
    }
  });
}

function renderMineCardsWithLevelUp() {
  const cards = el.minersContainer.querySelectorAll(".miner-card");
  cards.forEach((card, idx) => {
    const miner = currentData?.miners?.[idx];
    if (!miner) return;
    const cfg = getMinerByKey(miner.typeKey);
    if (!cfg) return;
    const nextLevel = Number(miner.level || 1) + 1;
    const btn = document.createElement("button");
    btn.className = "btn small lvlup-btn";
    if (nextLevel <= MAX_LEVEL) {
      const cost = getMinerLevelCost(cfg.baseCost, nextLevel);
      btn.textContent = `Lvl Yükselt (${fmt(cost)} Banknot)`;
      btn.setAttribute("data-idx", String(idx));
    } else {
      btn.textContent = "Max Level";
      btn.disabled = true;
    }
    card.appendChild(btn);
  });
}

async function rerender() {
  if (!currentUser) return;
  currentData = await refreshUserData(currentUser.uid);
  if (!currentData) return;
  if (currentData.isBanned) {
    alert("Hesabınız banlı. Admin ile iletişime geçiniz.");
    await signOut(auth);
    return;
  }
  renderWallet(currentData);
  renderMinerStore();
  renderMiners(currentData);
  renderMineCardsWithLevelUp();
  renderDailyShop();
  await renderLeaderboard();
  if (currentData.isAdmin) {
    el.adminTabBtn.classList.remove("hidden");
    await renderAdminLists();
    await renderAdminSupportArea();
  } else {
    el.adminTabBtn.classList.add("hidden");
  }
  await renderUserSupportArea();
}

async function handleAuthState(user) {
  currentUser = user;
  if (!user) {
    currentData = null;
    el.authView.classList.remove("hidden");
    el.gameView.classList.add("hidden");
    el.leftSidebar.classList.add("hidden");
    el.supportWidget.classList.add("hidden");
    el.logoutBtn.classList.add("hidden");
    el.profileModal.classList.add("hidden");
    if (refreshTimer) clearInterval(refreshTimer);
    return;
  }

  await ensureUserDoc(user);
  el.authView.classList.add("hidden");
  el.gameView.classList.remove("hidden");
  el.leftSidebar.classList.remove("hidden");
  el.supportWidget.classList.remove("hidden");
  el.logoutBtn.classList.remove("hidden");
  await rerender();
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(rerender, 5000);
}

function init() {
  tryTelegramBootstrap();
  bindTabs();
  bindAuth();
  bindProfileAndSupport();
  bindGameActions();
  onAuthStateChanged(auth, handleAuthState);
}

init();
