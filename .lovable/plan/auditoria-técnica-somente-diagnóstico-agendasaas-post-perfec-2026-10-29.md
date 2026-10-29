# Auditoria técnica (somente diagnóstico) — Agendasaas / Post Perfector

Nenhum arquivo, banco, chave ou configuração foi alterado. Evidências vêm do código e de leituras no banco real (somente leitura).

**Estado real do banco hoje:** 4 usuários, 0 conexões com redes, 0 posts, 0 logs. Ou seja, nenhum fluxo de ponta a ponta jamais terminou de verdade.

## 1. Funcionalidades reais vs. mock
- **Real (lê/grava no banco):** cadastro/login, perfil, biblioteca de mídia, criação de posts, lista de agendamentos, página de logs.
- **Mock:** o Calendário (`CalendarView`, `DayTimeline`), `NetworkStats` (redes conectadas) e o Analytics importam dados fixos de `src/data/mockData.ts`. Os "melhores horários" das Configurações também vêm do mock.
- **Status:** parcial. **Risco:** alto, porque o cliente vê posts e números que não existem. **Próximo passo:** trocar o mock por consultas reais.

## 2. Autenticação e recuperação de senha
- Usa e-mail e senha, com `emailRedirectTo` e `resetPasswordForEmail` apontando para a página `/reset-password` (`useAuth.tsx:61,99`). As rotas existem e estão protegidas por `ProtectedRoute`.
- **Status:** parcial / não confirmado. Não testei o recebimento do e-mail nem a troca de senha, e não li as configurações de autenticação do servidor (confirmação de e-mail, proteção contra senhas vazadas).
- **Próximo passo:** testar o fluxo completo com uma conta real e conferir essas configurações.

## 3. Banco e RLS
- Todas as tabelas têm RLS por `auth.uid() = user_id`, e `post_logs` é somente leitura via o post. O isolamento entre usuários está correto para linhas de dados.
- **Falha crítica nos tokens:** `social_connections` permite SELECT pelo próprio usuário, e isso inclui `access_token_encrypted`. A "criptografia" é um XOR com chave fraca:
  - no frontend, a chave é a chave pública do app (`useFacebookSDK.tsx:371`), então qualquer pessoa consegue reverter;
  - no backend, `TOKEN_ENCRYPTION_KEY` não existe nos secrets, então a função cai na service role key.
- **Bug:** como frontend e backend usam chaves diferentes, os tokens do Facebook/Instagram salvos pelo SDK **não podem ser lidos** pelo `publish-post`. A publicação falharia.
- **Bug:** o tipo de rede no banco é `instagram, facebook, twitter, linkedin`. **Não existe `tiktok`**, então gravar uma conexão TikTok sempre falha.
- **Risco:** crítico.

## 4. OAuth
- **Callback:** `{backend}/functions/v1/oauth-callback`.
- **`state` sem assinatura:** é só `btoa({network,userId})` (`useSocialConnections.tsx:72`). O callback apenas confere se o usuário existe. Um atacante que saiba o UUID de uma vítima consegue vincular a própria conta de rede à conta dela (CSRF/forja). **Falha.**
- **Facebook/Instagram:** o App ID no `index.html` (`681638807610238`) já foi recusado pelo Facebook como inválido, e o valor atualizado nos secrets não chega ao HTML. As permissões pedidas (`pages_manage_posts`, `instagram_content_publish`, `business_management`) exigem App Review da Meta. **Status:** falha / não confirmado.
- **LinkedIn:** o último erro foi de redirect URI não cadastrado no painel do LinkedIn. `w_member_social` exige o produto "Share on LinkedIn". **Status:** não confirmado.
- **TikTok:** além do problema do tipo de rede, `video.publish` exige auditoria do app no TikTok. **Status:** falha.
- **Twitter/X:** aparece no tipo do banco e na documentação, mas não tem OAuth implementado.
- **`FRONTEND_URL`:** o código tem fallback para `lovable.dev`. Não consigo ler o valor real desse secret.
- **O que faltou para validar:** acesso aos painéis Meta, LinkedIn e TikTok.

