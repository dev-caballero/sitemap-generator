import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const title = body.title || "Untitled Project";
  const data = body.tree || { nodes: [], edges: [] };

  const project = await prisma.project.create({
    data: {
      title,
      data: data,
    },
  });

  return project;
});
