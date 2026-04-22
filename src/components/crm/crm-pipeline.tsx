"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, DollarSign, StickyNote, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, cn } from "@/lib/utils";
import type { DealWithRelations } from "@/types";

const STAGES = [
  { id: "LEAD",          label: "Lead",             color: "bg-slate-500",   prob: 10 },
  { id: "CONTACTED",     label: "Contatado",         color: "bg-blue-500",    prob: 20 },
  { id: "DIAGNOSIS",     label: "Diagnóstico",       color: "bg-indigo-500",  prob: 40 },
  { id: "PROPOSAL_SENT", label: "Proposta Enviada",  color: "bg-amber-500",   prob: 60 },
  { id: "NEGOTIATION",   label: "Negociação",        color: "bg-orange-500",  prob: 80 },
  { id: "WON",           label: "Ganho",             color: "bg-emerald-500", prob: 100 },
  { id: "LOST",          label: "Perdido",           color: "bg-red-500",     prob: 0 },
];

function NewDealDialog({ stage, onCreated }: { stage: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", value: "" });
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!form.name.trim()) return;
    setLoading(true);
    await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, stage, value: form.value ? parseFloat(form.value) : undefined }),
    });
    setLoading(false);
    setOpen(false);
    setForm({ name: "", value: "" });
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-[var(--muted-fg)] hover:text-[var(--foreground)] transition-colors mt-1 px-1">
          <Plus className="h-3.5 w-3.5" />Novo deal
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Deal</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Input label="Nome do Deal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Empresa ABC" autoFocus />
          <Input label="Valor estimado (R$)" type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0,00" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} isLoading={loading}>Criar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Props = { deals: DealWithRelations[] };

export function CrmPipeline({ deals }: Props) {
  const router = useRouter();

  async function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    if (!dealId) return;
    await fetch(`/api/crm/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    router.refresh();
  }

  const totalPipeline = deals
    .filter((d) => !["WON", "LOST"].includes(d.stage))
    .reduce((s, d) => s + Number(d.value ?? 0), 0);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Pipeline summary */}
      <div className="flex items-center gap-6 shrink-0">
        <div className="text-sm text-[var(--muted-fg)]">
          Total em negociação: <span className="font-semibold text-[var(--foreground)]">{formatCurrency(totalPipeline)}</span>
        </div>
        <div className="text-sm text-[var(--muted-fg)]">
          Deals ativos: <span className="font-semibold text-[var(--foreground)]">{deals.filter((d) => !["WON", "LOST"].includes(d.stage)).length}</span>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 flex-1 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageValue = stageDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);

          return (
            <div
              key={stage.id}
              className="flex flex-col gap-2 min-w-[230px] w-[230px] shrink-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center gap-2 px-1">
                <span className={cn("h-2 w-2 rounded-full", stage.color)} />
                <span className="text-xs font-medium">{stage.label}</span>
                <span className="ml-auto text-[10px] text-[var(--muted-fg)] bg-[var(--surface-2)] rounded-full px-2 py-0.5">
                  {stageDeals.length}
                </span>
              </div>

              {stageValue > 0 && (
                <p className="text-[10px] text-[var(--muted-fg)] px-1">{formatCurrency(stageValue)}</p>
              )}

              <div className="flex-1 overflow-y-auto space-y-2">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("dealId", deal.id)}
                    onClick={() => router.push(`/crm/${deal.id}`)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3.5 cursor-pointer hover:border-[#6366f1]/50 hover:shadow-md transition-all group"
                  >
                    <p className="text-xs font-medium group-hover:text-[#818cf8] transition-colors">
                      {deal.name}
                    </p>

                    {deal.value && (
                      <p className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1.5 font-semibold">
                        <DollarSign className="h-3 w-3" />{formatCurrency(Number(deal.value))}
                      </p>
                    )}

                    {deal.source && (
                      <p className="text-[10px] text-[var(--muted-fg)] mt-1">{deal.source}</p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-[10px] text-[var(--muted-fg)]">
                        {(deal._count?.notes ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5"><StickyNote className="h-3 w-3" />{deal._count!.notes}</span>
                        )}
                        {(deal._count?.followUps ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5"><Bell className="h-3 w-3" />{deal._count!.followUps}</span>
                        )}
                        <span className="font-medium text-[#818cf8]">{stage.prob}%</span>
                      </div>

                      {deal.owner && (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={deal.owner.avatar ?? undefined} />
                          <AvatarFallback className="text-[9px]">{deal.owner.name[0]}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!["WON", "LOST"].includes(stage.id) && (
                <NewDealDialog stage={stage.id} onCreated={() => router.refresh()} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
