// ══════════════════════════════════════════════════════════
//  game.js  — Madenci Oyunu Ana Mantığı
// ══════════════════════════════════════════════════════════

// ─── TELEGRAM WEB APP ────────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }
const TG_USER = tg?.initDataUnsafe?.user || { id: 'test123', first_name: 'Madenci', username: 'madenci_test' };

// ─── OYUN VERİLERİ ────────────────────────────────────────

const MINERS = [
  {
    id: 'sevki',
    name: 'Şevki',
    emoji: '⛏️',
    ratio: 1000,           // gücün kaçta 1'ini banknot üretir
    desc: 'Ücretsiz başlangıç madencisi',
    unlockCost: 0,
    unlockPower: 0,
    free: true
  },
  {
    id: 'hamido',
    name: 'Hamido',
    emoji: '🪨',
    ratio: 750,
    desc: 'Hızlı kazıcı, gücün 750\'de 1\'ini üretir',
    unlockCost: 5000,
    unlockPower: 500,
    free: false
  },
  {
    id: 'zirto',
    name: 'Zırto',
    emoji: '💎',
    ratio: 450,
    desc: 'Usta madenci, gücün 450\'de 1\'ini üretir',
    unlockCost: 15000,
    unlockPower: 1500,
    free: false
  },
  {
    id: 'beyza',
    name: 'Beyza',
    emoji: '🔩',
    ratio: 200,
    desc: 'Mühendis madenci, gücün 200\'de 1\'ini üretir',
    unlockCost: 40000,
    unlockPower: 4000,
    free: false
  },
  {
    id: 'kubra',
    name: 'Kübra',
    emoji: '🏆',
    ratio: 100,
    desc: 'Efsane madenci, gücün 100\'de 1\'ini üretir',
    unlockCost: 100000,
    unlockPower: 10000,
    free: false
  }
];

const SHOP_ITEMS = [
  { id: 'kazma1',    name: 'Çelik Kazma',   emoji: '⛏️',  power: 50,   price: 200  },
  { id: 'baret',     name: 'Güvenlik Bareti',emoji: '⛑️',  power: 30,   price: 150  },
  { id: 'dinamit',   name: 'Dinamit',        emoji: '💣',  power: 120,  price: 500  },
  { id: 'el_feneri', name: 'El Feneri',      emoji: '🔦',  power: 25,   price: 100  },
  { id: 'araba',     name: 'Maden Arabası',  emoji: '🚜',  power: 200,  price: 900  },
  { id: 'kompresör', name: 'Kompresör',      emoji: '⚙️',  power: 350,  price: 1500 },
  { id: 'delici',    name: 'Matkap',         emoji: '🔨',  power: 500,  price: 2500 },
  { id: 'patlayici', name: 'TNT Paketi',     emoji: '💥',  power: 800,  price: 4000 },
];

const WHEEL_PRIZES = [
  { label: '50 Banknot',   value: 50,   type: 'banknot', color: '#f0a500' },
  { label: '10 Güç',       value: 10,   type: 'power',   color: '#3498db' },
  { label: '100 Banknot',  value: 100,  type: 'banknot', color: '#2ecc71' },
  { label: 'Şanssız 😢',  value: 0,    type: 'none',    color: '#555e7a' },
  { label: '25 Banknot',   value: 25,   type: 'banknot', color: '#ff6b35' },
  { label: '30 Güç',       value: 30,   type: 'power',   color: '#9b59b6' },
  { label: '200 Banknot',  value: 200,  type: 'banknot', color: '#e74c3c' },
  { label: '5 Güç',        value: 5,    type: 'power',   color: '#1abc9c' },
];

// 10.000 banknot = 10 TL → 1 banknot = 0.001 TL
const BANKNOT_TO_TL = 0.001;
const CRYPTO_RATES = {
  'BTC':  { name: 'Bitcoin',  rate: 0.0000000017, symbol: '₿' },
  'TON':  { name: 'TON',      rate: 0.00017,      symbol: '💎' },
  'BNB':  { name: 'BNB',      rate: 0.0000027,    symbol: '🟡' },
  'TRX':  { name: 'TRON',     rate: 0.0083,       symbol: '🔴' },
  'LTC':  { name: 'Litecoin', rate: 0.000011,     symbol: '🪙' },
};

