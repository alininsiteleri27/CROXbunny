/* ===================================================
   ReisZa — Madencilik Oyunu
   app.js — Firebase, Oyun Mantığı, UI Kontrolleri
   =================================================== */

"use strict";

// ============================================================
// 1. FİREBASE YAPILANDIRMASI
// ============================================================
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

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ============================================================
// 2. OYun VERİLERİ & SABİTLER
// ============================================================

// Lig sistemi — dağıtım miktarları (Banknot)
const LIGLER = [
  { ad: "Bronz",   renk: "--bronz",   odul: 10  },
  { ad: "Gümüş",   renk: "--gumus",   odul: 20  },
  { ad: "Altın",   renk: "--altin-lig", odul: 40 },
  { ad: "Kristal", renk: "--kristal", odul: 80  },
  { ad: "Çöp",     renk: "--cop",     odul: 160 }
];

// Madenciler — güç katsayıları ve satın alma maliyetleri
const MADENCILER = [
  { id: "Beyza",  emoji: "👩‍🌾", katsayi: 2,  maliyet: 0,   birim: "baslangic", aciklama: "Varsayılan madenci" },
  { id: "Zehra",  emoji: "👩‍🔧", katsayi: 4,  maliyet: 50,  birim: "banknot",   aciklama: "İkinci kademe madenci" },
  { id: "Ayşe",   emoji: "👷‍♀️", katsayi: 6,  maliyet: 200, birim: "banknot",   aciklama: "Orta seviye madenci" },
  { id: "Mehmet", emoji: "👷",   katsayi: 8,  maliyet: 20,  birim: "altin",     aciklama: "Güçlü madenci" },
  { id: "Ali",    emoji: "⛏️",   katsayi: 10, maliyet: 80,  birim: "altin",     aciklama: "Efsanevi madenci" }
];

// Eşyalar — güç puanları (5'er artarak)
const ESYALAR = [
  { id: "su_pompasi",     ad: "Su Pompası",        emoji: "💧", guc: 5  },
  { id: "sapka",           ad: "Şapka",             emoji: "🎩", guc: 10 },
  { id: "sincap",          ad: "Sincap",            emoji: "🐿️", guc: 15 },
  { id: "boru",            ad: "Boru",              emoji: "🔧", guc: 20 },
  { id: "fener",           ad: "Fener",             emoji: "🔦", guc: 25 },
  { id: "kask",            ad: "Kask",              emoji: "⛑️", guc: 30 },
  { id: "satil",           ad: "Satıl",             emoji: "🪣", guc: 35 },
  { id: "tahta",           ad: "Tahta",             emoji: "🪵", guc: 40 },
  { id: "silikon_tabancasi", ad: "Silikon Tabancası", emoji: "🔫", guc: 45 },
  { id: "gozluk",          ad: "Gözlük",            emoji: "🥽", guc: 50 },
  { id: "vinc",            ad: "Vinç",              emoji: "🏗️", guc: 55 },
  { id: "kepce",           ad: "Kepçe",             emoji: "🦾", guc: 60 },
  { id: "tir",             ad: "Tır",               emoji: "🚛", guc: 65 }
];

// Sandıklar — ağırlıklı rastgele içerik havuzu
const SANDIKLAR = [
  {
    id: "sandik",
    ad: "Sandık",
    emoji: "📦",
    cssClass: "wooden",
    maliyet: 100,
    birim: "kurus",
    birimIcon: "🪙",
    aciklama: "Düşük seviye eşyalar ve az Kuruş içerir.",
    havuz: [
      { tip: "esya", deger: "su_pompasi",  agirlik: 35 },
      { tip: "esya", deger: "sapka",        agirlik: 25 },
      { tip: "esya", deger: "sincap",       agirlik: 15 },
      { tip: "kurus", deger: 50,            agirlik: 20 },
      { tip: "kurus", deger: 20,            agirlik: 5  }
    ]
  },
  {
    id: "demir_sandik",
    ad: "Demir Sandık",
    emoji: "🗃️",
    cssClass: "iron",
    maliyet: 300,
    birim: "kurus",
    birimIcon: "🪙",
    aciklama: "Orta kademe eşyalar ve Banknot kazanma şansı.",
    havuz: [
      { tip: "esya", deger: "boru",    agirlik: 20 },
      { tip: "esya", deger: "fener",   agirlik: 20 },
      { tip: "esya", deger: "kask",    agirlik: 15 },
      { tip: "esya", deger: "sapka",   agirlik: 15 },
      { tip: "banknot", deger: 5,      agirlik: 20 },
      { tip: "banknot", deger: 10,     agirlik: 10 }
    ]
  },
  {
    id: "celik_sandik",
    ad: "Çelik Sandık",
    emoji: "🔒",
    cssClass: "steel",
    maliyet: 50,
    birim: "banknot",
    birimIcon: "💵",
    aciklama: "İyi eşyalar ve Banknot ödülleri içerir.",
    havuz: [
      { tip: "esya", deger: "satil",    agirlik: 18 },
      { tip: "esya", deger: "tahta",    agirlik: 18 },
      { tip: "esya", deger: "gozluk",   agirlik: 10 },
      { tip: "esya", deger: "vinc",     agirlik: 8  },
      { tip: "banknot", deger: 20,      agirlik: 25 },
      { tip: "banknot", deger: 40,      agirlik: 15 },
      { tip: "kurus",   deger: 500,     agirlik: 6  }
    ]
  },
  {
    id: "mucevher_sandik",
    ad: "Mücevher Sandık",
    emoji: "💎",
    cssClass: "jewel",
    maliyet: 200,
    birim: "banknot",
    birimIcon: "💵",
    aciklama: "Nadir eşyalar ve Altın kazanma şansı!",
    havuz: [
      { tip: "esya", deger: "silikon_tabancasi", agirlik: 15 },
      { tip: "esya", deger: "vinc",              agirlik: 15 },
      { tip: "esya", deger: "kepce",             agirlik: 12 },
      { tip: "esya", deger: "tir",               agirlik: 8  },
      { tip: "altin",   deger: 1,                agirlik: 20 },
      { tip: "altin",   deger: 3,                agirlik: 10 },
      { tip: "banknot", deger: 100,              agirlik: 20 }
    ]
  },
  {
    id: "bor_sandigi",
    ad: "Bor Sandığı",
    emoji: "🌟",
    cssClass: "bor",
    maliyet: 5,
    birim: "altin",
    birimIcon: "🥇",
    aciklama: "En nadir eşyalar + bonus ödüller! Efsane kalite.",
    havuz: [
      { tip: "esya", deger: "tir",               agirlik: 20 },
      { tip: "esya", deger: "kepce",             agirlik: 18 },
      { tip: "esya", deger: "vinc",              agirlik: 15 },
      { tip: "esya", deger: "silikon_tabancasi", agirlik: 12 },
      { tip: "altin",   deger: 5,                agirlik: 18 },
      { tip: "altin",   deger: 10,               agirlik: 10 },
      { tip: "banknot", deger: 500,              agirlik: 7  }
    ]
  }
];

