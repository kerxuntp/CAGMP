import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import LandingCustomisation from '../models/landingCustomisationdb.mjs';

const router = express.Router();

// Configure multer for background image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = 'uploads/landing/';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'landing-bg-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET current landing page settings
router.get('/', async (req, res) => {
  try {
    let settings = await LandingCustomisation.findOne();

    if (!settings) {
      settings = new LandingCustomisation();
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching landing customisation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST update landing page settings
router.post('/', upload.single('backgroundImage'), async (req, res) => {
  try {
    let settings = await LandingCustomisation.findOne();
    
    if (!settings) {
      settings = new LandingCustomisation();
    }
    
    // Update text fields
    const {
      backgroundType,
      backgroundColor,
      gradientColors,
      gradientDirection,
      welcomeMessage,
      description,
      titleColor,
      descriptionColor,
      showLogo,
      buttonGradient,
      buttonTextColor
    } = req.body;

    if (backgroundType) settings.backgroundType = backgroundType;
    if (backgroundColor) settings.backgroundColor = backgroundColor;
    if (gradientColors) {
      settings.gradientColors = typeof gradientColors === 'string' 
        ? JSON.parse(gradientColors) 
        : gradientColors;
    }
    if (gradientDirection) settings.gradientDirection = gradientDirection;
    if (welcomeMessage) settings.welcomeMessage = welcomeMessage;
    if (description) settings.description = description;
    if (titleColor) settings.titleColor = titleColor;
    if (descriptionColor) settings.descriptionColor = descriptionColor;
    if (typeof showLogo !== 'undefined') settings.showLogo = showLogo === 'true' || showLogo === true;
    if (buttonGradient) settings.buttonGradient = buttonGradient;
    if (buttonTextColor) settings.buttonTextColor = buttonTextColor;
    
    // Handle background image upload
    if (req.file) {
      // Delete old image if it's not the default
      if (settings.backgroundImage && 
          settings.backgroundImage !== '/images/changihome.jpg' &&
          fs.existsSync(settings.backgroundImage)) {
        fs.unlinkSync(settings.backgroundImage);
      }
      
      settings.backgroundImage = req.file.path;
      settings.backgroundType = 'image';
    }
    
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json({ 
      message: 'Landing page updated successfully',
      settings 
    });
  } catch (error) {
    console.error('Error updating landing customisation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE reset to defaults
router.delete('/reset', async (req, res) => {
  try {
    const settings = await LandingCustomisation.findOne();

    if (settings) {
      // Delete uploaded image if it exists
      if (settings.backgroundImage && 
          settings.backgroundImage !== '/images/changihome.jpg' &&
          fs.existsSync(settings.backgroundImage)) {
        fs.unlinkSync(settings.backgroundImage);
      }
      
      await settings.deleteOne();
    }
    
    // Create new default settings
    const defaultSettings = new LandingCustomisation();
    await defaultSettings.save();
    
    res.json({ 
      message: 'Landing page reset to defaults',
      settings: defaultSettings 
    });
  } catch (error) {
    console.error('Error resetting landing customisation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;