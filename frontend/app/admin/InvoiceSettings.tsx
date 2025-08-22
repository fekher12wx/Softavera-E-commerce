import React, { useState, useEffect } from 'react';
import { Building, Palette, Eye, Save, RotateCcw, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLogo } from '../contexts/LogoContext';
import { useInvoiceSettings, type InvoiceSettings } from '../contexts/InvoiceSettingsContext';

const InvoiceSettings: React.FC = () => {
  const { updateLogo } = useLogo();
  const { settings, pendingSettings, updatePendingSettings, updateSettings, refreshSettings, commitPendingSettings } = useInvoiceSettings();
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/invoice');
      if (response.ok) {
        const data = await response.json();
        updateSettings(data.settings);
        updatePendingSettings(data.settings);
        if (data.settings.logoUrl) {
          setLogoPreview(data.settings.logoUrl);
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
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (PNG, JPG, JPEG, GIF)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result && result.startsWith('data:image/')) {
          const img = new Image();
          img.onload = () => {
            setLogoPreview(result);
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
      let logoUrl = pendingSettings.logoUrl;
      if (logoPreview && logoPreview !== pendingSettings.logoUrl) {
        const formData = new FormData();
        let fileInput = document.getElementById('logo-upload') as HTMLInputElement;
        
        if (fileInput?.files?.[0]) {
          formData.append('logo', fileInput.files[0]);
        } else if (logoPreview && logoPreview.startsWith('data:image/')) {
          try {
            const response = await fetch(logoPreview);
            const blob = await response.blob();
            const file = new File([blob], 'logo.png', { type: blob.type });
            formData.append('logo', file);
          } catch (error) {
            console.error('Error converting data URL to file:', error);
            toast.error('Failed to process logo file');
            setLoading(false);
            return;
          }
        } else {
          logoUrl = logoPreview || pendingSettings.logoUrl;
        }
        
        if (formData.has('logo')) {
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
            updatePendingSettings({ ...pendingSettings, logoUrl });
          } else {
            const errorText = await uploadResponse.text();
            toast.error(`Logo upload failed: ${uploadResponse.status} - ${errorText}`);
            setLoading(false);
            return;
          }
        }
      }

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
        toast.success('Settings saved successfully!');
        if (logoUrl !== pendingSettings.logoUrl) {
          setLogoPreview(logoUrl);
        }
        commitPendingSettings();
        if (logoUrl) {
          updateLogo(logoUrl);
        }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Logo Display with Camera Button Overlay */}
              <div className="relative group">
                <label htmlFor="logo-upload" className="cursor-pointer">
                  {logoPreview ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10 relative">
                      <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain" />
                      {/* Small camera button overlay */}
                      <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div 
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1.5 shadow-lg cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowBrandingModal(true);
                          }}
                        >
                          <Camera size={12} />
                        </div>
                      </div>
                    </div>
                  ) : pendingSettings.logoUrl ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10 relative">
                      <img src={pendingSettings.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                      {/* Small camera button overlay */}
                      <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div 
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1.5 shadow-lg cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowBrandingModal(true);
                          }}
                        >
                          <Camera size={12} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl border-2 border-white/20 bg-white/10 relative"
                      style={{ backgroundColor: pendingSettings.primaryColor }}
                    >
                      {pendingSettings.companyName?.charAt(0) || 'C'}
                      {/* Small camera button overlay */}
                      <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div 
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1.5 shadow-lg cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowBrandingModal(true);
                          }}
                        >
                          <Camera size={12} />
                        </div>
                      </div>
                    </div>
                  )}
                </label>
              </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
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
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={pendingSettings.companyCountry || ''}
                      onChange={(e) => updateField('companyCountry', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                      placeholder="Country"
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

                {/* Action Buttons */}
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
              </div>
            </div>
          </div>

          {/* Live Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200 sticky top-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Preview</h3>
              
              {/* Compact Preview Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 space-y-4">
                
                {/* Header Section */}
                <div className="flex items-center gap-3">
                   {logoPreview || pendingSettings.logoUrl ? (
                     <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white">
                       <img 
                         src={logoPreview || pendingSettings.logoUrl} 
                         alt="Logo" 
                         className="w-full h-full object-contain p-1" 
                       />
                     </div>
                   ) : (
                     <div 
                       className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm border-2 border-white"
                       style={{ backgroundColor: pendingSettings.primaryColor || '#8B5CF6' }}
                     >
                       {pendingSettings.companyName?.charAt(0) || 'C'}
                     </div>
                   )}
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-bold text-base truncate"
                      style={{ color: pendingSettings.primaryColor || '#8B5CF6' }}
                    >
                      {pendingSettings.companyName || 'Company Name'}
                    </h3>
                    {pendingSettings.companyTagline && (
                      <p className="text-sm text-slate-600 truncate">{pendingSettings.companyTagline}</p>
                    )}
                  </div>
                </div>
                
                {/* Contact Info - Only if filled */}
                {(pendingSettings.companyEmail || pendingSettings.companyPhone || pendingSettings.companyWebsite) && (
                  <div className="text-xs text-slate-600 space-y-1 bg-white rounded-lg p-3">
                    {pendingSettings.companyEmail && (
                      <div className="truncate">📧 {pendingSettings.companyEmail}</div>
                    )}
                    {pendingSettings.companyPhone && (
                      <div className="truncate">📞 {pendingSettings.companyPhone}</div>
                    )}
                    {pendingSettings.companyWebsite && (
                      <div className="truncate">🌐 {pendingSettings.companyWebsite}</div>
                    )}
                  </div>
                )}

                {/* Address - Only if filled */}
                {(pendingSettings.companyAddress || pendingSettings.companyCity || pendingSettings.companyCountry) && (
                  <div className="text-xs text-slate-600 bg-white rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span>📍</span>
                      <div className="space-y-0.5">
                        {pendingSettings.companyAddress && <div>{pendingSettings.companyAddress}</div>}
                        <div>
                          {[pendingSettings.companyCity, pendingSettings.companyCountry].filter(Boolean).join(', ') || 'City, Country'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Color Palette */}
                <div className="flex items-center justify-between bg-white rounded-lg p-3">
                  <span className="text-xs font-medium text-slate-700">Brand Colors</span>
                  <div className="flex gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: pendingSettings.primaryColor || '#8B5CF6' }}
                      title="Primary"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: pendingSettings.secondaryColor || '#EC4899' }}
                      title="Secondary"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: pendingSettings.accentColor || '#3B82F6' }}
                      title="Accent"
                    />
                  </div>
                </div>

                {/* Payment Info - Only if filled */}
                {pendingSettings.paymentText && (
                  <div className="text-xs p-3 rounded-lg border-l-4" 
                       style={{ 
                         backgroundColor: `${pendingSettings.primaryColor || '#8B5CF6'}08`,
                         borderLeftColor: pendingSettings.primaryColor || '#8B5CF6'
                       }}>
                    <div className="font-medium text-slate-700 mb-1">Payment Info</div>
                    <div className="text-slate-600">{pendingSettings.paymentText}</div>
                  </div>
                )}

                {/* Fiscal Info - Only if filled */}
                {pendingSettings.fiscalInformation && (
                  <div className="text-xs p-3 rounded-lg bg-slate-100">
                    <div className="font-medium text-slate-700 mb-1">Fiscal Information</div>
                    <div className="text-slate-600 space-y-0.5">
                      {pendingSettings.fiscalInformation.split('\n').map((line, index) => (
                        line.trim() && <div key={index} className="truncate">{line.trim()}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Full Preview Button */}
              <button
                onClick={() => setShowPreviewModal(true)}
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Full Invoice Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Branding Modal */}
      {showBrandingModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowBrandingModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Logo & Branding Settings
              </h3>
              <button
                onClick={() => setShowBrandingModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Branding Tab Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
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
                    
                    {/* Facebook-style Logo Display with Change Button */}
                    <div className="relative group">
                      <label
                        htmlFor="logo-upload"
                        className="block cursor-pointer"
                      >
                        {logoPreview ? (
                          <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-gray-300 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                            <img 
                              src={logoPreview} 
                              alt="Logo preview" 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                console.error('Image failed to load:', logoPreview);
                                toast.error('Failed to load image preview');
                              }}
                            />
                            {/* Small camera button overlay */}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 shadow-lg cursor-pointer">
                                <Camera size={16} />
                              </div>
                            </div>
                          </div>
                        ) : pendingSettings.logoUrl ? (
                          <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-gray-300 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                            <img 
                              src={pendingSettings.logoUrl} 
                              alt="Logo preview" 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                console.error('Image failed to load:', pendingSettings.logoUrl);
                                toast.error('Failed to load saved logo');
                              }}
                            />
                            {/* Small camera button overlay */}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 shadow-lg cursor-pointer">
                                <Camera size={16} />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-gray-300 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                            <span className="text-white font-bold text-4xl">
                              {pendingSettings.companyName?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                            {/* Small camera button overlay */}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 shadow-lg cursor-pointer">
                                <Camera size={16} />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Change Text */}
                        <div className="text-center mt-3">
                          <p className="text-slate-600 font-medium text-sm">Click to change logo</p>
                          <p className="text-slate-400 text-xs">PNG, JPG up to 5MB</p>
                        </div>
                      </label>
                    </div>
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
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors font-mono"
                            onChange={(e) => updateField(color.field, e.target.value)}
                          />
                          <p className="text-xs text-slate-500 mt-1">{color.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowBrandingModal(false)}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        await handleSave();
                        setShowBrandingModal(false);
                        toast.success('Branding settings saved successfully!');
                      } catch (error) {
                        console.error('Error saving branding settings:', error);
                        toast.error('Failed to save branding settings');
                      }
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {showPreviewModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Invoice Preview
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Invoice Preview */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
              <div className="bg-white border border-slate-300 rounded-lg shadow-sm max-w-3xl mx-auto">
                {/* Invoice Header */}
                <div className="flex items-start justify-between p-8 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : pendingSettings.logoUrl ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                        <img src={pendingSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-lg flex items-center justify-center text-white font-bold text-lg border border-slate-200"
                        style={{ backgroundColor: pendingSettings.primaryColor || '#8B5CF6' }}
                      >
                        {pendingSettings.companyName?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <h1 
                        className="text-2xl font-bold text-slate-800"
                        style={{ color: pendingSettings.primaryColor || '#8B5CF6' }}
                      >
                        {pendingSettings.companyName || 'Company Name'}
                      </h1>
                      <p className="text-slate-600 mt-1">{pendingSettings.companyTagline || 'Your company tagline'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 
                      className="text-3xl font-bold text-slate-800"
                      style={{ color: pendingSettings.secondaryColor || '#EC4899' }}
                    >
                      INVOICE
                    </h2>
                    <p className="text-slate-600 mt-1">#INV-2025-001</p>
                    <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Company Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 border-b border-slate-200">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3 text-lg">From:</h3>
                    <div className="space-y-2 text-slate-600">
                      <p className="font-medium">{pendingSettings.companyName || 'Company Name'}</p>
                      {pendingSettings.companyAddress && (
                        <p>{pendingSettings.companyAddress}</p>
                      )}
                      <p>
                        {pendingSettings.companyCity || 'City'}, {pendingSettings.companyCountry || 'Country'}
                      </p>
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
                    <h3 className="font-semibold text-slate-800 mb-3 text-lg">Bill To:</h3>
                    <div className="space-y-2 text-slate-600">
                      <p className="font-medium">Customer Name</p>
                      <p>customer@email.com</p>
                      <p>Customer Address</p>
                      <p>Customer City, Country</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="overflow-hidden">
                  <div 
                    className="px-8 py-4 font-semibold text-white"
                    style={{ backgroundColor: pendingSettings.primaryColor || '#8B5CF6' }}
                  >
                    <div className="grid grid-cols-4 gap-4">
                      <span>Description</span>
                      <span>Qty</span>
                      <span>Unit Price</span>
                      <span>Amount</span>
                    </div>
                  </div>
                  <div className="px-8 py-4 text-slate-700 border-b border-slate-200">
                    <div className="grid grid-cols-4 gap-4">
                      <span>Sample Product/Service</span>
                      <span>2</span>
                      <span>$50.00</span>
                      <span>$100.00</span>
                    </div>
                  </div>
                  <div className="px-8 py-4 text-slate-700 border-b border-slate-200">
                    <div className="grid grid-cols-4 gap-4">
                      <span>Additional Service</span>
                      <span>1</span>
                      <span>$25.00</span>
                      <span>$25.00</span>
                    </div>
                  </div>
                </div>

                {/* Total Section */}
                <div className="p-8">
                  <div className="flex justify-end">
                    <div className="w-80">
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-slate-200">
                          <span className="text-slate-600">Subtotal:</span>
                          <span className="font-semibold">$125.00</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-200">
                          <span className="text-slate-600">Tax (8%):</span>
                          <span className="font-semibold">$10.00</span>
                        </div>
                        <div 
                          className="flex justify-between py-3 text-lg font-bold text-white px-4 rounded-lg mt-4"
                          style={{ backgroundColor: pendingSettings.accentColor || '#3B82F6' }}
                        >
                          <span>Total:</span>
                          <span>$135.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Text */}
                {pendingSettings.paymentText && (
                  <div 
                    className="mx-8 mb-8 p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${pendingSettings.primaryColor || '#8B5CF6'}10`, color: pendingSettings.primaryColor || '#8B5CF6' }}
                  >
                    <p className="font-semibold">{pendingSettings.paymentText}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-200 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Information */}
                    <div className="text-sm text-slate-600">
                      <h4 className="font-semibold text-slate-800 mb-2" style={{ color: pendingSettings.primaryColor || '#8B5CF6' }}>
                        {pendingSettings.companyName || 'Company Name'}
                      </h4>
                      <div className="space-y-1">
                        {pendingSettings.companyAddress && (
                          <div>{pendingSettings.companyAddress}</div>
                        )}
                        {(pendingSettings.companyCity || pendingSettings.companyCountry) && (
                          <div>
                            {pendingSettings.companyCity && `${pendingSettings.companyCity}`}
                            {pendingSettings.companyCity && pendingSettings.companyCountry && ', '}
                            {pendingSettings.companyCountry}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fiscal Information */}
                    {pendingSettings.fiscalInformation && (
                      <div className="text-sm text-slate-600 text-right">
                        <h4 className="font-semibold text-slate-800 mb-2" style={{ color: pendingSettings.primaryColor || '#8B5CF6' }}>
                          Fiscal Information
                        </h4>
                        <div className="space-y-1">
                          {pendingSettings.fiscalInformation.split('\n').map((line, index) => (
                            <div key={index}>{line}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thank You Message */}
                  <div 
                    className="text-center text-base font-semibold mt-6"
                    style={{ color: pendingSettings.primaryColor || '#8B5CF6' }}
                  >
                    Thank you for your business!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceSettings;