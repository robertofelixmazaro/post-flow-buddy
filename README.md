# Post Perfector

# Agendasaas

## 🎯 VISÃO GERAL DO PROJETO

**Tipo:** Agendador de Posts
**Categoria:** social-media
**Descrição:** Agende posts para múltiplas redes sociais, visualize calendário editorial e otimize horários de publicação.

**Problema que resolve:** Dificuldade em manter consistência nas publicações e gerenciar múltiplas redes simultaneamente
**Público-alvo:** Criadores de conteúdo, gestores de redes sociais e pequenos negócios



---

## 🏗️ ARQUITETURA DE INTERFACE

### Layout Principal
Layout dividido com preview lateral e calendário/lista principal

### Estrutura de Navegação
1. Calendário - Visão mensal/semanal de todos os posts
2. Criar Post - Editor com preview em tempo real
3. Biblioteca de Mídia - Galeria organizada por pastas
4. Analytics - Métricas de performance por post/rede
5. Configurações - Conexão com redes e horários preferidos

---



## 📱 TELAS E COMPONENTES ESPECÍFICOS

### Tela 1: Calendário
**Propósito:** Visão mensal/semanal de todos os posts
**Componentes principais:**
- Header com título e ações contextuais
- Área principal de conteúdo responsiva
- Feedback de estados (loading, empty, error)
- Toast notifications para ações
**Ações disponíveis:**
- Criar novo item
- Editar existente
- Excluir com confirmação
- Filtrar e buscar

### Tela 2: Criar Post
**Propósito:** Editor com preview em tempo real
**Componentes principais:**
- Header com título e ações contextuais
- Área principal de conteúdo responsiva
- Feedback de estados (loading, empty, error)
- Toast notifications para ações
**Ações disponíveis:**
- Criar novo item
- Editar existente
- Excluir com confirmação
- Filtrar e buscar

### Tela 3: Biblioteca de Mídia
**Propósito:** Galeria organizada por pastas
**Componentes principais:**
- Header com título e ações contextuais
- Área principal de conteúdo responsiva
- Feedback de estados (loading, empty, error)
- Toast notifications para ações
**Ações disponíveis:**
- Criar novo item
- Editar existente
- Excluir com confirmação
- Filtrar e buscar

### Tela 4: Analytics
**Propósito:** Métricas de performance por post/rede
**Componentes principais:**
- Header com título e ações contextuais
- Área principal de conteúdo responsiva
- Feedback de estados (loading, empty, error)
- Toast notifications para ações
**Ações disponíveis:**
- Criar novo item
- Editar existente
- Excluir com confirmação
- Filtrar e buscar

### Tela 5: Configurações
**Propósito:** Conexão com redes e horários preferidos
**Componentes principais:**
- Header com título e ações contextuais
- Área principal de conteúdo responsiva
- Feedback de estados (loading, empty, error)
- Toast notifications para ações
**Ações disponíveis:**
- Criar novo item
- Editar existente
- Excluir com confirmação
- Filtrar e buscar


---

## 🧩 COMPONENTES OBRIGATÓRIOS

1. Calendário editorial mensal com posts coloridos por rede
2. Cards de preview de post com mockup de cada rede social
3. Timeline vertical de agendamentos do dia
4. Biblioteca de mídia em grid com drag-and-drop
5. Barra de status com contagem de posts por rede

---

## ⚡ ELEMENTOS INTERATIVOS

1. Drag-and-drop de posts no calendário
2. Editor rich-text com contador de caracteres
3. Seletor multi-rede (Instagram, Facebook, Twitter, LinkedIn)
4. Upload de mídia com crop e filtros básicos
5. Botões de ação rápida (duplicar, agendar, excluir)

---

## 🔧 FUNCIONALIDADES DETALHADAS

### 1. Agendamento multi-plataforma

**Requisitos técnicos:**
- Interface intuitiva e responsiva
- Validação de dados em tempo real
- Feedback visual em cada ação
- Persistência no Supabase

**Estados a implementar:**
- Loading (skeleton ou spinner)
- Sucesso (toast de confirmação)
- Erro (mensagem clara com retry)
- Vazio (ilustração + CTA)

