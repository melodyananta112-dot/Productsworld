export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category?: string;
  quantity: number;
  createdAt: number;
  updatedAt?: number;
  inStock?: boolean;
  deliveryInsideDhaka?: string;
  deliveryOutsideDhaka?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'ready_for_delivery' | 'delivered' | 'cancelled';
  address: string;
  phone: string;
  createdAt: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'customer';
  createdAt: number;
}
