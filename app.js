// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDuKLuoePZ6mNsKhQBGXumxMwF0UKTQvc8",
    authDomain: "oyun-75056.firebaseapp.com",
    projectId: "oyun-75056",
    storageBucket: "oyun-75056.firebasestorage.app",
    messagingSenderId: "980660244755",
    appId: "1:980660244755:web:47889c4b6637ab05cdcae6",
    measurementId: "G-J9RKPSVT8B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Game Constants
const MINERS = {
    kubra: { name: 'Kübra', cost: 50, rate: 250, multiplier: 2, icon: '👩‍🌾' },
    beyza: { name: 'Beyza', cost: 80, rate: 500, multiplier: 2.5, icon: '👩‍🔧' },
    mehmet: { name: 'Mehmet', cost: 125, rate: 750, multiplier: 3, icon: '👨‍🔬' },
    sevki: { name: 'Şevki', cost: 180, rate: 1000, multiplier: 3.5, icon: '👨‍💻' },
    ali: { name: 'Ali', cost: 300, rate: 2000, multiplier: 4, icon: '👨‍🚀' }
};

const LEAGUES = {
    cirak: { name: 'Çırak', min: 0, max: 1000, pool: 50 },
    amatör: { name: 'Amatör', min: 1001, max: 10000, pool: 200 },
    usta: { name: 'Usta', min: 10001, max: Infinity, pool: 1000 }
};

const ITEMS_POOL = [
    // Starter (1-40 PH)
    { id: 's1', name: 'Eski Kazma', ph: 5, rarity: 'starter', icon: '⛏️' },
    { id: 's2', name: 'Taş Kırıcı', ph: 10, rarity: 'starter', icon: '🔨' },
    { id: 's3', name: 'Bronz Tılsım', ph: 15, rarity: 'starter', icon: '🔰' },
    { id: 's4', name: 'Demir Yüzük', ph: 20, rarity: 'starter', icon: '💍' },
    { id: 's5', name: 'Ahşap Kalkan', ph: 25, rarity: 'starter', icon: '🛡️' },
    { id: 's6', name: 'Bakır Kolye', ph: 30, rarity: 'starter', icon: '📿' },
    { id: 's7', name: 'Pratik Fener', ph: 35, rarity: 'starter', icon: '🔦' },
    { id: 's8', name: 'İşçi Eldiveni', ph: 40, rarity: 'starter', icon: '🧤' },
    
    // Epic (50-150 PH)
    { id: 'e1', name: 'Gümüş Kılıç', ph: 50, rarity: 'epic', icon: '⚔️' },
    { id: 'e2', name: 'Kristal Küre', ph: 60, rarity: 'epic', icon: '🔮' },
    { id: 'e3', name: 'Altın Saat', ph: 70, rarity: 'epic', icon: '⌚' },
    { id: 'e4', name: 'Zümrüt Yüzük', ph: 80, rarity: 'epic', icon: '💎' },
    { id: 'e5', name: 'Büyülü Kitap', ph: 90, rarity: 'epic', icon: '📖' },
    { id: 'e6', name: 'Ejderha Dişi', ph: 100, rarity: 'epic', icon: '🐉' },
    { id: 'e7', name: 'Gölgeli Pelerin', ph: 120, rarity: 'epic', icon: '🧥' },
    { id: 'e8', name: 'Şans Tılsımı', ph: 150, rarity: 'epic', icon: '🍀' },
    
    // Legendary (200-300 PH)
    { id: 'l1', name: 'Titan Çekici', ph: 200, rarity: 'legendary', icon: '🔨' },
    { id: 'l2', name: 'Nükleer Pil', ph: 220, rarity: 'legendary', icon: '⚡' },
    { id: 'l3', name: 'Uzay Madeni', ph: 250, rarity: 'legendary', icon: '🚀' },
    { id: 'l4', name: 'Sonsuzluk Taşı', ph: 300, rarity: 'legendary', icon: '♾️' }
];

const ADMIN_EMAILS = ['admin@reisza.com', 'ali@reisza.com']; // Admin e-postaları

// Global State
let currentUser = null;
let userData = null;
let gameLoop = null;

