import React, { useState, useEffect } from 'react';
import { Building, Palette, Eye, Upload, Save, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InvoiceSettings {
  companyName: string;
  companyTagline: string;
  companyEmail: string;
  companyWebsite: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  paymentText: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const InvoiceSettings = () => {
  const [settings, setSettings] = useState<InvoiceSettings>({
    companyName: 'E-Shop',
    companyTagline: 'Your Trusted Online Store',
    companyEmail: 'contact@e-shop.com',
    companyWebsite: 'e-shop.com',
    companyAddress: '123 Business Street',
    companyCity: 'Tunis',
    companyCountry: 'Tunisia',
    paymentText: 'Payment to E-Shop',
    logoUrl: '',
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    accentColor: '#3B82F6'
  });

  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  // Load settings from backend when component mounts
  useEffect(() => {
    loadSettings();
  }, []);

  // Load settings from backend
  const loadSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/invoice');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        // If there's a saved logo, load it
        if (data.settings.logoUrl) {
          setLogoPreview(data.settings.logoUrl);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // First upload logo if there's a new one
      let logoUrl = settings.logoUrl;
      if (logoPreview && logoPreview !== settings.logoUrl) {
        const formData = new FormData();
        const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
        if (fileInput?.files?.[0]) {
          formData.append('logo', fileInput.files[0]);
          
          const uploadResponse = await fetch('http://localhost:3001/api/settings/upload-logo', {
            method: 'POST',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            logoUrl = uploadData.logoUrl;
            setSettings(prev => ({ ...prev, logoUrl }));
          }
        }
      }

      // Then save all settings
      const saveResponse = await fetch('http://localhost:3001/api/settings/invoice', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...settings,
          logoUrl
        })
      });

      if (saveResponse.ok) {
        toast.success('Settings saved successfully!');
        // Update local state with the new logo URL
        if (logoUrl !== settings.logoUrl) {
          setLogoPreview(logoUrl);
        }
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      companyName: '',
      companyTagline: '',
      companyEmail: '',
      companyWebsite: '',
      companyAddress: '',
      companyCity: '',
      companyCountry: '',
      paymentText: '',
      logoUrl: '',
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      accentColor: '#3B82F6'
    });
    setLogoPreview('');
  };

  const updateField = (field: keyof InvoiceSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: Building },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'preview', label: 'Preview', icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Logo Display */}
              {logoPreview ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10">
                  <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              ) : settings.logoUrl ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10">
                  <img src={settings.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl border-2 border-white/20 bg-white/10"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {settings.companyName.charAt(0) || 'C'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">Invoice Settings</h1>
                <p className="text-purple-100 mt-1">
                  {settings.companyName || 'Company Name'} - Customize your invoice appearance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-xl shadow-lg">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
              {activeTab === 'company' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">Company Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors"
                        placeholder="Your Company Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tagline</label>
                      <input
                        type="text"
                        value={settings.companyTagline}
                        onChange={(e) => updateField('companyTagline', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="Your Company Tagline"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={settings.companyEmail}
                        onChange={(e) => updateField('companyEmail', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="contact@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Website</label>
                      <input
                        type="text"
                        value={settings.companyWebsite}
                        onChange={(e) => updateField('companyWebsite', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="company.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={settings.companyAddress}
                        onChange={(e) => updateField('companyAddress', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="Street Address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                      <input
                        type="text"
                        value={settings.companyCity}
                        onChange={(e) => updateField('companyCity', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={settings.companyCountry}
                        onChange={(e) => updateField('companyCountry', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="Country"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Text</label>
                      <input
                        type="text"
                        value={settings.paymentText}
                        onChange={(e) => updateField('paymentText', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="Payment instructions"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'branding' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">Logo & Colors</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Company Logo</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-slate-50 transition-all group"
                      >
                        {logoPreview ? (
                          <div className="relative w-full h-full">
                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain rounded-xl" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all flex items-center justify-center">
                              <Upload className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>
                          </div>
                        ) : settings.logoUrl ? (
                          <div className="relative w-full h-full">
                            <img src={settings.logoUrl} alt="Logo preview" className="w-full h-full object-contain rounded-xl" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all flex items-center justify-center">
                              <Upload className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                            <p className="text-slate-600 font-medium">Upload Logo</p>
                            <p className="text-slate-400 text-sm">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { field: 'primaryColor' as keyof InvoiceSettings, label: 'Primary Color', description: 'Main brand color' },
                      { field: 'secondaryColor' as keyof InvoiceSettings, label: 'Secondary Color', description: 'Accent highlights' },
                      { field: 'accentColor' as keyof InvoiceSettings, label: 'Accent Color', description: 'Additional elements' }
                    ].map(color => (
                      <div key={color.field} className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">{color.label}</label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <input
                              type="color"
                              value={settings[color.field]}
                              onChange={(e) => updateField(color.field, e.target.value)}
                              className="w-16 h-12 border-2 border-slate-200 rounded-xl cursor-pointer"
                            />
                            <div 
                              className="absolute inset-1 rounded-lg pointer-events-none"
                              style={{ backgroundColor: settings[color.field] }}
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={settings[color.field]}
                              onChange={(e) => updateField(color.field, e.target.value)}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors font-mono"
                            />
                            <p className="text-xs text-slate-500 mt-1">{color.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">Invoice Preview</h3>
                  
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 shadow-lg">
                    {/* Invoice Header */}
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        {logoPreview ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200">
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                          </div>
                        ) : settings.logoUrl ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200">
                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div 
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl border-2"
                            style={{ 
                              backgroundColor: settings.primaryColor,
                              borderColor: settings.primaryColor
                            }}
                          >
                            {settings.companyName.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <h1 
                            className="text-2xl font-bold"
                            style={{ color: settings.primaryColor }}
                          >
                            {settings.companyName || 'Company Name'}
                          </h1>
                          <p className="text-slate-600">{settings.companyTagline || 'Your company tagline'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h2 
                          className="text-3xl font-bold"
                          style={{ color: settings.secondaryColor }}
                        >
                          INVOICE
                        </h2>
                        <p className="text-slate-600">#INV-2025-001</p>
                      </div>
                    </div>

                    {/* Company Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">From:</h3>
                        <div className="space-y-1 text-slate-600">
                          <p>{settings.companyEmail || 'contact@company.com'}</p>
                          <p>{settings.companyWebsite || 'company.com'}</p>
                          <p>{settings.companyAddress || 'Company Address'}</p>
                          <p>{settings.companyCity || 'City'}, {settings.companyCountry || 'Country'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Bill To:</h3>
                        <div className="space-y-1 text-slate-600">
                          <p>Customer Name</p>
                          <p>customer@email.com</p>
                          <p>Customer Address</p>
                          <p>Customer City, Country</p>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Items */}
                    <div className="border-2 border-slate-100 rounded-xl overflow-hidden mb-6">
                      <div 
                        className="px-6 py-4 font-semibold text-white"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        <div className="grid grid-cols-4 gap-4">
                          <span>Item</span>
                          <span>Quantity</span>
                          <span>Price</span>
                          <span>Total</span>
                        </div>
                      </div>
                      <div className="px-6 py-4 text-slate-700">
                        <div className="grid grid-cols-4 gap-4">
                          <span>Sample Product</span>
                          <span>2</span>
                          <span>$50.00</span>
                          <span>$100.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-end mb-6">
                      <div className="w-64">
                        <div className="flex justify-between py-2 border-b border-slate-200">
                          <span className="text-slate-600">Subtotal:</span>
                          <span className="font-semibold">$100.00</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-200">
                          <span className="text-slate-600">Tax:</span>
                          <span className="font-semibold">$10.00</span>
                        </div>
                        <div 
                          className="flex justify-between py-3 text-lg font-bold text-white px-4 rounded-lg mt-2"
                          style={{ backgroundColor: settings.accentColor }}
                        >
                          <span>Total:</span>
                          <span>$110.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Text */}
                    <div 
                      className="text-center py-4 px-6 rounded-xl"
                      style={{ backgroundColor: `${settings.primaryColor}15`, color: settings.primaryColor }}
                    >
                      <p className="font-semibold">{settings.paymentText || 'Payment instructions will appear here'}</p>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === 'company' || activeTab === 'branding') && (
                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-200">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                  >
                    <RotateCcw size={18} />
                    Reset
                  </button>
                  
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200 sticky top-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Preview</h3>
              
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border-2 border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  {logoPreview ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300">
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : settings.logoUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300">
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      {settings.companyName.charAt(0) || 'C'}
                    </div>
                  )}
                  <div>
                    <h3 
                      className="font-bold text-sm"
                      style={{ color: settings.primaryColor }}
                    >
                      {settings.companyName || 'Company Name'}
                    </h3>
                    <p className="text-xs text-slate-500">{settings.companyTagline || 'Tagline'}</p>
                  </div>
                </div>
                
                <div className="text-xs text-slate-600 space-y-1">
                  <div>{settings.companyEmail || 'email@company.com'}</div>
                  <div>{settings.companyWebsite || 'company.com'}</div>
                  <div>
                    {settings.companyAddress || 'Address'}, {settings.companyCity || 'City'}, {settings.companyCountry || 'Country'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-300">
                  <div className="flex gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: settings.primaryColor }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: settings.secondaryColor }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: settings.accentColor }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${settings.primaryColor}15` }}>
                <p className="text-xs text-slate-600">
                  <span 
                    className="font-semibold"
                    style={{ color: settings.primaryColor }}
                  >
                    Payment: 
                  </span>
                  {' ' + (settings.paymentText || 'Payment instructions')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSettings;