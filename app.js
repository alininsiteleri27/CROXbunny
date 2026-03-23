"use strict";
// ============================================================
// ReisZa — app.js
// Firebase Auth + Firestore + Oyun Mantığı
// ============================================================

// ── Firebase Yapılandırma ──
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ============================================================
// SABİTLER
// ============================================================
const LIGLER = [
  { ad:"Bronz",   renk:"--bronz",     odul:10  },
  { ad:"Gümüş",   renk:"--gumus",     odul:20  },
  { ad:"Altın",   renk:"--altin-lig", odul:40  },
  { ad:"Kristal", renk:"--kristal",   odul:80  },
  { ad:"Çöp",     renk:"--cop",       odul:160 }
];

const MADENCILER = [
  { id:"Beyza",  emoji:"👩‍🌾", katsayi:2,  maliyet:0,   birim:"baslangic" },
  { id:"Zehra",  emoji:"👩‍🔧", katsayi:4,  maliyet:50,  birim:"banknot"  },
  { id:"Ayşe",   emoji:"👷‍♀️", katsayi:6,  maliyet:200, birim:"banknot"  },
  { id:"Mehmet", emoji:"👷",   katsayi:8,  maliyet:20,  birim:"altin"    },
  { id:"Ali",    emoji:"⛏️",   katsayi:10, maliyet:80,  birim:"altin"    }
];

const ESYALAR = [
  { id:"su_pompasi",        ad:"Su Pompası",         emoji:"💧", guc:5  },
  { id:"sapka",             ad:"Şapka",              emoji:"🎩", guc:10 },
  { id:"sincap",            ad:"Sincap",             emoji:"🐿️", guc:15 },
  { id:"boru",              ad:"Boru",               emoji:"🔧", guc:20 },
  { id:"fener",             ad:"Fener",              emoji:"🔦", guc:25 },
  { id:"kask",              ad:"Kask",               emoji:"⛑️", guc:30 },
  { id:"satil",             ad:"Satıl",              emoji:"🪣", guc:35 },
  { id:"tahta",             ad:"Tahta",              emoji:"🪵", guc:40 },
  { id:"silikon_tabancasi", ad:"Silikon Tabancası",  emoji:"🔫", guc:45 },
  { id:"gozluk",            ad:"Gözlük",             emoji:"🥽", guc:50 },
  { id:"vinc",              ad:"Vinç",               emoji:"🏗️", guc:55 },
  { id:"kepce",             ad:"Kepçe",              emoji:"🦾", guc:60 },
  { id:"tir",               ad:"Tır",                emoji:"🚛", guc:65 }
];

const SANDIKLAR = [
  { id:"sandik",        ad:"Sandık",        emoji:"📦", cssClass:"wooden", maliyet:100, birim:"kurus",   birimIcon:"🪙",
    havuz:[{tip:"esya",deger:"su_pompasi",agirlik:35},{tip:"esya",deger:"sapka",agirlik:25},{tip:"esya",deger:"sincap",agirlik:15},{tip:"kurus",deger:50,agirlik:20},{tip:"kurus",deger:20,agirlik:5}] },
  { id:"demir_sandik",  ad:"Demir Sandık",  emoji:"🗃️", cssClass:"iron",   maliyet:300, birim:"kurus",   birimIcon:"🪙",
    havuz:[{tip:"esya",deger:"boru",agirlik:20},{tip:"esya",deger:"fener",agirlik:20},{tip:"esya",deger:"kask",agirlik:15},{tip:"esya",deger:"sapka",agirlik:15},{tip:"banknot",deger:5,agirlik:20},{tip:"banknot",deger:10,agirlik:10}] },
  { id:"celik_sandik",  ad:"Çelik Sandık",  emoji:"🔒", cssClass:"steel",  maliyet:50,  birim:"banknot", birimIcon:"💵",
    havuz:[{tip:"esya",deger:"satil",agirlik:18},{tip:"esya",deger:"tahta",agirlik:18},{tip:"esya",deger:"gozluk",agirlik:10},{tip:"esya",deger:"vinc",agirlik:8},{tip:"banknot",deger:20,agirlik:25},{tip:"banknot",deger:40,agirlik:15},{tip:"kurus",deger:500,agirlik:6}] },
  { id:"mucevher_sandik",ad:"Mücevher Sandık",emoji:"💎",cssClass:"jewel", maliyet:200, birim:"banknot", birimIcon:"💵",
    havuz:[{tip:"esya",deger:"silikon_tabancasi",agirlik:15},{tip:"esya",deger:"vinc",agirlik:15},{tip:"esya",deger:"kepce",agirlik:12},{tip:"esya",deger:"tir",agirlik:8},{tip:"altin",deger:1,agirlik:20},{tip:"altin",deger:3,agirlik:10},{tip:"banknot",deger:100,agirlik:20}] },
  { id:"bor_sandigi",   ad:"Bor Sandığı",   emoji:"🌟", cssClass:"bor",    maliyet:5,   birim:"altin",   birimIcon:"🥇",
    havuz:[{tip:"esya",deger:"tir",agirlik:20},{tip:"esya",deger:"kepce",agirlik:18},{tip:"esya",deger:"vinc",agirlik:15},{tip:"esya",deger:"silikon_tabancasi",agirlik:12},{tip:"altin",deger:5,agirlik:18},{tip:"altin",deger:10,agirlik:10},{tip:"banknot",deger:500,agirlik:7}] }
];

// Seçilebilir avatarlar
const AVATARLAR = ["👷","⛏️","🪨","💎","🔥","🐉","🦅","🌑","⚡","🌊","🤖","👑","🧙","🥷","🤠","🦁","🐺","🦊","🧲","🚀"];

const LIG_ODULU_ARALIK_MS = 10 * 60 * 1000;

// Dolap tipleri (market satın alma)
const DOLAP_TIPLERI = [
  { id:"normal",  ad:"Normal Dolap",  emoji:"🗄️", cssClass:"dolap-normal",  kapasite:10, maliyet:300,  aciklama:"10 eşya kapasiteli standart madenci dolabı." },
  { id:"ustun",   ad:"Üstün Dolap",   emoji:"🗃️", cssClass:"dolap-ustun",   kapasite:20, maliyet:500,  aciklama:"20 eşya kapasiteli güçlendirilmiş çelik dolap." },
  { id:"dubleks", ad:"Dubleks Dolap", emoji:"🏺", cssClass:"dolap-dubleks", kapasite:30, maliyet:650,  aciklama:"30 eşya kapasiteli nadir altın kaplama dubleks dolap!" }
];

