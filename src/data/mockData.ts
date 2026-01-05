export type NetworkType = 'instagram' | 'facebook' | 'twitter' | 'linkedin';

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

export const scheduledPosts: ScheduledPost[] = [
  {
    id: '1',
    content: 'Novidade chegando! 🚀 Prepare-se para algo incrível que vai transformar sua rotina de criação de conteúdo.',
    network: 'instagram',
    scheduledDate: getDate(0, 9),
    scheduledTime: '09:00',
    status: 'scheduled',
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
  },
  {
    id: '2',
    content: 'Descubra como aumentar sua produtividade em 10x com essas dicas comprovadas. Link na bio! 💼',
    network: 'linkedin',
    scheduledDate: getDate(0, 18),
    scheduledTime: '18:00',
    status: 'scheduled',
  },
  {
    id: '3',
    content: 'Bastidores do nosso novo projeto! Acompanhe o processo criativo nos stories 🎬',
    network: 'instagram',
    scheduledDate: getDate(1, 12),
    scheduledTime: '12:00',
    status: 'scheduled',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop',
  },
  {
    id: '4',
    content: '🧵 THREAD: 10 tendências de marketing digital para 2024 que você precisa conhecer. (1/10)',
    network: 'twitter',
    scheduledDate: getDate(2, 10),
    scheduledTime: '10:00',
    status: 'scheduled',
  },
  {
    id: '5',
    content: '📸 Carrossel: 5 dicas essenciais para criar conteúdo que engaja. Salve para consultar depois!',
    network: 'instagram',
    scheduledDate: getDate(3, 9),
    scheduledTime: '09:00',
    status: 'scheduled',
    imageUrl: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400&h=400&fit=crop',
  },
  {
    id: '6',
    content: '🎉 PROMOÇÃO DE FIM DE SEMANA! Até 50% de desconto em todos os nossos cursos. Aproveite!',
    network: 'facebook',
    scheduledDate: getDate(4, 15),
    scheduledTime: '15:00',
    status: 'scheduled',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop',
  },
  {
    id: '7',
    content: 'Novo vídeo no canal! Como começar do zero nas redes sociais em 2024. Link nos comentários 👇',
    network: 'twitter',
    scheduledDate: getDate(5, 14),
    scheduledTime: '14:00',
    status: 'scheduled',
  },
  {
    id: '8',
    content: 'Case de sucesso: como ajudamos a @empresa a crescer 300% em 6 meses 📈',
    network: 'linkedin',
    scheduledDate: getDate(5, 10),
    scheduledTime: '10:00',
    status: 'scheduled',
  },
  {
    id: '9',
    content: 'Reels da semana: compilado dos melhores momentos! Qual foi seu favorito? 🎥',
    network: 'instagram',
    scheduledDate: getDate(6, 18),
    scheduledTime: '18:00',
    status: 'scheduled',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop',
  },
  {
    id: '10',
    content: 'Dica rápida do dia: sempre use CTAs claros nos seus posts! O engajamento agradece 💡',
    network: 'twitter',
    scheduledDate: getDate(7, 12),
    scheduledTime: '12:00',
    status: 'scheduled',
  },
  {
    id: '11',
    content: 'AO VIVO hoje às 19h! Vamos responder todas as suas dúvidas sobre marketing digital 🔴',
    network: 'facebook',
    scheduledDate: getDate(7, 17),
    scheduledTime: '17:00',
    status: 'scheduled',
  },
  {
    id: '12',
    content: 'Gratidão por mais uma semana incrível com vocês! Obrigado por todo o apoio 💚',
    network: 'instagram',
    scheduledDate: getDate(8, 20),
    scheduledTime: '20:00',
    status: 'scheduled',
    imageUrl: 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=400&h=400&fit=crop',
  },
];

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

export const connectedNetworks: ConnectedNetwork[] = [
  { id: '1', network: 'instagram', username: '@agendasaas', followers: 12500, connected: true, avatar: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=100' },
  { id: '2', network: 'facebook', username: 'Agendasaas', followers: 8300, connected: true, avatar: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=100' },
  { id: '3', network: 'twitter', username: '@agendasaas', followers: 5200, connected: true, avatar: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=100' },
  { id: '4', network: 'linkedin', username: 'Agendasaas', followers: 3100, connected: true, avatar: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=100' },
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

export const analyticsData = {
  totalPosts: 156,
  totalEngagement: 45200,
  avgEngagement: 289,
  growthRate: 23.5,
  networkStats: [
    { network: 'instagram' as NetworkType, posts: 64, engagement: 22400, followers: 12500 },
    { network: 'facebook' as NetworkType, posts: 38, engagement: 11200, followers: 8300 },
    { network: 'twitter' as NetworkType, posts: 32, engagement: 7800, followers: 5200 },
    { network: 'linkedin' as NetworkType, posts: 22, engagement: 3800, followers: 3100 },
  ],
  weeklyData: [
    { day: 'Seg', posts: 4, engagement: 1200 },
    { day: 'Ter', posts: 3, engagement: 980 },
    { day: 'Qua', posts: 5, engagement: 1450 },
    { day: 'Qui', posts: 4, engagement: 1100 },
    { day: 'Sex', posts: 6, engagement: 1680 },
    { day: 'Sáb', posts: 2, engagement: 720 },
    { day: 'Dom', posts: 2, engagement: 650 },
  ],
};

export const getNetworkColor = (network: NetworkType): string => {
  const colors = {
    instagram: 'hsl(330, 80%, 60%)',
    facebook: 'hsl(220, 70%, 55%)',
    twitter: 'hsl(200, 90%, 55%)',
    linkedin: 'hsl(210, 80%, 50%)',
  };
  return colors[network];
};

export const getNetworkName = (network: NetworkType): string => {
  const names = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
  };
  return names[network];
};
