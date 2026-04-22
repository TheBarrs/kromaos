"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "BRIEFING",    label: "Briefing" },
  { value: "IN_PROGRESS", label: "Em Andamento" },
  { value: "REVIEW",      label: "Revisão" },
  { value: "APPROVED",    label: "Aprovado" },
  { value: "DELIVERED",   label: "Entregue" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW",    label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH",   label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

type Client = { id: string; name: string };

export default function NewTaskPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "BRIEFING",
    priority: "MEDIUM",
    dueDate: "",
    clientId: "",
    tags: [] as string[],
  });

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then((j) => setClients(j.data?.data ?? []));
  }, []);

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Título é obrigatório."); return; }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          clientId: form.clientId || undefined,
          dueDate: form.dueDate || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erro ao criar tarefa."); return; }
      router.push(`/tasks/${json.data.id}`);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Nova Tarefa" />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tasks"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>

        <Card>
          <CardHeader><CardTitle>Criar Tarefa</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Título *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Descreva a tarefa..."
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detalhes adicionais..."
                  rows={3}
                  className="flex w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#6366f1] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  >
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Prioridade</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  >
                    {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Cliente</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className="flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  >
                    <option value="">Nenhum</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Input
                  label="Data de entrega"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
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
                    placeholder="Digite e pressione Enter"
                    className="flex-1 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {form.tags.map((tag) => (
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

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={saving}>Criar Tarefa</Button>
                <Button type="button" variant="ghost" asChild>
                  <Link href="/tasks">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