// ── Global Durum ──
let mevcutKullanici = null;
let kullaniciVerisi  = null;
let firestoreUnsub   = null;
let ligCountdownInt  = null;
let aktifSayfa       = "village";

// ============================================================
// YARDIMCILAR
// ============================================================
function agirlikliRastgele(havuz){ const t=havuz.reduce((s,h)=>s+h.agirlik,0); let r=Math.random()*t; for(const h of havuz){r-=h.agirlik;if(r<=0)return h;} return havuz[havuz.length-1]; }
function esyaBul(id){ return ESYALAR.find(e=>e.id===id)||null; }
function madenciBul(id){ return MADENCILER.find(m=>m.id===id)||null; }
function ligBul(ad){ return LIGLER.find(l=>l.ad===ad)||LIGLER[0]; }
function formatSayi(n){ if(n>=1e6)return(n/1e6).toFixed(1)+"M"; if(n>=1000)return(n/1000).toFixed(1)+"K"; return String(n||0); }

function gucHesapla(v){
  const m = madenciBul(v.madenci);
  const k = m ? m.katsayi : 2;
  const et = (v.esyalar||[]).reduce((t,id)=>{ const e=esyaBul(id); return t+(e?e.guc:0); },0);
  return k * et;
}

function toast(msg, tip="info", sure=3000){
  const c = document.getElementById("toast-container");
  const icons = {success:"✅",error:"❌",info:"⛏️",gold:"🥇"};
  const t = document.createElement("div");
  t.className = `toast ${tip}`;
  t.innerHTML = `<span>${icons[tip]||"ℹ️"}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>t.remove(), sure);
}

function turkceleHata(kod){
  const h={"auth/user-not-found":"Bu e-posta kayıtlı değil.","auth/wrong-password":"Yanlış şifre.","auth/email-already-in-use":"Bu e-posta zaten kayıtlı.","auth/invalid-email":"Geçersiz e-posta.","auth/weak-password":"Şifre çok zayıf.","auth/network-request-failed":"Ağ hatası.","auth/too-many-requests":"Çok fazla deneme.","auth/invalid-credential":"Geçersiz kimlik bilgisi."};
  return h[kod]||("Hata: "+kod);
}

// ============================================================
// FİRESTORE
// ============================================================
async function veriGuncelle(uid, data){ await db.collection("kullanicilar").doc(uid).update(data); }

async function kullaniciBelgesiOlustur(uid, email, username){
  const now = firebase.firestore.Timestamp.now();
  // Başlangıçta 1 normal dolap
  const d = { uid, email, username, lig:"Bronz", altin:0, banknot:10, kurus:0, madenci:"Beyza", esyalar:[], guc:0, sonOdul:now, avatar:"👷", profilFoto:null, uretimAltin:0, dolaplar:{normal:1,ustun:0,dubleks:0}, kayitTarihi:now };
  await db.collection("kullanicilar").doc(uid).set(d);
  return d;
}

// Toplam dolap kapasitesi ve doluluk
function dolapKapasiteHesapla(v){
  const d = v.dolaplar || {normal:1,ustun:0,dubleks:0};
  const kapasite = (d.normal||0)*10 + (d.ustun||0)*20 + (d.dubleks||0)*30;
  const dolu = (v.esyalar||[]).length;
  return {kapasite, dolu};
}

function kullaniciyiDinle(uid){
  if(firestoreUnsub) firestoreUnsub();
  firestoreUnsub = db.collection("kullanicilar").doc(uid).onSnapshot(snap=>{
    if(snap.exists){ kullaniciVerisi=snap.data(); uiGuncelle(); }
  });
}

// ============================================================
// AUTH
// ============================================================
auth.onAuthStateChanged(async user=>{
  if(user){
    mevcutKullanici = user;
    const snap = await db.collection("kullanicilar").doc(user.uid).get();
    kullaniciVerisi = snap.exists ? snap.data() : await kullaniciBelgesiOlustur(user.uid,user.email,"Madenci");
    kullaniciyiDinle(user.uid);
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    ligOduluKontrol();
    ligGeriSayimBaslat();
  } else {
    mevcutKullanici=null; kullaniciVerisi=null;
    if(firestoreUnsub) firestoreUnsub();
    if(ligCountdownInt) clearInterval(ligCountdownInt);
    document.getElementById("auth-screen").classList.remove("hidden");
    document.getElementById("app").classList.add("hidden");
    authPartikullerBaslat();
  }
});

document.getElementById("btn-login").addEventListener("click", async()=>{
  const email=document.getElementById("login-email").value.trim();
  const pass=document.getElementById("login-password").value;
  const err=document.getElementById("login-error");
  err.textContent="";
  if(!email||!pass){ err.textContent="E-posta ve şifre gerekli."; return; }
  try{
    document.getElementById("btn-login").textContent="⏳ Giriliyor...";
    await auth.signInWithEmailAndPassword(email,pass);
  }catch(e){ err.textContent=turkceleHata(e.code); document.getElementById("btn-login").textContent="⛏️ Madene Gir"; }
});

document.getElementById("btn-register").addEventListener("click", async()=>{
  const username=document.getElementById("reg-username").value.trim();
  const email=document.getElementById("reg-email").value.trim();
  const pass=document.getElementById("reg-password").value;
  const err=document.getElementById("register-error");
  err.textContent="";
  if(!username||!email||!pass){ err.textContent="Tüm alanları doldur."; return; }
  if(username.length<3){ err.textContent="Kullanıcı adı en az 3 karakter."; return; }
  try{
    document.getElementById("btn-register").textContent="⏳ Kaydediliyor...";
    const kred = await auth.createUserWithEmailAndPassword(email,pass);
    await kullaniciBelgesiOlustur(kred.user.uid,email,username);
    toast("Hoş geldin, "+username+"! 🎉","success");
  }catch(e){ err.textContent=turkceleHata(e.code); document.getElementById("btn-register").textContent="🪙 Madenci Ol"; }
});

document.getElementById("btn-logout").addEventListener("click", async()=>{ await auth.signOut(); profilModalKapat(); toast("Çıkış yapıldı.","info"); });

document.getElementById("show-register").addEventListener("click",()=>{ document.getElementById("login-form").classList.add("hidden"); document.getElementById("register-form").classList.remove("hidden"); });
document.getElementById("show-login").addEventListener("click",()=>{ document.getElementById("register-form").classList.add("hidden"); document.getElementById("login-form").classList.remove("hidden"); });

// ============================================================
// AUTH PARTİKÜLLER
// ============================================================
function authPartikullerBaslat(){
  const c=document.getElementById("auth-particles"); c.innerHTML="";
  for(let i=0;i<28;i++){
    const p=document.createElement("div"); p.className="auth-particle";
    p.style.left=Math.random()*100+"%";
    p.style.setProperty("--dur",(Math.random()*8+5)+"s");
    p.style.setProperty("--delay",(Math.random()*8)+"s");
    const renkler=["#f5c842","#e87c2a","#a0a0b0","#4caf82"];
    p.style.background=renkler[Math.floor(Math.random()*renkler.length)];
    const s=(Math.random()*5+2)+"px"; p.style.width=s; p.style.height=s;
    c.appendChild(p);
  }
}

// ============================================================
// UI GÜNCELLE
// ============================================================
function uiGuncelle(){
  if(!kullaniciVerisi) return;
  const v=kullaniciVerisi;

  // Topbar stats
  document.getElementById("val-altin").textContent   = formatSayi(v.altin||0);
  document.getElementById("val-banknot").textContent = formatSayi(v.banknot||0);
  document.getElementById("val-kurus").textContent   = formatSayi(v.kurus||0);

  // Lig badge
  const lb=document.getElementById("topbar-lig");
  lb.textContent=v.lig; lb.className="lig-badge "+v.lig;

  // Profil avatar butonu
  document.getElementById("profile-topbtn-avatar").textContent = v.avatar||"👷";

  // Sidebar info panel
  const {kapasite,dolu} = dolapKapasiteHesapla(kullaniciVerisi);
  const sipPow = document.getElementById("sip-power"); if(sipPow) sipPow.textContent=formatSayi(kullaniciVerisi.guc||0);
  const uA = kullaniciVerisi.uretimAltin||0;
  const sipU = document.getElementById("sip-uretim"); if(sipU) sipU.textContent=(uA>0?`🥇${uA}%|`:"")+(uA<100?`💵${100-uA}%`:"💵100%");

  // Aktif sayfa
  switch(aktifSayfa){
    case "village":     koyGuncelle(); break;
    case "market":      marketGuncelle(); break;
    case "leaderboard": siralamaSayfaGuncelle(); break;
    case "inventory":   envanterGuncelle(); break;
  }
}

// ============================================================
// KÖY — 2D SAHNE
// ============================================================
function koyGuncelle(){
  if(!kullaniciVerisi) return;
  const v=kullaniciVerisi;
  const madenci=madenciBul(v.madenci);

  // Bilgi bandı
  document.getElementById("village-username").textContent = v.username||"Madenci";
  document.getElementById("village-power").textContent    = formatSayi(v.guc||0);
  document.getElementById("village-lig").textContent      = v.lig||"Bronz";

  // Madenci avatarı tünelde
  document.getElementById("village-miner-emoji").textContent = madenci ? madenci.emoji : "👷";

  // Village timer (sidebar)
  // koyGuncelle her çağrıldığında sidebar timer da güncel
  // Dolapları render et — kapasiteye göre
  dolaplaraRender(v);
}

function dolaplaraRender(v){
  const row = document.getElementById("cabinets-row");
  row.innerHTML="";
  const esyalar = v.esyalar || [];
  const d = v.dolaplar || {normal:1,ustun:0,dubleks:0};

  // Sahip olunan dolapların listesini oluştur
  const dolapListesi = [];
  for(let i=0;i<(d.normal||0);i++) dolapListesi.push({tip:'normal',kapasite:10,emoji:'🗄️',label:'Normal'});
  for(let i=0;i<(d.ustun||0);i++) dolapListesi.push({tip:'ustun',kapasite:20,emoji:'🗃️',label:'Üstün'});
  for(let i=0;i<(d.dubleks||0);i++) dolapListesi.push({tip:'dubleks',kapasite:30,emoji:'🏺',label:'Dubleks'});

  // Eşyaları dolaplara dağıt (sıralı)
  const esyaSlot = [...esyalar];
  dolapListesi.forEach((dolap, idx) => {
    const dolapEsyalar = esyaSlot.splice(0, dolap.kapasite);
    const tekrarsiz = [...new Set(dolapEsyalar)];
    const doluOran = dolapEsyalar.length / dolap.kapasite;
    const acik = dolapEsyalar.length > 0;

    const div = document.createElement("div");
    div.className = "cabinet" + (acik ? " open" : "");
    div.addEventListener("click",()=>dolabAc(idx, dolapListesi, dolapEsyalar, dolap));

    const rozetHTML = dolapEsyalar.length>0 ? `<div class="cabinet-count-badge">${dolapEsyalar.length}</div>` : "";
    const miniHTML = tekrarsiz.slice(0,4).map(id=>{ const e=esyaBul(id); return e?`<span class="cabinet-item-mini">${e.emoji}</span>`:""; }).join("");

    div.innerHTML=`
      ${rozetHTML}
      <div class="cabinet-top"></div>
      <div class="cabinet-body">
        <div class="cabinet-interior-bg">
          <div class="cabinet-shelf"></div>
          <div class="cabinet-shelf"></div>
          ${miniHTML}
        </div>
        <div class="cabinet-body-inner">
          <div class="cabinet-door-left"></div>
          <div class="cabinet-door-right"></div>
        </div>
      </div>
      <div class="cabinet-bottom"></div>
      <div class="cabinet-legs"><div class="cabinet-leg"></div><div class="cabinet-leg"></div></div>
      <div class="cabinet-label">${dolap.emoji} ${dolap.label}</div>
    `;
    row.appendChild(div);
  });
}

// Dolap aç modalı
function dolabAc(idx, dolapListesi, dolapEsyalar, dolap){
  document.getElementById("cabinet-modal-icon").textContent  = dolap.emoji;
  document.getElementById("cabinet-modal-title").textContent = dolap.label + " Dolabı";

  // Kapasite göstergesi
  const yuzde = (dolapEsyalar.length / dolap.kapasite) * 100;
  document.getElementById("cabinet-capacity-bar").style.width = yuzde + "%";
  document.getElementById("cabinet-capacity-txt").textContent = `${dolapEsyalar.length}/${dolap.kapasite} eşya`;

  const sayim={};
  dolapEsyalar.forEach(id=>{sayim[id]=(sayim[id]||0)+1;});
  const interior=document.getElementById("cabinet-interior");
  interior.innerHTML="";

  if(dolapEsyalar.length===0){
    interior.innerHTML=`<div class="cabinet-empty-msg">Bu dolap boş! Market'ten sandık aç 📦</div>`;
  } else {
    Object.entries(sayim).forEach(([id,adet])=>{
      const e=esyaBul(id); if(!e) return;
      const card=document.createElement("div"); card.className="cabinet-item-card";
      card.innerHTML=`<span class="i-emoji">${e.emoji}</span><div class="i-name">${e.ad}${adet>1?` ×${adet}`:""}</div><div class="i-power">⚡ ${e.guc}</div>`;
      interior.appendChild(card);
    });
  }
  document.getElementById("cabinet-modal").classList.remove("hidden");
}

