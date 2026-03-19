// ==========================================
// SPEEDRUSH - Ana JavaScript Dosyası
// ==========================================

// Firebase yapılandırması - BURAYA BİLGİLERİNİ GİR
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
// Firebase başlat
let auth, database;
let currentUser = null;
let gameInstance = null;

// DOM Elementleri
const elements = {
    loginScreen: document.getElementById('loginScreen'),
    mainApp: document.getElementById('mainApp'),
    emailInput: document.getElementById('emailInput'),
    passwordInput: document.getElementById('passwordInput'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    loginError: document.getElementById('loginError'),
    mainMenuBtn: document.getElementById('mainMenuBtn'),
    mainMenuModal: document.getElementById('mainMenuModal'),
    profileBtn: document.getElementById('profileBtn'),
    profileModal: document.getElementById('profileModal'),
    logoutBtn: document.getElementById('logoutBtn'),
    userName: document.getElementById('userName'),
    userAvatar: document.getElementById('userAvatar'),
    gameContainer: document.getElementById('gameContainer'),
    gameCanvas: document.getElementById('gameCanvas')
};

// ==========================================
// BAŞLATMA
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initFirebase();
    setupEventListeners();
    checkAuthState();
});

function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        database = firebase.database();
        console.log('Firebase başarıyla başlatıldı');
    } catch (error) {
        console.error('Firebase başlatma hatası:', error);
        showLoginError('Bağlantı hatası. Lütfen sayfayı yenileyin.');
    }
}

function setupEventListeners() {
    // Login
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.registerBtn.addEventListener('click', handleRegister);
    
    // Enter tuşu desteği
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Menü
    elements.mainMenuBtn.addEventListener('click', () => toggleModal('mainMenuModal'));
    elements.profileBtn.addEventListener('click', () => toggleModal('profileModal'));
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Modal dışına tıklama
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) toggleModal(modal.id);
        });
    });

    // Menü navigasyonu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navigateToSection(section);
            toggleModal('mainMenuModal');
        });
    });

    // Leaderboard tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadLeaderboard(btn.dataset.tab);
        });
    });
}

// ==========================================
// KİMLİK DOĞRULAMA
// ==========================================

function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            showMainApp();
            loadUserData();
        } else {
            showLoginScreen();
        }
    });
}

async function handleLogin() {
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;

    if (!email || !password) {
        showLoginError('Lütfen e-posta ve şifre girin');
        return;
    }

    elements.loginBtn.innerHTML = '<span class="loading"></span>';
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        showLoginError(getErrorMessage(error.code));
        elements.loginBtn.textContent = 'Giriş Yap';
    }
}

async function handleRegister() {
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;

    if (!email || !password) {
        showLoginError('Lütfen e-posta ve şifre girin');
        return;
    }

    if (password.length < 6) {
        showLoginError('Şifre en az 6 karakter olmalı');
        return;
    }

    elements.registerBtn.innerHTML = '<span class="loading"></span>';

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // Yeni kullanıcı verisi oluştur
        await createUserData(userCredential.user);
    } catch (error) {
        showLoginError(getErrorMessage(error.code));
        elements.registerBtn.textContent = 'Kayıt Ol';
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        toggleModal('mainMenuModal');
    } catch (error) {
        console.error('Çıkış hatası:', error);
    }
}

function showLoginError(message) {
    elements.loginError.textContent = message;
    setTimeout(() => {
        elements.loginError.textContent = '';
    }, 5000);
}

function getErrorMessage(code) {
    const messages = {
        'auth/invalid-email': 'Geçersiz e-posta adresi',
        'auth/user-disabled': 'Hesap devre dışı bırakılmış',
        'auth/user-not-found': 'Kullanıcı bulunamadı',
        'auth/wrong-password': 'Yanlış şifre',
        'auth/email-already-in-use': 'Bu e-posta zaten kullanımda',
        'auth/weak-password': 'Şifre çok zayıf',
        'auth/invalid-credential': 'E-posta veya şifre hatalı'
    };
    return messages[code] || 'Bir hata oluştu. Tekrar deneyin.';
}

