import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BentoStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'surface';
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  wide?: boolean;
}

const colorMap = {
  primary:   'text-primary',
  secondary: 'text-secondary',
  tertiary:  'text-tertiary',
  error:     'text-error drop-shadow-[0_0_8px_rgba(255,110,132,0.4)]',
  surface:   'text-on-surface',
};

const BentoStatCard = React.forwardRef<HTMLDivElement, BentoStatCardProps>(
  ({ className, label, value, unit, color = 'secondary', icon, trend, wide = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface-container-high rounded-2xl p-6 flex flex-col justify-between border border-white/5 shadow-xl relative overflow-hidden',
          wide && 'col-span-2',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="absolute top-4 right-4 opacity-10">
            {icon}
          </div>
        )}
        <span className="stat-label">{label}</span>
        <div className="mt-4 flex items-baseline gap-2">
          <span className={cn('font-headline font-bold tracking-tighter', colorMap[color], 'text-5xl')}>
            {value}
          </span>
          {unit && (
            <span className={cn('font-headline font-medium text-xl', colorMap[color], 'opacity-70')}>
              {unit}
            </span>
          )}
        </div>
        {trend && (
          <div className={cn('mt-3 flex items-center gap-1 text-xs', trend.positive ? 'text-tertiary' : 'text-error')}>
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    );
  }
);
BentoStatCard.displayName = 'BentoStatCard';

export default BentoStatCard;