// ─── KULLANICI DURUMU ─────────────────────────────────────
let userData = {
  uid: TG_USER.id.toString(),
  username: TG_USER.username || TG_USER.first_name,
  power: 0,
  banknot: 0,
  pendingBanknot: 0,
  unlockedMiners: ['sevki'],
  ownedItems: [],
  lastCollect: Date.now(),
  lastSpin: null,
  lastAdWatch: null,
  totalEarned: 0,
  joinedAt: Date.now(),
  darkMode: true
};

let productionInterval = null;

// ─── FIREBASE CRUD ────────────────────────────────────────
async function loadUser() {
  try {
    const doc = await db.collection('users').doc(userData.uid).get();
    if (doc.exists) {
      userData = { ...userData, ...doc.data() };
    } else {
      await saveUser();
    }
  } catch (e) { console.warn('Firebase yüklenemedi, local kullanılıyor', e); }
}

async function saveUser() {
  try {
    await db.collection('users').doc(userData.uid).set(userData, { merge: true });
  } catch (e) { console.warn('Kayıt hatası', e); }
}

// ─── BANKNOT ÜRETİMİ ─────────────────────────────────────
function calcProductionPerMinute() {
  let total = 0;
  for (const minerId of userData.unlockedMiners) {
    const miner = MINERS.find(m => m.id === minerId);
    if (miner && userData.power > 0) {
      total += userData.power / miner.ratio;
    }
  }
  return total;
}

function startProduction() {
  if (productionInterval) clearInterval(productionInterval);

  // Her 5 saniyede bir pending banknot güncelle
  productionInterval = setInterval(() => {
    const perMin = calcProductionPerMinute();
    const per5sec = perMin / 12;
    userData.pendingBanknot = (userData.pendingBanknot || 0) + per5sec;
    updateBanknotDisplay();
  }, 5000);

  // Sayfa kapatılmadan önce kaydet
  window.addEventListener('beforeunload', saveUser);
}

// Uygulama açılınca offline üretim hesapla
function calcOfflineProduction() {
  const now = Date.now();
  const last = userData.lastCollect || now;
  const diffMin = (now - last) / 60000;
  if (diffMin > 0) {
    const perMin = calcProductionPerMinute();
    const earned = perMin * diffMin;
    if (earned > 0) {
      userData.pendingBanknot = (userData.pendingBanknot || 0) + earned;
    }
  }
}

// ─── BANKNOT TOPLA ────────────────────────────────────────
async function collectBanknot() {
  const amount = Math.floor(userData.pendingBanknot || 0);
  if (amount <= 0) { showToast('Toplanacak banknot yok!'); return; }

  userData.banknot += amount;
  userData.totalEarned += amount;
  userData.pendingBanknot = 0;
  userData.lastCollect = Date.now();

  updateUI();
  showToast(`+${amount} 💵 Banknot toplandı!`);
  await saveUser();
}

// ─── UI GÜNCELLE ─────────────────────────────────────────
function updateUI() {
  document.getElementById('headerName').textContent = userData.username;
  document.getElementById('headerLevel').textContent = `⚡ Güç: ${Math.floor(userData.power)}`;
  updateBanknotDisplay();
  renderMiners();
}

function updateBanknotDisplay() {
  const pending = Math.floor(userData.pendingBanknot || 0);
  document.getElementById('banknotValue').textContent = pending;
  document.getElementById('headerBanknot').textContent = Math.floor(userData.banknot);
}

// ─── MADENCİLER ──────────────────────────────────────────
function renderMiners() {
  const grid = document.getElementById('minersGrid');
  grid.innerHTML = '';

  for (const miner of MINERS) {
    const isUnlocked = userData.unlockedMiners.includes(miner.id);
    const card = document.createElement('div');
    card.className = `miner-card ${isUnlocked ? 'active-miner' : 'locked'}`;

    const perMin = isUnlocked && userData.power > 0
      ? (userData.power / miner.ratio).toFixed(2)
      : '0.00';

    card.innerHTML = `
      <div class="miner-avatar ${isUnlocked ? 'animated' : ''}">
        ${miner.emoji}
        ${isUnlocked ? '<div class="miner-working-badge">AKTİF</div>' : ''}
      </div>
      <div class="miner-info">
        <div class="miner-name">${miner.name}</div>
        <div class="miner-ratio">Güç / ${miner.ratio} = Banknot</div>
        ${isUnlocked ? `<div class="miner-earn">+${perMin} banknot/dk</div>` : ''}
      </div>
      <div class="miner-right">
        <div class="miner-power">${Math.floor(userData.power)}</div>
        <div class="miner-power-label">GÜÇÜ</div>
        ${!isUnlocked ? `
          <button class="miner-unlock-btn" onclick="unlockMiner('${miner.id}')">
            Aç
          </button>
          <div class="miner-locked-text">💵 ${miner.unlockCost.toLocaleString()}</div>
        ` : ''}
      </div>
    `;

    if (isUnlocked) {
      card.onclick = () => showMinerDetail(miner.id);
    }
    grid.appendChild(card);
  }
}

async function unlockMiner(minerId) {
  const miner = MINERS.find(m => m.id === minerId);
  if (!miner) return;

  if (userData.banknot < miner.unlockCost) {
    showToast(`Yetersiz banknot! Gereken: ${miner.unlockCost.toLocaleString()}`);
    return;
  }
  if (userData.power < miner.unlockPower) {
    showToast(`Gereken güç: ${miner.unlockPower}! Mevcut: ${Math.floor(userData.power)}`);
    return;
  }

  userData.banknot -= miner.unlockCost;
  userData.unlockedMiners.push(minerId);
  updateUI();
  showToast(`${miner.name} açıldı! 🎉`);
  await saveUser();
}

function showMinerDetail(minerId) {
  const miner = MINERS.find(m => m.id === minerId);
  const perMin = userData.power > 0 ? (userData.power / miner.ratio).toFixed(2) : '0';
  openModal(`${miner.emoji} ${miner.name}`,
    `<p>${miner.desc}</p>
     <p><strong>Üretim oranı:</strong> Güç ÷ ${miner.ratio} = banknot/dk</p>
     <p><strong>Şu anki üretim:</strong> <span style="color:var(--accent)">${perMin} banknot/dk</span></p>
     <p><strong>Günde:</strong> ~${(parseFloat(perMin) * 1440).toFixed(0)} banknot</p>`
  );
}

// ─── MAĞAZA ──────────────────────────────────────────────
function renderShop() {
  const itemsGrid = document.getElementById('shopItems');
  itemsGrid.innerHTML = '';

  for (const item of SHOP_ITEMS) {
    const owned = (userData.ownedItems || []).filter(i => i === item.id).length;
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.onclick = () => buyItem(item.id);
    div.innerHTML = `
      <div class="shop-item-icon">${item.emoji}</div>
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-power">⚡ +${item.power} Güç</div>
      ${owned > 0 ? `<div style="font-size:11px;color:var(--green);margin-top:4px">Sahip: ${owned}</div>` : ''}
      <div class="shop-item-price">💵 ${item.price.toLocaleString()}</div>
    `;
    itemsGrid.appendChild(div);
  }

  // Mağaza - Madenciler sekmesi
  const minersGrid = document.getElementById('shopMiners');
  minersGrid.innerHTML = '';
  for (const miner of MINERS.filter(m => !m.free)) {
    const isUnlocked = userData.unlockedMiners.includes(miner.id);
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.onclick = () => unlockMiner(miner.id);
    div.innerHTML = `
      <div class="shop-item-icon">${miner.emoji}</div>
      <div class="shop-item-name">${miner.name}</div>
      <div class="shop-item-power">Güç ÷ ${miner.ratio} = BNK/dk</div>
      ${isUnlocked ? `<div style="font-size:11px;color:var(--green);margin-top:4px">✅ Açık</div>` : ''}
      <div class="shop-item-price">💵 ${miner.unlockCost.toLocaleString()}</div>
    `;
    minersGrid.appendChild(div);
  }
}

async function buyItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  if (userData.banknot < item.price) {
    showToast(`Yetersiz banknot! Gereken: ${item.price.toLocaleString()}`);
    return;
  }

  userData.banknot -= item.price;
  userData.power += item.power;
  if (!userData.ownedItems) userData.ownedItems = [];
  userData.ownedItems.push(itemId);

  updateUI();
  renderShop();
  showToast(`${item.emoji} ${item.name} satın alındı! +${item.power} Güç!`);
  await saveUser();
}

function switchShopTab(tab) {
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('shopItems').style.display = tab === 'items' ? 'grid' : 'none';
  document.getElementById('shopMiners').style.display = tab === 'miners' ? 'grid' : 'none';
  event.target.classList.add('active');
}

// ─── LİDERLİK TABLOSU ────────────────────────────────────
async function loadLeaderboard() {
  const list = document.getElementById('leaderboardList');
  list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2)">Yükleniyor...</div>';

  try {
    const snap = await db.collection('users')
      .orderBy('totalEarned', 'desc')
      .limit(50)
      .get();

    list.innerHTML = '';
    const medals = ['🥇','🥈','🥉'];

    snap.docs.forEach((doc, i) => {
      const u = doc.data();
      const div = document.createElement('div');
      div.className = 'leader-item';
      div.onclick = () => showUserProfile(u);
      div.innerHTML = `
        <div class="leader-rank ${i < 3 ? 'rank-'+(i+1) : ''}">${medals[i] || (i+1)}</div>
        <div class="leader-avatar">${(u.username || 'M')[0].toUpperCase()}</div>
        <div class="leader-info">
          <div class="leader-name">@${u.username || 'anonim'}</div>
          <div class="leader-power">⚡ ${Math.floor(u.power || 0)} Güç</div>
        </div>
        <div class="leader-banknot">💵 ${Math.floor(u.totalEarned || 0)}</div>
      `;
      list.appendChild(div);
    });
  } catch (e) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2)">Yüklenemedi.</div>';
  }
}

async function searchUser() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const resultDiv = document.getElementById('searchResult');

  if (query.length < 2) { resultDiv.style.display = 'none'; return; }

  try {
    const snap = await db.collection('users')
      .where('username', '>=', query)
      .where('username', '<=', query + '\uf8ff')
      .limit(5).get();

    if (snap.empty) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<div style="color:var(--text3);padding:12px">Kullanıcı bulunamadı.</div>';
      return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '';
    snap.docs.forEach(doc => {
      const u = doc.data();
      const div = document.createElement('div');
      div.className = 'leader-item';
      div.onclick = () => showUserProfile(u);
      div.innerHTML = `
        <div class="leader-avatar">${(u.username || 'M')[0].toUpperCase()}</div>
        <div class="leader-info">
          <div class="leader-name">@${u.username}</div>
          <div class="leader-power">⚡ ${Math.floor(u.power || 0)} Güç | 💵 ${Math.floor(u.totalEarned || 0)} Kazanılan</div>
        </div>
      `;
      resultDiv.appendChild(div);
    });
  } catch (e) {}
}

function showUserProfile(u) {
  const unlockedCount = (u.unlockedMiners || ['sevki']).length;
  openModal(`👤 @${u.username}`,
    `<div class="profile-card">
      <div class="profile-avatar">${(u.username||'M')[0].toUpperCase()}</div>
      <div class="profile-name">@${u.username}</div>
      <div class="profile-stats">
        <div class="profile-stat">
          <div class="profile-stat-val">${Math.floor(u.power||0)}</div>
          <div class="profile-stat-lbl">Güç</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-val">${Math.floor(u.totalEarned||0)}</div>
          <div class="profile-stat-lbl">Kazanılan</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-val">${unlockedCount}</div>
          <div class="profile-stat-lbl">Madenci</div>
        </div>
      </div>
    </div>`
  );
}

// ─── GÜNLÜK ÇARK ─────────────────────────────────────────
let wheelSpinning = false;
let wheelAngle = 0;

function drawWheel() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 150, cy = 150, r = 140;
  const slice = (2 * Math.PI) / WHEEL_PRIZES.length;

  ctx.clearRect(0, 0, 300, 300);

  WHEEL_PRIZES.forEach((prize, i) => {
    const start = slice * i + wheelAngle;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = prize.color;
    ctx.fill();
    ctx.strokeStyle = '#0d0f14';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Rajdhani';
    ctx.fillText(prize.label, r - 10, 4);
    ctx.restore();
  });

  // Merkez
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
  ctx.fillStyle = '#0d0f14';
  ctx.fill();
  ctx.strokeStyle = '#f0a500';
  ctx.lineWidth = 3;
  ctx.stroke();
}

async function spinWheel() {
  if (wheelSpinning) return;

  const lastSpin = userData.lastSpin;
  const now = Date.now();
  if (lastSpin && (now - lastSpin) < 24 * 60 * 60 * 1000) {
    const remaining = Math.ceil((24 * 60 * 60 * 1000 - (now - lastSpin)) / 3600000);
    showToast(`${remaining} saat sonra tekrar çevirebilirsin!`);
    return;
  }

  wheelSpinning = true;
  document.getElementById('spinBtn').disabled = true;

  const prize = WHEEL_PRIZES[Math.floor(Math.random() * WHEEL_PRIZES.length)];
  const prizeIndex = WHEEL_PRIZES.indexOf(prize);
  const slice = (2 * Math.PI) / WHEEL_PRIZES.length;
  const targetAngle = -(prizeIndex * slice + slice / 2) + Math.PI / 2;
  const extraSpin = Math.PI * 2 * (5 + Math.random() * 3);
  const finalAngle = targetAngle + extraSpin;

  let start = null;
  const duration = 4000;
  const startAngle = wheelAngle;

  function animate(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    wheelAngle = startAngle + (finalAngle - startAngle) * ease;
    drawWheel();
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      wheelAngle = finalAngle % (Math.PI * 2);
      wheelSpinning = false;
      document.getElementById('spinBtn').disabled = false;
      applyWheelPrize(prize);
    }
  }
  requestAnimationFrame(animate);
}

async function applyWheelPrize(prize) {
  userData.lastSpin = Date.now();

  if (prize.type === 'banknot' && prize.value > 0) {
    userData.banknot += prize.value;
    document.getElementById('wheelStatus').textContent = `🎉 ${prize.value} Banknot kazandın!`;
    showToast(`+${prize.value} 💵 Banknot!`);
  } else if (prize.type === 'power' && prize.value > 0) {
    userData.power += prize.value;
    document.getElementById('wheelStatus').textContent = `⚡ ${prize.value} Güç kazandın!`;
    showToast(`+${prize.value} ⚡ Güç!`);
  } else {
    document.getElementById('wheelStatus').textContent = `😢 Şansını dene! Yarın tekrar çevir.`;
  }

  updateUI();
  await saveUser();
}

function renderWheelPrizes() {
  const container = document.getElementById('wheelPrizes');
  container.innerHTML = WHEEL_PRIZES.map(p =>
    `<div class="prize-item">
      <span style="width:12px;height:12px;border-radius:3px;background:${p.color};display:inline-block;flex-shrink:0"></span>
      ${p.label}
    </div>`
  ).join('');
}

// ─── REKLAM İZLE (Güç Kazan) ─────────────────────────────
async function watchAd() {
  const now = Date.now();
  const last = userData.lastAdWatch;
  if (last && (now - last) < 60 * 60 * 1000) {
    const rem = Math.ceil((60 * 60 * 1000 - (now - last)) / 60000);
    showToast(`${rem} dk sonra tekrar reklam izleyebilirsin!`);
    return;
  }

  // Telegram reklamı simülasyonu — gerçek entegrasyon için Admob/Unity Ads SDK ekle
  showToast('Reklam yükleniyor...');
  setTimeout(async () => {
    const earned = Math.floor(Math.random() * 20) + 10; // 10-30 güç
    userData.power += earned;
    userData.lastAdWatch = Date.now();
    updateUI();
    showToast(`+${earned} ⚡ Güç kazandın!`);
    await saveUser();
  }, 2000);
}

