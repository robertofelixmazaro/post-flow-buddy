import { cn } from '@/lib/utils';
import { NetworkType, getNetworkName } from '@/data/mockData';
import { Instagram, Facebook, Linkedin } from 'lucide-react';

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

const networkIcons: Record<NetworkType, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: TikTokIcon,
  linkedin: Linkedin,
};

const networkStyles: Record<NetworkType, string> = {
  instagram: 'bg-[hsl(330,80%,60%)] text-white',
  facebook: 'bg-[hsl(220,70%,55%)] text-white',
  tiktok: 'bg-[hsl(180,80%,40%)] text-white',
  linkedin: 'bg-[hsl(210,80%,45%)] text-white',
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
