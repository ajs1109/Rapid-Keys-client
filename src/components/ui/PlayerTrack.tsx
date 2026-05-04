import React from 'react';
import { cn } from '@/lib/utils';

interface PlayerTrackProps extends React.HTMLAttributes<HTMLDivElement> {
  username: string;
  progress: number; // 0-100
  wpm?: number;
  avatarSeed?: string;
  isSelf?: boolean;
  isLeading?: boolean;
}

const PlayerTrack = React.forwardRef<HTMLDivElement, PlayerTrackProps>(
  ({ className, username, progress, wpm, avatarSeed, isSelf = false, isLeading = false, ...props }, ref) => {
    const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(avatarSeed ?? username)}`;
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
      <div ref={ref} className={cn('relative flex items-center h-12', className)} {...props}>
        {/* Track baseline */}
        <div className="absolute inset-y-0 left-0 w-full h-[2px] bg-white/5 self-center top-1/2 -translate-y-1/2" />

        {/* Progress fill */}
        <div
          className={cn(
            'absolute left-0 h-[2px] self-center top-1/2 -translate-y-1/2',
            isSelf
              ? 'bg-gradient-to-r from-primary to-primary/20 shadow-[0_0_15px_rgba(222,142,255,0.5)]'
              : isLeading
                ? 'bg-gradient-to-r from-secondary to-secondary/20 shadow-[0_0_15px_rgba(0,238,252,0.3)]'
                : 'bg-gradient-to-r from-on-surface-variant to-on-surface-variant/20'
          )}
          style={{
            width: `${clampedProgress}%`,
            transition: 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />

        {/* Avatar + label at current position */}
        <div
          className="absolute -translate-x-1/2 flex flex-col items-center gap-1"
          style={{ left: `${clampedProgress}%` }}
        >
          {isSelf ? (
            <span className="px-3 py-0.5 bg-primary text-on-primary text-[9px] font-bold rounded-full shadow-lg shadow-primary/20">
              YOU
            </span>
          ) : (
            <span className={cn(
              'px-2 py-0.5 text-[8px] font-bold rounded uppercase',
              isLeading ? 'bg-secondary/20 text-secondary' : 'bg-surface-variant text-on-surface-variant'
            )}>
              {username.slice(0, 10)}
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt={username}
            className={cn(
              'rounded-full object-cover',
              isSelf
                ? 'h-9 w-9 border-2 border-primary'
                : 'h-7 w-7 border border-white/20'
            )}
          />
        </div>

        {/* WPM badge at right */}
        {wpm !== undefined && (
          <div className={cn(
            'absolute right-0 font-mono text-sm font-bold',
            isSelf ? 'text-primary' : isLeading ? 'text-secondary/70' : 'text-on-surface-variant'
          )}>
            {wpm > 0 ? `${wpm}` : '—'}
          </div>
        )}
      </div>
    );
  }
);
PlayerTrack.displayName = 'PlayerTrack';

export default PlayerTrack;