// Auth Functions
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    }
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert('Giriş hatası: ' + error.message);
    }
});

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user document
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            kmr: 1000,
            banknote: 10,
            cekip: 0,
            miners: [],
            items: [],
            slots: 5,
            maxStorage: 10000,
            storedKMR: 0,
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
            isBanned: false,
            isAdmin: ADMIN_EMAILS.includes(email),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
    } catch (error) {
        alert('Kayıt hatası: ' + error.message);
    }
});

function logout() {
    auth.signOut();
}

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            
            if (userData.isBanned) {
                alert('Hesabınız banlanmıştır!');
                await auth.signOut();
                return;
            }
            
            document.getElementById('auth-screen').classList.remove('active');
            document.getElementById('main-app').classList.remove('hidden');
            
            // Setup admin panel
            if (userData.isAdmin) {
                document.getElementById('admin-badge').classList.remove('hidden');
                document.getElementById('admin-nav-btn').classList.remove('hidden');
            }
            
            initializeGame();
        }
    } else {
        currentUser = null;
        userData = null;
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('main-app').classList.add('hidden');
        if (gameLoop) clearInterval(gameLoop);
    }
});

// Game Functions
function initializeGame() {
    updateUI();
    loadMiners();
    loadInventory();
    startGameLoop();
    
    // Setup real-time listener
    db.collection('users').doc(currentUser.uid).onSnapshot((doc) => {
        if (doc.exists) {
            userData = doc.data();
            updateUI();
        }
    });
}

