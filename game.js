// Firebase Configuration - Kendi Firebase proje bilgilerinizi buraya ekleyin
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
const db = firebase.firestore();
const rtdb = firebase.database();

// Global Variables
let currentUser = null;
let isGuest = false;
let userData = {
    score: 0,
    level: 1,
    ammo: 10,
    totalShots: 0,
    hits: 0
};

// Auth Functions
function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
}

async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }

    if (password.length < 6) {
        alert('Şifre en az 6 karakter olmalıdır!');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Firestore'da kullanıcı verisi oluştur
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            score: 0,
            level: 1,
            totalShots: 0,
            hits: 0,
            money: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Realtime Database'de sıralama için
        await rtdb.ref('leaderboard/' + user.uid).set({
            name: name,
            score: 0,
            level: 1
        });

        alert('Kayıt başarılı!');
        login();
    } catch (error) {
        alert('Kayıt hatası: ' + error.message);
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Lütfen e-posta ve şifre girin!');
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert('Giriş hatası: ' + error.message);
    }
}

function playAsGuest() {
    isGuest = true;
    currentUser = { uid: 'guest', displayName: 'Misafir' };
    userData = { score: 0, level: 1, ammo: 10, totalShots: 0, hits: 0 };
    showMainMenu();
}

async function logout() {
    if (!isGuest) {
        await auth.signOut();
    }
    isGuest = false;
    currentUser = null;
    location.reload();
}

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        isGuest = false;

        // Kullanıcı verilerini çek
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            userData = doc.data();
        }

        showMainMenu();
    } else {
        if (!isGuest) {
            document.getElementById('authModal').classList.remove('hidden');
        }
    }
});

// Menu Functions
function showMainMenu() {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');

    updateMenuDisplay();
}

function updateMenuDisplay() {
    const displayName = isGuest ? 'Misafir' : (userData.name || currentUser.email);
    document.getElementById('userDisplay').textContent = displayName;
    document.getElementById('levelDisplay').textContent = 'Level: ' + userData.level;
    document.getElementById('scoreDisplay').textContent = userData.score || 0;

    const money = ((userData.score || 0) / 1000 * 10).toFixed(2);
    document.getElementById('moneyDisplay').textContent = money + ' TL';
}

// Wallet Functions
function showWallet() {
    document.getElementById('walletPoints').textContent = userData.score || 0;
    const money = ((userData.score || 0) / 1000 * 10).toFixed(2);
    document.getElementById('walletMoney').textContent = money + ' TL';
    document.getElementById('walletModal').classList.remove('hidden');
}

function closeWallet() {
    document.getElementById('walletModal').classList.add('hidden');
}