// Lig ödülü aralığı (ms cinsinden) — 10 dakika
const LIG_ODULU_ARALIK_MS = 10 * 60 * 1000;

// ============================================================
// 3. GLOBAL DURUM
// ============================================================
let mevcutKullanici = null;   // Firebase Auth kullanıcısı
let kullaniciVerisi = null;   // Firestore'dan gelen belge
let ligCountdownInterval = null; // Geri sayım interval'i
let firestoreUnsubscribe = null; // Canlı dinleme iptal fonksiyonu
let aktifSayfa = "home";

// ============================================================
// 4. YARDIMCI FONKSİYONLAR
// ============================================================

/**
 * Ağırlıklı listeden rastgele eleman seçer.
 * @param {Array} havuz - { deger, agirlik } dizisi
 * @returns Seçilen eleman
 */
function agirlikliRastgele(havuz) {
  const toplam = havuz.reduce((t, h) => t + h.agirlik, 0);
  let r = Math.random() * toplam;
  for (const item of havuz) {
    r -= item.agirlik;
    if (r <= 0) return item;
  }
  return havuz[havuz.length - 1];
}

/**
 * Eşya id'sinden eşya objesini döndürür.
 */
function esyaBul(id) {
  return ESYALAR.find(e => e.id === id) || null;
}

/**
 * Madenci id'sinden madenci objesini döndürür.
 */
function madenciBul(id) {
  return MADENCILER.find(m => m.id === id) || null;
}

/**
 * Güç hesapla: Madenci katsayısı × Tüm eşyaların güç toplamı
 */
function gucHesapla(veri) {
  const madenci = madenciBul(veri.madenci);
  const katsayi = madenci ? madenci.katsayi : 2;
  const esyaToplam = (veri.esyalar || []).reduce((t, esyaId) => {
    const e = esyaBul(esyaId);
    return t + (e ? e.guc : 0);
  }, 0);
  return katsayi * esyaToplam;
}

/**
 * Toast bildirimi gösterir
 */
