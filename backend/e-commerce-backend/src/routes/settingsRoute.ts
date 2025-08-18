import express, { Request, Response } from 'express';
import { requireAdminAuth } from '../middleware/auth';
import dataService from '../services/dataService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all currencies
router.get('/currencies', async (req: Request, res: Response) => {
  try {
    const currencies = await dataService.getCurrencies();
    return res.json(currencies);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

// Get base currency
router.get('/base-currency', async (req: Request, res: Response) => {
  try {
    const baseCurrency = await dataService.getBaseCurrency();
    return res.json({ baseCurrency });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get base currency' });
  }
});

// Get invoice settings
router.get('/invoice', async (req: Request, res: Response) => {
  try {
    const settings = await dataService.getInvoiceSettings();
    return res.json({ settings });
  } catch (error) {
    console.error('Error getting invoice settings:', error);
    return res.json({ 
      settings: {
        companyName: 'E-Shop',
        companyTagline: 'Your Trusted Online Store',
        companyEmail: 'contact@e-shop.com',
        companyWebsite: 'e-shop.com',
        companyAddress: '123 Business Street',
        companyCity: 'Tunis',
        companyCountry: 'Tunisia',
        paymentText: 'Payment to E-Shop',
        logoUrl: '',
        primaryColor: '#8B5CF6',
        secondaryColor: '#EC4899',
        accentColor: '#3B82F6'
      }
    });
  }
});

// Test endpoint to verify backend is working
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Settings API is working!', timestamp: new Date().toISOString() });
});

// Update invoice settings
router.put('/invoice', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    const updatedSettings = await dataService.updateInvoiceSettings(settings);
    return res.json({ settings: updatedSettings });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update invoice settings' });
  }
});

// Upload logo
router.post('/upload-logo', requireAdminAuth, upload.single('logo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
    }

    // Create absolute URL for frontend to access
    const logoUrl = `http://localhost:3001/uploads/logos/${req.file.filename}`;
    
    console.log('📸 Logo upload:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      logoUrl: logoUrl
    });
    
    // Update invoice settings with new logo URL
    await dataService.updateInvoiceSettings({ logoUrl });
    
    return res.json({ 
      logoUrl,
      message: 'Logo uploaded successfully' 
    });
  } catch (error) {
    console.error('❌ Logo upload error:', error);
    return res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Get logo file (public route - no auth required)
router.get('/logo/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const logoPath = path.join(__dirname, '../../uploads/logos', filename);
  
  console.log('🖼️ Logo request:', { filename, logoPath, exists: fs.existsSync(logoPath) });
  
  if (fs.existsSync(logoPath)) {
    res.sendFile(logoPath);
  } else {
    res.status(404).json({ error: 'Logo not found' });
  }
});

export default router;
