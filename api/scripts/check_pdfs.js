import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const materials = await prisma.pdfMaterial.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(materials, null, 2));
}

main().finally(() => prisma.$disconnect());