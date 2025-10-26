import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = "success", // success, error, warning, info
  duration = 4000 
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        };
      case 'info':
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-gray-600',
          bg: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${styles.bg} border rounded-lg shadow-lg p-4 max-w-md min-w-[300px]`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
          
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
