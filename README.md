# Kroma OS

> All-in-one agency management platform — Financial, Tasks, Production Pipeline, Creative Approvals, CRM.

---

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Framework   | Next.js 15 (App Router)                 |
| Language    | TypeScript                              |
| Styling     | Tailwind CSS v4 + dark design tokens    |
| UI          | Radix UI (custom ShadCN-style)          |
| ORM         | Prisma                                  |
| Database    | PostgreSQL                              |
| Auth        | Custom JWT (jose + bcryptjs)            |
| State       | Zustand                                 |
| Webhooks    | HMAC-signed async delivery              |

---

## Módulos

1. **Financeiro** — Receitas, despesas, MRR, assinaturas por cliente
2. **Tarefas** — Kanban + lista com status tracking e histórico
3. **Pipeline de Produção** — 8 estágios, drag-and-drop, attachments, comentários
4. **Aprovações Criativas** — Vídeo/imagem com comentários por timestamp + controle de versão
5. **CRM** — Pipeline de vendas com automações (deal won → cria cliente + tarefas de onboarding)

---

## Rodando Localmente

### 1. Pré-requisitos

- Node.js 20+
- PostgreSQL 15+

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Edite `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kromaos"
JWT_SECRET="gere-um-segredo-forte-aqui"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Gere segredos:
```bash
openssl rand -base64 32
```

### 4. Criar banco e aplicar schema

```bash
npx prisma migrate dev --name init
```

### 5. Criar usuário admin

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@kroma.dev","password":"senha123","role":"ADMIN"}'
```

### 6. Rodar

```bash
npm run dev
# http://localhost:3000
```

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (app)/           # App shell com sidebar
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── financial/
│   │   ├── tasks/
│   │   ├── pipeline/
│   │   ├── approvals/
│   │   ├── crm/
│   │   ├── settings/
│   │   └── webhooks/
│   └── api/             # REST API routes
├── components/
│   ├── ui/              # Button, Input, Card, Badge, Dialog, etc.
│   ├── layout/          # Sidebar, Topbar
│   ├── dashboard/       # StatCard
│   ├── financial/       # TransactionForm
│   ├── tasks/           # TaskBoard (Kanban), TaskListView
│   ├── pipeline/        # PipelineKanban
│   ├── approval/        # ApprovalReviewer (video + timestamp comments)
│   ├── crm/             # CrmPipeline
│   └── webhooks/        # WebhookForm
├── lib/
│   ├── prisma.ts        # Singleton Prisma client
│   ├── auth.ts          # JWT helpers + requireAuth
│   ├── api.ts           # Response helpers
│   ├── webhooks.ts      # Dispatcher HMAC-signed
│   └── automations.ts   # Deal won → client + tasks
├── store/auth.ts        # Zustand auth store
├── types/index.ts       # Shared TypeScript types
└── middleware.ts        # JWT guard + role routing
```

---

## Roles

| Role    | Acesso                                       |
|---------|----------------------------------------------|
| ADMIN   | Tudo                                         |
| MANAGER | Tudo exceto configurações de sistema         |
| EDITOR  | Tarefas, Pipeline, Aprovações                |
| CLIENT  | Apenas módulo de Aprovações                  |

---

## Automações

- **Deal WON** → cria Cliente + 3 tarefas de onboarding automaticamente
- **Task APPROVED** → dispara webhook `TASK_APPROVED`
- **Card movido** → registra histórico + webhook `CARD_STAGE_CHANGED`
- **Cliente criado** → webhook `CLIENT_CREATED`

---

## Webhooks

Configure em **Settings → Webhooks**.

Payload:
```json
{ "event": "DEAL_WON", "payload": { ... }, "timestamp": "2026-04-21T..." }
```

Header de validação: `X-Kroma-Signature` (HMAC-SHA256)

Eventos: `DEAL_WON` | `TASK_APPROVED` | `TASK_CREATED` | `CLIENT_CREATED` | `CARD_STAGE_CHANGED`

---

## Build para Produção

```bash
npm run build
npm start
```
