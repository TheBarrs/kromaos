import { prisma } from "./prisma";
import { dispatchWebhook } from "./webhooks";

export async function onDealWon(dealId: string) {
  const deal = await prisma.crmDeal.findUnique({
    where: { id: dealId },
    include: { owner: true },
  });
  if (!deal) return;

  // Create client from deal (if not already linked)
  let clientId = deal.clientId;
  if (!clientId) {
    const client = await prisma.client.create({
      data: { name: deal.name, isActive: true },
    });
    clientId = client.id;
    await prisma.crmDeal.update({ where: { id: dealId }, data: { clientId: client.id } });
  }

  // Create default onboarding tasks
  const defaultTasks = ["Briefing inicial", "Reunião de onboarding", "Setup de ferramentas"];
  for (const [i, title] of defaultTasks.entries()) {
    await prisma.task.create({
      data: {
        title,
        clientId,
        status: "BRIEFING",
        priority: "HIGH",
        position: i,
        ownerId: deal.ownerId,
        tags: ["onboarding"],
      },
    });
  }

  await dispatchWebhook("DEAL_WON", { dealId, clientId });
}

export async function onTaskApproved(taskId: string) {
  await dispatchWebhook("TASK_APPROVED", { taskId });
}
