"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { CheckCircle, AlertCircle } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador", MANAGER: "Gerente", EDITOR: "Editor / Criativo", CLIENT: "Cliente",
};

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name ?? "", currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const payload: Record<string, string> = {};
    if (form.name && form.name !== user?.name) payload.name = form.name;
    if (form.newPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }

    if (Object.keys(payload).length === 0) {
      setMsg({ type: "error", text: "Nenhuma alteração detectada." });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: json.error ?? "Erro ao salvar." });
      } else {
        setUser(json.data);
        setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
        setMsg({ type: "success", text: "Configurações salvas com sucesso!" });
      }
    } catch {
      setMsg({ type: "error", text: "Erro de rede. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Configurações" />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#6366f1]/20 text-[#818cf8] text-xl font-semibold">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-[var(--muted-fg)]">{user?.email}</p>
                  <Badge variant="default" className="mt-1">{ROLE_LABELS[user?.role ?? "EDITOR"] ?? user?.role}</Badge>
                </div>
              </div>

              <Input
                label="Nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <div className="border-t border-[var(--border)] pt-4">
                <p className="text-sm font-medium mb-3">Alterar senha</p>
                <div className="space-y-3">
                  <Input
                    label="Senha atual"
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                    placeholder="Deixe em branco para não alterar"
                  />
                  <Input
                    label="Nova senha"
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              {msg && (
                <div className={`flex items-center gap-2 text-sm ${msg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {msg.type === "success"
                    ? <CheckCircle className="h-4 w-4 shrink-0" />
                    : <AlertCircle className="h-4 w-4 shrink-0" />}
                  {msg.text}
                </div>
              )}

              <Button type="submit" isLoading={saving}>Salvar alterações</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--muted-fg)]">
              Ações permanentes relacionadas à sua conta.
            </p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => useAuthStore.getState().logout()}
            >
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
