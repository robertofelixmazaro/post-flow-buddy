import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { bestTimes, getNetworkName } from '@/data/mockData';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { useSocialConnections, useDisconnectSocial, getOAuthUrl } from '@/hooks/useSocialConnections';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Bell, 
  Clock, 
  Link2, 
  Shield, 
  Palette,
  Check,
  ExternalLink,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const settingsSections = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'networks', label: 'Redes Sociais', icon: Link2 },
  { id: 'schedule', label: 'Horários', icon: Clock },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'appearance', label: 'Aparência', icon: Palette },
];

const availableNetworks = [
  { id: 'instagram', name: 'Instagram', description: 'Conta Business ou Creator vinculada a Página do Facebook' },
  { id: 'facebook', name: 'Facebook', description: 'Publicação em Páginas do Facebook' },
  { id: 'google', name: 'Google', description: 'Perfil de empresa no Google Meu Negócio' },
  { id: 'tiktok', name: 'TikTok', description: 'Publicação de vídeos no TikTok' },
  { id: 'youtube', name: 'YouTube', description: 'Publicação de vídeos no YouTube' },
] as const;

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: connections, isLoading: loadingConnections } = useSocialConnections();
  const disconnectSocial = useDisconnectSocial();
  
  const [activeSection, setActiveSection] = useState('profile');
  const [notifications, setNotifications] = useState({
    postPublished: true,
    postFailed: true,
    weeklyReport: true,
    tips: false,
  });
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [oauthInfoOpen, setOauthInfoOpen] = useState(false);
  const [selectedNetworkForOAuth, setSelectedNetworkForOAuth] = useState<string | null>(null);

  // Check for OAuth callback results
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    
    if (connected) {
      toast({
        title: "Rede conectada!",
        description: `${getNetworkName(connected as any)} foi conectado com sucesso.`,
      });
    } else if (error) {
      toast({
        title: "Erro na conexão",
        description: decodeURIComponent(error),
        variant: "destructive"
      });
    }
  }, [searchParams, toast]);

  const handleSave = () => {
    toast({
      title: "Configurações salvas!",
      description: "Suas preferências foram atualizadas com sucesso.",
    });
  };

  const handleConnect = (network: string) => {
    setSelectedNetworkForOAuth(network);
    setOauthInfoOpen(true);
  };

  const startOAuth = () => {
    if (selectedNetworkForOAuth) {
      // In production, this would redirect to the OAuth URL
      // For now, show a message about configuration needed
      toast({
        title: "Configuração necessária",
        description: "Para conectar redes sociais, configure as credenciais OAuth nas configurações do projeto.",
        variant: "destructive"
      });
      setOauthInfoOpen(false);
      
      // Uncomment when OAuth is configured:
      // window.location.href = getOAuthUrl(selectedNetworkForOAuth);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedConnectionId) return;
    
    try {
      await disconnectSocial.mutateAsync(selectedConnectionId);
      toast({
        title: "Rede desconectada",
        description: "A conta foi desconectada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível desconectar a rede.",
        variant: "destructive"
      });
    } finally {
      setDisconnectDialogOpen(false);
      setSelectedConnectionId(null);
    }
  };

  const getConnectionForNetwork = (network: string) => {
    return connections?.find(c => c.network === network);
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e conexões
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar */}
          <div className="bg-card rounded-2xl border border-border p-4 h-fit">
            <nav className="space-y-1">
              {settingsSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Profile */}
            {activeSection === 'profile' && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Perfil</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <Button variant="outline" size="sm">Alterar Foto</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-foreground mb-1.5 block">Nome</Label>
                      <Input defaultValue={user?.user_metadata?.full_name || 'Usuário'} className="bg-muted/30 border-border" />
                    </div>
                    <div>
                      <Label className="text-sm text-foreground mb-1.5 block">Email</Label>
                      <Input defaultValue={user?.email || ''} className="bg-muted/30 border-border" disabled />
                    </div>
                  </div>
                  <Button onClick={handleSave}>Salvar Alterações</Button>
                </div>
              </div>
            )}

            {/* Networks */}
            {activeSection === 'networks' && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Redes Sociais</h2>
                
                <Alert className="mb-4 border-primary/30 bg-primary/5">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Configuração OAuth Necessária</AlertTitle>
                  <AlertDescription className="text-muted-foreground">
                    Para conectar redes sociais, você precisa configurar os Apps OAuth de cada plataforma 
                    (Meta Developer, Twitter Developer, LinkedIn Developer) e adicionar as credenciais como secrets.
                  </AlertDescription>
                </Alert>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Conecte suas contas para agendar publicações
                </p>
                
                {loadingConnections ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableNetworks.map(network => {
                      const connection = getConnectionForNetwork(network.id);
                      const isConnected = !!connection;
                      
                      return (
                        <div 
                          key={network.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border"
                        >
                          <div className="flex items-center gap-4">
                            <NetworkBadge network={network.id as any} size="md" showLabel={false} />
                            <div>
                              <div className="font-medium text-foreground">{network.name}</div>
                              {isConnected && connection.account_username ? (
                                <div className="text-sm text-muted-foreground">
                                  @{connection.account_username}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  {network.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {isConnected ? (
                              <>
                                <span className="flex items-center gap-1 text-sm text-green-500">
                                  <Check className="w-4 h-4" />
                                  Conectado
                                </span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedConnectionId(connection.id);
                                    setDisconnectDialogOpen(true);
                                  }}
                                >
                                  Desconectar
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                className="gap-2"
                                onClick={() => handleConnect(network.id)}
                              >
                                <ExternalLink className="w-4 h-4" />
                                Conectar
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Schedule */}
            {activeSection === 'schedule' && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Melhores Horários</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure os horários preferidos para publicação automática
                </p>
                <div className="space-y-3">
                  {bestTimes.map(day => (
                    <div 
                      key={day.day}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border"
                    >
                      <span className="font-medium text-foreground w-24">{day.day}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {day.times.map(time => (
                          <span 
                            key={time}
                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                          >
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4" onClick={handleSave}>Salvar Horários</Button>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Notificações</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <div className="font-medium text-foreground">Post Publicado</div>
                      <div className="text-sm text-muted-foreground">Receba uma notificação quando um post for publicado</div>
                    </div>
                    <Switch 
                      checked={notifications.postPublished}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, postPublished: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <div className="font-medium text-foreground">Falha na Publicação</div>
                      <div className="text-sm text-muted-foreground">Seja alertado quando houver erros</div>
                    </div>
                    <Switch 
                      checked={notifications.postFailed}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, postFailed: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <div className="font-medium text-foreground">Relatório Semanal</div>
                      <div className="text-sm text-muted-foreground">Receba um resumo semanal de desempenho</div>
                    </div>
                    <Switch 
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReport: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <div className="font-medium text-foreground">Dicas e Novidades</div>
                      <div className="text-sm text-muted-foreground">Receba dicas de como melhorar seu conteúdo</div>
                    </div>
                    <Switch 
                      checked={notifications.tips}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, tips: checked }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Segurança</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-foreground mb-1.5 block">Senha Atual</Label>
                    <Input type="password" className="bg-muted/30 border-border" />
                  </div>
                  <div>
                    <Label className="text-sm text-foreground mb-1.5 block">Nova Senha</Label>
                    <Input type="password" className="bg-muted/30 border-border" />
                  </div>
                  <div>
                    <Label className="text-sm text-foreground mb-1.5 block">Confirmar Nova Senha</Label>
                    <Input type="password" className="bg-muted/30 border-border" />
                  </div>
                  <Button onClick={handleSave}>Atualizar Senha</Button>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeSection === 'appearance' && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Aparência</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <div className="font-medium text-foreground">Tema Escuro</div>
                      <div className="text-sm text-muted-foreground">O tema atual da aplicação</div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      Ativo
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OAuth Info Dialog */}
      <Dialog open={oauthInfoOpen} onOpenChange={setOauthInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar {selectedNetworkForOAuth && getNetworkName(selectedNetworkForOAuth as any)}</DialogTitle>
            <DialogDescription>
              Você será redirecionado para autorizar o acesso à sua conta.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Ao conectar sua conta, você autoriza o Agendasaas a:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Publicar conteúdo em seu nome
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Acessar informações básicas do perfil
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Acessar métricas de engajamento
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOauthInfoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={startOAuth}>
              Continuar com OAuth
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconectar Rede</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desconectar esta conta? Posts agendados para esta rede não serão publicados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              disabled={disconnectSocial.isPending}
            >
              {disconnectSocial.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
