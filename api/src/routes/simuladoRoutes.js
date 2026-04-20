import express from 'express';
import { startSimulado, submitSimulado, getSimuladoResults, getSimuladoStatus, saveSimuladoProgress, getSimuladoRanking } from '../controllers/simuladoController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(requireAuth);

router.post('/:simuladoId/start', startSimulado);
router.post('/:simuladoId/submit', submitSimulado);
router.post('/:simuladoId/save-progress', saveSimuladoProgress);
router.get('/:simuladoId/status', getSimuladoStatus);
router.get('/:simuladoId/results', getSimuladoResults);
router.get('/:simuladoId/ranking', getSimuladoRanking);

export default router;
