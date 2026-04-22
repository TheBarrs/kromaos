"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Erro ao criar conta"); return; }
      setUser(json.data.user);
      router.push("/dashboard");
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1]">
            <span className="text-sm font-bold text-white">K</span>
          </div>
          <span className="text-lg font-semibold">Kroma OS</span>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-7">
          <h1 className="text-xl font-semibold mb-1">Criar conta</h1>
          <p className="text-sm text-[var(--muted-fg)] mb-6">Preencha seus dados para começar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome" placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="E-mail" type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Senha" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" isLoading={loading}>Criar conta</Button>
          </form>

          <p className="text-center text-sm text-[var(--muted-fg)] mt-5">
            Já tem conta? <Link href="/login" className="text-[#818cf8] hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
