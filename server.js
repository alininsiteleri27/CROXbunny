const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

// ─── Firebase Admin Init ──────────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'oyun-75056',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  databaseURL: 'https://oyun-75056-default-rtdb.firebaseio.com'
});
const db = admin.database();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── Constants ────────────────────────────────────────────────────────────────
const MINERS = {
  mehmet_dayi: { name: 'Mehmet Dayı', price: 10000, kmrPerHour: 100, multiplier: 2 },
  semsi_dayi:  { name: 'Şemsi Dayı',  price: 20000, kmrPerHour: 250, multiplier: 4 },
  kubra_teyze: { name: 'Kübra Teyze', price: 50000, kmrPerHour: 750, multiplier: 6 },
  beyza_nene:  { name: 'Beyza Nene',  price: 100000, kmrPerHour: 2000, multiplier: 8 },
  ali_usta:    { name: 'Ali Usta',    price: 250000, kmrPerHour: 5000, multiplier: 10 }
};

const BOXES = {
  komur: { name: 'Kömür Kutusu',  price: 500,   currency: 'kmr' },
  bronz: { name: 'Bronz Sandık',  price: 2000,  currency: 'kmr' },
  gumus: { name: 'Gümüş Sandık',  price: 5000,  currency: 'kmr' },
  altin: { name: 'Altın Sandık',  price: 15000, currency: 'kmr' }
};

const LEAGUES = {
  cirak:   { name: 'Çırak',   minPH: 0,    maxPH: 499,  reward: 10  },
  amator:  { name: 'Amatör',  minPH: 500,  maxPH: 1999, reward: 100 },
  usta:    { name: 'Usta',    minPH: 2000, maxPH: Infinity, reward: 500 }
};

// PH values for items 1-100
const ITEM_PH = [
  0, // index 0 unused
  2,3,2,3,4,2,3,4,5,5,   // 1-10  common
  6,6,7,7,8,8,9,9,10,10, // 11-20 common
  4,5,6,8,10,             // 21-25 common
  12,14,15,16,17,18,19,20,20,21, // 26-35 uncommon
  22,22,23,24,25,25,26,27,28,28, // 36-45 uncommon
  29,29,30,13,30,                // 46-50 uncommon
  35,38,40,42,44,46,48,50,52,54, // 51-60 rare
  56,58,60,62,65,67,68,70,72,74, // 61-70 rare
  76,33,78,79,80,                // 71-75 rare
  90,95,100,105,110,115,120,125,130,135, // 76-85 epic
  140,150,                       // 86-87 epic
  155,160,165,168,171,174,177,180,185,188,192,196,200 // 88-100 legendary
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + 'maden-salt-2024').digest('hex');
}

async function getSession(token) {
  const snap = await db.ref(`sessions/${token}`).once('value');
  if (!snap.exists()) return null;
  const s = snap.val();
  if (s.expiresAt < Date.now()) { await db.ref(`sessions/${token}`).remove(); return null; }
  return s;
}

function calcLeague(ph) {
  if (ph >= 2000) return 'usta';
  if (ph >= 500)  return 'amator';
  return 'cirak';
}

async function calcTotalPH(equipment) {
  let total = 0;
  for (const [itemId, count] of Object.entries(equipment || {})) {
    const ph = ITEM_PH[parseInt(itemId)] || 0;
    total += ph * count;
  }
  return total;
}

function generateBoxReward(boxId) {
  const r = Math.random() * 100;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const common    = Array.from({length:25}, (_,i)=>i+1);
  const uncommon  = Array.from({length:25}, (_,i)=>i+26);
  const rare      = Array.from({length:25}, (_,i)=>i+51);
  const epic      = Array.from({length:12}, (_,i)=>i+76);
  const legendary = Array.from({length:13}, (_,i)=>i+88);

  switch (boxId) {
    case 'komur':
      if (r < 70) return { type:'kmr',       amount: Math.floor(Math.random()*400)+100 };
      if (r < 90) return { type:'banknot',   amount: Math.floor(Math.random()*4)+1 };
      return           { type:'equipment', itemId: pick(common) };
    case 'bronz':
      if (r < 40) return { type:'kmr',       amount: Math.floor(Math.random()*1500)+500 };
      if (r < 75) return { type:'banknot',   amount: Math.floor(Math.random()*15)+5 };
      if (r < 95) return { type:'equipment', itemId: pick(common) };
      return           { type:'equipment', itemId: pick(uncommon) };
    case 'gumus':
      if (r < 35) return { type:'banknot',   amount: Math.floor(Math.random()*80)+20 };
      if (r < 70) return { type:'equipment', itemId: pick(uncommon) };
      if (r < 95) return { type:'equipment', itemId: pick(rare) };
      return           { type:'equipment', itemId: pick(epic) };
    case 'altin':
      if (r < 20) return { type:'banknot',   amount: Math.floor(Math.random()*400)+100 };
      if (r < 60) return { type:'equipment', itemId: pick(rare) };
      if (r < 90) return { type:'equipment', itemId: pick(epic) };
      return           { type:'equipment', itemId: pick(legendary) };
    default:
      return { type:'kmr', amount: 100 };
  }
}