async function requestWithdraw() {
    if (isGuest) {
        alert('Misafir kullanıcılar çekim yapamaz!');
        return;
    }

    const type = document.getElementById('withdrawType').value;
    const info = document.getElementById('withdrawInfo').value;
    const amount = parseFloat(document.getElementById('withdrawAmount').value);

    if (!info || !amount || amount <= 0) {
        alert('Lütfen tüm alanları doğru doldurun!');
        return;
    }

    const maxMoney = (userData.score / 1000 * 10);
    if (amount > maxMoney) {
        alert('Yetersiz bakiye!');
        return;
    }

    try {
        // Çekim talebini Firestore'a kaydet
        await db.collection('withdrawals').add({
            userId: currentUser.uid,
            userName: userData.name,
            type: type,
            info: info,
            amount: amount,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Çekim talebiniz alındı! Admin onayından sonra işleme konulacak.');
        closeWallet();
    } catch (error) {
        alert('Hata: ' + error.message);
    }
}

// Leaderboard Functions
async function showLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p>Yükleniyor...</p>';
    document.getElementById('leaderboardModal').classList.remove('hidden');

    try {
        // Realtime Database'den sıralama verilerini çek
        const snapshot = await rtdb.ref('leaderboard').orderByChild('score').limitToLast(50).once('value');
        const data = [];

        snapshot.forEach((child) => {
            data.push({
                id: child.key,
                ...child.val()
            });
        });

        // Puana göre sırala (yüksekten düşüğe)
        data.sort((a, b) => b.score - a.score);

        list.innerHTML = '';
        data.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item' + (index < 3 ? ' top3' : '');
            item.innerHTML = `
                <span class="rank">${index + 1}</span>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-level">Level ${player.level}</div>
                </div>
                <span class="player-score">${player.score} Puan</span>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        list.innerHTML = '<p>Sıralama yüklenirken hata oluştu.</p>';
    }
}

function closeLeaderboard() {
    document.getElementById('leaderboardModal').classList.add('hidden');
}

// Game Variables
let canvas, ctx;
let gameLoop;
let cups = [];
let projectile = null;
let mouseX = 0, mouseY = 0;
let isCharging = false;
let power = 0;
let powerDirection = 1;
let angle = 45;

// Game Functions
function startGame() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('gameArea').classList.remove('hidden');

    initGame();
}

function backToMenu() {
    document.getElementById('gameArea').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');

    if (gameLoop) cancelAnimationFrame(gameLoop);
    updateMenuDisplay();
}

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Responsive canvas
    canvas.width = Math.min(window.innerWidth - 40, 800);
    canvas.height = 500;

    // Reset game state
    userData.ammo = 10 + (userData.level - 1) * 2; // Level arttıkça mermi artar
    cups = [];
    projectile = null;

    // Bardakları oluştur
    generateCups();

    // Event listeners
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;

        // Açı hesapla
        const dx = mouseX - 100;
        const dy = canvas.height - 100 - mouseY;
        angle = Math.atan2(dy, dx) * 180 / Math.PI;
        document.getElementById('angleDisplay').textContent = 'Açı: ' + Math.round(angle) + '°';
    });

    canvas.addEventListener('mousedown', () => {
        if (!projectile && userData.ammo > 0) {
            isCharging = true;
            power = 0;
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (isCharging) {
            isCharging = false;
            shoot();
        }
    });

    updateGameUI();
    gameLoop = requestAnimationFrame(update);
}

function generateCups() {
    const cupCount = 5 + userData.level; // Level arttıkça bardak sayısı artar

    for (let i = 0; i < cupCount; i++) {
        cups.push({
            x: 300 + Math.random() * (canvas.width - 350),
            y: 350 + Math.random() * 100,
            width: 40,
            height: 60,
            hit: false,
            points: (Math.floor(Math.random() * 3) + 1) * 10, // 10, 20, 30 puan
            color: ['#ff6b6b', '#4ecdc4', '#ffe66d'][Math.floor(Math.random() * 3)]
        });
    }
}

function shoot() {
    if (userData.ammo <= 0) return;

    userData.ammo--;
    userData.totalShots++;

    const velocity = power / 100 * 25; // Max hız
    const rad = angle * Math.PI / 180;

    projectile = {
        x: 100,
        y: canvas.height - 100,
        vx: Math.cos(rad) * velocity,
        vy: -Math.sin(rad) * velocity,
        radius: 8,
        trail: []
    };

    updateGameUI();
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Arka plan
    drawBackground();

    // Güç barı güncelle
    if (isCharging) {
        power += powerDirection * 2;
        if (power >= 100 || power <= 0) powerDirection *= -1;
        document.getElementById('powerFill').style.width = power + '%';
    }

    // Sapan çiz
    drawSlingshot();

    // Bardakları çiz
    drawCups();

    // Mermiyi güncelle ve çiz
    if (projectile) {
        updateProjectile();
        drawProjectile();
    }

    // Nişan çizgisi
    if (!projectile && isCharging) {
        drawAimLine();
    }

    gameLoop = requestAnimationFrame(update);
}

function drawBackground() {
    // Gökyüzü
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#E0F6FF');
    gradient.addColorStop(0.5, '#90EE90');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bulutlar
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 3; i++) {
        const x = 100 + i * 250;
        const y = 50 + Math.sin(Date.now() / 1000 + i) * 10;
        drawCloud(x, y);
    }
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 10, 35, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
    ctx.fill();
}

function drawSlingshot() {
    const sx = 100, sy = canvas.height - 100;

    // Sapan gövdesi
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 20, sy - 60);
    ctx.moveTo(sx - 20, sy - 60);
    ctx.lineTo(sx - 35, sy - 50);
    ctx.moveTo(sx - 20, sy - 60);
    ctx.lineTo(sx - 5, sy - 50);
    ctx.stroke();

    // Lastik
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (isCharging) {
        ctx.moveTo(sx - 35, sy - 50);
        ctx.lineTo(sx - 20 + power/5, sy - 60 + power/3);
        ctx.lineTo(sx - 5, sy - 50);
    } else {
        ctx.moveTo(sx - 35, sy - 50);
        ctx.lineTo(sx - 20, sy - 60);
        ctx.lineTo(sx - 5, sy - 50);
    }
    ctx.stroke();

    // Mermi (sapanda)
    if (!projectile) {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        if (isCharging) {
            ctx.arc(sx - 20 + power/5, sy - 60 + power/3, 8, 0, Math.PI * 2);
        } else {
            ctx.arc(sx - 20, sy - 60, 8, 0, Math.PI * 2);
        }
        ctx.fill();
    }
}

function drawCups() {
    cups.forEach((cup, index) => {
        if (cup.hit) return;

        // Bardak gölgesi
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(cup.x + cup.width/2, cup.y + cup.height - 5, cup.width/2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bardak gövdesi
        ctx.fillStyle = cup.color;
        ctx.beginPath();
        ctx.moveTo(cup.x, cup.y);
        ctx.lineTo(cup.x + cup.width, cup.y);
        ctx.lineTo(cup.x + cup.width - 5, cup.y + cup.height);
        ctx.lineTo(cup.x + 5, cup.y + cup.height);
        ctx.closePath();
        ctx.fill();

        // Bardak içi
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(cup.x + cup.width/2, cup.y, cup.width/2 - 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Puan yazısı
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cup.points, cup.x + cup.width/2, cup.y + cup.height/2 + 5);
    });
}

function updateProjectile() {
    // Yerçekimi
    projectile.vy += 0.5;

    // Hareket
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;

    // İz bırak
    projectile.trail.push({x: projectile.x, y: projectile.y});
    if (projectile.trail.length > 10) projectile.trail.shift();

    // Çarpışma kontrolü
    cups.forEach((cup, index) => {
        if (!cup.hit &&
            projectile.x > cup.x &&
            projectile.x < cup.x + cup.width &&
            projectile.y > cup.y &&
            projectile.y < cup.y + cup.height) {

            cup.hit = true;
            userData.hits++;
            addScore(cup.points, cup.x, cup.y);

            // Tüm bardaklar vuruldu mu?
            if (cups.every(c => c.hit)) {
                levelUp();
            }
        }
    });

    // Sınır kontrolü
    if (projectile.x < 0 || projectile.x > canvas.width || projectile.y > canvas.height) {
        projectile = null;

        // Mermi bitti mi?
        if (userData.ammo <= 0 && cups.some(c => !c.hit)) {
            setTimeout(() => {
                alert('Merminiz bitti! Puan: ' + userData.score);
                backToMenu();
            }, 500);
        }
    }
}

function drawProjectile() {
    // İz
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    projectile.trail.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Mermi
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawAimLine() {
    const sx = 100, sy = canvas.height - 100;
    const velocity = power / 100 * 25;
    const rad = angle * Math.PI / 180;
    let vx = Math.cos(rad) * velocity;
    let vy = -Math.sin(rad) * velocity;
    let x = sx - 20 + power/5;
    let y = sy - 60 + power/3;

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Tahmini yörünge
    for (let i = 0; i < 20; i++) {
        vy += 0.5;
        x += vx;
        y += vy;
        ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.setLineDash([]);
}

function addScore(points, x, y) {
    userData.score += points;

    // Efekt
    const effect = document.createElement('div');
    effect.className = 'hit-effect';
    effect.textContent = '+' + points;
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    document.getElementById('gameContainer').appendChild(effect);
    setTimeout(() => effect.remove(), 1000);

    updateGameUI();
    saveProgress();
}

function levelUp() {
    userData.level++;
    userData.ammo += 5; // Bonus mermi

    // Efekt
    const effect = document.createElement('div');
    effect.className = 'level-up';
    effect.textContent = '🎉 LEVEL ' + userData.level + ' 🎉';
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 2000);

    // Yeni bardaklar
    cups = [];
    generateCups();

    updateGameUI();
    saveProgress();
}

function updateGameUI() {
    document.getElementById('gameLevel').textContent = userData.level;
    document.getElementById('gameScore').textContent = userData.score;
    document.getElementById('ammo').textContent = userData.ammo;
}

async function saveProgress() {
    if (isGuest) return;

    try {
        await db.collection('users').doc(currentUser.uid).update({
            score: userData.score,
            level: userData.level,
            totalShots: userData.totalShots,
            hits: userData.hits,
            lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
        });

        await rtdb.ref('leaderboard/' + currentUser.uid).update({
            score: userData.score,
            level: userData.level
        });
    } catch (error) {
        console.error('Kaydetme hatası:', error);
    }
}

// Responsive
window.addEventListener('resize', () => {
    if (!document.getElementById('gameArea').classList.contains('hidden')) {
        canvas.width = Math.min(window.innerWidth - 40, 800);
        canvas.height = 500;
    }
});
