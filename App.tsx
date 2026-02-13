
import React, { useState, useMemo } from 'react';
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
  User
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

export default function App() {
  const [menu, setMenu] = useState<Dish[]>(INITIAL_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | 'Всі'>('Всі');
  
  // Admin Form State
  const [newDish, setNewDish] = useState<Partial<Dish>>({
    name: '',
    description: '',
    price: 0,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    category: 'Основні страви'
  });

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

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const details = cart.map(item => `${item.name} x${item.quantity}`).join('\n');
    alert(`ЗАМОВЛЕННЯ ПРИЙНЯТО!\n\nДеталі:\n${details}\n\nРазом до сплати: ${cartTotal} ₴\nКур'єр вже заряджає свій кібер-байк!`);
    setCart([]);
    setIsCartOpen(false);
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
    alert('Нова кібер-страва додана до меню!');
  };

  return (
    <div className="min-h-screen font-sans selection:bg-cyber-pink selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-cyber-bg/80 backdrop-blur-md border-b border-cyber-neon/30">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-cyber-neon w-8 h-8 fill-cyber-neon" />
            <h1 className="text-2xl font-cyber font-bold tracking-tighter text-cyber-neon">
              CYBER<span className="text-cyber-pink">FOOD</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsAdmin(!isAdmin)}
              className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-cyber-pink transition-colors"
            >
              <Settings size={18} />
              {isAdmin ? 'Вийти з Адмін-панелі' : 'Адмін Вхід'}
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full border border-cyber-neon group hover:bg-cyber-neon transition-all"
            >
              <ShoppingCart className="text-cyber-neon group-hover:text-cyber-bg" size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyber-pink text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyber-bg"></div>
            <img 
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1600" 
              className="w-full h-full object-cover opacity-20 grayscale"
              alt="Background"
            />
          </div>
          
          <div className="relative z-10 text-center px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl md:text-8xl font-cyber font-bold text-white mb-6 leading-tight">
                УКРАЇНСЬКИЙ <br /> 
                <span className="text-cyber-neon drop-shadow-[0_0_15px_#39FF14]">КІБЕР-ПАНК</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 font-light max-w-2xl mx-auto uppercase tracking-widest">
                Традиційні смаки майбутнього. Доставка зі швидкістю світла.
              </p>
              <button 
                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-4 bg-cyber-pink text-white font-cyber font-bold rounded-sm pink-glow transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
              >
                ЗАМОВИТИ ЗАРАЗ <ChevronRight size={20} />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Categories Bar */}
        <div className="sticky top-20 z-40 bg-cyber-bg py-6 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 flex gap-4 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2 rounded-full font-cyber text-sm transition-all border ${
                  activeCategory === cat 
                  ? 'bg-cyber-neon text-cyber-bg border-cyber-neon' 
                  : 'bg-transparent text-gray-400 border-white/10 hover:border-cyber-neon/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <section id="menu" className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredMenu.map((dish) => (
                <motion.div
                  layout
                  key={dish.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-cyber-dark border border-white/10 rounded-xl overflow-hidden group hover:border-cyber-neon/50 transition-all flex flex-col h-full"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={dish.image} 
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-cyber-bg/80 backdrop-blur px-3 py-1 rounded text-cyber-neon font-bold font-cyber text-lg border border-cyber-neon/30">
                      {dish.price} ₴
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame size={14} className="text-cyber-pink" />
                      <span className="text-[10px] text-cyber-pink font-bold uppercase tracking-widest">{dish.category}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-cyber-neon transition-colors">{dish.name}</h3>
                    <p className="text-gray-400 text-sm mb-6 flex-grow">{dish.description}</p>
                    <button 
                      onClick={() => addToCart(dish)}
                      className="w-full py-3 border border-cyber-neon text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg transition-all font-bold flex items-center justify-center gap-2 rounded-sm"
                    >
                      <Plus size={18} /> ДОДАТИ
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Admin Panel Simulation */}
        {isAdmin && (
          <section className="bg-cyber-dark py-20 border-t border-cyber-pink/30">
            <div className="max-w-3xl mx-auto px-4">
              <div className="flex items-center gap-3 mb-10">
                <Settings className="text-cyber-pink animate-spin-slow" />
                <h2 className="text-3xl font-cyber text-cyber-pink">КІБЕР-АДМІН ПАНЕЛЬ</h2>
              </div>
              <form onSubmit={handleAddDish} className="space-y-6 bg-cyber-bg p-8 rounded-lg border border-white/10">
                <div>
                  <label className="block text-xs uppercase text-gray-400 mb-2">Назва страви</label>
                  <input 
                    required
                    type="text"
                    value={newDish.name}
                    onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                    className="w-full bg-cyber-dark border border-white/10 p-3 rounded text-white focus:border-cyber-neon outline-none"
                    placeholder="Наприклад: Кібер-Галушки"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Ціна (₴)</label>
                    <input 
                      required
                      type="number"
                      value={newDish.price || ''}
                      onChange={(e) => setNewDish({ ...newDish, price: Number(e.target.value) })}
                      className="w-full bg-cyber-dark border border-white/10 p-3 rounded text-white focus:border-cyber-neon outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Категорія</label>
                    <select 
                      value={newDish.category}
                      onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                      className="w-full bg-cyber-dark border border-white/10 p-3 rounded text-white focus:border-cyber-neon outline-none"
                    >
                      {categories.filter(c => c !== 'Всі').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-400 mb-2">Опис</label>
                  <textarea 
                    required
                    value={newDish.description}
                    onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                    className="w-full bg-cyber-dark border border-white/10 p-3 rounded text-white focus:border-cyber-neon outline-none h-32"
                    placeholder="Опишіть страву..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-400 mb-2">URL Зображення</label>
                  <input 
                    type="text"
                    value={newDish.image}
                    onChange={(e) => setNewDish({ ...newDish, image: e.target.value })}
                    className="w-full bg-cyber-dark border border-white/10 p-3 rounded text-white focus:border-cyber-neon outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-cyber-neon text-cyber-bg font-bold font-cyber hover:bg-white transition-all rounded-sm"
                >
                  ОНОВИТИ МАТРИЦЮ МЕНЮ
                </button>
              </form>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-cyber-dark py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="text-cyber-neon w-6 h-6" />
            <h1 className="text-xl font-cyber font-bold tracking-tighter text-white">
              CYBER<span className="text-cyber-neon">FOOD</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm uppercase tracking-widest">© 2077 Нео-Київ. Всі права зашифровані.</p>
        </div>
      </footer>

      {/* Shopping Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-cyber-bg/90 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-cyber-dark border-l border-cyber-neon/30 z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-cyber-neon" size={24} />
                  <h3 className="text-2xl font-cyber font-bold text-white">КОШИК</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-cyber-pink">
                  <X size={32} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                    <Utensils size={48} className="opacity-20" />
                    <p className="text-center font-cyber text-sm uppercase">Ваш кошик порожній</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded border border-white/10 overflow-hidden">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-white font-bold text-sm mb-1">{item.name}</h4>
                        <p className="text-cyber-neon font-bold text-sm mb-2">{item.price} ₴</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-white/20 rounded-sm">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-cyber-neon transition-colors"><Minus size={14}/></button>
                            <span className="w-8 text-center text-xs text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-cyber-neon transition-colors"><Plus size={14}/></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-cyber-pink transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-cyber-bg border-t border-cyber-neon/30 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-cyber text-sm uppercase">Загальна сума</span>
                    <span className="text-3xl font-cyber text-cyber-neon">{cartTotal} ₴</span>
                  </div>
                  <form onSubmit={handleCheckout} className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 text-cyber-pink" size={18} />
                      <input 
                        required
                        type="text" 
                        placeholder="Ваше Ім'я"
                        className="w-full bg-cyber-dark border border-white/10 p-3 pl-10 rounded text-white focus:border-cyber-pink outline-none text-sm"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-4 bg-cyber-pink text-white font-bold font-cyber hover:bg-white hover:text-cyber-pink transition-all rounded-sm flex items-center justify-center gap-2"
                    >
                      ПІДТВЕРДИТИ ЗАМОВЛЕННЯ <ChevronRight size={18} />
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