// ==========================================
// KULLANICI VERİSİ
// ==========================================

async function createUserData(user) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.email.split('@')[0],
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        stats: {
            totalGames: 0,
            totalWins: 0,
            bestTime: null,
            coins: 1000,
            level: 1,
            xp: 0
        },
        garage: {
            currentCar: 'starter',
            unlockedCars: ['starter']
        }
    };

    await database.ref('users/' + user.uid).set(userData);
}

async function loadUserData() {
    if (!currentUser) return;

    const snapshot = await database.ref('users/' + currentUser.uid).once('value');
    const userData = snapshot.val();

    if (userData) {
        elements.userName.textContent = userData.displayName || 'Racer';
        document.getElementById('profileName').textContent = userData.displayName || 'Racer';
        document.getElementById('profileEmail').textContent = userData.email;
        
        if (userData.stats) {
            document.getElementById('totalGames').textContent = userData.stats.totalGames || 0;
            document.getElementById('totalWins').textContent = userData.stats.totalWins || 0;
            document.getElementById('bestTime').textContent = userData.stats.bestTime || '--';
            document.getElementById('coins').textContent = userData.stats.coins || 0;
            document.querySelector('.level-badge').textContent = 'Lv.' + (userData.stats.level || 1);
        }
    }
}

function updateUserStats(gameResult) {
    if (!currentUser) return;

    const userRef = database.ref('users/' + currentUser.uid + '/stats');
    
    userRef.once('value').then(snapshot => {
        const stats = snapshot.val() || {};
        
        const updates = {
            totalGames: (stats.totalGames || 0) + 1,
            coins: (stats.coins || 0) + (gameResult.coins || 0)
        };

        if (gameResult.won) {
            updates.totalWins = (stats.totalWins || 0) + 1;
        }

        if (gameResult.time && (!stats.bestTime || gameResult.time < stats.bestTime)) {
            updates.bestTime = gameResult.time;
        }

        userRef.update(updates);
    });
}

// ==========================================
// ARAYÜZ FONKSİYONLARI
// ==========================================

function showLoginScreen() {
    elements.loginScreen.classList.remove('hidden');
    elements.mainApp.classList.add('hidden');
    elements.emailInput.value = '';
    elements.passwordInput.value = '';
    elements.loginBtn.textContent = 'Giriş Yap';
    elements.registerBtn.textContent = 'Kayıt Ol';
}

function showMainApp() {
    elements.loginScreen.classList.add('hidden');
    elements.mainApp.classList.remove('hidden');
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.toggle('hidden');
}

function navigateToSection(sectionName) {
    // Tüm sectionları gizle
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));

    // İstenen sectionı göster
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Menü aktifliğini güncelle
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

    // Özel yükleme fonksiyonları
    if (sectionName === 'leaderboard') {
        loadLeaderboard('weekly');
    }
}

// ==========================================
// LEADERBOARD
// ==========================================

async function loadLeaderboard(type) {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<div style="text-align:center;padding:40px;"><span class="loading"></span></div>';

    try {
        const snapshot = await database.ref('users')
            .orderByChild('stats/totalWins')
            .limitToLast(10)
            .once('value');

        const users = [];
        snapshot.forEach(child => {
            users.push({
                id: child.key,
                ...child.val()
            });
        });

        // Ters çevir (en yüksek skor üstte)
        users.reverse();

        displayLeaderboard(users);
    } catch (error) {
        console.error('Leaderboard yüklenirken hata:', error);
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Veri yüklenemedi</p>';
    }
}

