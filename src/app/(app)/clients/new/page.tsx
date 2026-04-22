"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", website: "", notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    setSaving(true); setError("");

    const payload: Record<string, string> = { name: form.name };
    if (form.email)   payload.email   = form.email;
    if (form.phone)   payload.phone   = form.phone;
    if (form.company) payload.company = form.company;
    if (form.website) payload.website = form.website;
    if (form.notes)   payload.notes   = form.notes;

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erro ao criar cliente."); return; }
      router.push(`/clients/${json.data.id}`);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Novo Cliente" />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl space-y-5">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/clients"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>

        <Card>
          <CardHeader><CardTitle>Cadastrar Cliente</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nome *" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do cliente ou empresa" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="E-mail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contato@empresa.com" />
                <Input label="Telefone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Empresa" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Razão social" />
                <Input label="Website" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
                  placeholder="Notas internas..."
                  className="flex w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#6366f1] resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3 pt-1">
                <Button type="submit" isLoading={saving}>Salvar Cliente</Button>
                <Button type="button" variant="ghost" asChild>
                  <Link href="/clients">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
