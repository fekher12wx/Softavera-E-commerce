'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { CartItem, Product } from './types';

// Cart state interface
interface CartState {
  cart: CartItem[];
  total: number; // Base total without tax
  totalWithTax: number; // Total including tax
  itemCount: number;
}

// Cart actions
type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string } // product id
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

// Cart context interface
interface CartContextType extends CartState {
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
}

// Initial state
const initialState: CartState = {
  cart: [],
  total: 0,
  totalWithTax: 0,
  itemCount: 0,
};

// Helper function to calculate totals
const calculateTotals = (cart: CartItem[]) => {
  // Calculate base total (no tax) - this is what we show as "subtotal"
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  // Calculate total with tax if products have tax information
  const totalWithTax = cart.reduce((sum, item) => {
    const itemSubtotal = item.product.price * item.quantity;
    const taxRate = (item.product as any).taxRate || 0; // Access taxRate if available
    const itemTax = itemSubtotal * (taxRate / 100);
    return sum + itemSubtotal + itemTax;
  }, 0);
  
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return { total, totalWithTax, itemCount };
};

// Cart reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItemIndex = state.cart.findIndex(
        item => item.product.id === action.payload.product.id
      );

      let newCart: CartItem[];

      if (existingItemIndex >= 0) {
        // Item already exists, update quantity
        newCart = state.cart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        // New item, add to cart
        newCart = [...state.cart, action.payload];
      }

      const { total, totalWithTax, itemCount } = calculateTotals(newCart);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(newCart));
      }

      return {
        cart: newCart,
        total,
        totalWithTax,
        itemCount,
      };
    }

    case 'REMOVE_FROM_CART': {
      const newCart = state.cart.filter(item => item.product.id !== action.payload);
      const { total, totalWithTax, itemCount } = calculateTotals(newCart);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(newCart));
      }

      return {
        cart: newCart,
        total,
        totalWithTax,
        itemCount,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        return cartReducer(state, { type: 'REMOVE_FROM_CART', payload: productId });
      }

      const newCart = state.cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      );

      const { total, totalWithTax, itemCount } = calculateTotals(newCart);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(newCart));
      }

      return {
        cart: newCart,
        total,
        totalWithTax,
        itemCount,
      };
    }

    case 'CLEAR_CART': {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
      }

      return {
        cart: [],
        total: 0,
        totalWithTax: 0,
        itemCount: 0,
      };
    }

    case 'LOAD_CART': {
      const { total, totalWithTax, itemCount } = calculateTotals(action.payload);
      return {
        cart: action.payload,
        total,
        totalWithTax,
        itemCount,
      };
    }

    default:
      return state;
  }
};

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart provider component
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart: CartItem[] = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: parsedCart });
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          localStorage.removeItem('cart');
        }
      }
    }
  }, []);

  // Cart actions
  const addToCart = (item: CartItem) => {
    dispatch({ type: 'ADD_TO_CART', payload: item });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemQuantity = (productId: string): number => {
    const item = state.cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId: string): boolean => {
    return state.cart.some(item => item.product.id === productId);
  };

  const contextValue: CartContextType = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};