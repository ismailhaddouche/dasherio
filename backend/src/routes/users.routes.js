import express from 'express';
const router = express.Router();
import { body, param, validationResult } from 'express-validator';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.error(errors.array()[0].msg, 400);
    }
    next();
};

// Middleware to ensure admin role
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.error(req.t('ERRORS.ACCESS_DENIED_ADMIN'), 403);
    }
    next();
};

// GET / - List all users
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    const users = await User.find().select('-password');
    res.success(users);
});

// GET /restaurant/:slug - Get users for a restaurant
router.get('/restaurant/:slug', verifyToken, requireAdmin, async (req, res) => {
    const users = await User.find({ restaurantSlug: req.params.slug }).select('-password');
    res.success(users);
});

// PATCH /me - Update own profile
router.patch('/me',
    verifyToken,
    [
        body('username').optional().trim().notEmpty().withMessage('Username cannot be empty'),
        body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ],
    validate,
    async (req, res) => {
        const user = await User.findById(req.user.userId);
        if (!user) return res.error(req.t('ERRORS.USER_NOT_FOUND'), 404);

        if (req.body.username) user.username = req.body.username;
        if (req.body.password) user.password = req.body.password;

        try {
            await user.save();
        } catch (error) {
            if (error.code === 11000) return res.error(req.t('ERRORS.USERNAME_IN_USE'), 400);
            throw error;
        }

        const result = user.toObject();
        delete result.password;
        res.success(result);
    }
);

// POST / - Create or update user
router.post('/',
    verifyToken,
    requireAdmin,
    [
        body('username').trim().notEmpty().withMessage((value, { req }) => req.t('AUTH.REQ_USERNAME')),
        body('role')
            .notEmpty().withMessage('Role is required')
            .isIn(['admin', 'kitchen', 'pos', 'customer', 'waiter']).withMessage('Invalid role'),
        body('password')
            .if(body('_id').not().exists())
            .notEmpty().withMessage('Password is required for new users')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ],
    validate,
    async (req, res) => {
        const { _id, ...data } = req.body;

        let user;
        if (_id) {
            user = await User.findById(_id);
            if (!user) return res.error(req.t('ERRORS.USER_NOT_FOUND'), 404);
            Object.assign(user, data);
            await user.save();
        } else {
            user = new User(data);
            await user.save();
        }
        const result = user.toObject();
        delete result.password;
        res.success(result);
    }
);

// DELETE /:id - Delete user
router.delete('/:id',
    verifyToken,
    requireAdmin,
    param('id').isMongoId().withMessage('Invalid user ID'),
    validate,
    async (req, res) => {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.error(req.t('ERRORS.USER_NOT_FOUND'), 404);
        res.success({ message: 'User deleted' });
    }
);

// PATCH /:id/print-settings - Update printer settings
router.patch('/:id/print-settings',
    verifyToken,
    requireAdmin,
    param('id').isMongoId().withMessage('Invalid user ID'),
    [
        body('printerId').optional().notEmpty().withMessage('printerId cannot be empty'),
        body('printTemplate').optional().isObject().withMessage('printTemplate must be an object')
    ],
    validate,
    async (req, res) => {
        const user = await User.findById(req.params.id);
        if (!user) return res.error(req.t('ERRORS.USER_NOT_FOUND'), 404);

        if (req.body.printerId) user.printerId = req.body.printerId;
        if (req.body.printTemplate) {
            user.printTemplate = { ...user.printTemplate.toObject(), ...req.body.printTemplate };
        }

        await user.save();
        res.success(user);
    }
);

// POST /:id/copy-print-settings/:sourceUserId
router.post('/:id/copy-print-settings/:sourceUserId',
    verifyToken,
    requireAdmin,
    [
        param('id').isMongoId().withMessage('Invalid target user ID'),
        param('sourceUserId').isMongoId().withMessage('Invalid source user ID')
    ],
    validate,
    async (req, res) => {
        const sourceUser = await User.findById(req.params.sourceUserId);
        if (!sourceUser) return res.error(req.t('ERRORS.SOURCE_USER_NOT_FOUND'), 404);

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.error(req.t('ERRORS.TARGET_USER_NOT_FOUND'), 404);

        targetUser.printerId = sourceUser.printerId;
        targetUser.printTemplate = sourceUser.printTemplate;

        await targetUser.save();
        res.success({ message: 'Print settings copied successfully', targetUser });
    }
);

export default router;