function displayLeaderboard(users) {
    const list = document.getElementById('leaderboardList');
    
    if (users.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Henüz veri yok</p>';
        return;
    }

    list.innerHTML = users.map((user, index) => {
        const rank = index + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';

        const stats = user.stats || {};
        
        return `
            <div class="leaderboard-item">
                <div class="rank ${rankClass}">${rank}</div>
                <div class="player-info">
                    <div class="player-name">${user.displayName || 'Unknown'}</div>
                    <div class="player-stats">Level ${stats.level || 1} • ${stats.totalGames || 0} oyun</div>
                </div>
                <div class="player-score">${stats.totalWins || 0} 🏆</div>
            </div>
        `;
    }).join('');
}

// ==========================================
// OYUN MOTORU - ARABA YARIŞI
// ==========================================

class CarGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        
        this.isRunning = false;
        this.score = 0;
        this.coins = 0;
        this.startTime = 0;
        this.speed = 0;
        this.maxSpeed = 300;
        
        // Araba özellikleri
        this.car = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 150,
            width: 40,
            height: 70,
            angle: 0,
            velocity: 0
        };
        
        // Yol özellikleri
        this.roadOffset = 0;
        this.laneWidth = 80;
        this.roadLines = [];
        
        // Engeller
        this.obstacles = [];
        this.obstacleTimer = 0;
        
        // Kontroller
        this.keys = {};
        
        this.setupControls();
        this.initRoadLines();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mobil kontroller
        let touchStartX = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const diff = touchX - touchStartX;
            this.car.x += diff * 0.5;
            touchStartX = touchX;
        });
    }
    
    initRoadLines() {
        for (let i = 0; i < 10; i++) {
            this.roadLines.push({
                y: i * 100,
                height: 50
            });
        }
    }
    
    start() {
        this.isRunning = true;
        this.startTime = Date.now();
        this.score = 0;
        this.coins = 0;
        this.speed = 0;
        this.obstacles = [];
        this.car.x = this.canvas.width / 2;
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        return {
            score: this.score,
            coins: this.coins,
            time: this.formatTime(Date.now() - this.startTime),
            won: this.score > 1000
        };
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    
    update() {
        // Hız kontrolü
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.speed = Math.min(this.speed + 2, this.maxSpeed);
        } else if (this.keys['ArrowDown'] || this.keys['s']) {
            this.speed = Math.max(this.speed - 3, 0);
        } else {
            this.speed = Math.max(this.speed - 0.5, 0);
        }
        
        // Yatay hareket
        const moveSpeed = 5 + (this.speed / 50);
        if ((this.keys['ArrowLeft'] || this.keys['a']) && this.car.x > 100) {
            this.car.x -= moveSpeed;
            this.car.angle = -0.1;
        } else if ((this.keys['ArrowRight'] || this.keys['d']) && this.car.x < this.canvas.width - 100) {
            this.car.x += moveSpeed;
            this.car.angle = 0.1;
        } else {
            this.car.angle = 0;
        }
        
        // Yol hareketi
        this.roadOffset += this.speed * 0.1;
        
        // Yol çizgileri
        this.roadLines.forEach(line => {
            line.y += this.speed * 0.1;
            if (line.y > this.canvas.height) {
                line.y = -50;
            }
        });
        
        // Engel oluşturma
        this.obstacleTimer++;
        if (this.obstacleTimer > 60 && this.speed > 50) {
            this.obstacleTimer = 0;
            if (Math.random() < 0.3) {
                this.obstacles.push({
                    x: 150 + Math.random() * (this.canvas.width - 300),
                    y: -100,
                    width: 50,
                    height: 50,
                    type: Math.random() > 0.8 ? 'coin' : 'car',
                    speed: 2 + Math.random() * 3
                });
            }
        }
        
        // Engel güncelleme
        this.obstacles = this.obstacles.filter(obs => {
            obs.y += obs.speed + (this.speed * 0.05);
            
            // Çarpışma kontrolü
            if (this.checkCollision(this.car, obs)) {
                if (obs.type === 'coin') {
                    this.coins += 10;
                    this.score += 50;
                    return false;
                } else {
                    this.speed *= 0.5; // Çarpışma yavaşlatır
                    this.score = Math.max(0, this.score - 100);
                }
            }
            
            // Ekran dışına çıkan engeller
            if (obs.y > this.canvas.height + 100) {
                if (obs.type !== 'coin') this.score += 10;
                return false;
            }
            
            return true;
        });
        
        // Skor güncelleme
        this.score += Math.floor(this.speed * 0.01);
        
        // UI güncelleme
        this.updateUI();
    }
    
    checkCollision(car, obstacle) {
        return car.x < obstacle.x + obstacle.width &&
               car.x + car.width > obstacle.x &&
               car.y < obstacle.y + obstacle.height &&
               car.y + car.height > obstacle.y;
    }
    
    updateUI() {
        const elapsed = Date.now() - this.startTime;
        document.getElementById('gameTime').textContent = this.formatTime(elapsed);
        document.getElementById('gameSpeed').textContent = Math.floor(this.speed);
        document.getElementById('gameCoins').textContent = this.coins;
    }
    
    draw() {
        // Temizle
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Yol
        this.ctx.fillStyle = '#0f0f1a';
        this.ctx.fillRect(100, 0, this.canvas.width - 200, this.canvas.height);
        
        // Yol kenarları
        this.ctx.fillStyle = '#ff6b35';
        this.ctx.fillRect(95, 0, 5, this.canvas.height);
        this.ctx.fillRect(this.canvas.width - 100, 0, 5, this.canvas.height);
        
        // Şerit çizgileri
        this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
        this.roadLines.forEach(line => {
            this.ctx.fillRect(this.canvas.width / 2 - 2, line.y, 4, line.height);
        });
        
        // Engeller
        this.obstacles.forEach(obs => {
            if (obs.type === 'coin') {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(obs.x + 25, obs.y + 25, 20, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#000';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('$', obs.x + 18, obs.y + 32);
            } else {
                // Diğer araba
                this.ctx.save();
                this.ctx.translate(obs.x + 25, obs.y + 25);
                this.drawCarBody('#ff4757');
                this.ctx.restore();
            }
        });
        
        // Oyuncu arabası
        this.ctx.save();
        this.ctx.translate(this.car.x, this.car.y);
        this.ctx.rotate(this.car.angle);
        this.drawCarBody('#00d9ff');
        
        // Farlar
        this.ctx.fillStyle = 'rgba(255,255,200,0.8)';
        this.ctx.beginPath();
        this.ctx.moveTo(-15, -35);
        this.ctx.lineTo(-25, -80);
        this.ctx.lineTo(-5, -80);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(15, -35);
        this.ctx.lineTo(25, -80);
        this.ctx.lineTo(5, -80);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawCarBody(color) {
        // Araba gövdesi
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(-20, -35, 40, 70, 10);
        this.ctx.fill();
        
        // Cam
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.beginPath();
        this.ctx.roundRect(-15, -20, 30, 25, 5);
        this.ctx.fill();
        
        // Tekerlekler
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(-22, -25, 4, 15);
        this.ctx.fillRect(18, -25, 4, 15);
        this.ctx.fillRect(-22, 15, 4, 15);
        this.ctx.fillRect(18, 15, 4, 15);
        
        // Stop lambaları
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(-15, 30, 8, 5);
        this.ctx.fillRect(7, 30, 8, 5);
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ==========================================
// OYUN FONKSİYONLARI
// ==========================================

function startGame(mode = 'time_trial') {
    elements.gameContainer.classList.remove('hidden');
    gameInstance = new CarGame(elements.gameCanvas);
    gameInstance.start();
}

function exitGame() {
    if (gameInstance) {
        const result = gameInstance.stop();
        
        // Skorları kaydet
        if (currentUser) {
            updateUserStats(result);
        }
        
        gameInstance = null;
    }
    elements.gameContainer.classList.add('hidden');
}

// Pencere boyutu değiştiğinde
window.addEventListener('resize', () => {
    if (gameInstance) {
        gameInstance.resize();
    }
});
