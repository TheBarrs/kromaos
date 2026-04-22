"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Film, Image, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Client = { id: string; name: string };

export default function NewApprovalPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", clientId: "" });

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then((j) => setClients(j.data?.data ?? []));
  }, []);

  function handleFile(f: File) {
    setFile(f);
    setError("");
    const url = URL.createObjectURL(f);
    setPreview(url);
    if (!form.title) {
      setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, "") }));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Título é obrigatório."); return; }
    if (!file) { setError("Selecione um arquivo."); return; }

    setUploading(true);
    setError("");

    try {
      // 1. Upload file
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) { setError(uploadJson.error ?? "Erro no upload."); return; }
      const { url, mimeType } = uploadJson.data;

      // 2. Create approval asset
      const assetRes = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          clientId: form.clientId || undefined,
          fileUrl: url,
          mimeType,
        }),
      });
      const assetJson = await assetRes.json();
      if (!assetRes.ok) { setError(assetJson.error ?? "Erro ao criar ativo."); return; }

      router.push(`/approvals/${assetJson.data.id}`);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  const isVideo = file?.type.startsWith("video/");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Novo Ativo" />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/approvals"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>

        <Card>
          <CardHeader><CardTitle>Enviar para Aprovação</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors min-h-[200px]",
                  dragging ? "border-[#6366f1] bg-[#6366f1]/10" : "border-[var(--border)] hover:border-[#6366f1]/50 hover:bg-[var(--surface-2)]"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {preview ? (
                  <div className="relative w-full h-48">
                    {isVideo ? (
                      <video src={preview} className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <img src={preview} alt="preview" className="w-full h-full object-contain rounded-lg" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                      className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 mb-3 text-[var(--muted-fg)]">
                      <Film className="h-8 w-8" />
                      <Image className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-medium">Arraste ou clique para selecionar</p>
                    <p className="text-xs text-[var(--muted-fg)] mt-1">Vídeos e imagens · Máx 100 MB</p>
                  </>
                )}
              </div>

              {file && (
                <div className="flex items-center gap-2 text-xs text-[var(--muted-fg)] bg-[var(--surface-2)] rounded-lg px-3 py-2">
                  <Upload className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              )}

              <Input
                label="Título *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nome do ativo"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Contexto, instruções..."
                  rows={3}
                  className="flex w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#6366f1] resize-none"
                />
              </div>

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

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={uploading}>
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando..." : "Enviar para aprovação"}
                </Button>
                <Button type="button" variant="ghost" asChild>
                  <Link href="/approvals">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
