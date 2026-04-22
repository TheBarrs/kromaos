export const dynamic = "force-dynamic";

import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";
import { Eye, Film, Image, Plus } from "lucide-react";
import Link from "next/link";

async function getAssets() {
  return prisma.approvalAsset.findMany({
    include: {
      client: { select: { id: true, name: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: { id: true, versionNumber: true, status: true, mimeType: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

const STATUS_CONFIG: Record<string, { label: string; variant: "muted" | "warning" | "success" | "danger" }> = {
  PENDING:           { label: "Aguardando",         variant: "warning" },
  APPROVED:          { label: "Aprovado",            variant: "success" },
  CHANGES_REQUESTED: { label: "Alterações",          variant: "danger" },
};

export default async function ApprovalsPage() {
  const assets = await getAssets();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Aprovações" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex justify-end">
          <Button size="sm" asChild>
            <Link href="/approvals/new"><Plus className="h-4 w-4" />Novo Ativo</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assets.map((asset) => {
            const latest = asset.versions[0];
            const status = latest ? STATUS_CONFIG[latest.status] : { label: "Sem versão", variant: "muted" as const };
            const isVideo = latest?.mimeType.startsWith("video/");

            return (
              <Link key={asset.id} href={`/approvals/${asset.id}`}>
                <Card className="hover:border-[#6366f1]/50 hover:shadow-lg hover:shadow-[#6366f1]/5 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--muted-fg)] group-hover:text-[#818cf8] transition-colors">
                      {isVideo ? <Film className="h-4 w-4" /> : <Image className="h-4 w-4" />}
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <h3 className="font-medium text-sm group-hover:text-[#818cf8] transition-colors">{asset.title}</h3>
                  {asset.client && <p className="text-xs text-[var(--muted-fg)] mt-1">{asset.client.name}</p>}
                  {asset.description && <p className="text-xs text-[var(--muted-fg)] mt-1 line-clamp-2">{asset.description}</p>}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
                    <span className="text-[10px] text-[var(--muted-fg)]">
                      {latest ? `v${latest.versionNumber}` : "—"} · {formatRelativeTime(asset.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#818cf8]">
                      <Eye className="h-3.5 w-3.5" />Revisar
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}

          {assets.length === 0 && (
            <div className="col-span-full flex items-center justify-center h-48 text-[var(--muted-fg)] text-sm">
              Nenhum ativo para revisão.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
