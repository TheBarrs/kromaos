"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const EVENTS = ["DEAL_WON", "TASK_APPROVED", "TASK_CREATED", "CLIENT_CREATED", "CARD_STAGE_CHANGED"];

export function WebhookForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", secret: "" });
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  function toggleEvent(ev: string) {
    setSelectedEvents((prev) => prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedEvents.length === 0) return;
    setLoading(true);
    await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, events: selectedEvents }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" />Novo Webhook</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Webhook</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Zapier Integration" />
          <Input label="URL de destino" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required placeholder="https://hooks.zapier.com/..." />
          <Input label="Segredo (opcional)" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="HMAC secret para validação" />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Eventos</label>
            <div className="grid grid-cols-1 gap-2">
              {EVENTS.map((ev) => (
                <label key={ev} className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(ev)}
                    onChange={() => toggleEvent(ev)}
                    className="rounded accent-[#f97316]"
                  />
                  <span className="text-[var(--foreground)]">{ev}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={loading} disabled={selectedEvents.length === 0}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
