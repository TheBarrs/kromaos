export const dynamic = "force-dynamic";

import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskListView } from "@/components/tasks/task-list";
import { TaskCalendar } from "@/components/tasks/task-calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, LayoutList, Kanban, CalendarDays } from "lucide-react";
import Link from "next/link";

async function getTasks() {
  return prisma.task.findMany({
    include: {
      client: { select: { id: true, name: true } },
      assignees: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });
}

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Tarefas" />
      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        <Tabs defaultValue="kanban" className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <TabsList>
              <TabsTrigger value="kanban">
                <Kanban className="h-3.5 w-3.5 mr-1.5" />Kanban
              </TabsTrigger>
              <TabsTrigger value="list">
                <LayoutList className="h-3.5 w-3.5 mr-1.5" />Lista
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />Calendário
              </TabsTrigger>
            </TabsList>
            <Button size="sm" asChild>
              <Link href="/tasks/new"><Plus className="h-4 w-4" />Nova Tarefa</Link>
            </Button>
          </div>

          <TabsContent value="kanban" className="flex-1 overflow-hidden mt-4">
            <TaskBoard tasks={tasks} />
          </TabsContent>
          <TabsContent value="list" className="flex-1 overflow-y-auto mt-4">
            <TaskListView tasks={tasks} />
          </TabsContent>
          <TabsContent value="calendar" className="flex-1 overflow-hidden mt-4">
            <TaskCalendar tasks={tasks} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
