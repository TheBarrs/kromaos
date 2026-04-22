export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { TaskDetail } from "@/components/tasks/task-detail";

type Ctx = { params: Promise<{ id: string }> };

async function getTask(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, avatar: true } },
      assignees: { select: { id: true, name: true, avatar: true } },
      comments: {
        include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      },
      statusHistory: { orderBy: { changedAt: "asc" } },
      subTasks: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
    },
  });
}

export default async function TaskDetailPage({ params }: Ctx) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={task.title} />
      <div className="flex-1 overflow-hidden">
        <TaskDetail task={task} />
      </div>
    </div>
  );
}
