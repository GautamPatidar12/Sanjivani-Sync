import { Router } from 'express';
import {
  createHelpRequest,
  getHelpRequestsFeed,
  acceptHelpRequest,
  resolveHelpRequest,
  cancelHelpRequest,
  getMyRequests,
  getMyAssignments,
  getAllPendingHelpRequests,
} from '../controllers/helpRequestController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: HelpRequests
 *   description: Emergency help request management (Do Help & Get Help)
 */

/**
 * @swagger
 * /api/help-requests/all-pending:
 *   get:
 *     summary: Fetch all pending help requests (regardless of status/capabilities)
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending help requests
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/all-pending', authenticateToken, getAllPendingHelpRequests);

/**
 * @swagger
 * tags:
 *   name: HelpRequests
 *   description: Emergency help request management (Do Help & Get Help)
 */

/**
 * @swagger
 * /api/help-requests:
 *   post:
 *     summary: Create an emergency help request (Get Help)
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - helpType
 *               - description
 *               - location
 *             properties:
 *               helpType:
 *                 type: string
 *                 enum: [blood, shelter, food, transport]
 *               description:
 *                 type: string
 *                 description: Specific details (e.g., Blood group, quantity, number of people)
 *               urgency:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
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
 *     responses:
 *       201:
 *         description: Request created successfully
 *       400:
 *         description: Missing fields or invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, createHelpRequest);

/**
 * @swagger
 * /api/help-requests/feed:
 *   get:
 *     summary: Fetch pending requests for online helpers (Do Help)
 *     description: Returns a list of requests. If the logged-in user is offline, returns an empty array. If online, sorts pending requests by proximity to the helper.
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of help requests matching the helper's capabilities and location
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/feed', authenticateToken, getHelpRequestsFeed);

/**
 * @swagger
 * /api/help-requests/my-requests:
 *   get:
 *     summary: Get all emergency requests created by the logged-in user
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's requests
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-requests', authenticateToken, getMyRequests);

/**
 * @swagger
 * /api/help-requests/my-assignments:
 *   get:
 *     summary: Get all requests accepted/assigned to the logged-in helper
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignments
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-assignments', authenticateToken, getMyAssignments);

/**
 * @swagger
 * /api/help-requests/{id}/accept:
 *   put:
 *     summary: Accept a pending help request (Assign helper)
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The help request ID
 *     responses:
 *       200:
 *         description: Request accepted successfully
 *       400:
 *         description: Request is not pending or user trying to accept their own request
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.put('/:id/accept', authenticateToken, acceptHelpRequest);

/**
 * @swagger
 * /api/help-requests/{id}/resolve:
 *   put:
 *     summary: Mark a help request as resolved
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The help request ID
 *     responses:
 *       200:
 *         description: Request resolved
 *       403:
 *         description: Unauthorized to resolve
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.put('/:id/resolve', authenticateToken, resolveHelpRequest);

/**
 * @swagger
 * /api/help-requests/{id}/cancel:
 *   put:
 *     summary: Cancel a help request
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The help request ID
 *     responses:
 *       200:
 *         description: Request cancelled
 *       403:
 *         description: Unauthorized to cancel
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.put('/:id/cancel', authenticateToken, cancelHelpRequest);

export default router;
