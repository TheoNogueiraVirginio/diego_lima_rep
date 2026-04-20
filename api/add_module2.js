import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    await prisma.videoLesson.create({
        data: {
            module: 2,
            subjectOrder: 2,
            subjectName: 'Módulo e Função Modular',
            lessonOrder: 0,
            title: 'Módulo e Função Modular',
            vimeoId: '',
            duration: 0
        }
    });
    console.log("Added!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
