export interface Address {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  address?: Address;
  // French API field names
  nom?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  subcategory?: string;
  stock: number;
  rating: number;
  reviews: number;
  taxId?: string;
}

// Product with tax information included
export interface ProductWithTax extends Product {
  taxRate?: number; // The actual tax rate percentage
  taxName?: string; // The tax name (e.g., "20%", "5%")
}

export interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface EditFormData {
  name: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}