// User roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// Address interface
export interface Address {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

// Review interface
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Product interface
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  subcategory?: string;
  image: string;
  stock: number;
  rating: number;
  reviews: number;
  taxId?: string; // Reference to the tax from the taxes table
  createdAt?: Date;
  updatedAt?: Date;
}

// Product with tax information included
export interface ProductWithTax extends Product {
  taxRate?: number; // The actual tax rate percentage
  taxName?: string; // The tax name (e.g., "20%", "5%")
}

// User interface (without password)
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  address?: Address;
  createdAt?: Date;
  updatedAt?: Date;
}

// Cart item interface
export interface CartItem {
  product: Product;
  quantity: number;
}

// Order interface
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  createdAt: Date;
  updatedAt?: Date;
}

// Auth-related types
export interface AuthUser extends User {
  password?: never; // Never expose password in frontend
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  address?: Address;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Order status type
export type OrderStatus = Order['status'];

// CRUD operation types
export type CreateProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProduct = Partial<CreateProduct>;

export type CreateUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUser = Partial<CreateUser>;

export type CreateOrder = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrder = Partial<CreateOrder>;

// Tax interface
export interface Tax {
  id: string;
  name: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string; // Unique identifier like 'adyen', 'paymee', etc.
  description: string;
  isActive: boolean;
  config: Record<string, any>; // Store API keys, endpoints, etc.
  createdAt: string;
  updatedAt: string;
}

// Request/Response types
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  address?: Address;
}