function toast(mesaj, tip = "info", sure = 3000) {
  const container = document.getElementById("toast-container");
  const ikonMap = { success: "✅", error: "❌", info: "⛏️", gold: "🥇" };
  const t = document.createElement("div");
  t.className = `toast ${tip}`;
  t.innerHTML = `<span>${ikonMap[tip] || "ℹ️"}</span><span>${mesaj}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.remove(); }, sure);
}

/**
 * Ligden lig objesini döndürür
 */
function ligBul(ligAdi) {
  return LIGLER.find(l => l.ad === ligAdi) || LIGLER[0];
}

/**
 * Sayıyı kısalt (1000 → 1K, 1000000 → 1M)
 */
function formatSayi(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// ============================================================
// 5. FİRESTORE İŞLEMLERİ
// ============================================================

/**
 * Kullanıcı verisini Firestore'a kaydet (güncelle)
 */
async function veriGuncelle(uid, data) {
  try {
    await db.collection("kullanicilar").doc(uid).update(data);
  } catch (e) {
    console.error("Veri güncelleme hatası:", e);
    throw e;
  }
}

/**
 * Yeni kullanıcı belgesi oluştur
 */
async function kullaniciBelgesiOlustur(uid, email, username) {
  const now = firebase.firestore.Timestamp.now();
  const yeniVeri = {
    uid,
    email,
    username,
    lig: "Bronz",
    altin: 0,
    banknot: 10,
    kurus: 0,
    madenci: "Beyza",
    esyalar: [],
    guc: 0,
    sonOdul: now,
    kayitTarihi: now
  };
  await db.collection("kullanicilar").doc(uid).set(yeniVeri);
  return yeniVeri;
}

/**
 * Kullanıcı verisini gerçek zamanlı dinle
 */
function kullaniciyiDinle(uid) {
  // Önceki dinlemeyi iptal et
  if (firestoreUnsubscribe) firestoreUnsubscribe();

  firestoreUnsubscribe = db.collection("kullanicilar").doc(uid)
    .onSnapshot(snap => {
      if (snap.exists) {
        kullaniciVerisi = snap.data();
        uiGuncelle();
      }
    }, err => {
      console.error("Dinleme hatası:", err);
    });
}

// ============================================================
// 6. KİMLİK DOĞRULAMA (AUTH)
// ============================================================

// Auth durumu değişince çalışır
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Giriş yapıldı
    mevcutKullanici = user;
    const snap = await db.collection("kullanicilar").doc(user.uid).get();
    if (!snap.exists) {
      // Belge yoksa oluştur (Google ile girişte)
      kullaniciVerisi = await kullaniciBelgesiOlustur(user.uid, user.email, user.displayName || "Madenci");
    } else {
      kullaniciVerisi = snap.data();
    }
    kullaniciyiDinle(user.uid);
    authEkranGizle();
    ligOduluKontrol();
    ligGeriSayimBaslat();
    authPartikullerDurdur();
  } else {
    // Çıkış yapıldı
    mevcutKullanici = null;
    kullaniciVerisi = null;
    if (firestoreUnsubscribe) firestoreUnsubscribe();
    if (ligCountdownInterval) clearInterval(ligCountdownInterval);
    authEkranGoster();
    authPartikullerBaslat();
  }
});

// Giriş yap
document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");
  errEl.textContent = "";

  if (!email || !pass) { errEl.textContent = "E-posta ve şifre gerekli."; return; }

  try {
    document.getElementById("btn-login").textContent = "⏳ Giriliyor...";
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (e) {
    errEl.textContent = "Giriş başarısız: " + turkceleFirebaseHata(e.code);
    document.getElementById("btn-login").textContent = "⛏️ Madene Gir";
  }
});

// Kayıt ol
document.getElementById("btn-register").addEventListener("click", async () => {
  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const pass = document.getElementById("reg-password").value;
  const errEl = document.getElementById("register-error");
  errEl.textContent = "";

  if (!username || !email || !pass) { errEl.textContent = "Tüm alanları doldur."; return; }
  if (username.length < 3) { errEl.textContent = "Kullanıcı adı en az 3 karakter olmalı."; return; }
  if (pass.length < 6) { errEl.textContent = "Şifre en az 6 karakter olmalı."; return; }

  try {
    document.getElementById("btn-register").textContent = "⏳ Kaydediliyor...";
    const kred = await auth.createUserWithEmailAndPassword(email, pass);
    await kullaniciBelgesiOlustur(kred.user.uid, email, username);
    toast("Hoş geldin, " + username + "! 🎉", "success");
  } catch (e) {
    errEl.textContent = turkceleFirebaseHata(e.code);
    document.getElementById("btn-register").textContent = "🪙 Madenci Ol";
  }
});

// Çıkış yap
document.getElementById("btn-logout").addEventListener("click", async () => {
  await auth.signOut();
  toast("Güvenle çıkış yapıldı.", "info");
});

// Form geçişleri
document.getElementById("show-register").addEventListener("click", () => {
  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("register-form").classList.remove("hidden");
});
document.getElementById("show-login").addEventListener("click", () => {
  document.getElementById("register-form").classList.add("hidden");
  document.getElementById("login-form").classList.remove("hidden");
});

// Firebase hata kodlarını Türkçeleştir
function turkceleFirebaseHata(kod) {
  const hatalar = {
    "auth/user-not-found": "Bu e-posta ile kayıtlı kullanıcı yok.",
    "auth/wrong-password": "Yanlış şifre.",
    "auth/email-already-in-use": "Bu e-posta zaten kayıtlı.",
    "auth/invalid-email": "Geçersiz e-posta adresi.",
    "auth/weak-password": "Şifre çok zayıf.",
    "auth/network-request-failed": "Ağ bağlantısı hatası.",
    "auth/too-many-requests": "Çok fazla deneme. Lütfen bekle.",
    "auth/invalid-credential": "Geçersiz kimlik bilgisi. Şifreni kontrol et."
  };
  return hatalar[kod] || "Bilinmeyen hata: " + kod;
}

// ============================================================
// 7. AUTH EKRANI & PARTİKÜLLER
// ============================================================

function authEkranGizle() {
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

function authEkranGoster() {
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

// Partiküller (auth ekranı arka planı)
let authParticleInterval = null;

function authPartikullerBaslat() {
  const container = document.getElementById("auth-particles");
  container.innerHTML = "";
  // 30 adet partiküll oluştur
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "auth-particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.setProperty("--dur", (Math.random() * 8 + 5) + "s");
    p.style.setProperty("--delay", (Math.random() * 8) + "s");
    // Rastgele renk: gold / accent / kurus
    const renkler = ["#f5c842", "#e87c2a", "#a0a0b0", "#4caf82"];
    p.style.background = renkler[Math.floor(Math.random() * renkler.length)];
    p.style.width = (Math.random() * 5 + 2) + "px";
    p.style.height = p.style.width;
    container.appendChild(p);
  }
}

function authPartikullerDurdur() {
  const container = document.getElementById("auth-particles");
  container.innerHTML = "";
}

// ============================================================
// 8. UI GÜNCELLEME — ANA FONKSİYON
// ============================================================

function uiGuncelle() {
  if (!kullaniciVerisi) return;
  const v = kullaniciVerisi;

  // Güncelle: Topbar
  document.getElementById("val-altin").textContent = formatSayi(v.altin || 0);
  document.getElementById("val-banknot").textContent = formatSayi(v.banknot || 0);
  document.getElementById("val-kurus").textContent = formatSayi(v.kurus || 0);

  const ligAdiBadge = document.getElementById("topbar-lig");
  ligAdiBadge.textContent = v.lig;
  ligAdiBadge.className = "lig-badge " + v.lig;

  const avatar = document.getElementById("topbar-avatar");
  avatar.textContent = (v.username || "M").charAt(0).toUpperCase();

  // Aktif sayfayı yenile
  switch (aktifSayfa) {
    case "home":       anaSayfaGuncelle(); break;
    case "village":    koyGuncelle(); break;
    case "inventory":  envanterGuncelle(); break;
    case "market":     marketGuncelle(); break;
    case "profile":    profilGuncelle(); break;
    case "leaderboard": siralamaSayfaGuncelle(); break;
  }
}

// ============================================================
// 9. ANASAYFA
// ============================================================

function anaSayfaGuncelle() {
  if (!kullaniciVerisi) return;
  const v = kullaniciVerisi;

  // Hoş geldin
  document.getElementById("home-welcome").textContent =
    "Hoş geldin, " + (v.username || "Madenci") + "!";

  // Güç
  const guc = gucHesapla(v);
  document.getElementById("home-guc").textContent = formatSayi(guc);

  // Güç formülü
  const madenci = madenciBul(v.madenci);
  const esyaToplam = (v.esyalar || []).reduce((t, id) => {
    const e = esyaBul(id);
    return t + (e ? e.guc : 0);
  }, 0);
  if (esyaToplam > 0 && madenci) {
    document.getElementById("home-formula").textContent =
      `${madenci.id} (×${madenci.katsayi}) × ${esyaToplam} eşya gücü = ${guc}`;
  } else {
    document.getElementById("home-formula").textContent = "Eşya yokken güç hesaplanamaz.";
  }

  // Aktif madenci
  if (madenci) {
    document.getElementById("home-miner-avatar").textContent = madenci.emoji;
    document.getElementById("home-miner-name").textContent = madenci.id;
    document.getElementById("home-miner-coeff").textContent = `Katsayı: ×${madenci.katsayi}`;
  }

  // Lig & geri sayım info
  const lig = ligBul(v.lig);
  document.getElementById("countdown-lig-name").textContent = v.lig + " Ligi";
  document.getElementById("countdown-reward-info").textContent =
    `${lig.odul} Banknot kazanacaksın`;

  // Lig listesi
  const listEl = document.getElementById("league-badges-list");
  listEl.innerHTML = "";
  LIGLER.forEach(l => {
    const row = document.createElement("div");
    row.className = "league-badge-row" + (l.ad === v.lig ? " active-lig" : "");
    row.innerHTML = `
      <span class="lb-name" style="color: var(${l.renk})">${l.ad}</span>
      <span class="lb-reward">+${l.odul} Banknot / 10dk</span>
    `;
    listEl.appendChild(row);
  });
}

// ============================================================
// 10. LİG ÖDÜLÜ SİSTEMİ
// ============================================================

let geriSayimKalan = 0;
const TOPLAM_SURE = LIG_ODULU_ARALIK_MS;

/**
 * Ligdeki oyuncular arasında ödülü dağıt.
 * Kendi payını hesapla ve güncelle.
 */
async function ligOduluDagit(ligOdulMiktari) {
  if (!mevcutKullanici || !kullaniciVerisi) return;

  try {
    // Aynı ligdeki oyuncuları çek, güce göre sırala
    const snapshot = await db.collection("kullanicilar")
      .where("lig", "==", kullaniciVerisi.lig)
      .get();

    const oyuncular = snapshot.docs.map(d => d.data());
    const toplamGuc = oyuncular.reduce((t, o) => t + (o.guc || 0), 0);

    let kisiselOdul = 0;
    if (toplamGuc === 0) {
      // Güç yoksa eşit paylaşım
      kisiselOdul = Math.floor(ligOdulMiktari / Math.max(oyuncular.length, 1));
    } else {
      const kendi = oyuncular.find(o => o.uid === mevcutKullanici.uid);
      const kendiGuc = kendi ? (kendi.guc || 0) : 0;
      kisiselOdul = Math.floor((kendiGuc / toplamGuc) * ligOdulMiktari);
    }

    // Minimum 1 banknot garanti
    kisiselOdul = Math.max(kisiselOdul, 1);

    const now = firebase.firestore.Timestamp.now();
    await veriGuncelle(mevcutKullanici.uid, {
      banknot: firebase.firestore.FieldValue.increment(kisiselOdul),
      sonOdul: now
    });

    // Bildirim göster
    ligOduluBildirimGoster(kisiselOdul, kullaniciVerisi.lig);

  } catch (e) {
    console.error("Lig ödülü dağıtım hatası:", e);
  }
}

/**
 * Sayfa yüklendiğinde veya kullanıcı girince ödül zamanını kontrol et.
 * Kaçırılmış ödül varsa hemen ver.
 */
async function ligOduluKontrol() {
  if (!kullaniciVerisi) return;

  const sonOdul = kullaniciVerisi.sonOdul;
  if (!sonOdul) return;

  const gecen = Date.now() - sonOdul.toMillis();
  if (gecen >= LIG_ODULU_ARALIK_MS) {
    // Ödül zamanı geçmiş, hemen ver
    const lig = ligBul(kullaniciVerisi.lig);
    await ligOduluDagit(lig.odul);
  }
}

/**
 * Her saniye güncellenen geri sayım
 */
function ligGeriSayimBaslat() {
  if (ligCountdownInterval) clearInterval(ligCountdownInterval);

  function geriSayimGuncelle() {
    if (!kullaniciVerisi) return;

    const sonOdul = kullaniciVerisi.sonOdul;
    if (!sonOdul) return;

    const gecen = Date.now() - sonOdul.toMillis();
    const kalan = LIG_ODULU_ARALIK_MS - gecen;

    if (kalan <= 0) {
      // Ödül zamanı geldi
      const lig = ligBul(kullaniciVerisi.lig);
      ligOduluDagit(lig.odul);
      // sonOdul Firestore'da güncelleneceği için dinleyici halledecek
      return;
    }

    geriSayimKalan = kalan;

    const dakika = Math.floor(kalan / 60000);
    const saniye = Math.floor((kalan % 60000) / 1000);
    const formatli = String(dakika).padStart(2, "0") + ":" + String(saniye).padStart(2, "0");

    const timerEl = document.getElementById("countdown-timer");
    const barEl = document.getElementById("countdown-bar");

    if (timerEl) timerEl.textContent = formatli;
    if (barEl) {
      const yuzde = (kalan / TOPLAM_SURE) * 100;
      barEl.style.width = yuzde + "%";
    }
  }

  ligCountdownInterval = setInterval(geriSayimGuncelle, 1000);
  geriSayimGuncelle(); // Hemen çalıştır
}

/**
 * Animasyonlu lig ödülü bildirimi
 */
function ligOduluBildirimGoster(miktar, ligAdi) {
  const overlay = document.getElementById("league-reward-overlay");
  const amountEl = document.getElementById("reward-amount-display");
  const ligEl = document.getElementById("reward-lig-display");
  const coinRain = document.getElementById("coin-rain");

  amountEl.textContent = "+" + miktar + " Banknot";
  ligEl.textContent = ligAdi + " Ligi";

  // Coin yağmuru oluştur
  coinRain.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    const coin = document.createElement("span");
    coin.className = "falling-coin";
    coin.textContent = "💵";
    coin.style.left = Math.random() * 100 + "%";
    coin.style.setProperty("--dur", (Math.random() * 1.5 + 0.8) + "s");
    coin.style.setProperty("--delay", (Math.random() * 1.5) + "s");
    coinRain.appendChild(coin);
  }

  overlay.classList.remove("hidden");
  toast(`🏆 Lig ödülü! +${miktar} Banknot kazandın!`, "gold", 4000);
}

document.getElementById("reward-close-btn").addEventListener("click", () => {
  document.getElementById("league-reward-overlay").classList.add("hidden");
});

// ============================================================
// 11. KÖY SAYFASI (MADENCİLER)
// ============================================================

function koyGuncelle() {
  if (!kullaniciVerisi) return;
  const v = kullaniciVerisi;

  // Aktif madenci büyük kartı
  const madenci = madenciBul(v.madenci);
  const activeBig = document.getElementById("active-miner-big");
  if (madenci && activeBig) {
    activeBig.innerHTML = `
      <div class="active-miner-emoji">${madenci.emoji}</div>
      <div class="active-miner-info">
        <div class="active-miner-title">⚡ Aktif Madenci</div>
        <div class="active-miner-name-big">${madenci.id}</div>
        <div style="color: var(--text-dim); font-size:0.85rem; margin-top:4px;">${madenci.aciklama}</div>
        <div class="active-miner-coeff-badge">×${madenci.katsayi} Katsayı</div>
      </div>
    `;
  }

  // Madenciler grid
  const grid = document.getElementById("miners-grid");
  grid.innerHTML = "";

  MADENCILER.forEach(m => {
    const isActive = v.madenci === m.id;
    // Sahip olunan madenciler: aktif madenci + daha önce satın alınanlar
    // Basit kural: katsayısı aktif madenciden düşük olanlar zaten "sahip olunan" sayılır
    const aktifMadenci = madenciBul(v.madenci);
    const isOwned = isActive || (m.katsayi < (aktifMadenci ? aktifMadenci.katsayi : 2));

    const card = document.createElement("div");
    card.className = `miner-card ${m.id}${isActive ? " active-miner" : ""}${isOwned ? " owned" : " locked"}`;

    let badge = "";
    if (isActive) badge = `<div class="miner-card-badge badge-active">✅ Aktif</div>`;
    else if (isOwned) badge = `<div class="miner-card-badge badge-owned">🔓 Sahipsin</div>`;
    else badge = `<div class="miner-card-badge badge-locked">🔒 Kilitli</div>`;

    let butonHTML = "";
    if (isActive) {
      butonHTML = `<button class="btn-secondary miner-buy-btn" disabled>Aktif Madenci</button>`;
    } else if (isOwned) {
      butonHTML = `<button class="btn-banknot miner-buy-btn" onclick="madenciSecile('${m.id}')">⚙️ Seç</button>`;
    } else {
      const birimSimge = m.birim === "altin" ? "🥇" : "💵";
      const birimAdi = m.birim === "altin" ? "Altın" : "Banknot";
      butonHTML = `<button class="btn-primary miner-buy-btn" onclick="madenciSatinAl('${m.id}')">
        Satın Al<br>${birimSimge} ${m.maliyet} ${birimAdi}
      </button>`;
    }

    card.innerHTML = `
      <span class="miner-card-emoji">${m.emoji}</span>
      <div class="miner-card-name">${m.id}</div>
      <div class="miner-card-coeff">Güç Katsayısı: ×${m.katsayi}</div>
      ${badge}
      ${butonHTML}
    `;
    grid.appendChild(card);
  });
}

/**
 * Madenci seç (sahip olunuyorsa)
 */
async function madenciSecile(madenciId) {
  if (!mevcutKullanici) return;
  try {
    const yeniGuc = gucHesapla({ ...kullaniciVerisi, madenci: madenciId });
    await veriGuncelle(mevcutKullanici.uid, { madenci: madenciId, guc: yeniGuc });
    toast(`${madenciId} aktif madenci seçildi! ⛏️`, "success");
  } catch (e) {
    toast("Madenci seçilemedi: " + e.message, "error");
  }
}

/**
 * Madenci satın al
 */
async function madenciSatinAl(madenciId) {
  if (!mevcutKullanici || !kullaniciVerisi) return;
  const m = madenciBul(madenciId);
  if (!m) return;

  const v = kullaniciVerisi;

  // Bakiye kontrolü
  if (m.birim === "altin" && v.altin < m.maliyet) {
    toast(`Yeterli Altın yok! Gerekli: ${m.maliyet} 🥇`, "error"); return;
  }
  if (m.birim === "banknot" && v.banknot < m.maliyet) {
    toast(`Yeterli Banknot yok! Gerekli: ${m.maliyet} 💵`, "error"); return;
  }

  try {
    const guncelleme = { madenci: madenciId };
    if (m.birim === "altin") guncelleme.altin = firebase.firestore.FieldValue.increment(-m.maliyet);
    if (m.birim === "banknot") guncelleme.banknot = firebase.firestore.FieldValue.increment(-m.maliyet);

    // Güç hesapla
    const yeniGuc = gucHesapla({ ...v, madenci: madenciId });
    guncelleme.guc = yeniGuc;

    await veriGuncelle(mevcutKullanici.uid, guncelleme);
    toast(`${m.id} satın alındı ve aktif edildi! 🎉`, "success");
  } catch (e) {
    toast("Satın alma başarısız: " + e.message, "error");
  }
}

// ============================================================
// 12. ENVANTER SAYFASI
// ============================================================

function envanterGuncelle() {
  if (!kullaniciVerisi) return;
  const v = kullaniciVerisi;
  const esyalar = v.esyalar || [];
  const madenci = madenciBul(v.madenci);
  const katsayi = madenci ? madenci.katsayi : 2;

  // Eşya güç toplamı
  const esyaToplam = esyalar.reduce((t, id) => {
    const e = esyaBul(id);
    return t + (e ? e.guc : 0);
  }, 0);

  const finalGuc = katsayi * esyaToplam;

  document.getElementById("inv-total-item-power").textContent = esyaToplam;
  document.getElementById("inv-miner-coeff").textContent = `×${katsayi}`;
  document.getElementById("inv-final-power").textContent = formatSayi(finalGuc);

  const grid = document.getElementById("inventory-grid");
  grid.innerHTML = "";

  if (esyalar.length === 0) {
    grid.innerHTML = `<div class="inv-empty">Henüz bir eşyan yok.<br>Market'e git ve sandık aç!</div>`;
    return;
  }

  // Eşyaları say (tekrar eden eşyalar için)
  const esyaSayim = {};
  esyalar.forEach(id => { esyaSayim[id] = (esyaSayim[id] || 0) + 1; });

  Object.entries(esyaSayim).forEach(([id, adet]) => {
    const e = esyaBul(id);
    if (!e) return;
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <span class="item-card-emoji">${e.emoji}</span>
      <div class="item-card-name">${e.ad}${adet > 1 ? ` (×${adet})` : ""}</div>
      <div class="item-card-power">⚡ ${e.guc}</div>
    `;
    grid.appendChild(card);
  });
}

// ============================================================
// 13. MARKET SAYFASI & SANDIK SİSTEMİ
// ============================================================

function marketGuncelle() {
  const grid = document.getElementById("chests-grid");
  grid.innerHTML = "";

  SANDIKLAR.forEach(sandik => {
    const card = document.createElement("div");
    card.className = `chest-card ${sandik.cssClass}`;

    // Birim görüntüsü
    const birimClass = sandik.birim === "altin" ? "gold" :
                       sandik.birim === "banknot" ? "banknot" : "kurus";

    card.innerHTML = `
      <div class="chest-header">
        <div class="chest-emoji">${sandik.emoji}</div>
        <div class="chest-info">
          <div class="chest-name">${sandik.ad}</div>
          <div class="chest-cost ${birimClass}">${sandik.birimIcon} ${sandik.maliyet} ${sandik.birim === "altin" ? "Altın" : sandik.birim === "banknot" ? "Banknot" : "Kuruş"}</div>
        </div>
      </div>
      <div class="chest-contents">
        <strong>İçerik:</strong> ${sandik.aciklama}
      </div>
      <button class="btn-primary chest-buy-btn" onclick="sandikAc('${sandik.id}')">
        ${sandik.emoji} Aç — ${sandik.birimIcon} ${sandik.maliyet}
      </button>
    `;
    grid.appendChild(card);
  });
}

/**
 * Sandık açma işlemi
 */
async function sandikAc(sandikId) {
  if (!mevcutKullanici || !kullaniciVerisi) return;
  const sandik = SANDIKLAR.find(s => s.id === sandikId);
  if (!sandik) return;

  const v = kullaniciVerisi;

  // Bakiye kontrolü
  if (sandik.birim === "altin" && v.altin < sandik.maliyet) {
    toast(`Yeterli Altın yok! Gerekli: ${sandik.maliyet} 🥇`, "error"); return;
  }
  if (sandik.birim === "banknot" && v.banknot < sandik.maliyet) {
    toast(`Yeterli Banknot yok! Gerekli: ${sandik.maliyet} 💵`, "error"); return;
  }
  if (sandik.birim === "kurus" && v.kurus < sandik.maliyet) {
    toast(`Yeterli Kuruş yok! Gerekli: ${sandik.maliyet} 🪙`, "error"); return;
  }

  // Modalı aç
  sandikModalAc(sandik.emoji);

  // Ödülü belirle
  const kazanim = agirlikliRastgele(sandik.havuz);

  // Kısa gecikme sonra sonucu göster (animasyon için)
  setTimeout(async () => {
    let guncelleme = {};

    // Ödeme
    if (sandik.birim === "altin")   guncelleme.altin   = firebase.firestore.FieldValue.increment(-sandik.maliyet);
    if (sandik.birim === "banknot") guncelleme.banknot = firebase.firestore.FieldValue.increment(-sandik.maliyet);
    if (sandik.birim === "kurus")   guncelleme.kurus   = firebase.firestore.FieldValue.increment(-sandik.maliyet);

    let sonucIkon = "🎁";
    let sonucAd = "";
    let sonucAciklama = "";
    let isDuplicate = false;

    if (kazanim.tip === "esya") {
      const esya = esyaBul(kazanim.deger);
      const mevcutEsyalar = v.esyalar || [];

      if (mevcutEsyalar.includes(kazanim.deger)) {
        // Duplicate — eşya gücü kadar kuruş ver
        isDuplicate = true;
        guncelleme.kurus = firebase.firestore.FieldValue.increment(esya.guc);
        sonucIkon = "🪙";
        sonucAd = "Tekrar " + esya.ad;
        sonucAciklama = `Zaten sahipsin! +${esya.guc} Kuruş aldın.`;
      } else {
        // Yeni eşya ekle
        guncelleme.esyalar = firebase.firestore.FieldValue.arrayUnion(kazanim.deger);
        // Güç yeniden hesapla
        const yeniEsyalar = [...mevcutEsyalar, kazanim.deger];
        const yeniGuc = gucHesapla({ ...v, esyalar: yeniEsyalar });
        guncelleme.guc = yeniGuc;
        sonucIkon = esya.emoji;
        sonucAd = esya.ad;
        sonucAciklama = `Yeni eşya! +${esya.guc} güç puanı.`;
      }
    } else if (kazanim.tip === "altin") {
      guncelleme.altin = firebase.firestore.FieldValue.increment(kazanim.deger);
      sonucIkon = "🥇";
      sonucAd = `+${kazanim.deger} Altın`;
      sonucAciklama = "Değerli kazanım!";
    } else if (kazanim.tip === "banknot") {
      guncelleme.banknot = firebase.firestore.FieldValue.increment(kazanim.deger);
      sonucIkon = "💵";
      sonucAd = `+${kazanim.deger} Banknot`;
      sonucAciklama = "İyi kazanım!";
    } else if (kazanim.tip === "kurus") {
      guncelleme.kurus = firebase.firestore.FieldValue.increment(kazanim.deger);
      sonucIkon = "🪙";
      sonucAd = `+${kazanim.deger} Kuruş`;
      sonucAciklama = "Biraz Kuruş kazandın.";
    }

    try {
      await veriGuncelle(mevcutKullanici.uid, guncelleme);
      sandikSonucGoster(sonucIkon, sonucAd, sonucAciklama);
    } catch (e) {
      toast("Sandık açma hatası: " + e.message, "error");
      sandikModalKapat();
    }
  }, 1200);
}

function sandikModalAc(emoji) {
  const modal = document.getElementById("chest-modal");
  const animEl = document.getElementById("chest-open-emoji");
  const resultEl = document.getElementById("chest-result");
  const closeBtn = document.getElementById("chest-close-btn");

  animEl.textContent = emoji;
  animEl.className = "chest-emoji-anim";
  resultEl.classList.add("hidden");
  closeBtn.classList.add("hidden");
  document.getElementById("chest-open-anim").style.display = "block";
  modal.classList.remove("hidden");
}

function sandikSonucGoster(ikon, ad, aciklama) {
  const animDiv = document.getElementById("chest-open-anim");
  const resultEl = document.getElementById("chest-result");
  const closeBtn = document.getElementById("chest-close-btn");

  // Patlama efekti
  animDiv.style.display = "none";
  document.getElementById("chest-result-icon").textContent = ikon;
  document.getElementById("chest-result-name").textContent = ad;
  document.getElementById("chest-result-desc").textContent = aciklama;

  resultEl.classList.remove("hidden");
  closeBtn.classList.remove("hidden");
}

function sandikModalKapat() {
  document.getElementById("chest-modal").classList.add("hidden");
  document.getElementById("chest-open-anim").style.display = "block";
}

document.getElementById("chest-close-btn").addEventListener("click", sandikModalKapat);
document.getElementById("chest-modal-overlay").addEventListener("click", sandikModalKapat);

// ============================================================
// 14. PROFİL SAYFASI
// ============================================================

async function profilGuncelle() {
  if (!kullaniciVerisi) return;
  const v = kullaniciVerisi;

  const ilkHarf = (v.username || "M").charAt(0).toUpperCase();
  document.getElementById("profile-avatar-char").textContent = ilkHarf;
  document.getElementById("profile-username").textContent = v.username || "Madenci";
  document.getElementById("profile-email").textContent = v.email || "—";

  const ligBadge = document.getElementById("profile-lig-badge");
  ligBadge.textContent = v.lig;
  ligBadge.className = "profile-lig-badge lig-badge " + v.lig;

  document.getElementById("pstat-guc").textContent = formatSayi(v.guc || 0);
  document.getElementById("pstat-madenci").textContent = v.madenci || "Beyza";

  // Lig sırası ve genel sıra (async)
  try {
    // Lig sırası
    const ligSnap = await db.collection("kullanicilar")
      .where("lig", "==", v.lig)
      .orderBy("guc", "desc")
      .get();

    const ligOyuncular = ligSnap.docs.map(d => d.id);
    const ligSira = ligOyuncular.indexOf(mevcutKullanici.uid) + 1;
    document.getElementById("pstat-lig-rank").textContent = ligSira > 0 ? `#${ligSira}` : "—";

    // Genel sıra
    const genelSnap = await db.collection("kullanicilar")
      .orderBy("guc", "desc")
      .get();

    const genelOyuncular = genelSnap.docs.map(d => d.id);
    const genelSira = genelOyuncular.indexOf(mevcutKullanici.uid) + 1;
    document.getElementById("pstat-global-rank").textContent = genelSira > 0 ? `#${genelSira}` : "—";

  } catch (e) {
    console.error("Sıralama çekme hatası:", e);
  }
}

