import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CORRECT_ANSWERS = {
  'simulado1': [
    'A', 'D', 'E', 'A', 'C', 'C', 'D', 'C', 'E', 'B',
    'B', 'D', 'A', 'D', 'D', 'C', 'A', 'C', 'E', 'A',
    'B', 'D', 'A', 'B', 'E', 'B', 'C', 'E', 'D', 'B',
    'D', 'C', 'A', 'C', 'D', 'D', 'B', 'E', 'C', 'E',
    'C', 'B', 'E', 'E', 'A'
  ],
};

async function recalc() {
  const submissions = await prisma.simuladoSubmission.findMany({
    include: { responses: true }
  });
  
  let count = 0;
  for (const s of submissions) {
    if (!s.submittedAt) continue;
    const correct = CORRECT_ANSWERS[s.simuladoId] || [];
    let score = 0;
    
    for (const r of s.responses) {
      if (r.selectedOption === correct[r.questionIndex]) {
        score++;
      }
    }
    
    await prisma.simuladoSubmission.update({
      where: { id: s.id },
      data: {
        totalScore: score,
        percentage: (score / (correct.length || 45)) * 100
      }
    });

    for (const r of s.responses) {
      const isCorrect = r.selectedOption === correct[r.questionIndex];
      if (r.isCorrect !== isCorrect) {
          await prisma.simuladoResponse.update({
              where: { id: r.id },
              data: { isCorrect }
          })
      }
    }
    count++;
  }
  console.log('Recalculated ' + count + ' submissions.');
}
recalc().then(() => process.exit(0)).catch(e => console.error(e));
