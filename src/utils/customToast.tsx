"use client"

import { toast } from 'sonner';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const errorToast = (message: string, description?: string) => {
    toast(message, {
        description: description,
        duration: 5000,
        icon: <AlertCircle className="h-4 w-4" />,
        style: {
          background: '#2a0b14',
          border: '1px solid rgba(255,110,132,0.3)',
          color: '#ff6e84',
        },
    });
}

export const successToast = (message: string, description?: string) => {
    toast(message, {
        description: description,
        duration: 5000,
        icon: <CheckCircle className="h-4 w-4" />,
        style: {
          background: '#0b2a1a',
          border: '1px solid rgba(196,255,205,0.25)',
          color: '#c4ffcd',
        },
    });
}

export const infoToast = (message: string, description?: string) => {
    toast(message, {
        description: description,
        duration: 5000,
        style: {
          background: '#0b1e2a',
          border: '1px solid rgba(0,238,252,0.2)',
          color: '#00eefc',
        },
    });
}