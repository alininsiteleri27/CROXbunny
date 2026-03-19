const { useState, useEffect, useRef, useMemo } = React;

// --- FIREBASE BAĞLANTISI ---
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

// Uygulamayı Başlat
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

const auth = firebase.auth();
const dbRef = firebase.database();

// Firebase Object'ini Array'e çevirme yardımcısı
const toArray = (obj) => {
  if (!obj) return [];
  return Object.keys(obj).map(key => ({ id: key, ...obj[key] }));
};

// --- KİMLİK DOĞRULAMA (Arayüz 1) ---
const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', grade: '9', branch: '', score: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      auth.signInWithEmailAndPassword(form.email, form.password)
        .catch(err => alert('Giriş Hatası: ' + err.message));
    } else {
      auth.createUserWithEmailAndPassword(form.email, form.password)
        .then(cred => {
          // Kullanıcı profilini veritabanına kaydet
          const profile = {
            name: form.name,
            username: form.username,
            email: form.email,
            role: role,
            avatar: `https://i.pravatar.cc/150?u=${cred.user.uid}`,
            grade: form.grade || "",
            branch: form.branch || "",
            score: parseFloat(form.score) || 0,
            bio: 'Okula yeni katıldı!',
            timestamp: Date.now()
          };
          return dbRef.ref('users/' + cred.user.uid).set(profile);
        })
        .catch(err => alert('Kayıt Hatası: ' + err.message));
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
                <input className="form-control" placeholder="Kullanıcı Adı" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
              </div>
            </>
          )}

          <div className="form-group">
            <input className="form-control" type="email" placeholder="E-posta" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="form-group">
            <input className="form-control" type="password" placeholder="Şifre" required minLength="6" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
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
                <input className="form-control" type="number" step="0.1" placeholder="Ortalama Sınav Neti" value={form.score} onChange={e => setForm({...form, score: parseFloat(e.target.value)})} />
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
              <a href="#" className="text-primary" onClick={()=>{
                 if(!form.email) return alert('Lütfen e-posta adresinizi yazın.');
                 auth.sendPasswordResetEmail(form.email).then(()=>alert('Sıfırlama linki gönderildi!'));
              }}>Şifremi Unuttum</a>
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

// --- HİKAYE GÖSTERİCİ MODAL ---
const StoryViewer = ({ stories, initialIndex, onClose, currentUser }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Hikaye görüntülendi olarak işaretle
    const story = stories[currentIndex];
    if (story && story.userId !== currentUser.id) {
       dbRef.ref(`stories/${story.id}/seenBy/${currentUser.id}`).set(true);
    }

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
        return p + 2; // yaklaşık 5 saniye
      });
    }, 100);
    return () => clearInterval(timer);
  }, [currentIndex, stories.length]);

  if (!stories[currentIndex]) return null;

  const story = stories[currentIndex];
  const isOwner = story.userId === currentUser.id;
  const seenCount = story.seenBy ? Object.keys(story.seenBy).length : 0;

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
             <img src={story.userAvatar} className="avatar avatar-sm" />
             <span>{isOwner ? 'Sen' : story.userName}</span>
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
            <input type="text" placeholder="Yanıt gönder... (Yakında)" onClick={e=>e.stopPropagation()} />
          </div>
        )}
        {isOwner && (
          <div className="story-reply text-center" style={{color:'white', fontSize:'0.9rem'}}>
             <i className="fas fa-eye"></i> {seenCount} Görüntülenme
          </div>
        )}
      </div>
    </div>
  );
};

