import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  FileText,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type LogStatus = 'all' | 'published' | 'failed';
type NetworkFilter = 'all' | 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';

interface PostLog {
  id: string;
  post_id: string;
  network: string;
  status: string;
  external_post_id: string | null;
  error_message: string | null;
  error_code: string | null;
  published_at: string | null;
  created_at: string;
  scheduled_posts?: {
    content: string;
    scheduled_at: string;
  } | null;
}

const statusConfig = {
  published: { 
    label: 'Publicado', 
    icon: CheckCircle, 
    color: 'text-green-500 bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  failed: { 
    label: 'Falhou', 
    icon: XCircle, 
    color: 'text-red-500 bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
  scheduled: { 
    label: 'Agendado', 
    icon: Clock, 
    color: 'text-blue-500 bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  cancelled: { 
    label: 'Cancelado', 
    icon: AlertCircle, 
    color: 'text-yellow-500 bg-yellow-500/10',
    borderColor: 'border-yellow-500/30'
  },
};

export default function PublicationLogs() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LogStatus>('all');
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Fetch logs with post content
  const { data: logs, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['publication-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('post_logs')
        .select(`
          *,
          scheduled_posts!inner (
            content,
            scheduled_at,
            user_id
          )
        `)
        .eq('scheduled_posts.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as PostLog[];
    },
    enabled: !!user?.id,
  });

  // Filter logs
  const filteredLogs = logs?.filter(log => {
    const matchesSearch = log.scheduled_posts?.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.error_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.external_post_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesNetwork = networkFilter === 'all' || log.network === networkFilter;
    return matchesSearch && matchesStatus && matchesNetwork;
  }) || [];

  // Stats
  const stats = {
    total: logs?.length || 0,
    published: logs?.filter(l => l.status === 'published').length || 0,
    failed: logs?.filter(l => l.status === 'failed').length || 0,
  };

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
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
          <h2 className="text-xl font-semibold text-foreground mb-2">Erro ao carregar logs</h2>
          <p className="text-muted-foreground mb-4">Tente novamente mais tarde.</p>
          <Button onClick={() => refetch()}>Tentar Novamente</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Logs de Publicação
            </h1>
            <p className="text-muted-foreground">
              Histórico detalhado de todas as publicações
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Logs</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Publicados</p>
                <p className="text-2xl font-bold text-green-500">{stats.published}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Falhas</p>
                <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por conteúdo, erro ou ID externo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/30 border-border"
              />
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LogStatus)}>
                <SelectTrigger className="w-[150px] bg-muted/30 border-border">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
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
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum log encontrado
            </h3>
            <p className="text-muted-foreground">
              {logs?.length === 0 
                ? "Ainda não há registros de publicação." 
                : "Nenhum log corresponde aos filtros selecionados."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const config = statusConfig[log.status as keyof typeof statusConfig] || statusConfig.failed;
              const StatusIcon = config.icon;
              const isExpanded = expandedLogs.has(log.id);
              
              return (
                <Collapsible key={log.id} open={isExpanded} onOpenChange={() => toggleExpanded(log.id)}>
                  <div 
                    className={`bg-card rounded-xl border ${config.borderColor} overflow-hidden transition-colors`}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="p-4 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        {/* Network & Status */}
                        <div className="flex items-center gap-3">
                          <NetworkBadge network={log.network as any} size="md" showLabel={false} />
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {config.label}
                          </span>
                        </div>

                        {/* Content Preview */}
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-foreground line-clamp-1">
                            {log.scheduled_posts?.content || 'Conteúdo não disponível'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>

                        {/* Expand Icon */}
                        <div className="flex items-center gap-2">
                          {log.external_post_id && (
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                              ID: {log.external_post_id.substring(0, 12)}...
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                        {/* Post Content */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Conteúdo do Post</h4>
                          <p className="text-foreground bg-muted/30 rounded-lg p-3 text-sm">
                            {log.scheduled_posts?.content || 'Conteúdo não disponível'}
                          </p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Rede Social</h4>
                            <div className="flex items-center gap-2">
                              <NetworkBadge network={log.network as any} size="sm" />
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Data do Log</h4>
                            <p className="text-foreground text-sm">
                              {format(new Date(log.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
                            </p>
                          </div>
                          
                          {log.published_at && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Publicado em</h4>
                              <p className="text-foreground text-sm">
                                {format(new Date(log.published_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                              </p>
                            </div>
                          )}
                          
                          {log.external_post_id && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">ID Externo</h4>
                              <p className="text-foreground text-sm font-mono bg-muted/30 px-2 py-1 rounded inline-block">
                                {log.external_post_id}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Error Details */}
                        {log.status === 'failed' && (log.error_message || log.error_code) && (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-red-500 mb-2 flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              Detalhes do Erro
                            </h4>
                            {log.error_code && (
                              <p className="text-sm text-muted-foreground mb-1">
                                <span className="font-medium">Código:</span>{' '}
                                <code className="bg-muted/50 px-1.5 py-0.5 rounded text-red-400">{log.error_code}</code>
                              </p>
                            )}
                            {log.error_message && (
                              <p className="text-sm text-foreground">
                                <span className="font-medium text-muted-foreground">Mensagem:</span>{' '}
                                {log.error_message}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Success Message */}
                        {log.status === 'published' && (
                          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-green-500 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Publicação realizada com sucesso
                            </h4>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
