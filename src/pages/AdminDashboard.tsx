import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useSlideshow } from '@/hooks/useSlideshow';
import { useFlashSale, FlashSale } from '@/hooks/useFlashSale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Package, ShoppingBag, Trash2, LayoutDashboard, TrendingUp, Clock, CheckCircle2, Upload, ImagePlus, ListFilter, X, Edit, ArrowUp, ArrowDown, Timer } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isQuotaError } from '@/lib/firebase';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES } from '@/constants/categories';

const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 0.6 quality for aggressive compression to ensure we don't hit 1MB limit with multiple images
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { orders, loading: ordersLoading } = useOrders();
  const { images: slideshowImages, loading: slideshowLoading } = useSlideshow();
  const { flashSales, loading: flashSaleLoading } = useFlashSale();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'slideshow' | 'flash_sale'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [newSlideshowUrl, setNewSlideshowUrl] = useState('');
  const [isPostingSlideshow, setIsPostingSlideshow] = useState(false);
  const [editingSlideshowId, setEditingSlideshowId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [newProduct, setNewProduct] = useState<any>({
    name: '',
    description: '',
    price: '',
    image: '',
    images: [],
    category: 'other',
    quantity: 1,
    inStock: true,
    colors: '',
    deliveryInsideDhaka: '1-2 days',
    deliveryOutsideDhaka: '2-3 days'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  const [flashSaleForm, setFlashSaleForm] = useState<Partial<FlashSale>>({
    bannerUrls: [],
    linkUrl: '',
    description: '',
    price: 0,
    isActive: false,
    endTime: Date.now() + 24 * 60 * 60 * 1000 // default 24h logic
  });
  const [isPostingFlashSale, setIsPostingFlashSale] = useState(false);
  const [editingFlashSaleId, setEditingFlashSaleId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="w-8 h-8 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center p-8 bg-[#064e3b]/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#fbbf24]/20">
          <h1 className="text-4xl font-serif font-bold text-rose-500 mb-4">Access Denied</h1>
          <p className="text-[#fbbf24]/60 mb-6">You do not have administrative privileges to access this area.</p>
          <Link to="/">
            <Button className="bg-[#fbbf24] text-[#064e3b] hover:bg-[#fbbf24]/90 rounded-full px-8 font-bold uppercase tracking-widest text-xs">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isQuotaExceeded = localStorage.getItem('firestore_quota_exceeded') === 'true';

      if (isEditing && currentProductId) {
        if (isQuotaExceeded) {
           const saved = localStorage.getItem('fallback_products');
           if (saved) {
             let products = JSON.parse(saved);
             products = products.map((p: any) => p.id === currentProductId ? { ...p, ...newProduct, price: Number(newProduct.price) || 0 } : p);
             localStorage.setItem('fallback_products', JSON.stringify(products));
             window.dispatchEvent(new Event('fallback_products_updated'));
           }
           toast.success('Collection updated (Local Storage)');
        } else {
          await updateDoc(doc(db, 'products', currentProductId), {
            ...newProduct,
            price: Number(newProduct.price) || 0,
            updatedAt: Date.now()
          });
          toast.success('Collection updated successfully');
        }
      } else {
        if (isQuotaExceeded) {
           const saved = localStorage.getItem('fallback_products');
           if (saved) {
             let products = JSON.parse(saved);
             products.unshift({ id: Date.now().toString(), ...newProduct, price: Number(newProduct.price) || 0, createdAt: Date.now() });
             localStorage.setItem('fallback_products', JSON.stringify(products));
             window.dispatchEvent(new Event('fallback_products_updated'));
           }
           toast.success('New product added (Local Storage)');
        } else {
          await addDoc(collection(db, 'products'), {
            ...newProduct,
            price: Number(newProduct.price) || 0,
            createdAt: Date.now()
          });
          toast.success('New masterpiece added to collection');
        }
      }
      resetForm();
    } catch (error: any) {
      if (isQuotaError(error)) {
        localStorage.setItem('firestore_quota_exceeded', 'true');
        toast.error('Quota exceeded. Please save again to store locally.');
      } else if (error.message?.includes('No document to update')) {
        // Known case: Edited a locally-created document that isn't in Firestore yet.
        localStorage.setItem('firestore_quota_exceeded', 'true');
        toast.error('Document not in DB. Please save again to store locally.');
      } else {
        toast.error(error.message || 'Failed to save product');
      }
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentProductId(null);
    setNewProduct({ 
      name: '', 
      description: '', 
      price: '', 
      image: '', 
      images: [],
      category: 'other',
      quantity: 1,
      inStock: true,
      colors: '',
      deliveryInsideDhaka: '1-2 days',
      deliveryOutsideDhaka: '2-3 days'
    });
  };

  const handleEditProduct = (product: any) => {
    setIsEditing(true);
    setCurrentProductId(product.id);
    setNewProduct({
      name: product.name,
      description: product.description || '',
      price: product.price,
      image: product.image,
      images: product.images || [],
      category: product.category || 'other',
      quantity: product.quantity || 1,
      inStock: product.inStock !== undefined ? product.inStock : true,
      colors: product.colors || '',
      deliveryInsideDhaka: product.deliveryInsideDhaka || '1-2 days',
      deliveryOutsideDhaka: product.deliveryOutsideDhaka || '2-3 days'
    });
    // Scroll to form smoothly
    const formElement = document.getElementById('management-form');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string) => {
    const toastId = toast.loading('Removing item...');
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Item removed successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to remove item', { id: toastId });
      handleFirestoreError(error, OperationType.DELETE, 'products');
    }
  };

  const handleUpdateStock = async (id: string, inStock: boolean) => {
    const toastId = toast.loading('Updating stock status...');
    try {
      await updateDoc(doc(db, 'products', id), { inStock });
      toast.success('Stock updated successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to update stock', { id: toastId });
      handleFirestoreError(error, OperationType.UPDATE, 'products');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      toast.success(`Order marked as ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'orders');
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    toast('Are you sure you want to delete this order?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          const toastId = toast.loading('Deleting order...');
          try {
            await deleteDoc(doc(db, 'orders', orderId));
            toast.success('Order deleted successfully', { id: toastId });
          } catch (error) {
            toast.error('Failed to delete order', { id: toastId });
            handleFirestoreError(error, OperationType.DELETE, 'orders');
          }
        },
      },
    });
  };

  const handleClearAllOrders = () => {
    if (orders.length === 0) return;
    
    toast('Clear ALL data from Order History?', {
      description: `This will permanently remove ${orders.length} order records.`,
      action: {
        label: 'Yes, Clear All',
        onClick: async () => {
          const toastId = toast.loading('Clearing history...');
          try {
            const deletePromises = orders.map(order => deleteDoc(doc(db, 'orders', order.id)));
            await Promise.all(deletePromises);
            toast.success('All history cleared successfully', { id: toastId });
          } catch (error) {
            toast.error('Failed to clear some orders', { id: toastId });
            handleFirestoreError(error, OperationType.DELETE, 'orders');
          }
        },
      },
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files as FileList).forEach(async (file: File) => {
      try {
        const compressedBase64 = await compressImage(file);
        setNewProduct((prev: any) => {
          const updatedImages = [...(prev.images || [])];
          if (!prev.image) {
            return { ...prev, image: compressedBase64, images: updatedImages };
          } else {
            return { ...prev, images: [...updatedImages, compressedBase64] };
          }
        });
        toast.success('Image uploaded to preview');
      } catch (error) {
        toast.error('Failed to compress image');
      }
    });
  };

  const calculateOrderTotal = (order: any) => {
    const totalQuantity = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
    if (totalQuantity > 5) {
      return {
        finalPrice: Math.max(0, order.total - 50),
        hasDiscount: true,
        discountAmount: 50
      };
    }
    return {
      finalPrice: order.total,
      hasDiscount: false,
      discountAmount: 0
    };
  };

  const handleAddSlideshowImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideshowUrl) return;
    setIsPostingSlideshow(true);
    try {
      if (editingSlideshowId) {
        await updateDoc(doc(db, 'slideshow', editingSlideshowId), {
          url: newSlideshowUrl,
          updatedAt: Date.now()
        });
        toast.success('Slideshow image updated');
        setEditingSlideshowId(null);
      } else {
        await addDoc(collection(db, 'slideshow'), {
          url: newSlideshowUrl,
          order: slideshowImages.length,
          createdAt: Date.now()
        });
        toast.success('Slideshow image added');
      }
      setNewSlideshowUrl('');
    } catch (error) {
      handleFirestoreError(error, editingSlideshowId ? OperationType.UPDATE : OperationType.CREATE, 'slideshow');
    } finally {
      setIsPostingSlideshow(false);
    }
  };

  const handleDeleteSlideshowImage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'slideshow', id));
      toast.success('Slideshow image removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'slideshow');
    }
  };

  const handleReorderSlideshow = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slideshowImages.length) return;
    
    setIsPostingSlideshow(true);
    try {
      const items = [...slideshowImages];
      const draggedItem = items[index];
      items.splice(index, 1);
      items.splice(newIndex, 0, draggedItem);
      
      await Promise.all(items.map((item, idx) => 
        updateDoc(doc(db, 'slideshow', item.id), { order: idx })
      ));
      toast.success('Slideshow reordered');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'slideshow');
    } finally {
      setIsPostingSlideshow(false);
    }
  };

  const handleSaveFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashSaleForm.bannerUrls?.length || !flashSaleForm.endTime) return;
    setIsPostingFlashSale(true);
    try {
      if (editingFlashSaleId) {
        await updateDoc(doc(db, 'flash_sale', editingFlashSaleId), flashSaleForm);
        toast.success('Flash sale updated');
        setEditingFlashSaleId(null);
      } else {
        await addDoc(collection(db, 'flash_sale'), flashSaleForm);
        toast.success('Flash sale added');
      }
      setFlashSaleForm({
        bannerUrls: [],
        linkUrl: '',
        description: '',
        price: 0,
        isActive: false,
        endTime: Date.now() + 24 * 60 * 60 * 1000
      });
    } catch (error) {
      handleFirestoreError(error, editingFlashSaleId ? OperationType.UPDATE : OperationType.CREATE, 'flash_sale');
    } finally {
      setIsPostingFlashSale(false);
    }
  };

  const handleDeleteFlashSale = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'flash_sale', id));
      toast.success('Flash sale removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'flash_sale');
    }
  };

  const handleToggleFlashSaleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'flash_sale', id), { isActive: !currentStatus });
      toast.success('Flash sale status updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'flash_sale');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="group relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#fbbf24] shadow-2xl bg-[#064e3b] flex items-center justify-center transition-transform group-hover:scale-105">
                <img 
                  src="https://i.ibb.co.com/TDG0LTVh/logo.png" 
                  alt="Product'S World" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </Link>
            <div>
              <h1 className="text-4xl font-serif font-black text-[#fbbf24] tracking-tight">Admin Panel</h1>
              <p className="text-[#fbbf24]/60 font-medium uppercase tracking-[0.2em] text-[10px] mt-1">Product'S World Administrative Suite</p>
            </div>
          </div>
          
          <div className="flex bg-[#064e3b]/40 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-[#fbbf24]/10 flex-wrap">
            <button 
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                activeTab === 'products' 
                ? "bg-[#fbbf24] text-[#064e3b] shadow-lg shadow-[#fbbf24]/20" 
                : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Product Section
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                activeTab === 'orders' 
                ? "bg-[#fbbf24] text-[#064e3b] shadow-lg shadow-[#fbbf24]/20" 
                : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Order Section
            </button>
            <button 
              onClick={() => setActiveTab('slideshow')}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                activeTab === 'slideshow' 
                ? "bg-[#fbbf24] text-[#064e3b] shadow-lg shadow-[#fbbf24]/20" 
                : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <ImagePlus className="w-4 h-4" />
              Slide Show Control
            </button>
            <button
              onClick={() => setActiveTab('flash_sale')}
              className={`flex-1 min-w-[120px] h-12 flex items-center justify-center gap-2 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all backdrop-blur-md ${
                activeTab === 'flash_sale' 
                ? "bg-[#fbbf24] text-[#064e3b] shadow-lg shadow-[#fbbf24]/20" 
                : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Timer className="w-4 h-4" />
              Flash Sale
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'products' ? (
            <motion.div 
              key="products"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Management Form */}
              <Card id="management-form" className="lg:col-span-1 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-[#064e3b]/30 backdrop-blur-xl border border-[#fbbf24]/10">
                <CardContent className="p-10 pt-12">
                  <div className="mb-10 border-b border-white/5 pb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-serif font-black text-[#fbbf24] uppercase tracking-tighter flex items-center gap-3">
                        <Package className="w-6 h-6 text-[#fbbf24]" />
                        Product Publish Info
                      </h2>
                      <p className="text-xs text-[#fbbf24]/40 font-bold uppercase tracking-[0.3em] mt-2">
                        Dashboard Initialization
                      </p>
                    </div>
                    {isEditing && (
                      <Button 
                        variant="ghost" 
                        onClick={resetForm}
                        className="text-xs font-black text-rose-500 hover:bg-rose-500/10 rounded-xl px-4 uppercase tracking-widest border border-rose-500/20"
                      >
                        Reset
                      </Button>
                    )}
                  </div>

                  <form onSubmit={handleAddProduct} className="space-y-8">
                    {/* Section: Identity */}
                    <div className="space-y-4">
                      {/* Image Upload Area */}
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Product Photos</Label>
                        <div className="relative group cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            onChange={handleImageUpload}
                            className="hidden" 
                            id="photo-upload"
                          />
                          <label 
                            htmlFor="photo-upload"
                            className="flex flex-col items-center justify-center w-full aspect-video rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#fbbf24] transition-all overflow-hidden group relative"
                          >
                            {newProduct.image ? (
                              <>
                                <img 
                                  src={newProduct.image} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-[#064e3b]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-[#fbbf24] flex items-center justify-center text-[#064e3b] shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                      <ImagePlus className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold text-[#fbbf24] uppercase tracking-widest">Add more</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setNewProduct((prev: any) => {
                                      if (prev.images && prev.images.length > 0) {
                                        const newImages = [...prev.images];
                                        const nextMain = newImages.shift();
                                        return { ...prev, image: nextMain, images: newImages };
                                      }
                                      return { ...prev, image: '' };
                                    });
                                  }}
                                  className="absolute top-4 right-4 z-30 p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-white/10 rounded-2xl shadow-sm text-[#fbbf24]">
                                  <Upload className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold text-[#fbbf24]">Click to Upload Photos</p>
                                  <p className="text-[10px] uppercase tracking-widest text-[#fbbf24]/40 mt-1">PNG, JPG or WebP (Max 2MB)</p>
                                </div>
                              </div>
                            )}
                          </label>
                        </div>
                        {newProduct.images && newProduct.images.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto py-2">
                            {newProduct.images.map((img: string, idx: number) => (
                              <div key={idx} className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-white/10">
                                <img 
                                  src={img} 
                                  alt="" 
                                  className="w-full h-full object-cover cursor-zoom-in" 
                                  onClick={() => setZoomedImage(img)}
                                />
                                <button type="button" onClick={() => {
                                  setNewProduct((prev: any) => ({ ...prev, images: prev.images.filter((_: any, i: number) => i !== idx) }))
                                }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Product Name</Label>
                          <Input 
                            id="name" 
                            placeholder="e.g. Royal Heritage Chronograph"
                            value={newProduct.name}
                            onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                            required 
                            className="h-14 border-2 border-white/5 bg-white/5 focus-visible:ring-2 focus-visible:ring-[#fbbf24] rounded-2xl font-bold transition-all focus:bg-white/10 text-base text-[#fbbf24]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Collection Category</Label>
                          <select 
                            id="category"
                            value={newProduct.category}
                            onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                            className="w-full h-14 px-5 border-2 border-white/5 bg-white/5 focus:ring-2 focus:ring-[#fbbf24] focus:bg-white/10 rounded-2xl font-bold text-[#fbbf24] outline-none transition-all appearance-none"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat.id} value={cat.id} className="bg-[#022c22] text-[#fbbf24]">{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section: Valuation & Stock */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="price" className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Product Price</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif font-black text-[#fbbf24]/30 text-lg">৳</span>
                            <Input 
                              id="price" 
                              type="number" 
                              placeholder="0.00"
                              value={newProduct.price} 
                              onChange={e => {
                                const val = e.target.value;
                                setNewProduct({...newProduct, price: val === '' ? '' : parseFloat(val)});
                              }} 
                              required 
                              className="h-14 pl-10 border-2 border-white/5 bg-white/5 focus-visible:ring-2 focus-visible:ring-[#fbbf24] rounded-2xl font-black font-serif text-xl text-[#fbbf24]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section: Marketing & Strategy */}
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="image" className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Exhibition Image URL (Optional if uploaded)</Label>
                          <Input 
                            id="image" 
                            placeholder="https://images.unsplash.com/..."
                            value={newProduct.image} 
                            onChange={e => setNewProduct({...newProduct, image: e.target.value})} 
                            className="h-14 border-2 border-white/5 bg-white/5 focus-visible:ring-2 focus-visible:ring-[#fbbf24] rounded-2xl font-medium transition-all focus:bg-white/10 text-base text-[#fbbf24]"
                          />
                        </div>
                        



                        <div className="space-y-2">
                          <Label htmlFor="desc" className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Product (Description)</Label>
                          <textarea 
                            id="desc" 
                            placeholder="Craft a compelling narrative for this workpiece..."
                            value={newProduct.description} 
                            onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
                            className="w-full min-h-[300px] p-5 rounded-3xl border-2 border-white/5 bg-white/5 focus:ring-2 focus:ring-[#fbbf24] focus:bg-white/10 text-[#fbbf24] font-medium text-sm resize-none transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section: Logistics & Availability */}
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border-2 border-white/5">
                          <div className="space-y-0.5">
                            <Label className="text-xs uppercase tracking-widest font-black text-[#fbbf24]">Available variant:</Label>
                            <p className="text-xs text-[#fbbf24]/40 font-bold uppercase tracking-widest">{newProduct.inStock ? 'In Stock' : 'Out of Stock'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewProduct({...newProduct, inStock: !newProduct.inStock})}
                            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${newProduct.inStock ? 'bg-[#fbbf24]' : 'bg-white/10'}`}
                          >
                            <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${newProduct.inStock ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Colour name box</Label>
                          <Input 
                            placeholder="e.g. Deep Sea Green, Midnight Black"
                            value={newProduct.colors}
                            onChange={e => setNewProduct({...newProduct, colors: e.target.value})}
                            className="h-14 border-2 border-white/5 bg-white/5 focus-visible:ring-2 focus-visible:ring-[#fbbf24] rounded-2xl font-medium text-base text-[#fbbf24]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Dhaka (Inside)</Label>
                            <Input 
                              placeholder="1-2 days"
                              value={newProduct.deliveryInsideDhaka}
                              onChange={e => setNewProduct({...newProduct, deliveryInsideDhaka: e.target.value})}
                              className="h-14 border-2 border-white/5 bg-white/5 focus-visible:ring-2 focus-visible:ring-[#fbbf24] rounded-2xl font-medium text-[#fbbf24]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Outside Dhaka</Label>
                            <Input 
                              placeholder="2-3 days"
                              value={newProduct.deliveryOutsideDhaka}
                              onChange={e => setNewProduct({...newProduct, deliveryOutsideDhaka: e.target.value})}
                              className="h-14 border-2 border-white/5 bg-white/5 focus-visible:ring-2 focus-visible:ring-[#fbbf24] rounded-2xl font-medium text-[#fbbf24]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className={`w-full h-16 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 ${
                      isEditing 
                      ? 'bg-[#fbbf24] text-[#064e3b] hover:bg-[#fbbf24]/90 shadow-[#fbbf24]/10' 
                      : 'bg-[#fbbf24] text-[#064e3b] hover:bg-[#fbbf24]/90 shadow-[#fbbf24]/10'
                    }`}>
                      Save
                    </Button>
                  </form>
                </CardContent>
              </Card>               {/* Products List */}
              <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-[#064e3b]/30 backdrop-blur-xl border border-[#fbbf24]/10">
                <CardHeader className="p-10 border-b border-white/5 flex flex-row items-center justify-between">
                  <CardTitle className="font-serif text-[#fbbf24] text-2xl tracking-tight">Product Section Ledger</CardTitle>
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-white/5 border-white/10 text-[#fbbf24] placeholder:text-[#fbbf24]/30 rounded-xl"
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-none">
                          <TableHead className="text-xs uppercase tracking-widest font-black h-16 px-10 text-[#fbbf24]/60">Product</TableHead>
                          <TableHead className="text-xs uppercase tracking-widest font-black h-16 text-[#fbbf24]/60">Category</TableHead>
                          <TableHead className="text-xs uppercase tracking-widest font-black h-16 text-[#fbbf24]/60">Stock</TableHead>
                          <TableHead className="text-xs uppercase tracking-widest font-black h-16 text-[#fbbf24]/60">Valuation</TableHead>
                          <TableHead className="text-xs uppercase tracking-widest font-black h-16 px-10 text-right text-[#fbbf24]/60">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredProducts.map((product, idx) => (
                            <motion.tr
                              key={product.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="border-b border-white/5 hover:bg-white/5 transition-all group"
                            >
                              <TableCell className="px-10 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-sm group-hover:scale-105 transition-transform">
                                    <img 
                                      src={product.image} 
                                      alt="" 
                                      className="w-full h-full object-cover cursor-zoom-in" 
                                      referrerPolicy="no-referrer" 
                                      onClick={() => setZoomedImage(product.image)}
                                    />
                                  </div>
                                  <div>
                                    <span className="font-serif font-black text-[#fbbf24] text-sm block tracking-tight">{product.name}</span>
                                    <span className="text-[9px] text-[#fbbf24]/40 font-bold uppercase tracking-widest">#{product.id.slice(0, 6)}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-[#fbbf24]/20 text-[#fbbf24]/60">
                                  {product.category || 'Other'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <select
                                  value={product.inStock !== false ? "true" : "false"}
                                  onChange={(e) => handleUpdateStock(product.id, e.target.value === "true")}
                                  className={`bg-transparent outline-none cursor-pointer text-[11px] font-black uppercase tracking-widest ${product.inStock !== false ? 'text-emerald-400' : 'text-rose-500'}`}
                                >
                                  <option className="bg-[#022c22] text-emerald-400" value="true">In Stock</option>
                                  <option className="bg-[#022c22] text-rose-500" value="false">Out of Stock</option>
                                </select>
                              </TableCell>
                              <TableCell className="font-serif font-black text-base text-[#fbbf24]">
                                ৳{product.price.toLocaleString()}
                              </TableCell>
                              <TableCell className="px-10 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleEditProduct(product)} 
                                    className="w-9 h-9 rounded-lg hover:bg-[#fbbf24]/10 hover:text-[#fbbf24] transition-colors text-[#fbbf24]/40"
                                  >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDeleteProduct(product.id)} 
                                    className="w-10 h-10 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-95 text-[#fbbf24]/40"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : activeTab === 'orders' ? (
            /* Orders Tab */
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#064e3b]/30 p-8 rounded-[2rem] border border-[#fbbf24]/10 backdrop-blur-xl shadow-2xl">
                <div>
                  <h2 className="text-3xl font-serif font-black text-[#fbbf24] tracking-tight">Order History</h2>
                  <p className="text-[#fbbf24]/40 text-xs uppercase tracking-[0.3em] font-bold mt-2">Fulfillment & Logistics Hub</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleClearAllOrders}
                    disabled={orders.length === 0}
                    variant="outline"
                    className="hidden sm:flex border-rose-500/30 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-black text-[10px] uppercase tracking-widest px-6 py-2 rounded-xl transition-all"
                  >
                    Clear All History
                  </Button>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase tracking-widest text-[#fbbf24]/40 font-black">Active Pipeline</p>
                    <p className="text-2xl font-serif font-black text-[#fbbf24]">{orders.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#fbbf24]/10 rounded-2xl flex items-center justify-center border border-[#fbbf24]/20 shadow-inner">
                    <ShoppingBag className="w-6 h-6 text-[#fbbf24]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                  {orders.map((order, idx) => {
                    const { finalPrice, hasDiscount, discountAmount } = calculateOrderTotal(order);
                    const delivery = order.deliveryInfo || {};
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative overflow-hidden bg-[#064e3b]/20 hover:bg-[#064e3b]/40 backdrop-blur-lg border border-white/5 hover:border-[#fbbf24]/30 rounded-[2.5rem] p-8 transition-all shadow-xl"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-white/5 pb-8">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-serif font-black text-[#fbbf24] shadow-inner text-xl overflow-hidden shrink-0">
                              {order.items && order.items[0] ? (
                                <img 
                                  src={order.items[0].image} 
                                  alt="" 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                order.userName.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-serif font-black text-[#fbbf24] tracking-tight">{delivery.name || order.userName}</h3>
                                <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-none ${
                                  order.status === 'delivered' ? 'bg-emerald-500 text-white' : 
                                  order.status === 'pending' ? 'bg-[#fbbf24] text-[#064e3b]' : 'bg-white/10 text-white/40'
                                }`}>
                                  {order.status}
                                </Badge>
                              </div>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#fbbf24]/40 flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(order.createdAt)).toUpperCase()}
                                  <span className="opacity-30">|</span>
                                ID: #{order.id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="flex-1 lg:flex-none">
                              <select 
                                className="w-full lg:w-auto text-[10px] uppercase tracking-widest font-black border border-white/10 bg-white/5 text-[#fbbf24] rounded-xl px-5 py-3 focus:ring-2 focus:ring-[#fbbf24] outline-none transition-all cursor-pointer hover:bg-white/10"
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              >
                                <option value="pending" className="bg-[#064e3b]">Pending</option>
                                <option value="processing" className="bg-[#064e3b]">Processing</option>
                                <option value="shipped" className="bg-[#064e3b]">Shipped</option>
                                <option value="ready_for_delivery" className="bg-[#064e3b]">Ready for Delivery</option>
                                <option value="delivered" className="bg-[#064e3b]">Delivered</option>
                                <option value="cancelled" className="bg-[#064e3b]">Cancelled</option>
                              </select>
                            </div>
                            {order.status === 'pending' && (
                              <Button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                                className="flex-1 lg:flex-none bg-[#fbbf24] hover:bg-[#fbbf24]/90 text-[#064e3b] font-black text-[10px] uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-[#fbbf24]/10 transition-transform active:scale-95"
                              >
                                Confirm Order
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDeleteOrder(order.id)}
                              variant="ghost"
                              size="icon"
                              className="w-11 h-11 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all border border-rose-500/20"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>

                        {/* Order Body */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                          {/* Customer Details Grid */}
                          <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Name Box */}
                            <div className="p-5 rounded-3xl bg-[#fbbf24]/5 border border-[#fbbf24]/10 flex flex-col justify-center">
                              <span className="text-[10px] uppercase tracking-widest font-black text-[#fbbf24]/30 mb-2">Customer Name</span>
                              <span className="text-lg font-serif font-black text-[#fbbf24] leading-tight">{delivery.name || order.userName}</span>
                            </div>

                            {/* Main Number Box */}
                            <div className="p-5 rounded-3xl bg-[#fbbf24]/5 border border-[#fbbf24]/10 flex flex-col justify-center">
                              <span className="text-[10px] uppercase tracking-widest font-black text-[#fbbf24]/30 mb-2">Primary Contact</span>
                              <span className="text-xl font-black text-[#fbbf24] tabular-nums tracking-tighter">{delivery.phone || order.phone}</span>
                            </div>

                            {/* Alternative Number Box */}
                            <div className="p-5 rounded-3xl bg-[#fbbf24]/5 border border-[#fbbf24]/10 flex flex-col justify-center">
                              <span className="text-[10px] uppercase tracking-widest font-black text-[#fbbf24]/30 mb-2">Secondary Contact</span>
                              <span className="text-lg font-bold text-[#fbbf24]/70 tabular-nums">
                                {delivery.phone2 && delivery.phone2 !== 'N/A' ? delivery.phone2 : 'None Provided'}
                              </span>
                            </div>

                            {/* Division Box */}
                            <div className="p-5 rounded-3xl bg-[#fbbf24]/5 border border-[#fbbf24]/10 flex flex-col justify-center">
                              <span className="text-[10px] uppercase tracking-widest font-black text-[#fbbf24]/30 mb-2">Division</span>
                              <span className="text-lg font-black text-[#fbbf24] uppercase tracking-tighter">{delivery.division || 'N/A'}</span>
                            </div>

                            {/* District Box */}
                            <div className="p-5 rounded-3xl bg-[#fbbf24]/5 border border-[#fbbf24]/10 flex flex-col justify-center">
                              <span className="text-[10px] uppercase tracking-widest font-black text-[#fbbf24]/30 mb-2">District</span>
                              <span className="text-lg font-black text-[#fbbf24] uppercase tracking-tighter">{delivery.district || 'N/A'}</span>
                            </div>

                            {/* Police Station Box */}
                            <div className="p-5 rounded-3xl bg-[#fbbf24]/5 border border-[#fbbf24]/10 flex flex-col justify-center">
                              <span className="text-[10px] uppercase tracking-widest font-black text-[#fbbf24]/30 mb-2">Police Station</span>
                              <span className="text-lg font-black text-[#fbbf24] uppercase tracking-tighter">{delivery.upazila || 'N/A'}</span>
                            </div>

                            {/* Exact Location Box */}
                            <div className="sm:col-span-2 md:col-span-3 p-4 rounded-3xl bg-[#fbbf24]/10 border border-[#fbbf24]/20">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#fbbf24]/40 mb-1 block">Exact Delivery Location</span>
                              <p className="text-base font-bold text-[#fbbf24] leading-relaxed italic-text">
                                {delivery.address || order.address}
                              </p>
                            </div>

                            {/* Special Note Box */}
                            {delivery.orderNote && delivery.orderNote !== 'N/A' && (
                              <div className="sm:col-span-2 md:col-span-3 p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-[100%] -mr-4 -mt-4" />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-400/50 mb-1 block flex items-center gap-2">
                                  <ListFilter className="w-3.5 h-3.5" /> Special Customer Instructions
                                </span>
                                <p className="text-base font-medium text-emerald-400/90 leading-relaxed italic italic-text">
                                  "{delivery.orderNote}"
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Inventory & Financial Summary */}
                          <div className="xl:col-span-5 space-y-4">
                            {/* Order Item Box */}
                            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 shadow-inner">
                              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-[#fbbf24]/20 mb-4">Order Item</p>
                              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {order.items?.map((item: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group/item hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg shrink-0">
                                        <img src={item.image} alt="" className="w-full h-full object-cover transition-transform group-hover/item:scale-110" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-[#fbbf24] tracking-tight group-hover/item:text-white transition-colors">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] font-black bg-[#fbbf24] text-[#064e3b] px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            QTY: {item.quantity}
                                          </span>
                                          <span className="text-[10px] font-bold text-[#fbbf24]/40 uppercase tracking-widest">৳{item.price}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-[#fbbf24] gold-text">৳{item.price * item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Final Financial Box */}
                            <div className="p-5 rounded-3xl bg-[#fbbf24] text-[#064e3b] shadow-2xl relative overflow-hidden group/total">
                              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover/total:scale-150 transition-transform duration-1000" />
                              <div className="relative z-10 flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-60">Total Business Value</p>
                                  <h4 className="text-3xl font-serif font-black tracking-tighter mt-1">৳{finalPrice.toLocaleString()}</h4>
                                </div>
                                <div className="text-right">
                                  {hasDiscount && (
                                    <div className="bg-[#064e3b]/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#064e3b]/10 mb-1">
                                      <p className="text-[8px] font-black uppercase tracking-widest leading-none">Loyalty Reward Applied</p>
                                      <p className="text-xs font-bold">-৳{discountAmount}</p>
                                    </div>
                                  )}
                                  <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Payment: COD</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Decorative Gradient Overlay */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#fbbf24]/5 rounded-bl-[100%] pointer-events-none group-hover:bg-[#fbbf24]/10 transition-colors" />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {orders.length === 0 && (
                  <div className="text-center py-24 bg-[#064e3b]/20 rounded-[3rem] border border-white/5 backdrop-blur-xl">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
                      <ShoppingBag className="w-10 h-10 text-[#fbbf24]/30" />
                    </div>
                    <h3 className="text-xl font-serif font-black text-[#fbbf24]/60">No Active Commissions Found</h3>
                    <p className="text-[10px] uppercase tracking-widest text-[#fbbf24]/30 mt-2 font-bold">The market currently awaits a participant</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'slideshow' ? (
            /* Slideshow Tab */
            <motion.div 
              key="slideshow"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <Card className="lg:col-span-1 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-[#064e3b]/30 backdrop-blur-xl border border-[#fbbf24]/10">
                <CardContent className="p-10 pt-12">
                  <div className="mb-10 border-b border-white/5 pb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-serif font-black text-[#fbbf24] uppercase tracking-tighter flex items-center gap-3">
                        <ImagePlus className="w-6 h-6 text-[#fbbf24]" />
                        {editingSlideshowId ? 'Edit Banner' : 'Add Banner'}
                      </h2>
                      <p className="text-xs text-[#fbbf24]/40 font-bold uppercase tracking-[0.3em] mt-2">
                        Slideshow Configuration
                      </p>
                    </div>
                    {editingSlideshowId && (
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setEditingSlideshowId(null);
                          setNewSlideshowUrl('');
                        }}
                        className="text-xs font-black text-rose-500 hover:bg-rose-500/10 rounded-xl px-4 uppercase tracking-widest border border-rose-500/20"
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>

                  <form onSubmit={handleAddSlideshowImage} className="space-y-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Banner Preview</Label>
                        <div className="relative group cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressedBase64 = await compressImage(file);
                                  setNewSlideshowUrl(compressedBase64);
                                  toast.success('Image ready to add');
                                } catch (error) {
                                  toast.error('Failed to compress image');
                                }
                              }
                            }}
                            className="hidden" 
                            id="slideshow-upload"
                          />
                          <label 
                            htmlFor="slideshow-upload"
                            className="flex flex-col items-center justify-center w-full aspect-video rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#fbbf24] transition-all overflow-hidden group relative"
                          >
                            {newSlideshowUrl ? (
                              <>
                                <img src={newSlideshowUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-[#064e3b]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Upload className="w-8 h-8 text-[#fbbf24]" />
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-white/10 rounded-2xl text-[#fbbf24]">
                                  <Upload className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-bold text-[#fbbf24]">Click to Upload Image</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Or Paste Direct URL</Label>
                        <Input 
                          placeholder="https://i.ibb.co/..."
                          value={newSlideshowUrl}
                          onChange={(e) => setNewSlideshowUrl(e.target.value)}
                          className="h-14 border-2 border-white/5 bg-white/5 focus-visible:ring-2 focus-visible:ring-[#fbbf24] rounded-2xl font-bold text-[#fbbf24]"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={!newSlideshowUrl || isPostingSlideshow}
                      className="w-full h-16 rounded-[1.25rem] font-black uppercase tracking-widest text-xs bg-[#fbbf24] text-[#064e3b] hover:bg-[#fbbf24]/90 shadow-2xl disabled:opacity-50"
                    >
                      {isPostingSlideshow ? (editingSlideshowId ? 'Saving...' : 'Adding...') : (editingSlideshowId ? 'Save Changes' : 'Publish to Slideshow')}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-[#064e3b]/30 backdrop-blur-xl border border-[#fbbf24]/10">
                <CardHeader className="p-10 border-b border-white/5 flex flex-row items-center justify-between">
                  <CardTitle className="font-serif text-[#fbbf24] text-2xl tracking-tight">Active Slideshow Rotation</CardTitle>
                  {slideshowImages.length === 0 && (
                    <Button
                      onClick={async () => {
                        const defaults = [
                          "/regenerated_image_1777575490870.png",
                          "/regenerated_image_1777544719750.png"
                        ];
                        try {
                          for (let i = 0; i < defaults.length; i++) {
                            await addDoc(collection(db, 'slideshow'), {
                              url: defaults[i],
                              order: i,
                              createdAt: Date.now()
                            });
                          }
                          toast.success('Default images restored');
                        } catch (error) {
                          toast.error('Failed to restore defaults');
                        }
                      }}
                      className="bg-[#064e3b] text-[#fbbf24] border border-[#fbbf24]/30 hover:bg-[#064e3b]/80"
                    >
                      Restore Defaults
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {slideshowImages.length === 0 && (
                      <div className="col-span-full py-12 text-center text-white/40">
                        <ImagePlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No images in rotation. Add images or restore defaults.</p>
                      </div>
                    )}
                    <AnimatePresence>
                      {slideshowImages.map((img, idx) => (
                        <motion.div 
                          key={img.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="group relative aspect-video rounded-3xl overflow-hidden border-2 border-white/5 shadow-2xl bg-black/20"
                        >
                          <img src={img.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6">
                            <Badge className="bg-[#fbbf24] text-[#064e3b] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">
                              Slide {idx + 1}
                            </Badge>
                            <div className="flex gap-2">
                              {idx > 0 && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReorderSlideshow(idx, 'up');
                                  }}
                                  size="icon"
                                  className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-[#fbbf24] backdrop-blur-md shadow-xl"
                                >
                                  <ArrowUp className="w-5 h-5" />
                                </Button>
                              )}
                              {idx < slideshowImages.length - 1 && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReorderSlideshow(idx, 'down');
                                  }}
                                  size="icon"
                                  className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-[#fbbf24] backdrop-blur-md shadow-xl"
                                >
                                  <ArrowDown className="w-5 h-5" />
                                </Button>
                              )}
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSlideshowId(img.id);
                                  setNewSlideshowUrl(img.url);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                size="icon"
                                className="w-12 h-12 rounded-2xl bg-[#fbbf24]/20 hover:bg-[#fbbf24]/40 text-[#fbbf24] border border-[#fbbf24]/30 shadow-xl"
                              >
                                <Edit className="w-5 h-5" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteSlideshowImage(img.id)}
                                size="icon"
                                className="w-12 h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/20"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {slideshowImages.length === 0 && (
                      <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-[#fbbf24]/30 font-serif text-xl italic">Empty Exhibition Gallery</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : activeTab === 'flash_sale' && (
            <motion.div 
              key="flash_sale"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-[#064e3b]/30 backdrop-blur-xl border border-[#fbbf24]/10 h-fit sticky top-8">
                <CardContent className="p-10 pt-12">
                  <div className="mb-10 border-b border-white/5 pb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-serif font-black text-[#fbbf24] uppercase tracking-tighter flex items-center gap-3">
                        <Timer className="w-6 h-6 text-[#fbbf24]" />
                        {editingFlashSaleId ? 'Edit Flash Sale' : 'Add Flash Sale'}
                      </h2>
                    </div>
                    {editingFlashSaleId && (
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setEditingFlashSaleId(null);
                          setFlashSaleForm({
                            bannerUrl: '',
                            linkUrl: '',
                            description: '',
                            price: 0,
                            isActive: false,
                            endTime: Date.now() + 24 * 60 * 60 * 1000
                          });
                        }}
                        className="text-xs font-black text-rose-500 hover:bg-rose-500/10 rounded-xl px-4 uppercase tracking-widest border border-rose-500/20"
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>

                  <form onSubmit={handleSaveFlashSale} className="space-y-8">
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <Label className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Banner Images</Label>
                        {flashSaleForm.bannerUrls && flashSaleForm.bannerUrls.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {flashSaleForm.bannerUrls.map((url, idx) => (
                              <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border-2 border-white/10">
                                <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const urls = [...(flashSaleForm.bannerUrls || [])];
                                    urls.splice(idx, 1);
                                    setFlashSaleForm({ ...flashSaleForm, bannerUrls: urls });
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-rose-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="relative group cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files) return;
                              
                              Array.from(files).forEach(async (file: File) => {
                                try {
                                  const compressedBase64 = await compressImage(file);
                                  setFlashSaleForm(prev => ({
                                    ...prev,
                                    bannerUrls: [...(prev.bannerUrls || []), compressedBase64]
                                  }));
                                  toast.success('Image ready to add');
                                } catch (error) {
                                  toast.error('Failed to compress image');
                                }
                              });
                            }}
                            className="hidden" 
                            id="flashsale-upload"
                          />
                          <label 
                            htmlFor="flashsale-upload"
                            className="flex flex-col items-center justify-center w-full aspect-video rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#fbbf24] transition-all overflow-hidden group relative"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 bg-white/10 rounded-2xl text-[#fbbf24]">
                                <Upload className="w-8 h-8" />
                              </div>
                              <p className="text-sm font-bold text-[#fbbf24]">Click to Upload Image(s)</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Price (Optional)</Label>
                        <Input 
                          type="number"
                          placeholder="e.g. 500"
                          value={flashSaleForm.price || ''}
                          onChange={(e) => setFlashSaleForm({ ...flashSaleForm, price: parseFloat(e.target.value) || 0 })}
                          className="h-14 border-2 border-white/5 bg-white/5 focus-visible:ring-2 focus-visible:ring-[#fbbf24] rounded-2xl font-bold text-[#fbbf24]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">Description</Label>
                        <textarea 
                          placeholder="Craft a compelling flash sale description..."
                          value={flashSaleForm.description || ''}
                          onChange={(e) => setFlashSaleForm({ ...flashSaleForm, description: e.target.value })}
                          className="w-full min-h-[120px] p-5 rounded-3xl border-2 border-white/5 bg-white/5 focus:ring-2 focus:ring-[#fbbf24] focus:bg-white/10 text-[#fbbf24] font-medium text-sm resize-none transition-all outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-black text-[#fbbf24]/60 ml-1">End Time</Label>
                        <Input 
                          type="datetime-local"
                          value={(() => {
                            const d = new Date(flashSaleForm.endTime || Date.now());
                            return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          })()}
                          onChange={(e) => setFlashSaleForm({ ...flashSaleForm, endTime: new Date(e.target.value).getTime() })}
                          className="h-14 border-2 border-white/5 bg-white/5 focus-visible:ring-2 focus-visible:ring-[#fbbf24] rounded-2xl font-bold text-[#fbbf24] [&::-webkit-calendar-picker-indicator]:filter-none [&::-webkit-calendar-picker-indicator]:invert"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={!flashSaleForm.bannerUrls?.length || isPostingFlashSale}
                      className="w-full h-16 rounded-[1.25rem] font-black uppercase tracking-widest text-xs bg-[#fbbf24] text-[#064e3b] hover:bg-[#fbbf24]/90 shadow-2xl disabled:opacity-50"
                    >
                      {isPostingFlashSale ? 'Saving...' : 'Save Flash Sale'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-[#064e3b]/30 backdrop-blur-xl border border-[#fbbf24]/10">
                <CardHeader className="p-10 border-b border-white/5">
                  <CardTitle className="font-serif text-[#fbbf24] text-2xl tracking-tight">Active Flash Sales</CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="space-y-6">
                    <AnimatePresence>
                      {flashSales.map((sale) => (
                        <motion.div 
                          key={sale.id}
                          layout
                          className="relative group bg-[#064e3b]/50 border-2 border-white/5 hover:border-[#fbbf24]/30 rounded-[2rem] p-6 transition-all duration-500 overflow-hidden"
                        >
                          <div className="flex gap-6 items-center">
                            <img src={sale.bannerUrls?.[0] || sale.bannerUrl} className="w-48 h-24 object-cover rounded-xl" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-white/70">Ends: {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(sale.endTime)).toUpperCase()}</p>
                              <div className="flex gap-4 items-center">
                                <Label className="text-sm font-bold text-[#fbbf24]">Active:</Label>
                                <Switch 
                                  checked={sale.isActive} 
                                  onCheckedChange={() => handleToggleFlashSaleStatus(sale.id, sale.isActive)}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  setEditingFlashSaleId(sale.id);
                                  setFlashSaleForm({
                                    bannerUrls: sale.bannerUrls || (sale.bannerUrl ? [sale.bannerUrl] : []),
                                    linkUrl: sale.linkUrl,
                                    price: sale.price || 0,
                                    description: sale.description || '',
                                    endTime: sale.endTime,
                                    isActive: sale.isActive
                                  });
                                }}
                                size="icon"
                                className="w-10 h-10 rounded-xl bg-[#fbbf24]/20 hover:bg-[#fbbf24]/40 text-[#fbbf24]"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteFlashSale(sale.id)}
                                size="icon"
                                className="w-10 h-10 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#022c22]/90 backdrop-blur-md p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-auto max-w-5xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.2)] bg-transparent"
            >
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-[#fbbf24] text-white hover:text-black rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={zoomedImage}
                alt="Zoomed image"
                className="w-full h-auto max-h-[90vh] object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
