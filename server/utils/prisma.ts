import { PrismaClient } from "~~/prisma/generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Handle the missing URL property from v7 schema by passing connection directly via adapter
// For dev env we use the hardcoded URL matching your docker setup
const adapter = new PrismaPg({
  connectionString:
    "postgresql://root:rootpassword@localhost:5433/sitemap?schema=public",
});

const globalForPrisma = globalThis as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
