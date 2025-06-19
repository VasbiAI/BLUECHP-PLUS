
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'success' | 'error' | 'loading' | 'idle';

interface StatusIndicatorProps {
  status: StatusType;
  message?: string;
  className?: string;
  autoHideDuration?: number;
}

export function StatusIndicator({ 
  status, 
  message, 
  className,
  autoHideDuration = 5000 // 5 seconds by default
}: StatusIndicatorProps) {
  const [visible, setVisible] = useState(status !== 'idle');
  
  useEffect(() => {
    if (status !== 'idle' && status !== 'loading') {
      setVisible(true);
      
      // Auto-hide after duration if it's a success or error
      if (autoHideDuration > 0 && (status === 'success' || status === 'error')) {
        const timer = setTimeout(() => {
          setVisible(false);
        }, autoHideDuration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(status === 'loading');
    }
  }, [status, autoHideDuration]);
  
  // If not visible, don't render anything
  if (!visible) return null;
  
  const variants = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: <CheckCircle className="h-4 w-4 text-green-600" />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />
    },
    loading: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
    },
    idle: {
      bg: '',
      border: '',
      text: '',
      icon: null
    }
  };
  
  const variant = variants[status];
  
  return (
    <div 
      className={cn(
        'flex items-center gap-2 py-2 px-4 border rounded-md transition-all duration-300',
        variant.bg,
        variant.border,
        variant.text,
        className
      )}
    >
      {variant.icon}
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}
