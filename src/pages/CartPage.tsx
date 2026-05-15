import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';

export default function CartPage() {
  const { cart, addToCart, removeFromCart, updateCartQuantity, updateCartColor, clearCart, totalItems } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deliveryOption, setDeliveryOption] = useState<'inside' | 'suburban' | 'outside'>('inside');

  const deliveryCharges = {
    inside: 80,
    suburban: 100,
    outside: 120,
  };
  const deliveryCharge = deliveryCharges[deliveryOption];

  React.useEffect(() => {
    setSelectedItems(prev => cart.map(item => `${item.productId}-${item.color || 'no-color'}`));
  }, [cart]);
  const { products } = useProducts();
  const { user, profile, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const cartItems = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  }).filter(item => item.product);

  const selectedCartItems = cartItems
    .filter(item => selectedItems.includes(`${item.productId}-${item.color || 'no-color'}`));
    
  const total = selectedCartItems
    .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const totalQuantity = selectedCartItems
    .reduce((sum, item) => sum + item.quantity, 0);

  const nonFlashTotal = selectedCartItems
    .filter(item => !String(item.productId).startsWith('flashsale-'))
    .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const appliedDiscount = nonFlashTotal > 500 ? 50 : 0;
  const finalTotal = Math.max(0, total + deliveryCharge - appliedDiscount);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <Link to="/" className="flex items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] overflow-hidden border-[3px] border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.5)] bg-[#022c22] flex items-center justify-center p-2">
              <img 
                src="https://i.ibb.co.com/TDG0LTVh/logo.png" 
                alt="Product'S World" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#fbbf24]">Product'S World</h1>
          </Link>
          <h1 className="text-4xl font-serif font-bold text-[#fbbf24]">My Cart</h1>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between items-center mb-8 gap-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[#fbbf24] hover:text-[#fbbf24]/80 uppercase tracking-widest text-2xl font-black transition-colors">
            <ArrowLeft className="w-8 h-8" /> Go Back
          </button>
          <h2 className="text-3xl font-serif font-bold text-[#fbbf24]">Payment Information</h2>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item, index) => (
                <Card key={`${item.productId}-${item.color || 'no-color'}-${index}`} className="overflow-hidden border-none shadow-lg rounded-2xl bg-[#064e3b]/30 backdrop-blur-md border border-[#fbbf24]/10">
                  <div className="flex p-6 gap-6 items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.includes(`${item.productId}-${item.color || 'no-color'}`)}
                      onChange={() => setSelectedItems(prev => {
                          const key = `${item.productId}-${item.color || 'no-color'}`;
                          return prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key];
                      })}
                      className="accent-[#fbbf24] w-6 h-6"
                    />
                    <img src={item.product?.image} alt="" className="w-32 h-32 rounded-xl object-cover border border-white/10 shadow-sm" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-2xl text-[#fbbf24]">{item.product?.name}</h3>
                      {item.product?.colors ? (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {item.product.colors.split(',').map((c, idx) => {
                            const trimmedColor = c.trim();
                            const isSelected = item.color === trimmedColor;
                            return (
                              <button 
                                key={`${item.productId}-${trimmedColor}-${idx}`}
                                className={`text-xs font-bold py-2 px-4 rounded-lg transition-colors ${
                                  isSelected 
                                    ? 'bg-[#fbbf24] text-[#064e3b]' 
                                    : 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 hover:bg-[#fbbf24]/20'
                                }`}
                                onClick={() => {
                                  updateCartColor(item.productId, item.color, trimmedColor);
                                }}
                              >
                                {trimmedColor}
                              </button>
                            );
                          })}
                        </div>
                      ) : item.color && (
                        <div className="mt-2">
                          <span className="inline-block border border-[#fbbf24]/30 text-[#fbbf24] font-bold py-1 px-3 rounded-lg text-xs bg-[#fbbf24]/10">
                            Color: {item.color}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                         <Button variant="outline" size="lg" onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.color)} className="text-[#fbbf24] font-bold text-lg px-4">-</Button>
                         <span className="text-[#fbbf24] font-bold text-xl">{item.quantity}</span>
                         <Button variant="outline" size="lg" onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.color)} className="text-[#fbbf24] font-bold text-lg px-4">+</Button>
                      </div>
                      <p className="font-serif font-bold text-[#fbbf24] text-xl mt-3">৳{item.product?.price}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.productId, item.color)} className="hover:bg-red-500/10 text-red-500">
                      <Trash2 className="w-6 h-6" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="border-none shadow-2xl rounded-2xl bg-[#064e3b] text-[#fbbf24]">
                <CardHeader>
                  <CardTitle className="hidden">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
                    <Label className="text-sm uppercase tracking-wider font-bold text-[#fbbf24]/70">Delivery Location</Label>
                    <div className="grid grid-cols-1 gap-2">
                       {[
                         { id: 'inside', label: '📍 Inside Dhaka', price: 80 },
                         { id: 'suburban', label: '📍 Dhaka Suburban', price: 100 },
                         { id: 'outside', label: '📍 Outside Dhaka', price: 120 },
                       ].map((option) => (
                         <button
                           key={option.id}
                           type="button"
                           onClick={() => setDeliveryOption(option.id as any)}
                           className={`flex flex-row items-center justify-between p-7 rounded-2xl border transition-all ${
                             deliveryOption === option.id 
                               ? 'border-[#fbbf24] bg-[#fbbf24]/20' 
                               : 'border-[#fbbf24]/20 bg-white/5 hover:border-[#fbbf24]/50'
                           }`}
                         >
                           <span className="text-[#fbbf24] font-bold text-sm">{option.label}</span>
                           <span className="text-[#fbbf24] font-bold text-sm">{option.price}৳</span>
                         </button>
                       ))}
                     </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-[#fbbf24]/20">
                    <div className="flex justify-between text-[#fbbf24] text-base">
                      <span>Total Product Price:</span>
                      <span className="font-bold">{total.toFixed(2)}৳</span>
                    </div>
                    <div className="flex justify-between text-[#fbbf24] text-base">
                      <span>Total Quantity:</span>
                      <span className="font-bold">{totalQuantity}</span>
                    </div>
                    <div className="flex justify-between text-[#fbbf24] text-base">
                      <span>Delivery Charge:</span>
                      <span className="font-bold">{deliveryCharge}৳</span>
                    </div>
                    <div className="flex justify-between text-[#fbbf24] text-base">
                      <span>Discount:</span>
                      <span className={`font-bold ${appliedDiscount > 0 ? 'text-red-500' : ''}`}>
                        {appliedDiscount > 0 ? `-${appliedDiscount}৳` : '0৳'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t-2 border-[#fbbf24]/30">
                      <span className="text-xl font-serif font-bold text-[#fbbf24]">Final Amount</span>
                      <span className="text-2xl font-serif font-bold text-[#fbbf24]">৳{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#fbbf24]/20">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          toast.error(t('please_login_checkout'));
                          login();
                          return;
                        }
                        navigate('/delivery', { state: { total, deliveryOption, deliveryCharge, selectedCartItems, finalTotal } });
                      }}
                      className="w-full bg-[#fbbf24] text-[#064e3b] hover:bg-[#fcd34d] py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(251,191,36,0.3)] transition-all"
                    >
                      Continue To Checkout ⟶
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 bg-[#064e3b]/20 rounded-3xl border border-[#fbbf24]/10 shadow-sm">
            <ShoppingBag className="w-20 h-20 text-[#fbbf24]/10 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-bold text-[#fbbf24]">{t('selection_empty')}</h3>
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
