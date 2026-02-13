
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Sparkles,
  Upload,
  Image as ImageIcon,
  Info,
  Clock,
  Edit2
} from 'lucide-react';
import { Dish, CartItem, Category } from './types';

const INITIAL_MENU: Dish[] = [
  {
    id: '1',
    name: 'Борщ із пампушками',
    description: 'Традиційний український борщ з яловичиною, сметаною та часниковими пампушками.',
    price: 185,
    image: 'https://images.unsplash.com/photo-1594966121993-21c33974d61c?auto=format&fit=crop&q=80&w=800',
    category: 'Перші страви',
    ingredients: ['Буряк', 'Яловичина', 'Капуста', 'Картопля', 'Морква', 'Цибуля', 'Сметана', 'Пампушки', 'Часник']
  },
  {
    id: '2',
    name: 'Вареники з картоплею',
    description: 'Домашні вареники зі хрусткими шкварками та смаженою золотистою цибулею.',
    price: 145,
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=800',
    category: 'Основні страви',
    ingredients: ['Тісто', 'Картопляне пюре', 'Цибуля', 'Сало (шкварки)', 'Вершкове масло', 'Сметана']
  },
  {
    id: '3',
    name: 'Котлета по-київськи',
    description: 'Соковите куряче філе з ароматним вершковим маслом та свіжою зеленню всередині.',
    price: 210,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800',
    category: 'Основні страви',
    ingredients: ['Куряче філе', 'Вершкове масло', 'Кріп', 'Панірувальні сухарі', 'Яйце']
  },
  {
    id: '4',
    name: 'Сет "Українське Сало"',
    description: 'Асорті з найкращих видів сала: копченого, солоного та запеченого з гострими спеціями.',
    price: 165,
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=800',
    category: 'Закуски',
    ingredients: ['Сало копчене', 'Сало солоне', 'Сало з проріззю', 'Гірчиця', 'Хрін', 'Житній хліб', 'Зелена цибуля']
  },
  {
    id: '5',
    name: 'Карпатський Банош',
    description: 'Гуцульська кукурудзяна каша, зварена на домашніх вершках з бринзою та білими грибами.',
    price: 195,
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=800',
    category: 'Основні страви',
    ingredients: ['Кукурудзяна крупа', 'Вершки', 'Сметана', 'Бринза', 'Білі гриби', 'Шкварки']
  },
  {
    id: '6',
    name: 'Деруни зі сметаною',
    description: 'Традиційні хрусткі картопляні оладки, підсмажені до золотої скоринки.',
    price: 130,
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=800',
    category: 'Закуски',
    ingredients: ['Картопля', 'Цибуля', 'Яйце', 'Борошно', 'Сіль', 'Перець', 'Сметана']
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
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Admin Form State
  const [newDish, setNewDish] = useState<Partial<Dish> & { ingredientsInput: string }>({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'Основні страви',
    ingredientsInput: ''
  });

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

  const addToCart = (dish: Dish, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const startEditing = (dish: Dish) => {
    setEditingDishId(dish.id);
    setNewDish({
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image: dish.image,
      category: dish.category as Category,
      ingredientsInput: dish.ingredients.join(', ')
    });
    // Scroll to form
    const formElement = document.getElementById('admin-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDish(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDish.image) {
      alert('Будь ласка, завантажте фото!');
      return;
    }
    const ingredients = newDish.ingredientsInput.split(',').map(i => i.trim()).filter(i => i !== '');
    
    if (editingDishId) {
      // Update
      setMenu(prev => prev.map(d => d.id === editingDishId ? {
        ...d,
        name: newDish.name!,
        description: newDish.description!,
        price: Number(newDish.price),
        image: newDish.image!,
        category: newDish.category!,
        ingredients: ingredients,
      } : d));
      alert('Страву успішно оновлено!');
    } else {
      // Add
      const dish: Dish = {
        name: newDish.name!,
        description: newDish.description!,
        price: Number(newDish.price),
        image: newDish.image,
        category: newDish.category!,
        ingredients: ingredients,
        id: Math.random().toString(36).substr(2, 9),
      };
      setMenu(prev => [dish, ...prev]);
      alert('Страва інтегрована в меню!');
    }

    setEditingDishId(null);
    setNewDish({ name: '', description: '', price: 0, image: '', category: 'Основні страви', ingredientsInput: '' });
    setCurrentView('MENU');
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const isCyber = activeTheme === 'CYBER';
  const accentColor = isCyber ? 'text-cyber-neon' : 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500';
  const buttonAccent = isCyber ? 'bg-cyber-pink hover:shadow-[0_0_20px_#FF007F]' : 'bg-gradient-to-r from-red-500 to-purple-600 hover:scale-105';
  const cardStyles = isCyber ? 'bg-cyber-dark border-white/10 rounded-none' : 'bg-white border-2 border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50';
  const navStyles = isCyber ? 'bg-cyber-bg/90 border-cyber-neon/30' : 'bg-white/90 border-slate-200 shadow-lg';

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

      <main className="pt-20">
        <AnimatePresence mode="wait">
          {currentView === 'MENU' ? (
            <motion.div 
              key="menu-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Hero */}
              <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
                {!isCyber && (
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-300 via-purple-300 to-indigo-300 animate-pulse"></div>
                )}
                <div className="relative z-10 text-center px-4 max-w-4xl">
                  <h2 className={`text-4xl md:text-8xl font-black mb-6 leading-tight uppercase ${isCyber ? 'text-white' : 'text-slate-900'}`}>
                    Заклад <br /> 
                    <span className={accentColor}>ГУСОЧКА</span>
                  </h2>
                  <p className={`text-base md:text-xl mb-10 font-bold max-w-2xl mx-auto uppercase tracking-widest opacity-80 ${!isCyber ? 'text-indigo-600' : ''}`}>
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

              {/* Grid */}
              <section id="menu-grid" className="max-w-7xl mx-auto px-4 py-10 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                  {filteredMenu.map((dish) => (
                    <motion.div
                      layout
                      key={dish.id}
                      onClick={() => setSelectedDish(dish)}
                      className={`group overflow-hidden transition-all flex flex-col h-full cursor-pointer relative ${cardStyles}`}
                    >
                      <div className="relative h-56 md:h-64 overflow-hidden">
                        <img 
                          src={dish.image} 
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className={`absolute top-4 right-4 backdrop-blur px-4 py-1.5 rounded-full font-black text-base md:text-lg shadow-lg border ${isCyber ? 'bg-cyber-bg/80 text-cyber-neon border-cyber-neon/30' : 'bg-white/90 text-slate-900 border-white'}`}>
                          {dish.price} ₴
                        </div>
                        <div className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Info size={16} />
                        </div>
                      </div>
                      <div className="p-6 md:p-8 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <Flame size={14} className={isCyber ? 'text-cyber-pink' : 'text-orange-500'} />
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCyber ? 'text-cyber-pink' : 'text-slate-400'}`}>{dish.category}</span>
                        </div>
                        <h3 className={`text-xl md:text-2xl font-black mb-4 ${isCyber ? 'text-white' : 'text-slate-900'}`}>{dish.name}</h3>
                        <p className={`text-sm mb-8 flex-grow leading-relaxed line-clamp-2 ${isCyber ? 'text-gray-400' : 'text-slate-600'}`}>{dish.description}</p>
                        <button 
                          onClick={(e) => addToCart(dish, e)}
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
              className="max-w-6xl mx-auto px-4 py-10 md:py-16"
            >
              <div className="flex items-center justify-between mb-8 md:mb-12">
                <div className="flex items-center gap-4">
                  <div className={`p-3 md:p-4 rounded-2xl ${isCyber ? 'bg-cyber-pink' : 'bg-purple-100'}`}>
                    <Sparkles className={isCyber ? 'text-white' : 'text-purple-600'} size={24} />
                  </div>
                  <div>
                    <h2 className={`text-2xl md:text-4xl font-black ${isCyber ? 'text-white' : 'text-slate-900'}`}>АДМІН ПАНЕЛЬ</h2>
                    <p className="text-gray-500 uppercase text-[10px] md:text-xs tracking-widest font-bold">Управління гастрономічною матрицею</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 items-start">
                {/* Form Section */}
                <div id="admin-form" className={`lg:col-span-5 p-6 md:p-8 rounded-3xl border transition-all ${cardStyles}`}>
                  <h3 className={`text-xl font-black mb-8 border-b pb-4 ${isCyber ? 'text-cyber-neon border-white/5' : 'text-slate-800 border-slate-100'}`}>
                    {editingDishId ? 'РЕДАГУВАННЯ СТРАВИ' : 'НОВА СТРАВА'}
                  </h3>
                  <form onSubmit={handleSubmitDish} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Фото страви</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${
                          newDish.image ? 'border-transparent' : (isCyber ? 'border-white/10 hover:border-cyber-neon bg-white/5' : 'border-slate-200 hover:border-purple-500 bg-slate-50')
                        }`}
                      >
                        {newDish.image ? (
                          <img src={newDish.image} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className={`opacity-20 ${isCyber ? 'text-white' : 'text-slate-900'}`} size={40} />
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Назва</label>
                      <input required type="text" value={newDish.name} onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                        className={`w-full p-4 rounded-xl outline-none transition-all ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Ціна (₴)</label>
                        <input required type="number" value={newDish.price || ''} onChange={(e) => setNewDish({ ...newDish, price: Number(e.target.value) })}
                          className={`w-full p-4 rounded-xl outline-none transition-all ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Категорія</label>
                        <select value={newDish.category} onChange={(e) => setNewDish({ ...newDish, category: e.target.value as Category })}
                          className={`w-full p-4 rounded-xl outline-none transition-all appearance-none ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                        >
                          {categories.filter(c => c !== 'Всі').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Інгредієнти (через кому)</label>
                      <input type="text" value={newDish.ingredientsInput} onChange={(e) => setNewDish({ ...newDish, ingredientsInput: e.target.value })}
                        className={`w-full p-4 rounded-xl outline-none transition-all ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                        placeholder="Буряк, Сало, Цибуля..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Опис</label>
                      <textarea required value={newDish.description} onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                        className={`w-full p-4 rounded-xl outline-none h-24 transition-all ${isCyber ? 'bg-white/5 border-white/10 focus:border-cyber-neon text-white' : 'bg-slate-50 border-slate-200 focus:border-purple-500'}`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className={`flex-grow py-5 rounded-2xl font-black text-white shadow-xl transition-all ${buttonAccent}`}>
                        {editingDishId ? 'ОНОВИТИ СТРАВУ' : 'ІНТЕГРУВАТИ У СИСТЕМУ'}
                      </button>
                      {editingDishId && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingDishId(null);
                            setNewDish({ name: '', description: '', price: 0, image: '', category: 'Основні страви', ingredientsInput: '' });
                          }}
                          className={`p-5 rounded-2xl border ${isCyber ? 'border-white/10 text-gray-400 hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-600'}`}
                        >
                          <X size={24} />
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className={`text-xl font-black mb-6 ${isCyber ? 'text-white' : 'text-slate-800'}`}>АКТУАЛЬНЕ МЕНЮ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[700px] overflow-y-auto pr-2 custom-scroll">
                    {menu.map(dish => (
                      <div key={dish.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.01] ${isCyber ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-white border-slate-100 hover:shadow-md'}`}>
                        <img src={dish.image} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-grow">
                          <h4 className="font-bold text-sm leading-tight line-clamp-1">{dish.name}</h4>
                          <p className={`text-[10px] uppercase font-bold ${isCyber ? 'text-cyber-neon' : 'text-purple-600'}`}>{dish.price} ₴</p>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => startEditing(dish)} 
                            className={`p-3 rounded-xl transition-all ${isCyber ? 'text-cyber-neon hover:bg-cyber-neon/10' : 'text-blue-500 hover:bg-blue-50'}`}
                            title="Редагувати"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteFromMenu(dish.id)} 
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Видалити"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Dish Detail Modal - Perfectly Centered */}
      <AnimatePresence>
        {selectedDish && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDish(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100]"
            />
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-0 relative ${isCyber ? 'bg-cyber-dark text-white border border-white/10' : 'bg-white text-slate-900 rounded-[2.5rem]'}`}
              >
                <button onClick={() => setSelectedDish(null)} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white z-20 transition-colors">
                  <X size={20} />
                </button>
                
                <div className="relative h-64 md:h-80 w-full">
                  <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
                  <div className={`absolute bottom-0 left-0 w-full p-6 md:p-8 bg-gradient-to-t ${isCyber ? 'from-cyber-dark' : 'from-white'} to-transparent`}>
                    <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${isCyber ? 'bg-cyber-pink text-white' : 'bg-purple-600 text-white'}`}>
                      {selectedDish.category}
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight line-clamp-2">{selectedDish.name}</h2>
                  </div>
                </div>

                <div className="p-6 md:p-8 pt-2 md:pt-4">
                  <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8 text-xs font-bold uppercase opacity-60">
                    <div className="flex items-center gap-2">
                      <Clock size={16} /> 20-30 хв
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-orange-500" /> 450 ккал
                    </div>
                    <div className={`ml-auto text-xl md:text-2xl font-black ${isCyber ? 'text-cyber-neon' : 'text-slate-900'}`}>
                      {selectedDish.price} ₴
                    </div>
                  </div>

                  <div className="mb-8 md:mb-10 text-left">
                    <h3 className={`text-xs font-black uppercase tracking-[0.3em] mb-4 ${isCyber ? 'text-cyber-pink' : 'text-slate-400'}`}>Про страву</h3>
                    <p className={`text-base md:text-lg leading-relaxed ${isCyber ? 'text-gray-300' : 'text-slate-600'}`}>{selectedDish.description}</p>
                  </div>

                  <div className="mb-10 md:mb-12 text-left">
                    <h3 className={`text-xs font-black uppercase tracking-[0.3em] mb-4 ${isCyber ? 'text-cyber-pink' : 'text-slate-400'}`}>Інгредієнти</h3>
                    <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-y-2 list-disc list-inside text-sm font-medium ${isCyber ? 'text-gray-400' : 'text-slate-600'}`}>
                      {selectedDish.ingredients.map((ing, i) => (
                        <li key={i} className={`hover:${isCyber ? 'text-cyber-neon' : 'text-purple-600'} transition-colors cursor-default`}>
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => { addToCart(selectedDish); setSelectedDish(null); }}
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
              <div className={`p-6 border-b flex items-center justify-between ${isCyber ? 'border-white/10' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <ShoppingCart size={24} className={isCyber ? 'text-cyber-neon' : 'text-slate-900'} />
                  <h3 className="text-xl md:text-2xl font-black">КОШИК</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)}><X size={32} /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20"><Utensils size={64} /><p className="font-black mt-4 uppercase tracking-widest">ПОРОЖНЬО</p></div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 group">
                      <img src={item.image} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                      <div className="flex-grow min-w-0">
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
                  <button className={`w-full py-5 text-white font-black rounded-2xl shadow-xl ${buttonAccent}`} onClick={() => { alert('Дякуємо! Ваше замовлення з "Гусочки" передано кур\'єру!'); setCart([]); setIsCartOpen(false); }}>ОФОРМИТИ ЗАМОВЛЕННЯ</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className={`py-12 border-t text-center ${isCyber ? 'bg-cyber-dark border-white/5 text-gray-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
        <p className="text-[10px] md:text-xs uppercase font-black tracking-[0.3em] md:tracking-[0.5em] mb-2 px-4">Cyber-Goose Protocol v5.0.1</p>
        <p className="text-[10px] md:text-sm">© 2077 Нео-Київ | Гусочка. Захищено кібер-щитом.</p>
      </footer>
    </div>
  );
}
