// Birikim Dünyası - Ana Oyun Dosyası

class SavingsGame {
    constructor() {
        this.banknotes = 0;
        this.totalEarned = 0;
        this.heroes = {};
        this.transactions = [];
        this.bonusTimer = 1200;
        this.lastBonusTime = Date.now();
        this.gameActive = false;
        this.dailyClaimed = false;
        
        this.heroDefinitions = {
            kus: {
                name: 'Kuş',
                emoji: '🐦',
                baseProduction: 25,
                levels: [
                    { level: 1, production: 25, upgradeCost: 0 },
                    { level: 2, production: 50, upgradeCost: 1000 },
                    { level: 3, production: 100, upgradeCost: 2500 }
                ]
            },
            aslan: {
                name: 'Aslan',
                emoji: '🦁',
                baseProduction: 300,
                levels: [
                    { level: 1, production: 300, upgradeCost: 0 },
                    { level: 2, production: 700, upgradeCost: 50000 },
                    { level: 3, production: 1500, upgradeCost: 100000 }
                ]
            },
            maymun: {
                name: 'Maymun',
                emoji: '🐵',
                baseProduction: 2000,
                levels: [
                    { level: 1, production: 2000, upgradeCost: 0 },
                    { level: 2, production: 4500, upgradeCost: 650000 },
                    { level: 3, production: 8000, upgradeCost: 1500000 }
                ]
            },
            fil: {
                name: 'Fil',
                emoji: '🐘',
                baseProduction: 5000,
                levels: [
                    { level: 1, production: 5000, upgradeCost: 0 },
                    { level: 2, production: 10000, upgradeCost: 2000000 },
                    { level: 3, production: 18000, upgradeCost: 5000000 }
                ]
            },
            kartal: {
                name: 'Kartal',
                emoji: '🦅',
                baseProduction: 12000,
                levels: [
                    { level: 1, production: 12000, upgradeCost: 0 },
                    { level: 2, production: 25000, upgradeCost: 5000000 },
                    { level: 3, production: 50000, upgradeCost: 12000000 }
                ]
            }
        };
        
        this.init();
    }
    
    init() {
        this.loadGame();
        this.setupEventListeners();
        this.startProductionLoop();
        this.startBonusTimer();
        this.renderHeroes();
        this.updateUI();
    }
    
    loadGame() {
        try {
            const saved = localStorage.getItem('savingsGame');
            if (saved) {
                const data = JSON.parse(saved);
                this.banknotes = data.banknotes || 0;
                this.totalEarned = data.totalEarned || 0;
                this.heroes = data.heroes || {};
                this.transactions = data.transactions || [];
                this.lastBonusTime = data.lastBonusTime || Date.now();
                this.dailyClaimed = data.dailyClaimed || false;
                this.calculateOfflineProduction();
            } else {
                this.heroes = { kus: { owned: true, level: 1 } };
            }
        } catch (e) {
            console.error('Yükleme hatası:', e);
            this.heroes = { kus: { owned: true, level: 1 } };
        }
    }
    
    saveGame() {
        try {
            const data = {
                banknotes: this.banknotes,
                totalEarned: this.totalEarned,
                heroes: this.heroes,
                transactions: this.transactions,
                lastBonusTime: this.lastBonusTime,
                dailyClaimed: this.dailyClaimed,
                saveTime: Date.now()
            };
            localStorage.setItem('savingsGame', JSON.stringify(data));
        } catch (e) {
            console.error('Kaydetme hatası:', e);
        }
    }
    
    calculateOfflineProduction() {
        const now = Date.now();
        const offlineTime = (now - (this.lastBonusTime || now)) / 1000;
        const hours = Math.min(offlineTime / 3600, 24);
        
        let totalProduction = 0;
        Object.keys(this.heroes).forEach(heroId => {
            if (this.heroes[heroId].owned) {
                const hero = this.heroDefinitions[heroId];
                const level = this.heroes[heroId].level;
                const production = hero.levels[level - 1].production;
                totalProduction += production;
            }
        });
        
        const earned = Math.floor(totalProduction * hours);
        if (earned > 0) {
            this.banknotes += earned;
            this.totalEarned += earned;
            this.showToast(`Offline süresinde ${earned.toLocaleString()} 💵 kazandın!`, 'success');
        }
    }
    
