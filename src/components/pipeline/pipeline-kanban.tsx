"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Paperclip, MessageSquare, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate, cn } from "@/lib/utils";
import type { CardWithRelations } from "@/types";

const STAGES = [
  { id: "IDEA",            label: "Ideia",           color: "bg-slate-500" },
  { id: "PRE_PRODUCTION",  label: "Pré-produção",    color: "bg-indigo-500" },
  { id: "PRODUCTION",      label: "Produção",        color: "bg-blue-500" },
  { id: "EDITING",         label: "Edição",          color: "bg-cyan-500" },
  { id: "INTERNAL_REVIEW", label: "Revisão Interna", color: "bg-amber-500" },
  { id: "CLIENT_REVIEW",   label: "Revisão Cliente", color: "bg-orange-500" },
  { id: "APPROVED",        label: "Aprovado",        color: "bg-emerald-500" },
  { id: "SCHEDULED",       label: "Agendado",        color: "bg-purple-500" },
];

function NewCardDialog({ stage, onCreated }: { stage: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setLoading(true);
    await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, stage }),
    });
    setLoading(false);
    setTitle("");
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-[var(--muted-fg)] hover:text-[var(--foreground)] transition-colors mt-1 px-1">
          <Plus className="h-3.5 w-3.5" />Novo card
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Card</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Vídeo de produto" autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} isLoading={loading}>Criar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Props = { cards: CardWithRelations[] };

export function PipelineKanban({ cards: initialCards }: Props) {
  const router = useRouter();

  async function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("cardId");
    if (!cardId) return;
    await fetch(`/api/pipeline/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-2">
      {STAGES.map((stage) => {
        const stageCards = initialCards.filter((c) => c.stage === stage.id);
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
                {stageCards.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {stageCards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("cardId", card.id)}
                  onClick={() => router.push(`/pipeline/${card.id}`)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3.5 cursor-pointer hover:border-[#6366f1]/50 hover:shadow-md transition-all group"
                >
                  {card.coverImage && (
                    <img src={card.coverImage} alt="" className="w-full h-24 object-cover rounded-lg mb-3" />
                  )}

                  <p className="text-xs font-medium group-hover:text-[#818cf8] transition-colors leading-snug">
                    {card.title}
                  </p>

                  {card.client && (
                    <p className="text-[10px] text-[var(--muted-fg)] mt-1">{card.client.name}</p>
                  )}

                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {card.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="muted" className="text-[10px] px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-[10px] text-[var(--muted-fg)]">
                      {(card._count?.attachments ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5"><Paperclip className="h-2.5 w-2.5" />{card._count!.attachments}</span>
                      )}
                      {(card._count?.comments ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" />{card._count!.comments}</span>
                      )}
                      {card.dueDate && (
                        <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{formatDate(card.dueDate)}</span>
                      )}
                    </div>
                    <div className="flex -space-x-1">
                      {card.assignees.slice(0, 3).map((u) => (
                        <Avatar key={u.id} className="h-4 w-4 border border-[var(--surface-1)]">
                          <AvatarImage src={u.avatar ?? undefined} />
                          <AvatarFallback className="text-[8px]">{u.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <NewCardDialog stage={stage.id} onCreated={() => router.refresh()} />
          </div>
        );
      })}
    </div>
  );
}
