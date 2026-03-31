// ========== 100 MADENCİ EŞYASI ==========
const ITEMS = [
  // --- ŞAPKALAR (10 adet) ---
  { id: 'hat_01', name: 'Hasır Şapka', category: 'hat', ph: 2, icon: '👒', rarity: 'common', desc: 'Sıradan bir hasır şapka.' },
  { id: 'hat_02', name: 'Madenci Şapkası', category: 'hat', ph: 5, icon: '⛑️', rarity: 'common', desc: 'Temel koruma sağlar.' },
  { id: 'hat_03', name: 'Demir Kask', category: 'hat', ph: 10, icon: '🪖', rarity: 'uncommon', desc: 'Sağlam demir kask.' },
  { id: 'hat_04', name: 'Çelik Kask', category: 'hat', ph: 18, icon: '🛡️', rarity: 'uncommon', desc: 'Güçlendirilmiş çelik.' },
  { id: 'hat_05', name: 'Liderlik Kaskı', category: 'hat', ph: 28, icon: '👑', rarity: 'rare', desc: 'Lider madencilerin tercihi.' },
  { id: 'hat_06', name: 'Altın Şapka', category: 'hat', ph: 40, icon: '🎩', rarity: 'rare', desc: 'Altın işlemeli şapka.' },
  { id: 'hat_07', name: 'Kristal Kask', category: 'hat', ph: 55, icon: '💎', rarity: 'epic', desc: 'Kristalden örülmüş kask.' },
  { id: 'hat_08', name: 'Ejder Kaskı', category: 'hat', ph: 75, icon: '🐉', rarity: 'epic', desc: 'Ejder kafasından yapılma.' },
  { id: 'hat_09', name: 'Efsane Kask', category: 'hat', ph: 110, icon: '⚡', rarity: 'legendary', desc: 'Efsanevi madencinin kaskı.' },
  { id: 'hat_10', name: 'Tanrı\'nın Taci', category: 'hat', ph: 200, icon: '🌟', rarity: 'mythic', desc: 'En güçlü başlık.' },

  // --- KAZMA (10 adet) ---
  { id: 'pick_01', name: 'Tahta Kazma', category: 'pickaxe', ph: 2, icon: '🪓', rarity: 'common', desc: 'Başlangıç kazmasi.' },
  { id: 'pick_02', name: 'Taş Kazma', category: 'pickaxe', ph: 4, icon: '⛏️', rarity: 'common', desc: 'Temel taş kazma.' },
  { id: 'pick_03', name: 'Demir Kazma', category: 'pickaxe', ph: 8, icon: '🔨', rarity: 'common', desc: 'Sağlam demir kazma.' },
  { id: 'pick_04', name: 'Çelik Kazma', category: 'pickaxe', ph: 15, icon: '🪛', rarity: 'uncommon', desc: 'Keskin çelik kazma.' },
  { id: 'pick_05', name: 'Elmas Kazma', category: 'pickaxe', ph: 25, icon: '💠', rarity: 'uncommon', desc: 'Elmas uçlu kazma.' },
  { id: 'pick_06', name: 'Altın Kazma', category: 'pickaxe', ph: 38, icon: '✨', rarity: 'rare', desc: 'Altın kaplama kazma.' },
  { id: 'pick_07', name: 'Rüya Kazması', category: 'pickaxe', ph: 52, icon: '🌈', rarity: 'rare', desc: 'Renkli kristal kazma.' },
  { id: 'pick_08', name: 'Gölge Kazması', category: 'pickaxe', ph: 70, icon: '🌑', rarity: 'epic', desc: 'Karanlıktan doğmuş.' },
  { id: 'pick_09', name: 'Alev Kazması', category: 'pickaxe', ph: 100, icon: '🔥', rarity: 'legendary', desc: 'Kor ateşiyle dövülmüş.' },
  { id: 'pick_10', name: 'Tanrı Kazması', category: 'pickaxe', ph: 180, icon: '⚡', rarity: 'mythic', desc: 'Tanrıların hediyesi.' },

  // --- ELBİSE (10 adet) ---
  { id: 'suit_01', name: 'Eski İş Elbisesi', category: 'suit', ph: 2, icon: '👕', rarity: 'common', desc: 'Yıpranmış iş elbisesi.' },
  { id: 'suit_02', name: 'Turuncu Tulum', category: 'suit', ph: 5, icon: '🦺', rarity: 'common', desc: 'Standart madenci tulumu.' },
  { id: 'suit_03', name: 'Deri Yelek', category: 'suit', ph: 9, icon: '🥋', rarity: 'common', desc: 'Korumalı deri yelek.' },
  { id: 'suit_04', name: 'Demir Zırh', category: 'suit', ph: 16, icon: '🛡️', rarity: 'uncommon', desc: 'Demir levha zırh.' },
  { id: 'suit_05', name: 'Çelik Zırh', category: 'suit', ph: 26, icon: '⚔️', rarity: 'uncommon', desc: 'Tam çelik zırh.' },
  { id: 'suit_06', name: 'Kristal Zırh', category: 'suit', ph: 39, icon: '💎', rarity: 'rare', desc: 'Kristal parçalı zırh.' },
  { id: 'suit_07', name: 'Altın Zırh', category: 'suit', ph: 55, icon: '👑', rarity: 'rare', desc: 'Altın işlemeli zırh.' },
  { id: 'suit_08', name: 'Ejder Zırhı', category: 'suit', ph: 78, icon: '🐉', rarity: 'epic', desc: 'Ejder derisinden yapılma.' },
  { id: 'suit_09', name: 'Gölge Zırhı', category: 'suit', ph: 112, icon: '🌑', rarity: 'legendary', desc: 'Karanlık enerjili zırh.' },
  { id: 'suit_10', name: 'Tanrı Zırhı', category: 'suit', ph: 195, icon: '🌟', rarity: 'mythic', desc: 'Mitolojik zırh seti.' },

  // --- FENER (10 adet) ---
  { id: 'lamp_01', name: 'Mum', category: 'lamp', ph: 2, icon: '🕯️', rarity: 'common', desc: 'Eski usul mum.' },
  { id: 'lamp_02', name: 'Yağ Feneri', category: 'lamp', ph: 4, icon: '🏮', rarity: 'common', desc: 'Yağ yakıtlı fener.' },
  { id: 'lamp_03', name: 'Karbür Lambası', category: 'lamp', ph: 7, icon: '💡', rarity: 'common', desc: 'Klasik karbür lambası.' },
  { id: 'lamp_04', name: 'LED Fener', category: 'lamp', ph: 13, icon: '🔦', rarity: 'uncommon', desc: 'Modern LED fener.' },
  { id: 'lamp_05', name: 'Güç Feneri', category: 'lamp', ph: 22, icon: '⚡', rarity: 'uncommon', desc: 'Yüksek güçlü fener.' },
  { id: 'lamp_06', name: 'Kristal Fener', category: 'lamp', ph: 34, icon: '✨', rarity: 'rare', desc: 'Kristal mercekli fener.' },
  { id: 'lamp_07', name: 'Plazma Lambası', category: 'lamp', ph: 48, icon: '🌀', rarity: 'rare', desc: 'Plazma enerjili lamba.' },
  { id: 'lamp_08', name: 'Alev Topağı', category: 'lamp', ph: 66, icon: '🔥', rarity: 'epic', desc: 'Büyülü alev topu.' },
  { id: 'lamp_09', name: 'Ay Işığı', category: 'lamp', ph: 95, icon: '🌙', rarity: 'legendary', desc: 'Ay enerjisi ile çalışır.' },
  { id: 'lamp_10', name: 'Güneş Kristali', category: 'lamp', ph: 170, icon: '☀️', rarity: 'mythic', desc: 'Güneşin gücünü taşır.' },

  // --- ELDIVEN (10 adet) ---
  { id: 'glove_01', name: 'Bez Eldiven', category: 'gloves', ph: 2, icon: '🧤', rarity: 'common', desc: 'Sıradan bez eldiven.' },
  { id: 'glove_02', name: 'Deri Eldiven', category: 'gloves', ph: 5, icon: '✋', rarity: 'common', desc: 'Kalın deri eldiven.' },
  { id: 'glove_03', name: 'İş Eldiveni', category: 'gloves', ph: 8, icon: '🦾', rarity: 'common', desc: 'Sağlam iş eldiveni.' },
  { id: 'glove_04', name: 'Demir Eldiven', category: 'gloves', ph: 14, icon: '⚔️', rarity: 'uncommon', desc: 'Demir plaka eldiven.' },
  { id: 'glove_05', name: 'Güç Eldiveni', category: 'gloves', ph: 23, icon: '💪', rarity: 'uncommon', desc: 'Güç artırıcı eldiven.' },
  { id: 'glove_06', name: 'Kristal Eldiven', category: 'gloves', ph: 35, icon: '💠', rarity: 'rare', desc: 'Kristal kaplı eldiven.' },
  { id: 'glove_07', name: 'Ejder Eldiveni', category: 'gloves', ph: 50, icon: '🐉', rarity: 'rare', desc: 'Ejder pençesi eldiven.' },
  { id: 'glove_08', name: 'Alev Eldiveni', category: 'gloves', ph: 68, icon: '🔥', rarity: 'epic', desc: 'Kor ateş eldiveni.' },
  { id: 'glove_09', name: 'Şimşek Eldiveni', category: 'gloves', ph: 98, icon: '⚡', rarity: 'legendary', desc: 'Şimşek enerjisi taşır.' },
  { id: 'glove_10', name: 'Tanrı Eldiveni', category: 'gloves', ph: 175, icon: '🌟', rarity: 'mythic', desc: 'Sonsuz güç taşır.' },

  // --- ÇANTA (10 adet) ---
  { id: 'bag_01', name: 'Bez Torba', category: 'bag', ph: 2, icon: '👝', rarity: 'common', desc: 'Eski bez torba.' },
  { id: 'bag_02', name: 'Deri Çanta', category: 'bag', ph: 4, icon: '👜', rarity: 'common', desc: 'Sağlam deri çanta.' },
  { id: 'bag_03', name: 'Madenci Çantası', category: 'bag', ph: 7, icon: '🎒', rarity: 'common', desc: 'Özel madenci çantası.' },
  { id: 'bag_04', name: 'Demir Çanta', category: 'bag', ph: 12, icon: '🗜️', rarity: 'uncommon', desc: 'Metal kilitli çanta.' },
  { id: 'bag_05', name: 'Büyülü Çanta', category: 'bag', ph: 20, icon: '🔮', rarity: 'uncommon', desc: 'İçi görünenden büyük.' },
  { id: 'bag_06', name: 'Kristal Çanta', category: 'bag', ph: 32, icon: '💎', rarity: 'rare', desc: 'Kristal işlemeli çanta.' },
  { id: 'bag_07', name: 'Altın Çanta', category: 'bag', ph: 46, icon: '💰', rarity: 'rare', desc: 'Altın kaplama çanta.' },
  { id: 'bag_08', name: 'Gölge Çantası', category: 'bag', ph: 63, icon: '🌑', rarity: 'epic', desc: 'Karanlığı emer.' },
  { id: 'bag_09', name: 'Efsane Çanta', category: 'bag', ph: 92, icon: '⚡', rarity: 'legendary', desc: 'Efsanevi içerik taşır.' },
  { id: 'bag_10', name: 'Evren Çantası', category: 'bag', ph: 165, icon: '🌌', rarity: 'mythic', desc: 'Evreni içinde barındırır.' },

  // --- BOTA (10 adet) ---
  { id: 'boot_01', name: 'Eski Çizme', category: 'boots', ph: 2, icon: '👢', rarity: 'common', desc: 'Yıpranmış çizme.' },
  { id: 'boot_02', name: 'İş Botu', category: 'boots', ph: 5, icon: '🥾', rarity: 'common', desc: 'Dayanıklı iş botu.' },
  { id: 'boot_03', name: 'Çelik Burunlu Bot', category: 'boots', ph: 9, icon: '👡', rarity: 'common', desc: 'Korumalı çelik burun.' },
  { id: 'boot_04', name: 'Demir Zırhlı Bot', category: 'boots', ph: 15, icon: '🛡️', rarity: 'uncommon', desc: 'Demir zırhlı bot.' },
  { id: 'boot_05', name: 'Hız Botu', category: 'boots', ph: 24, icon: '💨', rarity: 'uncommon', desc: 'Sürat kazandırır.' },
  { id: 'boot_06', name: 'Lav Botu', category: 'boots', ph: 36, icon: '🌋', rarity: 'rare', desc: 'Lavda yürüyebilir.' },
  { id: 'boot_07', name: 'Kristal Bot', category: 'boots', ph: 51, icon: '💠', rarity: 'rare', desc: 'Kristal dokunuşlu bot.' },
  { id: 'boot_08', name: 'Gök Botu', category: 'boots', ph: 72, icon: '☁️', rarity: 'epic', desc: 'Gökyüzünde yürür.' },
  { id: 'boot_09', name: 'Şimşek Botu', category: 'boots', ph: 105, icon: '⚡', rarity: 'legendary', desc: 'Işık hızında koşar.' },
  { id: 'boot_10', name: 'Tanrı Çizmesi', category: 'boots', ph: 185, icon: '🌟', rarity: 'mythic', desc: 'Tanrıların yürüyüşü.' },

  // --- KOLYE (10 adet) ---
  { id: 'necklace_01', name: 'İp Kolye', category: 'necklace', ph: 2, icon: '📿', rarity: 'common', desc: 'Basit ip kolye.' },
  { id: 'necklace_02', name: 'Bakır Kolye', category: 'necklace', ph: 4, icon: '🔗', rarity: 'common', desc: 'Bakır zincirli kolye.' },
  { id: 'necklace_03', name: 'Gümüş Kolye', category: 'necklace', ph: 8, icon: '⛓️', rarity: 'common', desc: 'Saf gümüş kolye.' },
  { id: 'necklace_04', name: 'Altın Kolye', category: 'necklace', ph: 14, icon: '✨', rarity: 'uncommon', desc: '14 ayar altın kolye.' },
  { id: 'necklace_05', name: 'Yakut Kolye', category: 'necklace', ph: 23, icon: '❤️', rarity: 'uncommon', desc: 'Yakut taşlı kolye.' },
  { id: 'necklace_06', name: 'Safir Kolye', category: 'necklace', ph: 37, icon: '💙', rarity: 'rare', desc: 'Mavi safir kolye.' },
  { id: 'necklace_07', name: 'Zümrüt Kolye', category: 'necklace', ph: 53, icon: '💚', rarity: 'rare', desc: 'Yeşil zümrüt kolye.' },
  { id: 'necklace_08', name: 'Elmas Kolye', category: 'necklace', ph: 74, icon: '💎', rarity: 'epic', desc: 'Pırlanta kolye.' },
  { id: 'necklace_09', name: 'Ruh Kolyesi', category: 'necklace', ph: 108, icon: '🔮', rarity: 'legendary', desc: 'Ruh enerjisi taşır.' },
  { id: 'necklace_10', name: 'Tanrı Kolyesi', category: 'necklace', ph: 190, icon: '🌟', rarity: 'mythic', desc: 'İlahi güç kaynağı.' },

  // --- YÜZÜK (10 adet) ---
  { id: 'ring_01', name: 'Taş Yüzük', category: 'ring', ph: 2, icon: '💍', rarity: 'common', desc: 'Sıradan taş yüzük.' },
  { id: 'ring_02', name: 'Demir Yüzük', category: 'ring', ph: 4, icon: '⭕', rarity: 'common', desc: 'Demir döküm yüzük.' },
  { id: 'ring_03', name: 'Gümüş Yüzük', category: 'ring', ph: 7, icon: '🔘', rarity: 'common', desc: 'Gümüş yüzük.' },
  { id: 'ring_04', name: 'Altın Yüzük', category: 'ring', ph: 13, icon: '💛', rarity: 'uncommon', desc: 'Saf altın yüzük.' },
  { id: 'ring_05', name: 'Yakut Yüzük', category: 'ring', ph: 21, icon: '❤️', rarity: 'uncommon', desc: 'Yakut taşlı yüzük.' },
  { id: 'ring_06', name: 'Güç Yüzüğü', category: 'ring', ph: 33, icon: '💪', rarity: 'rare', desc: 'Madenci gücü artırır.' },
  { id: 'ring_07', name: 'Kristal Yüzük', category: 'ring', ph: 47, icon: '💠', rarity: 'rare', desc: 'Kristal yüzük.' },
  { id: 'ring_08', name: 'Ejder Yüzüğü', category: 'ring', ph: 65, icon: '🐉', rarity: 'epic', desc: 'Ejder ateşi taşır.' },
  { id: 'ring_09', name: 'Ruh Yüzüğü', category: 'ring', ph: 96, icon: '🔮', rarity: 'legendary', desc: 'Sonsuz ruh enerjisi.' },
  { id: 'ring_10', name: 'Tanrı Yüzüğü', category: 'ring', ph: 160, icon: '🌟', rarity: 'mythic', desc: 'Her şeyin üzerindeki güç.' },

  // --- ÖZEL EŞYA (10 adet) ---
  { id: 'special_01', name: 'Şans Taşı', category: 'special', ph: 3, icon: '🍀', rarity: 'common', desc: 'Şans getirir.' },
  { id: 'special_02', name: 'Madenci Madalyası', category: 'special', ph: 6, icon: '🏅', rarity: 'common', desc: 'Eski madenci madalyası.' },
  { id: 'special_03', name: 'Dinamit', category: 'special', ph: 11, icon: '💣', rarity: 'uncommon', desc: 'Daha fazla kömür çıkarır.' },
  { id: 'special_04', name: 'Harita', category: 'special', ph: 18, icon: '🗺️', rarity: 'uncommon', desc: 'Gizli yatakları gösterir.' },
  { id: 'special_05', name: 'Pusula', category: 'special', ph: 28, icon: '🧭', rarity: 'rare', desc: 'Doğru yönü gösterir.' },
  { id: 'special_06', name: 'Büyü Taşı', category: 'special', ph: 42, icon: '🔮', rarity: 'rare', desc: 'Büyülü enerji taşır.' },
  { id: 'special_07', name: 'Kristal Top', category: 'special', ph: 58, icon: '🔵', rarity: 'epic', desc: 'Geleceği gösterir.' },
  { id: 'special_08', name: 'Ejder Yumurtası', category: 'special', ph: 82, icon: '🥚', rarity: 'epic', desc: 'Ejder doğacak.' },
  { id: 'special_09', name: 'Felsefe Taşı', category: 'special', ph: 120, icon: '💎', rarity: 'legendary', desc: 'Her şeyi altına çevirir.' },
  { id: 'special_10', name: 'Tanrı\'nın Armağanı', category: 'special', ph: 200, icon: '🌟', rarity: 'mythic', desc: 'En büyük güç kaynağı.' },
];

// ========== KUTU SİSTEMİ ==========
const BOXES = [
  {
    id: 'box_wood',
    name: 'Ahşap Kutu',
    icon: '📦',
    price: 500, // banknot
    color: '#8B5E3C',
    description: 'Sıradan maden kutusudur.',
    rewards: [
      { type: 'kmr', min: 500, max: 2000, chance: 50 },
      { type: 'banknot', min: 1, max: 5, chance: 25 },
      { type: 'item', rarities: ['common'], chance: 25 },
    ]
  },
  {
    id: 'box_iron',
    name: 'Demir Kutu',
    icon: '🗃️',
    price: 2000, // banknot
    color: '#607D8B',
    description: 'Daha iyi ödüller içerir.',
    rewards: [
      { type: 'kmr', min: 2000, max: 8000, chance: 30 },
      { type: 'banknot', min: 3, max: 15, chance: 25 },
      { type: 'item', rarities: ['common', 'uncommon'], chance: 45 },
    ]
  },
  {
    id: 'box_gold',
    name: 'Altın Kutu',
    icon: '🏆',
    price: 8000, // banknot
    color: '#FFD700',
    description: 'Nadir eşyalar çıkabilir!',
    rewards: [
      { type: 'kmr', min: 5000, max: 20000, chance: 20 },
      { type: 'banknot', min: 10, max: 50, chance: 20 },
      { type: 'cheque', min: 1, max: 3, chance: 10 },
      { type: 'item', rarities: ['uncommon', 'rare', 'epic'], chance: 50 },
    ]
  },
  {
    id: 'box_legend',
    name: 'Efsane Kutu',
    icon: '💠',
    price: 3, // çekip
    color: '#9C27B0',
    description: 'Efsanevi ve mitolojik eşyalar!',
    rewards: [
      { type: 'banknot', min: 100, max: 500, chance: 15 },
      { type: 'cheque', min: 2, max: 10, chance: 20 },
      { type: 'item', rarities: ['rare', 'epic', 'legendary', 'mythic'], chance: 65 },
    ]
  }
];

