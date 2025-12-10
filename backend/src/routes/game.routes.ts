import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { validate, gameMoveValidation } from '../middleware/validation.middleware';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// All game routes require at least optional auth
router.use(optionalAuth);

// Game management
router.post('/create', authenticate, GameController.createGame);
router.post('/join', authenticate, GameController.joinGame);
router.get('/find', authenticate, GameController.findGame);

// Game actions
router.get('/:gameId', GameController.getGameState);
router.post('/:gameId/move', validate(gameMoveValidation), GameController.makeMove);
router.get('/active/list', authenticate, GameController.getActiveGames);

export default router;