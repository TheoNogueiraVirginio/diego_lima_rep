
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEstatistica() {
  try {
    console.log('Searching for "Estatística"...');
    const lessons = await prisma.videoLesson.findMany({
      where: {
        OR: [
          { subjectName: { contains: 'Estatística' } },
          { title: { contains: 'Estatística' } }
        ]
      }
    });

    if (lessons.length === 0) {
      console.log('No lessons found for "Estatística".');
    } else {
      console.log(`Found ${lessons.length} lessons.`);
      lessons.forEach(l => {
        console.log(`Lesson: ${l.id}, Module: ${l.module}, Order: ${l.subjectOrder}, Name: ${l.subjectName}, Title: ${l.title}`);
      });

      // Take the first one found to find materials
      const firstLesson = lessons[0];
      const materials = await prisma.pdfMaterial.findMany({
        where: {
          module: firstLesson.module,
          subjectOrder: firstLesson.subjectOrder
        }
      });

      console.log('\nMaterials found:');
      materials.forEach(m => {
        console.log(`Material: ${m.id}, Category: ${m.category}, Modality: ${m.modality}, Filename: ${m.filename}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEstatistica();
