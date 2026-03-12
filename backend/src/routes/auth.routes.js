import express from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateToken, getCookieOptions, COOKIE_NAME } from '../middleware/auth.middleware.js';

// POST /auth/login
router.post('/login',
    [
        body('username').trim().notEmpty().withMessage((value, { req }) => req.t('AUTH.REQ_USERNAME')),
        body('password').notEmpty().withMessage((value, { req }) => req.t('AUTH.REQ_PASSWORD'))
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.error(errors.array()[0].msg, 400);
        }

        const { username, password } = req.body;
        const user = await User.findOne({ username, active: true });

        if (!user || !(await user.comparePassword(password))) {
            return res.error(req.t('ERRORS.INVALID_CREDENTIALS'), 401);
        }

        const token = generateToken({ userId: user._id, username: user.username, role: user.role });

        // Set token as httpOnly cookie — inaccessible to JavaScript
        res.cookie(COOKIE_NAME, token, getCookieOptions());

        res.success({
            username: user.username,
            role: user.role,
            printerId: user.printerId,
            printTemplate: user.printTemplate
        });
    }
);

// POST /auth/customer-session - Guest joining a table via Totem
router.post('/customer-session',
    [
        body('restaurantSlug').notEmpty().withMessage((value, { req }) => req.t('AUTH.REQ_SLUG')),
        body('totemId').notEmpty().withMessage((value, { req }) => req.t('AUTH.REQ_TOTEM')),
        body('name').trim().notEmpty().withMessage((value, { req }) => req.t('AUTH.REQ_GUEST'))
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.error(errors.array()[0].msg, 400);

        const { restaurantSlug, totemId, name } = req.body;

        // Create a temporary JWT for the customer
        const token = generateToken({
            userId: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            username: name,
            role: 'customer',
            restaurantSlug,
            totemId
        });

        res.cookie(COOKIE_NAME, token, getCookieOptions());
        res.success({ username: name, role: 'customer', restaurantSlug, totemId });
    }
);

// POST /auth/logout
router.post('/logout', (req, res) => {
    const options = { ...getCookieOptions() };
    delete options.maxAge; // Remove maxAge for clearing
    res.clearCookie(COOKIE_NAME, { path: options.path || '/' });
    res.success({ message: req.t('ERRORS.LOGGED_OUT') });
});

export default router;
