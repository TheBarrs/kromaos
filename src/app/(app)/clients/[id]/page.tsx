export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { ClientDetail } from "@/components/clients/client-detail";

type Ctx = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Ctx) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, status: true, dueDate: true, priority: true } },
      transactions: { orderBy: { date: "desc" }, take: 10, include: { category: { select: { name: true, color: true } } } },
      subscriptions: { where: { isActive: true } },
      crmDeal: { select: { id: true, stage: true, value: true } },
    },
  });

  if (!client) notFound();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={client.name} />
      <div className="flex-1 overflow-hidden">
        <ClientDetail client={client} />
      </div>
    </div>
  );
}
