import React from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface CustomToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

const CustomToast: React.FC<CustomToastProps> = ({
  type,
  title,
  message,
  onConfirm,
  onCancel,
  showActions = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <Shield className="w-6 h-6 text-blue-500" />;
      default:
        return <Shield className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
      case 'info':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
      default:
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'error':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  return (
    <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-full ${getBgColor()} border-2 rounded-xl shadow-2xl backdrop-blur-sm animate-in slide-in-from-top-2 duration-300`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {getIcon()}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${getButtonColor()}`}
            >
              Activer Konnect
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomToast;
