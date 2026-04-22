import type {
  User,
  Client,
  Task,
  TaskStatus,
  Project,
  ProductionCard,
  PipelineStage,
  Transaction,
  TransactionType,
  Subscription,
  CrmDeal,
  CrmStage,
  ApprovalAsset,
  ApprovalVersion,
  ApprovalStatus,
  TimestampComment,
  Comment,
  Attachment,
  Webhook,
  WebhookEvent,
  ActivityLog,
  UserRole,
} from "@prisma/client";

export type {
  User, Client, Task, TaskStatus, Project, ProductionCard, PipelineStage,
  Transaction, TransactionType, Subscription, CrmDeal, CrmStage,
  ApprovalAsset, ApprovalVersion, ApprovalStatus, TimestampComment,
  Comment, Attachment, Webhook, WebhookEvent, ActivityLog, UserRole,
};

// Local definition — replaced by @prisma/client after `prisma generate` runs
export type SubTask = {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthUser = Pick<User, "id" | "name" | "email" | "role" | "avatar">;

export type TaskWithRelations = Task & {
  client?: Pick<Client, "id" | "name"> | null;
  assignees: Pick<User, "id" | "name" | "avatar">[];
  owner?: Pick<User, "id" | "name" | "avatar"> | null;
  subTasks?: SubTask[];
  _count?: { comments: number };
};

export type CardWithRelations = ProductionCard & {
  client?: Pick<Client, "id" | "name"> | null;
  assignees: Pick<User, "id" | "name" | "avatar">[];
  _count?: { comments: number; attachments: number };
};

export type DealWithRelations = CrmDeal & {
  client?: Pick<Client, "id" | "name"> | null;
  owner?: Pick<User, "id" | "name" | "avatar"> | null;
  _count?: { notes: number; followUps: number };
};

export type TransactionWithRelations = Transaction & {
  client?: Pick<Client, "id" | "name"> | null;
  category?: { id: string; name: string; color: string } | null;
};

export type DashboardStats = {
  revenue: { thisMonth: number; lastMonth: number; growth: number };
  expenses: { thisMonth: number };
  profit: { thisMonth: number };
  clients: { active: number; total: number };
  tasks: { dueToday: number; inProgress: number; overdue: number };
  deals: { pipeline: number; wonThisMonth: number };
  mrr: number;
  recentActivity: ActivityLog[];
};

export type ApiResponse<T> = { data: T; success: boolean; error?: string };
export type PaginatedResponse<T> = { data: T[]; total: number; page: number; perPage: number; totalPages: number };
