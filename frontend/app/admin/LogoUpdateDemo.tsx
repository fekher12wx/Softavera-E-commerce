import React, { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';

interface LogoUpdateDemoProps {
  onLogoUpdate: (logoUrl: string) => void;
}

const LogoUpdateDemo: React.FC<LogoUpdateDemoProps> = ({ onLogoUpdate }) => {
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUpdating(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        
        // Simulate a delay to show the update process
        setTimeout(() => {
          // Update header logo immediately
          onLogoUpdate(result);
          setIsUpdating(false);
        }, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">Logo Update Demo</h3>
      <p className="text-slate-600 mb-6">
        This demo shows how the header logo updates in real-time when you change it here.
        Try uploading a new logo and watch the header update instantly!
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Upload New Logo</label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
              id="demo-logo-upload"
            />
            <label
              htmlFor="demo-logo-upload"
              className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-slate-50 transition-all group"
            >
              {logoPreview ? (
                <div className="relative w-full h-full">
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain rounded-xl" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all flex items-center justify-center">
                    <Upload className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-slate-600 font-medium">Click to Upload Logo</p>
                  <p className="text-slate-400 text-sm">PNG, JPG up to 5MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {isUpdating && (
          <div className="flex items-center gap-2 text-purple-600">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Updating header logo...</span>
          </div>
        )}

        {logoPreview && !isUpdating && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={20} />
            <span>Logo updated! Check the header above.</span>
          </div>
        )}

        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <h4 className="font-semibold text-slate-800 mb-2">How it works:</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Upload a logo file</li>
            <li>• Logo preview appears immediately</li>
            <li>• Header logo updates in real-time</li>
            <li>• No page refresh needed!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LogoUpdateDemo;