async function updateLeaderboard(uid, username, totalPH, league) {
  await db.ref(`leaderboard/${uid}`).set({ username, totalPH, league, updatedAt: Date.now() });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || username.length < 3 || username.length > 20)
      return res.status(400).json({ error: 'Kullanıcı adı 3-20 karakter olmalıdır' });
    if (!/^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+$/.test(username))
      return res.status(400).json({ error: 'Kullanıcı adı geçersiz karakter içeriyor' });
    if (!password || password.length < 8)
      return res.status(400).json({ error: 'Şifre en az 8 karakter olmalıdır' });
    if (!/[A-Z]/.test(password))
      return res.status(400).json({ error: 'Şifre en az 1 büyük harf içermelidir' });
    if (!/[0-9]/.test(password))
      return res.status(400).json({ error: 'Şifre en az 1 rakam içermelidir' });

    const uref = await db.ref(`usernames/${username.toLowerCase()}`).once('value');
    if (uref.exists()) return res.status(400).json({ error: 'Bu kullanıcı adı alınmış' });

    const userRef = db.ref('users').push();
    const uid = userRef.key;
    await userRef.set({
      uid, username,
      password: hashPassword(password),
      createdAt: Date.now(),
      lastActive: Date.now(),
      balance: { kmr: 500, banknot: 0, cekip: 0 },
      miners: {},
      equipment: {},
      stats: { totalPH: 0, league: 'cirak', totalMined: 0, loginStreak: 1, lastLogin: Date.now(), lastCollect: Date.now() },
      settings: { notifications: true, sound: true, theme: 'dark', language: 'tr' }
    });
    await db.ref(`usernames/${username.toLowerCase()}`).set(uid);
    await updateLeaderboard(uid, username, 0, 'cirak');

    const token = crypto.randomBytes(32).toString('hex');
    await db.ref(`sessions/${token}`).set({ uid, createdAt: Date.now(), expiresAt: Date.now() + 30*24*60*60*1000 });
    res.json({ success: true, token, uid, username });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Sunucu hatası' }); }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const snap = await db.ref(`usernames/${username?.toLowerCase()}`).once('value');
    if (!snap.exists()) return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    const uid = snap.val();
    const userSnap = await db.ref(`users/${uid}`).once('value');
    const user = userSnap.val();
    if (user.password !== hashPassword(password))
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });

    const now = Date.now();
    const lastLogin = user.stats?.lastLogin || 0;
    const daysSince = Math.floor((now - lastLogin) / 86400000);
    let streakBonus = 0, newStreak = user.stats?.loginStreak || 1;
    if (daysSince === 1) { newStreak++; streakBonus = Math.min(newStreak * 100, 1000); }
    else if (daysSince > 1) { newStreak = 1; streakBonus = 100; }
    if (streakBonus > 0) {
      await db.ref(`users/${uid}`).update({
        'stats/loginStreak': newStreak, 'stats/lastLogin': now,
        'balance/kmr': admin.database.ServerValue.increment(streakBonus)
      });
    }
    await db.ref(`users/${uid}/lastActive`).set(now);

    const token = crypto.randomBytes(32).toString('hex');
    await db.ref(`sessions/${token}`).set({ uid, createdAt: now, expiresAt: now + 30*24*60*60*1000 });
    const updatedSnap = await db.ref(`users/${uid}`).once('value');
    res.json({ success: true, token, uid, user: updatedSnap.val(), streakBonus, newStreak });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Sunucu hatası' }); }
});

// Verify session
app.post('/api/verify', async (req, res) => {
  try {
    const session = await getSession(req.body.token);
    if (!session) return res.status(401).json({ error: 'Geçersiz oturum' });
    await db.ref(`users/${session.uid}/lastActive`).set(Date.now());
    const snap = await db.ref(`users/${session.uid}`).once('value');
    res.json({ success: true, uid: session.uid, user: snap.val() });
  } catch (e) { res.status(500).json({ error: 'Sunucu hatası' }); }
});

