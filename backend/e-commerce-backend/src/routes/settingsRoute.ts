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

// Toggle currency status
router.post('/currencies/:id/toggle', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currency = await dataService.toggleCurrencyStatus(id);
    return res.json({ message: 'Currency status updated', currency });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle currency status' });
  }
});

// Add new currency
router.post('/currencies', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { name, code, symbol, isActive, exchangeRate, isBase } = req.body;
    const currency = await dataService.addCurrency({ name, code, symbol, isActive, exchangeRate, isBase });
    return res.status(201).json({ message: 'Currency added successfully', currency });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add currency' });
  }
});

// Update currency
router.put('/currencies/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const currency = await dataService.updateCurrency(id, updateData);
    return res.json({ message: 'Currency updated successfully', currency });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update currency' });
  }
});

// Delete currency
router.delete('/currencies/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dataService.deleteCurrency(id);
    return res.json({ message: 'Currency deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete currency' });
  }
});

// Set currency as base currency
router.post('/currencies/:id/set-base', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currency = await dataService.setBaseCurrency(id);
    return res.json({ message: 'Base currency updated successfully', currency });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to set base currency' });
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

// Get tax setting
router.get('/tax', async (req: Request, res: Response) => {
  try {
    const tax = await dataService.getTax();
    return res.json({ tax });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get tax' });
  }
});

// Set tax setting
router.post('/tax', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { tax } = req.body;
    if (tax === undefined || isNaN(Number(tax))) {
      return res.status(400).json({ error: 'Invalid tax value' });
    }
    await dataService.setTax(String(tax));
    return res.json({ message: 'Tax updated', tax });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to set tax' });
  }
});

// Get all taxes
router.get('/taxes', async (req: Request, res: Response) => {
  try {
    const taxes = await dataService.getTaxes();
    return res.json({ taxes });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get taxes' });
  }
});

// Get active taxes
router.get('/active-taxes', async (req: Request, res: Response) => {
  try {
    const taxes = await dataService.getActiveTaxes();
    return res.json({ taxes });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get active taxes' });
  }
});

export default router;
