import { cn } from '@/lib/utils';
import { NetworkType, getNetworkName } from '@/data/mockData';
import { Instagram, Facebook, Youtube } from 'lucide-react';

interface NetworkBadgeProps {
  network: NetworkType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// Custom TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

// Custom Google icon
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const networkIcons: Record<NetworkType, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  google: GoogleIcon,
  tiktok: TikTokIcon,
  youtube: Youtube,
};

const networkStyles: Record<NetworkType, string> = {
  instagram: 'bg-[hsl(330,80%,60%)] text-white',
  facebook: 'bg-[hsl(220,70%,55%)] text-white',
  google: 'bg-[hsl(4,80%,55%)] text-white',
  tiktok: 'bg-[hsl(180,80%,40%)] text-white',
  youtube: 'bg-[hsl(0,80%,50%)] text-white',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function NetworkBadge({ network, size = 'md', showLabel = true, className }: NetworkBadgeProps) {
  const Icon = networkIcons[network];
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      networkStyles[network],
      sizeStyles[size],
      className
    )}>
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{getNetworkName(network)}</span>}
    </span>
  );
}