document.getElementById("cabinet-modal-close").addEventListener("click",()=>{
  document.getElementById("cabinet-modal").classList.add("hidden");
});
document.getElementById("cabinet-modal").addEventListener("click",e=>{
  if(e.target===document.getElementById("cabinet-modal")) document.getElementById("cabinet-modal").classList.add("hidden");
});

// ============================================================
// LİG ÖDÜL SİSTEMİ
// ============================================================
async function ligOduluDagit(ligOdul){
  if(!mevcutKullanici||!kullaniciVerisi) return;
  try{
    const snap=await db.collection("kullanicilar").where("lig","==",kullaniciVerisi.lig).get();
    const oyuncular=snap.docs.map(d=>d.data());
    const toplamGuc=oyuncular.reduce((t,o)=>t+(o.guc||0),0);
    let pay=0;
    if(toplamGuc===0){ pay=Math.floor(ligOdul/Math.max(oyuncular.length,1)); }
    else{ const ben=oyuncular.find(o=>o.uid===mevcutKullanici.uid); pay=Math.floor(((ben?ben.guc:0)/toplamGuc)*ligOdul); }
    pay=Math.max(pay,1);
    const now=firebase.firestore.Timestamp.now();
    // Üretim tercihine göre altın/banknot dağıt
    const altinPct = kullaniciVerisi.uretimAltin||0;
    const altinMiktar  = Math.floor(pay * altinPct / 100);
    const banknotMiktar = pay - altinMiktar;
    const gunc = {sonOdul:now};
    if(altinMiktar>0)   gunc.altin   = firebase.firestore.FieldValue.increment(altinMiktar);
    if(banknotMiktar>0) gunc.banknot = firebase.firestore.FieldValue.increment(banknotMiktar);
    await veriGuncelle(mevcutKullanici.uid, gunc);
    ligOduluBildirimGoster(pay, kullaniciVerisi.lig, altinMiktar, banknotMiktar);
  }catch(e){ console.error("Lig ödülü hatası:",e); }
}