// Collect mining rewards
app.post('/api/collect', async (req, res) => {
  try {
    const session = await getSession(req.body.token);
    if (!session) return res.status(401).json({ error: 'Yetkisiz' });
    const userRef = db.ref(`users/${session.uid}`);
    const snap = await userRef.once('value');
    const user = snap.val();

    const now = Date.now();
    const lastCollect = user.stats?.lastCollect || now;
    const hoursPassed = Math.min((now - lastCollect) / 3600000, 24);
    const totalPH = user.stats?.totalPH || 0;

    let kmrPerHour = 0;
    for (const [mid, owned] of Object.entries(user.miners || {})) {
      if (!owned || !MINERS[mid]) continue;
      const bonus = 1 + (totalPH * MINERS[mid].multiplier / 1000);
      kmrPerHour += MINERS[mid].kmrPerHour * bonus;
    }

    const earned = Math.floor(kmrPerHour * hoursPassed);
    if (earned <= 0) return res.json({ success: true, earned: 0 });

    await userRef.update({
      'balance/kmr': admin.database.ServerValue.increment(earned),
      'stats/lastCollect': now,
      'stats/totalMined': admin.database.ServerValue.increment(earned)
    });
    await updateLeaderboard(session.uid, user.username, totalPH, user.stats?.league || 'cirak');
    res.json({ success: true, earned, hoursPassed: hoursPassed.toFixed(2) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Sunucu hatası' }); }
});

// Buy miner
app.post('/api/buy/miner', async (req, res) => {
  try {
    const session = await getSession(req.body.token);
    if (!session) return res.status(401).json({ error: 'Yetkisiz' });
    const { minerId } = req.body;
    if (!MINERS[minerId]) return res.status(400).json({ error: 'Geçersiz madenci' });

    const userRef = db.ref(`users/${session.uid}`);
    const snap = await userRef.once('value');
    const user = snap.val();

    if (user.miners?.[minerId]) return res.status(400).json({ error: 'Bu madenci zaten sizin' });
    if ((user.balance?.banknot || 0) < MINERS[minerId].price)
      return res.status(400).json({ error: 'Yetersiz Banknot' });

    await userRef.update({
      [`miners/${minerId}`]: true,
      'balance/banknot': (user.balance.banknot || 0) - MINERS[minerId].price
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Sunucu hatası' }); }
});

// Open box
app.post('/api/open/box', async (req, res) => {
  try {
    const session = await getSession(req.body.token);
    if (!session) return res.status(401).json({ error: 'Yetkisiz' });
    const { boxId } = req.body;
    const box = BOXES[boxId];
    if (!box) return res.status(400).json({ error: 'Geçersiz kutu' });

    const userRef = db.ref(`users/${session.uid}`);
    const snap = await userRef.once('value');
    const user = snap.val();
    const bal = user.balance?.[box.currency] || 0;
    if (bal < box.price) return res.status(400).json({ error: `Yetersiz ${box.currency.toUpperCase()}` });

    const reward = generateBoxReward(boxId);
    const updates = { [`balance/${box.currency}`]: bal - box.price };

    if (reward.type === 'kmr')      updates['balance/kmr']    = (user.balance?.kmr    || 0) - (box.currency==='kmr'? box.price:0) + reward.amount;
    if (reward.type === 'banknot')  updates['balance/banknot']= (user.balance?.banknot || 0) + reward.amount;
    if (reward.type === 'equipment') {
      const cur = user.equipment?.[reward.itemId] || 0;
      updates[`equipment/${reward.itemId}`] = cur + 1;
      const newEq = { ...(user.equipment||{}), [reward.itemId]: cur+1 };
      const newPH = await calcTotalPH(newEq);
      updates['stats/totalPH'] = newPH;
      updates['stats/league']  = calcLeague(newPH);
      await updateLeaderboard(session.uid, user.username, newPH, calcLeague(newPH));
    }
    await userRef.update(updates);
    res.json({ success: true, reward });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Sunucu hatası' }); }
});

// Convert currency
app.post('/api/convert', async (req, res) => {
  try {
    const session = await getSession(req.body.token);
    if (!session) return res.status(401).json({ error: 'Yetkisiz' });
    const { from, to, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Geçersiz miktar' });

    const userRef = db.ref(`users/${session.uid}`);
    const snap = await userRef.once('value');
    const user = snap.val();

    if (from === 'kmr' && to === 'banknot') {
      const needed = amount * 1000;
      if ((user.balance?.kmr || 0) < needed) return res.status(400).json({ error: 'Yetersiz KMR' });
      await userRef.update({ 'balance/kmr': (user.balance.kmr||0)-needed, 'balance/banknot': (user.balance.banknot||0)+amount });
    } else if (from === 'banknot' && to === 'cekip') {
      const needed = amount * 10000;
      if ((user.balance?.banknot || 0) < needed) return res.status(400).json({ error: 'Yetersiz Banknot' });
      await userRef.update({ 'balance/banknot': (user.balance.banknot||0)-needed, 'balance/cekip': (user.balance.cekip||0)+amount });
    } else return res.status(400).json({ error: 'Geçersiz dönüşüm' });

    const updated = await userRef.once('value');
    res.json({ success: true, balance: updated.val().balance });
  } catch (e) { res.status(500).json({ error: 'Sunucu hatası' }); }
});

// Withdraw
app.post('/api/withdraw', async (req, res) => {
  try {
    const session = await getSession(req.body.token);
    if (!session) return res.status(401).json({ error: 'Yetkisiz' });
    const { amount, address } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ error: 'Minimum 1 Çekip çekebilirsiniz' });

    const userRef = db.ref(`users/${session.uid}`);
    const snap = await userRef.once('value');
    const user = snap.val();
    if ((user.balance?.cekip || 0) < amount) return res.status(400).json({ error: 'Yetersiz Çekip' });

    const wRef = db.ref('withdrawals').push();
    await wRef.set({ uid: session.uid, username: user.username, amount, address: address||'', status: 'pending', createdAt: Date.now() });
    await userRef.update({ 'balance/cekip': (user.balance.cekip||0) - amount });
    res.json({ success: true, message: 'Çekim talebiniz alındı' });
  } catch (e) { res.status(500).json({ error: 'Sunucu hatası' }); }
});

// Update settings
app.post('/api/settings', async (req, res) => {
  try {
    const session = await getSession(req.body.token);
    if (!session) return res.status(401).json({ error: 'Yetkisiz' });
    const { settings } = req.body;
    await db.ref(`users/${session.uid}/settings`).update(settings);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Sunucu hatası' }); }
});

// Change password
app.post('/api/change-password', async (req, res) => {
  try {
    const session = await getSession(req.body.token);
    if (!session) return res.status(401).json({ error: 'Yetkisiz' });
    const { oldPassword, newPassword } = req.body;
    const snap = await db.ref(`users/${session.uid}`).once('value');
    const user = snap.val();
    if (user.password !== hashPassword(oldPassword)) return res.status(400).json({ error: 'Mevcut şifre hatalı' });
    if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword))
      return res.status(400).json({ error: 'Yeni şifre geçersiz' });
    await db.ref(`users/${session.uid}/password`).set(hashPassword(newPassword));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Sunucu hatası' }); }
});

// Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const snap = await db.ref('leaderboard').orderByChild('totalPH').limitToLast(100).once('value');
    const list = [];
    snap.forEach(c => list.push({ uid: c.key, ...c.val() }));
    list.sort((a,b) => b.totalPH - a.totalPH);
    res.json({ success: true, leaderboard: list });
  } catch (e) { res.status(500).json({ error: 'Sunucu hatası' }); }
});

// ─── League Reward Distribution (every 20 min) ────────────────────────────────
async function distributeLeagueRewards() {
  try {
    console.log('[League] Ödüller dağıtılıyor...');
    const snap = await db.ref('leaderboard').once('value');
    const leagues = { cirak: [], amator: [], usta: [] };
    snap.forEach(c => { const d = c.val(); if (leagues[d.league]) leagues[d.league].push({ uid: c.key, ...d }); });

    for (const [leagueId, members] of Object.entries(leagues)) {
      if (members.length === 0) continue;
      const totalReward = LEAGUES[leagueId].reward;
      const totalPH = members.reduce((s, m) => s + (m.totalPH || 1), 0);
      const distribRef = db.ref(`distributions/${leagueId}`).push();
      const dist = { timestamp: Date.now(), totalReward, memberCount: members.length, shares: {} };

      for (const m of members) {
        const share = totalPH > 0 ? (m.totalPH || 1) / totalPH * totalReward : totalReward / members.length;
        const rounded = Math.floor(share * 1000) / 1000;
        dist.shares[m.uid] = rounded;
        await db.ref(`users/${m.uid}/balance/cekip`).transaction(v => (v||0) + rounded);
        await db.ref(`users/${m.uid}/notifications`).push({
          type: 'league_reward', message: `${LEAGUES[leagueId].name} lig ödülü: ${rounded.toFixed(3)} Çekip`,
          amount: rounded, timestamp: Date.now(), read: false
        });
      }
      await distribRef.set(dist);
    }
    console.log('[League] Dağıtım tamamlandı');
  } catch (e) { console.error('[League] Hata:', e); }
}

setInterval(distributeLeagueRewards, 20 * 60 * 1000);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🪨 MadenOyunu server: http://localhost:${PORT}`));