    startProductionLoop() {
        setInterval(() => {
            let totalProduction = 0;
            Object.keys(this.heroes).forEach(heroId => {
                if (this.heroes[heroId].owned) {
                    const hero = this.heroDefinitions[heroId];
                    const level = this.heroes[heroId].level;
                    const production = hero.levels[level - 1].production;
                    totalProduction += production;
                    
                    if (Math.random() < 0.1) {
                        this.showFloatingText(heroId, `+${production}`);
                    }
                }
            });
            
            const perSecond = totalProduction / 3600;
            this.banknotes += perSecond;
            this.totalEarned += perSecond;
            this.updateUI();
            this.saveGame();
        }, 1000);
    }
    
    startBonusTimer() {
        setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - this.lastBonusTime) / 1000);
            const remaining = Math.max(0, 1200 - elapsed);
            
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            const timerEl = document.getElementById('bonus-timer');
            
            if (timerEl) {
                if (remaining === 0) {
                    timerEl.parentElement.classList.add('claimable');
                    timerEl.textContent = 'AL!';
                } else {
                    timerEl.parentElement.classList.remove('claimable');
                    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }
    
    claimBonus() {
        const now = Date.now();
        const elapsed = Math.floor((now - this.lastBonusTime) / 1000);
        
        if (elapsed >= 1200) {
            const bonus = 5000;
            this.banknotes += bonus;
            this.totalEarned += bonus;
            this.lastBonusTime = now;
            this.saveGame();
            this.updateUI();
            this.showToast(`Bonus: ${bonus.toLocaleString()} 💵 kazandın!`, 'success');
            
            const timerBox = document.querySelector('.timer-box');
            timerBox.classList.add('bonus-claim');
            setTimeout(() => timerBox.classList.remove('bonus-claim'), 500);
        }
    }
    
    renderHeroes() {
        const container = document.getElementById('heroes-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.keys(this.heroDefinitions).forEach(heroId => {
            const hero = this.heroDefinitions[heroId];
            const owned = this.heroes[heroId]?.owned;
            const level = this.heroes[heroId]?.level || 1;
            const currentLevelData = hero.levels[level - 1];
            const nextLevelData = hero.levels[level];
            
            const card = document.createElement('div');
            card.className = `hero-card ${owned ? 'active' : 'locked'}`;
            card.id = `hero-${heroId}`;
            
            let upgradeButton = '';
            if (owned) {
                if (nextLevelData) {
                    const canAfford = this.banknotes >= nextLevelData.upgradeCost;
                    upgradeButton = `
                        <button class="upgrade-btn" 
                                data-hero="${heroId}" 
                                data-cost="${nextLevelData.upgradeCost}"
                                ${!canAfford ? 'disabled' : ''}>
                            Seviye Atla (${nextLevelData.upgradeCost.toLocaleString()} 💵)
                        </button>
                    `;
                } else {
                    upgradeButton = `<button class="upgrade-btn max-level" disabled>Maks Seviye</button>`;
                }
            } else {
                upgradeButton = `<button class="upgrade-btn" disabled>Kilitli</button>`;
            }
            
            card.innerHTML = `
                <span class="hero-emoji">${hero.emoji}</span>
                <div class="hero-name">${hero.name}</div>
                <div class="hero-level">Seviye ${level}</div>
                <div class="hero-production">Saatlik: ${currentLevelData.production.toLocaleString()} 💵</div>
                ${upgradeButton}
            `;
            
            container.appendChild(card);
        });
        
        document.querySelectorAll('.upgrade-btn[data-hero]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const heroId = e.target.dataset.hero;
                const cost = parseInt(e.target.dataset.cost);
                this.upgradeHero(heroId, cost);
            });
        });
    }
    
    upgradeHero(heroId, cost) {
        if (this.banknotes >= cost && this.heroes[heroId]) {
            this.banknotes -= cost;
            this.heroes[heroId].level++;
            this.saveGame();
            this.renderHeroes();
            this.updateUI();
            this.showLevelUpEffect(this.heroDefinitions[heroId].emoji);
            this.showToast(`${this.heroDefinitions[heroId].name} seviye atladı!`, 'success');
        } else {
            this.showToast('Yetersiz bakiye!', 'error');
        }
    }
    
    buyHero(heroId, cost) {
        if (this.banknotes >= cost) {
            this.banknotes -= cost;
            this.heroes[heroId] = { owned: true, level: 1 };
            this.saveGame();
            this.renderHeroes();
            this.updateUI();
            this.showToast(`${this.heroDefinitions[heroId].name} satın alındı!`, 'success');
            return true;
        } else {
            this.showToast('Yetersiz bakiye!', 'error');
            return false;
        }
    }
    
    updateUI() {
        const totalEl = document.getElementById('total-banknotes');
        if (totalEl) {
            totalEl.textContent = Math.floor(this.banknotes).toLocaleString();
        }
        
        const profileTotal = document.getElementById('profile-total');
        const profileHeroes = document.getElementById('profile-heroes');
        if (profileTotal) profileTotal.textContent = Math.floor(this.totalEarned).toLocaleString();
        if (profileHeroes) profileHeroes.textContent = Object.keys(this.heroes).length;
        
        document.querySelectorAll('.buy-btn').forEach(btn => {
            const cost = parseInt(btn.dataset.cost);
            const heroId = btn.dataset.hero;
            const owned = this.heroes[heroId]?.owned;
            
            if (owned) {
                btn.textContent = 'Sahipsin';
                btn.disabled = true;
                btn.closest('.shop-item').classList.add('purchased');
            } else {
                btn.disabled = this.banknotes < cost;
            }
        });
        
        document.querySelectorAll('.upgrade-btn[data-hero]').forEach(btn => {
            const cost = parseInt(btn.dataset.cost);
            btn.disabled = this.banknotes < cost;
        });
    }
    
    showLevelUpEffect(emoji) {
        const effect = document.createElement('div');
        effect.className = 'level-up-effect';
        effect.textContent = emoji + ' LEVEL UP!';
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
    }
    
    showFloatingText(heroId, text) {
        const heroCard = document.getElementById(`hero-${heroId}`);
        if (!heroCard) return;
        
        const rect = heroCard.getBoundingClientRect();
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-text';
        floatEl.textContent = text;
        floatEl.style.left = rect.left + rect.width / 2 + 'px';
        floatEl.style.top = rect.top + 'px';
        document.getElementById('production-effects').appendChild(floatEl);
        
        setTimeout(() => floatEl.remove(), 1500);
    }
    
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    setupEventListeners() {
        const modals = {
            'shop-btn': 'shop-modal',
            'heroes-btn': 'heroes-modal',
            'finance-btn': 'finance-modal',
            'tasks-btn': 'tasks-modal',
            'settings-btn': 'settings-modal',
            'profile-btn': 'profile-modal',
            'howto-btn': 'howto-modal'
        };
        
        Object.keys(modals).forEach(btnId => {
            const btn = document.getElementById(btnId);
            const modal = document.getElementById(modals[btnId]);
            if (btn && modal) {
                btn.addEventListener('click', () => {
                    modal.classList.add('active');
                    if (btnId === 'heroes-btn') this.renderHeroesList();
                    if (btnId === 'tasks-btn') this.checkDailyTask();
                });
            }
        });
        
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        });
        
        document.querySelector('.timer-box')?.addEventListener('click', () => {
            this.claimBonus();
        });
        
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const heroId = e.target.dataset.hero;
                const cost = parseInt(e.target.dataset.cost);
                if (this.buyHero(heroId, cost)) {
                    e.target.textContent = 'Sahipsin';
                    e.target.disabled = true;
                }
            });
        });
        
        document.getElementById('deposit-btn')?.addEventListener('click', () => {
            const amount = parseInt(document.getElementById('deposit-amount').value);
            if (amount >= 10) {
                const banknotes = amount * 100000;
                this.banknotes += banknotes;
                this.addTransaction('Yatırım', amount);
                this.saveGame();
                this.updateUI();
                this.showToast(`${amount} TL yatırım yapıldı!`, 'success');
                document.getElementById('deposit-amount').value = '';
            } else {
                this.showToast('Minimum 10 TL yatırım yapılabilir!', 'error');
            }
        });
        
        document.getElementById('withdraw-btn')?.addEventListener('click', () => {
            const amount = parseInt(document.getElementById('withdraw-amount').value);
            const requiredBanknotes = amount * 100000;
            if (amount >= 20 && this.banknotes >= requiredBanknotes) {
                this.banknotes -= requiredBanknotes;
                this.addTransaction('Çekim', amount);
                this.saveGame();
                this.updateUI();
                this.showToast(`${amount} TL çekim talebi oluşturuldu!`, 'success');
                document.getElementById('withdraw-amount').value = '';
            } else if (amount < 20) {
                this.showToast('Minimum 20 TL çekim yapılabilir!', 'error');
            } else {
                this.showToast('Yetersiz bakiye!', 'error');
            }
        });
        
        document.getElementById('daily-login')?.addEventListener('click', (e) => {
            if (!this.dailyClaimed) {
                this.banknotes += 1000;
                this.dailyClaimed = true;
                this.saveGame();
                this.updateUI();
                e.target.textContent = 'Alındı';
                e.target.disabled = true;
                this.showToast('Günlük ödül: 1,000 💵', 'success');
            }
        });
        
        document.getElementById('go-game')?.addEventListener('click', () => {
            document.getElementById('tasks-modal').classList.remove('active');
            document.getElementById('game-modal').classList.add('active');
            initFlappyGame();
        });
        
        document.getElementById('play-game-btn')?.addEventListener('click', () => {
            document.getElementById('game-modal').classList.add('active');
            initFlappyGame();
        });
        
        document.getElementById('reset-game')?.addEventListener('click', () => {
            if (confirm('Oyunu sıfırlamak istediğine emin misin? Tüm ilerlemen silinecek!')) {
                localStorage.removeItem('savingsGame');
                location.reload();
            }
        });
    }
    
    renderHeroesList() {
        const list = document.getElementById('heroes-list');
        if (!list) return;
        
        list.innerHTML = '';
        Object.keys(this.heroes).forEach(heroId => {
            const hero = this.heroDefinitions[heroId];
            const level = this.heroes[heroId].level;
            const production = hero.levels[level - 1].production;
            
            const item = document.createElement('div');
            item.className = 'hero-list-item active';
            item.innerHTML = `
                <div class="item-icon">${hero.emoji}</div>
                <div class="item-info">
                    <h3>${hero.name}</h3>
                    <p>Seviye ${level} - Saatlik ${production.toLocaleString()} 💵</p>
                </div>
            `;
            list.appendChild(item);
        });
    }
    
    checkDailyTask() {
        const btn = document.getElementById('daily-login');
        if (this.dailyClaimed) {
            btn.textContent = 'Alındı';
            btn.disabled = true;
        }
    }
    
    addTransaction(type, amount) {
        const transaction = {
            type,
            amount,
            date: new Date().toLocaleString('tr-TR')
        };
        this.transactions.unshift(transaction);
        if (this.transactions.length > 10) this.transactions.pop();
        this.renderTransactions();
    }
    
    renderTransactions() {
        const list = document.getElementById('transaction-list');
        if (!list) return;
        
        list.innerHTML = this.transactions.map(t => `
            <div class="transaction-item">
                <span>${t.type} - ${t.date}</span>
                <span>₺${t.amount}</span>
            </div>
        `).join('');
    }
}

