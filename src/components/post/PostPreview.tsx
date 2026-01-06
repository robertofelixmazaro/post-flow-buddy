import { cn } from '@/lib/utils';
import { NetworkType, getNetworkName } from '@/data/mockData';
import { Instagram, Facebook, Linkedin, Heart, MessageCircle, Share2, ThumbsUp, MoreHorizontal, Bookmark, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PostPreviewProps {
  network: NetworkType;
  content: string;
  imageUrl?: string;
  username?: string;
  avatarUrl?: string;
}

// Custom TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

function InstagramPreview({ content, imageUrl, username, avatarUrl }: Omit<PostPreviewProps, 'network'>) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 max-w-[320px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100">
        <Avatar className="w-8 h-8">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
            {username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold text-gray-900">{username || 'seu_usuario'}</span>
        <MoreHorizontal className="w-5 h-5 text-gray-500 ml-auto" />
      </div>
      
      {/* Image */}
      {imageUrl ? (
        <div className="aspect-square bg-gray-100">
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <Instagram className="w-12 h-12 text-gray-300" />
        </div>
      )}
      
      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center gap-4 mb-2">
          <Heart className="w-6 h-6 text-gray-900" />
          <MessageCircle className="w-6 h-6 text-gray-900" />
          <Send className="w-6 h-6 text-gray-900" />
          <Bookmark className="w-6 h-6 text-gray-900 ml-auto" />
        </div>
        <p className="text-sm text-gray-500 mb-1">0 curtidas</p>
        <p className="text-sm text-gray-900">
          <span className="font-semibold">{username || 'seu_usuario'}</span>{' '}
          {truncateText(content || 'Seu texto aqui...', 125)}
        </p>
      </div>
    </div>
  );
}

function FacebookPreview({ content, imageUrl, username, avatarUrl }: Omit<PostPreviewProps, 'network'>) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 max-w-[320px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-blue-500 text-white">
            {username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-gray-900">{username || 'Sua Página'}</p>
          <p className="text-xs text-gray-500">Agora · 🌎</p>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-500 ml-auto" />
      </div>
      
      {/* Content */}
      <p className="px-3 pb-2 text-sm text-gray-900">
        {truncateText(content || 'Seu texto aqui...', 200)}
      </p>
      
      {/* Image */}
      {imageUrl ? (
        <div className="aspect-video bg-gray-100">
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <Facebook className="w-12 h-12 text-gray-300" />
        </div>
      )}
      
      {/* Stats */}
      <div className="px-3 py-2 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 curtidas</span>
          <span>0 comentários</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex border-t border-gray-100">
        <button className="flex-1 flex items-center justify-center gap-1 py-2 text-gray-500 text-sm">
          <ThumbsUp className="w-4 h-4" /> Curtir
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-2 text-gray-500 text-sm">
          <MessageCircle className="w-4 h-4" /> Comentar
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-2 text-gray-500 text-sm">
          <Share2 className="w-4 h-4" /> Compartilhar
        </button>
      </div>
    </div>
  );
}

function TikTokPreview({ content, imageUrl, username, avatarUrl }: Omit<PostPreviewProps, 'network'>) {
  return (
    <div className="bg-black rounded-lg max-w-[180px] overflow-hidden relative" style={{ aspectRatio: '9/16' }}>
      {/* Background */}
      {imageUrl ? (
        <img src={imageUrl} alt="Post" className="w-full h-full object-cover absolute inset-0" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 absolute inset-0 flex items-center justify-center">
          <TikTokIcon className="w-16 h-16 text-gray-600" />
        </div>
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      {/* Right Actions */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
        <Avatar className="w-10 h-10 border-2 border-white">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-cyan-500 text-white text-xs">
            {username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center">
          <Heart className="w-7 h-7 text-white" />
          <span className="text-white text-xs">0</span>
        </div>
        <div className="flex flex-col items-center">
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="text-white text-xs">0</span>
        </div>
        <div className="flex flex-col items-center">
          <Share2 className="w-7 h-7 text-white" />
          <span className="text-white text-xs">0</span>
        </div>
      </div>
      
      {/* Bottom Content */}
      <div className="absolute bottom-2 left-2 right-12">
        <p className="text-white text-xs font-semibold mb-1">@{username || 'seu_usuario'}</p>
        <p className="text-white text-xs line-clamp-2">{content || 'Seu texto aqui...'}</p>
      </div>
    </div>
  );
}

function LinkedInPreview({ content, imageUrl, username, avatarUrl }: Omit<PostPreviewProps, 'network'>) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 max-w-[320px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-[hsl(210,80%,45%)] text-white">
            {username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{username || 'Seu Nome'}</p>
          <p className="text-xs text-gray-500">Cargo • Empresa</p>
          <p className="text-xs text-gray-500">Agora · 🌐</p>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-500" />
      </div>
      
      {/* Content */}
      <p className="px-3 pb-2 text-sm text-gray-900">
        {truncateText(content || 'Seu texto aqui...', 200)}
      </p>
      
      {/* Image */}
      {imageUrl ? (
        <div className="aspect-video bg-gray-100">
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <Linkedin className="w-12 h-12 text-[hsl(210,80%,45%)]" />
        </div>
      )}
      
      {/* Stats */}
      <div className="px-3 py-2 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span className="flex items-center">
            <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">👍</span>
          </span>
          <span>0</span>
          <span className="ml-auto">0 comentários • 0 compartilhamentos</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex border-t border-gray-100">
        <button className="flex-1 flex items-center justify-center gap-1 py-2 text-gray-600 text-sm hover:bg-gray-50">
          <ThumbsUp className="w-4 h-4" /> Gostei
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-2 text-gray-600 text-sm hover:bg-gray-50">
          <MessageCircle className="w-4 h-4" /> Comentar
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 py-2 text-gray-600 text-sm hover:bg-gray-50">
          <Share2 className="w-4 h-4" /> Compartilhar
        </button>
      </div>
    </div>
  );
}

export function PostPreview({ network, content, imageUrl, username, avatarUrl }: PostPreviewProps) {
  const previewComponents = {
    instagram: InstagramPreview,
    facebook: FacebookPreview,
    tiktok: TikTokPreview,
    linkedin: LinkedInPreview,
  };

  const PreviewComponent = previewComponents[network];
  
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{getNetworkName(network)}</span>
      <PreviewComponent 
        content={content} 
        imageUrl={imageUrl} 
        username={username}
        avatarUrl={avatarUrl}
      />
    </div>
  );
}

export function PostPreviewGrid({ 
  networks, 
  content, 
  imageUrl, 
  username, 
  avatarUrl 
}: { 
  networks: NetworkType[];
  content: string;
  imageUrl?: string;
  username?: string;
  avatarUrl?: string;
}) {
  if (networks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Selecione uma rede social para ver o preview
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {networks.map(network => (
        <PostPreview
          key={network}
          network={network}
          content={content}
          imageUrl={imageUrl}
          username={username}
          avatarUrl={avatarUrl}
        />
      ))}
    </div>
  );
}
