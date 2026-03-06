import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({ statusCode: 400, message: "Missing project id" });

  try {
    await prisma.project.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    throw createError({
      statusCode: 404,
      message: "Project not found or already deleted",
    });
  }
});
