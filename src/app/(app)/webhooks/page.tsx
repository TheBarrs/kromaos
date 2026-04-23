export const dynamic = "force-dynamic";

import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";
import { Webhook, CheckCircle, XCircle } from "lucide-react";
import { WebhookForm } from "@/components/webhooks/webhook-form";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("kroma-token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId ?? null;
}

async function getWebhooks(userId: string) {
  return prisma.webhook.findMany({
    where: { userId },
    include: {
      deliveries: { take: 1, orderBy: { createdAt: "desc" }, select: { success: true, createdAt: true } },
      _count: { select: { deliveries: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function WebhooksPage() {
  const userId = await getUserId();
  const webhooks = userId ? await getWebhooks(userId) : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Webhooks" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Integrações via Webhook</h2>
            <p className="text-sm text-[var(--muted-fg)] mt-0.5">Receba notificações em tempo real em qualquer endpoint HTTP</p>
          </div>
          <WebhookForm />
        </div>

        <div className="space-y-3">
          {webhooks.map((wh) => {
            const lastDelivery = wh.deliveries[0];
            return (
              <Card key={wh.id}>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                    <Webhook className="h-5 w-5 text-[#fb923c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{wh.name}</p>
                      <Badge variant={wh.isActive ? "success" : "muted"}>
                        {wh.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--muted-fg)] mt-0.5 truncate">{wh.url}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {wh.events.map((ev) => (
                        <Badge key={ev} variant="muted" className="text-[10px]">{ev}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1.5 text-xs">
                      {lastDelivery ? (
                        lastDelivery.success ? (
                          <><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">OK</span></>
                        ) : (
                          <><XCircle className="h-3.5 w-3.5 text-red-400" /><span className="text-red-400">Falhou</span></>
                        )
                      ) : (
                        <span className="text-[var(--muted-fg)]">Sem entregas</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--muted-fg)] mt-1">{wh._count.deliveries} entregas</p>
                    {lastDelivery && (
                      <p className="text-[10px] text-[var(--muted-fg)]">{formatRelativeTime(lastDelivery.createdAt)}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {webhooks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-[var(--muted-fg)] text-sm">
              Nenhum webhook configurado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