async function ligOduluKontrol(){
  if(!kullaniciVerisi||!kullaniciVerisi.sonOdul) return;
  const gecen=Date.now()-kullaniciVerisi.sonOdul.toMillis();
  if(gecen>=LIG_ODULU_ARALIK_MS){ const l=ligBul(kullaniciVerisi.lig); await ligOduluDagit(l.odul); }
}

function ligGeriSayimBaslat(){
  if(ligCountdownInt) clearInterval(ligCountdownInt);
  function tick(){
    if(!kullaniciVerisi||!kullaniciVerisi.sonOdul) return;
    const kalan=LIG_ODULU_ARALIK_MS-(Date.now()-kullaniciVerisi.sonOdul.toMillis());
    if(kalan<=0){ const l=ligBul(kullaniciVerisi.lig); ligOduluDagit(l.odul); return; }
    const dk=Math.floor(kalan/60000), sn=Math.floor((kalan%60000)/1000);
    const fmt=String(dk).padStart(2,"0")+":"+String(sn).padStart(2,"0");
    const el=document.getElementById("village-timer"); if(el) el.textContent=fmt;
    const el2=document.getElementById("sip-timer"); if(el2) el2.textContent=fmt;
  }
  ligCountdownInt=setInterval(tick,1000); tick();
}

function ligOduluBildirimGoster(miktar, lig, altinM=0, banknotM=0){
  const amtTxt = altinM>0 ? `+${altinM} Altın & +${banknotM} Banknot` : `+${miktar} Banknot`;
  document.getElementById("reward-amount-display").textContent = amtTxt;
  document.getElementById("reward-lig-display").textContent = lig+" Ligi";
  const rain=document.getElementById("coin-rain"); rain.innerHTML="";
  for(let i=0;i<18;i++){
    const c=document.createElement("span"); c.className="falling-coin"; c.textContent="💵";
    c.style.left=Math.random()*100+"%";
    c.style.setProperty("--dur",(Math.random()*1.5+0.8)+"s");
    c.style.setProperty("--delay",(Math.random()*1.5)+"s");
    rain.appendChild(c);
  }
  document.getElementById("league-reward-overlay").classList.remove("hidden");
  toast("🏆 Lig ödülü! +"+miktar+" Banknot!","gold",4000);
}

document.getElementById("reward-close-btn").addEventListener("click",()=>{
  document.getElementById("league-reward-overlay").classList.add("hidden");
});

