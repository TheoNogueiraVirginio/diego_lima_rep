import prisma from '../db.js';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

function normalizeSelectedOption(selectedOption) {
  if (typeof selectedOption === 'number') {
    return OPTION_LETTERS[selectedOption] ?? null;
  }
  if (typeof selectedOption === 'string') {
    return selectedOption;
  }
  return null;
}

// Tempo limite fixo por simulado (em minutos) - pode ser ajustado por simuladoId
const SIMULADO_TIME_LIMITS = {
  'simulado1': 210, // 3 horas e meia
  // Adicione outros simulados aqui
};

// Respostas corretas (hardcoded por enquanto) - para calcular score
const CORRECT_ANSWERS = {
  'simulado1': [
    'A', 'D', 'E', 'D', 'C', 'C', 'D', 'C', 'E', 'B',
    'E', 'D', 'A', 'D', 'D', 'C', 'A', 'B', 'E', 'A',
    'C', 'D', 'B', 'B', 'E', 'B', 'C', 'E', 'D', 'B',
    'D', 'C', 'A', 'C', 'D', 'D', 'B', 'E', 'C', 'E',
    'C', 'B', 'E', 'E', 'A'
  ],
};

export const startSimulado = async (req, res) => {
  try {
    const { simuladoId } = req.params;
    const studentName = req.enrollment.name;

    // Verificar se já submeteu
    const existing = await prisma.simuladoSubmission.findUnique({
      where: { studentName_simuladoId: { studentName, simuladoId } }
    });
    if (existing && existing.submittedAt) {
      return res.status(400).json({ error: 'Simulado já submetido' });
    }

    // Se já iniciou (tem startedAt), retornar dados
    if (existing) {
      return res.json({ submissionId: existing.id, startedAt: existing.startedAt, timeLimit: existing.timeLimit });
    }

    // Criar submissão inicial (sem submittedAt ainda)
    const timeLimit = SIMULADO_TIME_LIMITS[simuladoId] || 210;
    const submission = await prisma.simuladoSubmission.create({
      data: {
        studentName,
        simuladoId,
        timeLimit,
      }
    });

    res.json({ submissionId: submission.id, startedAt: submission.startedAt, timeLimit });
  } catch (error) {
    console.error('Erro ao iniciar simulado:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

export const submitSimulado = async (req, res) => {
  try {
    const { simuladoId } = req.params;
    const studentName = req.enrollment.name;
    const { responses, timeSpent } = req.body; // responses: array de {questionIndex, selectedOption, flagged}

    // Verificar se já submeteu
    const existing = await prisma.simuladoSubmission.findUnique({
      where: { studentName_simuladoId: { studentName, simuladoId } }
    });
    if (existing && existing.submittedAt) {
      return res.status(400).json({ error: 'Simulado já submetido' });
    }

    // Calcular score
    const correctAnswers = CORRECT_ANSWERS[simuladoId] || [];
    let score = 0;
    const responseData = responses.map(r => {
      const selectedOption = normalizeSelectedOption(r.selectedOption);
      const isCorrect = selectedOption === correctAnswers[r.questionIndex];
      if (isCorrect) score++;
      return {
        questionIndex: r.questionIndex,
        selectedOption,
        flagged: r.flagged,
        isCorrect,
        studentName,
      };
    });

    // Atualizar ou criar submissão
    const submission = await prisma.simuladoSubmission.upsert({
      where: { studentName_simuladoId: { studentName, simuladoId } },
      update: {
        submittedAt: new Date(),
        timeSpent,
        totalScore: score,
        percentage: (score / correctAnswers.length) * 100,
        responses: {
          deleteMany: {},
          create: responseData,
        },
      },
      create: {
        studentName,
        simuladoId,
        submittedAt: new Date(),
        timeLimit: SIMULADO_TIME_LIMITS[simuladoId] || 60,
        timeSpent,
        totalScore: score,
        percentage: (score / correctAnswers.length) * 100,
        responses: {
          create: responseData,
        },
      },
    });

    res.json({ score, percentage: submission.percentage });
  } catch (error) {
    console.error('Erro ao submeter simulado:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

export const getSimuladoStatus = async (req, res) => {
  try {
    const { simuladoId } = req.params;
    const studentName = req.enrollment.name;

    const submission = await prisma.simuladoSubmission.findUnique({
      where: { studentName_simuladoId: { studentName, simuladoId } }
    });

    if (!submission) {
      return res.json({ started: false });
    }

    if (submission.submittedAt) {
      const maxScore = CORRECT_ANSWERS[simuladoId]?.length || 45;
      return res.json({ submitted: true, score: submission.totalScore, maxScore });
    }

    res.json({ started: true, startedAt: submission.startedAt, timeLimit: submission.timeLimit });
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

export const saveSimuladoProgress = async (req, res) => {
  try {
    const { simuladoId } = req.params;
    const studentName = req.enrollment.name;
    const { responses, timeSpent } = req.body;

    // Atualizar submissão existente com progresso
    const submission = await prisma.simuladoSubmission.update({
      where: { studentName_simuladoId: { studentName, simuladoId } },
      data: {
        timeSpent,
        responses: {
          deleteMany: {}, // Limpar antigas
          create: responses.map(r => ({
            questionIndex: r.questionIndex,
            selectedOption: normalizeSelectedOption(r.selectedOption),
            flagged: r.flagged,
            studentName,
          })),
        },
      },
      include: { responses: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

export const getSimuladoResults = async (req, res) => {
  try {
    const { simuladoId } = req.params;
    const studentName = req.enrollment.name;

    const submission = await prisma.simuladoSubmission.findUnique({
      where: { studentName_simuladoId: { studentName, simuladoId } },
      include: { responses: true },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submissão não encontrada' });
    }

    const correctAnswers = CORRECT_ANSWERS[simuladoId] || [];
    const formattedResponses = submission.responses.map(r => ({
      ...r,
      correctOption: correctAnswers[r.questionIndex] || null
    }));

    res.json({ ...submission, responses: formattedResponses });
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};