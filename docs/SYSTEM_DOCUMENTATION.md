# Documentação do Sistema Agendasaas

## Visão Geral

O Agendasaas é um SaaS de publicação e agendamento automático de posts em redes sociais. O sistema foi estruturado seguindo as APIs oficiais das plataformas (Meta, Twitter/X, LinkedIn) com foco em segurança, escalabilidade e conformidade.

## Arquitetura

### Frontend (React + TypeScript)
- **Pages**: Calendário, Criar Post, Agendamentos, Biblioteca, Analytics, Configurações
- **Components**: Layout responsivo, Cards de preview, Badges de rede
- **Hooks**: useAuth, useScheduledPosts, useSocialConnections

### Backend (Lovable Cloud/Supabase)
- **Database**: PostgreSQL com RLS (Row Level Security)
- **Edge Functions**: OAuth Callback, Publish Post
- **Auth**: Email/Password com Supabase Auth

## Fluxo de Autenticação

### 1. Autenticação de Usuários (Email/Password)
```
1. Usuário acessa /auth
2. Preenche email e senha
3. supabase.auth.signUp() ou signIn()
4. Token JWT armazenado no localStorage
5. Redirecionamento para /
```

### 2. OAuth das Redes Sociais
```
1. Usuário clica em "Conectar" na rede desejada
2. Redirecionamento para OAuth da plataforma
3. Usuário autoriza o app
4. Callback recebe código de autorização
5. Edge function troca código por access_token
6. Tokens são criptografados e salvos no banco
7. Usuário redirecionado de volta com confirmação
```

## Integrações por Plataforma

### Facebook (Meta Graph API v18.0)

**Permissões necessárias:**
- `pages_manage_posts` - Publicar em páginas
- `pages_read_engagement` - Ler métricas
- `pages_show_list` - Listar páginas do usuário

**Endpoint de publicação:**
```
POST /{page-id}/feed
{
  "message": "Conteúdo do post",
  "access_token": "{page_access_token}"
}
```

**Configuração:**
1. Criar app em developers.facebook.com
2. Adicionar produtos: Facebook Login, Pages API
3. Configurar OAuth redirect URI
4. Submeter para App Review

### Instagram (Meta Graph API v18.0)

**Requisitos:**
- Conta Business ou Creator
- Vinculada a uma Página do Facebook

**Fluxo de publicação:**
```
1. POST /{ig-user-id}/media
   {
     "image_url": "https://...",
     "caption": "Texto do post",
     "access_token": "{token}"
   }

2. POST /{ig-user-id}/media_publish
   {
     "creation_id": "{container_id}",
     "access_token": "{token}"
   }
```

### Twitter/X (API v2)

**Permissões:**
- Read and Write

**Endpoint:**
```
POST /2/tweets
Authorization: Bearer {access_token}
{
  "text": "Conteúdo do tweet"
}
```

**Configuração:**
1. Criar app em developer.twitter.com
2. Configurar OAuth 2.0 (PKCE)
3. Definir scopes: tweet.read, tweet.write, users.read

### LinkedIn (API v2)

**Permissões:**
- `w_member_social` - Publicar posts

**Endpoint:**
```
POST /v2/ugcPosts
Authorization: Bearer {access_token}
{
  "author": "urn:li:person:{user_id}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": { "text": "Conteúdo" },
      "shareMediaCategory": "NONE"
    }
  }
}
```

## Sistema de Agendamento

### Tabelas do Banco

**scheduled_posts**
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- content: TEXT
- media_urls: TEXT[]
- networks: network_type[]
- scheduled_at: TIMESTAMPTZ
- status: post_status (scheduled, published, failed, cancelled)

**post_logs**
- id: UUID (PK)
- post_id: UUID (FK -> scheduled_posts)
- network: network_type
- status: post_status
- external_post_id: TEXT
- error_message: TEXT
- published_at: TIMESTAMPTZ

### Fluxo de Publicação

```
1. Usuário cria post com data/hora agendada
2. Post é salvo com status "scheduled"
3. Worker (cron job) verifica posts pendentes
4. Para cada post:
   a. Busca conexões do usuário
   b. Descriptografa access_tokens
   c. Publica em cada rede
   d. Registra logs de sucesso/falha
   e. Atualiza status do post
```

### Tratamento de Erros

- **Token expirado**: Renovação automática via refresh_token
- **Falha na publicação**: Status "failed" + log de erro
- **Rede desconectada**: Skip da rede + log
- **Rate limit**: Retry com backoff exponencial

## Painel de Agendamentos

### Funcionalidades

1. **Listagem completa** de todos os posts agendados
2. **Filtros** por:
   - Plataforma (Facebook, Instagram, X, LinkedIn)
   - Status (Agendado, Publicado, Falhou, Cancelado)
   - Data
3. **Informações exibidas**:
   - Preview do conteúdo
   - Redes de destino
   - Data/hora agendada
   - Status atual
4. **Ações disponíveis**:
   - Editar agendamento
   - Cancelar publicação
   - Reagendar post
   - Ver logs de erro

## Segurança

### Armazenamento de Tokens

- Tokens são criptografados antes de salvar no banco
- Nenhum token é exposto no frontend
- Descriptografia apenas no backend (Edge Functions)
- Chave de criptografia armazenada como secret

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado:
```sql
-- Usuários só veem seus próprios dados
CREATE POLICY "Users can view own posts"
  ON public.scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);
```

### Secrets Necessários

Para configurar OAuth das redes sociais:

```
META_APP_ID          - ID do app Meta (Facebook/Instagram)
META_APP_SECRET      - Secret do app Meta
TWITTER_CLIENT_ID    - Client ID do app Twitter
TWITTER_CLIENT_SECRET- Secret do app Twitter
LINKEDIN_CLIENT_ID   - Client ID do app LinkedIn
LINKEDIN_CLIENT_SECRET - Secret do app LinkedIn
TOKEN_ENCRYPTION_KEY - Chave para criptografia de tokens
FRONTEND_URL         - URL do frontend para redirects
```

## Limites de API

### Meta (Facebook/Instagram)
- Rate limit: 200 chamadas/hora por usuário
- Tamanho máximo de imagem: 8MB

### Twitter/X
- Rate limit: 300 tweets/3 horas por usuário
- Tamanho máximo do tweet: 280 caracteres

### LinkedIn
- Rate limit: 100 posts/dia por usuário
- Tamanho máximo do post: 3000 caracteres

## Próximos Passos

1. Implementar sistema de filas (Queue) para publicação assíncrona
2. Adicionar renovação automática de tokens
3. Implementar analytics de engajamento
4. Adicionar suporte a Stories e Reels
5. Implementar sugestões de horários baseadas em IA