// ========== LİG SİSTEMİ ==========
const LEAGUES = [
  { id: 'cirak', name: 'Çırak Ligi', icon: '⛏️', minPh: 0, maxPh: 99, reward: 10, color: '#795548' },
  { id: 'amator', name: 'Amatör Ligi', icon: '🥈', minPh: 100, maxPh: 499, reward: 100, color: '#607D8B' },
  { id: 'usta', name: 'Usta Ligi', icon: '🏆', minPh: 500, maxPh: Infinity, reward: 500, color: '#FFD700' },
];

// ========== GÜNLÜK GÖREVLER ==========
const DAILY_TASKS = [
  { id: 'login', name: 'Oyuna Giriş Yap', reward: { type: 'kmr', amount: 200 }, icon: '🎯' },
  { id: 'open_box', name: 'Bir Kutu Aç', reward: { type: 'kmr', amount: 500 }, icon: '📦' },
  { id: 'visit_mine', name: 'Madeni Ziyaret Et', reward: { type: 'banknot', amount: 2 }, icon: '⛏️' },
  { id: 'check_rank', name: 'Sıralamayı Kontrol Et', reward: { type: 'kmr', amount: 300 }, icon: '🏅' },
];

// ========== BAŞARIMLAR ==========
const ACHIEVEMENTS = [
  { id: 'first_miner', name: 'İlk Madenci', desc: 'İlk madencini satın al', icon: '⛏️', reward: { type: 'banknot', amount: 5 } },
  { id: 'all_miners', name: 'Maden Patronu', desc: 'Tüm madencileri satın al', icon: '👑', reward: { type: 'cheque', amount: 1 } },
  { id: 'power_100', name: '100 PH Kulübü', desc: '100 PH güce ulaş', icon: '💪', reward: { type: 'banknot', amount: 20 } },
  { id: 'power_500', name: 'Efsane Güç', desc: '500 PH güce ulaş', icon: '⚡', reward: { type: 'cheque', amount: 2 } },
  { id: 'open_10_boxes', name: 'Kutu Meraklısı', desc: '10 kutu aç', icon: '📦', reward: { type: 'banknot', amount: 10 } },
  { id: 'top_10', name: 'İlk 10', desc: 'Sıralamada ilk 10\'a gir', icon: '🏆', reward: { type: 'cheque', amount: 1 } },
];

if (typeof module !== 'undefined') {
  module.exports = { ITEMS, BOXES, LEAGUES, DAILY_TASKS, ACHIEVEMENTS };
}
