import { Request, Response } from 'express';
import User from '../models/User';

/**
 * Get available resource categories and their availability counts
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = ['blood', 'shelter', 'food', 'transport', 'volunteer', 'medicine'];
    
    // We can aggregate to find how many users are offering each category
    const categoryCounts = await User.aggregate([
      { $match: { role: { $in: ['helper', 'organization'] } } },
      { $unwind: '$helpTypes' },
      { $group: { _id: '$helpTypes', count: { $sum: 1 } } }
    ]);

    const formattedCategories = categories.map(cat => {
      const found = categoryCounts.find(c => c._id === cat);
      return {
        category: cat,
        displayName: cat.charAt(0).toUpperCase() + cat.slice(1),
        count: found ? found.count : 0
      };
    });

    res.json(formattedCategories);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get helpers and organizations by category (with optional location sorting)
 */
export const getResourcesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const { lat, lng, radiusInKm } = req.query;

    const query: any = {
      role: { $in: ['helper', 'organization'] },
      helpTypes: category,
    };

    // If location is provided, we can sort or filter by distance
    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const maxDistance = radiusInKm ? parseFloat(radiusInKm as string) * 1000 : 50000; // Default 50km

      if (!isNaN(latitude) && !isNaN(longitude)) {
        query['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude] // MongoDB expects [lng, lat]
            },
            $maxDistance: maxDistance
          }
        };
      }
    }

    // Select fields to return
    const providers = await User.find(query).select('name email role orgType contactNumber location isOnline helpTypes');

    res.json(providers);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
