import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { feedbackCreateSchema } from "./feedback.schema";

type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>;

const userSelect = {
  id: true,
  fullName: true,
  email: true,
} as const;

export function listFeedback() {
  return prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: userSelect } },
  });
}

export function createFeedback(data: FeedbackCreateInput, userId: string, role: string | null) {
  return prisma.feedback.create({
    data: { ...data, userId, role: role ?? undefined },
    include: { user: { select: userSelect } },
  });
}

export function deleteFeedback(id: string) {
  return prisma.feedback.delete({ where: { id } });
}