### 2. Calendário editorial

**Requisitos técnicos:**
- Interface intuitiva e responsiva
- Validação de dados em tempo real
- Feedback visual em cada ação
- Persistência no Supabase

**Estados a implementar:**
- Loading (skeleton ou spinner)
- Sucesso (toast de confirmação)
- Erro (mensagem clara com retry)
- Vazio (ilustração + CTA)

### 3. Preview de posts

**Requisitos técnicos:**
- Interface intuitiva e responsiva
- Validação de dados em tempo real
- Feedback visual em cada ação
- Persistência no Supabase

**Estados a implementar:**
- Loading (skeleton ou spinner)
- Sucesso (toast de confirmação)
- Erro (mensagem clara com retry)
- Vazio (ilustração + CTA)

### 4. Análise de horários

**Requisitos técnicos:**
- Interface intuitiva e responsiva
- Validação de dados em tempo real
- Feedback visual em cada ação
- Persistência no Supabase

**Estados a implementar:**
- Loading (skeleton ou spinner)
- Sucesso (toast de confirmação)
- Erro (mensagem clara com retry)
- Vazio (ilustração + CTA)

### 5. Biblioteca de mídia

**Requisitos técnicos:**
- Interface intuitiva e responsiva
- Validação de dados em tempo real
- Feedback visual em cada ação
- Persistência no Supabase

**Estados a implementar:**
- Loading (skeleton ou spinner)
- Sucesso (toast de confirmação)
- Erro (mensagem clara com retry)
- Vazio (ilustração + CTA)


---


## DADOS DE EXEMPLO (MOCK DATA)

**Entidades principais:** Posts, Redes Sociais, Agendamentos

**Quantidades sugeridas:** 12 posts agendados, 4 redes conectadas, 53 arquivos na biblioteca


**Posts agendados esta semana:**
- Segunda 09:00 - Instagram: "Novidade chegando! 🚀" (com imagem)
- Segunda 18:00 - LinkedIn: Artigo sobre produtividade
- Terça 12:00 - Instagram Stories: Bastidores do projeto
- Quarta 10:00 - Twitter: Thread sobre tendências 2024
- Quinta 09:00 - Instagram: Carrossel de dicas
- Sexta 15:00 - Facebook: Promoção de fim de semana

**Biblioteca de mídia:** 45 imagens, 8 vídeos
**Redes conectadas:** Instagram, Facebook, Twitter, LinkedIn
**Melhores horários sugeridos:** Seg-Sex 9h, 12h, 18h | Sáb-Dom 10h, 16h


**IMPORTANTE:** Estes dados devem estar pré-populados no sistema desde o primeiro acesso, demonstrando imediatamente todas as funcionalidades.


---

## 🎨 ESPECIFICAÇÕES VISUAIS (ESCOLHAS DO USUÁRIO)

### Tema: Dark Mode
- Fundo principal #0d1117 (GitHub dark)
- Cards em #161b22 com bordas #30363d
- Acentos brilhantes para elementos interativos
- Contraste alto para legibilidade
- Tipografia clara sobre fundo escuro
- Estados hover com leve clareamento
- Sombras escuras para profundidade
- Ícones em cores claras/vibrantes

### Paleta de Cores (OBRIGATÓRIO - Definida pelo Usuário)
- **Cor Primária:** #02f71f - USAR em botões principais, links, elementos de destaque, ícones ativos
- **Cor Secundária:** #02f71f - USAR em backgrounds secundários, bordas, elementos complementares, badges
- **Esquema de Cores:** Dark Mode OBRIGATÓRIO - fundo escuro, textos claros
- **Variações:** Criar tons mais claros (10%, 20%) e escuros da cor primária para hovers e estados

### Aplicação das Cores
- Botões primários: background #02f71f, texto branco/escuro conforme contraste
- Botões secundários: background #02f71f ou outline com #02f71f
- Links e textos destacados: #02f71f
- Ícones ativos/selecionados: #02f71f
- Bordas de cards selecionados: #02f71f
- Tags e badges: variações de #02f71f
- Gráficos: usar #02f71f como cor principal, #02f71f como secundária

