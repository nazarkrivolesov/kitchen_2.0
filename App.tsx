
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  Settings, 
  Utensils, 
  Trash2, 
  ChevronRight,
  Zap,
  Flame,
  User,
  Palette,
  ArrowLeft,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { Dish, CartItem, Category } from './types';

const INITIAL_MENU: Dish[] = [
  {
    id: '1',
    name: 'Борщ із пампушками',
    description: 'Традиційний український борщ з яловичиною, сметаною та часниковими пампушками.',
    price: 185,
    image: 'https://images.unsplash.com/photo-1594966121993-21c33974d61c?auto=format&fit=crop&q=80&w=800',
    category: 'Перші страви'
  },
  {
    id: '2',
    name: 'Вареники з картоплею',
    description: 'Домашні вареники зі шкварками та смаженою цибулею.',
    price: 145,
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=800',
    category: 'Основні страви'
  },
  {
    id: '3',
    name: 'Котлета по-київськи',
    description: 'Соковите куряче філе з вершковим маслом та зеленню всередині.',
    price: 210,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800',
    category: 'Основні страви'
  },
  {
    id: '4',
    name: 'Сет "Українське Сало"',
    description: 'Асорті з копченого, солоного та запеченого сала з гірчицею.',
    price: 165,
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=800',
    category: 'Закуски'
  },
  {
    id: '5',
    name: 'Карпатський Банош',
    description: 'Кукурудзяна каша на вершках з бринзою та білими грибами.',
    price: 195,
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=800',
    category: 'Основні страви'
  },
  {
    id: '6',
    name: 'Деруни зі сметаною',
    description: 'Хрусткі картопляні оладки за класичним рецептом.',
    price: 130,
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=800',
    category: 'Закуски'
  }
];

type Theme = 'CYBER' | 'RAINBOW';
type View = 'MENU' | 'ADMIN';

