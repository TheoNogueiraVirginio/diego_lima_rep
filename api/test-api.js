import http from 'http';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const lessons = await prisma.videoLesson.findMany({ where: { module: 2 }, orderBy: [{ subjectOrder: 'asc' }, { lessonOrder: 'asc' }] });
    const subjects = {};
    lessons.forEach(l => {
        if (!subjects[l.subjectOrder]) subjects[l.subjectOrder] = l.subjectName;
    });
    console.log(Object.values(subjects));
}
main().catch(console.error).finally(() => prisma.$disconnect());