function startGameLoop() {
    gameLoop = setInterval(async () => {
        if (!userData || !currentUser) return;
        
        const now = Date.now();
        const lastUpdate = userData.lastUpdate?.toMillis() || now;
        const diff = (now - lastUpdate) / 1000; // seconds
        
        if (diff > 0) {
            let totalRate = 0;
            let activeMiners = 0;
            let maxMultiplier = 1;
            
            // Calculate production
            userData.miners?.forEach(miner => {
                if (miner.energy > 0) {
                    const minerType = MINERS[miner.type];
                    totalRate += minerType.rate * Math.pow(1.25, miner.level - 1);
                    maxMultiplier = Math.max(maxMultiplier, minerType.multiplier);
                    activeMiners++;
                }
            });
            
            // Calculate items PH
            let itemsPH = userData.items?.reduce((sum, item) => sum + (item.ph || 0), 0) || 0;
            let totalPH = itemsPH * maxMultiplier;
            
            // Calculate KMR production
            let produced = totalRate * diff;
            let newStored = userData.storedKMR + produced;
            
            // Cap at max storage
            if (newStored > userData.maxStorage) {
                newStored = userData.maxStorage;
            }
            
            // Decrease energy
            const updatedMiners = userData.miners?.map(miner => {
                if (miner.energy > 0) {
                    const newEnergy = Math.max(0, miner.energy - (diff / 3600 * 10)); // 10% per hour
                    return { ...miner, energy: newEnergy };
                }
                return miner;
            }) || [];
            
            // Update user data
            await db.collection('users').doc(currentUser.uid).update({
                storedKMR: newStored,
                miners: updatedMiners,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }, 1000);
}

function updateUI() {
    if (!userData) return;
    
    // Update balances
    document.getElementById('header-username').textContent = '@' + userData.username;
    document.getElementById('kmr-balance').textContent = Math.floor(userData.kmr).toLocaleString();
    document.getElementById('banknote-balance').textContent = userData.banknote.toLocaleString();
    document.getElementById('cekip-balance').textContent = userData.cekip.toFixed(2);
    
    // Update PH and League
    calculatePH();
    
    // Update storage
    document.getElementById('stored-kmr').textContent = Math.floor(userData.storedKMR).toLocaleString();
    document.getElementById('max-storage').textContent = userData.maxStorage.toLocaleString();
    const storagePercent = (userData.storedKMR / userData.maxStorage) * 100;
    document.getElementById('storage-fill').style.width = storagePercent + '%';
    
    // Update miner slots
    document.getElementById('miner-slots').textContent = `${userData.miners?.length || 0}/${userData.slots}`;
}

function calculatePH() {
    if (!userData) return 0;
    
    let maxMultiplier = 1;
    userData.miners?.forEach(miner => {
        if (miner.energy > 0) {
            maxMultiplier = Math.max(maxMultiplier, MINERS[miner.type].multiplier);
        }
    });
    
    let itemsPH = userData.items?.reduce((sum, item) => sum + (item.ph || 0), 0) || 0;
    let totalPH = Math.floor(itemsPH * maxMultiplier);
    
    document.getElementById('total-ph').textContent = totalPH.toLocaleString();
    
    // Determine league
    let league = 'cirak';
    let nextLeague = 'amatör';
    let progress = 0;
    
    if (totalPH >= 10001) {
        league = 'usta';
        nextLeague = 'Max';
        progress = 100;
    } else if (totalPH >= 1001) {
        league = 'amatör';
        nextLeague = 'usta';
        progress = ((totalPH - 1001) / 9000) * 100;
    } else {
        progress = (totalPH / 1000) * 100;
    }
    
    document.getElementById('current-league').textContent = LEAGUES[league].name;
    document.getElementById('next-league').textContent = nextLeague === 'Max' ? 'Maksimum Seviye' : `Sıradaki: ${LEAGUES[nextLeague]?.name || ''}`;
    document.getElementById('league-bar').style.width = Math.min(progress, 100) + '%';
    
    return totalPH;
}

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`page-${page}`).classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    if (page === 'store') loadStore();
    if (page === 'leaderboard') loadLeaderboard();
    if (page === 'finance') loadFinance();
    if (page === 'admin' && userData?.isAdmin) loadAdminPanel();
}

// Mine Functions
function loadMiners() {
    const grid = document.getElementById('miners-grid');
    grid.innerHTML = '';
    
    // Create slots
    for (let i = 0; i < userData.slots; i++) {
        const miner = userData.miners?.[i];
        const card = document.createElement('div');
        card.className = `miner-card ${miner ? 'active' : 'empty'}`;
        
        if (miner) {
            const minerType = MINERS[miner.type];
            const rate = Math.floor(minerType.rate * Math.pow(1.25, miner.level - 1));
            
            card.innerHTML = `
                <div class="miner-icon">${minerType.icon}</div>
                <div class="miner-name">${minerType.name}</div>
                <div class="miner-level">Lvl ${miner.level}/10</div>
                <div class="miner-rate">${rate.toLocaleString()} KMR/s</div>
                <div class="energy-bar">
                    <div class="energy-fill" style="width: ${miner.energy}%"></div>
                </div>
                <button class="btn-energy" onclick="refillEnergy(${i})" ${miner.energy > 20 ? 'disabled' : ''}>
                    Enerji Ver (${Math.floor(rate * 4 * 3600 / 1000)}K)
                </button>
                <button class="btn-upgrade" onclick="upgradeMiner(${i})">
                    Yükselt (${Math.floor(minerType.cost * Math.pow(1.2, miner.level))}B)
                </button>
            `;
        } else {
            card.innerHTML = `
                <div class="miner-icon">➕</div>
                <div class="miner-name">Boş Slot</div>
                <div style="color: var(--text-secondary); font-size: 0.8rem;">Mağazadan madenci al</div>
            `;
        }
        
        grid.appendChild(card);
    }
}

async function refillEnergy(index) {
    const miner = userData.miners[index];
    const minerType = MINERS[miner.type];
    const rate = Math.floor(minerType.rate * Math.pow(1.25, miner.level - 1));
    const cost = Math.floor(rate * 4 * 3600 / 1000); // 4 hours of production in KMR
    
    if (userData.kmr < cost) {
        alert('Yetersiz KMR!');
        return;
    }
    
    const updatedMiners = [...userData.miners];
    updatedMiners[index].energy = 100;
    
    await db.collection('users').doc(currentUser.uid).update({
        kmr: userData.kmr - cost,
        miners: updatedMiners
    });
    
    loadMiners();
}

async function upgradeMiner(index) {
    const miner = userData.miners[index];
    const minerType = MINERS[miner.type];
    const cost = Math.floor(minerType.cost * Math.pow(1.2, miner.level));
    
    if (miner.level >= 10) {
        alert('Maksimum seviye!');
        return;
    }
    
    if (userData.banknote < cost) {
        alert('Yetersiz Banknot!');
        return;
    }
    
    const updatedMiners = [...userData.miners];
    updatedMiners[index].level++;
    
    await db.collection('users').doc(currentUser.uid).update({
        banknote: userData.banknote - cost,
        miners: updatedMiners
    });
    
    loadMiners();
}

async function collectAllKMR() {
    if (userData.storedKMR <= 0) {
        alert('Toplanacak KMR yok!');
        return;
    }
    
    const amount = Math.floor(userData.storedKMR);
    
    await db.collection('users').doc(currentUser.uid).update({
        kmr: userData.kmr + amount,
        storedKMR: 0
    });
    
    alert(`${amount.toLocaleString()} KMR toplandı!`);
}

async function expandMine() {
    if (userData.cekip < 10) {
        alert('Yetersiz Çekip! (Gereken: 10)');
        return;
    }
    
    if (userData.slots >= 20) {
        alert('Maksimum slot sayısına ulaştınız!');
        return;
    }
    
    await db.collection('users').doc(currentUser.uid).update({
        cekip: userData.cekip - 10,
        slots: userData.slots + 1
    });
    
    loadMiners();
}

// Store Functions
function switchStoreTab(tab) {
    document.querySelectorAll('.store-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.store-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`store-${tab}`).classList.add('active');
}

function loadStore() {
    // Load miners shop
    const minersShop = document.getElementById('miners-shop');
    minersShop.innerHTML = '';
    
    Object.entries(MINERS).forEach(([key, miner]) => {
        const card = document.createElement('div');
        card.className = 'miner-shop-card';
        card.innerHTML = `
            <div class="icon">${miner.icon}</div>
            <h4>${miner.name}</h4>
            <div class="stats">
                ${miner.rate} KMR/s<br>
                x${miner.multiplier} PH Çarpanı
            </div>
            <div class="price">${miner.cost} Banknot</div>
            <button class="btn-buy" onclick="buyMiner('${key}')">Satın Al</button>
        `;
        minersShop.appendChild(card);
    });
    
    // Load daily items
    loadDailyItems();
}

async function buyMiner(type) {
    const miner = MINERS[type];
    
    if (userData.banknote < miner.cost) {
        alert('Yetersiz Banknot!');
        return;
    }
    
    if (userData.miners?.length >= userData.slots) {
        alert('Boş slotunuz yok!');
        return;
    }
    
    const newMiner = {
        type: type,
        level: 1,
        energy: 100,
        acquiredAt: Date.now()
    };
    
    await db.collection('users').doc(currentUser.uid).update({
        banknote: userData.banknote - miner.cost,
        miners: firebase.firestore.FieldValue.arrayUnion(newMiner)
    });
    
    alert(`${miner.name} satın alındı!`);
    loadMiners();
}

function loadDailyItems() {
    const dailyContainer = document.getElementById('daily-items');
    dailyContainer.innerHTML = '';
    
    // Generate 3 random items for today based on date
    const today = new Date().toDateString();
    const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    const dailyItems = [];
    for (let i = 0; i < 3; i++) {
        const itemIndex = (seed + i) % ITEMS_POOL.length;
        dailyItems.push(ITEMS_POOL[itemIndex]);
    }
    
    dailyItems.forEach((item, idx) => {
        const price = item.rarity === 'starter' ? 5 : item.rarity === 'epic' ? 15 : 50;
        const card = document.createElement('div');
        card.className = 'miner-shop-card';
        card.innerHTML = `
            <div class="icon">${item.icon}</div>
            <h4>${item.name}</h4>
            <div class="stats">${item.ph} PH<br>${item.rarity.toUpperCase()}</div>
            <div class="price">${price} Banknot</div>
            <button class="btn-buy" onclick="buyDailyItem(${idx})">Satın Al</button>
        `;
        dailyContainer.appendChild(card);
    });
    
    // Store daily items in global for reference
    window.currentDailyItems = dailyItems;
}

async function buyDailyItem(index) {
    const item = window.currentDailyItems[index];
    const price = item.rarity === 'starter' ? 5 : item.rarity === 'epic' ? 15 : 50;
    
    if (userData.banknote < price) {
        alert('Yetersiz Banknot!');
        return;
    }
    
    await db.collection('users').doc(currentUser.uid).update({
        banknote: userData.banknote - price,
        items: firebase.firestore.FieldValue.arrayUnion({
            ...item,
            acquiredAt: Date.now()
        })
    });
    
    alert(`${item.name} satın alındı!`);
}

// Crate System
async function openCrate(type) {
    const cost = type === 'basic' ? 1000 : 5000;
    
    if (userData.kmr < cost) {
        alert('Yetersiz KMR!');
        return;
    }
    
    // Deduct KMR
    await db.collection('users').doc(currentUser.uid).update({
        kmr: userData.kmr - cost
    });
    
    // Show modal
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('crate-modal').classList.remove('hidden');
    document.getElementById('crate-result').classList.add('hidden');
    
    // Animation
    setTimeout(async () => {
        let reward;
        const rand = Math.random();
        
        if (type === 'basic') {
            if (rand < 0.05) {
                reward = { type: 'cekip', amount: 0.05, name: '0.05 Çekip', icon: '💎' };
            } else if (rand < 0.5) {
                // Starter item
                const items = ITEMS_POOL.filter(i => i.rarity === 'starter');
                reward = items[Math.floor(Math.random() * items.length)];
                reward.type = 'item';
            } else {
                // Epic item
                const items = ITEMS_POOL.filter(i => i.rarity === 'epic');
                reward = items[Math.floor(Math.random() * items.length)];
                reward.type = 'item';
            }
        } else {
            if (rand < 0.05) {
                reward = { type: 'cekip', amount: 0.5, name: '0.5 Çekip', icon: '💎' };
            } else if (rand < 0.4) {
                // Epic item
                const items = ITEMS_POOL.filter(i => i.rarity === 'epic');
                reward = items[Math.floor(Math.random() * items.length)];
                reward.type = 'item';
            } else {
                // Legendary item
                const items = ITEMS_POOL.filter(i => i.rarity === 'legendary');
                reward = items[Math.floor(Math.random() * items.length)];
                reward.type = 'item';
            }
        }
        
        // Show result
        const resultDiv = document.getElementById('crate-result');
        resultDiv.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 1rem;">${reward.icon}</div>
            <h4>${reward.name}</h4>
            <p>${reward.ph ? `${reward.ph} PH` : ''} ${reward.rarity ? reward.rarity.toUpperCase() : ''}</p>
        `;
        resultDiv.classList.remove('hidden');
        resultDiv.classList.add('show');
        
        // Save reward
        if (reward.type === 'cekip') {
            await db.collection('users').doc(currentUser.uid).update({
                cekip: userData.cekip + reward.amount
            });
        } else {
            await db.collection('users').doc(currentUser.uid).update({
                items: firebase.firestore.FieldValue.arrayUnion({
                    ...reward,
                    acquiredAt: Date.now()
                })
            });
        }
        
        loadInventory();
    }, 2000);
}

// Inventory
function loadInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    
    const counts = { starter: 0, epic: 0, legendary: 0 };
    
    userData.items?.forEach(item => {
        counts[item.rarity]++;
        
        const card = document.createElement('div');
        card.className = `item-card ${item.rarity}`;
        card.onclick = () => showItemDetails(item);
        card.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-ph">${item.ph} PH</div>
        `;
        grid.appendChild(card);
    });
    
    document.getElementById('total-items').textContent = userData.items?.length || 0;
    document.getElementById('legendary-count').textContent = counts.legendary;
}

function showItemDetails(item) {
    const modal = document.getElementById('item-modal');
    const details = document.getElementById('item-details');
    
    details.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">${item.icon}</div>
            <h4>${item.name}</h4>
            <p style="color: var(--accent-neon); font-size: 1.2rem; margin: 1rem 0;">${item.ph} PH</p>
            <p style="color: var(--text-secondary); text-transform: uppercase;">${item.rarity}</p>
            <button onclick="closeModal()" class="btn-primary" style="margin-top: 1rem;">Kapat</button>
        </div>
    `;
    
    document.getElementById('modal-overlay').classList.remove('hidden');
    modal.classList.remove('hidden');
}

// Leaderboard
async function loadLeaderboard(filter = 'all') {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '<div style="text-align: center; padding: 2rem;">Yükleniyor...</div>';
    
    let query = db.collection('users')
        .orderBy('items', 'desc')
        .limit(100);
    
    const snapshot = await query.get();
    let rank = 1;
    
    list.innerHTML = '';
    
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.isBanned) return;
        
        // Calculate PH
        let maxMultiplier = 1;
        data.miners?.forEach(miner => {
            if (miner.energy > 0) {
                maxMultiplier = Math.max(maxMultiplier, MINERS[miner.type].multiplier);
            }
        });
        let itemsPH = data.items?.reduce((sum, item) => sum + (item.ph || 0), 0) || 0;
        let totalPH = Math.floor(itemsPH * maxMultiplier);
        
        // Filter by league
        let league = 'cirak';
        if (totalPH >= 10001) league = 'usta';
        else if (totalPH >= 1001) league = 'amatör';
        
        if (filter !== 'all' && league !== filter) return;
        
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        let rankClass = '';
        if (rank === 1) rankClass = 'top1';
        else if (rank === 2) rankClass = 'top2';
        else if (rank === 3) rankClass = 'top3';
        
        item.innerHTML = `
            <div class="leaderboard-rank ${rankClass}">#${rank}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">@${data.username}</div>
                <div class="leaderboard-ph">${totalPH.toLocaleString()} PH</div>
            </div>
            <div class="leaderboard-league league-${league}">${LEAGUES[league].name}</div>
        `;
        
        list.appendChild(item);
        rank++;
    });
}

function filterLeaderboard(league) {
    document.querySelectorAll('.league-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    loadLeaderboard(league);
}

// Finance
function switchFinanceTab(tab) {
    document.querySelectorAll('.finance-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.finance-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`finance-${tab}`).classList.add('active');
}

async function loadFinance() {
    // Load deposit history
    const depositList = document.getElementById('deposit-history');
    const deposits = await db.collection('deposit_requests')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
    
    depositList.innerHTML = '';
    deposits.forEach(doc => {
        const data = doc.data();
        const item = document.createElement('div');
        item.className = `history-item ${data.status}`;
        item.innerHTML = `
            <div>
                <strong>${data.amount} Çekip</strong>
                <small style="display: block; color: var(--text-secondary);">
                    ${data.createdAt?.toDate().toLocaleDateString() || ''}
                </small>
            </div>
            <span style="text-transform: uppercase; font-size: 0.8rem;">${data.status}</span>
        `;
        depositList.appendChild(item);
    });
    
    // Load withdraw history
    const withdrawList = document.getElementById('withdraw-history');
    const withdraws = await db.collection('withdraw_requests')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
    
    withdrawList.innerHTML = '';
    withdraws.forEach(doc => {
        const data = doc.data();
        const item = document.createElement('div');
        item.className = `history-item ${data.status}`;
        item.innerHTML = `
            <div>
                <strong>${data.amount} Çekip</strong>
                <small style="display: block; color: var(--text-secondary);">
                    ${data.createdAt?.toDate().toLocaleDateString() || ''}
                </small>
            </div>
            <span style="text-transform: uppercase; font-size: 0.8rem;">${data.status}</span>
        `;
        withdrawList.appendChild(item);
    });
}

async function submitDeposit(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const receipt = document.getElementById('deposit-receipt').value;
    
    if (amount <= 0) {
        alert('Geçerli miktar girin!');
        return;
    }
    
    await db.collection('deposit_requests').add({
        userId: currentUser.uid,
        username: userData.username,
        amount: amount,
        receiptUrl: receipt,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    alert('Yatırma talebi gönderildi!');
    document.getElementById('deposit-amount').value = '';
    document.getElementById('deposit-receipt').value = '';
    loadFinance();
}

async function submitWithdraw(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const iban = document.getElementById('withdraw-iban').value;
    const name = document.getElementById('withdraw-name').value;
    
    if (amount <= 0) {
        alert('Geçerli miktar girin!');
        return;
    }
    
    if (userData.cekip < amount) {
        alert('Yetersiz bakiye!');
        return;
    }
    
    // Deduct balance immediately (will be refunded if rejected)
    await db.collection('users').doc(currentUser.uid).update({
        cekip: userData.cekip - amount
    });
    
    await db.collection('withdraw_requests').add({
        userId: currentUser.uid,
        username: userData.username,
        amount: amount,
        iban: iban,
        fullName: name,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    alert('Çekim talebi gönderildi!');
    document.getElementById('withdraw-amount').value = '';
    document.getElementById('withdraw-iban').value = '';
    document.getElementById('withdraw-name').value = '';
    loadFinance();
}

// Admin Panel
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`admin-${tab}`).classList.add('active');
    
    if (tab === 'users') loadAdminUsers();
    if (tab === 'deposits') loadAdminDeposits();
    if (tab === 'withdraws') loadAdminWithdraws();
    if (tab === 'items') loadAdminItems();
}

async function loadAdminUsers() {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = 'Yükleniyor...';
    
    const snapshot = await db.collection('users').limit(50).get();
    list.innerHTML = '';
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div>
                <strong>@${data.username}</strong>
                <small style="display: block; color: var(--text-secondary);">
                    ${data.email} | ${data.isBanned ? 'BANLI' : 'Aktif'}
                </small>
            </div>
            <button class="btn-small btn-ban" onclick="manageUser('${doc.id}')">Yönet</button>
        `;
        list.appendChild(item);
    });
}

