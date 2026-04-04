// =============================================
//  REİSZAS — MADEN İMPARATORLUĞU
//  game.js — Final Version
// =============================================

// Guard: Çift yükleme önleme
if (window.__REISZAS_GAME_INSTANCE__) {
  console.log('Game zaten yüklü, atlıyorum...');
  throw new Error('ALREADY_LOADED');
}
window.__REISZAS_LOADED__ = true;

// =============================================
//  FIREBASE IMPORTS
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, onAuthStateChanged, signOut, updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection,
  query, where, getDocs, addDoc, serverTimestamp, onSnapshot,
  orderBy, limit, deleteDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =============================================
//  FIREBASE INIT
// =============================================

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

// =============================================
//  CONSTANTS
// =============================================

const MINE_INTERVAL_MS = 20 * 60 * 1000;
const LEAGUE_INTERVAL_MS = 30 * 60 * 1000;
const FLASH_DEAL_INTERVAL_MS = 3 * 60 * 60 * 1000;
const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000;
const BANKNOT_TO_GOLD = 10000;
const GOLD_TO_TL = 1000;

const MINERS = {
  kubra:  { name: 'Kübra', mult: 2, earn: 50,  period: MINE_INTERVAL_MS },
  beyza:  { name: 'Beyza', mult: 3, earn: 100, period: 60 * 60 * 1000 },
  ali:    { name: 'Ali',   mult: 5, earn: 200, period: 60 * 60 * 1000 },
};

const CHEST_CONFIG = {
  bronze:    { price: 500,   label: 'Bronz Sandık',    icon: '📦' },
  silver:    { price: 1500,  label: 'Gümüş Sandık',   icon: '🎁' },
  gold:      { price: 5000,  label: 'Altın Sandık',   icon: '🏆' },
  diamond:   { price: 15000, label: 'Elmas Sandık',   icon: '💎' },
  legendary: { price: 50000, label: 'Efsanevi Sandık',icon: '🌟' },
};

const ITEM_NAMES = [
  'Demir Kazma','Bakır Keski','Altın Balta','Gümüş Kürek','Elmas Matkap',
  'Titanyum Miğfer','Kobalt Eldiven','Platin Çizme','Obsidyen Zırh','Kristal Fener',
  'Mana Yüzüğü','Güç Kolyesi','Hız Kemeri','Sağlamlık Bilezik','Şans Tılsımı',
  'Yanardöner Taş','Ateş Ruhu','Su Kristali','Toprak Sütunu','Hava Büyüsü',
  'Karanlık Parça','Işık Kırığı','Gök Mavisi','Yıldız Tozu','Ay Taşı',
  'Güneş Kırığı','Bulut Taşı','Şimşek Cevheri','Volkan Külü','Deniz Taşı',
  'Orman Ruhu','Çöl Kumu','Buz Parçası','Lahar Taşı','Mercan Kırığı',
  'Kehribar Küre','Zebercet Parçası','Safir Kristal','Yakut Taşı','Zümrüt Kırık',
  'Ametist Tozu','Turmalin Şerit','Kuvars Küre','Oniks Parça','Sedaf Kırığı',
  'Heliodor Taşı','Spinel Kristal','Tanzanit Tozu','Aleksandrit Parça','Zirkon Küre',
  'Demantoid Şerit','Tsavorit Kırık','Rhodolite Taşı','Grossular Küre','Andradit Parça',
  'Uvarovit Kristal','Pyrope Tozu','Almandine Şerit','Spessartine Kırık','Lazurit Küre',
  'Hauyn Parça','Sodalit Kristal','Nosean Tozu','Änit Kırık','Feldspar Şerit',
  'Labradorit Küre','Anorthit Parça','Albite Kristal','Oligoklaz Tozu','Andezin Şerit',
  'Biyotit Kırık','Muskovit Küre','Lepidolit Parça','Flogopit Kristal','Annit Tozu',
  'Hornblend Şerit','Aktinolit Kırık','Tremolit Küre','Glokofan Parça','Riebeckit Kristal',
  'Ornitin Tozu','Enstantit Şerit','Hipersten Kırık','Augit Küre','Diyopsit Parça',
  'Jadeyt Kristal','Spodumen Tozu','Berilit Şerit','Kolumbit Kırık','Tantal Küre',
  'Niyobyum Parça','Volfram Kristal','Molibden Tozu','Renyum Şerit','Osmiyum Kırık',
  'İridyum Küre','Paladyum Parça','Rodyum Kristal','Rutenyum Tozu','Germanyum Şerit',
  'Galyum Kırık','İndiyum Küre','Talyum Parça','Bizmut Kristal','Antiman Tozu'
];

const ITEM_ICONS = ['⚙️','🔩','⚒️','🪛','🔧','🛡️','💍','🧲','🪨','💎','🔮','🌟','✨','🌀','🔥','❄️','⚡','🌊','🍃','☀️'];

// =============================================
//  UTILITIES
// =============================================

function generateItem(idOverride) {
  const id = idOverride || `item_${Date.now()}_${Math.random().toString(36).substr(2,6)}`;
  const nameIdx = Math.floor(Math.random() * ITEM_NAMES.length);
  const iconIdx = Math.floor(Math.random() * ITEM_ICONS.length);
  const ph = Math.floor(Math.random() * 191) + 10;
  return { id, name: ITEM_NAMES[nameIdx], icon: ITEM_ICONS[iconIdx], ph };
}

function generateItems(count) {
  return Array.from({ length: count }, () => generateItem());
}

function openChest(type) {
  const rewards = [];
  const r = Math.random();
  switch (type) {
    case 'bronze':
      rewards.push({ type: 'banknot', amount: Math.floor(Math.random() * 300) + 100 });
      if (r < 0.7) rewards.push({ type: 'item', item: generateItem() });
      break;
    case 'silver':
      rewards.push({ type: 'banknot', amount: Math.floor(Math.random() * 800) + 200 });
      if (r < 0.8) rewards.push({ type: 'item', item: generateItem() });
      if (r < 0.1) rewards.push({ type: 'gold', amount: 1 });
      break;
    case 'gold':
      rewards.push({ type: 'item', item: generateItem() });
      rewards.push({ type: 'item', item: generateItem() });
      if (r < 0.3) rewards.push({ type: 'gold', amount: Math.floor(Math.random() * 3) + 1 });
      else rewards.push({ type: 'banknot', amount: Math.floor(Math.random() * 2000) + 500 });
      break;
    case 'diamond':
      rewards.push({ type: 'item', item: generateItem() });
      rewards.push({ type: 'item', item: generateItem() });
      rewards.push({ type: 'item', item: generateItem() });
      rewards.push({ type: 'gold', amount: Math.floor(Math.random() * 5) + 2 });
      break;
    case 'legendary':
      for (let i = 0; i < 5; i++) rewards.push({ type: 'item', item: generateItem() });
      rewards.push({ type: 'gold', amount: Math.floor(Math.random() * 15) + 5 });
      break;
  }
  return rewards;
}

function fmtNum(n) {
  if (n === undefined || n === null) return '0';
  return Number(n).toLocaleString('tr-TR');
}

