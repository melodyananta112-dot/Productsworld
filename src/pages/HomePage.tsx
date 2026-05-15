import { useState, useEffect, useRef } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useSlideshow } from '../hooks/useSlideshow';
import { useFlashSale } from '../hooks/useFlashSale';
import { useCart } from '../hooks/useCart';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingCart, LogIn, LogOut, User as UserIcon, Package, LayoutDashboard, 
  ChevronRight, ChevronLeft, Heart, Search, Menu, X, Copy, Check,
  Globe, ListFilter, Gift, Facebook, Phone, Mail, Instagram
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { CATEGORIES } from '@/constants/categories';

export default function HomePage() {
  const { products, loading } = useProducts();
  const { images: fetchedSlideshowImages, loading: slideshowLoading } = useSlideshow();
  
  let slideshowImages = fetchedSlideshowImages.map(img => img.url);
  
  // Remove duplicates from fetched images
  slideshowImages = Array.from(new Set(slideshowImages));

  const { addToCart, totalItems } = useCart();

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { user, login, logout, isAdmin, loading: authLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const { flashSales } = useFlashSale();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Flash Sale Setup
  const activeFlashSale = flashSales?.find(sale => sale.isActive && sale.endTime > Date.now());
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [currentFlashSlide, setCurrentFlashSlide] = useState(0);

  useEffect(() => {
    if (!activeFlashSale) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = activeFlashSale.endTime - now;

      if (difference <= 0) {
        setTimeLeft(null);
        clearInterval(interval);
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeFlashSale]);

  useEffect(() => {
    if (!activeFlashSale) return;
    const slides = activeFlashSale.bannerUrls?.length ? activeFlashSale.bannerUrls : (activeFlashSale.bannerUrl ? [activeFlashSale.bannerUrl] : []);
    
    if (currentFlashSlide >= slides.length) {
      setCurrentFlashSlide(0);
    }
  }, [activeFlashSale, currentFlashSlide]);

  useEffect(() => {
    if (!activeFlashSale) return;
    const slides = activeFlashSale.bannerUrls?.length ? activeFlashSale.bannerUrls : (activeFlashSale.bannerUrl ? [activeFlashSale.bannerUrl] : []);
    
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentFlashSlide((prev) => (prev + 1) % slides.length);
    }, 3000); // 3 seconds per user request
    return () => clearInterval(timer);
  }, [activeFlashSale]);

  useEffect(() => {
    if (currentSlide >= slideshowImages.length) {
      setCurrentSlide(0);
    }
  }, [slideshowImages.length, currentSlide]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(1, slideshowImages.length));
    }, 4000);
    return () => clearInterval(timer);
  }, [slideshowImages.length]);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  
  const productSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProduct && selectedProduct.images && selectedProduct.images.length > 0) {
      const interval = setInterval(() => {
        setSelectedImageIndex((prev: number) => {
          return prev === (selectedProduct.images?.length || 0) ? 0 : prev + 1;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct && productSectionRef.current) {
      const y = productSectionRef.current.getBoundingClientRect().top + window.scrollY - 150;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [selectedProduct]);

  const getProductQuantity = (productId: string) => productQuantities[productId] || 1;
  const updateProductQuantity = (productId: string, delta: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }));
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const logoUrl = "https://i.ibb.co.com/TDG0LTVh/logo.png";

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#064e3b]/90 backdrop-blur-md border-b border-[#fbbf24]/20 shadow-lg py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-start shrink-0">
              <Link 
                to="/" 
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedCategory(null);
                }}
                className="flex items-center gap-2 group py-2"
              >
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden border-[2px] md:border-[3px] border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.5)] group-hover:scale-105 transition-all duration-500 bg-[#022c22] flex items-center justify-center p-1 md:p-2">
                  <img 
                    src={logoUrl} 
                    alt="Product'S World" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-baseline gap-2 hidden lg:flex whitespace-nowrap">
                  <span className="text-3xl md:text-4xl font-serif font-black gold-text tracking-tighter leading-none">
                    Product'S World
                  </span>
                </div>
              </Link>
            </div>

            {/* Search Box & Slogan */}
            <div className="flex-1 max-w-xl mx-4 md:mx-8 hidden md:flex flex-col items-center gap-4">
              <div className="relative group w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#fbbf24]/60 group-focus-within:text-[#fbbf24] transition-colors" />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-[#fbbf24]/20 rounded-full py-3.5 pl-14 pr-6 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 focus:bg-white/20 transition-all text-lg"
                />
              </div>
              <p className="text-sm md:text-lg font-serif font-bold italic text-[#fbbf24] tracking-[0.1em] whitespace-nowrap drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                {t('slogan')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" className="hidden md:flex gap-2 text-[#fbbf24] hover:bg-[#fbbf24]/10 h-11 px-5 text-sm font-bold uppercase tracking-wider">
                    <LayoutDashboard className="w-5 h-5" />
                    {t('admin')}
                  </Button>
                </Link>
              )}
              <Link to="/orders">
                <Button variant="ghost" className="hidden md:flex gap-2 text-[#fbbf24] hover:bg-[#fbbf24]/10 h-11 px-5 text-sm font-bold uppercase tracking-wider">
                  <Package className="w-5 h-5" />
                  {t('orders')}
                </Button>
              </Link>
              <Link to="/favorites">
                <Button variant="ghost" className="hidden md:flex gap-2 text-[#fbbf24] hover:bg-[#fbbf24]/10 h-11 px-5 text-sm font-bold uppercase tracking-wider">
                  <Heart className="w-5 h-5" />
                  {t('favorites')}
                </Button>
              </Link>
              <Link to="/cart" className="flex">
                <Button variant="outline" className="flex relative gap-2 border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-[#064e3b] h-9 md:h-11 px-3 md:px-5 text-[10px] md:text-sm font-bold uppercase tracking-wider">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#fbbf24] text-[#064e3b] text-[10px] font-bold px-2 py-1 rounded-full ring-2 ring-[#064e3b]">
                      {totalItems}
                    </span>
                  )}
                  <span className="hidden lg:inline">{t('cart')}</span>
                </Button>
              </Link>

              {user ? (
                <div className="flex items-center gap-1 md:gap-2">
                  <Link to="/profile">
                    <img src={user.photoURL || ''} alt="" className="hidden md:block w-11 h-11 rounded-full border-2 border-[#fbbf24] shadow-lg hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                  </Link>
                  <Link to="/profile">
                    <Button variant="ghost" className="md:hidden text-[#fbbf24] hover:bg-[#fbbf24]/10 gap-1.5 h-9 px-2.5 text-[10px] font-bold uppercase tracking-wider border border-[#fbbf24]/20 shrink-0">
                      <UserIcon className="w-4 h-4" />
                      <span className="inline">Profile</span>
                    </Button>
                  </Link>
                  <Button 
                    onClick={logout} 
                    variant="ghost" 
                    className="text-[#fbbf24]/80 hover:text-[#fbbf24] hover:bg-white/5 gap-1.5 md:gap-2 h-9 md:h-11 px-2.5 md:px-4 text-[10px] md:text-sm font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 shrink-0"
                  >
                    <LogOut className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
                    <span className="text-rose-500 inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="shrink-0">
                  <Button 
                    onClick={login} 
                    className="gap-1.5 md:gap-2 bg-[#fbbf24] text-[#064e3b] hover:bg-[#fcd34d] font-bold px-3 md:px-8 h-9 md:h-11 rounded-full shadow-lg shadow-[#fbbf24]/20 uppercase tracking-widest text-[10px] md:text-sm shrink-0"
                  >
                    <LogIn className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="inline">{t('login')}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Layout */}
      <div className="pt-10 md:pt-14">
        {/* Product Grid Area */}
        <main className="w-[1600px] max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" style={{ width: '1600px' }}>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 lg:-ml-10 flex-shrink-0 order-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-[#022c22]/40 backdrop-blur-xl rounded-[2rem] border border-[#fbbf24]/10 shadow-2xl overflow-hidden">
                <div className="bg-[#064e3b] p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#fbbf24] flex items-center justify-center text-[#064e3b] shadow-lg shadow-[#fbbf24]/20">
                    <ListFilter className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[#fbbf24] font-serif font-black text-lg tracking-tight">All Category</h2>
                  </div>
                </div>
                
                <div className="p-3 max-h-[50vh] lg:max-h-[65vh] overflow-y-auto custom-scrollbar">
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group mb-1 ${
                      selectedCategory === null 
                      ? "bg-[#fbbf24]/10 text-[#fbbf24] shadow-inner border border-[#fbbf24]/20" 
                      : "hover:bg-[#fbbf24]/5 text-[#fbbf24]/60 hover:text-[#fbbf24]"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      selectedCategory === null ? "bg-[#064e3b] text-[#fbbf24] shadow-md shadow-[#064e3b]/20" : "bg-white/10 text-white/40 group-hover:bg-[#fbbf24]/20 group-hover:text-[#fbbf24]"
                    }`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest">{t('our_collection')}</span>
                    {selectedCategory === null && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#fbbf24] shadow-[0_0_8px_#fbbf24]"></div>}
                  </button>

                  <div className="h-px bg-white/5 my-2 mx-4"></div>

                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button 
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full flex items-center gap-3 p-3 lg:p-4 rounded-2xl transition-all duration-300 group ${
                            selectedCategory === cat.id 
                            ? "bg-[#fbbf24]/10 text-[#fbbf24] shadow-inner border border-[#fbbf24]/20" 
                            : "hover:bg-[#fbbf24]/5 text-[#fbbf24]/60 hover:text-[#fbbf24]"
                          }`}
                        >
                          <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            selectedCategory === cat.id ? "bg-[#064e3b] text-[#fbbf24] shadow-md shadow-[#064e3b]/20" : "bg-white/10 text-white/40 group-hover:bg-[#fbbf24]/20 group-hover:text-[#fbbf24]"
                          }`}>
                            <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                          </div>
                          <span className="font-bold text-[10px] lg:text-xs uppercase tracking-widest text-left whitespace-nowrap overflow-hidden text-ellipsis">{cat.name}</span>
                          {selectedCategory === cat.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#fbbf24] shadow-[0_0_8px_#fbbf24] hidden lg:block"></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>


            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 order-2" ref={productSectionRef}>
            {!selectedProduct && (
              <>
                {!selectedCategory && (
                  <div className="-mt-16 md:-mt-24 mb-12 w-full max-w-[1200px] mx-auto flex flex-col md:flex-row gap-6 justify-center px-2 md:px-0">
                    <div className={`relative ${activeFlashSale && timeLeft ? 'md:w-[70%]' : 'w-full max-w-[995px]'} w-full overflow-hidden rounded-2xl md:rounded-[3.5rem] shadow-[0_0_60px_rgba(255,0,210,0.2)] bg-black/5 border-2 md:border-4 border-[#fbbf24]/30 group`} style={{ height: '350px' }}>
                      <AnimatePresence mode="wait">
                          <motion.div
                            key={`slide-${currentSlide}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full flex items-center justify-center text-left"
                          >
                            <img 
                              src={slideshowImages[currentSlide]} 
                              alt={`Banner ${currentSlide + 1}`}
                              className="w-full h-full object-fill block" 
                              referrerPolicy="no-referrer"
                            />
                          </motion.div>
                      </AnimatePresence>

                      {/* Navigation Arrows */}
                      <button 
                        onClick={() => setCurrentSlide((prev) => (prev - 1 + slideshowImages.length) % slideshowImages.length)}
                        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/40 hover:bg-[#fbbf24] text-[#fbbf24] hover:text-black rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                      >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                      <button 
                        onClick={() => setCurrentSlide((prev) => (prev + 1) % slideshowImages.length)}
                        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/40 hover:bg-[#fbbf24] text-[#fbbf24] hover:text-black rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                      >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                      </button>

                      {/* Progress Indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {slideshowImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`transition-all duration-500 rounded-full h-1 md:h-1.5 ${
                              currentSlide === idx 
                              ? "w-6 md:w-10 bg-[#fbbf24] shadow-[0_0_10px_#fbbf24]" 
                              : "w-1.5 bg-white/30 hover:bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Flash Sale Section */}
                    {activeFlashSale && timeLeft && (
                      <div className="relative w-full md:w-[30%] flex flex-col gap-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            if (activeFlashSale.linkUrl) {
                              window.location.href = activeFlashSale.linkUrl;
                              return;
                            }
                            setSelectedProduct({
                              id: `flashsale-${activeFlashSale.id}`,
                              name: "Flash Sale Special Offer",
                              price: activeFlashSale.price || 0,
                              image: activeFlashSale.bannerUrls?.[0] || activeFlashSale.bannerUrl || '',
                              images: activeFlashSale.bannerUrls || (activeFlashSale.bannerUrl ? [activeFlashSale.bannerUrl] : []),
                              description: activeFlashSale.description || "Limited time exclusive flash sale offer. Grab it before it ends!",
                              inStock: true
                            });
                          }}
                          className="relative w-full block overflow-hidden rounded-2xl md:rounded-[3.5rem] shadow-[0_0_30px_rgba(251,191,36,0.2)] bg-black/5 border-2 md:border-4 border-[#fbbf24]/50 group transition-transform hover:scale-[1.01] duration-300 text-left" 
                          style={{ height: '350px' }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`flash-slide-${currentFlashSlide}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0"
                            >
                              <img 
                                src={
                                  (activeFlashSale.bannerUrls?.length 
                                    ? activeFlashSale.bannerUrls[currentFlashSlide] 
                                    : activeFlashSale.bannerUrl) || ''
                                } 
                                alt="Flash Sale" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </motion.div>
                          </AnimatePresence>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-6 px-4 md:px-6 flex flex-col items-center gap-2">
                            {activeFlashSale.price ? (
                              <div className="bg-[#fbbf24] text-[#064e3b] font-black px-4 py-1.5 rounded-full text-sm md:text-base shadow-xl border-2 border-[#064e3b]/20 mb-1">
                                ৳{activeFlashSale.price.toLocaleString()}
                              </div>
                            ) : null}
                            <span className="text-[#fbbf24] font-bold uppercase tracking-widest text-[10px] md:text-xs bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-[#fbbf24]/20 shadow-xl">Ends In</span>
                            <div className="flex items-center justify-center gap-1.5 md:gap-2 text-white font-mono font-black text-xs md:text-sm lg:text-base">
                              <span className="bg-[#064e3b] px-2 py-1.5 rounded-lg min-w-[2rem] md:min-w-[2.5rem] text-center shadow-inner border border-white/10">{timeLeft.days}d</span><span className="text-[#fbbf24]">:</span>
                              <span className="bg-[#064e3b] px-2 py-1.5 rounded-lg min-w-[2rem] md:min-w-[2.5rem] text-center shadow-inner border border-white/10">{String(timeLeft.hours).padStart(2, '0')}h</span><span className="text-[#fbbf24]">:</span>
                              <span className="bg-[#064e3b] px-2 py-1.5 rounded-lg min-w-[2rem] md:min-w-[2.5rem] text-center shadow-inner border border-white/10">{String(timeLeft.minutes).padStart(2, '0')}m</span><span className="text-[#fbbf24]">:</span>
                              <span className="bg-[#064e3b] px-2 py-1.5 rounded-lg min-w-[2rem] md:min-w-[2.5rem] text-center shadow-inner border border-[#fbbf24] text-[#fbbf24] animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                            </div>
                          </div>
                        </button>
                        <div className="text-center font-serif text-[#fbbf24] font-black uppercase tracking-[0.2em] text-lg md:text-xl drop-shadow-lg">
                          Flash Sale
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-2 mb-4">
                <div className="h-px flex-1 bg-[#064e3b]/10"></div>
                <h2 className="text-xl font-serif font-black text-[#fbbf24] uppercase tracking-[0.2em] whitespace-nowrap">
                  {selectedCategory ? `${CATEGORIES.find(c => c.id === selectedCategory)?.name}` : t('our_collection')}
                </h2>
                <div className="h-px flex-1 bg-[#064e3b]/10"></div>
              </div>
              </>
            )}

                  {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="mb-12 relative w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-[#022c22] border border-[#fbbf24]/20 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row "
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-10 p-2 bg-black/50 hover:bg-[#fbbf24] text-white hover:text-black rounded-full transition-colors backdrop-blur-md"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="w-full md:w-1/2 sticky top-0 md:h-full bg-[#064e3b]/20 flex flex-col group/slider overflow-hidden">
                <div className="w-full relative flex-1 flex flex-col min-h-[300px] md:min-h-[400px]">
                  <img 
                    src={selectedImageIndex === 0 ? selectedProduct.image : (selectedProduct.images?.[selectedImageIndex - 1] || selectedProduct.image)} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover transition-opacity duration-300 flex-1"
                    referrerPolicy="no-referrer"
                  />
                  {(selectedProduct.images && selectedProduct.images.length > 0) && (
                    <>
                      <button 
                        onClick={() => setSelectedImageIndex((prev: number) => prev === 0 ? (selectedProduct.images?.length || 0) : prev - 1)}
                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#fbbf24] text-white hover:text-black p-2 md:p-3 rounded-full opacity-0 group-hover/slider:opacity-100 transition-all backdrop-blur-sm z-10"
                      >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                      <button 
                        onClick={() => setSelectedImageIndex((prev: number) => prev === (selectedProduct.images?.length || 0) ? 0 : prev + 1)}
                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#fbbf24] text-white hover:text-black p-2 md:p-3 rounded-full opacity-0 group-hover/slider:opacity-100 transition-all backdrop-blur-sm z-10"
                      >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                    </>
                  )}
                </div>
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto p-4 bg-black/40 border-t border-[#fbbf24]/10 shrink-0">
                    <button
                      onClick={() => setSelectedImageIndex(0)}
                      className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedImageIndex === 0 ? 'border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={selectedProduct.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                    {selectedProduct.images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx + 1)}
                        className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedImageIndex === idx + 1 ? 'border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col">
                  <div className="mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-serif font-black text-[#fbbf24] leading-tight mb-2 truncate w-full" title={selectedProduct.name}>
                      {selectedProduct.name}
                    </h2>
                    <div className="flex items-center gap-3 md:gap-4 mb-3">
                      <span className="text-xl md:text-2xl font-serif font-black text-[#fbbf24]">৳{selectedProduct.price}</span>
                      <div className="h-4 md:h-5 w-px bg-[#fbbf24]/10"></div>
                      <span className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] text-[#fbbf24]/60"></span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                       {selectedProduct.inStock !== false ? (
                         <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] md:text-xs font-bold tracking-wider px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                           In Stock
                         </Badge>
                       ) : (
                         <Badge className="bg-rose-500/20 text-rose-500 border border-rose-500/30 text-[10px] md:text-xs font-bold tracking-wider px-3 md:px-4 py-1 md:py-1.5 rounded-full">
                           Out of Stock
                         </Badge>
                       )}
                    </div>
                    {selectedProduct.colors && (
                      <div className="mb-6">
                        <h3 className="text-sm md:text-base font-bold tracking-[0.05em] text-[#fbbf24] mb-3">Available Colors</h3>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                          {selectedProduct.colors.split(',').map((color: string, idx: number) => (
                            <Badge 
                              key={`${color.trim()}-${idx}`} 
                              variant={selectedColor === color.trim() ? "default" : "outline"}
                              className={`border-[#fbbf24]/30 text-white font-bold py-2 px-4 md:px-6 rounded-xl md:rounded-2xl text-xs md:text-sm hover:bg-[#fbbf24]/20 transition-colors cursor-pointer ${
                                selectedColor === color.trim() ? "bg-[#fbbf24] text-black hover:bg-[#fbbf24]" : ""
                              }`}
                              onClick={() => setSelectedColor(color.trim())}
                            >
                              {color.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="text-sm md:text-base font-bold tracking-[0.05em] text-[#fbbf24] mb-3">Delivery Time</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-white/80 text-base md:text-lg font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]"></div>
                          <span>Inside Dhaka: 1-2 Days</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-base md:text-lg font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]"></div>
                          <span>Outside Dhaka: 2-3 Days</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-sm md:text-base font-bold tracking-[0.05em] text-[#fbbf24] mb-3">Select Quantity</h3>
                      <div className="flex items-center gap-2 md:gap-3 bg-white/5 p-1.5 rounded-xl md:rounded-2xl border border-white/10 w-fit">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => updateProductQuantity(selectedProduct.id, -1)}
                          className="h-7 w-7 md:h-8 md:w-8 rounded-lg md:rounded-xl hover:bg-white/10 text-white"
                        >
                          -
                        </Button>
                        <span className="w-6 md:w-8 text-center font-serif font-black text-white text-sm md:text-base">
                          {getProductQuantity(selectedProduct.id)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => updateProductQuantity(selectedProduct.id, 1)}
                          className="h-7 w-7 md:h-8 md:w-8 rounded-lg md:rounded-xl hover:bg-white text-black"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Discount Section */}
                    {!String(selectedProduct.id).startsWith('flashsale-') && (
                      <div className="mb-4 bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-2xl p-4 flex items-center justify-center text-center">
                        <p className="text-[#fbbf24] text-xs md:text-sm font-bold leading-relaxed">
                          ৫০০ টাকার বেশি যেকোনো পণ্য ক্রয় করলে পেয়ে যাচ্ছেন ৫০ টাকা ডিসকাউন্ট 🤗
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 relative">
                      <Button 
                        size="lg"
                        onClick={() => {
                          if (selectedProduct.colors && !selectedColor) {
                              toast.error("Please select a color");
                              return;
                          }
                          addToCart(selectedProduct.id, getProductQuantity(selectedProduct.id), selectedColor || undefined);
                          setAddedToCart(true);
                          setTimeout(() => setAddedToCart(false), 1000);
                        }}
                        className="bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-black font-black uppercase text-xs md:text-sm rounded-2xl shadow-[0_10px_20px_rgba(251,191,36,0.2)] hover:shadow-[0_15px_30px_rgba(251,191,36,0.4)] transition-all duration-300 flex items-center justify-center py-6"
                      >
                        <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        Add to Cart
                      </Button>
                      <Button 
                        size="lg"
                        onClick={() => {
                          if (selectedProduct.colors && !selectedColor) {
                              toast.error("Please select a color");
                              return;
                          }
                          
                          if (!user) {
                            login();
                            return;
                          }

                          const qty = getProductQuantity(selectedProduct.id);
                          const total = selectedProduct.price * qty;
                          const deliveryOption = 'inside';
                          const deliveryCharge = 80;
                          const isFlashSale = String(selectedProduct.id).startsWith('flashsale-');
                          const appliedDiscount = (!isFlashSale && total > 500) ? 50 : 0;
                          const finalTotal = Math.max(0, total + deliveryCharge - appliedDiscount);
                          const selectedCartItems = [{
                            productId: selectedProduct.id,
                            quantity: qty,
                            color: selectedColor || undefined,
                            product: selectedProduct
                          }];

                          addToCart(selectedProduct.id, qty, selectedColor || undefined);
                          setSelectedProduct(null);
                          navigate('/delivery', { 
                            state: { 
                              total, 
                              deliveryOption, 
                              deliveryCharge, 
                              selectedCartItems, 
                              finalTotal 
                            } 
                          });
                        }}
                        className="bg-[#064e3b] text-[#fbbf24] border border-[#fbbf24]/30 font-black uppercase text-xs md:text-sm rounded-2xl shadow-xl hover:bg-[#022c22] transition-all duration-300 flex items-center justify-center py-6"
                      >
                        Buy Now
                      </Button>

                      {addedToCart && (
                        <div className="absolute inset-0 bg-[#064e3b] rounded-2xl flex items-center justify-center z-20 border border-[#fbbf24]">
                          <p className="text-[#fbbf24] font-bold text-sm">Product added to cart!</p>
                        </div>
                      )}
                    </div>

                    <div className="my-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#fbbf24] mb-2">Description</h3>
                        <p className="text-[#fbbf24]/90 leading-relaxed text-base font-medium whitespace-pre-wrap break-words">
                          {selectedProduct.description}
                        </p>
                    </div>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

            {/* Product Grid Area underneath product details */}
            <div className="mt-8">
                {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-2 md:gap-x-5 md:gap-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-[4/5] bg-[#064e3b]/20 animate-pulse rounded-3xl border border-[#fbbf24]/5"></div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="space-y-4 md:space-y-6">
                {Array.from(new Set(filteredProducts.map(p => p.category || 'other'))).map(categoryKey => {
                  const categoryProducts = filteredProducts.filter(p => (p.category || 'other') === categoryKey);
                  if (categoryProducts.length === 0) return null;
                  const categoryName = CATEGORIES.find(c => c.id === categoryKey)?.name || 'Other';
                  
                  return (
                    <div key={categoryKey} className="relative">
                      <h2 className="text-xl md:text-2xl font-serif font-black text-[#fbbf24] mb-0 flex items-center gap-4">
                        {categoryName}
                        <div className="flex-1 h-px bg-gradient-to-r from-[#fbbf24]/30 to-transparent"></div>
                      </h2>
                      <motion.div 
                        initial="hidden"
                        animate="show"
                        variants={{
                          hidden: { opacity: 0 },
                          show: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.1
                            }
                          }
                        }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 md:gap-x-6 md:gap-y-3 mt-3"
                      >
                        {categoryProducts.map(product => (
                          <motion.div
                            key={product.id}
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              show: { opacity: 1, y: 0 }
                            }}
                            onClick={() => {
                              setSelectedProduct(product);
                              setSelectedImageIndex(0);
                              setSelectedColor(null);
                            }}
                            className="cursor-pointer h-full"
                          >
                            <Card className="group overflow-hidden border-none bg-[#064e3b]/30 backdrop-blur-sm shadow-xl hover:shadow-[0_20px_60px_rgba(251,191,36,0.15)] transition-all duration-500 rounded-3xl h-full flex flex-col relative border border-[#fbbf24]/5">
                              <div className="aspect-[4/5] overflow-hidden relative">
                                <img 
                                  src={product.image} 
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-[#022c22]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                </div>
                                <div className="absolute top-3 right-3 z-20">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(product.id);
                                    }}
                                    className={`w-8 h-8 rounded-full shadow-xl border border-white/20 transition-all duration-300 ${
                                      isFavorite(product.id) 
                                      ? "bg-[#fbbf24] text-[#064e3b] hover:bg-[#fbbf24]/90" 
                                      : "bg-white/10 backdrop-blur-md text-[#fbbf24] hover:bg-white/20"
                                    }`}
                                  >
                                    <Heart className={`w-[14px] h-[14px] ${isFavorite(product.id) ? "fill-current" : ""}`} />
                                  </Button>
                                </div>
                              </div>
                              <CardHeader className="pt-3 pb-0 px-3 text-center flex flex-col justify-start">
                                <CardTitle className="text-sm md:text-base font-serif font-black text-white group-hover:text-[#fbbf24] transition-colors duration-300 leading-tight tracking-tight line-clamp-2 w-full" title={product.name}>
                                  {product.name}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pb-3 px-3 pt-1 mt-auto text-center flex flex-col justify-end">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[1.1rem] md:text-xl font-serif font-black text-[#fbbf24] tracking-tighter shrink-0">
                                    ৳{product.price}
                                  </span>
                                  <div className="w-8 md:w-10 h-1 bg-[#fbbf24]/30 rounded-full mt-1 group-hover:w-16 group-hover:bg-[#fbbf24] transition-all duration-500"></div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 bg-[#064e3b]/20 rounded-[3rem] shadow-2xl border border-[#fbbf24]/10 px-10">
                <div className="w-24 h-24 bg-[#064e3b]/30 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-[#fbbf24]/5">
                  <Search className="w-10 h-10 text-[#fbbf24]/30" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-serif font-black text-[#fbbf24] mb-3 uppercase tracking-tight">Empty Collection</h3>
                <p className="text-[#fbbf24]/40 font-medium max-w-sm mx-auto leading-relaxed">We couldn't find any items matching your criteria in this collection category.</p>
                <Button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  variant="ghost" 
                  className="mt-8 text-[#d97706] font-black uppercase tracking-[0.25em] text-[10px] hover:bg-[#fbbf24]/10 rounded-full px-8 h-12"
                >
                  Reset All Filters
                </Button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </main>

      {/* Footer */}
      <footer className="bg-[#064e3b] text-[#fbbf24] py-8 border-t border-[#fbbf24]/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 mb-10">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.2)] bg-[#022c22] flex items-center justify-center p-1.5 mb-3">
                <img 
                  src={logoUrl} 
                  alt="Product'S World" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-3xl font-serif font-black gold-text mb-1 tracking-tighter">Product'S World</h2>
              <div className="flex flex-col gap-2 text-[#fbbf24] font-serif text-base opacity-90 max-w-sm mb-4">
                <p className="italic font-bold tracking-wide text-lg">🌿💚Quality You Can Trust💚🌿</p>
                <p>🌟 Smart 🧠 • Stylish 👑 • Affordable💎</p>
                <p>🎁 Gifts • Gadgets • Home Beauty</p>
                <p>🚚 Fast Delivery Across Bangladesh</p>
                <p className="text-sm opacity-70 mt-1 uppercase tracking-wider">📩 Your Next Favorite Thing Is One Inbox Away</p>
              </div>
            </div>

            <div className="flex flex-row flex-wrap items-center justify-center gap-4 py-6 lg:py-0">
              <a 
                href="https://www.facebook.com/productsworld26" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#fbbf24] hover:text-white transition-all bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-[#fbbf24]/20 font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(251,191,36,0.1)] whitespace-nowrap justify-center"
              >
                <Facebook className="w-5 h-5" />
                {t('visit_facebook')}
              </a>
              <a 
                href="https://www.instagram.com/products_world2703" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#fbbf24] hover:text-white transition-all bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-[#fbbf24]/20 font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(251,191,36,0.1)] whitespace-nowrap justify-center"
              >
                <Instagram className="w-5 h-5" />
                {t('visit_instagram')}
              </a>
            </div>

            <div className="flex flex-col items-center lg:items-start gap-4 border-t lg:border-t-0 lg:border-l border-[#fbbf24]/20 pt-8 lg:pt-0 lg:pl-10">
              <h3 className="text-xl font-serif font-bold uppercase tracking-[0.2em]">{t('contact_us')}</h3>
              <div className="flex flex-col items-center lg:items-start gap-3">
                <a href="tel:01783707137" className="flex items-center gap-3 text-[#fbbf24] hover:text-white transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#fbbf24] group-hover:text-[#064e3b] transition-all border border-[#fbbf24]/10">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-base font-bold tracking-wider">01783707137</span>
                </a>
                <a href="mailto:melody.ananta112@gmail.com" className="flex items-center gap-3 text-[#fbbf24] hover:text-white transition-colors group whitespace-nowrap">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#fbbf24] group-hover:text-[#064e3b] transition-all border border-[#fbbf24]/10">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-sm md:text-base font-bold tracking-wider">melody.ananta112@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-[#fbbf24]/10 text-[10px] uppercase tracking-[0.2em] text-[#fbbf24]/30">
            © {new Date().getFullYear()} Product'S World. {t('all_rights_reserved')}
          </div>
        </div>
      </footer>

      {/* Floating Buttons Container */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
        {/* Floating Cart Button */}
        <Link to="/cart">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-[#fbbf24] p-4 rounded-full shadow-[0_10px_25px_rgba(251,191,36,0.4)] flex items-center justify-center relative group"
          >
            <ShoppingCart className="w-8 h-8 text-black" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#064e3b] text-[#fbbf24] text-xs font-bold px-2 py-1 rounded-full ring-2 ring-[#fbbf24]">
                {totalItems}
              </span>
            )}
            <span className="absolute right-full mr-4 bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#fbbf24]/20">
              {t('cart')} ({totalItems})
            </span>
          </motion.div>
        </Link>

        {/* Floating WhatsApp Support Button */}
        <a
          href="https://wa.me/8801783707137"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative"
        >
          {/* Pulsing Background Effect */}
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-[#25D366] rounded-full"
          />
          
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-[#25D366] p-4 rounded-full shadow-[0_10px_25px_rgba(37,211,102,0.4)] flex items-center justify-center relative z-10"
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-8 h-8 fill-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            
            {/* Live Indicator Dot */}
            <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            
            <span className="absolute right-full mr-4 bg-white text-[#064e3b] px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#25D366]/20">
              WhatsApp Support <span className="text-red-500 ml-1">● Live</span>
            </span>
          </motion.div>
        </a>
      </div>
      </div>
    </div>
  );
}