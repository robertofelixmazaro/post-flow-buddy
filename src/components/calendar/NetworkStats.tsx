import { connectedNetworks, scheduledPosts, NetworkType } from '@/data/mockData';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { useMemo } from 'react';

export function NetworkStats() {
  const stats = useMemo(() => {
    return connectedNetworks.map(network => {
      const count = scheduledPosts.filter(post => post.network === network.network).length;
      return { ...network, postsCount: count };
    });
  }, []);

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h3 className="font-semibold text-foreground mb-4">Redes Conectadas</h3>
      <div className="space-y-3">
        {stats.map(network => (
          <div 
            key={network.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <NetworkBadge network={network.network} size="sm" showLabel={false} />
              <div>
                <div className="font-medium text-foreground text-sm">{network.username}</div>
                <div className="text-xs text-muted-foreground">
                  {network.followers.toLocaleString()} seguidores
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{network.postsCount}</div>
              <div className="text-xs text-muted-foreground">agendados</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
