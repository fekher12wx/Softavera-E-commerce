export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'USER' | 'ADMIN';
  address?: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  // French API field names for compatibility
  nom?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  stock: number;
  rating: number;
  reviews: number;
  createdAt?: string;
  updatedAt?: string;
  subcategory?: string;
  taxId?: string; // Reference to the tax from the taxes table
  taxRate?: number; // The actual tax rate percentage
  taxName?: string; // The tax name (e.g., "20%", "5%")
}

export interface Order {
  id: string;
  userId: string;
  items: {
    product: {
      id: string;
      name: string;
      price: number;
      image: string;
    };
    quantity: number;
  }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
}

export interface Tax {
  id: string;
  name: string;
  rate: number; // Percentage rate (e.g., 20 for 20%)
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

export interface Currency {
  id: string;
  name: string;
  code: string; // 'USD', 'EUR', 'TND'
  symbol: string; // '$', '€', 'DT'
  isActive: boolean;
  exchangeRate: number; // Rate relative to base currency
  isBase: boolean; // Whether this is the base currency
  createdAt: string;
  updatedAt: string;
}

export type TabType = 'users' | 'products' | 'orders' | 'taxes' | 'paymentMethods' | 'currency' | 'invoiceSettings';
export type ModalType = 'add' | 'edit' | 'view' | 'add-tax';

interface ModalProps {
  modalType: ModalType;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedItem: User | Product | Order | Tax | PaymentMethod | Currency | null;
  handleSave: (formData: any) => Promise<void>;
  activeTab: TabType;
  users: User[];
  products: Product[];
  orders: Order[];
  taxes: Tax[];
  paymentMethods: PaymentMethod[];
  currencies: Currency[];
} 