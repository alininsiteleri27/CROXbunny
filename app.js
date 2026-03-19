const { useState, useEffect, useRef, useMemo } = React;

// --- MOCK DATABASE (localStorage Tabanlı Simülasyon) ---
const MOCK_DATA = {
  users: [
    { id: 1, name: 'Ali Yılmaz', username: 'aliyilmaz', avatar: 'https://i.pravatar.cc/150?u=1', role: 'student', grade: 11, score: 85, following: [2], followers: [], bio: 'Matematik aşığı.' },
    { id: 2, name: 'Ayşe Kaya', username: 'aysekaya', avatar: 'https://i.pravatar.cc/150?u=2', role: 'student', grade: 12, score: 92, following: [1], followers: [1], bio: 'YKS 2024 Yolcusu' },
    { id: 3, name: 'Ahmet Hoca', username: 'ahmethoca', avatar: 'https://i.pravatar.cc/150?u=3', role: 'teacher', branch: 'Matematik', following: [], followers: [1,2], bio: 'Hayat bir denklemdir.' }
  ],
  stories: [
    { id: 101, userId: 2, image: 'https://picsum.photos/400/800?random=1', text: 'Bugün deneme çok zordu!', timestamp: Date.now() - 3600000, seenBy: [] },
    { id: 102, userId: 3, image: 'https://picsum.photos/400/800?random=2', text: 'Yarın türev quiz var gençler.', timestamp: Date.now() - 7200000, seenBy: [1] }
  ],
  posts: [
    { id: 201, userId: 1, content: 'Trigonometri formüllerini ezberlemenin kolay bir yolu var mı?', image: null, likes: 5, timestamp: Date.now() - 10000, comments: [{ userId: 3, text: 'Özel üçgenleri çizerek başla.' }] },
    { id: 202, userId: 2, content: 'Kütüphanede çalışıyorum, katılmak isteyen var mı?', image: 'https://picsum.photos/600/400?random=3', likes: 12, timestamp: Date.now() - 86400000, comments: [] }
  ],
  messages: [] // { id, fromId, toId, text, timestamp }
};

if (!localStorage.getItem('educonnect_db')) {
  localStorage.setItem('educonnect_db', JSON.stringify(MOCK_DATA));
}

const getDB = () => JSON.parse(localStorage.getItem('educonnect_db'));
const saveDB = (data) => localStorage.setItem('educonnect_db', JSON.stringify(data));

// --- BİLEŞENLER ---

