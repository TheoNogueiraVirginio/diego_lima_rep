import fs from 'fs';

const file = 'api/src/controllers/simuladoController.js';
let content = fs.readFileSync(file, 'utf8');

const newFunc = `export const getSimuladoRanking = async (req, res) => {
  try {
    const { simuladoId } = req.params;

    if (req.enrollment.status !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }

    const submissions = await prisma.simuladoSubmission.findMany({
      where: {
        simuladoId,
        submittedAt: { not: null }
      },
      select: {
        studentName: true,
        totalScore: true,
      },
      orderBy: [
        { totalScore: 'desc' },
        { submittedAt: 'asc' }
      ]
    });

    const enrollments = await prisma.enrollment.findMany({
      select: { name: true, classDay: true }
    });
    const enrollmentMap = {};
    enrollments.forEach(e => {
        if(e.name) enrollmentMap[e.name] = e.classDay || 'Sem Turma';
    });

    let ranking = [];
    let currentRank = 1;

    for (let i = 0; i < submissions.length; i++) {
      if (i > 0 && submissions[i].totalScore < submissions[i - 1].totalScore) {
        currentRank++;
      }
      ranking.push({
        position: currentRank,
        studentName: submissions[i].studentName,
        score: submissions[i].totalScore,
        classDay: enrollmentMap[submissions[i].studentName] || 'Sem Turma'
      });
    }

    res.json(ranking);
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};`;

content = content.replace(/export const getSimuladoRanking = async[\s\S]+?};\n/s, newFunc + '\n');
fs.writeFileSync(file, content);