// ============================================================
// MARKET
// ============================================================
function marketGuncelle(){
  if(!kullaniciVerisi) return;

  // Sandıklar
  const grid=document.getElementById("chests-grid"); grid.innerHTML="";
  SANDIKLAR.forEach(s=>{
    const birimClass=s.birim==="altin"?"gold":s.birim==="banknot"?"banknot":"kurus";
    const birimAdi=s.birim==="altin"?"Altın":s.birim==="banknot"?"Banknot":"Kuruş";
    const card=document.createElement("div"); card.className=`chest-card ${s.cssClass}`;
    card.innerHTML=`
      <div class="chest-header">
        <div class="chest-emoji">${s.emoji}</div>
        <div class="chest-info">
          <div class="chest-name">${s.ad}</div>
          <div class="chest-cost ${birimClass}">${s.birimIcon} ${s.maliyet} ${birimAdi}</div>
        </div>
      </div>
      <div class="chest-contents">${s.aciklama||"Çeşitli ödüller içerir."}</div>
      <button class="btn-primary chest-buy-btn" onclick="sandikAc('${s.id}')">${s.emoji} Aç — ${s.birimIcon} ${s.maliyet}</button>
    `;
    grid.appendChild(card);
  });

  // Kapasite bilgisi
  const {kapasite, dolu} = dolapKapasiteHesapla(kullaniciVerisi);
  const kapInfo = document.getElementById("market-kapasite-info");
  if(kapInfo) kapInfo.textContent = `Mevcut kapasite: ${dolu}/${kapasite} eşya dolu. Yeni dolap al!`;

  // Dolaplar shop
  const cGrid = document.getElementById("cabinets-shop-grid"); cGrid.innerHTML="";
  DOLAP_TIPLERI.forEach(dt=>{
    const card=document.createElement("div"); card.className=`chest-card ${dt.cssClass}`;
    card.innerHTML=`
      <div class="chest-header">
        <div class="chest-emoji">${dt.emoji}</div>
        <div class="chest-info">
          <div class="chest-name">${dt.ad}</div>
          <div class="chest-cost banknot">💵 ${dt.maliyet} Banknot</div>
        </div>
      </div>
      <div class="chest-contents">${dt.aciklama}<br/><strong>Kapasite: ${dt.kapasite} eşya</strong></div>
      <button class="btn-primary chest-buy-btn" onclick="dolapSatinAl('${dt.id}')">${dt.emoji} Satın Al — 💵 ${dt.maliyet}</button>
    `;
    cGrid.appendChild(card);
  });

  // Kilitli madenciler
  const mGrid = document.getElementById("miners-market-grid"); mGrid.innerHTML="";
  const aktifM = madenciBul(kullaniciVerisi.madenci);
  MADENCILER.filter(m => m.maliyet > 0).forEach(m=>{
    const isOwned = m.katsayi < (aktifM ? aktifM.katsayi : 2) || kullaniciVerisi.madenci === m.id;
    if(isOwned) return; // Sadece kilitli olanları göster
    const birimIcon = m.birim==="altin"?"🥇":"💵";
    const birimAdi  = m.birim==="altin"?"Altın":"Banknot";
    const card=document.createElement("div"); card.className=`miner-card-modal ${m.id}`;
    card.style.cssText="background:var(--surface);border:2px solid var(--border);border-radius:14px;padding:16px 12px;text-align:center;position:relative;overflow:hidden";
    card.innerHTML=`
      <span class="mc-emoji" style="font-size:2.4rem;display:block;margin-bottom:8px">${m.emoji}</span>
      <div class="mc-name" style="font-family:'Cinzel',serif;font-size:.95rem;font-weight:700;margin-bottom:4px">${m.id}</div>
      <div class="mc-coeff" style="font-size:.78rem;color:var(--text-dim);margin-bottom:12px">×${m.katsayi} Katsayı</div>
      <button class="btn-primary" style="font-size:.78rem;padding:9px" onclick="madenciSatinAl('${m.id}')">🔓 ${birimIcon} ${m.maliyet} ${birimAdi}</button>
    `;
    mGrid.appendChild(card);
  });
  if(mGrid.children.length===0){
    mGrid.innerHTML=`<div class="inv-empty" style="grid-column:1/-1">Tüm madenciler açık! 🎉</div>`;
  }
}

async function dolapSatinAl(tip){
  if(!mevcutKullanici||!kullaniciVerisi) return;
  const dt = DOLAP_TIPLERI.find(d=>d.id===tip); if(!dt) return;
  const v = kullaniciVerisi;
  if(v.banknot < dt.maliyet){ toast(`Yeterli Banknot yok! Gerekli: ${dt.maliyet} 💵`,"error"); return; }
  try{
    const yeniDolaplar = {...(v.dolaplar||{normal:1,ustun:0,dubleks:0})};
    yeniDolaplar[tip] = (yeniDolaplar[tip]||0) + 1;
    await veriGuncelle(mevcutKullanici.uid, {
      banknot: firebase.firestore.FieldValue.increment(-dt.maliyet),
      dolaplar: yeniDolaplar
    });
    toast(`${dt.ad} satın alındı! ${dt.emoji}`,"success");
    marketGuncelle();
  }catch(e){ toast("Hata: "+e.message,"error"); }
}

async function sandikAc(id){
  if(!mevcutKullanici||!kullaniciVerisi) return;
  const s=SANDIKLAR.find(x=>x.id===id); if(!s) return;
  const v=kullaniciVerisi;
  if(s.birim==="altin"&&v.altin<s.maliyet){ toast("Yeterli Altın yok! 🥇 Gerekli: "+s.maliyet,"error"); return; }
  if(s.birim==="banknot"&&v.banknot<s.maliyet){ toast("Yeterli Banknot yok! 💵 Gerekli: "+s.maliyet,"error"); return; }
  if(s.birim==="kurus"&&v.kurus<s.maliyet){ toast("Yeterli Kuruş yok! 🪙 Gerekli: "+s.maliyet,"error"); return; }

  document.getElementById("chest-open-emoji").textContent=s.emoji;
  document.getElementById("chest-open-emoji").className="chest-emoji-anim";
  document.getElementById("chest-open-anim").style.display="block";
  document.getElementById("chest-result").classList.add("hidden");
  document.getElementById("chest-close-btn").classList.add("hidden");
  document.getElementById("chest-modal").classList.remove("hidden");

  const kazanim=agirlikliRastgele(s.havuz);

  setTimeout(async()=>{
    let gunc={};
    if(s.birim==="altin")   gunc.altin   =firebase.firestore.FieldValue.increment(-s.maliyet);
    if(s.birim==="banknot") gunc.banknot =firebase.firestore.FieldValue.increment(-s.maliyet);
    if(s.birim==="kurus")   gunc.kurus   =firebase.firestore.FieldValue.increment(-s.maliyet);

    // Kapasite kontrolü
    const {kapasite, dolu} = dolapKapasiteHesapla(v);

    let ikon="🎁",ad="",acik="";
    if(kazanim.tip==="esya"){
      const esya=esyaBul(kazanim.deger);
      if((v.esyalar||[]).includes(kazanim.deger)){
        gunc.kurus=firebase.firestore.FieldValue.increment(esya.guc);
        ikon="🪙"; ad="Tekrar "+esya.ad; acik=`Zaten sahipsin! +${esya.guc} Kuruş aldın.`;
      } else if(dolu >= kapasite){
        // Dolap dolu — para ödülüne çevir
        gunc.kurus=firebase.firestore.FieldValue.increment(esya.guc * 2);
        ikon="🪙"; ad="Dolap Dolu!"; acik=`${esya.ad} için yer yok. +${esya.guc*2} Kuruş aldın. Yeni dolap al!`;
      } else {
        gunc.esyalar=firebase.firestore.FieldValue.arrayUnion(kazanim.deger);
        const ye=[...(v.esyalar||[]),kazanim.deger];
        gunc.guc=gucHesapla({...v,esyalar:ye});
        ikon=esya.emoji; ad=esya.ad; acik=`Yeni eşya! +${esya.guc} güç puanı.`;
      }
    } else if(kazanim.tip==="altin"){ gunc.altin=firebase.firestore.FieldValue.increment(kazanim.deger); ikon="🥇"; ad=`+${kazanim.deger} Altın`; acik="Değerli kazanım!"; }
    else if(kazanim.tip==="banknot"){ gunc.banknot=firebase.firestore.FieldValue.increment(kazanim.deger); ikon="💵"; ad=`+${kazanim.deger} Banknot`; acik="İyi kazanım!"; }
    else if(kazanim.tip==="kurus"){ gunc.kurus=firebase.firestore.FieldValue.increment(kazanim.deger); ikon="🪙"; ad=`+${kazanim.deger} Kuruş`; acik=""; }

    try{
      await veriGuncelle(mevcutKullanici.uid,gunc);
      document.getElementById("chest-open-anim").style.display="none";
      document.getElementById("chest-result-icon").textContent=ikon;
      document.getElementById("chest-result-name").textContent=ad;
      document.getElementById("chest-result-desc").textContent=acik;
      document.getElementById("chest-result").classList.remove("hidden");
      document.getElementById("chest-close-btn").classList.remove("hidden");
    }catch(e){ toast("Hata: "+e.message,"error"); document.getElementById("chest-modal").classList.add("hidden"); }
  },1300);
}