export default function App() {
  const [menu, setMenu] = useState<Dish[]>(INITIAL_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('MENU');
  const [activeTheme, setActiveTheme] = useState<Theme>('CYBER');
  const [activeCategory, setActiveCategory] = useState<Category | 'Всі'>('Всі');
  
  // Admin Form State
  const [newDish, setNewDish] = useState<Partial<Dish>>({
    name: '',
    description: '',
    price: 0,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    category: 'Основні страви'
  });

  // Apply basic layout adjustments based on theme
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

  const addToCart = (dish: Dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item => item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
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

  const deleteFromMenu = (id: string) => {
    if (confirm('Видалити цю страву з системи?')) {
      setMenu(prev => prev.filter(d => d.id !== id));
      setCart(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    const dish: Dish = {
      ...newDish as Dish,
      id: Math.random().toString(36).substr(2, 9),
      price: Number(newDish.price)
    };
    setMenu(prev => [dish, ...prev]);
    setNewDish({ name: '', description: '', price: 0, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800', category: 'Основні страви' });
    alert('Кібер-страва інтегрована в меню!');
    setCurrentView('MENU');
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Styling logic based on Theme
  const isCyber = activeTheme === 'CYBER';
  const accentColor = isCyber ? 'text-cyber-neon' : 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500';
  const buttonAccent = isCyber ? 'bg-cyber-pink hover:shadow-[0_0_20px_#FF007F]' : 'bg-gradient-to-r from-red-500 to-purple-600 hover:scale-105';
  const cardStyles = isCyber ? 'bg-cyber-dark border-white/10 rounded-none' : 'bg-white border-2 border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50';
  const navStyles = isCyber ? 'bg-cyber-bg/90 border-cyber-neon/30' : 'bg-white/90 border-slate-200 shadow-lg';

  return (
    <div className={`min-h-screen transition-all duration-700 ${isCyber ? 'bg-cyber-bg text-white font-cyber' : 'bg-white text-slate-800 font-sans'}`}>
      
      {/* Dynamic Navigation */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-all duration-500 ${navStyles}`}>
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('MENU')}>
            <Zap className={`w-8 h-8 ${isCyber ? 'text-cyber-neon' : 'text-yellow-400'}`} />
            <h1 className={`text-2xl font-black tracking-tighter ${isCyber ? 'text-cyber-neon' : 'text-slate-900'}`}>
              {isCyber ? 'CYBER' : 'HAPPY'}<span className={isCyber ? 'text-cyber-pink' : 'text-purple-500'}>FOOD</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={() => setActiveTheme(isCyber ? 'RAINBOW' : 'CYBER')}
              className={`p-2 rounded-full border transition-all ${isCyber ? 'border-cyber-pink text-cyber-pink hover:bg-cyber-pink/20' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`}
              title="Змінити стиль"
            >
              <Palette size={20} className={!isCyber ? 'animate-bounce' : ''} />
            </button>

            {/* View Toggle */}
            <button 
              onClick={() => setCurrentView(currentView === 'MENU' ? 'ADMIN' : 'MENU')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold uppercase tracking-widest ${
                currentView === 'ADMIN' 
                ? 'bg-cyber-pink text-white border-cyber-pink shadow-lg' 
                : isCyber ? 'border-white/20 text-gray-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {currentView === 'ADMIN' ? <ArrowLeft size={16} /> : <Settings size={16} />}
              <span className="hidden sm:inline">{currentView === 'ADMIN' ? 'На головну' : 'Адмін'}</span>
            </button>

            {/* Cart Button */}
            {currentView === 'MENU' && (
              <button 
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 rounded-full border transition-all ${isCyber ? 'border-cyber-neon text-cyber-neon hover:bg-cyber-neon/10' : 'border-slate-900 text-slate-900 bg-slate-900 text-white'}`}
              >
                <ShoppingCart size={22} />
                {cart.length > 0 && (
                  <span className={`absolute -top-1 -right-1 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-lg ${isCyber ? 'bg-cyber-pink' : 'bg-red-500'}`}>
                    {cart.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* View Switcher */}
      <main className="pt-20">
        <AnimatePresence mode="wait">
          {currentView === 'MENU' ? (
            <motion.div 
              key="menu-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Hero */}
              <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                {!isCyber && (
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-300 via-purple-300 to-indigo-300 animate-pulse"></div>
                )}
                <div className="relative z-10 text-center px-4 max-w-4xl">
                  <h2 className={`text-5xl md:text-8xl font-black mb-6 leading-tight uppercase ${isCyber ? 'text-white' : 'text-slate-900'}`}>
                    {isCyber ? 'Український' : 'Кольоровий'} <br /> 
                    <span className={accentColor}>{isCyber ? 'Кібер-Панк' : 'Смак Радості'}</span>
                  </h2>
                  <p className={`text-xl mb-10 font-bold max-w-2xl mx-auto uppercase tracking-widest opacity-80 ${!isCyber ? 'text-indigo-600' : ''}`}>
                    {isCyber ? 'Доставка зі швидкістю світла 2077' : 'Найвеселіша доставка у вашому місті!'}
                  </p>
                  <button 
                    onClick={() => document.getElementById('menu-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className={`px-10 py-4 text-white font-bold rounded-full transition-all flex items-center gap-3 mx-auto shadow-xl ${buttonAccent}`}
                  >
                    ВІДКРИТИ МЕНЮ <ShoppingBag size={20} />
                  </button>
                </div>
              </section>

              {/* Categories */}
              <div className={`sticky top-20 z-40 py-6 border-y transition-colors duration-500 ${isCyber ? 'bg-cyber-bg border-white/5' : 'bg-white/80 border-slate-100'}`}>
                <div className="max-w-7xl mx-auto px-4 flex gap-4 overflow-x-auto no-scrollbar justify-center">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-xs transition-all border uppercase tracking-widest ${
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

              {/* Grid */}
              <section id="menu-grid" className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {filteredMenu.map((dish) => (
                    <motion.div
                      layout
                      key={dish.id}
                      className={`group overflow-hidden transition-all flex flex-col h-full ${cardStyles}`}
                    >
                      <div className="relative h-64 overflow-hidden">
                        <img 
                          src={dish.image} 
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className={`absolute top-4 right-4 backdrop-blur px-4 py-1.5 rounded-full font-black text-lg shadow-lg border ${isCyber ? 'bg-cyber-bg/80 text-cyber-neon border-cyber-neon/30' : 'bg-white/90 text-slate-900 border-white'}`}>
                          {dish.price} ₴
                        </div>
                        {isCyber && <div className="absolute inset-0 bg-gradient-to-t from-cyber-bg/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                      </div>
                      <div className="p-8 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <Flame size={14} className={isCyber ? 'text-cyber-pink' : 'text-orange-500'} />
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCyber ? 'text-cyber-pink' : 'text-slate-400'}`}>{dish.category}</span>
                        </div>
                        <h3 className={`text-2xl font-black mb-4 ${isCyber ? 'text-white' : 'text-slate-900'}`}>{dish.name}</h3>
                        <p className={`text-sm mb-8 flex-grow leading-relaxed ${isCyber ? 'text-gray-400' : 'text-slate-600'}`}>{dish.description}</p>
                        <button 
                          onClick={() => addToCart(dish)}
                          className={`w-full py-4 font-black flex items-center justify-center gap-2 transition-all rounded-full ${
                            isCyber 
                            ? 'border border-cyber-neon text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg' 
                            : 'bg-slate-900 text-white hover:bg-slate-800'
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
            <motion.div 
              key="admin-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto px-4 py-16"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${isCyber ? 'bg-cyber-pink' : 'bg-purple-100'}`}>
                    <Sparkles className={isCyber ? 'text-white' : 'text-purple-600'} size={32} />
                  </div>
                  <div>
                    <h2 className={`text-4xl font-black ${isCyber ? 'text-white' : 'text-slate-900'}`}>АДМІН ПАНЕЛЬ</h2>
                    <p className="text-gray-500 uppercase text-xs tracking-widest font-bold">Управління гастрономічною матрицею</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentView('MENU')}
                  className={`p-4 rounded-full transition-all ${isCyber ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Add Form */}
                <div className={`p-8 rounded-3xl border transition-all ${cardStyles}`}>
                  <h3 className={`text-xl font-black mb-8 border-b pb-4 ${isCyber ? 'text-cyber-neon border-white/5' : 'text-slate-800 border-slate-100'}`}>
                    НОВА СТРАВА
                  </h3>
                  <form onSubmit={handleAddDish} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Назва</label>
                      <input 
                        required
                        type="text"
                        value={newDish.name}
                        onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                        className={`w-full p-4 rounded-xl outline-none transition-all ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                        placeholder="Кібер-Куліш"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Ціна (₴)</label>
                        <input 
                          required
                          type="number"
                          value={newDish.price || ''}
                          onChange={(e) => setNewDish({ ...newDish, price: Number(e.target.value) })}
                          className={`w-full p-4 rounded-xl outline-none transition-all ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Категорія</label>
                        <select 
                          value={newDish.category}
                          onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                          className={`w-full p-4 rounded-xl outline-none transition-all appearance-none ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                        >
                          {categories.filter(c => c !== 'Всі').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Опис</label>
                      <textarea 
                        required
                        value={newDish.description}
                        onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                        className={`w-full p-4 rounded-xl outline-none h-32 transition-all ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                        placeholder="Технічні характеристики страви..."
                      ></textarea>
                    </div>
                    <button 
                      type="submit"
                      className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all ${buttonAccent}`}
                    >
                      ІНТЕГРУВАТИ У СИСТЕМУ
                    </button>
                  </form>
                </div>

                {/* List Management */}
                <div className="space-y-4">
                  <h3 className={`text-xl font-black mb-6 flex items-center justify-between ${isCyber ? 'text-white' : 'text-slate-800'}`}>
                    АКТУАЛЬНЕ МЕНЮ
                    <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{menu.length} позицій</span>
                  </h3>
                  <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 custom-scroll">
                    {menu.map(dish => (
                      <div key={dish.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${isCyber ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-100 hover:shadow-md'}`}>
                        <img src={dish.image} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-grow">
                          <h4 className="font-bold text-sm leading-tight">{dish.name}</h4>
                          <p className={`text-[10px] uppercase font-bold opacity-50 ${isCyber ? 'text-cyber-neon' : 'text-purple-600'}`}>{dish.price} ₴</p>
                        </div>
                        <button 
                          onClick={() => deleteFromMenu(dish.id)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed right-0 top-0 h-full w-full max-w-md z-[70] flex flex-col shadow-2xl ${isCyber ? 'bg-cyber-dark text-white' : 'bg-white text-slate-900'}`}
            >
              <div className={`p-6 border-b flex items-center justify-between ${isCyber ? 'border-white/10' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <ShoppingCart className={isCyber ? 'text-cyber-neon' : 'text-slate-900'} size={24} />
                  <h3 className="text-2xl font-black">КОШИК</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="hover:text-red-500 transition-colors">
                  <X size={32} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-4">
                    <Utensils size={64} />
                    <p className="font-black text-sm uppercase tracking-[0.3em]">Система порожня</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                        <p className={`font-black text-sm mb-2 ${isCyber ? 'text-cyber-neon' : 'text-purple-600'}`}>{item.price} ₴</p>
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center border rounded-full px-2 ${isCyber ? 'border-white/20' : 'border-slate-200'}`}>
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-500"><Minus size={14}/></button>
                            <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-green-500"><Plus size={14}/></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className={`p-8 border-t space-y-6 ${isCyber ? 'bg-cyber-bg border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Разом</span>
                    <span className={`text-4xl font-black ${isCyber ? 'text-cyber-neon' : 'text-slate-900'}`}>{cartTotal} ₴</span>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); alert('Дякуємо! Кібер-кур\'єр вже в дорозі!'); setCart([]); setIsCartOpen(false); }} className="space-y-4">
                    <input 
                      required
                      type="text" 
                      placeholder="Адреса доставки (Сектор/Район)"
                      className={`w-full p-4 rounded-xl outline-none text-sm transition-all border ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-pink text-white' : 'bg-white border-slate-200 focus:border-purple-500 text-slate-900'}`}
                    />
                    <button 
                      type="submit"
                      className={`w-full py-5 text-white font-black rounded-2xl shadow-xl transition-all ${buttonAccent}`}
                    >
                      ОФОРМИТИ ЗАМОВЛЕННЯ
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className={`py-12 border-t transition-colors duration-500 text-center ${isCyber ? 'bg-cyber-dark border-white/5 text-gray-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
        <p className="text-[10px] uppercase font-black tracking-[0.5em] mb-4">Cyber-Delivery Protocol v4.2.0</p>
        <p>© 2077 Нео-Київ. Захищено кібер-щитом.</p>
      </footer>
    </div>
  );
}
