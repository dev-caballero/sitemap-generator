import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({ statusCode: 400, message: "Missing project id" });

  const body = await readBody(event);
  const data = body.tree || { nodes: [], edges: [] };

  try {
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        data: data,
        title: body.title,
      },
    });

    return updatedProject;
  } catch (error) {
    throw createError({
      statusCode: 404,
      message: "Project not found to update",
    });
  }
});
