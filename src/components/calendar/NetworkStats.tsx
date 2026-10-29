import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { useCalendarPosts } from '@/hooks/useScheduledPosts';
import { Link } from 'react-router-dom';

export function NetworkStats() {
  const { data: connections = [], isLoading } = useSocialConnections();
  const { posts } = useCalendarPosts();

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h3 className="font-semibold text-foreground mb-4">Redes Conectadas</h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : connections.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          Nenhuma rede conectada.{' '}
          <Link to="/configuracoes" className="text-primary hover:underline">Conectar agora</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((c) => {
            const count = posts.filter((p) => p.network === c.network && p.status === 'scheduled').length;
            return (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <NetworkBadge network={c.network} size="sm" showLabel={false} />
                  <div>
                    <div className="font-medium text-foreground text-sm">
                      {c.account_username ? `@${c.account_username}` : c.page_name || c.account_name || c.network}
                    </div>
                    {c.page_name && <div className="text-xs text-muted-foreground">{c.page_name}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{count}</div>
                  <div className="text-xs text-muted-foreground">agendados</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
