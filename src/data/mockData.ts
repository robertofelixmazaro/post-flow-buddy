export type NetworkType = 'instagram' | 'facebook' | 'google' | 'tiktok' | 'youtube';

export type PostStatus = 'scheduled' | 'published' | 'draft';

export interface ScheduledPost {
  id: string;
  content: string;
  network: NetworkType;
  scheduledDate: Date;
  scheduledTime: string;
  status: PostStatus;
  imageUrl?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  folder: string;
  uploadedAt: Date;
  size: string;
}

export interface ConnectedNetwork {
  id: string;
  network: NetworkType;
  username: string;
  followers: number;
  connected: boolean;
  avatar: string;
}

// Helper to get dates relative to today
const getDate = (daysOffset: number, hours: number, minutes: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Posts vazios - pronto para seu cliente começar do zero
export const scheduledPosts: ScheduledPost[] = [];

export const mediaFiles: MediaFile[] = [
  { id: '1', name: 'banner-principal.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400', folder: 'Banners', uploadedAt: new Date('2024-01-10'), size: '2.4 MB' },
  { id: '2', name: 'equipe-reuniao.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400', folder: 'Equipe', uploadedAt: new Date('2024-01-12'), size: '1.8 MB' },
  { id: '3', name: 'produto-destaque.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400', folder: 'Produtos', uploadedAt: new Date('2024-01-14'), size: '3.1 MB' },
  { id: '4', name: 'promocao-janeiro.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400', folder: 'Promoções', uploadedAt: new Date('2024-01-15'), size: '2.7 MB' },
  { id: '5', name: 'video-tutorial.mp4', type: 'video', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400', folder: 'Vídeos', uploadedAt: new Date('2024-01-16'), size: '45.2 MB' },
  { id: '6', name: 'natureza-01.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=400', folder: 'Backgrounds', uploadedAt: new Date('2024-01-17'), size: '4.1 MB' },
  { id: '7', name: 'logo-verde.png', type: 'image', url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400', folder: 'Logos', uploadedAt: new Date('2024-01-18'), size: '0.5 MB' },
  { id: '8', name: 'stories-template.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=400', folder: 'Templates', uploadedAt: new Date('2024-01-19'), size: '1.2 MB' },
];

// Redes disponíveis para conexão - nenhuma conectada inicialmente
export const connectedNetworks: ConnectedNetwork[] = [
  { id: '1', network: 'instagram', username: '', followers: 0, connected: false, avatar: '' },
  { id: '2', network: 'facebook', username: '', followers: 0, connected: false, avatar: '' },
  { id: '3', network: 'google', username: '', followers: 0, connected: false, avatar: '' },
  { id: '4', network: 'tiktok', username: '', followers: 0, connected: false, avatar: '' },
  { id: '5', network: 'youtube', username: '', followers: 0, connected: false, avatar: '' },
];

export const bestTimes = [
  { day: 'Segunda', times: ['09:00', '12:00', '18:00'] },
  { day: 'Terça', times: ['09:00', '12:00', '18:00'] },
  { day: 'Quarta', times: ['09:00', '12:00', '18:00'] },
  { day: 'Quinta', times: ['09:00', '12:00', '18:00'] },
  { day: 'Sexta', times: ['09:00', '12:00', '18:00'] },
  { day: 'Sábado', times: ['10:00', '16:00'] },
  { day: 'Domingo', times: ['10:00', '16:00'] },
];

// Métricas zeradas - pronto para iniciar do zero
export const analyticsData = {
  totalPosts: 0,
  totalEngagement: 0,
  avgEngagement: 0,
  growthRate: 0,
  networkStats: [
    { network: 'instagram' as NetworkType, posts: 0, engagement: 0, followers: 0 },
    { network: 'facebook' as NetworkType, posts: 0, engagement: 0, followers: 0 },
    { network: 'google' as NetworkType, posts: 0, engagement: 0, followers: 0 },
    { network: 'tiktok' as NetworkType, posts: 0, engagement: 0, followers: 0 },
    { network: 'youtube' as NetworkType, posts: 0, engagement: 0, followers: 0 },
  ],
  weeklyData: [
    { day: 'Seg', posts: 0, engagement: 0 },
    { day: 'Ter', posts: 0, engagement: 0 },
    { day: 'Qua', posts: 0, engagement: 0 },
    { day: 'Qui', posts: 0, engagement: 0 },
    { day: 'Sex', posts: 0, engagement: 0 },
    { day: 'Sáb', posts: 0, engagement: 0 },
    { day: 'Dom', posts: 0, engagement: 0 },
  ],
};

export const getNetworkColor = (network: NetworkType): string => {
  const colors = {
    instagram: 'hsl(330, 80%, 60%)',
    facebook: 'hsl(220, 70%, 55%)',
    google: 'hsl(4, 80%, 55%)',
    tiktok: 'hsl(180, 80%, 40%)',
    youtube: 'hsl(0, 80%, 50%)',
  };
  return colors[network];
};

export const getNetworkName = (network: NetworkType): string => {
  const names = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    google: 'Google',
    tiktok: 'TikTok',
    youtube: 'YouTube',
  };
  return names[network];
};
