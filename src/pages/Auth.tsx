import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, SignUpData } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Zap, Mail, Lock, User, Loader2, Phone, MapPin, Building2, Users, UserCircle, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Validation functions
const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  
  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[10])) return false;
  
  return true;
};

const validatePhone = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  
  // Must have 10 or 11 digits
  if (numbers.length < 10 || numbers.length > 11) return false;
  
  // DDD must be valid (11-99)
  const ddd = parseInt(numbers.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // Mobile phones start with 9 and have 11 digits, landlines have 10 digits
  if (numbers.length === 11 && numbers[2] !== '9') return false;
  
  return true;
};

const validateFullName = (name: string): boolean => {
  const trimmed = name.trim();
  // Must have at least first and last name
  const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
  if (parts.length < 2) return false;
  // Each part must have at least 2 characters
  if (parts.some(p => p.length < 2)) return false;
  // Must contain only letters, spaces and accents
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) return false;
  return true;
};

const validateCity = (city: string): boolean => {
  const trimmed = city.trim();
  if (trimmed.length < 2) return false;
  // Must contain only letters, spaces, accents and hyphens
  if (!/^[a-zA-ZÀ-ÿ\s\-]+$/.test(trimmed)) return false;
  return true;
};

// Zod schemas
const emailSchema = z.string().min(1, 'Email é obrigatório').email('Email inválido');
const passwordSchema = z.string().min(6, 'A senha deve ter pelo menos 6 caracteres');
const cpfSchema = z.string()
  .min(1, 'CPF é obrigatório')
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: XXX.XXX.XXX-XX)')
  .refine(validateCPF, 'CPF inválido - dígitos verificadores incorretos');
const phoneSchema = z.string()
  .min(1, 'Telefone é obrigatório')
  .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido (formato: (XX) XXXXX-XXXX)')
  .refine(validatePhone, 'Telefone inválido - DDD ou número incorreto');
const nameSchema = z.string()
  .min(1, 'Nome é obrigatório')
  .refine(validateFullName, 'Informe nome e sobrenome (apenas letras)');
const citySchema = z.string()
  .min(1, 'Cidade é obrigatória')
  .refine(validateCity, 'Cidade inválida (apenas letras)');

type UsageType = 'personal' | 'business' | 'multiple_businesses';

interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  cpf?: string;
  phone?: string;
  city?: string;
  usageType?: string;
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

export default function Auth() {
  const { user, signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [usageType, setUsageType] = useState<UsageType>('personal');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateLogin = () => {
    const newErrors: FormErrors = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUp = () => {
    const newErrors: FormErrors = {};
    
    try {
      nameSchema.parse(fullName);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.fullName = e.errors[0].message;
      }
    }

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    try {
      cpfSchema.parse(cpf);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.cpf = e.errors[0].message;
      }
    }

    try {
      phoneSchema.parse(phone);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.phone = e.errors[0].message;
      }
    }

    try {
      citySchema.parse(city);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.city = e.errors[0].message;
      }
    }

    if (!usageType) {
      newErrors.usageType = 'Selecione o tipo de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = isLogin ? validateLogin() : validateSignUp();
    if (!isValid) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Erro ao entrar",
              description: "Email ou senha incorretos.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erro ao entrar",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Bem-vindo!",
            description: "Login realizado com sucesso."
          });
        }
      } else {
        const signUpData: SignUpData = {
          email,
          password,
          fullName,
          cpf,
          phone,
          city,
          usageType
        };
        
        const { error } = await signUp(signUpData);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Erro no cadastro",
              description: "Este email já está cadastrado. Tente fazer login.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erro no cadastro",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Verifique seu email!",
            description: "Enviamos um link de confirmação para seu email. Clique nele para ativar sua conta."
          });
          setIsLogin(true);
          resetForm();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setCpf('');
    setPhone('');
    setCity('');
    setUsageType('personal');
    setErrors({});
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Erro ao entrar com Google",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Zap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Agendasaas</h1>
          <p className="text-muted-foreground mt-1">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Full Name */}
                <div>
                  <Label className="text-sm text-foreground mb-1.5 block">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 bg-muted/30 border-border"
                      aria-label="Nome completo"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* CPF */}
                <div>
                  <Label className="text-sm text-foreground mb-1.5 block">CPF</Label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      className="pl-10 bg-muted/30 border-border"
                      aria-label="CPF"
                    />
                  </div>
                  {errors.cpf && (
                    <p className="text-sm text-destructive mt-1">{errors.cpf}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label className="text-sm text-foreground mb-1.5 block">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      className="pl-10 bg-muted/30 border-border"
                      aria-label="Telefone"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <Label className="text-sm text-foreground mb-1.5 block">Cidade</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Sua cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="pl-10 bg-muted/30 border-border"
                      aria-label="Cidade"
                    />
                  </div>
                  {errors.city && (
                    <p className="text-sm text-destructive mt-1">{errors.city}</p>
                  )}
                </div>

                {/* Usage Type */}
                <div>
                  <Label className="text-sm text-foreground mb-3 block">Para qual uso?</Label>
                  <RadioGroup
                    value={usageType}
                    onValueChange={(value) => setUsageType(value as UsageType)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="personal" id="personal" />
                      <Label htmlFor="personal" className="flex items-center gap-2 cursor-pointer flex-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">Uso pessoal</p>
                          <p className="text-xs text-muted-foreground">Para gerenciar suas próprias redes sociais</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="business" id="business" />
                      <Label htmlFor="business" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">Uma empresa</p>
                          <p className="text-xs text-muted-foreground">Para gerenciar redes de uma empresa</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="multiple_businesses" id="multiple_businesses" />
                      <Label htmlFor="multiple_businesses" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">Várias empresas</p>
                          <p className="text-xs text-muted-foreground">Para agências ou múltiplos clientes</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.usageType && (
                    <p className="text-sm text-destructive mt-1">{errors.usageType}</p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-muted/30 border-border"
                  aria-label="Email"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-muted/30 border-border"
                  aria-label="Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
              {isLogin && (
                <div className="text-right">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Entrando...' : 'Criando conta...'}
                </>
              ) : (
                isLogin ? 'Entrar' : 'Criar conta'
              )}
            </Button>
          </form>

          {isLogin && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Entrar com Google
              </Button>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? (
                <>Não tem conta? <span className="text-primary font-medium">Cadastre-se</span></>
              ) : (
                <>Já tem conta? <span className="text-primary font-medium">Entrar</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
