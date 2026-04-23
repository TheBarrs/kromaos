"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, Globe, Building2, Pencil, Trash2, CheckSquare, DollarSign, Save, X } from "lucide-react";
import Link from "next/link";

const TASK_STATUS: Record<string, { label: string; variant: "muted"|"warning"|"success"|"danger"|"default" }> = {
  BRIEFING:    { label: "Briefing",      variant: "muted" },
  IN_PROGRESS: { label: "Em Andamento",  variant: "warning" },
  REVIEW:      { label: "Revisão",       variant: "default" },
  APPROVED:    { label: "Aprovado",      variant: "success" },
  DELIVERED:   { label: "Entregue",      variant: "success" },
};

type Task = { id: string; title: string; status: string; dueDate: Date | string | null; priority: string };
type Transaction = { id: string; title: string; amount: unknown; type: string; date: Date | string; category: { name: string; color: string } | null };
type Subscription = { id: string; name: string; amount: unknown; billingDay: number };
type Client = {
  id: string; name: string; email: string | null; phone: string | null;
  company: string | null; website: string | null; notes: string | null;
  isActive: boolean; createdAt: Date | string;
  tasks: Task[];
  transactions: Transaction[];
  subscriptions: Subscription[];
  crmDeal: { id: string; stage: string; value: unknown } | null;
};

export function ClientDetail({ client: initial }: { client: Client }) {
  const router = useRouter();
  const [client, setClient] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: initial.name, email: initial.email ?? "", phone: initial.phone ?? "",
    company: initial.company ?? "", website: initial.website ?? "", notes: initial.notes ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        website: form.website || null,
        notes: form.notes || null,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setClient((c) => ({ ...c, ...json.data }));
      setEditing(false);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Deletar o cliente "${client.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    router.push("/clients");
  }

  async function toggleActive() {
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !client.isActive }),
    });
    if (res.ok) setClient((c) => ({ ...c, isActive: !c.isActive }));
  }

  const mrr = client.subscriptions.reduce((s, sub) => s + Number(sub.amount), 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/clients"><ArrowLeft className="h-4 w-4" />Clientes</Link>
        </Button>
        <div className="ml-auto flex gap-2">
          {editing ? (
            <>
              <Button size="sm" isLoading={saving} onClick={handleSave}><Save className="h-3.5 w-3.5" />Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" />Cancelar</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" />Editar</Button>
              <Button size="sm" variant="danger" isLoading={deleting} onClick={handleDelete}><Trash2 className="h-3.5 w-3.5" />Deletar</Button>
            </>
          )}
        </div>
      </div>

      {/* Profile */}
      <Card>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f97316]/15 text-[#fb923c] text-xl font-bold">
              {client.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Nome" value={form.name} onChange={(e) => set("name", e.target.value)} />
                    <Input label="Empresa" value={form.company} onChange={(e) => set("company", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="E-mail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                    <Input label="Telefone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <Input label="Website" value={form.website} onChange={(e) => set("website", e.target.value)} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Observações</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      rows={2}
                      className="flex w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] resize-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{client.name}</h2>
                    <Badge variant={client.isActive ? "success" : "muted"} className="cursor-pointer" onClick={toggleActive}>
                      {client.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {client.company && <p className="text-sm text-[var(--muted-fg)] flex items-center gap-1.5 mt-1"><Building2 className="h-3.5 w-3.5" />{client.company}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {client.email   && <a href={`mailto:${client.email}`}   className="flex items-center gap-1.5 text-sm text-[#fb923c] hover:underline"><Mail className="h-3.5 w-3.5" />{client.email}</a>}
                    {client.phone   && <span className="flex items-center gap-1.5 text-sm text-[var(--muted-fg)]"><Phone className="h-3.5 w-3.5" />{client.phone}</span>}
                    {client.website && <a href={client.website} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-sm text-[#fb923c] hover:underline"><Globe className="h-3.5 w-3.5" />{client.website}</a>}
                  </div>
                  {client.notes && <p className="mt-3 text-sm text-[var(--muted-fg)] bg-[var(--surface-2)] rounded-lg p-3">{client.notes}</p>}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckSquare className="h-4 w-4 text-[#f97316]" />Tarefas ({client.tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.tasks.length === 0 && <p className="text-xs text-[var(--muted-fg)]">Nenhuma tarefa.</p>}
            {client.tasks.map((t) => {
              const s = TASK_STATUS[t.status] ?? { label: t.status, variant: "muted" as const };
              return (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-[var(--surface-2)] transition-colors">
                  <span className="text-sm truncate">{t.title}</span>
                  <Badge variant={s.variant} className="shrink-0 text-[10px]">{s.label}</Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-[#f97316]" />Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mrr > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-fg)]">MRR</span>
                <span className="font-semibold text-emerald-400">{formatCurrency(mrr)}</span>
              </div>
            )}
            {client.transactions.length === 0 && mrr === 0 && <p className="text-xs text-[var(--muted-fg)]">Nenhuma transação.</p>}
            {client.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="truncate">{t.title}</p>
                  <p className="text-[10px] text-[var(--muted-fg)]">{formatDate(t.date)}</p>
                </div>
                <span className={cn("font-semibold shrink-0 ml-2", t.type === "INCOME" ? "text-emerald-400" : "text-red-400")}>
                  {t.type === "EXPENSE" ? "-" : "+"}{formatCurrency(Number(t.amount))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