class FlappyGame {
    constructor() {
        this.canvas = document.getElementById('flappy-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameLoop = null;
        this.score = 0;
        this.gameRunning = false;
        
        this.bird = {
            x: 50,
            y: 200,
            velocity: 0,
            gravity: 0.4,
            jump: -7,
            size: 24
        };
        
        this.pipes = [];
        this.pipeWidth = 50;
        this.pipeGap = 120;
        this.pipeSpeed = 3;
        this.pipeSpawnTimer = 0;
        
        this.setupControls();
    }
    
    setupControls() {
        const jump = (e) => {
            e.preventDefault();
            if (this.gameRunning) {
                this.bird.velocity = this.bird.jump;
            }
        };
        
        this.canvas.addEventListener('click', jump);
        this.canvas.addEventListener('touchstart', jump);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') jump(e);
        });
        
        document.getElementById('start-game')?.addEventListener('click', () => {
            this.start();
        });
    }
    
    start() {
        this.bird.y = 200;
        this.bird.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.gameRunning = true;
        this.pipeSpawnTimer = 0;
        
        document.getElementById('game-overlay').style.display = 'none';
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        if (this.bird.y < 0 || this.bird.y > this.canvas.height - this.bird.size) {
            this.gameOver();
            return;
        }
        
        this.pipeSpawnTimer++;
        if (this.pipeSpawnTimer > 100) {
            this.spawnPipe();
            this.pipeSpawnTimer = 0;
        }
        
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;
            
            if (this.checkCollision(this.bird, pipe)) {
                this.gameOver();
                return;
            }
            
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                this.score++;
                pipe.passed = true;
            }
            
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
        
        this.draw();
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    spawnPipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            passed: false
        });
    }
    
    checkCollision(bird, pipe) {
        const birdLeft = bird.x - bird.size / 2;
        const birdRight = bird.x + bird.size / 2;
        const birdTop = bird.y - bird.size / 2;
        const birdBottom = bird.y + bird.size / 2;
        
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + this.pipeWidth;
        
        if (birdRight > pipeLeft && birdLeft < pipeRight && birdTop < pipe.topHeight) {
            return true;
        }
        
        if (birdRight > pipeLeft && birdLeft < pipeRight && birdBottom > pipe.bottomY) {
            return true;
        }
        
        return false;
    }
    
    draw() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(80, 80, 30, 0, Math.PI * 2);
        this.ctx.arc(120, 80, 40, 0, Math.PI * 2);
        this.ctx.arc(160, 80, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#22c55e';
        this.pipes.forEach(pipe => {
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, this.pipeWidth + 10, 20);
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY);
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 20);
        });
        
        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        this.ctx.rotate(Math.min(Math.max(this.bird.velocity * 0.1, -0.5), 0.5));
        
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(4, -4, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(6, -4, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#f97316';
        this.ctx.beginPath();
        this.ctx.moveTo(8, 0);
        this.ctx.lineTo(16, 4);
        this.ctx.lineTo(8, 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.ellipse(-4, 4, 8, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 32px Nunito';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(this.score, this.canvas.width / 2 - 10, 50);
        this.ctx.fillText(this.score, this.canvas.width / 2 - 10, 50);
    }
    
    gameOver() {
        this.gameRunning = false;
        cancelAnimationFrame(this.gameLoop);
        
        const reward = this.score * 1000;
        game.banknotes += reward;
        game.totalEarned += reward;
        game.saveGame();
        game.updateUI();
        
        const overlay = document.getElementById('game-overlay');
        document.getElementById('game-score').textContent = this.score;
        document.getElementById('game-reward').textContent = reward.toLocaleString();
        overlay.style.display = 'block';
        
        if (reward > 0) {
            game.showToast(`Tebrikler! ${reward.toLocaleString()} 💵 kazandın!`, 'success');
        }
    }
}

let game;
let flappyGame;

document.addEventListener('DOMContentLoaded', () => {
    game = new SavingsGame();
});

function initFlappyGame() {
    if (!flappyGame) {
        flappyGame = new FlappyGame();
    }
    document.getElementById('game-overlay').style.display = 'block';
}
