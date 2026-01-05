import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { NetworkType, getNetworkName } from '@/data/mockData';
import { useCreatePost } from '@/hooks/useScheduledPosts';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { 
  Image, 
  Calendar, 
  Clock, 
  Send, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin,
  X,
  Sparkles,
  CalendarDays,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const networks: { id: NetworkType; icon: typeof Instagram; maxLength: number }[] = [
  { id: 'instagram', icon: Instagram, maxLength: 2200 },
  { id: 'facebook', icon: Facebook, maxLength: 63206 },
  { id: 'twitter', icon: Twitter, maxLength: 280 },
  { id: 'linkedin', icon: Linkedin, maxLength: 3000 },
];

const weekDays = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
];

export default function CreatePost() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createPost = useCreatePost();
  const { data: connections } = useSocialConnections();
  
  const [content, setContent] = useState('');
  const [selectedNetworks, setSelectedNetworks] = useState<NetworkType[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [repeatOnDays, setRepeatOnDays] = useState<number[]>([]);
  const [enableRepeat, setEnableRepeat] = useState(false);

  // Get connected networks
  const connectedNetworks = connections?.map(c => c.network) || [];

  // Set date from URL parameter
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [searchParams]);

  const toggleNetwork = (network: NetworkType) => {
    setSelectedNetworks(prev => 
      prev.includes(network)
        ? prev.filter(n => n !== network)
        : [...prev, network]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSchedule = async () => {
    if (!content.trim()) {
      toast({
        title: "Conteúdo obrigatório",
        description: "Adicione o texto do seu post",
        variant: "destructive",
      });
      return;
    }

    if (selectedNetworks.length === 0) {
      toast({
        title: "Selecione uma rede",
        description: "Escolha pelo menos uma rede social conectada",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Data e hora obrigatórios",
        description: "Selecione quando deseja publicar",
        variant: "destructive",
      });
      return;
    }

    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      
      await createPost.mutateAsync({
        content,
        networks: selectedNetworks,
        scheduled_at: scheduledAt,
        media_urls: imagePreview ? [imagePreview] : undefined
      });

      toast({
        title: "Post agendado! 🎉",
        description: `Agendado para ${selectedNetworks.length} rede(s)`,
      });

      navigate('/agendamentos');
    } catch (error) {
      toast({
        title: "Erro ao agendar",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const minCharLimit = Math.min(...selectedNetworks.map(n => 
    networks.find(net => net.id === n)?.maxLength || 280
  ));

  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Criar Novo Post
          </h1>
          <p className="text-muted-foreground">
            Crie e agende posts para suas redes sociais
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Editor */}
          <div className="space-y-6">
            {/* Network selector */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Redes Sociais
              </Label>
              {connectedNetworks.length === 0 ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-foreground">Nenhuma rede conectada</p>
                    <p className="text-xs text-muted-foreground">
                      Conecte suas redes sociais nas <button onClick={() => navigate('/configuracoes')} className="text-primary hover:underline">configurações</button>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {networks.map(network => {
                    const isConnected = connectedNetworks.includes(network.id);
                    const isSelected = selectedNetworks.includes(network.id);
                    
                    if (!isConnected) return null;
                    
                    return (
                      <button
                        key={network.id}
                        onClick={() => toggleNetwork(network.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200",
                          isSelected 
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        <network.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{getNetworkName(network.id)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content editor */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-foreground">
                  Conteúdo
                </Label>
                <span className={cn(
                  "text-xs",
                  content.length > minCharLimit ? "text-destructive" : "text-muted-foreground"
                )}>
                  {content.length} / {minCharLimit}
                </span>
              </div>
              <Textarea
                placeholder="O que você quer compartilhar?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] bg-muted/30 border-0 resize-none text-base"
              />
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                    <Image className="w-5 h-5" />
                    <span className="text-sm">Imagem</span>
                  </div>
                </label>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  IA Sugestões
                </Button>
              </div>
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-foreground">
                    Mídia
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setImagePreview(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full max-h-64 object-cover rounded-xl"
                />
              </div>
            )}

            {/* Schedule */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Agendamento
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Data</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pl-10 bg-muted/30 border-0"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Horário</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="pl-10 bg-muted/30 border-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Repeat on multiple days */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                <CalendarDays className="w-5 h-5 text-primary" />
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-sm font-medium text-foreground">
                    Repetir em vários dias
                  </Label>
                  <Checkbox
                    checked={enableRepeat}
                    onCheckedChange={(checked) => {
                      setEnableRepeat(checked === true);
                      if (!checked) setRepeatOnDays([]);
                    }}
                  />
                </div>
              </div>
              
              {enableRepeat && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Selecione os dias da semana para publicar o mesmo post
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map(day => {
                      const isSelected = repeatOnDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            setRepeatOnDays(prev => 
                              isSelected 
                                ? prev.filter(d => d !== day.id)
                                : [...prev, day.id]
                            );
                          }}
                          className={cn(
                            "px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
                            isSelected 
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          )}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setRepeatOnDays([0, 1, 2, 3, 4, 5, 6])}
                  >
                    Selecionar todos
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleSchedule}
                className="flex-1 gap-2"
                size="lg"
                disabled={createPost.isPending}
              >
                {createPost.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {createPost.isPending ? 'Agendando...' : 'Agendar Post'}
              </Button>
              <Button variant="outline" size="lg">
                Salvar Rascunho
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="sticky top-4">
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Preview
              </Label>
              
              {selectedNetworks.map(network => (
                <div 
                  key={network} 
                  className="bg-card rounded-2xl border border-border p-4 mb-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <NetworkBadge network={network} size="sm" />
                  </div>
                  
                  {/* Mock post preview */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div>
                        <div className="font-medium text-foreground text-sm">@agendasaas</div>
                        <div className="text-xs text-muted-foreground">Agora</div>
                      </div>
                    </div>
                    
                    {imagePreview && (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full aspect-square object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {content || 'Seu texto aparecerá aqui...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
