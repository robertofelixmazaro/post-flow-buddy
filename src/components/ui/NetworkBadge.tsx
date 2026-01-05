import { cn } from '@/lib/utils';
import { NetworkType, getNetworkName } from '@/data/mockData';
import { Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';

interface NetworkBadgeProps {
  network: NetworkType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const networkIcons = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
};

const networkStyles = {
  instagram: 'bg-[hsl(330,80%,60%)] text-white',
  facebook: 'bg-[hsl(220,70%,55%)] text-white',
  twitter: 'bg-[hsl(200,90%,55%)] text-white',
  linkedin: 'bg-[hsl(210,80%,50%)] text-white',
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
