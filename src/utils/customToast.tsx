"use client"

import { toast } from 'sonner';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const errorToast = (message: string, description?: string) => {
    toast(message, {
        description: description,
        duration: 5000,
        icon: <AlertCircle className="h-4 w-4" />,
        style: {
        backgroundColor: '#FF4C4C',
        color: '#fff',
        },
    });
}

export const successToast = (message: string, description?: string) => {
    toast(message, {
        description: description,
        duration: 5000,
        icon: <CheckCircle className="h-4 w-4" />   
    });
}

export const infoToast = (message: string, description?: string) => {
    toast(message, {
        description: description,
        duration: 5000, 
    });
}