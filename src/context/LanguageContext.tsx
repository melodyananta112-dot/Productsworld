import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'search_placeholder': 'Search Product...',
    'admin': 'Admin',
    'orders': 'Orders',
    'cart': 'Cart',
    'login': 'Login',
    'all_category': 'All Category',
    'premium_collection': 'Premium Collection',
    'experience_excellence': 'Experience The Excellence',
    'of_products_world': 'of Product\'S World',
    'slogan': '💚 “যেখানে কোয়ালিটি কথা বলে, সেটাই ---Products World” 💚',
    'hero_desc': 'Curated luxury, timeless design, and unparalleled quality. Discover products that define your world.',
    'our_collection': 'Our Collection',
    'no_items': 'No items found in this category',
    'updating_collection': 'We are constantly updating our premium collection.',
    'add_to_collection': 'Add to Collection',
    'out_of_stock': 'Out of Stock',
    'pieces_available': 'pieces available',
    'footer_desc': 'Your destination for premium products and exceptional quality.',
    'quick_links': 'Quick Links',
    'home': 'Home',
    'contact_us': 'Contact Us',
    'follow_us': 'Follow Us',
    'all_rights_reserved': 'All rights reserved.',
    'shopping': 'Shopping',
    'offers': 'Offers',
    'become_seller': 'Become a Seller',
    'cart_view': 'View Cart',
    'new_arrival': 'New Arrival',
    'see_more': 'See More',
    'add_to_cart': 'Add to Cart',
    'your_selection': 'Your Selection',
    'return_to_collection': 'Return to Collection',
    'quantity': 'Quantity',
    'acquisition_summary': 'Acquisition Summary',
    'total_investment': 'Total Investment',
    'delivery_address': 'Delivery Address',
    'enter_address': 'Enter full address',
    'contact_number': 'Contact Number',
    'enter_phone': 'Enter phone number',
    'finalize_acquisition': 'Finalize Acquisition',
    'processing_request': 'Processing Request...',
    'selection_empty': 'Your selection is empty',
    'explore_extraordinary': 'Explore our collection to find something extraordinary.',
    'start_exploring': 'Start Exploring',
    'your_acquisitions': 'Payment Information',
    'no_acquisitions': 'No delivery information found',
    'start_shopping': 'Start Shopping',
    'status': 'Status',
    'total': 'Total',
    'date': 'Date',
    'items': 'Items',
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'ready_for_delivery': 'Ready for Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'please_login_orders': 'Please login to view your delivery information',
    'please_login_checkout': 'Please Login or Sign Up to finalize your order.',
    'favorite': 'Favorite',
    'favorites': 'Favorites',
    'no_favorites': 'No favorites yet',
    'visit_facebook': 'Visit Our Facebook Page',
    'visit_instagram': 'Visit Our Instagram Profile',
    'phone': 'Phone',
    'email': 'Email',
  },
  bn: {
    'search_placeholder': 'পণ্য খুঁজুন...',
    'admin': 'অ্যাডমিন',
    'orders': 'অর্ডার',
    'cart': 'কার্ট',
    'login': 'লগইন',
    'all_category': 'সব ক্যাটাগরি',
    'premium_collection': 'প্রিমিয়াম কালেকশন',
    'experience_excellence': 'উৎকর্ষের অভিজ্ঞতা নিন',
    'of_products_world': 'প্রোডাক্টস ওয়ার্ল্ডের সাথে',
    'slogan': '💚 “যেখানে কোয়ালিটি কথা বলে, সেটাই ---Products World” 💚',
    'hero_desc': 'নির্বাচিত বিলাসিতা, কালজয়ী ডিজাইন এবং অতুলনীয় গুণমান। আপনার বিশ্বকে সংজ্ঞায়িত করে এমন পণ্যগুলি আবিষ্কার করুন।',
    'our_collection': 'আমাদের সংগ্রহ',
    'no_items': 'এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি',
    'updating_collection': 'আমরা ক্রমাগত আমাদের প্রিমিয়াম সংগ্রহ আপডেট করছি।',
    'add_to_collection': 'সংগ্রহে যোগ করুন',
    'out_of_stock': 'স্টক শেষ',
    'pieces_available': 'টি পণ্য উপলব্ধ',
    'footer_desc': 'প্রিমিয়াম পণ্য এবং ব্যতিক্রমী মানের জন্য আপনার গন্তব্য।',
    'quick_links': 'দ্রুত লিঙ্ক',
    'home': 'হোম',
    'contact_us': 'যোগাযোগ করুন',
    'follow_us': 'আমাদের অনুসরণ করুন',
    'all_rights_reserved': 'সর্বস্বত্ব সংরক্ষিত।',
    'shopping': 'শপিং',
    'offers': 'অফার সমূহ',
    'become_seller': 'একজন সেলার হন',
    'cart_view': 'কার্ট দেখুন',
    'new_arrival': 'নিউ অ্যারাইভাল',
    'see_more': 'আরো দেখুন',
    'add_to_cart': 'কার্টে যোগ করুন',
    'your_selection': 'আপনার নির্বাচন',
    'return_to_collection': 'সংগ্রহে ফিরে যান',
    'quantity': 'পরিমাণ',
    'acquisition_summary': 'ক্রয়ের সারাংশ',
    'total_investment': 'মোট বিনিয়োগ',
    'delivery_address': 'ডেলিভারি ঠিকানা',
    'enter_address': 'পুরো ঠিকানা লিখুন',
    'contact_number': 'যোগাযোগ নম্বর',
    'enter_phone': 'ফোন নম্বর লিখুন',
    'finalize_acquisition': 'ক্রয় সম্পন্ন করুন',
    'processing_request': 'অনুরোধ প্রক্রিয়াধীন...',
    'selection_empty': 'আপনার ঝুড়ি খালি',
    'explore_extraordinary': 'অসাধারণ কিছু খুঁজে পেতে আমাদের সংগ্রহ দেখুন।',
    'start_exploring': 'দেখা শুরু করুন',
    'your_acquisitions': 'পেমেন্ট সংক্রান্ত তথ্য',
    'no_acquisitions': 'কোনো ডেলিভারি তথ্য পাওয়া যায়নি',
    'start_shopping': 'কেনাকাটা শুরু করুন',
    'status': 'অবস্থা',
    'total': 'মোট',
    'date': 'তারিখ',
    'items': 'পণ্যসমূহ',
    'pending': 'অপেক্ষমান',
    'processing': 'প্রক্রিয়াধীন',
    'shipped': 'পাঠানো হয়েছে',
    'ready_for_delivery': 'ডেলিভারির জন্য প্রস্তুত',
    'delivered': 'পৌঁছেছে',
    'cancelled': 'বাতিল',
    'please_login_orders': 'আপনার ডেলিভারি তথ্য দেখতে লগইন করুন',
    'please_login_checkout': 'অর্ডার নিশ্চিত করতে লগইন বা সাইন আপ করুন।',
    'favorite': 'প্রিয়',
    'favorites': 'পছন্দসই',
    'no_favorites': 'এখনো কোনো প্রিয় পণ্য নেই',
    'visit_facebook': 'আমাদের ফেসবুক পেজ ভিজিট করুন',
    'visit_instagram': 'আমাদের ইন্সটাগ্রাম প্রোফাইল ভিজিট করুন',
    'phone': 'ফোন',
    'email': 'ইমেইল',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
