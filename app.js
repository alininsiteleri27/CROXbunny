// ReisZas - Mining Empire Game Logic
// Firebase Configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Game State
let currentUser = null;
let userData = null;
let gameState = {
    miners: {
        kubra: { production: 20, interval: 20, unlocked: true, lastCollected: Date.now() },
        ali: { production: 50, interval: 20, unlocked: false, price: 5000 },
        beyza: { production: 200, interval: 20, unlocked: false, price: 20000 }
    },
    shopItems: [],
    leagueData: [],
    soundEnabled: true
};

// Audio Context for Sound Effects
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// Sound Effects
const sounds = {
    collect: () => playTone(800, 0.1, 'sine'),
    success: () => {
        playTone(523.25, 0.1, 'sine');
        setTimeout(() => playTone(659.25, 0.1, 'sine'), 100);
        setTimeout(() => playTone(783.99, 0.2, 'sine'), 200);
    },
    error: () => {
        playTone(200, 0.3, 'sawtooth');
    },
    click: () => playTone(400, 0.05, 'sine')
};

function playTone(freq, duration, type = 'sine') {
    if (!gameState.soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Utility Functions
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.success}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}g ${hours % 24}s`;
    if (hours > 0) return `${hours}s ${minutes % 60}d`;
    if (minutes > 0) return `${minutes}d ${seconds % 60}s`;
    return `${seconds}s`;
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const screen = document.getElementById(screenId);
    screen.style.display = 'block';
    setTimeout(() => screen.classList.add('active'), 10);
}

// Auth Functions
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
    sounds.click();
}

// Register
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPass = document.getElementById('register-password-confirm').value;
    
    if (password !== confirmPass) {
        showToast('Şifreler eşleşmiyor!', 'error');
        return;
    }
    
    if (username.length < 3) {
        showToast('Kullanıcı adı en az 3 karakter olmalı!', 'error');
        return;
    }
    
    try {
        // Check if username exists
        const usernameSnapshot = await database.ref('usernames/' + username.toLowerCase()).once('value');
        if (usernameSnapshot.exists()) {
            showToast('Bu kullanıcı adı zaten alınmış!', 'error');
            return;
        }
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user data
        const userData = {
            username: username,
            email: email,
            balance: 0,
            gold: 0,
            power: 0,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            miners: {
                kubra: { unlocked: true, lastCollected: Date.now(), level: 1 },
                ali: { unlocked: false, lastCollected: null, level: 0 },
                beyza: { unlocked: false, lastCollected: null, level: 0 }
            },
            inventory: {},
            stats: {
                totalMined: 0,
                totalWithdrawn: 0,
                totalDeposited: 0
            }
        };
        
        await database.ref('users/' + user.uid).set(userData);
        await database.ref('usernames/' + username.toLowerCase()).set(user.uid);
        
        showToast('Hesabınız oluşturuldu! Hoş geldiniz...', 'success');
        sounds.success();
        
    } catch (error) {
        showToast('Kayıt hatası: ' + error.message, 'error');
        sounds.error();
    }
});

// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Giriş başarılı!', 'success');
        sounds.success();
    } catch (error) {
        showToast('Giriş hatası: ' + error.message, 'error');
        sounds.error();
    }
});

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData();
        showScreen('main-app');
        initGame();
        startOfflineProduction();
    } else {
        currentUser = null;
        userData = null;
        showScreen('auth-screen');
    }
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
    }, 1000);
});

// Load User Data
async function loadUserData() {
    if (!currentUser) return;
    
    const snapshot = await database.ref('users/' + currentUser.uid).once('value');
    userData = snapshot.val();
    
    // Update UI
    updateUserUI();
}

function updateUserUI() {
    if (!userData) return;
    
    document.getElementById('user-name').textContent = userData.username;
    document.getElementById('user-power').innerHTML = `<i class="fas fa-bolt"></i> ${userData.power || 0} PH`;
    document.getElementById('banknote-balance').textContent = formatNumber(userData.balance || 0);
    document.getElementById('gold-balance').textContent = formatNumber(userData.gold || 0);
    
    // Update miners UI
    updateMinersUI();
}

// Game Logic
function initGame() {
    updateMinersUI();
    loadShopItems();
    startProductionTimer();
    updateStats();
    
    // Check auto-collect setting
    if (document.getElementById('auto-collect')?.checked) {
        setTimeout(collectAll, 1000);
    }
}

function updateMinersUI() {
    if (!userData || !userData.miners) return;
    
    // Kübra (Always unlocked initially)
    const kubraCard = document.getElementById('miner-kubra');
    if (userData.miners.kubra?.unlocked) {
        kubraCard.classList.remove('locked');
        kubraCard.classList.add('active');
    }
    
    // Ali
    const aliCard = document.getElementById('miner-ali');
    if (userData.miners.ali?.unlocked) {
        aliCard.classList.remove('locked');
        aliCard.classList.add('active');
        aliCard.querySelector('.lock-overlay').style.display = 'none';
    }
    
    // Beyza
    const beyzaCard = document.getElementById('miner-beyza');
    if (userData.miners.beyza?.unlocked) {
        beyzaCard.classList.remove('locked');
        beyzaCard.classList.add('active');
        beyzaCard.querySelector('.lock-overlay').style.display = 'none';
    }
    
    // Update stats
    let activeMiners = 0;
    let hourlyProduction = 0;
    
    if (userData.miners.kubra?.unlocked) {
        activeMiners++;
        hourlyProduction += 60; // 20 per 20 mins = 60 per hour
    }
    if (userData.miners.ali?.unlocked) {
        activeMiners++;
        hourlyProduction += 150;
    }
    if (userData.miners.beyza?.unlocked) {
        activeMiners++;
        hourlyProduction += 600;
    }
    
    document.getElementById('active-miners').textContent = activeMiners;
    document.getElementById('hourly-production').textContent = hourlyProduction;
    document.getElementById('daily-production').textContent = hourlyProduction * 24;
}

// Offline Production Calculation
function startOfflineProduction() {
    if (!userData || !userData.miners) return;
    
    const now = Date.now();
    let totalProduced = 0;
    
    Object.keys(userData.miners).forEach(minerKey => {
        const miner = userData.miners[minerKey];
        if (miner.unlocked && miner.lastCollected) {
            const elapsed = now - miner.lastCollected;
            const intervals = Math.floor(elapsed / (20 * 60 * 1000)); // 20 minutes
            const production = gameState.miners[minerKey].production * intervals;
            
            if (production > 0) {
                totalProduced += production;
                // Update last collected to now minus remainder
                miner.lastCollected = now - (elapsed % (20 * 60 * 1000));
            }
        }
    });
    
    if (totalProduced > 0) {
        userData.balance += totalProduced;
        database.ref('users/' + currentUser.uid + '/balance').set(userData.balance);
        
        // Update last collected times
        Object.keys(userData.miners).forEach(minerKey => {
            if (userData.miners[minerKey].unlocked) {
                database.ref(`users/${currentUser.uid}/miners/${minerKey}/lastCollected`).set(userData.miners[minerKey].lastCollected);
            }
        });
        
        showToast(`Offline süresince ${formatNumber(totalProduced)} banknot üretildi!`, 'success');
        updateUserUI();
    }
}

// Production Timer
function startProductionTimer() {
    setInterval(() => {
        if (!userData) return;
        
        const now = Date.now();
        Object.keys(userData.miners).forEach(minerKey => {
            const miner = userData.miners[minerKey];
            if (miner.unlocked && miner.lastCollected) {
                const elapsed = now - miner.lastCollected;
                const progress = Math.min((elapsed / (20 * 60 * 1000)) * 100, 100);
                
                const progressBar = document.getElementById(`progress-${minerKey}`);
                if (progressBar) {
                    progressBar.style.width = progress + '%';
                }
                
                // Enable collect button if any miner has production ready
                if (progress >= 100) {
                    document.getElementById('collect-btn')?.classList.add('pulse');
                }
            }
        });
    }, 1000);
}

// Collect All
async function collectAll() {
    if (!userData) return;
    
    const now = Date.now();
    let totalCollected = 0;
    let updates = {};
    
    Object.keys(userData.miners).forEach(minerKey => {
        const miner = userData.miners[minerKey];
        if (miner.unlocked && miner.lastCollected) {
            const elapsed = now - miner.lastCollected;
            const intervals = Math.floor(elapsed / (20 * 60 * 1000));
            
            if (intervals > 0) {
                const amount = gameState.miners[minerKey].production * intervals;
                totalCollected += amount;
                updates[`miners/${minerKey}/lastCollected`] = now;
            }
        }
    });
    
    if (totalCollected > 0) {
        const newBalance = userData.balance + totalCollected;
        updates['balance'] = newBalance;
        updates['stats/totalMined'] = (userData.stats?.totalMined || 0) + totalCollected;
        
        await database.ref('users/' + currentUser.uid).update(updates);
        userData.balance = newBalance;
        
        // Animation effect
        const btn = document.getElementById('collect-btn');
        btn.classList.remove('pulse');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = 'scale(1)', 100);
        
        sounds.collect();
        showToast(`+${formatNumber(totalCollected)} Banknot toplandı!`, 'success');
        updateUserUI();
        
        // Create floating text effect
        createFloatingText(`+${formatNumber(totalCollected)}`, btn);
    } else {
        showToast('Henüz toplanacak banknot yok!', 'warning');
    }
}

function createFloatingText(text, element) {
    const rect = element.getBoundingClientRect();
    const floating = document.createElement('div');
    floating.textContent = text;
    floating.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width/2}px;
        top: ${rect.top}px;
        color: #00d084;
        font-weight: 700;
        font-size: 1.2rem;
        pointer-events: none;
        z-index: 9999;
        animation: floatUp 1s ease-out forwards;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatUp {
            to {
                transform: translateY(-50px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(floating);
    
    setTimeout(() => floating.remove(), 1000);
}

// Unlock Miner
async function unlockMiner(minerType, price) {
    if (!userData) return;
    
    if (userData.balance < price) {
        showToast('Yetersiz bakiye!', 'error');
        sounds.error();
        return;
    }
    
    try {
        const updates = {
            balance: userData.balance - price,
            [`miners/${minerType}/unlocked`]: true,
            [`miners/${minerType}/lastCollected`]: Date.now()
        };
        
        await database.ref('users/' + currentUser.uid).update(updates);
        userData.balance -= price;
        userData.miners[minerType].unlocked = true;
        userData.miners[minerType].lastCollected = Date.now();
        
        sounds.success();
        showToast(`${minerType.charAt(0).toUpperCase() + minerType.slice(1)} başarıyla satın alındı!`, 'success');
        updateMinersUI();
        updateUserUI();
    } catch (error) {
        showToast('Satın alma hatası!', 'error');
    }
}

// Shop Functions
async function loadShopItems() {
    // Generate daily shop items
    const items = [
        { id: 1, name: 'Bronz Kazma', power: 5, price: 500, icon: 'fa-hammer', type: 'weapon' },
        { id: 2, name: 'Gümüş Kazma', power: 15, price: 1500, icon: 'fa-hammer', type: 'weapon' },
        { id: 3, name: 'Altın Kazma', power: 50, price: 5000, icon: 'fa-hammer', type: 'weapon' },
        { id: 4, name: 'Elmas Kazma', power: 150, price: 15000, icon: 'fa-gem', type: 'weapon' },
        { id: 5, name: 'Bronz Kask', power: 3, price: 300, icon: 'fa-hard-hat', type: 'armor' },
        { id: 6, name: 'Gümüş Kask', power: 10, price: 1000, icon: 'fa-hard-hat', type: 'armor' },
        { id: 7, name: 'Altın Kask', power: 30, price: 3000, icon: 'fa-hard-hat', type: 'armor' },
        { id: 8, name: 'Majestik Yüzük', power: 100, price: 10000, icon: 'fa-ring', type: 'accessory' }
    ];
    
    // Randomly select 4 items for daily shop
    const shuffled = items.sort(() => 0.5 - Math.random());
    gameState.shopItems = shuffled.slice(0, 4);
    
    renderShopItems();
    startShopTimer();
}

function renderShopItems() {
    const container = document.getElementById('shop-items');
    if (!container) return;
    
    container.innerHTML = gameState.shopItems.map(item => `
        <div class="item-card" onclick="buyItem(${item.id}, ${item.price}, ${item.power})">
            <div class="item-icon">
                <i class="fas ${item.icon}"></i>
            </div>
            <h3>${item.name}</h3>
            <div class="power-badge">
                <i class="fas fa-bolt"></i> +${item.power} PH
            </div>
            <div class="price">
                <i class="fas fa-money-bill-wave"></i> ${formatNumber(item.price)} BN
            </div>
            <button class="btn-buy">Satın Al</button>
        </div>
    `).join('');
}

function startShopTimer() {
    // Reset at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    let remaining = tomorrow - now;
    
    setInterval(() => {
        remaining -= 1000;
        if (remaining <= 0) {
            remaining = 24 * 60 * 60 * 1000;
            loadShopItems(); // Refresh items
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        const timerEl = document.getElementById('shop-countdown');
        if (timerEl) {
            timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

async function buyItem(itemId, price, power) {
    if (!userData) return;
    
    if (userData.balance < price) {
        showToast('Yetersiz bakiye!', 'error');
        sounds.error();
        return;
    }
    
    try {
        const newBalance = userData.balance - price;
        const newPower = (userData.power || 0) + power;
        
        // Add to inventory
        const inventory = userData.inventory || {};
        const item = gameState.shopItems.find(i => i.id === itemId);
        if (inventory[itemId]) {
            inventory[itemId].count++;
        } else {
            inventory[itemId] = { ...item, count: 1 };
        }
        
        await database.ref('users/' + currentUser.uid).update({
            balance: newBalance,
            power: newPower,
            inventory: inventory
        });
        
        userData.balance = newBalance;
        userData.power = newPower;
        userData.inventory = inventory;
        
        sounds.success();
        showToast(`${item.name} satın alındı! Güç +${power} PH`, 'success');
        updateUserUI();
    } catch (error) {
        showToast('Satın alma hatası!', 'error');
    }
}

// Chest System
async function buyChest(type, price) {
    if (!userData) return;
    
    if (userData.balance < price) {
        showToast('Yetersiz bakiye!', 'error');
        sounds.error();
        return;
    }
    
    // Deduct balance
    const newBalance = userData.balance - price;
    await database.ref('users/' + currentUser.uid + '/balance').set(newBalance);
    userData.balance = newBalance;
    updateUserUI();
    
    // Show animation
    const modal = document.getElementById('chest-modal');
    const animation = document.getElementById('chest-animation');
    const result = document.getElementById('chest-result');
    
    modal.classList.add('active');
    animation.style.display = 'block';
    result.style.display = 'none';
    
    sounds.click();
    
    // Calculate reward after delay
    setTimeout(async () => {
        animation.style.display = 'none';
        result.style.display = 'block';
        
        let rewardBN, rewardItem;
        const rand = Math.random();
        
        switch(type) {
            case 'bronze':
                rewardBN = Math.floor(Math.random() * 40) + 10; // 10-50
                if (rand < 0.1) rewardItem = { name: 'Eski Kazma', power: 2 };
                break;
            case 'silver':
                rewardBN = Math.floor(Math.random() * 150) + 50; // 50-200
                if (rand < 0.3) rewardItem = { name: 'Gümüş Bilezik', power: 5 };
                break;
            case 'gold':
                rewardBN = Math.floor(Math.random() * 300) + 200; // 200-500
                if (rand < 0.5) rewardItem = { name: 'Altın Kolye', power: 10 };
                break;
        }
        
        // Add rewards
        const finalBalance = userData.balance + rewardBN;
        const updates = { balance: finalBalance };
        
        let rewardHTML = `<div class="reward-item"><i class="fas fa-money-bill-wave" style="color: #00d084;"></i></div>
                         <div class="reward-amount">+${rewardBN} Banknot</div>`;
        
        if (rewardItem) {
            const newPower = (userData.power || 0) + rewardItem.power;
            updates.power = newPower;
            rewardHTML += `<div style="margin-top: 10px; color: #FFD700;"><i class="fas fa-gift"></i> ${rewardItem.name} (+${rewardItem.power} PH)</div>`;
        }
        
        await database.ref('users/' + currentUser.uid).update(updates);
        userData.balance = finalBalance;
        if (rewardItem) userData.power = updates.power;
        
        document.getElementById('reward-display').innerHTML = rewardHTML;
        sounds.success();
        updateUserUI();
        
    }, 2000);
}

// Convert BN to Gold
function showConvertModal() {
    document.getElementById('convert-modal').classList.add('active');
    sounds.click();
}

function calculateConvert() {
    const amount = parseInt(document.getElementById('convert-amount').value) || 0;
    const gold = Math.floor(amount / 1000);
    document.getElementById('convert-gold-result').textContent = gold + ' Altın';
}

async function convertToGold() {
    const amount = parseInt(document.getElementById('convert-amount').value);
    
    if (!amount || amount < 1000) {
        showToast('Minimum 1000 Banknot girmelisiniz!', 'error');
        return;
    }
    
    if (amount > userData.balance) {
        showToast('Yetersiz bakiye!', 'error');
        return;
    }
    
    const goldAmount = Math.floor(amount / 1000);
    
    try {
        await database.ref('users/' + currentUser.uid).update({
            balance: userData.balance - amount,
            gold: (userData.gold || 0) + goldAmount
        });
        
        userData.balance -= amount;
        userData.gold = (userData.gold || 0) + goldAmount;
        
        sounds.success();
        showToast(`${goldAmount} Altın başarıyla çevrildi!`, 'success');
        closeModal('convert-modal');
        updateUserUI();
    } catch (error) {
        showToast('Çevrim hatası!', 'error');
    }
}

// Finance Functions
function switchFinanceTab(tab) {
    document.querySelectorAll('.fin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.finance-panel').forEach(p => p.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tab}-panel`).classList.add('active');
    sounds.click();
    
    if (tab === 'history') loadTransactionHistory();
}

