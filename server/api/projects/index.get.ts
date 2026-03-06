import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const projects = await prisma.project.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });

  return projects;
});