### Tipografia
- **Headings:** Font-weight 600-700, tamanhos proporcionais (2xl, xl, lg)
- **Body:** Font-weight 400-500, line-height confortável (1.5-1.6)
- **Labels:** Font-weight 500, uppercase para categorias

### Padrões de UI
- Preview side-by-side mostrando como ficará em cada rede
- Badges coloridos por rede social (rosa Instagram, azul Facebook)
- Cards de post com thumbnail, texto truncado e badges de status
- Modal fullscreen para criação de posts
- Toast notifications para confirmações de agendamento

---

## 🔌 ESPECIFICAÇÕES TÉCNICAS

### Stack Obrigatória
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage)
- **Componentes UI:** shadcn/ui
- **Plataforma:** Lovable

### Estrutura de Dados (Supabase)
Criar tabelas necessárias para armazenar:
- Dados de: Agendamento multi-plataforma
- Dados de: Calendário editorial
- Dados de: Preview de posts
- Dados de: Análise de horários
- Dados de: Biblioteca de mídia

### Autenticação
- Login/Registro com Supabase Auth
- Proteção de rotas autenticadas
- Recuperação de senha por email
- Sessão persistente

### Responsividade
- Mobile-first design obrigatório
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Menu hamburger em mobile
- Touch-friendly em dispositivos móveis

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Interface
- [ ] Todas as telas implementadas e navegáveis
- [ ] Componentes responsivos em todos os breakpoints
- [ ] **Cores primária (#02f71f) e secundária (#02f71f) aplicadas corretamente**
- [ ] **Estilo visual Dark Mode implementado**
- [ ] Estados de loading com skeletons
- [ ] Estados vazios com mensagens e CTAs
- [ ] Feedback visual em todas as ações (toasts, animações)

### Funcionalidades
- [ ] Agendamento multi-plataforma
- [ ] Calendário editorial
- [ ] Preview de posts
- [ ] Análise de horários
- [ ] Biblioteca de mídia
- [ ] CRUD completo para todas as entidades
- [ ] Validação de formulários em tempo real
- [ ] Filtros e busca funcionando
- [ ] Ordenação de listas
- [ ] Paginação onde necessário

### Dados
- [ ] Mock data inserido conforme especificado
- [ ] Gráficos com dados de exemplo
- [ ] Estatísticas calculadas corretamente

### Qualidade
- [ ] Código limpo e componentizado
- [ ] TypeScript sem erros
- [ ] Performance otimizada
- [ ] Acessibilidade básica (labels, contraste, navegação por teclado)

---

## 📋 IDIOMA DA INTERFACE
Todos os textos da interface (labels, botões, mensagens, placeholders) devem estar em: **Português**

---

## 📱 PWA (PROGRESSIVE WEB APP) - APLICATIVO INSTALÁVEL

**IMPORTANTE:** Este projeto DEVE ser configurado como PWA instalável.

### Requisitos Obrigatórios:
1. **Instalar vite-plugin-pwa** como dependência
2. **Configurar manifest.json** com nome, ícones e cores do tema
3. **Service Worker** para cache de assets e funcionamento offline
4. **Página /install** com botão de instalação e instruções
5. **Meta tags** otimizadas para iOS e Android
6. **Funcionalidade offline** básica

### Configuração do Manifest:
- **name:** Agendasaas
- **short_name:** Agendasaas
- **theme_color:** #02f71f
- **background_color:** #0d1117
- **display:** standalone
- **start_url:** /
- **Ícones:** Gerar versões 192x192 e 512x512

### Service Worker:
- Cache de assets estáticos (JS, CSS, imagens)
- Estratégia cache-first para performance
- Atualização em background quando online

### Página de Instalação (/install):
- Detectar se já está instalado
- Botão "Instalar App" que aciona o prompt nativo
- Instruções específicas para iOS (Safari → Compartilhar → Adicionar à Tela Inicial)
- Visual atrativo explicando benefícios do app

---

**⚠️ IMPORTANTE:** Este é um MVP 100% funcional, não um protótipo visual. Todas as funcionalidades devem estar completamente implementadas e operacionais desde o primeiro deploy.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://post-flow-buddy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5df0bb64-077c-46f3-9afb-8386ad33d874).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
