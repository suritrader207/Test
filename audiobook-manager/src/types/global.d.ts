import { PrismaClient } from '@prisma/client';

declare global {
  namespace NodeJS {
    interface Global {
      prisma: PrismaClient;
    }
  }
}

// This is a workaround for the global.prisma issue in Next.js development mode.
// It ensures that the PrismaClient is only instantiated once.
// Learn more: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-best-practices