function timeSince(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s önce`;
  if (diff < 3600) return `${Math.floor(diff/60)}dk önce`;
  if (diff < 86400) return `${Math.floor(diff/3600)}sa önce`;
  return d.toLocaleDateString('tr-TR');
}

function formatCountdown(ms) {
  if (ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

// =============================================
//  TOAST SYSTEM
// =============================================

const Toast = {
  container: null,
  init() { this.container = document.getElementById('toast-container'); },
  show(msg, type = 'info', duration = 3500) {
    if (!this.container) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
    t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    this.container.appendChild(t);
    setTimeout(() => {
      t.classList.add('fade-out');
      setTimeout(() => t.remove(), 300);
    }, duration);
  }
};

// =============================================
//  AUTH MODULE
// =============================================

const AuthModule = {
  async login(username, password) {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Kullanıcı adı bulunamadı.');
    const email = snap.docs[0].data().email;
    return signInWithEmailAndPassword(auth, email, password);
  },

  async register(email, username, password) {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snap = await getDocs(q);
    if (!snap.empty) throw new Error('Bu kullanıcı adı zaten alınmış.');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const startItems = generateItems(5);
    await setDoc(doc(db, 'users', uid), {
      uid, email, username,
      banknot: 500, gold: 0,
      items: startItems,
      miner: 'kubra',
      productionMode: 'banknot',
      splitRatio: 100,
      lastActive: Date.now(),
      lastMineTime: Date.now(),
      totalEarned: 0,
      leagueEarned: 0,
      settings: { theme: 'dark' },
      banned: false,
      isAdmin: false,
      createdAt: serverTimestamp(),
      avatarUrl: '',
    });
    return cred;
  },

  async resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  },

  async logout() {
    return signOut(auth);
  }
};

// =============================================
//  GAME CLASS
// =============================================

class Game {
  constructor() {
    this.user = null;
    this.userData = null;
    this.isAdmin = false;
    this.mineTimerInterval = null;
    this.leagueTimerInterval = null;
    this.flashTimerInterval = null;
    this.notifUnsubscribe = null;
    this.userUnsubscribe = null;
    this._mining = false;
    this._leagueStart = null;
    this._distributing = false;
    this.flashDealItem = null;
    this.flashDealExpiry = null;
    this.adminSelectedUid = null;
    this._uiBound = false;
  }

  async init() {
    Toast.init();
    this.setupParticles();
    this.bindAuthUI();

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.user = user;
        await this.loadUser();
        this.showGameScreen();
      } else {
        this.user = null;
        this.userData = null;
        this.showAuthScreen();
      }
    });
  }

  showAuthScreen() {
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('game-screen').classList.remove('active');
    this.clearTimers();
  }

  showGameScreen() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    this.applyTheme(this.userData?.settings?.theme || 'dark');
    this.renderAll();
    this.startTimers();
    this.subscribeRealtime();
    this.checkOfflineEarnings();
    this.generateFlashDeal();
  }

  bindAuthUI() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });

    document.getElementById('btn-login').addEventListener('click', async () => {
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const errEl = document.getElementById('login-error');
      errEl.textContent = '';
      if (!username || !password) { errEl.textContent = 'Tüm alanları doldurun.'; return; }
      try {
        document.getElementById('btn-login').disabled = true;
        await AuthModule.login(username, password);
      } catch (e) {
        errEl.textContent = this.firebaseErrMsg(e);
        document.getElementById('btn-login').disabled = false;
      }
    });

    document.getElementById('btn-register').addEventListener('click', async () => {
      const email = document.getElementById('reg-email').value.trim();
      const username = document.getElementById('reg-username').value.trim().toLowerCase();
      const password = document.getElementById('reg-password').value;
      const errEl = document.getElementById('reg-error');
      errEl.textContent = '';
      if (!email || !username || !password) { errEl.textContent = 'Tüm alanları doldurun.'; return; }
      if (username.length < 3) { errEl.textContent = 'Kullanıcı adı en az 3 karakter.'; return; }
      try {
        document.getElementById('btn-register').disabled = true;
        await AuthModule.register(email, username, password);
        Toast.show('Hesap oluşturuldu! Hoş geldin! ⛏', 'success');
      } catch (e) {
        errEl.textContent = this.firebaseErrMsg(e);
        document.getElementById('btn-register').disabled = false;
      }
    });

    document.getElementById('btn-forgot').addEventListener('click', async () => {
      const email = document.getElementById('forgot-email').value.trim();
      const errEl = document.getElementById('forgot-error');
      errEl.textContent = '';
      if (!email) { errEl.textContent = 'Email adresin gerekli.'; return; }
      try {
        await AuthModule.resetPassword(email);
        errEl.style.color = 'var(--green)';
        errEl.textContent = 'Sıfırlama linki gönderildi!';
      } catch (e) {
        errEl.textContent = this.firebaseErrMsg(e);
      }
    });
  }

  firebaseErrMsg(e) {
    const map = {
      'auth/wrong-password': 'Şifre yanlış.',
      'auth/user-not-found': 'Kullanıcı bulunamadı.',
      'auth/email-already-in-use': 'Email zaten kullanımda.',
      'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
      'auth/invalid-email': 'Geçersiz email adresi.',
      'auth/invalid-credential': 'Kullanıcı adı veya şifre hatalı.',
    };
    return map[e.code] || e.message;
  }

  async loadUser() {
    const ref = doc(db, 'users', this.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    this.userData = snap.data();
    this.isAdmin = this.userData.isAdmin || false;
    await updateDoc(ref, { lastActive: Date.now() });
  }

  renderAll() {
    if (!this.userData) return;
    this.renderHUD();
    this.renderSidebar();
    this.renderMinePanel();
    this.renderControlCenter();
    this.renderProfile();
    this.renderFinance();
    this.renderAdminSidebar();
    this.bindGameUI();
  }

  renderHUD() {
    const d = this.userData;
    document.getElementById('hud-banknot').textContent = fmtNum(d.banknot);
    document.getElementById('hud-gold').textContent = fmtNum(d.gold);
    document.getElementById('hud-ph').textContent = fmtNum(this.calcTotalPH());
    document.getElementById('hud-username').textContent = d.username;
    this.renderAvatar();
  }

  renderAvatar() {
    const d = this.userData;
    const url = d.avatarUrl;
    const setAv = (el) => {
      if (!el) return;
      if (url) { el.innerHTML = `<img src="${url}" onerror="this.parentElement.textContent='⛏'" />`; }
      else { el.textContent = '⛏'; }
    };
    setAv(document.getElementById('avatar-small'));
    setAv(document.getElementById('sidebar-avatar'));
    setAv(document.getElementById('big-avatar'));
  }

  renderSidebar() {
    document.getElementById('sidebar-username').textContent = this.userData.username;
  }

  renderAdminSidebar() {
    const el = document.getElementById('admin-sidebar-btn');
    if (el) el.style.display = this.isAdmin ? '' : 'none';
  }

  calcItemPH() {
    const items = this.userData?.items || [];
    return items.reduce((sum, it) => sum + (it.ph || 0), 0);
  }

  calcTotalPH() {
    const miner = MINERS[this.userData?.miner || 'kubra'];
    return this.calcItemPH() * miner.mult;
  }

  renderMinePanel() {
    const d = this.userData;
    const miner = MINERS[d.miner || 'kubra'];
    const totalPH = this.calcTotalPH();

    document.getElementById('active-miner-name').textContent = miner.name;
    document.getElementById('active-miner-display').textContent = `${miner.name} (×${miner.mult})`;
    document.getElementById('total-ph-display').textContent = fmtNum(totalPH);
    document.getElementById('prod-mode-display').textContent = d.productionMode === 'gold' ? 'Altın' : 'Banknot';
    document.getElementById('item-count-display').textContent = `(${(d.items||[]).length})`;

    document.querySelectorAll('.miner-card').forEach(c => {
      c.classList.toggle('active', c.dataset.miner === d.miner);
    });

    const grid = document.getElementById('items-grid');
    const items = d.items || [];
    if (!items.length) {
      grid.innerHTML = '<div class="empty-items">Henüz eşyan yok. Mağazadan sandık aç!</div>';
    } else {
      grid.innerHTML = items.map(it => `
        <div class="item-card" title="${it.name}">
          <div class="item-icon">${it.icon}</div>
          <div class="item-name">${it.name}</div>
          <div class="item-ph">⚡${it.ph}</div>
        </div>
      `).join('');
    }

    document.getElementById('prod-banknot').classList.toggle('active', d.productionMode !== 'gold');
    document.getElementById('prod-gold').classList.toggle('active', d.productionMode === 'gold');
  }

  renderControlCenter() {
    const d = this.userData;
    const totalPH = this.calcTotalPH();
    const itemPH = this.calcItemPH();
    const miner = MINERS[d.miner || 'kubra'];

    document.getElementById('ctrl-total-earned').textContent = `${fmtNum(d.totalEarned)} 💰`;
    document.getElementById('ctrl-ph').textContent = fmtNum(totalPH);
    document.getElementById('ctrl-miner').textContent = miner.name;
    document.getElementById('ctrl-items').textContent = (d.items||[]).length;
    document.getElementById('ctrl-league').textContent = `${fmtNum(d.leagueEarned)} 💰`;
    document.getElementById('item-ph-display').textContent = fmtNum(itemPH);
    document.getElementById('miner-mult-display').textContent = `×${miner.mult}`;
    document.getElementById('total-ph-display2').textContent = fmtNum(totalPH);
  }

  renderProfile() {
    const d = this.userData;
    document.getElementById('profile-email').textContent = d.email || '-';
    document.getElementById('profile-last-login').textContent =
      this.user?.metadata?.lastSignInTime ? new Date(this.user.metadata.lastSignInTime).toLocaleString('tr-TR') : '-';
    document.getElementById('profile-created').textContent =
      this.user?.metadata?.creationTime ? new Date(this.user.metadata.creationTime).toLocaleDateString('tr-TR') : '-';
    document.getElementById('profile-username-input').placeholder = d.username;
  }

  renderFinance() {
    const d = this.userData;
    document.getElementById('fin-banknot').textContent = fmtNum(d.banknot);
    document.getElementById('fin-gold').textContent = fmtNum(d.gold);
    const tl = ((d.gold || 0) / GOLD_TO_TL * 10).toFixed(2);
    document.getElementById('fin-tl').textContent = `${tl} ₺`;
  }

  bindGameUI() {
    if (this._uiBound) return;
    this._uiBound = true;

    document.getElementById('menu-toggle').addEventListener('click', () => {
      const sb = document.getElementById('sidebar');
      if (window.innerWidth <= 768) {
        sb.classList.toggle('mobile-open');
      } else {
        sb.classList.toggle('collapsed');
        document.getElementById('main-content').classList.toggle('full');
      }
    });

    document.querySelectorAll('.sidebar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.panel) this.switchPanel(btn.dataset.panel);
        if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('mobile-open');
      });
    });

    document.querySelectorAll('.bot-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bot-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.panel) this.switchPanel(btn.dataset.panel);
      });
    });

    document.getElementById('btn-logout').addEventListener('click', async () => {
      this.clearTimers();
      if (this.notifUnsubscribe) this.notifUnsubscribe();
      if (this.userUnsubscribe) this.userUnsubscribe();
      await AuthModule.logout();
    });

    document.getElementById('notif-bell').addEventListener('click', () => this.switchPanel('notifications'));
    document.getElementById('profile-chip').addEventListener('click', () => this.switchPanel('profile-panel'));
    document.getElementById('prod-banknot').addEventListener('click', () => this.setProductionMode('banknot'));
    document.getElementById('prod-gold').addEventListener('click', () => this.setProductionMode('gold'));

    document.getElementById('split-range').addEventListener('input', (e) => {
      const v = e.target.value;
      document.getElementById('split-label').textContent = `${v}% Banknot / ${100-v}% Altın`;
      this.updateUserData({ splitRatio: Number(v) });
    });

    document.querySelectorAll('.miner-card:not(.locked)').forEach(c => {
      c.addEventListener('click', () => this.selectMiner(c.dataset.miner));
    });

    document.querySelectorAll('.btn-chest').forEach(btn => {
      btn.addEventListener('click', () => this.buyChest(btn.dataset.chest));
    });

    document.getElementById('btn-close-chest').addEventListener('click', () => {
      document.getElementById('chest-result-modal').style.display = 'none';
    });

    document.getElementById('convert-banknot').addEventListener('input', (e) => {
      const amt = parseInt(e.target.value) || 0;
      const gold = Math.floor(amt / BANKNOT_TO_GOLD);
      document.getElementById('convert-preview').textContent = `= ${fmtNum(gold)} Altın`;
    });

    document.getElementById('btn-convert').addEventListener('click', () => this.convertBanknotToGold());
    document.getElementById('btn-withdraw').addEventListener('click', () => this.createWithdrawRequest());

    document.getElementById('btn-set-avatar').addEventListener('click', () => {
      const url = document.getElementById('avatar-url-field').value.trim();
      if (!url) { Toast.show('URL gir.', 'warn'); return; }
      this.updateUserData({ avatarUrl: url });
      this.userData.avatarUrl = url;
      this.renderAvatar();
      Toast.show('Fotoğraf güncellendi!', 'success');
    });

    document.getElementById('btn-change-username').addEventListener('click', () => this.changeUsername());
    document.getElementById('btn-change-pass').addEventListener('click', () => this.changePassword());

    document.getElementById('btn-dm-send').addEventListener('click', () => this.sendDM());
    document.getElementById('dm-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.sendDM();
    });

    document.getElementById('btn-support-send').addEventListener('click', () => this.sendSupportTicket());

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.dataset.theme;
        this.applyTheme(theme);
        this.updateUserData({ 'settings.theme': theme });
        this.userData.settings = { ...(this.userData.settings||{}), theme };
      });
    });

    this.bindAdminUI();

    document.getElementById('btn-claim-offline').addEventListener('click', () => {
      document.getElementById('offline-modal').style.display = 'none';
    });

    this.loadMyRequests();
    this.loadMyTickets();
  }

  switchPanel(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`panel-${name}`);
    if (panel) panel.classList.add('active');

    document.querySelectorAll('.sidebar-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.panel === name);
    });

    if (name === 'notifications') this.loadNotifications();
    if (name === 'admin' && this.isAdmin) this.loadAdminPanel();
    if (name === 'control') this.loadDMHistory();
    if (name === 'store') this.renderFlashDeal();
  }

  applyTheme(theme) {
    document.body.dataset.theme = theme || 'dark';
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === (theme || 'dark'));
    });
  }

  async setProductionMode(mode) {
    this.userData.productionMode = mode;
    await this.updateUserData({ productionMode: mode });
    document.getElementById('prod-banknot').classList.toggle('active', mode !== 'gold');
    document.getElementById('prod-gold').classList.toggle('active', mode === 'gold');
    document.getElementById('prod-split-row').style.display = mode === 'gold' ? '' : 'none';
    document.getElementById('prod-mode-display').textContent = mode === 'gold' ? 'Altın' : 'Banknot';
    Toast.show(`Üretim modu: ${mode === 'gold' ? 'Altın' : 'Banknot'}`, 'info');
  }

  async selectMiner(minerKey) {
    this.userData.miner = minerKey;
    await this.updateUserData({ miner: minerKey });
    const miner = MINERS[minerKey];
    document.getElementById('active-miner-name').textContent = miner.name;
    document.getElementById('active-miner-display').textContent = `${miner.name} (×${miner.mult})`;
    document.querySelectorAll('.miner-card').forEach(c => {
      c.classList.toggle('active', c.dataset.miner === minerKey);
    });
    this.renderControlCenter();
    this.renderHUD();
    Toast.show(`${miner.name} seçildi!`, 'success');
  }

  startTimers() {
    this.mineTimerInterval = setInterval(() => this.tickMineTimer(), 1000);
    this.leagueTimerInterval = setInterval(() => this.tickLeagueTimer(), 1000);
    this.flashTimerInterval = setInterval(() => this.tickFlashTimer(), 1000);
  }

  clearTimers() {
    clearInterval(this.mineTimerInterval);
    clearInterval(this.leagueTimerInterval);
    clearInterval(this.flashTimerInterval);
  }

  tickMineTimer() {
    const last = this.userData?.lastMineTime || Date.now();
    const elapsed = Date.now() - last;
    const remaining = MINE_INTERVAL_MS - elapsed;
    const el = document.getElementById('mine-timer');
    
    if (remaining <= 0) {
      if (el) el.textContent = "00:00";
      this.triggerMineReward();
    } else {
      if (el) el.textContent = formatCountdown(remaining);
    }
  }

  async triggerMineReward() {
    if (this._mining) return;
    this._mining = true;
    
    try {
      const miner = MINERS[this.userData.miner || 'kubra'];
      let reward = miner.earn;
      const mode = this.userData.productionMode || 'banknot';
      const ratio = (this.userData.splitRatio ?? 100) / 100;

      let updates = { lastMineTime: Date.now() };

      if (mode === 'gold') {
        const goldAmt = Math.floor(reward / BANKNOT_TO_GOLD);
        if (goldAmt > 0) updates.gold = (this.userData.gold || 0) + goldAmt;
        else updates.banknot = (this.userData.banknot || 0) + reward;
      } else {
        const banknotAmt = Math.floor(reward * ratio);
        const goldAmt = Math.floor((reward * (1-ratio)) / BANKNOT_TO_GOLD);
        updates.banknot = (this.userData.banknot || 0) + banknotAmt;
        if (goldAmt > 0) updates.gold = (this.userData.gold || 0) + goldAmt;
      }

      updates.totalEarned = (this.userData.totalEarned || 0) + reward;

      await this.updateUserData(updates);
      Object.assign(this.userData, updates);
      
      this.renderHUD();
      this.renderFinance();
      this.renderControlCenter();
      this.spawnOrePop();
      
      const el = document.getElementById('mine-timer');
      if (el) el.textContent = formatCountdown(MINE_INTERVAL_MS);
      
      Toast.show(`Kazım tamamlandı! +${reward} 💰`, 'success');
      await this.addNotification('Kazım tamamlandı! +' + reward + ' 💰', 'reward');
      
    } catch (e) {
      console.error('Mining error:', e);
      Toast.show('Kazım hatası!', 'error');
    } finally {
      this._mining = false;
    }
  }

  async tickLeagueTimer() {
    if (!this._leagueStart) this._leagueStart = Date.now();
    const elapsed = Date.now() - this._leagueStart;
    const remaining = LEAGUE_INTERVAL_MS - elapsed;
    const el = document.getElementById('league-timer');
    if (el) el.textContent = formatCountdown(Math.max(0, remaining));

    if (remaining <= 0) {
      this._leagueStart = Date.now();
      await this.distributeLeague();
    }
    this.updateLeagueShare();
  }

  async updateLeagueShare() {
    const myPH = this.calcTotalPH();
    const el = document.getElementById('league-share');
    if (!el) return;
    const estimate = myPH > 0 ? Math.floor((myPH / Math.max(myPH, 1000)) * 1000) : 0;
    el.textContent = `~${estimate} 💰`;
  }

  async distributeLeague() {
    if (this._distributing) return;
    this._distributing = true;
    try {
      const myPH = this.calcTotalPH();
      if (myPH === 0) { this._distributing = false; return; }
      
      const usersSnap = await getDocs(collection(db, 'users'));
      let totalPH = 0;
      usersSnap.forEach(d => {
        const ud = d.data();
        if (!ud.banned) {
          const m = MINERS[ud.miner || 'kubra'];
          const itemPH = (ud.items || []).reduce((s, it) => s + (it.ph || 0), 0);
          totalPH += itemPH * m.mult;
        }
      });
      
      if (totalPH === 0) { this._distributing = false; return; }
      const myShare = Math.floor((myPH / totalPH) * 1000);
      
      if (myShare > 0) {
        await this.updateUserData({
          banknot: (this.userData.banknot || 0) + myShare,
          leagueEarned: (this.userData.leagueEarned || 0) + myShare
        });
        this.userData.banknot = (this.userData.banknot || 0) + myShare;
        this.userData.leagueEarned = (this.userData.leagueEarned || 0) + myShare;
        this.renderHUD();
        this.renderFinance();
        Toast.show(`Lig ödülü! +${myShare} 💰`, 'success');
        await this.addNotification(`Lig dağıtımından ${myShare} banknot kazandın!`, 'reward');
      }
    } catch(e) { console.error('League error:', e); }
    this._distributing = false;
  }

  tickFlashTimer() {
    if (!this.flashDealExpiry) return;
    const remaining = this.flashDealExpiry - Date.now();
    const el = document.getElementById('flash-timer');
    if (el) el.textContent = formatCountdown(Math.max(0, remaining));
    if (remaining <= 0) this.generateFlashDeal();
  }

  generateFlashDeal() {
    this.flashDealItem = generateItem();
    this.flashDealItem.salePrice = Math.floor(Math.random() * 800) + 200;
    this.flashDealExpiry = Date.now() + FLASH_DEAL_INTERVAL_MS;
    this.renderFlashDeal();
  }

  renderFlashDeal() {
    const el = document.getElementById('flash-deal-card');
    if (!el || !this.flashDealItem) return;
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="font-size:2rem">${this.flashDealItem.icon}</span>
        <div>
          <div style="font-weight:700">${this.flashDealItem.name}</div>
          <div style="color:var(--accent);font-size:0.8rem">⚡ ${this.flashDealItem.ph} PH</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="color:var(--accent);font-weight:700">${fmtNum(this.flashDealItem.salePrice)} 💰</div>
          <button class="btn-small" id="btn-flash-buy">Satın Al</button>
        </div>
      </div>
    `;
    document.getElementById('btn-flash-buy')?.addEventListener('click', () => this.buyFlashDeal());
  }

  async buyFlashDeal() {
    if (!this.flashDealItem) return;
    const price = this.flashDealItem.salePrice;
    if ((this.userData.banknot || 0) < price) { Toast.show('Yetersiz banknot!', 'error'); return; }
    const newBanknot = (this.userData.banknot || 0) - price;
    const items = [...(this.userData.items || []), this.flashDealItem];
    await this.updateUserData({ banknot: newBanknot, items });
    this.userData.banknot = newBanknot;
    this.userData.items = items;
    this.renderHUD();
    this.renderMinePanel();
    Toast.show(`${this.flashDealItem.name} satın alındı!`, 'success');
    this.generateFlashDeal();
  }

  async checkOfflineEarnings() {
    const last = this.userData?.lastMineTime || Date.now();
    const elapsed = Math.min(Date.now() - last, MAX_OFFLINE_MS);
    if (elapsed < MINE_INTERVAL_MS) return;

    const miner = MINERS[this.userData.miner || 'kubra'];
    const cycles = Math.floor(elapsed / MINE_INTERVAL_MS);
    const reward = cycles * miner.earn;

    if (reward <= 0) return;

    const newBanknot = (this.userData.banknot || 0) + reward;
    const newTotal = (this.userData.totalEarned || 0) + reward;
    await this.updateUserData({
      banknot: newBanknot,
      totalEarned: newTotal,
      lastMineTime: Date.now()
    });
    this.userData.banknot = newBanknot;
    this.userData.totalEarned = newTotal;
    this.userData.lastMineTime = Date.now();
    this.renderHUD();

    document.getElementById('offline-reward').textContent = `+${fmtNum(reward)} 💰`;
    document.getElementById('offline-modal').style.display = 'flex';
  }

  spawnOrePop() {
    const el = document.getElementById('ore-pop');
    if (!el) return;
    el.textContent = ['⛏️','💰','💎','🪨','✨'][Math.floor(Math.random()*5)];
    el.className = 'ore-pop popping';
    el.style.left = `${30 + Math.random()*40}%`;
    el.style.top = `${40 + Math.random()*20}%`;
    setTimeout(() => { el.className = 'ore-pop'; }, 1600);

    const dust = document.getElementById('dust');
    if (!dust) return;
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div');
      d.className = 'dust';
      d.style.left = `${45 + Math.random()*10}%`;
      d.style.top = `${50 + Math.random()*10}%`;
      d.style.setProperty('--dx', `${(Math.random()-0.5)*60}px`);
      d.style.setProperty('--dy', `${-(Math.random()*60)}px`);
      dust.appendChild(d);
      setTimeout(() => d.remove(), 1600);
    }
  }

  async buyChest(type) {
    const cfg = CHEST_CONFIG[type];
    if (!cfg) return;
    const price = cfg.price;
    if ((this.userData.banknot || 0) < price) {
      Toast.show(`Yetersiz banknot! ${fmtNum(price)} gerekiyor.`, 'error'); return;
    }
    const rewards = openChest(type);
    let newBanknot = (this.userData.banknot || 0) - price;
    let newGold = this.userData.gold || 0;
    let newItems = [...(this.userData.items || [])];
    const resultLines = [];

    for (const r of rewards) {
      if (r.type === 'banknot') {
        newBanknot += r.amount;
        resultLines.push(`💰 +${fmtNum(r.amount)} Banknot`);
      } else if (r.type === 'gold') {
        newGold += r.amount;
        resultLines.push(`🥇 +${r.amount} Altın`);
      } else if (r.type === 'item') {
        newItems.push(r.item);
        resultLines.push(`${r.item.icon} ${r.item.name} (⚡${r.item.ph} PH)`);
      }
    }

    await this.updateUserData({ banknot: newBanknot, gold: newGold, items: newItems });
    this.userData.banknot = newBanknot;
    this.userData.gold = newGold;
    this.userData.items = newItems;
    this.renderHUD();
    this.renderMinePanel();
    this.renderFinance();
    this.renderControlCenter();

    const modal = document.getElementById('chest-result-modal');
    document.getElementById('chest-result-icon').textContent = cfg.icon;
    document.getElementById('chest-result-items').innerHTML =
      resultLines.map(l => `<div class="result-item">${l}</div>`).join('');
    modal.style.display = 'flex';
  }

  async convertBanknotToGold() {
    const amt = parseInt(document.getElementById('convert-banknot').value) || 0;
    if (amt < BANKNOT_TO_GOLD) { Toast.show(`En az ${fmtNum(BANKNOT_TO_GOLD)} banknot gerekiyor.`, 'warn'); return; }
    if ((this.userData.banknot || 0) < amt) { Toast.show('Yetersiz banknot!', 'error'); return; }
    const gold = Math.floor(amt / BANKNOT_TO_GOLD);
    const cost = gold * BANKNOT_TO_GOLD;
    const newBanknot = this.userData.banknot - cost;
    const newGold = (this.userData.gold || 0) + gold;
    await this.updateUserData({ banknot: newBanknot, gold: newGold });
    this.userData.banknot = newBanknot;
    this.userData.gold = newGold;
    this.renderHUD();
    this.renderFinance();
    Toast.show(`${fmtNum(gold)} altına dönüştürüldü!`, 'success');
    document.getElementById('convert-banknot').value = '';
    document.getElementById('convert-preview').textContent = '= 0 Altın';
  }

  async createWithdrawRequest() {
    const amt = parseInt(document.getElementById('withdraw-amount').value) || 0;
    const address = document.getElementById('withdraw-address').value.trim();
    if (amt < 50) { Toast.show('Minimum 50 altın.', 'warn'); return; }
    if (!address) { Toast.show('IBAN veya kripto adresi gir.', 'warn'); return; }
    if ((this.userData.gold || 0) < amt) { Toast.show('Yetersiz altın!', 'error'); return; }

    await addDoc(collection(db, 'requests'), {
      userId: this.user.uid,
      username: this.userData.username,
      type: 'withdraw',
      amount: amt,
      address,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    const newGold = (this.userData.gold || 0) - amt;
    await this.updateUserData({ gold: newGold });
    this.userData.gold = newGold;
    this.renderHUD();
    this.renderFinance();
    Toast.show(`Çekim talebi oluşturuldu!`, 'success');
    document.getElementById('withdraw-amount').value = '';
    document.getElementById('withdraw-address').value = '';
    this.loadMyRequests();
  }

  async loadMyRequests() {
    const el = document.getElementById('my-requests');
    if (!el) return;
    const q = query(collection(db, 'requests'), where('userId', '==', this.user.uid), orderBy('createdAt', 'desc'), limit(10));
    try {
      const snap = await getDocs(q);
      if (snap.empty) { el.innerHTML = '<div class="empty-state">Talep yok.</div>'; return; }
      el.innerHTML = snap.docs.map(d => {
        const r = d.data();
        const statusMap = { pending: '⏳ Bekliyor', approved: '✅ Onaylandı', rejected: '❌ Reddedildi' };
        return `<div class="request-card">
          <div>${r.type === 'withdraw' ? '📤 Çekim' : '📥 Yatırım'}: ${fmtNum(r.amount)} altın</div>
          <div class="req-meta">${statusMap[r.status] || r.status} | ${r.address || ''}</div>
        </div>`;
      }).join('');
    } catch(e) {
      el.innerHTML = '<div class="empty-state">Talepler yüklenemedi.</div>';
    }
  }

  async changeUsername() {
    const newUsername = document.getElementById('profile-username-input').value.trim().toLowerCase();
    if (!newUsername || newUsername.length < 3) { Toast.show('En az 3 karakter.', 'warn'); return; }
    const q = query(collection(db, 'users'), where('username', '==', newUsername));
    const snap = await getDocs(q);
    if (!snap.empty) { Toast.show('Bu kullanıcı adı alınmış.', 'error'); return; }
    await this.updateUserData({ username: newUsername });
    this.userData.username = newUsername;
    document.getElementById('hud-username').textContent = newUsername;
    document.getElementById('sidebar-username').textContent = newUsername;
    Toast.show('Kullanıcı adı değiştirildi!', 'success');
  }

  async changePassword() {
    const pass = document.getElementById('profile-new-pass').value;
    if (!pass || pass.length < 6) { Toast.show('En az 6 karakter.', 'warn'); return; }
    try {
      await updatePassword(this.user, pass);
      Toast.show('Şifre değiştirildi!', 'success');
      document.getElementById('profile-new-pass').value = '';
    } catch(e) {
      Toast.show(this.firebaseErrMsg(e), 'error');
    }
  }

  async sendDM() {
    const msg = document.getElementById('dm-input').value.trim();
    if (!msg) return;
    await addDoc(collection(db, 'messages'), {
      senderId: this.user.uid,
      senderUsername: this.userData.username,
      receiverId: 'admin',
      content: msg,
      timestamp: serverTimestamp()
    });
    document.getElementById('dm-input').value = '';
    Toast.show('Mesaj gönderildi!', 'success');
  }

  async loadDMHistory() {
    const el = document.getElementById('dm-messages');
    if (!el) return;
    el.innerHTML = '';
    try {
      // İki ayrı sorgu - 'in' kullanmıyoruz
      const q1 = query(
        collection(db, 'messages'),
        where('senderId', '==', this.user.uid),
        where('receiverId', '==', 'admin'),
        orderBy('timestamp', 'desc'),
        limit(25)
      );
      const q2 = query(
        collection(db, 'messages'),
        where('senderId', '==', 'admin'),
        where('receiverId', '==', this.user.uid),
        orderBy('timestamp', 'desc'),
        limit(25)
      );
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const allMessages = [...snap1.docs, ...snap2.docs]
        .sort((a, b) => (a.data().timestamp?.toMillis() || 0) - (b.data().timestamp?.toMillis() || 0));
      
      allMessages.forEach(d => {
        const m = d.data();
        const ismine = m.senderId === this.user.uid;
        const div = document.createElement('div');
        div.className = `dm-message ${ismine ? 'sent' : 'received'}`;
        div.innerHTML = `<div>${m.content}</div><div class="dm-meta">${ismine ? 'Sen' : 'Admin'} · ${timeSince(m.timestamp)}</div>`;
        el.appendChild(div);
      });
      el.scrollTop = el.scrollHeight;
    } catch(e) { 
      console.error('DM hatası:', e);
      el.innerHTML = '<div style="color:var(--red);padding:10px;">Mesajlar yüklenemedi</div>';
    }
  }

  async sendSupportTicket() {
    const subject = document.getElementById('support-subject').value.trim();
    const message = document.getElementById('support-message').value.trim();
    if (!subject || !message) { Toast.show('Konu ve mesaj zorunlu.', 'warn'); return; }
    await addDoc(collection(db, 'tickets'), {
      userId: this.user.uid,
      username: this.userData.username,
      subject, message,
      status: 'open',
      createdAt: serverTimestamp()
    });
    document.getElementById('support-subject').value = '';
    document.getElementById('support-message').value = '';
    Toast.show('Destek talebi gönderildi!', 'success');
    this.loadMyTickets();
  }

  async loadMyTickets() {
    const el = document.getElementById('my-tickets');
    if (!el) return;
    try {
      const q = query(collection(db, 'tickets'), where('userId', '==', this.user.uid), orderBy('createdAt', 'desc'), limit(10));
      const snap = await getDocs(q);
      if (snap.empty) { el.innerHTML = '<div class="empty-state">Destek talebiniz yok.</div>'; return; }
      el.innerHTML = snap.docs.map(d => {
        const t = d.data();
        return `<div class="ticket-item">
          <div class="ticket-subject">${t.subject}</div>
          <div class="ticket-meta">${t.status === 'open' ? '🟡 Açık' : '✅ Çözüldü'} · ${timeSince(t.createdAt)}</div>
        </div>`;
      }).join('');
    } catch(e) { el.innerHTML = '<div class="empty-state">Yüklenemedi.</div>'; }
  }

  async loadNotifications() {
    const el = document.getElementById('notif-list');
    if (!el) return;
    try {
      // İki ayrı sorgu - 'in' kullanmıyoruz
      const q1 = query(
        collection(db, 'notifications'),
        where('userId', '==', this.user.uid),
        orderBy('createdAt', 'desc'),
        limit(15)
      );
      const q2 = query(
        collection(db, 'notifications'),
        where('userId', '==', 'all'),
        orderBy('createdAt', 'desc'),
        limit(15)
      );
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const allNotifs = [...snap1.docs, ...snap2.docs]
        .sort((a, b) => (b.data().createdAt?.toMillis() || 0) - (a.data().createdAt?.toMillis() || 0))
        .slice(0, 30);
      
      if (allNotifs.length === 0) {
        el.innerHTML = '<div class="empty-state">Henüz bildirim yok.</div>';
        return;
      }
      
      el.innerHTML = '';
      const batch = writeBatch(db);
      
      allNotifs.forEach(d => {
        const n = d.data();
        const div = document.createElement('div');
        div.className = `notif-item ${n.read ? '' : 'unread'}`;
        const icons = { system: 'ℹ️', reward: '💰', announcement: '📢' };
        div.innerHTML = `
          <div class="notif-icon">${icons[n.type] || 'ℹ️'}</div>
          <div class="notif-body">
            <div class="notif-text">${n.message}</div>
            <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
              <span class="notif-type ${n.type}">${n.type || 'sistem'}</span>
              <span class="notif-time">${timeSince(n.createdAt)}</span>
            </div>
          </div>
        `;
        el.appendChild(div);
        if (!n.read) {
          batch.update(doc(db, 'notifications', d.id), { read: true });
        }
      });
      
      await batch.commit().catch(() => {});
      document.getElementById('notif-badge').style.display = 'none';
      
    } catch(e) {
      console.error('Bildirim hatası:', e);
      el.innerHTML = '<div class="empty-state">Yüklenemedi: ' + e.message + '</div>';
    }
  }

  async addNotification(message, type = 'system') {
    await addDoc(collection(db, 'notifications'), {
      userId: this.user.uid,
      message, type,
      read: false,
      createdAt: serverTimestamp()
    });
  }

  subscribeRealtime() {
    // Notifications - sadece kendi bildirimlerin
    const nq = query(
      collection(db, 'notifications'),
      where('userId', '==', this.user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    this.notifUnsubscribe = onSnapshot(nq, 
      snap => {
        const unreadCount = snap.docs.filter(d => !d.data().read).length;
        const badge = document.getElementById('notif-badge');
        if (badge) {
          badge.textContent = unreadCount;
          badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
      },
      err => console.error('Bildirim listener hatası:', err.message)
    );

    // User doc listener
    const userRef = doc(db, 'users', this.user.uid);
    this.userUnsubscribe = onSnapshot(userRef, 
      snap => {
        if (!snap.exists()) return;
        this.userData = snap.data();
        if (this.userData.banned) {
          AuthModule.logout();
          Toast.show('Hesabınız banlandı.', 'error');
          return;
        }
        this.renderHUD();
        this.renderFinance();
        this.applyTheme(this.userData?.settings?.theme || 'dark');
      },
      err => {
        console.error('User listener hatası:', err.message);
        if (err.code === 'permission-denied') {
          Toast.show('Oturum süreniz doldu.', 'error');
          setTimeout(() => AuthModule.logout(), 2000);
        }
      }
    );

    // System config
    try {
      const sysRef = doc(db, 'system', 'config');
      onSnapshot(sysRef, 
        snap => {
          if (!snap.exists()) return;
          const cfg = snap.data();
          const ms = document.getElementById('maintenance-screen');
          if (cfg.maintenance && !this.isAdmin) {
            if (ms) ms.style.display = 'flex';
            document.getElementById('game-screen').classList.remove('active');
          } else {
            if (ms) ms.style.display = 'none';
            document.getElementById('game-screen').classList.add('active');
          }
        },
        err => console.error('System listener hatası:', err.message)
      );
    } catch(e) { console.error('System config hatası:', e); }
  }

  bindAdminUI() {
    if (!this.isAdmin) return;

    document.getElementById('btn-admin-search').addEventListener('click', () => this.adminSearchUser());

    document.getElementById('admin-notif-target').addEventListener('change', (e) => {
      document.getElementById('admin-notif-user-row').style.display = e.target.value === 'single' ? '' : 'none';
    });

    document.getElementById('btn-send-notif').addEventListener('click', () => this.adminSendNotif());

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => this.adminAction(btn.dataset.action));
    });

    document.getElementById('admin-maintenance').addEventListener('change', async (e) => {
      await setDoc(doc(db, 'system', 'config'), { maintenance: e.target.checked }, { merge: true });
      Toast.show(`Bakım modu ${e.target.checked ? 'aktif' : 'pasif'}`, 'info');
    });
  }

  async loadAdminPanel() {
    await Promise.all([
      this.loadAdminRequests(),
      this.loadAdminTickets(),
      this.loadAdminDMs(),
      this.loadAdminStats()
    ]);
  }

  async adminSearchUser() {
    const term = document.getElementById('admin-user-search').value.trim();
    if (!term) return;
    const el = document.getElementById('admin-user-result');
    const actionsEl = document.getElementById('admin-actions');
    el.textContent = 'Aranıyor...';

    try {
      let found = null;
      const q = query(collection(db, 'users'), where('username', '==', term));
      const snap = await getDocs(q);
      if (!snap.empty) {
        found = { id: snap.docs[0].id, ...snap.docs[0].data() };
      } else {
        const ref = doc(db, 'users', term);
        const d = await getDoc(ref);
        if (d.exists()) found = { id: d.id, ...d.data() };
      }

      if (!found) { el.textContent = 'Kullanıcı bulunamadı.'; actionsEl.style.display = 'none'; return; }

      this.adminSelectedUid = found.id;
      el.innerHTML = `<b>${found.username}</b> | 💰 ${fmtNum(found.banknot)} | 🥇 ${fmtNum(found.gold)} | UID: ${found.id}`;
      actionsEl.style.display = '';
    } catch(e) { el.textContent = 'Hata: ' + e.message; }
  }

  async adminAction(action) {
    if (!this.adminSelectedUid) { Toast.show('Önce kullanıcı ara!', 'warn'); return; }
    const ref = doc(db, 'users', this.adminSelectedUid);
    const d = await getDoc(ref);
    if (!d.exists()) { Toast.show('Kullanıcı bulunamadı.', 'error'); return; }
    const ud = d.data();

    switch (action) {
      case 'add-banknot': {
        const amt = parseInt(document.getElementById('admin-banknot-amount').value) || 0;
        await updateDoc(ref, { banknot: (ud.banknot||0) + amt });
        Toast.show(`+${amt} banknot eklendi.`, 'success');
        break;
      }
      case 'remove-banknot': {
        const amt = parseInt(document.getElementById('admin-banknot-amount').value) || 0;
        await updateDoc(ref, { banknot: Math.max(0, (ud.banknot||0) - amt) });
        Toast.show(`-${amt} banknot çıkarıldı.`, 'success');
        break;
      }
      case 'add-gold': {
        const amt = parseInt(document.getElementById('admin-gold-amount').value) || 0;
        await updateDoc(ref, { gold: (ud.gold||0) + amt });
        Toast.show(`+${amt} altın eklendi.`, 'success');
        break;
      }
      case 'remove-gold': {
        const amt = parseInt(document.getElementById('admin-gold-amount').value) || 0;
        await updateDoc(ref, { gold: Math.max(0, (ud.gold||0) - amt) });
        Toast.show(`-${amt} altın çıkarıldı.`, 'success');
        break;
      }
      case 'add-items': {
        const cnt = parseInt(document.getElementById('admin-item-count').value) || 1;
        const newItems = [...(ud.items||[]), ...generateItems(cnt)];
        await updateDoc(ref, { items: newItems });
        Toast.show(`${cnt} eşya eklendi.`, 'success');
        break;
      }
      case 'ban-user': {
        await updateDoc(ref, { banned: true });
        Toast.show('Kullanıcı banlandı.', 'warn');
        break;
      }
      case 'delete-user': {
        if (!confirm('Kullanıcıyı silmek istediğine emin misin?')) return;
        await deleteDoc(ref);
        Toast.show('Kullanıcı silindi.', 'warn');
        break;
      }
    }
  }

  async adminSendNotif() {
    const target = document.getElementById('admin-notif-target').value;
    const type = document.getElementById('admin-notif-type').value;
    const message = document.getElementById('admin-notif-message').value.trim();
    if (!message) { Toast.show('Mesaj gir.', 'warn'); return; }

    if (target === 'all') {
      await addDoc(collection(db, 'notifications'), {
        userId: 'all', message, type,
        read: false, createdAt: serverTimestamp()
      });
      Toast.show('Tüm kullanıcılara bildirim gönderildi!', 'success');
    } else {
      const uid = document.getElementById('admin-notif-uid').value.trim();
      if (!uid) { Toast.show('UID gir.', 'warn'); return; }
      await addDoc(collection(db, 'notifications'), {
        userId: uid, message, type,
        read: false, createdAt: serverTimestamp()
      });
      Toast.show('Bildirim gönderildi!', 'success');
    }
    document.getElementById('admin-notif-message').value = '';
  }

  async loadAdminRequests() {
    const el = document.getElementById('admin-requests-list');
    if (!el) return;
    try {
      const q = query(collection(db, 'requests'), where('status', '==', 'pending'), limit(20));
      const snap = await getDocs(q);
      if (snap.empty) { el.innerHTML = '<div class="empty-state">Bekleyen talep yok.</div>'; return; }
      el.innerHTML = snap.docs.map(d => {
        const r = d.data();
        return `<div class="request-card">
          <div><b>${r.username}</b> — ${r.type === 'withdraw' ? '📤 Çekim' : '📥 Yatırım'}: ${fmtNum(r.amount)} altın</div>
          <div class="req-meta">${r.address || ''}</div>
          <div class="request-actions">
            <button class="btn-small btn-green" onclick="window.game.adminApproveRequest('${d.id}', true, '${r.userId}', ${r.amount})">✅ Onayla</button>
            <button class="btn-small btn-red" onclick="window.game.adminApproveRequest('${d.id}', false, '${r.userId}', ${r.amount})">❌ Reddet</button>
          </div>
        </div>`;
      }).join('');
    } catch(e) { el.innerHTML = '<div class="empty-state">Yüklenemedi.</div>'; }
  }

  async adminApproveRequest(reqId, approve, userId, amount) {
    const status = approve ? 'approved' : 'rejected';
    await updateDoc(doc(db, 'requests', reqId), { status });
    if (!approve) {
      const ref = doc(db, 'users', userId);
      const d = await getDoc(ref);
      if (d.exists()) {
        await updateDoc(ref, { gold: (d.data().gold||0) + amount });
        await addDoc(collection(db, 'notifications'), {
          userId,
          message: `Çekim talebiniz reddedildi. ${amount} altın iade edildi.`,
          type: 'system', read: false, createdAt: serverTimestamp()
        });
      }
    } else {
      await addDoc(collection(db, 'notifications'), {
        userId,
        message: `Çekim talebiniz onaylandı! ${amount} altın işleme alındı.`,
        type: 'reward', read: false, createdAt: serverTimestamp()
      });
    }
    Toast.show(`Talep ${approve ? 'onaylandı' : 'reddedildi'}.`, approve ? 'success' : 'warn');
    this.loadAdminRequests();
  }

  async loadAdminTickets() {
    const el = document.getElementById('admin-tickets-list');
    if (!el) return;
    try {
      const q = query(collection(db, 'tickets'), where('status', '==', 'open'), limit(20));
      const snap = await getDocs(q);
      if (snap.empty) { el.innerHTML = '<div class="empty-state">Açık destek talebi yok.</div>'; return; }
      el.innerHTML = snap.docs.map(d => {
        const t = d.data();
        return `<div class="request-card">
          <div><b>${t.username}</b>: ${t.subject}</div>
          <div class="req-meta">${t.message.substring(0,80)}...</div>
          <button class="btn-small" onclick="window.game.adminCloseTicket('${d.id}')">✅ Kapat</button>
        </div>`;
      }).join('');
    } catch(e) { el.innerHTML = '<div class="empty-state">Yüklenemedi.</div>'; }
  }

  async adminCloseTicket(id) {
    await updateDoc(doc(db, 'tickets', id), { status: 'closed' });
    Toast.show('Destek talebi kapatıldı.', 'success');
    this.loadAdminTickets();
  }

  async loadAdminDMs() {
    const el = document.getElementById('admin-dm-list');
    if (!el) return;
    try {
      const q = query(collection(db, 'messages'), where('receiverId', '==', 'admin'), orderBy('timestamp', 'desc'), limit(20));
      const snap = await getDocs(q);
      if (snap.empty) { el.innerHTML = '<div class="empty-state">Mesaj yok.</div>'; return; }
      el.innerHTML = snap.docs.map(d => {
        const m = d.data();
        return `<div class="request-card">
          <div><b>${m.senderUsername}</b>: ${m.content}</div>
          <div class="req-meta">${timeSince(m.timestamp)}</div>
          <div class="dm-input-row" style="margin-top:6px">
            <input type="text" id="admin-reply-${d.id}" placeholder="Yanıtla..." style="flex:1;background:var(--bg-primary);border:1px solid var(--border);border-radius:6px;padding:5px 8px;color:var(--text-primary);font-size:0.8rem;outline:none"/>
            <button class="btn-small" onclick="window.game.adminReplyDM('${m.senderId}', '${d.id}')">Gönder</button>
          </div>
        </div>`;
      }).join('');
    } catch(e) { el.innerHTML = '<div class="empty-state">Yüklenemedi.</div>'; }
  }

  async adminReplyDM(toUid, inputSuffix) {
    const input = document.getElementById(`admin-reply-${inputSuffix}`);
    if (!input || !input.value.trim()) return;
    await addDoc(collection(db, 'messages'), {
      senderId: 'admin',
      senderUsername: 'Admin',
      receiverId: toUid,
      content: input.value.trim(),
      timestamp: serverTimestamp()
    });
    await addDoc(collection(db, 'notifications'), {
      userId: toUid,
      message: 'Admin\'den yeni mesaj var.',
      type: 'system', read: false, createdAt: serverTimestamp()
    });
    input.value = '';
    Toast.show('Yanıt gönderildi.', 'success');
  }

  async loadAdminStats() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      document.getElementById('admin-total-users').textContent = snap.size;
    } catch(e) {}
    try {
      const ref = doc(db, 'system', 'config');
      const d = await getDoc(ref);
      if (d.exists()) {
        document.getElementById('admin-maintenance').checked = !!d.data().maintenance;
      }
    } catch(e) {}
  }

  async updateUserData(updates) {
    try {
      await updateDoc(doc(db, 'users', this.user.uid), updates);
    } catch(e) {
      console.error('updateUserData error:', e);
    }
  }

  setupParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${4 + Math.random() * 6}s`;
      p.style.animationDelay = `${Math.random() * 6}s`;
      p.style.width = p.style.height = `${1 + Math.random() * 3}px`;
      container.appendChild(p);
    }
  }
}

// =============================================
//  BOOT
// =============================================

const game = new Game();
window.game = game;
window.__REISZAS_GAME_INSTANCE__ = game;

game.init().catch(err => {
  if (err.message !== 'ALREADY_LOADED') {
    console.error('Game init hatası:', err);
  }
});