## 5. Upload e mídia
- Bucket `media` público, tabela `media_files` com RLS e políticas de storage por usuário.
- Como o bucket é público, qualquer URL fica acessível para quem a tiver, mesmo com a política de SELECT. Isso é necessário para a Meta buscar a imagem, mas deixa as mídias expostas.
- **Status:** funciona (pelo código), mas não testei o upload. **Risco:** médio.

## 6. Criação, agendamento e repetição
- O insert em `scheduled_posts` é real (`useScheduledPosts.tsx:54`).
- A repetição (`repeatOnDays` em `CreatePost.tsx:73`) é só estado na tela. Não existe coluna nem lógica de recorrência no banco, então a regra é **mock / não confirmada**. A suposição é que ela cria posts separados ou não faz nada; precisa ser verificado clicando.

## 7. Publicação automática
- **Não há cron:** as extensões `pg_cron`/`pg_net` não estão instaladas (consulta ao `cron.job` falhou). Nada publica sozinho no horário. **Falha.**
- **`publish-post` sem autenticação:** roda com `verify_jwt=false`, e a autenticação é opcional (`index.ts:447-475`). Sem o header, a checagem de dono é pulada, então qualquer pessoa com um `postId` pode disparar a publicação. **Falha crítica.**
- **Sem retry nem renovação de token:** não há retry/backoff e não há renovação via refresh token, apenas a checagem de expiração. A documentação promete as duas coisas, mas o código não faz.
- **Logs:** a escrita existe, mas a tabela tem 0 registros.

## 8. Analytics
- 100% mock (`Analytics.tsx` usa `analyticsData`). Não há nenhuma chamada às APIs de métricas. **Status:** mock.

## 9. Planos e trial de 7 dias
- Nenhuma referência a plano, trial, Stripe ou pagamento no código. Não existe tabela de assinatura. Não existe landing page no projeto: a rota `/` é o painel protegido.
- **Status:** não implementado.
- **O que faltou:** se a landing está em outro projeto, preciso do link ou acesso a ele.

## 10. Build, dependências e rotas
- O log de build não mostra erros atuais. Todas as rotas do `App.tsx` têm páginas existentes.
- **Pendências:**
  - `index.html` tem o App ID fixo e o og:image padrão;
  - a documentação cita Twitter, que não foi implementado;
  - as chaves do TikTok e do LinkedIn estão como fallback fixo em `oauth.ts`.
- A varredura de dependências e o linter de segurança não foram executados; ficam para a fase 1.

---

## Plano de correção em fases

**Fase 1 — Segurança (bloqueia uso por clientes)**
1. Exigir JWT no `publish-post` e recusar chamadas sem dono válido. A execução pelo cron passa a usar um segredo interno.
2. Assinar o `state` do OAuth (HMAC com segredo + nonce + expiração) e validá-lo no callback.
3. Criar o secret `TOKEN_ENCRYPTION_KEY` e trocar o XOR por AES-GCM, feito **somente no backend**.
4. Mover o salvamento de tokens do SDK do Facebook para uma função do backend.
5. Bloquear o SELECT da coluna de token para o cliente, usando uma view sem a coluna ou revogando o acesso a ela.
6. Rodar o linter e a varredura de segurança.

**Fase 2 — Conexões funcionando**
1. Adicionar `tiktok` ao tipo de rede.
2. Corrigir o App ID do Facebook, carregando-o da configuração em vez do HTML.
3. Confirmar `FRONTEND_URL`.
4. Cadastrar o redirect nos painéis Meta, LinkedIn e TikTok e solicitar App Review/auditoria.
5. Remover Twitter ou implementá-lo.

**Fase 3 — Publicação confiável**
1. Instalar `pg_cron`/`pg_net` e criar um job a cada minuto chamando um worker que pega posts vencidos (com trava contra execução dupla).
2. Adicionar retry com backoff.
3. Renovar tokens (LinkedIn/TikTok via refresh token; Meta via token de longa duração).
4. Implementar a recorrência real no banco.

**Fase 4 — Dados reais na tela**
1. Ligar o Calendário e o `NetworkStats` aos posts e conexões reais.
2. Analytics com métricas das APIs ou um estado vazio honesto.

**Fase 5 — Monetização**
1. Tabela de assinatura com trial de 7 dias.
2. Pagamentos.
3. Landing pública em `/`, com o painel movido para `/app`.
