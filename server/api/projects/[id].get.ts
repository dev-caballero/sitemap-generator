import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({ statusCode: 400, message: "Missing project id" });

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    throw createError({ statusCode: 404, message: "Project not found" });
  }

  // To maintain compatibility with existing frontend expectations
  return {
    ...project,
    tree: project.data,
  };
});
