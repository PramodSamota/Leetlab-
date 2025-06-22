import { PrismaClient } from "../generated/prisma/index.js";
import { env } from "../utils/index.js";
const globalForPrisma = globalThis;

export const db = globalForPrisma.prisma || new PrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
