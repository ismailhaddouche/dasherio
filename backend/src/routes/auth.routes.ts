import { Router } from 'express';
import { loginEmail, loginPin } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { LoginSchema, PinSchema } from '../schemas/auth.schema';
import { authLimiter } from '../middlewares/rateLimit';

const router = Router();

router.post('/login', authLimiter, validate(LoginSchema), loginEmail);
router.post('/pin', authLimiter, validate(PinSchema), loginPin);

export default router;
