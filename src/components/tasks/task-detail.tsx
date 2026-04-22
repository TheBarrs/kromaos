"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import {
  ArrowLeft, Calendar, User, Tag, CheckSquare,
  Plus, Trash2, MessageSquare, Check, Pencil, Save, X,
} from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "BRIEFING",    label: "Briefing",      color: "bg-slate-500" },
  { value: "IN_PROGRESS", label: "Em Andamento",  color: "bg-blue-500" },
  { value: "REVIEW",      label: "Revisão",        color: "bg-amber-500" },
  { value: "APPROVED",    label: "Aprovado",       color: "bg-emerald-500" },
  { value: "DELIVERED",   label: "Entregue",       color: "bg-purple-500" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW",    label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH",   label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-slate-400", MEDIUM: "text-amber-400", HIGH: "text-orange-400", URGENT: "text-red-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", URGENT: "Urgente",
};

type SubTask = { id: string; title: string; completed: boolean; position: number };
type Comment = {
  id: string; content: string; createdAt: Date | string;
  author: { id: string; name: string; avatar: string | null } | null;
};
type Task = {
  id: string; title: string; description: string | null;
  status: string; priority: string; dueDate: Date | string | null;
  tags: string[];
  client: { id: string; name: string } | null;
  owner: { id: string; name: string; avatar: string | null } | null;
  assignees: { id: string; name: string; avatar: string | null }[];
  comments: Comment[];
  subTasks: SubTask[];
  statusHistory: { id: string; fromStatus: string | null; toStatus: string; changedAt: Date | string }[];
};

