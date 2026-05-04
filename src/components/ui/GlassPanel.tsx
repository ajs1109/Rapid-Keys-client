import React from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'primary' | 'secondary' | 'none';
  elevated?: boolean;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, glow = 'none', elevated = false, children, ...props }, ref) => {
    const glowMap = {
      primary:   'shadow-[0_0_60px_rgba(222,142,255,0.08)]',
      secondary: 'shadow-[0_0_60px_rgba(0,238,252,0.08)]',
      none:      '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          elevated ? 'glass-modal' : 'glass-panel',
          glowMap[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = 'GlassPanel';

export default GlassPanel;
