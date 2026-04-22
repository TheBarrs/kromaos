"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, MessageSquare, Clock, ChevronDown } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

type Comment = { id: string; authorName: string; content: string; timestamp: number | null; createdAt: Date | string; resolved: boolean };
type Version = {
  id: string; versionNumber: number; fileUrl: string; mimeType: string;
  status: string; createdAt: Date | string;
  uploadedBy: { name: string; id?: string; avatar?: string | null } | null;
  comments: Comment[];
};
type Asset = { id: string; title: string; description: string | null; client: { name: string; id: string } | null; versions: Version[] };

const STATUS_CONFIG: Record<string, { label: string; variant: "muted" | "warning" | "success" | "danger" }> = {
  PENDING:           { label: "Aguardando",  variant: "warning" },
  APPROVED:          { label: "Aprovado",    variant: "success" },
  CHANGES_REQUESTED: { label: "Alterações",  variant: "danger" },
};

export function ApprovalReviewer({ asset }: { asset: Asset }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);

  const version = asset.versions[activeVersionIdx];
  if (!version) return <div className="p-6 text-[var(--muted-fg)]">Nenhuma versão disponível.</div>;

  const isVideo = version.mimeType.startsWith("video/");
  const status = STATUS_CONFIG[version.status] ?? { label: version.status, variant: "muted" as const };

  async function submitComment() {
    if (!comment.trim()) return;
    setSubmitting(true);
    const timestamp = isVideo && videoRef.current ? videoRef.current.currentTime : undefined;
    await fetch(`/api/approvals/${asset.id}/versions/${version.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment, timestamp }),
    });
    setComment("");
    setSubmitting(false);
    router.refresh();
  }

  async function setApprovalStatus(status: "APPROVED" | "CHANGES_REQUESTED") {
    setApproving(true);
    await fetch(`/api/approvals/${asset.id}/versions/${version.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setApproving(false);
    router.refresh();
  }

  function seekTo(ts: number | null) {
    if (ts !== null && videoRef.current) {
      videoRef.current.currentTime = ts;
      videoRef.current.pause();
    }
  }

  return (
    <div className="flex h-full">
      {/* Media viewer */}
      <div className="flex-1 flex flex-col bg-black overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4">
          {isVideo ? (
            <video ref={videoRef} src={version.fileUrl} controls className="max-h-full max-w-full rounded-lg" />
          ) : (
            <img src={version.fileUrl} alt={asset.title} className="max-h-full max-w-full rounded-lg object-contain" />
          )}
        </div>

        {/* Approval actions */}
        <div className="flex items-center justify-center gap-3 p-4 border-t border-[var(--border)] bg-[var(--surface-1)]">
          <Badge variant={status.variant} className="text-sm px-3 py-1">{status.label}</Badge>
          {version.status === "PENDING" && (
            <>
              <Button
                variant="success"
                size="sm"
                isLoading={approving}
                onClick={() => setApprovalStatus("APPROVED")}
              >
                <CheckCircle className="h-4 w-4" />Aprovar
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={approving}
                onClick={() => setApprovalStatus("CHANGES_REQUESTED")}
              >
                <XCircle className="h-4 w-4" />Solicitar Alterações
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 shrink-0 border-l border-[var(--border)] flex flex-col bg-[var(--surface-1)]">
        {/* Version selector */}
        <div className="p-4 border-b border-[var(--border)]">
          <p className="text-xs text-[var(--muted-fg)] mb-2">Versão</p>
          <div className="flex gap-2 flex-wrap">
            {asset.versions.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setActiveVersionIdx(i)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  i === activeVersionIdx
                    ? "border-[#6366f1] bg-[#6366f1]/10 text-[#818cf8]"
                    : "border-[var(--border)] text-[var(--muted-fg)] hover:border-[#6366f1]/50"
                }`}
              >
                v{v.versionNumber}
              </button>
            ))}
          </div>
          {version.uploadedBy && (
            <p className="text-[11px] text-[var(--muted-fg)] mt-2">
              Enviado por {version.uploadedBy.name} · {formatRelativeTime(version.createdAt)}
            </p>
          )}
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-xs font-medium text-[var(--muted-fg)] flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />Comentários ({version.comments.length})
          </p>

          {version.comments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg bg-[var(--surface-2)] p-3 cursor-pointer hover:bg-[var(--surface-3)] transition-colors"
              onClick={() => seekTo(c.timestamp)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold">{c.authorName}</p>
                {c.timestamp !== null && (
                  <span className="flex items-center gap-0.5 text-[10px] text-[#818cf8] shrink-0">
                    <Clock className="h-2.5 w-2.5" />
                    {Math.floor(c.timestamp / 60)}:{String(Math.floor(c.timestamp % 60)).padStart(2, "0")}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--foreground)] mt-1">{c.content}</p>
              <p className="text-[10px] text-[var(--muted-fg)] mt-1.5">{formatRelativeTime(c.createdAt)}</p>
            </div>
          ))}

          {version.comments.length === 0 && (
            <p className="text-xs text-[var(--muted-fg)] text-center py-4">Nenhum comentário ainda.</p>
          )}
        </div>

        {/* Comment input */}
        <div className="p-4 border-t border-[var(--border)]">
          {isVideo && (
            <p className="text-[10px] text-[var(--muted-fg)] mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />Pause o vídeo no momento desejado antes de comentar
            </p>
          )}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Adicionar comentário..."
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
          />
          <Button size="sm" className="w-full mt-2" isLoading={submitting} onClick={submitComment}>
            Comentar
          </Button>
        </div>
      </div>
    </div>
  );
}
