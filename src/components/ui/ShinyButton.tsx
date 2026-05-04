import React from 'react';
import { cn } from '@/lib/utils';

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ className, variant = 'primary', size = 'md', icon, iconPosition = 'left', children, ...props }, ref) => {
    const base =
      'relative inline-flex items-center justify-center gap-2 font-headline font-bold rounded-md transition-all active:scale-95 shiny-btn-mask';

    const variants = {
      primary:
        'bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed shadow-glow-primary hover:brightness-110',
      secondary:
        'bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 hover:shadow-glow-secondary',
      ghost:
        'bg-surface-container-highest text-on-surface hover:bg-surface-bright border border-white/5',
    };

    const sizes = {
      sm:  'px-4 py-2 text-xs',
      md:  'px-6 py-3 text-sm',
      lg:  'px-8 py-4 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
      </button>
    );
  }
);
ShinyButton.displayName = 'ShinyButton';

export default ShinyButton;
