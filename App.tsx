import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Plus, Minus, X, Settings, Utensils, Trash2, 
  Zap, Flame, Palette, ArrowLeft, ShoppingBag, Sparkles, 
  Image as ImageIcon, Info, Clock, Edit2, LogOut, LogIn
} from 'lucide-react';
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, 
  query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// @ts-ignore - Consolidated to a single line so the @ts-ignore correctly covers all members and types
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { db, auth, storage } from './firebase';
import { Dish, CartItem, Category } from './types';

export default function App() {
  const [menu, setMenu] = useState<Dish[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'MENU' | 'ADMIN'>('MENU');
  const [activeTheme, setActiveTheme] = useState<'CYBER' | 'RAINBOW'>('CYBER');
  const [activeCategory, setActiveCategory] = useState<Category | 'Всі'>('Всі');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Admin Form State
  const [newDish, setNewDish] = useState<Partial<Dish> & { ingredientsInput: string }>({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'Основні страви',
    ingredientsInput: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync Auth
  useEffect(() => {
    // @ts-ignore
    const unsub = onAuthStateChanged(auth, (u: any) => {
      setUser(u);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  // Sync Firestore
  useEffect(() => {
    const q = query(collection(db, 'dishes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as Dish));
      setMenu(items);
    });
    return unsub;
  }, []);

  // Theme Handling
  useEffect(() => {
    if (activeTheme === 'CYBER') {
      document.body.style.backgroundColor = '#121212';
      document.body.classList.remove('rainbow-mode');
    } else {
      document.body.style.backgroundColor = '#ffffff';
      document.body.classList.add('rainbow-mode');
    }
  }, [activeTheme]);

  const categories: (Category | 'Всі')[] = ['Всі', 'Перші страви', 'Основні страви', 'Закуски', 'Десерти'];

  const filteredMenu = useMemo(() => {
    if (activeCategory === 'Всі') return menu;
    return menu.filter(dish => dish.category === activeCategory);
  }, [menu, activeCategory]);

  const addToCart = (dish: Dish, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item => 
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // @ts-ignore
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      alert('Помилка входу: ' + err.message);
    }
  };

  const handleLogout = () => {
    // @ts-ignore
    signOut(auth);
    setCurrentView('MENU');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `dishes/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setNewDish(prev => ({ ...prev, image: url }));
    } catch (err: any) {
      alert('Помилка завантаження фото: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDish.image) return alert('Завантажте фото!');
    
    const ingredients = newDish.ingredientsInput?.split(',').map(i => i.trim()).filter(Boolean) || [];
    const dishData = {
      name: newDish.name,
      description: newDish.description,
      price: Number(newDish.price),
      image: newDish.image,
      category: newDish.category,
      ingredients,
      createdAt: serverTimestamp()
    };

    try {
      if (editingDishId) {
        await updateDoc(doc(db, 'dishes', editingDishId), dishData);
        alert('Страву оновлено!');
      } else {
        await addDoc(collection(collection(db, 'dishes')), dishData);
        alert('Страву додано!');
      }
      setEditingDishId(null);
      setNewDish({ name: '', description: '', price: 0, image: '', category: 'Основні страви', ingredientsInput: '' });
      setCurrentView('MENU');
    } catch (err: any) {
      alert('Помилка збереження: ' + err.message);
    }
  };

  const deleteFromMenu = async (id: string) => {
    if (!confirm('Видалити страву?')) return;
    try {
      await deleteDoc(doc(db, 'dishes', id));
      setCart(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert('Помилка видалення: ' + err.message);
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isCyber = activeTheme === 'CYBER';
  const accentColor = isCyber ? 'text-cyber-neon' : 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500';
  const buttonAccent = isCyber ? 'bg-cyber-pink hover:shadow-[0_0_20px_#FF007F]' : 'bg-gradient-to-r from-red-500 to-purple-600 hover:scale-105';
  const cardStyles = isCyber ? 'bg-cyber-dark border-white/10 rounded-none' : 'bg-white border-2 border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50';
  const navStyles = isCyber ? 'bg-cyber-bg/90 border-cyber-neon/30' : 'bg-white/90 border-slate-200 shadow-lg';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-bg text-cyber-neon font-cyber">
        <Zap className="animate-pulse mr-4" size={48} />
        <span className="text-2xl tracking-[0.5em]">ВАНТАЖЕННЯ...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-700 ${isCyber ? 'bg-cyber-bg text-white font-cyber' : 'bg-white text-slate-800 font-sans'}`}>
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-all duration-500 ${navStyles}`}>
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setCurrentView('MENU'); setEditingDishId(null);}}>
            <Zap className={`w-8 h-8 ${isCyber ? 'text-cyber-neon' : 'text-yellow-400'}`} />
            <h1 className={`text-xl md:text-2xl font-black tracking-tighter ${isCyber ? 'text-cyber-neon' : 'text-slate-900'}`}>
              ГУСОЧКА
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setActiveTheme(isCyber ? 'RAINBOW' : 'CYBER')}
              className={`p-2 rounded-full border transition-all ${isCyber ? 'border-cyber-pink text-cyber-pink hover:bg-cyber-pink/20' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`}
              title="Змінити стиль"
            >
              <Palette size={20} className={!isCyber ? 'animate-bounce' : ''} />
            </button>

            <button 
              onClick={() => {
                setCurrentView(currentView === 'MENU' ? 'ADMIN' : 'MENU');
                setEditingDishId(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] md:text-xs font-bold uppercase tracking-widest ${
                currentView === 'ADMIN' 
                ? 'bg-cyber-pink text-white border-cyber-pink shadow-lg' 
                : isCyber ? 'border-white/20 text-gray-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {currentView === 'ADMIN' ? <ArrowLeft size={16} /> : <Settings size={16} />}
              <span className="hidden sm:inline">{currentView === 'ADMIN' ? 'На головну' : 'Адмін'}</span>
            </button>

            {user && currentView === 'ADMIN' && (
              <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all" title="Вийти">
                <LogOut size={20} />
              </button>
            )}

            {currentView === 'MENU' && (
              <button 
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 rounded-full border transition-all ${isCyber ? 'border-cyber-neon text-cyber-neon hover:bg-cyber-neon/10' : 'border-slate-900 text-slate-900 bg-slate-900 text-white'}`}
              >
                <ShoppingCart size={22} />
                {cartItemCount > 0 && (
                  <span className={`absolute -top-1 -right-1 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-lg ${isCyber ? 'bg-cyber-pink' : 'bg-red-500'}`}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <AnimatePresence mode="wait">
          {currentView === 'MENU' ? (
            <motion.div key="menu-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Hero */}
              <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
                {!isCyber && <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-300 via-purple-300 to-indigo-300 animate-pulse" />}
                <div className="relative z-10 text-center px-4 max-w-4xl">
                  <h2 className={`text-4xl md:text-8xl font-black mb-6 leading-tight uppercase ${isCyber ? 'text-white' : 'text-slate-900'}`}>
                    Заклад <br /> <span className={accentColor}>ГУСОЧКА</span>
                  </h2>
                  <p className="text-base md:text-xl mb-10 font-bold max-w-2xl mx-auto uppercase tracking-widest opacity-80">
                    {isCyber ? 'Кібер-доставка майбутнього вже тут' : 'Найсмачніша та найяскравіша їжа у вашому районі!'}
                  </p>
                  <button 
                    onClick={() => document.getElementById('menu-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className={`px-8 md:px-10 py-4 text-white font-bold rounded-full transition-all flex items-center gap-3 mx-auto shadow-xl ${buttonAccent}`}
                  >
                    ВІДКРИТИ МЕНЮ <ShoppingBag size={20} />
                  </button>
                </div>
              </section>

              {/* Categories */}
              <div className={`sticky top-20 z-40 py-4 md:py-6 border-y transition-colors duration-500 ${isCyber ? 'bg-cyber-bg border-white/5' : 'bg-white/80 border-slate-100'}`}>
                <div className="max-w-7xl mx-auto px-4 flex gap-4 overflow-x-auto no-scrollbar justify-start md:justify-center">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-[10px] md:text-xs transition-all border uppercase tracking-widest ${
                        activeCategory === cat 
                        ? (isCyber ? 'bg-cyber-neon text-cyber-bg border-cyber-neon shadow-[0_0_15px_#39FF14]' : 'bg-slate-900 text-white border-slate-900') 
                        : (isCyber ? 'bg-transparent border-white/10 text-gray-500 hover:text-white' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200')
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Grid */}
              <section id="menu-grid" className="max-w-7xl mx-auto px-4 py-10 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                  {filteredMenu.map((dish) => (
                    <motion.div
                      layout key={dish.id} onClick={() => setSelectedDish(dish)}
                      className={`group overflow-hidden transition-all flex flex-col h-full cursor-pointer relative ${cardStyles}`}
                    >
                      <div className="relative h-56 md:h-64 overflow-hidden">
                        <img src={dish.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={dish.name} />
                        <div className={`absolute top-4 right-4 backdrop-blur px-4 py-1.5 rounded-full font-black text-base md:text-lg shadow-lg border ${isCyber ? 'bg-cyber-bg/80 text-cyber-neon border-cyber-neon/30' : 'bg-white/90 text-slate-900 border-white'}`}>
                          {dish.price} ₴
                        </div>
                        <div className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Info size={16} />
                        </div>
                      </div>
                      <div className="p-6 md:p-8 flex flex-col flex-grow text-left">
                        <div className="flex items-center gap-2 mb-3">
                          <Flame size={14} className={isCyber ? 'text-cyber-pink' : 'text-orange-500'} />
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCyber ? 'text-cyber-pink' : 'text-slate-400'}`}>{dish.category}</span>
                        </div>
                        <h3 className={`text-xl md:text-2xl font-black mb-4 ${isCyber ? 'text-white' : 'text-slate-900'}`}>{dish.name}</h3>
                        <p className={`text-sm mb-8 flex-grow leading-relaxed line-clamp-2 ${isCyber ? 'text-gray-400' : 'text-slate-600'}`}>{dish.description}</p>
                        <button 
                          onClick={(e) => addToCart(dish, e)}
                          className={`w-full py-4 font-black flex items-center justify-center gap-2 transition-all rounded-full ${
                            isCyber ? 'border border-cyber-neon text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg' : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          <Plus size={20} /> ДОДАТИ У КОШИК
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div key="admin-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto px-4 py-10 md:py-16">
              {!user ? (
                <div className={`max-w-md mx-auto p-8 rounded-3xl border ${cardStyles}`}>
                  <div className="text-center mb-8">
                    <LogIn className={`mx-auto mb-4 ${isCyber ? 'text-cyber-neon' : 'text-slate-900'}`} size={48} />
                    <h2 className="text-2xl font-black">ВХІД ДЛЯ АДМІНІСТРАТОРА</h2>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-6">
                    <input 
                      type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)}
                      className={`w-full p-4 rounded-xl outline-none transition-all ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                    />
                    <input 
                      type="password" placeholder="Пароль" required value={password} onChange={e => setPassword(e.target.value)}
                      className={`w-full p-4 rounded-xl outline-none transition-all ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                    />
                    <button type="submit" className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all ${buttonAccent}`}>УВІЙТИ</button>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 items-start">
                  <div id="admin-form" className={`lg:col-span-5 p-6 md:p-8 rounded-3xl border transition-all ${cardStyles}`}>
                    <h3 className={`text-xl font-black mb-8 border-b pb-4 ${isCyber ? 'text-cyber-neon border-white/5' : 'text-slate-800 border-slate-100'}`}>
                      {editingDishId ? 'РЕДАГУВАННЯ СТРАВИ' : 'НОВА СТРАВА'}
                    </h3>
                    <form onSubmit={handleSubmitDish} className="space-y-6 text-left">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Фото страви</label>
                        <div 
                          onClick={() => !uploadingImage && fileInputRef.current?.click()}
                          className={`relative h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${
                            newDish.image ? 'border-transparent' : (isCyber ? 'border-white/10 hover:border-cyber-neon bg-white/5' : 'border-slate-200 hover:border-purple-500 bg-slate-50')
                          }`}
                        >
                          {uploadingImage ? (
                            <Zap className="animate-spin text-cyber-neon" />
                          ) : newDish.image ? (
                            <img src={newDish.image} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="opacity-20" size={40} />
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      </div>
                      <input 
                        required placeholder="Назва" type="text" value={newDish.name} onChange={e => setNewDish({...newDish, name: e.target.value})}
                        className={`w-full p-4 rounded-xl outline-none ${isCyber ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          required placeholder="Ціна" type="number" value={newDish.price || ''} onChange={e => setNewDish({...newDish, price: Number(e.target.value)})}
                          className={`w-full p-4 rounded-xl outline-none ${isCyber ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                        />
                        <select 
                          value={newDish.category} onChange={e => setNewDish({...newDish, category: e.target.value as Category})}
                          className={`w-full p-4 rounded-xl outline-none ${isCyber ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                        >
                          {categories.filter(c => c !== 'Всі').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <input 
                        placeholder="Інгредієнти (через кому)" type="text" value={newDish.ingredientsInput} onChange={e => setNewDish({...newDish, ingredientsInput: e.target.value})}
                        className={`w-full p-4 rounded-xl outline-none ${isCyber ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                      />
                      <textarea 
                        required placeholder="Опис" value={newDish.description} onChange={e => setNewDish({...newDish, description: e.target.value})}
                        className={`w-full p-4 rounded-xl outline-none h-24 ${isCyber ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                      />
                      <div className="flex gap-2">
                        <button type="submit" disabled={uploadingImage} className={`flex-grow py-5 rounded-2xl font-black text-white shadow-xl ${buttonAccent}`}>
                          {editingDishId ? 'ОНОВИТИ' : 'ДОДАТИ'}
                        </button>
                        {editingDishId && (
                          <button 
                            type="button" onClick={() => {setEditingDishId(null); setNewDish({name:'', description:'', price:0, image:'', category:'Основні страви', ingredientsInput:''});}}
                            className="p-5 rounded-2xl border border-white/10 text-gray-400"
                          >
                            <X size={24} />
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="lg:col-span-7 space-y-4 text-left">
                    <h3 className="text-xl font-black mb-6">АКТУАЛЬНЕ МЕНЮ</h3>
                    <div className="grid grid-cols-1 gap-3 max-h-[700px] overflow-y-auto pr-2 custom-scroll">
                      {menu.map(dish => (
                        <div key={dish.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${isCyber ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                          <img src={dish.image} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-grow">
                            <h4 className="font-bold text-sm truncate">{dish.name}</h4>
                            <p className={`text-[10px] font-bold ${isCyber ? 'text-cyber-neon' : 'text-purple-600'}`}>{dish.price} ₴</p>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => {
                                setEditingDishId(dish.id);
                                setNewDish({
                                  name: dish.name, description: dish.description, price: dish.price, 
                                  image: dish.image, category: dish.category as Category, ingredientsInput: dish.ingredients.join(', ')
                                });
                                document.getElementById('admin-form')?.scrollIntoView({behavior: 'smooth'});
                              }} 
                              className="p-3 text-cyber-neon hover:bg-cyber-neon/10 rounded-xl"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => deleteFromMenu(dish.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div /> // Placeholder for other views
          )}
        </AnimatePresence>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDish && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDish(null)} className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100]" />
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-0 relative ${isCyber ? 'bg-cyber-dark text-white border border-white/10' : 'bg-white text-slate-900 rounded-[2.5rem]'}`}
              >
                <button onClick={() => setSelectedDish(null)} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white z-20"><X size={20} /></button>
                <div className="relative h-64 md:h-80 w-full">
                  <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
                  <div className={`absolute bottom-0 left-0 w-full p-6 md:p-8 bg-gradient-to-t ${isCyber ? 'from-cyber-dark' : 'from-white'} to-transparent`}>
                    <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-cyber-pink text-white">{selectedDish.category}</div>
                    <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">{selectedDish.name}</h2>
                  </div>
                </div>
                <div className="p-6 md:p-8 pt-2 md:pt-4 text-left">
                  <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8 text-xs font-bold uppercase opacity-60">
                    <div className="flex items-center gap-2"><Clock size={16} /> 20-30 хв</div>
                    <div className="flex items-center gap-2"><Flame size={16} className="text-orange-500" /> 450 ккал</div>
                    <div className={`ml-auto text-xl md:text-2xl font-black ${isCyber ? 'text-cyber-neon' : 'text-slate-900'}`}>{selectedDish.price} ₴</div>
                  </div>
                  <div className="mb-8">
                    <h3 className={`text-xs font-black uppercase tracking-[0.3em] mb-4 ${isCyber ? 'text-cyber-pink' : 'text-slate-400'}`}>Про страву</h3>
                    <p className={`text-base md:text-lg leading-relaxed ${isCyber ? 'text-gray-300' : 'text-slate-600'}`}>{selectedDish.description}</p>
                  </div>
                  <div className="mb-10">
                    <h3 className={`text-xs font-black uppercase tracking-[0.3em] mb-4 ${isCyber ? 'text-cyber-pink' : 'text-slate-400'}`}>Інгредієнти</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 list-disc list-inside text-sm font-medium opacity-80">
                      {selectedDish.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                    </ul>
                  </div>
                  <button 
                    onClick={(e) => { 
                      if (selectedDish) {
                        addToCart(selectedDish, e); 
                        setSelectedDish(null);
                      }
                    }} 
                    className={`w-full py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all ${buttonAccent}`}
                  >
                    <ShoppingBag size={20} /> ДОДАТИ У КОШИК ЗА {selectedDish.price} ₴
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed right-0 top-0 h-full w-full max-w-md z-[70] flex flex-col shadow-2xl ${isCyber ? 'bg-cyber-dark text-white' : 'bg-white text-slate-900'}`}
            >
              <div className="p-6 border-b flex items-center justify-between border-white/10">
                <div className="flex items-center gap-3"><ShoppingCart size={24} className={isCyber ? 'text-cyber-neon' : ''} /><h3 className="text-xl font-black">КОШИК</h3></div>
                <button onClick={() => setIsCartOpen(false)}><X size={32} /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20"><Utensils size={64} /><p className="font-black mt-4 uppercase tracking-widest">ПОРОЖНЬО</p></div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <img src={item.image} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                      <div className="flex-grow min-w-0 text-left">
                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                        <p className={`font-black text-sm ${isCyber ? 'text-cyber-neon' : 'text-purple-600'}`}>{item.price} ₴</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className={`flex items-center border rounded-full px-2 ${isCyber ? 'border-white/20' : 'border-slate-200'}`}>
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1"><Minus size={14}/></button>
                            <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1"><Plus size={14}/></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className={`p-8 border-t ${isCyber ? 'bg-cyber-bg border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Разом</span>
                    <span className="text-3xl font-black">{cartTotal} ₴</span>
                  </div>
                  <button className={`w-full py-5 text-white font-black rounded-2xl shadow-xl ${buttonAccent}`} onClick={() => { alert('Дякуємо! Ваше замовлення прийнято!'); setCart([]); setIsCartOpen(false); }}>ОФОРМИТИ ЗАМОВЛЕННЯ</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className={`py-12 border-t text-center ${isCyber ? 'bg-cyber-dark border-white/5 text-gray-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
        <p className="text-[10px] md:text-xs uppercase font-black tracking-[0.3em] md:tracking-[0.5em] mb-2 px-4">Cyber-Goose Firebase Protocol v6.0.2</p>
        <p className="text-[10px] md:text-sm">© 2077 Нео-Київ | Гусочка. Захищено кібер-щитом.</p>
      </footer>
    </div>
  );
}