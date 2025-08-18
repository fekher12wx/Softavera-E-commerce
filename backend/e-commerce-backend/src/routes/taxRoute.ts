import express, { Request, Response } from 'express';
import { authenticateToken, requireAdminAuth } from '../middleware/auth';
import dataService from '../services/dataService';

const router = express.Router();

// Get all taxes
router.get('/', async (req: Request, res: Response) => {
  try {
    const taxes = await dataService.getTaxes();
    return res.json(taxes);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch taxes' });
  }
});

// Get active taxes only
router.get('/active', async (req: Request, res: Response) => {
  try {
    const taxes = await dataService.getActiveTaxes();
    return res.json(taxes);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch active taxes' });
  }
});

// Get tax by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tax = await dataService.getTaxById(req.params.id);
    if (!tax) {
      return res.status(404).json({ error: 'Tax not found' });
    }
    return res.json(tax);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch tax' });
  }
});

// Check if tax can be deleted
router.get('/:id/check-delete', async (req: Request, res: Response) => {
  try {
    // Check if tax is being used by any products
    const productsUsingTax = await dataService.getProductsByTaxId(req.params.id);
    
    if (productsUsingTax && productsUsingTax.length > 0) {
      return res.json({
        canDelete: false,
        products: productsUsingTax.map(p => ({ id: p.id, name: p.name })),
        message: `Tax is being used by ${productsUsingTax.length} product(s)`
      });
    }
    
    return res.json({
      canDelete: true,
      message: 'Tax can be deleted safely'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check tax deletion' });
  }
});

// Create new tax
router.post('/', async (req: Request, res: Response) => {
  try {
    const { rate, isActive } = req.body;
    
    if (rate === undefined) {
      return res.status(400).json({ error: 'Rate is required' });
    }
    
    if (rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'Rate must be between 0 and 100' });
    }

    // Check if tax with this rate already exists
    const existingTax = await dataService.getTaxByRate(rate);
    if (existingTax) {
      return res.status(400).json({ error: `Tax with rate ${rate}% already exists` });
    }
    
    // Auto-generate name from rate
    const name = `${rate}%`;
    
    const tax = await dataService.createTax({
      name,
      rate: parseFloat(rate),
      isActive: isActive !== undefined ? isActive : true
    });
    
    return res.status(201).json(tax);
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Tax with this rate already exists' });
    } else {
      return res.status(500).json({ error: 'Failed to create tax' });
    }
  }
});

// Update tax
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { rate, isActive } = req.body;
    
    if (rate !== undefined && (rate < 0 || rate > 100)) {
      return res.status(400).json({ error: 'Rate must be between 0 and 100' });
    }

    // If rate is being changed, check for duplicates
    if (rate !== undefined) {
      const existingTax = await dataService.getTaxByRate(rate);
      if (existingTax && existingTax.id !== req.params.id) {
        return res.status(400).json({ error: `Tax with rate ${rate}% already exists` });
      }
    }
    
    const updateData: any = {};
    if (rate !== undefined) {
      updateData.rate = parseFloat(rate);
      updateData.name = `${rate}%`; // Auto-update name when rate changes
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const tax = await dataService.updateTax(req.params.id, updateData);
    
    if (!tax) {
      return res.status(404).json({ error: 'Tax not found' });
    }
    
    return res.json(tax);
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Tax with this rate already exists' });
    } else {
      return res.status(500).json({ error: 'Failed to update tax' });
    }
  }
});

// Delete tax
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Check if tax is being used by any products
    const productsUsingTax = await dataService.getProductsByTaxId(req.params.id);
    
    if (productsUsingTax && productsUsingTax.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete tax. It is being used by ${productsUsingTax.length} product(s). Please remove or change the tax from these products first.`,
        products: productsUsingTax.map(p => ({ id: p.id, name: p.name }))
      });
    }
    
    const deleted = await dataService.deleteTax(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Tax not found' });
    }
    
    return res.json({ message: 'Tax deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete tax' });
  }
});

export default router;
