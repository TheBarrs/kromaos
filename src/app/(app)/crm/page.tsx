export const dynamic = "force-dynamic";

import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { CrmPipeline } from "@/components/crm/crm-pipeline";

async function getDeals() {
  return prisma.crmDeal.findMany({
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, avatar: true } },
      _count: { select: { notes: true, followUps: true } },
    },
    orderBy: [{ stage: "asc" }, { position: "asc" }],
  });
}

export default async function CrmPage() {
  const deals = await getDeals();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="CRM — Pipeline de Vendas" />
      <div className="flex-1 overflow-hidden p-6">
        <CrmPipeline deals={deals} />
      </div>
    </div>
  );
}