// --- ANA UYGULAMA BİLEŞENİ ---
const MainApp = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('sosyalles'); // sosyalles, okul, sinav, projeler
  const [activeMenu, setActiveMenu] = useState('feed'); // feed, chat, rank
  const [dropdownProfile, setDropdownProfile] = useState(false);
  const [dropdownHamburger, setDropdownHamburger] = useState(false);
  
  const [viewingStoryIndex, setViewingStoryIndex] = useState(null);
  const [targetProfile, setTargetProfile] = useState(null); 

  // --- Veritabanı State'leri ---
  const [users, setUsers] = useState({});
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Firebase Realtime Listener'lar
  useEffect(() => {
    // Tüm kullanıcıları dinle
    const usersRef = dbRef.ref('users');
    usersRef.on('value', snap => setUsers(snap.val() || {}));

    // Gönderileri dinle
    const postsRef = dbRef.ref('posts');
    postsRef.on('value', snap => {
      const pArr = toArray(snap.val()).sort((a,b) => b.timestamp - a.timestamp); // Yeni en üste
      setPosts(pArr);
    });

    // Hikayeleri dinle 
    const storiesRef = dbRef.ref('stories');
    storiesRef.on('value', snap => {
      // Sadece son 24 saati göster
      const now = Date.now();
      const sArr = toArray(snap.val())
        .filter(s => now - s.timestamp < 24 * 3600000)
        .sort((a,b) => a.timestamp - b.timestamp);
      setStories(sArr);
    });

    // Chat mesajlarını dinle
    const chatRef = dbRef.ref('chat');
    chatRef.on('value', snap => {
      const cArr = toArray(snap.val()).sort((a,b) => a.timestamp - b.timestamp); // Eskiler üstte, yeni en altta
      setChatMessages(cArr);
    });

    return () => {
      usersRef.off(); postsRef.off(); storiesRef.off(); chatRef.off();
    };
  }, []);

  // --- Kullanıcı Profil Bilgileri Helper ---
  const getFullUser = (uid) => {
    return users[uid] ? { id: uid, ...users[uid] } : { id: uid, name: 'Bilinmeyen', avatar: 'https://i.pravatar.cc/150' };
  };

  const myFollowings = currentUser.following ? Object.keys(currentUser.following) : [];

  // Görünür Hikayeler (Sadece Takip Ettiğim Kişiler + Ben)
  const visibleStories = stories.filter(s => s.userId === currentUser.id || myFollowings.includes(s.userId)).map(s => {
    const u = getFullUser(s.userId);
    return { ...s, userAvatar: u.avatar, userName: u.name };
  });

  // --- Aksiyon Fonksiyonları ---
  const sendPost = (e) => {
    e.preventDefault();
    const text = e.target.postText.value;
    if(!text.trim()) return;
    
    dbRef.ref('posts').push({
      userId: currentUser.id,
      content: text,
      timestamp: Date.now()
    });
    e.target.reset();
  };

  const toggleLike = (postId, postLikes) => {
    const isLiked = postLikes && postLikes[currentUser.id];
    if (isLiked) {
      dbRef.ref(`posts/${postId}/likes/${currentUser.id}`).remove();
    } else {
      dbRef.ref(`posts/${postId}/likes/${currentUser.id}`).set(true);
    }
  };

  const addComment = (e, postId) => {
    e.preventDefault();
    const text = e.target.commentText.value;
    if(!text.trim()) return;
    
    dbRef.ref(`posts/${postId}/comments`).push({
      userId: currentUser.id,
      text: text,
      timestamp: Date.now()
    });
    e.target.reset();
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    const text = e.target.chatText.value;
    if(!text.trim()) return;

    dbRef.ref('chat').push({
      userId: currentUser.id,
      text: text,
      timestamp: Date.now()
    });
    e.target.reset();
  };

  const addRandomStory = () => {
    const testImages = [
      'https://picsum.photos/400/800?random=101', 'https://picsum.photos/400/800?random=102', 
      'https://picsum.photos/400/800?random=103', 'https://picsum.photos/400/800?random=104'
    ];
    dbRef.ref('stories').push({
      userId: currentUser.id,
      image: testImages[Math.floor(Math.random()*testImages.length)],
      text: 'Bugün harika bir gün!',
      timestamp: Date.now()
    });
  };

  const toggleFollow = (targetId) => {
    const isFollowing = myFollowings.includes(targetId);
    if (isFollowing) {
      dbRef.ref(`users/${currentUser.id}/following/${targetId}`).remove();
      dbRef.ref(`users/${targetId}/followers/${currentUser.id}`).remove();
    } else {
      dbRef.ref(`users/${currentUser.id}/following/${targetId}`).set(true);
      dbRef.ref(`users/${targetId}/followers/${currentUser.id}`).set(true);
    }
  };

  const deletePost = (postId) => {
    if(confirm('Paylaşımı silmek istediğinize emin misiniz?')) {
      dbRef.ref(`posts/${postId}`).remove();
    }
  };

  // --- Yardımcı DOM referansları
  const chatMessagesEndRef = useRef(null);
  useEffect(() => {
    if (activeMenu === 'chat') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeMenu]);

  return (
    <div className="app-container">
      {/* ÜST NAVİGASYON */}
      <nav className="navbar glass-panel" style={{borderRadius:0, borderBottom:'1px solid var(--border-color)'}}>
        <div className="nav-left relative">
           <div className="profile-dropdown-trigger" onClick={() => setDropdownProfile(!dropdownProfile)}>
             <img src={currentUser.avatar} alt="Profile" className="avatar" />
             <span style={{fontWeight:600}} className="d-none d-md-block">{currentUser.name}</span>
             <i className="fas fa-chevron-down" style={{fontSize:'0.8rem', color:'var(--text-muted)'}}></i>
           </div>
           
           <div className={`dropdown-menu ${dropdownProfile ? 'show' : ''}`} style={{left:0, right:'auto'}}>
             <a className="dropdown-item" onClick={()=>{setTargetProfile(currentUser); setDropdownProfile(false);}}><i className="fas fa-user-circle"></i> Profili Görüntüle</a>
             <div className="dropdown-divider"></div>
             <a className="dropdown-item" style={{color:'var(--danger-color)'}} onClick={() => auth.signOut()}><i className="fas fa-sign-out-alt"></i> Çıkış Yap</a>
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
           <div className={`dropdown-menu ${dropdownHamburger ? 'show' : ''}`}>
             <a className="dropdown-item" onClick={()=>{setActiveTab('sosyalles'); setActiveMenu('chat'); setDropdownHamburger(false);}}><i className="fas fa-comments text-success"></i> 💬 Genel Chat</a>
             <a className="dropdown-item" onClick={()=>{setActiveTab('sosyalles'); setActiveMenu('rank'); setDropdownHamburger(false);}}><i className="fas fa-trophy text-warning"></i> 🏆 Sıralamam</a>
           </div>
        </div>
      </nav>

      {/* ANA İÇERİK IZGARASI */}
      <div className="main-content">
        
        {/* SOL SİDEBAR - HİKAYELER */}
        <aside className="left-sidebar">
          <div className="glass-panel story-section">
            <div className="story-header" title="Sadece takip ettiklerini görebilirsin">
              Hikayeler 
            </div>
            <div className="story-scroll-container">
              {/* Hikaye Ekle */}
              <div className="story-item" onClick={addRandomStory}>
                <div className="story-ring add-story"><i className="fas fa-plus"></i></div>
                <div className="story-info">
                  <div className="name">Hikaye Ekle</div>
                  <div className="time">Fotoğraf çek</div>
                </div>
              </div>

              {/* Hikayeler Döngüsü */}
              {visibleStories.map((s, idx) => {
                const ringStyle = (s.seenBy && s.seenBy[currentUser.id]) ? 'story-ring seen' : 'story-ring';
                return (
                  <div className="story-item" key={s.id} onClick={() => setViewingStoryIndex(idx)}>
                    <div className={ringStyle}><img src={s.userAvatar} /></div>
                    <div className="story-info">
                      <div className="name">{s.userName}</div>
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
              {/* POST OLUŞTUR */}
              <div className="glass-panel create-post">
                <form onSubmit={sendPost}>
                  <div className="create-post-top">
                    <img src={currentUser.avatar} className="avatar" />
                    <textarea name="postText" className="create-post-input" placeholder={`${currentUser.name}, kampüste neler oluyor?`} required></textarea>
                  </div>
                  <div className="create-post-actions">
                     <div className="flex-row gap-2"></div>
                     <button type="submit" className="btn btn-primary btn-sm">Paylaş</button>
                  </div>
                </form>
              </div>

              {/* POSTLAR */}
              {posts.map(p => {
                const postUser = getFullUser(p.userId);
                const iLikeThis = p.likes && p.likes[currentUser.id];
                const likeCount = p.likes ? Object.keys(p.likes).length : 0;
                const comments = toArray(p.comments);

                return (
                  <div className="glass-panel post-card animate-slide-up" key={p.id}>
                    <div className="post-header">
                      <div className="post-user cursor-pointer" onClick={()=>setTargetProfile(postUser)}>
                        <img src={postUser.avatar} className="avatar" />
                        <div className="post-user-info">
                          <div className="name">{postUser.name} <span className={`role-badge ${postUser.role === 'teacher'?'teacher':''}`}>{postUser.role==='teacher'?'Öğretmen':`${postUser.grade}. Sınıf`}</span></div>
                          <div className="meta">@{postUser.username} • {new Date(p.timestamp).toLocaleDateString()} {new Date(p.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                      </div>
                      {p.userId === currentUser.id && (
                         <button className="btn btn-ghost btn-circle" onClick={()=>deletePost(p.id)} title="Sil"><i className="fas fa-trash text-danger"></i></button>
                      )}
                    </div>
                    <div className="post-content">{p.content}</div>
                    
                    <div className="post-stats mt-3">
                      <span>{likeCount} Beğeni</span>
                      <span>{comments.length} Yorum</span>
                    </div>
                    
                    <div className="post-actions mt-2 pb-2" style={{borderBottom:'1px solid var(--border-color)'}}>
                      <button className={`post-action ${iLikeThis ? 'liked' : ''}`} onClick={()=>toggleLike(p.id, p.likes)}>
                         <i className="fas fa-heart"></i> Beğen
                      </button>
                      <button className="post-action"><i className="fas fa-comment"></i> Yorum Yap</button>
                    </div>

                    {/* YORUMLAR */}
                    <div className="comment-list">
                      {comments.map(c => {
                         const cUser = getFullUser(c.userId);
                         return (
                           <div className="comment-item" key={c.id}>
                              <img src={cUser.avatar} className="avatar avatar-sm" />
                              <div className="comment-bubble">
                                 <div className="name">{cUser.name}</div>
                                 <div className="text">{c.text}</div>
                              </div>
                           </div>
                         );
                      })}
                    </div>

                    {/* Yorum Ekle */}
                    <form className="comments-section" onSubmit={(e)=>addComment(e, p.id)}>
                      <img src={currentUser.avatar} className="avatar avatar-sm"/>
                      <div className="comment-input-wrapper">
                         <input type="text" name="commentText" className="comment-input" placeholder="Yorum yaz..." required/>
                         <button type="submit" className="comment-send-btn"><i className="fas fa-paper-plane"></i></button>
                      </div>
                    </form>

                  </div>
                );
              })}
              {posts.length === 0 && <div className="text-center text-muted mt-4">Henüz gönderi yok, ilk paylaşan sen ol!</div>}
            </div>
          )}

          {activeMenu === 'chat' && activeTab === 'sosyalles' && (
             <div className="glass-panel p-4 animate-fade-in" style={{height:'70vh', display:'flex', flexDirection:'column'}}>
                <h2 className="mb-4"><i className="fas fa-comments text-success"></i> Okul Genel Chat</h2>
                
                <div style={{flex:1, background:'var(--bg-body)', borderRadius:'var(--radius-lg)', padding:'1rem', overflowY:'auto'}}>
                  {chatMessages.length === 0 ? <p className="text-center text-muted mt-4">Henüz mesaj yok</p> : null}
                  {chatMessages.map(msg => {
                     const isMe = msg.userId === currentUser.id;
                     const msgUser = getFullUser(msg.userId);
                     return (
                        <div key={msg.id} className="flex-row gap-2 mb-3" style={{flexDirection: isMe ? 'row-reverse' : 'row', alignItems:'flex-end'}}>
                           <img src={msgUser.avatar} className="avatar avatar-sm" title={msgUser.name}/>
                           <div className="glass-panel p-2" style={{
                              borderRadius: isMe ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                              background: isMe ? 'var(--primary-color)' : 'var(--bg-surface)',
                              color: isMe ? 'white' : 'var(--text-main)',
                              maxWidth: '75%'
                           }}>
                             {!isMe && <div style={{fontWeight:'bold', fontSize:'0.75rem', color:'var(--secondary-color)', marginBottom:'0.2rem'}}>{msgUser.name}</div>}
                             <div style={{fontSize:'0.95rem'}}>{msg.text}</div>
                           </div>
                        </div>
                     )
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>

                <form className="flex-row gap-2 mt-3" onSubmit={sendChatMessage}>
                  <input type="text" name="chatText" className="form-control" style={{borderRadius:'var(--radius-full)'}} placeholder="Sınıfa veya okula mesaj gönder..." required autoComplete="off" />
                  <button type="submit" className="btn btn-primary btn-circle"><i className="fas fa-paper-plane"></i></button>
                </form>
             </div>
          )}
        </main>

        {/* SAĞ SİDEBAR - SIRALAMAM & ARAMA */}
        <aside className="right-sidebar">
           <div className="glass-panel search-widget animate-slide-up">
              <div className="search-input-wrap">
                 <i className="fas fa-search"></i>
                 <input type="text" className="search-input" placeholder="İsimle kullanıcı ara..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
              </div>
           </div>

           <div className="glass-panel rank-widget animate-slide-up" style={{animationDelay:'0.1s'}}>
              <div className="rank-widget-header">
                <span className="flex-row gap-2"><i className="fas fa-trophy text-warning"></i> Net Sıralaması</span>
              </div>
              <div className="rank-list">
                {Object.keys(users)
                  .map(uid => ({ id: uid, ...users[uid] }))
                  .filter(u => u.role === 'student')
                  .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a,b) => (b.score || 0) - (a.score || 0))
                  .slice(0, 10)
                  .map((u, i) => (
                    <div className="rank-item cursor-pointer" key={u.id} onClick={()=>setTargetProfile(u)}>
                       <div className="rank-number">{i+1}</div>
                       <img src={u.avatar} className="avatar avatar-sm"/>
                       <div className="rank-user-info">
                          <div className="name">{u.name}</div>
                          <div className="score">{(u.score||0).toFixed(1)} Net</div>
                       </div>
                    </div>
                ))}
              </div>
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
                 <p className="text-muted">@{targetProfile.username} {targetProfile.role==='teacher' ? `• ${targetProfile.branch} Öğretmen` : `• ${targetProfile.grade}. Sınıf`}</p>
                 <p className="mt-2" style={{fontStyle:'italic', color:'var(--text-light)'}}>"{targetProfile.bio}"</p>
                 
                 <div className="profile-stats-bar">
                    <div className="profile-stat-item">
                       <span className="profile-stat-number">{targetProfile.followers ? Object.keys(targetProfile.followers).length : 0}</span>
                       <span className="profile-stat-label">Takipçi</span>
                    </div>
                    <div className="profile-stat-item">
                       <span className="profile-stat-number">{targetProfile.following ? Object.keys(targetProfile.following).length : 0}</span>
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
                    {targetProfile.id !== currentUser.id && (
                      <>
                        <button className={`btn ${myFollowings.includes(targetProfile.id) ? 'btn-outline' : 'btn-primary'}`} 
                                onClick={() => toggleFollow(targetProfile.id)}>
                             <i className="fas fa-user-plus"></i> {myFollowings.includes(targetProfile.id) ? 'Takipten Çık' : 'Takip Et'}
                        </button>
                        <button className="btn btn-outline" onClick={()=>alert('Kişisel mesajlaşma yakında eklenecek!')}><i className="fas fa-envelope"></i> Mesaj</button>
                      </>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Story Viewer (Tam Ekran) */}
      {viewingStoryIndex !== null && (
        <StoryViewer 
           stories={visibleStories} 
           initialIndex={viewingStoryIndex} 
           onClose={() => setViewingStoryIndex(null)} 
           currentUser={currentUser}
        />
      )}

      {/* Sabit Destek Butonu */}
      <div className="support-fab" title="Destek / Yardım" onClick={()=>alert('Destek ekibine ulaşıyorsunuz...')}>
        <i className="fas fa-headset"></i>
      </div>
    </div>
  );
};


// --- APP Ana Başlatıcı ---
const App = () => {
  const [currentUserObj, setCurrentUserObj] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Auth State Tracker
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // Oturum açık, profili çek
        const userRef = dbRef.ref('users/' + user.uid);
        userRef.on('value', snap => {
          if (snap.exists()) {
            setCurrentUserObj({ id: user.uid, ...snap.val() });
          } else {
            console.error('Kayıtlı profil verisi bulunamadı!');
          }
          setLoading(false);
        });
        
        return () => userRef.off();
      } else {
        // Oturum kapalı
        setCurrentUserObj(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{color:'white', textAlign:'center', marginTop:'20%'}}>Yükleniyor...</div>;

  return (
    <>
      {!currentUserObj ? (
        <LoginRegister />
      ) : (
        <MainApp currentUser={currentUserObj} />
      )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
