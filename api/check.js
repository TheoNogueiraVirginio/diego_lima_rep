import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const lessons = await prisma.videoLesson.findMany({ where: { module: 2, lessonOrder: 0 } });
    console.log(lessons);
}
main().catch(console.error).finally(() => prisma.$disconnect());