// ============================================================
// 15. SIRALAMA (LEADERBOARD)
// ============================================================

let aktifLbTab = "my"; // "my" veya "all"

document.getElementById("lb-tab-my").addEventListener("click", () => {
  aktifLbTab = "my";
  document.getElementById("lb-tab-my").classList.add("active");
  document.getElementById("lb-tab-all").classList.remove("active");
  siralamaYukle();
});

document.getElementById("lb-tab-all").addEventListener("click", () => {
  aktifLbTab = "all";
  document.getElementById("lb-tab-all").classList.add("active");
  document.getElementById("lb-tab-my").classList.remove("active");
  siralamaYukle();
});

async function siralamaYukle() {
  if (!kullaniciVerisi) return;

  const listEl = document.getElementById("leaderboard-list");
  listEl.innerHTML = `<div class="loading-spinner"><div class="spinner"></div> Yükleniyor...</div>`;

  try {
    let sorgu;
    if (aktifLbTab === "my") {
      sorgu = db.collection("kullanicilar")
        .where("lig", "==", kullaniciVerisi.lig)
        .orderBy("guc", "desc")
        .limit(50);
    } else {
      sorgu = db.collection("kullanicilar")
        .orderBy("guc", "desc")
        .limit(50);
    }

    const snap = await sorgu.get();
    listEl.innerHTML = "";

    if (snap.empty) {
      listEl.innerHTML = `<div class="inv-empty">Henüz kayıtlı oyuncu yok.</div>`;
      return;
    }

    snap.docs.forEach((doc, idx) => {
      const o = doc.data();
      const sira = idx + 1;
      const benim = doc.id === mevcutKullanici.uid;

      const row = document.createElement("div");
      row.className = "lb-row" + (benim ? " me" : "");

      let siraClass = "";
      if (sira === 1) siraClass = "top1";
      else if (sira === 2) siraClass = "top2";
      else if (sira === 3) siraClass = "top3";

      const siraSimge = sira === 1 ? "🥇" : sira === 2 ? "🥈" : sira === 3 ? "🥉" : `#${sira}`;

      row.innerHTML = `
        <div class="lb-rank ${siraClass}">${siraSimge}</div>
        <div class="lb-avatar">${(o.username || "?").charAt(0).toUpperCase()}</div>
        <div class="lb-info">
          <div class="lb-name">${o.username || "Bilinmeyen"}${benim ? " (Sen)" : ""}</div>
          <div class="lb-lig">${o.lig || "Bronz"}</div>
        </div>
        <div class="lb-power">⚡ ${formatSayi(o.guc || 0)}</div>
      `;
      listEl.appendChild(row);
    });
  } catch (e) {
    listEl.innerHTML = `<div class="inv-empty">Sıralama yüklenemedi. Firestore indeksi gerekebilir.</div>`;
    console.error("Sıralama hatası:", e);
  }
}