function toDateInput(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

type ClientOption = { id: string; name: string };

export function TaskDetail({ task: initialTask }: { task: Task }) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [subTasks, setSubTasks] = useState<SubTask[]>(initialTask.subTasks);
  const [clients, setClients] = useState<ClientOption[]>([]);

  useEffect(() => {
    fetch("/api/clients?perPage=100")
      .then((r) => r.json())
      .then((j) => setClients(j.data?.data ?? []));
  }, []);

  // ── Edit mode ──────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: initialTask.title,
    description: initialTask.description ?? "",
    priority: initialTask.priority,
    dueDate: toDateInput(initialTask.dueDate),
    clientId: initialTask.client?.id ?? "",
    tags: initialTask.tags,
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function startEdit() {
    setEditForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      dueDate: toDateInput(task.dueDate),
      clientId: task.client?.id ?? "",
      tags: [...task.tags],
    });
    setTagInput("");
    setSaveError("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError("");
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !editForm.tags.includes(t)) {
      setEditForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setEditForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  async function handleSave() {
    if (!editForm.title.trim()) { setSaveError("Título não pode ser vazio."); return; }
    setSaving(true); setSaveError("");
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description || undefined,
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
        clientId: editForm.clientId || null,
        tags: editForm.tags,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setTask((t) => ({ ...t, ...json.data, tags: json.data.tags ?? editForm.tags }));
      setEditing(false);
      router.refresh();
    } else {
      setSaveError("Erro ao salvar. Tente novamente.");
    }
    setSaving(false);
  }

  // ── Status ─────────────────────────────────────────────────
  const [updatingStatus, setUpdatingStatus] = useState(false);
  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setTask((t) => ({ ...t, status }));
    setUpdatingStatus(false);
    router.refresh();
  }

  // ── Subtasks ───────────────────────────────────────────────
  const [newSubTask, setNewSubTask] = useState("");
  const [addingSubTask, setAddingSubTask] = useState(false);

  async function addSubTask() {
    const title = newSubTask.trim();
    if (!title) return;
    setAddingSubTask(true);
    const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const json = await res.json();
      setSubTasks((s) => [...s, json.data]);
      setNewSubTask("");
    }
    setAddingSubTask(false);
  }

  async function toggleSubTask(st: SubTask) {
    const updated = { ...st, completed: !st.completed };
    setSubTasks((s) => s.map((x) => (x.id === st.id ? updated : x)));
    await fetch(`/api/tasks/${task.id}/subtasks/${st.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: updated.completed }),
    });
  }

  async function deleteSubTask(id: string) {
    setSubTasks((s) => s.filter((st) => st.id !== id));
    await fetch(`/api/tasks/${task.id}/subtasks/${id}`, { method: "DELETE" });
  }

  // ── Comments ───────────────────────────────────────────────
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localComments, setLocalComments] = useState(initialTask.comments);

  async function submitComment() {
    const content = comment.trim();
    if (!content) return;
    setSubmittingComment(true);
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const json = await res.json();
      setLocalComments((c) => [...c, json.data]);
      setComment("");
    }
    setSubmittingComment(false);
  }

  // ── Delete ─────────────────────────────────────────────────
  const [deleting, setDeleting] = useState(false);
  async function deleteTask() {
    if (!confirm("Deletar esta tarefa?")) return;
    setDeleting(true);
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    router.push("/tasks");
  }

  const completed = subTasks.filter((s) => s.completed).length;
  const progress = subTasks.length > 0 ? Math.round((completed / subTasks.length) * 100) : 0;
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === task.status);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Top bar */}
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks"><ArrowLeft className="h-4 w-4" />Tarefas</Link>
          </Button>
          <div className="ml-auto flex gap-2">
            {editing ? (
              <>
                <Button size="sm" isLoading={saving} onClick={handleSave}>
                  <Save className="h-3.5 w-3.5" />Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  <X className="h-3.5 w-3.5" />Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" />Editar Tarefa
                </Button>
                <Button size="sm" variant="danger" isLoading={deleting} onClick={deleteTask}>
                  <Trash2 className="h-3.5 w-3.5" />Deletar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Title + Description (edit or view) */}
        {editing ? (
          <div className="space-y-3">
            <Input
              label="Título"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título da tarefa"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Detalhes da tarefa..."
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#6366f1] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Prioridade</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                >
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <Input
                label="Data de entrega"
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Cliente</label>
              <select
                value={editForm.clientId}
                onChange={(e) => setEditForm((f) => ({ ...f, clientId: e.target.value }))}
                className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
              >
                <option value="">Nenhum</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Nova tag + Enter"
                  className="flex-1 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {editForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {editForm.tags.map((tag) => (
                    <span
                      key={tag}
                      onClick={() => removeTag(tag)}
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#818cf8] cursor-pointer hover:bg-red-500/15 hover:text-red-400 transition-colors"
                    >
                      {tag} ×
                    </span>
                  ))}
                </div>
              )}
            </div>

            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-semibold">{task.title}</h1>
            {task.description && (
              <p className="mt-2 text-sm text-[var(--muted-fg)] leading-relaxed whitespace-pre-wrap">{task.description}</p>
            )}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="muted" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subtasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckSquare className="h-4 w-4 text-[#6366f1]" />
                Subtarefas
                {subTasks.length > 0 && (
                  <span className="text-xs text-[var(--muted-fg)]">{completed}/{subTasks.length}</span>
                )}
              </CardTitle>
            </div>
            {subTasks.length > 0 && (
              <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--surface-2)]">
                <div className="h-full rounded-full bg-[#6366f1] transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {subTasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleSubTask(st)}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    st.completed ? "border-[#6366f1] bg-[#6366f1] text-white" : "border-[var(--border)] hover:border-[#6366f1]"
                  )}
                >
                  {st.completed && <Check className="h-2.5 w-2.5" />}
                </button>
                <span className={cn("flex-1 text-sm", st.completed && "line-through text-[var(--muted-fg)]")}>{st.title}</span>
                <button
                  onClick={() => deleteSubTask(st.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--muted-fg)] hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubTask(); } }}
                placeholder="Adicionar subtarefa..."
                className="flex-1 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
              />
              <Button size="sm" variant="outline" isLoading={addingSubTask} onClick={addSubTask}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-[#6366f1]" />
              Comentários ({localComments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {localComments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={c.author?.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px]">{c.author?.name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium">{c.author?.name ?? "Anônimo"}</span>
                    <span className="text-[10px] text-[var(--muted-fg)]">{formatRelativeTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[var(--foreground)] mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
            {localComments.length === 0 && <p className="text-xs text-[var(--muted-fg)]">Nenhum comentário ainda.</p>}
            <div className="space-y-2 pt-1">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário..."
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#6366f1] resize-none"
              />
              <Button size="sm" isLoading={submittingComment} onClick={submitComment}>Comentar</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Right sidebar ── */}
      <div className="w-64 shrink-0 border-l border-[var(--border)] overflow-y-auto p-4 space-y-5">
        {/* Status */}
        <div>
          <p className="text-xs font-medium text-[var(--muted-fg)] mb-2 flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", currentStatus?.color)} />Status
          </p>
          <select
            value={task.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updatingStatus}
            className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Priority (view only — editável via modo edição) */}
        <div>
          <p className="text-xs font-medium text-[var(--muted-fg)] mb-1">Prioridade</p>
          <span className={cn("text-sm font-medium", PRIORITY_COLORS[task.priority])}>
            {PRIORITY_LABELS[task.priority] ?? task.priority}
          </span>
        </div>

        {/* Due date */}
        {task.dueDate && (
          <div>
            <p className="text-xs font-medium text-[var(--muted-fg)] mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />Data de entrega
            </p>
            <p className="text-sm">{formatDate(task.dueDate)}</p>
          </div>
        )}

        {/* Client */}
        {task.client && (
          <div>
            <p className="text-xs font-medium text-[var(--muted-fg)] mb-1">Cliente</p>
            <p className="text-sm">{task.client.name}</p>
          </div>
        )}

        {/* Owner */}
        {task.owner && (
          <div>
            <p className="text-xs font-medium text-[var(--muted-fg)] mb-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />Responsável
            </p>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.owner.avatar ?? undefined} />
                <AvatarFallback className="text-[10px]">{task.owner.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{task.owner.name}</span>
            </div>
          </div>
        )}

        {/* Assignees */}
        {task.assignees.length > 0 && (
          <div>
            <p className="text-xs font-medium text-[var(--muted-fg)] mb-2">Atribuídos</p>
            <div className="space-y-1.5">
              {task.assignees.map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={u.avatar ?? undefined} />
                    <AvatarFallback className="text-[10px]">{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {task.statusHistory.length > 0 && (
          <div>
            <p className="text-xs font-medium text-[var(--muted-fg)] mb-2 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />Histórico
            </p>
            <div className="space-y-1.5">
              {task.statusHistory.map((h) => (
                <div key={h.id} className="text-[11px] text-[var(--muted-fg)]">
                  → {STATUS_OPTIONS.find((s) => s.value === h.toStatus)?.label ?? h.toStatus}
                  <span className="block text-[10px]">{formatRelativeTime(h.changedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
