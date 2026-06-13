import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *               - contactNumber
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [helper, requester, organization]
 *               orgType:
 *                 type: string
 *                 enum: [hospital, blood_bank, hotel, vehicle_owner, none]
 *                 default: none
 *               contactNumber:
 *                 type: string
 *               location:
 *                 type: object
 *                 required:
 *                   - coordinates
 *                 properties:
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *                     description: '[longitude, latitude]'
 *               helpTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [blood, shelter, food, transport]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user (Smart Dummy Login)
 *     description: Authenticates with the provided email. If the user doesn't exist, it automatically creates a dummy account in the database using the provided helper/requester/org details.
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: If omitted, generates a dummy email based on role/orgType
 *               role:
 *                 type: string
 *                 enum: [helper, requester, organization]
 *                 default: helper
 *               orgType:
 *                 type: string
 *                 enum: [hospital, blood_bank, hotel, vehicle_owner, none]
 *                 default: none
 *               name:
 *                 type: string
 *                 description: Name of the dummy account (auto-generated if omitted)
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *                     description: '[longitude, latitude]'
 *               helpTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [blood, shelter, food, transport]
 *               contactNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully (dummy or real account)
 *       500:
 *         description: Server error
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Access Denied. No token provided.
 *       403:
 *         description: Invalid Token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *                     description: '[longitude, latitude]'
 *     responses:
 *       200:
 *         description: User profile updated
 *       401:
 *         description: Access Denied
 *       403:
 *         description: Invalid Token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   delete:
 *     summary: Delete user account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User removed
 *       401:
 *         description: Access Denied
 *       403:
 *         description: Invalid Token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/profile', authenticateToken, deleteAccount);

export default router;