function siralamaSayfaGuncelle() {
  siralamaYukle();
}

// ============================================================
// 16. NAVİGASYON
// ============================================================

document.getElementById("bottom-nav").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-btn");
  if (!btn) return;
  const sayfa = btn.dataset.page;
  if (!sayfa) return;

  sayfayaGit(sayfa);
});

function sayfayaGit(sayfa) {
  // Aktif sayfayı kaldır
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  // Yeni sayfayı aktif et
  const pageEl = document.getElementById("page-" + sayfa);
  const navEl = document.getElementById("nav-" + sayfa);
  if (pageEl) pageEl.classList.add("active");
  if (navEl) navEl.classList.add("active");

  aktifSayfa = sayfa;

  // Sayfa yükle
  switch (sayfa) {
    case "home":       anaSayfaGuncelle(); break;
    case "village":    koyGuncelle(); break;
    case "inventory":  envanterGuncelle(); break;
    case "market":     marketGuncelle(); break;
    case "profile":    profilGuncelle(); break;
    case "leaderboard": siralamaSayfaGuncelle(); break;
  }

  // Scroll to top
  document.getElementById("main-content").scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// 17. GLOBAL FONKSIYON HALE GETİR (HTML onclick için)
// ============================================================
window.madenciSatinAl = madenciSatinAl;
window.madenciSecile = madenciSecile;
window.sandikAc = sandikAc;

// ============================================================
// 18. BAŞLATMA
// ============================================================

// Auth partiküllerini başlat (sayfa ilk yüklendiğinde)
authPartikullerBaslat();

// Market sayfasını başlangıçta yükle (içerik statik)
// (kullanıcı giriş yaptığında zaten marketGuncelle çağrılacak)

console.log(
  "%c⛏️ ReisZa%c — Madencilik Oyunu Başlatıldı",
  "color: #f5c842; font-size: 20px; font-weight: bold; font-family: serif;",
  "color: #e87c2a; font-size: 14px;"
);
