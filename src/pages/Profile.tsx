import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { User, Phone, MapPin, Mail, Loader2, Save, UserCircle, Building2, Users, Camera } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UsageType = 'personal' | 'business' | 'multiple_businesses';

interface ProfileData {
  full_name: string | null;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  city: string | null;
  usage_type: string | null;
  avatar_url: string | null;
}

const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    cpf: '',
    phone: '',
    city: '',
    usage_type: 'personal',
    avatar_url: null
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          cpf: data.cpf || '',
          phone: data.phone || '',
          city: data.city || '',
          usage_type: data.usage_type || 'personal',
          avatar_url: data.avatar_url || null
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro ao carregar perfil",
        description: "Não foi possível carregar seus dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Delete existing avatar if any
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('avatars').remove(filesToDelete);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));

      toast({
        title: "Avatar atualizado!",
        description: "Sua foto de perfil foi alterada com sucesso."
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro ao enviar foto",
        description: "Não foi possível atualizar sua foto de perfil.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          city: profile.city,
          cpf: profile.cpf,
          usage_type: profile.usage_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Meu Perfil</h1>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                aria-label="Alterar foto de perfil"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                aria-label="Upload de foto de perfil"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Clique para alterar a foto</p>
          </div>

          {/* Full Name */}
          <div>
            <Label className="text-sm text-foreground mb-1.5 block">Nome completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Seu nome completo"
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="pl-10 bg-muted/30 border-border"
              />
            </div>
          </div>

          {/* Email - Read Only */}
          <div>
            <Label className="text-sm text-foreground mb-1.5 block">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={profile.email || ''}
                disabled
                className="pl-10 bg-muted/50 border-border cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado</p>
          </div>

          {/* CPF */}
          <div>
            <Label className="text-sm text-foreground mb-1.5 block">CPF</Label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="000.000.000-00"
                value={profile.cpf || ''}
                onChange={(e) => setProfile({ ...profile, cpf: formatCPF(e.target.value) })}
                className="pl-10 bg-muted/30 border-border"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <Label className="text-sm text-foreground mb-1.5 block">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="(00) 00000-0000"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: formatPhone(e.target.value) })}
                className="pl-10 bg-muted/30 border-border"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <Label className="text-sm text-foreground mb-1.5 block">Cidade</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Sua cidade"
                value={profile.city || ''}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="pl-10 bg-muted/30 border-border"
              />
            </div>
          </div>

          {/* Usage Type */}
          <div>
            <Label className="text-sm text-foreground mb-3 block">Tipo de uso</Label>
            <RadioGroup
              value={profile.usage_type || 'personal'}
              onValueChange={(value) => setProfile({ ...profile, usage_type: value as UsageType })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="personal" id="profile-personal" />
                <Label htmlFor="profile-personal" className="flex items-center gap-2 cursor-pointer flex-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Uso pessoal</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="business" id="profile-business" />
                <Label htmlFor="profile-business" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Uma empresa</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="multiple_businesses" id="profile-multiple" />
                <Label htmlFor="profile-multiple" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Várias empresas</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
