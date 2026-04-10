import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.simuladoSubmission.findMany();
  console.log("Submissions:");
  console.dir(subs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