function calculateDeposit() {
    const tl = parseFloat(document.getElementById('deposit-amount').value) || 0;
    const bn = tl * 1000;
    document.getElementById('deposit-result').textContent = formatNumber(bn) + ' Banknot';
}

function calculateWithdraw() {
    const bn = parseInt(document.getElementById('withdraw-amount').value) || 0;
    const gold = Math.floor(bn / 1000);
    const tl = (gold * 1000) / 1000; // 1000 BN = 1 Gold = 1 TL (simplified)
    
    document.getElementById('withdraw-bn').textContent = formatNumber(bn) + ' BN';
    document.getElementById('withdraw-gold').textContent = gold + ' Altın';
    document.getElementById('withdraw-tl').textContent = tl + ' TL';
}

async function createDeposit() {
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    
    if (!amount || amount < 10) {
        showToast('Minimum 10 TL yatırabilirsiniz!', 'error');
        return;
    }
    
    try {
        const depositRef = database.ref('deposits').push();
        await depositRef.set({
            userId: currentUser.uid,
            username: userData.username,
            amount: amount,
            banknotAmount: amount * 1000,
            status: 'pending',
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        sounds.success();
        showToast('Yatırma talebiniz alındı! Admin onayı bekleniyor.', 'success');
        document.getElementById('deposit-amount').value = '';
        document.getElementById('deposit-result').textContent = '0 Banknot';
    } catch (error) {
        showToast('Talep oluşturulamadı!', 'error');
    }
}

async function createWithdrawal() {
    const bn = parseInt(document.getElementById('withdraw-amount').value);
    
    if (!bn || bn < 10000) {
        showToast('Minimum 10000 Banknot çekebilirsiniz!', 'error');
        return;
    }
    
    if (bn > userData.balance) {
        showToast('Yetersiz bakiye!', 'error');
        return;
    }
    
    const goldNeeded = Math.ceil(bn / 1000);
    if (goldNeeded > (userData.gold || 0)) {
        showToast('Yetersiz altın! Önce banknotlarınızı altına çevirin.', 'error');
        return;
    }
    
    try {
        // Deduct balance and gold
        await database.ref('users/' + currentUser.uid).update({
            balance: userData.balance - bn,
            gold: userData.gold - goldNeeded
        });
        
        const withdrawRef = database.ref('withdrawals').push();
        await withdrawRef.set({
            userId: currentUser.uid,
            username: userData.username,
            amount: bn,
            goldAmount: goldNeeded,
            tlValue: (bn / 10000) * 10, // 10000 BN = 10 TL
            status: 'pending',
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        userData.balance -= bn;
        userData.gold -= goldNeeded;
        
        sounds.success();
        showToast('Çekim talebiniz alındı! İşlem 24 saat içinde tamamlanacak.', 'success');
        document.getElementById('withdraw-amount').value = '';
        calculateWithdraw();
        updateUserUI();
    } catch (error) {
        showToast('Çekim hatası!', 'error');
    }
}

async function loadTransactionHistory() {
    const container = document.getElementById('transaction-history');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Yükleniyor...</div>';
    
    try {
        // Load deposits
        const depositsSnapshot = await database.ref('deposits')
            .orderByChild('userId')
            .equalTo(currentUser.uid)
            .limitToLast(10)
            .once('value');
            
        // Load withdrawals
        const withdrawalsSnapshot = await database.ref('withdrawals')
            .orderByChild('userId')
            .equalTo(currentUser.uid)
            .limitToLast(10)
            .once('value');
        
        let transactions = [];
        
        depositsSnapshot.forEach(child => {
            const data = child.val();
            transactions.push({
                type: 'deposit',
                amount: data.amount,
                currency: 'TL',
                status: data.status,
                date: new Date(data.createdAt).toLocaleDateString('tr-TR')
            });
        });
        
        withdrawalsSnapshot.forEach(child => {
            const data = child.val();
            transactions.push({
                type: 'withdraw',
                amount: data.amount,
                currency: 'BN',
                status: data.status,
                date: new Date(data.createdAt).toLocaleDateString('tr-TR')
            });
        });
        
        // Sort by date descending
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (transactions.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Henüz işlem bulunmuyor.</div>';
            return;
        }
        
        container.innerHTML = transactions.map(t => `
            <div class="history-item ${t.type}">
                <div class="history-info">
                    <h4>${t.type === 'deposit' ? 'Para Yatırma' : 'Para Çekme'}</h4>
                    <span>${t.date}</span>
                </div>
                <div class="history-amount">
                    <div class="amount">${t.type === 'deposit' ? '+' : '-'}${t.amount} ${t.currency}</div>
                    <span class="status ${t.status}">${t.status === 'pending' ? 'Bekliyor' : t.status === 'completed' ? 'Tamamlandı' : 'Reddedildi'}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = '<div style="text-align: center; color: var(--danger-color);">Yükleme hatası!</div>';
    }
}

// Support System
function showNewTicketModal() {
    document.getElementById('ticket-modal').classList.add('active');
    sounds.click();
}

async function submitTicket() {
    const title = document.getElementById('ticket-title').value.trim();
    const message = document.getElementById('ticket-message').value.trim();
    
    if (!title || !message) {
        showToast('Lütfen tüm alanları doldurun!', 'error');
        return;
    }
    
    try {
        const ticketRef = database.ref('tickets').push();
        await ticketRef.set({
            userId: currentUser.uid,
            username: userData.username,
            title: title,
            message: message,
            status: 'open',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            replies: {}
        });
        
        sounds.success();
        showToast('Destek talebiniz oluşturuldu!', 'success');
        closeModal('ticket-modal');
        document.getElementById('ticket-title').value = '';
        document.getElementById('ticket-message').value = '';
        loadTickets();
    } catch (error) {
        showToast('Talep gönderilemedi!', 'error');
    }
}

async function loadTickets() {
    const container = document.getElementById('ticket-list');
    if (!container) return;
    
    try {
        const snapshot = await database.ref('tickets')
            .orderByChild('userId')
            .equalTo(currentUser.uid)
            .once('value');
            
        if (!snapshot.exists()) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Henüz destek talebiniz bulunmuyor.</div>';
            return;
        }
        
        let tickets = [];
        snapshot.forEach(child => {
            tickets.push({ id: child.key, ...child.val() });
        });
        
        tickets.sort((a, b) => b.createdAt - a.createdAt);
        
        container.innerHTML = tickets.map(t => `
            <div class="ticket-item" onclick="viewTicket('${t.id}')">
                <div class="ticket-header">
                    <span class="ticket-title">${t.title}</span>
                    <span class="ticket-status ${t.status}">${t.status === 'open' ? 'Açık' : 'Kapalı'}</span>
                </div>
                <div class="ticket-preview">${t.message}</div>
                <div class="ticket-date">
                    <i class="far fa-clock"></i> ${new Date(t.createdAt).toLocaleDateString('tr-TR')}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = '<div style="text-align: center; color: var(--danger-color);">Yükleme hatası!</div>';
    }
}

// Leaderboard
let currentLeaderboard = 'power';

function switchLeaderboard(type) {
    currentLeaderboard = type;
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    sounds.click();
    loadLeaderboard();
}

async function loadLeaderboard() {
    const container = document.getElementById('leaderboard-content');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Yükleniyor...</div>';
    
    try {
        let query;
        if (currentLeaderboard === 'power') {
            query = database.ref('users').orderByChild('power').limitToLast(50);
        } else if (currentLeaderboard === 'rich') {
            query = database.ref('users').orderByChild('balance').limitToLast(50);
        } else {
            query = database.ref('users').orderByChild('stats/totalWithdrawn').limitToLast(50);
        }
        
        const snapshot = await query.once('value');
        let users = [];
        
        snapshot.forEach(child => {
            users.push({ id: child.key, ...child.val() });
        });
        
        // Sort descending
        if (currentLeaderboard === 'power') {
            users.sort((a, b) => (b.power || 0) - (a.power || 0));
        } else if (currentLeaderboard === 'rich') {
            users.sort((a, b) => (b.balance || 0) - (a.balance || 0));
        } else {
            users.sort((a, b) => ((b.stats?.totalWithdrawn || 0) - (a.stats?.totalWithdrawn || 0)));
        }
        
        // Take top 20
        users = users.slice(0, 20);
        
        container.innerHTML = users.map((u, index) => {
            let rankClass = '';
            if (index === 0) rankClass = 'gold';
            else if (index === 1) rankClass = 'silver';
            else if (index === 2) rankClass = 'bronze';
            
            let statValue;
            if (currentLeaderboard === 'power') statValue = (u.power || 0) + ' PH';
            else if (currentLeaderboard === 'rich') statValue = formatNumber(u.balance || 0) + ' BN';
            else statValue = formatNumber(u.stats?.totalWithdrawn || 0) + ' BN';
            
            return `
                <div class="leaderboard-item">
                    <div class="lb-rank ${rankClass}">${index + 1}</div>
                    <img src="${u.avatar || 'https://via.placeholder.com/50'}" alt="" class="lb-avatar">
                    <div class="lb-info">
                        <div class="lb-name">${u.username}</div>
                        <div class="lb-stat"><i class="fas ${currentLeaderboard === 'power' ? 'fa-bolt' : currentLeaderboard === 'rich' ? 'fa-wallet' : 'fa-trophy'}"></i> ${statValue}</div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        container.innerHTML = '<div style="text-align: center; color: var(--danger-color);">Yükleme hatası!</div>';
    }
}

function searchLeaderboard() {
    const term = document.getElementById('leaderboard-search').value.toLowerCase();
    const items = document.querySelectorAll('.leaderboard-item');
    
    items.forEach(item => {
        const name = item.querySelector('.lb-name').textContent.toLowerCase();
        item.style.display = name.includes(term) ? 'flex' : 'none';
    });
}

// League System
async function loadLeagueData() {
    if (!document.getElementById('league-section')?.classList.contains('active')) return;
    
    try {
        // Get top 50 users by power for today's league
        const snapshot = await database.ref('users')
            .orderByChild('power')
            .limitToLast(50)
            .once('value');
            
        let participants = [];
        snapshot.forEach(child => {
            const data = child.val();
            if (data.power > 0) {
                participants.push({
                    id: child.key,
                    username: data.username,
                    power: data.power,
                    avatar: data.avatar
                });
            }
        });
        
        participants.sort((a, b) => b.power - a.power);
        participants = participants.slice(0, 20); // Top 20
        
        // Calculate shares based on power
        const totalPower = participants.reduce((sum, p) => sum + p.power, 0);
        const dailyPool = 1000;
        
        participants.forEach(p => {
            p.share = Math.floor((p.power / totalPower) * dailyPool);
        });
        
        // Render
        const container = document.getElementById('league-table');
        const myRankEl = document.getElementById('my-rank');
        const myShareEl = document.getElementById('my-share');
        
        container.innerHTML = participants.map((p, index) => {
            let rankClass = '';
            if (index === 0) rankClass = 'gold';
            else if (index === 1) rankClass = 'silver';
            else if (index === 2) rankClass = 'bronze';
            
            const isMe = p.id === currentUser?.uid;
            
            return `
                <div class="league-item ${isMe ? 'current-user' : ''}">
                    <div class="rank ${rankClass}">${index + 1}</div>
                    <div class="league-user">
                        <img src="${p.avatar || 'https://via.placeholder.com/30'}" alt="">
                        <span>${p.username}</span>
                    </div>
                    <div class="league-power">${p.power} PH</div>
                    <div class="league-share">${p.share} BN</div>
                </div>
            `;
        }).join('');
        
        // Find my position
        const myIndex = participants.findIndex(p => p.id === currentUser?.uid);
        if (myIndex !== -1) {
            myRankEl.textContent = myIndex + 1;
            myShareEl.textContent = participants[myIndex].share + ' BN';
        } else {
            myRankEl.textContent = '50+';
            myShareEl.textContent = '0 BN';
        }
        
    } catch (error) {
        console.error('League load error:', error);
    }
}

// Navigation
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Show selected
    document.getElementById(`${section}-section`)?.classList.add('active');
    event.currentTarget?.classList.add('active');
    
    sounds.click();
    
    // Load specific data
    if (section === 'league') {
        loadLeagueData();
        startLeagueTimer();
    } else if (section === 'support') {
        loadTickets();
    } else if (section === 'leaderboard') {
        loadLeaderboard();
    }
}

function startLeagueTimer() {
    // Update every second
    const timerEl = document.getElementById('league-timer');
    if (!timerEl) return;
    
    const update = () => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timerEl.textContent = `Sıfırlanma: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    update();
    const interval = setInterval(() => {
        if (!document.getElementById('league-section')?.classList.contains('active')) {
            clearInterval(interval);
        } else {
            update();
        }
    }, 1000);
}

// Profile Functions
function showProfile() {
    if (!userData) return;
    
    document.getElementById('profile-username').value = userData.username;
    document.getElementById('profile-email').value = userData.email;
    document.getElementById('profile-date').value = new Date(userData.createdAt).toLocaleDateString('tr-TR');
    document.getElementById('profile-avatar-img').src = userData.avatar || 'https://via.placeholder.com/100';
    
    // Load inventory
    const invContainer = document.getElementById('user-inventory');
    if (userData.inventory && Object.keys(userData.inventory).length > 0) {
        invContainer.innerHTML = Object.values(userData.inventory).map(item => `
            <div class="inventory-item" title="${item.name}">
                <i class="fas ${item.icon}"></i>
                <span class="count">${item.count}</span>
            </div>
        `).join('');
    } else {
        invContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 20px;">Envanteriniz boş</div>';
    }
    
    document.getElementById('profile-modal').classList.add('active');
    sounds.click();
}

async function changeAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            showToast('Dosya boyutu 2MB\'dan küçük olmalı!', 'error');
            return;
        }
        
        try {
            const storageRef = storage.ref('avatars/' + currentUser.uid);
            await storageRef.put(file);
            const url = await storageRef.getDownloadURL();
            
            await database.ref('users/' + currentUser.uid + '/avatar').set(url);
            userData.avatar = url;
            
            document.getElementById('profile-avatar-img').src = url;
            document.getElementById('user-avatar').src = url;
            
            sounds.success();
            showToast('Profil fotoğrafı güncellendi!', 'success');
        } catch (error) {
            showToast('Yükleme hatası!', 'error');
        }
    };
    
    input.click();
}

async function changePassword() {
    const oldPass = document.getElementById('old-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-new-password').value;
    
    if (!oldPass || !newPass || !confirmPass) {
        showToast('Tüm alanları doldurun!', 'error');
        return;
    }
    
    if (newPass !== confirmPass) {
        showToast('Yeni şifreler eşleşmiyor!', 'error');
        return;
    }
    
    if (newPass.length < 6) {
        showToast('Şifre en az 6 karakter olmalı!', 'error');
        return;
    }
    
    try {
        const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            oldPass
        );
        
        await currentUser.reauthenticateWithCredential(credential);
        await currentUser.updatePassword(newPass);
        
        sounds.success();
        showToast('Şifre başarıyla değiştirildi!', 'success');
        
        document.getElementById('old-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-new-password').value = '';
    } catch (error) {
        showToast('Şifre değiştirme hatası: ' + error.message, 'error');
    }
}

// Settings
function showSettings() {
    document.getElementById('settings-modal').classList.add('active');
    sounds.click();
}

function toggleSound() {
    gameState.soundEnabled = document.getElementById('sound-toggle').checked;
    if (gameState.soundEnabled) sounds.click();
}

async function logout() {
    try {
        await auth.signOut();
        closeModal('settings-modal');
        showToast('Çıkış yapıldı', 'success');
    } catch (error) {
        showToast('Çıkış hatası!', 'error');
    }
}

// Modal Management
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Shop Tab Switching
function switchShopTab(tab) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.shop-grid').forEach(g => g.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`shop-${tab}`).classList.add('active');
    sounds.click();
}

// Admin Panel Toggle (Simple)
function toggleAdminPanel() {
    showToast('Admin paneli yakında aktif olacak!', 'warning');
}

// Stats Update
function updateStats() {
    if (!userData) return;
    
    // Update production stats
    let hourly = 0;
    if (userData.miners?.kubra?.unlocked) hourly += 60;
    if (userData.miners?.ali?.unlocked) hourly += 150;
    if (userData.miners?.beyza?.unlocked) hourly += 600;
    
    document.getElementById('hourly-production').textContent = hourly;
    document.getElementById('daily-production').textContent = hourly * 24;
}

// Initialize
window.addEventListener('load', () => {
    // Simulate loading
    setTimeout(() => {
        document.querySelector('.progress-fill').style.width = '100%';
    }, 500);
});

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Service Worker for offline support (basic)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript,').catch(() => {
        // Silent fail
    });
}
