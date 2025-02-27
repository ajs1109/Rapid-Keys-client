'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLoad = () => {
      // Simulate checking all critical components
      const checkComponentsReady = () => {
        // Add custom checks for critical components
        const criticalComponents = [
          document.querySelector('#main-content'),
          document.querySelector('#data-section')
          // Add more critical component selectors
        ];

        return criticalComponents.every(component => component !== null);
      };

      // Wait a bit to ensure all components are potentially rendered
      const loadCheckInterval = setInterval(() => {
        if (checkComponentsReady()) {
          setIsLoading(false);
          clearInterval(loadCheckInterval);
        }
      }, 500);

      // Fallback timeout to prevent infinite loading
      setTimeout(() => {
        clearInterval(loadCheckInterval);
        setIsLoading(false);
      }, 5000);
    };

    // Check if document is already loaded
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-lg font-semibold text-gray-700">
          Loading content...
        </p>
      </div>
    </div>
  );
}