import React, { useState, useEffect } from 'react';
import { Building, Palette, Eye, Upload, Save, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLogo } from '../contexts/LogoContext';
import { useInvoiceSettings, type InvoiceSettings } from '../contexts/InvoiceSettingsContext';



const InvoiceSettings: React.FC = () => {
  const { updateLogo } = useLogo(); // Use global logo context
  const { settings, pendingSettings, updatePendingSettings, updateSettings, refreshSettings, commitPendingSettings } = useInvoiceSettings(); // Use shared context
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  // Load settings from backend when component mounts
  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Settings changed
  }, [settings]);

  // Load settings from backend
  const loadSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/invoice');
      if (response.ok) {
        const data = await response.json();
        updateSettings(data.settings); // Update the shared context
        updatePendingSettings(data.settings); // Also update pending settings
        // If there's a saved logo, load it and update header
        if (data.settings.logoUrl) {
          setLogoPreview(data.settings.logoUrl);
          // Update header logo with loaded settings
          updateLogo(data.settings.logoUrl);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (PNG, JPG, JPEG, GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result && result.startsWith('data:image/')) {
          // Create a new image to test if it loads correctly
          const img = new Image();
          img.onload = () => {
            setLogoPreview(result);
            // Don't update header logo immediately - only on save
            toast.success('Logo loaded successfully!');
          };
          img.onerror = () => {
            toast.error('Failed to load image. Please try another file.');
          };
          img.src = result;
        } else {
          toast.error('Failed to read image file');
        }
      };
      
      reader.onerror = () => {
        toast.error('Error reading file');
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // First upload logo if there's a new one
      let logoUrl = pendingSettings.logoUrl;
      if (logoPreview && logoPreview !== pendingSettings.logoUrl) {
        const formData = new FormData();
        const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
        if (fileInput?.files?.[0]) {
          formData.append('logo', fileInput.files[0]);
          
          const uploadResponse = await fetch('http://localhost:3001/api/settings/upload-logo', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            logoUrl = uploadData.logoUrl;
            updatePendingSettings({ ...pendingSettings, logoUrl }); // Update pending settings
            // Don't update header logo immediately - only on commit
          } else {
            const errorText = await uploadResponse.text();
            toast.error(`Logo upload failed: ${uploadResponse.status} - ${errorText}`);
            setLoading(false);
            return; // Stop here if logo upload fails
          }
        } else {
          // No file selected for upload, using existing logo
        }
      }

      // Then save all settings
      const saveResponse = await fetch('http://localhost:3001/api/settings/invoice', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...pendingSettings,
          logoUrl
        })
      });

      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        toast.success('Settings saved successfully!');
        // Update local state with the new logo URL
        if (logoUrl !== pendingSettings.logoUrl) {
          setLogoPreview(logoUrl);
        }
        // Commit pending settings to update the header (including logo)
        commitPendingSettings();
        // Update header logo after committing settings
        if (logoUrl) {
          updateLogo(logoUrl);
        }
        // Refresh the shared context to ensure all components are updated
        await refreshSettings();
      } else {
        const errorText = await saveResponse.text();
        toast.error(`Failed to save settings: ${saveResponse.status} - ${errorText}`);
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    updatePendingSettings({
      companyName: '',
      companyTagline: '',
      companyEmail: '',
      companyWebsite: '',
      companyAddress: '',
      companyCity: '',
      companyCountry: '',
      companyPhone: '',
      paymentText: '',
      logoUrl: '',
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      accentColor: '#3B82F6',
      fiscalInformation: ''
    });
    setLogoPreview('');
  };

  const updateField = (field: keyof InvoiceSettings, value: string) => {
    const newSettings = { ...pendingSettings, [field]: value };
    updatePendingSettings(newSettings);
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
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10">
                  <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              ) : pendingSettings.logoUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10">
                  <img src={pendingSettings.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl border-2 border-white/20 bg-white/10"
                  style={{ backgroundColor: pendingSettings.primaryColor }}
                >
                  {pendingSettings.companyName.charAt(0) || 'C'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-purple-100 mt-1">
                  {pendingSettings.companyName || 'Company Name'} - Customize your settings
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
                        value={pendingSettings.companyName || ''}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors"
                        placeholder="Your Company Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tagline</label>
                      <input
                        type="text"
                        value={pendingSettings.companyTagline || ''}
                        onChange={(e) => updateField('companyTagline', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="Your Company Tagline"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={pendingSettings.companyEmail || ''}
                        onChange={(e) => updateField('companyEmail', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="contact@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Website</label>
                      <input
                        type="text"
                        value={pendingSettings.companyWebsite || ''}
                        onChange={(e) => updateField('companyWebsite', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="company.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={pendingSettings.companyAddress || ''}
                        onChange={(e) => updateField('companyAddress', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="Street Address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                      <input
                        type="text"
                        value={pendingSettings.companyCity || ''}
                        onChange={(e) => updateField('companyCity', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={pendingSettings.companyCountry || ''}
                        onChange={(e) => updateField('companyCountry', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="Country"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={pendingSettings.companyPhone || ''}
                        onChange={(e) => updateField('companyPhone', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="+216 99 999 999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={pendingSettings.companyWebsite || ''}
                        onChange={(e) => updateField('companyWebsite', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                        placeholder="https://www.example.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Text</label>
                      <input
                        type="text"
                        value={pendingSettings.paymentText || ''}
                        onChange={(e) => updateField('paymentText', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors"
                        placeholder="Payment instructions"
                      />
                    </div>

                    {/* Fiscal Information Section */}
                    <div className="md:col-span-2">
                      <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Fiscal Information</h4>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Fiscal Information</label>
                      <textarea
                        value={pendingSettings.fiscalInformation || ''}
                        onChange={(e) => updateField('fiscalInformation', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors"
                        placeholder="Enter fiscal information (e.g., Tax ID: 123456, VAT: FR12345678901)"
                        rows={3}
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
                          <div className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                            <img 
                              src={logoPreview} 
                              alt="Logo preview" 
                              className="w-24 h-24 object-contain" 
                              onError={(e) => {
                                console.error('Image failed to load:', logoPreview);
                                toast.error('Failed to load image preview');
                              }}
                            />
                          </div>
                        ) : pendingSettings.logoUrl ? (
                          <div className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                            <img 
                              src={pendingSettings.logoUrl} 
                              alt="Logo preview" 
                              className="w-24 h-24 object-contain" 
                              onError={(e) => {
                                console.error('Image failed to load:', pendingSettings.logoUrl);
                                toast.error('Failed to load saved logo');
                              }}
                            />
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
                              value={pendingSettings[color.field] || '#000000'}
                              onChange={(e) => updateField(color.field, e.target.value)}
                              className="w-16 h-12 border-2 border-slate-200 rounded-xl cursor-pointer"
                            />
                            <div 
                              className="absolute inset-1 rounded-lg pointer-events-none"
                              style={{ backgroundColor: pendingSettings[color.field] }}
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={pendingSettings[color.field] || ''}
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
                          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200">
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                          </div>
                        ) : pendingSettings.logoUrl ? (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200">
                            <img src={pendingSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div 
                            className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-xl border-2"
                            style={{ 
                              backgroundColor: pendingSettings.primaryColor,
                              borderColor: pendingSettings.primaryColor
                            }}
                          >
                            {pendingSettings.companyName.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <h1 
                            className="text-2xl font-bold"
                            style={{ color: pendingSettings.primaryColor }}
                          >
                            {pendingSettings.companyName || 'Company Name'}
                          </h1>
                          <p className="text-slate-600">{pendingSettings.companyTagline || 'Your company tagline'}</p>
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
                        <div className="space-y-1 text-slate-600">
                          <p>{pendingSettings.companyAddress || '123 Business Street'}</p>
                          <p>{pendingSettings.companyCity || 'Tunis'}, {pendingSettings.companyCountry || 'Tunisia'}</p>
                          {pendingSettings.companyEmail && (
                            <p className="text-sm text-slate-500">{pendingSettings.companyEmail}</p>
                          )}
                          {pendingSettings.companyPhone && (
                            <p className="text-sm text-slate-500">{pendingSettings.companyPhone}</p>
                          )}
                          {pendingSettings.companyWebsite && (
                            <p className="text-sm text-slate-500">{pendingSettings.companyWebsite}</p>
                          )}
                        
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

                    {/* Footer with company information */}
                    <div className="pt-4 border-t border-gray-200">
                      {/* Company Information Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        {/* Left side - Company Details */}
                        <div className="text-xs text-gray-600">
                          <h4 className="font-semibold text-gray-800 mb-2" style={{ color: settings.primaryColor }}>
                            {settings.companyName}
                          </h4>
                          <div className="space-y-1">
                            {settings.companyAddress && (
                              <div>{settings.companyAddress}</div>
                            )}
                            {(settings.companyCity || settings.companyCountry) && (
                              <div>
                                {settings.companyCity && `${settings.companyCity}`}
                                {settings.companyCity && settings.companyCountry && ', '}
                                {settings.companyCountry}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right side - Fiscal Information */}
                        <div className="text-xs text-gray-600 text-right">
                          <h4 className="font-semibold text-gray-800 mb-2" style={{ color: settings.primaryColor }}>
                            Informations Fiscales
                          </h4>
                          <div className="space-y-1">
                            {settings.fiscalInformation && (
                              <div>
                                {settings.fiscalInformation.split('\n').map((line, index) => (
                                  <div key={index}>{line}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Thank You Message */}
                      <div 
                        className="text-center text-xs font-semibold"
                        style={{ color: settings.primaryColor }}
                      >
                        Merci
                      </div>
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
                     <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-300">
                       <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                     </div>
                   ) : pendingSettings.logoUrl ? (
                     <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-300">
                       <img src={pendingSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                     </div>
                   ) : (
                     <div 
                       className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                       style={{ backgroundColor: pendingSettings.primaryColor }}
                     >
                       {pendingSettings.companyName.charAt(0) || 'C'}
                     </div>
                   )}
                  <div>
                    <h3 
                      className="font-bold text-sm"
                      style={{ color: pendingSettings.primaryColor }}
                    >
                      {pendingSettings.companyName || 'Company Name'}
                    </h3>
                    <p className="text-xs text-slate-500">{pendingSettings.companyTagline || 'Tagline'}</p>
                  </div>
                </div>
                
                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    {pendingSettings.companyAddress || 'Address'}, {pendingSettings.companyCity || 'City'}, {pendingSettings.companyCountry || 'Country'}
                  </div>
                  {pendingSettings.companyEmail && (
                    <div className="text-xs text-slate-500">{pendingSettings.companyEmail}</div>
                  )}
                  {pendingSettings.companyPhone && (
                    <div className="text-xs text-slate-500">{pendingSettings.companyPhone}</div>
                  )}
                  {pendingSettings.companyWebsite && (
                    <div className="text-xs text-slate-500">{pendingSettings.companyWebsite}</div>
                  )}
                 
                  {pendingSettings.fiscalInformation && (
                    <div className="text-xs text-slate-500">
                      {pendingSettings.fiscalInformation.split('\n').map((line, index) => (
                        <div key={index}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-300">
                  <div className="flex gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: pendingSettings.primaryColor }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: pendingSettings.secondaryColor }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: pendingSettings.accentColor }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${pendingSettings.primaryColor}15` }}>
                <p className="text-xs text-slate-600">
                  <span 
                    className="font-semibold"
                    style={{ color: pendingSettings.primaryColor }}
                  >
                    Payment: 
                  </span>
                  {' ' + (pendingSettings.paymentText || 'Payment instructions')}
                </p>
              </div>

              {/* Footer Preview */}
              <div className="mt-4 pt-3 border-t border-slate-300">
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-medium" style={{ color: pendingSettings.primaryColor }}>
                    {pendingSettings.companyName || 'Company Name'}
                  </div>
                  <div>{pendingSettings.companyAddress || 'Address'}, {pendingSettings.companyCity || 'City'}, {pendingSettings.companyCountry || 'Country'}</div>
                  
                  {/* Fiscal Information Preview */}
                  {pendingSettings.fiscalInformation && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <div className="font-medium text-slate-700 mb-1">Informations Fiscales:</div>
                      <div className="text-xs">
                        {pendingSettings.fiscalInformation.split('\n').map((line, index) => (
                          <div key={index}>{line}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSettings;