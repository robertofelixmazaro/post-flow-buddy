import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useScheduledPosts, useUpdatePostStatus } from '@/hooks/useScheduledPosts';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Edit2,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  ChevronDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PostStatus = 'all' | 'scheduled' | 'published' | 'failed' | 'cancelled';
type NetworkFilter = 'all' | 'instagram' | 'facebook' | 'twitter' | 'linkedin';

const statusConfig = {
  scheduled: { label: 'Agendado', icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
  published: { label: 'Publicado', icon: CheckCircle, color: 'text-green-500 bg-green-500/10' },
  failed: { label: 'Falhou', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
  cancelled: { label: 'Cancelado', icon: AlertCircle, color: 'text-yellow-500 bg-yellow-500/10' },
};

export default function Schedules() {
  const { toast } = useToast();
  const { data: posts, isLoading, error } = useScheduledPosts();
  const updateStatus = useUpdatePostStatus();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus>('all');
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>('all');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [postToCancel, setPostToCancel] = useState<string | null>(null);

  const filteredPosts = posts?.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesNetwork = networkFilter === 'all' || post.networks.includes(networkFilter);
    return matchesSearch && matchesStatus && matchesNetwork;
  }) || [];

  const handleCancel = async () => {
    if (!postToCancel) return;
    
    try {
      await updateStatus.mutateAsync({ id: postToCancel, status: 'cancelled' });
      toast({
        title: "Post cancelado",
        description: "O agendamento foi cancelado com sucesso."
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o post.",
        variant: "destructive"
      });
    } finally {
      setCancelDialogOpen(false);
      setPostToCancel(null);
    }
  };

  const handleReschedule = async (postId: string) => {
    try {
      await updateStatus.mutateAsync({ id: postId, status: 'scheduled' });
      toast({
        title: "Post reagendado",
        description: "O post foi colocado novamente na fila de publicação."
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível reagendar o post.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Erro ao carregar dados</h2>
          <p className="text-muted-foreground">Tente novamente mais tarde.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Agendamentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus posts agendados
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/30 border-border"
              />
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PostStatus)}>
                <SelectTrigger className="w-[150px] bg-muted/30 border-border">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={networkFilter} onValueChange={(v) => setNetworkFilter(v as NetworkFilter)}>
                <SelectTrigger className="w-[150px] bg-muted/30 border-border">
                  <SelectValue placeholder="Rede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum post encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              {posts?.length === 0 
                ? "Você ainda não agendou nenhum post." 
                : "Nenhum post corresponde aos filtros selecionados."}
            </p>
            <Button onClick={() => window.location.href = '/criar'}>
              Criar Primeiro Post
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const config = statusConfig[post.status as keyof typeof statusConfig];
              const StatusIcon = config.icon;
              
              return (
                <div 
                  key={post.id}
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Content Preview */}
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Networks */}
                        <div className="flex items-center gap-1">
                          {post.networks.map((network: string) => (
                            <NetworkBadge 
                              key={network} 
                              network={network as any} 
                              size="sm" 
                              showLabel={false} 
                            />
                          ))}
                        </div>
                        
                        {/* Date */}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(post.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {config.label}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                            Ações
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedPost(post);
                            setLogDialogOpen(true);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          
                          {post.status === 'scheduled' && (
                            <>
                              <DropdownMenuItem onClick={() => window.location.href = `/criar?edit=${post.id}`}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setPostToCancel(post.id);
                                  setCancelDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {(post.status === 'failed' || post.status === 'cancelled') && (
                            <DropdownMenuItem onClick={() => handleReschedule(post.id)}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Reagendar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Post</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Conteúdo</Label>
                <p className="text-foreground mt-1">{selectedPost.content}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Redes</Label>
                <div className="flex gap-2 mt-1">
                  {selectedPost.networks.map((n: string) => (
                    <NetworkBadge key={n} network={n as any} size="sm" />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Data Agendada</Label>
                <p className="text-foreground mt-1">
                  {format(new Date(selectedPost.scheduled_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <p className="text-foreground mt-1 capitalize">{selectedPost.status}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação pode ser desfeita reagendando o post.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancelar Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