const LoginRegister = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', grade: '9', branch: '', score: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const db = getDB();
    if (isLogin) {
      const u = db.users.find(u => u.username === form.username || u.email === form.username);
      if (u) {
        onLogin(u);
      } else {
        alert('Kullanıcı bulunamadı!');
      }
    } else {
      const newUser = {
        id: Date.now(), ...form, role, avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
        following: [], followers: [], bio: 'Yeni katıldı.'
      };
      db.users.push(newUser);
      saveDB(db);
      onLogin(newUser);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel animate-slide-up">
        <div className="auth-header">
          <h1 className="auth-title">EduConnect</h1>
          <p className="auth-subtitle">Okulunun Sosyal Ağına {isLogin ? 'Giriş Yap' : 'Katıl'}</p>
        </div>
        
        <div className="auth-tabs">
          <div className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Giriş Yap</div>
          <div className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Kayıt Ol</div>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group mb-4">
               <label className="form-label">Kayıt Tipi</label>
               <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                 <option value="student">Öğrenci</option>
                 <option value="teacher">Öğretmen</option>
               </select>
            </div>
          )}

          {!isLogin && (
            <>
              <div className="form-group">
                <input className="form-control" placeholder="Ad Soyad" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <input className="form-control" type="email" placeholder="E-posta" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </>
          )}

          <div className="form-group">
            <input className="form-control" placeholder="Kullanıcı Adı" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          </div>
          <div className="form-group">
            <input className="form-control" type="password" placeholder="Şifre" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>

          {!isLogin && role === 'student' && (
            <>
              <div className="form-group mt-2">
                <select className="form-control" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                  <option value="9">9. Sınıf</option>
                  <option value="10">10. Sınıf</option>
                  <option value="11">11. Sınıf</option>
                  <option value="12">12. Sınıf</option>
                </select>
              </div>
              <div className="form-group">
                <input className="form-control" type="number" placeholder="Ortalama Sınav Neti" value={form.score} onChange={e => setForm({...form, score: parseFloat(e.target.value)})} />
              </div>
            </>
          )}

          {!isLogin && role === 'teacher' && (
            <div className="form-group mt-2">
               <input className="form-control" placeholder="Branş (Fizik, Mat..)" required value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} />
            </div>
          )}

          {isLogin && (
            <div className="flex-row justify-between mb-4 mt-2" style={{fontSize:'0.85rem'}}>
              <label className="flex-row gap-2" style={{color:'var(--text-muted)'}}><input type="checkbox"/> Beni Hatırla</label>
              <a href="#" className="text-primary">Şifremi Unuttum</a>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-100 mt-4">
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Story Viewer Modal ---
const StoryViewer = ({ stories, initialIndex, onClose, currentUser }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return p + 2; // ~5 sec per story
      });
    }, 100);
    return () => clearInterval(timer);
  }, [currentIndex, stories.length]);

  const story = stories[currentIndex];
  const isOwner = story.userId === currentUser.id;

  return (
    <div className="modal-overlay">
      <div className="story-viewer">
        <div className="story-progress-container">
          {stories.map((s, i) => (
             <div key={s.id} className="story-progress-bar">
               <div className="story-progress-fill" style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }}></div>
             </div>
          ))}
        </div>
        <div className="story-header-overlay">
           <div className="story-user">
             <img src={`https://i.pravatar.cc/150?u=${story.userId}`} className="avatar avatar-sm" />
             <span>{story.userId === currentUser.id ? 'Sen' : 'Kullanıcı'}</span>
           </div>
           <button onClick={onClose} style={{color:'white', fontSize:'1.2rem'}}><i className="fas fa-times"></i></button>
        </div>
        <div className="story-content">
          <img src={story.image} alt="Story" />
          <h3 style={{position:'absolute', color:'white', textShadow:'0 2px 4px rgba(0,0,0,0.8)', textAlign:'center', padding:'1rem'}}>{story.text}</h3>
        </div>
        
        <div className="story-nav-area story-nav-left" onClick={() => {if(currentIndex>0){setCurrentIndex(idx=>idx-1); setProgress(0);}}}></div>
        <div className="story-nav-area story-nav-right" onClick={() => {if(currentIndex<stories.length-1){setCurrentIndex(idx=>idx+1); setProgress(0);}else{onClose()}}}></div>

        {!isOwner && (
          <div className="story-reply relative">
            <input type="text" placeholder="Yanıt gönder..." onClick={e=>e.stopPropagation()} />
          </div>
        )}
        {isOwner && (
          <div className="story-reply text-center" style={{color:'white', fontSize:'0.9rem'}}>
             <i className="fas fa-eye"></i> {story.seenBy.length} Görüntülenme
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const MainApp = ({ user, onLogout }) => {
  const [db, setDb] = useState(getDB());
  const [activeTab, setActiveTab] = useState('sosyalles'); // sosyalles, okul, sinav, projeler, admin
  const [activeMenu, setActiveMenu] = useState('feed'); // feed, chat, rank, profile
  const [dropdownProfile, setDropdownProfile] = useState(false);
  const [dropdownHamburger, setDropdownHamburger] = useState(false);
  
  const [viewingStoryIndex, setViewingStoryIndex] = useState(null);
  const [targetProfile, setTargetProfile] = useState(null); // Modalda profil görmek için

  const refreshDB = () => setDb(getDB());

  // Helper getters
  const getUser = id => db.users.find(u => u.id === id);
  const activeStories = db.stories.filter(s => Date.now() - s.timestamp < 24*3600000); // 24h
  // Benim takip ettiklerimin storyleri + Benimkiler
  const visibleStories = activeStories.filter(s => s.userId === user.id || user.following.includes(s.userId));
  
  // Ana Akış - Gönderi oluştur
  const submitPost = (e) => {
    e.preventDefault();
    const text = e.target.postText.value;
    if(!text) return;
    const newDb = {...db};
    newDb.posts.unshift({
      id: Date.now(),
      userId: user.id,
      content: text,
      image: null,
      likes: 0,
      timestamp: Date.now(),
      comments: []
    });
    saveDB(newDb);
    refreshDB();
    e.target.reset();
  };

  return (
    <div className="app-container">
      {/* ÜST NAVİGASYON */}
      <nav className="navbar glass-panel" style={{borderRadius:0, borderBottom:'1px solid var(--border-color)'}}>
        <div className="nav-left relative">
           <div className="profile-dropdown-trigger" onClick={() => setDropdownProfile(!dropdownProfile)}>
             <img src={user.avatar} alt="Profile" className="avatar" />
             <span style={{fontWeight:600}} className="d-none d-md-block">{user.name}</span>
             <i className="fas fa-chevron-down" style={{fontSize:'0.8rem', color:'var(--text-muted)'}}></i>
           </div>
           
           {/* Profil Dropdown */}
           <div className={`dropdown-menu ${dropdownProfile ? 'show' : ''}`} style={{left:0, right:'auto'}}>
             <a className="dropdown-item" onClick={()=>{setTargetProfile(user); setDropdownProfile(false);}}><i className="fas fa-user-circle"></i> Profili Görüntüle</a>
             <a className="dropdown-item"><i className="fas fa-key"></i> Şifre Yenile</a>
             <a className="dropdown-item"><i className="fas fa-id-badge"></i> Kullanıcı Adı Değiştir</a>
             <a className="dropdown-item"><i className="fas fa-image"></i> Profil Fotoğrafı</a>
             <div className="dropdown-divider"></div>
             <a className="dropdown-item" style={{color:'var(--danger-color)'}} onClick={onLogout}><i className="fas fa-sign-out-alt"></i> Çıkış Yap</a>
           </div>
        </div>

        <div className="nav-center">
           <button className={`nav-tab ${activeTab === 'sosyalles' ? 'active' : ''}`} onClick={()=>{setActiveTab('sosyalles'); setActiveMenu('feed');}}><i className="fas fa-fire"></i> <span className="d-none d-md-inline">Sosyalleş</span></button>
           <button className={`nav-tab ${activeTab === 'okul' ? 'active' : ''}`} onClick={()=>setActiveTab('okul')}><i className="fas fa-school"></i> <span className="d-none d-md-inline">Okulum</span></button>
           <button className={`nav-tab ${activeTab === 'sinav' ? 'active' : ''}`} onClick={()=>setActiveTab('sinav')}><i className="fas fa-file-alt"></i> <span className="d-none d-md-inline">Deneme Çöz</span></button>
           <button className={`nav-tab ${activeTab === 'projeler' ? 'active' : ''}`} onClick={()=>setActiveTab('projeler')}><i className="fas fa-lightbulb"></i> <span className="d-none d-md-inline">Projeler</span></button>
        </div>

        <div className="nav-right relative">
           <button className="btn btn-circle btn-ghost" onClick={() => setDropdownHamburger(!dropdownHamburger)}>
             <i className="fas fa-bars" style={{fontSize:'1.2rem'}}></i>
           </button>
           {/* Menü Dropdown */}
           <div className={`dropdown-menu ${dropdownHamburger ? 'show' : ''}`}>
             <a className="dropdown-item"><i className="fas fa-book text-primary"></i> 📚 Dersler</a>
             <a className="dropdown-item"><i className="fas fa-clipboard-list text-primary"></i> 📝 Testler</a>
             <a className="dropdown-item"><i className="fas fa-file-signature text-primary"></i> 📄 Çıkmış Sorular</a>
             <a className="dropdown-item"><i className="fas fa-tasks text-primary"></i> 📋 Ödevler</a>
             <div className="dropdown-divider"></div>
             <a className="dropdown-item" onClick={()=>{setActiveMenu('chat'); setDropdownHamburger(false);}}><i className="fas fa-comments text-success"></i> 💬 Genel Chat</a>
             <a className="dropdown-item" onClick={()=>{setActiveTab('sosyalles'); setActiveMenu('rank'); setDropdownHamburger(false);}}><i className="fas fa-trophy text-warning"></i> 🏆 Sıralamam</a>
             <a className="dropdown-item"><i className="fas fa-chalkboard-teacher text-info"></i> 👨‍🏫 Öğretmene Mesaj</a>
             <a className="dropdown-item"><i className="fas fa-paper-plane text-secondary"></i> 📩 DM</a>
           </div>
        </div>
      </nav>

      {/* ANA İÇERİK IZGARASI */}
      <div className="main-content">
        
        {/* SOL SİDEBAR - HİKAYELER */}
        <aside className="left-sidebar">
          <div className="glass-panel story-section">
            <div className="story-header">
              Hikayeler
              <button className="btn btn-circle btn-ghost btn-sm"><i className="fas fa-plus"></i></button>
            </div>
            <div className="story-scroll-container">
              
              {/* Kendi Hikaye Ekleme */}
              <div className="story-item">
                <div className="story-ring add-story"><i className="fas fa-plus"></i></div>
                <div className="story-info">
                  <div className="name">Hikaye Ekle</div>
                  <div className="time">Fotoğraf veya video</div>
                </div>
              </div>

              {/* Diğer Hikayeler */}
              {visibleStories.map((s, idx) => {
                const u = getUser(s.userId);
                return (
                  <div className="story-item" key={s.id} onClick={() => setViewingStoryIndex(idx)}>
                    <div className="story-ring"><img src={u.avatar} alt="Avatar" /></div>
                    <div className="story-info">
                      <div className="name">{u.name}</div>
                      <div className="time">{new Date(s.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ORTA ALAN - İÇERİK */}
        <main className="feed-area">
          {activeMenu === 'feed' && activeTab === 'sosyalles' && (
            <div className="feed-container animate-fade-in">
              {/* Gönderi Oluşturma */}
              <div className="glass-panel create-post">
                <form onSubmit={submitPost}>
                  <div className="create-post-top">
                    <img src={user.avatar} className="avatar" />
                    <textarea name="postText" className="create-post-input" placeholder={`${user.name}, okulla ilgili ne düşünüyorsun?`}></textarea>
                  </div>
                  <div className="create-post-actions">
                     <div className="flex-row gap-2">
                       <button type="button" className="action-btn"><i className="fas fa-image"></i> Medya</button>
                       <button type="button" className="action-btn"><i className="fas fa-smile"></i> His</button>
                     </div>
                     <button type="submit" className="btn btn-primary btn-sm">Paylaş</button>
                  </div>
                </form>
              </div>

              {/* Gönderiler */}
              {db.posts.map(p => {
                const u = getUser(p.userId);
                return (
                  <div className="glass-panel post-card animate-slide-up" key={p.id}>
                    <div className="post-header">
                      <div className="post-user cursor-pointer" onClick={()=>setTargetProfile(u)}>
                        <img src={u.avatar} className="avatar" />
                        <div className="post-user-info">
                          <div className="name">{u.name} <span className={`role-badge ${u.role === 'teacher'?'teacher':''}`}>{u.role==='teacher'?'Öğretmen':`${u.grade}. Sınıf`}</span></div>
                          <div className="meta">@{u.username} • {new Date(p.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-circle"><i className="fas fa-ellipsis-h"></i></button>
                    </div>
                    <div className="post-content">{p.content}</div>
                    {p.image && <img src={p.image} className="post-image" />}
                    
                    <div className="post-stats mt-3">
                      <span>{p.likes} Beğeni</span>
                      <span>{p.comments.length} Yorum</span>
                    </div>
                    
                    <div className="post-actions mt-2">
                      <button className="post-action active"><i className="fas fa-heart text-secondary"></i> Beğen</button>
                      <button className="post-action"><i className="fas fa-comment"></i> Yorum Yap</button>
                      <button className="post-action"><i className="fas fa-share"></i> Paylaş</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeMenu === 'chat' && (
             <div className="glass-panel p-4 animate-fade-in" style={{minHeight:'600px', display:'flex', flexDirection:'column'}}>
                <h2 className="mb-4"><i className="fas fa-comments text-success"></i> Okul Genel Chat</h2>
                <div style={{flex:1, background:'var(--bg-body)', borderRadius:'var(--radius-lg)', padding:'1rem', overflowY:'auto'}}>
                  <div className="text-center text-muted mb-3"><small>Bugün</small></div>
                  <div className="flex-row gap-2 mb-3">
                    <img src={db.users[1].avatar} className="avatar avatar-sm"/>
                    <div className="glass-panel p-2" style={{borderRadius:'0 1rem 1rem 1rem'}}>
                      <div style={{fontWeight:'bold', fontSize:'0.8rem', color:'var(--secondary-color)'}}>{db.users[1].name}</div>
                      Yarınki fizik sınavı hangi konulardandı?
                    </div>
                  </div>
                  <div className="flex-row gap-2 mb-3" style={{flexDirection:'row-reverse'}}>
                    <div className="glass-panel p-2" style={{borderRadius:'1rem 0 1rem 1rem', background:'var(--primary-color)', color:'white'}}>
                      Dinamik ve iş-güç-enerji dediler.
                    </div>
                  </div>
                </div>
                <div className="flex-row gap-2 mt-3">
                  <input className="form-control" style={{borderRadius:'var(--radius-full)'}} placeholder="Mesaj yaz..." />
                  <button className="btn btn-primary btn-circle"><i className="fas fa-paper-plane"></i></button>
                </div>
             </div>
          )}

          {activeTab === 'okul' && activeMenu !== 'chat' && (
            <div className="glass-panel p-4 animate-fade-in text-center">
               <h1 className="mb-4">Okulum</h1>
               <i className="fas fa-school text-primary" style={{fontSize:'4rem'}}></i>
               <p className="mt-4 text-muted">Okul duyuruları, etkinlikler ve haberler burada listelenecek.</p>
            </div>
          )}

          {activeTab === 'sinav' && (
            <div className="glass-panel p-4 animate-fade-in text-center">
               <h1 className="mb-4">Deneme & Sınavlar</h1>
               <i className="fas fa-edit text-accent" style={{fontSize:'4rem'}}></i>
               <p className="mt-4 text-muted">Online denemeler, geçmiş PDF'ler ve sonuçları buradan takip edebilirsiniz.</p>
            </div>
          )}
        </main>

        {/* SAĞ SİDEBAR - SIRALAMAM & ARAMA */}
        <aside className="right-sidebar">
           {/* ARAMA */}
           <div className="glass-panel search-widget animate-slide-up">
              <div className="search-input-wrap">
                 <i className="fas fa-search"></i>
                 <input type="text" className="search-input" placeholder="Kullanıcı ara..." />
              </div>
           </div>

           {/* SIRALAMAM LİSTESİ */}
           <div className="glass-panel rank-widget animate-slide-up" style={{animationDelay:'0.1s'}}>
              <div className="rank-widget-header">
                <span className="flex-row gap-2"><i className="fas fa-trophy text-warning"></i> Sınav Sıralaması</span>
                <i className="fas fa-filter text-muted cursor-pointer"></i>
              </div>
              <div className="rank-list">
                {db.users.filter(u=>u.role==='student').sort((a,b)=>b.score - a.score).map((u, i) => (
                  <div className="rank-item cursor-pointer" key={u.id} onClick={()=>setTargetProfile(u)}>
                     <div className="rank-number">{i+1}</div>
                     <img src={u.avatar} className="avatar avatar-sm"/>
                     <div className="rank-user-info">
                        <div className="name">{u.name}</div>
                        <div className="score">{u.score.toFixed(1)} Net</div>
                     </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline w-100 mt-4 btn-sm" onClick={()=>{setActiveTab('sosyalles'); setActiveMenu('rank');}}>Tam Listeyi Gör</button>
           </div>
        </aside>

      </div>

      {/* Profil Görüntüleme Modalı */}
      {targetProfile && (
        <div className="modal-overlay" onClick={()=>setTargetProfile(null)}>
           <div className="profile-modal animate-slide-up" onClick={e=>e.stopPropagation()}>
              <div className="profile-modal-header">
                 <div className="close-modal-btn" onClick={()=>setTargetProfile(null)}><i className="fas fa-times"></i></div>
              </div>
              <div className="profile-modal-body">
                 <img src={targetProfile.avatar} className="profile-modal-avatar"/>
                 <h2 className="mt-3">{targetProfile.name}</h2>
                 <p className="text-muted">@{targetProfile.username} {targetProfile.role==='teacher' ? `• ${targetProfile.branch} Öğretmeni` : `• ${targetProfile.grade}. Sınıf`}</p>
                 <p className="mt-2" style={{fontStyle:'italic', color:'var(--text-light)'}}>"{targetProfile.bio}"</p>
                 
                 <div className="profile-stats-bar">
                    <div className="profile-stat-item">
                       <span className="profile-stat-number">{targetProfile.followers.length}</span>
                       <span className="profile-stat-label">Takipçi</span>
                    </div>
                    <div className="profile-stat-item">
                       <span className="profile-stat-number">{targetProfile.following.length}</span>
                       <span className="profile-stat-label">Takip Edilen</span>
                    </div>
                    {targetProfile.role === 'student' && (
                      <div className="profile-stat-item">
                         <span className="profile-stat-number text-primary">{targetProfile.score || 0}</span>
                         <span className="profile-stat-label">Ort. Net</span>
                      </div>
                    )}
                 </div>

                 <div className="flex-row justify-center gap-2 mt-4">
                    {targetProfile.id !== user.id && (
                      <>
                        <button className="btn btn-primary"><i className="fas fa-user-plus"></i> Takip Et</button>
                        <button className="btn btn-outline"><i className="fas fa-envelope"></i> Mesaj</button>
                      </>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Story Viewer */}
      {viewingStoryIndex !== null && (
        <StoryViewer 
           stories={visibleStories} 
           initialIndex={viewingStoryIndex} 
           onClose={() => setViewingStoryIndex(null)} 
           currentUser={user}
        />
      )}

      {/* Sabit Destek Butonu */}
      <div className="support-fab" title="Canlı Destek / Yardım">
        <i className="fas fa-headset"></i>
      </div>
    </div>
  );
};

// --- APP Kök Bileşeni ---
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

  // Tema Kontrolü - Basit Simülasyon (İstenirse butona bağlanabilir)
  useEffect(() => {
    // document.documentElement.setAttribute('data-theme', 'dark'); // Örnek karanlık tema
  }, []);

  return (
    <>
      {!currentUser ? (
        <LoginRegister onLogin={(user) => setCurrentUser(user)} />
      ) : (
        <MainApp user={currentUser} onLogout={() => setCurrentUser(null)} />
      )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
