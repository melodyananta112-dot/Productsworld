import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { Package, Heart, LogOut, ArrowLeft, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProfilePage() {
  const { user, logout, isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="bg-[#064e3b]/90 backdrop-blur-md border-b border-[#fbbf24]/20 py-4 top-0 sticky z-50">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-4">
          <Button onClick={() => navigate(-1)} variant="ghost" className="text-[#fbbf24] hover:bg-[#fbbf24]/10 rounded-full h-10 w-10 p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-serif font-black text-[#fbbf24] uppercase tracking-wide">
            Personal Panel
          </h1>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#022c22]/40 backdrop-blur-xl border border-[#fbbf24]/20 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf24]/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="shrink-0 flex flex-col items-center gap-4">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "User"} 
                  className="w-32 h-32 rounded-full border-4 border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.3)] object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-[#fbbf24]/50 bg-[#064e3b] flex items-center justify-center shadow-inner">
                  <UserCircle className="w-16 h-16 text-[#fbbf24]/50" />
                </div>
              )}
              
              <Button 
                onClick={logout}
                variant="outline"
                className="w-full gap-2 border-rose-500/50 text-rose-500 hover:bg-rose-500/10 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>

            <div className="flex-1 text-center md:text-left flex flex-col gap-6">
              <div>
                <h2 className="text-3xl font-black text-[#fbbf24] font-serif mb-1">{user.displayName || 'Customer'}</h2>
                <p className="text-white/60 mb-2">{user.email}</p>
                {isAdmin && (
                  <span className="inline-block bg-[#fbbf24] text-[#064e3b] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Admin Account
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Link to="/orders">
                  <Button className="w-full h-16 gap-4 bg-[#064e3b] hover:bg-[#022c22] border border-[#fbbf24]/30 text-[#fbbf24] rounded-2xl justify-start px-6 transition-all hover:scale-[1.02]">
                    <div className="bg-[#fbbf24]/10 p-2 rounded-xl">
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold uppercase tracking-wider text-sm">{t('orders')}</div>
                      <div className="text-xs text-white/50 lowercase">track your packages</div>
                    </div>
                  </Button>
                </Link>

                <Link to="/favorites">
                  <Button className="w-full h-16 gap-4 bg-[#064e3b] hover:bg-[#022c22] border border-[#fbbf24]/30 text-[#fbbf24] rounded-2xl justify-start px-6 transition-all hover:scale-[1.02]">
                    <div className="bg-[#fbbf24]/10 p-2 rounded-xl">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold uppercase tracking-wider text-sm">{t('favorites')}</div>
                      <div className="text-xs text-white/50 lowercase">saved items</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