function searchUsers() {
    const term = document.getElementById('user-search').value.toLowerCase();
    document.querySelectorAll('.admin-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(term) ? 'flex' : 'none';
    });
}

function manageUser(userId) {
    db.collection('users').doc(userId).get().then(doc => {
        const data = doc.data();
        const modal = document.getElementById('admin-user-modal');
        const details = document.getElementById('admin-user-details');
        
        details.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <p><strong>Kullanıcı:</strong> @${data.username}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Bakiye:</strong> ${data.kmr.toLocaleString()} KMR | ${data.banknote} Banknot | ${data.cekip} Çekip</p>
                <p><strong>Durum:</strong> ${data.isBanned ? 'BANLI' : 'Aktif'}</p>
            </div>
            <div style="display: grid; gap: 0.5rem;">
                <input type="number" id="admin-add-kmr" placeholder="KMR Ekle/Çıkar">
                <input type="number" id="admin-add-banknote" placeholder="Banknot Ekle/Çıkar">
                <input type="number" id="admin-add-cekip" placeholder="Çekip Ekle/Çıkar" step="0.01">
                <button class="btn-primary" onclick="updateUserBalance('${userId}')">Bakiye Güncelle</button>
                <button class="btn-small ${data.isBanned ? 'btn-approve' : 'btn-ban'}" 
                    onclick="toggleBan('${userId}', ${!data.isBanned})">
                    ${data.isBanned ? 'Banı Kaldır' : 'Banla'}
                </button>
            </div>
        `;
        
        document.getElementById('modal-overlay').classList.remove('hidden');
        modal.classList.remove('hidden');
    });
}

async function updateUserBalance(userId) {
    const kmr = parseInt(document.getElementById('admin-add-kmr').value) || 0;
    const banknote = parseInt(document.getElementById('admin-add-banknote').value) || 0;
    const cekip = parseFloat(document.getElementById('admin-add-cekip').value) || 0;
    
    const updates = {};
    if (kmr !== 0) updates.kmr = firebase.firestore.FieldValue.increment(kmr);
    if (banknote !== 0) updates.banknote = firebase.firestore.FieldValue.increment(banknote);
    if (cekip !== 0) updates.cekip = firebase.firestore.FieldValue.increment(cekip);
    
    await db.collection('users').doc(userId).update(updates);
    alert('Bakiye güncellendi!');
    closeModal();
    loadAdminUsers();
}

async function toggleBan(userId, ban) {
    await db.collection('users').doc(userId).update({ isBanned: ban });
    alert(ban ? 'Kullanıcı banlandı!' : 'Ban kaldırıldı!');
    closeModal();
    loadAdminUsers();
}

async function loadAdminDeposits() {
    const list = document.getElementById('admin-deposits-list');
    list.innerHTML = 'Yükleniyor...';
    
    const snapshot = await db.collection('deposit_requests')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();
    
    list.innerHTML = '';
    snapshot.forEach(doc => {
        const data = doc.data();
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div>
                <strong>@${data.username}</strong>
                <small style="display: block;">
                    ${data.amount} Çekip | 
                    <a href="${data.receiptUrl}" target="_blank">Dekontu Gör</a>
                </small>
            </div>
            <div class="admin-actions">
                <button class="btn-small btn-approve" onclick="processDeposit('${doc.id}', true)">Onayla</button>
                <button class="btn-small btn-reject" onclick="processDeposit('${doc.id}', false)">Reddet</button>
            </div>
        `;
        list.appendChild(item);
    });
}