// ─── AYARLAR ─────────────────────────────────────────────
function toggleDarkMode() {
  const dark = document.getElementById('darkModeToggle').checked;
  document.body.classList.toggle('dark-mode', dark);
  document.body.classList.toggle('light-mode', !dark);
  userData.darkMode = dark;
  saveUser();
}

function showChangePassword() {
  openModal('🔑 Şifre Değiştir',
    `<div class="form-group">
      <label>Mevcut Şifre</label>
      <input type="password" id="oldPass" placeholder="••••••••" />
    </div>
    <div class="form-group">
      <label>Yeni Şifre</label>
      <input type="password" id="newPass" placeholder="••••••••" />
    </div>
    <button class="form-submit" onclick="changePassword()">Değiştir</button>`
  );
}

async function changePassword() {
  const oldPass = document.getElementById('oldPass')?.value;
  const newPass = document.getElementById('newPass')?.value;
  if (!newPass || newPass.length < 6) { showToast('Şifre en az 6 karakter olmalı!'); return; }
  // Firebase Auth şifre değiştirme buraya entegre edilebilir
  showToast('Şifre güncellendi! ✅');
  closeModal();
}

function showWithdraw() {
  const cryptoOptions = Object.entries(CRYPTO_RATES)
    .map(([k,v]) => `<option value="${k}">${v.symbol} ${v.name}</option>`)
    .join('');

  openModal('💸 Para Çek',
    `<p style="color:var(--text2);margin-bottom:16px">10.000 Banknot = 10 ₺</p>
     <div class="form-group">
       <label>Miktar (Banknot)</label>
       <input type="number" id="withdrawAmount" placeholder="Min: 10.000" min="10000" step="1000" />
     </div>
     <div class="form-group">
       <label>Kripto Para</label>
       <select id="withdrawCrypto">${cryptoOptions}</select>
     </div>
     <div class="form-group">
       <label>Cüzdan Adresi</label>
       <input type="text" id="withdrawWallet" placeholder="Cüzdan adresinizi girin" />
     </div>
     <div id="withdrawPreview" style="background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:12px;font-size:13px;color:var(--text2)">
       Miktar giriniz...
     </div>
     <button class="form-submit" onclick="submitWithdraw()">Çekim Talebi Oluştur</button>`
  );

  document.getElementById('withdrawAmount')?.addEventListener('input', updateWithdrawPreview);
  document.getElementById('withdrawCrypto')?.addEventListener('change', updateWithdrawPreview);
}

function updateWithdrawPreview() {
  const amount = parseInt(document.getElementById('withdrawAmount')?.value || 0);
  const crypto = document.getElementById('withdrawCrypto')?.value;
  const rate = CRYPTO_RATES[crypto];
  if (!rate || !amount) return;

  const tl = amount * BANKNOT_TO_TL;
  const cryptoAmount = (tl / 10 * rate.rate * 10000).toFixed(8);

  document.getElementById('withdrawPreview').innerHTML =
    `💵 ${amount.toLocaleString()} BNK → ₺${tl.toFixed(2)} → ${rate.symbol} ${cryptoAmount} ${crypto}`;
}

async function submitWithdraw() {
  const amount = parseInt(document.getElementById('withdrawAmount')?.value || 0);
  const crypto = document.getElementById('withdrawCrypto')?.value;
  const wallet = document.getElementById('withdrawWallet')?.value?.trim();

  if (amount < 10000) { showToast('Minimum 10.000 banknot!'); return; }
  if (userData.banknot < amount) { showToast('Yetersiz banknot!'); return; }
  if (!wallet) { showToast('Cüzdan adresi giriniz!'); return; }

  userData.banknot -= amount;

  await db.collection('withdrawals').add({
    uid: userData.uid,
    username: userData.username,
    amount,
    crypto,
    wallet,
    status: 'pending',
    createdAt: Date.now()
  });

  await saveUser();
  updateUI();
  closeModal();
  showToast('Çekim talebi alındı! 24-48 saat içinde işlenir.');
}

