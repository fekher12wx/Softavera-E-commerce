'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Eye, Trash2, Users, Package, ShoppingCart, DollarSign, Search, Bell } from 'lucide-react';
import { User, Product, Order, Tax, PaymentMethod, TabType, ModalType } from './adminTypes';
import StatsCard from './StatsCard';
import UsersTable from './UsersTable';
import ProductsTable from './ProductsTable';
import OrdersTable from './OrdersTable';
import TaxesTable from './TaxesTable';
import PaymentMethodsTable from './PaymentMethodsTable';
import Modal from './Modal';
import InvoiceModal from '../../components/InvoiceModal';
import { jwtDecode } from "jwt-decode";
import Header from '../../components/Header';
import { useCurrency } from '../../lib/currencyContext';
import { useLanguage } from '../../lib/languageContext';
import toast from 'react-hot-toast'; // Add this import
import AdminHeader from './AdminHeader';
import NotificationDropdown from './NotificationDropdown';
import StatsCards from './StatsCards';
import TabBar from './TabBar';



const AdminDashboard: React.FC = () => {
  // All hooks at the top!
  const { getCurrencySymbol } = useCurrency();
  const { t } = useLanguage();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('add');
  const [selectedItem, setSelectedItem] = useState<User | Product | Order | Tax | PaymentMethod | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    console.log("AdminDashboard useEffect running");
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsAuthorized(false);
      return;
    }
    try {
      const decoded: any = jwtDecode(token);
      console.log('Decoded JWT:', decoded); // Debug: see the token structure
      // Try both 'role' and 'user.role' in case the backend nests it
      if (decoded.role === 'ADMIN' || (decoded.user && decoded.user.role === 'ADMIN')) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (e) {
      setIsAuthorized(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        
        // Fetch users
        const usersRes = await fetch('http://localhost:3001/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        setUsers(usersData);

        // Fetch products
        const productsRes = await fetch('http://localhost:3001/api/products');
        const productsData = await productsRes.json();
        setProducts(productsData);

        // Fetch orders
        const ordersRes = await fetch('http://localhost:3001/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const ordersData = await ordersRes.json();
        setOrders(ordersData);

        // Fetch taxes
        const taxesRes = await fetch('http://localhost:3001/api/taxes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const taxesData = await taxesRes.json();
        setTaxes(taxesData);

        // Fetch payment methods
        try {
          const paymentMethodsRes = await fetch('http://localhost:3001/api/payment-methods', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!paymentMethodsRes.ok) {
            console.error('Payment methods fetch failed:', paymentMethodsRes.status, paymentMethodsRes.statusText);
            setPaymentMethods([]);
          } else {
            const paymentMethodsData = await paymentMethodsRes.json();
            console.log('Payment methods response:', paymentMethodsData);
            console.log('Payment methods type:', typeof paymentMethodsData);
            console.log('Is array:', Array.isArray(paymentMethodsData));
            console.log('Existing payment method codes:', paymentMethodsData.map((pm: any) => pm.code));
            
            // Ensure we always set an array
            if (Array.isArray(paymentMethodsData)) {
              setPaymentMethods(paymentMethodsData);
            } else if (paymentMethodsData && Array.isArray(paymentMethodsData.data)) {
              setPaymentMethods(paymentMethodsData.data);
            } else {
              console.warn('Payment methods data is not an array, setting empty array');
              setPaymentMethods([]);
            }
          }
        } catch (paymentError) {
          console.error('Error fetching payment methods:', paymentError);
          setPaymentMethods([]);
        }

        // Calculate total revenue
        const totalRevenue = ordersData.reduce((sum: number, order: Order) => {
          return sum + (order.total || 0);
        }, 0);
        // setTotalRevenue(totalRevenue); // This line was removed from the original file, so it's removed here.

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ws = new window.WebSocket('ws://localhost:3001');
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'order_created') {
          setOrders((prev) => [...prev, data.order]);
          // Add to notifications
          setNotifications((prev) => [
            {
              id: data.order.id,
              message: `New order received! #${data.order.id.slice(-6).toUpperCase()} - Total: ${data.order.total} ${getCurrencySymbol()}`,
              time: new Date().toLocaleTimeString(),
              read: false,
              order: data.order
            },
            ...prev
          ]);
          toast.success(
                          `New order received! #${data.order.id.slice(-6).toUpperCase()} - Total: ${data.order.total} ${getCurrencySymbol()}`
          );
        } else if (data.type === 'order_updated' || data.type === 'order_status_updated') {
          setOrders((prev) => prev.map(order => order.id === data.order.id ? data.order : order));
        } else if (data.type === 'order_deleted') {
          setOrders((prev) => prev.filter(order => order.id !== data.orderId));
        }
      } catch (e) {
        // Ignore invalid messages
      }
    };
    ws.onclose = () => {
      // Optionally: try to reconnect
    };
    return () => {
      ws.close();
    };
  }, []);

  // Add this function after the existing useEffect hooks
  const initializeDefaultPaymentMethods = async () => {
    if (paymentMethods.length === 0) {
      try {
        const token = localStorage.getItem('authToken');
        const defaultMethods = [
          {
            name: 'Adyen',
            code: 'adyen',
            description: 'Global payment platform supporting multiple payment methods',
            isActive: false,
            config: {
              apiKey: '',
              merchantAccount: '',
              environment: 'test'
            }
          },
          {
            name: 'Paymee',
            code: 'paymee',
            description: 'Tunisian payment gateway for local and international payments',
            isActive: false,
            config: {
              apiToken: '',
              vendorId: '',
              baseUrl: 'https://sandbox.paymee.tn/api/v2',
              environment: 'sandbox'
            }
          },
          {
            name: 'Konnect',
            code: 'konnect',
            description: 'Tunisian digital payment network',
            isActive: false,
            config: {
              apiKey: '',
              merchantId: '',
              baseUrl: 'https://api.konnect.network',
              environment: 'test'
            }
          }
        ];

        // Create default payment methods
        for (const method of defaultMethods) {
          try {
            const response = await fetch('http://localhost:3001/api/payment-methods', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(method)
            });

            if (response.ok) {
              console.log(`Created default payment method: ${method.name}`);
            } else {
              console.error(`Failed to create ${method.name}:`, response.statusText);
            }
          } catch (error) {
            console.error(`Error creating ${method.name}:`, error);
          }
        }

        // Refresh payment methods list
        const paymentMethodsRes = await fetch('http://localhost:3001/api/payment-methods', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (paymentMethodsRes.ok) {
          const paymentMethodsData = await paymentMethodsRes.json();
          if (Array.isArray(paymentMethodsData)) {
            setPaymentMethods(paymentMethodsData);
          }
        }
      } catch (error) {
        console.error('Error initializing default payment methods:', error);
      }
    }
  };

  // Add this useEffect to initialize default payment methods
  useEffect(() => {
    if (paymentMethods.length === 0 && !loading) {
      initializeDefaultPaymentMethods();
    }
  }, [paymentMethods.length, loading]);

  // Only after all hooks, do your conditional returns:
  if (isAuthorized === false) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Not authorized</h1>
          <p className="text-lg text-gray-600">You do not have permission to access this page.</p>
        </div>
      </>
    );
  }
  if (isAuthorized === null) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <span className="text-lg text-gray-500">Checking authorization...</span>
        </div>
      </>
    );
  }

  const handleAddNew = () => {
    setModalType('add');
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: User | Product | Order | Tax | PaymentMethod) => {
    setModalType('edit');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleView = (item: User | Product | Order | Tax | PaymentMethod) => {
    console.log('=== handleView called ===');
    console.log('Item:', item);
    console.log('Active tab:', activeTab);
    console.log('Item type check:', 'items' in item ? 'Order' : 'Other');
    
    // If this is an order item, automatically switch to orders tab
    if (item && 'items' in item && Array.isArray(item.items)) {
      console.log('Detected order item, switching to orders tab');
      setActiveTab('orders');
    }
    
    if (activeTab === 'orders' || ('items' in item && Array.isArray(item.items))) {
      // For orders, show the invoice modal
      console.log('Showing invoice modal for order:', item);
      setSelectedOrder(item as Order);
      setShowInvoiceModal(true);
    } else {
      // For other items, show the regular modal
      console.log('Showing regular modal for item:', item);
      setModalType('view');
      setSelectedItem(item);
      setShowModal(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    console.log(`Attempting to delete ${activeTab.slice(0, -1)} with ID:`, id);
    
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = activeTab === 'users' ? 'users' : 
                      activeTab === 'products' ? 'products' : 
                      activeTab === 'orders' ? 'orders' : 
                      activeTab === 'taxes' ? 'taxes' : 
                      activeTab === 'paymentMethods' ? 'payment-methods' : 'users';
      
      console.log('Delete endpoint:', endpoint);
      console.log('Delete URL:', `http://localhost:3001/api/${endpoint}/${id}`);
      
      const response = await fetch(`http://localhost:3001/api/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.products && Array.isArray(errorData.products)) {
            const productNames = errorData.products.map((p: any) => p.name).join(', ');
            throw new Error(`Cannot delete tax. It is being used by: ${productNames}. Please remove or change the tax from these products first.`);
          } else {
            throw new Error(errorData.error || `Failed to delete: ${response.status} ${response.statusText}`);
          }
        } catch (parseError) {
          throw new Error(`Failed to delete: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const responseData = await response.text();
      console.log('Delete response data:', responseData);

      if (activeTab === 'users') {
        setUsers(users.filter(user => user.id !== id));
      } else if (activeTab === 'products') {
        setProducts(products.filter(product => product.id !== id));
      } else if (activeTab === 'orders') {
        setOrders(orders.filter(order => order.id !== id));
      } else if (activeTab === 'taxes') {
        setTaxes(taxes.filter(tax => tax.id !== id));
      } else if (activeTab === 'paymentMethods') {
        setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
      }
      
      console.log(`Successfully deleted ${activeTab.slice(0, -1)} with ID:`, id);
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete ${activeTab.slice(0, -1)}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleToggleStatus = async (paymentMethod: PaymentMethod) => {
    try {
      const token = localStorage.getItem('authToken');
      const newActiveStatus = !paymentMethod.isActive;
      
      console.log(`Toggling payment method ${paymentMethod.name} to ${newActiveStatus ? 'active' : 'inactive'}`);
      
      const response = await fetch(`http://localhost:3001/api/payment-methods/${paymentMethod.id}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to toggle payment method status: ${response.status}`);
      }

      const updatedPaymentMethod = await response.json();
      
      // Update the payment methods list
      setPaymentMethods(prevMethods => 
        prevMethods.map(pm => 
          pm.id === paymentMethod.id 
            ? { ...pm, isActive: updatedPaymentMethod.isActive }
            : { ...pm, isActive: false } // Deactivate all others
        )
      );
      
      toast.success(updatedPaymentMethod.message || 'Payment method status updated successfully');
      
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error(`Failed to toggle payment method status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteTax = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // First check if tax can be deleted
      const checkResponse = await fetch(`http://localhost:3001/api/taxes/${id}/check-delete`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.canDelete === false) {
          const productNames = checkData.products.map((p: any) => p.name).join(', ');
          const message = `Cannot delete this tax. It is being used by: ${productNames}. Please remove or change the tax from these products first.`;
          setError(message);
          return;
        }
      }
      
      // If we get here, proceed with deletion
      if (window.confirm('Are you sure you want to delete this tax?')) {
        await handleDelete(id);
      }
    } catch (err) {
      console.error('Error checking tax deletion:', err);
      // Fall back to regular delete
      if (window.confirm('Are you sure you want to delete this tax?')) {
        await handleDelete(id);
      }
    }
  };

  const handleSave = async (formData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      let updatedItem: User | Product | Order | Tax;
  
      if (activeTab === 'orders' && modalType === 'edit') {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:3001/api/orders/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formData), // send the full order object
        });
        updatedItem = await response.json();
        setOrders(orders.map(order => order.id === updatedItem.id ? updatedItem as Order : order));
  
      } else if (activeTab === 'products') {
        // ✅ STEP 1: Create or update product
        const endpoint = 'products';
        const method = modalType === 'add' ? 'POST' : 'PATCH';
        const url = modalType === 'add'
          ? `http://localhost:3001/api/${endpoint}`
          : `http://localhost:3001/api/${endpoint}/${formData.id}`;
  
      
        const { imageFile, ...productData } = formData;
  
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
  
        updatedItem = await response.json();
  
     
        if (imageFile && updatedItem.id) {
          const imageFormData = new FormData();
          imageFormData.append('image', imageFile);
        
          const imageResponse = await fetch(`http://localhost:3001/api/products/${updatedItem.id}/image`, {
            method: 'POST',
            body: imageFormData,
          });
        
          const imageResult = await imageResponse.json();
          updatedItem = imageResult.product;
        }
  
        if (modalType === 'add') {
          setProducts([...products, updatedItem as Product]);
        } else {
          setProducts(products.map(product => product.id === updatedItem.id ? updatedItem as Product : product));
        }
  
      } else if (activeTab === 'taxes') {
        // Tax management
        console.log('=== Creating/Updating Tax ===');
        console.log('Form data:', formData);
        console.log('Modal type:', modalType);
        
        // Prepare tax data - only send rate and isActive
        const taxData = {
          rate: formData.rate,
          isActive: formData.isActive
        };
        
        const endpoint = 'taxes';
        const method = modalType === 'add' ? 'POST' : 'PUT';
        const url = modalType === 'add'
          ? `http://localhost:3001/api/${endpoint}`
          : `http://localhost:3001/api/${endpoint}/${formData.id}`;

        console.log('Request URL:', url);
        console.log('Request method:', method);
        console.log('Request payload:', JSON.stringify(taxData, null, 2));

        const response = await fetch(url, {
          method,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(taxData),
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Tax creation error response:', errorData);
          throw new Error(`Tax creation failed: ${response.status} ${response.statusText}`);
        }

        updatedItem = await response.json();
        console.log('Created/Updated tax:', updatedItem);

        if (modalType === 'add') {
          setTaxes([...taxes, updatedItem as Tax]);
        } else {
          setTaxes(taxes.map(tax => tax.id === updatedItem.id ? updatedItem as Tax : tax));
        }
      } else if (activeTab === 'paymentMethods') {
        // Payment Method management
        console.log('=== Creating/Updating Payment Method ===');
        console.log('Form data:', formData);
        console.log('Modal type:', modalType);
        
        const paymentMethodData = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          isActive: formData.isActive,
          config: formData.config || {}
        };
        
        const endpoint = 'payment-methods';
        const method = modalType === 'add' ? 'POST' : 'PUT';
        const url = modalType === 'add'
          ? `http://localhost:3001/api/${endpoint}`
          : `http://localhost:3001/api/${endpoint}/${formData.id}`;

        console.log('Request URL:', url);
        console.log('Request method:', method);
        console.log('Request payload:', JSON.stringify(paymentMethodData, null, 2));

        const response = await fetch(url, {
          method,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(paymentMethodData),
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Payment method creation error response:', errorData);
          
          // Try to parse the error message for better user feedback
          let errorMessage = 'Payment method creation failed';
          try {
            const parsedError = JSON.parse(errorData);
            if (parsedError.error) {
              errorMessage = parsedError.error;
            }
          } catch (e) {
            errorMessage = `Payment method creation failed: ${response.status} ${response.statusText}`;
          }
          
          throw new Error(errorMessage);
        }

        updatedItem = await response.json();
        console.log('Created/Updated payment method:', updatedItem);

        if (modalType === 'add') {
          setPaymentMethods([...paymentMethods, updatedItem as unknown as PaymentMethod]);
        } else {
          setPaymentMethods(paymentMethods.map(pm => pm.id === updatedItem.id ? updatedItem as unknown as PaymentMethod : pm));
        }
      } else {
        // Other tabs (users, orders)
        const endpoint = activeTab === 'users' ? 'users' : 'orders';
        const method = modalType === 'add' ? 'POST' : 'PATCH';
        const url = modalType === 'add'
          ? `http://localhost:3001/api/${endpoint}`
          : `http://localhost:3001/api/${endpoint}/${formData.id}`;

        // --- Fix: Only send user fields when updating a user ---
        let payload = formData;
        if (activeTab === 'users') {
          // Only keep allowed user fields
          const allowed = ['id', 'name', 'email', 'role', 'password', 'address'];
          payload = {};
          for (const key of allowed) {
            if (formData[key] !== undefined) payload[key] = formData[key];
          }
          // Flatten address fields if present
          if (payload.address) {
            payload.street = payload.address.street;
            payload.city = payload.address.city;
            payload.zipCode = payload.address.zipCode;
            payload.country = payload.address.country;
            delete payload.address;
          }
        }
        // --- End fix ---

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
  
        updatedItem = await response.json();
  
        if (activeTab === 'users') {
          setUsers(modalType === 'add'
            ? [...users, updatedItem as User]
            : users.map(user => user.id === updatedItem.id ? updatedItem as User : user));
        } else if (activeTab === 'orders') {
          setOrders(modalType === 'add'
            ? [...orders, updatedItem as Order]
            : orders.map(order => order.id === updatedItem.id ? updatedItem as Order : order));
        }
      }
  
      setShowModal(false);
  
    } catch (err) {
      setError(`Failed to ${modalType} ${activeTab.slice(0, -1)}.`);
      console.error(err);
    }
  };
  
  const StatsCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className={`rounded-2xl p-5 shadow-md border hover:shadow-lg transition-all duration-300 ${bg}`}>
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-xl bg-white/10 shadow-sm">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-xs text-white/80 mt-1">{title}</p>
        </div>
      </div>
    </div>
  );
  
  ///render users 
  const renderUsers = () => (
    <div className="space-y-6">
      <div className="bg-violet-50 rounded-2xl shadow-lg border border-violet-100/70 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('users')}</h3>
                <p className="text-sm text-gray-500">{t('admin_dashboard')}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {users?.length || 0} {t('users')}
            </div>
          </div>
        </div>
  
        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200/60">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('profile')}
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('role')}
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('address')}
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {users
                .filter(user => {
                  const name = user?.name || '';
                  const email = user?.email || '';
                  const term = searchTerm?.toLowerCase() || '';
                  return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
                })
                .map((user, index) => (
                  <tr
                    key={user.id || index}
                    className="group hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200"
                  >
                    {/* User Information */}
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {(user?.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-gray-900 truncate">{user?.name || 'Unknown User'}</p>
                            {user?.role === 'ADMIN' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <p className="text-sm text-gray-600 truncate">{user?.email || 'No email provided'}</p>
                          </div>
                        </div>
                      </div>
                    </td>
  
                    {/* Role */}
                    <td className="py-5 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user?.role === 'ADMIN'
                            ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200'
                            : 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border border-teal-200'
                        }`}
                      >
                        {user?.role === 'ADMIN' ? (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 12a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                        {user?.role || 'User'}
                      </span>
                    </td>
  
                    {/* Location */}
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user?.address && user.address.city
                              ? user.address.city
                              : 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user?.address && user.address.country
                              ? user.address.country
                              : 'No location'}
                          </p>
                        </div>
                      </div>
                    </td>
  
                    {/* Actions */}
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleView?.(user)}
                          className="group/btn p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-indigo-600 group-hover/btn:text-indigo-700" />
                        </button>
                        <button
                          onClick={() => handleEdit?.(user)}
                          className="group/btn p-2 hover:bg-amber-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4 text-amber-600 group-hover/btn:text-amber-700" />
                        </button>
                        <button
                          onClick={() => handleDelete?.(user?.id)}
                          className="group/btn p-2 hover:bg-rose-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600 group-hover/btn:text-rose-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
  
        {/* Empty State */}
        {users?.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no_users_found')}</h3>
            <p className="text-gray-500 max-w-sm mx-auto">{t('get_started_add_user')}</p>
          </div>
        )}
      </div>
    </div>
  );  
  /////render products
  const renderProducts = () => (
    <div className="space-y-6">
      <div className="bg-emerald-50 rounded-2xl shadow-lg border border-emerald-100/70 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('products')}</h3>
                <p className="text-sm text-gray-500">{t('manage_products_inventory')}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {products?.length || 0} {t('products')}
            </div>
          </div>
        </div>
  
        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200/60">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('product_information')}
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('price')}
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('stock_status')}
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {products
                ?.filter(product =>
                  product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  product.category.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((product, index) => {
                  const imagePath = product.image?.startsWith('/uploads/')
                    ? product.image
                    : `/uploads/${product.image}`;
  
                  return (
                    <tr
                      key={product.id || index}
                      className="group hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-teal-50/30 transition-all duration-200"
                    >
                      {/* Product Information */}
                      <td className="py-5 px-6">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <img
                              src={`http://localhost:3001${imagePath}`}
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover shadow-lg border border-gray-200/50"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                              {product.stock === 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <p className="text-sm text-gray-600 truncate">{product.category}</p>
                            </div>
                          </div>
                        </div>
                      </td>
  
                      {/* Price */}
                      <td className="py-5 px-6">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="font-bold text-lg text-gray-900">{product.price}</span>
                        </div>
                      </td>
  
                      {/* Stock Status */}
                      <td className="py-5 px-6">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                              product.stock > 10
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
                                : product.stock > 0
                                  ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200'
                                  : 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border-rose-200'
                            }`}
                          >
                            {product.stock > 0 ? (
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                            {product.stock} units
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
  
                      {/* Actions */}
                      <td className="py-5 px-6">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleView?.(product)}
                            className="group/btn p-2 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            title="View Product"
                          >
                            <Eye className="w-4 h-4 text-emerald-600 group-hover/btn:text-emerald-700" />
                          </button>
                          <button
                            onClick={() => handleEdit?.(product)}
                            className="group/btn p-2 hover:bg-amber-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4 text-amber-600 group-hover/btn:text-amber-700" />
                          </button>
                          <button
                            onClick={() => handleDelete?.(product.id)}
                            className="group/btn p-2 hover:bg-rose-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600 group-hover/btn:text-rose-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
  
        {/* Empty State */}
        {products?.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Get started by adding your first product to the catalog.</p>
          </div>
        )}
      </div>
    </div>
  );
  
  ////render orders

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-2xl shadow-lg border border-blue-100/70 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('admin_orders')}</h3>
                <p className="text-sm text-gray-500">{t('track_manage_orders')}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {orders?.length || 0} {t('admin_orders')}
            </div>
          </div>
        </div>
  
        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200/60">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('order_details')}
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('customer')}
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('amount')}
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {orders
                ?.filter(order => {
                  const user = users.find(u => u.id === order.userId);
                  const userName = user && user.name ? user.name.toLowerCase() : '';
                  const orderId = order.id ? order.id.toLowerCase() : '';
                  return (
                    orderId.includes(searchTerm.toLowerCase()) ||
                    userName.includes(searchTerm.toLowerCase())
                  );
                })
                .map((order, index) => {
                  const customer = users.find(u => u.id === order.userId);
                  
                  return (
                    <tr
                      key={order.id || index}
                      className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200"
                    >
                      {/* Order Details */}
                      <td className="py-5 px-6">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-mono text-sm font-bold text-gray-900">#{order.id}</p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200">
                                Order
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8h.01M3 9h18M3 14h18M3 19h18" />
                              </svg>
                              <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </td>
  
                      {/* Customer */}
                      <td className="py-5 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {customer?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{customer?.name || 'Unknown User'}</p>
                            <p className="text-sm text-gray-500">{customer?.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
  
                      {/* Amount */}
                      <td className="py-5 px-6">
                        <div className="flex items-center space-x-2">
                          
                          <span className="font-bold text-lg text-gray-900">{order.total.toFixed(2)}</span>
                          <span className="text-sm text-gray-500 font-medium">{getCurrencySymbol()}</span>
                        </div>
                      </td>
  
                      {/* Status */}
                      <td className="py-5 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            order.status === 'delivered'
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
                              : order.status === 'shipped'
                                ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200'
                                : order.status === 'processing'
                                  ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200'
                                  : order.status === 'cancelled'
                                    ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200'
                                    : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {order.status === 'delivered' ? (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : order.status === 'shipped' ? (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L15 6.586A1 1 0 0014.414 6H14v1z" />
                            </svg>
                          ) : order.status === 'processing' ? (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          ) : order.status === 'cancelled' ? (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zM9 9a1 1 0 100-2 1 1 0 000 2zM13 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          )}
                          {order.status}
                        </span>
                      </td>
  
                      {/* Actions */}
                      <td className="py-5 px-6">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleView?.(order)}
                            className="group/btn p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            title="View Order"
                          >
                            <Eye className="w-4 h-4 text-blue-600 group-hover/btn:text-blue-700" />
                          </button>
                          <button
                            onClick={() => handleEdit?.(order)}
                            className="group/btn p-2 hover:bg-amber-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            title="Edit Order"
                          >
                            <Edit className="w-4 h-4 text-amber-600 group-hover/btn:text-amber-700" />
                          </button>
                          <button
                            onClick={() => handleDelete?.(order.id)}
                            className="group/btn p-2 hover:bg-rose-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600 group-hover/btn:text-rose-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
  
        {/* Empty State */}
        {orders?.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Orders will appear here when customers start placing them.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl animate-pulse mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate total chiffre d'affaires (potential revenue from stock)
  const totalRevenue = products.reduce((sum, product) => sum + ((product.stock || 0) * (product.price || 0)), 0);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AdminHeader
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        handleView={handleView}
        setNotifications={setNotifications}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 rounded-3xl shadow-xl border border-gray-100">
        <StatsCards users={users} products={products} orders={orders} totalRevenue={totalRevenue} />
        <TabBar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          users={users} 
          products={products} 
          orders={orders} 
          taxes={taxes}
          paymentMethods={paymentMethods}
          onAddNew={handleAddNew} 
        />
        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'users' && <UsersTable users={users} searchTerm={searchTerm} handleView={handleView} handleEdit={handleEdit} handleDelete={handleDelete} />}
          {activeTab === 'products' && <ProductsTable products={products} searchTerm={searchTerm} handleView={handleView} handleEdit={handleEdit} handleDelete={handleDelete} taxes={taxes} />}
          {activeTab === 'orders' && <OrdersTable orders={orders} users={users} searchTerm={searchTerm} handleView={handleView} handleEdit={handleEdit} handleDelete={handleDelete} />}
          {activeTab === 'taxes' && <TaxesTable taxes={taxes} searchTerm={searchTerm} handleView={handleView} handleEdit={handleEdit} handleDelete={handleDeleteTax} />}
          {activeTab === 'paymentMethods' && <PaymentMethodsTable paymentMethods={paymentMethods} searchTerm={searchTerm} handleView={handleView} handleEdit={handleEdit} handleDelete={handleDelete} handleToggleStatus={handleToggleStatus} />}
        </div>
        {showModal && (
          <Modal
            modalType={modalType}
            showModal={showModal}
            setShowModal={setShowModal}
            selectedItem={selectedItem}
            handleSave={handleSave}
            activeTab={activeTab}
            users={users}
            products={products}
            orders={orders}
            taxes={taxes}
            paymentMethods={paymentMethods}
          />
        )}
        
        {/* Invoice Modal */}
        {showInvoiceModal && selectedOrder && (
          <InvoiceModal 
            order={selectedOrder} 
            user={users.find(u => u.id === selectedOrder.userId) || { name: 'Unknown', email: 'unknown@example.com' } as User}
            onClose={() => setShowInvoiceModal(false)} 
          />
        )}
      </main>
      
    </div>
  );

};

export default AdminDashboard;