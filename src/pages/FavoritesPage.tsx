import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useFavorites } from '../hooks/useFavorites';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, ShoppingBag, ArrowLeft, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function FavoritesPage() {
  const { products, loading } = useProducts();
  const { addToCart } = useCart();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] overflow-hidden border-[3px] border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.5)] bg-[#022c22] flex items-center justify-center p-2">
              <img 
                src="https://i.ibb.co.com/TDG0LTVh/logo.png" 
                alt="Product'S World" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-4xl font-serif font-bold text-[#fbbf24]">{t('favorites')}</h1>
          </div>
        </div>

        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[#fbbf24] hover:text-[#fbbf24]/80 mb-8 uppercase tracking-widest text-[10px] font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[400px] bg-[#064e3b]/20 animate-pulse rounded-2xl border border-[#fbbf24]/5"></div>
            ))}
          </div>
        ) : favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {favoriteProducts.map(product => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="group overflow-hidden border-none bg-[#064e3b]/30 backdrop-blur-md shadow-2xl hover:shadow-[#fbbf24]/10 transition-all duration-500 rounded-2xl h-full flex flex-col border border-[#fbbf24]/5">
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <span className="bg-[#064e3b] text-[#fbbf24] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-[#fbbf24]/30">
                        {product.category}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(product.id)}
                        className={`rounded-full shadow-lg border border-[#fbbf24]/30 transition-all duration-300 ${
                          isFavorite(product.id) 
                          ? "bg-[#fbbf24] text-[#064e3b] hover:bg-[#fbbf24]/90" 
                          : "bg-[#064e3b] text-[#fbbf24] hover:bg-[#064e3b]/90"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite(product.id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#064e3b]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                      <Button 
                        onClick={() => addToCart(product.id)}
                        className="w-full bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 font-bold uppercase tracking-widest text-xs py-6 rounded-xl"
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? t('out_of_stock') : t('add_to_collection')}
                      </Button>
                    </div>
                  </div>
                  <CardHeader className="p-6 pb-2 text-center">
                    <CardTitle className="text-xl font-serif font-bold text-[#fbbf24] group-hover:text-[#fbbf24] transition-colors duration-300">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 text-center flex-1">
                    <p className="text-sm text-[#fbbf24]/40 font-light mb-4 line-clamp-2 italic">"{product.description}"</p>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl font-serif font-bold text-[#fbbf24]">৳{product.price}</span>
                      <span className="text-[10px] uppercase tracking-widest text-[#fbbf24]/40 font-bold">{product.stock} {t('pieces_available')}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-[#064e3b]/20 rounded-3xl border border-[#fbbf24]/10 shadow-sm">
            <Heart className="w-20 h-20 text-[#fbbf24]/10 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-bold text-[#fbbf24]">{t('no_favorites')}</h3>
            <p className="text-[#fbbf24]/40 font-light mb-10">{t('explore_extraordinary')}</p>
            <Link to="/">
              <Button className="bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 px-12 py-6 rounded-xl font-bold uppercase tracking-widest text-xs">{t('start_exploring')}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