document.getElementById("chest-close-btn").addEventListener("click",()=>document.getElementById("chest-modal").classList.add("hidden"));
document.getElementById("chest-modal").addEventListener("click",e=>{ if(e.target===document.getElementById("chest-modal")) document.getElementById("chest-modal").classList.add("hidden"); });

// ============================================================
// ENVANTER
// ============================================================
function envanterGuncelle(){
  if(!kullaniciVerisi) return;
  const v=kullaniciVerisi;
  const esyalar=v.esyalar||[];
  const madenci=madenciBul(v.madenci);
  const k=madenci?madenci.katsayi:2;
  const et=esyalar.reduce((t,id)=>{ const e=esyaBul(id); return t+(e?e.guc:0); },0);
  document.getElementById("inv-total-item-power").textContent=et;
  document.getElementById("inv-miner-coeff").textContent="×"+k;
  document.getElementById("inv-final-power").textContent=formatSayi(k*et);

  const grid=document.getElementById("inventory-grid"); grid.innerHTML="";
  if(!esyalar.length){ grid.innerHTML=`<div class="inv-empty">Henüz bir eşyan yok. Market'e git!</div>`; return; }

  const sayim={};
  esyalar.forEach(id=>{sayim[id]=(sayim[id]||0)+1;});
  Object.entries(sayim).forEach(([id,adet])=>{
    const e=esyaBul(id); if(!e) return;
    const card=document.createElement("div"); card.className="item-card";
    card.innerHTML=`<span class="item-card-emoji">${e.emoji}</span><div class="item-card-name">${e.ad}${adet>1?` ×${adet}`:""}</div><div class="item-card-power">⚡ ${e.guc}</div>`;
    grid.appendChild(card);
  });
}

// ============================================================
// SIRALAMA
// ============================================================
let aktifLbTab="my";

document.getElementById("lb-tab-my").addEventListener("click",()=>{ aktifLbTab="my"; document.getElementById("lb-tab-my").classList.add("active"); document.getElementById("lb-tab-all").classList.remove("active"); siralamaYukle(); });
document.getElementById("lb-tab-all").addEventListener("click",()=>{ aktifLbTab="all"; document.getElementById("lb-tab-all").classList.add("active"); document.getElementById("lb-tab-my").classList.remove("active"); siralamaYukle(); });

async function siralamaYukle(){
  if(!kullaniciVerisi) return;
  const list=document.getElementById("leaderboard-list");
  list.innerHTML=`<div class="loading-spinner"><div class="spinner"></div> Yükleniyor...</div>`;
  try{
    let q=aktifLbTab==="my"
      ? db.collection("kullanicilar").where("lig","==",kullaniciVerisi.lig).orderBy("guc","desc").limit(50)
      : db.collection("kullanicilar").orderBy("guc","desc").limit(50);
    const snap=await q.get();
    list.innerHTML="";
    if(snap.empty){ list.innerHTML=`<div class="inv-empty">Henüz oyuncu yok.</div>`; return; }
    snap.docs.forEach((doc,i)=>{
      const o=doc.data(); const sira=i+1; const benim=doc.id===mevcutKullanici.uid;
      const sc=sira===1?"top1":sira===2?"top2":sira===3?"top3":"";
      const sm=sira===1?"🥇":sira===2?"🥈":sira===3?"🥉":`#${sira}`;
      const row=document.createElement("div"); row.className="lb-row"+(benim?" me":"");
      row.innerHTML=`<div class="lb-rank ${sc}">${sm}</div><div class="lb-avatar">${(o.avatar||o.username||"?").charAt(0).toUpperCase()}</div><div class="lb-info"><div class="lb-name">${o.username||"?"}${benim?" (Sen)":""}</div><div class="lb-lig">${o.lig||"Bronz"}</div></div><div class="lb-power">⚡ ${formatSayi(o.guc||0)}</div>`;
      list.appendChild(row);
    });
  }catch(e){ list.innerHTML=`<div class="inv-empty">Sıralama yüklenemedi. Firestore indeksi gerekebilir.</div>`; console.error(e); }
}

function siralamaSayfaGuncelle(){ siralamaYukle(); }

// ============================================================
// PROFİL MODAL
// ============================================================
document.getElementById("profile-topbtn").addEventListener("click",()=>{
  if(!kullaniciVerisi) return;
  profilModalAc();
});
document.getElementById("profile-modal-close").addEventListener("click", profilModalKapat);
document.getElementById("profile-modal").addEventListener("click",e=>{ if(e.target===document.getElementById("profile-modal")) profilModalKapat(); });

