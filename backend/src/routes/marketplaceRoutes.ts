import { Router } from 'express';
import { getCategories, getResourcesByCategory } from '../controllers/marketplaceController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Marketplace
 *   description: Browse and find emergency resources
 */

/**
 * @swagger
 * /api/marketplace/categories:
 *   get:
 *     summary: Get all resource categories with availability counts
 *     tags: [Marketplace]
 *     responses:
 *       200:
 *         description: List of categories with counts
 *       500:
 *         description: Server error
 */
router.get('/categories', getCategories);

/**
 * @swagger
 * /api/marketplace/{category}:
 *   get:
 *     summary: Get helpers and organizations offering a specific resource category
 *     tags: [Marketplace]
 *     parameters:
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: Category of resource (e.g., blood, food, transport, shelter)
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for geospatial sorting
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude for geospatial sorting
 *       - in: query
 *         name: radiusInKm
 *         schema:
 *           type: number
 *         description: Max distance in km (default 50)
 *     responses:
 *       200:
 *         description: List of matching users
 *       500:
 *         description: Server error
 */
router.get('/:category', getResourcesByCategory);

export default router;