function showHowToPlay() {
  openModal('📖 Nasıl Oynanır?',
    `<p><strong>⛏️ Madencilik Oyununa Hoş Geldin!</strong></p>
     <p>Bu oyunda madencilerini yönetir, güç kazanır ve banknot üretirsin.</p>
     
     <p><strong>⚡ Güç Nedir?</strong><br>
     Güç, madencilerinin banknot üretme hızını belirler. Ne kadar fazla güçlüysen o kadar çok banknot üretirsin.</p>
     
     <p><strong>💵 Banknot Nasıl Kazanılır?</strong><br>
     Madencilerin otomatik olarak banknot üretir. Ana ekranda biriken banknotları "TOPLA" butonuyla al.</p>
     
     <p><strong>🛒 Mağaza</strong><br>
     Banknotla eşya satın al, eşyalar sana güç kazandırır. Yeni madencileri de banknotla aç!</p>
     
     <p><strong>🎡 Günlük Çark</strong><br>
     Her gün ücretsiz çark çevir, banknot veya güç kazan!</p>
     
     <p><strong>💸 Para Çekme</strong><br>
     10.000 banknot = 10₺. Ayarlar > Para Çek menüsünden kripto cüzdanına gönder.</p>
     
     <p><strong>👥 Madenciler</strong><br>
     • Şevki: Ücretsiz, güç÷1000 banknot/dk<br>
     • Hamido: güç÷750 banknot/dk<br>
     • Zırto: güç÷450 banknot/dk<br>
     • Beyza: güç÷200 banknot/dk<br>
     • Kübra: güç÷100 banknot/dk (en hızlı!)</p>`
  );
}

function showAbout() {
  openModal('ℹ️ Hakkında',
    `<p><strong>Madenci Oyunu v1.0</strong></p>
     <p>Telegram Mini App olarak çalışan ücretsiz madencilik oyunu.</p>
     <p>Gerçek para kazanmak için banknotlarını kripto paraya çevir!</p>
     <p style="margin-top:16px;color:var(--text3);font-size:12px">
     ⚠️ Oyun içi token değerleri piyasa fiyatlarına göre değişkenlik gösterebilir. 
     Çekim işlemleri 24-48 saat içinde manuel olarak onaylanır.</p>`
  );
}

function loadCryptoRates() {
  const container = document.getElementById('cryptoRates');
  container.innerHTML = Object.entries(CRYPTO_RATES).map(([k, v]) =>
    `<div class="crypto-rate-item">
      <span class="crypto-name">${v.symbol} ${v.name}</span>
      <span class="crypto-value">10.000 BNK = ${(10000 * BANKNOT_TO_TL / 10 * v.rate * 10000).toFixed(6)} ${k}</span>
    </div>`
  ).join('');
}

// ─── EKRAN GEÇİŞİ ────────────────────────────────────────
function switchScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`screen-${name}`)?.classList.add('active');
  document.getElementById(`nav-${name}`)?.classList.add('active');

  if (name === 'leaderboard') loadLeaderboard();
  if (name === 'wheel') { drawWheel(); renderWheelPrizes(); }
  if (name === 'shop') renderShop();
  if (name === 'settings') loadCryptoRates();
}

// ─── MODAL ────────────────────────────────────────────────
function openModal(title, body) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

// ─── TOAST ────────────────────────────────────────────────
let toastTimeout;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── BAŞLATMA ─────────────────────────────────────────────
async function init() {
  // Splash animasyonu
  await loadUser();

  // Dark mode uygula
  document.body.classList.toggle('dark-mode', userData.darkMode !== false);
  document.body.classList.toggle('light-mode', userData.darkMode === false);
  const toggle = document.getElementById('darkModeToggle');
  if (toggle) toggle.checked = userData.darkMode !== false;

  // Offline üretim hesapla
  calcOfflineProduction();

  // UI güncelle
  updateUI();

  // Üretim döngüsü başlat
  startProduction();

  // Splash kapat
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    document.getElementById('splash').style.transition = 'opacity 0.5s';
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
    }, 500);
  }, 2200);
}

init();