function profilModalAc(){
  const v=kullaniciVerisi;
  // Avatar
  document.getElementById("profile-avatar-display").textContent = v.avatar||"👷";
  // Profil fotoğrafı
  const fotoImg = document.getElementById("profile-photo-img");
  if(v.profilFoto){ fotoImg.src=v.profilFoto; fotoImg.classList.remove("hidden"); document.getElementById("profile-big-avatar").classList.add("hidden"); }
  else { fotoImg.classList.add("hidden"); document.getElementById("profile-big-avatar").classList.remove("hidden"); }
  // Bilgiler
  document.getElementById("profile-username").textContent = v.username||"Madenci";
  document.getElementById("profile-email").textContent    = v.email||"—";
  const lb=document.getElementById("profile-lig-badge"); lb.textContent=v.lig; lb.className="lig-badge "+v.lig;
  // Kayıt tarihi
  const ktEl = document.getElementById("profile-kayit");
  if(ktEl && v.kayitTarihi){ const t=v.kayitTarihi.toDate(); ktEl.textContent="Kayıt: "+t.toLocaleDateString("tr-TR"); }
  document.getElementById("pstat-guc").textContent     = formatSayi(v.guc||0);
  document.getElementById("pstat-madenci").textContent = v.madenci||"Beyza";
  document.getElementById("pstat-lig-rank").textContent    = "Yükleniyor...";
  document.getElementById("pstat-global-rank").textContent = "Yükleniyor...";
  // Şifre alanı temizle
  const pwEl = document.getElementById("new-password"); if(pwEl) pwEl.value="";
  const pwErr = document.getElementById("password-error"); if(pwErr) pwErr.textContent="";

  // Sıralama
  (async()=>{
    try{
      const ls=await db.collection("kullanicilar").where("lig","==",v.lig).orderBy("guc","desc").get();
      const li=ls.docs.findIndex(d=>d.id===mevcutKullanici.uid)+1;
      document.getElementById("pstat-lig-rank").textContent="#"+li;
      const gs=await db.collection("kullanicilar").orderBy("guc","desc").get();
      const gi=gs.docs.findIndex(d=>d.id===mevcutKullanici.uid)+1;
      document.getElementById("pstat-global-rank").textContent="#"+gi;
    }catch(e){ document.getElementById("pstat-lig-rank").textContent="—"; document.getElementById("pstat-global-rank").textContent="—"; }
  })();

  document.getElementById("profile-modal").classList.remove("hidden");
}

function profilModalKapat(){ document.getElementById("profile-modal").classList.add("hidden"); }

// Şifre değiştir
document.getElementById("btn-change-password").addEventListener("click", async()=>{
  const pw = document.getElementById("new-password").value;
  const errEl = document.getElementById("password-error");
  errEl.textContent="";
  if(pw.length<6){ errEl.textContent="En az 6 karakter giriniz."; return; }
  try{
    await mevcutKullanici.updatePassword(pw);
    document.getElementById("new-password").value="";
    toast("Şifre güncellendi! 🔒","success");
  }catch(e){
    if(e.code==="auth/requires-recent-login") errEl.textContent="Güvenlik için lütfen çıkış yapıp tekrar giriş yap.";
    else errEl.textContent=turkceleHata(e.code);
  }
});

// Profil fotoğrafı yükle (Canvas ile küçültülür)
document.getElementById("profile-photo-input").addEventListener("change", async(e)=>{
  const file = e.target.files[0]; if(!file) return;
  const img = new Image();
  img.onload = async()=>{
    const canvas = document.createElement("canvas");
    const size = 200;
    canvas.width=size; canvas.height=size;
    const ctx = canvas.getContext("2d");
    const min = Math.min(img.width,img.height);
    const sx=(img.width-min)/2, sy=(img.height-min)/2;
    ctx.drawImage(img,sx,sy,min,min,0,0,size,size);
    const b64 = canvas.toDataURL("image/jpeg",0.7);
    try{
      await veriGuncelle(mevcutKullanici.uid,{profilFoto:b64});
      toast("Profil fotoğrafı güncellendi! 📷","success");
    }catch(err){ toast("Hata: "+err.message,"error"); }
  };
  img.src = URL.createObjectURL(file);
});

// Şikayet gönder
async function sikayetGonder(tip){
  const mesaj = document.getElementById("sikayet-mesaj").value.trim();
  if(!mesaj){ toast("Mesaj alanını doldur!","error"); return; }
  try{
    await db.collection("sikayetler").add({
      uid: mevcutKullanici.uid,
      username: kullaniciVerisi.username||"?",
      tip,
      mesaj,
      tarih: firebase.firestore.Timestamp.now()
    });
    document.getElementById("sikayet-mesaj").value="";
    toast("Şikayetin iletildi! Teşekkürler 🙏","success");
  }catch(e){ toast("Gönderim hatası: "+e.message,"error"); }
}
document.getElementById("btn-kullanici-sikayet").addEventListener("click",()=>sikayetGonder("kullanici"));
document.getElementById("btn-sistem-sikayet").addEventListener("click",()=>sikayetGonder("sistem"));

// (Madenciler artık profilde değil — tünel modalında)
function madencilerModalRender_deprecated(){}  // eski fonksiyon kaldırıldı

function madencilerModalRender(){
  if(!kullaniciVerisi) return;
  const v=kullaniciVerisi;
  const grid=document.getElementById("miners-grid-modal"); grid.innerHTML="";
  const aktifM=madenciBul(v.madenci);

  MADENCILER.forEach(m=>{
    const isActive=v.madenci===m.id;
    const isOwned=isActive||(m.katsayi<(aktifM?aktifM.katsayi:2));
    const card=document.createElement("div");
    card.className=`miner-card-modal ${m.id}${isActive?" active-m":""}${m.maliyet===0?" ":""}`;

    let btn="";
    if(isActive) btn=`<button class="btn-secondary mc-btn" disabled>✅ Aktif</button>`;
    else if(isOwned) btn=`<button class="btn-banknot mc-btn" onclick="madenciSecile('${m.id}')">⚙️ Seç</button>`;
    else{
      const si=m.birim==="altin"?"🥇":"💵";
      btn=`<button class="btn-primary mc-btn" onclick="madenciSatinAl('${m.id}')">${si} ${m.maliyet}</button>`;
    }

    card.innerHTML=`<span class="mc-emoji">${m.emoji}</span><div class="mc-name">${m.id}</div><div class="mc-coeff">×${m.katsayi} Katsayı</div>${btn}`;
    grid.appendChild(card);
  });
}

async function madenciSecile(id){
  if(!mevcutKullanici) return;
  try{
    const ng=gucHesapla({...kullaniciVerisi,madenci:id});
    await veriGuncelle(mevcutKullanici.uid,{madenci:id,guc:ng});
    toast(id+" aktif edildi! ⛏️","success");
    madencilerModalRender();
  }catch(e){ toast("Hata: "+e.message,"error"); }
}

