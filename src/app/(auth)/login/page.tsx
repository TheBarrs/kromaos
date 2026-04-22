"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Erro ao entrar"); return; }
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
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.png" alt="Kroma" className="h-10 w-10 rounded-xl object-cover" />
          <span className="text-lg font-semibold tracking-tight">Kroma</span>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-7">
          <h1 className="text-xl font-semibold mb-1">Bem-vindo de volta</h1>
          <p className="text-sm text-[var(--muted-fg)] mb-6">Entre com sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" isLoading={loading}>
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--muted-fg)] mt-5">
            Não tem conta?{" "}
            <Link href="/register" className="text-[#818cf8] hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
