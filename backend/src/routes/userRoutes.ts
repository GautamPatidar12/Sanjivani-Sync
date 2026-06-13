import { Router } from 'express';
import { toggleOnlineStatus } from '../controllers/userController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and status management
 */

/**
 * @swagger
 * /api/users/status:
 *   put:
 *     summary: Toggle helper/organization online status and update location/help types
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isOnline
 *             properties:
 *               isOnline:
 *                 type: boolean
 *                 description: Set true to go online and receive requests, false to go offline
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
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid inputs
 *       401:
 *         description: Access Denied
 *       500:
 *         description: Server error
 */
router.put('/status', authenticateToken, toggleOnlineStatus);

export default router;
