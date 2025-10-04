import express from 'express';
import { body, validationResult } from 'express-validator';
import { connectDB } from '../config/database.js';
import { User } from '../models/User.js';

const router = express.Router();

// Store user from Auth0
router.post('/store-user', [
  body('auth0Id').notEmpty().withMessage('Auth0 ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
], async (req, res) => {
  try {
    await connectDB();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { auth0Id, email, name, picture } = req.body;

    // Check if user already exists
    let user = await User.findOne({ auth0Id });
    
    if (user) {
      // Update existing user
      user.email = email;
      user.name = name || user.name;
      user.picture = picture || user.picture;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = new User({
        auth0Id,
        email,
        name,
        picture,
        lastLogin: new Date(),
      });
      await user.save();
    }

    res.status(200).json({
      message: 'User stored successfully',
      user: {
        id: user._id,
        auth0Id: user.auth0Id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('Error storing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile/:auth0Id', async (req, res) => {
  try {
    await connectDB();
    
    const { auth0Id } = req.params;
    const user = await User.findOne({ auth0Id }).select('-__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        auth0Id: user.auth0Id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/preferences/:auth0Id', [
  body('preferences').isObject().withMessage('Preferences must be an object'),
], async (req, res) => {
  try {
    await connectDB();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { auth0Id } = req.params;
    const { preferences } = req.body;

    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $set: { preferences } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'Preferences updated successfully',
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user account
router.delete('/account/:auth0Id', async (req, res) => {
  try {
    await connectDB();
    
    const { auth0Id } = req.params;
    const user = await User.findOneAndDelete({ auth0Id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;