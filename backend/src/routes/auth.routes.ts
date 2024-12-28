import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);

export default router;