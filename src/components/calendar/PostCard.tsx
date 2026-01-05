import { ScheduledPost, getNetworkName } from '@/data/mockData';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { Clock, MoreVertical, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface PostCardProps {
  post: ScheduledPost;
  variant?: 'compact' | 'full';
}

export function PostCard({ post, variant = 'full' }: PostCardProps) {
  const formatTime = (time: string) => time;

  if (variant === 'compact') {
    return (
      <div className="group flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
        <NetworkBadge network={post.network} size="sm" showLabel={false} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{post.content}</p>
        </div>
        <span className="text-xs text-muted-foreground">{formatTime(post.scheduledTime)}</span>
      </div>
    );
  }

  return (
    <div className="group bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <NetworkBadge network={post.network} size="sm" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuItem>Reagendar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {post.imageUrl && (
        <div className="relative mb-3 rounded-lg overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt="Post preview" 
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      )}

      <p className="text-sm text-foreground line-clamp-3 mb-3">
        {post.content}
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>{formatTime(post.scheduledTime)}</span>
        {post.imageUrl && (
          <>
            <span className="text-border">•</span>
            <ImageIcon className="w-3.5 h-3.5" />
            <span>1 imagem</span>
          </>
        )}
      </div>
    </div>
  );
}
