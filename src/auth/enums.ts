import { Role as PrismaRole } from '.prisma/client'

export type Role = PrismaRole // Re-exporting Prisma Role enum as our Role type
export const Role = PrismaRole // Re-exporting Prisma Role enum as our Role constant