async function madenciSatinAl(id){
  if(!mevcutKullanici||!kullaniciVerisi) return;
  const m=madenciBul(id); if(!m) return;
  const v=kullaniciVerisi;
  if(m.birim==="altin"&&v.altin<m.maliyet){ toast("Yeterli Altın yok! Gerekli: "+m.maliyet+" 🥇","error"); return; }
  if(m.birim==="banknot"&&v.banknot<m.maliyet){ toast("Yeterli Banknot yok! Gerekli: "+m.maliyet+" 💵","error"); return; }
  try{
    const g={madenci:id,guc:gucHesapla({...v,madenci:id})};
    if(m.birim==="altin")   g.altin   =firebase.firestore.FieldValue.increment(-m.maliyet);
    if(m.birim==="banknot") g.banknot =firebase.firestore.FieldValue.increment(-m.maliyet);
    await veriGuncelle(mevcutKullanici.uid,g);
    toast(m.id+" satın alındı! 🎉","success");
    madencilerModalRender();
  }catch(e){ toast("Hata: "+e.message,"error"); }
}

// ============================================================
// AVATAR SEÇİCİ
// ============================================================
document.getElementById("profile-big-avatar").addEventListener("click",avatarModalAc);
document.getElementById("avatar-modal-close").addEventListener("click",()=>document.getElementById("avatar-modal").classList.add("hidden"));
document.getElementById("avatar-modal").addEventListener("click",e=>{ if(e.target===document.getElementById("avatar-modal")) document.getElementById("avatar-modal").classList.add("hidden"); });

function avatarModalAc(){
  const grid=document.getElementById("avatar-grid"); grid.innerHTML="";
  const mevcutAvatar=kullaniciVerisi?.avatar||"👷";
  AVATARLAR.forEach(av=>{
    const btn=document.createElement("button");
    btn.className="avatar-option"+(av===mevcutAvatar?" selected":"");
    btn.textContent=av;
    btn.addEventListener("click",async()=>{
      if(!mevcutKullanici) return;
      try{ await veriGuncelle(mevcutKullanici.uid,{avatar:av,profilFoto:null}); document.getElementById("avatar-modal").classList.add("hidden"); toast("Avatar güncellendi! "+av,"success"); }
      catch(e){ toast("Hata: "+e.message,"error"); }
    });
    grid.appendChild(btn);
  });
  document.getElementById("avatar-modal").classList.remove("hidden");
}

// ============================================================
// TÜNEL TIKLA → MADENCİ MODAL
// ============================================================
document.getElementById("tunnel-clickable").addEventListener("click",()=>{
  if(!kullaniciVerisi) return;
  madencilerModalRender();
  document.getElementById("miner-modal").classList.remove("hidden");
});
document.getElementById("miner-modal-close").addEventListener("click",()=>document.getElementById("miner-modal").classList.add("hidden"));
document.getElementById("miner-modal").addEventListener("click",e=>{ if(e.target===document.getElementById("miner-modal")) document.getElementById("miner-modal").classList.add("hidden"); });

// ============================================================
// ÜRETİM SEÇİMİ MODAL
// ============================================================
document.getElementById("sip-edit-btn").addEventListener("click",()=>{
  if(!kullaniciVerisi) return;
  const val = kullaniciVerisi.uretimAltin||0;
  document.getElementById("uretim-slider").value = val;
  document.getElementById("uretim-altin-pct").textContent = val;
  document.getElementById("uretim-banknot-pct").textContent = 100-val;
  document.getElementById("uretim-fill-altin").style.width = val+"%";
  document.getElementById("uretim-modal").classList.remove("hidden");
});
document.getElementById("uretim-modal-close").addEventListener("click",()=>document.getElementById("uretim-modal").classList.add("hidden"));
document.getElementById("uretim-modal").addEventListener("click",e=>{ if(e.target===document.getElementById("uretim-modal")) document.getElementById("uretim-modal").classList.add("hidden"); });
document.getElementById("uretim-slider").addEventListener("input",e=>{
  const v=parseInt(e.target.value);
  document.getElementById("uretim-altin-pct").textContent=v;
  document.getElementById("uretim-banknot-pct").textContent=100-v;
  document.getElementById("uretim-fill-altin").style.width=v+"%";
});
document.getElementById("btn-uretim-kaydet").addEventListener("click",async()=>{
  const v = parseInt(document.getElementById("uretim-slider").value);
  try{
    await veriGuncelle(mevcutKullanici.uid,{uretimAltin:v});
    document.getElementById("uretim-modal").classList.add("hidden");
    toast(`Üretim tercihi: %${v} Altın / %${100-v} Banknot`,"success");
  }catch(e){ toast("Hata: "+e.message,"error"); }
});

// ============================================================
// NAVİGASYON (Sol Sidebar)
// ============================================================
document.getElementById("sidebar").addEventListener("click",e=>{
  const btn=e.target.closest(".sidebar-btn"); if(!btn) return;
  const sayfa=btn.dataset.page; if(!sayfa) return;
  sayfayaGit(sayfa);
});

function sayfayaGit(sayfa){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".sidebar-btn").forEach(b=>b.classList.remove("active"));
  const pageEl=document.getElementById("page-"+sayfa);
  const navEl=document.getElementById("snav-"+sayfa);
  if(pageEl) pageEl.classList.add("active");
  if(navEl)  navEl.classList.add("active");
  aktifSayfa=sayfa;
  switch(sayfa){
    case "village":     koyGuncelle(); break;
    case "market":      marketGuncelle(); break;
    case "leaderboard": siralamaSayfaGuncelle(); break;
    case "inventory":   envanterGuncelle(); break;
  }
  document.getElementById("main-content").scrollTo({top:0,behavior:"smooth"});
}

// ============================================================
// GLOBAL (HTML onclick)
// ============================================================
window.sandikAc       = sandikAc;
window.madenciSatinAl = madenciSatinAl;
window.madenciSecile  = madenciSecile;
window.dolapSatinAl   = dolapSatinAl;

// ============================================================
// BAŞLAT
// ============================================================
authPartikullerBaslat();

console.log("%c⛏️ ReisZa%c — Başlatıldı","color:#f5c842;font-size:18px;font-weight:bold;font-family:serif;","color:#e87c2a;font-size:12px;");
