export const dynamic = "force-dynamic";

import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ApprovalReviewer } from "@/components/approval/approval-reviewer";

type Ctx = { params: Promise<{ id: string }> };

export default async function ApprovalDetailPage({ params }: Ctx) {
  const { id } = await params;

  const asset = await prisma.approvalAsset.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          uploadedBy: { select: { id: true, name: true, avatar: true } },
          comments: { orderBy: { timestamp: "asc" } },
        },
      },
    },
  });

  if (!asset) notFound();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={asset.title} />
      <div className="flex-1 overflow-hidden">
        <ApprovalReviewer asset={asset} />
      </div>
    </div>
  );
}
