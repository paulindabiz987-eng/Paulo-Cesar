# Agenda Hub — Guia rápido de configuração

Arquivos do pacote:

```
agenda-hub/
├── index.html      ← o app inteiro (layout, lógica, integrações)
├── manifest.json   ← dados de instalação do PWA
├── sw.js           ← service worker (offline + notificações)
└── icons/          ← ícones (iPhone e Android)
```

---

## 1) Hospedar grátis no GitHub Pages (≈3 min)

1. Crie uma conta em **github.com** (se ainda não tiver).
2. Clique em **New repository** → nome: `agenda-hub` → **Public** → *Create repository*.
3. Na página do repositório: **Add file › Upload files** → arraste **todo o conteúdo** da pasta (`index.html`, `manifest.json`, `sw.js` e a pasta `icons`) → **Commit changes**.
4. Vá em **Settings › Pages** → *Source*: **Deploy from a branch** → Branch **main** / pasta **/(root)** → **Save**.
5. Em 1–2 minutos o endereço aparece no topo da página:
   `https://paulindabiz987-eng.github.io/Paulo-Cesar/`

> Alternativa ainda mais simples: **app.netlify.com/drop** — arraste a pasta e pronto. Na Vercel, importe o repositório do GitHub (Add New › Project).
> Anote o endereço final: ele é usado no passo 2.

---

## 2) Google Cloud Console (Calendar, Drive e Gmail)

1. Acesse **console.cloud.google.com** → seletor de projetos → **Novo projeto** → nome `Agenda Hub` → Criar.
2. **APIs e serviços › Biblioteca** → ative as três:
   - **Google Calendar API**
   - **Google Drive API**
   - **Gmail API**
3. **Tela de consentimento OAuth** (pode aparecer como *Google Auth Platform*):
   - *Branding*: nome do app `Agenda Hub` + seu e-mail.
   - *Público-alvo*: **Externo**, status **Em teste** → em **Usuários de teste** adicione **o seu próprio Gmail**.
   - *Acesso a dados* (escopos): adicione
     `.../auth/calendar.events`, `.../auth/drive.file`, `.../auth/gmail.readonly`
4. **Credenciais / Clientes › Criar cliente OAuth** → tipo **Aplicativo da Web**:
   - **Origens JavaScript autorizadas**: `https://paulindabiz987-eng.github.io`
   - **URIs de redirecionamento autorizados**: `https://paulindabiz987-eng.github.io/Paulo-Cesar/`
     *(exatamente igual, com a barra no final — o próprio app mostra o endereço certo em Ajustes)*
   - Criar → copie o **ID do cliente** (`....apps.googleusercontent.com`).
5. **API_KEY**: opcional. O app funciona só com o CLIENT_ID (o login OAuth já autoriza tudo). Se quiser usar, crie em *Credenciais › Chave de API* e restrinja ao seu domínio.

**O que esperar no login:**
- Aparece o aviso *"O Google não verificou este app"* → toque em **Avançado › Acessar Agenda Hub**. É normal para app pessoal em modo teste.
- A sessão do Google dura **1 hora** (regra para apps sem servidor). Depois disso, toque em **Conectar** de novo; seus dados locais continuam funcionando normalmente.
- O escopo `drive.file` só deixa o app ver os arquivos que ele mesmo criou — ele não enxerga o resto do seu Drive.

---

## 3) Instalar no iPhone 12

1. Abra o endereço no **Safari** (precisa ser o Safari).
2. Toque em **Compartilhar** (quadrado com seta) → **Adicionar à Tela de Início** → Adicionar.
3. Abra o app **pelo ícone** da Tela de Início.
4. **Ajustes** (aba inferior) → cole o **CLIENT_ID** → **Salvar** → **Conectar Google**.
   *Dica: mande o CLIENT_ID para você mesmo (Notas, WhatsApp) para copiar e colar.*
5. Ainda em Ajustes → **Ativar notificações** → Permitir. (Exige iOS 16.4+ e o app aberto pela Tela de Início.)
6. Toque em **Enviar alerta de teste**.

Ao conectar, o app procura o `agenda_hub_backup.json` no Drive e, se ele for mais novo, **restaura automaticamente** tarefas, notas e ajustes — é assim que PC e iPhone ficam sincronizados.

---

## 4) Alertas: como cada camada funciona (importante)

| Camada | Funciona com o app fechado? | Configuração |
|---|---|---|
| Notificação local (Web) | **Não de forma confiável** — o iOS suspende web apps em segundo plano. Dispara com o app aberto ou recém-usado. | Ajustes › Ativar notificações |
| **ntfy.sh** (recomendado) | **Sim.** O app agenda cada lembrete no servidor do ntfy (até 3 dias à frente) e ele chega mesmo com o app fechado. | Instale o app **ntfy** na App Store → *Subscribe to topic* → use o mesmo tópico que você colocou em Ajustes |
| Telegram | Só envia quando o app está aberto (o Telegram não agenda mensagens). | Veja abaixo |
| Lembrete do Google Agenda | **Sim.** Todo evento criado pelo app já vai com lembrete pop-up de 15 min. | Tenha o app Google Agenda no iPhone com notificações ligadas |

**ntfy — cuidados:**
- O tópico é público: use um nome longo e difícil de adivinhar (ex.: `paulo-agenda-7f3k9q2x`).
- Os lembretes são agendados **sempre que você abre ou sincroniza o app**. Um evento criado direto no Google Agenda só entra no ntfy depois da próxima abertura do Hub (por isso a camada do Google Agenda é a rede de segurança).
- Se você apagar ou mudar o horário de um evento, um lembrete já agendado no ntfy ainda pode chegar.

**Telegram (opcional):**
1. No Telegram, fale com **@BotFather** → `/newbot` → copie o **token**.
2. Mande qualquer mensagem para o seu bot.
3. Abra no navegador `https://api.telegram.org/botSEU_TOKEN/getUpdates` e copie o número em `"chat":{"id": ...}`.
4. Cole token e chat_id em Ajustes.

**Web Push "de verdade"** (sem ntfy) exige um pequeno servidor de push (chaves VAPID). O `sw.js` já trata o evento `push`, então dá para ligar isso no futuro (por exemplo com um Cloudflare Worker) sem mexer no resto.

---

## 5) Notícias

- Os feeds são convertidos pelo **api.rss2json.com** (plano grátis tem limite diário de requisições). Se ele falhar, o app tenta o **allorigins** como reserva e, sem internet, mostra o último cache (guardado por 20 min).
- Para trocar fontes, edite o objeto `FEEDS` no `index.html`. As buscas do **Google News** (`GN('...')`) são as fontes mais estáveis; os demais são feeds diretos de portais (Contábeis, Agência Brasil, InfoMoney, Canaltech, TecMundo, Olhar Digital).

---

## 6) Atualizar o app depois

Sempre que alterar arquivos, mude a versão no topo do `sw.js` (ex.: `agenda-hub-v1.0.1`) e envie de novo para o GitHub. No iPhone, feche e abra o app duas vezes para pegar a versão nova.

## 7) Onde ficam seus dados

- **Neste aparelho**: LocalStorage (tarefas, notas, ajustes, cache de agenda/e-mails/notícias).
- **No seu Drive**: pasta `AgendaHub` › `agenda_hub_backup.json` (inclui os ajustes, inclusive token do Telegram).
- Eventos e e-mails ficam no Google; o app só guarda uma cópia de cache.
