export const dynamic = "force-dynamic";

import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { PipelineKanban } from "@/components/pipeline/pipeline-kanban";

async function getCards() {
  return prisma.productionCard.findMany({
    include: {
      client: { select: { id: true, name: true } },
      assignees: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: [{ stage: "asc" }, { position: "asc" }],
  });
}

export default async function PipelinePage() {
  const cards = await getCards();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Pipeline de Produção" />
      <div className="flex-1 overflow-hidden p-6">
        <PipelineKanban cards={cards} />
      </div>
    </div>
  );
}
