export const dynamic = "force-dynamic";

import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Plus, Users, CheckSquare, DollarSign } from "lucide-react";
import Link from "next/link";

async function getClients() {
  return prisma.client.findMany({
    include: { _count: { select: { tasks: true, transactions: true } } },
    orderBy: { name: "asc" },
  });
}

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Clientes" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-fg)]">{clients.length} clientes cadastrados</p>
          <Button size="sm" asChild>
            <Link href="/clients/new"><Plus className="h-4 w-4" />Novo Cliente</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:border-[#6366f1]/50 hover:shadow-lg hover:shadow-[#6366f1]/5 transition-all cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6366f1]/15 text-[#818cf8] font-semibold text-sm">
                    {client.logo ? (
                      <img src={client.logo} alt="" className="h-10 w-10 rounded-xl object-cover" />
                    ) : (
                      client.name[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium group-hover:text-[#818cf8] transition-colors">{client.name}</p>
                    {client.company && <p className="text-xs text-[var(--muted-fg)] mt-0.5">{client.company}</p>}
                    {client.email && <p className="text-xs text-[var(--muted-fg)]">{client.email}</p>}
                  </div>
                  <Badge variant={client.isActive ? "success" : "muted"} className="shrink-0 ml-auto">
                    {client.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-fg)]">
                    <CheckSquare className="h-3.5 w-3.5" />{client._count.tasks} tarefas
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-fg)]">
                    <DollarSign className="h-3.5 w-3.5" />{client._count.transactions} transações
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          {clients.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center h-48 gap-3 text-[var(--muted-fg)]">
              <Users className="h-8 w-8 opacity-40" />
              <p className="text-sm">Nenhum cliente cadastrado ainda.</p>
              <Button size="sm" asChild>
                <Link href="/clients/new"><Plus className="h-4 w-4" />Adicionar Cliente</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
