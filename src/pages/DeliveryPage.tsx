import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ChevronDown, CheckCircle2, MessageSquare, Instagram, Facebook } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';
import { useCart } from '../hooks/useCart';
import { motion, AnimatePresence } from 'motion/react';

export default function DeliveryPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { clearCart } = useCart();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [address, setAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const divisions = [
    'Dhaka (ঢাকা)', 
    'Chattogram (চট্টগ্রাম)', 
    'Rajshahi (রাজশাহী)', 
    'Khulna (খুলনা)', 
    'Barishal (বরিশাল)', 
    'Sylhet (সিলেট)', 
    'Rangpur (রংপুর)', 
    'Mymensingh (ময়মনসিংহ)'
  ];

  const { total, deliveryOption: initialDeliveryOption, deliveryCharge: initialDeliveryCharge, selectedCartItems, finalTotal: initialFinalTotal } = state || {};

  const [localDeliveryOption, setLocalDeliveryOption] = useState(initialDeliveryOption || 'inside');
  const [localDeliveryCharge, setLocalDeliveryCharge] = useState(initialDeliveryCharge || 80);

  if (!state) {
    // Redirect if no state
    navigate('/cart');
    return null;
  }

  const nonFlashTotal = selectedCartItems?.filter((item: any) => !String(item.productId).startsWith('flashsale-')).reduce((sum: number, item: any) => sum + (item.product?.price || 0) * item.quantity, 0) || 0;
  const appliedDiscount = nonFlashTotal > 500 ? 50 : 0;
  const localFinalTotal = Math.max(0, total + localDeliveryCharge - appliedDiscount);

  const handleConfirmOrder = async () => {
    if (!user) return;
    if (!name || !phone || !division || !district || !upazila || !address) {
      toast.error('অনুগ্রহ করে সব প্রয়োজনীয় তথ্য প্রদান করুন');
      return;
    }
    
    setIsProcessing(true);
    try {
      const orderData = {
        userId: user.uid,
        userName: name,
        userEmail: user.email || '',
        items: selectedCartItems.map((item: any) => ({
          productId: item.productId,
          name: item.product?.name || 'Unknown',
          price: Number(item.product?.price) || 0,
          quantity: Number(item.quantity) || 1,
          color: item.color || 'Default',
          image: item.product?.image || ''
        })),
        total: Number(localFinalTotal) || 0,
        deliveryOption: localDeliveryOption,
        deliveryCharge: Number(localDeliveryCharge) || 0,
        status: 'pending',
        deliveryInfo: {
          name,
          phone,
          phone2: phone2 || 'N/A',
          division,
          district,
          upazila,
          address,
          orderNote: orderNote || 'N/A'
        },
        createdAt: Date.now()
      };

      console.log('Validating orderData types:', {
        isUserIdString: typeof orderData.userId === 'string',
        itemsSize: orderData.items.length,
        totalType: typeof orderData.total,
        totalValue: orderData.total
      });

      console.log('Adding order with data:', orderData);
      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      toast.error('অর্ডার কনফার্ম করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 text-foreground flex flex-col items-center justify-center py-12">
      <Link to="/" className="flex flex-col items-center mb-8 hover:opacity-90 transition-opacity">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden border-[3px] border-[#fbbf24] shadow-[0_0_30px_rgba(251,191,36,0.3)] bg-[#022c22] flex items-center justify-center p-2 mb-4">
          <img 
            src="https://i.ibb.co.com/TDG0LTVh/logo.png" 
            alt="Product'S World" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-black gold-text tracking-tighter text-center">
          Product'S World
        </h1>
      </Link>

      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="w-full bg-[#064e3b] text-[#fbbf24] p-6 md:p-10 rounded-3xl border border-[#fbbf24]/20 shadow-2xl backdrop-blur-xl">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm md:text-base font-bold tracking-[0.05em] text-[#fbbf24] mb-2">📌 এক্সচেঞ্জ পলিসি:</h3>
              <ul className="text-sm md:text-base text-white/80 space-y-1.5 leading-relaxed">
                <li>1️⃣ প্রোডাক্ট হাতে পাওয়ার সময় অবশ্যই Unboxing Video করতে হবে।</li>
                <li>2️⃣ যদি কোনো সমস্যা থাকে, তাহলে সেই Unboxing Video সহ আমাদের জানাতে হবে।</li>
                <li>3️⃣ ভিডিও ছাড়া কোনো ধরনের ক্লেইম গ্রহণযোগ্য হবে না।</li>
                <li>4️⃣ সমস্যার প্রমাণ নিশ্চিত হওয়ার পর, সর্বোচ্চ ৭ দিনের মধ্যে প্রোডাক্ট এক্সচেঞ্জ করে দেওয়া হবে।</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm md:text-base font-bold tracking-[0.05em] text-[#fbbf24] mb-2">🚚 এক্সচেঞ্জ প্রসেস:</h3>
              <ul className="text-sm md:text-base text-white/80 space-y-1.5 leading-relaxed">
                <li>✅ আমরা ডেলিভারি ম্যানের মাধ্যমে নতুন প্রোডাক্ট পাঠিয়ে দেব।</li>
                <li>✅ কাস্টোমারকে নষ্ট/সমস্যাযুক্ত প্রোডাক্টটি ভালোভাবে প্যাকেজিং করে ডেলিভারি ম্যানের কাছে হস্তান্তর করতে হবে।</li>
                <li>✅ পণ্যে কোনো সমস্যা হলে সেটি এক্সচেঞ্জ করার ক্ষেত্রে এক্সচেঞ্জ ফি ও ডেলিভারি চার্জের সম্পূর্ণ দায়িত্ব Product's World বহন করবে।</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm md:text-base font-bold tracking-[0.05em] text-[#fbbf24] mb-2">⚠️ নোটিশ</h3>
              <ul className="text-sm md:text-base text-white/80 space-y-1.5 leading-relaxed">
                <li>C Grade প্রোডাক্টের ক্ষেত্রে কোনো এক্সচেঞ্জ, রিটার্ন বা অভিযোগ গ্রহণযোগ্য হবে না।</li>
                <li>📍আমাদের শর্তাবলী মেনে ক্রয় করার জন্য অনুরোধ করা হলো।</li>
                <li>🤝 আপনাদের সহযোগিতার জন্য ধন্যবাদ। আমরা সবসময় চেষ্টা করি আপনাদেরকে ঝামেলামুক্ত সেরা সার্ভিস দিতে। ❤️</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="w-full bg-[#064e3b] text-[#fbbf24] p-6 md:p-10 rounded-3xl border border-[#fbbf24]/20 shadow-2xl backdrop-blur-xl">
          <CardHeader className="px-0 pt-0">
          <div className="flex flex-col gap-4 mb-6">
             <Link to="/cart" className="inline-flex items-center gap-2 text-[#fbbf24] hover:text-[#fbbf24]/80 uppercase tracking-widest text-xs font-black transition-colors">
                <ArrowLeft className="w-4 h-4" /> Return To Cart
             </Link>
             <div className="h-px w-12 bg-[#fbbf24]"></div>
             <CardTitle className="text-3xl md:text-4xl font-serif font-bold text-[#fbbf24] tracking-tight">Delivery Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 space-y-8">
          {/* Row 1: Name and Phones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[#fbbf24] font-bold text-sm mb-2 block">আপনার নাম *</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="bg-white/5 border border-[#fbbf24]/30 text-[#fbbf24] focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] rounded-xl h-12 transition-all placeholder:text-[#fbbf24]/30 font-medium" 
                placeholder="আপনার নাম লিখুন" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#fbbf24] font-bold text-sm mb-2 block">মোবাইল নাম্বার *</Label>
              <Input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="bg-white/5 border border-[#fbbf24]/30 text-[#fbbf24] focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] rounded-xl h-12 transition-all placeholder:text-[#fbbf24]/30 font-medium" 
                placeholder="০১XXXXXXXXX" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#fbbf24] font-bold text-sm mb-2 block">মোবাইল নাম্বার ২ (ঐচ্ছিক)</Label>
              <Input 
                value={phone2} 
                onChange={e => setPhone2(e.target.value)} 
                className="bg-white/5 border border-[#fbbf24]/30 text-[#fbbf24] focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] rounded-xl h-12 transition-all placeholder:text-[#fbbf24]/30 font-medium" 
                placeholder="বিকল্প নাম্বার" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Division Dropdown */}
            <div className="space-y-2">
              <Label className="text-[#fbbf24] font-bold text-sm mb-2 block">বিভাগ *</Label>
              <div className="relative">
                <select 
                  value={division}
                  onChange={e => setDivision(e.target.value)}
                  className="w-full bg-white/5 border border-[#fbbf24]/30 text-[#fbbf24] focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] rounded-xl h-12 px-4 appearance-none outline-none cursor-pointer transition-all hover:bg-white/10 font-medium"
                >
                  <option value="" className="bg-[#064e3b]">বিভাগ নির্বাচন করুন</option>
                  {divisions.map(div => (
                    <option key={div} value={div} className="bg-[#064e3b]">{div}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fbbf24]/50 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#fbbf24] font-bold text-sm mb-2 block">জেলা *</Label>
              <Input 
                value={district} 
                onChange={e => setDistrict(e.target.value)} 
                className="bg-white/5 border border-[#fbbf24]/30 text-[#fbbf24] focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] rounded-xl h-12 transition-all placeholder:text-[#fbbf24]/30 font-medium" 
                placeholder="আপনার জেলা" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#fbbf24] font-bold text-sm mb-2 block">থানা / উপজেলা *</Label>
              <Input 
                value={upazila} 
                onChange={e => setUpazila(e.target.value)} 
                className="bg-white/5 border border-[#fbbf24]/30 text-[#fbbf24] focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] rounded-xl h-12 transition-all placeholder:text-[#fbbf24]/30 font-medium" 
                placeholder="আপনার থানা / উপজেলা" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <Label className="text-[#fbbf24] font-bold text-sm mb-2 block">সম্পূর্ণ ঠিকানা *</Label>
              <Input 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                className="bg-white/5 border border-[#fbbf24]/30 text-[#fbbf24] focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] rounded-xl h-12 transition-all placeholder:text-[#fbbf24]/30 font-medium" 
                placeholder="বাসা নাম্বার/রোড/এলাকা লিখুন" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#fbbf24] font-bold text-sm mb-2 block">অর্ডার নোট (Optional)</Label>
              <Input 
                value={orderNote} 
                onChange={e => setOrderNote(e.target.value)} 
                className="bg-white/5 border border-[#fbbf24]/30 text-[#fbbf24] focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] rounded-xl h-12 transition-all placeholder:text-[#fbbf24]/30 font-medium" 
                placeholder="অতিরিক্ত কোনো তথ্য থাকলে..." 
              />
            </div>
          </div>

          <div className="pt-8 space-y-4 border-t border-[#fbbf24]/10">
            <Label className="text-[#fbbf24] font-bold text-sm block">Delivery Location</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'inside', label: 'Inside Dhaka', price: 80 },
                { id: 'suburban', label: 'Dhaka Suburban', price: 100 },
                { id: 'outside', label: 'Outside Dhaka', price: 120 },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setLocalDeliveryOption(option.id);
                    setLocalDeliveryCharge(option.price);
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    localDeliveryOption === option.id 
                      ? 'border-[#fbbf24] bg-[#fbbf24]/20 scale-105' 
                      : 'border-[#fbbf24]/20 bg-white/5 hover:border-[#fbbf24]/50'
                  }`}
                >
                  <span className="text-[#fbbf24] font-bold text-sm mb-1">{option.label}</span>
                  <span className="text-[#fbbf24] text-xs">৳ {option.price}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t border-[#fbbf24]/10 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-[#fbbf24] opacity-70 font-bold text-lg">Product Price</span>
              <span className="font-bold text-[#fbbf24] text-lg"><span className="text-[#fbbf24] mr-0.5">৳</span>{total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#fbbf24] opacity-70 font-bold text-lg">Delivery Charge</span>
              <span className="font-bold text-[#fbbf24] text-lg"><span className="text-[#fbbf24] mr-0.5">৳</span>{localDeliveryCharge}</span>
            </div>
            {(total > 500) && (
              <div className="flex justify-between items-center">
                <span className="text-[#fbbf24] opacity-70 font-bold text-lg">Discount Applied</span>
                <span className="font-bold text-green-400 text-lg">- <span className="text-green-400 mr-0.5">৳</span>50</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-4">
              <span className="text-[#fbbf24] text-sm font-bold opacity-90 uppercase tracking-widest">Total Payable</span>
              <span className="text-5xl font-serif font-black gold-text"><span className="font-serif">৳</span> {localFinalTotal}</span>
            </div>
            <Button 
              onClick={handleConfirmOrder} 
              disabled={isProcessing || !name || !phone || !division || !district || !upazila || !address} 
              className="w-full bg-[#fbbf24] text-[#064e3b] hover:bg-[#fcd34d] py-9 text-xl font-black uppercase tracking-widest rounded-3xl shadow-[0_20px_60px_rgba(251,191,36,0.3)] transition-all transform hover:-translate-y-2 active:scale-95 border-b-4 border-[#d97706]"
            >
              {isProcessing ? 'Processing Order...' : 'Confirm Order ⟶'}
            </Button>
          </div>


        </CardContent>
      </Card>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#022c22]/90 backdrop-blur-sm"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/orders');
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#064e3b] border border-[#fbbf24]/30 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(251,191,36,0.2)] text-center overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#fbbf24]/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#fbbf24]/5 rounded-full blur-3xl" />
              
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#fbbf24] blur-2xl opacity-20 animate-pulse" />
                  <div className="w-24 h-24 rounded-full bg-[#fbbf24] flex items-center justify-center text-[#064e3b] shadow-2xl relative z-10">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-serif font-black gold-text mb-4">ধন্যবাদ 💚✨</h2>
              <div className="space-y-6 text-[#fbbf24]/95">
                <p className="text-xl md:text-2xl font-bold leading-tight">আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! 💚✨</p>
                <p className="text-lg font-medium opacity-80">Products World-এর সাথে থাকার জন্য ধন্যবাদ 💚✨</p>
                
                <div className="h-px w-20 bg-[#fbbf24]/20 mx-auto" />
                
                <div className="space-y-4 text-sm md:text-base leading-relaxed text-[#fbbf24]/80">
                  <p>
                    👉 আমাদের পেজটি ফলো করে পাশে থাকুন—কারণ আমরা নিয়মিত <span className="font-black text-[#fbbf24]">লাকি উইনার, এক্সক্লুসিভ অফার এবং সারপ্রাইজ গিফট</span> দিয়ে থাকি। হয়তো পরবর্তী লাকি উইনারটি আপনিই! 🎁
                  </p>
                  <p>কোনো প্রশ্ন থাকলে নির্দ্বিধায় আমাদের ইনবক্সে জানাবেন। 💚✨</p>
                  <p className="font-serif italic text-lg text-[#fbbf24] mt-6">"আপনার হাসিই আমাদের সবচেয়ে বড় অর্জন" 💖</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <a href="https://www.facebook.com/productsworld26" target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button type="button" variant="outline" className="w-full border-[#fbbf24]/20 text-[#fbbf24] hover:bg-[#fbbf24]/10 rounded-2xl h-14 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                      <Facebook className="w-4 h-4" /> Facebook
                    </Button>
                  </a>
                  <a href="https://www.instagram.com/products_world2703" target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button type="button" variant="outline" className="w-full border-[#fbbf24]/20 text-[#fbbf24] hover:bg-[#fbbf24]/10 rounded-2xl h-14 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                      <Instagram className="w-4 h-4" /> Instagram
                    </Button>
                  </a>
                </div>

                <Button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/orders');
                  }}
                  className="w-full bg-[#fbbf24] text-[#064e3b] hover:bg-[#fcd34d] h-16 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-4"
                >
                  View My Orders
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
