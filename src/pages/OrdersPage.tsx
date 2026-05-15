import { useOrders } from '../hooks/useOrders';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowLeft, Clock, LogIn, CheckCircle2, Truck, Box, XCircle, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const OrderTrackingTimeline = ({ status }: { status: string }) => {
  const { t } = useLanguage();
  
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 text-rose-500 py-6">
        <XCircle className="w-8 h-8" />
        <div>
          <h4 className="font-bold uppercase tracking-widest text-sm">{t('order_cancelled') || 'Order Cancelled'}</h4>
          <p className="text-xs opacity-70">This order was cancelled and will not be delivered.</p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'pending', icon: Clock, label: t('pending') || 'Pending' },
    { id: 'processing', icon: Box, label: t('processing') || 'Processing' },
    { id: 'shipped', icon: Truck, label: t('shipped') || 'Shipped' },
    { id: 'ready_for_delivery', icon: MapPin, label: t('ready_for_delivery') || 'Ready for Delivery' },
    { id: 'delivered', icon: CheckCircle2, label: t('delivered') || 'Delivered' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === status);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="py-6 mt-4 border-t border-white/10">
      <h4 className="text-[10px] uppercase tracking-widest text-[#fbbf24]/40 font-black mb-6">Order Status</h4>
      <div className="relative flex justify-between items-center w-full">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#022c22] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#fbbf24] transition-all duration-500 ease-in-out" 
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
        
        {steps.map((step, index) => {
          const isActive = index <= activeIndex;
          const isCurrent = index === activeIndex;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#fbbf24] text-[#064e3b] shadow-[0_0_15px_rgba(251,191,36,0.4)]' 
                    : 'bg-[#022c22] border-2 border-[#fbbf24]/20 text-[#fbbf24]/40'
                } ${isCurrent ? 'scale-110 ring-4 ring-[#fbbf24]/20' : ''}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-50'}`} />
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold hidden sm:block ${
                isActive ? 'text-[#fbbf24]' : 'text-[#fbbf24]/40'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function OrdersPage() {
  const { orders, loading } = useOrders();
  const { t } = useLanguage();
  const { user, login } = useAuth();
  const navigate = useNavigate();

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
          <h1 className="text-4xl font-serif font-bold text-[#fbbf24]">{t('your_acquisitions')}</h1>
        </div>

        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[#fbbf24] hover:text-[#fbbf24]/80 mb-8 uppercase tracking-widest text-[10px] font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        {!user ? (
          <div className="text-center py-32 bg-[#064e3b]/20 rounded-3xl border border-[#fbbf24]/10 shadow-sm">
            <LogIn className="w-20 h-20 text-[#fbbf24]/10 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-bold text-[#fbbf24]">{t('please_login_orders')}</h3>
            <p className="text-[#fbbf24]/40 font-light mb-10">Sign in to see your premium selection history.</p>
            <Button 
              onClick={login}
              className="bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 px-12 py-6 rounded-xl font-bold uppercase tracking-widest text-xs gap-2 shadow-lg shadow-[#fbbf24]/20"
            >
              <LogIn className="w-4 h-4" />
              {t('login')}
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-[#064e3b]/20 animate-pulse rounded-2xl border border-[#fbbf24]/5"></div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-8">
            {orders.map(order => (
              <Card key={order.id} className="overflow-hidden border-none shadow-xl rounded-2xl bg-[#064e3b]/30 backdrop-blur-md border border-[#fbbf24]/10">
                <CardHeader className="bg-[#064e3b] text-[#fbbf24] p-6 flex flex-row justify-between items-center">

                  <Badge className={`text-[10px] uppercase tracking-widest px-4 py-1 rounded-full ${
                    order.status === 'delivered' ? 'bg-[#fbbf24] text-black' : 
                    order.status === 'pending' ? 'bg-white/10 text-[#fbbf24] border border-[#fbbf24]/30' : 'bg-white/5 text-[#fbbf24]/40'
                  }`}>
                    {t(order.status)}
                  </Badge>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-6">
                        <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-sm" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <p className="font-serif font-bold text-lg text-[#fbbf24]">{item.name}</p>
                          <p className="text-xs text-[#fbbf24]/40 uppercase tracking-widest">{t('quantity')}: {item.quantity} × ৳{item.price}</p>
                        </div>
                        <p className="font-serif font-bold text-xl text-[#fbbf24]">৳{item.quantity * item.price}</p>
                      </div>
                    ))}
                    <div className="pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 text-[#fbbf24]/70">
                          <Package className="w-4 h-4 mt-1 shrink-0" />
                          <div className="text-xs leading-relaxed">
                            <p className="text-[10px] uppercase tracking-widest font-black mb-1 opacity-50">Delivery Address</p>
                            {order.deliveryInfo ? (
                              <>
                                <p className="font-bold text-[#fbbf24] text-sm mb-1">{order.deliveryInfo.name}</p>
                                <p>{order.deliveryInfo.address}</p>
                                <p className="text-[10px] font-bold mt-1 inline-block px-2 py-0.5 bg-[#fbbf24]/10 rounded border border-[#fbbf24]/20">
                                  {order.deliveryInfo.division}
                                </p>
                              </>
                            ) : (
                              <p>{order.address}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[#fbbf24]/70">
                          <Clock className="w-4 h-4 shrink-0" />
                          <div className="text-xs">
                             <p className="text-[10px] uppercase tracking-widest font-black mb-1 opacity-50">Ordered On</p>
                             <p>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(order.createdAt)).toUpperCase()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:items-end gap-6">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] uppercase tracking-widest text-[#fbbf24]/40 font-black mb-1">Contact Info</p>
                          <p className="text-lg font-bold">
                            {order.deliveryInfo ? (
                              <>
                                {order.deliveryInfo.phone}
                                {order.deliveryInfo.phone2 && order.deliveryInfo.phone2 !== 'N/A' && (
                                  <span className="text-sm font-normal opacity-60 block">{order.deliveryInfo.phone2}</span>
                                )}
                              </>
                            ) : (
                              order.phone
                            )}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-[10px] uppercase tracking-widest text-[#fbbf24]/40 font-black mb-1">{t('total_investment')}</p>
                          <p className="text-4xl font-serif font-black text-[#fbbf24]">৳{order.total}</p>
                        </div>
                      </div>
                    </div>
                    
                    <OrderTrackingTimeline status={order.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-[#064e3b]/20 rounded-3xl border border-[#fbbf24]/10 shadow-sm">
            <Package className="w-20 h-20 text-[#fbbf24]/10 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-bold text-[#fbbf24]">{t('no_acquisitions')}</h3>
            <p className="text-[#fbbf24]/40 font-light">{t('explore_extraordinary')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
