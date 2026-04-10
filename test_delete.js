const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.simuladoSubmission.findMany();
  console.log("Submissions:");
  console.dir(c);
}

main().catch(console.error).finally(() => prisma.$disconnect());
