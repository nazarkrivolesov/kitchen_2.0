
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Plus, Minus, X, Settings, Utensils, Trash2, 
  Zap, Flame, Palette, ArrowLeft, ShoppingBag, Sparkles, 
  Image as ImageIcon, Info, Clock, Edit2, LogOut, LogIn,
  ClipboardList, Package, Truck, CheckCircle, Ban, User, Phone, MapPin, MessageSquare, AlertTriangle,
  Bell, Check, Info as InfoIcon
} from 'lucide-react';
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, 
  query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Fix: Use any casting to handle potential type resolution issues with firebase/auth where members are reported as not exported
import * as firebaseAuth from 'firebase/auth';
const { onAuthStateChanged, signInWithEmailAndPassword, signOut } = firebaseAuth as any;
import { db, auth, storage } from './firebase';
import { Dish, CartItem, Category, Order, OrderStatus } from './types';

// Fix: Define User type as any to avoid import issues from firebase/auth
type User = any;

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [menu, setMenu] = useState<Dish[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [currentView, setCurrentView] = useState<'MENU' | 'ADMIN'>('MENU');
  const [adminTab, setAdminTab] = useState<'MENU' | 'ORDERS'>('MENU');
  const [activeTheme, setActiveTheme] = useState<'CYBER' | 'RAINBOW'>('CYBER');
  const [activeCategory, setActiveCategory] = useState<Category | 'Всі'>('Всі');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderIdToCancel, setOrderIdToCancel] = useState<string | null>(null);
  const [dishIdToDelete, setDishIdToDelete] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Form errors
  const [loginErrors, setLoginErrors] = useState<string[]>([]);
  const [checkoutErrors, setCheckoutErrors] = useState<string[]>([]);
  const [dishErrors, setDishErrors] = useState<string[]>([]);

  // Checkout Form State
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    comment: ''
  });

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

  // Helper for notifications
  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u: any) => {
      setUser(u);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  // Sync Menu
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

  // Sync Orders
  useEffect(() => {
    if (user && currentView === 'ADMIN') {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        } as Order));
        setOrders(items);
      });
      return unsub;
    }
  }, [user, currentView]);

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
        notify(`Додано ще одну порцію: ${dish.name}`, 'info');
        return prev.map(item => 
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      notify(`Страву ${dish.name} додано до кошика`, 'success');
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
    const item = cart.find(i => i.id === id);
    if (item) notify(`${item.name} видалено з кошика`, 'info');
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const validateCheckout = () => {
    const errors: string[] = [];
    if (!checkoutForm.name.trim()) errors.push("Ім'я обов'язкове");
    if (!checkoutForm.phone.match(/^\+380\d{9}$/)) errors.push("Телефон має бути у форматі +380XXXXXXXXX");
    if (!checkoutForm.address.trim()) errors.push("Адреса доставки обов'язкова");
    setCheckoutErrors(errors);
    return errors.length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      notify('Адміністратори не можуть оформлювати замовлення.', 'error');
      return;
    }
    
    if (!validateCheckout()) return;

    const orderTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const orderData = {
      customer: checkoutForm,
      items: cart,
      total: orderTotal,
      status: 'new' as OrderStatus,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      notify('Замовлення прийнято! Очікуйте на доставку.', 'success');
      setCart([]);
      setIsCheckingOut(false);
      setIsCartOpen(false);
      setCheckoutForm({ name: '', phone: '', address: '', comment: '' });
      setCheckoutErrors([]);
    } catch (err: any) {
      notify('Помилка при оформленні: ' + err.message, 'error');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      if (newStatus === 'cancelled') {
        notify('Замовлення скасовано', 'info');
        setOrderIdToCancel(null);
      } else {
        notify(`Статус замовлення оновлено на: ${getStatusLabel(newStatus)}`, 'success');
      }
    } catch (err: any) {
      notify('Помилка оновлення статусу: ' + err.message, 'error');
    }
  };

  const validateLogin = () => {
    const errors: string[] = [];
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.push("Невірний формат email");
    if (password.length < 6) errors.push("Пароль має бути не менше 6 символів");
    setLoginErrors(errors);
    return errors.length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      notify('Вхід успішний! Вітаємо, операторе.', 'success');
      setEmail('');
      setPassword('');
      setLoginErrors([]);
    } catch (err: any) {
      notify('Помилка входу: невірні дані', 'error');
    }
  };

  const handleLogout = () => {
    signOut(auth);
    notify('Ви вийшли з системи', 'info');
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
      notify('Фото завантажено успішно', 'success');
    } catch (err: any) {
      notify('Помилка завантаження фото: ' + err.message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateDish = () => {
    const errors: string[] = [];
    if (!newDish.name?.trim()) errors.push("Назва страви обов'язкова");
    if (!newDish.price || newDish.price <= 0) errors.push("Ціна має бути більше 0");
    if (!newDish.description?.trim()) errors.push("Опис обов'язковий");
    if (!newDish.image) errors.push("Завантажте фото страви");
    setDishErrors(errors);
    return errors.length === 0;
  };

  const handleSubmitDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDish()) return;
    
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
        notify('Страву успішно оновлено', 'success');
      } else {
        await addDoc(collection(db, 'dishes'), dishData);
        notify('Страву додано до меню', 'success');
      }
      setEditingDishId(null);
      setNewDish({ name: '', description: '', price: 0, image: '', category: 'Основні страви', ingredientsInput: '' });
      setDishErrors([]);
      setCurrentView('MENU');
    } catch (err: any) {
      notify('Помилка збереження: ' + err.message, 'error');
    }
  };

  const deleteFromMenu = async () => {
    if (!dishIdToDelete) return;
    try {
      await deleteDoc(doc(db, 'dishes', dishIdToDelete));
      setCart(prev => prev.filter(item => item.id !== dishIdToDelete));
      notify('Страву видалено з меню', 'info');
      setDishIdToDelete(null);
    } catch (err: any) {
      notify('Помилка видалення: ' + err.message, 'error');
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isCyber = activeTheme === 'CYBER';
  const accentColor = isCyber ? 'text-cyber-neon' : 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500';
  const buttonAccent = isCyber ? 'bg-cyber-pink hover:shadow-[0_0_20px_#FF007F]' : 'bg-gradient-to-r from-red-500 to-purple-600 hover:scale-105';
  const cardStyles = isCyber ? 'bg-cyber-dark border-white/10 rounded-none' : 'bg-white border-2 border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50';
  const navStyles = isCyber ? 'bg-cyber-bg/90 border-cyber-neon/30' : 'bg-white/90 border-slate-200 shadow-lg';

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'text-cyber-neon border-cyber-neon/50 bg-cyber-neon/5';
      case 'cooking': return 'text-orange-400 border-orange-400/50 bg-orange-400/5';
      case 'delivery': return 'text-blue-400 border-blue-400/50 bg-blue-400/5';
      case 'completed': return 'text-gray-400 border-gray-400/50 bg-gray-400/5';
      case 'cancelled': return 'text-red-500 border-red-500/50 bg-red-500/5';
      default: return 'text-white';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'НОВЕ';
      case 'cooking': return 'ГОТУЄТЬСЯ';
      case 'delivery': return 'ДОСТАВЛЯЄТЬСЯ';
      case 'completed': return 'ЗАВЕРШЕНО';
      case 'cancelled': return 'СКАСОВАНО';
      default: return (status as any).toUpperCase();
    }
  };

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
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-all duration-500 ${navStyles}`}>
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setCurrentView('MENU'); setEditingDishId(null);}}>
            <Zap className={`w-8 h-8 ${isCyber ? 'text-cyber-neon' : 'text-yellow-400'}`} />
            <h1 className={`text-xl md:text-2xl font-black tracking-tighter ${isCyber ? 'text-cyber-neon' : 'text-slate-900'}`}>ГУСОЧКА</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setActiveTheme(isCyber ? 'RAINBOW' : 'CYBER')} className={`p-2 rounded-full border transition-all ${isCyber ? 'border-cyber-pink text-cyber-pink hover:bg-cyber-pink/20' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`}>
              <Palette size={20} />
            </button>
            <button onClick={() => { setCurrentView(currentView === 'MENU' ? 'ADMIN' : 'MENU'); setEditingDishId(null); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] md:text-xs font-bold uppercase tracking-widest ${currentView === 'ADMIN' ? 'bg-cyber-pink text-white border-cyber-pink shadow-lg' : isCyber ? 'border-white/20 text-gray-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {currentView === 'ADMIN' ? <ArrowLeft size={16} /> : <Settings size={16} />}
              <span className="hidden sm:inline">{currentView === 'ADMIN' ? 'На головну' : 'Адмін'}</span>
            </button>
            {user && currentView === 'ADMIN' && (
              <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all"><LogOut size={20} /></button>
            )}
            {currentView === 'MENU' && (
              <button onClick={() => { setIsCartOpen(true); setIsCheckingOut(false); }} className={`relative p-2 rounded-full border transition-all ${isCyber ? 'border-cyber-neon text-cyber-neon hover:bg-cyber-neon/10' : 'border-slate-900 text-slate-900 bg-slate-900 text-white'}`}>
                <ShoppingCart size={22} />
                {cartItemCount > 0 && (
                  <span className={`absolute -top-1 -right-1 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-lg ${isCyber ? 'bg-cyber-pink' : 'bg-red-500'}`}>{cartItemCount}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Notifications Layer */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] space-y-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`px-6 py-3 rounded-full flex items-center gap-3 border shadow-2xl backdrop-blur-xl min-w-[300px] pointer-events-auto ${
                n.type === 'success' ? (isCyber ? 'bg-cyber-neon/10 border-cyber-neon text-cyber-neon' : 'bg-green-50 border-green-500 text-green-700') :
                n.type === 'error' ? (isCyber ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-red-50 border-red-500 text-red-700') :
                (isCyber ? 'bg-cyber-pink/10 border-cyber-pink text-cyber-pink' : 'bg-blue-50 border-blue-500 text-blue-700')
              }`}
            >
              {n.type === 'success' ? <Check size={18} /> : n.type === 'error' ? <AlertTriangle size={18} /> : <InfoIcon size={18} />}
              <span className="text-xs font-black uppercase tracking-wider">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <main className="pt-20">
        <AnimatePresence mode="wait">
          {currentView === 'MENU' ? (
            <motion.div key="menu-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden text-center px-4">
                <div className="relative z-10 max-w-4xl">
                  <h2 className={`text-4xl md:text-8xl font-black mb-6 uppercase ${isCyber ? 'text-white' : 'text-slate-900'}`}>Заклад <br /> <span className={accentColor}>ГУСОЧКА</span></h2>
                  <p className="text-base md:text-xl mb-10 font-bold max-w-2xl mx-auto uppercase tracking-widest opacity-80">Кібер-доставка майбутнього вже тут</p>
                  <button onClick={() => document.getElementById('menu-grid')?.scrollIntoView({ behavior: 'smooth' })} className={`px-8 md:px-10 py-4 text-white font-bold rounded-full transition-all flex items-center gap-3 mx-auto shadow-xl ${buttonAccent}`}>ВІДКРИТИ МЕНЮ <ShoppingBag size={20} /></button>
                </div>
              </section>

              <div className={`sticky top-20 z-40 py-4 border-y transition-colors duration-500 ${isCyber ? 'bg-cyber-bg border-white/5' : 'bg-white/80 border-slate-100'}`}>
                <div className="max-w-7xl mx-auto px-4 flex gap-4 overflow-x-auto no-scrollbar justify-start md:justify-center">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-[10px] md:text-xs transition-all border uppercase tracking-widest ${activeCategory === cat ? (isCyber ? 'bg-cyber-neon text-cyber-bg border-cyber-neon shadow-[0_0_15px_#39FF14]' : 'bg-slate-900 text-white border-slate-900') : (isCyber ? 'bg-transparent border-white/10 text-gray-500 hover:text-white' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200')}`}>{cat}</button>
                  ))}
                </div>
              </div>

              <section id="menu-grid" className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredMenu.map((dish) => (
                  <motion.div layout key={dish.id} onClick={() => setSelectedDish(dish)} className={`group overflow-hidden transition-all flex flex-col h-full cursor-pointer relative ${cardStyles}`}>
                    <div className="relative h-64 overflow-hidden">
                      <img src={dish.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={dish.name} />
                      <div className={`absolute top-4 right-4 backdrop-blur px-4 py-1.5 rounded-full font-black text-lg shadow-lg border ${isCyber ? 'bg-cyber-bg/80 text-cyber-neon border-cyber-neon/30' : 'bg-white/90 text-slate-900 border-white'}`}>{dish.price} ₴</div>
                    </div>
                    <div className="p-8 flex flex-col flex-grow text-left">
                      <div className="flex items-center gap-2 mb-3"><Flame size={14} className={isCyber ? 'text-cyber-pink' : 'text-orange-500'} /><span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCyber ? 'text-cyber-pink' : 'text-slate-400'}`}>{dish.category}</span></div>
                      <h3 className={`text-xl md:text-2xl font-black mb-4 ${isCyber ? 'text-white' : 'text-slate-900'}`}>{dish.name}</h3>
                      <p className={`text-sm mb-8 flex-grow line-clamp-2 ${isCyber ? 'text-gray-400' : 'text-slate-600'}`}>{dish.description}</p>
                      <button onClick={(e) => addToCart(dish, e)} className={`w-full py-4 font-black flex items-center justify-center gap-2 transition-all rounded-full ${isCyber ? 'border border-cyber-neon text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                        <Plus size={20} /> ДОДАТИ
                      </button>
                    </div>
                  </motion.div>
                ))}
              </section>
            </motion.div>
          ) : (
            <motion.div key="admin-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-7xl mx-auto px-4 py-16">
              {!user ? (
                <div className={`max-w-md mx-auto p-8 rounded-3xl border ${cardStyles}`}>
                  <div className="text-center mb-8"><LogIn className="mx-auto mb-4" size={48} /><h2 className="text-2xl font-black">АДМІН-ВХІД</h2></div>
                  <form onSubmit={handleLogin} className="space-y-6">
                    <input type="email" placeholder="Email" required value={email} onChange={e => {setEmail(e.target.value); setLoginErrors([]);}} className={`w-full p-4 rounded-xl outline-none ${isCyber ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    <input type="password" placeholder="Пароль" required value={password} onChange={e => {setPassword(e.target.value); setLoginErrors([]);}} className={`w-full p-4 rounded-xl outline-none ${isCyber ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    
                    {loginErrors.length > 0 && (
                      <div className="text-xs text-red-500 font-bold space-y-1 ml-2">
                        {loginErrors.map((err, i) => <p key={i}>• {err}</p>)}
                      </div>
                    )}
                    
                    <button type="submit" className={`w-full py-5 rounded-2xl font-black text-white ${buttonAccent}`}>УВІЙТИ</button>
                  </form>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="flex justify-center mb-10">
                    <div className={`inline-flex p-1 rounded-2xl ${isCyber ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <button 
                        onClick={() => setAdminTab('MENU')}
                        className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${adminTab === 'MENU' ? buttonAccent + ' text-white' : 'text-gray-400'}`}
                      >
                        <Utensils size={18} /> Меню
                      </button>
                      <button 
                        onClick={() => setAdminTab('ORDERS')}
                        className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${adminTab === 'ORDERS' ? buttonAccent + ' text-white' : 'text-gray-400'}`}
                      >
                        <ClipboardList size={18} /> Замовлення
                        {orders.filter(o => o.status === 'new').length > 0 && (
                          <span className="w-5 h-5 bg-cyber-neon text-cyber-bg rounded-full flex items-center justify-center text-[10px] font-black">{orders.filter(o => o.status === 'new').length}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {adminTab === 'MENU' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
                      <div className={`lg:col-span-5 p-8 rounded-3xl border ${cardStyles}`}>
                        <h3 className="text-xl font-black mb-8">{editingDishId ? 'РЕДАГУВАННЯ' : 'НОВА СТРАВА'}</h3>
                        <form onSubmit={handleSubmitDish} className="space-y-6">
                          <div onClick={() => !uploadingImage && fileInputRef.current?.click()} className={`relative h-40 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden ${isCyber ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                            {uploadingImage ? <Zap className="animate-spin" /> : newDish.image ? <img src={newDish.image} className="w-full h-full object-cover" /> : <ImageIcon className="opacity-20" size={40} />}
                          </div>
                          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                          <input required placeholder="Назва" type="text" value={newDish.name} onChange={e => {setNewDish({...newDish, name: e.target.value}); setDishErrors([]);}} className={`w-full p-4 rounded-xl outline-none ${isCyber ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                          <div className="grid grid-cols-2 gap-4">
                            <input required placeholder="Ціна" type="number" value={newDish.price || ''} onChange={e => {setNewDish({...newDish, price: Number(e.target.value)}); setDishErrors([]);}} className={`w-full p-4 rounded-xl outline-none ${isCyber ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                            <select value={newDish.category} onChange={e => setNewDish({...newDish, category: e.target.value as Category})} className={`w-full p-4 rounded-xl outline-none ${isCyber ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                              {categories.filter(c => c !== 'Всі').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <textarea required placeholder="Опис" value={newDish.description} onChange={e => {setNewDish({...newDish, description: e.target.value}); setDishErrors([]);}} className={`w-full p-4 rounded-xl outline-none h-24 ${isCyber ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                          
                          {dishErrors.length > 0 && (
                            <div className="text-xs text-red-500 font-bold space-y-1 ml-2">
                              {dishErrors.map((err, i) => <p key={i}>• {err}</p>)}
                            </div>
                          )}

                          <button type="submit" className={`w-full py-5 rounded-2xl font-black text-white ${buttonAccent}`}>{editingDishId ? 'ОНОВИТИ' : 'ЗБЕРЕГТИ'}</button>
                        </form>
                      </div>
                      <div className="lg:col-span-7 space-y-4">
                        <h3 className="text-xl font-black mb-6 uppercase tracking-widest">Меню</h3>
                        <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scroll">
                          {menu.map(dish => (
                            <div key={dish.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${isCyber ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                              <img src={dish.image} className="w-16 h-16 rounded-xl object-cover" />
                              <div className="flex-grow">
                                <h4 className="font-bold text-sm">{dish.name}</h4>
                                <p className="text-xs opacity-50">{dish.price} ₴</p>
                              </div>
                              <button onClick={() => { setEditingDishId(dish.id); setNewDish({ ...dish, ingredientsInput: dish.ingredients.join(', ') }); }} className="p-2 text-cyber-neon"><Edit2 size={18} /></button>
                              <button onClick={() => setDishIdToDelete(dish.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                      {orders.map((order) => (
                        <motion.div 
                          key={order.id} 
                          layout
                          className={`p-6 rounded-3xl border flex flex-col gap-6 ${cardStyles} ${order.status === 'completed' ? 'opacity-60 grayscale' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className={`px-3 py-1 rounded-full border text-[10px] font-black inline-block mb-3 ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </div>
                              <h4 className="font-black text-lg">Замовлення #{order.id.slice(-4).toUpperCase()}</h4>
                              <p className="text-xs opacity-50">{order.createdAt?.toDate().toLocaleString('uk-UA')}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xl font-black ${isCyber ? 'text-cyber-neon' : 'text-slate-900'}`}>{order.total} ₴</span>
                            </div>
                          </div>

                          <div className="space-y-2 py-4 border-y border-white/5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="opacity-80">{item.name} <span className="font-black">x{item.quantity}</span></span>
                                <span className="font-bold">{item.price * item.quantity} ₴</span>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2"><User size={14} className="opacity-50" /> <span className="font-bold">{order.customer.name}</span></div>
                            <div className="flex items-center gap-2"><Phone size={14} className="opacity-50" /> <span className="opacity-80">{order.customer.phone}</span></div>
                            <div className="flex items-center gap-2"><MapPin size={14} className="opacity-50" /> <span className="opacity-80">{order.customer.address}</span></div>
                            {order.customer.comment && (
                              <div className="flex items-start gap-2 italic text-xs opacity-60">
                                <MessageSquare size={14} className="mt-0.5" /> 
                                <span>"{order.customer.comment}"</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
                            {order.status === 'new' && (
                              <button onClick={() => updateOrderStatus(order.id, 'cooking')} className="col-span-2 py-3 bg-cyber-neon text-cyber-bg font-black rounded-xl text-xs flex items-center justify-center gap-2">
                                <Package size={16} /> ПРИЙНЯТИ В РОБОТУ
                              </button>
                            )}
                            {order.status === 'cooking' && (
                              <button onClick={() => updateOrderStatus(order.id, 'delivery')} className="col-span-2 py-3 bg-blue-400 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2">
                                <Truck size={16} /> НА ДОСТАВКУ
                              </button>
                            )}
                            {order.status === 'delivery' && (
                              <button onClick={() => updateOrderStatus(order.id, 'completed')} className="col-span-2 py-3 bg-green-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> ЗАВЕРШИТИ
                              </button>
                            )}
                            {(order.status === 'new' || order.status === 'cooking') && (
                              <button onClick={() => setOrderIdToCancel(order.id)} className="col-span-2 py-2 text-red-500 border border-red-500/30 rounded-xl text-[10px] font-black hover:bg-red-500/5">
                                СКАСУВАТИ
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {orders.length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-20">
                          <Package size={64} className="mx-auto mb-4" />
                          <p className="font-black uppercase tracking-widest">Замовлень немає</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Confirmation Modals Layer */}
      <AnimatePresence>
        {(orderIdToCancel || dishIdToDelete) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => {setOrderIdToCancel(null); setDishIdToDelete(null);}} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150]" />
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`max-w-sm w-full p-8 text-center border shadow-2xl ${cardStyles}`}
              >
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                    <AlertTriangle size={48} />
                  </div>
                </div>
                
                {orderIdToCancel ? (
                  <>
                    <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">СКАСУВАТИ ЗАМОВЛЕННЯ?</h3>
                    <p className="text-sm opacity-60 mb-8 leading-relaxed">Ви дійсно хочете скасувати замовлення #{orderIdToCancel.slice(-4).toUpperCase()}? Цю дію неможливо буде відмінити.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setOrderIdToCancel(null)} className={`py-4 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${isCyber ? 'border-white/10 text-gray-400 hover:text-white' : 'border-slate-200 text-slate-500'}`}>НІ, НАЗАД</button>
                      <button onClick={() => updateOrderStatus(orderIdToCancel, 'cancelled')} className="py-4 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/20">ТАК, СКАСУВАТИ</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">ВИДАЛИТИ СТРАВУ?</h3>
                    <p className="text-sm opacity-60 mb-8 leading-relaxed">Ця страва назавжди зникне з меню цифрового простору.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setDishIdToDelete(null)} className={`py-4 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${isCyber ? 'border-white/10 text-gray-400 hover:text-white' : 'border-slate-200 text-slate-500'}`}>НІ, НАЗАД</button>
                      <button onClick={deleteFromMenu} className="py-4 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/20">ТАК, ВИДАЛИТИ</button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDish && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDish(null)} className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100]" />
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-0 relative ${isCyber ? 'bg-cyber-dark text-white border border-white/10' : 'bg-white text-slate-900 rounded-[2.5rem]'}`}>
                <button onClick={() => setSelectedDish(null)} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white z-20"><X size={20} /></button>
                <div className="h-64 md:h-80 w-full"><img src={selectedDish.image} className="w-full h-full object-cover" alt="" /></div>
                <div className="p-8 text-left">
                  <h2 className="text-3xl font-black mb-4">{selectedDish.name}</h2>
                  <p className="mb-8 opacity-70">{selectedDish.description}</p>
                  <button onClick={(e) => { addToCart(selectedDish, e); setSelectedDish(null); }} className={`w-full py-5 rounded-2xl font-black text-white ${buttonAccent}`}>ДОДАТИ ЗА {selectedDish.price} ₴</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`fixed right-0 top-0 h-full w-full max-w-md z-[70] flex flex-col shadow-2xl ${isCyber ? 'bg-cyber-dark text-white border-l border-white/10' : 'bg-white text-slate-900'}`}>
              <div className="p-6 border-b flex items-center justify-between border-white/10">
                <div className="flex items-center gap-3">
                  {isCheckingOut && <button onClick={() => setIsCheckingOut(false)} className="p-2 hover:bg-white/5 rounded-full"><ArrowLeft size={20} /></button>}
                  <h3 className="text-xl font-black">{isCheckingOut ? 'ОФОРМЛЕННЯ' : 'КОШИК'}</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)}><X size={32} /></button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scroll">
                {!isCheckingOut ? (
                  <>
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                        <Utensils size={64} className="mb-4" />
                        <p className="font-black uppercase tracking-widest">ПОРОЖНЬО</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="flex gap-4 p-2 rounded-2xl transition-all hover:bg-white/5">
                          <img src={item.image} className="w-20 h-20 rounded-xl object-cover" />
                          <div className="flex-grow text-left">
                            <h4 className="font-bold text-sm truncate">{item.name}</h4>
                            <p className={`font-black text-sm ${isCyber ? 'text-cyber-neon' : 'text-purple-600'}`}>{item.price} ₴</p>
                            <div className="flex items-center gap-4 mt-3">
                              <div className={`flex items-center border rounded-full px-2 ${isCyber ? 'border-white/20' : 'border-slate-200'}`}>
                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1"><Minus size={14}/></button>
                                <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1"><Plus size={14}/></button>
                              </div>
                              <button onClick={() => removeFromCart(item.id)} className="ml-auto text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-6 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-2">Ім'я</label>
                      <input 
                        required 
                        placeholder="Ваше ім'я" 
                        value={checkoutForm.name} 
                        onChange={e => {setCheckoutForm({...checkoutForm, name: e.target.value}); setCheckoutErrors([]);}}
                        className={`w-full p-4 rounded-2xl outline-none transition-all ${isCyber ? 'bg-white/5 border border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border border-slate-200 focus:border-purple-500'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-2">Телефон</label>
                      <input 
                        required 
                        type="tel"
                        placeholder="+380XXXXXXXXX" 
                        value={checkoutForm.phone} 
                        onChange={e => {setCheckoutForm({...checkoutForm, phone: e.target.value}); setCheckoutErrors([]);}}
                        className={`w-full p-4 rounded-2xl outline-none transition-all ${isCyber ? 'bg-white/5 border border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border border-slate-200 focus:border-purple-500'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-2">Адреса доставки</label>
                      <input 
                        required 
                        placeholder="Вулиця, будинок, кв." 
                        value={checkoutForm.address} 
                        onChange={e => {setCheckoutForm({...checkoutForm, address: e.target.value}); setCheckoutErrors([]);}}
                        className={`w-full p-4 rounded-2xl outline-none transition-all ${isCyber ? 'bg-white/5 border border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border border-slate-200 focus:border-purple-500'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-2">Коментар (необов'язково)</label>
                      <textarea 
                        placeholder="Особливі побажання" 
                        value={checkoutForm.comment} 
                        onChange={e => setCheckoutForm({...checkoutForm, comment: e.target.value})}
                        className={`w-full p-4 rounded-2xl outline-none h-24 resize-none transition-all ${isCyber ? 'bg-white/5 border border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border border-slate-200 focus:border-purple-500'}`}
                      />
                    </div>

                    {checkoutErrors.length > 0 && (
                      <div className="text-xs text-red-500 font-bold space-y-1 ml-2">
                        {checkoutErrors.map((err, i) => <p key={i}>• {err}</p>)}
                      </div>
                    )}
                  </form>
                )}
              </div>

              {cart.length > 0 && (
                <div className={`p-8 border-t ${isCyber ? 'bg-cyber-bg border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Разом до сплати</span>
                    <span className="text-3xl font-black">{cartTotal} ₴</span>
                  </div>
                  {!isCheckingOut ? (
                    <button 
                      onClick={() => setIsCheckingOut(true)}
                      disabled={!!user}
                      className={`w-full py-5 text-white font-black rounded-2xl shadow-xl transition-all ${!!user ? 'opacity-30 cursor-not-allowed bg-gray-600' : buttonAccent}`}
                    >
                      {!!user ? 'АДМІН НЕ МОЖЕ ЗАМОВЛЯТИ' : 'ПЕРЕЙТИ ДО ОФОРМЛЕННЯ'}
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      form="checkout-form"
                      disabled={!!user}
                      className={`w-full py-5 text-white font-black rounded-2xl shadow-xl transition-all ${!!user ? 'opacity-30 cursor-not-allowed bg-gray-600' : buttonAccent}`}
                    >
                      {!!user ? 'ОФОРМЛЕННЯ ЗАБЛОКОВАНО' : 'ПІДТВЕРДИТИ ЗАМОВЛЕННЯ'}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className={`py-12 border-t text-center ${isCyber ? 'bg-cyber-dark border-white/5 text-gray-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
        <p className="text-[10px] md:text-xs uppercase font-black tracking-[0.3em] md:tracking-[0.5em] mb-2 px-4">Cyber-Goose Protocol v7.3.0</p>
        <p className="text-[10px] md:text-sm">© 2077 Нео-Київ | Гусочка. Захищено кібер-щитом.</p>
      </footer>
    </div>
  );
}
