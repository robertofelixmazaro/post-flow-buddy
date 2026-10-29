import { Layout } from '@/components/layout/Layout';
import { NetworkType } from '@/data/mockData';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { Calendar, CheckCircle2, XCircle, Clock, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';

const NETWORKS: NetworkType[] = ['facebook', 'instagram', 'tiktok', 'linkedin'];

// Real numbers only: counts come from the user's own posts and publication logs.
// Engagement metrics (likes, reach, followers) require each network's insights API
// and approved permissions; they are not shown until that integration exists.
export default function Analytics() {
  const { user } = useAuth();
  const { data: posts = [], isLoading: loadingPosts } = useScheduledPosts();
  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['post-logs-analytics', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('post_logs').select('network, status');
      if (error) throw error;
      return data as { network: string; status: string }[];
    },
    enabled: !!user,
  });

  const loading = loadingPosts || loadingLogs;
  const published = logs.filter((l) => l.status === 'published').length;
  const failed = logs.filter((l) => l.status === 'failed').length;
  const pending = posts.filter((p) => p.status === 'scheduled').length;

  const cards = [
    { label: 'Posts criados', value: posts.length, icon: Calendar },
    { label: 'Agendados', value: pending, icon: Clock },
    { label: 'Publicações com sucesso', value: published, icon: CheckCircle2 },
    { label: 'Publicações com falha', value: failed, icon: XCircle },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho das suas publicações</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{loading ? '—' : stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Métricas de engajamento (curtidas, alcance, seguidores) ainda não estão disponíveis. Elas dependem
            das APIs de métricas de cada rede e de permissões aprovadas. Aqui aparecem apenas números reais dos seus posts.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Publicações por rede</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rede</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Agendados</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Sucesso</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Falhas</th>
                </tr>
              </thead>
              <tbody>
                {NETWORKS.map((n) => (
                  <tr key={n} className="border-b border-border last:border-0">
                    <td className="p-4"><NetworkBadge network={n} size="sm" /></td>
                    <td className="p-4 text-right text-foreground font-medium">
                      {posts.filter((p) => p.status === 'scheduled' && p.networks.includes(n)).length}
                    </td>
                    <td className="p-4 text-right text-foreground font-medium">
                      {logs.filter((l) => l.network === n && l.status === 'published').length}
                    </td>
                    <td className="p-4 text-right text-foreground font-medium">
                      {logs.filter((l) => l.network === n && l.status === 'failed').length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