async function processDeposit(docId, approve) {
    const ref = db.collection('deposit_requests').doc(docId);
    const doc = await ref.get();
    const data = doc.data();
    
    if (approve) {
        // Add cekip to user
        await db.collection('users').doc(data.userId).update({
            cekip: firebase.firestore.FieldValue.increment(data.amount)
        });
    }
    
    await ref.update({ status: approve ? 'approved' : 'rejected' });
    alert(approve ? 'Onaylandı!' : 'Reddedildi!');
    loadAdminDeposits();
}

async function loadAdminWithdraws() {
    const list = document.getElementById('admin-withdraws-list');
    list.innerHTML = 'Yükleniyor...';
    
    const snapshot = await db.collection('withdraw_requests')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();
    
    list.innerHTML = '';
    snapshot.forEach(doc => {
        const data = doc.data();
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div>
                <strong>@${data.username}</strong>
                <small style="display: block;">
                    ${data.amount} Çekip | ${data.fullName} | ${data.iban}
                </small>
            </div>
            <div class="admin-actions">
                <button class="btn-small btn-approve" onclick="processWithdraw('${doc.id}', true)">Onayla</button>
                <button class="btn-small btn-reject" onclick="processWithdraw('${doc.id}', false)">Reddet</button>
            </div>
        `;
        list.appendChild(item);
    });
}

async function processWithdraw(docId, approve) {
    const ref = db.collection('withdraw_requests').doc(docId);
    const doc = await ref.get();
    const data = doc.data();
    
    if (!approve) {
        // Refund cekip
        await db.collection('users').doc(data.userId).update({
            cekip: firebase.firestore.FieldValue.increment(data.amount)
        });
    }
    
    await ref.update({ status: approve ? 'approved' : 'rejected' });
    alert(approve ? 'Onaylandı!' : 'Reddedildi ve iade edildi!');
    loadAdminWithdraws();
}

async function loadAdminItems() {
    const list = document.getElementById('admin-items-list');
    list.innerHTML = '';
    
    ITEMS_POOL.forEach(item => {
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `
            <div>
                <span style="font-size: 1.5rem; margin-right: 0.5rem;">${item.icon}</span>
                <strong>${item.name}</strong>
                <small style="margin-left: 1rem;">${item.ph} PH | ${item.rarity}</small>
            </div>
        `;
        list.appendChild(div);
    });
}

function showAddItemModal() {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('add-item-modal').classList.remove('hidden');
}

async function addNewItem(e) {
    e.preventDefault();
    
    const name = document.getElementById('new-item-name').value;
    const rarity = document.getElementById('new-item-rarity').value;
    const ph = parseInt(document.getElementById('new-item-ph').value);
    const image = document.getElementById('new-item-image').value || '⛏️';
    
    // Add to local pool (in production, save to Firestore)
    ITEMS_POOL.push({
        id: 'custom_' + Date.now(),
        name,
        rarity,
        ph,
        icon: image
    });
    
    alert('Eşya eklendi!');
    closeModal();
    loadAdminItems();
}

// Modal Functions
function closeModal() {
    document.querySelectorAll('.modal-overlay, .modal').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.crate-result').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('show');
    });
}

// Utility
function convertKMRToBanknote() {
    const kmr = Math.floor(userData.kmr / 1000) * 1000;
    if (kmr < 1000) {
        alert('En az 1000 KMR gerekli!');
        return;
    }
    
    db.collection('users').doc(currentUser.uid).update({
        kmr: userData.kmr - kmr,
        banknote: userData.banknote + (kmr / 1000)
    });
}

function convertBanknoteToCekip() {
    if (userData.banknote < 1000) {
        alert('En az 1000 Banknot gerekli!');
        return;
    }
    
    db.collection('users').doc(currentUser.uid).update({
        banknote: userData.banknote - 1000,
        cekip: userData.cekip + 1
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (!user) {
            // Show auth screen
            document.getElementById('auth-screen').classList.add('active');
        }
    });
});
